from pydantic import BaseModel, Field, EmailStr
from typing import List, Optional, Dict, Any

# --- API Payloads ---

class RemediationRequest(BaseModel):
    scan_id: str = Field(..., description="ID of the completed scan")
    vulnerability_id: str = Field(..., description="ID of the vulnerability to remediate (e.g. CVE-2023-1234 or a unique Finding ID)")
    email: EmailStr = Field(..., description="Email to send the remediation package to")

class RemediationResponse(BaseModel):
    status: str
    message: str
    delivery_email: str
    artifacts_generated: List[str]

# --- Internal Context Models ---

class VulnerabilityContext(BaseModel):
    """Normalized internal representation of the vuln for the LLM"""
    vuln_id: str
    title: str
    description: str
    severity: str
    component: str # e.g. "Apache", "jQuery"
    version: str   # e.g. "2.4.41"
    port: Optional[str] = "N/A"
    evidence: Optional[str] = None
    url: str

class RemediationStrategy(BaseModel):
    """LLM Output Schema"""
    strategy_name: str = Field(..., description="Short title of the strategy")
    risk_analysis: str = Field(..., description="Executive summary of the risk")
    remediation_steps: List[str] = Field(..., description="Ordered list of high-level steps")
    verification_steps: List[str] = Field(..., description="How to verify the fix")
    file_artifacts: List[Dict[str, str]] = Field(..., description="List of files to generate. Key 'filename', Key 'content'")
