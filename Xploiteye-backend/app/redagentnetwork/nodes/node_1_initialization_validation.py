"""
Node 1: Initialization & Validation
Validates target accessibility and prerequisites before exploitation
"""

import subprocess
import os
from datetime import datetime
from typing import Dict
from dotenv import load_dotenv

# Import utilities
import sys
from pathlib import Path
sys.path.append(str(Path(__file__).parent.parent))

from ..utils.session_manager import create_session_directory
from ..utils.msf_client import connect_to_msf_rpc
from ..utils.logging_setup import setup_logger, log_node_start, log_node_end, log_check


# Load environment variables
load_dotenv()


def node_1_initialization_validation(state: Dict) -> Dict:
    """
    Node 1: Initialize and validate target before exploitation.

    Performs 6 steps:
        0. Create session directory structure
        1. Check target reachability (ping/arping)
        2. Check port accessibility (nmap)
        3. Connect to Metasploit RPC
        4. Verify service (optional)
        5. Detect operating system (nmap)

    Args:
        state: Red Agent state containing target, port, service, version

    Returns:
        Updated state with validation results

    State updates:
        - session_dir, log_file, report_dir, etc. (from session creation)
        - validated: True/False
        - validation_errors: List of error messages
        - target_reachable, port_open, msf_rpc_connected: Check results
        - os_type, os_detection_method: OS detection results
        - msf_client: Metasploit RPC client instance
        - start_time: Workflow start timestamp
    """

    # Initialize validation state
    state.setdefault("validated", False)
    state.setdefault("validation_errors", [])
    state["agent_version"] = "1.0.0"
    state["start_time"] = datetime.now()

    # ═══════════════════════════════════════════════════════════════════
    # STEP 0: CREATE SESSION DIRECTORY STRUCTURE
    # ═══════════════════════════════════════════════════════════════════
    try:
        state = create_session_directory(state)
        print(f"\n📁 Session directory created: {state['session_name']}\n")
    except Exception as e:
        state["validation_errors"].append(f"Failed to create session directory: {str(e)}")
        return state

    # Setup logger (now that session directory exists)
    try:
        logger = setup_logger(state["log_file"])
    except Exception as e:
        print(f"⚠️  Warning: Failed to setup logger: {e}")
        print(f"Continuing without file logging...\n")
        import logging
        logger = logging.getLogger("red_agent")
        logger.setLevel(logging.INFO)
        # Only add handler if one doesn't already exist to avoid duplicates
        if not logger.handlers:
            handler = logging.StreamHandler()
            handler.setFormatter(logging.Formatter("[%(asctime)s] [%(levelname)s] %(message)s"))
            logger.addHandler(handler)

    # Log node start
    log_node_start(logger, "INITIALIZATION & VALIDATION", 1)

    logger.info(f"Target: {state['target']}:{state['port']}")
    logger.info(f"Service: {state.get('service', 'unknown')} {state.get('version', '')}")
    logger.info(f"CVE IDs: {', '.join(state.get('cve_ids', []))}")
    logger.info(f"Session: {state['session_name']}")
    logger.info("")

    # Get timeout from environment
    connection_timeout = int(os.getenv("CONNECTION_TIMEOUT", "2"))

    # ═══════════════════════════════════════════════════════════════════
    # STEP 1: TARGET REACHABILITY CHECK
    # ═══════════════════════════════════════════════════════════════════
    logger.info("CHECK #1: Target Reachability")

    target_reachable = False

    try:
        # Try arping first (more reliable for local networks, but needs root)
        cmd = ["arping", "-c", "1", "-W", "5", state["target"]]

        result = subprocess.run(
            cmd,
            capture_output=True,
            text=True,
            timeout=connection_timeout
        )

        # Check if arping succeeded
        if result.returncode == 0:
            target_reachable = True
            state["target_reachable"] = True
            log_check(logger, "Target reachable", True, f"{state['target']} is online (arping)")
        else:
            # arping failed (likely permissions), fall back to ping
            if "run as root" in result.stderr or "permission" in result.stderr.lower():
                logger.warning("arping needs root privileges, falling back to ping...")
            else:
                logger.warning("arping failed, trying ping...")

            # Fall back to ping
            cmd = ["ping", "-c", "1", "-W", str(connection_timeout), state["target"]]
            result = subprocess.run(cmd, capture_output=True, text=True, timeout=connection_timeout)

            target_reachable = result.returncode == 0
            state["target_reachable"] = target_reachable

            if target_reachable:
                log_check(logger, "Target reachable", True, f"{state['target']} is online (ping)")
            else:
                log_check(logger, "Target reachable", False, f"{state['target']} is offline")
                state["validation_errors"].append("Target is unreachable")
                log_node_end(logger, "Node 1", False)
                return state

    except FileNotFoundError:
        # arping not found, try ping
        logger.warning("arping not found, trying ping...")
        try:
            cmd = ["ping", "-c", "1", "-W", str(connection_timeout), state["target"]]
            result = subprocess.run(cmd, capture_output=True, text=True, timeout=connection_timeout)

            target_reachable = result.returncode == 0
            state["target_reachable"] = target_reachable

            if target_reachable:
                log_check(logger, "Target reachable", True, f"{state['target']} is online (ping)")
            else:
                log_check(logger, "Target reachable", False, f"{state['target']} is offline")
                state["validation_errors"].append("Target is unreachable")
                log_node_end(logger, "Node 1", False)
                return state

        except Exception as e:
            log_check(logger, "Target reachability", False, f"Error: {str(e)}")
            state["validation_errors"].append(f"Reachability check failed: {str(e)}")
            log_node_end(logger, "Node 1", False)
            return state

    except Exception as e:
        log_check(logger, "Target reachability", False, f"Error: {str(e)}")
        state["validation_errors"].append(f"Reachability check failed: {str(e)}")
        log_node_end(logger, "Node 1", False)
        return state

    # ═══════════════════════════════════════════════════════════════════
    # STEP 2: PORT ACCESSIBILITY CHECK
    # ═══════════════════════════════════════════════════════════════════
    logger.info("CHECK #2: Port Accessibility")

    try:
        cmd = ["nmap", "-Pn", "-p", str(state["port"]), state["target"], "-T4"]

        result = subprocess.run(
            cmd,
            capture_output=True,
            text=True,
            timeout=connection_timeout + 5
        )

        # Check if port is open in output
        port_open = "open" in result.stdout.lower()

        state["port_open"] = port_open

        if port_open:
            log_check(logger, "Port accessible", True, f"Port {state['port']} is open")
        else:
            log_check(logger, "Port accessible", False, f"Port {state['port']} is closed/filtered")
            state["validation_errors"].append(f"Port {state['port']} is not accessible")
            log_node_end(logger, "Node 1", False)
            return state

    except FileNotFoundError:
        log_check(logger, "Port accessibility", False, "nmap not found - install nmap")
        state["validation_errors"].append("nmap not installed")
        log_node_end(logger, "Node 1", False)
        return state

    except Exception as e:
        log_check(logger, "Port accessibility", False, f"Error: {str(e)}")
        state["validation_errors"].append(f"Port check failed: {str(e)}")
        log_node_end(logger, "Node 1", False)
        return state

    # ═══════════════════════════════════════════════════════════════════
    # STEP 3: METASPLOIT RPC CONNECTION
    # ═══════════════════════════════════════════════════════════════════
    logger.info("CHECK #3: Metasploit RPC Connection")

    client, error = connect_to_msf_rpc()

    if error:
        log_check(logger, "Metasploit RPC", False, "Connection failed")
        logger.error(error)
        state["msf_rpc_connected"] = False
        state["validation_errors"].append("Metasploit RPC not accessible")
        log_node_end(logger, "Node 1", False)
        return state

    # Connection successful
    try:
        version = client.core.version["version"]
        log_check(logger, "Metasploit RPC", True, f"Connected (v{version})")
        state["msf_rpc_connected"] = True
        state["msf_client"] = client
    except:
        log_check(logger, "Metasploit RPC", False, "Connected but unable to get version")
        state["msf_rpc_connected"] = False
        state["validation_errors"].append("Metasploit RPC connection unstable")
        log_node_end(logger, "Node 1", False)
        return state

    # ═══════════════════════════════════════════════════════════════════
    # STEP 4: SERVICE VERIFICATION (OPTIONAL)
    # ═══════════════════════════════════════════════════════════════════
    if state.get("service"):
        logger.info("CHECK #4: Service Verification")

        try:
            cmd = ["nmap", "-sV", "-p", str(state["port"]), state["target"]]

            result = subprocess.run(
                cmd,
                capture_output=True,
                text=True,
                timeout=connection_timeout + 10
            )

            # Parse output to verify service
            expected_service = state["service"].lower()
            detected_service_match = expected_service in result.stdout.lower()

            if detected_service_match:
                log_check(logger, "Service verification", True, f"Confirmed {state['service']}")
                state["service_verified"] = True
            else:
                logger.warning(f"⚠️  Expected {state['service']}, but service details differ")
                logger.warning("Continuing anyway (service may have changed)")
                state["service_verified"] = False

        except Exception as e:
            logger.warning(f"⚠️  Service verification failed: {str(e)}")
            logger.warning("Continuing anyway")
            state["service_verified"] = False

    # ═══════════════════════════════════════════════════════════════════
    # STEP 5: OS DETECTION
    # ═══════════════════════════════════════════════════════════════════
    logger.info("CHECK #5: Operating System Detection")

    try:
        cmd = ["nmap", "-O", state["target"], "--osscan-guess"]

        result = subprocess.run(
            cmd,
            capture_output=True,
            text=True,
            timeout=connection_timeout + 10
        )

        # Parse OS details from output
        os_detected = False
        for line in result.stdout.split("\n"):
            if "OS details:" in line:
                os_type = line.split("OS details:")[1].strip()
                state["os_type"] = os_type
                state["os_detection_method"] = "nmap"
                log_check(logger, "OS detection", True, os_type)
                os_detected = True
                break

        if not os_detected:
            logger.warning("⚠️  OS detection failed, defaulting to 'linux'")
            state["os_type"] = "linux"
            state["os_detection_method"] = "default"

    except Exception as e:
        logger.warning(f"⚠️  OS detection failed: {str(e)}")
        logger.warning("Defaulting to 'linux'")
        state["os_type"] = "linux"
        state["os_detection_method"] = "default"

    # ═══════════════════════════════════════════════════════════════════
    # FINAL: MARK VALIDATION AS SUCCESSFUL
    # ═══════════════════════════════════════════════════════════════════
    state["validated"] = True

    logger.info("")
    logger.info("✅ All validation checks passed!")
    logger.info(f"Session directory: {state['session_dir']}")
    logger.info(f"Log file: {state['log_file']}")

    log_node_end(logger, "Node 1", True)

    return state
