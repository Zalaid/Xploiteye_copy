"""
Xploit Eye - Document Parser using Docling
"""
from typing import List, Dict, Any, Optional
from pathlib import Path
import re
from loguru import logger

try:
    from docling.document_converter import DocumentConverter
    from docling.datamodel.base_models import InputFormat
    from docling.datamodel.pipeline_options import PdfPipelineOptions
except ImportError:
    logger.warning("Docling not installed. Install with: pip install docling")
    raise

# PdfFormatOption wraps pipeline_options for DocumentConverter (docling 2.x API)
try:
    from docling.document_converter import PdfFormatOption
except ImportError:
    try:
        from docling.datamodel.format_options import PdfFormatOption
    except ImportError:
        PdfFormatOption = None


class DocumentParser:
    """Parse PDF documents using Docling for structured extraction"""
    
    def __init__(self):
        """Initialize document parser"""
        # Configure pipeline options for better extraction
        pipeline_options = PdfPipelineOptions()
        pipeline_options.do_ocr = True
        pipeline_options.do_table_structure = True
        
        # DocumentConverter expects PdfFormatOption(pipeline_options=...), not raw PdfPipelineOptions.
        # Passing raw PdfPipelineOptions causes: 'PdfPipelineOptions' object has no attribute 'backend'
        if PdfFormatOption is not None:
            pdf_format = PdfFormatOption(pipeline_options=pipeline_options)
            self.converter = DocumentConverter(
                format_options={InputFormat.PDF: pdf_format}
            )
        else:
            # Fallback: use default PDF handling (no custom options)
            self.converter = DocumentConverter()
    
    def parse_pdf(self, file_path: str) -> Dict[str, Any]:
        """
        Parse PDF document and extract structured content
        
        Args:
            file_path: Path to PDF file
            
        Returns:
            Structured document data with sections
        """
        try:
            logger.info(f"📄 Parsing PDF: {file_path}")
            
            # Convert document
            result = self.converter.convert(file_path)
            
            # Extract structured content
            sections = self._extract_sections(result)
            
            logger.info(f"✅ Parsed {len(sections)} sections from PDF")
            
            return {
                "file_path": file_path,
                "file_name": Path(file_path).name,
                "sections": sections,
                "total_sections": len(sections)
            }
            
        except Exception as e:
            logger.error(f"❌ Failed to parse PDF: {e}")
            raise
    
    def _extract_sections(self, doc_result) -> List[Dict[str, Any]]:
        """
        Extract sections from Docling result
        
        Args:
            doc_result: Docling conversion result
            
        Returns:
            List of structured sections
        """
        sections = []
        
        try:
            # Get document markdown
            markdown_text = doc_result.document.export_to_markdown()
            
            # Split by headings
            section_pattern = r'^#{1,3}\s+(.+?)$'
            lines = markdown_text.split('\n')
            
            current_section = {
                "title": "Introduction",
                "content": "",
                "page": 1,
                "severity": None,
                "type": "general"
            }
            
            for i, line in enumerate(lines):
                heading_match = re.match(section_pattern, line)
                
                if heading_match:
                    # Save previous section if it has content
                    if current_section["content"].strip():
                        sections.append(current_section.copy())
                    
                    # Start new section
                    title = heading_match.group(1).strip()
                    current_section = {
                        "title": title,
                        "content": "",
                        "page": self._estimate_page(i, len(lines)),
                        "severity": self._extract_severity(title),
                        "type": self._classify_section_type(title)
                    }
                else:
                    current_section["content"] += line + "\n"
            
            # Add last section
            if current_section["content"].strip():
                sections.append(current_section)
            
            # If no sections found, create one from entire content
            if not sections:
                sections.append({
                    "title": "Document Content",
                    "content": markdown_text,
                    "page": 1,
                    "severity": None,
                    "type": "general"
                })
            
        except Exception as e:
            logger.warning(f"⚠️ Section extraction failed, using fallback: {e}")
            # Fallback: treat entire document as one section
            sections.append({
                "title": "Document Content",
                "content": str(doc_result.document.export_to_markdown()),
                "page": 1,
                "severity": None,
                "type": "general"
            })
        
        return sections
    
    def _extract_severity(self, text: str) -> Optional[str]:
        """Extract severity level from text"""
        text_lower = text.lower()
        
        if any(word in text_lower for word in ["critical", "severe"]):
            return "Critical"
        elif any(word in text_lower for word in ["high", "important"]):
            return "High"
        elif any(word in text_lower for word in ["medium", "moderate"]):
            return "Medium"
        elif any(word in text_lower for word in ["low", "minor"]):
            return "Low"
        
        return None
    
    def _classify_section_type(self, title: str) -> str:
        """Classify section type based on title"""
        title_lower = title.lower()
        
        if any(word in title_lower for word in ["finding", "vulnerability", "issue", "weakness"]):
            return "finding"
        elif any(word in title_lower for word in ["impact", "risk", "consequence"]):
            return "impact"
        elif any(word in title_lower for word in ["recommendation", "remediation", "fix", "solution", "mitigation"]):
            return "recommendation"
        elif any(word in title_lower for word in ["summary", "executive", "overview"]):
            return "summary"
        
        return "general"
    
    def _estimate_page(self, line_index: int, total_lines: int) -> int:
        """Estimate page number based on line position"""
        # Rough estimation: ~50 lines per page
        return max(1, (line_index // 50) + 1)


# Global parser instance
document_parser = DocumentParser()
