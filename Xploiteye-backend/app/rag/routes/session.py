"""
Xploit Eye - Session Management Routes
"""
from fastapi import APIRouter, Depends, HTTPException, status
from typing import List
from datetime import datetime, timedelta
from loguru import logger

from app.auth.jwt_handler import get_current_user
from app.rag.models.session import SessionResponse
from app.rag.services.qdrant_manager import qdrant_manager
from app.database.mongodb import get_database
from config.settings import settings

router = APIRouter()


@router.get("/", response_model=List[SessionResponse])
async def get_user_sessions(
    current_user: dict = Depends(get_current_user)
):
    """
    Get all active sessions for current user
    
    Args:
        current_user: Authenticated user
        
    Returns:
        List of active sessions
    """
    user_id = str(current_user.id)
    
    try:
        database = await get_database()
        
        cursor = database.sessions.find({
            "user_id": user_id,
            "is_active": True
        }).sort("created_at", -1)
        
        sessions = await cursor.to_list(length=100)
        
        # Format response
        response = []
        for session in sessions:
            # Get collection info
            chunks_count = None
            if qdrant_manager.collection_exists(session["qdrant_collection"]):
                info = qdrant_manager.get_collection_info(session["qdrant_collection"])
                chunks_count = info.get("points_count")
            
            response.append(SessionResponse(
                id=str(session["_id"]),
                user_id=session["user_id"],
                session_id=session["session_id"],
                scan_report_name=session["scan_report_name"],
                qdrant_collection=session["qdrant_collection"],
                created_at=session["created_at"],
                last_activity=session["last_activity"],
                expires_at=session["expires_at"],
                is_active=session["is_active"],
                chunks_count=chunks_count
            ))
        
        logger.info(f"📋 Retrieved {len(response)} sessions for user {user_id}")
        
        return response
        
    except Exception as e:
        logger.error(f"❌ Failed to get sessions: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to retrieve sessions"
        )


@router.delete("/{session_id}")
async def delete_session(
    session_id: str,
    current_user: dict = Depends(get_current_user)
):
    """
    Delete a session and its Qdrant collection
    
    Args:
        session_id: Session ID to delete
        current_user: Authenticated user
        
    Returns:
        Success message
    """
    user_id = str(current_user.id)
    
    try:
        database = await get_database()
        
        # Find session
        session = await database.sessions.find_one({
            "user_id": user_id,
            "session_id": session_id
        })
        
        if not session:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Session not found"
            )
        
        # Delete Qdrant collection
        collection_name = session["qdrant_collection"]
        if qdrant_manager.collection_exists(collection_name):
            qdrant_manager.delete_collection(collection_name)
            logger.info(f"🗑️  Deleted Qdrant collection: {collection_name}")
        
        # Mark session as inactive
        await database.sessions.update_one(
            {"session_id": session_id},
            {"$set": {"is_active": False}}
        )
        
        logger.info(f"✅ Deleted session: {session_id}")
        
        return {
            "message": "Session deleted successfully",
            "session_id": session_id
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"❌ Failed to delete session: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to delete session"
        )


@router.post("/{session_id}/extend")
async def extend_session(
    session_id: str,
    days: int = 7,
    current_user: dict = Depends(get_current_user)
):
    """
    Extend session expiry
    
    Args:
        session_id: Session ID
        days: Number of days to extend
        current_user: Authenticated user
        
    Returns:
        Updated session info
    """
    user_id = str(current_user.id)
    
    try:
        database = await get_database()
        
        # Find session
        session = await database.sessions.find_one({
            "user_id": user_id,
            "session_id": session_id
        })
        
        if not session:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Session not found"
            )
        
        # Extend expiry
        new_expiry = datetime.utcnow() + timedelta(days=days)
        
        await database.sessions.update_one(
            {"session_id": session_id},
            {
                "$set": {
                    "expires_at": new_expiry,
                    "last_activity": datetime.utcnow()
                }
            }
        )
        
        logger.info(f"⏰ Extended session {session_id} by {days} days")
        
        return {
            "message": "Session extended successfully",
            "session_id": session_id,
            "new_expiry": new_expiry
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"❌ Failed to extend session: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to extend session"
        )
