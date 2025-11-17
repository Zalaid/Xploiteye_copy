"""
Blue Agent API Routes
Endpoints for Blue Agent remediation workflow
"""

import logging
from fastapi import APIRouter, HTTPException
from fastapi.responses import StreamingResponse, Response
import json
from pydantic import BaseModel
from typing import Optional, List, Dict, Any
import io
import zipfile
from app.blueagentnetwork.services import (
    run_blue_agent_workflow,
    fetch_remediation_strategy,
    generate_remediation_script,
    assess_impact,
    package_and_email,
)

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api/blue-agent", tags=["Blue Agent"])


# ═══════════════════════════════════════════════════════════════════════════
# PYDANTIC MODELS FOR REQUEST VALIDATION
# ═══════════════════════════════════════════════════════════════════════════

class VulnerabilityModel(BaseModel):
    """Vulnerability data model"""
    cve: str
    service: str
    version: str
    port: int
    severity: str
    description: Optional[str] = None


class RemediationStrategyModel(BaseModel):
    """Remediation strategy model"""
    cve: str
    service: str
    port: int
    strategy_points: List[str]
    estimated_complexity: Optional[str] = "medium"
    requires_downtime: Optional[bool] = True


class GeneratedScriptModel(BaseModel):
    """Generated script model"""
    script_content: str
    language: str
    filename: str
    backup_script: Optional[str] = None


class ImpactAssessmentModel(BaseModel):
    """Impact assessment model"""
    risk_level: str
    estimated_downtime_seconds: int
    affected_services: List[str] = []
    dangerous_commands: List[str] = []
    prerequisite_checks: List[str] = []
    reversible: bool = False
    requires_sudo: bool = False


class LoadVulnerabilityRequest(BaseModel):
    """Load vulnerability endpoint request"""
    vulnerability: VulnerabilityModel


class FetchRemediationRequest(BaseModel):
    """Fetch remediation strategy endpoint request"""
    vulnerability: VulnerabilityModel


class GenerateScriptRequest(BaseModel):
    """Generate script endpoint request"""
    vulnerability: VulnerabilityModel
    remediation_strategy: RemediationStrategyModel


class AssessImpactRequest(BaseModel):
    """Assess impact endpoint request"""
    vulnerability: VulnerabilityModel
    generated_script: GeneratedScriptModel


class PackageAndEmailRequest(BaseModel):
    """Package and email endpoint request"""
    vulnerability: VulnerabilityModel
    generated_script: GeneratedScriptModel
    impact_assessment: ImpactAssessmentModel
    user_email: str


class ExecuteFullWorkflowRequest(BaseModel):
    """Full workflow endpoint request"""
    vulnerability: VulnerabilityModel
    user_email: Optional[str] = None


@router.post("/load-vulnerability")
async def load_vulnerability(request: LoadVulnerabilityRequest):
    """
    NODE 1: Load and validate vulnerability data
    """

    try:
        vulnerability = request.vulnerability.dict()

        logger.info(f"✅ Loaded vulnerability: {vulnerability['cve']}")

        return {
            "status": "success",
            "vulnerability": vulnerability,
            "message": "Vulnerability loaded successfully",
        }

    except Exception as e:
        logger.error(f"❌ Error loading vulnerability: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/fetch-remediation")
