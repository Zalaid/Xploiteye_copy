import socket
import asyncio
from typing import List, Dict

class NetworkScanner:
    """
    Network Scanning Module (The 'Hands').
    Checks specific high-value ports to understand the attack surface.
    """
    
    def __init__(self):
        self.target_ports = [21, 22, 80, 443, 3306, 8080, 8443]
        
    async def check_port(self, ip: str, port: int) -> Dict:
        try:
            conn = asyncio.open_connection(ip, port)
            reader, writer = await asyncio.wait_for(conn, timeout=1.0)
            writer.close()
            await writer.wait_closed()
            return {"port": port, "state": "open", "service": socket.getservbyport(port)}
        except:
            return None

    async def scan(self, ip: str) -> List[Dict]:
        tasks = [self.check_port(ip, port) for port in self.target_ports]
        results = await asyncio.gather(*tasks)
        return [r for r in results if r is not None]
