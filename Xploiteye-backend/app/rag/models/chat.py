"""
Xploit Eye - Chat History Model
"""
from pydantic import BaseModel, Field
from typing import Optional, List, Dict, Any
from datetime import datetime
from bson import ObjectId
from app.rag.models.user import PyObjectId


class ChatSource(BaseModel):
    """Source document for chat response"""
    text: str
    source: str  # "user_report" or "global_kb"
    page: Optional[int] = None
    score: float
    metadata: Optional[Dict[str, Any]] = None


class ChatMetadata(BaseModel):
    """Performance metadata for chat"""
    retrieval_time_ms: int
    llm_time_ms: int
    total_time_ms: int
    model_used: str
    chunks_retrieved: int


class Chat(BaseModel):
    """Chat history database model"""
    id: Optional[PyObjectId] = Field(default_factory=PyObjectId, alias="_id")
    user_id: str
    conversation_id: Optional[str] = None  # Groups chats into conversations
    session_id: Optional[str] = None  # None if global KB query only
    timestamp: datetime = Field(default_factory=datetime.utcnow)
    query: str
    response: str
    sources: List[ChatSource] = []
    metadata: Optional[ChatMetadata] = None
    
    class Config:
        populate_by_name = True
        arbitrary_types_allowed = True
        json_encoders = {ObjectId: str}


class ChatCreate(BaseModel):
    """Chat creation schema"""
    query: str = Field(min_length=1, max_length=2000)
    session_id: Optional[str] = None
    conversation_id: Optional[str] = None  # If None, creates new conversation
    
    class Config:
        json_schema_extra = {
            "example": {
                "query": "What SQL injection vulnerabilities were found in the login endpoint?",
                "session_id": "sess_abc123xyz"
            }
        }


class ChatResponse(BaseModel):
    """Chat response schema"""
    id: str
    user_id: str
    conversation_id: Optional[str] = None
    session_id: Optional[str] = None
    timestamp: datetime
    query: str
    response: str
    sources: List[ChatSource]
    metadata: Optional[ChatMetadata] = None


class ConversationSummary(BaseModel):
    """Conversation summary for sidebar"""
    conversation_id: str
    title: str  # First query or auto-generated title
    last_message_at: datetime
    message_count: int
    session_id: Optional[str] = None
    
    class Config:
        json_schema_extra = {
            "example": {
                "id": "507f1f77bcf86cd799439011",
                "user_id": "507f191e810c19729de860ea",
                "session_id": "sess_abc123xyz",
                "timestamp": "2024-01-15T14:30:00",
                "query": "What SQL injection vulnerabilities were found?",
                "response": "**Finding**: SQL Injection in login endpoint...",
                "sources": [
                    {
                        "text": "SQL Injection vulnerability detected...",
                        "source": "user_report",
                        "page": 3,
                        "score": 0.92,
                        "metadata": {"severity": "Critical"}
                    }
                ],
                "metadata": {
                    "retrieval_time_ms": 234,
                    "llm_time_ms": 1567,
                    "total_time_ms": 1801,
                    "model_used": "llama-3.3-70b-versatile",
                    "chunks_retrieved": 10
                }
            }
        }
