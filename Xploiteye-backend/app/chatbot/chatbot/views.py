"""
Django REST API Views for Mobile Security PDF Chatbot
Handles PDF upload, questions, and session management
"""

from rest_framework.decorators import api_view
from rest_framework.response import Response
from rest_framework import status
from django.conf import settings
import pickle
import os
import uuid
from django.contrib.sessions.models import Session
from django.contrib.sessions.backends.db import SessionStore

from .pdf_chat import SecurityPDFChatbot


# Initialize OpenAI API key from settings
OPENAI_API_KEY = os.getenv('OPENAI_API_KEY_1') or getattr(settings, 'OPENAI_API_KEY', None)

if not OPENAI_API_KEY:
    raise ValueError("OPENAI_API_KEY_1 not found. Set it in environment variables or Django settings.")


@api_view(['POST'])
def upload_pdf(request):
    """
    Upload PDF and store content in session
    
    Endpoint: POST /api/upload-pdf/
    
    Request:
        - file: PDF file (multipart/form-data)
    
    Response:
        {
            "success": true,
            "message": "PDF uploaded successfully",
            "session_id": "abc123xyz",  # Session ID for subsequent requests
            "pdf_length": 5000,
            "filename": "report.pdf"
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
        
        # Validate file type
        if not pdf_file.name.endswith('.pdf'):
            return Response(
                {"success": False, "error": "Only PDF files are allowed"},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Validate file size (max 10MB for safety)
        max_size = 10 * 1024 * 1024  # 10MB in bytes
        if pdf_file.size > max_size:
            return Response(
                {"success": False, "error": f"File too large. Maximum size is 10MB."},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Read PDF bytes
        pdf_bytes = pdf_file.read()
        
        # Initialize chatbot
        chatbot = SecurityPDFChatbot(openai_api_key=OPENAI_API_KEY)
        
        # Load PDF content
        pdf_content = chatbot.load_pdf_from_bytes(pdf_bytes, filename=pdf_file.name)
        
        # Create a new session programmatically
        session = SessionStore()
        session['chatbot_data'] = {
            'pdf_content': pdf_content,
            'conversation_history': [],
            'filename': pdf_file.name
        }
        session.save()
        
        # Get the session key
        session_id = session.session_key
        
        return Response({
            "success": True,
            "message": "PDF uploaded and processed successfully",
            "session_id": session_id,  # Frontend will store this
            "pdf_length": len(pdf_content),
            "filename": pdf_file.name
        }, status=status.HTTP_200_OK)
        
    except Exception as e:
        return Response(
            {"success": False, "error": str(e)},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )


@api_view(['POST'])
def ask_question(request):
    """
    Ask a question about the uploaded PDF
    
    Endpoint: POST /api/ask-question/
    
    Request:
        {
            "session_id": "abc123xyz",  # Required: Session ID from upload
            "question": "What are the top security concerns?"
        }
    
    Response:
        {
            "success": true,
            "question": "What are the top security concerns?",
            "answer": "Based on the report, the top security concerns are..."
        }
    """
    try:
        # Get session_id from request
        session_id = request.data.get('session_id', '').strip()
        
        if not session_id:
            return Response(
                {"success": False, "error": "No session_id provided. Please upload a PDF first."},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Get question from request
        question = request.data.get('question', '').strip()
        
        if not question:
            return Response(
                {"success": False, "error": "No question provided"},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Retrieve session data
        try:
            session = SessionStore(session_key=session_id)
            chatbot_data = session.get('chatbot_data')
            
            if not chatbot_data:
                return Response(
                    {"success": False, "error": "Session expired or invalid. Please upload PDF again."},
                    status=status.HTTP_400_BAD_REQUEST
                )
        except Exception:
            return Response(
                {"success": False, "error": "Invalid session. Please upload PDF again."},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Recreate chatbot instance
        chatbot = SecurityPDFChatbot(openai_api_key=OPENAI_API_KEY)
        chatbot.pdf_content = chatbot_data['pdf_content']
        
        # Restore conversation history
        from langchain_core.messages import HumanMessage, AIMessage
        for msg in chatbot_data['conversation_history']:
            if msg['role'] == 'user':
                chatbot.conversation_history.append(HumanMessage(content=msg['content']))
            else:
                chatbot.conversation_history.append(AIMessage(content=msg['content']))
        
        # Ask question
        result = chatbot.ask(question)
        
        # Update session with new conversation history
        chatbot_data['conversation_history'] = chatbot.get_conversation_history()
        session['chatbot_data'] = chatbot_data
        session.save()
        
        return Response({
            "success": True,
            "question": result['question'],
            "answer": result['answer']
        }, status=status.HTTP_200_OK)
        
    except Exception as e:
        return Response(
            {"success": False, "error": str(e)},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )


@api_view(['POST'])
def clear_session(request):
    """
    Clear PDF and conversation history from session
    
    Endpoint: POST /api/clear-session/
    
    Request:
        {
            "session_id": "abc123xyz"  # Session ID to clear
        }
    
    Response:
        {
            "success": true,
            "message": "Session cleared successfully"
        }
    """
    try:
        # Get session_id from request (support both JSON and form data for sendBeacon)
        session_id = request.data.get('session_id') or request.POST.get('session_id', '')
        session_id = session_id.strip() if session_id else ''
        
        if not session_id:
            return Response(
                {"success": False, "error": "No session_id provided"},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Delete the session
        try:
            session = SessionStore(session_key=session_id)
            session.delete()
            print(f"✅ Session {session_id} deleted successfully")  # Debug log
        except Exception as e:
            print(f"⚠️ Failed to delete session {session_id}: {str(e)}")  # Debug log
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
def get_conversation_history(request):
    """
    Get conversation history for current session
    
    Endpoint: GET /api/conversation-history/?session_id=abc123xyz
    
    Query Parameters:
        - session_id: Session ID from upload
    
    Response:
        {
            "success": true,
            "history": [
                {"role": "user", "content": "What are critical issues?"},
                {"role": "assistant", "content": "The critical issues are..."}
            ],
            "filename": "report.pdf"
        }
    """
    try:
        # Get session_id from query params
        session_id = request.query_params.get('session_id', '').strip()
        
        if not session_id:
            return Response({
                "success": True,
                "history": [],
                "message": "No session_id provided"
            }, status=status.HTTP_200_OK)
        
        # Retrieve session data
        try:
            session = SessionStore(session_key=session_id)
            chatbot_data = session.get('chatbot_data')
            
            if not chatbot_data:
                return Response({
                    "success": True,
                    "history": [],
                    "message": "No active session"
                }, status=status.HTTP_200_OK)
        except Exception:
            return Response({
                "success": True,
                "history": [],
                "message": "Invalid session"
            }, status=status.HTTP_200_OK)
        
        return Response({
            "success": True,
            "history": chatbot_data['conversation_history'],
            "filename": chatbot_data.get('filename', 'Unknown')
        }, status=status.HTTP_200_OK)
        
    except Exception as e:
        return Response(
            {"success": False, "error": str(e)},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )