"""
Chat Session Service - MongoDB integration for persistent chat history
"""

import uuid
from datetime import datetime
from typing import Dict, List, Optional
import logging
from motor.motor_asyncio import AsyncIOMotorDatabase

logger = logging.getLogger(__name__)


class ChatSessionService:
    """Manage chat sessions in MongoDB"""

    def __init__(self, db: AsyncIOMotorDatabase):
        self.db = db
        self.collection = db.chat_sessions

    async def create_session(
        self,
        user_id: Optional[str],
        filename: str,
        pdf_content_preview: str
    ) -> str:
        """Create new chat session"""
        session_id = str(uuid.uuid4())

        session_data = {
            "session_id": session_id,
            "user_id": user_id,
            "filename": filename,
            "pdf_content_preview": pdf_content_preview[:500],  # Store first 500 chars
            "conversation_history": [],
            "created_at": datetime.utcnow(),
            "updated_at": datetime.utcnow()
        }

        await self.collection.insert_one(session_data)
        logger.info(f"✅ Session {session_id} created")
        return session_id

    async def get_session(self, session_id: str) -> Optional[Dict]:
        """Retrieve session by ID"""
        return await self.collection.find_one({"session_id": session_id})

    async def add_message(
        self,
        session_id: str,
        role: str,
        content: str
    ) -> bool:
        """Add message to conversation history"""
        result = await self.collection.update_one(
            {"session_id": session_id},
            {
                "$push": {
                    "conversation_history": {
                        "role": role,
                        "content": content,
                        "timestamp": datetime.utcnow()
                    }
                },
                "$set": {"updated_at": datetime.utcnow()}
            }
        )
        return result.modified_count > 0

    async def get_conversation_history(self, session_id: str) -> Optional[List[Dict]]:
        """Get conversation history for session"""
        session = await self.get_session(session_id)
        return session.get("conversation_history", []) if session else None

    async def delete_session(self, session_id: str) -> bool:
        """Delete a session"""
        result = await self.collection.delete_one({"session_id": session_id})
        if result.deleted_count > 0:
            logger.info(f"✅ Session {session_id} deleted")
            return True
        return False

    async def get_user_sessions(self, user_id: str) -> List[Dict]:
        """Get all sessions for a user"""
        sessions = []
        async for session in self.collection.find({"user_id": user_id}).sort("created_at", -1):
            session.pop("_id", None)
            sessions.append(session)
        return sessions

    async def clear_old_sessions(self, days: int = 30) -> int:
        """Clear sessions older than specified days"""
        from datetime import timedelta
        cutoff_date = datetime.utcnow() - timedelta(days=days)
        result = await self.collection.delete_many({"created_at": {"$lt": cutoff_date}})
        logger.info(f"Deleted {result.deleted_count} old sessions")
        return result.deleted_count
