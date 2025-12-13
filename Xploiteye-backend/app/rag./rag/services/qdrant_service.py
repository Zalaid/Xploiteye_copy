"""
Qdrant vector database operations with deduplication
"""
from qdrant_client import QdrantClient
from qdrant_client.models import Distance, VectorParams, PointStruct, Filter, FieldCondition, MatchValue
from openai import OpenAI
import os
import hashlib
import uuid
from typing import List, Dict, Set, Union
import logging
from dotenv import load_dotenv

load_dotenv()

logger = logging.getLogger(__name__)


class QdrantService:
    """Handle all Qdrant operations with deduplication"""
    
    def __init__(self):
        # Initialize Qdrant client
        self.qdrant_url = os.getenv('Qdrant_URL')
        self.qdrant_api_key = os.getenv('Qdrant_API_KEY')
        self.openai_api_key = os.getenv('OPENAI_API_KEY_1')
        
        if not self.qdrant_url or not self.qdrant_api_key:
            raise ValueError("Qdrant credentials not found in .env file")
        
        if not self.openai_api_key:
            raise ValueError("OpenAI API key not found in .env file")
        
        self.client = QdrantClient(
            url=self.qdrant_url,
            api_key=self.qdrant_api_key
        )
        
        # Initialize OpenAI client
        self.openai_client = OpenAI(api_key=self.openai_api_key)
        
        # Collection name
        self.collection_name = "sherlockdroid_docs"
        self.embedding_model = "text-embedding-3-small"
        self.embedding_dimension = 1536
    
    def create_collection(self, recreate: bool = False):
        """Create Qdrant collection"""
        try:
            collections = self.client.get_collections().collections
            collection_exists = any(c.name == self.collection_name for c in collections)
            
            if collection_exists:
                if recreate:
                    logger.info(f"🗑️  Deleting existing collection: {self.collection_name}")
                    self.client.delete_collection(self.collection_name)
                else:
                    logger.info(f"✓ Collection '{self.collection_name}' already exists")
                    return
            
            logger.info(f"🏗️  Creating collection: {self.collection_name}")
            self.client.create_collection(
                collection_name=self.collection_name,
                vectors_config=VectorParams(
                    size=self.embedding_dimension,
                    distance=Distance.COSINE
                )
            )
            logger.info(f"✓ Collection created successfully")
            
        except Exception as e:
            logger.error(f"✗ Error creating collection: {e}")
            raise
    
    def generate_chunk_id(self, text: str, filename: str, chunk_index: int) -> str:
        """
        Generate unique, deterministic UUID string for a chunk
        
        Uses UUID5 (deterministic) based on: filename + chunk_index + first 200 chars of text
        This ensures same chunk always gets same UUID
        """
        # Create a namespace UUID (can be any fixed UUID)
        namespace = uuid.UUID('6ba7b810-9dad-11d1-80b4-00c04fd430c8')
        content = f"{filename}_{chunk_index}_{text[:200]}"
        # Generate deterministic UUID5 and return as string
        return str(uuid.uuid5(namespace, content))
    
    def get_existing_document_hashes(self) -> Set[str]:
        """
        Get all unique document hashes already in Qdrant
        
        Returns set of document_hash values from all existing points
        """
        try:
            # Scroll through all points and collect document hashes
            existing_hashes = set()
            
            # Get collection info
            collection_info = self.client.get_collection(self.collection_name)
            total_points = collection_info.points_count
            
            if total_points == 0:
                logger.info("📭 Collection is empty - no existing documents")
                return existing_hashes
            
            logger.info(f"🔍 Checking {total_points} existing points for document hashes...")
            
            # Scroll through all points
            offset = None
            batch_size = 100
            
            while True:
                results = self.client.scroll(
                    collection_name=self.collection_name,
                    limit=batch_size,
                    offset=offset,
                    with_payload=True,
                    with_vectors=False
                )
                
                points, next_offset = results
                
                if not points:
                    break
                
                # Collect document hashes
                for point in points:
                    if 'document_hash' in point.payload:
                        existing_hashes.add(point.payload['document_hash'])
                
                if next_offset is None:
                    break
                    
                offset = next_offset
            
            unique_docs = len(existing_hashes)
            logger.info(f"✓ Found {unique_docs} unique documents already ingested")
            
            return existing_hashes
            
        except Exception as e:
            logger.error(f"Error getting existing documents: {e}")
            return set()
    
    def generate_document_hash(self, filename: str, text: str) -> str:
        """
        Generate unique hash for entire document
        
        Uses: filename + first 500 chars + last 500 chars + length
        This detects if document content has changed
        """
        content = f"{filename}_{len(text)}_{text[:500]}_{text[-500:]}"
        hash_object = hashlib.sha256(content.encode())
        return hash_object.hexdigest()
    
    def delete_document_chunks(self, document_hash: str):
        """Delete all chunks belonging to a specific document"""
        try:
            logger.info(f"🗑️  Deleting existing chunks for document: {document_hash[:12]}...")
            
            # Delete points with matching document_hash
            self.client.delete(
                collection_name=self.collection_name,
                points_selector=Filter(
                    must=[
                        FieldCondition(
                            key="document_hash",
                            match=MatchValue(value=document_hash)
                        )
                    ]
                )
            )
            
            logger.info(f"  ✓ Deleted old chunks")
            
        except Exception as e:
            logger.error(f"Error deleting document chunks: {e}")
            raise

    def create_payload_indexes(self):
        """
        Create payload indexes for metadata fields to enable filtering
        """
        try:
            from qdrant_client.models import PayloadSchemaType
            
            logger.info("🔧 Creating payload indexes for metadata filtering...")
            
            # Fields to index
            index_fields = [
                ("modules", PayloadSchemaType.KEYWORD),
                ("doc_type", PayloadSchemaType.KEYWORD),
                ("content_categories", PayloadSchemaType.KEYWORD),
                ("source_file", PayloadSchemaType.KEYWORD),
                ("topics", PayloadSchemaType.KEYWORD),
            ]
            
            for field_name, field_type in index_fields:
                try:
                    self.client.create_payload_index(
                        collection_name=self.collection_name,
                        field_name=field_name,
                        field_schema=field_type
                    )
                    logger.info(f"  ✓ Created index for: {field_name}")
                except Exception as e:
                    if "already exists" in str(e).lower():
                        logger.info(f"  ⏭️  Index already exists: {field_name}")
                    else:
                        logger.warning(f"  ⚠️  Failed to create index for {field_name}: {e}")
            
            logger.info("✓ Payload indexes created successfully")
            
        except Exception as e:
            logger.error(f"Error creating payload indexes: {e}")
            raise
    
    def generate_embedding(self, text: str) -> List[float]:
        """Generate embedding for text using OpenAI"""
        try:
            response = self.openai_client.embeddings.create(
                model=self.embedding_model,
                input=text
            )
            return response.data[0].embedding
        except Exception as e:
            logger.error(f"✗ Error generating embedding: {e}")
            raise
    
    def upsert_chunks(
        self, 
        chunks_with_metadata: List[Dict], 
        document_hash: str,
        batch_size: int = 100
    ):
        """
        Insert chunks into Qdrant with deduplication
        
        Args:
            chunks_with_metadata: List of dicts with 'text' and 'metadata'
            document_hash: Unique hash for the source document
            batch_size: Number of chunks to process at once
        """
        logger.info(f"📤 Upserting {len(chunks_with_metadata)} chunks to Qdrant...")
        
        points = []
        
        for i, chunk_data in enumerate(chunks_with_metadata):
            try:
                # Generate unique ID for this chunk
                chunk_id = self.generate_chunk_id(
                    text=chunk_data['text'],
                    filename=chunk_data['metadata']['source_file'],
                    chunk_index=chunk_data['metadata']['chunk_index']
                )
                
                # Generate embedding
                embedding = self.generate_embedding(chunk_data['text'])
                
                # Add document_hash to metadata
                chunk_data['metadata']['document_hash'] = document_hash
                
                # Create point with deterministic ID
                point = PointStruct(
                    id=chunk_id,  # ✅ Unique hash-based ID
                    vector=embedding,
                    payload={
                        "text": chunk_data['text'],
                        **chunk_data['metadata']
                    }
                )
                points.append(point)
                
                # Batch upload
                if len(points) >= batch_size:
                    self.client.upsert(
                        collection_name=self.collection_name,
                        points=points
                    )
                    logger.info(f"  ✓ Uploaded batch: {i - batch_size + 1} to {i + 1}")
                    points = []
                
            except Exception as e:
                logger.error(f"✗ Error processing chunk {i}: {e}")
                continue
        
        # Upload remaining points
        if points:
            self.client.upsert(
                collection_name=self.collection_name,
                points=points
            )
            logger.info(f"  ✓ Uploaded final batch: {len(points)} chunks")
        
        logger.info(f"✓ Successfully upserted {len(chunks_with_metadata)} chunks")
    
    def get_collection_info(self):
        """Get information about the collection"""
        try:
            collection_info = self.client.get_collection(self.collection_name)
            return {
                "vectors_count": collection_info.points_count,
                "status": collection_info.status
            }
        except Exception as e:
            logger.error(f"Error getting collection info: {e}")
            return None