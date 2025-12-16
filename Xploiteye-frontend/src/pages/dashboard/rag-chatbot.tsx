"use client"

import React from 'react';
import Head from 'next/head';
import { DashboardLayout } from '@/components/layouts/DashboardLayout';
import { useState, useRef, useEffect } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Send, Bot, User, Shield, Search, BookOpen, AlertTriangle, Copy, ThumbsUp, ThumbsDown, Upload, Mic, Trash2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Textarea } from "@/components/ui/textarea"
import { chatbotAPI, ChatSession } from '@/lib/api/chatbot'

interface Message {
  id: string
  type: "user" | "bot"
  content: string
  timestamp: Date
  category?: "cve" | "remediation" | "general" | "exploit"
  route?: "pdf" | "rag" | "unified"
}

const quickActions = [
  { icon: Search, label: "CVE Analysis", prompt: "Analyze CVE vulnerabilities in the scan report" },
  { icon: Shield, label: "Remediation", prompt: "What are the remediation steps for critical findings?" },
  { icon: AlertTriangle, label: "Risk Assessment", prompt: "What are the privilege escalation risks?" },
  { icon: BookOpen, label: "Security Guide", prompt: "How does the red agent network work?" },
]

export function RAGChatbotEnhancedPage() {
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState("")
  const [isTyping, setIsTyping] = useState(false)
  const [showQuickActions, setShowQuickActions] = useState(true)
  const [isLoading, setIsLoading] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  // Session management
  const [currentSession, setCurrentSession] = useState<string | null>(null)
  const [currentFilename, setCurrentFilename] = useState<string | null>(null)
  const [sessions, setSessions] = useState<ChatSession[]>([])
  const [isLoadingSessions, setIsLoadingSessions] = useState(false)

  // Route mode
  const [routeMode, setRouteMode] = useState<'pdf' | 'rag' | 'unified'>('unified')

  // Translation
  const [translationLanguage, setTranslationLanguage] = useState('ur')
  const [isTranslating, setIsTranslating] = useState(false)

  // Voice
  const [isRecording, setIsRecording] = useState(false)
  const mediaRecorderRef = useRef<MediaRecorder | null>(null)
  const audioChunksRef = useRef<Blob[]>([])

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  // Load user sessions on mount
  useEffect(() => {
    loadSessions()
  }, [])

  const loadSessions = async () => {
    try {
      setIsLoadingSessions(true)
      const result = await chatbotAPI.getUserSessions()
      if (result.success && result.sessions) {
        setSessions(result.sessions)
      }
    } catch (error: any) {
      // Silently fail if no auth (422, 401, etc) - user sessions are optional
      if (error.response?.status === 422 || error.response?.status === 401) {
        console.log('User sessions require authentication - skipping')
        setSessions([])
      } else {
        console.error('Failed to load sessions:', error)
      }
    } finally {
      setIsLoadingSessions(false)
    }
  }

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    try {
      setIsLoading(true)
      const response = await chatbotAPI.uploadPDF(file)

      if (response.success) {
        setCurrentSession(response.session_id)
        setCurrentFilename(response.filename)
        setMessages([])
        setShowQuickActions(true)
        setRouteMode('pdf')

        // Add success message
        const successMsg: Message = {
          id: Date.now().toString(),
          type: 'bot',
          content: `✅ PDF loaded successfully: ${response.filename}\n\nI can now analyze this XploitEye scan report. Ask me about vulnerabilities, CVEs, remediation steps, or any findings in the report.`,
          timestamp: new Date(),
          route: 'pdf',
        }
        setMessages([successMsg])

        // Reload sessions
        loadSessions()
      }
    } catch (error) {
      console.error('Upload error:', error)
      const errorMsg: Message = {
        id: Date.now().toString(),
        type: 'bot',
        content: '❌ Failed to upload PDF. Please try again.',
        timestamp: new Date(),
      }
      setMessages(prev => [...prev, errorMsg])
    } finally {
      setIsLoading(false)
    }
  }

  const handleSendMessage = async (content: string) => {
    if (!content.trim()) return

    const userMessage: Message = {
      id: Date.now().toString(),
      type: "user",
      content: content.trim(),
      timestamp: new Date(),
    }

    setMessages((prev) => [...prev, userMessage])
    setInput("")
    setIsTyping(true)
    setShowQuickActions(false)

    try {
      let response: any

      if (routeMode === 'pdf' && currentSession) {
        // Use PDF chatbot
        response = await chatbotAPI.queryPDF(currentSession, content)
      } else if (routeMode === 'rag') {
        // Use RAG search
        response = await chatbotAPI.queryRAG(content)
      } else {
        // Use unified routing
        response = await chatbotAPI.unifiedQuery(content, currentSession || undefined)
      }

      let botContent = response.answer || response.data?.answer || 'No response received'

      const botMessage: Message = {
        id: (Date.now() + 1).toString(),
        type: "bot",
        content: botContent,
        timestamp: new Date(),
        route: response.route || routeMode,
        category: detectCategory(content),
      }

      setMessages((prev) => [...prev, botMessage])

      // If translation enabled, translate the response
      if (translationLanguage !== 'en') {
        try {
          setIsTranslating(true)
          const translated = await chatbotAPI.translate(botContent, translationLanguage)
          if (translated.success) {
            const translatedMsg: Message = {
              id: (Date.now() + 2).toString(),
              type: "bot",
              content: `🌍 ${translationLanguage.toUpperCase()}:\n${translated.translated}`,
              timestamp: new Date(),
              route: response.route || routeMode,
            }
            setMessages((prev) => [...prev, translatedMsg])
          }
        } catch (error) {
          console.error('Translation error:', error)
        } finally {
          setIsTranslating(false)
        }
      }
    } catch (error: any) {
      console.error('Query error:', error)
      let errorContent = '❌ Error processing query. Please try again.'

      if (error.response?.status === 422) {
        errorContent = '⚠️ Invalid request. Check your input and try again.'
      } else if (error.response?.status === 401) {
        errorContent = '🔐 Authentication required. Please sign in.'
      } else if (error.response?.status === 500) {
        errorContent = '⚠️ Backend error. Please try again in a moment.'
      } else if (error.message === 'Network Error') {
        errorContent = '🌐 Cannot connect to server. Ensure backend is running on port 8000.'
      }

      const errorMsg: Message = {
        id: (Date.now() + 1).toString(),
        type: "bot",
        content: errorContent,
        timestamp: new Date(),
      }
      setMessages((prev) => [...prev, errorMsg])
    } finally {
      setIsTyping(false)
    }
  }

  const handleQuickAction = (prompt: string) => {
    handleSendMessage(prompt)
  }

  const handleSessionSelect = async (session: ChatSession) => {
    setCurrentSession(session.session_id)
    setCurrentFilename(session.filename)
    setMessages([])
    setShowQuickActions(true)
    setRouteMode('pdf')

    try {
      const history = await chatbotAPI.getHistory(session.session_id)
      if (history.success && history.history.length > 0) {
        const loadedMessages = history.history.map((msg, idx) => ({
          id: idx.toString(),
          type: msg.role as 'user' | 'bot',
          content: msg.content,
          timestamp: new Date(),
          route: 'pdf' as const,
        }))
        setMessages(loadedMessages)
        setShowQuickActions(false)
      }
    } catch (error) {
      console.error('Failed to load session history:', error)
    }
  }

  const handleClearSession = async (sessionId: string) => {
    try {
      await chatbotAPI.clearSession(sessionId)
      if (currentSession === sessionId) {
        setCurrentSession(null)
        setCurrentFilename(null)
        setMessages([])
      }
      loadSessions()
    } catch (error) {
      console.error('Failed to clear session:', error)
    }
  }

  const handleStartVoiceRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      const mediaRecorder = new MediaRecorder(stream)
      mediaRecorderRef.current = mediaRecorder
      audioChunksRef.current = []

      mediaRecorder.ondataavailable = (event) => {
        audioChunksRef.current.push(event.data)
      }

      mediaRecorder.onstop = async () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/mp3' })
        const audioFile = new File([audioBlob], 'voice-query.mp3', { type: 'audio/mp3' })

        try {
          const response = await chatbotAPI.voiceQuery(audioFile, currentSession || undefined)
          handleSendMessage(response.question || 'Voice query processed')
        } catch (error) {
          console.error('Voice query error:', error)
        }
      }

      mediaRecorder.start()
      setIsRecording(true)
    } catch (error) {
      console.error('Microphone access denied:', error)
    }
  }

  const handleStopVoiceRecording = () => {
    if (mediaRecorderRef.current) {
      mediaRecorderRef.current.stop()
      mediaRecorderRef.current.stream.getTracks().forEach(track => track.stop())
      setIsRecording(false)
    }
  }

  const detectCategory = (query: string): Message['category'] => {
    const lower = query.toLowerCase()
    if (lower.includes('cve')) return 'cve'
    if (lower.includes('remediation') || lower.includes('fix')) return 'remediation'
    if (lower.includes('exploit') || lower.includes('privilege')) return 'exploit'
    return 'general'
  }

  const getCategoryColor = (category?: string) => {
    switch (category) {
      case "cve":
        return "bg-red-500/20 text-red-400 border-red-500/30"
      case "remediation":
        return "bg-green-500/20 text-green-400 border-green-500/30"
      case "exploit":
        return "bg-orange-500/20 text-orange-400 border-orange-500/30"
      default:
        return "bg-blue-500/20 text-blue-400 border-blue-500/30"
    }
  }

  const getRouteBadgeColor = (route?: string) => {
    switch (route) {
      case 'pdf':
        return 'bg-purple-500/20 text-purple-400'
      case 'rag':
        return 'bg-cyan-500/20 text-cyan-400'
      default:
        return 'bg-gray-500/20 text-gray-400'
    }
  }

  return (
    <div className="flex flex-col h-screen bg-background">
      {/* Header */}
      <div className="border-b border-border p-6">
        <div className="flex items-center space-x-3">
          <motion.div
            className="w-10 h-10 bg-gradient-to-br from-red-500 via-purple-600 to-blue-500 rounded-lg flex items-center justify-center"
            animate={{
              boxShadow: [
                "0 0 20px rgba(239, 68, 68, 0.5)",
                "0 0 20px rgba(59, 130, 246, 0.5)",
                "0 0 20px rgba(239, 68, 68, 0.5)",
              ],
            }}
            transition={{ duration: 2, repeat: Number.POSITIVE_INFINITY }}
          >
            <motion.div
              animate={{ rotate: [0, 10, -10, 0] }}
              transition={{ duration: 2, repeat: Number.POSITIVE_INFINITY }}
            >
              <Bot className="w-6 h-6 text-white" />
            </motion.div>
          </motion.div>
          <div>
            <motion.h2
              className="text-2xl font-bold bg-gradient-to-r from-red-400 via-purple-500 to-blue-400 bg-clip-text text-transparent mb-2"
              animate={{
                backgroundPosition: ["0% 50%", "100% 50%", "0% 50%"],
              }}
              transition={{ duration: 3, repeat: Number.POSITIVE_INFINITY }}
            >
              XploitEye AI Assistant
            </motion.h2>
            <p className="text-muted-foreground">Red & Blue Team Penetration Testing Assistant</p>
          </div>
        </div>
      </div>

      <div className="flex-1 flex overflow-hidden">
        {/* Left Sidebar */}
        <div className="w-80 border-r border-border p-4 space-y-4 overflow-y-auto bg-card/50">
          {/* Capabilities */}
          <div>
            <h3 className="font-semibold text-transparent bg-gradient-to-r from-red-400 to-blue-400 bg-clip-text mb-3">
              Capabilities
            </h3>
            <Card className="border-red-500/30 bg-gradient-to-br from-red-500/10 to-blue-500/10">
              <CardContent className="p-4 space-y-2 text-sm">
                <div className="text-red-300">🔴 Red Team: CVE Analysis & Exploitation</div>
                <div className="text-blue-300">🔵 Blue Team: Vulnerability Remediation</div>
                <div className="text-purple-300">⚡ Risk Assessment & Analysis</div>
              </CardContent>
            </Card>
          </div>

          {/* PDF Upload */}
          <div>
            <h3 className="font-semibold text-sm mb-2">📁 Upload Scan Report</h3>
            <input
              ref={fileInputRef}
              type="file"
              accept=".pdf"
              onChange={handleFileUpload}
              className="hidden"
            />
            <Button
              onClick={() => fileInputRef.current?.click()}
              disabled={isLoading}
              variant="outline"
              className="w-full border-dashed border-purple-500/50 hover:bg-purple-500/10"
            >
              <Upload className="w-4 h-4 mr-2" />
              {currentFilename ? 'Change PDF' : 'Upload PDF'}
            </Button>
            {currentFilename && (
              <p className="text-xs text-muted-foreground mt-2 truncate">📄 {currentFilename}</p>
            )}
          </div>

          {/* Route Mode */}
          <div>
            <h3 className="font-semibold text-sm mb-2">🎯 Chat Mode</h3>
            <div className="space-y-2">
              {(['pdf', 'rag', 'unified'] as const).map((mode) => (
                <label key={mode} className="flex items-center space-x-2 cursor-pointer">
                  <input
                    type="radio"
                    name="route"
                    value={mode}
                    checked={routeMode === mode}
                    onChange={(e) => setRouteMode(e.target.value as any)}
                    disabled={mode === 'pdf' && !currentSession}
                    className="w-4 h-4"
                  />
                  <span className="text-sm">
                    {mode === 'pdf' ? '📄 PDF Report' : mode === 'rag' ? '📚 Documentation' : '🤖 Auto-Route'}
                  </span>
                </label>
              ))}
            </div>
          </div>

          {/* Translation */}
          <div>
            <h3 className="font-semibold text-sm mb-2">🌍 Translation</h3>
            <select
              value={translationLanguage}
              onChange={(e) => setTranslationLanguage(e.target.value)}
              className="w-full px-3 py-2 bg-background border border-border rounded-md text-sm"
            >
              <option value="en">English (No Translation)</option>
              <option value="ur">Urdu</option>
              <option value="es">Spanish</option>
              <option value="fr">French</option>
              <option value="de">German</option>
              <option value="ar">Arabic</option>
              <option value="zh">Chinese</option>
            </select>
          </div>

          {/* Sessions */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <h3 className="font-semibold text-sm">💬 Chat History</h3>
              {isLoadingSessions && <span className="text-xs text-muted-foreground">Loading...</span>}
            </div>
            <div className="space-y-2 max-h-48 overflow-y-auto">
              {sessions.map((session) => (
                <div
                  key={session.session_id}
                  className={`p-2 rounded-md cursor-pointer text-sm transition-colors ${
                    currentSession === session.session_id
                      ? 'bg-purple-500/30 border border-purple-500/50'
                      : 'bg-background border border-border hover:bg-card'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div onClick={() => handleSessionSelect(session)} className="flex-1 min-w-0">
                      <p className="text-xs font-medium truncate">{session.filename}</p>
                      <p className="text-xs text-muted-foreground truncate">
                        {new Date(session.created_at).toLocaleDateString()}
                      </p>
                    </div>
                    <button
                      onClick={() => handleClearSession(session.session_id)}
                      className="text-muted-foreground hover:text-red-400 ml-2"
                    >
                      <Trash2 className="w-3 h-3" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Chat Area */}
        <div className="flex-1 flex flex-col">
          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-6 space-y-4">
            {showQuickActions && messages.length === 0 && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex flex-col items-center justify-center h-full space-y-6"
              >
                <div className="text-center mb-8">
                  <p className="text-muted-foreground">
                    {currentSession
                      ? 'Ask questions about your uploaded scan report or XploitEye features'
                      : 'Upload an XploitEye scan report or ask about penetration testing features'}
                  </p>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-w-4xl">
                  {quickActions.map((action, index) => (
                    <motion.div
                      key={index}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.1 }}
                      whileHover={{ scale: 1.02, boxShadow: "0 0 20px rgba(139, 92, 246, 0.3)" }}
                      whileTap={{ scale: 0.98 }}
                    >
                      <Button
                        variant="outline"
                        className="w-full h-20 p-4 border-purple-500/30 hover:bg-gradient-to-r hover:from-red-500/10 hover:to-blue-500/10 bg-transparent text-left"
                        onClick={() => handleQuickAction(action.prompt)}
                      >
                        <div className="flex items-center space-x-3 w-full">
                          <motion.div
                            animate={{ rotate: [0, 5, -5, 0] }}
                            transition={{ duration: 2, repeat: Number.POSITIVE_INFINITY, delay: index * 0.2 }}
                            className="flex-shrink-0"
                          >
                            <action.icon className="w-6 h-6 text-purple-400" />
                          </motion.div>
                          <div className="flex-1 min-w-0">
                            <div className="font-medium text-white mb-1 text-sm">{action.label}</div>
                            <div className="text-xs text-muted-foreground line-clamp-1">{action.prompt}</div>
                          </div>
                        </div>
                      </Button>
                    </motion.div>
                  ))}
                </div>
              </motion.div>
            )}

            <AnimatePresence>
              {messages.map((message) => (
                <motion.div
                  key={message.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  className={`flex ${message.type === "user" ? "justify-end" : "justify-start"}`}
                >
                  <div
                    className={`flex space-x-3 max-w-4xl ${message.type === "user" ? "flex-row-reverse space-x-reverse" : ""}`}
                  >
                    <div
                      className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${
                        message.type === "user"
                          ? "bg-gradient-to-br from-blue-400 to-blue-600"
                          : "bg-gradient-to-br from-green-400 to-emerald-600"
                      }`}
                    >
                      {message.type === "user" ? (
                        <User className="w-4 h-4 text-white" />
                      ) : (
                        <Bot className="w-4 h-4 text-white" />
                      )}
                    </div>
                    <div
                      className={`rounded-lg p-4 max-w-full ${
                        message.type === "user"
                          ? "bg-blue-500/20 border border-blue-500/30"
                          : "bg-card border border-border"
                      }`}
                    >
                      {message.route && message.type === "bot" && (
                        <Badge className={`mb-2 ${getRouteBadgeColor(message.route)}`}>
                          {message.route === 'pdf' ? '📄 PDF' : message.route === 'rag' ? '📚 RAG' : '🤖 Unified'}
                        </Badge>
                      )}
                      {message.category && message.type === "bot" && (
                        <Badge className={`mb-2 ml-2 ${getCategoryColor(message.category)}`}>
                          {message.category.toUpperCase()}
                        </Badge>
                      )}
                      <div className="whitespace-pre-wrap text-sm break-words markdown-content">
                        {message.content}
                      </div>
                      <div className="flex items-center justify-between mt-3">
                        <div className="text-xs text-muted-foreground">{message.timestamp.toLocaleTimeString()}</div>
                        {message.type === "bot" && (
                          <div className="flex space-x-1">
                            <Button variant="ghost" size="sm" className="h-6 w-6 p-0">
                              <Copy className="w-3 h-3" />
                            </Button>
                            <Button variant="ghost" size="sm" className="h-6 w-6 p-0">
                              <ThumbsUp className="w-3 h-3" />
                            </Button>
                            <Button variant="ghost" size="sm" className="h-6 w-6 p-0">
                              <ThumbsDown className="w-3 h-3" />
                            </Button>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>

            {isTyping && (
              <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="flex justify-start">
                <div className="flex space-x-3 max-w-4xl">
                  <div className="w-8 h-8 rounded-full bg-gradient-to-br from-green-400 to-emerald-600 flex items-center justify-center">
                    <Bot className="w-4 h-4 text-white" />
                  </div>
                  <div className="bg-card border border-border rounded-lg p-4">
                    <div className="flex space-x-1">
                      <motion.div
                        animate={{ scale: [1, 1.2, 1] }}
                        transition={{ duration: 1, repeat: Number.POSITIVE_INFINITY, delay: 0 }}
                        className="w-2 h-2 bg-green-400 rounded-full"
                      />
                      <motion.div
                        animate={{ scale: [1, 1.2, 1] }}
                        transition={{ duration: 1, repeat: Number.POSITIVE_INFINITY, delay: 0.2 }}
                        className="w-2 h-2 bg-green-400 rounded-full"
                      />
                      <motion.div
                        animate={{ scale: [1, 1.2, 1] }}
                        transition={{ duration: 1, repeat: Number.POSITIVE_INFINITY, delay: 0.4 }}
                        className="w-2 h-2 bg-green-400 rounded-full"
                      />
                    </div>
                  </div>
                </div>
              </motion.div>
            )}

            {(isTyping || isTranslating) && (
              <div className="text-xs text-muted-foreground text-center">
                {isTranslating ? '🌍 Translating...' : '⏳ Processing...'}
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* Input Area */}
          <div className="border-t border-border p-4">
            <div className="flex space-x-3">
              {/* Voice Input */}
              <Button
                onClick={isRecording ? handleStopVoiceRecording : handleStartVoiceRecording}
                variant={isRecording ? 'destructive' : 'outline'}
                size="sm"
                title="Click to record voice"
              >
                <Mic className={`w-4 h-4 ${isRecording ? 'animate-pulse' : ''}`} />
              </Button>

              {/* Text Input */}
              <Textarea
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Ask about your scan report, CVEs, remediation, or XploitEye features..."
                className="flex-1 min-h-[60px] max-h-32 resize-none border-purple-500/30 focus:border-purple-500/50"
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault()
                    handleSendMessage(input)
                  }
                }}
              />

              {/* Send Button */}
              <Button
                onClick={() => handleSendMessage(input)}
                disabled={!input.trim() || isTyping || isLoading}
                className="bg-gradient-to-r from-red-500 via-purple-600 to-blue-500 hover:from-red-600 hover:via-purple-700 hover:to-blue-600 self-end"
              >
                <Send className="w-4 h-4" />
              </Button>
            </div>
            <div className="text-xs text-muted-foreground mt-2 flex items-center justify-between">
              <span>Press Enter to send, Shift+Enter for new line</span>
              {currentSession && <span className="text-purple-400">📄 PDF Chat Mode</span>}
            </div>
          </div>
        </div>
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
        <RAGChatbotEnhancedPage />
      </DashboardLayout>
    </>
  );
}
