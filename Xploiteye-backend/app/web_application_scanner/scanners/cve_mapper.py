import json
import os
from typing import List, Dict
from packaging import version as ver_parser
from app.web_application_scanner.scanners.red_agent_logic import RedAgentFactory

class CVEMapper:
    """
    The Intelligence Layer.
    Maps detected technologies (e.g., 'Apache 2.4.10') to known vulnerabilities 
    using semantic versioning and prepares the Red Agent.
    """
    
    def __init__(self, db_path: str = "app/database/local_cve_db.json"):
        self.db_path = db_path
        self.db = self._load_db()

    def _load_db(self) -> Dict:
        if not os.path.exists(self.db_path):
            return {}
        with open(self.db_path, "r") as f:
            return json.load(f)

    async def map_to_cves(self, software: str, detected_version: str, target_url: str) -> List[Dict]:
        """
        Matches detected software and version against the CVE database using ranges.
        Also supplements with LIVE data from CIRCL API for maximum coverage.
        """
        software = software.lower()
        mapped_findings = []
        
        # 1. Local DB Match (Fast)
        if software in self.db:
            if "cve_list" in self.db[software]:
                for vuln in self.db[software]["cve_list"]:
                    if self._is_vulnerable(detected_version, vuln.get("affected_range", "")):
                        mapped_findings.append(self._format_finding(vuln, software, detected_version, target_url))
            
            if detected_version in self.db[software]:
                for vuln in self.db[software][detected_version]:
                    if not any(f["cve_id"] == vuln["cve_id"] for f in mapped_findings):
                        mapped_findings.append(self._format_finding(vuln, software, detected_version, target_url))
        
        # 2. Live API Match (Comprehensive)
        # This addresses the "so much high vulns" requirement by fetching real-time data
        try:
            from app.web_application_scanner.scanners.circl_cve_fetcher import CIRCLCVEFetcher, PRODUCT_MAPPING
            if software in PRODUCT_MAPPING:
                fetcher = CIRCLCVEFetcher()
                vendor, product = PRODUCT_MAPPING[software]
                live_cves = await fetcher.get_relevant_cves(vendor, product, detected_version)
                print(f"[+] Found {len(live_cves)} live CVEs for {software}")
                
                for vuln in live_cves:
                    # Avoid duplicates with local DB
                    if not any(f["cve_id"] == vuln["cve_id"] for f in mapped_findings):
                        mapped_findings.append(self._format_finding(vuln, software, detected_version, target_url))
        except Exception as e:
            print(f"[-] Live API fetching failed for {software}: {e}")
            
        # 3. Filter findings
        # Remove "No description available" findings as requested
        final_findings = [f for f in mapped_findings if f.get("description") != "No description available"]
            
        return final_findings

    def _is_vulnerable(self, detected: str, affected_range: str) -> bool:
        """
        Supports ranges like '<= 2.4.59' or '>= 5.0.0, < 5.2.0'
        """
        if not affected_range:
            return False
            
        try:
            detected_ver = ver_parser.parse(detected)
            constraints = affected_range.split(',')
            for constraint in constraints:
                constraint = constraint.strip()
                if constraint.startswith('<='):
                    if not (detected_ver <= ver_parser.parse(constraint[2:].strip())): return False
                elif constraint.startswith('<'):
                    if not (detected_ver < ver_parser.parse(constraint[1:].strip())): return False
                elif constraint.startswith('>='):
                    if not (detected_ver >= ver_parser.parse(constraint[2:].strip())): return False
                elif constraint.startswith('>'):
                    if not (detected_ver > ver_parser.parse(constraint[1:].strip())): return False
                elif constraint.startswith('=='):
                    if not (detected_ver == ver_parser.parse(constraint[2:].strip())): return False
                else:
                    if not (detected_ver == ver_parser.parse(constraint)): return False
            return True
        except:
            return False

    def _format_finding(self, vuln: Dict, software: str, version: str, target_url: str) -> Dict:
        red_agent_payload = RedAgentFactory.prepare_shell_payload(
            cve_id=vuln["cve_id"],
            target_url=target_url,
            detected_version=version
        )
        
        return {
            "category": "Vulnerability",
            "severity": vuln["severity"],
            "title": vuln["title"],
            "cve_id": vuln["cve_id"],
            "component": software,
            "detected_version": version,
            "description": vuln["description"],
            "red_agent_action": red_agent_payload
        }
