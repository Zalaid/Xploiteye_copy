"""
RAG Service - Semantic search over SherlockDroid documentation
"""

import os
import logging
from typing import Dict, List, Any, Optional
from pathlib import Path
from langchain_openai import ChatOpenAI, OpenAIEmbeddings
from langchain_qdrant import QdrantVectorStore
from langchain_core.prompts import ChatPromptTemplate
from qdrant_client import QdrantClient

logger = logging.getLogger(__name__)


class RAGRetriever:
    """Retrieves and answers questions using XploitEye documentation"""

    def __init__(self):
        self.qdrant_url = os.getenv('QDRANT_URL')
        self.qdrant_api_key = os.getenv('QDRANT_API_KEY')
        self.openai_api_key = os.getenv('OPENAI_API_KEY_2') or os.getenv('OPENAI_API_KEY')
        self.collection_name = "xploiteye_docs"
        self.docs_dir = "/home/kali/Desktop/XploitEye-copy/Xploiteye_copy/Xploiteye-backend/app/rag./rag/docs"

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

            # Check if collection already has embeddings
            if self._collection_exists_and_has_data():
                logger.info(f"✅ Collection '{self.collection_name}' already populated with embeddings")
                self.vector_store = QdrantVectorStore(
                    client=self.qdrant_client,
                    collection_name=self.collection_name,
                    embedding=self.embeddings
                )
            else:
                logger.info(f"📚 Collection '{self.collection_name}' not found or empty. Embedding documentation...")
                self._embed_documentation()
                # After embedding, create vector store
                try:
                    self.vector_store = QdrantVectorStore(
                        client=self.qdrant_client,
                        collection_name=self.collection_name,
                        embedding=self.embeddings
                    )
                except Exception as e:
                    logger.warning(f"Could not create vector store immediately after embedding: {str(e)}. Will retry on first query.")
                    self.vector_store = None

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

    def _collection_exists_and_has_data(self) -> bool:
        """Check if Qdrant collection exists and has vectors"""
        try:
            collection_info = self.qdrant_client.get_collection(self.collection_name)
            has_data = collection_info.points_count > 0
            logger.info(f"Collection '{self.collection_name}' has {collection_info.points_count} vectors")
            return has_data
        except Exception as e:
            logger.info(f"Collection check: {str(e)}")
            return False

    def _embed_documentation(self):
        """Load and embed all PDFs from docs folder"""
        try:
            from langchain_community.document_loaders import PyPDFLoader
            from langchain_text_splitters import RecursiveCharacterTextSplitter

            docs_path = Path(self.docs_dir)
            if not docs_path.exists():
                logger.error(f"Documentation directory not found: {self.docs_dir}")
                return

            # Get all PDF files
            pdf_files = list(docs_path.glob("*.pdf"))
            if not pdf_files:
                logger.warning(f"No PDF files found in {self.docs_dir}")
                return

            logger.info(f"Found {len(pdf_files)} PDF files to embed")

            # Load all documents
            all_documents = []
            for pdf_file in pdf_files:
                try:
                    logger.info(f"Loading: {pdf_file.name}")
                    loader = PyPDFLoader(str(pdf_file))
                    pages = loader.load()
                    all_documents.extend(pages)
                    logger.info(f"✅ Loaded {len(pages)} pages from {pdf_file.name}")
                except Exception as e:
                    logger.error(f"Failed to load {pdf_file.name}: {str(e)}")

            if not all_documents:
                logger.error("No documents loaded from PDFs")
                return

            logger.info(f"Splitting {len(all_documents)} pages into chunks...")

            # Split documents into chunks
            splitter = RecursiveCharacterTextSplitter(
                chunk_size=500,
                chunk_overlap=100,
                separators=["\n\n", "\n", " ", ""]
            )
            chunks = splitter.split_documents(all_documents)
            logger.info(f"Created {len(chunks)} chunks")

            # Embed and store in Qdrant
            logger.info(f"Embedding {len(chunks)} chunks and storing in Qdrant...")
            QdrantVectorStore.from_documents(
                chunks,
                self.embeddings,
                url=self.qdrant_url,
                api_key=self.qdrant_api_key,
                collection_name=self.collection_name,
                batch_size=10
            )

            logger.info(f"✅ Successfully embedded all documentation!")

        except Exception as e:
            logger.error(f"Documentation embedding failed: {str(e)}")
            raise

    def query(self, user_query: str, top_k: int = 5) -> Dict[str, Any]:
        """Query documentation and generate answer"""

        if not self.available or not self.vector_store:
            return {
                "answer": "RAG service not available. Qdrant vector store not initialized. Please check Qdrant connection and ensure documentation has been embedded.",
                "sources": [],
                "context_used": False,
                "query_analysis": {"error": "Service unavailable - vector store not initialized"}
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
