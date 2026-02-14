"use client"

import React, { useState, useRef, useEffect } from 'react';
import Head from 'next/head';
import { DashboardLayout } from '@/components/layouts/DashboardLayout';
import { useSessionStore, useChatStore } from '@/lib/store';
import { queryAPI, chatAPI, sessionAPI } from '@/lib/api/chatbot';
import { cn } from '@/lib/utils';
import { Send, Bot, User, AlertCircle, FileText, Trash2, ChevronDown, Check, Shield } from 'lucide-react';
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
    addMessage,
    setMessages,
    setCurrentConversationId,
    setConversations,
    clearMessages,
  } = useChatStore()
  const [query, setQuery] = useState('')
  const [loading, setLoading] = useState(false)
  const [showReportDropdown, setShowReportDropdown] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const dropdownRef = useRef<HTMLDivElement>(null)

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  // Initial load of sessions and history
  useEffect(() => {
    loadSessions();
  }, []);

  const loadSessions = async () => {
    try {
      const result = await sessionAPI.getSessions();
      if (result.sessions) {
        setSessions(result.sessions);
      }
    } catch (error) {
      console.error('Failed to load sessions:', error);
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
    setCurrentConversationId(null)
    clearMessages()
    setShowReportDropdown(false)
    toast.success(`Selected report: ${session.scan_report_name}`)

    // Optionally load history for this session if needed
    // loadSessionHistory(session.session_id);
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

    // Add user message immediately
    const userMessage = {
      id: `temp-${Date.now()}`,
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

      // Update conversation_id if this was a new conversation
      if (response.conversation_id && response.conversation_id !== currentConversationId) {
        setCurrentConversationId(response.conversation_id)
        // Refresh conversations list
        try {
          const convData = await chatAPI.getConversations(50)
          setConversations(convData.conversations || [])
        } catch (e) {
          console.error('Failed to refresh conversations:', e)
        }
      }

      // Add assistant response
      addMessage(response)
    } catch (error: any) {
      const errorMessage = getErrorMessage(error)
      toast.error(errorMessage)
      addMessage({
        id: `error-${Date.now()}`,
        user_id: '',
        session_id: currentSession?.session_id || null,
        timestamp: new Date().toISOString(),
        query: userQuery,
        response: errorMessage,
        sources: [],
      })
    } finally {
      setLoading(false)
    }
  }

  const handleDeleteChat = async (chatId: string) => {
    if (!confirm('Are you sure you want to delete this message?')) return

    try {
      await chatAPI.deleteChat(chatId)
      setMessages(messages.filter((m) => m.id !== chatId))
      toast.success('Message deleted')
    } catch (error: any) {
      toast.error('Failed to delete message')
    }
  }

  return (
    <div className="flex flex-col h-[calc(100vh-100px)] bg-background">
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
        {messages.length === 0 ? (
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
          messages.map((message, index) => (
            <div key={message.id || index} className="group">
              {/* User Query */}
              <div className="flex items-start space-x-3 mb-6 justify-end">
                <div className="flex-1 max-w-2xl text-right">
                  <div className="flex items-center justify-end mb-1 space-x-2">
                    {message.id && !message.id.startsWith('temp') && !message.id.startsWith('error') && (
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
                  <div className="bg-primary text-primary-foreground rounded-2xl rounded-tr-none px-4 py-3 inline-block text-left">
                    <p>{message.query}</p>
                  </div>
                </div>
                <div className="flex-shrink-0 w-8 h-8 bg-background border border-border rounded-full flex items-center justify-center">
                  <User className="w-4 h-4 text-primary" />
                </div>
              </div>

              {/* Assistant Response */}
              {message.response && (
                <div className="flex items-start space-x-3 max-w-4xl">
                  <div className="flex-shrink-0 w-8 h-8 bg-primary rounded-full flex items-center justify-center">
                    <Bot className="w-4 h-4 text-primary-foreground" />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center justify-between mb-1">
                      <p className="text-xs text-muted-foreground">XploitEye Assistant</p>
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

                      {/* Sources */}
                      {message.sources && message.sources.length > 0 && (
                        <div className="mt-4 pt-4 border-t border-border">
                          <p className="text-xs font-semibold text-muted-foreground mb-2">
                            📚 Sources ({message.sources.length})
                          </p>
                          <div className="grid gap-2 grid-cols-1 md:grid-cols-2">
                            {message.sources.slice(0, 4).map((source, idx) => (
                              <div
                                key={idx}
                                className="bg-muted/50 border border-border rounded p-2 text-xs"
                              >
                                <div className="flex items-center justify-between mb-1">
                                  <span className="text-primary font-medium">
                                    {source.source === 'user_report' ? '📄 Scan Report' : '📚 Global KB'}
                                  </span>
                                  <span className="text-muted-foreground">
                                    Score: {(source.score * 100).toFixed(0)}%
                                  </span>
                                </div>
                                {source.metadata?.page && (
                                  <p className="text-muted-foreground mb-1">Page {source.metadata.page}</p>
                                )}
                                <p className="text-muted-foreground line-clamp-2 italic opacity-80">"{source.text}"</p>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

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
              )}
            </div>
          ))
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
