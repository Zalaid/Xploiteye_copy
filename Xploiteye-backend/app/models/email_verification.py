"""
Email verification models for MongoDB
"""

from datetime import datetime, timedelta
from typing import Optional, Dict, Any
from pydantic import BaseModel, Field
from bson import ObjectId
import random
from app.auth.security import SecurityUtils


class EmailVerificationToken(BaseModel):
    """Email verification token model for MongoDB"""

    id: Optional[str] = Field(None, alias="_id")
    email: str
    username: str
    password_hash: str  # Hashed password stored temporarily
    code: str
    expires_at: datetime
    created_at: datetime = Field(default_factory=datetime.utcnow)

    class Config:
        populate_by_name = True
        arbitrary_types_allowed = True
        json_encoders = {
            ObjectId: str,
            datetime: lambda v: v.isoformat()
        }

    @classmethod
    def create_for_registration(cls, email: str, username: str, password: str) -> "EmailVerificationToken":
        """Create verification token for user registration"""
        # Generate 6-digit code
        code = ''.join([str(random.randint(0, 9)) for _ in range(6)])

        # Hash the password
        password_hash = SecurityUtils.hash_password(password)

        # Set expiration (10 minutes from now)
        expires_at = datetime.utcnow() + timedelta(minutes=10)

        return cls(
            email=email,
            username=username,
            password_hash=password_hash,
            code=code,
            expires_at=expires_at
        )

    def is_valid(self) -> bool:
        """Check if token is still valid (not expired)"""
        return datetime.utcnow() < self.expires_at

    def to_dict(self) -> Dict[str, Any]:
        """Convert to dictionary for MongoDB insertion"""
        data = self.dict(by_alias=True, exclude={"id"})
        return data


class EmailVerificationRequest(BaseModel):
    """Request model for email verification"""
    email: str
    code: str


class ResendVerificationRequest(BaseModel):
    """Request model for resending verification code"""
    email: str