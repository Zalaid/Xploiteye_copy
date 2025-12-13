"""
URL Configuration for Mobile Security PDF Chatbot API
Add these URLs to your main urls.py
"""

from django.urls import path
from . import views
from . import views_unified

urlpatterns = [
    # ===== UNIFIED CHAT ENDPOINTS (NEW - USE THESE) =====
    path('unified/query/', views_unified.unified_chat_query, name='unified_chat_query'),
    path('unified/upload-pdf/', views_unified.unified_upload_pdf, name='unified_upload_pdf'),
    path('unified/clear-session/', views_unified.unified_clear_session, name='unified_clear_session'),
    path('unified/history/', views_unified.unified_get_history, name='unified_get_history'),
    path('unified/voice-to-text/', views_unified.voice_to_text, name='voice_to_text'),  # NEW: Voice input
    path('unified/translate-to-urdu/', views_unified.translate_to_urdu, name='translate_to_urdu'),  # NEW: English to Urdu translation
    
    # ===== LEGACY ENDPOINTS (Keep for backward compatibility) =====
    # Upload PDF endpoint
    path('upload-pdf/', views.upload_pdf, name='upload_pdf'),
    
    # Ask question endpoint
    path('ask-question/', views.ask_question, name='ask_question'),
    
    # Clear session endpoint
    path('clear-session/', views.clear_session, name='clear_session'),
    
    # Get conversation history endpoint
    path('conversation-history/', views.get_conversation_history, name='conversation_history'),
]