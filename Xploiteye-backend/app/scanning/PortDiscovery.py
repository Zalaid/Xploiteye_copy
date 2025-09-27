"""
PortDiscovery Service
Automated port scanning, version detection, and CVE lookup
"""

import nmap
import requests
import json
import asyncio
import os
import subprocess
import re
from typing import Dict, List, Any, Optional
from datetime import datetime
import openai
from dotenv import load_dotenv

load_dotenv()

class PortDiscovery:
    def __init__(self):
        self.nm = nmap.PortScanner()
        self.openai_client = openai.OpenAI(api_key=os.getenv("OPENAI_API_KEY"))
        self.cve_api_url = os.getenv("CVE_API_URL", "https://services.nvd.nist.gov/rest/json/cves/2.0")
        self.cve_search_url = os.getenv("CVE_SEARCH_URL", "https://cve.circl.lu/api/search")

    async def scan_port(self, target: str, port: int) -> Dict[str, Any]:
        """
        Scan specific port and get version information
        """
        try:
            print(f"[*] Starting port scan on {target}:{port}")

            # Perform nmap scan for specific port (fix argument parsing)
            scan_args = f"-sV -sC --version-intensity=9"
            self.nm.scan(target, str(port), arguments=scan_args)

            raw_data = {
                "target": target,
                "port": port,
                "timestamp": datetime.now().isoformat(),
                "scan_status": "completed",
                "results": {}
            }

            if target in self.nm.all_hosts():
                host_data = self.nm[target]

                if 'tcp' in host_data and port in host_data['tcp']:
                    port_info = host_data['tcp'][port]

                    service_name = port_info.get('name', 'unknown')
                    service_version = port_info.get('version', 'unknown')
                    service_product = port_info.get('product', '')
                    service_extrainfo = port_info.get('extrainfo', '')
                    port_state = port_info.get('state', 'closed')

                    raw_data["results"] = {
                        "port_state": port_state,
                        "service_name": service_name,
                        "service_version": service_version,
                        "service_product": service_product,
                        "service_extrainfo": service_extrainfo,
                        "port_info": port_info
                    }

                    if port_state == 'open':
                        print(f"[+] Port {port} is open - {service_name} {service_version}")

                        # Lookup CVEs for the service
                        cves = await self._lookup_cves(service_name, service_version, service_product)
                        raw_data["results"]["cves"] = cves

                    else:
                        print(f"[-] Port {port} is {port_state}")
                        raw_data["results"]["cves"] = []

                else:
                    print(f"[-] Port {port} not found in scan results")
                    raw_data["results"] = {
                        "port_state": "closed",
                        "service_name": "unknown",
                        "service_version": "unknown",
                        "cves": []
                    }
            else:
                print(f"[-] Target {target} not reachable")
                raw_data["scan_status"] = "failed"
                raw_data["results"] = {
                    "error": "Target not reachable",
                    "cves": []
                }

            # Get GPT analysis
            gpt_analysis = await self._get_gpt_analysis(raw_data)

            return {
                "raw_data": raw_data,
                "gpt_analysis": gpt_analysis
            }

        except Exception as e:
            print(f"[!] Error during port scan: {e}")
            return {
                "raw_data": {
                    "target": target,
                    "port": port,
                    "timestamp": datetime.now().isoformat(),
                    "scan_status": "failed",
                    "error": str(e)
                },
                "gpt_analysis": {
                    "status": "error",
                    "message": f"Port discovery failed: {str(e)}"
                }
            }

    async def _lookup_cves(self, service_name: str, service_version: str, service_product: str) -> List[Dict[str, Any]]:
        """
        Lookup CVEs for detected service using 1x command
        """
        cves = []

        try:
            # Construct search terms for 1x
            search_terms = []
            if service_product and service_product != 'unknown':
                search_terms.append(service_product)
            if service_name and service_name != 'unknown':
                search_terms.append(service_name)
            if service_version and service_version != 'unknown':
                search_terms.append(service_version)

            if not search_terms:
                return cves

            search_query = " ".join(search_terms)
            print(f"[*] Searching CVEs using vulnx for: {search_query}")

            # Use vulnx command for CVE lookup
            try:
                # Run vulnx search command with proper format
                cmd = ['/home/kali/go/bin/vulnx', 'search', '--json', '--limit', '10', search_query]
                result = subprocess.run(cmd, capture_output=True, text=True, timeout=30)

                if result.returncode == 0 and result.stdout:
                    # Parse vulnx JSON output
                    cves = self._parse_vulnx_json_output(result.stdout, search_query)
                    print(f"[+] Found {len(cves)} CVEs using vulnx")
                else:
                    print(f"[!] vulnx command failed: {result.stderr}")

            except subprocess.TimeoutExpired:
                print("[!] vulnx command timeout")
            except FileNotFoundError:
                print("[!] vulnx command not found, trying alternative method")
                # Fallback to direct CVE search
                cves = await self._fallback_cve_search(service_name, service_version, service_product)
            except Exception as e:
                print(f"[!] vulnx command error: {e}")
                # Fallback to direct CVE search
                cves = await self._fallback_cve_search(service_name, service_version, service_product)

        except Exception as e:
            print(f"[!] Error during CVE lookup: {e}")

        return cves

    def _parse_vulnx_json_output(self, output: str, search_query: str) -> List[Dict[str, Any]]:
        """
        Parse vulnx JSON output to extract CVE information
        """
        cves = []
        try:
            # Parse JSON response from vulnx
            import json
            data = json.loads(output)

            # vulnx returns data in different formats, handle common structures
            vulnerabilities = []

            if isinstance(data, dict):
                if 'vulnerabilities' in data:
                    vulnerabilities = data['vulnerabilities']
                elif 'data' in data:
                    vulnerabilities = data['data']
                elif 'results' in data:
                    vulnerabilities = data['results']
                else:
                    # Assume the whole dict is the vulnerability data
                    if 'id' in data or 'cve_id' in data:
                        vulnerabilities = [data]
            elif isinstance(data, list):
                vulnerabilities = data

            for vuln in vulnerabilities[:10]:  # Limit to 10 results
                if isinstance(vuln, dict):
                    cve_id = vuln.get('id') or vuln.get('cve_id') or vuln.get('CVE')
                    if cve_id:
                        cve_info = {
                            "cve_id": cve_id,
                            "summary": vuln.get('description') or vuln.get('summary') or f"Vulnerability in {search_query}",
                            "severity": self._extract_severity_from_vuln(vuln),
                            "cvss_score": self._extract_cvss_from_vuln(vuln),
                            "published": vuln.get('published') or vuln.get('published_date') or "Unknown",
                            "modified": vuln.get('modified') or vuln.get('last_modified_date') or "Unknown",
                            "source": "vulnx"
                        }
                        cves.append(cve_info)

        except json.JSONDecodeError as e:
            print(f"[!] Failed to parse vulnx JSON output: {e}")
            # Fallback to text parsing for non-JSON output
            cves = self._parse_1x_output(output, search_query)
        except Exception as e:
            print(f"[!] Error parsing vulnx JSON output: {e}")

        return cves[:10]  # Limit to top 10 results

    def _extract_severity_from_vuln(self, vuln: dict) -> str:
        """Extract severity from vulnerability data"""
        severity = vuln.get('severity') or vuln.get('impact') or vuln.get('risk_level')
        if severity:
            return str(severity).lower()

        # Try to get from CVSS score
        cvss = self._extract_cvss_from_vuln(vuln)
        if cvss:
            return self._cvss_to_severity(cvss)

        return "medium"

    def _extract_cvss_from_vuln(self, vuln: dict) -> Optional[float]:
        """Extract CVSS score from vulnerability data"""
        cvss_fields = ['cvss_score', 'cvss', 'base_score', 'score']
        for field in cvss_fields:
            if field in vuln and vuln[field]:
                try:
                    return float(vuln[field])
                except (ValueError, TypeError):
                    continue
        return None

    def _parse_1x_output(self, output: str, search_query: str) -> List[Dict[str, Any]]:
        """
        Parse 1x vulnx command output to extract CVE information
        """
        cves = []
        try:
            lines = output.split('\n')
            current_cve = None

            for line in lines:
                line = line.strip()

                # Look for CVE IDs
                cve_match = re.search(r'(CVE-\d{4}-\d{4,})', line, re.IGNORECASE)
                if cve_match:
                    if current_cve:
                        cves.append(current_cve)

                    current_cve = {
                        "cve_id": cve_match.group(1).upper(),
                        "summary": "",
                        "severity": "unknown",
                        "cvss_score": None,
                        "published": "Unknown",
                        "modified": "Unknown",
                        "source": "1x_vulnx"
                    }

                # Look for severity/CVSS scores
                if current_cve:
                    severity_match = re.search(r'(critical|high|medium|low)', line, re.IGNORECASE)
                    if severity_match:
                        current_cve["severity"] = severity_match.group(1).lower()

                    cvss_match = re.search(r'CVSS[:\s]*(\d+\.?\d*)', line)
                    if cvss_match:
                        current_cve["cvss_score"] = float(cvss_match.group(1))
                        current_cve["severity"] = self._cvss_to_severity(float(cvss_match.group(1)))

                    # Extract description/summary
                    if not current_cve["summary"] and len(line) > 20 and not cve_match:
                        current_cve["summary"] = line[:200]  # Limit description length

            # Add the last CVE
            if current_cve:
                cves.append(current_cve)

            # If no structured CVEs found, create generic ones from CVE IDs
            if not cves:
                cve_ids = re.findall(r'CVE-\d{4}-\d{4,}', output, re.IGNORECASE)
                for cve_id in set(cve_ids):  # Remove duplicates
                    cves.append({
                        "cve_id": cve_id.upper(),
                        "summary": f"Vulnerability found in {search_query}",
                        "severity": "medium",
                        "cvss_score": None,
                        "published": "Unknown",
                        "modified": "Unknown",
                        "source": "1x_vulnx"
                    })

        except Exception as e:
            print(f"[!] Error parsing 1x output: {e}")

        return cves[:10]  # Limit to top 10 results

    def _cvss_to_severity(self, cvss_score: float) -> str:
        """Convert CVSS score to severity level"""
        if cvss_score >= 9.0:
            return "critical"
        elif cvss_score >= 7.0:
            return "high"
        elif cvss_score >= 4.0:
            return "medium"
        else:
            return "low"

    async def _fallback_cve_search(self, service_name: str, service_version: str, service_product: str) -> List[Dict[str, Any]]:
        """
        Fallback CVE search when 1x is not available
        """
        cves = []
        try:
            search_query = " ".join([s for s in [service_product, service_name, service_version] if s and s != 'unknown'])

            response = requests.get(
                f"{self.cve_search_url}/{search_query}",
                timeout=10
            )
            if response.status_code == 200:
                cve_data = response.json()

                for cve in cve_data[:5]:
                    if isinstance(cve, dict) and 'id' in cve:
                        cve_info = {
                            "cve_id": cve['id'],
                            "summary": cve.get('summary', 'No summary available'),
                            "severity": self._parse_severity(cve),
                            "cvss_score": self._parse_cvss_score(cve),
                            "published": cve.get('Published', 'Unknown'),
                            "modified": cve.get('Modified', 'Unknown'),
                            "source": "cve.circl.lu"
                        }
                        cves.append(cve_info)
        except Exception as e:
            print(f"[!] Fallback CVE search error: {e}")

        return cves

    def _parse_severity(self, cve_data: Dict) -> str:
        """Parse severity from CVE data"""
        if 'cvss' in cve_data:
            cvss = cve_data['cvss']
            if isinstance(cvss, (int, float)):
                if cvss >= 9.0:
                    return "critical"
                elif cvss >= 7.0:
                    return "high"
                elif cvss >= 4.0:
                    return "medium"
                else:
                    return "low"
        return "unknown"

    def _parse_cvss_score(self, cve_data: Dict) -> Optional[float]:
        """Parse CVSS score from CVE data"""
        if 'cvss' in cve_data:
            cvss = cve_data['cvss']
            if isinstance(cvss, (int, float)):
                return float(cvss)
        return None

    async def _get_gpt_analysis(self, scan_data: Dict[str, Any]) -> Dict[str, Any]:
        """
        Get GPT analysis of the port scan results
        """
        try:
            # Prepare the prompt for GPT
            prompt = f"""
            Analyze the following port discovery scan results and provide a structured JSON response:

            Target: {scan_data['target']}
            Port: {scan_data['port']}
            Scan Status: {scan_data['scan_status']}
            Results: {json.dumps(scan_data['results'], indent=2)}

            Please provide a JSON response with the following structure:
            {{
                "port_status": "open/closed/filtered",
                "service_detected": "service name and version",
                "security_assessment": {{
                    "risk_level": "low/medium/high/critical",
                    "vulnerabilities_found": number_of_cves,
                    "exploitable": true/false,
                    "recommendations": ["recommendation1", "recommendation2"]
                }},
                "cve_summary": [
                    {{
                        "cve_id": "CVE-XXXX-XXXX",
                        "severity": "low/medium/high/critical",
                        "description": "Brief description",
                        "exploitable": true/false
                    }}
                ],
                "technical_details": {{
                    "port": port_number,
                    "protocol": "tcp/udp",
                    "service": "detailed service info",
                    "version": "version info"
                }},
                "next_steps": ["what to do next"]
            }}

            Focus on security implications and provide actionable recommendations.
            """

            response = self.openai_client.chat.completions.create(
                model="gpt-3.5-turbo",
                messages=[
                    {"role": "system", "content": "You are a cybersecurity expert analyzing network port scan results. Provide accurate, detailed security assessments in valid JSON format."},
                    {"role": "user", "content": prompt}
                ],
                temperature=0.3,
                max_tokens=2000
            )

            # Parse GPT response
            gpt_content = response.choices[0].message.content.strip()

            # Try to extract JSON from response
            if '```json' in gpt_content:
                gpt_content = gpt_content.split('```json')[1].split('```')[0].strip()
            elif '```' in gpt_content:
                gpt_content = gpt_content.split('```')[1].split('```')[0].strip()

            # Parse JSON
            analysis = json.loads(gpt_content)
            analysis["analysis_timestamp"] = datetime.now().isoformat()
            analysis["status"] = "success"

            return analysis

        except json.JSONDecodeError as e:
            print(f"[!] Failed to parse GPT JSON response: {e}")
            return {
                "status": "error",
                "message": "Failed to parse GPT analysis",
                "raw_response": gpt_content if 'gpt_content' in locals() else "No response"
            }
        except Exception as e:
            print(f"[!] Error getting GPT analysis: {e}")
            return {
                "status": "error",
                "message": f"GPT analysis failed: {str(e)}",
                "fallback_analysis": {
                    "port_status": scan_data["results"].get("port_state", "unknown"),
                    "service_detected": f"{scan_data['results'].get('service_name', 'unknown')} {scan_data['results'].get('service_version', 'unknown')}",
                    "vulnerabilities_found": len(scan_data["results"].get("cves", []))
                }
            }