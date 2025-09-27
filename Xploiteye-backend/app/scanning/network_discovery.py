"""
NetworkDiscovery Service
Automated network device discovery with IP and MAC address detection
"""

import subprocess
import re
import asyncio
import json
import os
import socket
from typing import Dict, List, Any, Optional
from datetime import datetime
import openai
from dotenv import load_dotenv
import ipaddress
import concurrent.futures

load_dotenv()

class NetworkDiscovery:
    def __init__(self):
        self.openai_client = openai.OpenAI(api_key=os.getenv("OPENAI_API_KEY"))
        self.max_concurrent = int(os.getenv("MAX_CONCURRENT_SCANS", "100"))  # Increased for speed
        self.timeout = int(os.getenv("DEFAULT_NETWORK_TIMEOUT", "2"))  # Reduced timeout for speed

    async def discover_network(self, network_range: Optional[str] = None) -> Dict[str, Any]:
        """
        Discover devices on the network using multiple techniques
        """
        try:
            print("[*] Starting network discovery...")

            # Auto-detect network range if not provided
            if not network_range:
                network_range = await self._get_default_network_range()
                print(f"[*] Auto-detected network range: {network_range}")
            else:
                # If user provided just an IP, convert to /24 network
                if "/" not in network_range:
                    # Convert single IP to /24 network
                    ip_parts = network_range.split('.')
                    if len(ip_parts) == 4:
                        network_base = '.'.join(ip_parts[:3]) + '.0/24'
                        network_range = network_base
                        print(f"[*] Converted to network range: {network_range}")

            raw_data = {
                "network_range": network_range,
                "timestamp": datetime.now().isoformat(),
                "scan_status": "completed",
                "devices": [],
                "summary": {
                    "total_devices": 0,
                    "online_devices": 0,
                    "discovery_methods": []
                }
            }

            # Run all discovery methods in parallel for speed
            print("[*] Running parallel network discovery...")

            # Execute all discovery methods concurrently
            discovery_tasks = [
                self._fast_arp_discovery(network_range),
                self._fast_ping_sweep(network_range),
                self._get_arp_table()
            ]

            results = await asyncio.gather(*discovery_tasks, return_exceptions=True)

            arp_devices = results[0] if not isinstance(results[0], Exception) else []
            ping_devices = results[1] if not isinstance(results[1], Exception) else []
            arp_table_devices = results[2] if not isinstance(results[2], Exception) else []

            raw_data["summary"]["discovery_methods"] = ["fast_arp", "fast_ping", "arp_table"]

            # Merge all discovered devices
            all_devices = self._merge_device_data(arp_devices, ping_devices, arp_table_devices)
            raw_data["devices"] = all_devices
            raw_data["summary"]["total_devices"] = len(all_devices)
            raw_data["summary"]["online_devices"] = len([d for d in all_devices if d.get("status") == "online"])

            print(f"[+] Discovered {len(all_devices)} devices")

            # Get GPT analysis
            gpt_analysis = await self._get_gpt_analysis(raw_data)

            return {
                "raw_data": raw_data,
                "gpt_analysis": gpt_analysis
            }

        except Exception as e:
            print(f"[!] Error during network discovery: {e}")
            return {
                "raw_data": {
                    "network_range": network_range or "unknown",
                    "timestamp": datetime.now().isoformat(),
                    "scan_status": "failed",
                    "error": str(e)
                },
                "gpt_analysis": {
                    "status": "error",
                    "message": f"Network discovery failed: {str(e)}"
                }
            }

    async def _get_default_network_range(self) -> str:
        """
        Auto-detect the local network range
        """
        try:
            # Get default gateway
            result = subprocess.run(['ip', 'route', 'show', 'default'],
                                  capture_output=True, text=True, timeout=10)

            if result.returncode == 0:
                # Extract default gateway IP
                for line in result.stdout.split('\n'):
                    if 'default via' in line:
                        gateway_ip = line.split('via')[1].split()[0]

                        # Determine network range (assume /24)
                        network = ipaddress.IPv4Network(f"{gateway_ip}/24", strict=False)
                        return str(network)

            # Fallback: try to get from interface
            result = subprocess.run(['hostname', '-I'], capture_output=True, text=True, timeout=10)
            if result.returncode == 0:
                local_ip = result.stdout.strip().split()[0]
                network = ipaddress.IPv4Network(f"{local_ip}/24", strict=False)
                return str(network)

        except Exception as e:
            print(f"[!] Error auto-detecting network: {e}")

        # Default fallback
        return "192.168.1.0/24"

    async def _fast_arp_discovery(self, network_range: str) -> List[Dict[str, Any]]:
        """
        Fast ARP discovery using optimized nmap
        """
        devices = []
        try:
            print(f"[*] Running nmap ARP discovery on {network_range}")

            # Use comprehensive nmap settings to find all devices
            cmd = ['nmap', '-sn', network_range, '--max-hostgroup', '100', '--min-rate', '300']

            result = await asyncio.create_subprocess_exec(
                *cmd,
                stdout=asyncio.subprocess.PIPE,
                stderr=asyncio.subprocess.PIPE
            )

            stdout, stderr = await asyncio.wait_for(result.communicate(), timeout=20)

            if result.returncode == 0:
                output = stdout.decode()
                print(f"[DEBUG] Nmap output:\n{output}")
                lines = output.split('\n')
                current_ip = None
                current_mac = None

                for line in lines:
                    # Look for IP addresses (multiple formats)
                    ip_match = re.search(r'Nmap scan report for (\d+\.\d+\.\d+\.\d+)', line)
                    if not ip_match:
                        ip_match = re.search(r'Host (\d+\.\d+\.\d+\.\d+) is up', line)

                    if ip_match:
                        # Save previous device if exists
                        if current_ip:
                            devices.append({
                                "ip": current_ip,
                                "mac": current_mac,
                                "status": "online",
                                "discovery_method": "nmap_arp",
                                "hostname": None
                            })
                        current_ip = ip_match.group(1)
                        current_mac = None

                    # Look for MAC addresses
                    mac_match = re.search(r'MAC Address: ([0-9A-Fa-f:]{17})', line)
                    if mac_match and current_ip:
                        current_mac = mac_match.group(1)

                # Add the last device
                if current_ip:
                    devices.append({
                        "ip": current_ip,
                        "mac": current_mac,
                        "status": "online",
                        "discovery_method": "nmap_arp",
                        "hostname": None
                    })

            else:
                print(f"[!] Nmap error: {stderr.decode()}")

        except asyncio.TimeoutError:
            print("[!] Fast ARP discovery timeout")
        except Exception as e:
            print(f"[!] Fast ARP discovery error: {e}")

        print(f"[+] ARP discovery found {len(devices)} devices")
        return devices

    async def _fast_ping_sweep(self, network_range: str) -> List[Dict[str, Any]]:
        """
        Ultra-fast ping sweep using fping or nmap
        """
        devices = []
        try:
            print(f"[*] Running ping sweep on {network_range}")
            network = ipaddress.IPv4Network(network_range, strict=False)

            # Create list of IPs to ping
            ip_list = [str(ip) for ip in network.hosts()]

            # Try fping first (fastest)
            try:
                cmd = ['fping', '-a', '-q', '-r', '1', '-t', '1000'] + ip_list

                result = await asyncio.create_subprocess_exec(
                    *cmd,
                    stdout=asyncio.subprocess.PIPE,
                    stderr=asyncio.subprocess.PIPE
                )

                stdout, stderr = await asyncio.wait_for(result.communicate(), timeout=15)

                if stdout:
                    online_ips = stdout.decode().strip().split('\n')
                    for ip in online_ips:
                        if ip.strip() and ip.strip() != '':
                            devices.append({
                                "ip": ip.strip(),
                                "mac": None,
                                "status": "online",
                                "discovery_method": "fping",
                                "hostname": None
                            })

            except FileNotFoundError:
                # Fallback to nmap ping sweep if fping not available
                print("[*] fping not found, using nmap ping sweep")
                cmd = ['nmap', '-sn', '-PE', '-PP', '-PS21,22,23,25,53,80,110,111,135,139,143,443,993,995,1723,3389,5900,8080', network_range]

                result = await asyncio.create_subprocess_exec(
                    *cmd,
                    stdout=asyncio.subprocess.PIPE,
                    stderr=asyncio.subprocess.PIPE
                )

                stdout, stderr = await asyncio.wait_for(result.communicate(), timeout=15)

                if result.returncode == 0:
                    output = stdout.decode()
                    # Extract IPs from nmap output
                    for line in output.split('\n'):
                        ip_match = re.search(r'Nmap scan report for (\d+\.\d+\.\d+\.\d+)', line)
                        if ip_match:
                            devices.append({
                                "ip": ip_match.group(1),
                                "mac": None,
                                "status": "online",
                                "discovery_method": "nmap_ping",
                                "hostname": None
                            })

            except asyncio.TimeoutError:
                print("[!] Ping sweep timeout")

        except Exception as e:
            print(f"[!] Ping sweep error: {e}")

        print(f"[+] Ping sweep found {len(devices)} devices")
        return devices

    async def _fallback_ping_sweep(self, ip_list: List[str]) -> List[Dict[str, Any]]:
        """
        Fallback ping sweep using regular ping
        """
        devices = []
        semaphore = asyncio.Semaphore(self.max_concurrent)

        async def ping_ip(ip: str) -> Optional[str]:
            async with semaphore:
                try:
                    cmd = ['ping', '-c', '1', '-W', '1', ip]
                    result = await asyncio.create_subprocess_exec(
                        *cmd,
                        stdout=asyncio.subprocess.DEVNULL,
                        stderr=asyncio.subprocess.DEVNULL
                    )
                    await asyncio.wait_for(result.wait(), timeout=2)
                    return ip if result.returncode == 0 else None
                except:
                    return None

        # Run pings concurrently
        tasks = [ping_ip(ip) for ip in ip_list]
        results = await asyncio.gather(*tasks, return_exceptions=True)

        for result in results:
            if isinstance(result, str):  # Valid IP
                devices.append({
                    "ip": result,
                    "mac": None,
                    "status": "online",
                    "discovery_method": "fallback_ping",
                    "hostname": None
                })

        return devices

    async def _get_arp_table(self) -> List[Dict[str, Any]]:
        """
        Get devices from system ARP table
        """
        devices = []
        try:
            # Read ARP table
            result = subprocess.run(['arp', '-a'], capture_output=True, text=True, timeout=10)

            if result.returncode == 0:
                for line in result.stdout.split('\n'):
                    # Parse ARP table entries
                    # Format: hostname (192.168.1.1) at aa:bb:cc:dd:ee:ff [ether] on eth0
                    match = re.search(r'\((\d+\.\d+\.\d+\.\d+)\) at ([0-9a-fA-F:]{17})', line)
                    if match:
                        ip = match.group(1)
                        mac = match.group(2)

                        # Extract hostname if available
                        hostname_match = re.search(r'^(\S+) \(', line)
                        hostname = hostname_match.group(1) if hostname_match else None

                        devices.append({
                            "ip": ip,
                            "mac": mac,
                            "status": "online",
                            "discovery_method": "arp_table",
                            "hostname": hostname
                        })

        except Exception as e:
            print(f"[!] ARP table error: {e}")

        return devices

    async def _get_hostname(self, ip: str) -> Optional[str]:
        """
        Try to resolve hostname for IP
        """
        try:
            hostname = socket.gethostbyaddr(ip)[0]
            return hostname
        except Exception:
            return None

    def _merge_device_data(self, *device_lists) -> List[Dict[str, Any]]:
        """
        Merge device data from multiple discovery methods
        """
        merged_devices = {}

        for device_list in device_lists:
            for device in device_list:
                ip = device["ip"]

                if ip not in merged_devices:
                    merged_devices[ip] = device.copy()
                else:
                    # Merge data, preferring non-None values
                    existing = merged_devices[ip]

                    if not existing.get("mac") and device.get("mac"):
                        existing["mac"] = device["mac"]

                    if not existing.get("hostname") and device.get("hostname"):
                        existing["hostname"] = device["hostname"]

                    # Combine discovery methods
                    existing_methods = existing.get("discovery_method", "").split(",")
                    new_method = device.get("discovery_method", "")
                    if new_method and new_method not in existing_methods:
                        existing["discovery_method"] = ",".join(existing_methods + [new_method])

        # Add vendor information based on MAC
        for device in merged_devices.values():
            if device.get("mac"):
                device["vendor"] = self._get_mac_vendor(device["mac"])

        return list(merged_devices.values())

    def _get_mac_vendor(self, mac: str) -> str:
        """
        Get vendor information from MAC address (basic OUI lookup)
        """
        try:
            # Basic vendor lookup based on common OUI prefixes
            mac_upper = mac.upper().replace(":", "")
            oui = mac_upper[:6]

            # Common vendor OUIs
            vendors = {
                "000C29": "VMware",
                "000569": "VMware",
                "001C42": "VMware",
                "005056": "VMware",
                "080027": "VirtualBox",
                "525400": "QEMU",
                "0003FF": "Microsoft",
                "000D3A": "Microsoft",
                "001DD8": "Microsoft",
                "0050F2": "Microsoft",
                "00155D": "Microsoft",
                "000C76": "Cisco",
                "000142": "Cisco",
                "0001C7": "Cisco",
                "001F12": "Dell",
                "002564": "Dell",
                "00188B": "Dell",
                "3C970E": "Apple",
                "A45E60": "Apple",
                "AC87A3": "Apple",
                "00A040": "Apple"
            }

            return vendors.get(oui, "Unknown")

        except Exception:
            return "Unknown"

    async def _get_gpt_analysis(self, scan_data: Dict[str, Any]) -> Dict[str, Any]:
        """
        Get GPT analysis of network discovery results
        """
        try:
            # Prepare the prompt for GPT
            prompt = f"""
            Analyze the following network discovery scan results and provide a structured JSON response:

            Network Range: {scan_data['network_range']}
            Scan Status: {scan_data['scan_status']}
            Total Devices: {scan_data['summary']['total_devices']}
            Online Devices: {scan_data['summary']['online_devices']}
            Discovery Methods: {scan_data['summary']['discovery_methods']}

            Devices Found:
            {json.dumps(scan_data['devices'], indent=2)}

            Please provide a JSON response with the following structure:
            {{
                "network_summary": {{
                    "network_range": "network range scanned",
                    "total_devices": number_of_devices,
                    "device_types": {{"type": count}},
                    "security_risk": "low/medium/high"
                }},
                "device_analysis": [
                    {{
                        "ip": "device IP",
                        "mac": "MAC address",
                        "hostname": "hostname if available",
                        "vendor": "device vendor",
                        "device_type": "router/computer/mobile/iot/unknown",
                        "security_notes": "security observations"
                    }}
                ],
                "security_assessment": {{
                    "risk_level": "low/medium/high",
                    "potential_threats": ["threat1", "threat2"],
                    "recommendations": ["recommendation1", "recommendation2"]
                }},
                "network_insights": {{
                    "common_vendors": ["vendor list"],
                    "unusual_devices": ["list of unusual devices"],
                    "network_health": "good/fair/poor"
                }}
            }}

            Focus on network security analysis and device identification.
            """

            response = self.openai_client.chat.completions.create(
                model="gpt-3.5-turbo",
                messages=[
                    {"role": "system", "content": "You are a network security expert analyzing network discovery results. Provide detailed network security assessments in valid JSON format."},
                    {"role": "user", "content": prompt}
                ],
                temperature=0.3,
                max_tokens=2500
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
                    "network_summary": {
                        "network_range": scan_data["network_range"],
                        "total_devices": scan_data["summary"]["total_devices"],
                        "security_risk": "unknown"
                    },
                    "devices_found": len(scan_data["devices"])
                }
            }