import httpx
import json
from typing import Dict, List, Optional
import asyncio

class OnlineCVEFetcher:
    """
    Fetches CVE data from online sources (NVD API).
    Can supplement the local database with fresh CVE data.
    """
    
    def __init__(self):
        self.nvd_api_base = "https://services.nvd.nist.gov/rest/json/cves/2.0"
        
    async def fetch_cves_for_product(self, product: str, version: str) -> List[Dict]:
        """
        Fetch CVEs from NVD API for a specific product and version.
        Example: product='apache', version='2.4.10'
        """
        try:
            async with httpx.AsyncClient(timeout=30.0) as client:
                # NVD API query
                params = {
                    "keywordSearch": f"{product} {version}",
                    "resultsPerPage": 10
                }
                
                response = await client.get(self.nvd_api_base, params=params)
                
                if response.status_code == 200:
                    data = response.json()
                    cves = []
                    
                    for item in data.get("vulnerabilities", []):
                        cve = item.get("cve", {})
                        cve_id = cve.get("id", "")
                        
                        # Extract description
                        descriptions = cve.get("descriptions", [])
                        description = descriptions[0].get("value", "") if descriptions else ""
                        
                        # Extract CVSS score
                        metrics = cve.get("metrics", {})
                        cvss_v3 = metrics.get("cvssMetricV31", [])
                        severity = "Unknown"
                        if cvss_v3:
                            base_severity = cvss_v3[0].get("cvssData", {}).get("baseSeverity", "Unknown")
                            severity = base_severity
                        
                        cves.append({
                            "cve_id": cve_id,
                            "title": description[:100],  # First 100 chars
                            "severity": severity,
                            "description": description,
                            "source": "NVD"
                        })
                    
                    return cves
                else:
                    print(f"[-] NVD API returned status code: {response.status_code}")
                    return []
                    
        except Exception as e:
            print(f"[-] Failed to fetch from NVD: {e}")
            return []
    
    async def enrich_local_db(self, local_db_path: str, output_path: str):
        """
        Enriches the local database with online CVE data.
        """
        with open(local_db_path, "r") as f:
            local_db = json.load(f)
        
        enriched_db = local_db.copy()
        
        for software, versions in local_db.items():
            for version in versions.keys():
                print(f"[+] Fetching online CVEs for {software} {version}...")
                online_cves = await self.fetch_cves_for_product(software, version)
                
                if online_cves:
                    # Add online CVEs to local DB
                    for cve in online_cves:
                        # Check if CVE already exists
                        existing_cve_ids = [v["cve_id"] for v in enriched_db[software][version]]
                        if cve["cve_id"] not in existing_cve_ids:
                            enriched_db[software][version].append(cve)
                
                # Rate limit to avoid NVD API throttling
                await asyncio.sleep(2)
        
        # Save enriched database
        with open(output_path, "w") as f:
            json.dump(enriched_db, f, indent=2)
        
        print(f"[+] Enriched database saved to {output_path}")

# CLI usage
if __name__ == "__main__":
    fetcher = OnlineCVEFetcher()
    asyncio.run(fetcher.enrich_local_db(
        "app/database/local_cve_db.json",
        "app/database/enriched_cve_db.json"
    ))
