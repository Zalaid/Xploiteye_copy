"""
Network Scanning API routes for XploitEye Backend
"""

from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.responses import FileResponse
from typing import List, Optional
import os
import logging
import subprocess
import asyncio

from app.models.scan import (
    ScanRequest, ScanResponse, ReportRequest, ReportResponse, ScanStatus
)
from app.models.user import UserInDB
from app.auth.dependencies import get_current_active_user
from app.services.scanning_service import get_scanning_service
from app.services.cve_service import CVEService
from app.scanning.network_discovery import NetworkDiscovery
from app.scanning.PortDiscovery import PortDiscovery
from config.settings import settings
from config.logging_config import scanning_logger
from pydantic import BaseModel
from typing import Dict, Any

router = APIRouter(prefix="/scanning", tags=["Network Scanning"])

class StoreCVEsRequest(BaseModel):
    scan_id: str
    target: str
    vulnerabilities: List[dict]

class IPCheckRequest(BaseModel):
    target: str

class IPCheckResponse(BaseModel):
    is_reachable: bool
    target: str
    message: str

class NetworkDiscoveryRequest(BaseModel):
    network_range: Optional[str] = None  # e.g., "192.168.1.0/24" or auto-detect

class NetworkDiscoveryResponse(BaseModel):
    status: str
    message: str
    data: Dict[str, Any]
    json_result: Dict[str, Any]

class PortDiscoveryRequest(BaseModel):
    target: str
    port: int

class PortDiscoveryResponse(BaseModel):
    status: str
    message: str
    data: Dict[str, Any]
    json_result: Dict[str, Any]

@router.post("/start", response_model=ScanResponse)
async def start_scan(
    scan_request: ScanRequest,
    current_user: UserInDB = Depends(get_current_active_user)
):
    """Start a new network scan"""
    try:
        scanning_service = get_scanning_service()
        result = await scanning_service.start_scan(scan_request, current_user)

        # Log meaningful scan start message
        scanning_logger.scan_started(
            result.scan_id,
            scan_request.target,
            scan_request.scan_type.value,
            current_user.id
        )

        return result
    except Exception as e:
        scanning_logger.scan_failed("unknown", scan_request.target, str(e))
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to start scan: {str(e)}"
        )

@router.post("/check-ip", response_model=IPCheckResponse)
async def check_ip_reachability(
    request: IPCheckRequest,
    current_user: UserInDB = Depends(get_current_active_user)
):
    """Check if target IP is reachable using arping"""
    import time
    start_time = time.time()

    try:
        target_ip = request.target.strip()
        print(f"🟡 [BACKEND] IP check request received for: {target_ip}")

        # Use sudo arping for network scanning (configured in sudoers)
        cmd = ["sudo", "arping", "-c", "1", "-W", "2", target_ip]
        print(f"🟡 [BACKEND] Executing command: {' '.join(cmd)}")

        # Check if we're running as root (not required with sudo)
        import os
        if os.geteuid() != 0:
            print(f"🟡 [BACKEND] Running as user (UID: {os.geteuid()}). Using sudo for arping.")
        else:
            print(f"🟢 [BACKEND] Running as root (UID: {os.geteuid()}). Arping should work directly.")

        # Execute arping with timeout
        process = await asyncio.create_subprocess_exec(
            *cmd,
            stdout=asyncio.subprocess.PIPE,
            stderr=asyncio.subprocess.PIPE
        )

        try:
            print(f"🟡 [BACKEND] Waiting for arping process to complete...")
            stdout, stderr = await asyncio.wait_for(process.communicate(), timeout=5.0)
            return_code = process.returncode

            execution_time = time.time() - start_time
            stdout_text = stdout.decode().strip()
            stderr_text = stderr.decode().strip()

            print(f"🟡 [BACKEND] Arping completed in {execution_time:.3f}s, return code: {return_code}")
            print(f"🟡 [BACKEND] STDOUT: {stdout_text}")
            print(f"🟡 [BACKEND] STDERR: {stderr_text}")

            # Check for permission/interface issues
            if "you may need to run as root" in stderr_text:
                print(f"🔴 [BACKEND] PERMISSION ERROR: Arping needs root privileges")
                return IPCheckResponse(
                    is_reachable=False,
                    target=target_ip,
                    message=f"Permission denied: Please run backend with sudo for network scanning"
                )

            if "No such device" in stderr_text:
                print(f"🔴 [BACKEND] INTERFACE ERROR: Network interface issue")
                return IPCheckResponse(
                    is_reachable=False,
                    target=target_ip,
                    message=f"Network interface error: Cannot access network interface for scanning"
                )

            if return_code == 0:
                # IP is reachable
                print(f"🟢 [BACKEND] SUCCESS: IP {target_ip} is reachable via arping")
                logging.info(f"IP {target_ip} is reachable via arping")
                return IPCheckResponse(
                    is_reachable=True,
                    target=target_ip,
                    message=f"IP {target_ip} is active and reachable"
                )
            else:
                # IP is not reachable
                print(f"🔴 [BACKEND] FAILED: IP {target_ip} is not reachable via arping")
                logging.info(f"IP {target_ip} is not reachable via arping")
                return IPCheckResponse(
                    is_reachable=False,
                    target=target_ip,
                    message=f"IP {target_ip} is not reachable in the network"
                )

        except asyncio.TimeoutError:
            # Timeout occurred
            execution_time = time.time() - start_time
            print(f"🔴 [BACKEND] TIMEOUT: IP {target_ip} check timed out after {execution_time:.3f}s")

            if process.returncode is None:
                process.kill()
                await process.wait()

            logging.info(f"IP {target_ip} check timed out")
            return IPCheckResponse(
                is_reachable=False,
                target=target_ip,
                message=f"IP {target_ip} check timed out - not reachable"
            )

    except Exception as e:
        execution_time = time.time() - start_time
        print(f"🔴 [BACKEND] EXCEPTION: Error checking IP {target_ip} after {execution_time:.3f}s: {str(e)}")
        logging.error(f"Error checking IP {target_ip}: {str(e)}")
        return IPCheckResponse(
            is_reachable=False,
            target=target_ip,
            message=f"Error checking IP: {str(e)}"
        )

