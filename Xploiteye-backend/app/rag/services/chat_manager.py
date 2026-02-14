"""
Xploit Eye - Chat Manager Service
"""
from typing import List, Dict, Any, Optional
from datetime import datetime
from loguru import logger

from app.database.mongodb import get_database
from app.rag.models.chat import Chat, ChatSource, ChatMetadata


class ChatManager:
    """Manage chat history persistence"""
    
    async def save_chat(
        self,
        user_id: str,
        query: str,
        response: str,
        sources: List[Dict[str, Any]],
        session_id: Optional[str] = None,
        conversation_id: Optional[str] = None,
        metadata: Optional[Dict[str, Any]] = None
    ) -> tuple[str, str]:  # Returns (chat_id, conversation_id)
        """
        Save chat to MongoDB
        
        Args:
            user_id: User ID
            query: User query
            response: Assistant response
            sources: Retrieved sources
            session_id: Session ID (if applicable)
            conversation_id: Conversation ID (if None, creates new)
            metadata: Performance metadata
            
        Returns:
            Tuple of (chat_id, conversation_id)
        """
        try:
            database = await get_database()
            
            # Format sources
            chat_sources = [
                ChatSource(
                    text=source.get("text", ""),
                    source=source.get("metadata", {}).get("source", "unknown"),
                    page=source.get("metadata", {}).get("page"),
                    score=source.get("score", 0.0),
                    metadata=source.get("metadata", {})
                ).dict()
                for source in sources
            ]
            
            # Format metadata
            chat_metadata = None
            if metadata:
                chat_metadata = ChatMetadata(**metadata).dict()
            
            # Generate conversation_id if not provided (new conversation)
            if not conversation_id:
                import uuid
                conversation_id = f"conv_{uuid.uuid4().hex[:12]}"
            
            # Create chat document
            chat_doc = {
                "user_id": user_id,
                "conversation_id": conversation_id,
                "session_id": session_id,
                "timestamp": datetime.utcnow(),
                "query": query,
                "response": response,
                "sources": chat_sources,
                "metadata": chat_metadata
            }
            
            result = await database.chats.insert_one(chat_doc)
            
            logger.info(f"💾 Saved chat for user {user_id} in conversation {conversation_id}")
            
            return str(result.inserted_id), conversation_id
            
        except Exception as e:
            logger.error(f"❌ Failed to save chat: {e}")
            raise
    
    async def get_user_history(
        self,
        user_id: str,
        limit: int = 50,
        skip: int = 0
    ) -> List[Dict[str, Any]]:
        """
        Get user's chat history
        
        Args:
            user_id: User ID
            limit: Number of chats to retrieve
            skip: Number of chats to skip
            
        Returns:
            List of chat documents
        """
        try:
            database = await get_database()
            
            cursor = database.chats.find(
                {"user_id": user_id}
            ).sort("timestamp", -1).skip(skip).limit(limit)
            
            chats = await cursor.to_list(length=limit)
            
            # Convert ObjectId to string
            for chat in chats:
                chat["_id"] = str(chat["_id"])
            
            logger.info(f"📜 Retrieved {len(chats)} chats for user {user_id}")
            
            return chats
            
        except Exception as e:
            logger.error(f"❌ Failed to get user history: {e}")
            raise
    
    async def get_session_history(
        self,
        user_id: str,
        session_id: str,
        limit: int = 50
    ) -> List[Dict[str, Any]]:
        """
        Get chat history for specific session
        
        Args:
            user_id: User ID
            session_id: Session ID
            limit: Number of chats to retrieve
            
        Returns:
            List of chat documents
        """
        try:
            database = await get_database()
            
            cursor = database.chats.find(
                {"user_id": user_id, "session_id": session_id}
            ).sort("timestamp", -1).limit(limit)
            
            chats = await cursor.to_list(length=limit)
            
            # Convert ObjectId to string
            for chat in chats:
                chat["_id"] = str(chat["_id"])
            
            logger.info(f"📜 Retrieved {len(chats)} chats for session {session_id}")
            
            return chats
            
        except Exception as e:
            logger.error(f"❌ Failed to get session history: {e}")
            raise
    
    async def get_conversations(
        self,
        user_id: str,
        limit: int = 50
    ) -> List[Dict[str, Any]]:
        """
        Get list of conversations for user
        
        Args:
            user_id: User ID
            limit: Number of conversations to retrieve
            
        Returns:
            List of conversation summaries
        """
        try:
            database = await get_database()
            
            # Aggregate to group chats by conversation_id
            pipeline = [
                {"$match": {"user_id": user_id}},
                {"$sort": {"timestamp": -1}},
                {
                    "$group": {
                        "_id": "$conversation_id",
                        "first_query": {"$first": "$query"},
                        "last_message_at": {"$max": "$timestamp"},
                        "message_count": {"$sum": 1},
                        "session_id": {"$first": "$session_id"}
                    }
                },
                {"$sort": {"last_message_at": -1}},
                {"$limit": limit}
            ]
            
            conversations = []
            async for conv in database.chats.aggregate(pipeline):
                # Generate title from first query (truncate to 50 chars)
                title = conv.get("first_query", "New Conversation")
                if len(title) > 50:
                    title = title[:47] + "..."
                
                conversations.append({
                    "conversation_id": conv["_id"],
                    "title": title,
                    "last_message_at": conv["last_message_at"],
                    "message_count": conv["message_count"],
                    "session_id": conv.get("session_id")
                })
            
            logger.info(f"📋 Retrieved {len(conversations)} conversations for user {user_id}")
            
            return conversations
            
        except Exception as e:
            logger.error(f"❌ Failed to get conversations: {e}")
            raise
    
    async def get_conversation_chats(
        self,
        user_id: str,
        conversation_id: str,
        limit: int = 100
    ) -> List[Dict[str, Any]]:
        """
        Get all chats in a conversation
        
        Args:
            user_id: User ID
            conversation_id: Conversation ID
            limit: Maximum number of chats to retrieve
            
        Returns:
            List of chat documents in chronological order
        """
        try:
            database = await get_database()
            
            cursor = database.chats.find(
                {"user_id": user_id, "conversation_id": conversation_id}
            ).sort("timestamp", 1).limit(limit)  # Sort ascending (oldest first)
            
            chats = await cursor.to_list(length=limit)
            
            # Convert ObjectId to string
            for chat in chats:
                chat["_id"] = str(chat["_id"])
            
            logger.info(f"📜 Retrieved {len(chats)} chats for conversation {conversation_id}")
            
            return chats
            
        except Exception as e:
            logger.error(f"❌ Failed to get conversation chats: {e}")
            raise
    
    async def delete_conversation(
        self,
        user_id: str,
        conversation_id: str
    ) -> bool:
        """
        Delete entire conversation (all chats)
        
        Args:
            user_id: User ID
            conversation_id: Conversation ID
            
        Returns:
            True if deleted, False otherwise
        """
        try:
            database = await get_database()
            
            result = await database.chats.delete_many({
                "user_id": user_id,
                "conversation_id": conversation_id
            })
            
            if result.deleted_count > 0:
                logger.info(f"🗑️  Deleted conversation {conversation_id} ({result.deleted_count} chats)")
                return True
            
            return False
            
        except Exception as e:
            logger.error(f"❌ Failed to delete conversation: {e}")
            raise
    
    async def delete_chat(self, user_id: str, chat_id: str) -> bool:
        """
        Delete a specific chat
        
        Args:
            user_id: User ID
            chat_id: Chat ID
            
        Returns:
            True if deleted, False otherwise
        """
        try:
            from bson import ObjectId
            database = await get_database()
            
            result = await database.chats.delete_one({
                "_id": ObjectId(chat_id),
                "user_id": user_id
            })
            
            if result.deleted_count > 0:
                logger.info(f"🗑️  Deleted chat {chat_id}")
                return True
            
            return False
            
        except Exception as e:
            logger.error(f"❌ Failed to delete chat: {e}")
            raise


# Global chat manager instance
chat_manager = ChatManager()
