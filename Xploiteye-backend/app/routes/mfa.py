"""
Multi-Factor Authentication routes for XploitEye Backend
"""

from datetime import datetime, timedelta
from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials

from app.models.user import (
    MFASetupRequest, MFAVerifyRequest, MFADisableRequest, 
    MFASetupResponse, MFAStatusResponse, RecoveryCodeRequest,
    MessageResponse
)
from app.services.user_service import UserService
from app.auth.dependencies import get_current_user, get_user_service
from app.auth.security import SecurityUtils
from app.models.user import UserInDB, Token
from app.utils.mfa import mfa_utils

router = APIRouter(prefix="/mfa", tags=["Multi-Factor Authentication"])
security = HTTPBearer()

@router.get("/status", response_model=MFAStatusResponse)
async def get_mfa_status(
    current_user: UserInDB = Depends(get_current_user)
):
    """
    Get current MFA status for the authenticated user
    """
    try:
        # Count remaining recovery codes
        remaining_codes = 0
        if current_user.recovery_codes:
            remaining_codes = len([code for code in current_user.recovery_codes if code])
        
        return MFAStatusResponse(
            mfa_enabled=current_user.mfa_enabled,
            setup_complete=current_user.mfa_setup_complete,
            recovery_codes_remaining=remaining_codes
        )
    
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to get MFA status: {str(e)}"
        )

@router.post("/setup/initiate", response_model=MFASetupResponse)
async def initiate_mfa_setup(
    current_user: UserInDB = Depends(get_current_user),
    user_service: UserService = Depends(get_user_service)
):
    """
    Initiate MFA setup - generates secret and QR code
    """
    try:
        if current_user.mfa_enabled:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="MFA is already enabled for this account"
            )
        
        # Generate TOTP secret
        secret = mfa_utils.generate_secret()
        
        # Generate QR code
        qr_code = mfa_utils.generate_qr_code(current_user.email, secret)
        
        # Generate backup URL
        backup_url = mfa_utils.generate_backup_url(current_user.email, secret)
        
        # Generate recovery codes
        recovery_codes = mfa_utils.generate_recovery_codes()
        
        # Store temporary secret in user record (not activated yet)
        await user_service.store_temp_mfa_secret(current_user.email, secret, recovery_codes)
        
        return MFASetupResponse(
            qr_code=qr_code,
            secret=secret,
            backup_url=backup_url,
            recovery_codes=recovery_codes
        )
    
    except HTTPException as e:
        raise e
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to initiate MFA setup: {str(e)}"
        )

@router.post("/setup/complete", response_model=MessageResponse)
async def complete_mfa_setup(
    setup_request: MFASetupRequest,
    current_user: UserInDB = Depends(get_current_user),
    user_service: UserService = Depends(get_user_service)
):
    """
    Complete MFA setup by verifying TOTP code
    """
    try:
        if current_user.mfa_enabled:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="MFA is already enabled for this account"
            )
        
        if not current_user.mfa_secret:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="MFA setup not initiated. Please start the setup process first."
            )
        
        # Verify TOTP code
        if not mfa_utils.verify_totp_code(current_user.mfa_secret, setup_request.totp_code):
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Invalid TOTP code"
            )
        
        # Enable MFA
        success = await user_service.enable_mfa(current_user.email)
        
        if not success:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Failed to enable MFA"
            )
        
        return MessageResponse(message="MFA enabled successfully")
    
    except HTTPException as e:
        raise e
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to complete MFA setup: {str(e)}"
        )

@router.post("/verify", response_model=MessageResponse)
async def verify_mfa_code(
    verify_request: MFAVerifyRequest,
    current_user: UserInDB = Depends(get_current_user)
):
    """
    Verify TOTP code for already enabled MFA
    """
    try:
        if not current_user.mfa_enabled or not current_user.mfa_secret:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="MFA is not enabled for this account"
            )
        
        # Verify TOTP code
        if not mfa_utils.verify_totp_code(current_user.mfa_secret, verify_request.totp_code):
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Invalid TOTP code"
            )
        
        return MessageResponse(message="TOTP code verified successfully")
    
    except HTTPException as e:
        raise e
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to verify MFA code: {str(e)}"
        )

