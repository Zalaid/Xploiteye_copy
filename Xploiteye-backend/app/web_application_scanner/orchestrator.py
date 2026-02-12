import os
import aiofiles
from app.web_application_scanner.models import RemediationRequest, RemediationResponse
from app.web_application_scanner.context_builder import build_vulnerability_context
from app.web_application_scanner.strategy_engine import generate_remediation_strategy
from app.web_application_scanner.artifact_generator import create_remediation_package
from app.web_application_scanner.report_generator.email_service import EmailConfig

# Reuse existing email service logic, but specialized for ZIP attachment
# We need to import smtplib and basic construction again or refactor email_service.
# For simplicity and speed, let's implement a quick sender here or reuse if possible.
import smtplib
from email.mime.multipart import MIMEMultipart
from email.mime.text import MIMEText
from email.mime.base import MIMEBase
from email import encoders

async def run_blue_agent_remediation(request: RemediationRequest):
    """
    Orchestrator for the Blue Agent Flow.
    1. Build Context
    2. Generate Strategy (LLM)
    3. Create Artifacts (ZIP)
    4. Email User
    """
    print(f"\n[BLUE-AGENT] Starting remediation for {request.vulnerability_id}...")
    
    try:
        # Step 1: Context
        context = await build_vulnerability_context(request.scan_id, request.vulnerability_id)
        
        # Step 2: Strategy
        strategy = await generate_remediation_strategy(context)
        
        # Step 3: Artifacts
        zip_path = await create_remediation_package(strategy, request.scan_id, request.vulnerability_id)
        
        # Step 4: Email
        await send_remediation_email(request.email, zip_path, strategy, context)
        
        print(f"[BLUE-AGENT] SUCCESS. Package sent to {request.email}")
        
    except Exception as e:
        print(f"[BLUE-AGENT] ERROR: {str(e)}")
        # In a real system, we might want to notify user of failure via email too
        

async def send_remediation_email(to_email: str, zip_path: str, strategy, context):
    """
    Sends the remediation ZIP to the user.
    """
    msg = MIMEMultipart()
    msg['From'] = EmailConfig.DEFAULT_FROM_EMAIL
    msg['To'] = to_email
    msg['Subject'] = f"[XploitEye] Remediation Plan: {context.vuln_id}"
    
    body = f"""
    <html>
    <body style="font-family: Arial, sans-serif;">
        <h2 style="color: #1976D2;">XploitEye Blue Agent</h2>
        <p>A remediation strategy has been generated for <b>{context.url}</b>.</p>
        
        <div style="background: #f4f4f4; padding: 15px; margin: 10px 0;">
            <h3>Target: {context.vuln_id} ({context.title})</h3>
            <p><b>Risk Analysis:</b> {strategy.risk_analysis}</p>
        </div>
        
        <h3>Recommended Action Plan</h3>
        <ul>
            {''.join(f'<li>{step}</li>' for step in strategy.remediation_steps)}
        </ul>
        
        <p><b>Attached:</b> A complete remediation package including scripts and detailed guides.</p>
    </body>
    </html>
    """
    msg.attach(MIMEText(body, 'html'))
    
    # Attach ZIP
    with open(zip_path, "rb") as f:
        part = MIMEBase('application', 'zip')
        part.set_payload(f.read())
        encoders.encode_base64(part)
        part.add_header('Content-Disposition', f'attachment; filename="{os.path.basename(zip_path)}"')
        msg.attach(part)
        
    # Send
    server = smtplib.SMTP(EmailConfig.SMTP_SERVER, EmailConfig.SMTP_PORT)
    server.starttls()
    server.login(EmailConfig.SMTP_USERNAME, EmailConfig.SMTP_PASSWORD)
    server.send_message(msg)
    server.quit()
