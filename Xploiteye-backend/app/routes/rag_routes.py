"""
XploitEye RAG API Routes - FastAPI endpoints for penetration testing documentation queries
"""

from fastapi import APIRouter, HTTPException, status
from pydantic import BaseModel
import logging

from app.services.rag_service import RAGRetriever

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/rag", tags=["RAG"])

# Initialize RAG retriever
rag_retriever = RAGRetriever()


class RAGQueryRequest(BaseModel):
    query: str
    top_k: int = 5


@router.post("/query/")
async def query_docs(request: RAGQueryRequest):
    """Query XploitEye penetration testing documentation using RAG"""
    try:
        if not request.query or not request.query.strip():
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Query cannot be empty"
            )

        result = rag_retriever.query(request.query, top_k=request.top_k)

        return {
            "success": True,
            "data": result
        }

    except Exception as e:
        logger.error(f"RAG query error: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=str(e)
        )


@router.get("/health/")
async def health_check():
    """RAG service health check"""
    try:
        health = rag_retriever.health_check()

        return {
            "success": health["healthy"],
            "status": health["status"],
            "service": "RAG",
            "collection": health.get("collection"),
            "vectors_count": health.get("vectors_count", 0)
        }

    except Exception as e:
        logger.error(f"Health check error: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="RAG service unhealthy"
        )
