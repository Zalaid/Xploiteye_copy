"""
User models for XploitEye Backend
"""

from datetime import datetime
from typing import Optional
from pydantic import BaseModel, EmailStr, Field, validator
from bson import ObjectId
import re

class UserBase(BaseModel):
    """Base user model"""
    email: EmailStr
    username: str = Field(..., min_length=3, max_length=50, description="Username must be 3-50 characters, lowercase letters, numbers, and underscores only")
    name: str = Field(..., min_length=2, max_length=100, description="Full name of the user")
    display_name: str
    
    @validator('username')
    def validate_username(cls, v):
        if not re.match(r'^[a-z0-9_]+$', v):
            raise ValueError('Username must contain only lowercase letters, numbers, and underscores')
        if v.startswith('_') or v.endswith('_'):
            raise ValueError('Username cannot start or end with underscore')
        if '__' in v:
            raise ValueError('Username cannot contain consecutive underscores')
        return v

class UserCreate(UserBase):
    """User creation model"""
    password: str = Field(..., min_length=8, description="Password must be at least 8 characters with uppercase, lowercase, number, and special character")
    
    @validator('password')
    def validate_password(cls, v):
        if len(v) < 8:
            raise ValueError('Password must be at least 8 characters long')
        if not re.search(r'[A-Z]', v):
            raise ValueError('Password must contain at least one uppercase letter')
        if not re.search(r'[a-z]', v):
            raise ValueError('Password must contain at least one lowercase letter')
        if not re.search(r'\d', v):
            raise ValueError('Password must contain at least one number')
        if not re.search(r'[!@#$%^&*()_+\-=\[\]{}|;:,.<>?]', v):
            raise ValueError('Password must contain at least one special character')
        return v

class UserLogin(BaseModel):
    """User login model"""
    username: str  # Can login with username instead of email
    password: str

class UserInDB(UserBase):
    """User model as stored in database"""
    id: Optional[str] = Field(default=None, alias="_id")
    hashed_password: str
    role: str = Field(default="user", description="User role: admin, analyst, user")
    active_jwt_identifier: Optional[str] = Field(default=None)
    google_id: Optional[str] = Field(default=None, description="Google OAuth user ID")
    oauth_provider: Optional[str] = Field(default=None, description="OAuth provider (google, etc.)")
    is_oauth_user: bool = Field(default=False, description="Whether user signed up via OAuth")
    has_custom_password: bool = Field(default=True, description="Whether user has set a custom password")
    avatar_gridfs_id: Optional[str] = Field(default=None, description="GridFS file ID for user avatar")
    mfa_enabled: bool = Field(default=False, description="Whether MFA is enabled for this user")
    mfa_secret: Optional[str] = Field(default=None, description="TOTP secret key for MFA")
    mfa_setup_complete: bool = Field(default=False, description="Whether MFA setup is complete")
    recovery_codes: Optional[list] = Field(default=None, description="MFA recovery codes")
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)
    
    class Config:
        populate_by_name = True
        arbitrary_types_allowed = True
        json_encoders = {ObjectId: str}

class UserResponse(UserBase):
    """User response model (safe for API responses)"""
    id: str
    role: str
    created_at: datetime
    
    class Config:
        from_attributes = True

class Token(BaseModel):
    """JWT Token model"""
    access_token: str
    token_type: str = "bearer"

class UserProfileUpdate(BaseModel):
    """User profile update model"""
    name: Optional[str] = None
    display_name: Optional[str] = None
    email: Optional[EmailStr] = None
    username: Optional[str] = None
    bio: Optional[str] = None
    profile_image: Optional[str] = None

class PasswordChangeRequest(BaseModel):
    """Password change request model"""
    current_password: str = Field(..., description="Current password")
    new_password: str = Field(..., min_length=8, description="New password must be at least 8 characters")

class TokenData(BaseModel):
    """Token data model"""
    email: Optional[str] = None
    user_id: Optional[str] = None
    jti: Optional[str] = None

class MessageResponse(BaseModel):
    """Generic message response"""
    message: str
    
class ErrorResponse(BaseModel):
    """Error response model"""
    detail: str

# MFA Models
class MFASetupRequest(BaseModel):
    """MFA setup completion request"""
    totp_code: str = Field(..., min_length=6, max_length=6, description="6-digit TOTP code")

class MFAVerifyRequest(BaseModel):
    """MFA verification request"""
    totp_code: str = Field(..., min_length=6, max_length=6, description="6-digit TOTP code")

class MFADisableRequest(BaseModel):
    """MFA disable request"""
    current_password: str = Field(..., description="Current password")
    totp_code: str = Field(..., min_length=6, max_length=6, description="6-digit TOTP code")

class RecoveryCodeRequest(BaseModel):
    """Recovery code usage request"""
    recovery_code: str = Field(..., description="MFA recovery code")

class MFASetupResponse(BaseModel):
    """MFA setup response"""
    qr_code: str = Field(..., description="Base64 encoded QR code image")
    secret: str = Field(..., description="TOTP secret key")
    backup_url: str = Field(..., description="Manual entry backup URL")
    recovery_codes: list = Field(..., description="Recovery codes for backup")

class MFAStatusResponse(BaseModel):
    """MFA status response"""
    mfa_enabled: bool = Field(..., description="Whether MFA is enabled")
    setup_complete: bool = Field(..., description="Whether MFA setup is complete")
    recovery_codes_remaining: int = Field(..., description="Number of recovery codes remaining")