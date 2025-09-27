import pandas as pd
from reportlab.lib.pagesizes import A4
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle, PageBreak, Image
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.units import inch
from reportlab.lib import colors
from reportlab.lib.enums import TA_CENTER, TA_LEFT
from reportlab.pdfgen import canvas
import re
from datetime import datetime
import os

class BlackCanvas:
    def __init__(self, filename):
        self.filename = filename

    def __call__(self, canvas, doc):
        # Fill entire page with black
        canvas.setFillColor(colors.black)
        canvas.rect(0, 0, A4[0], A4[1], fill=1)

        # Add page number in white at bottom right
        canvas.setFillColor(colors.white)
        canvas.setFont("Helvetica", 9)
        canvas.drawRightString(A4[0] - 30, 20, f"Page {canvas.getPageNumber()}")

def parse_markdown_to_pdf(markdown_content, output_filename):
    """Convert markdown content to PDF with black background"""

    # Create PDF document
    doc = SimpleDocTemplate(output_filename, pagesize=A4,
                          rightMargin=25, leftMargin=25,
                          topMargin=35, bottomMargin=35)

    # Custom styles
    styles = getSampleStyleSheet()

    # Title style - 44pt with proper spacing and box
    title_style = ParagraphStyle(
        'BlackTitle',
        parent=styles['Heading1'],
        fontName='Times-Bold',  # Century Schoolbook equivalent - Bold
        fontSize=44,  # 44pt as requested
        textColor=colors.HexColor('#32CD32'),  # Greenish parrot color
        spaceAfter=24,  # One line spacing
        spaceBefore=40,
        alignment=TA_CENTER,
        backColor=colors.black,
        borderColor=colors.HexColor('#32CD32'),  # Box outline in parrot green
        borderWidth=3,
        borderPadding=30,
        leftIndent=20,
        rightIndent=20
    )

    # Main heading styles - Executive Summary etc. with parrot color and +2 size
    heading_style = ParagraphStyle(
        'BlackHeading',
        parent=styles['Heading2'],
        fontName='Times-Bold',  # Century Schoolbook equivalent - Bold
        fontSize=24,  # 22+2 points as requested
        textColor=colors.HexColor('#32CD32'),  # Same parrot color as title
        spaceAfter=25,
        spaceBefore=35,
        backColor=colors.black,
        borderColor=colors.HexColor('#32CD32'),  # Match text color
        borderWidth=3,
        borderPadding=20,
        leftIndent=15,
        rightIndent=15,
        alignment=TA_CENTER
    )

    # Subheading styles - NO BOXES, parrot color, Century Schoolbook
    subheading_style = ParagraphStyle(
        'BlackSubHeading',
        parent=styles['Heading3'],
        fontName='Times-Bold',  # Century Schoolbook equivalent - Bold
        fontSize=19,  # Increased by 3 points
        textColor=colors.HexColor('#32CD32'),  # Same parrot color as title
        spaceAfter=12,
        spaceBefore=18,
        backColor=colors.black
    )

    # Normal text style - WHITE text, Century Schoolbook equivalent, +1 size
    normal_style = ParagraphStyle(
        'BlackNormal',
        parent=styles['Normal'],
        fontName='Times-Roman',  # Century Schoolbook equivalent
        fontSize=12,  # 11+1 as requested
        textColor=colors.white,
        spaceAfter=6,
        backColor=colors.black,
        leftIndent=0
    )

    # List style - inherits +1 size from normal_style
    list_style = ParagraphStyle(
        'BlackList',
        parent=normal_style,  # Now has fontSize=12
        leftIndent=15,
        bulletIndent=8
    )

    # Green markdown text style for post-table content, +1 size
    green_text_style = ParagraphStyle(
        'GreenMarkdown',
        parent=styles['Normal'],
        fontName='Times-Roman',  # Century Schoolbook equivalent
        fontSize=12,  # 11+1 as requested
        textColor=colors.lightgreen,
        spaceAfter=6,
        backColor=colors.black,
        leftIndent=0
    )

    # Style for CVE labels (Description:, Impact:, Recommendation:) - WHITE, +1 size
    desc_heading_style = ParagraphStyle(
        'DescHeading',
        parent=styles['Normal'],
        fontName='Times-Bold',  # Century Schoolbook equivalent - keep bold for labels
        fontSize=12,  # 11+1 as requested
        textColor=colors.white,  # WHITE labels
        spaceAfter=4,
        spaceBefore=6,
        backColor=colors.black,
        leftIndent=15
    )

    # Style for CVE headings (numbered) - Parrot color like title
    cve_heading_style = ParagraphStyle(
        'CVEHeading',
        parent=subheading_style,  # Use same as other subheadings
        fontName='Times-Bold',  # Century Schoolbook equivalent
        fontSize=19,  # Increased by 3 points
        textColor=colors.HexColor('#32CD32'),  # Same parrot color as title
        spaceAfter=12,
        spaceBefore=15,
        backColor=colors.black,
        leftIndent=0
    )

    # Style for CVE content text - WHITE, normal weight (not bold), +1 size
    cve_content_style = ParagraphStyle(
        'CVEContent',
        parent=normal_style,
        fontName='Times-Roman',  # Century Schoolbook equivalent - NOT bold
        fontSize=12,  # 11+1 as requested
        textColor=colors.white,  # Set to WHITE as requested
        spaceAfter=6,
        backColor=colors.black,
        leftIndent=15
    )

    story = []

    # Add much bigger logo if exists - path corrected
    logo_path = os.path.join(os.path.dirname(__file__), "image.png")
    if os.path.exists(logo_path):
        # Much bigger logo as requested
        img = Image(logo_path, width=8*inch, height=6*inch)
        story.append(img)
        story.append(Spacer(1, 60))

    # SVG files not supported by ReportLab, skip eye.svg

    # Process markdown - fix table duplication
    lines = markdown_content.split('\n')
    seen_tables = set()
    current_section = ""
    after_table = False  # Track if we're after a table for green text
    in_vulnerability_analysis = False  # Track if we're in vulnerability analysis section
    i = 0

    while i < len(lines):
        line = lines[i].strip()

        if not line:
            i += 1
            continue

        # Track current section to avoid duplicate tables
        if line.startswith('##'):
            current_section = line
            # Check if we're entering vulnerability analysis section
            if 'vulnerability analysis' in line.lower():
                in_vulnerability_analysis = True
            else:
                in_vulnerability_analysis = False

        # Handle tables - only process once per section
        if line.startswith('|') and line.endswith('|') and '---' not in line:
            table_lines = [line]
            i += 1

            # Collect all table lines
            while i < len(lines):
                next_line = lines[i].strip()
                if next_line.startswith('|') and next_line.endswith('|') and '---' not in next_line:
                    table_lines.append(next_line)
                    i += 1
                elif next_line.startswith('|') and '---' in next_line:
                    i += 1  # Skip separator line
                else:
                    break

            # Create unique identifier for this table
            table_content = ''.join(table_lines)
            table_id = f"{current_section}:{hash(table_content)}"

            if table_id not in seen_tables and len(table_lines) >= 2:
                seen_tables.add(table_id)
                table = create_formatted_table(table_lines)
                if table:
                    story.append(table)
                    story.append(Spacer(1, 15))
                    after_table = True  # Mark that we're after a table
            continue

        # Main title
        if line.startswith('# '):
            title_text = clean_text(line[2:])
            story.append(Paragraph(title_text, title_style))
            story.append(Spacer(1, 20))
            # Add page break after title page to separate from content
            story.append(PageBreak())

        # Section headers
        elif line.startswith('## '):
            header_text = clean_text(line[3:])
            story.append(Paragraph(header_text, heading_style))
            story.append(Spacer(1, 10))

        # Subsection headers (use green text for ### markdown)
        elif line.startswith('### '):
            subheader_text = clean_text(line[4:])
            story.append(Paragraph(subheader_text, subheading_style))
            story.append(Spacer(1, 8))

        # REORDERED: Paragraph processing now comes BEFORE list processing
        # This ensures the in_vulnerability_analysis logic is checked first.
        elif line and not line.startswith('|'):
            clean_line = clean_text(line)
            if clean_line:
                # In vulnerability analysis section, handle CVE names and descriptions differently
                if in_vulnerability_analysis:
                    # Check if this looks like a numbered CVE heading (starts with number. CVE-xxxx)
                    if re.match(r'^\d+\.\s*(CVE-|[A-Z])', clean_line):
                        # This is a numbered CVE heading - make it GREEN and LARGE (14pt)
                        story.append(Paragraph(clean_line, cve_heading_style))
                        story.append(Spacer(1, 8))
                    elif any(word in clean_line.lower() for word in ['description:', 'impact:', 'recommendation:', 'cvss:', 'severity:']):
                        # These are subsection labels - WHITE and smaller (11pt)
                        story.append(Paragraph(clean_line, desc_heading_style))
                        story.append(Spacer(1, 6))
                    else:
                        # ALL other content in vulnerability analysis - WHITE as requested
                        story.append(Paragraph(clean_line, cve_content_style))
                        story.append(Spacer(1, 4))
                else:
                    # Outside vulnerability analysis, use normal rules
                    if any(word in clean_line.lower() for word in ['description:', 'impact:', 'recommendation:', 'cvss:', 'severity:']):
                        story.append(Paragraph(clean_line, desc_heading_style))
                        story.append(Spacer(1, 6))
                    else:
                        story.append(Paragraph(clean_line, normal_style))
                        story.append(Spacer(1, 6))

        # List items
        elif line.startswith('- ') or line.startswith('• '):
            list_text = clean_text(line[2:])
            story.append(Paragraph(f"• {list_text}", list_style))
            story.append(Spacer(1, 3))

        elif re.match(r'^\d+\.\s', line):
            list_text = clean_text(re.sub(r'^\d+\.\s', '', line))
            story.append(Paragraph(f"• {list_text}", list_style))
            story.append(Spacer(1, 3))

        i += 1

    # Add timestamp at bottom of last page (no page break)
    story.append(Spacer(1, 30))
    timestamp_style = ParagraphStyle('timestamp', parent=normal_style,
                                   fontSize=9, textColor=colors.grey, alignment=TA_CENTER)
    story.append(Paragraph(f"Report Generated: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}",
                          timestamp_style))

    # Build PDF with black canvas
    doc.build(story, onFirstPage=BlackCanvas(output_filename), onLaterPages=BlackCanvas(output_filename))
    print(f"PDF report generated: {output_filename}")

