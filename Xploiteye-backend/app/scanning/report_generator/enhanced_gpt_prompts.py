"""
Enhanced GPT-3.5-turbo Prompts for Professional Security Reports
Written from a Senior Security Consultant perspective
"""

import openai
import os
import json
from dotenv import load_dotenv

load_dotenv()
openai.api_key = os.getenv("OPENAI_API_KEY")


def call_gpt(prompt, content, max_tokens=3000):
    """
    Call GPT-3.5-turbo with security expert system prompt

    Args:
        prompt: The specific task prompt
        content: The scan data/content to analyze
        max_tokens: Maximum tokens for response

    Returns:
        str: GPT response content
    """
    try:
        response = openai.chat.completions.create(
            model="gpt-3.5-turbo",
            messages=[
                {
                    "role": "system",
                    "content": "You are a CISSP-certified Senior Security Consultant with 15+ years of experience in vulnerability assessment and penetration testing. You write professional, board-ready security reports following ISO 27001 and NIST standards. Your tone is authoritative, technical, and business-focused."
                },
                {
                    "role": "user",
                    "content": f"{prompt}\n\nData to analyze:\n{content}"
                }
            ],
            temperature=0.3,
            max_tokens=max_tokens
        )
        return response.choices[0].message.content.strip()
    except Exception as e:
        print(f"GPT Error: {str(e)}")
        return f"Error generating content: {str(e)}"


def generate_executive_summary(scan_data_json, txt_content):
    """
    Generate comprehensive executive summary for C-level audience

    Args:
        scan_data_json: JSON object with scan results
        txt_content: Raw TXT file content with CVE details

    Returns:
        str: Markdown formatted executive summary
    """
    prompt = f"""
As a Senior Security Consultant, write a comprehensive Executive Summary for the following vulnerability assessment.

TARGET SYSTEM:
- IP Address: {scan_data_json.get('summary', {}).get('target', 'N/A')}
- Scan Type: {scan_data_json.get('summary', {}).get('scan_type', 'N/A').upper()}
- Operating System: {scan_data_json.get('os_information', {}).get('name', 'Unknown')}
- Assessment Date: {scan_data_json.get('summary', {}).get('timestamp', 'N/A')}

KEY METRICS:
- Ports Scanned: {scan_data_json.get('summary', {}).get('ports_scanned', 0)}
- Open Ports: {scan_data_json.get('summary', {}).get('open_ports', 0)}
- Vulnerabilities Found: {scan_data_json.get('summary', {}).get('cves_found', 0)}
- Risk Score: {scan_data_json.get('summary', {}).get('risk_score', 0)}/10
- Risk Level: {scan_data_json.get('summary', {}).get('risk_level', 'Unknown').upper()}

STRUCTURE YOUR RESPONSE AS FOLLOWS:

## Executive Summary

### Assessment Overview
Write 2-3 paragraphs covering:
- Purpose and scope of this security assessment
- Methodology used (mention OWASP and NIST alignment)
- Key objectives achieved

### Overall Security Posture
Provide a frank assessment in 3-4 paragraphs:
- Current security state of the target system
- Comparison against industry best practices
- Exposure to external threats
- Business risk implications

### Critical Findings Summary
Create a professional summary table of findings by severity.

### Key Vulnerabilities Requiring Immediate Attention
List the top 3-5 most critical vulnerabilities found. For each:
- CVE ID and vulnerability name
- Affected service and port
- CVSS score and severity
- Why this is critical from a business perspective
- Immediate risk to organization

### Compliance Impact
Discuss:
- ISO 27001 control failures identified
- Industry compliance gaps (if any)
- Regulatory exposure

### Strategic Recommendations
Provide high-level remediation roadmap:
- Immediate actions (0-7 days)
- Short-term improvements (7-30 days)
- Long-term security enhancements (30-90 days)

IMPORTANT:
- Use professional, authoritative language
- Focus on business impact, not just technical details
- Quantify risks where possible
- Be specific and actionable
- Format using proper markdown with headers and bullet points
"""

    # Limit txt_content to avoid token overflow
    txt_preview = txt_content[:4000] if len(txt_content) > 4000 else txt_content

    return call_gpt(prompt, txt_preview, max_tokens=3000)


