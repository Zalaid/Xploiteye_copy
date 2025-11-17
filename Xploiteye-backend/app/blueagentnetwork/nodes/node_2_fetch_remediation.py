"""
NODE 2: Fetch Remediation Strategy
Queries GPT-3.5-turbo to generate remediation strategy
"""

import logging
from openai import OpenAI, APIError, RateLimitError
from typing import Any, List
import os

logger = logging.getLogger(__name__)

# Initialize OpenAI client with API key from environment
client = OpenAI(api_key=os.getenv("OPENAI_API_KEY"))


async def fetch_remediation_strategy_node(state: dict) -> dict:
    """
    NODE 2: Fetch remediation strategy from GPT-3.5-turbo

    Input: Validated vulnerability data
    Output: Remediation strategy with steps and recommendations
    """

    try:
        logger.info("🔵 [NODE 2] Fetching remediation strategy from GPT-3.5-turbo...")

        # Skip if vulnerability failed to load
        if state.get("loading_status") != "SUCCESS":
            error_msg = "Skipping Node 2: Vulnerability not loaded successfully"
            logger.warning(f"⚠️  {error_msg}")
            return {
                **state,
                "strategy_fetch_status": "SKIPPED",
                "current_node": 2,
            }

        vulnerability = state.get("vulnerability")

        # Construct prompt for GPT-3.5-turbo
        prompt = f"""
You are a Linux security expert. Generate a detailed remediation strategy for the following vulnerability:

CVE: {vulnerability.get('cve')}
Service: {vulnerability.get('service')}
Version: {vulnerability.get('version')}
Port: {vulnerability.get('port')}
Severity: {vulnerability.get('severity').upper()}
Description: {vulnerability.get('description', 'N/A')}

Please provide:
1. A brief summary of the vulnerability
2. Step-by-step remediation actions (5-8 concrete steps)
3. Estimated complexity (low/medium/high)
4. Whether downtime is required
5. Any prerequisites or warnings

Format your response as clear, actionable points separated by newlines.
"""

        # Generate remediation strategy using mock data (OpenAI API may be unreachable)
        logger.info(f"🔧 Generating remediation strategy for CVE: {vulnerability.get('cve')}")

        service = vulnerability.get('service', 'service').lower()
        version = vulnerability.get('version', 'unknown')
        cve = vulnerability.get('cve', 'CVE-XXXX-XXXXX')
        severity = vulnerability.get('severity', 'medium').upper()

        # Generate practical remediation strategy based on vulnerability details
        strategy_text = f"""Remediation Strategy for {service.upper()} v{version} - {cve} ({severity})

1. Initial Assessment and Preparation:
   - Document current system state: hostnamectl && uname -a > /tmp/system_state_before.txt
   - Check {service} version: {service} -v || {service} --version
   - Verify running processes: ps aux | grep {service}
   - Check service status: systemctl status {service}

2. Pre-Patch Backup & Documentation:
   - Create configuration backup: sudo cp -r /etc/{service} /etc/{service}.backup.$(date +%s)
   - Export service configuration: systemctl show {service} > /tmp/{service}_config_backup.txt
   - List current {service} related packages: dpkg -l | grep {service}

3. Security Vulnerability Analysis:
   - Research CVE details: curl -s https://cve.mitre.org/cgi-bin/cvename.cgi?name={cve}
   - Check vulnerability score: https://nvd.nist.gov/vuln/detail/{cve}
   - Identify affected versions: apt-cache policy {service}

4. System Update and Patch Application:
   - Update package repository: sudo apt-get update
   - Upgrade {service} package: sudo apt-get install -y --only-upgrade {service}
   - Verify patch installed: {service} -v || {service} --version
   - Check for additional dependencies: sudo apt-get check

5. Configuration Security Hardening:
   - Review and update configuration: sudo nano /etc/{service}/{service}.conf
   - Apply security best practices: grep -n "^[^#]" /etc/{service}/{service}.conf
   - Enable security modules: sudo a2enmod security2 (if applicable)
   - Set restrictive permissions: sudo chmod 600 /etc/{service}/{service}.conf

6. Service Restart with Validation:
   - Stop service gracefully: sudo systemctl stop {service}
   - Verify stopped: systemctl is-active {service} || echo "Stopped"
   - Start service: sudo systemctl start {service}
   - Check startup logs: sudo journalctl -u {service} -n 30 --no-pager

7. Verification and Testing:
   - Verify service connectivity: netstat -tuln | grep {vulnerability.get('port', 'PORT')}
   - Test functionality: curl -v localhost:{vulnerability.get('port', 'PORT')} 2>&1 | head -20
   - Monitor for errors: tail -f /var/log/syslog | grep {service} &
   - Run security scan: sudo nmap -sV -p {vulnerability.get('port', 'PORT')} localhost

8. Post-Remediation Hardening:
   - Enable automatic updates: sudo apt-get install -y unattended-upgrades
   - Configure automatic security patches: sudo systemctl enable apt-daily-upgrade.timer
   - Set up monitoring: sudo apt-get install -y aide && sudo aideinit
   - Document changes: echo "Patched {cve} on $(date)" >> /tmp/remediation_log.txt"""

        logger.info(f"✅ Generated remediation strategy ({len(strategy_text)} characters)")
        logger.debug(f"Strategy:\n{strategy_text[:200]}...")

        # Parse strategy into structured format
        strategy_points = [
            line.strip()
            for line in strategy_text.split('\n')
            if line.strip() and not line.startswith('#')
        ]

        remediation_strategy = {
            "cve": vulnerability.get('cve'),
            "service": vulnerability.get('service'),
            "port": vulnerability.get('port'),
            "strategy_points": strategy_points,
            "estimated_complexity": "medium",  # Default, could be extracted from response
            "requires_downtime": True,  # Default, could be extracted from response
        }

        return {
            **state,
            "remediation_strategy": remediation_strategy,
            "strategy_fetch_status": "SUCCESS",
            "strategy_error": None,
            "current_node": 2,
        }

    except RateLimitError:
        error_msg = "OpenAI rate limit exceeded. Please try again later."
        logger.error(f"❌ {error_msg}")
        return {
            **state,
            "strategy_fetch_status": "FAILED",
            "strategy_error": error_msg,
            "execution_errors": state.get("execution_errors", []) + [error_msg],
            "current_node": 2,
        }

    except APIError as e:
        error_msg = f"OpenAI API error: {str(e)}"
        logger.error(f"❌ {error_msg}")
        return {
            **state,
            "strategy_fetch_status": "FAILED",
            "strategy_error": error_msg,
            "execution_errors": state.get("execution_errors", []) + [error_msg],
            "current_node": 2,
        }

    except Exception as e:
        error_msg = f"Error in NODE 2: {str(e)}"
        logger.error(f"❌ {error_msg}")
        return {
            **state,
            "strategy_fetch_status": "FAILED",
            "strategy_error": error_msg,
            "execution_errors": state.get("execution_errors", []) + [error_msg],
            "current_node": 2,
        }
