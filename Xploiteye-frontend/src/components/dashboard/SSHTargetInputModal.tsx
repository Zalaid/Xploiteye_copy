"use client"

import React, { useState } from 'react'
import { motion } from 'framer-motion'
import { X, Zap } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'

interface SSHTargetInputModalProps {
  onConnect: (targetIp: string) => void
  onCancel: () => void
}

export function SSHTargetInputModal({ onConnect, onCancel }: SSHTargetInputModalProps) {
  const [targetIp, setTargetIp] = useState('192.168.0.169')
  const [isConnecting, setIsConnecting] = useState(false)

  const handleConnect = async () => {
    if (!targetIp.trim()) {
      alert('Please enter a valid IP address')
      return
    }

    setIsConnecting(true)
    onConnect(targetIp)
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black/50 flex items-center justify-center z-50"
    >
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.9, opacity: 0 }}
      >
        <Card className="bg-gradient-to-br from-gray-900/95 to-gray-800/95 border-blue-500/30 w-96">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Zap className="w-5 h-5 text-blue-400" />
                <CardTitle>Target SSH Connection</CardTitle>
              </div>
              <motion.button
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.95 }}
                onClick={onCancel}
                className="text-gray-400 hover:text-gray-200"
              >
                <X className="w-5 h-5" />
              </motion.button>
            </div>
          </CardHeader>

          <CardContent className="space-y-4">
            <div>
              <p className="text-sm text-gray-400 mb-2">Enter target machine IP address:</p>
              <Input
                type="text"
                placeholder="192.168.0.169"
                value={targetIp}
                onChange={(e) => setTargetIp(e.target.value)}
                className="bg-gray-800/50 border-gray-700 text-white placeholder:text-gray-500"
              />
            </div>

            <div className="flex gap-3">
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={onCancel}
                disabled={isConnecting}
                className="flex-1 px-4 py-2 bg-gray-700/50 hover:bg-gray-700 text-gray-300 rounded-lg transition-colors disabled:opacity-50"
              >
                Cancel
              </motion.button>
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={handleConnect}
                disabled={isConnecting}
                className="flex-1 px-4 py-2 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white rounded-lg transition-colors disabled:opacity-50 font-medium"
              >
                {isConnecting ? 'Connecting...' : 'Connect'}
              </motion.button>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </motion.div>
  )
}
