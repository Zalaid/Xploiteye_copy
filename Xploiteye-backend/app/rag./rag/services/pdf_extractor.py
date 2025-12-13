"""
Extract text from PDF files with structure preservation
"""
import fitz  # PyMuPDF
import re
from pathlib import Path
from typing import Dict, List
import logging

logger = logging.getLogger(__name__)


class PDFExtractor:
    """Extract text from PDFs while preserving structure"""
    
    def __init__(self):
        self.current_file = None
    
    def extract_text_from_pdf(self, pdf_path: str) -> Dict[str, any]:
        """
        Extract text from PDF with metadata
        
        Returns:
            {
                'filename': str,
                'text': str,
                'total_pages': int,
                'file_size_kb': float
            }
        """
        try:
            self.current_file = Path(pdf_path).name
            logger.info(f"📄 Extracting text from: {self.current_file}")
            
            # Open PDF
            doc = fitz.open(pdf_path)
            
            # Extract text from all pages
            full_text = ""
            for page_num in range(len(doc)):
                page = doc[page_num]
                text = page.get_text()
                full_text += text + "\n\n"
            
            total_pages = len(doc)
            doc.close()
            
            # Get file size
            file_size_kb = Path(pdf_path).stat().st_size / 1024
            
            # Clean text
            full_text = self._clean_text(full_text)
            
            result = {
                'filename': self.current_file,
                'text': full_text,
                'total_pages': total_pages,
                'file_size_kb': round(file_size_kb, 2)
            }
            
            logger.info(f"✓ Extracted {total_pages} pages, {len(full_text)} characters")
            return result
            
        except Exception as e:
            logger.error(f"✗ Error extracting {pdf_path}: {str(e)}")
            raise
    
    def _clean_text(self, text: str) -> str:
        """Clean extracted text"""
        # Remove excessive whitespace
        text = re.sub(r'\n{3,}', '\n\n', text)
        
        # Remove page numbers at the end of lines
        text = re.sub(r'\n\d+\s*\n', '\n', text)
        
        # Fix common OCR issues
        text = text.replace('\x00', '')  # Null bytes
        text = text.replace('\uf0b7', '•')  # Bullet points
        
        # Normalize whitespace
        text = re.sub(r'[ \t]+', ' ', text)
        
        return text.strip()
    
    def extract_all_pdfs(self, pdf_directory: str) -> List[Dict]:
        """Extract text from all PDFs in directory"""
        pdf_dir = Path(pdf_directory)
        
        if not pdf_dir.exists():
            raise FileNotFoundError(f"Directory not found: {pdf_directory}")
        
        # Find all PDF files
        pdf_files = list(pdf_dir.glob("*.pdf"))
        
        if not pdf_files:
            raise ValueError(f"No PDF files found in {pdf_directory}")
        
        logger.info(f"📚 Found {len(pdf_files)} PDF files")
        
        extracted_docs = []
        for pdf_file in pdf_files:
            try:
                result = self.extract_text_from_pdf(str(pdf_file))
                extracted_docs.append(result)
            except Exception as e:
                logger.error(f"Failed to extract {pdf_file.name}: {e}")
                continue
        
        logger.info(f"✓ Successfully extracted {len(extracted_docs)} documents")
        return extracted_docs