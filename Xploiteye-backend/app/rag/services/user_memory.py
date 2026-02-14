"""
Xploit Eye - User Long-Term Memory Service

Stores and retrieves per-user long-term memory using the same
BAAI/bge-large-en-v1.5 embedding model and Qdrant vector database.
"""
from typing import List, Dict, Any, Optional
from datetime import datetime
from loguru import logger

from config.settings import settings
from .embedder import embedding_service
from .qdrant_manager import qdrant_manager
from .llm_client import llm_client


class UserMemoryService:
    """Manage per-user long-term semantic memory in Qdrant."""

    def __init__(self):
        """Initialize user memory service."""
        self.retrieval_limit = settings.user_memory_retrieval_limit

    def _collection_name(self, user_id: str) -> str:
        """
        Build the Qdrant collection name for a user's memory.

        Args:
            user_id: User ID

        Returns:
            Collection name string
        """
        return f"user_memory_{user_id}"

    def _ensure_collection(self, user_id: str):
        """
        Ensure the user's memory collection exists in Qdrant.

        Args:
            user_id: User ID
        """
        collection_name = self._collection_name(user_id)
        if not qdrant_manager.collection_exists(collection_name):
            logger.info(f"🧠 Creating user memory collection: {collection_name}")
            qdrant_manager.create_collection(collection_name)

    def store_memory_event(
        self,
        user_id: str,
        conversation_id: str,
        text: str,
        metadata: Optional[Dict[str, Any]] = None
    ) -> None:
        """
        Store a single memory event for a user in Qdrant.

        Args:
            user_id: User ID
            conversation_id: Conversation ID this memory is related to
            text: Memory text content
            metadata: Optional extra metadata (e.g. memory_type)
        """
        try:
            if not text or not text.strip():
                return

            self._ensure_collection(user_id)
            collection_name = self._collection_name(user_id)

            base_metadata: Dict[str, Any] = {
                "user_id": user_id,
                "conversation_id": conversation_id,
                "created_at": datetime.utcnow().isoformat(),
            }
            if metadata:
                base_metadata.update(metadata)

            chunk = {
                "text": text[:4000],  # avoid extremely long payloads
                "metadata": base_metadata,
            }

            embedding = embedding_service.embed_text(chunk["text"])

            # Reuse generic Qdrant upsert helper
            qdrant_manager.upsert_points(
                collection_name=collection_name,
                chunks=[chunk],
                embeddings=[embedding],
            )

            logger.info(
                f"💾 Stored user memory for user {user_id} in {collection_name}"
            )

        except Exception as e:
            logger.error(f"❌ Failed to store user memory for user {user_id}: {e}")

    def store_chat_memory(
        self,
        user_id: str,
        conversation_id: str,
        query: str,
        response: str,
    ) -> None:
        """
        Store a summarized memory snippet for a single chat turn.
        
        Args:
            user_id: User ID
            conversation_id: Conversation ID
            query: User query
            response: Assistant response
        """
        try:
            summary = llm_client.summarize_memory(
                query=query,
                response=response,
            )
        except Exception as e:
            logger.error(f"❌ Failed to summarize memory for user {user_id}: {e}")
            summary = (
                "Conversation memory snippet:\n"
                f"User question: {query}\n"
                f"Assistant answer: {response}"
            )
        
        self.store_memory_event(
            user_id=user_id,
            conversation_id=conversation_id,
            text=summary,
            metadata={"memory_type": "chat_summary"},
        )

    def retrieve_user_memory(
        self,
        query: str,
        user_id: str,
    ) -> List[Dict[str, Any]]:
        """
        Retrieve long-term user memory relevant to a query.

        Args:
            query: Current user query
            user_id: User ID

        Returns:
            List of retrieved memory chunks with metadata
        """
        collection_name = self._collection_name(user_id)

        if not qdrant_manager.collection_exists(collection_name):
            logger.info(f"ℹ️ No user memory collection for user {user_id}")
            return []

        try:
            query_vector = embedding_service.embed_query(query)

            memory_results = qdrant_manager.search(
                collection_name=collection_name,
                query_vector=query_vector,
                limit=self.retrieval_limit,
            )

            # Mark source as user_memory so UI and analytics can distinguish it
            for result in memory_results:
                result["metadata"]["source"] = "user_memory"

            logger.info(
                f"🔎 Retrieved {len(memory_results)} user memory chunks for user {user_id}"
            )

            return memory_results

        except Exception as e:
            logger.error(f"❌ Failed to retrieve user memory for user {user_id}: {e}")
            return []


# Global user memory service instance
user_memory_service = UserMemoryService()

