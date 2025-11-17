"""
Blue Agent Services
Orchestrates Blue Agent workflow execution
"""

import logging
import json
from typing import Dict, Any, Optional, AsyncGenerator
from app.blueagentnetwork.state import BlueAgentState

logger = logging.getLogger(__name__)


async def run_blue_agent_workflow(
    vulnerability: dict,
    user_email: Optional[str] = None,
) -> AsyncGenerator[Dict[str, Any], None]:
    """
    Run complete Blue Agent workflow for a vulnerability

    Args:
        vulnerability: Vulnerability data with CVE, service, version, port, severity
        user_email: User email for receiving remediation package

    Yields:
        State updates after each node completion
    """

    # Lazy import to avoid circular dependencies
    from app.blueagentnetwork.graph import blue_agent_graph

    logger.info(f"🔵 Starting Blue Agent workflow for {vulnerability.get('cve')}...")

    # Initialize workflow state
    initial_state = {
        "vulnerability": vulnerability,
        "user_email": user_email,
        "execution_errors": [],
        "current_node": 0,
        # Node 1
        "loading_status": None,
        "load_error": None,
        # Node 2
        "strategy_fetch_status": None,
        "remediation_strategy": None,
        "strategy_error": None,
        # Node 3
        "script_generation_status": None,
        "generated_script": None,
        "script_error": None,
        # Node 4
        "impact_assessment_status": None,
        "impact_assessment": None,
        "impact_error": None,
        # Node 5
        "email_status": None,
        "email_sent": False,
        "package_filename": None,
        "email_error": None,
        "workflow_complete": False,
    }

    try:
        # Run graph in streaming mode to get updates after each node
        async for event in blue_agent_graph.astream(initial_state):
            # Event format: {node_name: {state_dict}}
            node_name = list(event.keys())[0]
            updated_state = event[node_name]

            logger.info(f"✅ Completed: {node_name}")

            # Yield state update to caller
            yield {
                "node": node_name,
                "status": "completed",
                "state": updated_state,
            }

        logger.info("🟢 Blue Agent workflow completed successfully")

    except Exception as e:
        error_msg = f"Blue Agent workflow error: {str(e)}"
        logger.error(f"❌ {error_msg}")
        yield {
            "node": "error",
            "status": "failed",
            "error": error_msg,
            "state": initial_state,
        }


async def fetch_remediation_strategy(vulnerability: dict) -> Dict[str, Any]:
    """
    Run only Node 2: Fetch remediation strategy

    Args:
        vulnerability: Vulnerability data

    Returns:
        Remediation strategy with strategy_points
    """

    # Lazy import to avoid circular dependencies
    from app.blueagentnetwork.graph import blue_agent_graph

    logger.info(f"🔵 Fetching remediation strategy for {vulnerability.get('cve')}...")

    initial_state = {
        "vulnerability": vulnerability,
        "loading_status": "SUCCESS",  # Assume Node 1 passed
        "execution_errors": [],
        "current_node": 1,
    }

    try:
        async for event in blue_agent_graph.astream(initial_state):
            node_name = list(event.keys())[0]
            updated_state = event[node_name]

            # Stop after Node 2
            if node_name == "fetch_remediation_strategy":
                return {
                    "status": "success",
                    "remediation_strategy": updated_state.get("remediation_strategy"),
                    "error": updated_state.get("strategy_error"),
                }

        return {"status": "error", "error": "Workflow did not reach strategy node"}

    except Exception as e:
        error_msg = f"Strategy fetch error: {str(e)}"
        logger.error(f"❌ {error_msg}")
        return {"status": "error", "error": error_msg}


