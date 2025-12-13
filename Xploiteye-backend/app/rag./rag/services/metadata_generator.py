"""
Generate rich metadata for chunks
"""
import re
from typing import Dict, List
import logging

logger = logging.getLogger(__name__)


class MetadataGenerator:
    """Generate comprehensive metadata for document chunks"""
    
    def generate_metadata(
        self,
        chunk: Dict,
        doc_info: Dict,
        doc_config: Dict
    ) -> Dict:
        """
        Generate metadata for a chunk
        
        Args:
            chunk: Chunk dictionary with text and chunk_index
            doc_info: Document info (filename, total_pages, etc.)
            doc_config: Document configuration
            
        Returns:
            Complete metadata dictionary
        """
        metadata = {
            # Source information
            "source_file": doc_info['filename'],
            "chunk_index": chunk['chunk_index'],
            "total_pages": doc_info['total_pages'],
            "file_size_kb": doc_info['file_size_kb'],
            
            # Document classification
            "doc_type": doc_config['doc_type'],
            "modules": doc_config['modules'],
            "content_categories": doc_config['content_categories'],
            
            # Section information
            "section_header": chunk.get('section_header', 'Unknown'),
            
            # Chunk properties
            "token_count": chunk['token_count'],
            "char_count": len(chunk['text']),
            
            # Content analysis
            "topics": self._extract_topics(chunk['text']),
            "has_code": self._contains_code(chunk['text']),
            "has_table": self._contains_table(chunk['text']),
            
            # Special markers
            **self._extract_special_markers(chunk['text'], doc_config)
        }
        
        return metadata
    
    def _extract_topics(self, text: str) -> List[str]:
        """Extract key topics/keywords from text"""
        topics = set()
        
        # Common technical terms
        keywords = [
            'APK', 'Android', 'analysis', 'security', 'vulnerability',
            'static', 'dynamic', 'network', 'scanning', 'Frida',
            'ADB', 'malware', 'exploit', 'LLM', 'AI', 'encryption',
            'permission', 'manifest', 'bytecode', 'smali', 'DEX',
            'hook', 'instrumentation', 'C2', 'surveillance', 'PoC'
        ]
        
        text_lower = text.lower()
        for keyword in keywords:
            if keyword.lower() in text_lower:
                topics.add(keyword)
        
        return list(topics)
    
    def _contains_code(self, text: str) -> bool:
        """Check if chunk contains code"""
        code_patterns = [
            r'```',  # Markdown code blocks
            r'def\s+\w+\(',  # Python functions
            r'class\s+\w+',  # Class definitions
            r'import\s+\w+',  # Import statements
            r'function\s+\w+\(',  # JavaScript functions
            r'\{[\s\S]*?\}',  # JSON/code blocks
        ]
        
        for pattern in code_patterns:
            if re.search(pattern, text):
                return True
        return False
    
    def _contains_table(self, text: str) -> bool:
        """Check if chunk contains table"""
        table_patterns = [
            r'Table\s+\d+\.',
            r'\|.*\|.*\|',  # Markdown tables
            r'─{3,}',  # Table borders
        ]
        
        for pattern in table_patterns:
            if re.search(pattern, text):
                return True
        return False
    
    def _extract_special_markers(self, text: str, doc_config: Dict) -> Dict:
        """Extract document-specific markers"""
        markers = {}
        
        # For Network Scanning docs
        phase_match = re.search(r'Phase\s+(\d+)', text)
        if phase_match:
            markers['phase_number'] = int(phase_match.group(1))
        
        step_match = re.search(r'Step\s+(\d+)\.(\d+)', text)
        if step_match:
            markers['step_number'] = f"{step_match.group(1)}.{step_match.group(2)}"
        
        # For Frida docs
        hook_match = re.search(r'([A-Z])\.\s+(.*?)\s*—', text)
        if hook_match:
            markers['hook_id'] = hook_match.group(1)
            markers['hook_name'] = hook_match.group(2).strip()
        
        # For Proposal docs
        epic_match = re.search(r'Epic:\s+(.*?)(?:\n|$)', text)
        if epic_match:
            markers['epic_name'] = epic_match.group(1).strip()
        
        priority_match = re.search(r'Priority:\s+(\w+)', text)
        if priority_match:
            markers['priority'] = priority_match.group(1)
        
        return markers