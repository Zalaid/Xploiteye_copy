"""
Xploit Eye - Chat History Routes
"""
from fastapi import APIRouter, Depends, HTTPException, status, Query
from typing import List
from loguru import logger

from app.auth.jwt_handler import get_current_user
from app.rag.services.chat_manager import chat_manager

router = APIRouter()


@router.get("/history")
async def get_chat_history(
    limit: int = Query(50, ge=1, le=100),
    skip: int = Query(0, ge=0),
    current_user: dict = Depends(get_current_user)
):
    """
    Get user's chat history
    
    Args:
        limit: Number of chats to retrieve
        skip: Number of chats to skip
        current_user: Authenticated user
        
    Returns:
        List of chat history
    """
    user_id = str(current_user.id)
    
    try:
        chats = await chat_manager.get_user_history(
            user_id=user_id,
            limit=limit,
            skip=skip
        )
        
        return {
            "total": len(chats),
            "chats": chats
        }
        
    except Exception as e:
        logger.error(f"❌ Failed to get chat history: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to retrieve chat history"
        )


@router.get("/history/{session_id}")
async def get_session_chat_history(
    session_id: str,
    limit: int = Query(50, ge=1, le=100),
    current_user: dict = Depends(get_current_user)
):
    """
    Get chat history for specific session
    
    Args:
        session_id: Session ID
        limit: Number of chats to retrieve
        current_user: Authenticated user
        
    Returns:
        List of session chat history
    """
    user_id = str(current_user.id)
    
    try:
        chats = await chat_manager.get_session_history(
            user_id=user_id,
            session_id=session_id,
            limit=limit
        )
        
        return {
            "session_id": session_id,
            "total": len(chats),
            "chats": chats
        }
        
    except Exception as e:
        logger.error(f"❌ Failed to get session chat history: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to retrieve session chat history"
        )


@router.get("/conversations")
async def get_conversations(
    limit: int = Query(50, ge=1, le=100),
    current_user: dict = Depends(get_current_user)
):
    """
    Get list of user's conversations
    
    Args:
        limit: Number of conversations to retrieve
        current_user: Authenticated user
        
    Returns:
        List of conversation summaries
    """
    user_id = str(current_user.id)
    
    try:
        conversations = await chat_manager.get_conversations(
            user_id=user_id,
            limit=limit
        )
        
        return {
            "total": len(conversations),
            "conversations": conversations
        }
        
    except Exception as e:
        logger.error(f"❌ Failed to get conversations: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to retrieve conversations"
        )


@router.get("/conversations/{conversation_id}")
async def get_conversation_chats(
    conversation_id: str,
    limit: int = Query(100, ge=1, le=200),
    current_user: dict = Depends(get_current_user)
):
    """
    Get all chats in a conversation
    
    Args:
        conversation_id: Conversation ID
        limit: Maximum number of chats to retrieve
        current_user: Authenticated user
        
    Returns:
        List of chat messages in chronological order
    """
    user_id = str(current_user.id)
    
    try:
        chats = await chat_manager.get_conversation_chats(
            user_id=user_id,
            conversation_id=conversation_id,
            limit=limit
        )
        
        return {
            "conversation_id": conversation_id,
            "total": len(chats),
            "chats": chats
        }
        
    except Exception as e:
        logger.error(f"❌ Failed to get conversation chats: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to retrieve conversation chats"
        )


@router.delete("/conversations/{conversation_id}")
async def delete_conversation(
    conversation_id: str,
    current_user: dict = Depends(get_current_user)
):
    """
    Delete entire conversation
    
    Args:
        conversation_id: Conversation ID to delete
        current_user: Authenticated user
        
    Returns:
        Success message
    """
    user_id = str(current_user.id)
    
    try:
        deleted = await chat_manager.delete_conversation(
            user_id=user_id,
            conversation_id=conversation_id
        )
        
        if not deleted:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Conversation not found"
            )
        
        return {
            "message": "Conversation deleted successfully",
            "conversation_id": conversation_id
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"❌ Failed to delete conversation: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to delete conversation"
        )


@router.delete("/history/{chat_id}")
async def delete_chat(
    chat_id: str,
    current_user: dict = Depends(get_current_user)
):
    """
    Delete a specific chat
    
    Args:
        chat_id: Chat ID to delete
        current_user: Authenticated user
        
    Returns:
        Success message
    """
    user_id = str(current_user.id)
    
    try:
        deleted = await chat_manager.delete_chat(
            user_id=user_id,
            chat_id=chat_id
        )
        
        if not deleted:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Chat not found"
            )
        
        return {
            "message": "Chat deleted successfully",
            "chat_id": chat_id
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"❌ Failed to delete chat: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to delete chat"
        )
