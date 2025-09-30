"""
Professional PDF Report Generator for Security Assessments
- Black cover page with logo
- White background for all other pages
- IP address in header
- Professional formatting with proper indentation
- ISO-standard structure
"""

from reportlab.lib.pagesizes import A4
from reportlab.platypus import (
    SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle,
    PageBreak, Image, KeepTogether, PageTemplate, Frame
)
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.units import inch, cm
from reportlab.lib import colors
from reportlab.lib.enums import TA_CENTER, TA_LEFT, TA_RIGHT, TA_JUSTIFY
from reportlab.pdfgen import canvas
from datetime import datetime
import os
import re
import json


class CoverPageCanvas:
    """Black background canvas for cover page only"""

    def __init__(self, target_ip):
        self.target_ip = target_ip

    def __call__(self, canvas_obj, doc):
        # Black background for cover page
        canvas_obj.saveState()
        canvas_obj.setFillColor(colors.black)
        canvas_obj.rect(0, 0, A4[0], A4[1], fill=1)
        canvas_obj.restoreState()


class HeaderCanvas:
    """White background canvas with IP address header for all pages except cover"""

    def __init__(self, target_ip):
        self.target_ip = target_ip

    def __call__(self, canvas_obj, doc):
        canvas_obj.saveState()

        # White background
        canvas_obj.setFillColor(colors.white)
        canvas_obj.rect(0, 0, A4[0], A4[1], fill=1)

        # Header line
        canvas_obj.setStrokeColor(colors.HexColor('#1976D2'))
        canvas_obj.setLineWidth(2)
        canvas_obj.line(30, A4[1] - 40, A4[0] - 30, A4[1] - 40)

        # Header text - IP Address (left)
        canvas_obj.setFont('Helvetica-Bold', 10)
        canvas_obj.setFillColor(colors.HexColor('#1976D2'))
        canvas_obj.drawString(40, A4[1] - 30, f"Target: {self.target_ip}")

        # XploitEye (right)
        canvas_obj.drawRightString(A4[0] - 40, A4[1] - 30, "XploitEye Security Assessment")

        # Footer - page number and confidentiality
        canvas_obj.setFont('Helvetica', 8)
        canvas_obj.setFillColor(colors.grey)
        canvas_obj.drawCentredString(A4[0] / 2, 20, f"Page {doc.page}")
        canvas_obj.drawRightString(A4[0] - 40, 20, "CONFIDENTIAL")

        canvas_obj.restoreState()


def create_styles():
    """Create custom paragraph styles for professional report"""
    styles = getSampleStyleSheet()

    # Helper function to add or replace style
    def add_style(style):
        if style.name not in styles:
            styles.add(style)

    # Cover page title style
    add_style(ParagraphStyle(
        name='CoverTitle',
        parent=styles['Heading1'],
        fontName='Helvetica-Bold',
        fontSize=36,
        textColor=colors.HexColor('#00FF00'),  # Bright green
        spaceAfter=30,
        alignment=TA_CENTER,
        leading=42
    ))

    # Cover page subtitle
    add_style(ParagraphStyle(
        name='CoverSubtitle',
        parent=styles['Normal'],
        fontName='Helvetica',
        fontSize=18,
        textColor=colors.white,
        spaceAfter=20,
        alignment=TA_CENTER,
        leading=22
    ))

    # Cover page info
    add_style(ParagraphStyle(
        name='CoverInfo',
        parent=styles['Normal'],
        fontName='Helvetica',
        fontSize=12,
        textColor=colors.white,
        spaceAfter=8,
        alignment=TA_CENTER,
        leading=16
    ))

    # Section title (like Executive Summary)
    add_style(ParagraphStyle(
        name='SectionTitle',
        parent=styles['Heading1'],
        fontName='Helvetica-Bold',
        fontSize=18,
        textColor=colors.HexColor('#1976D2'),
        spaceAfter=14,
        spaceBefore=18,
        leftIndent=0,
        leading=22,
        borderWidth=0,
        borderPadding=0
    ))

    # Subsection title
    add_style(ParagraphStyle(
        name='SubsectionTitle',
        parent=styles['Heading2'],
        fontName='Helvetica-Bold',
        fontSize=14,
        textColor=colors.HexColor('#1976D2'),
        spaceAfter=10,
        spaceBefore=12,
        leftIndent=10,
        leading=17
    ))

    # Sub-subsection title
    add_style(ParagraphStyle(
        name='SubSubsectionTitle',
        parent=styles['Heading3'],
        fontName='Helvetica-Bold',
        fontSize=12,
        textColor=colors.HexColor('#424242'),
        spaceAfter=6,
        spaceBefore=8,
        leftIndent=20,
        leading=14
    ))

    # Body text
    add_style(ParagraphStyle(
        name='BodyText',
        parent=styles['Normal'],
        fontName='Times-Roman',
        fontSize=11,
        textColor=colors.black,
        spaceAfter=8,
        alignment=TA_JUSTIFY,
        leftIndent=0,
        leading=14
    ))

    # Indented body text
    add_style(ParagraphStyle(
        name='BodyTextIndent',
        parent=styles['BodyText'],
        leftIndent=20,
        leading=14
    ))

    # Bold body text (for labels)
    add_style(ParagraphStyle(
        name='BodyTextBold',
        parent=styles['BodyText'],
        fontName='Times-Bold'
    ))

    # Bullet list
    add_style(ParagraphStyle(
        name='BulletList',
        parent=styles['BodyText'],
        leftIndent=35,
        bulletIndent=15,
        spaceAfter=4
    ))

    # Code/command style
    add_style(ParagraphStyle(
        name='Code',
        parent=styles['Normal'],
        fontName='Courier',
        fontSize=9,
        textColor=colors.HexColor('#424242'),
        backColor=colors.HexColor('#F5F5F5'),
        leftIndent=20,
        rightIndent=20,
        spaceAfter=8,
        borderColor=colors.HexColor('#BDBDBD'),
        borderWidth=1,
        borderPadding=8
    ))

    # Critical finding
    add_style(ParagraphStyle(
        name='CriticalText',
        parent=styles['BodyTextBold'],
        textColor=colors.HexColor('#D32F2F')
    ))

    # High severity
    add_style(ParagraphStyle(
        name='HighText',
        parent=styles['BodyTextBold'],
        textColor=colors.HexColor('#F57C00')
    ))

    # Medium severity
    add_style(ParagraphStyle(
        name='MediumText',
        parent=styles['BodyTextBold'],
        textColor=colors.HexColor('#FBC02D')
    ))

    # Low severity
    add_style(ParagraphStyle(
        name='LowText',
        parent=styles['BodyTextBold'],
        textColor=colors.HexColor('#388E3C')
    ))

    return styles


def create_cover_page(target_ip, scan_date, risk_level, scan_type):
    """Create cover page elements"""
    story = []
    styles = create_styles()

    # Add logo if exists
    logo_path = os.path.join(os.path.dirname(__file__), "image.png")
    if os.path.exists(logo_path):
        try:
            img = Image(logo_path, width=6*inch, height=4*inch)
            story.append(Spacer(1, 0.5*inch))
            story.append(img)
            story.append(Spacer(1, 0.8*inch))
        except:
            story.append(Spacer(1, 2*inch))
    else:
        story.append(Spacer(1, 2.5*inch))

    # Title
    story.append(Paragraph("VULNERABILITY ASSESSMENT REPORT", styles['CoverTitle']))
    story.append(Spacer(1, 0.3*inch))

    # Subtitle
    story.append(Paragraph("Comprehensive Security Analysis", styles['CoverSubtitle']))
    story.append(Spacer(1, 0.8*inch))

    # Info box
    story.append(Paragraph(f"<b>Target System:</b> {target_ip}", styles['CoverInfo']))
    story.append(Paragraph(f"<b>Assessment Date:</b> {scan_date}", styles['CoverInfo']))
    story.append(Paragraph(f"<b>Scan Type:</b> {scan_type.upper()}", styles['CoverInfo']))

    # Risk level with color
    risk_colors = {
        'critical': '#D32F2F',
        'high': '#F57C00',
        'medium': '#FBC02D',
        'low': '#388E3C'
    }
    risk_color = risk_colors.get(risk_level.lower(), '#FBC02D')
    story.append(Spacer(1, 0.3*inch))
    story.append(Paragraph(
        f'<b>Risk Level:</b> <font color="{risk_color}"><b>{risk_level.upper()}</b></font>',
        styles['CoverInfo']
    ))

    story.append(Spacer(1, 1*inch))

    # Confidentiality notice
    story.append(Paragraph(
        "<b>CONFIDENTIAL</b><br/>For Internal Use Only",
        styles['CoverInfo']
    ))

    story.append(Spacer(1, 0.5*inch))

    # Prepared by
    story.append(Paragraph(
        "Prepared by:<br/><b>XploitEye Security Team</b>",
        styles['CoverInfo']
    ))

    story.append(PageBreak())

    return story


def calculate_column_widths(table_data, available_width):
    """Calculate optimal column widths based on content"""
    if not table_data or len(table_data) < 2:
        return None

    num_cols = len(table_data[0])

    # Calculate max content length for each column
    col_max_lengths = [0] * num_cols
    for row in table_data:
        for col_idx, cell in enumerate(row):
            # Handle both string and Paragraph objects
            if isinstance(cell, Paragraph):
                cell_text = str(cell.text).replace('<b>', '').replace('</b>', '').replace('<para>', '').replace('</para>', '')
            else:
                cell_text = str(cell).replace('<b>', '').replace('</b>', '')
            col_max_lengths[col_idx] = max(col_max_lengths[col_idx], len(cell_text))

    # Calculate proportional widths
    total_length = sum(col_max_lengths)
    if total_length == 0:
        return [available_width / num_cols] * num_cols

    col_widths = []
    for max_len in col_max_lengths:
        proportion = max_len / total_length
        width = available_width * proportion
        # Minimum width of 1 inch, maximum 4 inches for better wrapping
        width = max(1.0 * inch, min(width, 4 * inch))
        col_widths.append(width)

    # Adjust if total exceeds available width
    total_width = sum(col_widths)
    if total_width > available_width:
        ratio = available_width / total_width
        col_widths = [w * ratio for w in col_widths]

    return col_widths


def create_table_style():
    """Create standard table style"""
    return TableStyle([
        # Header row
        ('BACKGROUND', (0, 0), (-1, 0), colors.HexColor('#1976D2')),
        ('TEXTCOLOR', (0, 0), (-1, 0), colors.white),
        ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
        ('FONTSIZE', (0, 0), (-1, 0), 11),
        ('ALIGN', (0, 0), (-1, -1), 'LEFT'),
        ('VALIGN', (0, 0), (-1, -1), 'TOP'),

        # Data rows
        ('BACKGROUND', (0, 1), (-1, -1), colors.white),
        ('TEXTCOLOR', (0, 1), (-1, -1), colors.black),
        ('FONTNAME', (0, 1), (-1, -1), 'Helvetica'),
        ('FONTSIZE', (0, 1), (-1, -1), 10),

        # Padding
        ('TOPPADDING', (0, 0), (-1, -1), 8),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 8),
        ('LEFTPADDING', (0, 0), (-1, -1), 8),
        ('RIGHTPADDING', (0, 0), (-1, -1), 8),

        # Grid
        ('GRID', (0, 0), (-1, -1), 1, colors.HexColor('#BDBDBD')),

        # Alternating rows
        ('ROWBACKGROUNDS', (0, 1), (-1, -1), [colors.white, colors.HexColor('#F5F5F5')]),
    ])


