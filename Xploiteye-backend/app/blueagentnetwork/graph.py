"""
Blue Agent LangGraph Orchestration
Chains 5 nodes for remediation workflow
"""

import logging
from langgraph.graph import StateGraph
from app.blueagentnetwork.state import BlueAgentState
from app.blueagentnetwork.nodes.node_1_load_vulnerabilities import load_vulnerabilities_node
from app.blueagentnetwork.nodes.node_2_fetch_remediation import fetch_remediation_strategy_node
from app.blueagentnetwork.nodes.node_3_generate_script import generate_remediation_script_node
from app.blueagentnetwork.nodes.node_4_impact_assessment import impact_assessment_node
from app.blueagentnetwork.nodes.node_5_package_and_email import package_and_email_node

logger = logging.getLogger(__name__)


def create_blue_agent_graph():
    """
    Create Blue Agent workflow graph

    Flow:
    NODE 1: Load Vulnerabilities (validate input)
    NODE 2: Fetch Remediation Strategy (call GPT-3.5-turbo)
    NODE 3: Generate Remediation Script (call GPT-3.5-turbo)
    NODE 4: Impact Assessment (analyze script for risk/downtime)
    NODE 5: Package and Email (create ZIP and email to user)
    """

    workflow = StateGraph(BlueAgentState)

    # Add all nodes
    workflow.add_node("load_vulnerabilities", load_vulnerabilities_node)
    workflow.add_node("fetch_remediation_strategy", fetch_remediation_strategy_node)
    workflow.add_node("generate_remediation_script", generate_remediation_script_node)
    workflow.add_node("impact_assessment", impact_assessment_node)
    workflow.add_node("package_and_email", package_and_email_node)

    # Define edges (sequential flow)
    workflow.set_entry_point("load_vulnerabilities")

    workflow.add_edge("load_vulnerabilities", "fetch_remediation_strategy")
    workflow.add_edge("fetch_remediation_strategy", "generate_remediation_script")
    workflow.add_edge("generate_remediation_script", "impact_assessment")
    workflow.add_edge("impact_assessment", "package_and_email")

    # Compile the graph
    graph = workflow.compile()

    logger.info("✅ Blue Agent workflow graph created successfully")
    return graph


# Create global graph instance
blue_agent_graph = create_blue_agent_graph()
