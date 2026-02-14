"""
JWT Handler wrapper for RAG routes
This module provides compatibility with the RAG routes' authentication expectations
"""
from app.auth.dependencies import get_current_user as _get_current_user

# Re-export for RAG routes compatibility
get_current_user = _get_current_user

__all__ = ['get_current_user']
