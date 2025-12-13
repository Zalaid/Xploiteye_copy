"""
Django management command to ingest documents into Qdrant with deduplication
"""
from django.core.management.base import BaseCommand
from django.conf import settings
import os
import logging
from pathlib import Path

from rag.services.pdf_extractor import PDFExtractor
from rag.services.semantic_chunker import SemanticChunker
from rag.services.metadata_generator import MetadataGenerator
from rag.services.qdrant_service import QdrantService
from rag.utils.document_config import get_doc_config

# Setup logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)


class Command(BaseCommand):
    help = 'Ingest PDF documents into Qdrant vector database with smart deduplication'

    def add_arguments(self, parser):
        parser.add_argument(
            '--recreate',
            action='store_true',
            help='Recreate collection (delete existing and create new)'
        )
        parser.add_argument(
            '--docs-path',
            type=str,
            default='rag/docs',
            help='Path to directory containing PDF files'
        )
        parser.add_argument(
            '--force',
            action='store_true',
            help='Force re-ingestion of all documents (ignore cache)'
        )

    def handle(self, *args, **options):
        logger.info("=" * 60)
        logger.info("🚀 Starting Document Ingestion Pipeline")
        logger.info("=" * 60)
        
        try:
            # Initialize services
            pdf_extractor = PDFExtractor()
            chunker = SemanticChunker(
                target_size=900,
                max_size=1400,
                min_size=300,
                overlap=150
            )
            metadata_gen = MetadataGenerator()
            qdrant = QdrantService()
            
            # Create or verify collection
            qdrant.create_collection(recreate=options['recreate'])
            qdrant.create_payload_indexes()
            # Get existing document hashes (unless recreating)
            existing_docs = set()
            if not options['recreate'] and not options['force']:
                existing_docs = qdrant.get_existing_document_hashes()
            
            # Get documents path
            docs_path = options['docs_path']
            if not os.path.isabs(docs_path):
                docs_path = os.path.join(settings.BASE_DIR, docs_path)
            
            logger.info(f"📂 Looking for PDFs in: {docs_path}")
            
            # Extract text from all PDFs
            extracted_docs = pdf_extractor.extract_all_pdfs(docs_path)
            
            if not extracted_docs:
                logger.error("❌ No documents extracted. Exiting.")
                return
            
            # Process each document
            total_chunks = 0
            skipped_docs = 0
            processed_docs = 0
            
            for doc_info in extracted_docs:
                logger.info(f"\n📄 Processing: {doc_info['filename']}")
                
                # Generate document hash
                doc_hash = qdrant.generate_document_hash(
                    filename=doc_info['filename'],
                    text=doc_info['text']
                )
                
                # Check if already ingested
                if doc_hash in existing_docs:
                    logger.info(f"  ⏭️  SKIPPED - Already ingested (hash: {doc_hash[:12]}...)")
                    skipped_docs += 1
                    continue
                
                # Get document configuration
                doc_config = get_doc_config(doc_info['filename'])
                logger.info(f"  📋 Doc type: {doc_config['doc_type']}")
                logger.info(f"  📦 Modules: {', '.join(doc_config['modules'])}")
                
                # Chunk document
                chunks = chunker.chunk_document(
                    text=doc_info['text'],
                    doc_config=doc_config,
                    filename=doc_info['filename']
                )
                
                # Generate metadata for each chunk
                chunks_with_metadata = []
                for chunk in chunks:
                    metadata = metadata_gen.generate_metadata(
                        chunk=chunk,
                        doc_info=doc_info,
                        doc_config=doc_config
                    )
                    
                    chunks_with_metadata.append({
                        'text': chunk['text'],
                        'metadata': metadata
                    })
                
                logger.info(f"  ✂️  Created {len(chunks)} chunks")
                
                # If document was previously ingested (modified version), delete old chunks
                if doc_hash in existing_docs:
                    qdrant.delete_document_chunks(doc_hash)
                
                # Upload to Qdrant
                qdrant.upsert_chunks(chunks_with_metadata, doc_hash)
                
                total_chunks += len(chunks)
                processed_docs += 1
            
            # Show summary
            logger.info("\n" + "=" * 60)
            logger.info("✅ INGESTION COMPLETED SUCCESSFULLY")
            logger.info("=" * 60)
            logger.info(f"Documents found: {len(extracted_docs)}")
            logger.info(f"Documents processed: {processed_docs}")
            logger.info(f"Documents skipped (already ingested): {skipped_docs}")
            logger.info(f"New chunks created: {total_chunks}")
            logger.info(f"Collection: {qdrant.collection_name}")
            
            # Get collection info
            col_info = qdrant.get_collection_info()
            if col_info:
                logger.info(f"Total vectors in collection: {col_info['vectors_count']}")
            
            logger.info("=" * 60)
            
        except Exception as e:
            logger.error(f"\n❌ Ingestion failed: {str(e)}")
            import traceback
            traceback.print_exc()
            raise