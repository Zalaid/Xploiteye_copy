"""
Unified Chat Routes - Smart routing between Chatbot and RAG
"""

import os
from fastapi import APIRouter, File, UploadFile, HTTPException, status, Depends
from typing import Optional
import logging

from app.services.unified_router_service import UnifiedChatRouter
from app.services.chatbot_service import SecurityPDFChatbot
from app.services.rag_service import RAGRetriever
from app.services.voice_service import VoiceService
from app.services.translation_service import TranslationService
from app.services.chat_session_service import ChatSessionService
from app.models.chat import ChatQueryRequest
from app.database.mongodb import get_db
from pydantic import BaseModel

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/chat", tags=["Unified Chat"])

OPENAI_API_KEY = os.getenv('OPENAI_API_KEY')

# Services
unified_router = UnifiedChatRouter(OPENAI_API_KEY)
rag_retriever = RAGRetriever()
voice_service = VoiceService(OPENAI_API_KEY)
translation_service = TranslationService(OPENAI_API_KEY)

# In-memory chatbot instances
chatbot_instances = {}


class UnifiedQueryRequest(BaseModel):
    session_id: Optional[str] = None
    query: str
    forced_route: Optional[str] = None
    top_k: int = 5


class VoiceQueryRequest(BaseModel):
    session_id: Optional[str] = None
    forced_route: Optional[str] = None


class TranslateRequest(BaseModel):
    text: str
    target_language: str = "ur"


@router.post("/unified-query/")
async def unified_query(request: UnifiedQueryRequest, db=Depends(get_db)):
    """Smart query routing between Chatbot and RAG"""
    try:
        session_id = request.session_id
        session_service = ChatSessionService(db)

        # Check if session exists
        has_pdf = False
        if session_id:
            session = await session_service.get_session(session_id)
            has_pdf = session is not None

        # Get recent history
        recent_history = []
        if session_id and has_pdf:
            recent_history = await session_service.get_conversation_history(session_id) or []

        # Classify intent
        route = unified_router.classify_intent(
            request.query,
            has_pdf=has_pdf,
            recent_history=recent_history,
            forced_route=request.forced_route
        )

        # Route to appropriate service
        if route == "pdf":
            if not session_id or not has_pdf:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="PDF session required for PDF route"
                )

            # Chatbot route
            if session_id not in chatbot_instances:
                chatbot = SecurityPDFChatbot(openai_api_key=OPENAI_API_KEY)
                chatbot_instances[session_id] = chatbot

            chatbot = chatbot_instances[session_id]
            result = chatbot.ask(request.query)

            # Save to MongoDB
            await session_service.add_message(session_id, "user", request.query)
            await session_service.add_message(session_id, "assistant", result["answer"])

            return {
                "success": True,
                "route": "pdf",
                "question": result["question"],
                "answer": result["answer"]
            }
        else:
            # RAG route
            rag_result = rag_retriever.query(request.query, top_k=request.top_k)

            return {
                "success": True,
                "route": "rag",
                "data": rag_result
            }

    except Exception as e:
        logger.error(f"Unified query error: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=str(e)
        )


@router.post("/voice-query/")
async def voice_query(
    audio: UploadFile = File(...),
    session_id: Optional[str] = None,
    forced_route: Optional[str] = None,
    db=Depends(get_db)
):
    """Query with voice input (converts to text then routes)"""
    try:
        # Convert voice to text
        audio_bytes = await audio.read()
        voice_result = await voice_service.audio_to_text(audio_bytes, audio.filename)

        if not voice_result["success"]:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Voice transcription failed: {voice_result['error']}"
            )

        # Route the transcribed text
        unified_request = UnifiedQueryRequest(
            session_id=session_id,
            query=voice_result["text"],
            forced_route=forced_route
        )

        return await unified_query(unified_request, db)

    except Exception as e:
        logger.error(f"Voice query error: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=str(e)
        )


@router.post("/translate/")
async def translate_response(request: TranslateRequest):
    """Translate text to specified language"""
    try:
        if request.target_language == "ur":
            result = await translation_service.translate_to_urdu(request.text)
        else:
            result = await translation_service.translate_to_language(
                request.text,
                request.target_language
            )

        return {
            "success": result["success"],
            "original": result["original"],
            "translated": result["translated"],
            "target_language": request.target_language,
            "error": result.get("error")
        }

    except Exception as e:
        logger.error(f"Translation error: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=str(e)
        )


@router.get("/analyze-query/")
async def analyze_query(query: str):
    """Analyze query intent"""
    try:
        analysis = unified_router.analyze_query(query)

        return {
            "success": True,
            "analysis": analysis,
            "suggested_route": "pdf" if analysis["has_pdf_keywords"] else "rag"
        }

    except Exception as e:
        logger.error(f"Query analysis error: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=str(e)
        )
