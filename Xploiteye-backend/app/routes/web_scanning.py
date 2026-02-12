from fastapi import APIRouter, Depends, HTTPException, status, BackgroundTasks
from fastapi.responses import FileResponse
from pydantic import BaseModel, Field
from typing import List, Optional, Dict, Any
import uuid
import os
import datetime
import json
import logging
import aiofiles

from app.auth.dependencies import get_current_active_user
from app.models.user import UserInDB
from config.settings import settings
from app.services.web_scanning_service import process_web_scan, web_scan_results

router = APIRouter(prefix="/web-scanning", tags=["Web Application Scanning"])

class WebScanRequest(BaseModel):
    url: str = Field(..., description="Target URL to scan (e.g., https://example.com)")
    email: Optional[str] = Field(None, description="Optional email to receive the report")

class WebScanResponse(BaseModel):
    scan_id: str
    message: str

# In-memory store imported from service

@router.post("/start", response_model=WebScanResponse)
async def start_web_scan(
    request: WebScanRequest, 
    background_tasks: BackgroundTasks,
    current_user: UserInDB = Depends(get_current_active_user)
):
    """
    Start a deep web application security audit.
    Includes Recon, SSL, Port Scan, Tech Detection, and CVE Mapping.
    """
    scan_id = str(uuid.uuid4())
    web_scan_results[scan_id] = {"status": "Starting", "target": request.url, "user_id": str(current_user.id)}
    
    # Start the background scan process
    background_tasks.add_task(process_web_scan, scan_id, request.url, request.email, str(current_user.id))
    
    return WebScanResponse(
        scan_id=scan_id, 
        message="Web scan initiated successfuly. You will be notified upon completion."
    )

@router.get("/status/{scan_id}")
async def get_web_scan_status(
    scan_id: str,
    current_user: UserInDB = Depends(get_current_active_user)
):
    """Check the status and results of a web scan"""
    if scan_id in web_scan_results:
        result = web_scan_results[scan_id]
        if result.get("user_id") != str(current_user.id):
             raise HTTPException(status_code=403, detail="Access denied")
        return result
        
    # Check filesystem fallback
    output_dir = os.path.join(settings.results_dir, "web_scans")
    file_path = os.path.join(output_dir, f"{scan_id}.json")
    if os.path.exists(file_path):
        async with aiofiles.open(file_path, mode='r') as f:
            content = await f.read()
            return json.loads(content)
            
    raise HTTPException(status_code=404, detail="Scan ID not found")

@router.get("/download-report/{scan_id}")
async def download_web_report(
    scan_id: str,
    current_user: UserInDB = Depends(get_current_active_user)
):
    """Download the professional PDF report for the scan"""
    report_dir = os.path.join(settings.reports_dir, "web_scans")
    report_path = os.path.join(report_dir, f"Report_{scan_id}.pdf")
    
    if os.path.exists(report_path):
        # In a real app, we'd check ownership here too
        return FileResponse(
            report_path, 
            media_type="application/pdf", 
            filename=f"XploitEye_WebScan_Report_{scan_id}.pdf"
        )
    raise HTTPException(status_code=404, detail="Report not found")
