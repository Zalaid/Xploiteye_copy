"use client"

import React from 'react';
import Head from 'next/head';
import { useRouter } from 'next/router';
import { DashboardLayout } from '@/components/layouts/DashboardLayout';
import { useState, useEffect } from "react"
import { motion, AnimatePresence } from "framer-motion"
import {
  Bot,
  Target,
  Code,
  Play,
  Clock,
  CheckCircle,
  Zap,
  Terminal,
  Eye,
  Crosshair,
  Shield,
  Bug,
  Flame,
  AlertTriangle,
  Info,
  ChevronDown,
} from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"

// Import services
import { startExploitation, stopExploitation } from '@/services/redAgentApi'
import { socketService } from '@/services/socketService'

// Severity levels mapping
const SEVERITY_LEVELS = {
  critical: 'critical',
  high: 'high',
  medium: 'medium',
  low: 'low'
}

interface ScannedService {
  ip: string
  port: number
  service: string
  version?: string
  cves?: string[]
  severity?: string
  description?: string
  impact?: string
  cve_id?: string
  cvss_score?: number
}

export function RedAgentDashboard() {
  const router = useRouter()
  const [currentStep, setCurrentStep] = useState(1)
  const [scannedServices, setScannedServices] = useState<ScannedService[]>([])
  const [isLoadingServices, setIsLoadingServices] = useState(true)
  const [loadError, setLoadError] = useState<string | null>(null)
  const [selectedServices, setSelectedServices] = useState<ScannedService[]>([])
  const [exploitationMode, setExploitationMode] = useState('sequential')
  const [maxThreads, setMaxThreads] = useState('4')
  const [timeout, setTimeout] = useState('30')
  const [isExploiting, setIsExploiting] = useState(false)
  const [exploitProgress, setExploitProgress] = useState(0)
  const [terminalLines, setTerminalLines] = useState<any[]>([])
  const [expandedService, setExpandedService] = useState<string | null>(null) // Track which service's attack vector is expanded
  const [showServices, setShowServices] = useState(false) // Track if services list should be shown
  const [exploitingService, setExploitingService] = useState<ScannedService | null>(null) // Track which service is being exploited
  const [exploitationStats, setExploitationStats] = useState({
    completed: 0,
    running: 0,
    pending: 0,
    rootAccess: 0,
    shellsOpened: 0
  })
  const [exploitationId, setExploitationId] = useState<string | null>(null)
  const [commandInput, setCommandInput] = useState('')
  const terminalRef = React.useRef<HTMLDivElement>(null)
  const [lastLogIndex, setLastLogIndex] = useState(0) // Track which logs we've already shown
  const pollingIntervalRef = React.useRef<NodeJS.Timeout | null>(null)

  // Function to load scanning results from localStorage
  const loadScanningResults = async () => {
    try {
      setIsLoadingServices(true)
      setLoadError(null)

      // Try to get scanning results from localStorage
      console.log('🔑 Available localStorage keys:', Object.keys(localStorage))
      let scanningResults = localStorage.getItem('scanningResults')
      console.log('📂 Loading from "scanningResults" key:', scanningResults ? 'FOUND' : 'NOT FOUND')
      console.log('📂 Raw data:', scanningResults)

      // If not found, wait a moment and try again (in case data is still being saved)
      if (!scanningResults) {
        console.log('⏳ Results not found, waiting 500ms and retrying...')
        await new Promise<void>((resolve) => {
          const timer = window.setTimeout(() => {
            resolve()
          }, 500)
        })
        scanningResults = localStorage.getItem('scanningResults')
        console.log('🔄 Retry result:', scanningResults ? 'FOUND' : 'NOT FOUND')
      }

      if (scanningResults) {
        const parsedResults = JSON.parse(scanningResults)
        console.log('✅ Parsed results:', parsedResults)

        // Transform scanning results into ScannedService format
        if (Array.isArray(parsedResults)) {
          const services: ScannedService[] = parsedResults.map((result: any) => {
            // Clean up service name - remove "vUnknown" and extra spaces
            let serviceName = (result.results?.service_name || result.service || 'Unknown').trim()
            serviceName = serviceName.replace(/\s*vUnknown\s*$/i, '').trim()
            serviceName = serviceName.replace(/^v/i, '').trim() // Remove leading 'v'

            // Parse port if it's in IP:port format
            let port = result.port
            if (typeof port === 'string' && port.includes(':')) {
              port = parseInt(port.split(':')[1])
            }

            return {
              ip: result.target || result.ip || '0.0.0.0',
              port: parseInt(port) || 0,
              service: serviceName || 'Unknown',
              version: (result.results?.service_version || result.version || 'Unknown').replace(/^v/i, '').trim(),
              cves: result.results?.cves?.map((cve: any) => cve.cve_id || cve) || result.cves || [],
              severity: result.severity || 'medium',
              description: result.description || 'No description available',
              impact: result.impact || null,
              cve_id: result.cve_id || (result.results?.cves?.[0]?.cve_id || 'Unknown'),
              cvss_score: result.cvss_score || (result.results?.cves?.[0]?.cvss_score || 0)
            }
          })

          console.log('🎯 Transformed services:', services)

          if (services.length > 0) {
            setScannedServices(services)
            console.log('✨ Services loaded successfully:', services.length)
          } else {
            setLoadError('No services found in scan results')
          }
        }
      } else {
        setLoadError('No scanning results found. Please run a network scan first.')
      }
    } catch (error) {
      console.error('Error loading scanning results:', error)
      setLoadError('Error loading scanning results. Please try again.')
    } finally {
      setIsLoadingServices(false)
    }
  }

  // Load scanning results on mount
  useEffect(() => {
    loadScanningResults()
  }, [])

  // Reload scanning results when page becomes visible (user returns from scanning page)
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        console.log('👁️ Page became visible, reloading scanning results...')
        loadScanningResults()
      }
    }

    // Also reload when router changes to this page
    const handleRouteChange = (url: string) => {
      if (url.includes('/dashboard/red-agent')) {
        console.log('🔄 Route changed to red-agent, reloading scanning results...')
        setTimeout(() => loadScanningResults(), 100)
      }
    }

    // Listen for custom event from scanning page when results are saved
    const handleScanningResultsUpdated = (event: Event) => {
      const customEvent = event as CustomEvent
      console.log('📢 Scanning results updated event received:', customEvent.detail)
      loadScanningResults()
    }

    document.addEventListener('visibilitychange', handleVisibilityChange)
    router.events.on('routeChangeComplete', handleRouteChange)
    window.addEventListener('scanningResultsUpdated', handleScanningResultsUpdated)

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange)
      router.events.off('routeChangeComplete', handleRouteChange)
      window.removeEventListener('scanningResultsUpdated', handleScanningResultsUpdated)
    }
  }, [router.events])

  // Auto-scroll terminal to bottom when new lines are added
  useEffect(() => {
    if (terminalRef.current) {
      terminalRef.current.scrollTop = terminalRef.current.scrollHeight
    }
  }, [terminalLines])

  // Poll for logs via HTTP when exploiting service is set
  useEffect(() => {
    if (!exploitationId) {
      // Cleanup polling when no exploitation
      if (pollingIntervalRef.current) {
        clearInterval(pollingIntervalRef.current)
        pollingIntervalRef.current = null
      }
      return
    }

    const pollLogs = async () => {
      try {
        // Get logs from HTTP endpoint
        const response = await fetch(`http://localhost:5001/api/get-logs/${exploitationId}`, {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
          },
        })

        if (!response.ok) {
          console.error('❌ Failed to fetch logs:', response.status)
          return
        }

        const data = await response.json()
        const logs = data.logs || []

        // Only add new logs that we haven't displayed yet
        if (logs.length > lastLogIndex) {
          const newLogs = logs.slice(lastLogIndex)
          newLogs.forEach((log: any) => {
            addTerminalLine(log.type || 'info', log.content)
          })
          setLastLogIndex(logs.length)
        }
      } catch (error) {
        console.error('❌ Error polling logs:', error)
      }
    }

    // Initial poll
    pollLogs()

    // Set up polling interval (every 500ms for real-time feel)
    pollingIntervalRef.current = setInterval(pollLogs, 500)

    // Cleanup
    return () => {
      if (pollingIntervalRef.current) {
        clearInterval(pollingIntervalRef.current)
        pollingIntervalRef.current = null
      }
    }
  }, [exploitationId])

  const addTerminalLine = (type: 'info' | 'success' | 'warning' | 'error' | 'exploit', content: string) => {
    const newLine = {
      id: `line-${Date.now()}-${Math.random()}`,
      timestamp: new Date().toLocaleTimeString(),
      type,
      content,
    }
    setTerminalLines(prev => [...prev, newLine])
  }

  const handleServiceToggle = (service: ScannedService) => {
    // Set the service as the one being exploited and move to exploitation terminal
    setExploitingService(service)
    setShowServices(false)
  }

  const handleSelectAll = () => {
    if (selectedServices.length === scannedServices.length) {
      setSelectedServices([])
    } else {
      setSelectedServices(scannedServices)
    }
  }

  const startBatchExploitation = async () => {
    if (selectedServices.length === 0) {
      addTerminalLine('error', '❌ No services selected for exploitation')
      return
    }

    setIsExploiting(true)
    setCurrentStep(4)
    setExploitProgress(0)
    setTerminalLines([])
    setExploitationStats({
      completed: 0,
      running: 0,
      pending: selectedServices.length,
      rootAccess: 0,
      shellsOpened: 0
    })

    addTerminalLine('info', `🎯 Starting ${exploitationMode} exploitation on ${selectedServices.length} services`)
    addTerminalLine('info', `⚙️ Configuration: Threads=${maxThreads}, Timeout=${timeout}s`)

    let completed = 0
    for (let i = 0; i < selectedServices.length; i++) {
      const service = selectedServices[i]
      const delay = exploitationMode === 'sequential' ? i * 3000 : 0

      setTimeout(() => {
        addTerminalLine('info', `[${i + 1}/${selectedServices.length}] Targeting ${service.ip}:${service.port} (${service.service})`)
        addTerminalLine('exploit', `🔍 Discovered: ${service.service} v${service.version || 'unknown'}`)

        if (service.cves && service.cves.length > 0) {
          addTerminalLine('info', `🐛 CVEs: ${service.cves.join(', ')}`)
        }

        const stages = [
          { delay: 1000, msg: `🔌 Connecting to ${service.ip}:${service.port}...` },
          { delay: 2000, msg: `🔐 Attempting exploit...` },
          { delay: 3000, msg: `💉 Injecting payload...` },
        ]

        stages.forEach(stage => {
          setTimeout(() => {
            addTerminalLine('info', stage.msg)
          }, delay + stage.delay)
        })

        const isSuccess = Math.random() > 0.3

        setTimeout(() => {
          if (isSuccess) {
            const hasRoot = Math.random() > 0.5
            addTerminalLine('success', `✅ SUCCESS! ${service.ip}:${service.port} - Session opened`)
            if (hasRoot) {
              addTerminalLine('success', `🔐 ROOT ACCESS OBTAINED!`)
              setExploitationStats(prev => ({ ...prev, rootAccess: prev.rootAccess + 1 }))
            }
            setExploitationStats(prev => ({ ...prev, shellsOpened: prev.shellsOpened + 1 }))
          } else {
            addTerminalLine('warning', `⚠️ Failed to exploit ${service.ip}:${service.port}`)
          }
          completed++
          setExploitationStats(prev => ({
            ...prev,
            completed: completed,
            pending: selectedServices.length - completed,
            running: Math.max(0, prev.running - 1)
          }))
          setExploitProgress((completed / selectedServices.length) * 100)
        }, delay + 4000)
      }, delay)
    }

    setTimeout(() => {
      setIsExploiting(false)
      addTerminalLine('success', `✅ Exploitation complete!`)
    }, 4000 + (selectedServices.length * 5000))
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "running":
        return <Play className="w-4 h-4 text-lime-400 animate-pulse" />
      case "queued":
        return <Clock className="w-4 h-4 text-yellow-400" />
      case "completed":
        return <CheckCircle className="w-4 h-4 text-green-400" />
      default:
        return <Clock className="w-4 h-4 text-gray-500" />
    }
  }

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "high":
        return "bg-red-500/20 text-red-400 border-red-500/30"
      case "medium":
        return "bg-yellow-500/20 text-yellow-400 border-yellow-500/30"
      case "low":
        return "bg-green-500/20 text-green-400 border-green-500/30"
      default:
        return "bg-gray-500/20 text-gray-400 border-gray-500/30"
    }
  }

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case "critical":
        return "bg-red-500/20 text-red-400 border-red-500/30"
      case "high":
        return "bg-orange-500/20 text-orange-400 border-orange-500/30"
      case "medium":
        return "bg-yellow-500/20 text-yellow-400 border-yellow-500/30"
      case "low":
        return "bg-green-500/20 text-green-400 border-green-500/30"
      default:
        return "bg-gray-500/20 text-gray-400 border-gray-500/30"
    }
  }

  const steps = [
    { number: 1, title: "Load Scan Results", icon: <Eye className="w-5 h-5" /> },
    { number: 2, title: "Select Services", icon: <Target className="w-5 h-5" /> },
    { number: 3, title: "Execute & Monitor", icon: <Terminal className="w-5 h-5" /> }
  ]

  return (
    <div className="space-y-8">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-center justify-between"
      >
        <div>
          <h1 className="text-4xl font-bold bg-gradient-to-r from-red-400 via-red-300 to-orange-400 bg-clip-text text-transparent">
            Red Agent Exploitation Wizard
          </h1>
          <p className="text-muted-foreground mt-2">Guided offensive security operations workflow</p>
        </div>
        <div className="flex items-center space-x-2">
          <Badge className={`${isExploiting ? "bg-red-500/20 text-red-400 border-red-500/30 animate-pulse" : "bg-green-500/20 text-green-400 border-green-500/30"}`}>
            <Bot className="w-3 h-3 mr-1" />
            {isExploiting ? "Exploiting..." : "Ready"}
          </Badge>
        </div>
      </motion.div>

      {/* Step Indicator */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="bg-gradient-to-r from-slate-800/50 to-slate-900/50 rounded-lg p-8 border border-slate-700/50"
      >
        <div className="flex items-center justify-between relative">
          {/* Progress Line */}
          <div className="absolute top-6 left-0 right-0 h-1 bg-slate-700/50 -z-10">
            <motion.div
              className="h-full bg-gradient-to-r from-red-500 to-orange-500"
              initial={{ width: "0%" }}
              animate={{ width: `${((currentStep - 1) / 3) * 100}%` }}
              transition={{ duration: 0.5 }}
            />
          </div>

          {/* Step Circles */}
          {steps.map((step) => (
            <motion.button
              key={step.number}
              onClick={() => step.number < currentStep && setCurrentStep(step.number)}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="flex flex-col items-center relative z-10"
              disabled={step.number > currentStep}
            >
              <motion.div
                className={`w-12 h-12 rounded-full flex items-center justify-center font-bold text-lg transition-all ${
                  step.number < currentStep
                    ? "bg-green-500/20 border-2 border-green-500 text-green-400 cursor-pointer"
                    : step.number === currentStep
                      ? "bg-red-500/20 border-2 border-red-500 text-red-400 shadow-lg shadow-red-500/50"
                      : "bg-slate-700/50 border-2 border-slate-600 text-slate-400"
                }`}
                animate={step.number === currentStep ? { boxShadow: ["0 0 0 0 rgba(239, 68, 68, 0.7)", "0 0 0 20px rgba(239, 68, 68, 0)"] } : {}}
                transition={{ duration: 2, repeat: Number.POSITIVE_INFINITY }}
              >
                {step.number < currentStep ? <CheckCircle className="w-5 h-5" /> : step.number}
              </motion.div>
              <motion.div
                className="mt-3 text-center"
                animate={step.number === currentStep ? { color: ["#fb7185", "#fca5ac"] } : {}}
                transition={{ duration: 0.7, repeat: Number.POSITIVE_INFINITY, repeatType: "reverse" }}
              >
                <p className={`text-xs font-medium ${step.number <= currentStep ? "text-slate-300" : "text-slate-500"}`}>
                  {step.title}
                </p>
              </motion.div>
            </motion.button>
          ))}
        </div>
      </motion.div>

      {/* Step Content */}
      <AnimatePresence mode="wait">
        {/* STEP 1: Load Scan Results */}
        {currentStep === 1 && (
          <motion.div
            key="step1"
            initial={{ opacity: 0, x: 50 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -50 }}
            transition={{ duration: 0.3 }}
          >
            <Card className="bg-gradient-to-br from-slate-800/50 to-slate-900/50 border-red-500/20">
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle className="flex items-center space-x-3">
                  <Eye className="w-6 h-6 text-red-400" />
                  <span>Scan Results Overview</span>
                </CardTitle>
                <motion.button
                  onClick={loadScanningResults}
                  disabled={isLoadingServices}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  className="p-2 rounded-lg hover:bg-slate-700/50 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                  title="Refresh scanning results"
                >
                  <motion.div
                    animate={isLoadingServices ? { rotate: 360 } : {}}
                    transition={{ duration: 2, repeat: isLoadingServices ? Number.POSITIVE_INFINITY : 0 }}
                  >
                    <Zap className="w-5 h-5 text-lime-400" />
                  </motion.div>
                </motion.button>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Loading State */}
                {isLoadingServices && (
                  <div className="flex flex-col items-center justify-center py-12 space-y-4">
                    <motion.div
                      animate={{ rotate: 360 }}
                      transition={{ duration: 2, repeat: Number.POSITIVE_INFINITY }}
                    >
                      <Target className="w-8 h-8 text-red-400" />
                    </motion.div>
                    <p className="text-slate-400">Loading scanning results...</p>
                  </div>
                )}

                {/* Error State */}
                {!isLoadingServices && loadError && (
                  <div className="p-4 bg-red-500/20 border border-red-500/50 rounded-lg space-y-3">
                    <div className="flex items-start space-x-3">
                      <AlertTriangle className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
                      <div>
                        <p className="text-sm font-medium text-red-400">No Scan Results Found</p>
                        <p className="text-sm text-red-300 mt-1">{loadError}</p>
                      </div>
                    </div>
                    <div className="flex gap-2 pt-2">
                      <Button
                        onClick={loadScanningResults}
                        variant="outline"
                        className="flex-1 border-red-500/50 hover:bg-red-500/10"
                      >
                        <Zap className="w-4 h-4 mr-2" />
                        Refresh
                      </Button>
                      <Button
                        onClick={() => router.push('/dashboard/scanning')}
                        className="flex-1 bg-red-600 hover:bg-red-700"
                      >
                        Go to Network Scanning
                      </Button>
                    </div>
                  </div>
                )}

                {/* Stats Grid */}
                {!isLoadingServices && scannedServices.length > 0 && (
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <Card className="bg-red-500/10 border-red-500/30">
                      <CardContent className="p-4">
                        <p className="text-sm text-muted-foreground">Total Services</p>
                        <p className="text-3xl font-bold text-red-400 mt-1">{scannedServices.length}</p>
                      </CardContent>
                    </Card>
                    <Card className="bg-orange-500/10 border-orange-500/30">
                      <CardContent className="p-4">
                        <p className="text-sm text-muted-foreground">Critical</p>
                        <p className="text-3xl font-bold text-orange-400 mt-1">
                          {scannedServices.filter(s => s.severity === 'critical').length}
                        </p>
                      </CardContent>
                    </Card>
                    <Card className="bg-yellow-500/10 border-yellow-500/30">
                      <CardContent className="p-4">
                        <p className="text-sm text-muted-foreground">High</p>
                        <p className="text-3xl font-bold text-yellow-400 mt-1">
                          {scannedServices.filter(s => s.severity === 'high').length}
                        </p>
                      </CardContent>
                    </Card>
                    <Card className="bg-cyan-500/10 border-cyan-500/30">
                      <CardContent className="p-4">
                        <p className="text-sm text-muted-foreground">Total CVEs</p>
                        <p className="text-3xl font-bold text-cyan-400 mt-1">
                          {scannedServices.reduce((acc, s) => acc + (s.cves?.length || 0), 0)}
                        </p>
                      </CardContent>
                    </Card>
                  </div>
                )}

                {/* Exploitation Terminal View */}
                {exploitingService && (
                  <Card className="bg-gradient-to-br from-slate-800/50 to-slate-900/50 border-red-500/20 overflow-hidden">
                    <CardHeader className="border-b border-slate-700/50 pb-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <Terminal className="w-6 h-6 text-red-400" />
                          <div>
                            <CardTitle>Exploiting: {exploitingService.service}</CardTitle>
                            <p className="text-sm text-slate-400 mt-1">{exploitingService.ip}:{exploitingService.port} | CVE: {exploitingService.cve_id}</p>
                          </div>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      {/* Terminal Display */}
                      <div
                        ref={terminalRef}
                        className="h-80 bg-black/95 rounded-lg p-4 font-mono text-sm border border-slate-700/50 overflow-y-auto space-y-1"
                      >
                        {terminalLines.length === 0 ? (
                          <div className="space-y-2 text-slate-600">
                            <div className="text-green-400">$ exploitation_terminal --target {exploitingService.ip}:{exploitingService.port}</div>
                            <div className="text-green-400">$ --service {exploitingService.service}</div>
                            <div className="text-green-400">$ --cve {exploitingService.cve_id}</div>
                            <div className="text-green-400">$ --severity {exploitingService.severity?.toUpperCase()}</div>
                            <div className="mt-4">Ready to execute exploitation commands...</div>
                          </div>
                        ) : (
                          terminalLines.map((line) => (
                            <div
                              key={line.id}
                              className={`flex gap-2 text-xs ${
                                line.type === 'success' ? 'text-green-400' :
                                line.type === 'error' ? 'text-red-400' :
                                line.type === 'warning' ? 'text-yellow-400' :
                                line.type === 'exploit' ? 'text-cyan-400' :
                                'text-slate-400'
                              }`}
                            >
                              <span className="text-slate-600 flex-shrink-0">{line.timestamp}</span>
                              <span>{line.content}</span>
                            </div>
                          ))
                        )}
                      </div>

                      {/* Command Input (visible only during exploitation) */}
                      {isExploiting && (
                        <div className="bg-slate-800/50 border border-slate-700/50 rounded-lg p-3 space-y-2">
                          <label className="text-xs font-semibold text-slate-400 uppercase">Meterpreter Command</label>
                          <div className="flex gap-2">
                            <Input
                              value={commandInput}
                              onChange={(e) => setCommandInput(e.target.value)}
                              onKeyPress={(e) => {
                                if (e.key === 'Enter' && commandInput.trim()) {
                                  if (exploitationId) {
                                    socketService.executeCommand(exploitationId, commandInput)
                                    addTerminalLine('info', `> ${commandInput}`)
                                    setCommandInput('')
                                  }
                                }
                              }}
                              placeholder="Enter meterpreter command (e.g., 'whoami', 'shell', 'help')..."
                              className="bg-black/50 border-slate-600 text-slate-100 placeholder:text-slate-500 text-sm"
                            />
                            <Button
                              onClick={() => {
                                if (commandInput.trim() && exploitationId) {
                                  socketService.executeCommand(exploitationId, commandInput)
                                  addTerminalLine('info', `> ${commandInput}`)
                                  setCommandInput('')
                                }
                              }}
                              className="bg-cyan-600 hover:bg-cyan-700 text-white font-semibold"
                            >
                              Send
                            </Button>
                          </div>
                          <p className="text-xs text-slate-500">Press Enter or click Send to execute commands</p>
                        </div>
                      )}

                      {/* Action Buttons */}
                      <div className="flex gap-3">
                        <button
                          onClick={() => {
                            setExploitingService(null)
                            setIsExploiting(false)
                            setExploitationId(null)
                            setTerminalLines([])
                            setLastLogIndex(0)
                            setCommandInput('')
                          }}
                          className="flex-1 px-4 py-3 bg-slate-700/50 hover:bg-slate-700 text-slate-200 rounded-lg transition-all font-bold"
                        >
                          Back
                        </button>
                        {!isExploiting ? (
                          <button
                            onClick={async () => {
                              if (!exploitingService) {
                                addTerminalLine('error', '❌ No service selected for exploitation')
                                return
                              }

                              setTerminalLines([])
                              addTerminalLine('info', `🚀 Starting exploitation on ${exploitingService.ip}:${exploitingService.port}`)
                              addTerminalLine('info', `🔌 Connecting to backend API...`)

                              try {
                                console.log('🔵 Calling startExploitation API...')
                                const response = await startExploitation(exploitingService)

                                console.log('🟢 API Response received:', response)

                                if (!response) {
                                  throw new Error('API returned undefined response')
                                }

                                if (!response.exploitation_id) {
                                  throw new Error('Response missing exploitation_id field')
                                }

                                addTerminalLine('success', `✅ Exploitation workflow started`)
                                addTerminalLine('info', `📝 Exploitation ID: ${response.exploitation_id}`)
                                addTerminalLine('info', `🔌 Connecting to real-time log stream...`)

                                // Set exploitation ID to trigger polling via useEffect
                                const newExploitationId = response.exploitation_id
                                setExploitationId(newExploitationId)
                                setLastLogIndex(0) // Reset log index for new exploitation
                                addTerminalLine('success', `✅ HTTP polling started - logs will appear in real-time`)
                                setIsExploiting(true)

                              } catch (error: any) {
                                const errorMsg = error?.message || String(error)
                                console.error('🔴 Error starting exploitation:', errorMsg, error)

                                // Only add if not already added by the API service
                                if (!errorMsg.includes('API') && !errorMsg.includes('Connection')) {
                                  addTerminalLine('error', `❌ ${errorMsg}`)
                                }

                                setIsExploiting(false)
                                setExploitationId(null)
                              }
                            }}
                            className="flex-1 bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800 text-white font-bold py-3 px-4 rounded-lg transition-all duration-300 flex items-center justify-center gap-2"
                          >
                            <Flame className="w-5 h-5" />
                            Start Exploiting
                          </button>
                        ) : (
                          <button
                            onClick={async () => {
                              if (!exploitationId) return
                              try {
                                await stopExploitation(exploitationId)
                                setIsExploiting(false)
                                addTerminalLine('warning', `⚠️ Exploitation stopped by user`)
                              } catch (error) {
                                console.error('❌ Error stopping exploitation:', error)
                                addTerminalLine('error', `❌ Failed to stop exploitation: ${error}`)
                              }
                            }}
                            className="flex-1 bg-gradient-to-r from-orange-600 to-orange-700 hover:from-orange-700 hover:to-orange-800 text-white font-bold py-3 px-4 rounded-lg transition-all duration-300 flex items-center justify-center gap-2"
                          >
                            <AlertTriangle className="w-5 h-5" />
                            Stop Exploitation
                          </button>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                )}

                {/* Ready to Exploit or Services List */}
                {!isLoadingServices && scannedServices.length > 0 && !exploitingService && (
                  <div className="space-y-6">
                    {!showServices ? (
                      // Ready to Exploit State
                      <motion.div
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="flex flex-col items-center justify-center py-12 px-6"
                      >
                        <div className="text-center space-y-6">
                          <motion.div
                            animate={{ rotate: 360 }}
                            transition={{ duration: 20, repeat: Number.POSITIVE_INFINITY, ease: "linear" }}
                            className="mx-auto"
                          >
                            <Flame className="w-20 h-20 text-red-500 mx-auto" />
                          </motion.div>
                          <div className="space-y-3">
                            <h2 className="text-3xl font-bold text-slate-100">Ready to Exploit!</h2>
                            <p className="text-slate-300 text-lg">
                              Found <span className="text-red-400 font-bold text-2xl">{scannedServices.length}</span> vulnerable service{scannedServices.length !== 1 ? 's' : ''}
                            </p>
                            <p className="text-slate-400">
                              Total CVEs found: <span className="text-cyan-400 font-bold">{scannedServices.reduce((acc, s) => acc + (s.cves?.length || 0), 0)}</span>
                            </p>
                          </div>
                          <motion.button
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                            onClick={() => setShowServices(true)}
                            className="mx-auto bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800 text-white font-bold py-4 px-8 rounded-lg transition-all duration-300 flex items-center gap-3 text-lg"
                          >
                            <Zap className="w-6 h-6" />
                            Start Exploitation
                          </motion.button>
                        </div>
                      </motion.div>
                    ) : (
                      // Services List
                      <div>
                        <div className="flex items-center justify-between mb-6">
                          <div className="flex items-center gap-3">
                            <h3 className="text-2xl font-bold text-slate-200">Select Services to Exploit</h3>
                            <span className="px-3 py-1 bg-red-500/20 text-red-300 rounded-full text-sm font-medium border border-red-500/30">{scannedServices.length}</span>
                          </div>
                          <button
                            onClick={() => setShowServices(false)}
                            className="px-4 py-2 bg-slate-700/50 hover:bg-slate-700 text-slate-200 rounded-lg transition-all"
                          >
                            Back
                          </button>
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                      {scannedServices.map((service, idx) => {
                        const criticality = service.cves?.length || 0;
                        return (
                          <motion.div
                            key={`${service.ip}:${service.port}`}
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: idx * 0.05 }}
                            whileHover={{ y: -2 }}
                            className="group"
                          >
                            <div className="relative p-6 rounded-xl border-2 border-slate-600/50 bg-gradient-to-br from-slate-700/30 via-slate-700/15 to-transparent hover:from-slate-700/50 hover:to-slate-700/30 transition-all duration-200 hover:border-red-500/60 hover:shadow-[0_0_25px_rgba(239,68,68,0.2)]">
                              {/* Glow effect for critical services */}
                              {service.severity === 'critical' && (
                                <div className="absolute inset-0 rounded-xl bg-red-500/10 pointer-events-none" />
                              )}

                              {/* Top Section: Service Info and Severity Badge */}
                              <div className="flex items-start justify-between gap-4 mb-5">
                                <div className="flex-1 min-w-0">
                                  <div className="flex items-center gap-3 mb-3">
                                    <Terminal className="w-7 h-7 text-red-400 flex-shrink-0" />
                                    <div>
                                      <p className="text-lg font-bold text-slate-50">{service.service}</p>
                                      {service.version && service.version !== 'Unknown' && (
                                        <p className="text-sm text-slate-400 mt-1">Version: <span className="text-slate-300 font-semibold">v{service.version}</span></p>
                                      )}
                                    </div>
                                  </div>
                                  <p className="text-base text-slate-400 font-mono ml-10 bg-slate-800/40 px-4 py-2 rounded-md inline-block">{service.ip}:{service.port}</p>
                                </div>
                                <Badge variant="outline" className={`${getSeverityColor(service.severity)} text-base px-4 py-2 font-semibold`}>
                                  {service.severity?.charAt(0).toUpperCase() + service.severity?.slice(1).toLowerCase()}
                                </Badge>
                              </div>

                              {/* Divider */}
                              <div className="border-t border-slate-600/30 my-4" />

                              {/* Attack Vector Section */}
                              <div className="space-y-3">
                                {/* CVE and Risk Level Row */}
                                <div className="grid grid-cols-2 gap-3">
                                  {/* CVE Badge */}
                                  <div className="bg-gradient-to-br from-purple-500/15 to-purple-600/10 border border-purple-500/30 rounded-lg p-3 text-center">
                                    <div className="text-purple-300 text-xs font-medium mb-2 uppercase">CVE</div>
                                    <div className="text-slate-100 font-bold text-sm break-words">{service.cve_id || 'Unknown'}</div>
                                  </div>
                                  {/* Risk Level Badge */}
                                  <div className="bg-gradient-to-br from-cyan-500/15 to-cyan-600/10 border border-cyan-500/30 rounded-lg p-3 text-center">
                                    <div className="text-cyan-300 text-xs font-medium mb-2 uppercase">Risk</div>
                                    <div className="text-slate-100 font-bold text-sm">{service.severity?.toUpperCase() || 'UNKNOWN'}</div>
                                  </div>
                                </div>

                                {/* CVSS Score */}
                                {service.cvss_score !== undefined && service.cvss_score > 0 && (
                                  <div className="bg-gradient-to-br from-yellow-500/15 to-yellow-600/10 border border-yellow-500/30 rounded-lg p-3 text-center">
                                    <div className="text-yellow-300 text-xs font-medium mb-2 uppercase">CVSS Score</div>
                                    <div className="text-slate-100 font-bold text-lg">{service.cvss_score}</div>
                                  </div>
                                )}

                                {/* See Attack Vector Button */}
                                <button
                                  onClick={() => setExpandedService(expandedService === `${service.ip}:${service.port}` ? null : `${service.ip}:${service.port}`)}
                                  className="flex items-center space-x-2 bg-gradient-to-r from-purple-500/20 to-pink-500/20 border border-purple-500/40 rounded-lg px-4 py-3 hover:from-purple-500/30 hover:to-pink-500/30 transition-all duration-300 cursor-pointer w-full justify-center"
                                >
                                  <Target className="w-5 h-5 text-purple-400" />
                                  <span className="text-purple-300 text-base font-semibold">See Attack Vector</span>
                                  <ChevronDown
                                    className={`w-5 h-5 text-purple-400 transition-transform duration-300 ${
                                      expandedService === `${service.ip}:${service.port}` ? 'rotate-180' : ''
                                    }`}
                                  />
                                </button>

                                {/* Attack Vector Details */}
                                <AnimatePresence mode="wait">
                                  {expandedService === `${service.ip}:${service.port}` && (
                                    <motion.div
                                      initial={{ opacity: 0, y: -10 }}
                                      animate={{ opacity: 1, y: 0 }}
                                      exit={{ opacity: 0, y: -10 }}
                                      transition={{
                                        duration: 0.2,
                                        ease: "easeOut"
                                      }}
                                      className="w-full bg-gradient-to-br from-slate-800/50 to-slate-900/50 border border-slate-600/30 rounded-lg p-4 space-y-3"
                                    >
                                      {service.description && (
                                        <div className="space-y-2">
                                          <div className="flex items-center space-x-2">
                                            <Info className="w-5 h-5 text-blue-400" />
                                            <h4 className="text-blue-300 text-sm font-semibold uppercase">Description</h4>
                                          </div>
                                          <p className="text-slate-200 text-sm leading-relaxed pl-7">
                                            {service.description}
                                          </p>
                                        </div>
                                      )}
                                      {service.impact && (
                                        <div className="space-y-2">
                                          <div className="flex items-center space-x-2">
                                            <AlertTriangle className="w-5 h-5 text-orange-400" />
                                            <h4 className="text-orange-300 text-sm font-semibold uppercase">Impact</h4>
                                          </div>
                                          <p className="text-slate-200 text-sm leading-relaxed pl-7">
                                            {service.impact}
                                          </p>
                                        </div>
                                      )}
                                      {!service.description && !service.impact && (
                                        <p className="text-slate-400 text-sm text-center italic">
                                          No attack vector details available.
                                        </p>
                                      )}

                                      {/* Exploit Button */}
                                      <button
                                        onClick={() => handleServiceToggle(service)}
                                        className="w-full mt-4 bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800 text-white font-bold py-3 px-4 rounded-lg transition-all duration-300 flex items-center justify-center gap-2"
                                      >
                                        <Flame className="w-5 h-5" />
                                        Exploit This Service
                                      </button>
                                    </motion.div>
                                  )}
                                </AnimatePresence>

                                {/* Exploit Button (Always visible) */}
                                {!expandedService?.includes(`${service.ip}:${service.port}`) && (
                                  <button
                                    onClick={() => handleServiceToggle(service)}
                                    className="w-full bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800 text-white font-bold py-3 px-4 rounded-lg transition-all duration-300 flex items-center justify-center gap-2"
                                  >
                                    <Flame className="w-5 h-5" />
                                    Exploit This Service
                                  </button>
                                )}
                              </div>
                            </div>
                          </motion.div>
                        )
                      })}
                    </div>
                      </div>
                    )}
                  </div>
                )}

              </CardContent>
            </Card>
          </motion.div>
        )}

        {/* STEP 2: Select Services */}
        {currentStep === 2 && (
          <motion.div
            key="step2"
            initial={{ opacity: 0, x: 50 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -50 }}
            transition={{ duration: 0.3 }}
          >
            <Card className="bg-gradient-to-br from-slate-800/50 to-slate-900/50 border-red-500/20">
              <CardHeader>
                <CardTitle className="flex items-center space-x-3">
                  <Target className="w-6 h-6 text-lime-400" />
                  <span>Select Services to Exploit</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Selection Summary */}
                <div className="bg-gradient-to-r from-slate-700/20 to-slate-700/10 rounded-lg border border-slate-600/50 p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-semibold text-slate-200">Selection Status</p>
                      <p className="text-xs text-slate-400 mt-1">
                        {selectedServices.length > 0 ? (
                          <span className="text-lime-400">{selectedServices.length} of {scannedServices.length} selected</span>
                        ) : (
                          <span className="text-slate-400">No services selected yet</span>
                        )}
                      </p>
                    </div>
                    <Button
                      size="sm"
                      variant={selectedServices.length === scannedServices.length ? "default" : "outline"}
                      onClick={handleSelectAll}
                      className={selectedServices.length === scannedServices.length ? "bg-lime-600 hover:bg-lime-700" : ""}
                    >
                      {selectedServices.length === scannedServices.length ? "Deselect All" : "Select All"}
                    </Button>
                  </div>
                </div>

                {/* Service Selection */}
                <div className="space-y-3 max-h-[450px] overflow-y-auto pr-2">
                  {scannedServices.map((service, idx) => {
                    const isSelected = selectedServices.some(s => s.ip === service.ip && s.port === service.port)
                    return (
                      <motion.div
                        key={`${service.ip}:${service.port}`}
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: idx * 0.03 }}
                        whileHover={{ x: 4 }}
                        onClick={() => handleServiceToggle(service)}
                        className={`relative p-4 rounded-lg border cursor-pointer transition-all ${
                          isSelected
                            ? "bg-gradient-to-r from-red-500/20 to-red-500/10 border-red-500/50 shadow-lg shadow-red-500/10"
                            : "bg-gradient-to-r from-slate-700/20 to-slate-700/10 border-slate-600/50 hover:border-red-500/40 hover:bg-slate-700/30"
                        }`}
                      >
                        {isSelected && (
                          <div className="absolute top-2 right-2 w-2 h-2 bg-red-400 rounded-full animate-pulse" />
                        )}
                        <div className="flex items-start space-x-4">
                          <div className={`w-6 h-6 rounded border-2 mt-0.5 flex items-center justify-center transition-all ${
                            isSelected
                              ? "bg-red-500 border-red-600"
                              : "border-slate-500 hover:border-red-400"
                          }`}>
                            {isSelected && <CheckCircle className="w-4 h-4 text-white" />}
                          </div>
                          <div className="flex-1">
                            <div className="flex items-center justify-between mb-3">
                              <div>
                                <div className="flex items-center gap-2">
                                  <Terminal className="w-5 h-5 text-red-400" />
                                  <p className="font-bold text-base text-slate-50">{service.service}</p>
                                </div>
                                {service.version && service.version !== 'Unknown' && (
                                  <p className="text-xs text-slate-400 mt-1 ml-7">Version: <span className="text-slate-300 font-semibold">v{service.version}</span></p>
                                )}
                              </div>
                              <Badge variant="outline" className={`${getSeverityColor(service.severity)} text-sm px-3 py-1 font-semibold`}>
                                {service.severity?.charAt(0).toUpperCase() + service.severity?.slice(1).toLowerCase()}
                              </Badge>
                            </div>
                            <p className="text-sm text-slate-400 font-mono mb-3 bg-slate-700/30 px-3 py-2 rounded inline-block">{service.ip}:{service.port}</p>
                            {service.cves && service.cves.length > 0 && (
                              <div className="flex items-center gap-2 mt-2">
                                <span className="text-xs text-slate-400 font-medium">CVEs:</span>
                                <span className="text-2xl font-bold text-cyan-400">{service.cves.length}</span>
                              </div>
                            )}
                          </div>
                        </div>
                      </motion.div>
                    )
                  })}
                </div>

                <div className="flex justify-between space-x-3 pt-4 border-t border-slate-700/50">
                  <Button variant="outline" onClick={() => setCurrentStep(1)}>
                    Back
                  </Button>
                  <Button onClick={() => setCurrentStep(3)} disabled={selectedServices.length === 0} className="bg-red-600 hover:bg-red-700">
                    <Play className="w-4 h-4 mr-2" />
                    Start Exploitation ({selectedServices.length} selected)
                  </Button>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}

