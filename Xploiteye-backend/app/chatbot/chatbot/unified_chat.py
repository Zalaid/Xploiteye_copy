"""
Unified Chat System - Smart Router for RAG + PDF Chatbot
Handles intelligent routing between general documentation queries and PDF-specific questions
"""
import os
import json
import logging
from typing import Dict, List, Optional, Any
from django.contrib.sessions.backends.db import SessionStore
from django.conf import settings

from langchain_openai import ChatOpenAI
from langchain_core.messages import HumanMessage, SystemMessage, AIMessage

from chatbot.pdf_chat import SecurityPDFChatbot
from rag.services.rag_retriever import RAGRetriever

logger = logging.getLogger(__name__)

# Initialize OpenAI API key from settings
OPENAI_API_KEY = os.getenv('OPENAI_API_KEY_2') or getattr(settings, 'OPENAI_API_KEY', None)

if not OPENAI_API_KEY:
    raise ValueError("OPENAI_API_KEY_2 not found. Set it in environment variables or Django settings.")


class UnifiedChatRouter:
    """
    Smart router that manages conversation between RAG and PDF chatbot
    """
    
    def __init__(self, openai_api_key: str):
        self.openai_api_key = openai_api_key
        self.classifier_llm = ChatOpenAI(
            model="gpt-4o-mini",
            temperature=0,
            openai_api_key=openai_api_key
        )
        
        # Keywords for quick routing
        self.pdf_keywords = [
            "document", "report", "pdf", "file", "uploaded",
            "this", "above", "it says", "my report", "my file",
            "vulnerability", "vulnerabilities", "threat", "security issue",
            "finding", "findings", "issue", "issues", "analysis result"
        ]
        
        self.rag_keywords = [
            "sherlockdroid", "how to", "how do i", "how does",
            "static analysis feature", "dynamic analysis feature",
            "frida feature", "network scan", "what is sherlockdroid",
            "how to use sherlockdroid", "setup", "install", "configure"
        ]
    
    def classify_intent(
        self,
        query: str,
        recent_history: List[Dict],
        has_pdf: bool,
        forced_route: Optional[str] = None
    ) -> str:
        """
        Determine if query should go to PDF chatbot or RAG.
        If forced_route is provided ('pdf' or 'rag'), it overrides all logic.
        Returns: 'pdf' or 'rag'
        """
        if forced_route in ("pdf", "rag"):
            logger.info(f"🔀 Route: Forced by client -> {forced_route}")
            return forced_route
        query_lower = query.lower()
        
        # Rule 1: No PDF uploaded → always RAG
        if not has_pdf:
            logger.info("🔀 Route: RAG (no PDF uploaded)")
            return 'rag'
        
        # Rule 2: Explicit PDF references
        if any(kw in query_lower for kw in self.pdf_keywords):
            logger.info(f"🔀 Route: PDF (keyword match)")
            return 'pdf'
        
        # Rule 3: Explicit SherlockDroid feature questions
        if any(kw in query_lower for kw in self.rag_keywords):
            logger.info(f"🔀 Route: RAG (keyword match)")
            return 'rag'
        
        # Rule 4: Context from recent history
        if recent_history:
            recent_routes = [
                msg.get('route', 'rag') 
                for msg in recent_history[-3:] 
                if msg.get('role') == 'assistant'
            ]
            
            if recent_routes and recent_routes[-1] == 'pdf':
                # Last conversation was about PDF, assume continuation
                logger.info("🔀 Route: PDF (context continuation)")
                return 'pdf'
        
        # Rule 5: Use LLM for ambiguous cases
        logger.info("🔀 Route: Using LLM classifier for ambiguous query")
        return self._llm_classify(query, recent_history)
    
    def _llm_classify(self, query: str, recent_history: List[Dict]) -> str:
        """
        Use LLM to classify ambiguous queries
        """
        recent_context = json.dumps(recent_history[-3:], indent=2) if recent_history else "No history"
        
        prompt = f"""You are a query router for SherlockDroid chatbot. Determine if the user's query is about:
- "pdf": The uploaded PDF security report (vulnerabilities, findings, threats in the report)
- "rag": General SherlockDroid platform features, how-to guides, documentation

Recent conversation:
{recent_context}

Current query: "{query}"

Consider:
- If asking about specific security findings/issues → pdf
- If asking how SherlockDroid works/features → rag
- If ambiguous and recent context was PDF → pdf
- If asking general "what/how" about the platform → rag

Respond with ONLY one word: pdf OR rag"""

        try:
            response = self.classifier_llm.invoke([HumanMessage(content=prompt)])
            intent = response.content.strip().lower()
            
            if intent not in ['pdf', 'rag']:
                logger.warning(f"Invalid LLM classification: {intent}, defaulting to rag")
                return 'rag'
            
            logger.info(f"🤖 LLM classified as: {intent}")
            return intent
            
        except Exception as e:
            logger.error(f"LLM classification failed: {e}, defaulting to rag")
            return 'rag'
    
    def process_query(
        self,
        session_id: str,
        query: str,
        session_data: Dict,
        forced_route: Optional[str] = None
    ) -> Dict[str, Any]:
        """
        Process user query through appropriate backend
        """
        has_pdf = session_data.get('has_pdf', False)
        unified_history = session_data.get('unified_history', [])
        
        # Classify intent
        intent = self.classify_intent(query, unified_history, has_pdf, forced_route)
        
        # Route to appropriate backend
        if intent == 'pdf':
            result = self._query_pdf_chatbot(session_id, query, session_data)
        else:
            result = self._query_rag(query, unified_history)
        
        # Add route metadata
        result['route'] = intent
        
        return result
    
    def _query_pdf_chatbot(
        self,
        session_id: str,
        query: str,
        session_data: Dict
    ) -> Dict[str, Any]:
        """
        Query the PDF chatbot backend with strict PDF-only content
        """
        try:
            # Check if PDF exists
            if not session_data.get('pdf_content'):
                return {
                    "answer": "⚠️ No PDF has been uploaded yet. Please upload a security report PDF to analyze it.",
                    "source": "pdf_chatbot",
                    "error": "No PDF content"
                }
            
            # Recreate PDF chatbot
            chatbot = SecurityPDFChatbot(openai_api_key=self.openai_api_key)
            chatbot.pdf_content = session_data.get('pdf_content')
            
            # Restore PDF-related conversation history
            for msg in session_data.get('unified_history', []):
                if msg.get('route') == 'pdf':  # Only restore PDF conversations
                    if msg['role'] == 'user':
                        chatbot.conversation_history.append(HumanMessage(content=msg['content']))
                    elif msg['role'] == 'assistant':
                        chatbot.conversation_history.append(AIMessage(content=msg['content']))
            
            # Ask question
            result = chatbot.ask(query)
            
            # Add metadata about PDF source
            pdf_filename = session_data.get('pdf_filename', 'Unknown')
            
            return {
                "answer": result['answer'],
                "source": "pdf_chatbot",
                "pdf_filename": pdf_filename
            }
            
        except Exception as e:
            logger.error(f"PDF chatbot query failed: {e}")
            return {
                "answer": "I encountered an error analyzing the PDF. Please try again.",
                "source": "pdf_chatbot",
                "error": str(e)
            }
    
    def _query_rag(
        self,
        query: str,
        unified_history: List[Dict]
    ) -> Dict[str, Any]:
        """
        Query the RAG backend
        """
        try:
            retriever = RAGRetriever()
            result = retriever.query(query, top_k=5)
            
            return {
                "answer": result['answer'],
                "source": "rag",
                "sources": result.get('sources', []),
                "context_used": result.get('context_used', False)
            }
            
        except Exception as e:
            logger.error(f"RAG query failed: {e}")
            return {
                "answer": "I encountered an error processing your question. Please try again.",
                "source": "rag",
                "error": str(e)
            }


def get_or_create_session(session_id: Optional[str] = None) -> tuple:
    """
    Get existing session or create new one
    Returns: (session, session_id, session_data)
    """
    if session_id:
        # Try to load existing session
        try:
            session = SessionStore(session_key=session_id)
            session_data = session.get('unified_chat_data')
            
            if session_data:
                logger.info(f"✅ Loaded existing session: {session_id}")
                return session, session_id, session_data
        except Exception as e:
            logger.warning(f"Failed to load session {session_id}: {e}")
    
    # Create new session
    session = SessionStore()
    session_data = {
        'has_pdf': False,
        'pdf_content': None,
        'pdf_filename': None,
        'unified_history': []
    }
    session['unified_chat_data'] = session_data
    session.save()
    
    session_id = session.session_key
    logger.info(f"✨ Created new session: {session_id}")
    
    return session, session_id, session_data


def add_to_history(
    session_data: Dict,
    role: str,
    content: str,
    route: str,
    **metadata
) -> None:
    """
    Add message to unified history with metadata
    """
    message = {
        'role': role,
        'content': content,
        'route': route,
        **metadata
    }
    
    if 'unified_history' not in session_data:
        session_data['unified_history'] = []
    
    session_data['unified_history'].append(message)

