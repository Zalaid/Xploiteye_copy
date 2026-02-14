"""
Xploit Eye - Upload Routes
"""
from fastapi import APIRouter, UploadFile, File, Depends, HTTPException, status
from datetime import datetime, timedelta
import os
import uuid
import aiofiles
from loguru import logger

from app.auth.jwt_handler import get_current_user
from app.rag.models.session import SessionCreate, SessionResponse
from app.rag.services.document_parser import document_parser
from app.rag.services.chunker import semantic_chunker
from app.rag.services.embedder import embedding_service
from app.rag.services.qdrant_manager import qdrant_manager
from app.database.mongodb import get_database
from config.settings import settings

router = APIRouter()


@router.post("/scan-report", response_model=SessionResponse)
async def upload_scan_report(
    file: UploadFile = File(...),
    current_user: dict = Depends(get_current_user)
):
    """
    Upload and process a scan report PDF
    
    Args:
        file: PDF file upload
        current_user: Authenticated user
        
    Returns:
        Session information with collection details
    """
    user_id = str(current_user.id)
    
    try:
        # Validate file type
        if not file.filename.endswith('.pdf'):
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Only PDF files are allowed"
            )
        
        # Validate file size
        file.file.seek(0, 2)  # Seek to end
        file_size = file.file.tell()
        file.file.seek(0)  # Reset to beginning
        
        if file_size > settings.max_upload_size_bytes:
            raise HTTPException(
                status_code=status.HTTP_413_REQUEST_ENTITY_TOO_LARGE,
                detail=f"File size exceeds maximum allowed size of {settings.max_upload_size_mb}MB"
            )
        
        logger.info(f"📤 Processing upload: {file.filename} ({file_size / 1024 / 1024:.2f}MB)")
        
        # Generate session ID
        session_id = f"sess_{uuid.uuid4().hex[:12]}"
        
        # Save file temporarily
        temp_dir = "temp_uploads"
        os.makedirs(temp_dir, exist_ok=True)
        temp_file_path = os.path.join(temp_dir, f"{session_id}_{file.filename}")
        
        async with aiofiles.open(temp_file_path, 'wb') as f:
            content = await file.read()
            await f.write(content)
        
        logger.info(f"💾 Saved temporary file: {temp_file_path}")
        
        # Parse PDF
        logger.info("📄 Parsing PDF with Docling...")
        parsed_doc = document_parser.parse_pdf(temp_file_path)
        
        # Chunk sections
        logger.info("✂️  Chunking document...")
        chunks = semantic_chunker.chunk_sections(
            sections=parsed_doc["sections"],
            source="user_report",
            session_id=session_id,
            report_name=file.filename
        )
        
        # Generate embeddings
        logger.info("🔢 Generating embeddings...")
        texts = [chunk["text"] for chunk in chunks]
        embeddings = embedding_service.embed_batch(texts)
        
        # Create Qdrant collection
        collection_name = f"user_scan_{user_id}_{session_id}"
        logger.info(f"📦 Creating Qdrant collection: {collection_name}")
        qdrant_manager.create_collection(collection_name)
        
        # Insert into Qdrant
        logger.info("💾 Storing vectors in Qdrant...")
        points_count = qdrant_manager.upsert_points(
            collection_name=collection_name,
            chunks=chunks,
            embeddings=embeddings
        )
        
        # Create session in MongoDB
        database = await get_database()
        session_doc = {
            "user_id": user_id,
            "session_id": session_id,
            "scan_report_name": file.filename,
            "qdrant_collection": collection_name,
            "created_at": datetime.utcnow(),
            "last_activity": datetime.utcnow(),
            "expires_at": datetime.utcnow() + timedelta(days=settings.session_expire_days),
            "is_active": True
        }
        
        result = await database.sessions.insert_one(session_doc)
        
        # Clean up temporary file
        os.remove(temp_file_path)
        
        logger.info(f"✅ Upload complete: {points_count} chunks stored")
        
        return SessionResponse(
            id=str(result.inserted_id),
            user_id=user_id,
            session_id=session_id,
            scan_report_name=file.filename,
            qdrant_collection=collection_name,
            created_at=session_doc["created_at"],
            last_activity=session_doc["last_activity"],
            expires_at=session_doc["expires_at"],
            is_active=True,
            chunks_count=points_count
        )
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"❌ Upload failed: {e}")
        
        # Clean up on error
        if 'temp_file_path' in locals() and os.path.exists(temp_file_path):
            os.remove(temp_file_path)
        
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to process upload: {str(e)}"
        )
