"""
Report Orchestrator: Combines AI, Charts, and Layout to generate the final PDF.
"""

import os
import json
import asyncio
from datetime import datetime
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, PageBreak
from reportlab.platypus.flowables import HRFlowable
from reportlab.lib.pagesizes import A4
from reportlab.lib import colors
from reportlab.lib.units import inch
import re

# Local folder imports
from .pdf_professional_layout import ReportCanvas, get_report_styles, create_findings_table, create_methodology_table
from .chart_generators import create_severity_pie_chart, create_risk_gauge, create_tech_distribution_chart
from .enhanced_gpt_prompts import (
    generate_executive_summary, 
    generate_compliance_mapping, 
    generate_remediation_roadmap,
    generate_finding_deep_dive
)

def _parse_markdown_to_story(text, styles, story):
    """Enhanced parser for AI markdown to ReportLab story."""
    # 1. Critical Cleanup: Fix weird non-standard hyphens or chars
    text = text.replace('\u2013', '-').replace('\u2014', '--').replace('\u2011', '-')
    
    # 2. Remove AI code block artifacts
    text = re.sub(r'```[a-zA-Z]*', '', text).replace('```', '')
    
    # 3. Pre-process bold/italic
    text = re.sub(r'\*\*(.*?)\*\*', r'<b>\1</b>', text)
    text = re.sub(r'\*(.*?)\*', r'<i>\1</i>', text)
    
    # 4. Colorize Specific Keywords
    # Critical -> Dark Red (#8B0000), High -> Red (#FF0000), Medium -> Orange (#FFA500), Low -> Green (#008000)
    text = re.sub(r'(Critical|CRITICAL)', r'<font color="#8B0000"><b>\1</b></font>', text)
    text = re.sub(r'(High|HIGH)(?!\sSeverity)', r'<font color="#FF0000"><b>\1</b></font>', text)
    text = re.sub(r'(Medium|MEDIUM)', r'<font color="#FFA500"><b>\1</b></font>', text)
    text = re.sub(r'(Low|LOW)', r'<font color="#008000"><b>\1</b></font>', text)
    
    # Make CVEs BLUE and Underlined
    text = re.sub(r'(CVE-\d{4}-\d{4,})', r'<font color="blue"><u>\1</u></font>', text)
    
    for line in text.split('\n'):
        line = line.strip()
        if not line:
            story.append(Spacer(1, 0.1*inch))
            continue
            
        # 5. Detect and skip markdown tables
        if '|' in line and '---' in line: continue
        if line.startswith('|') and line.endswith('|'):
            line = line.replace('|', '  ').strip()
            if not line: continue
            
        # 6. Skip horizontal separators (---, ___, ===) and replace with centered line
        if line.startswith('---') or set(line.strip()) <= {'-', '=', '_', '*'}:
            story.append(HRFlowable(width="80%", thickness=1, lineCap='round', color=colors.lightgrey, spaceBefore=6, spaceAfter=6, hAlign='CENTER'))
            continue
            
        # XML escaping for ReportLab Paragraph
        line = line.replace('&', '&amp;').replace('<', '&lt;').replace('>', '&gt;')
        # Re-inject our allowed tags
        line = line.replace('&lt;b&gt;', '<b>').replace('&lt;/b&gt;', '</b>')
        line = line.replace('&lt;i&gt;', '<i>').replace('&lt;/i&gt;', '</i>')
        line = line.replace('&lt;font color="#8B0000"&gt;', '<font color="#8B0000">').replace('&lt;font color="#FF0000"&gt;', '<font color="#FF0000">')
        line = line.replace('&lt;font color="#FFA500"&gt;', '<font color="#FFA500">').replace('&lt;font color="#008000"&gt;', '<font color="#008000">')
        line = line.replace('&lt;font color="blue"&gt;', '<font color="blue">').replace('&lt;/font&gt;', '</font>')
        line = line.replace('&lt;u&gt;', '<u>').replace('&lt;/u&gt;', '</u>')
        
        # Headers - Adjusted sizing logic happens in styles, but mapping is here.
        if line.startswith('# '):
            story.append(Paragraph(re.sub(r'^#+\s*', '', line), styles['SectionHeader']))
        elif line.startswith('## '):
            story.append(Paragraph(re.sub(r'^#+\s*', '', line), styles['SectionHeader']))
        elif line.startswith('### '):
            # Reduced size headers
            story.append(Paragraph(re.sub(r'^#+\s*', '', line), styles['SubsectionHeader']))
        elif line.startswith('#### '):
            story.append(Paragraph(re.sub(r'^#+\s*', '', line), styles['SubSubSectionHeader']))
        # Bullets
        elif line.startswith('- ') or line.startswith('* '):
            story.append(Paragraph(line[2:], styles['BulletList']))
        # Numbered lists
        elif re.match(r'^\d+\.\s', line):
            story.append(Paragraph(line, styles['StandardText']))
        else:
            story.append(Paragraph(line, styles['StandardText']))

async def generate_professional_report(scan_id, json_data, output_path):
    """
    Main entry point for generating a report. (Must be awaited)
    """
    target_url = json_data.get("target", "Unknown")
    logo_path = os.path.join(os.path.dirname(__file__), "image.png")
    
    # Setup PDF doc
    doc = SimpleDocTemplate(output_path, pagesize=A4, rightMargin=50, leftMargin=50, topMargin=60, bottomMargin=50)
    styles = get_report_styles()
    story = []

    # --- 1. Cover Page ---
    story.append(Spacer(1, 4.2*inch))
    story.append(Paragraph("XploitEye Website Scan Analysis", styles['CoverTitle']))
    story.append(Paragraph(f"Analysis for {target_url}", styles['CoverSubtitle']))
    
    # Cover Details
    ip_addr = json_data.get("recon_data", {}).get("dns", {}).get("ip", ["N/A"])[0]
    
    story.append(Spacer(1, 0.5*inch))
    story.append(Paragraph(f"<b>Scan Identity:</b> {scan_id}", styles['CoverDetail']))
    story.append(Paragraph(f"<b>Target Domain:</b> {target_url}", styles['CoverDetail']))
    story.append(Paragraph(f"<b>Server IP:</b> {ip_addr}", styles['CoverDetail']))
    story.append(Paragraph(f"<b>Generated on:</b> {datetime.now().strftime('%B %d, %Y')}", styles['CoverDetail']))
    
    story.append(PageBreak())

    # --- Parallel AI Generation for core sections ---
    print(f"[*] Dispatching AI Analysis tasks for {target_url}...")
    tasks = [
        generate_executive_summary(json_data),
        generate_compliance_mapping(json_data),
        generate_remediation_roadmap(json_data)
    ]
    
    # Wait for core sections
    exec_sum, compliance, roadmap = await asyncio.gather(*tasks)

    # --- 2. Executive Summary ---
    story.append(Paragraph("1. Executive Summary", styles['SectionHeader']))
    # Just one paragraph, but we parse it to be safe
    _parse_markdown_to_story(exec_sum, styles, story)
    story.append(PageBreak())

    # --- 3. Methodology & Tech ---
    story.append(Paragraph("2. Assessment Methodology", styles['SectionHeader']))
    story.append(Paragraph("The following methodology was employed to ensure a comprehensive and ISO-aligned assessment.", styles['StandardText']))
    story.append(Spacer(1, 0.2*inch))
    story.append(create_methodology_table())
    story.append(Spacer(1, 0.3*inch))
    
    story.append(Paragraph("Technology Stack Detected:", styles['SubsectionHeader']))
    story.append(create_tech_distribution_chart(json_data.get("technologies", {})))
    story.append(PageBreak())

    # --- 4. Risk Visualization ---
    story.append(Paragraph("3. Executive Risk Visualization", styles['SectionHeader']))
    risk_score = json_data.get("risk_score", 7.5)
    risk_level = json_data.get("risk_level", "High")
    story.append(create_risk_gauge(risk_score, risk_level))
    
    severity_counts = {}
    for f in json_data.get("findings", []):
        sev = f.get("severity", "Low").lower()
        severity_counts[sev] = severity_counts.get(sev, 0) + 1
    story.append(create_severity_pie_chart(severity_counts))
    story.append(PageBreak())

    # --- 5. Managed Vulnerability Deep-Dive (Filtered) ---
    story.append(Paragraph("4. Vulnerability Deep-Dive", styles['SectionHeader']))
    story.append(Paragraph("Detailed technical analysis of confirmed high-risk findings.", styles['StandardText']))
    
    findings = json_data.get("findings", [])
    # Filter findings: Must be High/Critical AND have a valid description
    valid_findings = []
    for f in findings:
        sev = f.get('severity', '').lower()
        desc = f.get('description', '')
        if sev in ['critical', 'high', 'medium'] and desc and "No description available" not in desc:
            valid_findings.append(f)
            
    # Process top findings (limit to avoid massive PDFs if too many)
    for finding in valid_findings[:15]:
        story.append(Paragraph(f"Finding: {finding.get('title')}", styles['SubsectionHeader']))
        story.append(Paragraph(f"<b>Severity:</b> {finding.get('severity').upper()} | <b>CVE:</b> {finding.get('cve_id')}", styles['StandardText']))
        
        # Call AI for individual deep dive
        deep_dive_text = await generate_finding_deep_dive(finding, target_url)
        _parse_markdown_to_story(deep_dive_text, styles, story)
        story.append(Spacer(1, 0.2*inch))
        story.append(HRFlowable(width="80%", thickness=1, lineCap='round', color=colors.lightgrey, spaceBefore=6, spaceAfter=6, hAlign='CENTER'))
        story.append(Spacer(1, 0.2*inch))

    story.append(PageBreak())

    # --- 6. Compliance Ledger ---
    story.append(Paragraph("5. Compliance Gap Analysis", styles['SectionHeader']))
    _parse_markdown_to_story(compliance, styles, story)
    story.append(PageBreak())

    # --- 7. Roadmap ---
    story.append(Paragraph("6. Remediation Roadmap", styles['SectionHeader']))
    _parse_markdown_to_story(roadmap, styles, story)
    story.append(PageBreak())

    # --- 8. Appendix ---
    story.append(Paragraph("Appendix: Findings Ledger", styles['SectionHeader']))
    story.append(create_findings_table(findings))

    # --- Build the PDF ---
    orchestrator_canvas = ReportCanvas(target_url, logo_path)
    doc.build(story, onFirstPage=orchestrator_canvas, onLaterPages=orchestrator_canvas)
    
    return output_path
