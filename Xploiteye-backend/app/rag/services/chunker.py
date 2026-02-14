"""
Xploit Eye - Semantic Chunking Service
"""
from typing import List, Dict, Any
from loguru import logger


class SemanticChunker:
    """Chunk documents semantically with metadata preservation"""
    
    def __init__(self, chunk_size: int = 512, chunk_overlap: int = 100):
        """
        Initialize semantic chunker
        
        Args:
            chunk_size: Target chunk size in tokens (approximate)
            chunk_overlap: Overlap between chunks in tokens
        """
        self.chunk_size = chunk_size
        self.chunk_overlap = chunk_overlap
    
    def chunk_sections(
        self,
        sections: List[Dict[str, Any]],
        source: str = "user_report",
        session_id: str = None,
        report_name: str = None
    ) -> List[Dict[str, Any]]:
        """
        Chunk document sections with metadata
        
        Args:
            sections: List of document sections from parser
            source: Source type ("user_report" or "global_kb")
            session_id: Session ID for user reports
            report_name: Report file name
            
        Returns:
            List of chunks with metadata
        """
        chunks = []
        
        for section in sections:
            section_chunks = self._chunk_section(section, source, session_id, report_name)
            chunks.extend(section_chunks)
        
        logger.info(f"✅ Created {len(chunks)} chunks from {len(sections)} sections")
        
        return chunks
    
    def _chunk_section(
        self,
        section: Dict[str, Any],
        source: str,
        session_id: str,
        report_name: str
    ) -> List[Dict[str, Any]]:
        """
        Chunk a single section with sliding window
        
        Args:
            section: Section data
            source: Source type
            session_id: Session ID
            report_name: Report name
            
        Returns:
            List of chunks from this section
        """
        content = section["content"]
        
        # Estimate tokens (rough: 1 token ≈ 4 characters)
        estimated_tokens = len(content) // 4
        
        chunks = []
        
        # If section is small enough, keep as single chunk
        if estimated_tokens <= self.chunk_size:
            chunks.append(self._create_chunk(
                text=content,
                section=section,
                source=source,
                session_id=session_id,
                report_name=report_name,
                chunk_index=0
            ))
        else:
            # Split into overlapping chunks
            # Convert token sizes to character counts
            char_chunk_size = self.chunk_size * 4
            char_overlap = self.chunk_overlap * 4
            
            start = 0
            chunk_index = 0
            
            while start < len(content):
                end = start + char_chunk_size
                chunk_text = content[start:end]
                
                # Try to break at sentence boundary
                if end < len(content):
                    # Look for sentence ending
                    last_period = chunk_text.rfind('.')
                    last_newline = chunk_text.rfind('\n')
                    break_point = max(last_period, last_newline)
                    
                    if break_point > char_chunk_size * 0.7:  # At least 70% of chunk
                        chunk_text = chunk_text[:break_point + 1]
                        end = start + break_point + 1
                
                chunks.append(self._create_chunk(
                    text=chunk_text.strip(),
                    section=section,
                    source=source,
                    session_id=session_id,
                    report_name=report_name,
                    chunk_index=chunk_index
                ))
                
                # Move to next chunk with overlap
                start = end - char_overlap
                chunk_index += 1
        
        return chunks
    
    def _create_chunk(
        self,
        text: str,
        section: Dict[str, Any],
        source: str,
        session_id: str,
        report_name: str,
        chunk_index: int
    ) -> Dict[str, Any]:
        """
        Create a chunk with full metadata
        
        Args:
            text: Chunk text
            section: Parent section data
            source: Source type
            session_id: Session ID
            report_name: Report name
            chunk_index: Index of chunk within section
            
        Returns:
            Chunk dictionary with metadata
        """
        return {
            "text": text,
            "metadata": {
                "source": source,
                "type": section.get("type", "general"),
                "severity": section.get("severity"),
                "page": section.get("page", 1),
                "section_title": section.get("title", "Unknown"),
                "session_id": session_id,
                "report_name": report_name,
                "chunk_index": chunk_index,
                "char_count": len(text),
                "estimated_tokens": len(text) // 4
            }
        }


# Global chunker instance
from config.settings import settings
semantic_chunker = SemanticChunker(
    chunk_size=settings.chunk_size,
    chunk_overlap=settings.chunk_overlap
)
