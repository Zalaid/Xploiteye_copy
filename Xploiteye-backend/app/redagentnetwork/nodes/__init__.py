"""
Red Agent Nodes Package
Contains all workflow nodes for the exploitation process
"""

from .node_1_initialization_validation import node_1_initialization_validation
from .node_2_exploit_discovery import node_2_exploit_discovery
from .node_2b_gpt_pwn_rc_generation import node_2b_gpt_pwn_rc_generation
from .node_7_backup_m2_manual_exploit_to_rc import node_7_backup_m2_manual_exploit_to_rc
from .node_3_ranking_selection import node_3_ranking_selection
from .node_4_payload_selection import node_4_payload_selection
from .node_5_exploit_execution import node_5_exploit_execution
from .node_5_5_gpt_fallback_exploit import node_5_5_gpt_fallback_exploit
from .node_6_pwn_rc_generation import node_6_pwn_rc_generation

# Optional imports for future nodes (commented out if not implemented yet)
# from .node_7_session_verification import node_7_session_verification
# from .node_7a_shell_upgrade import node_7a_shell_upgrade
# from .node_7b_privilege_escalation_discovery import node_7b_privilege_escalation_discovery
# from .node_8b_privilege_escalation_execution import node_8b_privilege_escalation_execution

__all__ = [
    'node_1_initialization_validation',
    'node_2_exploit_discovery',
    'node_2b_gpt_pwn_rc_generation',
    'node_3_ranking_selection',
    'node_4_payload_selection',
    'node_5_exploit_execution',
    'node_5_5_gpt_fallback_exploit',
    'node_6_pwn_rc_generation',
    'node_7_backup_m2_manual_exploit_to_rc',
]
