"""
ISO-Standard Security Report Generator - Master Orchestrator
Coordinates data parsing, GPT analysis, chart generation, and PDF creation
"""

import json
import os
import re
from datetime import datetime

# Import our new modules
from .enhanced_gpt_prompts import (
    generate_executive_summary,
    generate_methodology_section,
    generate_detailed_vulnerability_analysis,
    generate_compliance_assessment,
    generate_remediation_roadmap,
    generate_technical_summary
)
from .professional_pdf_generator import generate_professional_pdf
from .chart_generators import (
    create_severity_pie_chart,
    create_risk_gauge,
    create_cvss_distribution_chart,
    create_port_distribution_chart,
    create_exploit_availability_chart
)


def parse_txt_cve_details(txt_content):
    """
    Parse TXT file to extract detailed CVE information for each vulnerability

    Args:
        txt_content: Complete TXT file content

    Returns:
        dict: CVE ID -> detailed info mapping
    """
    cve_details = {}

    # Split by the separator line
    sections = txt_content.split('----------------------------------------')

    for section in sections:
        section = section.strip()
        if not section or 'CVE ID:' not in section:
            continue

        # Extract CVE ID
        cve_match = re.search(r'CVE ID:\s*(CVE-\d{4}-\d+)', section)
        if not cve_match:
            continue

        cve_id = cve_match.group(1)

        # Extract all fields
        details = {
            'cve_id': cve_id,
            'name': extract_field(section, 'Name'),
            'description': extract_field(section, 'Description'),
            'impact': extract_field(section, 'Impact'),
            'severity': extract_field(section, 'Severity'),
            'cvss_score': extract_field(section, 'CVSS Score'),
            'epss_score': extract_field(section, 'EPSS Score'),
            'age_in_days': extract_field(section, 'Age in Days'),
            'remediation': extract_field(section, 'Remediation'),
            'exploit_available': 'Yes' in extract_field(section, 'Exploit Available'),
            'exploit_links': extract_exploit_links(section),
            'port': extract_port(section),
            'service': extract_service(section),
            'version': extract_version(section)
        }

        cve_details[cve_id] = details

    return cve_details


def extract_field(text, field_name):
    """Extract field value from text"""
    pattern = rf'{field_name}:\s*(.+?)(?:\n[A-Z]|\n\[|\Z)'
    match = re.search(pattern, text, re.DOTALL)
    return match.group(1).strip() if match else 'N/A'


def extract_port(text):
    """Extract port from header line"""
    match = re.search(r'\[Port:\s*(\d+)', text)
    return match.group(1) if match else 'N/A'


def extract_service(text):
    """Extract service from header line"""
    match = re.search(r'Service:\s*([^\|]+)', text)
    return match.group(1).strip() if match else 'N/A'


def extract_version(text):
    """Extract version from header line"""
    match = re.search(r'Version:\s*([^\]]+)', text)
    if match:
        version = match.group(1).strip()
        # Remove trailing markers like (Version-Based)
        version = re.sub(r'\s*\([^)]+\)\s*$', '', version)
        return version
    return 'N/A'


def extract_exploit_links(text):
    """Extract exploit/PoC links from text"""
    links = []
    # Find the exploit links section
    if 'Exploit/PoC Links:' in text:
        links_section = text.split('Exploit/PoC Links:')[1]
        # Extract all URLs
        url_pattern = r'https?://[^\s<>"\']+'
        links = re.findall(url_pattern, links_section)
    return links


def merge_json_and_txt_data(scan_data_json, txt_cve_details):
    """
    Merge JSON and TXT data to create complete vulnerability objects

    Args:
        scan_data_json: Parsed JSON scan results
        txt_cve_details: Parsed TXT CVE details

    Returns:
        list: Complete vulnerability objects with all data
    """
    complete_vulnerabilities = []

    vulnerabilities = scan_data_json.get('vulnerabilities', [])

    for vuln in vulnerabilities:
        cve_id = vuln.get('cve_id', '')
        txt_details = txt_cve_details.get(cve_id, {})

        # Merge data
        complete_vuln = {
            **vuln,  # JSON data
            **txt_details,  # TXT detailed data
            'has_exploit': len(txt_details.get('exploit_links', [])) > 0,
            'exploit_count': len(txt_details.get('exploit_links', []))
        }

        complete_vulnerabilities.append(complete_vuln)

    return complete_vulnerabilities


def calculate_severity_counts(vulnerabilities):
    """Calculate count by severity"""
    counts = {'critical': 0, 'high': 0, 'medium': 0, 'low': 0}
    for vuln in vulnerabilities:
        severity = vuln.get('severity', 'medium').lower()
        if severity in counts:
            counts[severity] += 1
    return counts


