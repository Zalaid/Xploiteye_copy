import openai
import os
from dotenv import load_dotenv

load_dotenv()

openai.api_key = os.getenv("OPENAI_API_KEY")

def call_gpt(prompt, txt_content):
    """Call GPT-3.5-turbo with prompt and text content"""
    try:
        # Limit content size to prevent token overflow
        max_content = 8000
        if len(txt_content) > max_content:
            txt_content = txt_content[:max_content] + "... [content truncated]"

        response = openai.chat.completions.create(
            model="gpt-3.5-turbo",
            messages=[
                {"role": "system", "content": prompt},
                {"role": "user", "content": txt_content}
            ],
            temperature=0.3,
            max_tokens=2500
        )
        return response.choices[0].message.content
    except Exception as e:
        print(f"GPT Error: {str(e)}")
        # Return fallback content if GPT fails
        return f"## Error Processing Content\n\nUnable to generate analysis: {str(e)}\n\nOriginal content preview:\n{txt_content[:500]}..."

def generate_summary(txt_content):
    """Generate executive summary from scan report"""
    prompt = """You are a senior cybersecurity expert. Create a comprehensive executive summary from this security scan report.

    Write a detailed analysis covering:
    - Overall security posture assessment (2-3 paragraphs)
    - Total number of vulnerabilities categorized by severity with specific counts
    - Critical security findings and their business impact (detailed explanations)
    - Risk assessment and potential threat scenarios (specific attack vectors)
    - Network exposure analysis (detailed port and service analysis)
    - Compliance implications if applicable (detailed regulatory concerns)
    - Immediate priority actions required (specific actionable steps)

    Format as markdown with ## Executive Summary header. Write 8-10 detailed paragraphs with substantial content (minimum 150 words per paragraph). Be extremely thorough and professional - this summary should be comprehensive enough for executive decision-making. Include specific technical details, business impact assessments, and actionable recommendations. Make each paragraph rich with information and analysis."""

    return call_gpt(prompt, txt_content)

def generate_cve_table(txt_content):
    """Generate CVE table from scan report"""
    prompt = """Extract all CVE vulnerabilities from this security scan report and create a markdown table.

    Format as:
    ## CVE Vulnerabilities Found

    | CVE ID | Severity | Description | Port/Service | CVSS Score |
    |--------|----------|-------------|--------------|------------|
    | CVE-2020-1938 | Critical | Apache Tomcat AJP File Read/Inclusion | 8009/tcp | 9.8 |
    | CVE-2011-2523 | Critical | VSFTPD Backdoor Command Execution | 21/ftp | N/A |

    IMPORTANT RULES:
    1. Include ALL vulnerabilities found, even if no CVE ID exists
    2. If CVSS score is known, include it (0.0-10.0)
    3. If CVSS score is unknown, use "N/A" - DO NOT remove the vulnerability
    4. Use vulnerability names from scan if no CVE ID available
    5. Keep all findings - removing CVEs is not acceptable
    6. Provide descriptive but concise descriptions"""

    return call_gpt(prompt, txt_content)

def generate_vulnerability_details(txt_content):
    """Generate detailed vulnerability analysis"""
    prompt = """You are a principal security architect writing a formal report for a client. Analyze all vulnerabilities found in the provided security scan report and create an exhaustive, in-depth technical analysis for each major vulnerability.

    You MUST start your response with exactly this header:
    ## Vulnerability Analysis

    Then, for each critical and high severity vulnerability, provide the following sections using the specified format:

    1. CVE-XXXX-XXXX - Vulnerability Name
    Description: [Write an expert-level technical explanation of the vulnerability. Go into detail about the root cause, affected components, and the specific code or protocol flaw. Your explanation should be 5-7 sentences and assume a technical audience.]
    Impact: [Provide a detailed, business-oriented impact assessment. Describe the specific, worst-case scenarios for this client, including potential for data exfiltration, financial loss, reputational damage, and lateral movement within the network. This section must be 4-6 sentences.]
    Recommendation: [Write a comprehensive, actionable remediation plan. Provide specific, step-by-step instructions, including exact version numbers for patches, required configuration changes with code snippets where applicable, and post-remediation verification steps. This must be 5-8 detailed sentences.]

    CRITICAL REQUIREMENTS:
    - Your tone must be professional, authoritative, and deeply technical.
    - START with the "## Vulnerability Analysis" header. This is mandatory.
    - Number each CVE (1., 2., 3., etc.).
    - Use the labels "Description:", "Impact:", and "Recommendation:".
    - Make each section detailed and substantial as specified above.
    - Do not use any other markdown headers (like ###) within this section."""

    result = call_gpt(prompt, txt_content)

    # Ensure the header is present - add it if missing
    if not result.startswith("## Vulnerability Analysis"):
        result = "## Vulnerability Analysis\n\n" + result

    return result

def generate_severity_breakdown(txt_content):
    """Generate severity-based vulnerability breakdown"""
    prompt = """Categorize all vulnerabilities from this scan report by severity levels (Critical, High, Medium, Low).

    Format as markdown:
    ## Vulnerability Severity Breakdown

    ### Critical Severity
    - List critical vulnerabilities

    ### High Severity
    - List high severity vulnerabilities

    ### Medium Severity
    - List medium severity vulnerabilities

    ### Low Severity
    - List low severity vulnerabilities

    Include port numbers and brief descriptions."""

    return call_gpt(prompt, txt_content)

def generate_port_analysis(txt_content):
    """Generate open ports analysis table"""
    prompt = """Extract all open ports from this scan report and create a comprehensive analysis table.

    Format as:
    ## Open Ports Analysis

    | Port | Service | Version | Risk Level | Recommendations |
    |------|---------|---------|------------|-----------------|
    | ... | ... | ... | ... | ... |

    Assess risk level for each port and provide security recommendations."""

    return call_gpt(prompt, txt_content)

def generate_recommendations(txt_content):
    """Generate security recommendations"""
    prompt = """Based on this security scan report, provide comprehensive prioritized security recommendations.

    Format as:
    ## Security Recommendations

    ### Immediate Actions Required
    Provide 5-8 detailed critical items to fix immediately. Each item should include:
    - Specific vulnerability or issue to address
    - Detailed step-by-step remediation instructions (minimum 3-4 sentences per item)
    - Timeline expectations and priority level
    - Business impact if not addressed

    ### Short-term Improvements
    Provide 4-6 detailed high priority items. Each item should include:
    - Specific security improvement needed
    - Detailed implementation steps (minimum 3-4 sentences per item)
    - Expected timeline (1-4 weeks)
    - Resources required

    ### Long-term Security Enhancements
    Provide 3-5 detailed medium/low priority items. Each item should include:
    - Strategic security enhancement
    - Comprehensive implementation plan (minimum 4-5 sentences per item)
    - Timeline (1-6 months)
    - Cost considerations and ROI

    Be extremely specific and actionable. Each recommendation should be detailed enough to implement without additional research. Include specific tools, commands, configurations, and methodologies where applicable."""

    return call_gpt(prompt, txt_content)

def generate_full_report(txt_content):
    """Generate complete security report by combining all sections"""
    sections = []

    # Generate each section with first page title - updated for network security assessment
    sections.append("# \"Network Security Assessment Report\"\n")
    sections.append(generate_summary(txt_content))
    sections.append("\n" + generate_severity_breakdown(txt_content))
    sections.append("\n" + generate_cve_table(txt_content))
    sections.append("\n" + generate_port_analysis(txt_content))
    sections.append("\n" + generate_vulnerability_details(txt_content))
    sections.append("\n" + generate_recommendations(txt_content))

    return "\n".join(sections)