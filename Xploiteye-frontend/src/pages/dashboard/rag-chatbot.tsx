"use client"

import React, { useState, useRef, useEffect } from 'react';
import Head from 'next/head';
import { DashboardLayout } from '@/components/layouts/DashboardLayout';
import { useSessionStore, useChatStore } from '@/lib/store';
import { queryAPI, chatAPI, sessionAPI, uploadAPI } from '@/lib/api/chatbot';
import { cn } from '@/lib/utils';
import { Send, Bot, User, AlertCircle, FileText, Trash2, ChevronDown, Check, Shield, Upload, MessageSquarePlus, PanelLeftClose, PanelLeft } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import toast, { Toaster } from 'react-hot-toast';
import { format } from 'date-fns';

function formatDate(date: string | Date): string {
  return format(new Date(date), 'MMM d, yyyy');
}

// Helper function to extract error message from various error formats
function getErrorMessage(error: any): string {
  const detail = error.response?.data?.detail
  if (!detail) return error.message || 'Query failed'
  if (typeof detail === 'string') return detail
  if (Array.isArray(detail)) return detail.map((err: any) => err.msg || JSON.stringify(err)).join(', ')
  if (typeof detail === 'object') return detail.msg || detail.message || JSON.stringify(detail)
  return 'Query failed'
}

