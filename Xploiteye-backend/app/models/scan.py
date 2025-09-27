"""
Scan models for network scanning functionality
"""

from pydantic import BaseModel, Field
from typing import Optional, Dict, List, Any
from datetime import datetime
from enum import Enum

class ScanType(str, Enum):
    """Supported scan types"""
    LIGHT = "light"
    MEDIUM = "medium"
    DEEP = "deep"

class ScanStatus(str, Enum):
    """Scan status values"""
    PENDING = "pending"
    RUNNING = "running"
    COMPLETED = "completed"
    FAILED = "failed"
    CANCELLED = "cancelled"
    COMPLETED_FILE_MISSING = "completed_file_missing"

class ScanRequest(BaseModel):
    """Request model for starting a network scan"""
    scan_type: ScanType = Field(..., description="Type of scan to perform")
    target: str = Field(..., min_length=1, description="Target IP address, domain, or network")

class ScanResponse(BaseModel):
    """Response model for scan operations"""
    scan_id: str = Field(..., description="Unique scan identifier")
    status: ScanStatus = Field(..., description="Current scan status")
    message: str = Field(..., description="Status message")
    target: str = Field(..., description="Scan target")
    scan_type: ScanType = Field(..., description="Type of scan")
    user_id: str = Field(..., description="User who initiated the scan")
    started_at: datetime = Field(..., description="Scan start timestamp")
    completed_at: Optional[datetime] = Field(None, description="Scan completion timestamp")
    results: Optional[Dict[str, Any]] = Field(None, description="Scan results")
    json_file_path: Optional[str] = Field(None, description="Path to JSON results file")
    txt_file_path: Optional[str] = Field(None, description="Path to TXT report file")

class ScanSummary(BaseModel):
    """Summary model for scan results"""
    target: str
    scan_type: str
    user_id: str
    scan_duration: float
    timestamp: str
    ports_scanned: int
    open_ports: int
    critical_ports: int
    vulnerable_ports: int
    cves_found: int
    risk_score: int
    risk_level: str

class ServiceInfo(BaseModel):
    """Service information model"""
    port: str
    service: str
    version: Optional[str]
    protocol: str = "tcp"
    state: str = "open"

class VulnerabilityInfo(BaseModel):
    """Vulnerability information model"""
    port: str
    service: str
    cve_id: str
    severity: str
    cvss_score: str

class ScanResults(BaseModel):
    """Complete scan results model"""
    summary: ScanSummary
    scan_coverage: Dict[str, Any]
    os_information: Dict[str, Any]
    risk_assessment: Dict[str, Any]
    services: List[ServiceInfo]
    gpt_selected_services: List[ServiceInfo]
    vulnerabilities: List[VulnerabilityInfo]

class ReportRequest(BaseModel):
    """Request model for generating reports"""
    scan_id: str = Field(..., description="Scan ID to generate report for")
    report_name: Optional[str] = Field(None, description="Custom report name")

class ReportResponse(BaseModel):
    """Response model for report generation"""
    status: str = Field(..., description="Report generation status")
    message: str = Field(..., description="Status message")
    pdf_file: Optional[str] = Field(None, description="Generated PDF filename")
    pdf_path: Optional[str] = Field(None, description="Full path to PDF file")
    scan_id: str = Field(..., description="Source scan ID")