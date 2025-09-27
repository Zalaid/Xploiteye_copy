"use client"

import { useState, useEffect, useRef } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Terminal, Copy, Download, Maximize2, Minimize2 } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"

interface TerminalLine {
  id: string
  timestamp: string
  type: "info" | "success" | "warning" | "error" | "scan"
  content: string
  highlight?: boolean
}

interface EnhancedTerminalOutputProps {
  isActive?: boolean
  title?: string
  className?: string
}

export function EnhancedTerminalOutput({
  isActive = false,
  title = "Live Scan Output",
  className = "",
}: EnhancedTerminalOutputProps) {
  const [lines, setLines] = useState<TerminalLine[]>([])
  const [isExpanded, setIsExpanded] = useState(false)
  const [isScrolledToBottom, setIsScrolledToBottom] = useState(true)
  const terminalRef = useRef<HTMLDivElement>(null)
  const scrollRef = useRef<HTMLDivElement>(null)

  // Mock terminal output simulation
  useEffect(() => {
    if (!isActive) return

    const mockLines = [
      { type: "info", content: "🚀 Initializing XploitEye scanning engine..." },
      { type: "info", content: "🔍 Target validation: webapp-prod.example.com" },
      { type: "success", content: "✅ Target ownership verified" },
      { type: "info", content: "🌐 Starting reconnaissance phase..." },
      { type: "scan", content: "📡 Port scanning: 80/tcp open (http)" },
      { type: "scan", content: "📡 Port scanning: 443/tcp open (https)" },
      { type: "scan", content: "📡 Port scanning: 22/tcp open (ssh)" },
      { type: "info", content: "🔎 Web application fingerprinting..." },
      { type: "success", content: "🎯 Detected: Apache/2.4.41 (Ubuntu)" },
      { type: "success", content: "🎯 Detected: PHP/7.4.3" },
      { type: "warning", content: "⚠️  Outdated PHP version detected" },
      { type: "info", content: "🕷️  Starting web crawler..." },
      { type: "scan", content: "📄 Discovered: /admin/login.php" },
      { type: "scan", content: "📄 Discovered: /api/v1/users" },
      { type: "scan", content: "📄 Discovered: /uploads/" },
      { type: "info", content: "🔍 Vulnerability assessment phase..." },
      { type: "error", content: "🚨 CRITICAL: SQL Injection found in /api/v1/users" },
      { type: "error", content: "🚨 HIGH: XSS vulnerability in /search.php" },
      { type: "warning", content: "⚠️  MEDIUM: Directory traversal in /uploads/" },
      { type: "info", content: "🤖 AI analysis in progress..." },
      { type: "success", content: "✅ Attack path modeling completed" },
      { type: "success", content: "✅ Remediation guidance generated" },
    ]

    let currentIndex = 0
    const interval = setInterval(() => {
      if (currentIndex < mockLines.length) {
        const line = mockLines[currentIndex]
        const newLine: TerminalLine = {
          id: `line-${Date.now()}-${currentIndex}`,
          timestamp: new Date().toLocaleTimeString(),
          type: line.type as any,
          content: line.content,
          highlight: line.type === "error" || line.type === "warning",
        }

        setLines((prev) => [...prev, newLine])
        currentIndex++
      } else {
        clearInterval(interval)
      }
    }, 800)

    return () => clearInterval(interval)
  }, [isActive])

  // Auto-scroll to bottom
  useEffect(() => {
    if (isScrolledToBottom && scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight
    }
  }, [lines, isScrolledToBottom])

  const getLineColor = (type: string) => {
    switch (type) {
      case "success":
        return "text-green-400"
      case "error":
        return "text-red-400"
      case "warning":
        return "text-yellow-400"
      case "scan":
        return "text-cyan-400"
      default:
        return "text-gray-300"
    }
  }

  const getLineIcon = (type: string) => {
    switch (type) {
      case "success":
        return "✅"
      case "error":
        return "🚨"
      case "warning":
        return "⚠️"
      case "scan":
        return "📡"
      default:
        return "ℹ️"
    }
  }

  return (
    <motion.div layout className={`${className}`}>
      <Card className="bg-gradient-to-br from-gray-900/90 to-black/80 border-gray-700 overflow-hidden">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center space-x-2">
              <motion.div
                animate={isActive ? { rotate: 360 } : {}}
                transition={{ duration: 2, repeat: isActive ? Number.POSITIVE_INFINITY : 0 }}
              >
                <Terminal className="w-5 h-5 text-green-400" />
              </motion.div>
              <span className="text-green-400">{title}</span>
              {isActive && (
                <motion.div
                  animate={{ opacity: [1, 0.3, 1] }}
                  transition={{ duration: 1.5, repeat: Number.POSITIVE_INFINITY }}
                >
                  <Badge className="bg-green-500/20 text-green-400 border-green-500/30">LIVE</Badge>
                </motion.div>
              )}
            </CardTitle>

            <div className="flex items-center space-x-2">
              <Button variant="ghost" size="sm" onClick={() => setIsExpanded(!isExpanded)}>
                {isExpanded ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
              </Button>
              <Button variant="ghost" size="sm">
                <Copy className="w-4 h-4" />
              </Button>
              <Button variant="ghost" size="sm">
                <Download className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </CardHeader>

        <CardContent className="p-0">
          <motion.div
            ref={scrollRef}
            layout
            className={`
              bg-black/90 font-mono text-sm overflow-y-auto scrollbar-thin scrollbar-thumb-gray-600 scrollbar-track-gray-800
              ${isExpanded ? "h-96" : "h-64"}
            `}
            onScroll={(e) => {
              const target = e.target as HTMLDivElement
              const isAtBottom = target.scrollHeight - target.scrollTop === target.clientHeight
              setIsScrolledToBottom(isAtBottom)
            }}
          >
            <div className="p-4 space-y-1">
              <AnimatePresence>
                {lines.map((line, index) => (
                  <motion.div
                    key={line.id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.3, delay: index * 0.05 }}
                    className={`
                      flex items-start space-x-3 py-1 px-2 rounded
                      ${line.highlight ? "bg-red-500/10 border-l-2 border-red-500" : ""}
                      ${line.type === "warning" ? "bg-yellow-500/10 border-l-2 border-yellow-500" : ""}
                    `}
                  >
                    <span className="text-gray-500 text-xs mt-0.5 min-w-[80px]">{line.timestamp}</span>
                    <span className="text-lg leading-none">{getLineIcon(line.type)}</span>
                    <span className={`${getLineColor(line.type)} flex-1`}>{line.content}</span>
                  </motion.div>
                ))}
              </AnimatePresence>

              {/* Cursor */}
              {isActive && (
                <motion.div
                  animate={{ opacity: [1, 0] }}
                  transition={{ duration: 1, repeat: Number.POSITIVE_INFINITY }}
                  className="flex items-center space-x-3 py-1 px-2"
                >
                  <span className="text-gray-500 text-xs min-w-[80px]">{new Date().toLocaleTimeString()}</span>
                  <span className="text-green-400">▋</span>
                </motion.div>
              )}
            </div>
          </motion.div>
        </CardContent>
      </Card>
    </motion.div>
  )
}
