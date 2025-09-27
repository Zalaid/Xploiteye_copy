"""
Password reset service for handling forgot password functionality
"""

import logging
from typing import Optional
from datetime import datetime
from motor.motor_asyncio import AsyncIOMotorDatabase
from bson import ObjectId

from app.models.password_reset import PasswordResetToken, ForgotPasswordRequest, ResetPasswordRequest
from app.services.email_service import EmailService
from app.database.mongodb import get_database

logger = logging.getLogger(__name__)


class PasswordResetService:
    """Service for handling password reset operations"""

    def __init__(self, db: AsyncIOMotorDatabase):
        self.db = db
        self.reset_collection = self.db.password_reset_tokens
        self.users_collection = self.db.users

    async def create_reset_token(self, user_id: str, email: str) -> Optional[str]:
        """Create a password reset token for user"""
        try:
            # Clean up any existing reset tokens for this user
            await self.reset_collection.delete_many({"user_id": user_id})

            # Create new reset token
            token_obj, raw_token = PasswordResetToken.create_for_user(user_id, email)

            # Store in database
            result = await self.reset_collection.insert_one(token_obj.to_dict())

            if result.inserted_id:
                logger.info(f"Created password reset token for user {user_id}")
                return raw_token

            return None

        except Exception as e:
            logger.error(f"Failed to create reset token for user {user_id}: {e}")
            return None

    async def verify_reset_token(self, raw_token: str) -> Optional[PasswordResetToken]:
        """Verify a password reset token"""
        try:
            # Find all non-used, non-expired tokens
            cursor = self.reset_collection.find({
                "used": False,
                "expires_at": {"$gt": datetime.utcnow()}
            })

            async for token_doc in cursor:
                # Convert to model
                token_doc["id"] = str(token_doc["_id"])
                del token_doc["_id"]
                token = PasswordResetToken(**token_doc)

                # Check if this token matches
                if token.verify_token(raw_token):
                    logger.info(f"Valid reset token found for user {token.user_id}")
                    return token

            logger.warning(f"No valid reset token found for provided token")
            return None

        except Exception as e:
            logger.error(f"Failed to verify reset token: {e}")
            return None

    async def use_reset_token(self, token_id: str) -> bool:
        """Mark a reset token as used"""
        try:
            result = await self.reset_collection.update_one(
                {"_id": ObjectId(token_id)},
                {"$set": {"used": True}}
            )
            return result.modified_count > 0
        except Exception as e:
            logger.error(f"Failed to mark token as used: {e}")
            return False

    async def cleanup_expired_tokens(self) -> int:
        """Clean up expired reset tokens"""
        try:
            result = await self.reset_collection.delete_many({
                "expires_at": {"$lt": datetime.utcnow()}
            })
            logger.info(f"Cleaned up {result.deleted_count} expired reset tokens")
            return result.deleted_count
        except Exception as e:
            logger.error(f"Failed to cleanup expired tokens: {e}")
            return 0

    async def send_reset_email(self, email: str, reset_token: str) -> bool:
        """Send password reset email"""
        try:
            # Create reset URL for frontend
            FRONTEND_URL = "http://localhost:3000"  # TODO: Make this configurable
            reset_url = f"{FRONTEND_URL}/reset-password?token={reset_token}"

            subject = "Reset Your Password - XploitEye"
            message = f"""
            Hello,

            You requested a password reset for your XploitEye account.

            Click the link below to reset your password:
            {reset_url}

            This link will expire in 1 hour.

            If you didn't request this password reset, please ignore this email.

            Best regards,
            XploitEye Team
            """

            # Use existing email service
            email_service = EmailService(self.db)
            return await email_service._send_email_async(email, subject, message)

        except Exception as e:
            logger.error(f"Failed to send reset email to {email}: {e}")
            return False

    async def _send_email_async(self, to_email: str, subject: str, message: str) -> bool:
        """Async wrapper for email sending"""
        try:
            import asyncio
            from app.services.email_service import EmailService

            email_service = EmailService(self.db)
            # Run the sync email method in executor
            loop = asyncio.get_event_loop()
            return await loop.run_in_executor(
                None,
                email_service._send_email,
                to_email,
                subject,
                message
            )
        except Exception as e:
            logger.error(f"Failed to send email async: {e}")
            return False