"""
Xploit Eye - Guardrails Monitoring Routes
Admin endpoints for viewing guardrails incidents and statistics
"""
from fastapi import APIRouter, Depends, HTTPException, status, Query
from typing import Optional
from loguru import logger

from app.auth.jwt_handler import get_current_user
from app.rag.services.guardrails_monitor import guardrails_monitor
from config.settings import settings

router = APIRouter(prefix="/guardrails", tags=["guardrails"])


@router.get("/incidents")
async def get_incidents(
    user_id: Optional[str] = Query(None, description="Filter by user ID"),
    category: Optional[str] = Query(None, description="Filter by category"),
    hours: int = Query(24, description="Last N hours", ge=1, le=168),
    current_user: dict = Depends(get_current_user)
):
    """
    Get guardrails incidents (admin only)
    
    Args:
        user_id: Optional user ID filter
        category: Optional category filter
        hours: Number of hours to look back
        current_user: Authenticated user
        
    Returns:
        List of incidents
    """
    try:
        # In production, add admin check here
        # if not current_user.get("is_admin"):
        #     raise HTTPException(status_code=403, detail="Admin access required")
        
        incidents = await guardrails_monitor.get_incidents(
            user_id=user_id,
            category=category,
            hours=hours
        )
        
        return {
            "incidents": incidents,
            "count": len(incidents),
            "filters": {
                "user_id": user_id,
                "category": category,
                "hours": hours
            }
        }
        
    except Exception as e:
        logger.error(f"❌ Failed to get incidents: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to retrieve incidents: {str(e)}"
        )


@router.get("/statistics")
async def get_statistics(
    hours: int = Query(24, description="Last N hours", ge=1, le=168),
    current_user: dict = Depends(get_current_user)
):
    """
    Get guardrails statistics (admin only)
    
    Args:
        hours: Number of hours to look back
        current_user: Authenticated user
        
    Returns:
        Statistics dictionary
    """
    try:
        # In production, add admin check here
        # if not current_user.get("is_admin"):
        #     raise HTTPException(status_code=403, detail="Admin access required")
        
        stats = await guardrails_monitor.get_statistics(hours=hours)
        
        return stats
        
    except Exception as e:
        logger.error(f"❌ Failed to get statistics: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to retrieve statistics: {str(e)}"
        )


@router.get("/status")
async def get_guardrails_status():
    """
    Get guardrails configuration status (public endpoint)
    
    Returns:
        Guardrails status and configuration
    """
    return {
        "enabled": settings.enable_guardrails,
        "llm_classification_enabled": settings.enable_llm_classification,
        "classification_model": settings.guardrails_classification_model,
        "max_query_length": settings.max_query_length,
        "max_response_length": settings.max_response_length,
        "allow_off_topic": settings.allow_off_topic
    }
