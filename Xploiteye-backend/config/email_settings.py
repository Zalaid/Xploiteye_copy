"""
Email configuration settings for XploitEye Backend
"""

import os
from app.services.email_service import EmailConfig

def setup_email_config():
    """
    Setup email configuration with your Gmail credentials

    To configure:
    1. Replace the values below with your Gmail credentials
    2. Or set environment variables GMAIL_USERNAME and GMAIL_APP_PASSWORD
    """

    # Use settings from .env file
    from config.settings import settings
    EmailConfig.SMTP_USERNAME = settings.gmail_username
    EmailConfig.SMTP_PASSWORD = settings.gmail_app_password
    EmailConfig.DEFAULT_FROM_EMAIL = settings.default_from_email or settings.gmail_username

    print(f"Email service configured: {EmailConfig.is_configured()}")
    if EmailConfig.is_configured():
        print(f"Sending emails from: {EmailConfig.DEFAULT_FROM_EMAIL}")
    else:
        print("⚠️  Email service not configured. Please update config/email_settings.py with your Gmail credentials.")


# Call setup when module is imported
setup_email_config()