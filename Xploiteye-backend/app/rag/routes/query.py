"""
Xploit Eye - Query Routes
"""
from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.responses import StreamingResponse
from typing import Optional
import time
import re
from loguru import logger

from app.auth.jwt_handler import get_current_user
from app.rag.models.chat import ChatCreate, ChatResponse
from app.rag.services.retriever import retriever_service
from app.rag.services.llm_client import llm_client
from app.rag.services.chat_manager import chat_manager
from app.rag.services.guardrails import guardrails_service
from app.rag.services.guardrails_monitor import guardrails_monitor
from app.rag.services.user_memory import user_memory_service
from app.rag.services.user_profile import user_profile_service
from app.rag.prompts.prompts import SYSTEM_PROMPT, GLOBAL_KB_ONLY_PROMPT
from config.settings import settings

router = APIRouter()


@router.post("", response_model=ChatResponse)
async def query_rag(
    chat_data: ChatCreate,
    current_user: dict = Depends(get_current_user)
):
    """
    Query the RAG system (hybrid or global KB only)
    
    Args:
        chat_data: Query data
        current_user: Authenticated user
        
    Returns:
        Chat response with answer and sources
    """
    user_id = str(current_user.id)
    start_time = time.time()
    
    try:
        logger.info(f"💬 Query from user {user_id}: {chat_data.query[:100]}...")
        
        # Guardrails: Check input query
        if settings.enable_guardrails:
            guardrail_result = guardrails_service.check_input(chat_data.query, user_id)
            if not guardrail_result.allowed:
                logger.warning(f"🚫 Guardrail blocked query from user {user_id}: {guardrail_result.reason}")
                # Log incident
                await guardrails_monitor.log_incident(
                    user_id=user_id,
                    query=chat_data.query,
                    result=guardrail_result.to_dict()
                )
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail=guardrails_service.get_blocked_message(guardrail_result)
                )
            elif guardrail_result.action.value == "warn":
                logger.info(f"⚠️  Guardrail warning for user {user_id}: {guardrail_result.reason}")
                # Log warning incidents too
                await guardrails_monitor.log_incident(
                    user_id=user_id,
                    query=chat_data.query,
                    result=guardrail_result.to_dict()
                )

        # Special handling: structured name updates ("my name is ...")
        name_set_match = re.search(r"\bmy\s+name\s+is\s+(.+)", chat_data.query, re.IGNORECASE)
        if name_set_match:
            raw_name = name_set_match.group(1).strip()
            # Strip common trailing punctuation
            raw_name = re.sub(r"[\.\!\?]+$", "", raw_name).strip()
            await user_profile_service.set_name(user_id, raw_name)

            # Direct friendly response without RAG
            answer = f"Got it, your name is {raw_name}."
            context_chunks = []
            retrieval_time_ms = 0
            llm_time_ms = 0
            total_time_ms = int((time.time() - start_time) * 1000)

            metadata = {
                "retrieval_time_ms": retrieval_time_ms,
                "llm_time_ms": llm_time_ms,
                "total_time_ms": total_time_ms,
                "model_used": settings.groq_model,
                "chunks_retrieved": len(context_chunks),
            }

            # Save chat to database
            chat_id, conversation_id = await chat_manager.save_chat(
                user_id=user_id,
                query=chat_data.query,
                response=answer,
                sources=context_chunks,
                session_id=chat_data.session_id,
                conversation_id=chat_data.conversation_id,
                metadata=metadata,
            )

            # Store long-term user memory snippet for this chat turn
            user_memory_service.store_chat_memory(
                user_id=user_id,
                conversation_id=conversation_id,
                query=chat_data.query,
                response=answer,
            )

            logger.info(f"✅ Name update handled without RAG ({total_time_ms}ms)")

            from app.rag.models.chat import ChatSource, ChatMetadata
            from datetime import datetime

            return ChatResponse(
                id=chat_id,
                user_id=user_id,
                conversation_id=conversation_id,
                session_id=chat_data.session_id,
                timestamp=datetime.utcnow(),
                query=chat_data.query,
                response=answer,
                sources=[],
                metadata=ChatMetadata(**metadata),
            )

        # Special handling: name lookup ("what is my name", "tell me my name", "who am i")
        name_query_patterns = [
            r"\bwhat\s+is\s+my\s+name\b",
            r"\btell\s+me\s+my\s+name\b",
            r"\bwho\s+am\s+i\b",
        ]
        if any(re.search(p, chat_data.query, re.IGNORECASE) for p in name_query_patterns):
            stored_name = await user_profile_service.get_name(user_id)
            if stored_name:
                answer = f"Your name is {stored_name}."
            else:
                answer = "I don't know your name yet. You can tell me by saying 'my name is ...'."

            context_chunks = []
            retrieval_time_ms = 0
            llm_time_ms = 0
            total_time_ms = int((time.time() - start_time) * 1000)

            metadata = {
                "retrieval_time_ms": retrieval_time_ms,
                "llm_time_ms": llm_time_ms,
                "total_time_ms": total_time_ms,
                "model_used": settings.groq_model,
                "chunks_retrieved": len(context_chunks),
            }

            chat_id, conversation_id = await chat_manager.save_chat(
                user_id=user_id,
                query=chat_data.query,
                response=answer,
                sources=context_chunks,
                session_id=chat_data.session_id,
                conversation_id=chat_data.conversation_id,
                metadata=metadata,
            )

            # Also save to vector memory so it can help other queries
            user_memory_service.store_chat_memory(
                user_id=user_id,
                conversation_id=conversation_id,
                query=chat_data.query,
                response=answer,
            )

            logger.info(f"✅ Name lookup handled from structured profile ({total_time_ms}ms)")

            from app.rag.models.chat import ChatSource, ChatMetadata
            from datetime import datetime

            return ChatResponse(
                id=chat_id,
                user_id=user_id,
                conversation_id=conversation_id,
                session_id=chat_data.session_id,
                timestamp=datetime.utcnow(),
                query=chat_data.query,
                response=answer,
                sources=[],
                metadata=ChatMetadata(**metadata),
            )

        # Special handling: study-place updates ("I study at ...", "my university is ...")
        study_set_match = re.search(
            r"\b(i\s+study\s+at|i\s+am\s+studying\s+at|my\s+university\s+is)\s+(.+)",
            chat_data.query,
            re.IGNORECASE,
        )
        if study_set_match:
            raw_place = study_set_match.group(2).strip()
            raw_place = re.sub(r"[\.\!\?]+$", "", raw_place).strip()
            await user_profile_service.set_study_place(user_id, raw_place)

            answer = f"Got it, you study at {raw_place}."
            context_chunks = []
            retrieval_time_ms = 0
            llm_time_ms = 0
            total_time_ms = int((time.time() - start_time) * 1000)

            metadata = {
                "retrieval_time_ms": retrieval_time_ms,
                "llm_time_ms": llm_time_ms,
                "total_time_ms": total_time_ms,
                "model_used": settings.groq_model,
                "chunks_retrieved": len(context_chunks),
            }

            chat_id, conversation_id = await chat_manager.save_chat(
                user_id=user_id,
                query=chat_data.query,
                response=answer,
                sources=context_chunks,
                session_id=chat_data.session_id,
                conversation_id=chat_data.conversation_id,
                metadata=metadata,
            )

            user_memory_service.store_chat_memory(
                user_id=user_id,
                conversation_id=conversation_id,
                query=chat_data.query,
                response=answer,
            )

            logger.info(f"✅ Study-place update handled without RAG ({total_time_ms}ms)")

            from app.rag.models.chat import ChatSource, ChatMetadata
            from datetime import datetime

            return ChatResponse(
                id=chat_id,
                user_id=user_id,
                conversation_id=conversation_id,
                session_id=chat_data.session_id,
                timestamp=datetime.utcnow(),
                query=chat_data.query,
                response=answer,
                sources=[],
                metadata=ChatMetadata(**metadata),
            )

        # Special handling: study-place lookup ("where do I study", "what is my university")
        study_query_patterns = [
            r"\bwhere\s+do\s+i\s+study\b",
            r"\bwhat\s+is\s+my\s+university\b",
        ]
        if any(re.search(p, chat_data.query, re.IGNORECASE) for p in study_query_patterns):
            stored_place = await user_profile_service.get_study_place(user_id)
            if stored_place:
                answer = f"You study at {stored_place}."
            else:
                answer = "I don't know where you study yet. You can tell me by saying 'I study at ...'."

            context_chunks = []
            retrieval_time_ms = 0
            llm_time_ms = 0
            total_time_ms = int((time.time() - start_time) * 1000)

            metadata = {
                "retrieval_time_ms": retrieval_time_ms,
                "llm_time_ms": llm_time_ms,
                "total_time_ms": total_time_ms,
                "model_used": settings.groq_model,
                "chunks_retrieved": len(context_chunks),
            }

            chat_id, conversation_id = await chat_manager.save_chat(
                user_id=user_id,
                query=chat_data.query,
                response=answer,
                sources=context_chunks,
                session_id=chat_data.session_id,
                conversation_id=chat_data.conversation_id,
                metadata=metadata,
            )

            user_memory_service.store_chat_memory(
                user_id=user_id,
                conversation_id=conversation_id,
                query=chat_data.query,
                response=answer,
            )

            logger.info(f"✅ Study-place lookup handled from structured profile ({total_time_ms}ms)")

            from app.rag.models.chat import ChatSource, ChatMetadata
            from datetime import datetime

            return ChatResponse(
                id=chat_id,
                user_id=user_id,
                conversation_id=conversation_id,
                session_id=chat_data.session_id,
                timestamp=datetime.utcnow(),
                query=chat_data.query,
                response=answer,
                sources=[],
                metadata=ChatMetadata(**metadata),
            )
        
        # Retrieve context
        if chat_data.session_id:
            # Hybrid retrieval
            logger.info(f"🔍 Hybrid retrieval (session: {chat_data.session_id})")
            context_chunks, retrieval_time_ms = retriever_service.retrieve_hybrid(
                query=chat_data.query,
                user_id=user_id,
                session_id=chat_data.session_id
            )
            prompt_template = SYSTEM_PROMPT
        else:
            # Global KB + user memory (no session-specific report)
            logger.info("🔍 Global KB + user memory retrieval")
            context_chunks, retrieval_time_ms = retriever_service.retrieve_global_only(
                query=chat_data.query,
                user_id=user_id
            )
            prompt_template = GLOBAL_KB_ONLY_PROMPT
        
        # Generate answer
        llm_start = time.time()
        answer = llm_client.generate_answer(
            query=chat_data.query,
            context_chunks=context_chunks,
            system_prompt=prompt_template
        )
        llm_time_ms = int((time.time() - llm_start) * 1000)
        
        # Guardrails: Check output response
        if settings.enable_guardrails:
            output_result = guardrails_service.check_output(answer, chat_data.query)
            if not output_result.allowed:
                logger.warning(f"🚫 Guardrail blocked response for user {user_id}: {output_result.reason}")
                # Log the incident
                await guardrails_monitor.log_incident(
                    user_id=user_id,
                    query=chat_data.query,
                    result=output_result.to_dict()
                )
                # Return a safe error message instead of the potentially unsafe response
                answer = guardrails_service.get_blocked_message(output_result)
                logger.error(f"⚠️  Unsafe response blocked. Original query: {chat_data.query[:200]}")
        
        # Calculate total time
        total_time_ms = int((time.time() - start_time) * 1000)
        
        # Prepare metadata
        metadata = {
            "retrieval_time_ms": retrieval_time_ms,
            "llm_time_ms": llm_time_ms,
            "total_time_ms": total_time_ms,
            "model_used": settings.groq_model,
            "chunks_retrieved": len(context_chunks)
        }
        
        # Save chat to database
        chat_id, conversation_id = await chat_manager.save_chat(
            user_id=user_id,
            query=chat_data.query,
            response=answer,
            sources=context_chunks,
            session_id=chat_data.session_id,
            conversation_id=chat_data.conversation_id,
            metadata=metadata
        )
        
        # Store long-term user memory snippet for this chat turn
        user_memory_service.store_chat_memory(
            user_id=user_id,
            conversation_id=conversation_id,
            query=chat_data.query,
            response=answer,
        )
        
        logger.info(f"✅ Query complete ({total_time_ms}ms)")
        
        # Format response
        from app.rag.models.chat import ChatSource, ChatMetadata
        from datetime import datetime
        
        return ChatResponse(
            id=chat_id,
            user_id=user_id,
            conversation_id=conversation_id,
            session_id=chat_data.session_id,
            timestamp=datetime.utcnow(),
            query=chat_data.query,
            response=answer,
            sources=[
                ChatSource(
                    text=chunk.get("text", ""),
                    source=chunk.get("metadata", {}).get("source", "unknown"),
                    page=chunk.get("metadata", {}).get("page"),
                    score=chunk.get("score", 0.0),
                    metadata=chunk.get("metadata", {})
                )
                for chunk in context_chunks
            ],
            metadata=ChatMetadata(**metadata)
        )
        
    except Exception as e:
        logger.error(f"❌ Query failed: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Query processing failed: {str(e)}"
        )


@router.post("/stream")
async def query_rag_stream(
    chat_data: ChatCreate,
    current_user: dict = Depends(get_current_user)
):
    """
    Query the RAG system with streaming response
    
    Args:
        chat_data: Query data
        current_user: Authenticated user
        
    Returns:
        Streaming response
    """
    user_id = str(current_user.id)
    
    try:
        logger.info(f"💬 Streaming query from user {user_id}: {chat_data.query[:100]}...")
        
        # Guardrails: Check input query (for streaming)
        if settings.enable_guardrails:
            guardrail_result = guardrails_service.check_input(chat_data.query, user_id)
            if not guardrail_result.allowed:
                logger.warning(f"🚫 Guardrail blocked streaming query from user {user_id}: {guardrail_result.reason}")
                # Log incident
                await guardrails_monitor.log_incident(
                    user_id=user_id,
                    query=chat_data.query,
                    result=guardrail_result.to_dict()
                )
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail=guardrails_service.get_blocked_message(guardrail_result)
                )
        
        # Retrieve context
        if chat_data.session_id:
            context_chunks, _ = retriever_service.retrieve_hybrid(
                query=chat_data.query,
                user_id=user_id,
                session_id=chat_data.session_id
            )
            prompt_template = SYSTEM_PROMPT
        else:
            context_chunks, _ = retriever_service.retrieve_global_only(
                query=chat_data.query,
                user_id=user_id
            )
            prompt_template = GLOBAL_KB_ONLY_PROMPT
        
        # Stream answer
        def generate():
            for chunk in llm_client.stream_answer(
                query=chat_data.query,
                context_chunks=context_chunks,
                system_prompt=prompt_template
            ):
                yield chunk
        
        return StreamingResponse(generate(), media_type="text/plain")
        
    except Exception as e:
        logger.error(f"❌ Streaming query failed: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Streaming query failed: {str(e)}"
        )
