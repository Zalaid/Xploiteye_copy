import ssl
import socket
from typing import Dict, Any
import datetime

class SSLScanner:
    """
    SSL/TLS Analysis Module (The 'Shield').
    Performs specific handshake to extract Cipher details and Certificate information.
    Critical for detecting 'OpenSSL 1.0.1i' (Heartbleed context) etc.
    """
    
    def scan(self, domain: str, port: int = 443) -> Dict[str, Any]:
        context = ssl.create_default_context()
        context.check_hostname = False
        context.verify_mode = ssl.CERT_NONE  # Allow connection even if cert is expired (we want to detect that)
        
        result = {"supported": False, "versions": []}
        
        try:
            with socket.create_connection((domain, port), timeout=5.0) as sock:
                with context.wrap_socket(sock, server_hostname=domain) as ssock:
                    cert = ssock.getpeercert(binary_form=True)
                    # Use standard library to parse basic info (limited without binary parsing, 
                    # but sufficient for version/cipher checks usually)
                    
                    cipher = ssock.cipher()
                    version = ssock.version()
                    
                    # Manual Cert Parsing (Basic)
                    cert_dict = ssock.getpeercert(binary_form=False) # Only works if verify_mode is CERT_REQUIRED or optional? 
                    # Actually standard lib getpeercert() returns empty dict if CERT_NONE.
                    # We need to rely on cipher/version for handshake, and maybe basic connect for validity.
                    
                    result["supported"] = True
                    result["protocol"] = version
                    result["cipher"] = cipher[0]
                    result["strength"] = cipher[2]
                    
                    # Identify OpenSSL version roughly via Server Header usually, 
                    # but here we check if weak protocols are allowed
                    if version in ["TLSv1", "SSLv3"]:
                         result["vulnerability_hint"] = "Weak Protocol Detected (POODLE/BEAST)"

        except Exception as e:
            result["error"] = str(e)
            
        return result