def generate_methodology_section(scan_data_json):
    """
    Generate assessment methodology section

    Args:
        scan_data_json: JSON object with scan results

    Returns:
        str: Markdown formatted methodology section
    """
    prompt = f"""
As a Senior Security Consultant, document the assessment methodology used in this security evaluation.

ASSESSMENT DETAILS:
- Target: {scan_data_json.get('summary', {}).get('target', 'N/A')}
- Scan Type: {scan_data_json.get('summary', {}).get('scan_type', 'N/A').upper()}
- Duration: {scan_data_json.get('summary', {}).get('scan_duration', 0)} seconds
- Port Range: {scan_data_json.get('scan_coverage', {}).get('port_range', 'N/A')}
- Techniques: {', '.join(scan_data_json.get('scan_coverage', {}).get('scan_techniques', []))}

Create a comprehensive methodology section with these subsections:

## Assessment Methodology

### Scope Definition
- Clearly define what was assessed
- Specify IP addresses, port ranges, and services in scope
- Note any exclusions or limitations

### Testing Approach
- Describe the methodology (mention alignment with PTES, OWASP, NIST SP 800-115)
- Explain why this approach was chosen
- Detail the testing phases

### Tools and Techniques
- List primary tools used (Nmap, VulnX, CVE databases)
- Explain each technique:
  * Port scanning methodology
  * Service version detection
  * OS fingerprinting
  * CVE correlation and lookup
  * Risk assessment methodology

### Testing Timeline
- Assessment start time
- Duration
- Completion time
- Note: This is a point-in-time assessment

### Limitations and Assumptions
- Non-intrusive testing only
- No authentication or credentials used
- No exploitation of vulnerabilities performed
- Results reflect system state at time of scan
- Assumes target system configuration unchanged during scan

IMPORTANT:
- Write in professional, technical language
- Be specific about what was and wasn't done
- Use proper security industry terminology
- Format with clear markdown headers
"""

    return call_gpt(prompt, "", max_tokens=2000)


def generate_detailed_vulnerability_analysis(vuln, txt_cve_details, scan_summary):
    """
    Generate detailed analysis for a single vulnerability

    Args:
        vuln: Vulnerability dict from JSON
        txt_cve_details: Extracted details from TXT file for this CVE
        scan_summary: Overall scan summary for context

    Returns:
        str: Markdown formatted detailed vulnerability analysis
    """
    prompt = f"""
As a Senior Penetration Tester, provide a comprehensive technical analysis for this vulnerability.

VULNERABILITY DATA:
- CVE ID: {vuln.get('cve_id', 'N/A')}
- Severity: {vuln.get('severity', 'N/A').upper()}
- CVSS Score: {vuln.get('cvss_score', 'N/A')}
- Affected Port: {vuln.get('port', 'N/A')}
- Service: {vuln.get('service', 'N/A')}
- Target System: {scan_summary.get('target', 'N/A')}
- Operating System: {scan_summary.get('os', 'Unknown')}

DETAILED CVE INFORMATION FROM DATABASE:
{txt_cve_details}

Create a detailed vulnerability finding with this EXACT structure:

### Finding: {vuln.get('cve_id', 'N/A')} - [Vulnerability Name]

**Severity Classification**
- **Severity:** {vuln.get('severity', 'N/A').upper()}
- **CVSS v3.1 Score:** {vuln.get('cvss_score', 'N/A')}
- **Risk Rating:** [Calculate: Critical/High/Medium/Low based on CVSS]

**Affected Asset**
- **IP Address:** {scan_summary.get('target', 'N/A')}
- **Port/Service:** {vuln.get('port', 'N/A')}/{vuln.get('service', 'N/A')}
- **Operating System:** {scan_summary.get('os', 'Unknown')}
- **Asset Criticality:** [Assess based on service type]

**CVSS v3.1 Breakdown**
Provide a detailed breakdown of the CVSS vector:
- **Attack Vector (AV):** [Network/Adjacent/Local/Physical]
- **Attack Complexity (AC):** [Low/High]
- **Privileges Required (PR):** [None/Low/High]
- **User Interaction (UI):** [None/Required]
- **Scope (S):** [Unchanged/Changed]
- **Confidentiality Impact (C):** [High/Low/None]
- **Integrity Impact (I):** [High/Low/None]
- **Availability Impact (A):** [High/Low/None]

**Vulnerability Description**
Write 6-8 sentences explaining:
- What is this vulnerability?
- What causes it (root cause)?
- How does the vulnerable code/configuration work?
- What are the technical mechanics of exploitation?

**Proof of Concept / Exploit Availability**
Analyze exploit availability based on the TXT data:
- Are public exploits available?
- Are there Metasploit modules?
- What tools can exploit this?
- Is it being actively exploited in the wild?

**Business Impact Assessment**
Write 5-6 sentences addressing:
- Worst-case scenario if exploited
- Potential financial impact
- Data breach risks
- Reputational damage
- Regulatory/compliance violations
- Customer/stakeholder impact

**Risk Rating Justification**
- **Likelihood:** [High/Medium/Low] - Justify based on exploit availability
- **Impact:** [High/Medium/Low] - Justify based on asset criticality
- **Overall Risk:** [Critical/High/Medium/Low]

**Recommended Remediation**

**Immediate Mitigation (0-24 hours):**
Provide temporary compensating controls while patching is planned.

**Permanent Fix (24-72 hours):**
- Specific patch version to install
- Exact configuration changes needed
- Commands to execute
- Service restart procedures

**Verification Steps:**
1. How to verify the fix
2. Re-scan commands
3. Functional testing
4. Rollback plan if issues

**Preventive Measures:**
- Long-term security improvements
- Patch management process
- Monitoring/detection rules
- Security hardening

**Remediation Metadata**
- **Priority:** [Critical/High/Medium/Low]
- **Timeline:** [Immediate/7 days/30 days/60 days]
- **Effort Estimate:** [X hours/days]
- **Required Resources:** [Teams/tools needed]

**References**
- CVE: https://nvd.nist.gov/vuln/detail/{vuln.get('cve_id', '')}
- [Additional relevant references]

IMPORTANT:
- Be extremely technical and detailed
- Use security industry terminology
- Provide actionable, specific remediation steps
- Write in a professional, authoritative tone
- Include real commands and version numbers where applicable
"""

    return call_gpt(prompt, "", max_tokens=3000)


