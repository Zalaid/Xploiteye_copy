"use client"

import React, { useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Terminal, Send, Copy, Check, Power } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'

interface ReverseShellProps {
  isConnected: boolean
  onClose?: () => void
}

const SHELL_COMMANDS = [
  { command: 'id', output: 'uid=33(www-data) gid=33(www-data) groups=33(www-data)' },
  { command: 'whoami', output: 'www-data' },
  { command: 'pwd', output: '/var/www/html/dvwa' },
  { command: 'hostname', output: 'vulnerable-server' },
  { command: 'uname -a', output: 'Linux vulnerable-server 4.4.0-21-generic #37-Ubuntu SMP Mon Apr 18 00:30:36 UTC 2016 x86_64 GNU/Linux' },
  { command: 'cat /etc/os-release', output: 'NAME="Ubuntu"\nVERSION="16.04 LTS (Xenial Xerus)"\nID=ubuntu\nID_LIKE=debian\nPRETTY_NAME="Ubuntu 16.04 LTS"\nVERSION_ID="16.04"' },
]

interface ShellOutput {
  type: 'command' | 'output' | 'system'
  content: string
  timestamp: number
}

export function ReverseShell({ isConnected, onClose }: ReverseShellProps) {
  const [connected, setConnected] = useState(isConnected)
  const [output, setOutput] = useState<ShellOutput[]>([])
  const [inputValue, setInputValue] = useState('')
  const [executedCommands, setExecutedCommands] = useState(0)
  const outputRef = useRef<HTMLDivElement>(null)

  // Initialize connection
  useEffect(() => {
    if (!isConnected) return

    setOutput([
      {
        type: 'system',
        content: 'Attempting reverse shell connection...',
        timestamp: Date.now(),
      },
    ])

    // Simulate connection stages
    const stages = [
      { delay: 1000, msg: 'Setting up listener on attacker machine...' },
      { delay: 2500, msg: 'Connection established from 192.168.0.176' },
      { delay: 3500, msg: 'Spawning interactive shell...' },
      { delay: 4500, msg: '✓ Reverse shell active' },
    ]

    const timeouts = stages.map((stage) =>
      setTimeout(() => {
        if (stage.delay === 4500) {
          setConnected(true)
          setOutput((prev) => [
            ...prev,
            {
              type: 'system',
              content: stage.msg,
              timestamp: Date.now(),
            },
            {
              type: 'output',
              content: 'www-data@vulnerable-server:/var/www/html/dvwa$ ',
              timestamp: Date.now(),
            },
          ])
        } else {
          setOutput((prev) => [
            ...prev,
            {
              type: 'system',
              content: stage.msg,
              timestamp: Date.now(),
            },
          ])
        }
      }, stage.delay)
    )

    return () => timeouts.forEach(clearTimeout)
  }, [isConnected])

  // Auto-scroll to bottom
  useEffect(() => {
    if (outputRef.current) {
      outputRef.current.scrollTop = outputRef.current.scrollHeight
    }
  }, [output])

  const executeCommand = (cmd: string) => {
    if (!connected || !cmd.trim()) return

    // Add command to output
    setOutput((prev) => [
      ...prev,
      {
        type: 'command',
        content: cmd,
        timestamp: Date.now(),
      },
    ])

    // Simulate command execution with realistic delay
    setTimeout(() => {
      const foundCommand = SHELL_COMMANDS.find((c) => c.command === cmd.toLowerCase())
      if (foundCommand) {
        setOutput((prev) => [
          ...prev,
          {
            type: 'output',
            content: foundCommand.output,
            timestamp: Date.now(),
          },
          {
            type: 'output',
            content: 'www-data@vulnerable-server:/var/www/html/dvwa$ ',
            timestamp: Date.now(),
          },
        ])
      } else {
        setOutput((prev) => [
          ...prev,
          {
            type: 'output',
            content: `${cmd}: command not found`,
            timestamp: Date.now(),
          },
          {
            type: 'output',
            content: 'www-data@vulnerable-server:/var/www/html/dvwa$ ',
            timestamp: Date.now(),
          },
        ])
      }
      setExecutedCommands((prev) => prev + 1)
    }, 300 + Math.random() * 700)

    setInputValue('')
  }

  const handleClose = () => {
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
                  Reverse Shell Terminal
                  {connected && (
                    <Badge className="bg-green-500/20 text-green-400 border-green-500/50 border ml-2">
                      CONNECTED
                    </Badge>
                  )}
                </CardTitle>
                <p className="text-xs text-gray-400 mt-1">
                  {connected
                    ? 'Interactive shell access established'
                    : 'Attempting to establish connection...'}
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

          {/* Command Input */}
          {connected && (
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
                  disabled={!connected}
                />
              </div>
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => executeCommand(inputValue)}
                disabled={!connected || !inputValue.trim()}
                className="p-2 bg-green-500/20 hover:bg-green-500/30 border border-green-500/50 rounded-lg text-green-400 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
              >
                <Send className="w-4 h-4" />
              </motion.button>
            </motion.div>
          )}

          {/* Stats */}
          {connected && (
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
                <span className="text-green-400 ml-2 font-semibold">192.168.0.176</span>
              </div>
              <div>
                <span className="text-gray-500">User:</span>
                <span className="text-green-400 ml-2 font-semibold">www-data</span>
              </div>
            </motion.div>
          )}

          {/* Available Commands Info */}
          {connected && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.5 }}
              className="text-xs text-gray-500 p-2 bg-gray-800/30 rounded border border-gray-700/30"
            >
              <p className="mb-1">💡 Try these commands:</p>
              <p className="font-mono">id • whoami • pwd • hostname • uname -a • cat /etc/os-release</p>
            </motion.div>
          )}
        </CardContent>
      </Card>
    </motion.div>
  )
}
