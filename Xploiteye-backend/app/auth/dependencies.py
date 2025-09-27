"""
Authentication dependencies for FastAPI
"""

from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from typing import Optional

from app.models.user import UserInDB, TokenData
from typing import Annotated
from app.auth.security import SecurityUtils

security = HTTPBearer()

async def get_current_user(
    credentials: HTTPAuthorizationCredentials = Depends(security)
) -> UserInDB:
    """
    Dependency to get current authenticated user with single-session validation
    """
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    
    session_expired_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Session expired. Please log in again.",
        headers={"WWW-Authenticate": "Bearer"},
    )
    
    try:
        # Extract token from credentials
        token = credentials.credentials
        
        # Decode token
        payload = SecurityUtils.decode_token(token)
        if payload is None:
            raise credentials_exception
        
        # Extract claims
        user_id: str = payload.get("sub")
        jti: str = payload.get("jti")
        
        if user_id is None or jti is None:
            raise credentials_exception
        
        # Get user from database
        from app.services.user_service import UserService
        from app.database.mongodb import get_database
        db = await get_database()
        user_service = UserService(db)
        user = await user_service.get_user_by_id(user_id)
        if user is None:
            raise credentials_exception
        
        # Critical: Verify single-session by checking JTI
        is_valid_session = await user_service.verify_user_session(user_id, jti)
        if not is_valid_session:
            raise session_expired_exception
        
        return user
        
    except HTTPException:
        raise
    except Exception:
        raise credentials_exception

async def get_current_active_user(
    current_user: UserInDB = Depends(get_current_user)
) -> UserInDB:
    """
    Dependency to get current active (verified) user
    """
    if not current_user.is_verified:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Account not verified. Please check your email."
        )
    return current_user

async def get_user_service():
    """Dependency to get UserService instance"""
    from app.services.user_service import UserService
    from app.database.mongodb import get_database
    db = await get_database()
    return UserService(db)