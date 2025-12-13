"""
Mobile Security PDF Analysis Chatbot
Handles static/dynamic analysis reports for Android APKs
"""

import os
from typing import Optional, Dict, List
from langchain_openai import ChatOpenAI
from langchain_core.messages import HumanMessage, SystemMessage, AIMessage
from langchain_community.document_loaders import PyPDFLoader
import tempfile


class SecurityPDFChatbot:
    """
    Chatbot for analyzing mobile security reports (static/dynamic analysis of APKs)
    """
    
    def __init__(self, openai_api_key: str, model: str = "gpt-4o-mini"):
        """
        Initialize the chatbot with OpenAI credentials
        
        Args:
            openai_api_key: Your OpenAI API key
            model: OpenAI model to use (default: gpt-4o-mini)
        """
        self.llm = ChatOpenAI(
            model=model,
            temperature=0.1,  # Very low temperature to stay strictly within PDF content
            openai_api_key=openai_api_key
        )
        self.pdf_content = None
        self.conversation_history: List = []
        
    def load_pdf_from_bytes(self, pdf_bytes: bytes, filename: str = "uploaded.pdf") -> str:
        """
        Load PDF from bytes (useful for file uploads from frontend)
        
        Args:
            pdf_bytes: PDF file as bytes
            filename: Optional filename for the temporary file
            
        Returns:
            Extracted text content from PDF
        """
        try:
            # Create temporary file
            with tempfile.NamedTemporaryFile(delete=False, suffix='.pdf') as tmp_file:
                tmp_file.write(pdf_bytes)
                tmp_path = tmp_file.name
            
            # Load the PDF
            loader = PyPDFLoader(tmp_path)
            pages = loader.load()
            
            # Combine all pages into single text
            self.pdf_content = "\n\n".join([page.page_content for page in pages])
            
            # Clean up temporary file
            os.unlink(tmp_path)
            
            return self.pdf_content
        except Exception as e:
            raise Exception(f"Error loading PDF from bytes: {str(e)}")
    
    def _get_system_prompt(self) -> str:
        """
        Create comprehensive system prompt for mobile security analysis
        
        Returns:
            System prompt string
        """
        return """You are an expert mobile security analyst and educator specializing in Android application security. Your role is to EXPLAIN and SIMPLIFY complex security findings from the provided security report.

**CRITICAL RULE - YOU MUST FOLLOW THIS:**
🚨 You can ONLY answer questions using information found in the security report provided below. 
🚨 If the information is NOT in the report, you MUST respond with: "I couldn't find information about [topic] in this security report. Please ask about the vulnerabilities, findings, or security issues that are documented in the uploaded report."
🚨 DO NOT use your general knowledge about security or Android unless it's to EXPLAIN something that IS in the report.

**Your Communication Style:**
- NEVER copy-paste raw text from the report
- Always EXPLAIN concepts in your own words
- Use clear headings with ## or ### markdown
- Break down complex findings into digestible sections
- Summarize multiple related issues together
- Make it understandable for both technical and non-technical users

**Response Format - Use This Structure:**

When answering about vulnerabilities or security issues, format like this:

## [Category/Topic]

**What I Found:**
[Brief 1-2 sentence summary in plain English]

**Why This Matters:**
[Explain the security impact - what could go wrong?]

**Details from the Report:**
- [Key finding 1 - explained simply]
- [Key finding 2 - explained simply]
- [Key finding 3 - explained simply]

**What You Should Do:**
[Practical, clear steps to fix the issue]

---

**Response Guidelines:**
✅ DO:
- Use clear section headings (##, ###)
- Explain findings in plain English first, then add technical details
- Group related vulnerabilities together
- Prioritize by severity (Critical → High → Medium → Low)
- Use bullet points for lists
- Add brief explanations for technical terms
- Keep explanations concise but complete
- Use bold (**text**) for emphasis on important terms

❌ DON'T:
- Copy exact sentences from the report
- Use technical jargon without explanation
- List issues without context or priority
- Answer questions about things NOT in the report
- Give vague advice like "improve security"
- Use complex security terminology without defining it first

**Example GOOD Response:**

## Critical Security Concerns

**What I Found:**
The analysis revealed 3 critical vulnerabilities that could allow attackers to compromise user data and app functionality.

**Why This Matters:**
These issues could let malicious actors steal sensitive information, modify app behavior, or gain unauthorized access to user accounts.

**Details from the Report:**

### 1. Debuggable Mode Enabled
- The app can be debugged in production
- **Impact**: Attackers can attach tools to inspect memory and steal data
- **Severity**: Critical

### 2. Insecure Data Storage
- Sensitive data stored without encryption
- **Impact**: If device is compromised, data is easily readable
- **Severity**: High

### 3. Weak Network Security
- App accepts untrusted SSL certificates
- **Impact**: Man-in-the-middle attacks possible
- **Severity**: High

**What You Should Do:**
1. Disable debuggable flag in AndroidManifest.xml
2. Encrypt sensitive data using Android Keystore
3. Implement certificate pinning for network connections

---

**Example BAD Response:**
"The application has android:debuggable set to true. This is a security vulnerability. CWE-489. CVSS Score: 7.5..."

**Remember:**
- Always check if the answer is in the report FIRST
- If not in report → tell the user it's not there
- If in report → explain it clearly with structure
- Make complex security concepts simple
- Use headings and formatting for readability

**Document Content:**
The security analysis report is provided below. This is your ONLY source of truth - answer ONLY from this content.
"""

    def ask(self, user_query: str) -> Dict[str, str]:
        """
        Ask a question about the loaded PDF with strict content validation
        
        Args:
            user_query: User's question
            
        Returns:
            Dictionary with 'question' and 'answer' keys
        """
        if not self.pdf_content:
            raise ValueError("No PDF loaded. Please upload a PDF first.")
        
        # Prepare messages
        messages = []
        
        # Add system prompt with PDF content
        system_content = f"{self._get_system_prompt()}\n\n---REPORT CONTENT---\n{self.pdf_content}\n---END REPORT---"
        messages.append(SystemMessage(content=system_content))
        
        # Add conversation history for context
        if self.conversation_history:
            messages.extend(self.conversation_history)
        
        # Enhance user query with explicit instruction to check PDF content
        enhanced_query = f"""{user_query}

[SYSTEM INSTRUCTION: First check if this information exists in the security report above. If NOT found in the report, you must say "I couldn't find information about [topic] in this security report." Only answer if the information IS in the report, and explain it clearly using the format structure provided.]"""
        
        # Add current user query
        messages.append(HumanMessage(content=enhanced_query))
        
        # Get response from LLM
        try:
            response = self.llm.invoke(messages)
            answer = response.content
            
            # Post-process: Ensure response is well-formatted and not just copied text
            answer = self._post_process_answer(answer, user_query)
            
            # Update conversation history (with original query, not enhanced)
            self.conversation_history.append(HumanMessage(content=user_query))
            self.conversation_history.append(AIMessage(content=answer))
            
            return {
                "question": user_query,
                "answer": answer
            }
        except Exception as e:
            raise Exception(f"Error getting response from LLM: {str(e)}")
    
    def _post_process_answer(self, answer: str, query: str) -> str:
        """
        Post-process the answer to ensure quality and add helpful context
        
        Args:
            answer: Raw answer from LLM
            query: Original user query
            
        Returns:
            Enhanced answer with better formatting
        """
        # Check if LLM indicated information not found
        not_found_indicators = [
            "i couldn't find",
            "i could not find", 
            "couldn't find information",
            "not found in",
            "doesn't contain",
            "does not contain",
            "no information about",
            "not mentioned in"
        ]
        
        answer_lower = answer.lower()
        info_not_in_pdf = any(indicator in answer_lower for indicator in not_found_indicators)
        
        if info_not_in_pdf:
            # Information not in PDF - provide helpful response
            return f"""## Information Not Found in Report

I couldn't find specific information about "{query}" in the uploaded security report.

**What I can help with:**
- Security vulnerabilities and findings documented in the report
- Risk assessment of identified issues
- Remediation recommendations for the reported vulnerabilities
- Specific details about threats and security concerns mentioned in the report

💡 **Tip**: Try asking about specific security issues, vulnerabilities, or findings that are in the report. Or ask me to summarize what security concerns were found."""
        
        # Add a header if the answer doesn't have one
        if not answer.strip().startswith('#'):
            # Check if it's a short answer (might be a direct response)
            if len(answer) < 200 and '\n' not in answer[:100]:
                answer = f"## Answer\n\n{answer}"
        
        return answer
    
    def get_conversation_history(self) -> List[Dict[str, str]]:
        """
        Get formatted conversation history
        
        Returns:
            List of conversation turns with role and content
        """
        history = []
        for msg in self.conversation_history:
            if isinstance(msg, HumanMessage):
                history.append({"role": "user", "content": msg.content})
            elif isinstance(msg, AIMessage):
                history.append({"role": "assistant", "content": msg.content})
        return history
    
    def clear_history(self):
        """Clear conversation history"""
        self.conversation_history = []
    
    def reset(self):
        """Reset chatbot state (clear PDF content and history)"""
        self.pdf_content = None
        self.conversation_history = []