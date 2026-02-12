"""
XploitEye Backend - FastAPI Application
"""

import uvicorn
import os
from contextlib import asynccontextmanager
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from fastapi.staticfiles import StaticFiles

from config.settings import settings
from config.logging_config import setup_uvicorn_logging, log_meaningful_startup, log_meaningful_shutdown
from app.database.mongodb import connect_to_mongo, close_mongo_connection
from app.routes import auth, dashboard, mfa, scanning, cve, email_verification, password_reset, dvwa_scanner, web_scanning
from app.routes import ssh_exploit, chatbot_routes, rag_routes, unified_chat_routes
#from app.payment import payment_router
from app.redagentnetwork.routes.red_agent_routes import router as red_agent_router
from app.blueagentnetwork.blue_agent_routes import router as blue_agent_router
from app.meterpreter.routes import router as meterpreter_router

@asynccontextmanager
async def lifespan(app: FastAPI):
    """Application lifespan events"""
    # Setup enhanced logging
    setup_uvicorn_logging()
    log_meaningful_startup()

    # Database connection
    await connect_to_mongo()

    # Setup email configuration
    import config.email_settings

    # Create scanning directories
    os.makedirs(settings.results_dir, exist_ok=True)
    os.makedirs(settings.reports_dir, exist_ok=True)

    yield

    # Shutdown
    log_meaningful_shutdown()
    await close_mongo_connection()

# Create FastAPI application
app = FastAPI(
    title=settings.app_name,
    version=settings.app_version,
    description="Secure backend API for XploitEye multi-agentic cybersecurity platform",
    lifespan=lifespan
)

# Add CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins,
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "DELETE"],
    allow_headers=["*"],
)

# Include routers
app.include_router(auth.router)
app.include_router(email_verification.router)  # Email verification routes
app.include_router(password_reset.router)      # Password reset routes
app.include_router(mfa.router)
app.include_router(dashboard.router)
app.include_router(scanning.router)
app.include_router(web_scanning.router)
app.include_router(cve.router)
app.include_router(dvwa_scanner.router, prefix="/api")  # DVWA Scanner routes
app.include_router(ssh_exploit.router)
#app.include_router(payment_router)             # Payment routes
app.include_router(red_agent_router, prefix="/api/red-agent")  # Red Agent exploitation routes
app.include_router(blue_agent_router)  # Blue Agent remediation routes
app.include_router(meterpreter_router)  # Meterpreter exploitation routes
app.include_router(chatbot_routes.router, prefix="/api")  # Chatbot routes
app.include_router(rag_routes.router, prefix="/api")  # RAG routes
app.include_router(unified_chat_routes.router, prefix="/api")  # Unified Chat routes

# --- Separate Documentation Panel for Web Scanner ---
web_scanner_app = FastAPI(
    title="XploitEye | Web Application Scanner",
    description="Dedicated panel for automated web security audits, reconnaissance, and vulnerability mapping.",
    version="1.0.0",
    docs_url="/docs",
    openapi_url="/openapi.json"
)
web_scanner_app.include_router(web_scanning.router)
app.mount("/web-scanner", web_scanner_app)

# --- Static Files for Results ---
os.makedirs(os.path.join(settings.results_dir, "web_scans"), exist_ok=True)
app.mount("/web-results", StaticFiles(directory=os.path.join(settings.results_dir, "web_scans")), name="web-results")

# Root endpoint
@app.get("/", tags=["Health"])
async def root():
    """API health check endpoint"""
    return {
        "message": "XploitEye Backend API",
        "version": settings.app_version,
        "status": "operational",
        "docs": "/docs",
        "redoc": "/redoc"
    }

# Health check endpoint
@app.get("/health", tags=["Health"])
async def health_check():
    """Detailed health check endpoint"""
    return {
        "status": "healthy",
        "service": settings.app_name,
        "version": settings.app_version,
        "database": "connected"
    }

# Global exception handler
@app.exception_handler(Exception)
async def global_exception_handler(request, exc):
    """Global exception handler for unhandled errors"""
    return JSONResponse(
        status_code=500,
        content={"detail": "Internal server error"}
    )

if __name__ == "__main__":
    uvicorn.run(
        "main:app",
        host="0.0.0.0",
        port=8000,
        reload=settings.debug,
        log_level="info"
    )