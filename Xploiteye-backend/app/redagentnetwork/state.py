"""
Red Agent State Schema
Defines the complete state structure for the exploitation workflow
"""

from typing import TypedDict, List, Dict, Optional
from datetime import datetime


class RedAgentState(TypedDict, total=False):
    """
    Complete state schema for Red Agent exploitation workflow.
    Each field is optional (total=False) to allow incremental state building.
    """

    # ═══════════════════════════════════════════════════════════════════════
    # INPUT PARAMETERS
    # ═══════════════════════════════════════════════════════════════════════
    target: str                    # IP address of target
    port: int                      # Target port number
    service: str                   # Service name (e.g., "ssh", "http", "ftp")
    version: str                   # Service version (e.g., "2.3.4")
    cve_ids: List[str]            # Associated CVE identifiers
    user_id: str                   # User ID (for multi-user support)

    # ═══════════════════════════════════════════════════════════════════════
    # SESSION DIRECTORIES (Created by Node 1)
    # ═══════════════════════════════════════════════════════════════════════
    session_dir: str               # Base session directory path
    session_name: str              # Session folder name
    log_file: str                  # Log file path
    report_dir: str                # Reports directory
    loot_dir: str                  # Loot directory
    temp_dir: str                  # Temp directory
    evidence_dir: str              # Evidence directory

    # ═══════════════════════════════════════════════════════════════════════
    # VALIDATION STATE (Node 1)
    # ═══════════════════════════════════════════════════════════════════════
    validated: bool                # Overall validation status
    validation_errors: List[str]   # List of validation error messages
    target_reachable: bool         # Ping/arping result
    port_open: bool                # Port accessibility check
    msf_rpc_connected: bool        # Metasploit RPC connection status

    # ═══════════════════════════════════════════════════════════════════════
    # DETECTION RESULTS (Node 1)
    # ═══════════════════════════════════════════════════════════════════════
    os_type: str                   # Detected OS (e.g., "Linux 2.6.9 - 2.6.33")
    os_detection_method: str       # "nmap" or "default"
    service_verified: bool         # Service verification result

    # ═══════════════════════════════════════════════════════════════════════
    # METASPLOIT CLIENT (Node 1)
    # ═══════════════════════════════════════════════════════════════════════
    msf_client: Optional[object]   # MsfRpcClient instance

    # ═══════════════════════════════════════════════════════════════════════
    # TIMING METADATA
    # ═══════════════════════════════════════════════════════════════════════
    start_time: datetime           # Workflow start timestamp
    end_time: Optional[datetime]   # Workflow end timestamp
    total_duration: Optional[float]  # Total time in seconds

    # ═══════════════════════════════════════════════════════════════════════
    # AGENT METADATA
    # ═══════════════════════════════════════════════════════════════════════
    agent_version: str             # Red Agent version

    # ═══════════════════════════════════════════════════════════════════════
    # EXPLOIT DISCOVERY STATE (Node 2)
    # ═══════════════════════════════════════════════════════════════════════
    exploits_from_cve: List[Dict]         # Exploits from CVE search (Strategy 1)
    exploits_from_service: List[Dict]     # Exploits from service/version search (Strategy 2)
    exploits_from_fuzzy: List[Dict]       # Exploits from fuzzy search (Strategy 3)
    auxiliary_modules: List[Dict]         # Auxiliary modules (Strategy 4)
    filtered_exploits: List[Dict]         # Final filtered exploit list (5-15 exploits)
    total_exploits_found: int             # Total before filtering
    discovery_attempts: int               # Number of discovery attempts (max 2)
    discovery_retry: bool                 # Flag to trigger retry
    auxiliary_results: Dict               # Results from auxiliary module execution
    discovered_credentials: Dict          # Credentials discovered by auxiliary

    # ═══════════════════════════════════════════════════════════════════════
    # EXPLOIT RANKING & SELECTION STATE (Node 3)
    # ═══════════════════════════════════════════════════════════════════════
    ranked_exploits: List[Dict]              # All exploits with final scores
    selected_exploits: List[Dict]            # TOP 8 exploits for execution
    top_exploit: Dict                        # #1 ranked exploit
    backup_exploits: List[Dict]              # Exploits #2-8 (fallback options)
    filtered_out_exploits: List[Dict]        # OS-incompatible exploits removed
    confidence_scores: List[float]           # Confidence % for each selected exploit
    ranking_method: str                      # "rule_based" or "llm_based"

    # ═══════════════════════════════════════════════════════════════════════
    # PAYLOAD SELECTION & CONFIGURATION STATE (Node 4)
    # ═══════════════════════════════════════════════════════════════════════
    current_exploit_index: int               # Which exploit we're currently trying (0-7)
    payloads_to_try: List[str]              # TOP 10-15 compatible payloads
    lhost: str                               # Attacker IP (reverse shell listener)
    lport: int                               # Attacker port (reverse shell listener)
    current_payload_index: int               # Which payload we're currently trying
    default_payload: str                     # Exploit's recommended default payload

    # ═══════════════════════════════════════════════════════════════════════
    # EXPLOIT EXECUTION STATE (Node 5)
    # ═══════════════════════════════════════════════════════════════════════
    execution_attempts: int                  # Total number of execution attempts
    successful_payloads: List[Dict]          # Payloads that successfully opened sessions
    failed_payloads: List[Dict]              # Payloads that failed with error info
    first_successful_exploit: Optional[Dict] # Best working exploit from Node 3
    first_successful_payload: str            # Best working payload
    first_successful_session_id: int         # Session ID of first successful exploitation

    # ═══════════════════════════════════════════════════════════════════════
    # SESSION MANAGEMENT STATE (Node 6)
    # ═══════════════════════════════════════════════════════════════════════
    session_management_status: str           # "success" or "warning" or "failed"
    active_sessions: List[Dict]              # All open sessions with full details
    primary_session_id: int                  # Best session to use for post-exploitation
    primary_session_type: str                # "shell" or "meterpreter"
    primary_session_alive: bool              # Is primary session responsive
    session_verification_passed: bool        # Overall verification status
    target_host_from_session: str            # Target IP from session info
    total_sessions: int                      # Total number of open sessions
    can_upgrade_to_meterpreter: bool         # Can we upgrade shell to meterpreter
    can_perform_privesc: bool                # Can we attempt privilege escalation
    can_gather_info: bool                    # Can we gather system information

    # ═══════════════════════════════════════════════════════════════════════
    # SESSION VERIFICATION & INFO GATHERING STATE (Node 7)
    # ═══════════════════════════════════════════════════════════════════════
    session_verified: bool                   # Is session verified and responsive
    current_user: str                        # Username running the session
    hostname: str                            # Target hostname
    architecture: str                        # System architecture (x86_64, x86, ARM, etc)
    is_root: bool                            # Are we running as root/admin?
    privilege_level: str                     # "high" (root/admin) or "low" (user)
    initial_privileges: Dict                 # Snapshot of initial privilege state
    info_gathering_passed: bool              # Was system info gathering successful?
    next_phase: Optional[str]                # Next phase: post_exploitation / upgrade_meterpreter / privilege_escalation

    # ═══════════════════════════════════════════════════════════════════════
    # SHELL TO METERPRETER UPGRADE STATE (Node 7A)
    # ═══════════════════════════════════════════════════════════════════════
    upgrade_successful: bool                 # Did shell upgrade to meterpreter succeed?
    upgrade_method: Optional[str]            # "builtin" / "python_stager" / "binary"
    original_session_id: Optional[int]       # Old shell session ID (before upgrade)
    meterpreter_session_id: Optional[int]    # New meterpreter session ID (after upgrade)
    upgrade_attempts: List[Dict]             # History of all upgrade attempts
    upgrade_status: str                      # "not_attempted" / "in_progress" / "success" / "failed"

    # ═══════════════════════════════════════════════════════════════════════
    # NOTE: Additional fields will be added by later nodes (Node 8-13)
    # ═══════════════════════════════════════════════════════════════════════
    # - Privilege escalation (Node 8+)
    # - Post-exploitation data (Node 9-10)
    # - Final report (Node 11-12)
