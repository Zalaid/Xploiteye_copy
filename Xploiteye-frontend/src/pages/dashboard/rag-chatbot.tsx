"use client"

import React from 'react';
import Head from 'next/head';
import { DashboardLayout } from '@/components/layouts/DashboardLayout';
import { useState, useRef, useEffect } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Send, Bot, User, Shield, Search, BookOpen, AlertTriangle, Copy, ThumbsUp, ThumbsDown } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Textarea } from "@/components/ui/textarea"

interface Message {
  id: string
  type: "user" | "bot"
  content: string
  timestamp: Date
  category?: "cve" | "remediation" | "general" | "exploit"
}

const quickActions = [
  { icon: Search, label: "CVE Analysis", prompt: "Analyze CVE-2023-4911" },
  { icon: Shield, label: "Remediation", prompt: "SQL injection fixes" },
  { icon: AlertTriangle, label: "Risk Assessment", prompt: "Privilege escalation risks" },
  { icon: BookOpen, label: "Security Guide", prompt: "OWASP Top 10 guide" },
]

const sampleResponses = {
  cve: "CVE-2023-4911 is a buffer overflow vulnerability in GNU C Library's ld.so. This vulnerability allows local privilege escalation through SUID programs. **Exploitation**: The vulnerability can be triggered by setting specific environment variables that cause a buffer overflow in the dynamic linker. **Impact**: Local privilege escalation to root. **Remediation**: Update glibc to version 2.38-1 or later, implement proper input validation.",
  remediation:
    "**SQL Injection Remediation Steps:**\n\n1. **Input Validation**: Implement strict input validation and sanitization\n2. **Parameterized Queries**: Use prepared statements with parameterized queries\n3. **Stored Procedures**: Utilize stored procedures with proper input validation\n4. **Least Privilege**: Run database connections with minimal required privileges\n5. **WAF Implementation**: Deploy Web Application Firewall with SQL injection rules\n6. **Regular Testing**: Conduct regular penetration testing and code reviews",
  general:
    "The OWASP Top 10 represents the most critical web application security risks:\n\n1. **Injection** - SQL, NoSQL, OS command injection\n2. **Broken Authentication** - Session management flaws\n3. **Sensitive Data Exposure** - Inadequate protection of sensitive data\n4. **XML External Entities (XXE)** - Processing untrusted XML\n5. **Broken Access Control** - Improper authorization checks\n\n**Prevention**: Implement secure coding practices, regular security testing, and follow security frameworks like NIST or ISO 27001.",
  exploit:
    "**Privilege Escalation Risk Assessment:**\n\n**High Risk Indicators:**\n- SUID/SGID binaries with vulnerabilities\n- Kernel exploits (CVE-2022-0847, CVE-2021-4034)\n- Misconfigured sudo permissions\n- Writable system directories\n\n**Medium Risk:**\n- Service account misconfigurations\n- Weak file permissions\n- Outdated software versions\n\n**Mitigation Priority:**\n1. Patch kernel vulnerabilities immediately\n2. Review and restrict SUID binaries\n3. Implement proper access controls\n4. Regular security audits",
}

export function RAGChatbotPage() {
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState("")
  const [isTyping, setIsTyping] = useState(false)
  const [showQuickActions, setShowQuickActions] = useState(true)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages])

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

    // Simulate AI response
    setTimeout(() => {
      let category: Message["category"] = "general"
      let response = sampleResponses.general

      if (content.toLowerCase().includes("cve")) {
        category = "cve"
        response = sampleResponses.cve
      } else if (content.toLowerCase().includes("remediation") || content.toLowerCase().includes("fix")) {
        category = "remediation"
        response = sampleResponses.remediation
      } else if (content.toLowerCase().includes("exploit") || content.toLowerCase().includes("privilege")) {
        category = "exploit"
        response = sampleResponses.exploit
      }

      const botMessage: Message = {
        id: (Date.now() + 1).toString(),
        type: "bot",
        content: response,
        timestamp: new Date(),
        category,
      }

      setMessages((prev) => [...prev, botMessage])
      setIsTyping(false)
    }, 1500)
  }

  const handleQuickAction = (prompt: string) => {
    handleSendMessage(prompt)
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
              XploitEye RAG Chatbase
            </motion.h2>
            <p className="text-muted-foreground">AI-Powered Red & Blue Team Assistant</p>
          </div>
        </div>
      </div>

      <div className="flex-1 flex overflow-hidden">
        {/* Quick Actions Sidebar */}
        <div className="w-80 border-r border-border p-4 space-y-4 overflow-y-auto">
          <h3 className="font-semibold text-transparent bg-gradient-to-r from-red-400 to-blue-400 bg-clip-text">
            Capabilities
          </h3>
          <Card className="border-red-500/30 bg-gradient-to-br from-red-500/10 to-blue-500/10">
            <CardContent className="p-4 space-y-2">
              <div className="text-sm text-red-300">🔴 Red Team: CVE Analysis & Exploitation</div>
              <div className="text-sm text-blue-300">🔵 Blue Team: Vulnerability Remediation</div>
              <div className="text-sm text-purple-300">⚡ Risk Assessment & Analysis</div>
              <div className="text-sm text-green-300">🛡️ Security Best Practices</div>
              <div className="text-sm text-orange-300">🎯 Exploit Development</div>
              <div className="text-sm text-cyan-300">🔍 Threat Intelligence</div>
            </CardContent>
          </Card>
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
                    Your AI-powered Red & Blue Team assistant. Choose a quick action or ask me anything!
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
                      {message.category && message.type === "bot" && (
                        <Badge className={`mb-2 ${getCategoryColor(message.category)}`}>
                          {message.category.toUpperCase()}
                        </Badge>
                      )}
                      <div className="whitespace-pre-wrap text-sm break-words">{message.content}</div>
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
            <div ref={messagesEndRef} />
          </div>

          {/* Input Area */}
          <div className="border-t border-border p-4">
            <div className="flex space-x-3">
              <Textarea
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Ask about CVEs, vulnerabilities, remediation steps, or security guidance..."
                className="flex-1 min-h-[60px] max-h-32 resize-none border-purple-500/30 focus:border-purple-500/50"
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault()
                    handleSendMessage(input)
                  }
                }}
              />
              <Button
                onClick={() => handleSendMessage(input)}
                disabled={!input.trim() || isTyping}
                className="bg-gradient-to-r from-red-500 via-purple-600 to-blue-500 hover:from-red-600 hover:via-purple-700 hover:to-blue-600 self-end"
              >
                <Send className="w-4 h-4" />
              </Button>
            </div>
            <div className="text-xs text-muted-foreground mt-2">Press Enter to send, Shift+Enter for new line</div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default function RAGChatbotPageWrapper() {
  return (
    <>
      <Head>
        <title>RAG Chatbot - XploitEye Dashboard</title>
        <meta name="description" content="AI-powered security knowledge chatbot" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
      </Head>
      <DashboardLayout>
        <RAGChatbotPage />
      </DashboardLayout>
    </>
  );
}
