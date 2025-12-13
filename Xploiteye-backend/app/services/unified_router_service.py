"""
Unified Router Service - Smart routing between Chatbot and RAG
"""

import logging
from typing import Dict, Optional, List
from langchain_openai import ChatOpenAI
from langchain_core.messages import HumanMessage, SystemMessage

logger = logging.getLogger(__name__)


class UnifiedChatRouter:
    """Smart router for Chatbot and RAG"""

    def __init__(self, openai_api_key: Optional[str] = None):
        import os
        self.openai_api_key = openai_api_key or os.getenv('OPENAI_API_KEY')

        self.classifier_llm = ChatOpenAI(
            model="gpt-4o-mini",
            temperature=0,
            openai_api_key=self.openai_api_key
        )

        # Keywords for routing - XploitEye Edition
        self.pdf_keywords = [
            "report", "pdf", "file", "uploaded", "scan report",
            "vulnerability", "vulnerabilities", "cve", "threat",
            "finding", "findings", "issue", "issues", "result",
            "this report", "my report", "the report", "scan result",
            "port", "service", "target", "exploit attempt"
        ]

        self.rag_keywords = [
            "xploiteye", "how to", "how do i", "how does",
            "network scan", "web scan", "vulnerability scan", "penetration",
            "network discovery", "port discovery", "exploit", "feature",
            "setup", "install", "configure", "target validation",
            "red agent", "blue agent", "remediation", "payload",
            "msf", "metasploit", "cve search", "exploitation"
        ]

    def classify_intent(
        self,
        query: str,
        has_pdf: bool,
        recent_history: Optional[List[Dict]] = None,
        forced_route: Optional[str] = None
    ) -> str:
        """Classify query intent and route accordingly"""

        # Override with forced route
        if forced_route in ("pdf", "rag"):
            logger.info(f"🔀 Forced route: {forced_route}")
            return forced_route

        query_lower = query.lower()

        # Rule 1: No PDF → always RAG
        if not has_pdf:
            logger.info("🔀 Route: RAG (no PDF)")
            return "rag"

        # Rule 2: PDF keywords → CHATBOT
        if any(kw in query_lower for kw in self.pdf_keywords):
            logger.info("🔀 Route: PDF (keyword match)")
            return "pdf"

        # Rule 3: RAG keywords → RAG
        if any(kw in query_lower for kw in self.rag_keywords):
            logger.info("🔀 Route: RAG (keyword match)")
            return "rag"

        # Rule 4: Check recent context
        if recent_history:
            recent_routes = [
                msg.get("route", "rag")
                for msg in recent_history[-3:]
                if msg.get("role") == "assistant"
            ]
            if recent_routes and recent_routes[-1] == "pdf":
                logger.info("🔀 Route: PDF (context continuation)")
                return "pdf"

        # Rule 5: Use LLM for ambiguous cases
        try:
            prompt = ChatPromptTemplate.from_messages([
                (
                    "system",
                    """Classify if this query is about:
1. A SPECIFIC uploaded PDF/report (answer 'pdf')
2. General SherlockDroid documentation/features (answer 'rag')

Respond with ONLY 'pdf' or 'rag'."""
                ),
                ("human", f"Query: {query}")
            ])

            from langchain_core.prompts import ChatPromptTemplate
            response = self.classifier_llm.invoke([
                SystemMessage(content="Classify the query intent. Answer only with 'pdf' or 'rag'."),
                HumanMessage(content=query)
            ])

            route = response.content.strip().lower()
            if route in ("pdf", "rag"):
                logger.info(f"🔀 Route: {route} (LLM classification)")
                return route
        except Exception as e:
            logger.warning(f"LLM classification failed: {str(e)}")

        # Default: RAG if ambiguous
        logger.info("🔀 Route: RAG (default)")
        return "rag"

    def analyze_query(self, query: str) -> Dict:
        """Analyze query for context"""
        return {
            "query_length": len(query),
            "has_pdf_keywords": any(kw in query.lower() for kw in self.pdf_keywords),
            "has_rag_keywords": any(kw in query.lower() for kw in self.rag_keywords),
            "question_mark": "?" in query,
            "capitalized": query[0].isupper() if query else False
        }
