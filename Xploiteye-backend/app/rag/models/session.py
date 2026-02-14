"""
Xploit Eye - Session Model
"""
from pydantic import BaseModel, Field
from typing import Optional
from datetime import datetime, timedelta
from bson import ObjectId
from app.rag.models.user import PyObjectId


class Session(BaseModel):
    """Session database model for tracking user scan report uploads"""
    id: Optional[PyObjectId] = Field(default_factory=PyObjectId, alias="_id")
    user_id: str
    session_id: str  # Unique identifier for this session
    scan_report_name: str
    qdrant_collection: str  # user_scan_{user_id}_{session_id}
    created_at: datetime = Field(default_factory=datetime.utcnow)
    last_activity: datetime = Field(default_factory=datetime.utcnow)
    expires_at: datetime
    is_active: bool = True
    
    class Config:
        populate_by_name = True
        arbitrary_types_allowed = True
        json_encoders = {ObjectId: str}


class SessionCreate(BaseModel):
    """Session creation schema"""
    scan_report_name: str
    session_expire_days: int = 7
    
    class Config:
        json_schema_extra = {
            "example": {
                "scan_report_name": "nessus_scan_2024_01_15.pdf",
                "session_expire_days": 7
            }
        }


class SessionResponse(BaseModel):
    """Session response schema"""
    id: str
    user_id: str
    session_id: str
    scan_report_name: str
    qdrant_collection: str
    created_at: datetime
    last_activity: datetime
    expires_at: datetime
    is_active: bool
    chunks_count: Optional[int] = None
    
    class Config:
        json_schema_extra = {
            "example": {
                "id": "507f1f77bcf86cd799439011",
                "user_id": "507f191e810c19729de860ea",
                "session_id": "sess_abc123xyz",
                "scan_report_name": "nessus_scan_2024_01_15.pdf",
                "qdrant_collection": "user_scan_507f191e810c19729de860ea_sess_abc123xyz",
                "created_at": "2024-01-15T10:00:00",
                "last_activity": "2024-01-15T14:30:00",
                "expires_at": "2024-01-22T10:00:00",
                "is_active": True,
                "chunks_count": 145
            }
        }
