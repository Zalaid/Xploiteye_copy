"""
NODE 1: Load Vulnerabilities
Loads vulnerability data from scanning results JSON
"""

import json
import logging
from typing import Any
from datetime import datetime
from pathlib import Path

logger = logging.getLogger(__name__)


async def load_vulnerabilities_node(state: dict) -> dict:
    """
    NODE 1: Load and validate vulnerabilities from scanning results

    Input: vulnerability object with CVE details
    Output: Validated vulnerability data, ready for remediation
    """

    try:
        logger.info("🔵 [NODE 1] Loading vulnerability data...")

        vulnerability = state.get("vulnerability")

        if not vulnerability:
            error_msg = "No vulnerability data provided"
            logger.error(f"❌ {error_msg}")
            return {
                **state,
                "loading_status": "FAILED",
                "load_error": error_msg,
                "execution_errors": state.get("execution_errors", []) + [error_msg],
                "current_node": 1,
            }

        # Validate required fields
        required_fields = ["port", "service", "version", "cve", "severity"]
        missing_fields = [f for f in required_fields if f not in vulnerability]

        if missing_fields:
            error_msg = f"Missing required fields: {', '.join(missing_fields)}"
            logger.error(f"❌ {error_msg}")
            return {
                **state,
                "loading_status": "FAILED",
                "load_error": error_msg,
                "execution_errors": state.get("execution_errors", []) + [error_msg],
                "current_node": 1,
            }

        # Validate severity level
        valid_severities = ["critical", "high", "medium", "low"]
        if vulnerability.get("severity", "").lower() not in valid_severities:
            error_msg = f"Invalid severity: {vulnerability.get('severity')}"
            logger.error(f"❌ {error_msg}")
            return {
                **state,
                "loading_status": "FAILED",
                "load_error": error_msg,
                "execution_errors": state.get("execution_errors", []) + [error_msg],
                "current_node": 1,
            }

        # Log loaded vulnerability
        logger.info(f"✅ Loaded vulnerability: {vulnerability['service']} v{vulnerability['version']}")
        logger.info(f"   CVE: {vulnerability['cve']}")
        logger.info(f"   Port: {vulnerability['port']}")
        logger.info(f"   Severity: {vulnerability['severity'].upper()}")

        return {
            **state,
            "vulnerability": vulnerability,
            "loading_status": "SUCCESS",
            "load_error": None,
            "current_node": 1,
        }

    except Exception as e:
        error_msg = f"Error in NODE 1: {str(e)}"
        logger.error(f"❌ {error_msg}")
        return {
            **state,
            "loading_status": "FAILED",
            "load_error": error_msg,
            "execution_errors": state.get("execution_errors", []) + [error_msg],
            "current_node": 1,
        }
