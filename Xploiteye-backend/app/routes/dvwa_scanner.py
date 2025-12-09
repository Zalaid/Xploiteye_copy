"""
DVWA Scanner API Routes
Handles DVWA vulnerability scanning requests
"""

from fastapi import APIRouter, Depends, HTTPException, status, BackgroundTasks
from fastapi.responses import StreamingResponse
from typing import Optional, Dict, Any, AsyncGenerator
from pydantic import BaseModel
import uuid
import logging
import asyncio
import json

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


class ExploitRequest(BaseModel):
    """Request model for vulnerability exploitation"""
    vulnerability_type: str  # e.g., "command_injection", "sql_injection"
    target: str = "http://192.168.0.176/dvwa"
    vulnerability_path: Optional[str] = None


class ExploitResponse(BaseModel):
    """Response model for exploitation"""
    exploit_id: str
    status: str
    message: str
    vulnerability_type: str
    target: str
    result: Optional[Dict[str, Any]] = None


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


async def exploit_command_injection(vulnerability_type: str, target: str) -> Dict[str, Any]:
    """
    Simulate command injection exploitation against DVWA
    Returns simulation data that mirrors real command execution
    """
    logger.info(f"Simulating {vulnerability_type} exploitation on {target}")

    exploitation_stages = [
        ("Establishing connection to target", 0.5),
        ("Analyzing vulnerability parameters", 1.0),
        ("Crafting payload", 1.5),
        ("Injecting command: cat /etc/shadow", 2.0),
        ("Receiving response", 1.5),
        ("Processing output", 1.0),
    ]

    # Simulated /etc/shadow content from a vulnerable system
    shadow_content = """root:$1$/avpfBJ1$x0z8w5UF9Iv./DR9E9Lid.:14747:0:99999:7:::
daemon:*:14684:0:99999:7:::
bin:*:14684:0:99999:7:::
sys:$1$fUX6BPOt$Miyc3UpOzQJqz4s5wFD9l0:14742:0:99999:7:::
sync:*:14684:0:99999:7:::
games:*:14684:0:99999:7:::
man:*:14684:0:99999:7:::
lp:*:14684:0:99999:7:::
mail:*:14684:0:99999:7:::
news:*:14684:0:99999:7:::
uucp:*:14684:0:99999:7:::
proxy:*:14684:0:99999:7:::
www-data:*:14684:0:99999:7:::
backup:*:14684:0:99999:7:::
list:*:14684:0:99999:7:::
irc:*:14684:0:99999:7:::
gnats:*:14684:0:99999:7:::
nobody:*:14684:0:99999:7:::
libuuid:!:14684:0:99999:7:::
dhcp:*:14684:0:99999:7:::
syslog:*:14684:0:99999:7:::
klog:$1$f2ZVMS4K$R9XkI.CmLdHhdUE3X9jqP0:14742:0:99999:7:::
sshd:*:14684:0:99999:7:::
msfadmin:$1$XN10Zj2c$Rt/zzCW3mLtUWA.ihZjA5/:14684:0:99999:7:::
bind:*:14685:0:99999:7:::
postfix:*:14685:0:99999:7:::
ftp:*:14685:0:99999:7:::
postgres:$1$Rw35ik.x$MgQgZUuO5pAoUvfJhfcYe/:14685:0:99999:7:::
mysql:!:14685:0:99999:7:::
tomcat55:*:14691:0:99999:7:::
distccd:*:14698:0:99999:7:::
user:$1$HESu9xrH$k.o3G93DGoXIiQKkPmUgZ0:14699:0:99999:7:::
service:$1$kR3ue7JZ$7GxELdupr5Ohp6cjZ3Bu//:14715:0:99999:7:::
telnetd:*:14715:0:99999:7:::
proftpd:!:14727:0:99999:7:::
statd:*:15474:0:99999:7:::"""

    return {
        "stages": exploitation_stages,
        "final_output": shadow_content,
        "command": "cat /etc/shadow",
        "success": True,
        "retrieved_data": shadow_content
    }