def parse_markdown_content(content, styles):
    """Parse markdown-like content to PDF elements"""
    story = []
    lines = content.split('\n')

    i = 0
    while i < len(lines):
        line = lines[i].strip()

        if not line:
            i += 1
            continue

        # Section title ##
        if line.startswith('## '):
            title = line[3:].strip()
            story.append(Spacer(1, 0.15*inch))
            story.append(Paragraph(title, styles['SectionTitle']))
            story.append(Spacer(1, 0.1*inch))

        # Subsection title ###
        elif line.startswith('### '):
            title = line[4:].strip()
            story.append(Spacer(1, 0.12*inch))
            story.append(Paragraph(title, styles['SubsectionTitle']))
            story.append(Spacer(1, 0.06*inch))

        # Sub-subsection ####
        elif line.startswith('#### '):
            title = line[5:].strip()
            story.append(Spacer(1, 0.08*inch))
            story.append(Paragraph(title, styles['SubSubsectionTitle']))
            story.append(Spacer(1, 0.04*inch))

        # Bold text **text**
        elif line.startswith('**') and line.endswith('**'):
            text = line[2:-2]
            story.append(Paragraph(f"<b>{text}</b>", styles['BodyTextBold']))

        # Bullet list -
        elif line.startswith('- ') or line.startswith('• '):
            text = line[2:].strip()
            # Process bold in bullets
            text = re.sub(r'\*\*(.*?)\*\*', r'<b>\1</b>', text)
            story.append(Paragraph(f"• {text}", styles['BulletList']))

        # Numbered list
        elif re.match(r'^\d+\.\s', line):
            text = re.sub(r'^\d+\.\s', '', line)
            text = re.sub(r'\*\*(.*?)\*\*', r'<b>\1</b>', text)
            story.append(Paragraph(text, styles['BulletList']))

        # Table detection
        elif line.startswith('|') and '|' in line:
            # Collect table lines
            table_lines = [line]
            i += 1
            while i < len(lines) and lines[i].strip().startswith('|'):
                table_lines.append(lines[i].strip())
                i += 1
            i -= 1  # Step back one

            # Parse table
            table_data = []
            for tline in table_lines:
                if '---' not in tline:  # Skip separator line
                    cells = [c.strip() for c in tline.split('|')[1:-1]]
                    if cells:
                        # Process bold in cells and wrap in Paragraph for text wrapping
                        processed_cells = []
                        for cell in cells:
                            cell_text = re.sub(r'\*\*(.*?)\*\*', r'<b>\1</b>', cell)
                            # Wrap long text in Paragraph for proper wrapping
                            if len(cell_text) > 30:
                                cell_para = Paragraph(cell_text, styles['BodyText'])
                                processed_cells.append(cell_para)
                            else:
                                processed_cells.append(cell_text)
                        table_data.append(processed_cells)

            if table_data and len(table_data) > 1:
                # Create table with auto-calculated widths
                available_width = A4[0] - 80  # Account for margins
                col_widths = calculate_column_widths(table_data, available_width)
                table = Table(table_data, colWidths=col_widths, repeatRows=1)
                table.setStyle(create_table_style())
                story.append(table)
                story.append(Spacer(1, 0.12*inch))

        # Regular paragraph
        else:
            # Process inline formatting
            text = re.sub(r'\*\*(.*?)\*\*', r'<b>\1</b>', line)  # Bold
            text = re.sub(r'\*(.*?)\*', r'<i>\1</i>', text)  # Italic
            text = re.sub(r'`(.*?)`', r'<font face="Courier">\1</font>', text)  # Code

            story.append(Paragraph(text, styles['BodyText']))

        i += 1

    return story


