"""
Chatbot Service - FastAPI compatible wrapper for PDF analysis
"""

import os
import uuid
from typing import Dict, List, Optional
from langchain_openai import ChatOpenAI
from langchain_core.messages import HumanMessage, SystemMessage, AIMessage
from langchain_community.document_loaders import PyPDFLoader
import tempfile
import logging

logger = logging.getLogger(__name__)


class SecurityPDFChatbot:
    """Chatbot for analyzing XploitEye scan and exploitation reports (PDF)"""

    def __init__(self, openai_api_key: str, model: str = "gpt-4o-mini"):
        self.llm = ChatOpenAI(
            model=model,
            temperature=0.1,
            openai_api_key=openai_api_key
        )
        self.pdf_content = None
        self.conversation_history: List = []

    def load_pdf_from_bytes(self, pdf_bytes: bytes, filename: str = "uploaded.pdf") -> str:
        """Load PDF from bytes"""
        try:
            with tempfile.NamedTemporaryFile(delete=False, suffix='.pdf') as tmp_file:
                tmp_file.write(pdf_bytes)
                tmp_path = tmp_file.name

            loader = PyPDFLoader(tmp_path)
            pages = loader.load()
            self.pdf_content = "\n\n".join([page.page_content for page in pages])

            os.unlink(tmp_path)
            return self.pdf_content
        except Exception as e:
            raise Exception(f"Error loading PDF: {str(e)}")

    def _get_system_prompt(self) -> str:
        """Get system prompt for XploitEye scan report analysis"""
        return """You are an expert XploitEye penetration testing analyst specializing in vulnerability assessment and exploitation findings.

Your role: Analyze XploitEye scan and exploitation reports. ONLY answer questions using information from the report below.

🚨 CRITICAL RULE - YOU MUST FOLLOW THIS:
- You can ONLY answer questions using information found in the XploitEye report provided below
- If information is NOT in the report, respond with: "I couldn't find information about [topic] in this XploitEye report. Please ask about vulnerabilities, CVEs, exploitable ports, or findings documented in the uploaded report."
- DO NOT use general knowledge unless explaining something that IS in the report

**Your Communication Style:**
- NEVER copy-paste raw text from the report
- Always EXPLAIN findings in your own words
- Use clear headings with ## or ### markdown
- Break down complex vulnerabilities into digestible sections
- Prioritize by severity (Critical → High → Medium → Low)

**Response Format for Vulnerabilities:**

## [Vulnerability/Finding Name]

**What I Found:**
[Brief 1-2 sentence summary in plain English]

**Severity Level:** [Critical/High/Medium/Low]

**Why This Matters:**
[Explain the security impact - what could attackers do?]

**Details from XploitEye Report:**
- [Finding 1 - explained simply]
- [CVEs/Exploits associated - if any]

**Remediation Steps:**
[Practical steps to fix the vulnerability]

---

Remember: Check if the answer is in the XploitEye report FIRST. Only answer if information IS present in the report.
"""

    def ask(self, user_query: str) -> Dict[str, str]:
        """Ask a question about the loaded XploitEye scan/exploitation report PDF"""
        if not self.pdf_content:
            raise ValueError("No PDF loaded. Please upload a PDF first.")

        messages = []
        system_content = f"{self._get_system_prompt()}\n\n---REPORT---\n{self.pdf_content}\n---END---"
        messages.append(SystemMessage(content=system_content))

        if self.conversation_history:
            messages.extend(self.conversation_history)

        messages.append(HumanMessage(content=user_query))

        try:
            response = self.llm.invoke(messages)
            answer = response.content

            self.conversation_history.append(HumanMessage(content=user_query))
            self.conversation_history.append(AIMessage(content=answer))

            return {"question": user_query, "answer": answer}
        except Exception as e:
            raise Exception(f"LLM error: {str(e)}")

    def get_conversation_history(self) -> List[Dict[str, str]]:
        """Get formatted conversation history"""
        history = []
        for msg in self.conversation_history:
            if isinstance(msg, HumanMessage):
                history.append({"role": "user", "content": msg.content})
            elif isinstance(msg, AIMessage):
                history.append({"role": "assistant", "content": msg.content})
        return history

    def reset(self):
        """Reset chatbot state"""
        self.pdf_content = None
        self.conversation_history = []
