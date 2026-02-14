import os
import sys
from pathlib import Path
from tqdm import tqdm
from loguru import logger

# Add project root to path
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from config.settings import settings
from app.rag.services.document_parser import document_parser
from app.rag.services.chunker import semantic_chunker
from app.rag.services.embedder import embedding_service
from app.rag.services.qdrant_manager import qdrant_manager

def ingest_directory(directory_path: Path, source_type: str = "global_kb"):
    """
    Ingest all PDF files from a directory into global KB
    """
    if not directory_path.exists():
        logger.warning(f"⚠️ Directory not found: {directory_path}")
        return 0
    
    pdf_files = list(directory_path.glob("*.pdf"))
    
    if not pdf_files:
        return 0
    
    logger.info(f"📚 Found {len(pdf_files)} PDF files in {directory_path.name}")
    
    total_chunks = 0
    
    for pdf_file in tqdm(pdf_files, desc=f"Processing {directory_path.name}", unit="file"):
        try:
            # Parse PDF
            parsed_doc = document_parser.parse_pdf(str(pdf_file))
            
            # Chunk sections
            chunks = semantic_chunker.chunk_sections(
                sections=parsed_doc["sections"],
                source=source_type,
                session_id=None,
                report_name=pdf_file.name
            )
            
            if not chunks:
                continue

            # Generate embeddings
            texts = [chunk["text"] for chunk in chunks]
            embeddings = embedding_service.embed_batch(texts)
            
            # Insert into Qdrant
            qdrant_manager.upsert_points(
                collection_name=settings.qdrant_global_collection,
                chunks=chunks,
                embeddings=embeddings
            )
            
            total_chunks += len(chunks)
            
        except Exception as e:
            logger.error(f"❌ Failed to process {pdf_file.name}: {e}")
            continue
    
    return total_chunks

def ingest_knowledge_base():
    """Ingest all PDFs from knowledge base into Qdrant"""
    
    # Configuration
    kb_root = Path("knowledge_base")
    collection_name = settings.qdrant_global_collection
    
    logger.info(f"🚀 Starting Knowledge Base Ingestion")
    logger.info(f"📂 Root Directory: {kb_root.absolute()}")
    
    # Create knowledge base directory if not exists
    if not kb_root.exists():
        logger.warning(f"Knowledge base directory not found: {kb_root}")
        kb_root.mkdir(exist_ok=True)
        return

    # Ensure collection exists
    if not qdrant_manager.collection_exists(collection_name):
        logger.info(f"Creating collection: {collection_name}")
        qdrant_manager.create_collection(
            collection_name=collection_name,
            vector_size=settings.embedding_dimension
        )
    
    total_ingested = 0

    # 1. Process root directory
    logger.info(f"\nProcessing root directory...")
    total_ingested += ingest_directory(kb_root)
    
    # 2. Process subdirectories recursively
    # We can explicitly look for known categories or just all subdirs
    # The source script had specific categories, let's look for all subdirs
    for subdirectory in kb_root.iterdir():
        if subdirectory.is_dir():
            logger.info(f"\nProcessing subdirectory: {subdirectory.name}")
            total_ingested += ingest_directory(subdirectory)

    logger.info("="*50)
    logger.info(f"🎉 Ingestion Complete!")
    logger.info(f"Total Chunks: {total_ingested}")
    logger.info(f"Collection: {collection_name}")
    logger.info("="*50)

if __name__ == "__main__":
    ingest_knowledge_base()
