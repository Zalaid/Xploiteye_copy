"""
Xploit Eye - Qdrant Vector Database Manager
"""
from typing import List, Dict, Any, Optional
from qdrant_client import QdrantClient
from qdrant_client.models import (
    Distance,
    VectorParams,
    PointStruct,
    Filter,
    FieldCondition,
    MatchValue
)
from loguru import logger
import uuid

from config.settings import settings


class QdrantManager:
    """Manage Qdrant vector database collections"""
    
    def __init__(self):
        """Initialize Qdrant client"""
        logger.info("🔄 Connecting to Qdrant Cloud...")
        # Use longer timeout for writes (upsert of many points can exceed 30s)
        self.client = QdrantClient(
            url=settings.qdrant_url,
            api_key=settings.qdrant_api_key,
            timeout=settings.qdrant_timeout
        )
        
        logger.info("✅ Connected to Qdrant Cloud")
    
    def create_collection(self, collection_name: str, vector_size: int = None):
        """
        Create a new Qdrant collection
        
        Args:
            collection_name: Name of collection
            vector_size: Size of vectors (default from settings)
        """
        if vector_size is None:
            vector_size = settings.embedding_dimension
        
        try:
            # Check if collection exists
            collections = self.client.get_collections().collections
            if any(col.name == collection_name for col in collections):
                logger.info(f"ℹ️  Collection already exists: {collection_name}")
                return
            
            # Create collection
            self.client.create_collection(
                collection_name=collection_name,
                vectors_config=VectorParams(
                    size=vector_size,
                    distance=Distance.COSINE
                )
            )
            
            logger.info(f"✅ Created collection: {collection_name}")
            
        except Exception as e:
            logger.error(f"❌ Failed to create collection {collection_name}: {e}")
            raise
    
    def delete_collection(self, collection_name: str):
        """
        Delete a Qdrant collection
        
        Args:
            collection_name: Name of collection to delete
        """
        try:
            self.client.delete_collection(collection_name=collection_name)
            logger.info(f"🗑️  Deleted collection: {collection_name}")
            
        except Exception as e:
            logger.error(f"❌ Failed to delete collection {collection_name}: {e}")
            raise
    
    def upsert_points(
        self,
        collection_name: str,
        chunks: List[Dict[str, Any]],
        embeddings: List[List[float]]
    ) -> int:
        """
        Insert or update points in collection
        
        Args:
            collection_name: Target collection
            chunks: List of chunks with metadata
            embeddings: Corresponding embeddings
            
        Returns:
            Number of points inserted
        """
        try:
            if len(chunks) != len(embeddings):
                raise ValueError("Chunks and embeddings must have same length")
            
            # Create points
            points = []
            for chunk, embedding in zip(chunks, embeddings):
                point = PointStruct(
                    id=str(uuid.uuid4()),
                    vector=embedding,
                    payload={
                        "text": chunk["text"],
                        **chunk["metadata"]
                    }
                )
                points.append(point)
            
            # Upsert in batches (smaller batches + retry to avoid timeout on slow connections)
            batch_size = 50
            inserted = 0
            for i in range(0, len(points), batch_size):
                batch = points[i:i + batch_size]
                for attempt in range(3):
                    try:
                        self.client.upsert(
                            collection_name=collection_name,
                            points=batch
                        )
                        inserted += len(batch)
                        if inserted % 100 == 0 or inserted == len(points):
                            logger.info(f"📤 Upserted {inserted}/{len(points)} points...")
                        break
                    except Exception as batch_error:
                        if "timed out" in str(batch_error).lower() or "timeout" in str(batch_error).lower():
                            if attempt < 2:
                                logger.warning(f"⏳ Batch timeout, retry {attempt + 2}/3...")
                                continue
                        raise batch_error
            
            logger.info(f"✅ Inserted {len(points)} points into {collection_name}")
            
            return len(points)
            
        except Exception as e:
            logger.error(f"❌ Failed to upsert points: {e}")
            raise
    
    def search(
        self,
        collection_name: str,
        query_vector: List[float],
        limit: int = 10,
        filter_conditions: Optional[Dict[str, Any]] = None
    ) -> List[Dict[str, Any]]:
        """
        Search for similar vectors in collection
        
        Args:
            collection_name: Collection to search
            query_vector: Query embedding
            limit: Number of results
            filter_conditions: Optional metadata filters
            
        Returns:
            List of search results with scores
        """
        try:
            # Build filter if provided
            query_filter = None
            if filter_conditions:
                query_filter = Filter(
                    must=[
                        FieldCondition(
                            key=key,
                            match=MatchValue(value=value)
                        )
                        for key, value in filter_conditions.items()
                    ]
                )
            
            # Search (qdrant-client 1.7+ uses query_points, not search)
            response = self.client.query_points(
                collection_name=collection_name,
                query=query_vector,
                limit=limit,
                query_filter=query_filter
            )
            # Response has .points (list of ScoredPoint with id, score, payload)
            results = response.points
            
            # Format results
            formatted_results = []
            for result in results:
                payload = result.payload or {}
                formatted_results.append({
                    "id": result.id,
                    "score": result.score,
                    "text": payload.get("text", ""),
                    "metadata": {
                        k: v for k, v in payload.items()
                        if k != "text"
                    }
                })
            
            logger.info(f"🔍 Found {len(formatted_results)} results in {collection_name}")
            
            return formatted_results
            
        except Exception as e:
            logger.error(f"❌ Search failed in {collection_name}: {e}")
            raise
    
    def collection_exists(self, collection_name: str) -> bool:
        """
        Check if collection exists
        
        Args:
            collection_name: Collection name
            
        Returns:
            True if exists, False otherwise
        """
        try:
            collections = self.client.get_collections().collections
            return any(col.name == collection_name for col in collections)
        except Exception as e:
            logger.error(f"❌ Failed to check collection existence: {e}")
            return False
    
    def get_collection_info(self, collection_name: str) -> Dict[str, Any]:
        """
        Get collection information
        
        Args:
            collection_name: Collection name
            
        Returns:
            Collection info including point count
        """
        try:
            info = self.client.get_collection(collection_name=collection_name)
            # CollectionInfo API varies: points_count always present; vectors_count removed in newer client
            result = {
                "name": collection_name,
                "points_count": getattr(info, "points_count", 0),
                "status": getattr(info, "status", None),
            }
            if hasattr(info, "vectors_count"):
                result["vectors_count"] = info.vectors_count
            return result
        except Exception as e:
            logger.error(f"❌ Failed to get collection info: {e}")
            raise


# Global Qdrant manager instance
qdrant_manager = QdrantManager()