@router.get("/status/{scan_id}", response_model=ScanResponse)
async def get_scan_status(
    scan_id: str,
    current_user: UserInDB = Depends(get_current_active_user)
):
    """Get scan status and results"""
    scanning_service = get_scanning_service()
    result = await scanning_service.get_scan_status(scan_id, current_user)

    if not result:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Scan not found"
        )

    # Log meaningful status check
    scanning_logger.scan_status_check(scan_id, result.status.value, result.target)

    return result

@router.get("/list", response_model=List[ScanResponse])
async def list_user_scans(
    limit: int = 50,
    skip: int = 0,
    current_user: UserInDB = Depends(get_current_active_user)
):
    """Get all scans for the current user"""
    scanning_service = get_scanning_service()
    return await scanning_service.get_user_scans(current_user, limit, skip)

@router.post("/cancel/{scan_id}")
async def cancel_scan(
    scan_id: str,
    current_user: UserInDB = Depends(get_current_active_user)
):
    """Cancel a running scan"""
    scanning_service = get_scanning_service()
    success = await scanning_service.cancel_scan(scan_id, current_user)

    if not success:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Scan not found or cannot be cancelled"
        )

    return {"message": "Scan cancelled successfully"}

@router.post("/store-cves")
async def store_cves_from_scan(
    request: StoreCVEsRequest,
    current_user: UserInDB = Depends(get_current_active_user)
):
    """Store CVEs found during scan into database"""
    try:
        cve_service = CVEService()
        stored_ids = await cve_service.store_cves_from_scan(
            request.scan_id,
            current_user,
            request.target,
            request.vulnerabilities
        )

        # Log meaningful CVE processing
        scanning_logger.cve_processing(request.scan_id, len(stored_ids), request.target)

        return {
            "message": "CVEs stored successfully",
            "stored_count": len(stored_ids),
            "stored_ids": stored_ids
        }
    except Exception as e:
        logging.error(f"Failed to store CVEs: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to store CVEs: {str(e)}"
        )

@router.post("/generate-report", response_model=ReportResponse)
async def generate_pdf_report(
    report_request: ReportRequest,
    current_user: UserInDB = Depends(get_current_active_user)
):
    """Generate PDF report from scan results"""
    scanning_service = get_scanning_service()
    result = await scanning_service.generate_pdf_report(
        report_request.scan_id,
        current_user,
        report_request.report_name
    )

    if result.status == "error":
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=result.message
        )

    return result

