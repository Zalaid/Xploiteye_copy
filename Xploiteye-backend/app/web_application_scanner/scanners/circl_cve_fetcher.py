import httpx
import json
from typing import Dict, List, Optional
import asyncio
from packaging import version as version_parser

class CIRCLCVEFetcher:
    """
    Fetches CVE data from cve.circl.lu API.
    Updated to handle the new Search JSON structure.
    """
    
    def __init__(self):
        self.base_url = "https://cve.circl.lu/api"
        
    async def search_product_cves(self, vendor: str, product: str) -> List[Dict]:
        """
        Search all CVEs for a vendor/product combination.
        """
        try:
            async with httpx.AsyncClient(timeout=30.0) as client:
                url = f"{self.base_url}/search/{vendor}/{product}"
                response = await client.get(url)
                
                if response.status_code == 200:
                    data = response.json()
                    cve_results = []
                    
                    if isinstance(data, dict) and "results" in data:
                        # Collect from multiple sources in the results
                        for source in ["nvd", "fkie_nvd", "cvelistv5"]:
                            items = data["results"].get(source, [])
                            for item in items:
                                if isinstance(item, list) and len(item) >= 2:
                                    cve_results.append(item[1])
                    return cve_results
                else:
                    return []
        except Exception as e:
            print(f"[-] CIRCL API error: {e}")
            return []
    
    def is_version_affected(self, detected_version: str, cve_data: Dict) -> bool:
        """
        Check if the detected version is affected by this CVE.
        Handles CVE Record 5.x structure.
        """
        try:
            # Check containers -> cna -> affected
            containers = cve_data.get("containers", {})
            cna = containers.get("cna", {})
            affected = cna.get("affected", [])
            
            if not affected:
                return True # Conservative
                
            for entry in affected:
                versions = entry.get("versions", [])
                for v in versions:
                    v_str = v.get("version", "0")
                    less_than = v.get("lessThan", "")
                    
                    try:
                        det_v = version_parser.parse(detected_version)
                        
                        if less_than:
                            if det_v < version_parser.parse(less_than):
                                return True
                        
                        if v_str != "0" and det_v == version_parser.parse(v_str):
                            return True
                    except:
                        pass
            
            # Additional check for older structure (vulnerable_configuration)
            v_configs = cve_data.get("vulnerable_configuration", [])
            for config in v_configs:
                if isinstance(config, str) and detected_version in config:
                    return True
                    
            return False # if we checked everything and no match
            
        except Exception:
            return True # Conservative fallback
    
    async def get_relevant_cves(self, vendor: str, product: str, detected_version: str) -> List[Dict]:
        """
        Get CVEs relevant to a specific version.
        """
        all_cves_data = await self.search_product_cves(vendor, product)
        relevant = []
        
        # Deduplicate by CVE ID
        seen_ids = set()
        
        for cve_data in all_cves_data:
            cve_id = ""
            # Extract CVE ID
            if "cveMetadata" in cve_data:
                cve_id = cve_data["cveMetadata"].get("cveId", "")
            elif "id" in cve_data:
                cve_id = cve_data["id"]
                
            if not cve_id or cve_id in seen_ids:
                continue
                
            if self.is_version_affected(detected_version, cve_data):
                seen_ids.add(cve_id)
                
                # Extract summary/description
                summary = "No description available"
                containers = cve_data.get("containers", {})
                cna = containers.get("cna", {})
                
                # Try CNA descriptions first
                descriptions = cna.get("descriptions", [])
                if descriptions:
                    for desc in descriptions:
                        if desc.get("lang") == "en":
                            summary = desc.get("value", summary)
                            break
                    if summary == "No description available" and descriptions:
                        summary = descriptions[0].get("value", summary)
                
                # Fallback to other sources
                if summary == "No description available":
                    if "summary" in cve_data:
                        summary = cve_data["summary"]
                    elif "description" in cve_data:
                        summary = cve_data["description"]
                    elif "containers" in cve_data and "advisory" in cve_data["containers"]:
                        # Deep nested fallback
                        summary = str(cve_data["containers"]["advisory"])
                
                # Final check (Don't let it be boring)
                if not summary or summary == "No description available":
                    summary = f"Security vulnerability identified in {product}. Please refer to {cve_id} for technical details and mitigation steps."
                
                # Extract Title
                title = cna.get("title", "")
                if not title:
                    # Use first sentence of summary as title
                    title = summary.split(".")[0][:100]
                if not title or title == "No description available":
                    title = f"Vulnerability {cve_id}"
                
                # Extract CVSS/Severity
                cvss = 0
                metrics = cna.get("metrics", [])
                for m in metrics:
                    if "cvssV3_1" in m:
                        cvss = m["cvssV3_1"].get("baseScore", cvss)
                    elif "cvssV3_0" in m:
                        cvss = m["cvssV3_0"].get("baseScore", cvss)
                
                if cvss == 0 and "cvss" in cve_data:
                    cvss = cve_data["cvss"]

                if cvss >= 9.0: severity = "Critical"
                elif cvss >= 7.0: severity = "High"
                elif cvss >= 4.0: severity = "Medium"
                else: severity = "Low"
                
                relevant.append({
                    "cve_id": cve_id,
                    "title": summary[:100],
                    "severity": severity,
                    "description": summary,
                    "cvss_score": cvss,
                    "source": "CIRCL"
                })
                
            if len(relevant) >= 50: # Cap at 50
                break
                
        return relevant

PRODUCT_MAPPING = {
    "apache": ("apache", "http_server"),
    "php": ("php", "php"),
    "wordpress": ("wordpress", "wordpress"),
    "jquery": ("jquery", "jquery"),
    "jquery_ui": ("jquery", "jquery_ui"),
    "openssl": ("openssl", "openssl"),
    "nginx": ("nginx", "nginx"),
    "mysql": ("mysql", "mysql"),
    "mariadb": ("mariadb", "mariadb"),
    "modernizr": ("modernizr", "modernizr"),
    "perl": ("perl", "perl"),
    "mod_perl": ("perl", "mod_perl"),
    "mod_security": ("modsecurity", "modsecurity"),
}