def create_formatted_table(table_lines):
    """Create formatted table from markdown lines"""
    if not table_lines or len(table_lines) < 2:
        return None

    # Parse table data with text wrapping and Paragraph objects for long text
    from reportlab.platypus import Paragraph
    table_data = []

    for line in table_lines:
        cells = [cell.strip() for cell in line.split('|')[1:-1]]
        if cells:
            clean_cells = []
            for i, cell in enumerate(cells):
                clean_cell = clean_text(cell)
                # Replace empty or unknown services
                if not clean_cell or clean_cell.lower() in ['', 'n/a', 'none']:
                    clean_cell = 'unknown'

                # Convert long text in description/recommendation columns to Paragraph objects
                if len(clean_cell) > 50:  # Long text needs wrapping
                    cell_style = ParagraphStyle(
                        'CellText',
                        fontName='Times-Roman',  # Century Schoolbook equivalent
                        fontSize=10,  # 9+1 as requested
                        textColor=colors.white,
                        leading=12,
                        alignment=0  # Left align
                    )
                    clean_cell = Paragraph(clean_cell, cell_style)

                clean_cells.append(clean_cell)
            table_data.append(clean_cells)

    if not table_data:
        return None

    # Calculate column widths with special handling for description columns
    available_width = A4[0] - 50  # Account for margins
    num_cols = len(table_data[0])

    # Check if this looks like a vulnerabilities or recommendations table
    header_row = [cell.lower() for cell in table_data[0]]
    if any('description' in cell for cell in header_row) or any('recommendation' in cell for cell in header_row):
        # Special handling for tables with description/recommendation columns
        col_widths = []
        for i, header in enumerate(header_row):
            if 'description' in header or 'recommendation' in header:
                col_widths.append(available_width * 0.4)  # 40% for description/recommendation
            elif 'cve' in header or 'severity' in header:
                col_widths.append(available_width * 0.15)  # 15% for CVE/Severity
            else:
                col_widths.append(available_width * 0.15)  # 15% for other columns

        # Adjust if total doesn't equal 100%
        total_width = sum(col_widths)
        if total_width != available_width:
            ratio = available_width / total_width
            col_widths = [w * ratio for w in col_widths]
    else:
        # Equal width for other tables
        col_width = available_width / num_cols
        col_widths = [col_width] * num_cols

    # Create table with proper column widths
    table = Table(table_data, colWidths=col_widths, repeatRows=1)
    table.hAlign = 'LEFT'

    # Style table with proper text wrapping and cell expansion
    table.setStyle(TableStyle([
        # Header row styling
        ('BACKGROUND', (0, 0), (-1, 0), colors.darkgreen),
        ('TEXTCOLOR', (0, 0), (-1, 0), colors.white),
        ('FONTNAME', (0, 0), (-1, 0), 'Times-Bold'),  # Century Schoolbook equivalent
        ('FONTSIZE', (0, 0), (-1, 0), 14),  # 13+1 as requested
        ('ALIGN', (0, 0), (-1, -1), 'LEFT'),
        ('VALIGN', (0, 0), (-1, -1), 'TOP'),

        # Data rows styling
        ('BACKGROUND', (0, 1), (-1, -1), colors.black),
        ('TEXTCOLOR', (0, 1), (-1, -1), colors.white),
        ('FONTNAME', (0, 1), (-1, -1), 'Times-Roman'),  # Century Schoolbook equivalent
        ('FONTSIZE', (0, 1), (-1, -1), 10),  # 9+1 as requested

        # Enhanced padding for vertical expansion - INCREASED
        ('TOPPADDING', (0, 0), (-1, -1), 15),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 15),
        ('LEFTPADDING', (0, 0), (-1, -1), 8),
        ('RIGHTPADDING', (0, 0), (-1, -1), 8),

        # Grayish grid lines as requested
        ('GRID', (0, 0), (-1, -1), 2, colors.gray),

        # Alternating row colors
        ('ROWBACKGROUNDS', (0, 1), (-1, -1), [colors.black, colors.HexColor('#0d0d0d')]),

        # Force proper text wrapping and row height adjustment
        ('WORDWRAP', (0, 0), (-1, -1), 'LTR'),
        ('SPLITLONGWORDS', (0, 0), (-1, -1), 1),
        ('NOSPLITBEFORE', (0, 0), (-1, -1), 0),
        ('NOSPLITAFTER', (0, 0), (-1, -1), 0)
    ]))

    return table

def clean_text(text):
    """Clean markdown formatting from text"""
    if not text:
        return ""

    # Remove markdown formatting
    text = re.sub(r'\*\*(.*?)\*\*', r'\1', text)  # Bold
    text = re.sub(r'\*(.*?)\*', r'\1', text)      # Italic
    text = re.sub(r'`(.*?)`', r'\1', text)        # Code
    text = re.sub(r'\[(.*?)\]\(.*?\)', r'\1', text)  # Links

    return text.strip()

def generate_pdf_report(markdown_content, output_filename="security_report.pdf"):
    """Generate PDF report from markdown"""
    try:
        # If output_filename is already a full path, use it directly
        # Otherwise, use just the filename
        if os.path.isabs(output_filename):
            results_path = output_filename
        else:
            results_path = output_filename

        parse_markdown_to_pdf(markdown_content, results_path)

        return {
            "status": "success",
            "pdf_file": os.path.basename(results_path)
        }

    except Exception as e:
        print(f"PDF Generation Error: {str(e)}")
        import traceback
        traceback.print_exc()
        return {
            "status": "error",
            "message": str(e)
        }