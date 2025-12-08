"use client"

import React, { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Globe, Zap, AlertCircle, CheckCircle2, Search, Shield } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Checkbox } from '@/components/ui/checkbox'
import { Badge } from '@/components/ui/badge'
import { dvwaApi } from '@/services/dvwaApi'
import { useAuth } from '@/auth/AuthContext'
import { DVWAScanResults } from './DVWAScanResults'
import { DVWAScanResult } from '@/services/dvwaApi'

interface WebScanningProps {
  onScanStart?: (url: string, config: ScanConfig) => void
  onExploit?: (vulnerability: any) => void
}

interface ScanConfig {
  isLive: boolean
  isLab: boolean
  labEnvironments?: string[]
}

const labEnvironments = [
  { id: 'dvwa', name: 'DVWA', description: 'Damn Vulnerable Web Application' },
  { id: 'juice-shop', name: 'Juice Shop', description: 'OWASP Juice Shop' },
  { id: 'mutillidae', name: 'Mutillidae', description: 'Free, open-source vulnerable web app' },
]

export function WebScanning({ onScanStart, onExploit }: WebScanningProps) {
  const { apiCall } = useAuth()
  const [url, setUrl] = useState('')
  const [isLive, setIsLive] = useState(false)
  const [isLab, setIsLab] = useState(true)
  const [selectedLabs, setSelectedLabs] = useState<string[]>([])
  const [urlError, setUrlError] = useState('')
  const [isScanning, setIsScanning] = useState(false)
  const [scanResult, setScanResult] = useState<DVWAScanResult | null>(null)
  const [scanError, setScanError] = useState<string | null>(null)
  const [progress, setProgress] = useState(0)
  const [currentVulnIndex, setCurrentVulnIndex] = useState(0)

  const validateURL = (input: string): boolean => {
    try {
      new URL(input.startsWith('http') ? input : `http://${input}`)
      return true
    } catch {
      return false
    }
  }

  const handleLabToggle = (labId: string) => {
    // Only allow one lab environment to be selected at a time
    setSelectedLabs((prev) =>
      prev.includes(labId) ? [] : [labId]
    )
  }

  const handleScan = async () => {
    // Validation
    if (!isLive && !isLab) {
      setUrlError('Please select at least one scan mode (Live or Lab)')
      return
    }

    if (isLive && !isLab) {
      // Live mode requires URL
      const trimmedUrl = url.trim()
      if (!trimmedUrl) {
        setUrlError('Please enter a URL for Live scanning')
        return
      }
      if (!validateURL(trimmedUrl)) {
        setUrlError('Please enter a valid URL (e.g., example.com or http://example.com)')
        return
      }
    }

    if (isLab && !isLive && selectedLabs.length === 0) {
      setUrlError('Please select at least one lab environment')
      return
    }

    setUrlError('')
    setIsScanning(true)
    setScanError(null)
    setScanResult(null)

    try {
      // Initialize API call if needed
      if (apiCall) {
        dvwaApi.setApiCall(apiCall)
      }

      // For DVWA scans
      if (isLab && selectedLabs.includes('dvwa')) {
        // Use DVWA default target (backend returns mock/sample data)
        const dvwaTarget = 'http://192.168.0.176/dvwa'

        const response = await dvwaApi.startDVWAScan(
          dvwaTarget,
          'dvwa'
        )

        if (response.data) {
          setScanResult(response.data)
          // Complete the progress bar
          setProgress(100)
        }

        // Call parent handler
        if (onScanStart) {
          onScanStart('DVWA', {
            isLive: false,
            isLab: true,
            labEnvironments: selectedLabs,
          })
        }
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred'
      setScanError(errorMessage)
      console.error('Scan error:', errorMessage)
    } finally {
      // Reset progress states after a delay
      setTimeout(() => {
        setIsScanning(false)
        setProgress(0)
        setCurrentVulnIndex(0)
      }, 500)
    }
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !isScanning) {
      handleScan()
    }
  }

  // Simulate progress updates during scanning
  useEffect(() => {
    if (!isScanning) return

    const interval = setInterval(() => {
      setProgress((prev) => {
        if (prev < 95) {
          const increment = Math.random() * 15
          return Math.min(prev + increment, 95)
        }
        return prev
      })

      // Update vulnerability being scanned
      setCurrentVulnIndex((prev) => {
        if (prev < 6) return prev + 1
        return 6
      })
    }, 800)

    return () => clearInterval(interval)
  }, [isScanning])

  return (
    <div className="space-y-6">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
      >
        <Card className="bg-gradient-to-br from-gray-900/50 to-gray-800/30 border-blue-500/20">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Globe className="w-5 h-5 text-blue-400" />
              <span>Web Application Scanning</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* URL Input Section - Show only when Live is selected */}
            <AnimatePresence>
              {isLive && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  transition={{ duration: 0.3 }}
                  className="space-y-3"
                >
                  <label className="text-sm font-medium text-gray-300 flex items-center space-x-2">
                    <Globe className="w-4 h-4 text-blue-400" />
                    <span>Target URL</span>
                  </label>
                  <div className="relative">
                    <Input
                      placeholder="Enter URL (e.g., example.com or http://example.com)"
                      value={url}
                      onChange={(e) => {
                        setUrl(e.target.value)
                        setUrlError('')
                      }}
                      onKeyPress={handleKeyPress}
                      disabled={isScanning}
                      className="bg-gray-800/50 border-gray-700 text-gray-100 placeholder:text-gray-500 focus:border-blue-500/50 focus:ring-blue-500/20 pl-10"
                    />
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-500" />
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Scan Mode Section */}
            <div className="space-y-4">
              <label className="text-sm font-medium text-gray-300 flex items-center space-x-2">
                <Zap className="w-4 h-4 text-yellow-400" />
                <span>Scan Mode</span>
              </label>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Live Checkbox */}
                <motion.div
                  whileHover={{ scale: 1.02 }}
                  className={`p-4 rounded-lg border-2 transition-all cursor-pointer ${
                    isLive
                      ? 'bg-green-500/10 border-green-500/50'
                      : 'bg-gray-800/30 border-gray-700/50 hover:border-green-500/30'
                  }`}
                  onClick={() => {
                    setIsLive(true)
                    setIsLab(false)
                    setSelectedLabs([])
                  }}
                >
                  <div className="flex items-center space-x-3">
                    <Checkbox
                      checked={isLive}
                      onCheckedChange={() => {
                        setIsLive(true)
                        setIsLab(false)
                        setSelectedLabs([])
                      }}
                      className="w-5 h-5 border-green-500/50 [&_svg]:text-white"
                    />
                    <div className="flex-1">
                      <div className="font-medium text-green-400 flex items-center space-x-2">
                        <span>Live Environment</span>
                        <Badge className="bg-green-500/20 text-green-400 border-green-500/50 text-xs">
                          Production
                        </Badge>
                      </div>
                      <p className="text-xs text-gray-400 mt-1">
                        Scan against live production targets
                      </p>
                    </div>
                  </div>
                </motion.div>

                {/* Lab Checkbox */}
                <motion.div
                  whileHover={{ scale: 1.02 }}
                  className={`p-4 rounded-lg border-2 transition-all cursor-pointer ${
                    isLab
                      ? 'bg-purple-500/10 border-purple-500/50'
                      : 'bg-gray-800/30 border-gray-700/50 hover:border-purple-500/30'
                  }`}
                  onClick={() => {
                    setIsLab(true)
                    setIsLive(false)
                    setUrl('')
                  }}
                >
                  <div className="flex items-center space-x-3">
                    <Checkbox
                      checked={isLab}
                      onCheckedChange={() => {
                        setIsLab(true)
                        setIsLive(false)
                        setUrl('')
                      }}
                      className="w-5 h-5 border-purple-500/50 [&_svg]:text-white"
                    />
                    <div className="flex-1">
                      <div className="font-medium text-purple-400 flex items-center space-x-2">
                        <span>Lab Environment</span>
                        <Badge className="bg-purple-500/20 text-purple-400 border-purple-500/50 text-xs">
                          Sandbox
                        </Badge>
                      </div>
                      <p className="text-xs text-gray-400 mt-1">
                        Scan in isolated lab/sandbox environment
                      </p>
                    </div>
                  </div>
                </motion.div>
              </div>
            </div>

            {/* Lab Environments Section - Show only when Lab is selected */}
            <AnimatePresence>
              {isLab && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  transition={{ duration: 0.3 }}
                  className="space-y-3"
                >
                  <label className="text-sm font-medium text-gray-300 flex items-center space-x-2">
                    <Shield className="w-4 h-4 text-purple-400" />
                    <span>Lab Environments</span>
                  </label>
                  <div className="grid grid-cols-1 gap-2">
                    {labEnvironments.map((env) => (
                      <motion.div
                        key={env.id}
                        whileHover={{ scale: 1.02 }}
                        className={`p-3 rounded-lg border-2 transition-all cursor-pointer ${
                          selectedLabs.includes(env.id)
                            ? 'bg-purple-500/10 border-purple-500/50'
                            : 'bg-gray-800/30 border-gray-700/50 hover:border-purple-500/30'
                        }`}
                        onClick={() => handleLabToggle(env.id)}
                      >
                        <div className="flex items-center space-x-3">
                          <Checkbox
                            checked={selectedLabs.includes(env.id)}
                            onCheckedChange={() => handleLabToggle(env.id)}
                            className="w-4 h-4 border-purple-500/50 [&_svg]:text-white"
                          />
                          <div className="flex-1 min-w-0">
                            <div className="font-medium text-purple-400 text-sm">{env.name}</div>
                            <p className="text-xs text-gray-400">{env.description}</p>
                          </div>
                        </div>
                      </motion.div>
                    ))}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Error Message */}
            {urlError && (
              <motion.div
                initial={{ opacity: 0, y: -5 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex items-center space-x-2 text-red-400 text-sm bg-red-500/10 border border-red-500/30 rounded-lg p-3"
              >
                <AlertCircle className="w-4 h-4 flex-shrink-0" />
                <span>{urlError}</span>
              </motion.div>
            )}

            {/* Scan Error */}
            {scanError && (
              <motion.div
                initial={{ opacity: 0, y: -5 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex items-center space-x-2 text-red-400 text-sm bg-red-500/10 border border-red-500/30 rounded-lg p-3"
              >
                <AlertCircle className="w-4 h-4 flex-shrink-0" />
                <span>{scanError}</span>
              </motion.div>
            )}

            {/* Scan Button */}
            <motion.div
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              <Button
                onClick={handleScan}
                disabled={isScanning}
                className="w-full bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white font-semibold py-3 rounded-lg transition-all duration-200 flex items-center justify-center space-x-2"
              >
                {isScanning ? (
                  <>
                    <motion.div
                      animate={{ rotate: 360 }}
                      transition={{ duration: 1, repeat: Infinity }}
                    >
                      <Zap className="w-5 h-5" />
                    </motion.div>
                    <span>Scanning...</span>
                  </>
                ) : (
                  <>
                    <Search className="w-5 h-5" />
                    <span>Start Web Scan</span>
                  </>
                )}
              </Button>
            </motion.div>

            {/* Progress Bar - Show during scanning */}
            <AnimatePresence>
              {isScanning && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="space-y-3"
                >
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <p className="text-sm font-medium text-gray-300">
                        Scanning Vulnerabilities...
                      </p>
                      <p className="text-sm font-semibold text-blue-400">
                        {Math.round(progress)}%
                      </p>
                    </div>

                    {/* Progress Bar Background */}
                    <div className="w-full bg-gray-800/50 rounded-full h-2 overflow-hidden border border-gray-700/50">
                      {/* Animated Progress Fill */}
                      <motion.div
                        className="h-full bg-gradient-to-r from-blue-500 via-blue-400 to-cyan-400 rounded-full"
                        initial={{ width: 0 }}
                        animate={{ width: `${progress}%` }}
                        transition={{ duration: 0.3, ease: 'easeOut' }}
                      />
                    </div>

                    {/* Scanning Status */}
                    <div className="text-xs text-gray-400 flex items-center gap-2">
                      <motion.div
                        animate={{ rotate: 360 }}
                        transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
                      >
                        <Zap className="w-3 h-3 text-yellow-400" />
                      </motion.div>
                      <span>
                        Scanning vulnerabilities...
                      </span>
                    </div>
                  </div>

                  {/* Current Vulnerability Being Scanned */}
                  <div className="bg-gray-800/30 border border-gray-700/50 rounded-lg p-3">
                    <p className="text-xs text-gray-400 font-medium uppercase tracking-wide">
                      Currently Testing
                    </p>
                    <p className="text-sm text-gray-200 mt-1 font-mono">
                      {(() => {
                        const vulns = [
                          'Command Execution (RCE)',
                          'Cross-Site Request Forgery (CSRF)',
                          'SQL Injection',
                          'Blind SQL Injection',
                          'Reflected XSS',
                          'Stored XSS',
                          'File Inclusion (LFI/RFI)',
                        ]
                        return vulns[currentVulnIndex] || 'Finalizing results...'
                      })()}
                    </p>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

          </CardContent>
        </Card>
      </motion.div>

      {/* Scan Results Section */}
      {scanResult && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.1 }}
        >
          <DVWAScanResults result={scanResult} isLoading={false} onExploit={onExploit} />
        </motion.div>
      )}

      {/* Recent Scans Section (when no results) */}
      {!scanResult && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.1 }}
        >
          <Card className="bg-gradient-to-br from-gray-900/30 to-gray-800/20 border-gray-700/50">
            <CardHeader>
              <CardTitle className="flex items-center space-x-2 text-sm">
                <CheckCircle2 className="w-4 h-4 text-gray-400" />
                <span>Scan Status</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-center text-gray-400 py-6">
                <p className="text-sm">No active scans. Select scan mode and configure above to begin.</p>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      )}
    </div>
  )
}