function ChatInterface() {
  const { currentSession, sessions, setCurrentSession, setSessions } = useSessionStore()
  const {
    messages,
    currentConversationId,
    conversations,
    addMessage,
    setMessages,
    setCurrentConversationId,
    setConversations,
    clearMessages,
    removeConversation,
  } = useChatStore()
  const [query, setQuery] = useState('')
  const [loading, setLoading] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [showReportDropdown, setShowReportDropdown] = useState(false)
  const [sidebarOpen, setSidebarOpen] = useState(true)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const dropdownRef = useRef<HTMLDivElement>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  // Normalize backend chat to frontend message shape (id, query, response, ...)
  const normalizeChat = (chat: any) => ({
    id: chat.id ?? chat._id ?? `chat-${Date.now()}`,
    user_id: chat.user_id ?? '',
    session_id: chat.session_id ?? null,
    timestamp: chat.timestamp ?? new Date().toISOString(),
    query: String(chat.query ?? chat.user_query ?? '').trim(),
    response: String(chat.response ?? '').trim(),
    sources: Array.isArray(chat.sources) ? chat.sources : [],
    metadata: chat.metadata,
    conversation_id: chat.conversation_id,
  });

  // Load previous chat (memory) for current user
  const loadPreviousChat = async () => {
    try {
      const convData = await chatAPI.getConversations(10);
      const conversations = convData.conversations ?? [];
      if (conversations.length === 0) return;
      const latest = conversations[0];
      const convId = latest.conversation_id;
      const { chats } = await chatAPI.getConversationChats(convId, 100);
      const chatsList = Array.isArray(chats) ? chats : [];
      if (chatsList.length > 0) {
        setMessages((prev) => {
          const list = Array.isArray(prev) ? prev : [];
          const hasPendingUser = list.some((m) => m.id?.startsWith('user-'));
          if (hasPendingUser) return list;
          return chatsList.map(normalizeChat);
        });
        setCurrentConversationId(convId);
      }
    } catch (e) {
      console.error('Failed to load previous chat:', e);
    }
  };

  // Load chat history for a specific session (report)
  const loadSessionHistory = async (sessionId: string) => {
    try {
      const result = await chatAPI.getSessionHistory(sessionId, 50);
      const list = Array.isArray(result.chats) ? result.chats : [];
      if (list.length > 0) {
        setMessages(list.map(normalizeChat));
        const first = list[0];
        if (first.conversation_id) setCurrentConversationId(first.conversation_id);
      } else {
        clearMessages();
      }
    } catch (e) {
      console.error('Failed to load session history:', e);
      clearMessages();
    }
  };

  // Load conversation list for sidebar (titles)
  const loadConversations = async () => {
    try {
      const data = await chatAPI.getConversations(50);
      setConversations(Array.isArray(data.conversations) ? data.conversations : []);
    } catch (e) {
      console.error('Failed to load conversations:', e);
    }
  };

  // Select a previous conversation from sidebar → load its messages (sidebar stays open so user can switch anytime)
  const handleSelectConversation = async (conv: { conversation_id: string }) => {
    const convId = conv.conversation_id;
    setCurrentConversationId(convId);
    try {
      const { chats } = await chatAPI.getConversationChats(convId, 100);
      const list = Array.isArray(chats) ? chats : [];
      setMessages(list.map(normalizeChat));
    } catch (e) {
      console.error('Failed to load conversation:', e);
      toast.error('Failed to load conversation');
    }
  };

  const handleNewChat = () => {
    clearMessages();
    setCurrentConversationId(null);
    toast.success('New chat started');
  };

  const handleDeleteConversation = async (e: React.MouseEvent, convId: string) => {
    e.stopPropagation();
    if (!confirm('Delete this conversation? This cannot be undone.')) return;
    try {
      await chatAPI.deleteConversation(convId);
      removeConversation(convId);
      if (currentConversationId === convId) {
        clearMessages();
        setCurrentConversationId(null);
      }
      toast.success('Conversation deleted');
    } catch (err: any) {
      toast.error(err.response?.data?.detail ?? 'Failed to delete');
    }
  };

  // Initial load of sessions, conversation list (sidebar), and latest chat
  useEffect(() => {
    loadSessions();
    loadConversations();
    loadPreviousChat();
  }, []);

  const loadSessions = async () => {
    try {
      const result = await sessionAPI.getSessions();
      // Backend returns the sessions array directly, not { sessions: [...] }
      const list = Array.isArray(result) ? result : (result?.sessions ?? []);
      setSessions(list);
    } catch (error) {
      console.error('Failed to load sessions:', error);
    }
  };

  const handleUploadReport = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.name.toLowerCase().endsWith('.pdf')) {
      toast.error('Only PDF files are allowed');
      return;
    }
    setUploading(true);
    try {
      const session = await uploadAPI.uploadScanReport(file);
      await loadSessions();
      setCurrentSession(session);
      setCurrentConversationId(null);
      clearMessages();
      setShowReportDropdown(false);
      toast.success(`Report "${session.scan_report_name}" uploaded and ready for questions`);
    } catch (err: any) {
      const msg = err.response?.data?.detail ?? err.message ?? 'Upload failed';
      toast.error(typeof msg === 'string' ? msg : JSON.stringify(msg));
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setShowReportDropdown(false)
      }
    }

    if (showReportDropdown) {
      document.addEventListener('mousedown', handleClickOutside)
      return () => document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [showReportDropdown])

  const handleSelectReport = (session: any) => {
    setCurrentSession(session)
    setShowReportDropdown(false)
    toast.success(`Selected report: ${session.scan_report_name}`)
    loadSessionHistory(session.session_id)
  }

  const handleDeselectReport = () => {
    setCurrentSession(null)
    setCurrentConversationId(null)
    clearMessages()
    setShowReportDropdown(false)
    toast.success('Switched to Global Knowledge Base')
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!query.trim()) return

    const userQuery = query.trim()
    setQuery('')
    setLoading(true)

    // ChatGPT-style: add user message first so it shows immediately, then append assistant reply when API returns
    const userMessageId = `user-${Date.now()}`
    const userMessage = {
      id: userMessageId,
      user_id: '',
      session_id: currentSession?.session_id || null,
      timestamp: new Date().toISOString(),
      query: userQuery,
      response: '',
      sources: [],
    }
    addMessage(userMessage)

    try {
      const response = await queryAPI.query({
        query: userQuery,
        session_id: currentSession?.session_id,
        conversation_id: currentConversationId || undefined,
      })

      if (response.conversation_id && response.conversation_id !== currentConversationId) {
        setCurrentConversationId(response.conversation_id)
        try {
          const convData = await chatAPI.getConversations(50)
          setConversations(convData.conversations || [])
        } catch (e) {
          console.error('Failed to refresh conversations:', e)
        }
      }

      // Append assistant message; ensure user message stays in list with query so "You" bubble always shows (guards against loadPreviousChat race)
      const assistantMessage = {
        id: response?.id ?? `assistant-${Date.now()}`,
        user_id: response?.user_id ?? '',
        session_id: response?.session_id ?? currentSession?.session_id ?? null,
        conversation_id: response?.conversation_id ?? currentConversationId ?? null,
        timestamp: (response as any)?.timestamp ?? new Date().toISOString(),
        query: '',
        response: String((response as any)?.response ?? '').trim(),
        sources: Array.isArray((response as any)?.sources) ? (response as any).sources : [],
        metadata: (response as any)?.metadata ?? undefined,
      }
      const userMessageForList = {
        id: userMessageId,
        user_id: '',
        session_id: currentSession?.session_id || null,
        timestamp: new Date().toISOString(),
        query: userQuery,
        response: '',
        sources: [],
      }
      setMessages((prev) => {
        const list = Array.isArray(prev) ? prev : []
        const withoutThisTurn = list.filter((m) => m.id !== userMessageId && m.id !== (assistantMessage.id as string))
        return [...withoutThisTurn, userMessageForList, assistantMessage]
      })
    } catch (error: any) {
      const errorMessage = getErrorMessage(error)
      toast.error(errorMessage)
      const errorMessageId = `error-${Date.now()}`
      const userMessageForList = {
        id: userMessageId,
        user_id: '',
        session_id: currentSession?.session_id || null,
        timestamp: new Date().toISOString(),
        query: userQuery,
        response: '',
        sources: [],
      }
      setMessages((prev) => {
        const list = Array.isArray(prev) ? prev : []
        const withoutThisTurn = list.filter((m) => m.id !== userMessageId)
        return [
          ...withoutThisTurn,
          userMessageForList,
          {
            id: errorMessageId,
            user_id: '',
            session_id: currentSession?.session_id || null,
            timestamp: new Date().toISOString(),
            query: '',
            response: errorMessage,
            sources: [],
          },
        ]
      })
    } finally {
      setLoading(false)
    }
  }

  const handleDeleteChat = async (chatId: string) => {
    if (!confirm('Are you sure you want to delete this message?')) return

    try {
      if (!chatId.startsWith('user-') && !chatId.startsWith('assistant-')) {
        await chatAPI.deleteChat(chatId)
      }
      setMessages((prev) => {
        const list = Array.isArray(prev) ? prev : []
        const idx = list.findIndex((m) => m.id === chatId)
        if (idx < 0) return list
        const next = list.filter((m) => m.id !== chatId)
        if (chatId.startsWith('assistant-') && idx > 0 && list[idx - 1].id.startsWith('user-')) {
          return next.filter((m) => m.id !== list[idx - 1].id)
        }
        return next
      })
      toast.success('Message deleted')
    } catch (error: any) {
      toast.error('Failed to delete message')
    }
  }

  const conversationList = Array.isArray(conversations) ? conversations : [];

  return (
    <div className="flex h-[calc(100vh-100px)] bg-background">
      {/* Sidebar: previous chats (ChatGPT-style) */}
      <aside
        className={cn(
          'flex flex-col border-r border-border bg-card/50 transition-all duration-200 overflow-hidden',
          sidebarOpen ? 'w-64 min-w-[16rem]' : 'w-0 min-w-0'
        )}
      >
        <div className="p-3 border-b border-border flex items-center justify-between shrink-0">
          <span className="text-sm font-semibold text-foreground truncate">Previous chats</span>
          <button
            type="button"
            onClick={() => setSidebarOpen(false)}
            className="p-1.5 rounded-md hover:bg-muted text-muted-foreground"
            aria-label="Close sidebar"
          >
            <PanelLeftClose className="w-4 h-4" />
          </button>
        </div>
        <button
          type="button"
          onClick={handleNewChat}
          className="m-3 flex items-center gap-2 px-3 py-2 rounded-lg border border-dashed border-border hover:bg-muted hover:border-primary/30 text-sm font-medium transition-colors"
        >
          <MessageSquarePlus className="w-4 h-4 text-primary" />
          New chat
        </button>
        <div className="flex-1 overflow-y-auto px-2 pb-4 space-y-0.5">
          {conversationList.length === 0 ? (
            <p className="text-xs text-muted-foreground px-2 py-4">No previous chats yet</p>
          ) : (
            conversationList.map((conv: any) => (
              <div
                key={conv.conversation_id}
                onClick={() => handleSelectConversation(conv)}
                className={cn(
                  'group flex items-center gap-2 rounded-lg px-3 py-2.5 cursor-pointer transition-colors',
                  currentConversationId === conv.conversation_id
                    ? 'bg-primary/15 text-primary border border-primary/30'
                    : 'hover:bg-muted/80 border border-transparent'
                )}
              >
                <span className="flex-1 min-w-0 text-left text-sm truncate" title={conv.title || conv.conversation_id}>
                  {conv.title || 'Untitled chat'}
                </span>
                <button
                  type="button"
                  onClick={(e) => handleDeleteConversation(e, conv.conversation_id)}
                  className="opacity-0 group-hover:opacity-100 p-1 rounded hover:bg-destructive/20 text-destructive shrink-0 transition-opacity"
                  aria-label="Delete conversation"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            ))
          )}
        </div>
      </aside>

      {/* Toggle sidebar when closed */}
      {!sidebarOpen && (
        <button
          type="button"
          onClick={() => setSidebarOpen(true)}
          className="fixed left-2 top-[calc(6rem+0.5rem)] z-10 p-2 rounded-md bg-card border border-border shadow hover:bg-muted"
          aria-label="Open sidebar"
        >
          <PanelLeft className="w-4 h-4 text-muted-foreground" />
        </button>
      )}

      {/* Main: header + messages + input */}
      <div className="flex-1 flex flex-col min-w-0">
      {/* Header */}
      <div className="border-b border-border p-4 bg-card/50">
        <div className="flex items-center justify-between">
          <div className="flex-1">
            {/* Report Selector Dropdown */}
            <div className="relative" ref={dropdownRef}>
              <button
                onClick={() => setShowReportDropdown(!showReportDropdown)}
                className={cn(
                  'flex items-center justify-between w-full max-w-md px-4 py-2 rounded-lg border transition-all text-left bg-background hover:bg-muted/50',
                  currentSession
                    ? 'border-primary/50 ring-1 ring-primary/20'
                    : 'border-border'
                )}
              >
                <div className="flex items-center space-x-2 flex-1 min-w-0">
                  <FileText className={cn(
                    'w-4 h-4 flex-shrink-0',
                    currentSession ? 'text-primary' : 'text-muted-foreground'
                  )} />
                  <span className="text-sm font-medium truncate">
                    {currentSession ? currentSession.scan_report_name : 'Select Report or Use Global KB'}
                  </span>
                </div>
                <ChevronDown className={cn(
                  'w-4 h-4 ml-2 flex-shrink-0 transition-transform',
                  showReportDropdown ? 'rotate-180' : '',
                  currentSession ? 'text-primary' : 'text-muted-foreground'
                )} />
              </button>

              {/* Dropdown Menu */}
              {showReportDropdown && (
                <div className="absolute top-full left-0 mt-2 w-full max-w-md bg-card border border-border rounded-lg shadow-xl z-50 max-h-96 overflow-y-auto">
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept=".pdf"
                    className="hidden"
                    onChange={handleUploadReport}
                  />
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={uploading}
                    className="w-full px-4 py-3 flex items-center justify-center gap-2 hover:bg-muted transition-colors border-b border-border text-primary font-medium disabled:opacity-50"
                  >
                    <Upload className="w-4 h-4" />
                    {uploading ? 'Uploading…' : 'Upload new report (PDF)'}
                  </button>
                  <button
                    onClick={handleDeselectReport}
                    className={cn(
                      'w-full px-4 py-3 flex items-center justify-between hover:bg-muted transition-colors border-b border-border',
                      !currentSession && 'bg-muted/50'
                    )}
                  >
                    <div className="flex items-center space-x-2">
                      <Shield className="w-4 h-4 text-primary" />
                      <div className="text-left">
                        <div className="text-sm font-medium">Global Knowledge Base</div>
                        <div className="text-xs text-muted-foreground">OWASP, CVE, MITRE, Guides</div>
                      </div>
                    </div>
                    {!currentSession && <Check className="w-4 h-4 text-primary" />}
                  </button>

                  {sessions.length > 0 ? (
                    sessions.map((session) => (
                      <button
                        key={session.session_id}
                        onClick={() => handleSelectReport(session)}
                        className={cn(
                          'w-full px-4 py-3 flex items-center justify-between hover:bg-muted transition-colors border-b border-border last:border-0',
                          currentSession?.session_id === session.session_id && 'bg-muted/50'
                        )}
                      >
                        <div className="flex items-center space-x-2 flex-1 min-w-0">
                          <FileText className="w-4 h-4 text-primary flex-shrink-0" />
                          <div className="text-left flex-1 min-w-0">
                            <div className="text-sm font-medium truncate">
                              {session.scan_report_name}
                            </div>
                            <div className="text-xs text-muted-foreground">
                              {formatDate(session.created_at)}
                            </div>
                          </div>
                        </div>
                        {currentSession?.session_id === session.session_id && (
                          <Check className="w-4 h-4 text-primary flex-shrink-0" />
                        )}
                      </button>
                    ))
                  ) : (
                    <div className="px-4 py-3 text-center text-sm text-muted-foreground">
                      No reports uploaded yet
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Status Text */}
            <p className="text-xs text-muted-foreground mt-2 ml-1">
              {currentSession
                ? 'Hybrid RAG: 70% Scan Report + 30% Global KB'
                : 'Querying OWASP, CVE, MITRE, and Security Guides'}
            </p>
          </div>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-6 space-y-6">
        {(Array.isArray(messages) ? messages : []).length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center p-8">
            <div className="w-16 h-16 bg-primary/10 rounded-2xl flex items-center justify-center mb-6">
              <Bot className="w-8 h-8 text-primary" />
            </div>
            <h3 className="text-2xl font-semibold mb-3">
              Welcome to XploitEye AI
            </h3>
            <p className="text-muted-foreground max-w-md">
              {currentSession
                ? 'Ask questions about your scan report. I\'ll analyze vulnerabilities and provide remediation guidance.'
                : 'Ask questions about cybersecurity topics. I\'ll provide insights from OWASP, CVE, MITRE, and security best practices.'}
            </p>
          </div>
        ) : (
          (Array.isArray(messages) ? messages : []).map((message, index) => {
              const userText = String(message.query ?? (message as any).user_query ?? '').trim()
              const showUserBubble = userText.length > 0
              return (
            <div key={message.id || index} className="group space-y-6">
              {/* User message: show only when we have question text (no fallback "Your question") */}
              {showUserBubble ? (
                <div className="flex items-start space-x-3 justify-end">
                  <div className="flex-1 max-w-2xl text-right">
                    <div className="flex items-center justify-end mb-1 space-x-2">
                      {message.id && !message.id.startsWith('user-') && !message.id.startsWith('assistant-') && !message.id.startsWith('error') && (
                        <button
                          onClick={() => handleDeleteChat(message.id)}
                          className="opacity-0 group-hover:opacity-100 p-1 hover:bg-destructive/10 rounded transition-all text-destructive hover:text-destructive/80"
                          title="Delete message"
                        >
                          <Trash2 className="w-3 h-3" />
                        </button>
                      )}
                      <p className="text-xs text-muted-foreground">You</p>
                    </div>
                    <div className="bg-primary rounded-2xl rounded-tr-none px-4 py-3 inline-block text-left min-h-[2.5rem] select-text text-white">
                      <p className="whitespace-pre-wrap break-words text-white">
                        {userText}
                      </p>
                    </div>
                  </div>
                  <div className="flex-shrink-0 w-8 h-8 bg-background border border-border rounded-full flex items-center justify-center">
                    <User className="w-4 h-4 text-primary" />
                  </div>
                </div>
              ) : null}

              {/* Assistant response (show below user message) */}
              {message.response ? (
                <div className="flex items-start space-x-3 max-w-4xl">
                  <div className="flex-shrink-0 w-8 h-8 bg-primary rounded-full flex items-center justify-center">
                    <Bot className="w-4 h-4 text-primary-foreground" />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center justify-between mb-1">
                      <p className="text-xs text-muted-foreground">XploitEye Assistant</p>
                      {message.id && !message.id.startsWith('user-') && !message.id.startsWith('assistant-') && !message.id.startsWith('error') && (
                        <button
                          onClick={() => handleDeleteChat(message.id)}
                          className="opacity-0 group-hover:opacity-100 p-1 hover:bg-destructive/10 rounded transition-all text-destructive hover:text-destructive/80"
                          title="Delete message"
                        >
                          <Trash2 className="w-3 h-3" />
                        </button>
                      )}
                    </div>
                    <div className={cn(
                      "rounded-2xl rounded-tl-none p-6 shadow-sm",
                      message.id && message.id.startsWith('error')
                        ? "bg-destructive/10 border border-destructive/20"
                        : "bg-card border border-border"
                    )}>
                      {message.id && message.id.startsWith('error') && (
                        <div className="flex items-center space-x-2 mb-3 pb-3 border-b border-destructive/20">
                          <AlertCircle className="w-5 h-5 text-destructive flex-shrink-0" />
                          <p className="text-sm font-medium text-destructive">Request Not Processed</p>
                        </div>
                      )}
                      <div className="prose prose-sm dark:prose-invert max-w-none">
                        <ReactMarkdown>
                          {message.response}
                        </ReactMarkdown>
                      </div>

                      {/* Metadata */}
                      {message.metadata && (
                        <div className="mt-3 flex flex-wrap gap-4 text-[10px] text-muted-foreground uppercase tracking-wider">
                          <span>⚡ {message.metadata.total_time_ms}ms</span>
                          <span>🔍 {message.metadata.chunks_retrieved} chunks</span>
                          <span>🤖 {message.metadata.model_used}</span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ) : null}
            </div>
          ); })
        )}

        {loading && (
          <div className="flex items-start space-x-3 max-w-3xl">
            <div className="flex-shrink-0 w-8 h-8 bg-primary rounded-full flex items-center justify-center">
              <Bot className="w-4 h-4 text-primary-foreground" />
            </div>
            <div className="bg-card border border-border rounded-2xl rounded-tl-none p-4">
              <div className="flex items-center space-x-2">
                <div className="w-2 h-2 bg-primary rounded-full animate-bounce [animation-delay:-0.3s]"></div>
                <div className="w-2 h-2 bg-primary rounded-full animate-bounce [animation-delay:-0.15s]"></div>
                <div className="w-2 h-2 bg-primary rounded-full animate-bounce"></div>
                <span className="text-muted-foreground text-sm ml-2">Analyzing cybersecurity knowledge base...</span>
              </div>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="p-4 bg-card/50 border-t border-border">
        {currentSession ? (
          <div className="mb-3 flex items-center space-x-2 text-xs text-primary bg-primary/10 border border-primary/20 rounded-lg p-2 max-w-fit">
            <FileText className="w-3 h-3 flex-shrink-0" />
            <span>
              <strong className="font-semibold">{currentSession.scan_report_name}</strong> selected
            </span>
          </div>
        ) : (
          <div className="mb-3 flex items-center space-x-2 text-xs text-amber-500 bg-amber-500/10 border border-amber-500/20 rounded-lg p-2 max-w-fit">
            <Shield className="w-3 h-3 flex-shrink-0" />
            <span>Global Knowledge Base Mode (General Security Questions)</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="flex space-x-3">
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={
              currentSession
                ? `Ask questions about ${currentSession.scan_report_name}...`
                : 'Ask about vulnerabilities, best practices, OWASP, etc...'
            }
            disabled={loading}
            className="flex-1 px-4 py-3 bg-background border border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all disabled:opacity-50"
          />
          <button
            type="submit"
            disabled={loading || !query.trim()}
            className="px-6 py-3 bg-gradient-to-r from-red-500 via-purple-600 to-blue-500 text-white font-medium rounded-xl hover:opacity-90 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2 shadow-lg shadow-purple-500/20"
          >
            <Send className="w-5 h-5" />
            <span className="hidden sm:inline">Send</span>
          </button>
        </form>
        <p className="text-[10px] text-muted-foreground text-center mt-2">
          XploitEye AI can make mistakes. Verify important security information.
        </p>
      </div>
      <Toaster position="top-right" />
      </div>
    </div>
  )
}

export default function RAGChatbotEnhancedPageWrapper() {
  return (
    <>
      <Head>
        <title>AI Assistant - XploitEye Dashboard</title>
        <meta name="description" content="AI-powered security analysis and penetration testing assistant" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
      </Head>
      <DashboardLayout>
        <ChatInterface />
      </DashboardLayout>
    </>
  );
}
