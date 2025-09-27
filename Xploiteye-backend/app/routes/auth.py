"""
Authentication routes for user registration, login, and protected endpoints
"""

from fastapi import APIRouter, Depends, HTTPException, status, File, UploadFile, Form
from app.models.user import (
    UserCreate, UserLogin, UserResponse, Token, 
    MessageResponse, ErrorResponse, UserInDB, UserProfileUpdate, PasswordChangeRequest
)
from pydantic import BaseModel

class SessionTokenRequest(BaseModel):
    session_token: str
from app.services.user_service import UserService
from app.services.user_image_service import UserImageService
from app.auth.dependencies import get_current_user, get_current_active_user, get_user_service
from app.auth.security import SecurityUtils
from app.auth.google_oauth import GoogleOAuthService
from typing import Optional

router = APIRouter(prefix="/auth", tags=["Authentication"])

@router.get(
    "/check-username/{username}",
    summary="Check username availability",
    description="Check if a username is available"
)
async def check_username_availability(
    username: str,
    user_service: UserService = Depends(get_user_service)
):
    """Check if username is available"""
    existing_user = await user_service.get_user_by_username(username)
    return {
        "available": existing_user is None,
        "message": "Username is available" if existing_user is None else "Username is already taken"
    }

@router.post(
    "/register",
    response_model=MessageResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Register a new user",
    description="Create a new user account with email and password. Email verification is required."
)
async def register_user(
    user_data: UserCreate,
    user_service: UserService = Depends(get_user_service)
):
    """
    Register a new user
    
    - **email**: Valid email address
    - **username**: Unique username (3-50 characters)
    - **display_name**: Display name for the user  
    - **password**: Password (minimum 8 characters)
    """
    try:
        # Set default name if not provided or empty
        if not user_data.name.strip():
            user_data.name = user_data.username
            
        # Set default display name if not provided
        if not user_data.display_name.strip():
            user_data.display_name = user_data.name or user_data.username
        
        # Create user
        created_user = await user_service.create_user(user_data)
        
        # Simulate email verification (print to console as specified in requirements)
        verification_link = f"http://localhost:8000/auth/verify?token=mock_token_{created_user.id}"
        print(f"Email Verification Link: {verification_link}")
        
        return MessageResponse(
            message="Registration successful. Please check your email to verify your account."
        )
        
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e)
        )
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Registration failed. Please try again."
        )

@router.post(
    "/login",
    summary="Login user",
    description="Authenticate user. Returns JWT token or MFA challenge."
)
async def login_user(
    login_data: UserLogin,
    user_service: UserService = Depends(get_user_service)
):
    """
    Login user with username and password
    
    - **username**: User's username (or email)
    - **password**: User's password
    
    Returns JWT access token or MFA challenge if 2FA is enabled.
    """
    try:
        # Authenticate user  
        user = await user_service.authenticate_user(login_data.username, login_data.password)
        
        if not user:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Incorrect username or password",
                headers={"WWW-Authenticate": "Bearer"},
            )
        
        # Check if MFA is enabled
        if user.mfa_enabled and user.mfa_setup_complete:
            # Create temporary token for MFA verification
            temp_token = SecurityUtils.create_temp_token(data={
                "sub": str(user.id),
                "type": "mfa_temp"
            })
            
            return {
                "mfa_required": True,
                "temp_token": temp_token,
                "email": user.email,
                "message": "MFA verification required"
            }
        
        # No MFA required - proceed with normal login
        access_token = SecurityUtils.create_access_token(data={"sub": str(user.id)})
        
        # Extract JTI from token for single-session control
        jti = SecurityUtils.extract_jti_from_token(access_token)
        
        # Update user's active JWT identifier (invalidates old sessions)
        await user_service.update_active_jwt_identifier(str(user.id), jti)
        
        return Token(access_token=access_token, token_type="bearer")
        
    except HTTPException:
        raise
    except Exception as e:
        print(f"Login error: {str(e)}")  # Debug logging
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Login failed: {str(e)}"
        )

@router.get(
    "/me",
    response_model=UserResponse,
    summary="Get current user",
    description="Get current authenticated user information"
)
async def get_current_user_info(
    current_user: UserInDB = Depends(get_current_user)
):
    """Get current authenticated user information"""
    return {
        "id": str(current_user.id),
        "email": current_user.email,
        "username": current_user.username,
        "name": current_user.name,
        "display_name": current_user.display_name,
        "is_verified": current_user.is_verified,
        "role": current_user.role,
        "created_at": current_user.created_at,
        "is_oauth_user": current_user.is_oauth_user,
        "oauth_provider": current_user.oauth_provider,
        "has_custom_password": getattr(current_user, 'has_custom_password', True)
    }

