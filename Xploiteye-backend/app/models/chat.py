"""
Chat models for Pydantic validation
"""

from pydantic import BaseModel, Field
from typing import List, Dict, Optional
from datetime import datetime


class ChatMessage(BaseModel):
    """Individual chat message"""
    role: str = Field(..., description="user or assistant")
    content: str
    timestamp: Optional[datetime] = None


class ChatSession(BaseModel):
    """Chat session model"""
    session_id: str
    user_id: Optional[str] = None
    filename: str
    pdf_content_preview: str
    conversation_history: List[ChatMessage] = []
    created_at: datetime
    updated_at: datetime


class UploadPDFRequest(BaseModel):
    """PDF upload request"""
    file_name: str = Field(..., description="Original filename")


class ChatQueryRequest(BaseModel):
    """Chat query request"""
    session_id: str = Field(..., description="Session ID from upload")
    question: str = Field(..., description="Question about PDF")


class ChatHistoryResponse(BaseModel):
    """Chat history response"""
    success: bool
    session_id: str
    filename: str
    history: List[ChatMessage]


class RAGQueryRequest(BaseModel):
    """RAG query request"""
    query: str = Field(..., description="Question about SherlockDroid")
    top_k: int = Field(default=5, ge=1, le=10)


class RAGQueryResponse(BaseModel):
    """RAG query response"""
    success: bool
    answer: str
    sources: Optional[List[Dict]] = None
    query_analysis: Optional[Dict] = None
