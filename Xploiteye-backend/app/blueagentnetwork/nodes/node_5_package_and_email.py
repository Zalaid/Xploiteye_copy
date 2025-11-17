"""
NODE 5: Package and Email
Creates ZIP package with remediation files and emails to user
"""

import logging
import zipfile
import io
import json
import os
from datetime import datetime
from typing import Optional, Tuple

logger = logging.getLogger(__name__)


async def package_and_email_node(state: dict) -> dict:
    """
    NODE 5: Package remediation files into ZIP and email to user

    Input: Generated script and impact assessment
    Output: ZIP package created and emailed to user
    """

    try:
        logger.info("🔵 [NODE 5] Packaging remediation files...")

        # Skip if script not generated
        if state.get("script_generation_status") != "SUCCESS":
            error_msg = "Skipping Node 5: Script not generated successfully"
            logger.warning(f"⚠️  {error_msg}")
            return {
                **state,
                "email_status": "SKIPPED",
                "current_node": 5,
            }

        # Get required data
        vulnerability = state.get("vulnerability")
        generated_script = state.get("generated_script")
        impact_assessment = state.get("impact_assessment")
        user_email = state.get("user_email")

        # Create ZIP package in memory
        zip_buffer = io.BytesIO()

        with zipfile.ZipFile(zip_buffer, 'w', zipfile.ZIP_DEFLATED) as zip_file:
            # Add main remediation script
            script_filename = generated_script.get("filename", "remediate.sh")
            script_content = generated_script.get("script_content", "")

            zip_file.writestr(
                script_filename,
                script_content
            )
            logger.info(f"   ✓ Added {script_filename}")

            # Add rollback script
            rollback_filename = script_filename.replace("remediate_", "rollback_")
            rollback_content = generated_script.get("backup_script", "")

            if rollback_content:
                zip_file.writestr(rollback_filename, rollback_content)
                logger.info(f"   ✓ Added {rollback_filename}")

            # Add README with instructions
            readme_content = generate_readme(vulnerability, impact_assessment, script_filename)
            zip_file.writestr("README.md", readme_content)
            logger.info(f"   ✓ Added README.md")

            # Add impact summary
            impact_summary = generate_impact_summary(vulnerability, impact_assessment)
            zip_file.writestr("impact_summary.txt", impact_summary)
            logger.info(f"   ✓ Added impact_summary.txt")

            # Add execution checklist
            checklist_json = generate_execution_checklist(vulnerability, impact_assessment)
            zip_file.writestr("execution_checklist.json", checklist_json)
            logger.info(f"   ✓ Added execution_checklist.json")

        # Generate package filename
        cve = vulnerability.get('cve', 'UNKNOWN').replace('/', '-')
        port = vulnerability.get('port', 'PORT')
        package_filename = f"remediation_{cve}_port-{port}.zip"

        # Email the package
        if user_email:
            logger.info(f"📧 Preparing to email package to {user_email}...")

            email_status, email_error = await send_remediation_email(
                user_email=user_email,
                vulnerability=vulnerability,
                zip_buffer=zip_buffer,
                package_filename=package_filename,
                impact_assessment=impact_assessment,
            )

            if email_status == "SUCCESS":
                logger.info(f"✅ Package emailed successfully to {user_email}")
                return {
                    **state,
                    "package_filename": package_filename,
                    "email_sent": True,
                    "email_status": "SUCCESS",
                    "email_error": None,
                    "current_node": 5,
                    "workflow_complete": True,
                }
            else:
                logger.error(f"❌ Failed to email package: {email_error}")
                return {
                    **state,
                    "package_filename": package_filename,
                    "email_sent": False,
                    "email_status": "FAILED",
                    "email_error": email_error,
                    "execution_errors": state.get("execution_errors", []) + [email_error],
                    "current_node": 5,
                }
        else:
            logger.warning("⚠️  No email provided, skipping email delivery")
            return {
                **state,
                "package_filename": package_filename,
                "email_sent": False,
                "email_status": "SKIPPED",
                "email_error": "No user email provided",
                "current_node": 5,
            }

    except Exception as e:
        error_msg = f"Error in NODE 5: {str(e)}"
        logger.error(f"❌ {error_msg}")
        return {
            **state,
            "email_status": "FAILED",
            "email_error": error_msg,
            "execution_errors": state.get("execution_errors", []) + [error_msg],
            "current_node": 5,
        }