@router.post("/change-password", response_model=MessageResponse)
async def change_password(
    password_data: PasswordChangeRequest,
    current_user: UserInDB = Depends(get_current_user),
    user_service: UserService = Depends(get_user_service)
):
    """Change user password"""
    try:
        # Special handling for OAuth users
        if current_user.is_oauth_user:
            # For OAuth users, treat empty current_password as first-time password setup
            if not password_data.current_password or password_data.current_password.strip() == "":
                # First time setting password for OAuth user
                success = await user_service.set_oauth_user_password(
                    str(current_user.id), 
                    password_data.new_password
                )
            else:
                # OAuth user who already set a custom password
                success = await user_service.change_password(
                    str(current_user.id), 
                    password_data.current_password, 
                    password_data.new_password
                )
        else:
            # Regular user password change
            success = await user_service.change_password(
                str(current_user.id), 
                password_data.current_password, 
                password_data.new_password
            )
        
        if not success:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Failed to change password"
            )
        
        return MessageResponse(message="Password changed successfully")
        
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e)
        )
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to change password"
        )

def get_image_service():
    """Dependency to get UserImageService instance"""
    from app.services.user_image_service import UserImageService
    return UserImageService()

@router.post("/upload-profile-image")
async def upload_profile_image(
    image: UploadFile = File(...),
    filename: str = Form(None),
    current_user: UserInDB = Depends(get_current_user),
    image_service: UserImageService = Depends(get_image_service)
):
    """Upload user profile image"""
    try:
        # Validate file type
        allowed_types = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif']
        if image.content_type not in allowed_types:
            raise HTTPException(status_code=400, detail="Only JPG, PNG, and GIF files are allowed")
        
        # Validate file size (max 5MB)
        file_content = await image.read()
        if len(file_content) > 5 * 1024 * 1024:
            raise HTTPException(status_code=400, detail="File size must be less than 5MB")
        
        # Save image with custom filename if provided
        custom_filename = filename or f"{current_user.username}"
        
        image_result = await image_service.save_user_image(
            user_id=str(current_user.id),
            file_content=file_content,
            original_filename=image.filename or "profile.jpg",
            mime_type=image.content_type or "image/jpeg",
            custom_filename=custom_filename
        )
        
        if not image_result:
            raise HTTPException(status_code=500, detail="Failed to save image")
        
        # Update user's avatar GridFS ID
        from app.services.user_service import UserService
        from app.database.mongodb import get_database
        db = await get_database()
        user_service = UserService(db)
        await user_service.update_user_profile(str(current_user.id), {
            "avatar_gridfs_id": image_result.gridfs_id
        })
        
        return {"message": "Profile image uploaded successfully", "image_url": f"/auth/profile-image/{current_user.id}"}
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to upload image: {str(e)}")

@router.get("/profile-image/{user_id}")
async def get_profile_image(
    user_id: str,
    image_service: UserImageService = Depends(get_image_service)
):
    """Get user profile image from GridFS"""
    try:
        # Get image metadata
        user_image = await image_service.get_user_image(user_id)
        if not user_image:
            raise HTTPException(status_code=404, detail="Image not found")
        
        # Get image binary data from GridFS
        image_data = await image_service.get_image_data(user_id)
        if not image_data:
            raise HTTPException(status_code=404, detail="Image data not found")
        
        # Return image as response
        from fastapi.responses import Response
        return Response(
            content=image_data,
            media_type=user_image.mime_type,
            headers={
                "Content-Disposition": f"inline; filename={user_image.original_filename}",
                "Cache-Control": "public, max-age=3600"  # Cache for 1 hour
            }
        )
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to get image: {str(e)}")

@router.put("/update-profile", response_model=UserResponse)
async def update_profile(
    profile_data: dict,
    current_user: UserInDB = Depends(get_current_user),
    user_service: UserService = Depends(get_user_service)
):
    """Update user profile WITHOUT forcing logout"""
    try:
        updated_user = await user_service.update_user_profile(str(current_user.id), profile_data)
        if not updated_user:
            raise HTTPException(status_code=404, detail="User not found")
        
        # DO NOT clear JWT identifier - allow user to stay logged in
        return updated_user
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to update profile: {str(e)}")

@router.post(
    "/logout",
    response_model=MessageResponse,
    summary="Logout user",
    description="Logout current user by invalidating their session"
)
async def logout_user(
    current_user: UserInDB = Depends(get_current_user),
    user_service: UserService = Depends(get_user_service)
):
    """
    Logout user by invalidating their active session
    """
    try:
        # Invalidate the user's session by clearing active JWT identifier
        await user_service.update_active_jwt_identifier(str(current_user.id), None)
        
        return MessageResponse(message="Successfully logged out")
        
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Logout failed. Please try again."
        )

