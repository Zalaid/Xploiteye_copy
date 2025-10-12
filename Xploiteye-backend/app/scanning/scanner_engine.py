"""
Network Scanning Engine - Integrated from NetworkScanning module
LangGraph + GPT-powered scanning with CVE lookup
"""

import os
import subprocess
import sys
import signal
import atexit
from dotenv import load_dotenv
from typing import TypedDict, Annotated
import asyncio
import json
import xml.etree.ElementTree as ET
import time
import logging
from threading import Lock
from concurrent.futures import ThreadPoolExecutor
from functools import partial
from config.logging_config import scanning_logger
from datetime import datetime

# LangGraph imports
from langgraph.graph import StateGraph, END
from langgraph.graph.message import add_messages
from langchain_core.tools import tool
from langchain_core.messages import HumanMessage, SystemMessage, BaseMessage
from langchain_openai import ChatOpenAI

from config.settings import settings

# Global variable to store .txt file path for enhancement
txt_file_path = None

# Global variable to store GPT-selected services (backup for state issues)
global_selected_services = []

def reset_scan_globals():
    """Reset all global variables to ensure clean state for each new scan."""
    global txt_file_path, global_selected_services, fallback_services, TRUE_PUBLIC_IP
    global request_count, cycle_index

    logging.info("🔄 Resetting global scan state for new scan...")

    # Reset file paths and service data
    txt_file_path = None
    global_selected_services = []

    # Reset CVE lookup state
    fallback_services = []
    TRUE_PUBLIC_IP = None
    request_count = 0
    cycle_index = -1

    logging.info("✅ Global scan state reset completed")

# --- 1. STATE DEFINITION ---
class ScanState(TypedDict):
    """State for the scan workflow."""
    target: str
    scan_type: str
    user_id: str
    scan_id: str  # Add scan_id for UUID-based file naming
    messages: Annotated[list[BaseMessage], add_messages]
    selected_tools: list
    tool_results: dict
    open_ports: list
    services: list
    vulnerabilities: list
    os_information: str
    formatted_report: str
    status: str
    errors: list
    scan_start_time: float

# Validate dependencies
def check_dependencies():
    """Check if required tools (nmap) are installed and functional."""
    for cmd in ["nmap"]:
        try:
            result = subprocess.run([cmd, "--version"], capture_output=True, text=True, check=True)
            version_output = (result.stdout + result.stderr).strip()
            if not version_output:
                logging.warning(f"{cmd} not available")
        except FileNotFoundError:
            logging.warning(f"{cmd} not installed")
        except subprocess.CalledProcessError as e:
            logging.warning(f"{cmd} version check failed")

check_dependencies()

# --- UTILITY FUNCTIONS ---
def _run_command_with_timeout(command: list[str], timeout: int = 300) -> dict:
    """Helper function to run external commands with structured output."""
    try:
        result = subprocess.run(
            command,
            capture_output=True,
            text=True,
            timeout=timeout,
            check=False  # Don't raise exception on non-zero exit
        )

        return {
            "stdout": result.stdout.strip(),
            "stderr": result.stderr.strip(),
            "returncode": result.returncode,
            "success": result.returncode == 0
        }
    except subprocess.TimeoutExpired:
        return {
            "stdout": "",
            "stderr": f"Command timed out after {timeout} seconds",
            "returncode": -1,
            "success": False
        }
    except Exception as e:
        return {
            "stdout": "",
            "stderr": str(e),
            "returncode": -1,
            "success": False
        }

def parse_nmap_xml(xml_content: str) -> dict:
    """Parse nmap XML output to extract structured data with enhanced OS fingerprinting."""
    try:
        root = ET.fromstring(xml_content)
        results = {"hosts": []}

        for host in root.findall('.//host'):
            host_data = {"ip": "", "hostname": "", "status": "", "ports": [], "os": "", "os_details": {}}

            # Get IP address
            address = host.find('address[@addrtype="ipv4"]')
            if address is not None:
                host_data["ip"] = address.get("addr", "")

            # Get hostname
            hostname = host.find('.//hostname')
            if hostname is not None:
                host_data["hostname"] = hostname.get("name", "")

            # Get host status
            status = host.find('status')
            if status is not None:
                host_data["status"] = status.get("state", "")

            # Get enhanced OS information
            os_match = host.find('.//osmatch')
            if os_match is not None:
                host_data["os"] = os_match.get("name", "")

                # Simple OS details - only name
                host_data["os_details"] = {
                    "name": os_match.get("name", "")
                }

            # Get ports
            for port in host.findall('.//port'):
                port_data = {
                    "port": port.get("portid", ""),
                    "protocol": port.get("protocol", ""),
                    "state": "",
                    "service": "",
                    "version": ""
                }

                state = port.find('state')
                if state is not None:
                    port_data["state"] = state.get("state", "")

                service = port.find('service')
                if service is not None:
                    port_data["service"] = service.get("name", "")
                    port_data["version"] = service.get("version", "")

                if port_data["state"] == "open":
                    host_data["ports"].append(port_data)

            results["hosts"].append(host_data)

        return results
    except Exception as e:
        return {"hosts": [], "error": str(e)}

# --- 2. UNIVERSAL SCAN TOOLS ---
async def host_connectivity_check(target: str) -> dict:
    """Quick ping check to verify target accessibility."""

    def run_ping():
        ping_cmd = ["ping", "-c", "1", target]
        return _run_command_with_timeout(ping_cmd, timeout=10)

    ping_result = await asyncio.to_thread(run_ping)

    result = {
        "status": "success" if ping_result["success"] else "failed",
        "data": {
            "alive": ping_result["success"],
            "response_time": ping_result["stdout"] if ping_result["success"] else None,
            "error": ping_result["stderr"] if not ping_result["success"] else None
        }
    }

    return result

async def port_and_os_scan(target: str, max_ports: int = 1000) -> dict:
    """Universal port scanning and OS detection tool. Scans ports 1-max_ports."""

    def run_scan():
        ping_cmd = ["ping", "-c", "1", target]
        ping_result = _run_command_with_timeout(ping_cmd, timeout=10)

        if not ping_result["success"]:
            return {
                "status": "failed",
                "data": {"error": f"Host unreachable: {ping_result['stderr']}"}
            }

        # Calculate timeout based on port range
        if max_ports <= 1000:
            timeout = 45
        elif max_ports <= 5000:
            timeout = 250
        else:
            timeout = 600

        port_discovery_cmd = [
            "sudo", "nmap", "-O", "--osscan-guess", "--osscan-limit",
            "-Pn", "-n", "--disable-arp-ping", "-p", f"1-{max_ports}",
            "-oX", "-", target
        ]
        port_result = _run_command_with_timeout(port_discovery_cmd, timeout=timeout)

        if not port_result["success"]:
            return {
                "status": "failed",
                "data": {"error": f"Port discovery failed: {port_result['stderr']}"}
            }

        parsed_data = parse_nmap_xml(port_result["stdout"])
        open_ports = []
        os_info = ""

        if parsed_data and "hosts" in parsed_data and parsed_data["hosts"]:
            host = parsed_data["hosts"][0]
            open_ports = [p["port"] for p in host.get("ports", []) if p.get("state") == "open"]
            os_info = host.get("os", "")

        result = {
            "status": "success",
            "data": {
                "open_ports": open_ports,
                "os_info": os_info,
                "host_status": "up",
                "total_ports_scanned": max_ports,
                "discovered_ports": len(open_ports),
                "parsed_data": parsed_data  # Store full parsed data for later use
            }
        }
        return result

    result = await asyncio.to_thread(run_scan)
    return result

