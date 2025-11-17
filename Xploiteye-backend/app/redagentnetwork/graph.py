"""
Red Agent LangGraph Workflow
Orchestrates the exploitation workflow using LangGraph state machine
"""

from langgraph.graph import StateGraph, END
from typing import Dict

# Import state schema
from .state import RedAgentState

# Import nodes
from .nodes.node_1_initialization_validation import node_1_initialization_validation
from .nodes.node_2_exploit_discovery import node_2_exploit_discovery
from .nodes.node_2b_gpt_pwn_rc_generation import node_2b_gpt_pwn_rc_generation
from .nodes.node_7_backup_m2_manual_exploit_to_rc import node_7_backup_m2_manual_exploit_to_rc
from .nodes.node_3_ranking_selection import node_3_ranking_selection
from .nodes.node_4_payload_selection import node_4_payload_selection
from .nodes.node_5_exploit_execution import node_5_exploit_execution
from .nodes.node_5_5_gpt_fallback_exploit import node_5_5_gpt_fallback_exploit
from .nodes.node_6_pwn_rc_generation import node_6_pwn_rc_generation


def create_workflow() -> StateGraph:
    """
    Create and return the Red Agent workflow graph.

    ╔════════════════════════════════════════════════════════════════════════╗
    ║                         WORKFLOW PATHS                                 ║
    ╚════════════════════════════════════════════════════════════════════════╝

    PATH 1 - Metasploit Exploits Successfully Get Shell + Meterpreter:
        Node 1 → Node 2 → Node 3 → Node 4 → Node 5 (Gets Shell)
               → Node 6 (Generates Meterpreter via pwn.rc) → END ✅

    PATH 2A - Metasploit Exploits Get Shell + Meterpreter via Node 6:
        Node 1 → Node 2 → Node 3 → Node 4 → Node 5 (Gets Shell)
               → Node 6 (No meterpreter but OS is Linux 2.6.x)
               → Node 7 (Manual Exploit Conversion) → END ⚡

    PATH 2B - Metasploit Exploits Fail in Node 5 (GPT Fallback):
        Node 1 → Node 2 → Node 3 → Node 4 → Node 5 (NO Shell)
               → Node 5.5 (GPT Fallback pwn.rc Generation & Execution)
               → END (If Meterpreter) OR Node 7 (If No Meterpreter) ⚡

    PATH 3 - No Metasploit Exploits Found (GPT Generation):
        Node 1 → Node 2 (Found 0 exploits)
               → Node 2B (GPT pwn.rc Generation & Execution) → END ⚡

    ╔════════════════════════════════════════════════════════════════════════╗
    ║                    KEY DECISION POINTS                                 ║
    ╚════════════════════════════════════════════════════════════════════════╝

    Node 1 → Node 2?
        IF validated: YES | ELSE: END ❌

    Node 2 → Node 3 or 2B?
        IF filtered_exploits > 0: Node 3 | ELSE: Node 2B (GPT Fallback)

    Node 5 → Node 6 or 5.5?
        IF successful_payloads > 0: Node 6 | ELSE: Node 5.5 (GPT Fallback)

    Node 5.5 → Node 7 or END?
        IF primary_session_id obtained: END ✅ | ELSE: Node 7 (Final Backup)

    Node 6 → Node 7 or END?
        IF primary_session_type == "meterpreter": END ✅
        ELIF detected_os contains "2.6": Node 7 | ELSE: END ❌

    Returns:
        Compiled LangGraph workflow
    """

    # Create state graph
    workflow = StateGraph(RedAgentState)

    # ═══════════════════════════════════════════════════════════════════
    # ADD NODES
    # ═══════════════════════════════════════════════════════════════════

    workflow.add_node("node_1_initialization", node_1_initialization_validation)
    workflow.add_node("node_2_exploit_discovery", node_2_exploit_discovery)
    workflow.add_node("node_2b_gpt_generation", node_2b_gpt_pwn_rc_generation)  # Fallback (no exploits found)
    workflow.add_node("node_3_ranking_selection", node_3_ranking_selection)
    workflow.add_node("node_4_payload_selection", node_4_payload_selection)
    workflow.add_node("node_5_exploit_execution", node_5_exploit_execution)
    workflow.add_node("node_5_5_gpt_fallback", node_5_5_gpt_fallback_exploit)  # Fallback (no shell from Node 5)
    workflow.add_node("node_6_pwn_rc_generation", node_6_pwn_rc_generation)
    workflow.add_node("node_7_backup_m2", node_7_backup_m2_manual_exploit_to_rc)  # Final backup (after Node 6, Linux 2.6.x only)

    # ═══════════════════════════════════════════════════════════════════
    # DEFINE EDGES (FLOW)
    # ═══════════════════════════════════════════════════════════════════

    # Set entry point
    workflow.set_entry_point("node_1_initialization")

    # Conditional edge from Node 1
    def route_after_node_1(state):
        """Route after Node 1 based on validation"""
        if state.get("validated"):
            return "node_2_exploit_discovery"
        return END

    workflow.add_conditional_edges(
        "node_1_initialization",
        route_after_node_1
    )

    # Conditional edge from Node 2
    def route_after_node_2(state):
        """
        Route after Node 2 based on exploit discovery results.

        Routing logic:
        - IF filtered_exploits has exploits (len > 0): → Node 3 (Exploit Ranking & Selection)
        - ELSE (no exploits found): → Node 2B (GPT PWN.RC Generation - Fallback)
        """
        if len(state.get("filtered_exploits", [])) > 0:
            return "node_3_ranking_selection"
        else:
            # Fallback to GPT-based pwn.rc generation
            return "node_2b_gpt_generation"

    workflow.add_conditional_edges(
        "node_2_exploit_discovery",
        route_after_node_2
    )

    # Conditional edge from Node 3
    def route_after_node_3(state):
        """
        Route after Node 3 based on ranking results.

        Routing logic (from workflow.txt):
        - IF selected_exploits exists (len > 0): → Node 4 (Payload Selection)
        - ELSE: → Node 10 (Manual Recommendations) [TODO]
        """
        if len(state.get("selected_exploits", [])) > 0:
            return "node_4_payload_selection"
        # TODO: Add manual recommendation route when Node 10 is ready
        # else:
        #     return "node_10_manual_recommendations"
        return END

    workflow.add_conditional_edges(
        "node_3_ranking_selection",
        route_after_node_3
    )

    # Conditional edge from Node 4
    def route_after_node_4(state):
        """
        Route after Node 4 based on payload selection results.

        Routing logic (from workflow.txt):
        - IF payloads_to_try exists (len > 0) AND lhost is set: → Node 5 (Exploit Execution)
        - ELIF error == "no_compatible_payloads": → END (stop)
        - ELIF error == "lhost_detection_failed": → END (halt)
        - ELSE: → END
        """
        if "error" in state:
            # Payload selection failed, stop
            return END

        if len(state.get("payloads_to_try", [])) > 0 and state.get("lhost"):
            return "node_5_exploit_execution"

        return END

    workflow.add_conditional_edges(
        "node_4_payload_selection",
        route_after_node_4
    )

    # Conditional edge from Node 5
    def route_after_node_5(state):
        """
        Route after Node 5 based on exploitation results.

        Routing logic:
        - IF successful_payloads exists (len > 0): → Node 6 (PWN.RC Generation for Meterpreter)
        - ELSE (no shell from exploits): → Node 5.5 (GPT Fallback Exploit Generation)
        """
        if len(state.get("successful_payloads", [])) > 0:
            return "node_6_pwn_rc_generation"
        else:
            # No shell obtained from traditional exploits, use GPT fallback
            return "node_5_5_gpt_fallback"

    workflow.add_conditional_edges(
        "node_5_exploit_execution",
        route_after_node_5
    )

    # Conditional edge from Node 5.5
    def route_after_node_5_5(state):
        """
        Route after Node 5.5 based on GPT fallback results.

        Routing logic:
        - IF pwn_rc_generated: TRUE and primary_session_id exists: → END (meterpreter obtained)
        - ELSE (no meterpreter from GPT): → Node 7 Backup M2 (manual exploit converter for Linux 2.6.x)
        """
        if state.get("pwn_rc_generated") and state.get("primary_session_id"):
            # Meterpreter obtained, finish here
            return END
        else:
            # GPT fallback didn't get meterpreter, try manual exploit conversion (Node 7)
            return "node_7_backup_m2"

    workflow.add_conditional_edges(
        "node_5_5_gpt_fallback",
        route_after_node_5_5
    )

    # Conditional edge from Node 6
    def route_after_node_6(state):
        """
        Route after Node 6 based on session results.

        Routing logic:
        - IF primary_session_type == "meterpreter": → END (success!)
        - ELIF OS is Linux 2.6.x: → Node 7 Backup M2 (final fallback)
        - ELSE: → END
        """
        session_type = state.get("primary_session_type", "").lower()

        if session_type == "meterpreter":
            # Got meterpreter, we're done
            return END

        # Check if OS is in range for Node 7 Backup M2 (Linux 2.6.x)
        os_type = state.get("os_type", "")
        if "2.6" in str(os_type).lower():
            # OS is Linux 2.6.x, try final backup
            return "node_7_backup_m2"

        return END

    workflow.add_conditional_edges(
        "node_6_pwn_rc_generation",
        route_after_node_6
    )

    # Direct edge from Node 7 Backup M2 to END
    # This is the final fallback for Linux 2.6.x systems
    workflow.add_edge("node_7_backup_m2", END)

    # TODO: Add Node 7 Session Verification and Node 7A Shell Upgrade
    # These nodes are not yet implemented

    # ═══════════════════════════════════════════════════════════════════
    # COMPILE AND RETURN
    # ═══════════════════════════════════════════════════════════════════

    return workflow.compile()


# Create the compiled workflow (singleton)
app = create_workflow()


def run_workflow(initial_state: Dict) -> Dict:
    """
    Run the Red Agent workflow with the given initial state.

    Args:
        initial_state: Dictionary with target, port, service, etc.

    Returns:
        Final state after workflow completion

    Example:
        initial_state = {
            "target": "192.168.1.100",
            "port": 21,
            "service": "vsftpd",
            "version": "2.3.4",
            "cve_ids": ["CVE-2011-2523"],
            "user_id": "alice"
        }

        final_state = run_workflow(initial_state)
        print(f"Validated: {final_state.get('validated')}")
    """

    # Run the workflow
    result = app.invoke(initial_state)

    return result