async def generate_remediation_script(
    vulnerability: dict,
    remediation_strategy: dict,
) -> Dict[str, Any]:
    """
    Run Node 2 + Node 3: Generate remediation script

    Args:
        vulnerability: Vulnerability data
        remediation_strategy: Strategy from Node 2

    Returns:
        Generated script with filename and backup script
    """

    # Lazy import to avoid circular dependencies
    from app.blueagentnetwork.graph import blue_agent_graph

    logger.info(f"🔵 Generating remediation script for {vulnerability.get('cve')}...")

    initial_state = {
        "vulnerability": vulnerability,
        "remediation_strategy": remediation_strategy,
        "strategy_fetch_status": "SUCCESS",  # Assume Node 2 passed
        "loading_status": "SUCCESS",
        "execution_errors": [],
        "current_node": 2,
    }

    try:
        async for event in blue_agent_graph.astream(initial_state):
            node_name = list(event.keys())[0]
            updated_state = event[node_name]

            # Stop after Node 3
            if node_name == "generate_remediation_script":
                return {
                    "status": "success",
                    "generated_script": updated_state.get("generated_script"),
                    "error": updated_state.get("script_error"),
                }

        return {"status": "error", "error": "Workflow did not reach script generation node"}

    except Exception as e:
        error_msg = f"Script generation error: {str(e)}"
        logger.error(f"❌ {error_msg}")
        return {"status": "error", "error": error_msg}


async def assess_impact(
    vulnerability: dict,
    generated_script: dict,
) -> Dict[str, Any]:
    """
    Run Node 4: Impact assessment

    Args:
        vulnerability: Vulnerability data
        generated_script: Generated script from Node 3

    Returns:
        Impact assessment with risk level, downtime, services, checklist
    """

    # Lazy import to avoid circular dependencies
    from app.blueagentnetwork.graph import blue_agent_graph

    logger.info(f"🔵 Assessing impact for {vulnerability.get('cve')}...")

    initial_state = {
        "vulnerability": vulnerability,
        "generated_script": generated_script,
        "script_generation_status": "SUCCESS",  # Assume Node 3 passed
        "strategy_fetch_status": "SUCCESS",
        "loading_status": "SUCCESS",
        "execution_errors": [],
        "current_node": 3,
    }

    try:
        async for event in blue_agent_graph.astream(initial_state):
            node_name = list(event.keys())[0]
            updated_state = event[node_name]

            # Stop after Node 4
            if node_name == "impact_assessment":
                return {
                    "status": "success",
                    "impact_assessment": updated_state.get("impact_assessment"),
                    "error": updated_state.get("impact_error"),
                }

        return {"status": "error", "error": "Workflow did not reach impact assessment node"}

    except Exception as e:
        error_msg = f"Impact assessment error: {str(e)}"
        logger.error(f"❌ {error_msg}")
        return {"status": "error", "error": error_msg}


async def package_and_email(
    vulnerability: dict,
    generated_script: dict,
    impact_assessment: dict,
    user_email: str,
) -> Dict[str, Any]:
    """
    Run Node 5: Package and email

    Args:
        vulnerability: Vulnerability data
        generated_script: Generated script
        impact_assessment: Impact assessment
        user_email: Email address to send package to

    Returns:
        Email delivery status and package filename
    """

    # Lazy import to avoid circular dependencies
    from app.blueagentnetwork.graph import blue_agent_graph

    logger.info(f"🔵 Packaging and emailing remediation for {vulnerability.get('cve')}...")

    initial_state = {
        "vulnerability": vulnerability,
        "generated_script": generated_script,
        "impact_assessment": impact_assessment,
        "user_email": user_email,
        "script_generation_status": "SUCCESS",  # Assume all previous nodes passed
        "strategy_fetch_status": "SUCCESS",
        "loading_status": "SUCCESS",
        "impact_assessment_status": "SUCCESS",
        "execution_errors": [],
        "current_node": 4,
    }

    try:
        async for event in blue_agent_graph.astream(initial_state):
            node_name = list(event.keys())[0]
            updated_state = event[node_name]

            # Stop after Node 5
            if node_name == "package_and_email":
                return {
                    "status": "success",
                    "email_sent": updated_state.get("email_sent"),
                    "package_filename": updated_state.get("package_filename"),
                    "email_status": updated_state.get("email_status"),
                    "error": updated_state.get("email_error"),
                }

        return {"status": "error", "error": "Workflow did not reach packaging node"}

    except Exception as e:
        error_msg = f"Packaging error: {str(e)}"
        logger.error(f"❌ {error_msg}")
        return {"status": "error", "error": error_msg}