async def service_version_detection(target: str, max_ports: int = 1000) -> dict:
    """Universal service version detection tool. Detects versions on ports 1-max_ports."""

    def run_version_detection():
        # Calculate timeout based on port range
        if max_ports <= 1000:
            discovery_timeout = 45
            version_timeout = 60
        elif max_ports <= 5000:
            discovery_timeout = 250
            version_timeout = 80
        else:
            discovery_timeout = 600
            version_timeout = 180

        discovery_cmd = [
            "sudo", "nmap", "-O", "--osscan-guess", "--osscan-limit",
            "-Pn", "-n", "--disable-arp-ping", "-p", f"1-{max_ports}",
            "-oX", "-", target
        ]
        discovery_result = _run_command_with_timeout(discovery_cmd, timeout=discovery_timeout)

        if not discovery_result["success"]:
            return {
                "status": "failed",
                "data": {"error": f"Port discovery failed: {discovery_result['stderr']}"}
            }

        parsed_data = parse_nmap_xml(discovery_result["stdout"])
        open_ports = []
        if parsed_data and "hosts" in parsed_data and parsed_data["hosts"]:
            for host in parsed_data["hosts"]:
                for port in host.get("ports", []):
                    if port.get("state") == "open":
                        open_ports.append(port["port"])

        if not open_ports:
            return {
                "status": "success",
                "data": {"services": [], "message": "No open ports found for version detection", "total_ports_scanned": max_ports}
            }

        open_ports_str = ",".join(open_ports)

        # Adjust version timeout based on number of discovered ports
        if max_ports > 5000 and len(open_ports) > 50:
            version_timeout = 180

        version_cmd = [
            "sudo", "nmap", "-sV", "--version-light", "-T5",
            "--disable-arp-ping", "-n", "-p", open_ports_str,
            "-oX", "-", target
        ]
        version_result = _run_command_with_timeout(version_cmd, timeout=version_timeout)

        if version_result["success"]:
            parsed_versions = parse_nmap_xml(version_result["stdout"])
            services = []
            if parsed_versions and "hosts" in parsed_versions and parsed_versions["hosts"]:
                for host in parsed_versions["hosts"]:
                    for port in host.get("ports", []):
                        services.append({
                            "port": port["port"],
                            "protocol": port["protocol"],
                            "service": port["service"],
                            "version": port["version"],
                            "state": port["state"]
                        })

            result = {
                "status": "success",
                "data": {
                    "services": services,
                    "total_services": len(services),
                    "discovered_ports": len(open_ports),
                    "total_ports_scanned": max_ports,
                    "parsed_data": parsed_versions  # Store full parsed data
                }
            }
        else:
            result = {
                "status": "failed",
                "data": {"error": f"Version detection failed: {version_result['stderr']}"}
            }
        return result

    result = await asyncio.to_thread(run_version_detection)
    return result

async def http_service_check(target: str) -> dict:
    """Quick HTTP/HTTPS accessibility check."""

    def run_curl():
        http_cmd = ["curl", "-s", "-D", "-", f"http://{target}", "-o", "/dev/null"]
        return _run_command_with_timeout(http_cmd, timeout=10)

    http_result = await asyncio.to_thread(run_curl)

    result = {
        "status": "success" if http_result["success"] else "failed",
        "data": {
            "http_accessible": http_result["success"],
            "headers": http_result["stdout"] if http_result["success"] else "",
            "error": http_result["stderr"] if not http_result["success"] else None
        }
    }

    return result

# --- 3. CVE LOOKUP FUNCTIONALITY ---
VPN_CONTROLLER_SCRIPT = os.path.join(os.path.dirname(__file__), "protonvpn_cli", "setup_vpn.py")
RATE_LIMIT = 8
MAX_WORKERS = 10
VPN_CYCLE_PLAN = ["J", "J", "U", "U", "N", "N"]

# Global state for a single CVE lookup run
vpn_lock = Lock()
request_count = 0
cycle_index = -1
fallback_services = []
fallback_lock = Lock()
TRUE_PUBLIC_IP = None

# Global cleanup tracking
active_executors = []
active_processes = []

def cleanup_all_processes():
    """Emergency cleanup function to kill all active processes and executors."""
    logging.info("🚨 Emergency cleanup initiated...")

    # Kill all active thread pool executors
    for executor in active_executors:
        try:
            executor.shutdown(wait=False, cancel_futures=True)
            logging.info("✅ Terminated thread pool executor")
        except Exception as e:
            logging.error(f"Error terminating executor: {e}")

    # Kill all active subprocesses
    for process in active_processes:
        try:
            process.terminate()
            process.wait(timeout=2)
            logging.info("✅ Terminated subprocess")
        except Exception as e:
            logging.error(f"Error terminating subprocess: {e}")

    # Kill VPN processes aggressively
    try:
        subprocess.run(["sudo", "pkill", "-9", "-f", "openvpn"], capture_output=True)
        subprocess.run(["sudo", "pkill", "-9", "-f", "vulnx"], capture_output=True)
        subprocess.run(["sudo", "pkill", "-9", "-f", "setup_vpn.py"], capture_output=True)
        logging.info("✅ Killed VPN and vulnx processes")
    except Exception as e:
        logging.error(f"Error killing VPN processes: {e}")

    logging.info("🔧 Emergency cleanup completed")

def signal_handler(signum, frame):
    """Handle SIGINT and SIGTERM signals for graceful shutdown."""
    logging.info(f"🛑 Received signal {signum}, initiating cleanup...")
    cleanup_all_processes()
    sys.exit(0)

# Register signal handlers and cleanup
signal.signal(signal.SIGINT, signal_handler)
signal.signal(signal.SIGTERM, signal_handler)
atexit.register(cleanup_all_processes)

def get_initial_public_ip():
    """
    This function runs ONCE at startup to establish the true, non-VPN IP.
    """
    logging.info("Establishing ground truth IP for this session...")
    # Forcefully kills any old VPN process
    subprocess.run(["sudo", "pkill", "-9", "-f", "openvpn"], capture_output=True)
    # Forcefully deletes the virtual network interface
    subprocess.run(["sudo", "ip", "link", "delete", "tun0"], stderr=subprocess.DEVNULL)
    time.sleep(2) # Wait for network to settle
    try:
        # Get the current public IP
        result = subprocess.run(["curl", "-s", "--max-time", "15", "api.ipify.org"], capture_output=True, text=True, timeout=20)
        ip = result.stdout.strip()
        if result.returncode == 0 and ip:
            logging.info(f"✅ Ground truth IP established: {ip}")
            return ip
    except Exception as e:
        logging.error(f"Could not determine initial IP: {e}")
    return None

def execute_vpn_command(command_args):
    """
    CRITICAL FIX: Execute VPN control commands, passing the true public IP.
    """
    global TRUE_PUBLIC_IP
    # The true IP is now passed as the final argument
    cmd = ["python3", VPN_CONTROLLER_SCRIPT] + command_args + [TRUE_PUBLIC_IP]
    try:
        subprocess.run(cmd, check=True, timeout=180, capture_output=True, text=True)
        return True
    except (subprocess.CalledProcessError, subprocess.TimeoutExpired) as e:
        logging.error(f"VPN script failed! Command: {' '.join(cmd)}")
        if hasattr(e, 'stderr'):
            logging.error(f"VPN script output:\n{e.stderr or e.stdout}")
        return False

def handle_rate_limit():
    """Handle VPN switching when rate limit is hit."""
    global request_count, cycle_index
    if request_count < RATE_LIMIT:
        return True
    scanning_logger.vpn_switch("rate limit")
    request_count = 0
    cycle_index += 1
    if cycle_index >= len(VPN_CYCLE_PLAN):
        logging.info("VPN cycle finished. Disconnecting.")
        cycle_index = -1
        return execute_vpn_command(["disconnect"])
    next_region = VPN_CYCLE_PLAN[cycle_index]
    logging.info(f"Connecting to next in cycle: Region {next_region}...")
    return execute_vpn_command(["connect", next_region])

def run_vulnx_search_with_retry(query):
    """Run vulnx search with retry logic."""
    cmd = ["/home/kali/go/bin/vulnx", "search", query, "--limit", "1", "--json"]
    for attempt in range(2):
        try:
            result = subprocess.run(cmd, capture_output=True, text=True, timeout=40)
            if "Rate limit exceeded" in result.stderr:
                return "RATE_LIMIT"
            if result.returncode == 0 and result.stdout and result.stdout.find('{') != -1:
                return result.stdout[result.stdout.find('{'):].strip()
            return None
        except subprocess.TimeoutExpired:
            logging.warning(f"API timeout for query: '{query}' on attempt {attempt + 1}")
            if attempt == 0:
                time.sleep(2)
    logging.error(f"Query '{query}' failed with timeout after 2 attempts.")
    return None

