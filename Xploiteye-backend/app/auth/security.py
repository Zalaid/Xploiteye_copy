"""
Security utilities for authentication and authorization
"""

import uuid
from datetime import datetime, timedelta
from typing import Optional
import bcrypt
from jose import JWTError, jwt
from config.settings import settings

class SecurityUtils:
    """Security utility functions"""
    
    @staticmethod
    def hash_password(password: str) -> str:
        """Hash a password using bcrypt"""
        salt = bcrypt.gensalt()
        hashed = bcrypt.hashpw(password.encode('utf-8'), salt)
        return hashed.decode('utf-8')
    
    @staticmethod
    def verify_password(plain_password: str, hashed_password: str) -> bool:
        """Verify a password against its hash"""
        return bcrypt.checkpw(plain_password.encode('utf-8'), hashed_password.encode('utf-8'))
    
    @staticmethod
    def create_access_token(data: dict, expires_delta: Optional[timedelta] = None) -> str:
        """Create a JWT access token"""
        to_encode = data.copy()
        
        # Set expiration time
        if expires_delta:
            expire = datetime.utcnow() + expires_delta
        else:
            expire = datetime.utcnow() + timedelta(minutes=settings.jwt_access_token_expire_minutes)
        
        # Add standard claims
        to_encode.update({
            "exp": expire,
            "iat": datetime.utcnow(),
            "jti": str(uuid.uuid4())  # Unique token identifier for single-session control
        })
        
        # Create and return token
        encoded_jwt = jwt.encode(to_encode, settings.jwt_secret_key, algorithm=settings.jwt_algorithm)
        return encoded_jwt
    
    @staticmethod
    def decode_token(token: str) -> Optional[dict]:
        """Decode and validate a JWT token"""
        try:
            payload = jwt.decode(token, settings.jwt_secret_key, algorithms=[settings.jwt_algorithm])
            return payload
        except JWTError:
            return None
    
    @staticmethod
    def extract_jti_from_token(token: str) -> Optional[str]:
        """Extract JTI (JWT ID) from token for single-session validation"""
        payload = SecurityUtils.decode_token(token)
        return payload.get("jti") if payload else None
    
    @staticmethod
    def create_temp_token(data: dict, expires_delta: Optional[timedelta] = None) -> str:
        """Create a temporary JWT token for MFA verification"""
        to_encode = data.copy()
        
        # Set short expiration time for temp tokens (5 minutes)
        if expires_delta:
            expire = datetime.utcnow() + expires_delta
        else:
            expire = datetime.utcnow() + timedelta(minutes=5)
        
        # Add standard claims
        to_encode.update({
            "exp": expire,
            "iat": datetime.utcnow(),
            "jti": str(uuid.uuid4())
        })
        
        # Create and return token
        encoded_jwt = jwt.encode(to_encode, settings.jwt_secret_key, algorithm=settings.jwt_algorithm)
        return encoded_jwt