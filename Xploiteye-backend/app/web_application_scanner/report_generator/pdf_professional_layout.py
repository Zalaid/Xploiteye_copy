"""
Professional PDF Layout and Styling for XploitEye Reports
ISO-Standard formatting with Black Cover Page and White Internal Pages
"""

from reportlab.lib.pagesizes import A4
from reportlab.platypus import (
    SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle,
    PageBreak, Image
)
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.units import inch
from reportlab.lib import colors
from reportlab.lib.enums import TA_CENTER, TA_LEFT, TA_JUSTIFY
import os
from datetime import datetime

class ReportCanvas:
    """Orchestrates the page backgrounds and headers"""
    def __init__(self, target_url, logo_path):
        self.target_url = target_url
        self.logo_path = logo_path

    def __call__(self, canvas, doc):
        canvas.saveState()
        if doc.page == 1:
            # --- Cover Page Style (Charcoal Black) ---
            canvas.setFillColor(colors.HexColor('#36454F'))
            canvas.rect(0, 0, A4[0], A4[1], fill=1)
            if os.path.exists(self.logo_path):
                # Larger Logo
                canvas.drawImage(self.logo_path, A4[0]/2 - 2*inch, A4[1] - 4.5*inch, width=4*inch, height=2.5*inch, mask='auto')
        else:
            # --- Internal Pages Style (White) ---
            canvas.setFillColor(colors.white)
            canvas.rect(0, 0, A4[0], A4[1], fill=1)
            
            # Header line
            canvas.setStrokeColor(colors.HexColor('#1976D2'))
            canvas.setLineWidth(1)
            canvas.line(40, A4[1] - 50, A4[0] - 40, A4[1] - 50)
            
            # Header text
            canvas.setFont('Helvetica-Bold', 9)
            canvas.setFillColor(colors.HexColor('#1976D2'))
            canvas.drawString(40, A4[1] - 40, f"Target: {self.target_url}")
            canvas.drawRightString(A4[0] - 40, A4[1] - 40, "XploitEye Security Assessment")
            
            # Footer
            canvas.setFont('Helvetica', 8)
            canvas.setFillColor(colors.grey)
            canvas.drawCentredString(A4[0]/2, 30, f"Page {doc.page} | Confidential")
            
        canvas.restoreState()

def get_report_styles():
    styles = getSampleStyleSheet()
    
    # Custom colors
    primary_blue = colors.HexColor('#1976D2')
    parrot_green = colors.HexColor('#32CD32')
    
    # Title Page Styles
    styles.add(ParagraphStyle(
        name='CoverTitle',
        parent=styles['Heading1'],
        fontName='Helvetica-Bold',
        fontSize=28,
        textColor=colors.white,
        alignment=TA_CENTER,
        spaceAfter=15
    ))
    
    styles.add(ParagraphStyle(
        name='CoverSubtitle',
        parent=styles['Normal'],
        fontName='Helvetica',
        fontSize=14,
        textColor=parrot_green,
        alignment=TA_CENTER,
        spaceAfter=40
    ))

    styles.add(ParagraphStyle(
        name='CoverDetail',
        parent=styles['Normal'],
        fontName='Helvetica',
        fontSize=11,
        textColor=colors.lightgrey,
        alignment=TA_CENTER,
        leading=16
    ))

    # Internal Section Styles
    styles.add(ParagraphStyle(
        name='SectionHeader',
        parent=styles['Heading1'],
        fontName='Helvetica-Bold',
        fontSize=20,
        textColor=primary_blue,
        spaceBefore=20,
        spaceAfter=15,
        borderWidth=0,
        leftIndent=0
    ))

    styles.add(ParagraphStyle(
        name='SubsectionHeader',
        parent=styles['Heading2'],
        fontName='Helvetica-Bold',
        fontSize=12,
        textColor=primary_blue,
        spaceBefore=10,
        spaceAfter=6
    ))

    styles.add(ParagraphStyle(
        name='SubSubSectionHeader',
        parent=styles['Heading3'],
        fontName='Helvetica-Bold',
        fontSize=11,
        textColor=colors.black,
        spaceBefore=8,
        spaceAfter=4
    ))

    styles.add(ParagraphStyle(
        name='StandardText',
        parent=styles['Normal'],
        fontName='Times-Roman',
        fontSize=11,
        textColor=colors.black,
        alignment=TA_JUSTIFY,
        leading=14,
        spaceAfter=10
    ))

    styles.add(ParagraphStyle(
        name='BulletList',
        parent=styles['Normal'],
        fontName='Times-Roman',
        fontSize=11,
        textColor=colors.black,
        leftIndent=20,
        bulletIndent=10,
        spaceBefore=3,
        spaceAfter=3,
        leading=14
    ))

    return styles

