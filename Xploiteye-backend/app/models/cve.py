from datetime import datetime
from typing import Optional, List
from pydantic import BaseModel, Field
from bson import ObjectId


class CVEInDB(BaseModel):
    id: Optional[str] = Field(default_factory=lambda: str(ObjectId()), alias="_id")
    cve_id: str
    severity: str  # critical, high, medium, low
    cvss_score: Optional[float] = None
    description: str
    exploitable: bool = False
    remediated: bool = False
    privilege_escalation: bool = False
    port: Optional[str] = None
    service: Optional[str] = None
    scan_id: str
    user_id: str
    target: str
    discovered_at: datetime = Field(default_factory=datetime.utcnow)

    class Config:
        populate_by_name = True
        arbitrary_types_allowed = True
        json_encoders = {ObjectId: str}


class CVEResponse(BaseModel):
    id: str
    cve_id: str
    severity: str
    cvss_score: Optional[float]
    description: str
    exploitable: bool
    remediated: bool
    privilege_escalation: bool
    port: Optional[str]
    service: Optional[str]
    target: str
    discovered_at: datetime


class CVEUpdate(BaseModel):
    remediated: Optional[bool] = None
    exploitable: Optional[bool] = None