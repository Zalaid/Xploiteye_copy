"""
Xploit Eye - Embedding Service using BAAI/bge-large-en-v1.5
"""
from typing import List, Union
from sentence_transformers import SentenceTransformer
from loguru import logger
import torch

from config.settings import settings


class EmbeddingService:
    """Generate embeddings using BAAI/bge-large-en-v1.5"""
    
    def __init__(self):
        """Initialize embedding model"""
        logger.info(f"🔄 Loading embedding model: {settings.embedding_model}")
        
        # Determine device
        self.device = "cuda" if torch.cuda.is_available() else "cpu"
        logger.info(f"🖥️  Using device: {self.device}")
        
        # Load model
        self.model = SentenceTransformer(
            settings.embedding_model,
            device=self.device
        )
        
        # Verify dimension
        test_embedding = self.model.encode("test", convert_to_numpy=True)
        actual_dim = len(test_embedding)
        
        if actual_dim != settings.embedding_dimension:
            logger.warning(
                f"⚠️ Embedding dimension mismatch: "
                f"expected {settings.embedding_dimension}, got {actual_dim}"
            )
        
        logger.info(f"✅ Embedding model loaded (dimension: {actual_dim})")
    
    def embed_text(self, text: str) -> List[float]:
        """
        Generate embedding for a single text
        
        Args:
            text: Input text
            
        Returns:
            Embedding vector
        """
        try:
            # Add instruction for better retrieval (BGE model specific)
            text_with_instruction = f"Represent this cybersecurity document for retrieval: {text}"
            
            embedding = self.model.encode(
                text_with_instruction,
                convert_to_numpy=True,
                normalize_embeddings=True  # Normalize for cosine similarity
            )
            
            return embedding.tolist()
            
        except Exception as e:
            logger.error(f"❌ Embedding generation failed: {e}")
            raise
    
    def embed_batch(self, texts: List[str], batch_size: int = 32) -> List[List[float]]:
        """
        Generate embeddings for multiple texts (batched for efficiency)
        
        Args:
            texts: List of input texts
            batch_size: Batch size for processing
            
        Returns:
            List of embedding vectors
        """
        try:
            logger.info(f"🔄 Generating embeddings for {len(texts)} texts")
            
            # Add instruction for better retrieval
            texts_with_instruction = [
                f"Represent this cybersecurity document for retrieval: {text}"
                for text in texts
            ]
            
            embeddings = self.model.encode(
                texts_with_instruction,
                batch_size=batch_size,
                convert_to_numpy=True,
                normalize_embeddings=True,
                show_progress_bar=len(texts) > 100  # Show progress for large batches
            )
            
            logger.info(f"✅ Generated {len(embeddings)} embeddings")
            
            return embeddings.tolist()
            
        except Exception as e:
            logger.error(f"❌ Batch embedding generation failed: {e}")
            raise
    
    def embed_query(self, query: str) -> List[float]:
        """
        Generate embedding for a search query
        
        Args:
            query: Search query
            
        Returns:
            Query embedding vector
        """
        try:
            # Add query instruction (BGE model specific)
            query_with_instruction = f"Represent this cybersecurity question for retrieving supporting documents: {query}"
            
            embedding = self.model.encode(
                query_with_instruction,
                convert_to_numpy=True,
                normalize_embeddings=True
            )
            
            return embedding.tolist()
            
        except Exception as e:
            logger.error(f"❌ Query embedding generation failed: {e}")
            raise


# Global embedding service instance
embedding_service = EmbeddingService()
