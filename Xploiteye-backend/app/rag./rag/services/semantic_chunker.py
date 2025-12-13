"""
Semantic chunking with adaptive boundary detection
"""
import re
import tiktoken
from typing import List, Dict, Tuple
import logging

logger = logging.getLogger(__name__)


class SemanticChunker:
    """
    Smart chunking that respects document structure
    """
    
    def __init__(
        self,
        target_size: int = 900,
        max_size: int = 1400,
        min_size: int = 300,
        overlap: int = 150,
        model: str = "text-embedding-3-small"
    ):
        self.target_size = target_size
        self.max_size = max_size
        self.min_size = min_size
        self.overlap = overlap
        
        # Initialize tokenizer
        try:
            self.encoding = tiktoken.encoding_for_model(model)
        except:
            self.encoding = tiktoken.get_encoding("cl100k_base")
    
    def count_tokens(self, text: str) -> int:
        """Count tokens in text"""
        return len(self.encoding.encode(text))
    
    def chunk_document(
        self,
        text: str,
        doc_config: Dict,
        filename: str
    ) -> List[Dict]:
        """
        Chunk document using semantic boundaries
        
        Args:
            text: Full document text
            doc_config: Document configuration from document_config.py
            filename: Source filename
            
        Returns:
            List of chunk dictionaries with text and metadata
        """
        logger.info(f"🔪 Chunking {filename}...")
        
        # First, split by priority headers
        primary_sections = self._split_by_headers(text, doc_config['priority_headers'])
        
        chunks = []
        chunk_index = 0
        
        for section in primary_sections:
            section_text = section['text']
            section_header = section['header']
            
            # Check if section needs further splitting
            token_count = self.count_tokens(section_text)
            
            if token_count <= self.max_size:
                # Section fits in one chunk
                chunks.append({
                    'text': section_text,
                    'chunk_index': chunk_index,
                    'section_header': section_header,
                    'token_count': token_count
                })
                chunk_index += 1
            else:
                # Section too large, split further
                sub_chunks = self._split_large_section(
                    section_text,
                    section_header,
                    doc_config,
                    chunk_index
                )
                chunks.extend(sub_chunks)
                chunk_index += len(sub_chunks)
        
        # Add overlap between chunks
        chunks = self._add_overlap(chunks)
        
        logger.info(f"✓ Created {len(chunks)} chunks from {filename}")
        return chunks
    
    def _split_by_headers(self, text: str, header_patterns: List[str]) -> List[Dict]:
        """Split text by header patterns"""
        sections = []
        
        # Combine all header patterns
        combined_pattern = '|'.join(f'({pattern})' for pattern in header_patterns)
        
        # Find all headers
        matches = list(re.finditer(combined_pattern, text, re.MULTILINE))
        
        if not matches:
            # No headers found, return entire text
            return [{'text': text, 'header': 'Content'}]
        
        # Split by headers
        for i, match in enumerate(matches):
            header = match.group().strip()
            start = match.start()
            
            # Find end of this section (start of next header or end of text)
            if i < len(matches) - 1:
                end = matches[i + 1].start()
            else:
                end = len(text)
            
            section_text = text[start:end].strip()
            
            sections.append({
                'text': section_text,
                'header': header
            })
        
        # Add any text before first header
        if matches[0].start() > 0:
            intro_text = text[:matches[0].start()].strip()
            if intro_text:
                sections.insert(0, {
                    'text': intro_text,
                    'header': 'Introduction'
                })
        
        return sections
    
    def _split_large_section(
        self,
        text: str,
        section_header: str,
        doc_config: Dict,
        start_index: int
    ) -> List[Dict]:
        """Split large section into smaller chunks"""
        chunks = []
        
        # Try splitting by paragraphs
        paragraphs = text.split('\n\n')
        
        current_chunk = ""
        current_tokens = 0
        chunk_index = start_index
        
        for para in paragraphs:
            para_tokens = self.count_tokens(para)
            
            # If single paragraph exceeds max_size, split it further
            if para_tokens > self.max_size:
                # Save current chunk if exists
                if current_chunk:
                    chunks.append({
                        'text': current_chunk.strip(),
                        'chunk_index': chunk_index,
                        'section_header': section_header,
                        'token_count': current_tokens
                    })
                    chunk_index += 1
                    current_chunk = ""
                    current_tokens = 0
                
                # Split large paragraph by sentences
                sentences = re.split(r'(?<=[.!?])\s+', para)
                for sent in sentences:
                    sent_tokens = self.count_tokens(sent)
                    
                    if current_tokens + sent_tokens > self.target_size:
                        if current_chunk:
                            chunks.append({
                                'text': current_chunk.strip(),
                                'chunk_index': chunk_index,
                                'section_header': section_header,
                                'token_count': current_tokens
                            })
                            chunk_index += 1
                        current_chunk = sent + " "
                        current_tokens = sent_tokens
                    else:
                        current_chunk += sent + " "
                        current_tokens += sent_tokens
            else:
                # Normal paragraph processing
                if current_tokens + para_tokens > self.target_size:
                    # Save current chunk
                    if current_chunk:
                        chunks.append({
                            'text': current_chunk.strip(),
                            'chunk_index': chunk_index,
                            'section_header': section_header,
                            'token_count': current_tokens
                        })
                        chunk_index += 1
                    current_chunk = para + "\n\n"
                    current_tokens = para_tokens
                else:
                    current_chunk += para + "\n\n"
                    current_tokens += para_tokens
        
        # Add final chunk
        if current_chunk.strip():
            chunks.append({
                'text': current_chunk.strip(),
                'chunk_index': chunk_index,
                'section_header': section_header,
                'token_count': current_tokens
            })
        
        return chunks
    
    def _add_overlap(self, chunks: List[Dict]) -> List[Dict]:
        """Add overlap between consecutive chunks"""
        if len(chunks) <= 1:
            return chunks
        
        overlapped_chunks = []
        
        for i, chunk in enumerate(chunks):
            chunk_text = chunk['text']
            
            # Add overlap from previous chunk (if exists)
            if i > 0:
                prev_text = chunks[i - 1]['text']
                prev_tokens = self.encoding.encode(prev_text)
                
                # Get last N tokens from previous chunk
                if len(prev_tokens) > self.overlap:
                    overlap_tokens = prev_tokens[-self.overlap:]
                    overlap_text = self.encoding.decode(overlap_tokens)
                    chunk_text = overlap_text + "\n\n" + chunk_text
            
            overlapped_chunks.append({
                **chunk,
                'text': chunk_text,
                'token_count': self.count_tokens(chunk_text)
            })
        
        return overlapped_chunks