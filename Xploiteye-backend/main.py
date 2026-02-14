"""
XploitEye Backend - FastAPI Application
"""

import uvicorn
import os
from contextlib import asynccontextmanager
from fastapi import FastAPI, HTTPException, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse, RedirectResponse
from fastapi.staticfiles import StaticFiles

from config.settings import settings
from config.logging_config import setup_uvicorn_logging, log_meaningful_startup, log_meaningful_shutdown
from app.database.mongodb import connect_to_mongo, close_mongo_connection
from app.routes import auth, dashboard, mfa, scanning, cve, email_verification, password_reset, dvwa_scanner, web_scanning
from app.routes import ssh_exploit, chatbot_routes, unified_chat_routes
from app.rag.routes import upload as rag_upload, query as rag_query, chat as rag_chat, session as rag_session, guardrails as rag_guardrails
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
app.include_router(auth.router, prefix="/api")
app.include_router(email_verification.router, prefix="/api")  # Email verification routes
app.include_router(password_reset.router, prefix="/api")      # Password reset routes
app.include_router(mfa.router, prefix="/api")
app.include_router(dashboard.router, prefix="/api")
app.include_router(scanning.router, prefix="/api")
app.include_router(web_scanning.router, prefix="/api")
app.include_router(cve.router, prefix="/api")
app.include_router(dvwa_scanner.router, prefix="/api")  # DVWA Scanner routes
app.include_router(ssh_exploit.router, prefix="/api")
#app.include_router(payment_router, prefix="/api")             # Payment routes
app.include_router(red_agent_router, prefix="/api/red-agent")  # Red Agent exploitation routes
app.include_router(blue_agent_router)  # Blue Agent remediation routes (prefix already in router)
app.include_router(meterpreter_router)  # Meterpreter exploitation routes (prefix already in router)
app.include_router(chatbot_routes.router, prefix="/api")  # Chatbot routes
app.include_router(unified_chat_routes.router, prefix="/api")  # Unified Chat routes

# RAG routes
app.include_router(rag_upload.router, prefix="/api/rag/upload", tags=["RAG Upload"])
app.include_router(rag_query.router, prefix="/api/rag/query", tags=["RAG Query"])
app.include_router(rag_chat.router, prefix="/api/rag/chat", tags=["RAG Chat"])
app.include_router(rag_session.router, prefix="/api/rag/sessions", tags=["RAG Sessions"])
app.include_router(rag_guardrails.router, prefix="/api/rag", tags=["RAG Guardrails"])

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

# Redirect frontend paths to the actual frontend (avoids 404 when opening /dashboard on API server)
@app.get("/dashboard", include_in_schema=False)
@app.get("/dashboard/{path:path}", include_in_schema=False)
async def frontend_redirect_dashboard(path: str = ""):
    """Redirect /dashboard to frontend app."""
    base = settings.frontend_url.rstrip("/")
    url = f"{base}/dashboard" if not path else f"{base}/dashboard/{path}"
    return RedirectResponse(url=url, status_code=302)

@app.get("/signin", include_in_schema=False)
@app.get("/signup", include_in_schema=False)
async def frontend_redirect_auth(request: Request):
    """Redirect /signin, /signup to frontend app."""
    base = settings.frontend_url.rstrip("/")
    return RedirectResponse(url=f"{base}{request.url.path}", status_code=302)

# Google OAuth: accept old callback URL (without /api) and redirect to correct route so callback never 404s
@app.get("/auth/google/callback", include_in_schema=False)
async def google_callback_legacy(request: Request):
    """Redirect legacy /auth/google/callback to /api/auth/google/callback (same query string)."""
    query = request.url.query
    path = "/api/auth/google/callback" + ("?" + query if query else "")
    return RedirectResponse(url=path, status_code=302)

# Frontend auth pages: if opened on backend URL, send to frontend (avoids 404)
@app.get("/auth/callback", include_in_schema=False)
@app.get("/auth/google-callback", include_in_schema=False)
async def frontend_auth_pages(request: Request):
    """Redirect /auth/callback and /auth/google-callback to frontend."""
    base = settings.frontend_url.rstrip("/")
    path = request.url.path
    query = request.url.query
    url = f"{base}{path}" + ("?" + query if query else "")
    return RedirectResponse(url=url, status_code=302)

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

# 404 handler: send GET requests for non-API paths to frontend (so you never see "Not Found" for pages)
@app.exception_handler(HTTPException)
async def http_exception_handler(request: Request, exc: HTTPException):
    if exc.status_code == 404 and request.method == "GET":
        path = request.url.path
        if not path.startswith(("/api/", "/docs", "/redoc", "/openapi", "/web-scanner", "/web-results", "/health")):
            base = settings.frontend_url.rstrip("/")
            query = request.url.query
            return RedirectResponse(url=f"{base}{path}" + ("?" + query if query else ""), status_code=302)
    return JSONResponse(status_code=exc.status_code, content={"detail": exc.detail})

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