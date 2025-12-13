"""
RAG URL Configuration
"""
from django.urls import path
from rag import views

urlpatterns = [
    path('query/', views.query_docs, name='query_docs'),
    path('health/', views.health_check, name='rag_health'),
]