async def send_remediation_email(
    user_email: str,
    vulnerability: dict,
    zip_buffer: io.BytesIO,
    package_filename: str,
    impact_assessment: dict,
) -> Tuple[str, Optional[str]]:
    """Send remediation package via email"""

    try:
        from app.services.email_service import EmailService
        from app.database.mongodb import get_database

        cve = vulnerability.get('cve', 'UNKNOWN')
        service = vulnerability.get('service', 'Unknown Service')
        severity = vulnerability.get('severity', 'unknown').upper()
        port = vulnerability.get('port', 'PORT')
        downtime = impact_assessment.get('estimated_downtime_seconds', 0)

        # Extract shell script content from generated script if available
        script_content = ""
        if isinstance(vulnerability, dict) and 'generated_script' in vulnerability:
            script_content = vulnerability.get('generated_script', {}).get('script_content', '')

        # Create email subject
        subject = f"[XploitEye] Remediation Package - {cve} (Port {port})"

        # Create email message body
        email_message = f"""XploitEye Remediation Package

Your remediation package for the following vulnerability is ready:

VULNERABILITY DETAILS:
  CVE:              {cve}
  Service:          {service}
  Port:             {port}
  Severity:         {severity}
  Estimated Downtime: {downtime} seconds
  Risk Level:       {impact_assessment.get('risk_level', 'MEDIUM')}

PACKAGE CONTENTS:
  - remediate_*.sh         - Main remediation script
  - rollback_*.sh          - Rollback/restore script
  - README.md              - Detailed execution instructions
  - impact_summary.txt     - Impact assessment details
  - execution_checklist.json - Pre-flight checklist

EXECUTION STEPS:
  1. Download the ZIP file: {package_filename}
  2. Transfer to your target system
  3. Extract the ZIP file
  4. Read README.md carefully
  5. Review impact_summary.txt
  6. Complete execution_checklist.json items
  7. Execute: sudo bash remediate_*.sh
  8. Verify system functionality

IMPORTANT:
  Review all files and understand what the script does before execution.
  Test in a non-production environment first if possible.

Generated: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}

For questions, contact your security team.
---
This is an automated message from XploitEye Blue Agent.
"""

        # Get database and create email service
        db = await get_database()
        email_service = EmailService(db)

        # Initialize EmailConfig from environment
        from app.services.email_service import EmailConfig
        EmailConfig.SMTP_USERNAME = os.getenv("GMAIL_USERNAME", "")
        EmailConfig.SMTP_PASSWORD = os.getenv("GMAIL_APP_PASSWORD", "")
        EmailConfig.DEFAULT_FROM_EMAIL = os.getenv("DEFAULT_FROM_EMAIL", "")

        # Send email with ZIP attachment and script content in body
        success = await email_service.send_remediation_package_email(
            to_email=user_email,
            subject=subject,
            message=email_message,
            script_content=script_content,
            zip_buffer=zip_buffer,
            package_filename=package_filename,
        )

        if success:
            return "SUCCESS", None
        else:
            return "FAILED", "Email service returned failure"

    except ImportError as e:
        logger.error(f"Import error when sending remediation email: {e}")
        return "FAILED", "Email service not available"
    except Exception as e:
        logger.error(f"Error sending remediation email: {e}")
        return "FAILED", str(e)