@router.get("/reports")
async def list_available_reports(
    current_user: UserInDB = Depends(get_current_active_user)
):
    """List all available PDF reports for the current user"""
    scanning_service = get_scanning_service()
    reports = await scanning_service.get_available_reports(current_user)

    return {
        "reports": reports,
        "count": len(reports),
        "reports_directory": settings.reports_dir
    }

@router.get("/download-report/{filename}")
async def download_report(
    filename: str,
    current_user: UserInDB = Depends(get_current_active_user)
):
    """Download a PDF report"""
    # Verify the file belongs to the current user
    if not filename.startswith(f"{current_user.id}_"):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Access denied to this report"
        )

    file_path = os.path.join(settings.reports_dir, filename)

    if not os.path.exists(file_path):
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Report file not found"
        )

    return FileResponse(
        path=file_path,
        filename=filename,
        media_type="application/pdf"
    )

@router.get("/results/{scan_id}")
async def get_scan_results_json(
    scan_id: str,
    current_user: UserInDB = Depends(get_current_active_user)
):
    """Get detailed scan results in JSON format"""
    scanning_service = get_scanning_service()
    scan_data = await scanning_service.get_scan_status(scan_id, current_user)

    if not scan_data:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Scan not found"
        )

    if scan_data.status != ScanStatus.COMPLETED:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Scan not completed"
        )

    if not scan_data.results:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Scan results not available"
        )

    return scan_data.results.get("scan_results", {})

@router.post("/network-discovery", response_model=NetworkDiscoveryResponse)
async def network_discovery_endpoint(
    request: NetworkDiscoveryRequest
):
    """
    Network Discovery Service
    - Discovers devices on network
    - Gets IP addresses and MAC addresses
    - Returns structured JSON with GPT analysis
    """
    try:
        # Initialize network discovery service
        network_discovery = NetworkDiscovery()

        # Log network discovery start
        logging.info(f"Network discovery started for range: {request.network_range}")

        # Perform network discovery
        result = await network_discovery.discover_network(request.network_range)

        # Log successful completion
        logging.info(f"Network discovery completed")

        return NetworkDiscoveryResponse(
            status="success",
            message="Network discovery completed",
            data=result["raw_data"],
            json_result=result["gpt_analysis"]
        )

    except Exception as e:
        # Log error
        logging.error(f"Network discovery failed: {str(e)}")

        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Network discovery failed: {str(e)}"
        )

@router.post("/port-discovery", response_model=PortDiscoveryResponse)
async def port_discovery_endpoint(
    request: PortDiscoveryRequest
):
    """
    Port Discovery Service
    - Checks if specific port is open
    - Detects service version
    - Looks up CVEs using service information
    - Returns structured JSON with GPT analysis
    """
    try:
        # Initialize port discovery service
        port_discovery = PortDiscovery()

        # Log port discovery start
        logging.info(f"Port discovery started for {request.target}:{request.port}")

        # Perform port discovery
        result = await port_discovery.scan_port(request.target, request.port)

        # Log successful completion
        logging.info(f"Port discovery completed for {request.target}:{request.port}")

        return PortDiscoveryResponse(
            status="success",
            message=f"Port discovery completed for {request.target}:{request.port}",
            data=result["raw_data"],
            json_result=result["gpt_analysis"]
        )

    except Exception as e:
        # Log error
        logging.error(f"Port discovery failed: {str(e)}")

        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Port discovery failed: {str(e)}"
        )

@router.get("/health")
async def scanning_health_check():
    """Health check for scanning service"""
    try:
        # Check if required directories exist
        results_dir_exists = os.path.exists(settings.results_dir)
        reports_dir_exists = os.path.exists(settings.reports_dir)

        # Check if required environment variables are set
        openai_key_set = bool(os.getenv("OPENAI_API_KEY"))

        return {
            "status": "healthy",
            "results_directory": settings.results_dir,
            "reports_directory": settings.reports_dir,
            "results_dir_exists": results_dir_exists,
            "reports_dir_exists": reports_dir_exists,
            "openai_configured": openai_key_set,
            "message": "Scanning service is operational"
        }
    except Exception as e:
        logging.error(f"Scanning health check failed: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Scanning service unhealthy: {str(e)}"
        )