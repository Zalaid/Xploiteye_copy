import whois
import dns.resolver
from typing import Dict, Any

class ReconScanner:
    """
    Primary Reconnaissance Module (The 'Eyes').
    Performs DNS resolution and Whois lookups to profile the target infrastructure.
    """
    
    def scan(self, domain: str) -> Dict[str, Any]:
        results = {
            "dns": {},
            "whois": {},
            "waf_detected": False
        }
        
        # 1. DNS Resolution
        try:
            # A Record (IP)
            a_records = dns.resolver.resolve(domain, 'A')
            results["dns"]["ip"] = [r.to_text() for r in a_records]
            
            # CNAME (WAF Detection hint)
            try:
                cname_records = dns.resolver.resolve(domain, 'CNAME')
                cnames = [r.to_text() for r in cname_records]
                results["dns"]["cname"] = cnames
                
                # Basic WAF Heuristic
                for cname in cnames:
                    if "cloudflare" in cname or "akamai" in cname or "incapsula" in cname:
                        results["waf_detected"] = True
                        results["waf_vendor"] = cname
            except dns.resolver.NoAnswer:
                pass
                
        except Exception as e:
            results["dns"]["error"] = str(e)
            
        # 2. Whois Lookup
        try:
            w = whois.whois(domain)
            results["whois"] = {
                "registrar": w.registrar,
                "creation_date": str(w.creation_date),
                "emails": w.emails
            }
        except Exception as e:
            results["whois"]["error"] = "Whois lookup failed or blocked"
            
        return results
