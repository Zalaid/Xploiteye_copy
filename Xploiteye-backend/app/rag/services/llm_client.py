"""
Xploit Eye - Groq LLM Client
"""
from typing import List, Dict, Any, Iterator
from groq import Groq
from loguru import logger

from config.settings import settings


class LLMClient:
    """Groq LLM client for answer generation and utilities"""
    
    def __init__(self):
        """Initialize Groq client"""
        logger.info("🔄 Initializing Groq LLM client...")
        
        self.client = Groq(api_key=settings.groq_api_key)
        self.model = settings.groq_model
        
        logger.info(f"✅ Groq client initialized (model: {self.model})")
    
    def generate_answer(
        self,
        query: str,
        context_chunks: List[Dict[str, Any]],
        system_prompt: str
    ) -> str:
        """
        Generate answer using Groq LLM
        
        Args:
            query: User query
            context_chunks: Retrieved context chunks
            system_prompt: System prompt template
            
        Returns:
            Generated answer
        """
        try:
            # Format context
            report_chunks = [
                chunk for chunk in context_chunks
                if chunk.get("metadata", {}).get("source") == "user_report"
            ]
            kb_chunks = [
                chunk for chunk in context_chunks
                if chunk.get("metadata", {}).get("source") == "global_kb"
            ]
            memory_chunks = [
                chunk for chunk in context_chunks
                if chunk.get("metadata", {}).get("source") == "user_memory"
            ]
            
            report_context = self._format_chunks(report_chunks, "User Scan Report")
            kb_context = self._format_chunks(kb_chunks, "Global Knowledge Base")
            memory_context = self._format_chunks(memory_chunks, "User Memory")

            # Combine global KB and user memory into one block used by prompts
            combined_kb_context = kb_context
            if memory_chunks:
                combined_kb_context = kb_context + "\n" + memory_context
            
            # Build prompt
            prompt = system_prompt.format(
                report_chunks=report_context,
                kb_chunks=combined_kb_context,
                query=query
            )
            
            # Generate response
            logger.info(f"🤖 Generating answer with {self.model}")
            
            response = self.client.chat.completions.create(
                model=self.model,
                messages=[
                    {"role": "system", "content": prompt},
                    {"role": "user", "content": query}
                ],
                temperature=0.3,  # Lower temperature for factual responses
                max_tokens=2048,
                top_p=0.9
            )
            
            answer = response.choices[0].message.content
            
            logger.info("✅ Answer generated successfully")
            
            return answer
            
        except Exception as e:
            logger.error(f"❌ LLM generation failed: {e}")
            raise
    
    def stream_answer(
        self,
        query: str,
        context_chunks: List[Dict[str, Any]],
        system_prompt: str
    ) -> Iterator[str]:
        """
        Generate streaming answer using Groq LLM
        
        Args:
            query: User query
            context_chunks: Retrieved context chunks
            system_prompt: System prompt template
            
        Yields:
            Answer chunks
        """
        try:
            # Format context
            report_chunks = [
                chunk for chunk in context_chunks
                if chunk.get("metadata", {}).get("source") == "user_report"
            ]
            kb_chunks = [
                chunk for chunk in context_chunks
                if chunk.get("metadata", {}).get("source") == "global_kb"
            ]
            memory_chunks = [
                chunk for chunk in context_chunks
                if chunk.get("metadata", {}).get("source") == "user_memory"
            ]
            
            report_context = self._format_chunks(report_chunks, "User Scan Report")
            kb_context = self._format_chunks(kb_chunks, "Global Knowledge Base")
            memory_context = self._format_chunks(memory_chunks, "User Memory")

            combined_kb_context = kb_context
            if memory_chunks:
                combined_kb_context = kb_context + "\n" + memory_context
            
            # Build prompt
            prompt = system_prompt.format(
                report_chunks=report_context,
                kb_chunks=combined_kb_context,
                query=query
            )
            
            # Generate streaming response
            logger.info(f"🤖 Streaming answer with {self.model}")
            
            stream = self.client.chat.completions.create(
                model=self.model,
                messages=[
                    {"role": "system", "content": prompt},
                    {"role": "user", "content": query}
                ],
                temperature=0.3,
                max_tokens=2048,
                top_p=0.9,
                stream=True
            )
            
            for chunk in stream:
                if chunk.choices[0].delta.content:
                    yield chunk.choices[0].delta.content
            
            logger.info("✅ Streaming completed")
            
        except Exception as e:
            logger.error(f"❌ LLM streaming failed: {e}")
            raise
    
    def _format_chunks(self, chunks: List[Dict[str, Any]], source_label: str) -> str:
        """
        Format chunks for prompt
        
        Args:
            chunks: List of chunks
            source_label: Label for this source
            
        Returns:
            Formatted context string
        """
        if not chunks:
            return f"{source_label}: No relevant information found.\n"
        
        formatted = f"{source_label}:\n\n"
        
        for i, chunk in enumerate(chunks, 1):
            text = chunk.get("text", "")
            metadata = chunk.get("metadata", {})
            
            formatted += f"[Chunk {i}]\n"
            
            # Add metadata
            if metadata.get("section_title"):
                formatted += f"Section: {metadata['section_title']}\n"
            if metadata.get("page"):
                formatted += f"Page: {metadata['page']}\n"
            if metadata.get("severity"):
                formatted += f"Severity: {metadata['severity']}\n"
            
            formatted += f"Content: {text}\n\n"
        
        return formatted

    def summarize_memory(
        self,
        query: str,
        response: str,
    ) -> str:
        """
        Summarize a single chat turn into a compact memory.

        This is used for long-term memory storage so we keep
        short, focused facts/preferences instead of full Q&A.
        """
        try:
            system_msg = (
                "You are a memory compression assistant for a cybersecurity RAG system. "
                "Given a user question and assistant answer, write 1-3 short sentences "
                "that capture only the durable, useful information about the user's "
                "goals, preferences, environment, or important facts discovered. "
                "Do NOT include greetings, generic explanations, or transient details "
                "(like timestamps, one-time errors, or URLs that are unlikely to be reused). "
                "Output only the concise summary text, no bullet points or headings."
            )

            user_msg = (
                "User question:\n"
                f"{query}\n\n"
                "Assistant answer:\n"
                f"{response}\n\n"
                "Write a compact memory summary:"
            )

            logger.info("🧠 Summarizing chat turn for long-term memory")

            completion = self.client.chat.completions.create(
                model=self.model,
                messages=[
                    {"role": "system", "content": system_msg},
                    {"role": "user", "content": user_msg},
                ],
                temperature=0.2,
                max_tokens=256,
                top_p=0.9,
            )

            summary = completion.choices[0].message.content.strip()

            # Safety guard: avoid extremely long summaries
            if len(summary) > 1000:
                summary = summary[:1000]

            logger.info("✅ Memory summary generated")

            return summary

        except Exception as e:
            logger.error(f"❌ Memory summarization failed, falling back to raw text: {e}")
            # Fallback: store truncated raw Q&A if summarization fails
            fallback = (
                "Conversation memory snippet:\n"
                f"User question: {query}\n"
                f"Assistant answer: {response}"
            )
            return fallback[:4000]


# Global LLM client instance
llm_client = LLMClient()
