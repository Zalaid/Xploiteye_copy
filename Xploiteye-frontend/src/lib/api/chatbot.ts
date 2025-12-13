/**
 * XploitEye Chatbot & RAG API Service
 * Handles all communication with backend chat endpoints
 */

import axios, { AxiosInstance } from 'axios';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api';

export interface ChatMessage {
  id: string;
  type: 'user' | 'bot';
  content: string;
  timestamp: Date;
  route?: 'pdf' | 'rag' | 'unified';
  category?: 'cve' | 'remediation' | 'general' | 'exploit';
}

export interface ChatSession {
  session_id: string;
  user_id: string;
  filename: string;
  created_at: string;
  updated_at: string;
  conversation_history: any[];
}

export interface UploadPDFResponse {
  success: boolean;
  session_id: string;
  filename: string;
  pdf_length: number;
  message: string;
}

export interface QueryResponse {
  success: boolean;
  question?: string;
  answer?: string;
  data?: any;
  route?: string;
}

export interface RAGQueryResponse {
  success: boolean;
  data: {
    answer: string;
    sources: any[];
    context_used: boolean;
    query_analysis: any;
  };
}

export interface HistoryResponse {
  success: boolean;
  session_id: string;
  filename: string;
  history: any[];
}

export interface TranslateResponse {
  success: boolean;
  original: string;
  translated: string;
  target_language: string;
}

class ChatbotAPI {
  private api: AxiosInstance;
  private token: string | null = null;

  constructor() {
    this.api = axios.create({
      baseURL: API_BASE_URL,
      headers: {
        'Content-Type': 'application/json',
      },
    });

    // Add token to requests if available
    this.api.interceptors.request.use((config) => {
      if (this.token) {
        config.headers.Authorization = `Bearer ${this.token}`;
      }
      return config;
    });
  }

  setToken(token: string) {
    this.token = token;
  }

  // ============ CHATBOT ENDPOINTS (PDF Analysis) ============

  /**
   * Upload PDF report for analysis
   */
  async uploadPDF(file: File): Promise<UploadPDFResponse> {
    const formData = new FormData();
    formData.append('file', file);

    const response = await this.api.post<UploadPDFResponse>(
      '/chatbot/upload-pdf/',
      formData,
      {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      }
    );
    return response.data;
  }

  /**
   * Ask question about uploaded PDF
   */
  async queryPDF(sessionId: string, question: string): Promise<QueryResponse> {
    const response = await this.api.post<QueryResponse>('/chatbot/query/', {
      session_id: sessionId,
      question,
    });
    return response.data;
  }

  /**
   * Get conversation history for a session
   */
  async getHistory(sessionId: string): Promise<HistoryResponse> {
    const response = await this.api.get<HistoryResponse>('/chatbot/history/', {
      params: { session_id: sessionId },
    });
    return response.data;
  }

  /**
   * Clear/delete a chat session
   */
  async clearSession(sessionId: string): Promise<{ success: boolean; message: string }> {
    const response = await this.api.post('/chatbot/clear-session/', {
      session_id: sessionId,
    });
    return response.data;
  }

  /**
   * Get all sessions for current user
   */
  async getUserSessions(): Promise<{ success: boolean; sessions: ChatSession[]; total: number }> {
    const response = await this.api.get('/chatbot/user-sessions/');
    return response.data;
  }

  // ============ RAG ENDPOINTS (Documentation Search) ============

  /**
   * Query XploitEye documentation
   */
  async queryRAG(query: string, topK: number = 5): Promise<RAGQueryResponse> {
    const response = await this.api.post<RAGQueryResponse>('/rag/query/', {
      query,
      top_k: topK,
    });
    return response.data;
  }

  /**
   * Check RAG service health
   */
  async checkRAGHealth(): Promise<{
    success: boolean;
    status: string;
    service: string;
    collection: string;
    vectors_count: number;
  }> {
    const response = await this.api.get('/rag/health/');
    return response.data;
  }

  // ============ UNIFIED CHAT ENDPOINTS ============

  /**
   * Send unified query (auto-routes to PDF or RAG)
   */
  async unifiedQuery(
    query: string,
    sessionId?: string,
    forcedRoute?: 'pdf' | 'rag'
  ): Promise<QueryResponse> {
    const response = await this.api.post<QueryResponse>('/chat/unified-query/', {
      query,
      session_id: sessionId,
      forced_route: forcedRoute,
    });
    return response.data;
  }

  /**
   * Send voice query (audio to text, then route)
   */
  async voiceQuery(
    audioFile: File,
    sessionId?: string,
    forcedRoute?: 'pdf' | 'rag'
  ): Promise<QueryResponse> {
    const formData = new FormData();
    formData.append('audio', audioFile);
    if (sessionId) formData.append('session_id', sessionId);
    if (forcedRoute) formData.append('forced_route', forcedRoute);

    const response = await this.api.post<QueryResponse>(
      '/chat/voice-query/',
      formData,
      {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      }
    );
    return response.data;
  }

  /**
   * Translate text to target language
   */
  async translate(text: string, targetLanguage: string = 'ur'): Promise<TranslateResponse> {
    const response = await this.api.post<TranslateResponse>('/chat/translate/', {
      text,
      target_language: targetLanguage,
    });
    return response.data;
  }

  /**
   * Analyze query intent (shows suggested route)
   */
  async analyzeQuery(query: string): Promise<{
    success: boolean;
    analysis: any;
    suggested_route: 'pdf' | 'rag';
  }> {
    const response = await this.api.get('/chat/analyze-query/', {
      params: { query },
    });
    return response.data;
  }
}

// Export singleton instance
export const chatbotAPI = new ChatbotAPI();
