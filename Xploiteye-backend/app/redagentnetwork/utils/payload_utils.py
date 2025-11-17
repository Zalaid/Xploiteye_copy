"""
Payload Selection Utilities
Helper functions for Node 4: Payload Selection & Configuration
"""

from typing import List
import logging
import os
import subprocess
import re
import random
import socket


def get_lhost_hybrid() -> str:
    """
    Get LHOST using hybrid approach: Environment variable → ifconfig fallback.

    ═══════════════════════════════════════════════════════════════════════════
    PURPOSE - Why do we need this function?
    ═══════════════════════════════════════════════════════════════════════════

    PROBLEM:
        For reverse shells to work, we need YOUR attacker machine's IP address!

        Example scenario:
            Target (192.168.1.100) ← exploit ← You (???.???.???.???)

            Q: What IP should target connect to?
            A: YOUR IP! But what is it?

        Without LHOST:
            ❌ Exploit runs, but target doesn't know where to connect back
            ❌ Session never opens (target just sits there confused)
            ❌ You wait forever, nothing happens

    SOLUTION:
        Method 1: User sets METASPLOIT_LHOST environment variable (reliable!)
        Method 2: Auto-detect with ifconfig command (fallback)

    HOW IT HELPS:
        ✅ AUTOMATIC: No need to manually type IP every time
        ✅ FLEXIBLE: User can override with env variable
        ✅ RELIABLE: Fallback if env not set
        ✅ SMART: Skips localhost (127.0.0.1) - that won't work!

    WHEN IT'S USED:
        Called by node_4_payload_selection() to configure payload options

    ═══════════════════════════════════════════════════════════════════════════

    Returns:
        str: Local IP address (e.g., "192.168.1.50") or None if failed

    Example 1 - Environment variable (PREFERRED):
        Input:  Environment: METASPLOIT_LHOST=192.168.1.50
        Code:   lhost = os.getenv('METASPLOIT_LHOST')  # "192.168.1.50"
        Output: "192.168.1.50" ✅
        Why preferred: User explicitly set it, most reliable

    Example 2 - Auto-detect with ifconfig (FALLBACK):
        Input:  ifconfig output:
                    eth0: inet 192.168.1.50
                    lo: inet 127.0.0.1
                    tun0: inet 10.10.14.5
        Code:   Extract IPs: ["192.168.1.50", "127.0.0.1", "10.10.14.5"]
                Skip 127.0.0.1 (localhost)
                Return first valid IP: "192.168.1.50"
        Output: "192.168.1.50" ✅

    Example 3 - Multiple interfaces:
        Input:  eth0: 192.168.1.50
                tun0: 10.10.14.5 (VPN)
        Code:   Returns: "192.168.1.50" (first non-localhost IP)
        Note:   If you want tun0, set METASPLOIT_LHOST=10.10.14.5 env variable!

    Example 4 - Failed detection:
        Input:  No valid IPs found (only 127.0.0.1)
        Output: None ❌
        Result: Node 4 will return error and halt

    What it does: Tries environment variable first, then auto-detect with ifconfig,
                  returns IP address or None if both fail.
    """
    logger = logging.getLogger("red_agent.node_4")

    # Method 1: Environment variable (PREFERRED - User control)
    lhost = os.getenv('METASPLOIT_LHOST')
    if lhost:
        logger.info(f"Using LHOST from environment: {lhost}")
        return lhost

    # Method 2: Auto-detect with ifconfig (FALLBACK - Automatic)
    logger.info("METASPLOIT_LHOST not set, attempting auto-detection...")

    try:
        # Run ifconfig command
        result = subprocess.run(
            ['ifconfig'],
            capture_output=True,
            text=True,
            timeout=5
        )

        # Extract all IP addresses
        # Pattern matches: inet 192.168.1.50
        pattern = r'inet (\d+\.\d+\.\d+\.\d+)'
        ips = re.findall(pattern, result.stdout)

        # Find first non-localhost IP
        for ip in ips:
            if not ip.startswith('127.'):  # Skip localhost
                logger.info(f"Auto-detected LHOST: {ip}")
                return ip

        # All IPs were localhost
        logger.error("Only localhost (127.0.0.1) found - cannot use for reverse shell")
        return None

    except subprocess.TimeoutExpired:
        logger.error("ifconfig command timed out")
        return None
    except FileNotFoundError:
        logger.error("ifconfig command not found (try: apt install net-tools)")
        return None
    except Exception as e:
        logger.error(f"LHOST auto-detection failed: {e}")
        return None