# Google OAuth Routes
@router.get(
    "/google/login",
    summary="Initiate Google OAuth login",
    description="Redirect user to Google OAuth authorization page"
)
async def google_login():
    """Initiate Google OAuth login"""
    try:
        oauth_service = GoogleOAuthService()
        authorization_url = oauth_service.get_authorization_url()
        
        # Redirect to Google OAuth
        from fastapi.responses import RedirectResponse
        return RedirectResponse(url=authorization_url)
        
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to initiate Google login: {str(e)}"
        )

@router.get(
    "/google/callback",
    summary="Handle Google OAuth callback",
    description="Handle the callback from Google OAuth and create/login user"
)
async def google_callback(
    code: str,
    user_service: UserService = Depends(get_user_service)
):
    """Handle Google OAuth callback"""
    try:
        oauth_service = GoogleOAuthService()
        
        # Exchange code for tokens
        tokens = await oauth_service.exchange_code_for_tokens(code)
        
        # Get user info using access token (more reliable)
        user_info = await oauth_service.get_user_info(tokens['access_token'])
        
        # Check if user exists
        existing_user = await user_service.get_user_by_email(user_info['email'])
        
        if existing_user:
            # Update user with Google info if not already linked
            if not existing_user.google_id:
                update_data = {
                    'google_id': user_info['google_id'],
                    'oauth_provider': 'google',
                    'is_oauth_user': True
                }
                await user_service.update_user_profile(str(existing_user.id), update_data)
            
            # Login existing user
            user = existing_user
        else:
            # Create new user from Google info
            from app.models.user import UserCreate
            new_user_data = UserCreate(
                email=user_info['email'],
                username=user_info['email'].split('@')[0],  # Use email prefix as username
                name=user_info['name'],
                display_name=user_info['name'],
                password="GoogleOAuthUser123!"  # Placeholder password that meets validation requirements
            )
            
            user = await user_service.create_google_user(new_user_data, user_info['google_id'])
        
        # Import SecurityUtils at the top of the logic
        from app.auth.security import SecurityUtils
        
        # Check if MFA is enabled for existing user
        if user.mfa_enabled and user.mfa_setup_complete:
            # Create temporary token for MFA verification
            temp_token = SecurityUtils.create_temp_token(data={
                "sub": str(user.id),
                "type": "mfa_temp"
            })
            
            # Redirect to frontend with MFA requirement
            from fastapi.responses import RedirectResponse
            mfa_url = f"http://localhost:3000/signin?mfa_required=true&temp_token={temp_token}&email={user.email}"
            return RedirectResponse(url=mfa_url)
        
        # No MFA required - proceed with normal login
        access_token = SecurityUtils.create_access_token(data={"sub": str(user.id)})
        jti = SecurityUtils.extract_jti_from_token(access_token)
        
        # Update user's active JWT identifier
        await user_service.update_active_jwt_identifier(str(user.id), jti)
        
        # Create a secure session token for the redirect
        import secrets
        session_token = secrets.token_urlsafe(32)
        
        # Store the JWT token temporarily with the session token (in production, use Redis)
        # For now, we'll use a simple in-memory store
        from app.auth.session_store import store_temp_token
        store_temp_token(session_token, access_token)
        
        # Redirect to frontend with session token
        from fastapi.responses import RedirectResponse
        dashboard_url = f"http://localhost:3000/auth/callback?session={session_token}"
        return RedirectResponse(url=dashboard_url)
        
    except Exception as e:
        print(f"[OAuth Error] Google callback failed: {type(e).__name__}: {str(e)}")
        import traceback
        print(f"[OAuth Error] Full traceback: {traceback.format_exc()}")
        
        from fastapi.responses import RedirectResponse
        return RedirectResponse(
            url="http://localhost:3000/signin?error=google_login_failed"
        )

@router.post(
    "/exchange-session-token",
    response_model=Token,
    summary="Exchange session token for JWT",
    description="Exchange a temporary session token for a JWT access token"
)
async def exchange_session_token(request: SessionTokenRequest):
    """Exchange session token for JWT token"""
    try:
        session_token = request.session_token
        from app.auth.session_store import get_temp_token
        
        jwt_token = get_temp_token(session_token)
        
        if not jwt_token:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid or expired session token"
            )
        
        return Token(access_token=jwt_token, token_type="bearer")
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to exchange session token"
        )