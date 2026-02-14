/**
 * XploitEye Chatbot & RAG API Service
 * Handles all communication with backend chat endpoints
 */

import axios from 'axios';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || '';

// Create axios instance
const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Helper function to get auth headers
const getAuthHeaders = () => {
  const token = localStorage.getItem('access_token');
  return token ? { Authorization: `Bearer ${token}` } : {};
};

// Request interceptor to add auth token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('access_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor for token refresh
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;

      try {
        const refreshToken = localStorage.getItem('refresh_token');
        if (refreshToken) {
          const response = await axios.post(`${API_BASE_URL}/api/auth/refresh`, {
            refresh_token: refreshToken,
          });

          const { access_token } = response.data;
          localStorage.setItem('access_token', access_token);

          originalRequest.headers.Authorization = `Bearer ${access_token}`;
          return api(originalRequest);
        }
      } catch (refreshError) {
        console.error('Token refresh failed, logging out');
        localStorage.removeItem('access_token');
        localStorage.removeItem('refresh_token');
        localStorage.removeItem('user');

        if (typeof window !== 'undefined' && !window.location.pathname.startsWith('/auth')) {
          window.location.href = '/auth/login';
        }
        return Promise.reject(refreshError);
      }
    }

    return Promise.reject(error);
  }
);

// API functions
export const authAPI = {
  getCurrentUser: async () => {
    const response = await api.get('/api/auth/me', {
      headers: getAuthHeaders()
    });
    return response.data;
  },
};

export const uploadAPI = {
  uploadScanReport: async (file: File) => {
    const formData = new FormData();
    formData.append('file', file);

    const response = await api.post('/api/rag/upload/scan-report', formData, {
      headers: {
        ...getAuthHeaders(),
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  },
};

export const queryAPI = {
  query: async (data: { query: string; session_id?: string; conversation_id?: string }) => {
    const response = await api.post('/api/rag/query', data, {
      headers: getAuthHeaders()
    });
    return response.data;
  },

  streamQuery: async (data: { query: string; session_id?: string }) => {
    const response = await api.post('/api/rag/query/stream', data, {
      headers: getAuthHeaders(),
      responseType: 'stream',
    });
    return response.data;
  },
};

export const chatAPI = {
  getHistory: async (limit: number = 50, skip: number = 0) => {
    const response = await api.get('/api/rag/chat/history', {
      params: { limit, skip },
      headers: getAuthHeaders()
    });
    return response.data;
  },

  getSessionHistory: async (sessionId: string, limit: number = 50) => {
    const response = await api.get(`/api/rag/chat/history/${sessionId}`, {
      params: { limit },
      headers: getAuthHeaders()
    });
    return response.data;
  },

  getConversations: async (limit: number = 50) => {
    const response = await api.get('/api/rag/chat/conversations', {
      params: { limit },
      headers: getAuthHeaders()
    });
    return response.data;
  },

  getConversationChats: async (conversationId: string, limit: number = 100) => {
    const response = await api.get(`/api/rag/chat/conversations/${conversationId}`, {
      params: { limit },
      headers: getAuthHeaders()
    });
    return response.data;
  },

  deleteConversation: async (conversationId: string) => {
    const response = await api.delete(`/api/rag/chat/conversations/${conversationId}`, {
      headers: getAuthHeaders()
    });
    return response.data;
  },

  deleteChat: async (chatId: string) => {
    const response = await api.delete(`/api/rag/chat/history/${chatId}`, {
      headers: getAuthHeaders()
    });
    return response.data;
  },
};

export const sessionAPI = {
  getSessions: async () => {
    const response = await api.get('/api/rag/sessions', {
      headers: getAuthHeaders()
    });
    return response.data;
  },

  deleteSession: async (sessionId: string) => {
    const response = await api.delete(`/api/rag/sessions/${sessionId}`, {
      headers: getAuthHeaders()
    });
    return response.data;
  },

  extendSession: async (sessionId: string, days: number = 7) => {
    const response = await api.post(`/api/rag/sessions/${sessionId}/extend`, { days }, {
      headers: getAuthHeaders()
    });
    return response.data;
  },
};

export default api;