async def fetch_remediation(request: FetchRemediationRequest):
    """
    NODE 2: Fetch remediation strategy from GPT-3.5-turbo
    """

    try:
        vulnerability = request.vulnerability.dict()
        result = await fetch_remediation_strategy(vulnerability)

        if result.get("status") == "error":
            raise HTTPException(status_code=500, detail=result.get("error"))

        return {
            "status": "success",
            "strategy": result.get("remediation_strategy"),
            "message": "Remediation strategy generated",
        }

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"❌ Error fetching remediation: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/generate-script")
async def generate_script(request: GenerateScriptRequest):
    """
    NODE 3: Generate remediation script with GPT-3.5-turbo
    """

    try:
        vulnerability = request.vulnerability.dict()
        remediation_strategy = request.remediation_strategy.dict()

        result = await generate_remediation_script(
            vulnerability=vulnerability,
            remediation_strategy=remediation_strategy,
        )

        if result.get("status") == "error":
            raise HTTPException(status_code=500, detail=result.get("error"))

        return {
            "status": "success",
            "script": result.get("generated_script"),
            "message": "Remediation script generated",
        }

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"❌ Error generating script: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/assess-impact")
async def assess_impact_endpoint(request: AssessImpactRequest):
    """
    NODE 4: Assess impact and risk of remediation script
    """

    try:
        vulnerability = request.vulnerability.dict()
        generated_script = request.generated_script.dict()

        result = await assess_impact(
            vulnerability=vulnerability,
            generated_script=generated_script,
        )

        if result.get("status") == "error":
            raise HTTPException(status_code=500, detail=result.get("error"))

        return {
            "status": "success",
            "impact": result.get("impact_assessment"),
            "message": "Impact assessment completed",
        }

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"❌ Error assessing impact: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/package-and-email")
async def package_and_email_endpoint(request: PackageAndEmailRequest):
    """
    NODE 5: Package remediation files and email to user
    """

    try:
        vulnerability = request.vulnerability.dict()
        generated_script = request.generated_script.dict()
        impact_assessment = request.impact_assessment.dict()
        user_email = request.user_email

        result = await package_and_email(
            vulnerability=vulnerability,
            generated_script=generated_script,
            impact_assessment=impact_assessment,
            user_email=user_email,
        )

        if result.get("status") == "error":
            raise HTTPException(status_code=500, detail=result.get("error"))

        return {
            "status": "success",
            "email_sent": result.get("email_sent"),
            "package_filename": result.get("package_filename"),
            "message": "Remediation package sent",
        }

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"❌ Error packaging and emailing: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/execute-full-workflow")
async def execute_full_workflow(request: ExecuteFullWorkflowRequest):
    """
    Execute complete Blue Agent workflow in streaming mode
    """

    async def workflow_generator():
        """Stream workflow updates to client"""

        try:
            vulnerability = request.vulnerability.dict()
            user_email = request.user_email

            # Stream workflow updates
            async for update in run_blue_agent_workflow(
                vulnerability=vulnerability,
                user_email=user_email,
            ):
                # Send as Server-Sent Event
                yield f"data: {json.dumps(update)}\n\n"

        except Exception as e:
            logger.error(f"❌ Workflow streaming error: {str(e)}")
            yield f"data: {json.dumps({'status': 'error', 'message': str(e)})}\n\n"

    return StreamingResponse(
        workflow_generator(),
        media_type="text/event-stream",
    )


class DownloadPackageRequest(BaseModel):
    """Download remediation package request"""
    vulnerability: VulnerabilityModel
    generated_script: GeneratedScriptModel
    impact_assessment: ImpactAssessmentModel


@router.post("/download-package")
async def download_package(request: DownloadPackageRequest):
    """
    Download remediation package as ZIP file
    """

    try:
        from app.blueagentnetwork.nodes.node_5_package_and_email import (
            generate_readme,
            generate_impact_summary,
            generate_execution_checklist,
        )

        vulnerability = request.vulnerability.dict()
        generated_script = request.generated_script.dict()
        impact_assessment = request.impact_assessment.dict()

        logger.info(f"📦 Creating remediation package for download: {vulnerability.get('cve')}")

        # Create ZIP package in memory
        zip_buffer = io.BytesIO()

        with zipfile.ZipFile(zip_buffer, 'w', zipfile.ZIP_DEFLATED) as zip_file:
            # Add main remediation script
            script_filename = generated_script.get("filename", "remediate.sh")
            script_content = generated_script.get("script_content", "")

            zip_file.writestr(script_filename, script_content)
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

        # Reset buffer position for reading
        zip_buffer.seek(0)

        logger.info(f"✅ Package created for download: {package_filename}")

        # Return ZIP as response with proper headers
        return Response(
            content=zip_buffer.getvalue(),
            media_type="application/zip",
            headers={"Content-Disposition": f"attachment; filename={package_filename}"},
        )

    except Exception as e:
        logger.error(f"❌ Error creating download package: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/health")
async def health_check():
    """Blue Agent health check endpoint"""

    return {
        "status": "healthy",
        "agent": "blue-agent",
        "message": "Blue Agent is operational",
    }