def generate_compliance_assessment(scan_data_json, vulnerabilities):
    """
    Generate compliance and regulatory impact assessment

    Args:
        scan_data_json: JSON scan data
        vulnerabilities: List of vulnerabilities

    Returns:
        str: Markdown formatted compliance assessment
    """
    prompt = f"""
As a Senior Security Consultant specializing in compliance, assess the regulatory and compliance impact of these findings.

FINDINGS SUMMARY:
- Total Vulnerabilities: {len(vulnerabilities)}
- Critical: {sum(1 for v in vulnerabilities if v.get('severity') == 'critical')}
- High: {sum(1 for v in vulnerabilities if v.get('severity') == 'high')}
- Medium: {sum(1 for v in vulnerabilities if v.get('severity') == 'medium')}
- Low: {sum(1 for v in vulnerabilities if v.get('severity') == 'low')}

Create a compliance assessment with these sections:

## Compliance and Regulatory Impact

### ISO 27001:2022 Controls Assessment
Map the vulnerabilities to ISO 27001 controls. For each failed control:
- Control ID and name
- Current status (FAIL/PARTIAL/PASS)
- Affected vulnerabilities
- Remediation priority

Key controls to assess:
- A.8.8 - Management of Technical Vulnerabilities
- A.8.9 - Configuration Management
- A.5.23 - Information Security for Cloud Services
- A.8.16 - Monitoring Activities

### NIST Cybersecurity Framework Alignment
Assess performance against NIST CSF:
- **IDENTIFY:** Asset inventory and risk assessment
- **PROTECT:** Vulnerability management and patching
- **DETECT:** Continuous monitoring capabilities
- **RESPOND:** Incident response readiness
- **RECOVER:** Business continuity considerations

### CIS Controls Compliance
Evaluate against CIS Top 18 Critical Security Controls:
- Control 3: Data Protection
- Control 7: Continuous Vulnerability Management
- Control 12: Network Infrastructure Management
- Control 16: Application Software Security

### Industry-Specific Compliance Considerations
Based on the findings, assess potential compliance risks for:
- PCI-DSS (if payment systems affected)
- HIPAA (if healthcare data systems)
- GDPR (if EU personal data processing)
- SOC 2 (if service organization)

### Regulatory Exposure Summary
- Potential compliance violations identified
- Estimated regulatory risk level
- Recommended compliance actions

IMPORTANT:
- Be specific about which controls failed
- Reference actual ISO/NIST control numbers
- Provide actionable compliance recommendations
- Use professional compliance language
"""

    vuln_summary = json.dumps(vulnerabilities, indent=2)[:2000]  # Limit size

    return call_gpt(prompt, vuln_summary, max_tokens=2500)