def get_available_lport(start_port: int = 4444, end_port: int = 9999, max_attempts: int = 3) -> int:
    """
    Get an available local port for reverse shell listener.

    ═══════════════════════════════════════════════════════════════════════════
    PURPOSE - Why do we need this function?
    ═══════════════════════════════════════════════════════════════════════════

    PROBLEM:
        We need a PORT on OUR machine to listen for reverse shell connections.

        What if the port is already in use?
            ❌ Port 4444 in use by another session
            ❌ Metasploit says "Address already in use"
            ❌ Exploit fails before even starting

        Example scenario:
            You: "Use port 4444 for reverse shell"
            Metasploit: "Error: Port 4444 already in use by another process"
            You: "Ugh, now I have to pick another port manually..."

    SOLUTION:
        Pick a RANDOM high port (4444-9999) and CHECK if it's available!

    HOW IT HELPS:
        ✅ AUTOMATIC: No need to manually check ports
        ✅ RANDOM: Security by obscurity (harder to predict)
        ✅ SAFE: Verifies port is free before using
        ✅ FALLBACK: Tries 3 times if first port busy

    WHEN IT'S USED:
        Called by node_4_payload_selection() to set LPORT

    ═══════════════════════════════════════════════════════════════════════════

    Args:
        start_port: Minimum port number (default: 4444)
        end_port: Maximum port number (default: 9999)
        max_attempts: How many ports to try (default: 3)

    Returns:
        int: Available port number (e.g., 4567) or None if all attempts failed

    Example 1 - First port available:
        Input:  Random port = 4567
        Code:   socket.bind(('0.0.0.0', 4567))  # Success! ✅
        Output: 4567

    Example 2 - First port busy, second works:
        Input:  Random port = 4444 (busy)
        Code:   socket.bind(('0.0.0.0', 4444))  # OSError: Address in use
                Try again: Random port = 7821
                socket.bind(('0.0.0.0', 7821))  # Success! ✅
        Output: 7821

    Example 3 - All 3 attempts failed:
        Input:  All random ports busy (very rare!)
        Output: None ❌
        Result: Metasploit will auto-select available port (not critical)

    What it does: Generates random ports, tests if available, returns first free port.
    """
    logger = logging.getLogger("red_agent.node_4")

    for attempt in range(max_attempts):
        # Generate random port in range
        lport = random.randint(start_port, end_port)

        try:
            # Try to bind to port (test if available)
            test_socket = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
            test_socket.bind(('0.0.0.0', lport))
            test_socket.close()

            logger.info(f"LPORT {lport} is available")
            return lport

        except OSError:
            logger.warning(f"LPORT {lport} is in use, trying another... (attempt {attempt + 1}/{max_attempts})")
            continue

    # All attempts failed
    logger.warning(f"Could not find available port after {max_attempts} attempts")
    logger.info("Metasploit will auto-select available port")
    return random.randint(start_port, end_port)  # Return anyway, MSF will handle


def filter_linux_payloads(all_payloads: List[str]) -> List[str]:
    """
    Filter payloads to include ONLY Linux/Unix compatible ones.

    ═══════════════════════════════════════════════════════════════════════════
    PURPOSE - Why do we need this function?
    ═══════════════════════════════════════════════════════════════════════════

    PROBLEM:
        Metasploit gives us ALL compatible payloads, but many are for Windows!

        Example from vsftpd exploit:
            ✅ cmd/unix/interact          ← Linux/Unix (works!)
            ✅ linux/x64/shell/reverse_tcp ← Linux (works!)
            ❌ windows/meterpreter/reverse_tcp ← Windows (WON'T work on Linux!)
            ❌ windows/x64/shell/reverse_tcp   ← Windows (WON'T work!)

        If we try Windows payloads on Linux target:
            ❌ Exploit runs but payload fails
            ❌ "Payload failed to execute" error
            ❌ Wasted 2 minutes per payload
            ❌ Try 5 Windows payloads = 10 minutes WASTED!

    SOLUTION:
        FILTER to keep ONLY Linux/Unix payloads!

    HOW IT HELPS:
        ✅ SAVES TIME: Don't try payloads that CAN'T work
        ✅ INCREASES SUCCESS: Only try payloads compatible with target
        ✅ CLEANER LIST: 15 compatible payloads instead of 50 mixed

    KEYWORDS WE LOOK FOR:
        ✅ "linux"     - linux/x64/meterpreter/reverse_tcp
        ✅ "unix"      - cmd/unix/interact
        ✅ "cmd/unix"  - cmd/unix/reverse_bash
        ✅ "generic"   - generic/shell_reverse_tcp

    WHEN IT'S USED:
        Called by node_4_payload_selection() after getting all compatible payloads

    ═══════════════════════════════════════════════════════════════════════════

    Args:
        all_payloads: Full list of compatible payloads from Metasploit

    Returns:
        List of Linux/Unix compatible payloads only

    Example 1 - Mixed payloads (before filtering):
        Input:  [
                    "cmd/unix/interact",
                    "linux/x64/meterpreter/reverse_tcp",
                    "linux/x86/shell/reverse_tcp",
                    "windows/meterpreter/reverse_tcp",  ← Windows!
                    "windows/x64/shell/reverse_tcp",    ← Windows!
                    "cmd/unix/reverse_bash",
                    "generic/shell_reverse_tcp"
                ]
        Output: [
                    "cmd/unix/interact",                ✅
                    "linux/x64/meterpreter/reverse_tcp", ✅
                    "linux/x86/shell/reverse_tcp",       ✅
                    "cmd/unix/reverse_bash",             ✅
                    "generic/shell_reverse_tcp"          ✅
                ]
        Filtered out: 2 Windows payloads ❌

    Example 2 - All Linux (no filtering needed):
        Input:  [
                    "linux/x64/meterpreter/reverse_tcp",
                    "linux/x64/shell/reverse_tcp",
                    "cmd/unix/interact"
                ]
        Output: Same list (all pass filter) ✅

    Example 3 - No Linux payloads (edge case):
        Input:  [
                    "windows/meterpreter/reverse_tcp",
                    "windows/x64/shell/reverse_tcp"
                ]
        Output: [] (empty list - no compatible payloads!)
        Result: Node 4 will return error

    What it does: Loops through payloads, keeps only those with linux/unix/generic keywords.
    """
    linux_keywords = ['linux', 'unix', 'cmd/unix', 'generic']

    linux_payloads = [
        payload for payload in all_payloads
        if any(keyword in str(payload).lower() for keyword in linux_keywords)
    ]

    return linux_payloads
