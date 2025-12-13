# """
# RAG Retrieval Service with LangChain
# Handles intelligent query processing and response generation
# """
# import os
# import json
# import logging
# from typing import Dict, List, Optional, Any
# from dotenv import load_dotenv

# from langchain_openai import ChatOpenAI, OpenAIEmbeddings
# from langchain_qdrant import QdrantVectorStore
# from langchain_core.prompts import ChatPromptTemplate
# from langchain_core.documents import Document
# from qdrant_client import QdrantClient

# load_dotenv()
# logger = logging.getLogger(__name__)


# class RAGRetriever:
#     """
#     Intelligent RAG retrieval with query analysis and smart filtering
#     """
    
#     def __init__(self):
#         # Credentials
#         self.qdrant_url = os.getenv('Qdrant_URL')
#         self.qdrant_api_key = os.getenv('Qdrant_API_KEY')
#         self.openai_api_key = os.getenv('OPENAI_API_KEY_2')
        
#         if not all([self.qdrant_url, self.qdrant_api_key, self.openai_api_key]):
#             raise ValueError("Missing environment variables")
        
#         # Initialize Qdrant
#         self.qdrant_client = QdrantClient(
#             url=self.qdrant_url,
#             api_key=self.qdrant_api_key
#         )
        
#         # Initialize embeddings
#         self.embeddings = OpenAIEmbeddings(
#             model="text-embedding-3-small",
#             openai_api_key=self.openai_api_key
#         )
        
#         # Collection name
#         self.collection_name = "sherlockdroid_docs"
        
#         # Initialize vector store
#         self.vector_store = QdrantVectorStore(
#             client=self.qdrant_client,
#             collection_name=self.collection_name,
#             embedding=self.embeddings
#         )
        
#         # LLMs
#         self.analyzer_llm = ChatOpenAI(
#             model="gpt-4o-mini",
#             temperature=0,
#             openai_api_key=self.openai_api_key
#         )
        
#         self.answer_llm = ChatOpenAI(
#             model="gpt-4o-mini",
#             temperature=0.3,
#             openai_api_key=self.openai_api_key
#         )
        
#         # Module keywords mapping
#         self.module_keywords = {
#             "static_analysis": [
#                 "static", "apk structure", "decompile", "smali", "manifest",
#                 "llm analyzer", "code review", "jadx", "apktool", "permissions",
#                 "bytecode", "dex", "signature", "certificate"
#             ],
#             "dynamic_analysis": [
#                 "dynamic", "frida", "runtime", "hook", "instrumentation",
#                 "behavior", "execution", "monitor", "api call", "logcat",
#                 "memory", "trace"
#             ],
#             "network_scanning": [
#                 "network", "scan", "arp", "ping", "discovery", "adb",
#                 "device", "subnet", "port", "wifi", "lan", "enumerate"
#             ],
#             "c2_surveillance": [
#                 "c2", "command and control", "surveillance", "remote access",
#                 "backdoor", "persistence", "payload", "exploit"
#             ],
#             "overview": [
#                 "what is", "sherlockdroid", "introduction", "overview",
#                 "purpose", "goal", "objective", "about", "project"
#             ]
#         }
    
#     def analyze_query(self, query: str) -> Dict[str, Any]:
#         """
#         Analyze query to determine intent and extract filters
#         """
#         analysis_prompt = ChatPromptTemplate.from_messages([
#             ("system", """You are a query analyzer for SherlockDroid documentation.

# Analyze the user query and respond with ONLY a JSON object (no markdown, no explanation):

# {{
#   "intent": "explanation" | "howto" | "comparison" | "overview" | "technical_detail",
#   "modules": ["static_analysis", "dynamic_analysis", "network_scanning", "c2_surveillance", "overview"],
#   "complexity": "simple" | "detailed",
#   "needs_code": true | false
# }}

# Guidelines:
# - intent="overview" for "what is", "explain", "introduce" questions
# - intent="howto" for "how to", "how do I", "steps to" questions  
# - intent="comparison" for "difference", "compare", "vs" questions
# - intent="technical_detail" for code, implementation, architecture questions
# - modules: select ALL relevant modules (can be multiple)
# - complexity="simple" for definitions/overviews, "detailed" for implementation
# - needs_code=true if asking for code/examples

# Examples:
# "What is SherlockDroid?" → {{"intent":"overview","modules":["overview"],"complexity":"simple","needs_code":false}}
# "How does static analysis work?" → {{"intent":"howto","modules":["static_analysis"],"complexity":"detailed","needs_code":false}}
# "Show me Frida hook code" → {{"intent":"technical_detail","modules":["dynamic_analysis"],"complexity":"detailed","needs_code":true}}
# "Compare static and dynamic analysis" → {{"intent":"comparison","modules":["static_analysis","dynamic_analysis"],"complexity":"detailed","needs_code":false}}
# """),
#             ("user", "{query}")
#         ])
        
#         try:
#             chain = analysis_prompt | self.analyzer_llm
#             response = chain.invoke({"query": query})
            
#             # Parse JSON response
#             content = response.content.strip()
#             # Remove markdown code blocks if present
#             if content.startswith("```"):
#                 content = content.split("```")[1]
#                 if content.startswith("json"):
#                     content = content[4:]
            
#             analysis = json.loads(content.strip())
#             logger.info(f"Query analysis: {analysis}")
#             return analysis
            
#         except Exception as e:
#             logger.error(f"Query analysis failed: {e}")
#             # Fallback: simple keyword matching
#             return self._fallback_analysis(query)
    
#     def _fallback_analysis(self, query: str) -> Dict[str, Any]:
#         """Fallback query analysis using keyword matching"""
#         query_lower = query.lower()
#         detected_modules = []
        
#         for module, keywords in self.module_keywords.items():
#             if any(kw in query_lower for kw in keywords):
#                 detected_modules.append(module)
        
#         if not detected_modules:
#             detected_modules = ["overview"]
        
#         return {
#             "intent": "explanation",
#             "modules": detected_modules,
#             "complexity": "detailed" if len(query.split()) > 10 else "simple",
#             "needs_code": "code" in query_lower or "example" in query_lower
#         }
    
#     # def retrieve_context(
#     #     self,
#     #     query: str,
#     #     analysis: Dict[str, Any],
#     #     top_k: int = 5
#     # ) -> List[Document]:
#     #     """
#     #     Retrieve relevant chunks from Qdrant using LangChain
#     #     """
#     #     try:
#     #         # Try with metadata filtering first
#     #         if analysis.get("modules"):
#     #             logger.info(f"Searching with module filter: {analysis['modules']}")
                
#     #             # Use LangChain's similarity search with metadata filter
#     #             search_kwargs = {
#     #                 "k": top_k,
#     #                 "filter": {
#     #                     "must": [
#     #                         {
#     #                             "key": "modules",
#     #                             "match": {
#     #                                 "any": analysis["modules"]
#     #                             }
#     #                         }
#     #                     ]
#     #                 }
#     #             }
                
#     #             try:
#     #                 documents = self.vector_store.similarity_search(
#     #                     query=query,
#     #                     **search_kwargs
#     #                 )
                    
#     #                 if documents:
#     #                     logger.info(f"✓ Retrieved {len(documents)} chunks with filters")
#     #                     return documents
#     #                 else:
#     #                     logger.info("No results with filters, trying without...")
                        
#     #             except Exception as filter_error:
#     #                 logger.warning(f"Filtered search failed: {filter_error}, trying without filters...")
            
#     #         # Fallback: search without filters
#     #         documents = self.vector_store.similarity_search(
#     #             query=query,
#     #             k=top_k
#     #         )
            
#     #         logger.info(f"✓ Retrieved {len(documents)} chunks (no filters)")
#     #         return documents
            
#     #     except Exception as e:
#     #         logger.error(f"Retrieval failed completely: {e}")
#     #         import traceback
#     #         traceback.print_exc()
#     #         return []
#     def retrieve_context(
#     self,
#     query: str,
#     analysis: Dict[str, Any],
#     top_k: int = 5
# ) -> List[Document]:
#     """
#     Retrieve relevant chunks from Qdrant using LangChain
#     """
#     try:
#         # Try with metadata filtering first
#         if analysis.get("modules"):
#             logger.info(f"Searching with module filter: {analysis['modules']}")
            
#             # Use correct Qdrant filter format
#             from qdrant_client.models import Filter, FieldCondition, MatchAny
            
#             qdrant_filter = Filter(
#                 must=[
#                     FieldCondition(
#                         key="modules",
#                         match=MatchAny(any=analysis["modules"])
#                     )
#                 ]
#             )
            
#             try:
#                 # Search with filter using qdrant client directly
#                 query_vector = self.embeddings.embed_query(query)
                
#                 search_result = self.qdrant_client.query_points(
#                     collection_name=self.collection_name,
#                     query=query_vector,
#                     query_filter=qdrant_filter,
#                     limit=top_k,
#                     with_payload=True
#                 )
                
#                 # Convert to LangChain Documents
#                 documents = []
#                 for scored_point in search_result.points:
#                     doc = Document(
#                         page_content=scored_point.payload.get("text", ""),
#                         metadata={
#                             "source": scored_point.payload.get("source_file", "Unknown"),
#                             "section": scored_point.payload.get("section_header", ""),
#                             "doc_type": scored_point.payload.get("doc_type", ""),
#                             "score": scored_point.score
#                         }
#                     )
#                     documents.append(doc)
                
#                 if documents:
#                     logger.info(f"✓ Retrieved {len(documents)} chunks with filters")
#                     return documents
#                 else:
#                     logger.info("No results with filters, trying without...")
                    
#             except Exception as filter_error:
#                 logger.warning(f"Filtered search failed: {filter_error}, trying without filters...")
        
#         # Fallback: search without filters using vector store
#         documents = self.vector_store.similarity_search(
#             query=query,
#             k=top_k
#         )
        
#         logger.info(f"✓ Retrieved {len(documents)} chunks (no filters)")
#         return documents
        
#     except Exception as e:
#         logger.error(f"Retrieval failed completely: {e}")
#         import traceback
#         traceback.print_exc()
#         return []
#     def generate_answer(
#         self,
#         query: str,
#         context_docs: List[Document],
#         analysis: Dict[str, Any]
#     ) -> Dict[str, Any]:
#         """
#         Generate final answer using LLM with context
#         """
#         # Prepare context string
#         if context_docs:
#             context_parts = []
#             for i, doc in enumerate(context_docs, 1):
#                 source = doc.metadata.get("source", "Unknown")
#                 section = doc.metadata.get("section", "")
#                 context_parts.append(
#                     f"[Source {i}: {source} - {section}]\n{doc.page_content}\n"
#                 )
#             context_str = "\n---\n".join(context_parts)
#         else:
#             context_str = "No specific documentation found for this query."
        
#         # Create prompt
#         answer_prompt = ChatPromptTemplate.from_messages([
#             ("system", """You are SherlockDroid Documentation Assistant - a helpful, friendly AI that explains mobile app security analysis.

# ## YOUR PERSONALITY:
# - Friendly and approachable, never robotic
# - Patient and encouraging with beginners
# - Precise and detailed with technical users
# - Enthusiastic about security and Android analysis

# ## CORE RULES (NEVER BREAK THESE):

# 1. **ALWAYS PROVIDE AN ANSWER** - Never say "I don't know" or "I cannot help"
#    - If context is provided → use it
#    - If context is missing/insufficient → use your general knowledge about Android security, APK analysis, Frida, etc.
#    - Combine context + your knowledge seamlessly

# 2. **BE HELPFUL, NOT APOLOGETIC**
#    - ❌ "I'm sorry, but I don't have information about..."
#    - ✅ "Great question! While the specific docs don't cover this in detail, here's how it typically works..."

# 3. **ADAPT TO TECHNICAL LEVEL**
#    - If query is simple ("What is X?") → Give clear, simple explanation first, then optional details
#    - If query is technical ("How does X implement Y?") → Provide detailed technical answer
#    - Always offer to explain further: "Want me to break this down more?" or "Need more technical details?"

# 4. **SIMPLIFY COMPLEX CONCEPTS**
#    - Use analogies and examples
#    - Break down technical jargon
#    - Format with bullet points for clarity
#    - Example: "Think of static analysis like reading a book's table of contents - you see the structure without running anything"

# 5. **PROVIDE ACTIONABLE INFORMATION**
#    - Include practical examples when relevant
#    - Mention related commands, tools, or files
#    - Suggest next steps: "You might also want to check...", "To try this yourself..."

# 6. **CITE SOURCES WHEN USING CONTEXT**
#    - When referencing provided docs: "According to the [document name]..."
#    - When using general knowledge: "Based on standard Android security practices..." or "Typically in Frida instrumentation..."

# 7. **HANDLE EDGE CASES GRACEFULLY**
#    - Off-topic questions: Gently redirect while being helpful
#    - Ambiguous questions: Ask clarifying question OR provide best-guess answer

# 8. **BE CONVERSATIONAL**
#    - Use contractions (you'll, it's, we'll)
#    - Occasional friendly phrases: "Great question!", "Here's the cool part:", "Let's break this down:"
#    - Stay professional but warm

# ## RESPONSE STRUCTURE:
# 1. Brief direct answer (1-2 sentences)
# 2. Detailed explanation with examples
# 3. Related information or next steps (optional)
# 4. Offer for clarification: "Does this help?" or "Want to know more about X?"

# ## FORMATTING:
# - Use **bold** for key terms
# - Use bullet points for lists/steps
# - Use code blocks for commands/code
# - Keep paragraphs short (3-4 lines max)

# Remember: You're not just answering questions - you're helping users learn about mobile security analysis!
# """),
#             ("user", """User Question: {query}

# Documentation Context:
# {context}

# Provide a helpful, friendly answer. If the documentation doesn't fully cover it, supplement with your knowledge of Android security, APK analysis, Frida, static/dynamic analysis, etc.""")
#         ])
        
#         try:
#             # Generate response
#             chain = answer_prompt | self.answer_llm
#             response = chain.invoke({
#                 "query": query,
#                 "context": context_str
#             })
            
#             answer_text = response.content
            
#             # Prepare sources
#             sources = []
#             if context_docs:
#                 seen_sources = set()
#                 for doc in context_docs:
#                     source = doc.metadata.get("source", "Unknown")
#                     if source not in seen_sources:
#                         sources.append({
#                             "file": source,
#                             "section": doc.metadata.get("section", ""),
#                             "doc_type": doc.metadata.get("doc_type", "")
#                         })
#                         seen_sources.add(source)
            
#             return {
#                 "answer": answer_text,
#                 "sources": sources,
#                 "context_used": len(context_docs) > 0,
#                 "query_analysis": analysis
#             }
            
#         except Exception as e:
#             logger.error(f"Answer generation failed: {e}")
#             return {
#                 "answer": "I encountered an error generating the response. Please try rephrasing your question.",
#                 "sources": [],
#                 "context_used": False,
#                 "error": str(e)
#             }
    
#     def query(self, user_query: str, top_k: int = 5) -> Dict[str, Any]:
#         """
#         Main query method - orchestrates entire RAG pipeline
#         """
#         logger.info(f"Processing query: {user_query}")
        
#         try:
#             # Step 1: Analyze query
#             analysis = self.analyze_query(user_query)
            
#             # Step 2: Retrieve context
#             context_docs = self.retrieve_context(user_query, analysis, top_k)
            
#             # Step 3: Generate answer
#             result = self.generate_answer(user_query, context_docs, analysis)
            
#             logger.info(f"✓ Query processed successfully")
#             return result
            
#         except Exception as e:
#             logger.error(f"Query processing failed: {e}")
#             import traceback
#             traceback.print_exc()
#             return {
#                 "answer": "I encountered an error processing your question. Please try again or rephrase your question.",
#                 "sources": [],
#                 "context_used": False,
#                 "error": str(e)
#             }

"""
RAG Retrieval Service with LangChain
Handles intelligent query processing and response generation
"""
import os
import json
import logging
from typing import Dict, List, Optional, Any
from dotenv import load_dotenv

from langchain_openai import ChatOpenAI, OpenAIEmbeddings
from langchain_qdrant import QdrantVectorStore
from langchain_core.prompts import ChatPromptTemplate
from langchain_core.documents import Document
from qdrant_client import QdrantClient
from qdrant_client.models import Filter, FieldCondition, MatchAny

load_dotenv()
logger = logging.getLogger(__name__)


class RAGRetriever:
    """
    Intelligent RAG retrieval with query analysis and smart filtering
    """
    
    def __init__(self):
        # Credentials
        self.qdrant_url = os.getenv('Qdrant_URL')
        self.qdrant_api_key = os.getenv('Qdrant_API_KEY')
        self.openai_api_key = os.getenv('OPENAI_API_KEY_2')
        
        if not all([self.qdrant_url, self.qdrant_api_key, self.openai_api_key]):
            raise ValueError("Missing environment variables")
        
        # Initialize Qdrant
        self.qdrant_client = QdrantClient(
            url=self.qdrant_url,
            api_key=self.qdrant_api_key
        )
        
        # Initialize embeddings
        self.embeddings = OpenAIEmbeddings(
            model="text-embedding-3-small",
            openai_api_key=self.openai_api_key
        )
        
        # Collection name
        self.collection_name = "sherlockdroid_docs"
        
        # Initialize vector store
        self.vector_store = QdrantVectorStore(
            client=self.qdrant_client,
            collection_name=self.collection_name,
            embedding=self.embeddings
        )
        
        # LLMs
        self.analyzer_llm = ChatOpenAI(
            model="gpt-4o-mini",
            temperature=0,
            openai_api_key=self.openai_api_key
        )
        
        self.answer_llm = ChatOpenAI(
            model="gpt-4o-mini",
            temperature=0.3,
            openai_api_key=self.openai_api_key
        )
        
        # Module keywords mapping with priorities
        self.module_keywords = {
            "network_scanning": [
                "network scan", "device scan", "arp scan", "ping sweep",
                "discover devices", "find devices", "adb discovery",
                "network discovery", "device discovery", "subnet scan"
            ],
            "static_analysis": [
                "static analysis", "apk analysis", "decompile", "smali", 
                "manifest analysis", "llm analyzer", "code review", 
                "jadx", "apktool", "permissions", "bytecode", "dex"
            ],
            "dynamic_analysis": [
                "dynamic analysis", "frida", "runtime", "hook", 
                "instrumentation", "behavior monitoring", "execution",
                "api call monitoring", "logcat"
            ],
            "c2_surveillance": [
                "c2", "command and control", "surveillance", 
                "remote access", "backdoor", "persistence"
            ],
            "overview": [
                "what is sherlockdroid", "about sherlockdroid",
                "introduction", "overview", "purpose", "goal"
            ]
        }
    
    def analyze_query(self, query: str) -> Dict[str, Any]:
        """
        Analyze query to determine intent and extract filters
        """
        analysis_prompt = ChatPromptTemplate.from_messages([
            ("system", """You are a query analyzer for SherlockDroid documentation.

SherlockDroid has these distinct modules:
1. **network_scanning**: Discovering Android devices on a network using ARP/ping, connecting via ADB
2. **static_analysis**: Analyzing APK files without execution (decompilation, code review, manifest)
3. **dynamic_analysis**: Runtime analysis using Frida hooks, monitoring app behavior during execution
4. **c2_surveillance**: Command & control, remote access, backdoor functionality
5. **overview**: General information about SherlockDroid project

Analyze the user query and respond with ONLY a JSON object (no markdown):

{{
  "intent": "explanation" | "howto" | "comparison" | "overview" | "technical_detail",
  "modules": ["network_scanning", "static_analysis", "dynamic_analysis", "c2_surveillance", "overview"],
  "complexity": "simple" | "detailed",
  "needs_code": true | false
}}

**CRITICAL DISAMBIGUATION FOR "SCANNING":**
- "how scanning works" OR "scan devices" OR "network scan" → network_scanning
- "scan APK" OR "analyze APK" OR "APK analysis" → static_analysis
- If ambiguous, default to network_scanning

Examples:
"What is SherlockDroid?" → {{"intent":"overview","modules":["overview"],"complexity":"simple","needs_code":false}}
"How does static analysis work?" → {{"intent":"howto","modules":["static_analysis"],"complexity":"detailed","needs_code":false}}
"How scanning works in SherlockDroid?" → {{"intent":"howto","modules":["network_scanning"],"complexity":"detailed","needs_code":false}}
"How does network scanning work?" → {{"intent":"howto","modules":["network_scanning"],"complexity":"detailed","needs_code":false}}
"Show me Frida hook code" → {{"intent":"technical_detail","modules":["dynamic_analysis"],"complexity":"detailed","needs_code":true}}
"Compare static and dynamic analysis" → {{"intent":"comparison","modules":["static_analysis","dynamic_analysis"],"complexity":"detailed","needs_code":false}}
"""),
            ("user", "{query}")
        ])
        
        try:
            chain = analysis_prompt | self.analyzer_llm
            response = chain.invoke({"query": query})
            
            # Parse JSON response
            content = response.content.strip()
            # Remove markdown code blocks if present
            if content.startswith("```"):
                content = content.split("```")[1]
                if content.startswith("json"):
                    content = content[4:]
            
            analysis = json.loads(content.strip())
            logger.info(f"Query analysis: {analysis}")
            return analysis
            
        except Exception as e:
            logger.error(f"Query analysis failed: {e}")
            # Fallback: priority-based keyword matching
            return self._fallback_analysis(query)
    
    def _fallback_analysis(self, query: str) -> Dict[str, Any]:
        """Fallback query analysis with priority-based keyword matching"""
        query_lower = query.lower()
        detected_modules = []
        
        # Priority patterns - check these first
        priority_patterns = [
            (["network scan", "device scan", "discover devices", "arp", "ping sweep", "find devices"], "network_scanning"),
            (["apk scan", "apk analysis", "static analysis", "decompile", "manifest"], "static_analysis"),
            (["frida", "hook", "runtime", "dynamic analysis"], "dynamic_analysis"),
            (["c2", "command and control", "backdoor", "surveillance"], "c2_surveillance"),
        ]
        
        # Check priority patterns first
        for patterns, module in priority_patterns:
            if any(pattern in query_lower for pattern in patterns):
                detected_modules.append(module)
                break  # Use first match
        
        # If "scanning" mentioned but no specific match, default to network_scanning
        if not detected_modules and "scan" in query_lower:
            detected_modules = ["network_scanning"]
        
        # If still nothing, check all keywords
        if not detected_modules:
            for module, keywords in self.module_keywords.items():
                if any(kw in query_lower for kw in keywords):
                    detected_modules.append(module)
        
        # Final fallback
        if not detected_modules:
            detected_modules = ["overview"]
        
        logger.info(f"Fallback analysis result: {detected_modules}")
        
        return {
            "intent": "explanation",
            "modules": detected_modules,
            "complexity": "detailed" if len(query.split()) > 10 else "simple",
            "needs_code": "code" in query_lower or "example" in query_lower
        }
    
    def retrieve_context(
        self,
        query: str,
        analysis: Dict[str, Any],
        top_k: int = 5
    ) -> List[Document]:
        """
        Retrieve relevant chunks from Qdrant with smart filtering
        """
        try:
            # Try with metadata filtering first
            if analysis.get("modules"):
                logger.info(f"🔍 Searching with module filter: {analysis['modules']}")
                
                # Build Qdrant filter
                qdrant_filter = Filter(
                    must=[
                        FieldCondition(
                            key="modules",
                            match=MatchAny(any=analysis["modules"])
                        )
                    ]
                )
                
                try:
                    # Generate query embedding
                    query_vector = self.embeddings.embed_query(query)
                    
                    # Search with filter
                    search_result = self.qdrant_client.query_points(
                        collection_name=self.collection_name,
                        query=query_vector,
                        query_filter=qdrant_filter,
                        limit=top_k,
                        with_payload=True
                    )
                    
                    # Convert to LangChain Documents
                    documents = []
                    for scored_point in search_result.points:
                        doc = Document(
                            page_content=scored_point.payload.get("text", ""),
                            metadata={
                                "source": scored_point.payload.get("source_file", "Unknown"),
                                "section": scored_point.payload.get("section_header", ""),
                                "doc_type": scored_point.payload.get("doc_type", ""),
                                "modules": scored_point.payload.get("modules", []),
                                "score": scored_point.score
                            }
                        )
                        documents.append(doc)
                    
                    if documents:
                        logger.info(f"✅ Retrieved {len(documents)} chunks with filters")
                        logger.info(f"📄 Sources: {[doc.metadata.get('source') for doc in documents[:3]]}")
                        return documents
                    else:
                        logger.warning("⚠️ No results with filters, trying without...")
                        
                except Exception as filter_error:
                    logger.error(f"❌ Filtered search failed: {filter_error}")
                    logger.info("🔄 Falling back to unfiltered search...")
            
            # Fallback: search without filters
            documents = self.vector_store.similarity_search(
                query=query,
                k=top_k
            )
            
            logger.info(f"✅ Retrieved {len(documents)} chunks (no filters)")
            return documents
            
        except Exception as e:
            logger.error(f"❌ Retrieval failed completely: {e}")
            import traceback
            traceback.print_exc()
            return []
    
#     def generate_answer(
#         self,
#         query: str,
#         context_docs: List[Document],
#         analysis: Dict[str, Any]
#     ) -> Dict[str, Any]:
#         """
#         Generate final answer using LLM with strict context adherence
#         """
#         # Prepare context string
#         has_context = len(context_docs) > 0
        
#         if has_context:
#             context_parts = []
#             for i, doc in enumerate(context_docs, 1):
#                 source = doc.metadata.get("source", "Unknown")
#                 section = doc.metadata.get("section", "")
#                 modules = doc.metadata.get("modules", [])
#                 context_parts.append(
#                     f"[Source {i}: {source} | Section: {section} | Modules: {', '.join(modules)}]\n{doc.page_content}\n"
#                 )
#             context_str = "\n" + "="*60 + "\n".join(context_parts) + "="*60
            
#             # Log context preview
#             logger.info("="*60)
#             logger.info("📝 CONTEXT BEING SENT TO LLM:")
#             logger.info(f"Number of chunks: {len(context_docs)}")
#             logger.info(f"Sources: {[doc.metadata.get('source') for doc in context_docs]}")
#             logger.info(f"Preview: {context_str[:300]}...")
#             logger.info("="*60)
#         else:
#             context_str = "❌ NO DOCUMENTATION CONTEXT FOUND - Use your general knowledge to help the user."
#             logger.warning("⚠️ No context found - LLM will use general knowledge")
        
#         # Create prompt with STRICT instructions
#         if has_context:
#             # STRICT MODE: Context is available
#             answer_prompt = ChatPromptTemplate.from_messages([
#                 ("system", """You are SherlockDroid Documentation Assistant.

# 🚨 CRITICAL INSTRUCTION - CONTEXT IS PROVIDED:

# You have been given specific documentation from SherlockDroid. Your ONLY job is to explain what's IN THE CONTEXT.

# ## MANDATORY RULES:

# 1. **READ THE CONTEXT CAREFULLY**
#    - Look at the [Source] tags to see which documents you have
#    - Pay attention to the Modules listed (network_scanning, static_analysis, etc.)

# 2. **ANSWER BASED ONLY ON CONTEXT**
#    - ✅ Explain what the documentation says
#    - ✅ Use the exact terminology from the context
#    - ✅ Cite the source: "According to [Source file]..."
#    - ❌ DO NOT add your own interpretation
#    - ❌ DO NOT talk about concepts NOT in the context
#    - ❌ DO NOT mix up different types of scanning

# 3. **IF CONTEXT IS ABOUT NETWORK SCANNING:**
#    - Talk about ARP tables, ping sweeps, device discovery, ADB
#    - Explain the phases and steps mentioned
#    - DO NOT mention static/dynamic analysis unless it's in the context

# 4. **IF CONTEXT IS ABOUT APK ANALYSIS:**
#    - Talk about decompilation, code review, vulnerability detection
#    - Explain the tools mentioned (JADX, MobSF, etc.)
#    - DO NOT mention network scanning unless it's in the context

# 5. **STRUCTURE:**
#    - Start: "Based on the [document name]..."
#    - Explain: What the documentation describes
#    - Details: Use specifics from the context
#    - End: "This information comes from [source]"

# ## PERSONALITY:
# - Friendly but precise
# - Clear and helpful
# - Stick to what's documented

# Remember: You're explaining SherlockDroid's documentation, not giving generic security advice!
# """),
#                 ("user", """User Question: {query}

# SherlockDroid Documentation:
# {context}

# Answer based ONLY on what's in the documentation above. Start with "Based on the documentation..." and explain what the docs say.""")
#             ])
#         else:
#             # FALLBACK MODE: No context available
#             answer_prompt = ChatPromptTemplate.from_messages([
#                 ("system", """You are SherlockDroid Documentation Assistant.

# ⚠️ NO SPECIFIC DOCUMENTATION FOUND

# Since no relevant documentation was found, provide a helpful general answer about the topic, but make it clear you're giving general information, not SherlockDroid-specific details.

# ## RULES:
# 1. Start with: "I don't have specific documentation on this, but I can explain generally..."
# 2. Provide accurate, helpful information about the topic
# 3. Relate it to mobile security / Android analysis where relevant
# 4. Suggest the user check the official docs or ask more specifically

# Be helpful and friendly!
# """),
#                 ("user", """User Question: {query}

# No specific documentation found. Provide general helpful information about the topic.""")
#             ])
        
#         try:
#             # Generate response
#             chain = answer_prompt | self.answer_llm
#             response = chain.invoke({
#                 "query": query,
#                 "context": context_str
#             })
            
#             answer_text = response.content
            
#             # Prepare sources
#             sources = []
#             if has_context:
#                 seen_sources = set()
#                 for doc in context_docs:
#                     source = doc.metadata.get("source", "Unknown")
#                     if source not in seen_sources:
#                         sources.append({
#                             "file": source,
#                             "section": doc.metadata.get("section", ""),
#                             "doc_type": doc.metadata.get("doc_type", ""),
#                             "modules": doc.metadata.get("modules", [])
#                         })
#                         seen_sources.add(source)
            
#             logger.info(f"✅ Answer generated successfully (context_used: {has_context})")
            
#             return {
#                 "answer": answer_text,
#                 "sources": sources,
#                 "context_used": has_context,
#                 "query_analysis": analysis
#             }
            
#         except Exception as e:
#             logger.error(f"❌ Answer generation failed: {e}")
#             import traceback
#             traceback.print_exc()
#             return {
#                 "answer": "I encountered an error generating the response. Please try rephrasing your question.",
#                 "sources": [],
#                 "context_used": False,
#                 "error": str(e)
#             }

    def generate_answer(
        self,
        query: str,
        context_docs: List[Document],
        analysis: Dict[str, Any]
    ) -> Dict[str, Any]:
        """
        Generate final answer using LLM - explainable but grounded in context
        """
        # Prepare context string
        has_context = len(context_docs) > 0
        
        if has_context:
            context_parts = []
            for i, doc in enumerate(context_docs, 1):
                source = doc.metadata.get("source", "Unknown")
                section = doc.metadata.get("section", "")
                modules = doc.metadata.get("modules", [])
                context_parts.append(
                    f"[Source {i}: {source} | Section: {section} | Modules: {', '.join(modules)}]\n{doc.page_content}\n"
                )
            context_str = "\n" + "="*60 + "\n".join(context_parts) + "="*60
            
            # Log context preview
            logger.info("="*60)
            logger.info("📝 CONTEXT BEING SENT TO LLM:")
            logger.info(f"Number of chunks: {len(context_docs)}")
            logger.info(f"Sources: {[doc.metadata.get('source') for doc in context_docs]}")
            logger.info(f"Preview: {context_str[:300]}...")
            logger.info("="*60)
        else:
            context_str = "❌ NO DOCUMENTATION CONTEXT FOUND - Use your general knowledge to help the user."
            logger.warning("⚠️ No context found - LLM will use general knowledge")
        
        # Create prompt with BALANCED instructions
        if has_context:
            # BALANCED MODE: Use context but explain well
            answer_prompt = ChatPromptTemplate.from_messages([
                ("system", """You are SherlockDroid Documentation Assistant - a friendly, knowledgeable guide to mobile app security analysis.

     ## LENGTH REQUIREMENTS (CRITICAL):

📏 **Keep responses Medium Length:**
- **Maximum 200-250 words total**
- **4-6 bullet points max** for lists
- **3-5 steps max** for processes

    ## YOUR MISSION:
    You have SherlockDroid documentation context. Your job is to:
    1. **Understand what the documentation describes**
    2. **Explain it clearly and helpfully**
    3. **Make it easy to understand** (use examples, analogies, break it down)
    4. **Stay true to what's documented** (don't make things up)

    ## HOW TO USE CONTEXT:

    ✅ **DO THIS:**
    - Read the context carefully to understand the concept/process
    - Explain it in your own clear, friendly words
    - Add structure (bullet points, steps, sections) to make it digestible
    - Use analogies or examples to clarify technical concepts
    - Highlight key points and important details
    - Mention the source naturally: "According to the documentation..." or "SherlockDroid does this by..."

    ❌ **DON'T DO THIS:**
    - Copy-paste the documentation verbatim
    - Add features/capabilities not mentioned in the context
    - Mix up different concepts (e.g., don't talk about APK analysis when context is about network scanning)
    - Say "I don't have information" if the context clearly covers it

    ## RESPONSE STYLE:

    **For "How does X work?" questions:**
    Structure your answer like this:
    1. **Quick Summary** (1-2 sentences) - what it is
    2. **The Process** (detailed breakdown) - how it works step-by-step
    3. **Key Points** (bullet points) - important details
    4. **Example/Analogy** (optional) - to clarify if needed

    **For "What is X?" questions:**
    1. **Definition** (clear, simple)
    2. **Purpose** (why it exists/what problem it solves)
    3. **How it works** (brief overview)
    4. **Related info** (optional extras from context)

    **Tone:**
    - Friendly and conversational
    - Clear and precise
    - Helpful and encouraging
    - Professional but warm

    **Formatting:**
    - Use **bold** for key terms and concepts
    - Use bullet points for lists/features
    - Use numbered steps for processes
    - Keep paragraphs short (2-4 lines)
    - Add emojis sparingly for clarity (🔍, ✅, 📱, etc.)

    ## EXAMPLE:

    **Context says:** "The scanner uses ARP table parsing by executing arp -a command to discover devices..."

    **Bad response:** "The scanner uses ARP table parsing by executing arp -a command to discover devices."

    **Good response:** "Great question! SherlockDroid's network scanning works through a smart discovery process:

    **The Main Approach:**
    SherlockDroid uses your computer's **ARP (Address Resolution Protocol) table** to find Android devices on your network. Think of ARP like your computer's contact list of all devices it has recently communicated with.

    **Here's how it works:**
    1. The scanner runs the `arp -a` command on your Windows machine
    2. This pulls up a list of all devices your computer knows about on the local network
    3. It filters this list to find devices that look like Android devices
    4. For each potential device, it checks if ADB (Android Debug Bridge) is enabled

    This is faster than scanning every IP address individually! 🚀"

    ## IMPORTANT REMINDERS:
    - Don't just repeat the documentation - EXPLAIN it
    - Make technical concepts accessible
    - Structure your answer for easy reading
    - Stay accurate to what's documented
    - Be genuinely helpful and friendly
    """),
                ("user", """User Question: {query}

    SherlockDroid Documentation:
    {context}

    Based on the documentation above, provide a clear, helpful explanation. Make it easy to understand while staying true to what's documented.""")
            ])
        else:
            # FALLBACK MODE: No context available
            answer_prompt = ChatPromptTemplate.from_messages([
                ("system", """You are SherlockDroid Documentation Assistant.

    ⚠️ NO SPECIFIC DOCUMENTATION FOUND

    The documentation database doesn't have specific information about this query. However, you can still be helpful!

    ## WHAT TO DO:
    1. **Be honest**: Start by saying you don't have specific SherlockDroid documentation on this
    2. **Be helpful**: Provide general, accurate information about the topic if you can
    3. **Relate to context**: Connect it to mobile security / Android analysis where relevant
    4. **Guide them**: Suggest how they might find more specific information

    ## EXAMPLE:

    **Bad:** "I don't have information about that."

    **Good:** "I don't have specific SherlockDroid documentation about this, but I can explain the general concept!

    [Provide helpful general information]

    For SherlockDroid-specific implementation details, you might want to check the official documentation or ask about a related feature I do have docs for, like [suggest related topics]."

    Be friendly, helpful, and honest about what you know vs. what you don't!
    """),
                ("user", """User Question: {query}

    No specific documentation found. Provide helpful general information and guide the user.""")
            ])
        
        try:
            # Generate response
            chain = answer_prompt | self.answer_llm
            response = chain.invoke({
                "query": query,
                "context": context_str
            })
            
            answer_text = response.content
            
            # Prepare sources
            sources = []
            if has_context:
                seen_sources = set()
                for doc in context_docs:
                    source = doc.metadata.get("source", "Unknown")
                    if source not in seen_sources:
                        sources.append({
                            "file": source,
                            "section": doc.metadata.get("section", ""),
                            "doc_type": doc.metadata.get("doc_type", ""),
                            "modules": doc.metadata.get("modules", [])
                        })
                        seen_sources.add(source)
            
            logger.info(f"✅ Answer generated successfully (context_used: {has_context})")
            
            return {
                "answer": answer_text,
                "sources": sources,
                "context_used": has_context,
                "query_analysis": analysis
            }
            
        except Exception as e:
            logger.error(f"❌ Answer generation failed: {e}")
            import traceback
            traceback.print_exc()
            return {
                "answer": "I encountered an error generating the response. Please try rephrasing your question.",
                "sources": [],
                "context_used": False,
                "error": str(e)
            }
    def _add_action_suggestions(self, answer: str, analysis: Dict[str, Any], query: str) -> str:
        """
        Add helpful suggestions with links if query is about analysis features
        """
        modules = analysis.get("modules", [])
        query_lower = query.lower()
        
        # Check if query is about static or dynamic analysis
        is_about_static = ("static_analysis" in modules or 
                          any(kw in query_lower for kw in ["static analysis", "apk analysis", "analyze apk", "scan apk"]))
        
        is_about_dynamic = ("dynamic_analysis" in modules or 
                           any(kw in query_lower for kw in ["dynamic analysis", "frida", "runtime", "hook"]))
        
        # Don't add suggestions if answer is too short or if it's a general overview
        if len(answer) < 100 or "intent" in analysis and analysis["intent"] == "overview":
            return answer
        
        # Add appropriate suggestion at the end
        if is_about_static and is_about_dynamic:
            # Both mentioned
            suggestion = "\n\n---\n\n💡 **Ready to try it yourself?**\n\nYou can perform **static analysis** and **dynamic analysis** on your APK files directly in SherlockDroid!\n\n👉 [Go to APK Analysis Page](/apk-analysis)"
        elif is_about_static:
            # Only static analysis
            suggestion = "\n\n---\n\n💡 **Want to analyze your own APK?**\n\nYou can perform **static analysis** on your APK files right here in SherlockDroid!\n\n👉 [Go to APK Analysis Page](/apk-analysis)"
        elif is_about_dynamic:
            # Only dynamic analysis
            suggestion = "\n\n---\n\n💡 **Ready to test it live?**\n\nYou can perform **dynamic analysis** with Frida instrumentation on your APK files!\n\n👉 [Go to APK Analysis Page](/apk-analysis)"
        else:
            # No suggestion needed
            return answer
        
        logger.info(f"✨ Adding action suggestion for {modules}")
        return answer + suggestion
    
    def query(self, user_query: str, top_k: int = 5) -> Dict[str, Any]:
        """
        Main query method - orchestrates entire RAG pipeline
        """
        logger.info("="*60)
        logger.info(f"🔍 Processing query: {user_query}")
        logger.info("="*60)
        
        try:
            # Step 1: Analyze query
            logger.info("📊 Step 1: Analyzing query intent...")
            analysis = self.analyze_query(user_query)
            
            # Step 2: Retrieve context
            logger.info("🔎 Step 2: Retrieving relevant context...")
            context_docs = self.retrieve_context(user_query, analysis, top_k)
            
            # Step 3: Generate answer
            logger.info("💬 Step 3: Generating answer...")
            result = self.generate_answer(user_query, context_docs, analysis)
            
            # Step 4: Add action suggestions if relevant
            logger.info("💡 Step 4: Checking for action suggestions...")
            result["answer"] = self._add_action_suggestions(
                result["answer"], 
                analysis, 
                user_query
            )
            
            logger.info("="*60)
            logger.info("✅ Query processed successfully")
            logger.info("="*60)
            return result
            
        except Exception as e:
            logger.error(f"❌ Query processing failed: {e}")
            import traceback
            traceback.print_exc()
            return {
                "answer": "I encountered an error processing your question. Please try again or rephrase your question.",
                "sources": [],
                "context_used": False,
                "error": str(e)
            }