# Common colors
primary_blue = colors.HexColor('#1976D2')

def create_methodology_table():
    """Created a standard methodology table with LongTable behavior."""
    data = [
        ["Phase", "Activity", "Tools & Standards"],
        ["1. Reconnaissance", Paragraph("Passive and active gathering of domain intelligence, subdomains, and asset mapping.", get_report_styles()['StandardText']), "WHOIS, DNSenum, OSINT"],
        ["2. Vulnerability Scanning", Paragraph("Automated enumerations of service versions, weak configurations, and known CVEs.", get_report_styles()['StandardText']), "Nessus, OpenVAS, Custom Scripts"],
        ["3. Manual Verification", Paragraph("Human validation of high-risk findings to eliminate false positives and confirm exploitability.", get_report_styles()['StandardText']), "Burp Suite Pro, Manual Curl/Wget"],
        ["4. Exploitation Analysis", Paragraph("Controlled proof-of-concept execution to determine business impact (Safe Methods).", get_report_styles()['StandardText']), "Metasploit (Simulated), Custom PoCs"],
        ["5. Reporting", Paragraph("Synthesis of technical data into business-aligned risk intelligence and remediation roadmaps.", get_report_styles()['StandardText']), "ISO 27001 Mapping, CVSS v3.1 Scoring"]
    ]
    
    table_style = TableStyle([
        ('BACKGROUND', (0, 0), (-1, 0), primary_blue),
        ('TEXTCOLOR', (0, 0), (-1, 0), colors.whitesmoke),
        ('ALIGN', (0, 0), (-1, -1), 'LEFT'),
        ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
        ('FONTSIZE', (0, 0), (-1, 0), 11),
        ('BOTTOMPADDING', (0, 0), (-1, 0), 12),
        ('BACKGROUND', (0, 1), (-1, -1), colors.white),
        ('GRID', (0, 0), (-1, -1), 0.5, colors.lightgrey),
        ('VALIGN', (0, 0), (-1, -1), 'TOP'),
        ('ROWBACKGROUNDS', (0,1), (-1,-1), [colors.white, colors.HexColor('#F5F5F5')]),
    ])
    
    # Use standard Table with repeatRows but adjust widths to ensure fitting
    t = Table(data, colWidths=[1.5*inch, 3.5*inch, 2.0*inch], repeatRows=1)
    t.setStyle(table_style)
    return t

def create_findings_table(findings):
    """Creates a professional table for the findings list"""
    data = [['Severity', 'Vulnerability', 'Component', 'CVE-ID']]
    styles = get_report_styles()
    
    for f in findings:
        severity = f.get('severity', 'Low').upper()
        # Wrap text for better layout using Paragraph
        title = Paragraph(f.get('title', 'N/A'), styles['StandardText'])
        
        data.append([
            severity,
            title,
            f.get('component', 'N/A'),
            f.get('cve_id', 'N/A')
        ])
    
    table = Table(data, colWidths=[1.0*inch, 3.5*inch, 1.2*inch, 1.3*inch], repeatRows=1)
    table.setStyle(TableStyle([
        ('BACKGROUND', (0,0), (-1,0), primary_blue),
        ('TEXTCOLOR', (0,0), (-1,0), colors.white),
        ('FONTNAME', (0,0), (-1,0), 'Helvetica-Bold'),
        ('GRID', (0,0), (-1,-1), 0.5, colors.grey),
        ('VALIGN', (0,0), (-1,-1), 'TOP'),
        ('ROWBACKGROUNDS', (0,1), (-1,-1), [colors.white, colors.HexColor('#F5F5F5')]),
        ('FONTSIZE', (0, 0), (-1, -1), 9),
    ]))
    return table
