"use client"

import { useState, useEffect } from "react"
import { motion, AnimatePresence } from "framer-motion"
import {
  Activity,
  Target,
  Shield,
  Bug,
  AlertTriangle,
  CheckCircle,
  Network,
  TrendingUp,
  HardDrive,
  Wifi,
} from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"

interface ScanProgressProps {
  scan: {
    id: number
    target: string
    type: string
    scanType: string
    status: string
    progress: number
    vulnerabilities: {
      critical: number
      high: number
      medium: number
      low: number
    }
    actualPortsScanned?: number
    actualServicesFound?: number
    actualVulnerabilitiesFound?: number
    actualOpenPortsFound?: number
    portLimit?: number
    scanResults?: any  // Add scan results for fallback
    isGeneratingReport?: boolean  // Report generation status
  }
}

export function RealTimeScanProgress({ scan }: ScanProgressProps) {
  const [currentPhase, setCurrentPhase] = useState("discovery")
  const [liveLog, setLiveLog] = useState<string[]>([])
  const [animatedPortCount, setAnimatedPortCount] = useState(0)
  const [animatedServiceCount, setAnimatedServiceCount] = useState(0)
  const [animatedVulnCount, setAnimatedVulnCount] = useState(0)

  // Reset animated counters when scan type or scan ID changes (force fresh start)
  useEffect(() => {
    console.log(`🔄 RealTimeScanProgress: Scan changed (ID: ${scan.id}, Type: ${scan.scanType}), resetting all counters`)
    setAnimatedPortCount(0)
    setAnimatedServiceCount(0)
    setAnimatedVulnCount(0)
  }, [scan.scanType, scan.id])

  // Debug log the scan data received
  // Debug log removed

  // Debug logs removed

  // Use actual scan data with fallback to scan results
  let foundVulns = scan.actualVulnerabilitiesFound || 0
  let scannedPorts = scan.actualPortsScanned || 0
  let detectedServices = scan.actualServicesFound || 0
  const portLimit = scan.portLimit || 1000

  // Debug logs removed

  // Fallback: Extract directly from scan results if state values are 0 AND scan is completed
  // Don't use fallback during active scanning to prevent showing stale data
  if ((foundVulns === 0 || scannedPorts === 0 || detectedServices === 0) &&
      scan.scanResults &&
      scan.status === 'completed' &&
      scan.progress >= 100) {
    if (scan.scanResults.summary) {
      scannedPorts = scannedPorts || scan.scanResults.summary.ports_scanned || 0
      detectedServices = detectedServices || scan.scanResults.services?.length || scan.scanResults.summary.open_ports || 0
    }
    if (scan.scanResults.vulnerabilities) {
      foundVulns = foundVulns || scan.scanResults.vulnerabilities.length || 0
    }

    console.log(`Fallback data extraction: ${scannedPorts} ports, ${detectedServices} services, ${foundVulns} vulnerabilities`)
  }

  // Animated counters - increment during scan
  useEffect(() => {
    if (scan.status === 'running' && scan.progress > 0) {
      // Animate port count based on progress
      const targetPorts = Math.floor((scan.progress / 100) * portLimit)
      const interval = setInterval(() => {
        setAnimatedPortCount(prev => {
          if (prev < targetPorts) {
            const increment = Math.max(1, Math.floor((targetPorts - prev) / 10))
            return Math.min(prev + increment, targetPorts)
          }
          return prev
        })
      }, 50)

      return () => clearInterval(interval)
    } else if (scan.status === 'completed' && scannedPorts > 0) {
      // Set final values when completed
      setAnimatedPortCount(scannedPorts)
      setAnimatedServiceCount(detectedServices)
      setAnimatedVulnCount(foundVulns)
    }
  }, [scan.status, scan.progress, scannedPorts, detectedServices, foundVulns, portLimit])

  // SIMPLE: Always use real values from props - no complex animation logic
  const displayPortCount = scannedPorts
  const displayServiceCount = detectedServices
  const displayVulnCount = foundVulns

  // Debug logs removed

  const phases = [
    { id: "discovery", name: "Target Discovery", icon: Target, color: "text-blue-400" },
    { id: "enumeration", name: "Service Enumeration", icon: Network, color: "text-yellow-400" },
    { id: "vulnerability", name: "Vulnerability Detection", icon: Bug, color: "text-orange-400" },
    { id: "exploitation", name: "Exploit Analysis", icon: Shield, color: "text-red-400" },
    { id: "reporting", name: "Report Generation", icon: CheckCircle, color: "text-green-400" },
  ]

  // Update current phase based on scan progress
  useEffect(() => {
    // Force reporting phase when report is being generated (even if scan is completed)
    if (scan.isGeneratingReport) {
      setCurrentPhase("reporting")
    } else if (scan.progress < 20) {
      setCurrentPhase("discovery")
    } else if (scan.progress < 40) {
      setCurrentPhase("enumeration")
    } else if (scan.progress < 70) {
      setCurrentPhase("vulnerability")
    } else if (scan.progress < 90) {
      setCurrentPhase("exploitation")
    } else {
      setCurrentPhase("reporting")
    }

    // Add nmap-style log entries based on actual scan data
    const generateLogEntry = () => {
      const time = new Date().toLocaleTimeString()
      const scanType = scan.scanType || 'network'

      if (scan.progress === 0 && scan.status !== 'running') {
        return `[${time}] XploitEye ${scanType} scanner ready for target ${scan.target}`
      } else if (scan.status === 'running' && scan.progress < 10) {
        return `[${time}] Starting Nmap 7.94 ( https://nmap.org ) at ${time}`
      } else if (scan.progress >= 10 && scan.progress < 20) {
        return `[${time}] Initiating SYN Stealth Scan at ${time}`
      } else if (scan.progress >= 20 && scan.progress < 30) {
        return `[${time}] Scanning ${scan.target} [${portLimit} ports]`
      } else if (scan.progress >= 30 && scan.progress < 50) {
        return `[${time}] Discovered open port ${21 + Math.floor(scan.progress - 30)}tcp on ${scan.target}`
      } else if (scan.progress >= 50 && scan.progress < 70) {
        return `[${time}] Completed SYN Stealth Scan at ${time}, ${displayPortCount} total ports`
      } else if (scan.progress >= 70 && scan.progress < 80) {
        return `[${time}] Service scan Timing: About ${Math.floor((80-scan.progress)*2)} more seconds`
      } else if (scan.progress >= 80 && scan.progress < 90) {
        return `[${time}] NSE: Starting runlevel 1 (of 3) scan...`
      } else if (scan.progress >= 90 && scan.progress < 100) {
        return `[${time}] NSE: Script scanning ${scan.target}`
      } else if (scan.progress >= 100) {
        return `[${time}] Nmap scan report for ${scan.target} (${scan.target})`
      } else {
        return `[${time}] XploitEye ${scanType} scanner ready for target ${scan.target}`
      }
    }

    // Disabled fake log generation - no more fake nmap output
    // const currentTime = new Date().toLocaleTimeString()
    // const logEntry = generateLogEntry()
    // setLiveLog((prev) => {
    //   const lastEntry = prev[prev.length - 1]
    //   // Only add if entry is meaningfully different
    //   if (!lastEntry || lastEntry.split(']')[1] !== logEntry.split(']')[1]) {
    //     return [...prev.slice(-5), logEntry] // Keep last 5 entries
    //   }
    //   return prev
    // })
  }, [scan.progress, scan.status, scannedPorts, detectedServices, foundVulns, scan.target, scan.scanType, scan.isGeneratingReport])

  const getCurrentPhaseIndex = () => phases.findIndex((p) => p.id === currentPhase)

  return (
    <Card className="bg-gradient-to-br from-gray-900/80 to-gray-800/50 border-teal-500/30 shadow-lg">
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Activity className="w-5 h-5 text-teal-400 animate-pulse" />
            <span>Live Scan Progress</span>
            <Badge className="bg-blue-500/20 text-blue-400 animate-pulse">{scan.status.toUpperCase()}</Badge>
          </div>
          <div className="text-sm text-muted-foreground">Target: {scan.target}</div>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Overall Progress */}
        <div className="space-y-3">
          <div className="flex justify-between items-center">
            <span className="text-sm font-semibold text-teal-400">Overall Progress</span>
            <div className="flex items-center space-x-2">
              <motion.span
                className="text-2xl font-bold font-mono text-teal-400"
                animate={{ scale: [1, 1.05, 1] }}
                transition={{ duration: 2, repeat: Number.POSITIVE_INFINITY }}
              >
                {scan.progress.toFixed(1)}%
              </motion.span>
              <div className="text-xs text-gray-400">
                {scan.status === 'running' ? 'SCANNING' : scan.status.toUpperCase()}
              </div>
            </div>
          </div>

          {/* Enhanced Progress Bar */}
          <div className="relative">
            <div className="w-full bg-gray-700/50 rounded-full h-4 overflow-hidden border border-gray-600/50">
              <motion.div
                className="h-full bg-gradient-to-r from-teal-400 via-cyan-400 to-green-400 relative"
                initial={{ width: 0 }}
                animate={{ width: `${scan.progress}%` }}
                transition={{ duration: 0.8, ease: "easeOut" }}
              >
                {/* Animated shimmer effect */}
                <motion.div
                  className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent"
                  animate={{ x: ["-100%", "100%"] }}
                  transition={{
                    duration: 2,
                    repeat: scan.status === 'running' ? Number.POSITIVE_INFINITY : 0,
                    ease: "linear"
                  }}
                />
              </motion.div>
            </div>

            {/* Progress Milestones */}
            <div className="absolute top-0 left-0 right-0 h-4 flex justify-between items-center px-1">
              {[25, 50, 75].map(milestone => (
                <motion.div
                  key={milestone}
                  className={`w-0.5 h-2 rounded-full ${
                    scan.progress >= milestone ? 'bg-white/40' : 'bg-gray-500/40'
                  }`}
                  initial={{ scale: 0 }}
                  animate={{ scale: scan.progress >= milestone ? 1.2 : 1 }}
                  transition={{ duration: 0.3 }}
                />
              ))}
            </div>
          </div>
        </div>

        {/* Connected Timeline Progress */}
        <div className="space-y-4">
          <h4 className="text-sm font-semibold text-teal-400">Scan Timeline</h4>
          <div className="relative">
            {/* Timeline Container */}
            <div className="flex items-center justify-between relative">
              {/* Connecting Lines */}
              <div className="absolute top-6 left-0 right-0 h-0.5 bg-gray-700 z-0">
                <motion.div
                  className="h-full bg-gradient-to-r from-teal-400 to-green-400"
                  initial={{ width: "0%" }}
                  animate={{
                    width: `${Math.min(100, (getCurrentPhaseIndex() / (phases.length - 1)) * 100)}%`
                  }}
                  transition={{ duration: 0.8, ease: "easeInOut" }}
                />
              </div>

              {/* Phase Circles */}
              {phases.map((phase, index) => {
                const IconComponent = phase.icon
                const isActive = index === getCurrentPhaseIndex()
                const isCompleted = index < getCurrentPhaseIndex()
                const isUpcoming = index > getCurrentPhaseIndex()

                return (
                  <div key={phase.id} className="flex flex-col items-center relative z-10">
                    {/* Circle Container */}
                    <motion.div
                      className={`relative w-12 h-12 rounded-full border-2 flex items-center justify-center ${
                        isCompleted
                          ? "bg-green-500/20 border-green-400 shadow-lg shadow-green-400/20"
                          : isActive
                            ? "bg-teal-500/20 border-teal-400 shadow-lg shadow-teal-400/20"
                            : "bg-gray-800/50 border-gray-600"
                      }`}
                      animate={isActive ? {
                        scale: [1, 1.1, 1],
                        boxShadow: [
                          "0 0 0 0 rgba(20, 184, 166, 0.3)",
                          "0 0 0 8px rgba(20, 184, 166, 0)",
                          "0 0 0 0 rgba(20, 184, 166, 0)"
                        ]
                      } : {}}
                      transition={{
                        duration: 2,
                        repeat: isActive ? Number.POSITIVE_INFINITY : 0,
                        ease: "easeInOut"
                      }}
                      whileHover={{ scale: 1.05 }}
                    >
                      {/* Progress Fill */}
                      {(isCompleted || isActive) && (
                        <motion.div
                          className={`absolute inset-1 rounded-full ${
                            isCompleted ? "bg-green-400/30" : "bg-teal-400/30"
                          }`}
                          initial={{ scale: 0 }}
                          animate={{ scale: 1 }}
                          transition={{ duration: 0.5, delay: index * 0.1 }}
                        />
                      )}

                      {/* Icon */}
                      <IconComponent
                        className={`w-5 h-5 relative z-10 ${
                          isCompleted
                            ? "text-green-400"
                            : isActive
                              ? "text-teal-400"
                              : "text-gray-500"
                        }`}
                      />

                      {/* Completion Checkmark */}
                      {isCompleted && (
                        <motion.div
                          className="absolute inset-0 flex items-center justify-center"
                          initial={{ scale: 0, opacity: 0 }}
                          animate={{ scale: 1, opacity: 1 }}
                          transition={{ duration: 0.3, delay: 0.2 }}
                        >
                          <CheckCircle className="w-3 h-3 text-green-400 absolute top-0 right-0 bg-gray-900 rounded-full" />
                        </motion.div>
                      )}
                    </motion.div>

                    {/* Phase Label */}
                    <motion.div
                      className="mt-2 text-center"
                      initial={{ opacity: 0.5 }}
                      animate={{
                        opacity: isCompleted || isActive ? 1 : 0.5,
                        y: isActive ? [-2, 0, -2] : 0
                      }}
                      transition={{
                        duration: isActive ? 2 : 0.3,
                        repeat: isActive ? Number.POSITIVE_INFINITY : 0
                      }}
                    >
                      <div className={`text-xs font-semibold ${
                        isCompleted
                          ? "text-green-400"
                          : isActive
                            ? "text-teal-400"
                            : "text-gray-500"
                      }`}>
                        {phase.name.split(" ")[0]}
                      </div>
                      <div className={`text-xs mt-1 ${
                        isCompleted || isActive ? "text-gray-300" : "text-gray-600"
                      }`}>
                        {phase.id === "reporting" && scan.isGeneratingReport
                          ? "Generating..."
                          : phase.name.split(" ").slice(1).join(" ")
                        }
                      </div>
                      {/* Special indicator for active report generation */}
                      {phase.id === "reporting" && scan.isGeneratingReport && (
                        <motion.div
                          className="text-xs text-orange-400 font-semibold mt-1"
                          animate={{ opacity: [0.5, 1, 0.5] }}
                          transition={{ duration: 1.5, repeat: Number.POSITIVE_INFINITY }}
                        >
                          📄 PDF Creating...
                        </motion.div>
                      )}
                    </motion.div>
                  </div>
                )
              })}
            </div>
          </div>
        </div>

        {/* Live Statistics - First Row */}
        <div className="grid grid-cols-3 gap-4">
          <motion.div whileHover={{ scale: 1.05 }} className="p-3 bg-blue-500/10 border border-blue-500/20 rounded-lg">
            <div className="flex items-center space-x-2">
              <Wifi className="w-4 h-4 text-blue-400" />
              <div>
                <p className="text-xs text-muted-foreground">Ports Scanned</p>
                <p className="text-lg font-bold text-blue-400 font-mono">{displayPortCount.toLocaleString()}/{portLimit.toLocaleString()}</p>
              </div>
            </div>
          </motion.div>

          <motion.div
            whileHover={{ scale: 1.05 }}
            className="p-3 bg-yellow-500/10 border border-yellow-500/20 rounded-lg"
          >
            <div className="flex items-center space-x-2">
              <HardDrive className="w-4 h-4 text-yellow-400" />
              <div>
                <p className="text-xs text-muted-foreground">Services Found</p>
                <p className="text-lg font-bold text-yellow-400 font-mono">{displayServiceCount}</p>
              </div>
            </div>
          </motion.div>

          <motion.div whileHover={{ scale: 1.05 }} className="p-3 bg-red-500/10 border border-red-500/20 rounded-lg">
            <div className="flex items-center space-x-2">
              <Bug className="w-4 h-4 text-red-400" />
              <div>
                <p className="text-xs text-muted-foreground">Vulnerabilities</p>
                <p className="text-lg font-bold text-red-400 font-mono">{displayVulnCount}</p>
              </div>
            </div>
          </motion.div>
        </div>

        {/* Additional Statistics - Second Row */}
        <div className="grid grid-cols-2 gap-4">
          <motion.div whileHover={{ scale: 1.05 }} className="p-3 bg-purple-500/10 border border-purple-500/20 rounded-lg">
            <div className="flex items-center space-x-2">
              <Shield className="w-4 h-4 text-purple-400" />
              <div>
                <p className="text-xs text-muted-foreground">Open Ports Found</p>
                <p className="text-lg font-bold text-purple-400 font-mono">{displayServiceCount}</p>
                <p className="text-xs text-muted-foreground">Active network services</p>
              </div>
            </div>
          </motion.div>

          <motion.div whileHover={{ scale: 1.05 }} className="p-3 bg-orange-500/10 border border-orange-500/20 rounded-lg">
            <div className="flex items-center space-x-2">
              <AlertTriangle className="w-4 h-4 text-orange-400" />
              <div>
                <p className="text-xs text-muted-foreground">Risk Level</p>
                <p className="text-lg font-bold text-orange-400 font-mono">
                  {scan.status === 'completed' ? 'HIGH' : 'ANALYZING'}
                </p>
                <p className="text-xs text-muted-foreground">Overall threat assessment</p>
              </div>
            </div>
          </motion.div>
        </div>

        {/* Live Terminal Feed */}
        <div className="space-y-2">
          <h4 className="text-sm font-semibold text-teal-400">Live Terminal Output</h4>
          <div className="bg-black/50 border border-gray-700 rounded-lg p-3 h-32 overflow-y-auto font-mono text-xs">
            <AnimatePresence>
              {liveLog.map((entry, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0 }}
                  className="text-green-400 mb-1"
                >
                  {entry}
                </motion.div>
              ))}
            </AnimatePresence>
            <motion.div
              animate={{ opacity: [1, 0] }}
              transition={{ duration: 1, repeat: Number.POSITIVE_INFINITY }}
              className="text-green-400"
            >
              ▋
            </motion.div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex space-x-2">
          <Button
            variant="outline"
            size="sm"
            className="border-red-500/30 text-red-400 hover:bg-red-500/10 bg-transparent"
          >
            <AlertTriangle className="w-4 h-4 mr-2" />
            Pause Scan
          </Button>
          <Button
            variant="outline"
            size="sm"
            className="border-teal-500/30 text-teal-400 hover:bg-teal-500/10 bg-transparent"
          >
            <TrendingUp className="w-4 h-4 mr-2" />
            View Details
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}
