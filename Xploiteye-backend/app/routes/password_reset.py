"""
Password reset routes - FastAPI conversion of Django forgot password functionality
"""

from fastapi import APIRouter, Depends, HTTPException, status
import logging
import asyncio

from app.models.password_reset import ForgotPasswordRequest, ResetPasswordRequest
from app.models.user import MessageResponse
from app.services.password_reset_service import PasswordResetService
from app.services.user_service import UserService
from app.auth.dependencies import get_user_service
from app.auth.security import SecurityUtils
from app.database.mongodb import get_database

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/auth", tags=["Password Reset"])


async def get_password_reset_service():
    """Dependency to get PasswordResetService instance"""
    db = await get_database()
    return PasswordResetService(db)


@router.post(
    "/forgot-password",
    response_model=MessageResponse,
    status_code=status.HTTP_200_OK,
    summary="Request password reset",
    description="Send password reset email to user if account exists"
)
async def forgot_password(
    request_data: ForgotPasswordRequest,
    reset_service: PasswordResetService = Depends(get_password_reset_service),
    user_service: UserService = Depends(get_user_service)
):
    """
    Request password reset for user account

    - **email**: Email address of the account to reset

    Sends a password reset email if account exists.
    Always returns success message for security (doesn't reveal if email exists).
    """
    try:
        logger.info(f"Password reset requested for email: {request_data.email}")

        # Check if user exists
        user = await user_service.get_user_by_email(request_data.email)

        if user:
            # Create reset token
            reset_token = await reset_service.create_reset_token(user.id, user.email)

            if reset_token:
                # Send reset email
                email_sent = await reset_service._send_email_async(
                    user.email,
                    "Reset Your Password - XploitEye",
                    f"""
Hello,

You requested a password reset for your XploitEye account.

Click the link below to reset your password:
http://localhost:3000/reset-password?token={reset_token}

This link will expire in 1 hour.

If you didn't request this password reset, please ignore this email.

Best regards,
XploitEye Team
                    """
                )

                if email_sent:
                    logger.info(f"Password reset email sent to {request_data.email}")
                else:
                    logger.error(f"Failed to send reset email to {request_data.email}")
            else:
                logger.error(f"Failed to create reset token for {request_data.email}")
        else:
            logger.info(f"Password reset requested for non-existent email: {request_data.email}")

        # Always return success message for security (don't reveal if email exists)
        return MessageResponse(
            message="If an account with this email exists, a password reset link has been sent."
        )

    except Exception as e:
        logger.error(f"Password reset request failed: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to process password reset request. Please try again."
        )


@router.post(
    "/reset-password",
    response_model=MessageResponse,
    status_code=status.HTTP_200_OK,
    summary="Reset password with token",
    description="Reset user password using reset token"
)
async def reset_password(
    request_data: ResetPasswordRequest,
    reset_service: PasswordResetService = Depends(get_password_reset_service),
    user_service: UserService = Depends(get_user_service)
):
    """
    Reset user password using reset token

    - **token**: Password reset token received via email
    - **new_password**: New password for the account

    Validates token and updates user password.
    """
    try:
        logger.info(f"Password reset attempt with token: {request_data.token[:10]}...")

        # Verify reset token
        reset_token = await reset_service.verify_reset_token(request_data.token)

        if not reset_token:
            logger.warning(f"Invalid or expired reset token: {request_data.token[:10]}...")
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Invalid or expired reset token"
            )

        # Get user
        user = await user_service.get_user_by_id(reset_token.user_id)
        if not user:
            logger.error(f"User not found for reset token: {reset_token.user_id}")
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Invalid reset token"
            )

        # Update user password
        password_updated = await user_service.update_user_password(
            user.id,
            request_data.new_password
        )

        if not password_updated:
            logger.error(f"Failed to update password for user: {user.id}")
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Failed to update password"
            )

        # Mark token as used
        await reset_service.use_reset_token(reset_token.id)

        logger.info(f"Password reset successful for user: {user.email}")

        return MessageResponse(
            message="Password reset successful. You can now log in with your new password."
        )

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Password reset failed: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Password reset failed. Please try again."
        )