def process_service(is_fallback_pass, svc):
    """
    CORRECTED: Process a single service for CVE lookup with robust rate limit logic.
    Now handles version-first, then service-name fallback strategy.
    """
    global request_count

    # Determine query strategy based on pass type and version availability
    if is_fallback_pass:
        # Fallback pass: always use service name only
        query = svc['service']
    else:
        # Primary pass: use version if available, otherwise service name only
        if svc.get('version') and svc['version'] != 'None':
            query = f"{svc['service']} {svc['version']}"
        else:
            query = svc['service']

    with vpn_lock:
        # Check rate limit from previous task first
        if not handle_rate_limit():
           logging.error(f"Aborting task for '{query}' due to VPN failure.")
           return None

        # Now, increment for the current task
        request_count += 1
        conn_type = "Direct" if cycle_index == -1 else f"VPN-{VPN_CYCLE_PLAN[cycle_index]}"
        pass_type_str = "Fallback" if is_fallback_pass else "Primary"
        logging.info(f"▶️ {pass_type_str} Scan: '{query}' (Req #{request_count}/{RATE_LIMIT} on {conn_type})")

    data_raw = run_vulnx_search_with_retry(query)
    if data_raw:
        try:
            data = json.loads(data_raw)
            if data and data.get("results"):
                vuln = data["results"][0]
                logging.info(f"✅ Success for '{query}'")
                # Return the formatted string, don't write to file here
                return format_output(svc, vuln, is_fallback_pass)
        except (json.JSONDecodeError, IndexError):
            pass

    # Only queue for fallback if this was a primary pass with version and it failed
    if not is_fallback_pass and svc.get('version') and svc['version'] != 'None':
        logging.warning(f"∅ Primary version scan failed for '{query}'. Queuing for service-name fallback.")
        with fallback_lock:
            fallback_services.append(svc)

    return None

def extract_all_links(vuln):
    """Extract all relevant links from vulnerability data."""
    links, citations = [], vuln.get("citations", [])
    links.extend(vuln.get("references", [])); links.extend(vuln.get("exploits", []))
    keywords = ["exploit", "metasploit", "db", "poc"]
    matching = [c.get("url") for c in citations if c.get("url") and any(k in c.get("url").lower() for k in keywords)]
    if matching: links.extend(matching)
    else: links.extend([c.get("url") for c in citations if c.get("url")][:2])
    return list(sorted({link for link in links if link}))

def format_output(svc, vuln, is_fallback):
    """Format CVE vulnerability output."""
    # Determine scan type based on whether version was used
    if is_fallback:
        scan_type = "(Service-Name Fallback)"
    else:
        if svc.get('version') and svc['version'] != 'None':
            scan_type = "(Version-Based)"
        else:
            scan_type = "(Service-Name Only)"

    links = extract_all_links(vuln)
    output = (
        f"[Port: {svc['port']} | Service: {svc['service']} | Version: {svc.get('version', 'None')} {scan_type}]\n"
        f"CVE ID: {vuln.get('cve_id', 'Not Available')}\n"
        f"Name: {vuln.get('name', 'Not Available')}\n"
        f"Description: {vuln.get('description', 'Not Available')}\n"
        f"Impact: {vuln.get('impact', 'Not Available')}\n"
        f"Severity: {vuln.get('severity', 'Not Available')}\n"
        f"CVSS Score: {vuln.get('cvss_score', 'Not Available')}\n"
        f"EPSS Score: {vuln.get('epss_score', 'Not Available')}\n"
        f"Age in Days: {vuln.get('age_in_days', 'Not Available')}\n"
        f"Remediation: {vuln.get('remediation', 'Not Available')}\n"
        f"Exploit Available: {'Yes' if links else 'No'}\n"
        f"Exploit/PoC Links:\n"
    )
    if links:
        for link in links:
            output += f"- {link}\n"
    else:
        output += "No specific exploit links found.\n"
    output += "----------------------------------------\n\n"
    return output

def run_scan_pass(service_list, is_fallback_pass):
    """
    CORRECTED: Run CVE scan pass that is self-contained and returns its results.
    """
    pass_results = []
    pass_name = "FALLBACK" if is_fallback_pass else "PRIMARY"
    logging.info(f"\n--- STARTING PASS: {pass_name} SCAN ---")
    if not service_list:
        logging.info("Service list is empty. Skipping pass.")
        return []
    logging.info(f"Processing {len(service_list)} services in this pass...")

    executor = ThreadPoolExecutor(max_workers=MAX_WORKERS)
    active_executors.append(executor)

    try:
        task = partial(process_service, is_fallback_pass)
        results = executor.map(task, service_list)
        pass_results = [res for res in results if res is not None]
        logging.info(f"--- {pass_name} SCAN PASS COMPLETE ---")
        logging.info(f"📊 Found {len(pass_results)} new results in this pass.")
    finally:
        executor.shutdown(wait=True)
        if executor in active_executors:
            active_executors.remove(executor)

    return pass_results

async def preprocess_services_with_gpt(nmap_services_data: str, scan_type: str) -> list:
    """Use GPT to clean and preprocess service versions from nmap data."""

    # Define the maximum number of services based on scan type
    max_services = {
        'light': 5,
        'medium': 10,
        'deep': 999  # No practical limit for deep scan
    }

    service_limit = max_services.get(scan_type.lower(), 5)

    # Create concise prompt for faster GPT processing
    preprocessing_prompt = f"""Extract {service_limit} most critical services for {scan_type} scan.

IMPORTANT RULES:
1. Remove duplicates - if same service runs on multiple ports, keep only ONE entry (highest priority port)
2. Clean versions - if version looks confusing, incomplete, or unlikely to find CVE results, set to null
3. Set version to null for generic versions like "1.0", "2.x", incomplete versions, or when uncertain

Return JSON array with exactly {service_limit} unique services:
[{{"port": int, "service": "name", "version": "clean_version_or_null"}}]

Examples of version cleaning:
- "Apache 2.2.8" → "2.2.8"
- "OpenSSH 4.7p1 Debian 8ubuntu1" → "4.7p1"
- "MySQL 5.x" → null (too generic)
- "httpd 1.0" → null (too generic)
- "ProFTPD" → null (no version)

Data:
{nmap_services_data}

JSON:"""

    try:
        llm = get_llm()
        response = await llm.ainvoke([HumanMessage(content=preprocessing_prompt)])

        # Debug: Log GPT preprocessing response
        logging.info(f"🔍 DEBUG: GPT preprocessing response length: {len(response.content)}")
        logging.info(f"🔍 DEBUG: GPT preprocessing response: {response.content[:500]}...")

        # Parse the response
        services_data = json.loads(response.content)

        # Validate that GPT returned the correct number of services
        if scan_type.lower() != 'deep':  # Deep scan has no limit
            if len(services_data) != service_limit:
                logging.warning(f"GPT returned {len(services_data)} services, expected {service_limit}. Truncating to {service_limit}.")
                services_data = services_data[:service_limit]

        logging.info(f"✅ GPT preprocessing: {scan_type} scan processed {len(services_data)} services")
        return services_data

    except Exception as e:
        logging.error(f"🔍 DEBUG: GPT preprocessing failed with error: {e}")
        logging.error(f"🔍 DEBUG: GPT preprocessing failed - input data length: {len(nmap_services_data)}")
        # Fallback: return empty list if GPT fails
        return []

async def cve_vulnerability_lookup(services_list: list) -> dict:
    """Main CVE lookup function that orchestrates the two-pass scan."""

    def run_cve_lookup():
        global fallback_services, TRUE_PUBLIC_IP, request_count, cycle_index
        # Reset state for each run
        fallback_services = []
        all_results = []
        request_count = 0
        cycle_index = -1

        # Establish the ground truth IP for this specific run
        TRUE_PUBLIC_IP = get_initial_public_ip()
        if not TRUE_PUBLIC_IP:
            return {
                "status": "failed",
                "data": {"error": "Could not establish ground truth IP for VPN operations"}
            }

        try:
            start_time = time.time()

            logging.info(f"🔍 Starting CVE lookup for {len(services_list)} services (version-first strategy)")

            # Pass 1: Primary Scan (version-based where available, otherwise service-name)
            primary_results = run_scan_pass(services_list, is_fallback_pass=False)
            all_results.extend(primary_results)

            # Pass 2: Fallback Scan (service-name only for failed version-based searches)
            fallback_results = []
            if fallback_services:
                logging.info(f"🔄 Starting fallback scan for {len(fallback_services)} services that failed version-based lookup")
                fallback_results = run_scan_pass(fallback_services, is_fallback_pass=True)
                all_results.extend(fallback_results)

            total_time = time.time() - start_time
            logging.info(f"\n✅🎉 CVE LOOKUP COMPLETED in {total_time:.2f} seconds.")
            logging.info(f"📊 Final Results: {len(primary_results)} primary + {len(fallback_results)} fallback = {len(all_results)} total vulnerabilities")

            # Create result folder using settings
            result_folder = settings.results_dir
            os.makedirs(result_folder, exist_ok=True)

            # Save results to .txt file in result folder with scan-specific naming
            if all_results:
                timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
                # Use scan_id for unique naming - will be set in report formatting
                output_file = f"{result_folder}/cve_results_{timestamp}.txt"

                try:
                    with open(output_file, "w", encoding="utf-8") as f:
                        f.write(f"CVE Vulnerability Scan Results\n")
                        f.write(f"Generated: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}\n")
                        f.write(f"Total vulnerabilities found: {len(all_results)}\n")
                        f.write(f"Processing time: {total_time:.2f} seconds\n")
                        f.write("=" * 80 + "\n\n")
                        f.writelines(all_results)

                    # Store the .txt file path in global state for later enhancement
                    global txt_file_path
                    txt_file_path = output_file
                    logging.info(f"✍️ CVE results saved to: {output_file}")
                except Exception as e:
                    logging.error(f"Failed to save CVE results to file: {e}")

            return {
                "status": "success",
                "data": {
                    "vulnerabilities_found": len(all_results),
                    "detailed_results": "".join(all_results),
                    "processing_time": total_time,
                    "output_file": output_file if all_results else None
                }
            }

        except Exception as e:
            logging.error(f"CVE lookup failed: {e}")
            return {"status": "failed", "data": {"error": str(e)}}
        finally:
            logging.info("🔌 CVE lookup finished. Triggering final cleanup...")
            execute_vpn_command(["disconnect"])
            logging.info("✅ CVE cleanup complete.")

    return await asyncio.to_thread(run_cve_lookup)

