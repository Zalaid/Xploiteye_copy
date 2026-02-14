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
    # Use frontend URL so you only add http://localhost:3000/auth/google-callback in Google Console
    google_redirect_uri: str = Field(default="http://localhost:3000/auth/google-callback")

    # Frontend Configuration
    frontend_url: str = Field(default="http://localhost:3000")
    
    # CORS Configuration
    cors_origins: List[str] = Field(default=[
        "http://localhost:3000",
        "http://localhost:3001",
        "http://localhost:3009",
        "https://accounts.google.com",
        "http://192.168.10.12:3000",
        "http://192.168.10.12:8000"
    ])

    # Network Scanning Configuration
    openai_api_key: str = Field(default="")
    gemini_api_key: str = Field(default="")
    langsmith_tracing: str = Field(default="false")
    langsmith_endpoint: str = Field(default="https://api.smith.langchain.com")
    langsmith_api_key: str = Field(default="")
    langsmith_project: str = Field(default="netscan")

    # Qdrant Vector Database Configuration
    qdrant_url: str = Field(default="http://localhost:6333")
    qdrant_api_key: str = Field(default="")
    qdrant_timeout: int = Field(default=60)
    qdrant_global_collection: str = Field(default="global_knowledge_base")

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

    # Red Agent Configuration
    msf_rpc_host: str = Field(default="127.0.0.1")
    msf_rpc_port: int = Field(default=55553)
    msf_rpc_password: str = Field(default="xploiteye123")
    msf_rpc_ssl: bool = Field(default=False)
    metasploit_lhost: str = Field(default="192.168.0.187")

    agent_version: str = Field(default="1.0.0")
    agent_name: str = Field(default="XploitEye Red Agent")
    debug_mode: bool = Field(default=True)

    lhost: str = Field(default="auto")
    default_lport_range: str = Field(default="4444-9999")
    exploit_timeout: int = Field(default=30)
    command_timeout: int = Field(default=15)

    exploitations_base_dir: str = Field(default="./exploitations")
    session_folder_format: str = Field(default="exploit_{target}_{port}_{service}_{timestamp}")
    report_format: str = Field(default="pdf,json")
    report_include_screenshots: bool = Field(default=True)

    log_filename: str = Field(default="red_agent.log")
    log_format: str = Field(default="[%(asctime)s] [%(levelname)s] %(message)s")

    enable_persistence: bool = Field(default=False)
    enable_lateral_movement: bool = Field(default=False)
    exfiltration_enabled: bool = Field(default=True)
    max_exfiltration_size_mb: int = Field(default=100)

    max_privesc_attempts: int = Field(default=5)
    enable_kernel_exploits: bool = Field(default=False)
    enable_suid_exploits: bool = Field(default=True)
    enable_sudo_exploits: bool = Field(default=True)

    safe_mode: bool = Field(default=True)
    require_confirmation: bool = Field(default=False)
    max_concurrent_sessions: int = Field(default=3)
    auto_cleanup_sessions: bool = Field(default=True)

    max_exploit_retries: int = Field(default=3)
    retry_delay_seconds: int = Field(default=5)
    enable_session_upgrade: bool = Field(default=True)
    upgrade_timeout: int = Field(default=30)
    preferred_payloads: str = Field(default="linux/x64/meterpreter/reverse_tcp,linux/x86/meterpreter/reverse_tcp,cmd/unix/reverse")

    environment: str = Field(default="development")
    working_dir: str = Field(default="/home/kali/Desktop/Red agent")
    temp_dir: str = Field(default="/tmp/red_agent")

    enable_notifications: bool = Field(default=False)
    notification_methods: str = Field(default="")

    # RAG System Configuration
    groq_api_key: str = Field(default="")
    groq_model: str = Field(default="llama-3.3-70b-versatile")
    embedding_model: str = Field(default="BAAI/bge-large-en-v1.5")
    embedding_dimension: int = Field(default=1024)
    
    # Upload Configuration
    max_upload_size_mb: int = Field(default=50)
    allowed_file_types: str = Field(default=".pdf")
    upload_rate_limit_per_hour: int = Field(default=10)
    
    # Chunking Configuration
    chunk_size: int = Field(default=512)
    chunk_overlap: int = Field(default=100)
    
    # Retrieval Configuration
    user_report_retrieval_limit: int = Field(default=7)
    global_kb_retrieval_limit: int = Field(default=3)
    user_memory_retrieval_limit: int = Field(default=5)
    enable_reranking: bool = Field(default=False)
    
    # Guardrails
    enable_guardrails: bool = Field(default=True)
    guardrails_classification_model: str = Field(default="llama-guard-3-8b")
    enable_llm_classification: bool = Field(default=True)
    max_query_length: int = Field(default=1000)
    max_response_length: int = Field(default=4000)
    allow_off_topic: bool = Field(default=False)
    
    # Session Configuration
    session_expire_days: int = Field(default=30)
    
    # Logging for RAG
    log_file: str = Field(default="logs/xploiteye_rag.log")
    
    # Allowed Origins
    allowed_origins: str = Field(default="http://localhost:3000")


    class Config:
        env_file = ".env"
        case_sensitive = False
        extra = "ignore"  # This will ignore extra fields not defined in the model

# Create global settings instance
settings = Settings()