async def generate_exploit_stream(
    exploit_id: str,
    vulnerability_type: str,
    target: str
) -> AsyncGenerator[str, None]:
    """
    Generate a streaming response for exploitation that simulates real-time command execution
    """
    try:
        # Get exploitation stages and final output
        exploit_result = await exploit_command_injection(vulnerability_type, target)

        # Yield initial status
        yield json.dumps({
            "type": "status",
            "message": "Exploitation started",
            "exploit_id": exploit_id,
            "timestamp": asyncio.get_event_loop().time()
        }) + "\n"

        await asyncio.sleep(0.3)

        # Yield each stage with delays to simulate real execution
        for stage_message, delay in exploit_result["stages"]:
            yield json.dumps({
                "type": "stage",
                "message": stage_message,
                "exploit_id": exploit_id
            }) + "\n"
            await asyncio.sleep(delay)

        # Yield output line by line
        output_lines = exploit_result["final_output"].split('\n')
        yield json.dumps({
            "type": "output_start",
            "command": exploit_result["command"],
            "total_lines": len(output_lines)
        }) + "\n"

        await asyncio.sleep(0.5)

        # Stream each line of output with realistic delays
        for i, line in enumerate(output_lines):
            if line.strip():
                yield json.dumps({
                    "type": "output_line",
                    "line": line,
                    "line_number": i + 1,
                    "total_lines": len(output_lines)
                }) + "\n"
                # Variable delay between lines for realism
                await asyncio.sleep(0.1 + (i % 3) * 0.05)

        # Yield completion
        yield json.dumps({
            "type": "completion",
            "status": "success",
            "total_lines_retrieved": len([l for l in output_lines if l.strip()]),
            "exploit_id": exploit_id
        }) + "\n"

    except Exception as e:
        logger.error(f"Error in exploitation stream: {str(e)}")
        yield json.dumps({
            "type": "error",
            "message": str(e),
            "exploit_id": exploit_id
        }) + "\n"


@router.post("/exploit")
async def launch_exploitation(
    request: ExploitRequest,
    current_user: UserInDB = Depends(get_current_active_user)
):
    """
    Launch vulnerability exploitation with streaming response
    Returns Server-Sent Events stream showing real-time exploitation progress
    """
    try:
        exploit_id = str(uuid.uuid4())
        logger.info(f"Starting exploitation {exploit_id} for {request.vulnerability_type} on {request.target}")

        # Create async generator for streaming
        async def stream_exploit():
            async for chunk in generate_exploit_stream(
                exploit_id,
                request.vulnerability_type,
                request.target
            ):
                yield chunk.encode('utf-8')

        return StreamingResponse(
            stream_exploit(),
            media_type="text/event-stream",
            headers={
                "Cache-Control": "no-cache",
                "Connection": "keep-alive",
                "X-Exploit-ID": exploit_id
            }
        )

    except Exception as e:
        logger.error(f"Error launching exploitation: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error launching exploitation: {str(e)}"
        )


@router.post("/exploit-sync", response_model=ExploitResponse)
async def launch_exploitation_sync(
    request: ExploitRequest,
    current_user: UserInDB = Depends(get_current_active_user)
):
    """
    Launch vulnerability exploitation (non-streaming version for compatibility)
    Returns full result after exploitation completes
    """
    try:
        exploit_id = str(uuid.uuid4())
        logger.info(f"Starting exploitation {exploit_id} for {request.vulnerability_type} on {request.target}")

        result = await exploit_command_injection(request.vulnerability_type, request.target)

        return ExploitResponse(
            exploit_id=exploit_id,
            status="success",
            message="Exploitation completed successfully",
            vulnerability_type=request.vulnerability_type,
            target=request.target,
            result=result
        )

    except Exception as e:
        logger.error(f"Error launching exploitation: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error launching exploitation: {str(e)}"
        )
