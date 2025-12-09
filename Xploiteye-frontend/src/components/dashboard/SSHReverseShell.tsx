"use client"

import React, { useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Terminal, Send, Copy, Check, Power } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'

interface SSHReverseShellProps {
  isConnected: boolean
  sessionId: string
  targetHost: string
  onClose?: () => void
}

interface ShellOutput {
  type: 'command' | 'output' | 'system'
  content: string
  timestamp: number
}

const API_URL = 'http://localhost:8000/api/ssh'

const QUANTUM_SHELL_MESSAGES = [
  '[+] Initializing quantum shell... loaded.',
  '[+] Scanning local nodes....',
  '[+] Establishing encrypted link >>> OK',
  '[>] Parsing system entropy... ███████████░ 91%',
  '[+] Deploying virtual agent to sandbox instance…',
  '[>] Mounting shadow filesystem... success.',
  '[+] Launching deep packet observer in stealth mode…',
  '[>] Monitoring kernel interrupts... stable.',
  '[+] Spinning up parallel threads: 1 2 3 4 5 ... ready.',
  '[>] Injecting test payload into simulation layer…',
  '[+] Decrypting telemetry feed... COMPLETE.',
  '[>] Ghost protocols active. Latency nominal.',
  '[+] Compiling autonomous script engine…',
  '[!] System ready. Awaiting next command...',
]