def generate_remediation_roadmap(scan_data_json, vulnerabilities):
    """
    Generate prioritized remediation roadmap

    Args:
        scan_data_json: JSON scan data
        vulnerabilities: List of vulnerabilities

    Returns:
        str: Markdown formatted remediation roadmap
    """
    prompt = f"""
As a Senior Security Consultant, create a prioritized, actionable remediation roadmap.

VULNERABILITIES SUMMARY:
{json.dumps(vulnerabilities, indent=2)}

TARGET SYSTEM:
- IP: {scan_data_json.get('summary', {}).get('target', 'N/A')}
- Risk Level: {scan_data_json.get('summary', {}).get('risk_level', 'N/A').upper()}
- Risk Score: {scan_data_json.get('summary', {}).get('risk_score', 0)}/10

Create a comprehensive remediation roadmap with this structure:

## Remediation Roadmap

### Priority 1: Critical Actions (0-7 Days)

For each Critical and High severity vulnerability, provide:
- **Task:** Fix [CVE-ID] - [Service Name]
- **Description:** Specific steps to remediate
- **Owner:** Responsible team (System Admin/Security Team/DevOps)
- **Effort:** Estimated hours/days
- **Dependencies:** Prerequisites or blockers
- **Success Criteria:** How to verify completion

### Priority 2: High-Priority Actions (7-30 Days)

For Medium severity vulnerabilities:
- Detailed remediation tasks
- Resource requirements
- Timeline estimates

### Priority 3: Strategic Improvements (30-90 Days)

Long-term security enhancements:
- Establish vulnerability management program
- Implement automated patching
- Deploy security monitoring (SIEM)
- Conduct security awareness training
- Regular penetration testing schedule

### Resource Requirements Table

Create a table:
| Task | Team | Effort | Cost Estimate | Priority |
|------|------|--------|---------------|----------|

### Implementation Checklist

Provide a step-by-step checklist for remediation:
- [ ] Back up configurations and data
- [ ] Review patches in vendor documentation
- [ ] Test patches in staging environment
- [ ] Schedule maintenance window
- [ ] Apply patches to production
- [ ] Verify successful patching
- [ ] Conduct re-scan to confirm resolution
- [ ] Update asset inventory and documentation
- [ ] Brief stakeholders on results

### Risk Acceptance

For vulnerabilities that cannot be immediately remediated:
- Document business justification
- Implement compensating controls
- Define risk acceptance criteria
- Schedule future remediation date

### Success Metrics

Define metrics to track remediation progress:
- Percentage of vulnerabilities remediated
- Mean time to remediate by severity
- Re-scan verification results
- Compliance control improvements

IMPORTANT:
- Prioritize by severity and exploitability
- Be specific and actionable
- Include realistic timelines
- Provide clear ownership assignments
- Use professional project management language
"""

    vuln_summary = json.dumps(vulnerabilities, indent=2)[:3000]

    return call_gpt(prompt, vuln_summary, max_tokens=3000)


def generate_technical_summary(services, vulnerabilities):
    """
    Generate technical findings summary

    Args:
        services: List of discovered services
        vulnerabilities: List of vulnerabilities

    Returns:
        str: Markdown formatted technical summary
    """
    prompt = f"""
As a Senior Penetration Tester, provide a technical summary of the assessment findings.

DISCOVERED SERVICES:
{json.dumps(services, indent=2)}

VULNERABILITIES:
{json.dumps(vulnerabilities, indent=2)}

Create a technical summary with these sections:

## Technical Findings Summary

### Network Architecture Overview
- Describe the target system's network posture
- Identify publicly exposed services
- Assess attack surface

### Open Ports and Services Analysis
For each significant service:
- Port number and protocol
- Service name and version
- Security assessment
- Recommended action

### Vulnerability Distribution
- Breakdown by severity
- Breakdown by service/port
- Exploitability assessment

### Attack Surface Analysis
- External exposure assessment
- Unnecessary services running
- Legacy/outdated software identified
- Weak configurations detected

### Key Technical Concerns
Highlight the most critical technical issues found:
1. Outdated software versions
2. Known vulnerable services
3. Insecure configurations
4. Missing security controls

IMPORTANT:
- Be technical but clear
- Focus on security implications
- Provide specific examples
- Use industry-standard terminology
"""

    return call_gpt(prompt, "", max_tokens=2500)