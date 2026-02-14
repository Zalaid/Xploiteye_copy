"""
Xploit Eye - Hybrid RAG Retrieval Service
"""
from typing import List, Dict, Any, Optional
from loguru import logger
import time

from config.settings import settings
from .qdrant_manager import qdrant_manager
from .embedder import embedding_service
from .user_memory import user_memory_service


class RetrieverService:
    """Hybrid retrieval from user reports and global KB"""
    
    def __init__(self):
        """Initialize retriever"""
        self.user_report_limit = settings.user_report_retrieval_limit
        self.global_kb_limit = settings.global_kb_retrieval_limit
        self.global_collection = settings.qdrant_global_collection
    
    def retrieve_hybrid(
        self,
        query: str,
        user_id: str,
        session_id: Optional[str] = None
    ) -> tuple[List[Dict[str, Any]], int]:
        """
        Hybrid retrieval from user report + global KB
        
        Args:
            query: User query
            user_id: User ID
            session_id: Session ID (if querying specific report)
            
        Returns:
            Tuple of (retrieved chunks, retrieval time in ms)
        """
        start_time = time.time()
        
        try:
            # Generate query embedding
            query_vector = embedding_service.embed_query(query)
            
            results = []
            
            # 1. Retrieve from user report (if session provided)
            if session_id:
                user_collection = f"user_scan_{user_id}_{session_id}"
                
                if qdrant_manager.collection_exists(user_collection):
                    logger.info(f"🔍 Searching user report: {user_collection}")
                    
                    user_results = qdrant_manager.search(
                        collection_name=user_collection,
                        query_vector=query_vector,
                        limit=self.user_report_limit
                    )
                    
                    # Add source tag
                    for result in user_results:
                        result["metadata"]["source"] = "user_report"
                    
                    results.extend(user_results)
                    logger.info(f"✅ Found {len(user_results)} chunks from user report")
                else:
                    logger.warning(f"⚠️ User collection not found: {user_collection}")
            
            # 2. Retrieve from global KB
            if qdrant_manager.collection_exists(self.global_collection):
                logger.info(f"🔍 Searching global KB: {self.global_collection}")
                
                kb_results = qdrant_manager.search(
                    collection_name=self.global_collection,
                    query_vector=query_vector,
                    limit=self.global_kb_limit
                )
                
                # Add source tag
                for result in kb_results:
                    result["metadata"]["source"] = "global_kb"
                
                results.extend(kb_results)
                logger.info(f"✅ Found {len(kb_results)} chunks from global KB")
            else:
                logger.warning(f"⚠️ Global KB collection not found: {self.global_collection}")
            
            # 3. Retrieve from user long-term memory (cross-session)
            try:
                memory_results = user_memory_service.retrieve_user_memory(
                    query=query,
                    user_id=user_id
                )
                
                results.extend(memory_results)
                logger.info(f"✅ Found {len(memory_results)} chunks from user memory")
            except Exception as mem_err:
                logger.error(f"❌ User memory retrieval failed: {mem_err}")
            
            # Calculate retrieval time
            retrieval_time_ms = int((time.time() - start_time) * 1000)
            
            logger.info(f"✅ Hybrid retrieval complete: {len(results)} total chunks ({retrieval_time_ms}ms)")
            
            return results, retrieval_time_ms
            
        except Exception as e:
            logger.error(f"❌ Hybrid retrieval failed: {e}")
            raise
    
    def retrieve_global_only(
        self,
        query: str,
        user_id: Optional[str] = None
    ) -> tuple[List[Dict[str, Any]], int]:
        """
        Retrieve from global KB only
        
        Args:
            query: User query
            
        Returns:
            Tuple of (retrieved chunks, retrieval time in ms)
        """
        start_time = time.time()
        
        try:
            # Generate query embedding
            query_vector = embedding_service.embed_query(query)
            
            # Search global KB
            if not qdrant_manager.collection_exists(self.global_collection):
                logger.warning(f"⚠️ Global KB collection not found: {self.global_collection}")
                return [], 0
            
            logger.info(f"🔍 Searching global KB: {self.global_collection}")
            
            results = qdrant_manager.search(
                collection_name=self.global_collection,
                query_vector=query_vector,
                limit=self.global_kb_limit + self.user_report_limit  # More results for global-only
            )
            
            # Add source tag
            for result in results:
                result["metadata"]["source"] = "global_kb"
            
            # Also retrieve user long-term memory if user_id is provided
            if user_id:
                try:
                    memory_results = user_memory_service.retrieve_user_memory(
                        query=query,
                        user_id=user_id
                    )
                    results.extend(memory_results)
                    logger.info(f"✅ Found {len(memory_results)} chunks from user memory (global-only path)")
                except Exception as mem_err:
                    logger.error(f"❌ User memory retrieval failed (global-only path): {mem_err}")
            
            # Calculate retrieval time
            retrieval_time_ms = int((time.time() - start_time) * 1000)
            
            logger.info(f"✅ Global KB retrieval complete: {len(results)} chunks ({retrieval_time_ms}ms)")
            
            return results, retrieval_time_ms
            
        except Exception as e:
            logger.error(f"❌ Global KB retrieval failed: {e}")
            raise


# Global retriever instance
retriever_service = RetrieverService()