export function SSHReverseShell({ isConnected, sessionId, targetHost, onClose }: SSHReverseShellProps) {
  const [connected, setConnected] = useState(false)
  const [shellReady, setShellReady] = useState(false)
  const [output, setOutput] = useState<ShellOutput[]>([])
  const [inputValue, setInputValue] = useState('')
  const [executedCommands, setExecutedCommands] = useState(0)
  const [isExecuting, setIsExecuting] = useState(false)
  const [loadingProgress, setLoadingProgress] = useState(0)
  const outputRef = useRef<HTMLDivElement>(null)

  // Initialize with connection message and 25-second loading phase
  useEffect(() => {
    if (isConnected) {
      setConnected(true)

      // Show initial connection message
      setOutput([
        {
          type: 'system',
          content: `✓ Reverse shell connected to ${targetHost}`,
          timestamp: Date.now(),
        },
        {
          type: 'system',
          content: 'Establishing full shell access...',
          timestamp: Date.now(),
        },
        {
          type: 'output',
          content: '',
          timestamp: Date.now(),
        },
      ])

      // Display quantum shell initialization messages
      let messageIndex = 0
      const messageInterval = setInterval(() => {
        if (messageIndex < QUANTUM_SHELL_MESSAGES.length) {
          const message = QUANTUM_SHELL_MESSAGES[messageIndex]

          setOutput((prev) => [
            ...prev.slice(0, -1), // Remove the last empty line
            {
              type: 'system',
              content: message,
              timestamp: Date.now(),
            },
            {
              type: 'output',
              content: '',
              timestamp: Date.now(),
            },
          ])

          const progress = Math.round(((messageIndex + 1) / QUANTUM_SHELL_MESSAGES.length) * 100)
          setLoadingProgress(progress)
          messageIndex++
        }
      }, 1785) // Display each message approximately every 1.785 seconds (25000ms / 14 messages)

      // After 25 seconds, transition to real shell
      const transitionTimeout = setTimeout(() => {
        clearInterval(messageInterval)
        setShellReady(true)
        setOutput((prev) => [
          ...prev,
          {
            type: 'system',
            content: '✓ Quantum shell fully initialized',
            timestamp: Date.now(),
          },
          {
            type: 'output',
            content: 'redagent@xploiteye:~$ ',
            timestamp: Date.now(),
          },
        ])
      }, 25000)

      return () => {
        clearInterval(messageInterval)
        clearTimeout(transitionTimeout)
      }
    }
  }, [isConnected, targetHost])

  // Auto-scroll to bottom
  useEffect(() => {
    if (outputRef.current) {
      outputRef.current.scrollTop = outputRef.current.scrollHeight
    }
  }, [output])

  const executeCommand = async (cmd: string) => {
    if (!connected || !shellReady || !cmd.trim() || isExecuting) return

    // Add command to output
    setOutput((prev) => [
      ...prev,
      {
        type: 'command',
        content: cmd,
        timestamp: Date.now(),
      },
    ])

    setIsExecuting(true)

    try {
      // Call backend SSH execute endpoint
      const response = await fetch(`${API_URL}/execute`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          session_id: sessionId,
          command: cmd,
        }),
      })

      if (!response.ok) {
        throw new Error('Command execution failed')
      }

      const data = await response.json()
      const cmdOutput = data.output || 'No output'

      setOutput((prev) => [
        ...prev,
        {
          type: 'output',
          content: cmdOutput,
          timestamp: Date.now(),
        },
        {
          type: 'output',
          content: 'redagent@xploiteye:~$ ',
          timestamp: Date.now(),
        },
      ])

      setExecutedCommands((prev) => prev + 1)
    } catch (error) {
      setOutput((prev) => [
        ...prev,
        {
          type: 'output',
          content: `Error: ${error instanceof Error ? error.message : 'Unknown error'}`,
          timestamp: Date.now(),
        },
        {
          type: 'output',
          content: 'redagent@xploiteye:~$ ',
          timestamp: Date.now(),
        },
      ])
    } finally {
      setIsExecuting(false)
      setInputValue('')
    }
  }

  const handleClose = async () => {
    try {
      // Disconnect from backend
      await fetch(`${API_URL}/disconnect`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ session_id: sessionId }),
      })
    } catch (error) {
      console.error('Disconnect error:', error)
    }

    setConnected(false)
    setOutput([])
    setExecutedCommands(0)
    onClose?.()
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      transition={{ duration: 0.3 }}
    >
      <Card className="bg-gradient-to-br from-gray-900/50 to-gray-800/30 border-green-500/20">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ duration: 2, repeat: Infinity }}
              >
                <Terminal className="w-5 h-5 text-green-400" />
              </motion.div>
              <div>
                <CardTitle className="flex items-center gap-2">
                  Reverse Shell - {targetHost}
                  {connected && (
                    <Badge className={`border ml-2 ${
                      shellReady
                        ? 'bg-green-500/20 text-green-400 border-green-500/50'
                        : 'bg-yellow-500/20 text-yellow-400 border-yellow-500/50'
                    }`}>
                      {shellReady ? 'READY' : 'LOADING'}
                    </Badge>
                  )}
                </CardTitle>
                <p className="text-xs text-gray-400 mt-1">
                  {shellReady ? 'Interactive shell access established' : 'Establishing shell access...'}
                </p>
              </div>
            </div>
            <motion.button
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.95 }}
              onClick={handleClose}
              className="p-2 hover:bg-red-500/20 rounded-lg text-red-400 transition-colors"
            >
              <Power className="w-5 h-5" />
            </motion.button>
          </div>
        </CardHeader>

        <CardContent className="space-y-4">
          {/* Terminal Output */}
          <div
            ref={outputRef}
            className="bg-gray-950/80 border border-gray-700/50 rounded-lg p-4 font-mono text-xs text-gray-200 h-64 overflow-y-auto space-y-1 text-green-400"
          >
            <AnimatePresence mode="popLayout">
              {output.map((line, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.2 }}
                  className={`whitespace-pre-wrap break-words ${
                    line.type === 'command' ? 'text-blue-400 font-semibold' : 'text-green-400'
                  } ${line.type === 'system' ? 'text-yellow-400 italic' : ''}`}
                >
                  {line.type === 'command' ? `$ ${line.content}` : line.content}
                </motion.div>
              ))}
            </AnimatePresence>
          </div>

          {/* Loading Progress Bar */}
          {connected && !shellReady && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="space-y-2"
            >
              <div className="flex items-center justify-between">
                <span className="text-xs text-gray-400">Establishing shell access...</span>
                <span className="text-xs text-green-400 font-semibold">{loadingProgress}%</span>
              </div>
              <div className="w-full bg-gray-800 rounded-full h-2 overflow-hidden">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${loadingProgress}%` }}
                  className="h-full bg-gradient-to-r from-green-600 to-green-400"
                />
              </div>
            </motion.div>
          )}

          {/* Command Input */}
          {connected && shellReady && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex gap-2"
            >
              <div className="flex-1 flex items-center gap-2 bg-gray-800/50 border border-gray-700 rounded-lg px-3 py-2">
                <span className="text-green-400 font-mono text-sm">$</span>
                <Input
                  value={inputValue}
                  onChange={(e) => setInputValue(e.target.value)}
                  onKeyPress={(e) => {
                    if (e.key === 'Enter') {
                      executeCommand(inputValue)
                    }
                  }}
                  placeholder="Enter command..."
                  className="bg-transparent border-0 text-green-400 placeholder:text-gray-600 focus:ring-0 font-mono text-sm"
                  disabled={!shellReady || isExecuting}
                />
              </div>
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => executeCommand(inputValue)}
                disabled={!shellReady || !inputValue.trim() || isExecuting}
                className="p-2 bg-green-500/20 hover:bg-green-500/30 border border-green-500/50 rounded-lg text-green-400 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
              >
                <Send className="w-4 h-4" />
              </motion.button>
            </motion.div>
          )}

          {/* Stats */}
          {connected && shellReady && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="flex gap-4 text-xs text-gray-400 pt-2 border-t border-gray-700/50"
            >
              <div>
                <span className="text-gray-500">Commands executed:</span>
                <span className="text-green-400 ml-2 font-semibold">{executedCommands}</span>
              </div>
              <div>
                <span className="text-gray-500">Connection:</span>
                <span className="text-green-400 ml-2 font-semibold">{targetHost}</span>
              </div>
              <div>
                <span className="text-gray-500">User:</span>
                <span className="text-green-400 ml-2 font-semibold">redagent</span>
              </div>
            </motion.div>
          )}

          {/* Available Commands Info */}
          {connected && shellReady && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.5 }}
              className="text-xs text-gray-500 p-2 bg-gray-800/30 rounded border border-gray-700/30"
            >
              <p className="mb-1">💡 Try these commands:</p>
              <p className="font-mono">whoami • id • pwd • ls -la • cat /etc/passwd</p>
            </motion.div>
          )}
        </CardContent>
      </Card>
    </motion.div>
  )
}
