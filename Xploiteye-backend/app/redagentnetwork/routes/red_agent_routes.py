"""
Red Agent API Routes
Endpoints for starting exploitations, checking status, and retrieving results
"""

from fastapi import APIRouter, Depends, HTTPException, status
from typing import List, Optional
from pydantic import BaseModel

from app.auth.dependencies import get_current_user
from app.models.user import UserInDB
from app.redagentnetwork.services import get_red_agent_service

# Create router
router = APIRouter(tags=["Red Agent"])

# ═══════════════════════════════════════════════════════════════════════════════
# REQUEST/RESPONSE MODELS
# ═══════════════════════════════════════════════════════════════════════════════


class StartExploitationRequest(BaseModel):
    """Request to start an exploitation"""
    target: str
    port: int
    service: str
    version: str
    cve_ids: Optional[List[str]] = None

    class Config:
        schema_extra = {
            "example": {
                "target": "192.168.1.100",
                "port": 21,
                "service": "vsftpd",
                "version": "2.3.4",
                "cve_ids": ["CVE-2011-2523"]
            }
        }


class ExploitationResponse(BaseModel):
    """Exploitation response"""
    status: str
    exploitation_id: str
    message: str
    target: Optional[str] = None
    port: Optional[int] = None
    service: Optional[str] = None


class ExploitationResult(BaseModel):
    """Exploitation result"""
    validated: bool
    target_reachable: bool
    port_open: bool
    msf_rpc_connected: bool
    os_type: Optional[str] = None
    exploits_found: int
    exploits_selected: int
    sessions_opened: int
    is_root: bool
    primary_session_id: Optional[int] = None
    primary_session_type: Optional[str] = None
    pwn_rc_generated: bool
    log_file: Optional[str] = None
    session_dir: Optional[str] = None


class ExploitationStatusResponse(BaseModel):
    """Exploitation status response"""
    exploitation_id: str
    user_id: str
    target: str
    port: int
    service: str
    version: str
    cve_ids: List[str]
    started_at: str
    completed_at: Optional[str] = None
    status: str
    result: Optional[ExploitationResult] = None
    error: Optional[str] = None


# ═══════════════════════════════════════════════════════════════════════════════
# ENDPOINTS
# ═══════════════════════════════════════════════════════════════════════════════


@router.post("/test-start")
async def test_start_exploitation(request: StartExploitationRequest) -> dict:
    """
    TEST ENDPOINT: Start exploitation WITHOUT authentication (for testing only)
    Returns a mock exploitation ID immediately for testing Socket.io
    """
    import uuid

    exploitation_id = f"test_exp_{uuid.uuid4().hex[:8]}"

    return {
        "status": "started",
        "exploitation_id": exploitation_id,
        "message": f"[TEST MODE] Exploitation workflow started for {request.target}:{request.port} ({request.service})",
        "target": request.target,
        "port": request.port,
        "service": request.service
    }


@router.post("/start", response_model=ExploitationResponse)
async def start_exploitation(
    request: StartExploitationRequest,
    current_user: UserInDB = Depends(get_current_user)
) -> dict:
    """
    Start a new exploitation workflow

    **Request Body:**
    - `target`: Target IP address (must be on local network: 10.x, 172.16-31.x, 192.168.x, 127.x)
    - `port`: Target port number
    - `service`: Service name (ssh, ftp, http, mysql, postgresql, etc.)
    - `version`: Service version
    - `cve_ids`: Optional list of CVE identifiers to target

    **Response:**
    Returns exploitation ID and initial status

    **Example:**
    ```json
    {
        "target": "192.168.1.100",
        "port": 21,
        "service": "vsftpd",
        "version": "2.3.4",
        "cve_ids": ["CVE-2011-2523"]
    }
    ```
    """
    service = get_red_agent_service()

    cve_ids = request.cve_ids or []

    response = await service.start_exploitation(
        target=request.target,
        port=request.port,
        service=request.service,
        version=request.version,
        cve_ids=cve_ids,
        user=current_user
    )

    if response["status"] == "error":
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=response["message"]
        )

    return response


