"""
DVWA Scanner API Routes
Handles DVWA vulnerability scanning requests
"""

from fastapi import APIRouter, Depends, HTTPException, status, BackgroundTasks
from typing import Optional
from pydantic import BaseModel
import uuid
import logging

from app.models.user import UserInDB
from app.auth.dependencies import get_current_active_user
from app.services.dvwa_scanner_service import run_dvwa_scan, DVWAScanResult

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/dvwa", tags=["DVWA Scanner"])


class DVWAScanRequest(BaseModel):
    """Request model for DVWA scan"""
    target: str = "http://192.168.0.176/dvwa"
    lab_environment: Optional[str] = "dvwa"


class DVWAScanResponse(BaseModel):
    """Response model for DVWA scan"""
    scan_id: str
    status: str
    message: str
    data: Optional[DVWAScanResult] = None


@router.post("/scan", response_model=DVWAScanResponse)
async def start_dvwa_scan(
    request: DVWAScanRequest,
    current_user: UserInDB = Depends(get_current_active_user)
):
    """
    Start a DVWA vulnerability scan

    - **target**: Target URL for DVWA (default: http://192.168.0.176/dvwa)
    - **lab_environment**: Lab environment name (default: dvwa)
    """

    try:
        scan_id = str(uuid.uuid4())

        logger.info(f"Starting DVWA scan {scan_id} for user {current_user.email}")

        # Run scan asynchronously
        scan_result = await run_dvwa_scan(
            target=request.target,
            scan_id=scan_id
        )

        logger.info(f"DVWA scan {scan_id} completed successfully")

        return DVWAScanResponse(
            scan_id=scan_id,
            status="completed",
            message="DVWA scan completed successfully",
            data=scan_result
        )

    except Exception as e:
        logger.error(f"Error in DVWA scan: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error running DVWA scan: {str(e)}"
        )


@router.get("/health")
async def check_dvwa_health(
    target: str = "http://192.168.0.176/dvwa",
    current_user: UserInDB = Depends(get_current_active_user)
):
    """Check if DVWA target is accessible"""

    try:
        import requests

        response = requests.get(f"{target}/", timeout=5, verify=False)

        is_accessible = response.status_code in [200, 302, 403]

        return {
            "target": target,
            "accessible": is_accessible,
            "status_code": response.status_code if is_accessible else None,
            "message": "DVWA is accessible" if is_accessible else "DVWA is not accessible"
        }

    except Exception as e:
        return {
            "target": target,
            "accessible": False,
            "status_code": None,
            "message": f"Error checking DVWA health: {str(e)}"
        }