# --- 4. LANGGRAPH STATE NODES ---
# Initialize LLM
_llm_instance = None

def get_llm():
    """Get or create the LLM instance."""
    global _llm_instance
    if _llm_instance is None:
        try:
            _llm_instance = ChatOpenAI(
                model="gpt-3.5-turbo",
                temperature=0,
                max_tokens=4000,  # Increased for complete JSON response
                request_timeout=60,  # Increased timeout for complex processing
                api_key=os.getenv("OPENAI_API_KEY")
            )
        except Exception as e:
            logging.error(f"Failed to initialize LLM: {e}")
            sys.exit(1)
    return _llm_instance

def get_all_scan_tools():
    """Get all modular scan tools organized by scan type."""
    # Create wrapper functions that call universal tools with appropriate parameters

    @tool
    async def host_connectivity_tool(target: str) -> dict:
        """Host connectivity check via ping."""
        return await host_connectivity_check(target)

    @tool
    async def light_scan_ports_os(target: str) -> dict:
        """Light Scan - Port and OS detection (1-1000 ports)."""
        return await port_and_os_scan(target, 1000)

    @tool
    async def light_scan_versions(target: str) -> dict:
        """Light Scan - Service version detection (1-1000 ports)."""
        return await service_version_detection(target, 1000)

    @tool
    async def medium_scan_ports_os(target: str) -> dict:
        """Medium Scan - Port and OS detection (1-5000 ports)."""
        return await port_and_os_scan(target, 5000)

    @tool
    async def medium_scan_versions(target: str) -> dict:
        """Medium Scan - Service version detection (1-5000 ports)."""
        return await service_version_detection(target, 5000)

    @tool
    async def deep_scan_ports_os(target: str) -> dict:
        """Deep Scan - Port and OS detection (1-15000 ports)."""
        return await port_and_os_scan(target, 15000)

    @tool
    async def deep_scan_versions(target: str) -> dict:
        """Deep Scan - Service version detection (1-15000 ports)."""
        return await service_version_detection(target, 15000)

    @tool
    async def http_service_tool(target: str) -> dict:
        """HTTP service accessibility check."""
        return await http_service_check(target)

    @tool
    async def cvelook_light(services_data: str) -> dict:
        """CVE vulnerability lookup for Light scan - processes services JSON string."""
        try:
            # Parse the services data from JSON string
            import json
            if isinstance(services_data, str):
                services_list = json.loads(services_data)
            else:
                services_list = services_data

            if not services_list:
                return {"status": "failed", "data": {"error": "No services to process"}}

            # Perform CVE lookup directly on preprocessed services
            return await cve_vulnerability_lookup(services_list)
        except Exception as e:
            return {"status": "failed", "data": {"error": str(e)}}

    @tool
    async def cvelook_medium(services_data: str) -> dict:
        """CVE vulnerability lookup for Medium scan - processes services JSON string."""
        try:
            # Parse the services data from JSON string
            import json
            if isinstance(services_data, str):
                services_list = json.loads(services_data)
            else:
                services_list = services_data

            if not services_list:
                return {"status": "failed", "data": {"error": "No services to process"}}

            # Perform CVE lookup directly on preprocessed services
            return await cve_vulnerability_lookup(services_list)
        except Exception as e:
            return {"status": "failed", "data": {"error": str(e)}}

    @tool
    async def cvelook_deep(services_data: str) -> dict:
        """CVE vulnerability lookup for Deep scan - processes services JSON string."""
        try:
            # Parse the services data from JSON string
            import json
            if isinstance(services_data, str):
                services_list = json.loads(services_data)
            else:
                services_list = services_data

            if not services_list:
                return {"status": "failed", "data": {"error": "No services to process"}}

            # Perform CVE lookup directly on preprocessed services
            return await cve_vulnerability_lookup(services_list)
        except Exception as e:
            return {"status": "failed", "data": {"error": str(e)}}

    return {
        'light': [host_connectivity_tool, light_scan_ports_os, light_scan_versions, http_service_tool, cvelook_light],
        'medium': [medium_scan_ports_os, medium_scan_versions, cvelook_medium],
        'deep': [deep_scan_ports_os, deep_scan_versions, cvelook_deep]
    }

async def tool_selection_node(state: ScanState) -> ScanState:
    """LangGraph Node 1: Tool selection based on scan type."""

    llm = get_llm()
    all_tools = get_all_scan_tools()

    # Create tool selection prompt
    tool_selection_prompt = f"""You are a cybersecurity scanning expert. You MUST select ALL the appropriate tools for a {state['scan_type']} scan on target: {state['target']}

Available tools by scan type:
- Light Scan Tools: host_connectivity_tool, light_scan_ports_os, light_scan_versions, http_service_tool, cvelook_light (SELECT ALL 5 FOR LIGHT)
- Medium Scan Tools: medium_scan_ports_os, medium_scan_versions, cvelook_medium (SELECT ALL 3 FOR MEDIUM)
- Deep Scan Tools: deep_scan_ports_os, deep_scan_versions, cvelook_deep (SELECT ALL 3 FOR DEEP)

IMPORTANT: For a {state['scan_type']} scan, you MUST select ALL tools for that scan type.
- cvelook_* tools perform CVE vulnerability lookup using vulnx with VPN rotation
- These tools require nmap version scan data as input to find vulnerabilities

Respond with ONLY a comma-separated list of tool names. DO NOT include any explanations.

REQUIRED responses:
- For light scan: host_connectivity_tool,light_scan_ports_os,light_scan_versions,http_service_tool,cvelook_light
- For medium scan: medium_scan_ports_os,medium_scan_versions,cvelook_medium
- For deep scan: deep_scan_ports_os,deep_scan_versions,cvelook_deep

Your response for {state['scan_type']} scan:"""

    try:
        response = await asyncio.to_thread(llm.invoke, tool_selection_prompt)
        selected_tool_names = [name.strip() for name in response.content.split(',')]

        # Map tool names to actual tool functions
        all_tool_functions = {}
        for tool_list in all_tools.values():
            for tool in tool_list:
                all_tool_functions[tool.name] = tool

        selected_tools = []
        for tool_name in selected_tool_names:
            if tool_name in all_tool_functions:
                selected_tools.append(all_tool_functions[tool_name])

        # Validation: Ensure we have the correct number of tools for the scan type
        expected_counts = {'light': 5, 'medium': 3, 'deep': 3}
        expected_count = expected_counts.get(state['scan_type'].lower(), 0)

        if len(selected_tools) != expected_count:
            selected_tools = all_tools.get(state['scan_type'].lower(), [])

        state["selected_tools"] = selected_tools
        state["messages"].append(HumanMessage(content=f"Selected {len(selected_tools)} tools for {state['scan_type']} scan"))

        return state

    except Exception as e:
        state["errors"].append(f"Tool selection failed: {str(e)}")
        state["selected_tools"] = all_tools.get(state['scan_type'].lower(), [])
        return state

