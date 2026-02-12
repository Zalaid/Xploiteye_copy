import httpx
from bs4 import BeautifulSoup
import re
from typing import Dict, List

class TechDetector:
    """
    Enhanced Technology Detection Module.
    Uses Real HTTP headers, HTML parsing, and intelligent probing.
    """
    
    async def detect_technologies(self, url: str) -> Dict[str, str]:
        detected = {}
        
        try:
            async with httpx.AsyncClient(verify=False, timeout=10.0, follow_redirects=True) as client:
                # Main page request
                response = await client.get(url)
                
                # 1. Deep Server Header Analysis
                server_header = response.headers.get("Server", "")
                powered_by = response.headers.get("X-Powered-By", "")
                
                # Parse full server header: "Apache/2.4.10 (Debian) OpenSSL/1.0.1i mod_perl/2.0.8"
                if server_header:
                    detected.update(self._parse_server_header(server_header))
                
                # PHP Check (from X-Powered-By header)
                if "PHP" in powered_by:
                    match = re.search(r"PHP/([\d\.]+)", powered_by)
                    if match:
                        detected["php"] = match.group(1)
                elif "PHPSESSID" in response.cookies:
                    detected["php"] = "Detected (Version Hidden)"

                # 2. WordPress Detection (3 methods)
                wp_version = await self._detect_wordpress(client, url)
                if wp_version:
                    detected["wordpress"] = wp_version
                
                # 3. HTML Body Analysis
                soup = BeautifulSoup(response.text, "html.parser")
                
                # WordPress meta generator (backup method)
                if "wordpress" not in detected:
                    generator = soup.find("meta", attrs={"name": "generator"})
                    if generator and "WordPress" in generator.get("content", ""):
                        match = re.search(r"WordPress ([\d\.]+)", generator["content"])
                        if match:
                            detected["wordpress"] = match.group(1)
                
                # 4. JavaScript Library Detection (FIXED!)
                scripts = soup.find_all("script", src=True)
                
                # Collect all versions found
                jquery_versions = []
                jquery_ui_versions = []
                
                for script in scripts:
                    src = script["src"]
                    
                    # jQuery detection
                    if "jquery" in src.lower() and "jquery-ui" not in src.lower() and "jquery.ui" not in src.lower():
                        # URL parameter: ?ver=1.12.4
                        ver_match = re.search(r"[\?&]ver?=([\d\.]+)", src)
                        if ver_match:
                            jquery_versions.append(ver_match.group(1))
                        # Filename: jquery-1.12.4.min.js or /1.12.4/jquery.js
                        filename_match = re.search(r"jquery[/-](\d+\.\d+\.?\d*)", src, re.IGNORECASE)
                        if filename_match:
                            jquery_versions.append(filename_match.group(1))
                    
                    # jQuery UI detection
                    if "jquery-ui" in src.lower() or "jquery.ui" in src.lower():
                        ver_match = re.search(r"[\?&]ver?=([\d\.]+)", src)
                        if ver_match:
                            jquery_ui_versions.append(ver_match.group(1))
                        filename_match = re.search(r"jquery[-._ ]?ui[/-]?(\d+\.\d+\.?\d*)", src, re.IGNORECASE)
                        if filename_match:
                            jquery_ui_versions.append(filename_match.group(1))
                    
                    # Modernizr
                    if "modernizr" in src.lower():
                        match = re.search(r"modernizr[/-]?(\d+\.\d+\.?\d*)", src, re.IGNORECASE)
                        if match:
                            detected["modernizr"] = match.group(1)
                    
                    # Additional WordPress version check via scripts
                    if "wp-includes" in src and "wordpress" not in detected:
                        ver_match = re.search(r"ver=([\d\.]+)", src)
                        if ver_match:
                            # WordPress often appends its version to its internal scripts
                            detected["wordpress"] = ver_match.group(1)

                # Pick best jQuery version (prefer longer, more specific versions)
                if jquery_versions:
                    unique_versions = list(set(jquery_versions))
                    # Sort by number of dots and length - prefer 1.12.4 over 1.0
                    unique_versions.sort(key=lambda x: (x.count('.'), len(x)), reverse=True)
                    detected["jquery"] = unique_versions[0]
                
                # Pick best jQuery UI version
                if jquery_ui_versions:
                    unique_versions = list(set(jquery_ui_versions))
                    unique_versions.sort(key=lambda x: (x.count('.'), len(x)), reverse=True)
                    detected["jquery_ui"] = unique_versions[0]

        except Exception as e:
            print(f"[-] Tech Detection Failed: {e}")
            
        return detected
    
    def _parse_server_header(self, header: str) -> Dict[str, str]:
        """
        Parse complex server headers to extract all components.
        Example: "Apache/2.4.10 (Debian) OpenSSL/1.0.1i mod_perl/2.0.8 Perl/v5.18.2"
        """
        components = {}
        
        # Apache
        apache_match = re.search(r"Apache/([\d\.]+)", header)
        if apache_match:
            components["apache"] = apache_match.group(1)
        
        # OpenSSL
        openssl_match = re.search(r"OpenSSL/([\d\.\w]+)", header)
        if openssl_match:
            components["openssl"] = openssl_match.group(1)
        
        # mod_perl
        modperl_match = re.search(r"mod_perl/([\d\.]+)", header)
        if modperl_match:
            components["mod_perl"] = modperl_match.group(1)
        
        # Perl
        perl_match = re.search(r"Perl/v?([\d\.]+)", header)
        if perl_match:
            components["perl"] = perl_match.group(1)
        
        # mod_security
        modsec_match = re.search(r"mod_security/([\d\.]+)", header)
        if modsec_match:
            components["mod_security"] = modsec_match.group(1)
        
        # nginx
        nginx_match = re.search(r"nginx/([\d\.]+)", header)
        if nginx_match:
            components["nginx"] = nginx_match.group(1)
        
        return components
    
    async def _detect_wordpress(self, client: httpx.AsyncClient, base_url: str) -> str:
        """
        WordPress detection using multiple methods:
        1. Check /wp-login.php
        2. Check /readme.html
        3. Check WordPress REST API
        """
        # Method 1: wp-login.php
        try:
            login_response = await client.get(f"{base_url}/wp-login.php", timeout=5.0)
            if login_response.status_code == 200 and b"wordpress" in login_response.content.lower():
                # WordPress confirmed, try to get version from generator in login page
                soup = BeautifulSoup(login_response.text, "html.parser")
                generator = soup.find("meta", attrs={"name": "generator"})
                if generator:
                    match = re.search(r"WordPress ([\d\.]+)", generator.get("content", ""))
                    if match:
                        return match.group(1)
        except:
            pass
        
        # Method 2: readme.html
        try:
            readme_response = await client.get(f"{base_url}/readme.html", timeout=5.0)
            if readme_response.status_code == 200:
                # Look for version in readme
                match = re.search(r"Version ([\d\.]+)", readme_response.text)
                if match:
                    return match.group(1)
        except:
            pass
        
        # Method 3: REST API
        try:
            api_response = await client.get(f"{base_url}/wp-json/", timeout=5.0)
            if api_response.status_code == 200:
                data = api_response.json()
                # REST API might expose version
                return "Detected (REST API Active)"
        except:
            pass
        
        return None
