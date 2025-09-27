"""
Email service for sending verification and notification emails
"""

import smtplib
import logging
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from typing import List, Optional
from datetime import datetime, timedelta
from motor.motor_asyncio import AsyncIOMotorDatabase
from bson import ObjectId

from app.models.email_verification import EmailVerificationToken
from app.database.mongodb import get_database

logger = logging.getLogger(__name__)


class EmailConfig:
    """Email configuration settings"""

    # Gmail SMTP Configuration
    SMTP_SERVER = "smtp.gmail.com"
    SMTP_PORT = 587
    SMTP_USERNAME = ""  # Your Gmail address
    SMTP_PASSWORD = ""  # Your Gmail App Password (16 characters)
    DEFAULT_FROM_EMAIL = ""  # Your Gmail address

    @classmethod
    def is_configured(cls) -> bool:
        """Check if email is properly configured"""
        return bool(cls.SMTP_USERNAME and cls.SMTP_PASSWORD and cls.DEFAULT_FROM_EMAIL)


class EmailService:
    """Service for sending emails and managing verification tokens"""

    def __init__(self, db: AsyncIOMotorDatabase):
        self.db = db
        self.verification_collection = self.db.email_verification_tokens

    async def send_verification_email(self, email: str, code: str) -> bool:
        """Send verification email with code"""
        try:
            if not EmailConfig.is_configured():
                logger.error("Email configuration is missing")
                return False

            subject = "Email Verification Code - XploitEye"
            message = f"""
            Welcome to XploitEye!

            Your email verification code is: {code}

            This code will expire in 10 minutes.

            If you didn't request this verification, please ignore this email.

            Best regards,
            XploitEye Team
            """

            return self._send_email(
                to_email=email,
                subject=subject,
                message=message
            )

        except Exception as e:
            logger.error(f"Failed to send verification email to {email}: {e}")
            return False

    def _send_email(self, to_email: str, subject: str, message: str) -> bool:
        """Send email using SMTP"""
        try:
            # Create message
            msg = MIMEMultipart()
            msg['From'] = EmailConfig.DEFAULT_FROM_EMAIL
            msg['To'] = to_email
            msg['Subject'] = subject

            # Add body to email
            msg.attach(MIMEText(message, 'plain'))

            # Gmail SMTP configuration with timeout for faster response
            logger.info(f"Connecting to Gmail SMTP for {to_email}")
            server = smtplib.SMTP(EmailConfig.SMTP_SERVER, EmailConfig.SMTP_PORT, timeout=10)
            server.starttls()  # Enable security

            logger.info(f"Authenticating with Gmail for {to_email}")
            server.login(EmailConfig.SMTP_USERNAME, EmailConfig.SMTP_PASSWORD)

            # Send email
            logger.info(f"Sending email to {to_email}")
            text = msg.as_string()
            server.sendmail(EmailConfig.DEFAULT_FROM_EMAIL, to_email, text)
            server.quit()

            logger.info(f"Email sent successfully to {to_email}")
            return True

        except Exception as e:
            logger.error(f"Failed to send email to {to_email}: {e}")
            return False

    async def create_verification_token(self, email: str, username: str, password: str) -> Optional[EmailVerificationToken]:
        """Create and store verification token"""
        try:
            # Check if user already has pending verification
            existing = await self.verification_collection.find_one({"email": email})
            if existing:
                # Delete existing token
                await self.verification_collection.delete_one({"email": email})

            # Create new token
            token = EmailVerificationToken.create_for_registration(email, username, password)

            # Store in database
            result = await self.verification_collection.insert_one(token.to_dict())

            if result.inserted_id:
                token.id = str(result.inserted_id)
                return token

            return None

        except Exception as e:
            logger.error(f"Failed to create verification token for {email}: {e}")
            return None

    async def verify_email_code(self, email: str, code: str) -> Optional[EmailVerificationToken]:
        """Verify email code and return token if valid"""
        try:
            logger.info(f"Searching for verification token: email={email}, code={code}")

            # Find token
            token_doc = await self.verification_collection.find_one({
                "email": email,
                "code": code
            })

            if not token_doc:
                logger.warning(f"No verification token found for email={email}, code={code}")
                # Let's also check if there's any token for this email
                any_token = await self.verification_collection.find_one({"email": email})
                if any_token:
                    logger.info(f"Found token for email but wrong code. Expected: {any_token.get('code')}, Got: {code}")
                else:
                    logger.warning(f"No token exists for email: {email}")
                return None

            logger.info(f"Found verification token for email: {email}")

            # Convert to model
            token_doc["id"] = str(token_doc["_id"])
            del token_doc["_id"]
            token = EmailVerificationToken(**token_doc)

            # Check if valid
            if not token.is_valid():
                logger.warning(f"Token expired for email: {email}, expires_at: {token.expires_at}")
                # Delete expired token
                await self.verification_collection.delete_one({"email": email})
                return None

            logger.info(f"Token is valid for email: {email}")
            return token

        except Exception as e:
            logger.error(f"Failed to verify email code for {email}: {e}")
            return None

    async def delete_verification_token(self, email: str) -> bool:
        """Delete verification token after successful verification"""
        try:
            result = await self.verification_collection.delete_one({"email": email})
            return result.deleted_count > 0
        except Exception as e:
            logger.error(f"Failed to delete verification token for {email}: {e}")
            return False

    async def resend_verification_code(self, email: str) -> Optional[str]:
        """Generate new code and resend verification email"""
        try:
            # Find existing token
            existing = await self.verification_collection.find_one({"email": email})
            if not existing:
                return None

            # Generate new code
            import random
            new_code = ''.join([str(random.randint(0, 9)) for _ in range(6)])

            # Update token with new code and extended expiry
            new_expires_at = datetime.utcnow() + timedelta(minutes=10)

            await self.verification_collection.update_one(
                {"email": email},
                {
                    "$set": {
                        "code": new_code,
                        "expires_at": new_expires_at
                    }
                }
            )

            # Send new email
            if await self.send_verification_email(email, new_code):
                return new_code

            return None

        except Exception as e:
            logger.error(f"Failed to resend verification code for {email}: {e}")
            return None

    async def cleanup_expired_tokens(self) -> int:
        """Clean up expired verification tokens"""
        try:
            result = await self.verification_collection.delete_many({
                "expires_at": {"$lt": datetime.utcnow()}
            })
            logger.info(f"Cleaned up {result.deleted_count} expired verification tokens")
            return result.deleted_count
        except Exception as e:
            logger.error(f"Failed to cleanup expired tokens: {e}")
            return 0