{/* STEP 3: Execution & Monitoring */}
        {currentStep === 3 && (
          <motion.div
            key="step4"
            initial={{ opacity: 0, x: 50 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -50 }}
            transition={{ duration: 0.3 }}
          >
            <div className="space-y-6">
              {/* Stats Grid */}
              <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
                {[
                  { label: 'Completed', value: exploitationStats.completed, color: 'green', bgColor: 'bg-green-500/10', textColor: 'text-green-400', borderColor: 'border-green-500/30', icon: <CheckCircle className="w-5 h-5" /> },
                  { label: 'Running', value: exploitationStats.running, color: 'blue', bgColor: 'bg-blue-500/10', textColor: 'text-blue-400', borderColor: 'border-blue-500/30', icon: <Play className="w-5 h-5" /> },
                  { label: 'Pending', value: exploitationStats.pending, color: 'yellow', bgColor: 'bg-yellow-500/10', textColor: 'text-yellow-400', borderColor: 'border-yellow-500/30', icon: <Clock className="w-5 h-5" /> },
                  { label: 'Root Access', value: exploitationStats.rootAccess, color: 'red', bgColor: 'bg-red-500/10', textColor: 'text-red-400', borderColor: 'border-red-500/30', icon: <Shield className="w-5 h-5" /> },
                  { label: 'Sessions', value: exploitationStats.shellsOpened, color: 'purple', bgColor: 'bg-purple-500/10', textColor: 'text-purple-400', borderColor: 'border-purple-500/30', icon: <Terminal className="w-5 h-5" /> }
                ].map((stat, idx) => (
                  <motion.div
                    key={idx}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: idx * 0.05 }}
                  >
                    <div className={`p-4 rounded-lg border ${stat.bgColor} ${stat.borderColor} hover:shadow-lg transition-all ${stat.color === 'red' ? 'hover:shadow-red-500/20' : 'hover:shadow-slate-500/10'}`}>
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-xs text-slate-400 font-medium uppercase tracking-wide">{stat.label}</p>
                          <p className={`text-3xl font-bold ${stat.textColor} mt-2`}>{stat.value}</p>
                        </div>
                        <motion.div
                          animate={stat.label === 'Running' ? { scale: [1, 1.1, 1] } : {}}
                          transition={stat.label === 'Running' ? { duration: 2, repeat: Number.POSITIVE_INFINITY } : {}}
                          className={stat.textColor}
                        >
                          {stat.icon}
                        </motion.div>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>

              {/* Progress Bar */}
              <Card className="bg-gradient-to-br from-slate-800/50 to-slate-900/50 border-red-500/20">
                <CardHeader>
                  <CardTitle>Overall Progress</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <Progress value={exploitProgress} className="h-3" />
                  <div className="flex justify-between text-sm text-muted-foreground">
                    <span>{Math.round(exploitProgress)}%</span>
                    <span>{exploitationStats.completed}/{selectedServices.length} complete</span>
                  </div>
                </CardContent>
              </Card>

              {/* Terminal Output */}
              <Card className="bg-gradient-to-br from-slate-800/50 to-slate-900/50 border-red-500/20 overflow-hidden">
                <CardHeader className="border-b border-slate-700/50 pb-4">
                  <CardTitle className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <Terminal className="w-5 h-5 text-red-400" />
                      <span>Real-time Exploitation Log</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse" />
                      <span className="text-xs text-slate-400 font-normal">{isExploiting ? 'LIVE' : 'IDLE'}</span>
                    </div>
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-0">
                  <div className="h-80 overflow-y-auto bg-black/95 rounded-b-lg p-4 font-mono text-xs space-y-1 border-t border-slate-700/50">
                    {terminalLines.length === 0 ? (
                      <div className="text-slate-500 flex items-center justify-center h-full flex-col gap-2">
                        <Terminal className="w-8 h-8 opacity-30" />
                        <span className="animate-pulse text-sm">Waiting to start exploitation...</span>
                      </div>
                    ) : (
                      terminalLines.map((line) => (
                        <motion.div
                          key={line.id}
                          initial={{ opacity: 0, x: -20 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ duration: 0.2 }}
                          className={`flex items-start space-x-3 py-0.5 ${
                            line.type === "error"
                              ? "text-red-400"
                              : line.type === "success"
                                ? "text-green-400"
                                : line.type === "warning"
                                  ? "text-yellow-400"
                                  : line.type === "exploit"
                                    ? "text-lime-400 font-bold"
                                    : "text-cyan-400"
                          }`}
                        >
                          <span className="text-slate-600 flex-shrink-0 w-20">{line.timestamp}</span>
                          <span className={`flex-shrink-0 w-12 ${
                            line.type === "error"
                              ? "text-red-500"
                              : line.type === "success"
                                ? "text-green-500"
                                : line.type === "warning"
                                  ? "text-yellow-500"
                                  : line.type === "exploit"
                                    ? "text-lime-500 font-bold"
                                    : "text-cyan-500"
                          }`}>[{line.type.toUpperCase()}]</span>
                          <span className="flex-1 break-words">{line.content}</span>
                        </motion.div>
                      ))
                    )}
                  </div>
                </CardContent>
              </Card>

              {/* Controls */}
              <div className="flex justify-end space-x-3 pt-4">
                {!isExploiting && (
                  <Button
                    variant="outline"
                    onClick={() => {
                      setCurrentStep(2)
                      setIsExploiting(false)
                      setTerminalLines([])
                    }}
                  >
                    Back
                  </Button>
                )}
                {isExploiting ? (
                  <Button
                    onClick={() => setIsExploiting(false)}
                    className="bg-gradient-to-r from-orange-600 to-orange-700 hover:from-orange-700 hover:to-orange-800"
                  >
                    <AlertTriangle className="w-4 h-4 mr-2" />
                    Stop Exploitation
                  </Button>
                ) : (
                  <Button
                    onClick={startExploitation}
                    className="bg-red-600 hover:bg-red-700"
                  >
                    <Flame className="w-4 h-4 mr-2" />
                    Start Exploitation
                  </Button>
                )}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

export default function RedAgentPage() {
  return (
    <>
      <Head>
        <title>Red Agent - XploitEye Dashboard</title>
        <meta name="description" content="Penetration testing and vulnerability exploitation tools" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
      </Head>
      <DashboardLayout>
        <RedAgentDashboard />
      </DashboardLayout>
    </>
  );
}
