"""
Password reset models for MongoDB
"""

from datetime import datetime, timedelta
from typing import Optional, Dict, Any
from pydantic import BaseModel, Field, EmailStr
from bson import ObjectId
import secrets
import hashlib


class PasswordResetToken(BaseModel):
    """Password reset token model for MongoDB"""

    id: Optional[str] = Field(None, alias="_id")
    user_id: str
    email: str
    token_hash: str  # Hashed version of the token for security
    expires_at: datetime
    created_at: datetime = Field(default_factory=datetime.utcnow)
    used: bool = Field(default=False)

    class Config:
        populate_by_name = True
        arbitrary_types_allowed = True
        json_encoders = {
            ObjectId: str,
            datetime: lambda v: v.isoformat()
        }

    @classmethod
    def create_for_user(cls, user_id: str, email: str) -> tuple["PasswordResetToken", str]:
        """Create reset token for user and return both token object and raw token"""
        # Generate secure random token
        raw_token = secrets.token_urlsafe(32)

        # Hash the token before storing
        token_hash = hashlib.sha256(raw_token.encode()).hexdigest()

        # Set expiration (1 hour from now)
        expires_at = datetime.utcnow() + timedelta(hours=1)

        token_obj = cls(
            user_id=user_id,
            email=email,
            token_hash=token_hash,
            expires_at=expires_at
        )

        return token_obj, raw_token

    def is_valid(self) -> bool:
        """Check if token is still valid (not expired and not used)"""
        return not self.used and datetime.utcnow() < self.expires_at

    def verify_token(self, raw_token: str) -> bool:
        """Verify if the provided raw token matches this token"""
        token_hash = hashlib.sha256(raw_token.encode()).hexdigest()
        return self.token_hash == token_hash and self.is_valid()

    def to_dict(self) -> Dict[str, Any]:
        """Convert to dictionary for MongoDB insertion"""
        data = self.dict(by_alias=True, exclude={"id"})
        return data


class ForgotPasswordRequest(BaseModel):
    """Request model for forgot password"""
    email: EmailStr


class ResetPasswordRequest(BaseModel):
    """Request model for reset password"""
    token: str
    new_password: str = Field(..., min_length=8, description="New password must be at least 8 characters")

    class Config:
        schema_extra = {
            "example": {
                "token": "abc123token",
                "new_password": "newSecurePassword123!"
            }
        }