async def tool_execution_node(state: ScanState) -> ScanState:
    """LangGraph Node 2: Execute selected tools in parallel."""

    try:
        # Execute non-CVE tools first, then CVE tools
        non_cve_tools = [tool for tool in state['selected_tools'] if not tool.name.startswith('cvelook_')]
        cve_tools = [tool for tool in state['selected_tools'] if tool.name.startswith('cvelook_')]

        # Create tasks for parallel execution of non-CVE tools
        tasks = []
        for tool in non_cve_tools:
            task = tool.ainvoke(state['target'])
            tasks.append(task)

        # Execute all non-CVE tools in parallel
        non_cve_results = await asyncio.gather(*tasks, return_exceptions=True)

        # Combine all results
        tool_results = []
        cve_results = []

        # Process non-CVE results first
        for result in non_cve_results:
            tool_results.append(result)

        # Execute CVE tools if we have them
        if cve_tools:
            # Get nmap version data from version scan results and preprocess with GPT
            nmap_version_data = ""
            for i, result in enumerate(non_cve_results):
                tool_name = non_cve_tools[i].name
                if 'version' in tool_name and isinstance(result, dict) and result.get("status") == "success":
                    data = result.get("data", {})
                    if "services" in data and data["services"]:
                        # Format the services data in a way GPT can understand
                        services_info = []
                        for svc in data["services"]:
                            port = svc.get('port', '')
                            service = svc.get('service', '')
                            version = svc.get('version', '').strip()
                            svc_state = svc.get('state', 'unknown')
                            protocol = svc.get('protocol', 'tcp')

                            # Format with full details for GPT processing
                            if version:
                                services_info.append(f"Port {port}/{protocol}: {service} version {version} (state: {svc_state})")
                            else:
                                services_info.append(f"Port {port}/{protocol}: {service} (no version detected) (state: {svc_state})")
                        nmap_version_data = "\n".join(services_info)
                        break

            # Initialize GPT-selected services (will be populated if GPT preprocessing succeeds)
            state["gpt_selected_services"] = []

            # Preprocess nmap data with GPT and execute CVE tools
            if nmap_version_data:
                # Determine scan type from current state
                try:
                    scan_type = state['scan_type']
                except (KeyError, TypeError) as e:
                    logging.error(f"Error accessing state scan_type: {e}, state type: {type(state)}")
                    # Fallback to a default scan type
                    scan_type = "light"

                # Preprocess services with GPT first
                try:
                    logging.info(f"🔄 Starting GPT preprocessing for {scan_type} scan...")
                    processed_services = await preprocess_services_with_gpt(nmap_version_data, scan_type)
                    logging.info(f"✅ GPT preprocessing completed: {len(processed_services) if processed_services else 0} services")

                    # Store GPT-selected services in state for reporting
                    state["gpt_selected_services"] = processed_services if processed_services else []

                    # BACKUP: Also store in global variable
                    global global_selected_services
                    global_selected_services = processed_services if processed_services else []
                    logging.info(f"🔍 DEBUG: tool_execution_node stored {len(state.get('gpt_selected_services', []))} selected services in state")
                    logging.info(f"🔍 DEBUG: tool_execution_node stored {len(global_selected_services)} selected services in global variable")

                    if processed_services:
                        # Execute CVE tools with preprocessed services list as JSON string
                        import json
                        services_json = json.dumps(processed_services)
                        logging.info(f"🔍 Starting CVE lookup for {len(cve_tools)} CVE tools...")

                        cve_tasks = []
                        for tool in cve_tools:
                            logging.info(f"📡 Calling CVE tool: {tool.name}")
                            task = tool.ainvoke(services_json)
                            cve_tasks.append(task)

                        cve_results = await asyncio.gather(*cve_tasks, return_exceptions=True)
                        # Calculate actual CVE count from results
                        total_cve_count = 0
                        for result in cve_results:
                            if isinstance(result, dict) and result.get("status") == "success":
                                data = result.get("data", {})
                                total_cve_count += data.get("vulnerabilities_found", 0)
                        scanning_logger.cve_processing(state.get('scan_id', 'unknown'), total_cve_count, state['target'])
                        tool_results.extend(cve_results)

                        # Add special tool result to carry selected services through data flow
                        tool_results.append({
                            "status": "success",
                            "data": {
                                "selected_services": processed_services,
                                "selected_count": len(processed_services)
                            }
                        })
                    else:
                        # If GPT preprocessing failed, create dummy results
                        for tool in cve_tools:
                            tool_results.append({"status": "failed", "data": {"error": "GPT preprocessing returned no services"}})
                except Exception as e:
                    # If GPT preprocessing failed, create dummy results
                    logging.error(f"🔍 DEBUG: GPT preprocessing failed in tool_execution_node: {e}")
                    for tool in cve_tools:
                        tool_results.append({"status": "failed", "data": {"error": f"GPT preprocessing failed: {str(e)}"}})
            else:
                # If no nmap version data available, create dummy results
                logging.warning("🔍 DEBUG: No nmap version data available - GPT preprocessing skipped")
                for tool in cve_tools:
                    tool_results.append({"status": "failed", "data": {"error": "No nmap version data available"}})

        # Create mock tool for selected services result
        class MockSelectedServicesTool:
            name = "gpt_selected_services_carrier"

        # Combine tools for result processing
        all_tools_for_results = non_cve_tools + cve_tools + [MockSelectedServicesTool()]

        # Process results
        tool_outputs = {}
        execution_errors = []

        for i, result in enumerate(tool_results):
            tool_name = all_tools_for_results[i].name

            if isinstance(result, Exception):
                error_msg = f"{tool_name} failed: {str(result)}"
                execution_errors.append(error_msg)
                continue

            tool_outputs[tool_name] = result

        state["tool_results"] = tool_outputs
        state["errors"].extend(execution_errors)

        # Aggregate data
        all_open_ports = []
        all_services = []
        os_information = ""
        all_vulnerabilities = []

        for tool_name, result in tool_outputs.items():
            if isinstance(result, dict) and result.get("status") == "success":
                data = result.get("data", {})

                if "open_ports" in data and data["open_ports"]:
                    all_open_ports.extend(data["open_ports"])

                if "services" in data and data["services"]:
                    all_services.extend(data["services"])
                elif "open_ports" in data:
                    all_services.extend(data["open_ports"])

                # Capture OS information from any tool that provides it
                if "os_info" in data and data["os_info"] and not os_information:
                    os_information = data["os_info"]

                # Handle selected services carrier
                if tool_name == "gpt_selected_services_carrier":
                    if "selected_services" in data:
                        state["gpt_selected_services"] = data["selected_services"]
                        logging.info(f"🔍 DEBUG: Recovered {len(data['selected_services'])} selected services from tool result")

                # Handle CVE vulnerability data from cvelook tools
                if tool_name.startswith('cvelook_'):
                    if "detailed_results" in data and data["detailed_results"]:
                        all_vulnerabilities.append({
                            "tool": tool_name,
                            "vulnerabilities_found": data.get("vulnerabilities_found", 0),
                            "detailed_results": data["detailed_results"],
                            "processing_time": data.get("processing_time", 0)
                        })

        # Remove duplicates and store in state
        state["open_ports"] = list({str(p): p for p in all_open_ports}.values())
        state["services"] = list({str(s): s for s in all_services}.values())
        state["vulnerabilities"] = all_vulnerabilities
        state["os_information"] = os_information

        vulnerability_count = sum(vuln.get("vulnerabilities_found", 0) for vuln in all_vulnerabilities)
        state["messages"].append(HumanMessage(
            content=f"Tool execution completed. Found {len(state['open_ports'])} ports, {len(state['services'])} services, {vulnerability_count} vulnerabilities"
        ))

        return state

    except Exception as e:
        logging.error(f"Tool execution node failed: {e}, state type: {type(state)}")
        try:
            if isinstance(state, dict) and "errors" in state:
                state["errors"].append(f"Tool execution failed: {str(e)}")
            else:
                logging.error(f"Cannot append error to state, state is not a proper dict: {state}")
        except Exception as append_error:
            logging.error(f"Failed to append error to state: {append_error}")
        return state