def generate_iso_standard_report(json_file_path, txt_file_path, output_pdf_path):
    """
    Main function to generate complete ISO-standard security report

    Args:
        json_file_path: Path to JSON scan results
        txt_file_path: Path to TXT CVE details
        output_pdf_path: Path to save PDF report

    Returns:
        dict: Status and report information
    """
    try:
        print("📊 Starting ISO-standard report generation...")

        # 1. Load data
        print("📂 Loading scan data...")
        with open(json_file_path, 'r', encoding='utf-8') as f:
            scan_data_json = json.load(f)

        with open(txt_file_path, 'r', encoding='utf-8') as f:
            txt_content = f.read()

        # 2. Parse TXT for detailed CVE info
        print("🔍 Parsing CVE details from TXT...")
        txt_cve_details = parse_txt_cve_details(txt_content)

        # 3. Merge JSON and TXT data
        print("🔗 Merging JSON and TXT data...")
        complete_vulnerabilities = merge_json_and_txt_data(scan_data_json, txt_cve_details)

        # Update scan data with complete vulnerabilities
        scan_data_json['complete_vulnerabilities'] = complete_vulnerabilities

        # 4. Calculate metrics
        print("📈 Calculating severity metrics...")
        severity_counts = calculate_severity_counts(complete_vulnerabilities)

        # 5. Generate GPT-powered sections
        print("🤖 Generating AI-powered analysis sections...")
        gpt_sections = {}

        # Executive Summary
        print("  ✍️  Executive Summary...")
        gpt_sections['executive_summary'] = generate_executive_summary(
            scan_data_json, txt_content
        )

        # Methodology
        print("  ✍️  Methodology Section...")
        gpt_sections['methodology'] = generate_methodology_section(scan_data_json)

        # Technical Summary
        print("  ✍️  Technical Summary...")
        gpt_sections['technical_summary'] = generate_technical_summary(
            scan_data_json.get('services', []),
            complete_vulnerabilities
        )

        # Detailed vulnerability analysis for each CVE
        print("  ✍️  Detailed Vulnerability Analysis...")
        gpt_sections['vulnerability_details'] = []
        for vuln in complete_vulnerabilities:
            if vuln.get('severity', '').lower() in ['critical', 'high']:
                print(f"    🔎 Analyzing {vuln.get('cve_id', 'Unknown')}...")
                txt_details = txt_cve_details.get(vuln.get('cve_id', ''), {})
                txt_details_str = json.dumps(txt_details, indent=2)

                vuln_analysis = generate_detailed_vulnerability_analysis(
                    vuln,
                    txt_details_str,
                    scan_data_json.get('summary', {})
                )
                gpt_sections['vulnerability_details'].append(vuln_analysis)

        # Compliance Assessment
        print("  ✍️  Compliance Assessment...")
        gpt_sections['compliance'] = generate_compliance_assessment(
            scan_data_json,
            complete_vulnerabilities
        )

        # Remediation Roadmap
        print("  ✍️  Remediation Roadmap...")
        gpt_sections['remediation'] = generate_remediation_roadmap(
            scan_data_json,
            complete_vulnerabilities
        )

        # 6. Generate charts (keep as Drawing objects, no PNG conversion)
        print("📊 Generating visual charts...")
        charts = {
            'severity_pie': create_severity_pie_chart(severity_counts),
            'risk_gauge': create_risk_gauge(
                scan_data_json.get('summary', {}).get('risk_score', 5),
                scan_data_json.get('summary', {}).get('risk_level', 'medium')
            ),
            'cvss_distribution': create_cvss_distribution_chart(complete_vulnerabilities),
            'port_distribution': create_port_distribution_chart(
                scan_data_json.get('services', [])
            ),
            'exploit_availability': create_exploit_availability_chart(complete_vulnerabilities)
        }

        print("✅ Charts generated (will be embedded directly in PDF)")

        gpt_sections['charts'] = charts

        # 7. Generate final PDF
        print("📄 Generating professional PDF report...")
        result = generate_professional_pdf(
            scan_data_json,
            txt_content,
            gpt_sections,
            output_pdf_path
        )

        if result['status'] == 'success':
            print(f"✅ Report generated successfully: {output_pdf_path}")
            print(f"📁 File size: {os.path.getsize(output_pdf_path) / 1024:.2f} KB")

            return {
                "status": "success",
                "message": "ISO-standard security report generated successfully",
                "pdf_path": output_pdf_path,
                "pdf_file": os.path.basename(output_pdf_path),
                "sections_generated": list(gpt_sections.keys()),
                "total_vulnerabilities": len(complete_vulnerabilities),
                "severity_breakdown": severity_counts
            }
        else:
            return result

    except Exception as e:
        print(f"❌ Report generation failed: {str(e)}")
        import traceback
        traceback.print_exc()
        return {
            "status": "error",
            "message": f"Report generation failed: {str(e)}"
        }


# Convenience function for backward compatibility
def generate_full_report(txt_content):
    """
    Legacy function for backward compatibility
    Generates markdown report (old style)

    Use generate_iso_standard_report() for new ISO reports
    """
    print("⚠️  Using legacy report generation. Consider using generate_iso_standard_report() instead.")

    # For now, return a simple markdown summary
    return f"""
# Security Assessment Report

## Summary
This report was generated from scan data.

{txt_content[:1000]}

... (truncated)

---
*For complete ISO-standard reports with charts and professional formatting,*
*use the generate_iso_standard_report() function instead.*
"""