def generate_professional_pdf(scan_data_json, txt_content, gpt_sections, output_path):
    """
    Generate complete professional PDF report

    Args:
        scan_data_json: JSON object with scan results
        txt_content: Raw TXT content with CVE details
        gpt_sections: Dict with GPT-generated sections
        output_path: Path to save PDF

    Returns:
        dict: Status and path
    """
    try:
        # Extract data
        summary = scan_data_json.get('summary', {})
        target_ip = summary.get('target', 'Unknown')
        scan_date = summary.get('timestamp', datetime.now().strftime('%Y-%m-%d %H:%M:%S'))
        risk_level = summary.get('risk_level', 'medium')
        scan_type = summary.get('scan_type', 'light')

        # Create PDF document
        doc = SimpleDocTemplate(
            output_path,
            pagesize=A4,
            rightMargin=40,
            leftMargin=40,
            topMargin=60,
            bottomMargin=40
        )

        # Create story (content)
        story = []
        styles = create_styles()

        # Cover page (black background) - already includes PageBreak
        story.extend(create_cover_page(target_ip, scan_date, risk_level, scan_type))

        # All other sections (white background)
        # Executive Summary
        if 'executive_summary' in gpt_sections:
            story.extend(parse_markdown_content(gpt_sections['executive_summary'], styles))

            # Add charts after executive summary
            if 'charts' in gpt_sections:
                charts = gpt_sections['charts']
                story.append(Spacer(1, 0.2*inch))
                story.append(Paragraph("Vulnerability Overview Charts", styles['SubsectionTitle']))
                story.append(Spacer(1, 0.15*inch))

                # Add risk gauge and severity pie
                if 'risk_gauge' in charts:
                    story.append(KeepTogether([charts['risk_gauge'], Spacer(1, 0.15*inch)]))

                if 'severity_pie' in charts:
                    story.append(KeepTogether([charts['severity_pie'], Spacer(1, 0.15*inch)]))

            story.append(PageBreak())

        # Methodology
        if 'methodology' in gpt_sections:
            story.extend(parse_markdown_content(gpt_sections['methodology'], styles))
            story.append(PageBreak())

        # Technical Summary
        if 'technical_summary' in gpt_sections:
            story.extend(parse_markdown_content(gpt_sections['technical_summary'], styles))

            # Add technical charts
            if 'charts' in gpt_sections:
                charts = gpt_sections['charts']
                story.append(Spacer(1, 0.2*inch))
                story.append(Paragraph("Technical Analysis Charts", styles['SubsectionTitle']))
                story.append(Spacer(1, 0.15*inch))

                if 'cvss_distribution' in charts:
                    story.append(KeepTogether([charts['cvss_distribution'], Spacer(1, 0.15*inch)]))

                if 'port_distribution' in charts:
                    story.append(KeepTogether([charts['port_distribution'], Spacer(1, 0.15*inch)]))

                if 'exploit_availability' in charts:
                    story.append(KeepTogether([charts['exploit_availability'], Spacer(1, 0.15*inch)]))

            story.append(PageBreak())

        # Vulnerability Details
        if 'vulnerability_details' in gpt_sections:
            for vuln_section in gpt_sections['vulnerability_details']:
                story.extend(parse_markdown_content(vuln_section, styles))
                story.append(Spacer(1, 0.2*inch))
            story.append(PageBreak())

        # Compliance Assessment
        if 'compliance' in gpt_sections:
            story.extend(parse_markdown_content(gpt_sections['compliance'], styles))
            story.append(PageBreak())

        # Remediation Roadmap
        if 'remediation' in gpt_sections:
            story.extend(parse_markdown_content(gpt_sections['remediation'], styles))

        # Build PDF with custom canvas
        cover_canvas = CoverPageCanvas(target_ip)
        header_canvas = HeaderCanvas(target_ip)

        # Build PDF with two different canvases
        def build_with_custom_canvas(canvas_obj, doc_obj):
            if doc_obj.page == 1:
                cover_canvas(canvas_obj, doc_obj)
            else:
                header_canvas(canvas_obj, doc_obj)

        doc.build(story, onFirstPage=build_with_custom_canvas, onLaterPages=build_with_custom_canvas)

        return {
            "status": "success",
            "pdf_file": os.path.basename(output_path),
            "pdf_path": output_path
        }

    except Exception as e:
        print(f"PDF Generation Error: {str(e)}")
        import traceback
        traceback.print_exc()
        return {
            "status": "error",
            "message": str(e)
        }