async def report_formatting_node(state: ScanState) -> ScanState:
    """LangGraph Node 3: Create a fast, focused summary report."""

    try:
        import time
        from datetime import datetime
        scan_start = state.get("scan_start_time", 0)
        current_time = time.time()
        scan_duration = current_time - scan_start if scan_start > 0 else 0

        # Debug logging for scan duration
        logging.info(f"⏱️ Scan timing - Start: {scan_start}, Current: {current_time}, Duration: {scan_duration}s")

        # Debug: Check what's in state when report formatting starts
        gpt_selected_debug = state.get("gpt_selected_services", [])
        logging.info(f"🔍 DEBUG: report_formatting_node received {len(gpt_selected_debug)} selected services in state")

        # Fix scan duration if it's 0 or negative
        if scan_duration <= 0:
            # Check if we have a more recent time calculation
            if scan_start > 0:
                scan_duration = max(1, round(current_time - scan_start, 2))
                logging.info(f"🔧 Fixed scan duration to: {scan_duration}s")
            else:
                scan_duration = 1  # Default minimum
                logging.warning("⚠️ No valid scan start time found, using 1s default")

        # Extract key metrics directly without complex processing
        open_ports = state.get("open_ports", [])
        services = state.get("services", [])
        vulnerabilities = state.get("vulnerabilities", [])
        os_info = state.get("os_information", "Unknown")

        # Debug logging
        logging.info(f"📊 Report formatting - Open ports: {len(open_ports)}, Services: {len(services)}, Vulnerabilities: {len(vulnerabilities)}")
        if services:
            logging.info(f"🔍 Sample service data: {services[0] if services else 'None'}")

        # Extract actual service data from tool results if services state is empty/incorrect
        actual_services = []
        for tool_name, result in state.get("tool_results", {}).items():
            if "version" in tool_name and isinstance(result, dict) and result.get("status") == "success":
                data = result.get("data", {})
                if "services" in data and data["services"]:
                    actual_services = data["services"]
                    logging.info(f"🔧 Found {len(actual_services)} services from {tool_name}")
                    break

        # Use actual services if available, otherwise use state services
        final_services = actual_services if actual_services else services

        # Extract enhanced OS details from tool results - only real data
        os_details = {}

        # Look for OS details in tool results
        for tool_name, result in state.get("tool_results", {}).items():
            if "port" in tool_name and isinstance(result, dict) and result.get("status") == "success":
                # This is likely from nmap results - check if we have enhanced OS data
                if "parsed_data" in result.get("data", {}):
                    parsed_data = result["data"]["parsed_data"]
                    if "hosts" in parsed_data and parsed_data["hosts"]:
                        host = parsed_data["hosts"][0]
                        if "os_details" in host:
                            os_details = host["os_details"]
                            logging.info(f"🖥️ Found OS details: {os_details.get('name', 'No name')}")
                            break

        # Only use OS details if actually found from scan results
        if not os_details:
            os_details = {}

        # Calculate scan coverage
        scan_coverage = {
            "port_range": "1-1000",  # Default for light scan
            "total_ports_scanned": 1000,
            "scan_techniques": ["TCP SYN scan", "OS detection", "Service detection", "CVE lookup"]
        }

        # Determine port range based on scan type
        if state['scan_type'].lower() == 'medium':
            scan_coverage["port_range"] = "1-5000"
            scan_coverage["total_ports_scanned"] = 5000
        elif state['scan_type'].lower() == 'deep':
            scan_coverage["port_range"] = "1-15000"
            scan_coverage["total_ports_scanned"] = 15000

        # Count critical/vulnerable ports (ports with services that have versions)
        critical_ports = []
        vulnerable_ports = []

        for service in final_services:
            if isinstance(service, dict):
                port = service.get("port")
                version = service.get("version")
                if port and version and version.strip():
                    critical_ports.append(port)

        # Count vulnerable ports from CVE results
        total_cves = 0
        cve_details = []

        for vuln_result in vulnerabilities:
            if isinstance(vuln_result, dict):
                vuln_count = vuln_result.get("vulnerabilities_found", 0)
                total_cves += vuln_count

                # Extract CVE details from detailed results
                detailed = vuln_result.get("detailed_results", "")
                if detailed and "CVE ID:" in detailed:
                    vulnerable_ports.extend([p for p in critical_ports])  # All critical ports are potentially vulnerable

        # Extract services data properly - use actual detected services (all of them)
        services_list = []
        for service in final_services:  # Show all discovered services, no limit
            if isinstance(service, dict):
                services_list.append({
                    "port": service.get("port"),
                    "service": service.get("service"),
                    "version": service.get("version"),
                    "protocol": service.get("protocol", "tcp"),
                    "state": service.get("state", "open")
                })

        # Get GPT-selected services for inclusion in JSON - multiple fallback sources (MOVED UP)
        gpt_selected_services = state.get("gpt_selected_services", [])

        # Fallback 1: Check global variable
        if not gpt_selected_services:
            global global_selected_services
            gpt_selected_services = global_selected_services
            logging.info(f"🔍 DEBUG: Using global fallback - found {len(gpt_selected_services)} selected services")

        # Fallback 2: Check tool results for selected services carrier
        if not gpt_selected_services:
            for tool_name, result in state.get("tool_results", {}).items():
                if tool_name == "gpt_selected_services_carrier" and isinstance(result, dict):
                    data = result.get("data", {})
                    if "selected_services" in data:
                        gpt_selected_services = data["selected_services"]
                        logging.info(f"🔍 DEBUG: Using tool result fallback - found {len(gpt_selected_services)} selected services")
                        break

        # Extract CVE data from vulnerability results
        # Determine max CVEs based on number of GPT-selected services (should match)
        max_cves = len(gpt_selected_services) if gpt_selected_services else 999  # No limit if no GPT services

        cve_list = []
        for vuln_result in vulnerabilities:
            if isinstance(vuln_result, dict) and vuln_result.get("detailed_results"):
                detailed = vuln_result.get("detailed_results", "")
                # Parse CVE details from the formatted output
                if "CVE ID:" in detailed:
                    cve_blocks = detailed.split("----------------------------------------")
                    for block in cve_blocks[:max_cves]:  # Limit based on selected services count
                        if "CVE ID:" in block:
                            cve_info = {}
                            lines = block.split('\n')

                            # Parse all lines to find header and extract information
                            for line in lines:
                                line = line.strip()

                                # Look for header line anywhere in the block: [Port: 80 | Service: http | Version: 2.2.8 (Version-Based)]
                                if line.startswith('[Port:') and '|' in line:
                                    parts = line.split('|')
                                    # Extract port
                                    if len(parts) > 0:
                                        port_part = parts[0].replace('[Port:', '').strip()
                                        if port_part:
                                            cve_info['port'] = port_part
                                    # Extract service
                                    if len(parts) > 1:
                                        service_part = parts[1].replace('Service:', '').strip()
                                        if service_part:
                                            cve_info['service'] = service_part

                                # Parse other CVE details
                                elif 'CVE ID:' in line:
                                    cve_info['cve_id'] = line.split('CVE ID:')[1].strip()
                                elif 'Description:' in line:
                                    cve_info['description'] = line.split('Description:')[1].strip()
                                elif 'Impact:' in line:
                                    cve_info['impact'] = line.split('Impact:')[1].strip()
                                elif 'Severity:' in line:
                                    cve_info['severity'] = line.split('Severity:')[1].strip()
                                elif 'CVSS Score:' in line:
                                    cve_info['cvss_score'] = line.split('CVSS Score:')[1].strip()
                            if cve_info.get('cve_id'):
                                cve_list.append(cve_info)

        # Create structured data for GPT to format as JSON
        scan_data = {
            "target": state['target'],
            "scan_type": state['scan_type'],
            "user_id": state.get('user_id', ''),
            "scan_duration": round(scan_duration, 2),
            "scan_coverage": scan_coverage,
            "os": os_info,
            "os_details": os_details,
            "ports_scanned": scan_coverage["total_ports_scanned"],
            "open_ports": len(open_ports),
            "critical_ports": len(set(critical_ports)),
            "vulnerable_ports": len(set(vulnerable_ports)),
            "cves_found": total_cves,
            "services": services_list,
            "gpt_selected_services": gpt_selected_services,
            "vulnerabilities": cve_list
        }

        # Debug: Log the data being sent to GPT
        logging.info(f"📤 Sending to GPT - Scan duration: {scan_data.get('scan_duration', 0)}s")
        logging.info(f"📤 Sending to GPT - Services count: {len(scan_data.get('services', []))}")
        logging.info(f"📤 Sending to GPT - GPT selected services count: {len(scan_data.get('gpt_selected_services', []))}")
        logging.info(f"📤 Sending to GPT - OS info: {scan_data.get('os_details', {}).get('name', 'None')}")
        logging.info(f"📤 Sending to GPT - CVEs: {scan_data.get('cves_found', 0)}")

        # Create compact summary for GPT instead of full data
        compact_data = {
            "target": scan_data["target"],
            "scan_type": scan_data["scan_type"],
            "scan_duration": scan_data["scan_duration"],
            "ports_scanned": scan_data["ports_scanned"],
            "open_ports": scan_data["open_ports"],
            "critical_ports": scan_data["critical_ports"],
            "vulnerable_ports": scan_data["vulnerable_ports"],
            "cves_found": scan_data["cves_found"],
            "port_range": scan_data["scan_coverage"]["port_range"],
            "os_data": scan_data["os_details"] if scan_data["os_details"] else {},
            "services_count": len(scan_data["services"]),
            "vuln_count": len(scan_data["vulnerabilities"])
        }

        # Fast GPT call to format as clean JSON
        llm = get_llm()

        # Create compact services string (first 5 services)
        services_str = str(scan_data["services"][:5]) if scan_data["services"] else "[]"
        vulns_str = str(scan_data["vulnerabilities"][:3]) if scan_data["vulnerabilities"] else "[]"

        prompt = f"""Format scan data as complete JSON report:

Stats: {compact_data['target']} | {compact_data['scan_type']} scan | {compact_data['scan_duration']}s
Ports: {compact_data['open_ports']}/{compact_data['ports_scanned']} open | CVEs: {compact_data['cves_found']}
OS: {compact_data['os_data']}
Services (top 5): {services_str}
Vulnerabilities (top 3): {vulns_str}

Based on the scan data with {compact_data['open_ports']} open ports and {compact_data['cves_found']} CVEs found, calculate appropriate risk score 1-10 and generate recommendations.

IMPORTANT: risk_score must be a NUMBER between 1-10 (not a string). Calculate based on:
- Number of CVEs found (more CVEs = higher score)
- Number of open/vulnerable ports (more ports = higher score)
- Severity of vulnerabilities

risk_level must be one of: "low", "medium", "high", "critical"

Return complete valid JSON:

{{
  "summary": {{
    "target": "{compact_data['target']}",
    "scan_type": "{compact_data['scan_type']}",
    "scan_duration": {compact_data['scan_duration']},
    "timestamp": "current_timestamp",
    "ports_scanned": {compact_data['ports_scanned']},
    "open_ports": {compact_data['open_ports']},
    "critical_ports": {compact_data['critical_ports']},
    "vulnerable_ports": {compact_data['vulnerable_ports']},
    "cves_found": {compact_data['cves_found']},
    "risk_score": calculate_numeric_value_1_to_10,
    "risk_level": "low_medium_high_or_critical"
  }},
  "scan_coverage": {{
    "port_range": "{compact_data['port_range']}",
    "total_ports_scanned": {compact_data['ports_scanned']},
    "scan_techniques": ["TCP SYN scan", "OS detection", "Service detection", "CVE lookup"]
  }},
  "os_information": {json.dumps(compact_data['os_data']) if compact_data['os_data'] else "{}"},
  "risk_assessment": {{
    "risk_score": use_same_numeric_value_as_summary_risk_score,
    "risk_level": use_same_value_as_summary_risk_level,
    "recommendations": ["generate", "array", "of", "specific", "security", "recommendations"]
  }},
  "services": {json.dumps(scan_data["services"]) if scan_data["services"] else "[]"},
  "gpt_selected_services": {json.dumps(scan_data["gpt_selected_services"]) if scan_data["gpt_selected_services"] else "[]"},
  "vulnerabilities": {json.dumps(scan_data["vulnerabilities"]) if scan_data["vulnerabilities"] else "[]"}
}}"""

        response = await asyncio.to_thread(llm.invoke, [HumanMessage(content=prompt)])
        gpt_json_response = response.content

        # Debug: Log the GPT response length and first part
        logging.info(f"📥 GPT response length: {len(gpt_json_response)} characters")
        logging.info(f"📥 GPT response starts with: {gpt_json_response[:200]}")
        logging.info(f"📥 GPT response ends with: {gpt_json_response[-200:]}")

        # Parse and validate the JSON response
        try:
            # Clean the response - sometimes GPT includes extra text
            json_start = gpt_json_response.find('{')
            json_end = gpt_json_response.rfind('}') + 1

            if json_start >= 0 and json_end > json_start:
                clean_json = gpt_json_response[json_start:json_end]
                formatted_data = json.loads(clean_json)

                # Add real timestamp and user_id
                if "summary" in formatted_data:
                    formatted_data["summary"]["timestamp"] = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
                    formatted_data["summary"]["user_id"] = state.get('user_id', '')

                logging.info("✅ Successfully parsed GPT JSON response")

                # ALWAYS ensure GPT-selected services are included (use the fallback-resolved variable)
                formatted_data["gpt_selected_services"] = gpt_selected_services
                logging.info(f"🎯 Added {len(gpt_selected_services)} selected services to formatted data")
            else:
                raise json.JSONDecodeError("No valid JSON found", gpt_json_response, 0)

        except json.JSONDecodeError as e:
            # If GPT fails to return valid JSON, log the error and create structured fallback
            logging.error(f"❌ GPT JSON parsing failed: {e}")
            logging.error(f"📝 Raw GPT response: {gpt_json_response}")

            formatted_data = {
                "error": "GPT JSON parsing failed",
                "raw_gpt_response": gpt_json_response,
                "summary": {
                    "target": state['target'],
                    "scan_type": state['scan_type'],
                    "user_id": state.get('user_id', ''),
                    "scan_duration": round(scan_duration, 2),
                    "timestamp": datetime.now().strftime("%Y-%m-%d %H:%M:%S"),
                    "ports_scanned": scan_coverage["total_ports_scanned"],
                    "open_ports": len(open_ports),
                    "critical_ports": len(set(critical_ports)),
                    "vulnerable_ports": len(set(vulnerable_ports)),
                    "cves_found": total_cves,
                    "risk_score": 0,
                    "risk_level": "unknown"
                },
                "scan_coverage": scan_coverage,
                "os_information": os_details if os_details else {},
                "risk_assessment": {
                    "risk_score": 0,
                    "risk_level": "unknown",
                    "recommendations": ["GPT processing failed"]
                },
                "services": services_list,
                "gpt_selected_services": state.get("gpt_selected_services", []),
                "vulnerabilities": cve_list
            }

        # Create result folder using settings
        result_folder = settings.results_dir
        os.makedirs(result_folder, exist_ok=True)

        # Save JSON to file for PDF generator and frontend with meaningful name including scan_id
        timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
        target_clean = state['target'].replace('.', '_').replace(':', '_')
        scan_type = state['scan_type']
        user_id = state.get('user_id', 'unknown')
        scan_id = state.get('scan_id', 'unknown')
        json_filename = f"{result_folder}/{user_id}_{target_clean}_{scan_type}_{scan_id}_scan_{timestamp}.json"

        try:
            with open(json_filename, "w", encoding="utf-8") as f:
                json.dump(formatted_data, f, indent=2, ensure_ascii=False)
            scanning_logger.file_generated("json", json_filename, state['target'])
        except Exception as save_error:
            logging.error(f"Failed to save JSON file: {save_error}")

        # Enhance the .txt file with JSON data for PDF generation
        global txt_file_path
        if txt_file_path and os.path.exists(txt_file_path):
            try:
                # Read existing CVE content
                with open(txt_file_path, "r", encoding="utf-8") as f:
                    existing_content = f.read()

                # Create meaningful name for the final .txt file including scan_id
                target_clean = state['target'].replace('.', '_').replace(':', '_')
                scan_type = state['scan_type']
                user_id = state.get('user_id', 'unknown')
                scan_id = state.get('scan_id', 'unknown')
                final_txt_filename = f"{result_folder}/{user_id}_{target_clean}_{scan_type}_{scan_id}_report_{timestamp}.txt"

                # Write enhanced content with JSON data to final file
                with open(final_txt_filename, "w", encoding="utf-8") as f:
                    # Write summary section
                    f.write("NETWORK SECURITY SCAN REPORT\n")
                    f.write("=" * 80 + "\n\n")

                    if "summary" in formatted_data:
                        summary = formatted_data["summary"]
                        f.write("SCAN SUMMARY:\n")
                        f.write(f"Target: {summary.get('target', 'N/A')}\n")
                        f.write(f"User ID: {summary.get('user_id', 'N/A')}\n")
                        f.write(f"Scan Type: {summary.get('scan_type', 'N/A')}\n")
                        f.write(f"Scan Duration: {summary.get('scan_duration', 'N/A')}s\n")
                        f.write(f"Timestamp: {summary.get('timestamp', 'N/A')}\n")
                        f.write(f"Ports Scanned: {summary.get('ports_scanned', 'N/A')}\n")
                        f.write(f"Open Ports: {summary.get('open_ports', 'N/A')}\n")
                        f.write(f"Critical Ports: {summary.get('critical_ports', 'N/A')}\n")
                        f.write(f"CVEs Found: {summary.get('cves_found', 'N/A')}\n")
                        f.write(f"Risk Score: {summary.get('risk_score', 'N/A')}/10\n")
                        f.write(f"Risk Level: {summary.get('risk_level', 'N/A')}\n")
                        f.write("\n")

                    # Write detected services (all discovered services)
                    if "services" in formatted_data and formatted_data["services"]:
                        f.write("DETECTED SERVICES:\n")
                        services = formatted_data["services"]
                        for service in services:
                            if isinstance(service, dict):
                                port = service.get('port', 'N/A')
                                svc_name = service.get('service', 'N/A')
                                version = service.get('version', 'N/A')
                                protocol = service.get('protocol', 'tcp')
                                f.write(f"  Port {port}/{protocol}: {svc_name} {version}\n")
                        f.write("\n")

                    # Write GPT-selected services for CVE lookup (use the resolved gpt_selected_services variable)
                    if gpt_selected_services:
                        f.write("SELECTED SERVICES FOR CVE LOOKUP:\n")
                        for service in gpt_selected_services:
                            if isinstance(service, dict):
                                port = service.get('port', 'N/A')
                                svc_name = service.get('service', 'N/A')
                                version = service.get('version', 'N/A')
                                f.write(f"  Port {port}: {svc_name} {version}\n")
                        f.write("\n")

                    # Write the original CVE content (without duplication)
                    f.write(existing_content.replace("CVE Vulnerability Scan Results", "CVE VULNERABILITY DETAILS"))

                # Remove the temporary file
                try:
                    os.remove(txt_file_path)
                except:
                    pass  # Ignore if file removal fails

                scanning_logger.file_generated("txt", final_txt_filename, state['target'])
                txt_file_path = final_txt_filename  # Update the path for state

            except Exception as e:
                logging.error(f"Failed to enhance .txt file: {e}")
        else:
            logging.warning("No .txt file path found to enhance")

        # Store both JSON data and file path in state
        state["formatted_report"] = json.dumps(formatted_data, indent=2)
        state["scan_results_json"] = formatted_data  # For direct API access
        state["json_file_path"] = json_filename
        state["status"] = "completed"

        # Log meaningful scan completion
        scan_duration = state.get('scan_duration', 0)
        scanning_logger.scan_completed(state.get('scan_id', 'unknown'), state['target'], scan_duration)

        state["messages"].append(HumanMessage(content=f"Report completed: {len(open_ports)} ports, {total_cves} CVEs"))

        return state

    except Exception as e:
        # Fallback to structured JSON without GPT
        open_ports = state.get("open_ports", [])
        services = state.get("services", [])
        vulnerabilities = state.get("vulnerabilities", [])
        total_cves = sum(v.get("vulnerabilities_found", 0) for v in vulnerabilities if isinstance(v, dict))

        # Create fallback JSON structure
        fallback_data = {
            "summary": {
                "target": state['target'],
                "scan_type": state['scan_type'],
                "user_id": state.get('user_id', ''),
                "os": state.get('os_information', 'Unknown'),
                "timestamp": datetime.now().strftime("%Y-%m-%d %H:%M:%S"),
                "ports_scanned": len(open_ports),
                "open_ports": len(open_ports),
                "critical_ports": 0,
                "vulnerable_ports": 0,
                "cves_found": total_cves,
                "error": f"Report generation error: {str(e)}"
            },
            "services": [
                {
                    "port": s.get('port', 0),
                    "service": s.get('service', 'unknown'),
                    "version": s.get('version', 'unknown'),
                    "protocol": s.get('protocol', 'tcp')
                }
                for s in services if isinstance(s, dict)
            ],
            "vulnerabilities": []
        }

        # Create result folder if it doesn't exist
        result_folder = settings.results_dir
        os.makedirs(result_folder, exist_ok=True)

        # Save fallback JSON to file with meaningful name
        timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
        target_clean = state.get('target', 'unknown').replace('.', '_').replace(':', '_')
        scan_type = state.get('scan_type', 'unknown')
        user_id = state.get('user_id', 'unknown')
        json_filename = f"{result_folder}/{user_id}_{target_clean}_{scan_type}_scan_{timestamp}_error.json"

        try:
            with open(json_filename, "w", encoding="utf-8") as f:
                json.dump(fallback_data, f, indent=2, ensure_ascii=False)
            logging.info(f"📄 Fallback scan results saved to: {json_filename}")
        except Exception as save_error:
            logging.error(f"Failed to save fallback JSON file: {save_error}")

        state["formatted_report"] = json.dumps(fallback_data, indent=2)
        state["scan_results_json"] = fallback_data
        state["json_file_path"] = json_filename
        state["status"] = "completed_with_errors"
        state["errors"].append(f"Report formatting failed: {str(e)}")

        return state