@router.get("/status/{exploitation_id}", response_model=ExploitationStatusResponse)
async def get_exploitation_status(
    exploitation_id: str,
    current_user: UserInDB = Depends(get_current_user)
) -> dict:
    """
    Get status of an exploitation workflow

    **Parameters:**
    - `exploitation_id`: ID of the exploitation to check

    **Response:**
    Returns current status, progress, and results (if completed)

    **Status Values:**
    - `in_progress`: Exploitation is running
    - `completed`: Exploitation finished
    - `failed`: Exploitation failed

    **Example Response (In Progress):**
    ```json
    {
        "exploitation_id": "user123_192.168.1.100_21_...",
        "status": "in_progress",
        "result": null
    }
    ```

    **Example Response (Completed):**
    ```json
    {
        "exploitation_id": "user123_192.168.1.100_21_...",
        "status": "completed",
        "result": {
            "validated": true,
            "sessions_opened": 1,
            "is_root": true,
            "primary_session_id": 1
        }
    }
    ```
    """
    service = get_red_agent_service()

    exploitation_data = await service.get_exploitation_status(
        exploitation_id,
        current_user
    )

    if not exploitation_data:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Exploitation not found"
        )

    # Convert datetime to string
    exploitation_data["started_at"] = exploitation_data["started_at"].isoformat()
    if exploitation_data["completed_at"]:
        exploitation_data["completed_at"] = exploitation_data["completed_at"].isoformat()

    return exploitation_data


@router.get("/history", response_model=List[ExploitationStatusResponse])
async def get_exploitation_history(
    limit: int = 50,
    skip: int = 0,
    current_user: UserInDB = Depends(get_current_user)
) -> list:
    """
    Get exploitation history for current user

    **Parameters:**
    - `limit`: Number of exploitations to return (default: 50)
    - `skip`: Number of exploitations to skip (default: 0)

    **Response:**
    List of past exploitations sorted by date (newest first)

    **Example:**
    ```bash
    # Get last 10 exploitations
    GET /api/red-agent/history?limit=10&skip=0

    # Get next 10 (pagination)
    GET /api/red-agent/history?limit=10&skip=10
    ```
    """
    service = get_red_agent_service()

    exploitations = await service.get_user_exploitations(
        current_user,
        limit=limit,
        skip=skip
    )

    # Convert datetime to string
    for exploitation in exploitations:
        exploitation["started_at"] = exploitation["started_at"].isoformat()
        if exploitation.get("completed_at"):
            exploitation["completed_at"] = exploitation["completed_at"].isoformat()

    return exploitations


@router.get("/health")
async def health_check() -> dict:
    """
    Check Red Agent service health

    **Response:**
    Returns service status and configuration
    """
    return {
        "status": "healthy",
        "service": "Red Agent Network",
        "version": "1.0.0",
        "metasploit_integration": "enabled"
    }


# ═══════════════════════════════════════════════════════════════════════════════
# ERROR HANDLERS
# ═══════════════════════════════════════════════════════════════════════════════


@router.post("/validate-target")
async def validate_target(
    target: str,
    current_user: UserInDB = Depends(get_current_user)
) -> dict:
    """
    Validate target before starting exploitation

    **Parameters:**
    - `target`: Target IP address to validate

    **Response:**
    Returns validation status and any issues

    **Example:**
    ```json
    {
        "valid": true,
        "message": "Target is on local network",
        "is_local": true,
        "is_reachable": null
    }
    ```
    """
    service = get_red_agent_service()

    is_local = service._is_local_network(target)

    if not is_local:
        return {
            "valid": False,
            "message": "Only local network targets allowed",
            "is_local": False
        }

    return {
        "valid": True,
        "message": "Target passed validation",
        "is_local": True
    }
