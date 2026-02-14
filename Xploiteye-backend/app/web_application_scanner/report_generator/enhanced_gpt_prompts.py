import os
import asyncio
from groq import AsyncGroq
from dotenv import load_dotenv

load_dotenv()

# Use Async client to prevent blocking the event loop
client = AsyncGroq(api_key=os.getenv("GROQ_API_KEY"))
MODEL_NAME = os.getenv("GROQ_MODEL", "llama-3.3-70b-versatile")

async def _call_groq(prompt, system_content="You are a Lead ISO 27001 Security Auditor."):
    """Helper to call Groq with error handling."""
    try:
        completion = await client.chat.completions.create(
            messages=[
                {"role": "system", "content": system_content},
                {"role": "user", "content": prompt}
            ],
            model=MODEL_NAME,
            temperature=0.3,
            max_tokens=2048,
        )
        return completion.choices[0].message.content
    except Exception as e:
        import logging
        logging.error(f"AI Analysis failed: {e}")
        return f"Analysis generation failed: {str(e)}"

async def generate_executive_summary(scan_data):
    prompt = f"""
    Write a SINGLE, POWERFUL, and PROFESSIONAL Executive Summary paragraph for the security assessment of {scan_data.get('target')}.
    
    Context:
    - Target: {scan_data.get('target')}
    - Findings: {len(scan_data.get('findings', []))}
    - Key Risks: {scan_data.get('risk_level', 'High')}
    
    Instructions:
    - Write exactly ONE paragraph (approx 150-200 words).
    - Summarize the overall security posture, key risks, and business impact.
    - Do NOT use bullet points or lists in this section.
    - Tone: Authoritative, C-level appropriate.
    """
    return await _call_groq(prompt)

async def generate_compliance_mapping(scan_data):
    prompt = f"""
    Perform a RIGOROUS ISO 27001:2022 Annex A Control Gap Analysis for {scan_data.get('target')}.
    Findings: {scan_data.get('findings')}
    
    CRITICAL INSTRUCTIONS:
    - DO NOT USE MARKDOWN TABLES.
    - Break analysis into detailed sub-sections for:
      #### A.8.8 Management of technical vulnerabilities
      #### A.12.6 Technical vulnerability management
      #### A.10.1 Cryptographic controls
      #### A.14.2 Security in development
    - For each, provide a "Current State", "Evidence of Failure", and "Corrective Action" narrative.
    """
    return await _call_groq(prompt, system_content="You are a Senior ISO 27001 Lead Auditor.")

async def generate_remediation_roadmap(scan_data):
    prompt = f"""
    Develop a COMPREHENSIVE 90-day Strategic Remediation Roadmap for {scan_data.get('target')}.
    Findings: {scan_data.get('findings')}
    
    CRITICAL INSTRUCTIONS:
    - DO NOT USE MARKDOWN TABLES.
    - Break into 10-15 specific project workstreams.
    - For each workstream, use a Section and then Bullets for Action Items, Owners, and Verification.
    """
    return await _call_groq(prompt)

async def generate_finding_deep_dive(finding, target):
    """Generates a deep dive for a single finding."""
    prompt = f"""
    Perform a professional technical deep-dive for this vulnerability on {target}:
    
    Vulnerability: {finding.get('title')}
    Severity: {finding.get('severity')}
    CVE: {finding.get('cve_id')}
    Description: {finding.get('description')}
    
    Produce a report section with EXACTLY these four headings:
    
    ### 1. Risk Assessment
    [Brief analysis of why this is risky, including Likelihood and Impact]
    
    ### 2. Attack Vector
    [1-2 paragraphs explaining how an attacker would exploit this. Do not use code blocks, use narrative or inline code if needed.]
    
    ### 3. Mitigation Strategy
    [Specific technical remediation steps (e.g., config changes, patches).]
    
    ### 4. CVE Context
    [Brief context on the CVE references and affected versions.]
    
    CRITICAL: 
    - NO Markdown Tables.
    - Use bullet points where appropriate under headings.
    - Keep it strictly technical but readable.
    """
    return await _call_groq(prompt, system_content="You are a Senior Security Analyst.")

def generate_ai_analysis(scan_data):
    # This is kept for backward compatibility if needed, 
    # but orchestrator should use the async versions now.
    return "Please use specialized async generators."
