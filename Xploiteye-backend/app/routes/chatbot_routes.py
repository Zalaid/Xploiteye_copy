"""
XploitEye Chatbot API Routes - FastAPI endpoints for scan report analysis
"""

import os
from fastapi import APIRouter, File, UploadFile, HTTPException, status, Depends
from fastapi.responses import JSONResponse
from typing import Optional
import logging

from app.services.chatbot_service import SecurityPDFChatbot
from app.services.chat_session_service import ChatSessionService
from app.models.chat import ChatQueryRequest, UploadPDFRequest
from app.models.user import UserInDB
from app.database.mongodb import get_database
from app.auth.dependencies import get_current_user

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/chatbot", tags=["Chatbot"])

OPENAI_API_KEY = os.getenv('OPENAI_API_KEY_1') or os.getenv('OPENAI_API_KEY')
if not OPENAI_API_KEY:
    raise ValueError("OPENAI_API_KEY not configured")

# In-memory chatbot instances (session_id -> chatbot)
chatbot_instances = {}


@router.post("/upload-pdf/")
async def upload_pdf(
    file: UploadFile = File(...),
    current_user: UserInDB = Depends(get_current_user),
    db=Depends(get_database)
):
    """Upload XploitEye scan/exploitation report PDF for analysis"""
    try:
        if not file.filename.endswith('.pdf'):
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Only PDF files allowed"
            )

        pdf_bytes = await file.read()
        max_size = 100 * 1024 * 1024  # 100MB
        if len(pdf_bytes) > max_size:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="File too large (max 100MB)"
            )

        # Initialize chatbot
        chatbot = SecurityPDFChatbot(openai_api_key=OPENAI_API_KEY)
        pdf_content = chatbot.load_pdf_from_bytes(pdf_bytes, file.filename)

        # Create session with authenticated user_id
        session_service = ChatSessionService(db)
        session_id = await session_service.create_session(
            user_id=str(current_user.id),
            filename=file.filename,
            pdf_content_preview=pdf_content,
            pdf_content_full=pdf_content  # Store full content for later retrieval
        )

        # Store chatbot instance
        chatbot_instances[session_id] = chatbot

        return {
            "success": True,
            "message": "PDF uploaded successfully",
            "session_id": session_id,
            "filename": file.filename,
            "pdf_length": len(pdf_content)
        }

    except HTTPException:
        raise
    except Exception as e:
        import traceback
        error_msg = f"{type(e).__name__}: {str(e)}"
        logger.error(f"Upload error: {error_msg}")
        logger.error(traceback.format_exc())
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=error_msg
        )


@router.post("/query/")
async def query_pdf(request: ChatQueryRequest, db=Depends(get_database)):
    """Ask question about uploaded PDF"""
    try:
        session_id = request.session_id.strip()
        if not session_id:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="session_id required"
            )

        # Get chatbot instance - must exist from upload
        if session_id not in chatbot_instances:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Session not found. Please upload a PDF first."
            )

        chatbot = chatbot_instances[session_id]
        result = chatbot.ask(request.question)

        # Save to MongoDB
        session_service = ChatSessionService(db)
        await session_service.add_message(session_id, "user", request.question)
        await session_service.add_message(session_id, "assistant", result["answer"])

        return {
            "success": True,
            "question": result["question"],
            "answer": result["answer"]
        }

    except Exception as e:
        logger.error(f"Query error: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=str(e)
        )


@router.get("/history/")
async def get_history(session_id: str, db=Depends(get_database)):
    """Get conversation history"""
    try:
        session_service = ChatSessionService(db)
        history = await session_service.get_conversation_history(session_id)

        if history is None:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Session not found"
            )

        session = await session_service.get_session(session_id)

        return {
            "success": True,
            "session_id": session_id,
            "filename": session.get("filename"),
            "history": history
        }

    except Exception as e:
        logger.error(f"History error: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=str(e)
        )


@router.post("/clear-session/")
async def clear_session(session_id: str, db=Depends(get_database)):
    """Clear chat session"""
    try:
        session_service = ChatSessionService(db)
        await session_service.delete_session(session_id)

        if session_id in chatbot_instances:
            del chatbot_instances[session_id]

        return {
            "success": True,
            "message": "Session cleared"
        }

    except Exception as e:
        logger.error(f"Clear session error: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=str(e)
        )


@router.get("/user-sessions/")
async def get_user_sessions(
    current_user: UserInDB = Depends(get_current_user),
    db=Depends(get_database)
):
    """Get all sessions for a user (chat history)"""
    try:
        session_service = ChatSessionService(db)
        sessions = await session_service.get_user_sessions(str(current_user.id))

        return {
            "success": True,
            "user_id": str(current_user.id),
            "sessions": sessions,
            "total": len(sessions)
        }

    except Exception as e:
        logger.error(f"User sessions error: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=str(e)
        )