# --- 5. LANGGRAPH WORKFLOW CREATION ---
def create_scan_workflow() -> StateGraph:
    """Create the LangGraph workflow for scanning."""

    # Create the workflow
    workflow = StateGraph(ScanState)

    # Add nodes
    workflow.add_node("tool_selection", tool_selection_node)
    workflow.add_node("tool_execution", tool_execution_node)
    workflow.add_node("report_formatting", report_formatting_node)

    # Define the flow
    workflow.set_entry_point("tool_selection")
    workflow.add_edge("tool_selection", "tool_execution")
    workflow.add_edge("tool_execution", "report_formatting")
    workflow.add_edge("report_formatting", END)

    # Compile the workflow
    compiled_workflow = workflow.compile()

    return compiled_workflow

# Global workflow instance
_workflow = None

def get_workflow():
    """Get or create the workflow instance."""
    global _workflow
    if _workflow is None:
        _workflow = create_scan_workflow()
    return _workflow

# --- 6. MAIN EXECUTION CONTROLLER ---
async def execute_scan_with_controller(scan_type: str, target: str, user_id: str = "unknown", scan_id: str = None) -> dict:
    """Main scan execution using LangGraph StateGraph workflow."""
    global txt_file_path

    try:
        # Reset all global variables for clean scan state
        reset_scan_globals()

        import time
        scan_start_time = time.time()

        # Generate scan_id if not provided
        if scan_id is None:
            import uuid
            scan_id = str(uuid.uuid4())

        # Initialize state with timing information
        initial_state: ScanState = {
            "target": target,
            "scan_type": scan_type,
            "user_id": user_id,
            "scan_id": scan_id,
            "messages": [SystemMessage(content=f"Starting {scan_type} scan on {target} for user {user_id} (scan_id: {scan_id})")],
            "selected_tools": [],
            "tool_results": {},
            "open_ports": [],
            "services": [],
            "vulnerabilities": [],
            "os_information": "",
            "formatted_report": "",
            "status": "running",
            "errors": [],
            "scan_start_time": scan_start_time
        }

        # Get workflow and execute
        workflow = get_workflow()
        final_state = await workflow.ainvoke(initial_state)

        # Convert final state to expected output format
        final_result = {
            "target": final_state["target"],
            "scan_type": final_state["scan_type"],
            "user_id": final_state["user_id"],
            "status": final_state["status"],
            "scan_results": final_state.get("scan_results_json", {}),  # Structured JSON for frontend
            "json_file_path": final_state.get("json_file_path", ""),  # File path for PDF generator
            "txt_file_path": txt_file_path if txt_file_path else "",  # TXT file path for GPT report generation
            "open_ports": final_state["open_ports"],
            "services_detected": final_state["services"],
            "vulnerabilities": final_state["vulnerabilities"],
            "formatted_report": final_state["formatted_report"],  # JSON string
            "execution_summary": {
                "total_tools": len(final_state["selected_tools"]),
                "successful_tools": len([r for r in final_state["tool_results"].values() if isinstance(r, dict) and r.get("status") == "success"]),
                "failed_tools": len([r for r in final_state["tool_results"].values() if isinstance(r, dict) and r.get("status") == "failed"]),
                "errors": final_state["errors"]
            },
            "workflow_messages": [msg.content for msg in final_state["messages"] if hasattr(msg, 'content')]
        }

        return final_result

    except Exception as e:
        return {
            "target": target,
            "scan_type": scan_type,
            "user_id": user_id,
            "status": "failed",
            "error": str(e),
            "open_ports": [],
            "services_detected": [],
            "vulnerabilities": [],
            "recommendations": ["Scan failed - check system configuration"],
            "workflow_error": str(e),
            "json_file_path": "",
            "txt_file_path": txt_file_path if txt_file_path else ""
        }