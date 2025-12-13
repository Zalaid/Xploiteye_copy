"""
RAG Service - Semantic search over SherlockDroid documentation
"""

import os
import logging
from typing import Dict, List, Any, Optional
from langchain_openai import ChatOpenAI, OpenAIEmbeddings
from langchain_qdrant import QdrantVectorStore
from langchain_core.prompts import ChatPromptTemplate
from qdrant_client import QdrantClient

logger = logging.getLogger(__name__)


class RAGRetriever:
    """Retrieves and answers questions using SherlockDroid documentation"""

    def __init__(self):
        self.qdrant_url = os.getenv('QDRANT_URL')
        self.qdrant_api_key = os.getenv('QDRANT_API_KEY')
        self.openai_api_key = os.getenv('OPENAI_API_KEY_2') or os.getenv('OPENAI_API_KEY')

        if not all([self.qdrant_url, self.qdrant_api_key, self.openai_api_key]):
            logger.warning("RAG not fully configured - some env vars missing")
            self.available = False
            return

        try:
            self.qdrant_client = QdrantClient(
                url=self.qdrant_url,
                api_key=self.qdrant_api_key
            )

            self.embeddings = OpenAIEmbeddings(
                model="text-embedding-3-small",
                openai_api_key=self.openai_api_key
            )

            self.collection_name = "xploiteye_docs"

            self.vector_store = QdrantVectorStore(
                client=self.qdrant_client,
                collection_name=self.collection_name,
                embedding=self.embeddings
            )

            self.llm = ChatOpenAI(
                model="gpt-4o-mini",
                temperature=0.3,
                openai_api_key=self.openai_api_key
            )

            self.available = True
            logger.info("✅ XploitEye RAG Retriever initialized successfully")

        except Exception as e:
            logger.error(f"RAG initialization failed: {str(e)}")
            self.available = False

    def query(self, user_query: str, top_k: int = 5) -> Dict[str, Any]:
        """Query documentation and generate answer"""

        if not self.available:
            return {
                "answer": "RAG service not available. Please check Qdrant connection.",
                "sources": [],
                "context_used": False,
                "query_analysis": {"error": "Service unavailable"}
            }

        try:
            # Search for relevant documents
            search_results = self.vector_store.similarity_search_with_score(
                user_query,
                k=top_k
            )

            if not search_results:
                return {
                    "answer": "I couldn't find relevant documentation about your XploitEye scanning or exploitation query. Please try questions about network scanning, vulnerability assessment, exploit techniques, or penetration testing features.",
                    "sources": [],
                    "context_used": False,
                    "query_analysis": {"intent": "xploiteye_query", "found_sources": False}
                }

            # Prepare context from search results
            context_text = "\n\n".join([
                f"[Source {i+1}]\n{doc.page_content}"
                for i, (doc, score) in enumerate(search_results)
            ])

            sources = [
                {
                    "content": doc.page_content[:200],
                    "relevance_score": float(score)
                }
                for doc, score in search_results
            ]

            # Generate answer using LLM with context
            prompt = ChatPromptTemplate.from_messages([
                (
                    "system",
                    """You are an expert XploitEye security consultant and penetration testing assistant.
Answer questions using ONLY the provided XploitEye documentation context.
Help users understand network scanning, vulnerability assessment, exploitation techniques, and penetration testing features.
If information is not in the context, say so clearly.
Be concise, practical, and security-focused."""
                ),
                (
                    "human",
                    f"""Based on this XploitEye documentation:

{context_text}

Answer this penetration testing question: {user_query}"""
                )
            ])

            chain = prompt | self.llm
            response = chain.invoke({})
            answer = response.content

            return {
                "answer": answer,
                "sources": sources,
                "context_used": True,
                "query_analysis": {
                    "intent": "xploiteye_documentation_query",
                    "found_sources": len(sources) > 0,
                    "top_k_used": len(search_results),
                    "expertise": "penetration_testing_and_vulnerability_scanning"
                }
            }

        except Exception as e:
            logger.error(f"RAG query error: {str(e)}")
            return {
                "answer": f"Error processing query: {str(e)}",
                "sources": [],
                "context_used": False,
                "query_analysis": {"error": str(e)}
            }

    def health_check(self) -> Dict[str, Any]:
        """Check RAG service health"""

        if not self.available:
            return {
                "healthy": False,
                "status": "RAG service not initialized",
                "collection": None,
                "vectors_count": 0
            }

        try:
            collection_info = self.qdrant_client.get_collection(self.collection_name)
            return {
                "healthy": True,
                "status": "healthy",
                "collection": self.collection_name,
                "vectors_count": collection_info.points_count
            }
        except Exception as e:
            logger.error(f"Health check failed: {str(e)}")
            return {
                "healthy": False,
                "status": f"Error: {str(e)}",
                "collection": self.collection_name,
                "vectors_count": 0
            }
