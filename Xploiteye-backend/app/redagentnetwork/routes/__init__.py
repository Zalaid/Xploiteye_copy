"""
Red Agent API Routes
"""

from fastapi import APIRouter

router = APIRouter(prefix="/api/red-agent", tags=["Red Agent"])

# Import route handlers
from . import red_agent_routes

# Include routes
router.include_router(red_agent_routes.router)

__all__ = ["router"]