@router.post("/disable", response_model=MessageResponse)
async def disable_mfa(
    disable_request: MFADisableRequest,
    current_user: UserInDB = Depends(get_current_user),
    user_service: UserService = Depends(get_user_service)
):
    """
    Disable MFA (requires TOTP confirmation, password optional)
    """
    try:
        if not current_user.mfa_enabled:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="MFA is not enabled for this account"
            )

        # Verify password if provided
        if disable_request.current_password:
            if not await user_service.verify_password(current_user.email, disable_request.current_password):
                raise HTTPException(
                    status_code=status.HTTP_401_UNAUTHORIZED,
                    detail="Invalid password"
                )

        # Verify TOTP code (required)
        if not mfa_utils.verify_totp_code(current_user.mfa_secret, disable_request.totp_code):
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Invalid TOTP code"
            )

        # Disable MFA
        success = await user_service.disable_mfa(current_user.email)

        if not success:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Failed to disable MFA"
            )

        return MessageResponse(message="MFA disabled successfully")
    
    except HTTPException as e:
        raise e
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to disable MFA: {str(e)}"
        )

@router.post("/recovery/regenerate", response_model=dict)
async def regenerate_recovery_codes(
    current_user: UserInDB = Depends(get_current_user),
    user_service: UserService = Depends(get_user_service)
):
    """
    Regenerate recovery codes (replaces existing ones)
    """
    try:
        if not current_user.mfa_enabled:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="MFA is not enabled for this account"
            )
        
        # Generate new recovery codes
        new_recovery_codes = mfa_utils.generate_recovery_codes()
        
        # Update user's recovery codes
        success = await user_service.update_recovery_codes(current_user.email, new_recovery_codes)
        
        if not success:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Failed to regenerate recovery codes"
            )
        
        return {
            "message": "Recovery codes regenerated successfully",
            "recovery_codes": new_recovery_codes,
            "warning": "Store these codes securely. The old codes are no longer valid."
        }
    
    except HTTPException as e:
        raise e
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to regenerate recovery codes: {str(e)}"
        )

@router.post("/login/complete", response_model=Token)
async def complete_mfa_login(
    verify_request: dict,
    user_service: UserService = Depends(get_user_service)
):
    """
    Complete MFA login with TOTP code or recovery code
    """
    try:
        temp_token = verify_request.get('temp_token')
        totp_code = verify_request.get('totp_code')
        recovery_code = verify_request.get('recovery_code')
        
        if not temp_token:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Temporary token is required"
            )
        
        if not totp_code and not recovery_code:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="TOTP code or recovery code is required"
            )
        
        # Decode temp token
        payload = SecurityUtils.decode_token(temp_token)
        if not payload or payload.get('type') != 'mfa_temp':
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid or expired temporary token"
            )
        
        user_id = payload.get('sub')
        if not user_id:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid token payload"
            )
        
        # Get user
        user = await user_service.get_user_by_id(user_id)
        if not user or not user.mfa_enabled:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="MFA is not enabled for this account"
            )
        
        verified = False
        
        # Verify TOTP code
        if totp_code:
            verified = mfa_utils.verify_totp_code(user.mfa_secret, totp_code)
            
        # Or verify recovery code
        elif recovery_code:
            if user.recovery_codes:
                success, updated_codes = mfa_utils.use_recovery_code(user.recovery_codes, recovery_code)
                if success:
                    # Update recovery codes in database
                    await user_service.update_recovery_codes(user.email, updated_codes)
                    verified = True
        
        if not verified:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Invalid verification code"
            )
        
        # Create real access token
        access_token = SecurityUtils.create_access_token(data={"sub": str(user.id)})
        
        # Extract JTI from token for single-session control
        jti = SecurityUtils.extract_jti_from_token(access_token)
        
        # Update user's active JWT identifier (invalidates old sessions)
        await user_service.update_active_jwt_identifier(str(user.id), jti)
        
        return Token(access_token=access_token, token_type="bearer")
        
    except HTTPException as e:
        raise e
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to complete MFA login: {str(e)}"
        )