def generate_readme(vulnerability: dict, impact_assessment: dict, script_filename: str) -> str:
    """Generate README.md with execution instructions"""

    cve = vulnerability.get('cve', 'UNKNOWN')
    service = vulnerability.get('service', 'Unknown')
    version = vulnerability.get('version', 'Unknown')
    port = vulnerability.get('port', 'PORT')
    severity = vulnerability.get('severity', 'unknown').upper()
    downtime = impact_assessment.get('estimated_downtime_seconds', 0)

    readme = f"""# Remediation Package for {cve}

## Vulnerability Details
- **CVE ID:** {cve}
- **Service:** {service} v{version}
- **Port:** {port}
- **Severity:** {severity}
- **Description:** {vulnerability.get('description', 'N/A')}

## Impact Assessment
- **Risk Level:** {impact_assessment.get('risk_level', 'MEDIUM')}
- **Estimated Downtime:** {downtime} seconds
- **Reversible:** {'Yes' if impact_assessment.get('reversible') else 'No'}
- **Requires Sudo:** {'Yes' if impact_assessment.get('requires_sudo') else 'No'}

## Affected Services
{chr(10).join([f'- {svc}' for svc in impact_assessment.get('affected_services', [])])}

## Pre-Execution Checklist
Please complete these items BEFORE running the remediation script:

{chr(10).join([f'- [ ] {check}' for check in impact_assessment.get('prerequisite_checks', [])])}

## Dangerous Commands
This script contains the following potentially dangerous commands:
{chr(10).join([f'- `{cmd}`' for cmd in impact_assessment.get('dangerous_commands', [])])}

**Review each command carefully before execution.**

## Execution Instructions

### 1. Backup Current Configuration
```bash
sudo cp -r /etc/{service.lower()} /etc/{service.lower()}.backup
```

### 2. Make the Script Executable
```bash
chmod +x {script_filename}
```

### 3. Run the Remediation Script
```bash
sudo bash {script_filename}
```

### 4. Verify the Changes
Review the execution log and verify the service is working correctly.

## Rollback Instructions

If something goes wrong, you can restore the original configuration:

```bash
chmod +x rollback_{script_filename.replace('remediate_', '')}
sudo bash rollback_{script_filename.replace('remediate_', '')}
```

## Support

If you encounter issues:
1. Check the log file at `/var/log/xploiteye_remediation_*.log`
2. Review the rollback procedures
3. Contact your security team

---

Generated by XploitEye Blue Agent
"""

    return readme


def generate_impact_summary(vulnerability: dict, impact_assessment: dict) -> str:
    """Generate impact_summary.txt"""

    summary = f"""XploitEye Remediation - Impact Summary
{'='*50}

Vulnerability Information:
  CVE: {vulnerability.get('cve')}
  Service: {vulnerability.get('service')} v{vulnerability.get('version')}
  Port: {vulnerability.get('port')}
  Severity: {vulnerability.get('severity').upper()}

Impact Assessment:
  Risk Level: {impact_assessment.get('risk_level')}
  Estimated Downtime: {impact_assessment.get('estimated_downtime_seconds')} seconds
  Reversible: {'Yes' if impact_assessment.get('reversible') else 'No'}
  Requires Sudo: {'Yes' if impact_assessment.get('requires_sudo') else 'No'}

Affected Services:
  {chr(10).join(['  - ' + svc for svc in impact_assessment.get('affected_services', [])])}

Dangerous Commands:
  {chr(10).join(['  - ' + cmd for cmd in impact_assessment.get('dangerous_commands', [])])}

Generated: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}
"""

    return summary


def generate_execution_checklist(vulnerability: dict, impact_assessment: dict) -> str:
    """Generate execution_checklist.json"""

    checklist = {
        "cve": vulnerability.get('cve'),
        "service": vulnerability.get('service'),
        "port": vulnerability.get('port'),
        "timestamp": datetime.now().isoformat(),
        "pre_execution_checks": [
            {
                "item": check,
                "completed": False,
            }
            for check in impact_assessment.get('prerequisite_checks', [])
        ],
        "impact_assessment": impact_assessment,
        "post_execution_verification": [
            "Service is running correctly",
            "All configurations are in place",
            "No errors in system logs",
            "Network connectivity is maintained",
        ],
    }

    return json.dumps(checklist, indent=2)
