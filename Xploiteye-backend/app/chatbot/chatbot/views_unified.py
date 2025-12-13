"""
Unified Chat API Views
Handles routing between RAG and PDF chatbot
"""
import os
import tempfile
from rest_framework.decorators import api_view, parser_classes
from rest_framework.parsers import MultiPartParser
from rest_framework.response import Response
from rest_framework import status
from django.contrib.sessions.backends.db import SessionStore
from openai import OpenAI

from chatbot.unified_chat import (
    UnifiedChatRouter,
    get_or_create_session,
    add_to_history,
    OPENAI_API_KEY
)
from chatbot.pdf_chat import SecurityPDFChatbot

import logging
logger = logging.getLogger(__name__)


@api_view(['POST'])
def unified_chat_query(request):
    """
    Unified chat endpoint - handles both RAG and PDF queries
    
    Request:
    {
        "session_id": "abc123" (optional - will create if not provided),
        "query": "What is SherlockDroid?"
    }
    
    Response:
    {
        "success": true,
        "session_id": "abc123",
        "answer": "...",
        "route": "rag" | "pdf",
        "source": "rag" | "pdf_chatbot",
        "has_pdf": false
    }
    """
    try:
        # Get request data - safely handle session_id
        session_id_raw = request.data.get('session_id')
        session_id = None
        if session_id_raw:
            session_id_str = str(session_id_raw).strip()
            session_id = session_id_str if session_id_str else None
        
        query_raw = request.data.get('query', '')
        query = str(query_raw).strip() if query_raw else ''
        
        if not query:
            return Response(
                {"success": False, "error": "Query is required"},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Get or create session
        session, session_id, session_data = get_or_create_session(session_id)
        
        # Initialize router
        router = UnifiedChatRouter(openai_api_key=OPENAI_API_KEY)
        
        # Read forced route from client (pdf or rag); fallback to router logic if missing/invalid
        forced_route_raw = request.data.get('forced_route')
        forced_route = None
        if isinstance(forced_route_raw, str):
            fr = forced_route_raw.strip().lower()
            if fr in ("pdf", "rag"):
                forced_route = fr
        
        # Add user message to history with pending route (will set below)
        add_to_history(
            session_data,
            role='user',
            content=query,
            route='pending'
        )
        
        # Process query via forced route when provided, else router decides
        result = router.process_query(session_id, query, session_data, forced_route=forced_route)
        
        # Update the last user message with actual route
        if session_data['unified_history']:
            session_data['unified_history'][-1]['route'] = result['route']
        
        # Add assistant response to history
        add_to_history(
            session_data,
            role='assistant',
            content=result['answer'],
            route=result['route'],
            sources=result.get('sources', [])
        )
        
        # Save session
        session['unified_chat_data'] = session_data
        session.save()
        
        return Response({
            "success": True,
            "session_id": session_id,
            "answer": result['answer'],
            "route": result['route'],
            "source": result.get('source'),
            "sources": result.get('sources', []),
            "has_pdf": session_data.get('has_pdf', False),
            "pdf_filename": session_data.get('pdf_filename')
        }, status=status.HTTP_200_OK)
        
    except Exception as e:
        logger.error(f"Unified chat query error: {e}", exc_info=True)
        return Response(
            {"success": False, "error": str(e)},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )


@api_view(['POST'])
def unified_upload_pdf(request):
    """
    Upload PDF in unified chat session
    
    Request: multipart/form-data with 'file' and optional 'session_id'
    
    Response:
    {
        "success": true,
        "session_id": "abc123",
        "message": "Great! I've analyzed your security report...",
        "filename": "report.pdf",
        "has_pdf": true
    }
    """
    try:
        # Check if file is present
        if 'file' not in request.FILES:
            return Response(
                {"success": False, "error": "No file provided"},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        pdf_file = request.FILES['file']
        
        # Safely get session_id
        session_id_raw = request.data.get('session_id')
        session_id = None
        if session_id_raw:
            session_id_str = str(session_id_raw).strip()
            session_id = session_id_str if session_id_str else None
        
        # Validate file type
        if not pdf_file.name.endswith('.pdf'):
            return Response(
                {"success": False, "error": "Only PDF files are allowed"},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Validate file size (max 10MB)
        max_size = 10 * 1024 * 1024
        if pdf_file.size > max_size:
            return Response(
                {"success": False, "error": "File too large. Maximum size is 10MB."},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Get or create session
        session, session_id, session_data = get_or_create_session(session_id)
        
        # Read PDF bytes
        pdf_bytes = pdf_file.read()
        
        # Initialize chatbot and extract PDF content
        chatbot = SecurityPDFChatbot(openai_api_key=OPENAI_API_KEY)
        pdf_content = chatbot.load_pdf_from_bytes(pdf_bytes, filename=pdf_file.name)
        
        # Update session with PDF data
        session_data['has_pdf'] = True
        session_data['pdf_content'] = pdf_content
        session_data['pdf_filename'] = pdf_file.name
        
        # Create a friendly upload message
        page_count = len(pdf_content.split('\n\n'))  # Rough estimate
        
        upload_message = f"""Perfect! I've received and analyzed **{pdf_file.name}**. 

I'm ready to help you understand the security findings in this report. You can ask me about:
- 🔍 **Vulnerabilities** - What security issues were found?
- ⚠️ **Risk Assessment** - Which threats are most critical?
- 🛡️ **Recommendations** - How to fix the issues?
- 📊 **Summary** - Overall security posture

What would you like to know about your security report?"""
        
        # Add upload event to history
        add_to_history(
            session_data,
            role='system',
            content=f"User uploaded PDF: {pdf_file.name}",
            route='system'
        )
        
        add_to_history(
            session_data,
            role='assistant',
            content=upload_message,
            route='pdf'
        )
        
        # Save session
        session['unified_chat_data'] = session_data
        session.save()
        
        return Response({
            "success": True,
            "session_id": session_id,
            "message": upload_message,
            "filename": pdf_file.name,
            "has_pdf": True
        }, status=status.HTTP_200_OK)
        
    except Exception as e:
        logger.error(f"PDF upload error: {e}", exc_info=True)
        return Response(
            {"success": False, "error": str(e)},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )


@api_view(['POST'])
def unified_clear_session(request):
    """
    Clear unified chat session
    
    Request:
    {
        "session_id": "abc123"
    }
    
    Response:
    {
        "success": true,
        "message": "Session cleared"
    }
    """
    try:
        # Get session_id from request (support both JSON and form data for sendBeacon)
        session_id_raw = request.data.get('session_id') or request.POST.get('session_id', '')
        session_id = str(session_id_raw).strip() if session_id_raw else ''
        
        if not session_id:
            return Response(
                {"success": False, "error": "No session_id provided"},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Delete the session
        try:
            session = SessionStore(session_key=session_id)
            session.delete()
            logger.info(f"✅ Unified session {session_id} deleted successfully")
        except Exception as e:
            logger.warning(f"⚠️ Failed to delete session {session_id}: {str(e)}")
            pass  # Session might not exist, that's okay
        
        return Response({
            "success": True,
            "message": "Session cleared successfully"
        }, status=status.HTTP_200_OK)
        
    except Exception as e:
        return Response(
            {"success": False, "error": str(e)},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )


@api_view(['GET'])
def unified_get_history(request):
    """
    Get conversation history for a session
    
    Query params: ?session_id=abc123
    
    Response:
    {
        "success": true,
        "history": [...],
        "has_pdf": false,
        "pdf_filename": null
    }
    """
    try:
        session_id_raw = request.GET.get('session_id', '')
        session_id = str(session_id_raw).strip() if session_id_raw else ''
        
        if not session_id:
            return Response(
                {"success": False, "error": "No session_id provided"},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Load session
        session = SessionStore(session_key=session_id)
        session_data = session.get('unified_chat_data')
        
        if not session_data:
            return Response(
                {"success": False, "error": "Invalid session"},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        return Response({
            "success": True,
            "history": session_data.get('unified_history', []),
            "has_pdf": session_data.get('has_pdf', False),
            "pdf_filename": session_data.get('pdf_filename')
        }, status=status.HTTP_200_OK)
        
    except Exception as e:
        logger.error(f"Get history error: {e}")
        return Response(
            {"success": False, "error": str(e)},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )


@api_view(['POST'])
@parser_classes([MultiPartParser])
def voice_to_text(request):
    """
    Convert voice audio to text using OpenAI Whisper API
    Supports English and Urdu
    Auto-translates Urdu to English
    
    Request: multipart/form-data with 'audio' field
    
    Response:
    {
        "success": true,
        "text": "translated English text",
        "original_text": "original text (Urdu if detected)",
        "language": "en" or "ur",
        "is_translated": true/false
    }
    """
    try:
        # Check if audio file is present
        if 'audio' not in request.FILES:
            return Response(
                {"success": False, "error": "No audio file provided"},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        audio_file = request.FILES['audio']
        logger.info(f"🎤 Received audio file: {audio_file.name}, size: {audio_file.size} bytes")
        
        # Validate file size (max 25MB as per OpenAI Whisper limit)
        max_size = 25 * 1024 * 1024
        if audio_file.size > max_size:
            return Response(
                {"success": False, "error": "Audio file too large. Maximum size is 25MB."},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Initialize OpenAI client
        client = OpenAI(api_key=OPENAI_API_KEY)
        
        # Step 1: Transcribe audio using Whisper (auto-detects language)
        logger.info("🔊 Transcribing audio with Whisper...")
        
        # Save audio to temporary file for Whisper API
        with tempfile.NamedTemporaryFile(delete=False, suffix='.webm') as temp_audio:
            for chunk in audio_file.chunks():
                temp_audio.write(chunk)
            temp_audio_path = temp_audio.name
        
        try:
            # Transcribe with Whisper
            with open(temp_audio_path, 'rb') as audio:
                transcript_response = client.audio.transcriptions.create(
                    model="whisper-1",
                    file=audio,
                    response_format="verbose_json"  # Get language detection info
                )
            
            original_text = transcript_response.text
            detected_language = transcript_response.language  # e.g., "en", "english", "ur", "urdu"
            
            logger.info(f"✅ Transcription successful. Language: {detected_language}")
            logger.info(f"📝 Original text: {original_text}")
            
            # Step 2: If Urdu detected, translate to English
            # Check for both 'ur' (code) and 'urdu' (full name)
            is_urdu = detected_language.lower() in ['ur', 'urdu']
            
            if is_urdu:
                logger.info("🌐 Detected Urdu. Translating to English...")
                
                translation_response = client.chat.completions.create(
                    model="gpt-4o-mini",
                    messages=[
                        {
                            "role": "system",
                            "content": "You are a translator. Translate the following Urdu text to English. Only provide the translation, no explanations."
                        },
                        {
                            "role": "user",
                            "content": original_text
                        }
                    ],
                    temperature=0
                )
                
                english_text = translation_response.choices[0].message.content.strip()
                logger.info(f"✅ Translation successful: {english_text}")
                is_translated = True
            else:
                # Already in English or another language, use as-is
                english_text = original_text
                is_translated = False
                logger.info(f"✅ Text is in English (detected: {detected_language}), no translation needed")
            
            # Log final result
            logger.info(f"🎯 Final result - English text: {english_text}")
            logger.info(f"📊 Translation status: {is_translated}")
            
            return Response({
                "success": True,
                "text": english_text,  # This is what frontend will use
                "original_text": original_text,
                "language": detected_language,
                "is_translated": is_translated
            }, status=status.HTTP_200_OK)
            
        finally:
            # Clean up temporary file
            if os.path.exists(temp_audio_path):
                os.unlink(temp_audio_path)
        
    except Exception as e:
        logger.error(f"❌ Voice transcription error: {e}", exc_info=True)
        return Response(
            {"success": False, "error": f"Failed to process audio: {str(e)}"},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )


@api_view(['POST'])
def translate_to_urdu(request):
    """
    Translate English text to Urdu
    
    Request:
    {
        "text": "English text to translate"
    }
    
    Response:
    {
        "success": true,
        "urdu_text": "translated Urdu text"
    }
    """
    try:
        english_text = request.data.get('text', '').strip()
        
        if not english_text:
            return Response(
                {"success": False, "error": "No text provided"},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Initialize OpenAI client
        client = OpenAI(api_key=OPENAI_API_KEY)
        
        logger.info(f"🌐 Translating English to Urdu: {english_text[:100]}...")
        
        # Translate English to Urdu
        translation_response = client.chat.completions.create(
            model="gpt-4o-mini",
            messages=[
                {
                    "role": "system",
                    "content": "You are a translator. Translate the following English text to Urdu. Only provide the translation, no explanations. Preserve markdown formatting if present."
                },
                {
                    "role": "user",
                    "content": english_text
                }
            ],
            temperature=0
        )
        
        urdu_text = translation_response.choices[0].message.content.strip()
        logger.info(f"✅ Translation to Urdu successful")
        
        return Response({
            "success": True,
            "urdu_text": urdu_text
        }, status=status.HTTP_200_OK)
        
    except Exception as e:
        logger.error(f"❌ Translation to Urdu error: {e}", exc_info=True)
        return Response(
            {"success": False, "error": f"Failed to translate: {str(e)}"},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )

