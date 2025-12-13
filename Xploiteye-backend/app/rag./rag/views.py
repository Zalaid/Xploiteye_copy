"""
RAG Query API Views
"""
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import AllowAny
from rest_framework.response import Response
from rest_framework import status
import logging

from rag.services.rag_retriever import RAGRetriever

logger = logging.getLogger(__name__)


@api_view(['POST'])
@permission_classes([AllowAny])  # Change to IsAuthenticated if you want auth
def query_docs(request):
    """
    Query SherlockDroid documentation using RAG
    
    Request body:
    {
        "query": "How does static analysis work?",
        "top_k": 5  // optional, default 5
    }
    
    Response:
    {
        "success": true,
        "data": {
            "answer": "...",
            "sources": [...],
            "context_used": true,
            "query_analysis": {...}
        }
    }
    """
    try:
        # Get query from request
        query = request.data.get('query')
        top_k = request.data.get('top_k', 5)
        
        # Validate
        if not query:
            return Response(
                {
                    "success": False,
                    "error": "Query is required"
                },
                status=status.HTTP_400_BAD_REQUEST
            )
        
        if not isinstance(query, str) or len(query.strip()) == 0:
            return Response(
                {
                    "success": False,
                    "error": "Query must be a non-empty string"
                },
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Validate top_k
        try:
            top_k = int(top_k)
            if top_k < 1 or top_k > 10:
                top_k = 5
        except:
            top_k = 5
        
        logger.info(f"Received query: {query[:100]}...")
        
        # Initialize retriever and process query
        retriever = RAGRetriever()
        result = retriever.query(query, top_k=top_k)
        
        return Response(
            {
                "success": True,
                "data": result
            },
            status=status.HTTP_200_OK
        )
        
    except Exception as e:
        logger.error(f"Query API error: {e}")
        return Response(
            {
                "success": False,
                "error": "Internal server error",
                "details": str(e)
            },
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )


@api_view(['GET'])
@permission_classes([AllowAny])
def health_check(request):
    """
    Health check endpoint for RAG system
    """
    try:
        retriever = RAGRetriever()
        
        # Try to connect to Qdrant
        collection_info = retriever.qdrant_client.get_collection(
            retriever.collection_name
        )
        
        return Response(
            {
                "success": True,
                "status": "healthy",
                "collection": retriever.collection_name,
                "vectors_count": collection_info.points_count
            },
            status=status.HTTP_200_OK
        )
        
    except Exception as e:
        return Response(
            {
                "success": False,
                "status": "unhealthy",
                "error": str(e)
            },
            status=status.HTTP_503_SERVICE_UNAVAILABLE
        )