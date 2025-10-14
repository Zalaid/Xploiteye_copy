"""
Configuration settings for XploitEye Backend
"""

import os
from typing import List
from pydantic_settings import BaseSettings
from pydantic import Field
from pathlib import Path

class Settings(BaseSettings):
    # Application Configuration
    app_name: str = Field(default="XploitEye Backend")
    app_version: str = Field(default="1.0.0")
    debug: bool = Field(default=True)
    

    nuclei_path: Path = Field(default=Path("/home/kali/go/bin/nuclei"))
    # MongoDB Configuration
    mongodb_url: str = Field(default="mongodb://localhost:27017")
    mongodb_database: str = Field(default="xploiteye")
    
    # JWT Configuration
    jwt_secret_key: str = Field(default="your-super-secret-jwt-key-change-this-in-production")
    jwt_algorithm: str = Field(default="HS256")
    jwt_access_token_expire_minutes: int = Field(default=30)
    
    # Google OAuth Configuration
    google_client_id: str = Field(default="")
    google_client_secret: str = Field(default="")
    google_redirect_uri: str = Field(default="http://localhost:8000/auth/google/callback")
    
    # Frontend Configuration
    frontend_url: str = Field(default="http://localhost:3000")
    
    # CORS Configuration
    cors_origins: List[str] = Field(default=[
        "http://localhost:3000",
        "http://localhost:3001",
        "http://localhost:3009",
        "https://accounts.google.com"
    ])

    # Network Scanning Configuration
    openai_api_key: str = Field(default="")
    gemini_api_key: str = Field(default="")
    langsmith_tracing: str = Field(default="false")
    langsmith_endpoint: str = Field(default="https://api.smith.langchain.com")
    langsmith_api_key: str = Field(default="")
    langsmith_project: str = Field(default="netscan")

    # Scanning Directories
    results_dir: str = Field(default="/home/kali/Desktop/Github Zalaid/xploiteye/Xploiteye-backend/scanning_results")
    reports_dir: str = Field(default="/home/kali/Desktop/Github Zalaid/xploiteye/Xploiteye-backend/scanning_reports")

    # Tool Paths
    vulnx_path: str = Field(default="/home/kali/go/bin/vulnx")
    nmap_path: str = Field(default="/usr/bin/nmap")

    # Email Configuration
    gmail_username: str = Field(default="")
    gmail_app_password: str = Field(default="")
    default_from_email: str = Field(default="")

    # PayFast Payment Gateway Configuration
    payfast_merchant_id: str = Field(default="")
    payfast_secured_key: str = Field(default="")
    payfast_base_url: str = Field(default="https://ipguat.apps.net.pk/Ecommerce/api/Transaction")

    # Application URLs
    api_url: str = Field(default="http://localhost:8000")
    app_url: str = Field(default="http://localhost:3000")

    # Logging Configuration
    log_level: str = Field(default="INFO")

    # Rate Limiting Configuration
    rate_limit_enabled: bool = Field(default=True)
    payment_rate_limit_per_minute: int = Field(default=5)

    class Config:
        env_file = ".env"
        case_sensitive = False

# Create global settings instance
settings = Settings()