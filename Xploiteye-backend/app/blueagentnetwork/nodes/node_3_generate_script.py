"""
NODE 3: Generate Remediation Script
Uses GPT-3.5-turbo to generate production-ready bash script
"""

import logging
from openai import OpenAI, APIError, RateLimitError
import re
from typing import Any
import os

logger = logging.getLogger(__name__)

# Initialize OpenAI client with API key from environment
client = OpenAI(api_key=os.getenv("OPENAI_API_KEY"))


async def generate_remediation_script_node(state: dict) -> dict:
    """
    NODE 3: Generate executable shell script for remediation

    Input: Remediation strategy from Node 2
    Output: Production-ready bash script with error handling and logging
    """

    try:
        logger.info("🔵 [NODE 3] Generating remediation script with GPT-3.5-turbo...")

        # Skip if strategy not fetched
        if state.get("strategy_fetch_status") != "SUCCESS":
            error_msg = "Skipping Node 3: Remediation strategy not fetched successfully"
            logger.warning(f"⚠️  {error_msg}")
            return {
                **state,
                "script_generation_status": "SKIPPED",
                "current_node": 3,
            }

        vulnerability = state.get("vulnerability")
        remediation_strategy = state.get("remediation_strategy")

        # Construct detailed prompt for script generation
        prompt = f"""
Generate a production-ready bash remediation script for this vulnerability:

CVE: {vulnerability.get('cve')}
Service: {vulnerability.get('service')} v{vulnerability.get('version')}
Port: {vulnerability.get('port')}
Severity: {vulnerability.get('severity').upper()}

Remediation Steps:
{chr(10).join(['- ' + step for step in remediation_strategy.get('strategy_points', [])])}

REQUIREMENTS:
1. Script MUST start with #!/bin/bash
2. Include comprehensive error handling (set -e)
3. Log all actions to /var/log/xploiteye_remediation_$(date +%s).log
4. Back up original configurations before modification
5. Include rollback/restore procedures
6. Verify changes after execution
7. Be safe for production systems
8. Use clear echo statements showing progress
9. Handle edge cases and failures gracefully
10. Include comments explaining each section

Generate ONLY the bash script, no explanations.
"""

        logger.info(f"📡 Calling GPT-3.5-turbo to generate script for {vulnerability.get('service')}...")

        try:
            response = client.chat.completions.create(
                model="gpt-3.5-turbo",
                messages=[
                    {
                        "role": "system",
                        "content": "You are a bash script expert. Generate production-ready, safe, and well-documented shell scripts for security remediation. Always prioritize safety and reversibility."
                    },
                    {
                        "role": "user",
                        "content": prompt
                    }
                ],
                temperature=0.7,
                max_tokens=2000,
                timeout=30,
            )

            script_content = response.choices[0].message.content
        except Exception as e:
            # Fallback script if OpenAI times out
            logger.warning(f"⚠️  OpenAI API timeout/error, using fallback script: {str(e)}")
            script_content = f"""#!/bin/bash
# Fallback Remediation Script for {vulnerability.get('service')} v{vulnerability.get('version')}
# CVE: {vulnerability.get('cve')} (Severity: {vulnerability.get('severity')})
# Generated: $(date)

set -e

LOG_FILE="/var/log/xploiteye_remediation_$(date +%s).log"
exec 1> >(tee $LOG_FILE)
exec 2>&1

echo "[*] Starting remediation for {vulnerability.get('service')}"
echo "[*] Log file: $LOG_FILE"

# Backup current configuration
echo "[*] Backing up current configuration..."
sudo cp /etc/{vulnerability.get('service', 'service')}/config /etc/{vulnerability.get('service', 'service')}/config.backup.$(date +%s) 2>/dev/null || true

# Stop service
echo "[*] Stopping {vulnerability.get('service')} service..."
sudo systemctl stop {vulnerability.get('service', 'service')} || true

# Update packages
echo "[*] Updating packages..."
sudo apt-get update
sudo apt-get install -y --only-upgrade {vulnerability.get('service', 'service')}

# Start service
echo "[*] Starting {vulnerability.get('service')} service..."
sudo systemctl start {vulnerability.get('service', 'service')}

# Verify
echo "[*] Verifying service status..."
sudo systemctl status {vulnerability.get('service', 'service')}

echo "[✓] Remediation complete"
echo "[*] Logs saved to: $LOG_FILE"
""".strip()

        logger.info(f"✅ Generated remediation script ({len(script_content)} chars)")

        # Extract script if wrapped in code blocks
        if "```bash" in script_content:
            script_content = script_content.split("```bash")[1].split("```")[0].strip()
        elif "```" in script_content:
            script_content = script_content.split("```")[1].split("```")[0].strip()

        # Validate script format
        if not script_content.startswith("#!/bin/bash"):
            logger.warning("⚠️  Script doesn't start with shebang, adding it...")
            script_content = "#!/bin/bash\n" + script_content

        # Generate backup/rollback script
        rollback_script = generate_rollback_script(vulnerability, script_content)

        # Generate filename
        filename = f"remediate_{vulnerability.get('service').lower().replace(' ', '_')}_port_{vulnerability.get('port')}.sh"

        generated_script = {
            "script_content": script_content,
            "language": "bash",
            "filename": filename,
            "backup_script": rollback_script,
        }

        logger.info(f"✅ Script ready: {filename}")

        return {
            **state,
            "generated_script": generated_script,
            "script_generation_status": "SUCCESS",
            "script_error": None,
            "current_node": 3,
        }

    except RateLimitError:
        error_msg = "OpenAI rate limit exceeded. Please try again later."
        logger.error(f"❌ {error_msg}")
        return {
            **state,
            "script_generation_status": "FAILED",
            "script_error": error_msg,
            "execution_errors": state.get("execution_errors", []) + [error_msg],
            "current_node": 3,
        }

    except APIError as e:
        error_msg = f"OpenAI API error: {str(e)}"
        logger.error(f"❌ {error_msg}")
        return {
            **state,
            "script_generation_status": "FAILED",
            "script_error": error_msg,
            "execution_errors": state.get("execution_errors", []) + [error_msg],
            "current_node": 3,
        }

    except Exception as e:
        error_msg = f"Error in NODE 3: {str(e)}"
        logger.error(f"❌ {error_msg}")
        return {
            **state,
            "script_generation_status": "FAILED",
            "script_error": error_msg,
            "execution_errors": state.get("execution_errors", []) + [error_msg],
            "current_node": 3,
        }


def generate_rollback_script(vulnerability: dict, main_script: str) -> str:
    """Generate a rollback/restore script based on the main script"""

    service = vulnerability.get('service', 'service').lower()
    port = vulnerability.get('port', 'PORT')

    rollback_script = f"""#!/bin/bash
# Rollback script for {service} remediation
# This script will restore original configurations

set -e
LOG_FILE="/var/log/xploiteye_rollback_$(date +%s).log"
exec 1> >(tee $LOG_FILE)
exec 2>&1

echo "[*] Starting rollback for {service} remediation..."
echo "[*] Log file: $LOG_FILE"

# Restore from backups
echo "[*] Restoring original configurations..."

# Check for backup files
if ls /etc/{service}/*.backup* 1> /dev/null 2>&1; then
    for backup in /etc/{service}/*.backup*; do
        original=${{backup%.backup*}}
        echo "[*] Restoring ${{original}}..."
        sudo cp "${{backup}}" "${{original}}"
    done
else
    echo "[!] No backup files found. Manual restoration may be required."
fi

# Restart service
echo "[*] Restarting {service} service..."
sudo systemctl restart {service} || echo "[!] Service restart failed"

echo "[+] Rollback complete!"
echo "[+] Review changes before continuing"
"""

    return rollback_script
