"""
User Image models for XploitEye Backend - GridFS Version
"""

from datetime import datetime
from typing import Optional
from pydantic import BaseModel, Field
from bson import ObjectId

class UserImageBase(BaseModel):
    """Base user image model for GridFS"""
    user_id: str
    filename: str
    original_filename: str
    file_size: int
    mime_type: str
    gridfs_id: str  # GridFS file ID instead of file_path

class UserImageCreate(BaseModel):
    """User image creation model"""
    user_id: str
    filename: str
    original_filename: str
    file_size: int
    mime_type: str

class UserImageInDB(UserImageBase):
    """User image model as stored in database"""
    id: Optional[str] = Field(default=None, alias="_id")
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)
    
    class Config:
        from_attributes = True
        json_encoders = {ObjectId: str}

class UserImageResponse(UserImageBase):
    """User image response model (safe for API responses)"""
    id: str
    created_at: datetime
    
    class Config:
        from_attributes = True