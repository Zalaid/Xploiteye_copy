"""
NODE 4: Impact Assessment
Analyzes generated script for impact, risk, and safety
"""

import logging
import re
from typing import Any, List, Tuple

logger = logging.getLogger(__name__)


async def impact_assessment_node(state: dict) -> dict:
    """
    NODE 4: Assess impact and safety of the remediation script

    Input: Generated script from Node 3
    Output: Impact assessment with risk level, downtime, checklist
    """

    try:
        logger.info("🔵 [NODE 4] Assessing script impact and risk...")

        # Skip if script not generated
        if state.get("script_generation_status") != "SUCCESS":
            error_msg = "Skipping Node 4: Script not generated successfully"
            logger.warning(f"⚠️  {error_msg}")
            return {
                **state,
                "impact_assessment_status": "SKIPPED",
                "current_node": 4,
            }

        vulnerability = state.get("vulnerability")
        generated_script = state.get("generated_script")
        script_content = generated_script.get("script_content", "")

        # Analyze script for impact
        dangerous_commands = analyze_dangerous_commands(script_content)
        affected_services = extract_services(script_content)
        downtime_estimate = estimate_downtime(script_content, affected_services)
        risk_level = calculate_risk_level(dangerous_commands, len(affected_services), vulnerability.get('severity'))

        # Generate prerequisite checks
        prerequisite_checks = generate_prerequisites(vulnerability, affected_services)

        impact_assessment = {
            "risk_level": risk_level,
            "estimated_downtime_seconds": downtime_estimate,
            "affected_services": affected_services,
            "dangerous_commands": dangerous_commands,
            "prerequisite_checks": prerequisite_checks,
            "reversible": "backup" in script_content.lower() or generated_script.get("backup_script") is not None,
            "requires_sudo": "sudo" in script_content or "systemctl" in script_content,
        }

        logger.info(f"✅ Impact Assessment Complete:")
        logger.info(f"   Risk Level: {risk_level}")
        logger.info(f"   Estimated Downtime: {downtime_estimate}s")
        logger.info(f"   Affected Services: {', '.join(affected_services)}")
        logger.info(f"   Dangerous Commands: {len(dangerous_commands)}")
        logger.info(f"   Reversible: {impact_assessment['reversible']}")

        return {
            **state,
            "impact_assessment": impact_assessment,
            "impact_assessment_status": "SUCCESS",
            "impact_error": None,
            "current_node": 4,
        }

    except Exception as e:
        error_msg = f"Error in NODE 4: {str(e)}"
        logger.error(f"❌ {error_msg}")
        return {
            **state,
            "impact_assessment_status": "FAILED",
            "impact_error": error_msg,
            "execution_errors": state.get("execution_errors", []) + [error_msg],
            "current_node": 4,
        }


def analyze_dangerous_commands(script_content: str) -> List[str]:
    """Identify potentially dangerous commands in script"""

    dangerous_patterns = [
        r'rm\s+-[a-z]*f',  # rm -f
        r'sed\s+-i',  # sed -i (in-place edit)
        r'systemctl\s+(stop|restart|reload)',  # service control
        r'chmod\s+[0-7]{3,4}',  # permission changes
        r'chown',  # ownership changes
        r'iptables',  # firewall rules
        r'ufw\s+',  # firewall
        r'pkill',  # kill processes
        r'killall',  # kill all processes
    ]

    dangerous_commands = []

    for pattern in dangerous_patterns:
        matches = re.findall(pattern, script_content, re.IGNORECASE)
        dangerous_commands.extend(matches)

    return list(set(dangerous_commands))  # Remove duplicates


def extract_services(script_content: str) -> List[str]:
    """Extract service names from script"""

    service_patterns = [
        r'systemctl\s+(?:start|stop|restart|reload)\s+(\w+)',
        r'service\s+(\w+)\s+(?:start|stop|restart|reload)',
        r'(?:apache2|nginx|mysql|postgresql|ssh|openssh)',
    ]

    services = set()

    for pattern in service_patterns:
        matches = re.findall(pattern, script_content, re.IGNORECASE)
        services.update([m.lower() if isinstance(m, str) else m[0].lower() for m in matches])

    return sorted(list(services))


def estimate_downtime(script_content: str, affected_services: List[str]) -> int:
    """Estimate downtime in seconds"""

    # Base downtime per service restart
    base_downtime = 30

    # Add time for each service
    total_downtime = base_downtime * len(affected_services)

    # Check for sleep commands
    sleep_matches = re.findall(r'sleep\s+(\d+)', script_content)
    total_downtime += sum(int(m) for m in sleep_matches)

    # Additional time for configuration updates
    if 'apt-get' in script_content or 'yum' in script_content:
        total_downtime += 60

    return max(30, total_downtime)  # Minimum 30 seconds


def calculate_risk_level(dangerous_commands: List[str], num_services: int, severity: str) -> str:
    """Calculate overall risk level"""

    risk_score = 0

    # Base score on vulnerability severity
    severity_scores = {
        'critical': 30,
        'high': 20,
        'medium': 10,
        'low': 5,
    }
    risk_score += severity_scores.get(severity.lower(), 10)

    # Add score for dangerous commands
    risk_score += len(dangerous_commands) * 5

    # Add score for number of services
    risk_score += num_services * 3

    if risk_score >= 50:
        return "HIGH"
    elif risk_score >= 25:
        return "MEDIUM"
    else:
        return "LOW"


def generate_prerequisites(vulnerability: dict, affected_services: List[str]) -> List[str]:
    """Generate prerequisite checklist for execution"""

    checks = [
        "Ensure backup of system configuration exists",
        "Verify sudo access is available",
        "Schedule execution during maintenance window",
        "Notify system users of potential downtime",
        "Review rollback procedures before execution",
    ]

    # Add service-specific checks
    if 'ssh' in str(affected_services).lower():
        checks.insert(0, "Ensure SSH key-based authentication is configured")
        checks.append("Keep terminal open during SSH restart to maintain access")

    if 'apache' in str(affected_services).lower() or 'nginx' in str(affected_services).lower():
        checks.append("Test web service configuration before restarting")

    if 'mysql' in str(affected_services).lower() or 'postgres' in str(affected_services).lower():
        checks.append("Create database backup before modifications")

    # Severity-specific checks
    if vulnerability.get('severity', '').lower() == 'critical':
        checks.append("Have incident response plan ready")

    return checks
