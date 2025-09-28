"use client"

import React from 'react';
import Head from 'next/head';
import { DashboardLayout } from '@/components/layouts/DashboardLayout';
import { useState, useEffect } from "react"
import { motion, AnimatePresence } from "framer-motion"
import {
  Clock,
  CheckCircle,
  XCircle,
  Eye,
  Download,
  Shield,
  Zap,
  Target,
  Activity,
  Network,
  Bug,
  ChevronRight,
  Globe,
  Server,
  Terminal,
} from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Progress } from "@/components/ui/progress"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Checkbox } from "@/components/ui/checkbox"
import { RealTimeScanProgress } from "@/components/dashboard/RealTimeScanProgress"
import { NetworkDiscoveryResults } from "@/components/dashboard/NetworkDiscoveryResults"
import { PortDiscoveryResults } from "@/components/dashboard/PortDiscoveryResults"
import { startNetworkDiscovery, NetworkDiscoveryData } from "@/services/networkDiscoveryApi"
import { startPortDiscovery, PortDiscoveryData, GPTAnalysis } from "@/services/portDiscoveryApi"
// import { EnhancedTerminalOutput } from "@/components/dashboard/EnhancedTerminalOutput"
import Link from "next/link"
import { cveApi, type CVE } from "@/services/cveApi"
import { useAuth } from "@/auth/AuthContext"

// Start with empty scan history for completely fresh experience
const scanHistory: any[] = []

// IP validation utility functions
const isValidIPv4 = (ip: string): boolean => {
  const ipv4Regex = /^(\d{1,3})\.(\d{1,3})\.(\d{1,3})\.(\d{1,3})$/
  const match = ip.match(ipv4Regex)

  if (!match) return false

  return match.slice(1).every(octet => {
    const num = parseInt(octet, 10)
    return num >= 0 && num <= 255
  })
}

const isValidCIDR = (cidr: string): boolean => {
  const parts = cidr.split('/')
  if (parts.length !== 2) return false

  const [ip, prefixLength] = parts
  const prefix = parseInt(prefixLength, 10)

  return isValidIPv4(ip) && prefix >= 0 && prefix <= 32
}

const isLocalAreaNetwork = (input: string): boolean => {
  // Handle CIDR notation
  if (input.includes('/')) {
    if (!isValidCIDR(input)) return false
    const ip = input.split('/')[0]
    return isPrivateIP(ip)
  }

  // Handle single IP
  if (!isValidIPv4(input)) return false
  return isPrivateIP(input)
}

const isPrivateIP = (ip: string): boolean => {
  const parts = ip.split('.').map(Number)
  const [a, b, c, d] = parts

  // Class A: 10.0.0.0 to 10.255.255.255 (10.0.0.0/8)
  if (a === 10) return true

  // Class B: 172.16.0.0 to 172.31.255.255 (172.16.0.0/12)
  if (a === 172 && b >= 16 && b <= 31) return true

  // Class C: 192.168.0.0 to 192.168.255.255 (192.168.0.0/16)
  if (a === 192 && b === 168) return true

  // Loopback: 127.0.0.0 to 127.255.255.255 (127.0.0.0/8)
  if (a === 127) return true

  return false
}

const validateIPInput = (input: string): { isValid: boolean; message: string } => {
  const trimmedInput = input.trim()

  if (!trimmedInput) {
    return { isValid: false, message: "Please enter an IP address or network range" }
  }

  // Check if it's a CIDR notation
  if (trimmedInput.includes('/')) {
    if (!isValidCIDR(trimmedInput)) {
      return { isValid: false, message: "Invalid CIDR notation. Please use format like 192.168.1.0/24" }
    }
    if (!isLocalAreaNetwork(trimmedInput)) {
      return { isValid: false, message: "Only local area network ranges are allowed (10.x.x.x, 172.16-31.x.x, 192.168.x.x)" }
    }
  } else {
    // Single IP address
    if (!isValidIPv4(trimmedInput)) {
      return { isValid: false, message: "Invalid IP address format. Please use format like 192.168.1.1" }
    }
    if (!isLocalAreaNetwork(trimmedInput)) {
      return { isValid: false, message: "Only local area network IPs are allowed (10.x.x.x, 172.16-31.x.x, 192.168.x.x, 127.x.x.x)" }
    }
  }

  return { isValid: true, message: "" }
}

const vulnerabilityConfigs = {
  web: {
    light: ["SQL Injection Detection", "Cross-Site Scripting (XSS)", "Broken Authentication"],
    medium: [
      "SQL Injection Detection",
      "Cross-Site Scripting (XSS)",
      "Broken Authentication",
      "Security Misconfiguration",
      "Insecure Direct Object References",
    ],
    deep: [
      "SQL Injection Detection",
      "Cross-Site Scripting (XSS)",
      "Broken Authentication",
      "Security Misconfiguration",
      "Insecure Direct Object References",
      "Cross-Site Request Forgery (CSRF)",
      "Using Components with Known Vulnerabilities",
      "Unvalidated Redirects and Forwards",
      "Insufficient Logging & Monitoring",
      "Server-Side Request Forgery (SSRF)",
    ],
  },
  network: {
    light: ["Open Port Scanning", "Service Version Detection", "Basic OS Fingerprinting"],
    medium: [
      "Open Port Scanning",
      "Service Version Detection",
      "Basic OS Fingerprinting",
      "SMB Enumeration",
      "DNS Zone Transfer",
      "SSL/TLS Configuration",
      "SNMP Community Strings",
    ],
    deep: [
      "Open Port Scanning",
      "Service Version Detection",
      "Basic OS Fingerprinting",
      "SMB Enumeration",
      "DNS Zone Transfer",
      "SSL/TLS Configuration",
      "SNMP Community Strings",
      "NetBIOS Enumeration",
      "RPC Enumeration",
      "Banner Grabbing",
    ],
  },
  domain: {
    light: ["Subdomain Enumeration", "DNS Record Analysis", "WHOIS Information", "Certificate Transparency"],
    medium: [
      "Subdomain Enumeration",
      "DNS Record Analysis",
      "WHOIS Information",
      "Certificate Transparency",
      "Email Security (SPF/DKIM/DMARC)",
      "Domain Reputation Check",
    ],
    deep: [
      "Subdomain Enumeration",
      "DNS Record Analysis",
      "WHOIS Information",
      "Certificate Transparency",
      "Email Security (SPF/DKIM/DMARC)",
      "Domain Reputation Check",
      "DNS Zone Walking",
      "Reverse DNS Lookup",
      "Domain Takeover Detection",
      "Historical DNS Data",
    ],
  },
}

// Start with empty CVE data for completely fresh experience
const mockCVEs: any[] = []

export function ScanningModule() {
  const { apiCall } = useAuth()
  const [searchTerm, setSearchTerm] = useState("")
  const [activeScan, setActiveScan] = useState<any>(null)
  const [isScanning, setIsScanning] = useState(false)
  const [targetInput, setTargetInput] = useState("")
  const [scanProgress, setScanProgress] = useState(0)
  const [scanStatus, setScanStatus] = useState<'idle' | 'scanning' | 'generating' | 'completed'>('idle')
  const [scanMessage, setScanMessage] = useState("")
  const [currentScanId, setCurrentScanId] = useState<string | null>(null)
  const [terminalLines, setTerminalLines] = useState<any[]>([])
  const [currentScanType, setCurrentScanType] = useState<string>('')
  const [isGeneratingReport, setIsGeneratingReport] = useState(false)
  const [showPdfNotification, setShowPdfNotification] = useState(false)
  const [actualPortsScanned, setActualPortsScanned] = useState(0)
  const [actualServicesFound, setActualServicesFound] = useState(0)
  const [actualVulnerabilitiesFound, setActualVulnerabilitiesFound] = useState(0)
  const [actualOpenPortsFound, setActualOpenPortsFound] = useState(0)
  const [scanSummary, setScanSummary] = useState<any>(null)
  const [foundCVEs, setFoundCVEs] = useState<CVE[]>([])
  const [loadingCVEs, setLoadingCVEs] = useState(false)
  const [hasActiveScan, setHasActiveScan] = useState(false) // Flag to prevent old CVE loading
  const [scanGeneration, setScanGeneration] = useState(0) // Force refresh counter
  const [scanErrorMessage, setScanErrorMessage] = useState("") // Error message for active scan attempts
  const [selectedScanMode, setSelectedScanMode] = useState("vulnerability-scan") // Track selected scan mode
  const [isPolling, setIsPolling] = useState(false) // Prevent duplicate polling

  // Network Discovery state
  const [networkDiscoveryData, setNetworkDiscoveryData] = useState<NetworkDiscoveryData | null>(null)
  const [isNetworkDiscoveryLoading, setIsNetworkDiscoveryLoading] = useState(false)
  // Port Discovery state
  const [portDiscoveryData, setPortDiscoveryData] = useState<PortDiscoveryData | null>(null)
  const [portDiscoveryAnalysis, setPortDiscoveryAnalysis] = useState<GPTAnalysis | null>(null)
  const [isPortDiscoveryLoading, setIsPortDiscoveryLoading] = useState(false)
  const [selectedPort, setSelectedPort] = useState<string>("")
  const [progressInterval, setProgressInterval] = useState<NodeJS.Timeout | null>(null)
  const [ipValidationError, setIpValidationError] = useState("") // IP validation error message
  const [isValidIP, setIsValidIP] = useState(false) // IP validation state
  const [isCheckingIP, setIsCheckingIP] = useState(false) // IP reachability check state
  const [ipCheckMessage, setIpCheckMessage] = useState("") // IP check status message
  const selectedTargetType = "network" // Default to network scanning

  // Get wait time before starting progress (when to go to 95% and wait)
  const getProgressWaitTime = (scanType: string): number => {
    switch(scanType.toLowerCase()) {
      case 'light': return 43 * 1000 // 43 seconds
      case 'medium': return 50 * 1000 // 50 seconds
      case 'deep': return 60 * 1000 // 60 seconds (estimated)
      default: return 45 * 1000 // 45 seconds default
    }
  }

  // Enhanced progress animation with cross-tab synchronization
  const startProgressAnimation = (scanType: string) => {
    console.log(`🎬 [PROGRESS] Starting animation for ${scanType} scan`)

    // Simple progress animation - no complex tab management
    console.log(`🆕 [PROGRESS] Starting animation for ${scanType} scan`)

    let startProgress = scanProgress || 0

      // Clear any existing interval
      if (progressInterval) {
        clearInterval(progressInterval)
      }

      const waitTime = getProgressWaitTime(scanType)

      // Only start animation if progress is below 95%
      if (startProgress < 95) {
        // Calculate remaining progress and time
        const remainingProgress = 95 - startProgress
        const elapsedTime = (startProgress / 95) * waitTime
        const remainingTime = Math.max(waitTime - elapsedTime, 1000) // At least 1 second

        console.log(`⏱️ [PROGRESS] Animation timing: ${remainingProgress}% over ${remainingTime}ms`)

        // Update progress every 500ms until we reach 95%
        const interval = setInterval(() => {
          setScanProgress(prev => {
            const increment = (remainingProgress / (remainingTime / 500))
            const newProgress = prev + increment

            if (newProgress >= 95) {
              clearInterval(interval)
              setProgressInterval(null)
              // Stop at 95% and wait for backend completion
              return 95 // Stop at 95% and wait for backend completion
            }

            // Progress updated
            return newProgress
          })
        }, 500)

        setProgressInterval(interval)
      } else {
        console.log(`✅ [PROGRESS] Already at 95%+, no animation needed`)
        setProgressInterval(null)
      }

  }

  // Stop progress animation and cleanup
  const stopProgressAnimation = () => {
    if (progressInterval) {
      clearInterval(progressInterval)
      setProgressInterval(null)
    }

    // Simple cleanup - no complex tab management needed
    console.log(`🛑 [PROGRESS] Stopped animation`)
  }

  // Show PDF generation notification
  const showPdfGenerationNotification = () => {
    console.log(`📄 [NOTIFICATION] Showing PDF generation slider`)
    setShowPdfNotification(true)

    // Auto-hide after 5 seconds
    setTimeout(() => {
      console.log(`📄 [NOTIFICATION] Auto-hiding PDF notification after 5 seconds`)
      setShowPdfNotification(false)
    }, 5000)
  }

  // Debug effect to track scan type changes
  useEffect(() => {
    console.log(`🔄 Scan type changed to: "${currentScanType}" | Port limit: ${getPortLimit(currentScanType || 'light')}`)
    console.log(`📊 Current statistics:`, {
      actualPortsScanned,
      actualServicesFound,
      actualVulnerabilitiesFound,
      actualOpenPortsFound,
      hasActiveScan
    })
  }, [currentScanType, actualPortsScanned, actualServicesFound, actualVulnerabilitiesFound, actualOpenPortsFound])

  // Save state when key values change for navigation persistence
  useEffect(() => {
    if (currentScanId) {
      saveScanState()
    }
  }, [isScanning, currentScanId, scanProgress, scanStatus])

  // Save progress with timing information for time-based calculation
  useEffect(() => {
    if (currentScanId && scanProgress > 0) {
      // Save progress with timestamp for time-based calculation
      const progressData = {
        scanId: currentScanId,
        progress: scanProgress,
        timestamp: Date.now(),
        scanType: currentScanType,
        startTime: Date.now()
      }

      saveScanState()
    }
  }, [scanProgress, currentScanId, currentScanType])

  // Simple scan state management - no complex versioning or user isolation
  const CURRENT_SCAN_KEY = 'xploiteye_current_scan'
const GLOBAL_PROGRESS_KEY = 'xploiteye_global_progress'

// Global Progress Manager - runs independent of page
class GlobalProgressManager {
  private static instance: GlobalProgressManager
  private progressInterval: NodeJS.Timeout | null = null
  private isRunning = false

  static getInstance(): GlobalProgressManager {
    if (!GlobalProgressManager.instance) {
      GlobalProgressManager.instance = new GlobalProgressManager()
    }
    return GlobalProgressManager.instance
  }

  startGlobalProgress(scanId: string, scanType: string) {
    if (this.isRunning) {
      console.log('🌐 [GLOBAL] Progress already running')
      return
    }

    console.log(`🌐 [GLOBAL] Starting global progress for scan ${scanId}`)
    this.isRunning = true

    // Get scan duration based on scan type
    const getScanDuration = (type: string): number => {
      switch (type) {
        case 'light': return 45  // 45 seconds
        case 'medium': return 180 // 3 minutes
        case 'deep': return 600   // 10 minutes
        default: return 45
      }
    }

    const scanDuration = getScanDuration(scanType)
    const startTime = Date.now()

    // Save global progress data
    const globalProgressData = {
      scanId,
      scanType,
      startTime,
      scanDuration,
      isActive: true
    }
    localStorage.setItem(GLOBAL_PROGRESS_KEY, JSON.stringify(globalProgressData))

    // Update progress every 500ms globally
    this.progressInterval = setInterval(() => {
      const elapsed = (Date.now() - startTime) / 1000
      const progress = Math.min((elapsed / scanDuration) * 95, 95) // Cap at 95%

      // Update global progress in localStorage
      const currentData = JSON.parse(localStorage.getItem(GLOBAL_PROGRESS_KEY) || '{}')
      if (currentData.scanId === scanId && currentData.isActive) {
        currentData.currentProgress = progress
        localStorage.setItem(GLOBAL_PROGRESS_KEY, JSON.stringify(currentData))

        // Also update the main scan state
        const scanState = localStorage.getItem(CURRENT_SCAN_KEY)
        if (scanState) {
          const state = JSON.parse(scanState)
          if (state.currentScanId === scanId && state.isScanning) {
            state.scanProgress = progress
            localStorage.setItem(CURRENT_SCAN_KEY, JSON.stringify(state))
          }
        }

        console.log(`🌐 [GLOBAL] Progress updated: ${Math.round(progress)}%`)
      } else {
        // Scan completed or changed, stop global progress
        this.stopGlobalProgress()
      }
    }, 500)
  }

  stopGlobalProgress() {
    if (this.progressInterval) {
      clearInterval(this.progressInterval)
      this.progressInterval = null
    }
    this.isRunning = false

    // Remove global progress data completely when stopping
    localStorage.removeItem(GLOBAL_PROGRESS_KEY)
    console.log('🌐 [GLOBAL] Global progress stopped and removed from localStorage')
  }

  getCurrentProgress(scanId: string): number {
    const globalData = JSON.parse(localStorage.getItem(GLOBAL_PROGRESS_KEY) || '{}')
    console.log(`🌐 [GLOBAL] getCurrentProgress called for ${scanId}:`, globalData)

    if (globalData.scanId === scanId && globalData.isActive) {
      console.log(`🌐 [GLOBAL] Returning progress: ${globalData.currentProgress}`)
      return globalData.currentProgress || 0
    }

    // Fallback: try to get progress from main scan state if global progress isn't active
    const scanState = JSON.parse(localStorage.getItem(CURRENT_SCAN_KEY) || '{}')
    if (scanState.currentScanId === scanId && scanState.isScanning) {
      console.log(`🌐 [GLOBAL] Fallback to scan state progress: ${scanState.scanProgress}`)
      return scanState.scanProgress || 0
    }

    console.log(`🌐 [GLOBAL] No progress found for ${scanId}`)
    return 0
  }
}

// Global instance
const globalProgressManager = GlobalProgressManager.getInstance()

  // Simple state management functions
  const saveScanStateToStorage = () => {
    if (!currentScanId) return false

    try {
      const state = {
        currentScanId,
        isScanning,
        targetInput,
        scanProgress,
        scanStatus,
        scanMessage,
        currentScanType,
        hasActiveScan,
        activeScan,  // Include scan results
        actualPortsScanned,
        actualServicesFound,
        actualVulnerabilitiesFound,
        actualOpenPortsFound,
        timestamp: Date.now()
      }

      localStorage.setItem(CURRENT_SCAN_KEY, JSON.stringify(state))
      console.log("💾 [STATE] Saved scan state for navigation")
      return true
    } catch (error) {
      console.error("❌ [STATE] Failed to save scan state:", error)
      return false
    }
  }

  const loadScanStateFromStorage = () => {
    try {
      const stored = localStorage.getItem(CURRENT_SCAN_KEY)
      if (!stored) return false

      const state = JSON.parse(stored)

      // Check if state is too old (max 2 hours)
      if (Date.now() - state.timestamp > 2 * 60 * 60 * 1000) {
        localStorage.removeItem(CURRENT_SCAN_KEY)
        return false
      }

      // Check if this is a completed scan before restoring
      const isCompletedScan = state.scanStatus === 'completed' || state.scanProgress >= 100

      if (isCompletedScan) {
        // Don't restore completed scan state - clear everything and clean localStorage
        console.log(`🧹 [STATE] Detected completed scan, clearing instead of restoring`)
        localStorage.removeItem(CURRENT_SCAN_KEY) // Remove the completed state from storage
        globalProgressManager.stopGlobalProgress() // Stop global progress
        setCurrentScanId(null)
        setIsScanning(false)
        setTargetInput(state.targetInput) // Keep target input but clear scan state
        setScanStatus('idle')
        setScanMessage('')
        setCurrentScanType(null)
        setHasActiveScan(false)
        setActiveScan(null)
        setActualPortsScanned(0)
        setActualServicesFound(0)
        setActualVulnerabilitiesFound(0)
        setActualOpenPortsFound(0)
        // Progress will be set to 0 below
      } else {
        // Restore active scan state
        setCurrentScanId(state.currentScanId)
        setIsScanning(state.isScanning)
        setTargetInput(state.targetInput)
        setScanStatus(state.scanStatus)
        setScanMessage(state.scanMessage)
        setCurrentScanType(state.currentScanType)
        setHasActiveScan(state.hasActiveScan)
        setActiveScan(state.activeScan || null)  // Restore scan results
        setActualPortsScanned(state.actualPortsScanned || 0)
        setActualServicesFound(state.actualServicesFound || 0)
        setActualVulnerabilitiesFound(state.actualVulnerabilitiesFound || 0)
        setActualOpenPortsFound(state.actualOpenPortsFound || 0)
      }

      // Set progress based on scan state
      if (isCompletedScan) {
        // Always set progress to 0 for completed scans
        setScanProgress(0)
        console.log(`🧹 [STATE] Set progress to 0 for completed scan`)
      } else if (state.isScanning && state.currentScanId) {
        // For active scans, use global progress manager
        const currentGlobalProgress = globalProgressManager.getCurrentProgress(state.currentScanId)
        console.log(`🌐 [STATE] Setting progress from global manager: ${Math.round(currentGlobalProgress)}%`)
        setScanProgress(currentGlobalProgress > 0 ? currentGlobalProgress : state.scanProgress)
      } else {
        // For idle scans, restore saved progress
        setScanProgress(state.scanProgress)
      }

      // Resume polling and global progress if scan was active
      if (state.isScanning && state.currentScanId) {
        console.log("🔄 [STATE] Resuming scan polling after navigation")
        setIsPolling(true)
        pollScanStatus(state.currentScanId)

        // Check if global progress needs to be resumed
        const globalProgress = globalProgressManager.getCurrentProgress(state.currentScanId)
        if (globalProgress === 0) {
          // Global progress stopped, restart it
          console.log("🌐 [STATE] Resuming global progress after navigation")
          globalProgressManager.startGlobalProgress(state.currentScanId, state.currentScanType)
        }
      }

      console.log("✅ [STATE] Restored scan state after navigation")
      return true
    } catch (error) {
      console.error("❌ [STATE] Failed to restore scan state:", error)
      localStorage.removeItem(CURRENT_SCAN_KEY)
      return false
    }
  }


  // Simple scan state wrapper (replaces complex function)
  const saveScanState = () => {
    return saveScanStateToStorage()
  }

  // Calculate current ongoing progress based on elapsed time
  const calculateCurrentProgress = (scanId: string, scanType: string): number => {
    try {
      const progressDataStr = localStorage.getItem(`scan_progress_${scanId}`)
      const startTimeStr = localStorage.getItem(`scan_start_${scanId}`)

      if (!progressDataStr || !startTimeStr) {
        console.log(`📊 [PROGRESS] No timing data found for scan ${scanId}`)
        return 0
      }

      const progressData = JSON.parse(progressDataStr)
      const scanStartTime = parseInt(startTimeStr)
      const now = Date.now()
      const elapsedSeconds = Math.floor((now - scanStartTime) / 1000)

      // Get scan duration based on scan type
      const getScanDuration = (type: string): number => {
        switch (type) {
          case 'light': return 25 // 25 seconds
          case 'medium': return 45 // 45 seconds
          case 'deep': return 90 // 90 seconds
          default: return 25
        }
      }

      const totalDuration = getScanDuration(scanType)
      const calculatedProgress = Math.min((elapsedSeconds / totalDuration) * 95, 95) // Cap at 95%

      console.log(`📊 [PROGRESS] Time-based calculation:`, {
        scanId,
        scanType,
        elapsedSeconds,
        totalDuration,
        calculatedProgress: Math.round(calculatedProgress),
        savedProgress: progressData.progress
      })

      // Return the higher of calculated or saved progress to prevent going backwards
      return Math.max(calculatedProgress, progressData.progress || 0)

    } catch (error) {
      console.error(`❌ [PROGRESS] Error calculating time-based progress:`, error)
      return 0
    }
  }

  // Simple restore wrapper (replaces complex function)
  const restoreScanState = () => {
    // Use our simple restore function instead of complex logic
    return loadScanStateFromStorage()
  }



  // Simple clear state function
  const clearScanState = () => {
    try {
      localStorage.removeItem(CURRENT_SCAN_KEY)
      console.log("🗑️ [STATE] Cleared scan state")
      return true
    } catch (error) {
      console.error("❌ [STATE] Failed to clear scan state:", error)
      return false
    }
  }

  // Simple cleanup function
  const clearAllScanData = () => {
    try {
      Object.keys(localStorage).forEach(key => {
        if (key.startsWith('xploiteye') || key.includes('scan_')) {
          localStorage.removeItem(key)
        }
      })
      console.log("🧹 [STATE] Cleared all scan data")
      return true
    } catch (error) {
      console.error("❌ [STATE] Failed to clear all scan data:", error)
      return false
    }
  }

  // Handle IP input validation
  const handleIPInputChange = (value: string) => {
    setTargetInput(value)

    if (value.trim() === "") {
      setIpValidationError("")
      setIsValidIP(false)
      return
    }

    const validation = validateIPInput(value)
    setIsValidIP(validation.isValid)
    setIpValidationError(validation.isValid ? "" : validation.message)
  }

  // Check IP reachability using arping
  const checkIPReachability = async (targetIP: string): Promise<boolean> => {
    console.log(`🟡 [IP CHECK START] Starting IP reachability check for: ${targetIP}`)
    const startTime = Date.now()

    setIsCheckingIP(true)
    setIpCheckMessage(`Checking if ${targetIP} is reachable...`)
    console.log(`🟡 [IP CHECK UI] Set isCheckingIP=true, showing yellow overlay`)

    try {
      const token = localStorage.getItem('access_token')
      console.log(`🟡 [IP CHECK API] Calling backend check-ip endpoint for: ${targetIP}`)

      const response = await fetch('http://localhost:8000/scanning/check-ip', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          target: targetIP
        })
      })

      const apiCallTime = Date.now() - startTime
      console.log(`🟡 [IP CHECK API] Backend response received in ${apiCallTime}ms`)

      if (response.ok) {
        const result = await response.json()
        console.log(`🟡 [IP CHECK RESULT] Backend result:`, result)

        if (result.is_reachable) {
          console.log(`🟢 [IP CHECK SUCCESS] IP ${targetIP} is reachable! Showing success message`)
          setIpCheckMessage(`✅ ${targetIP} is active and reachable!`)

          // Brief success message before proceeding
          console.log(`🟢 [IP CHECK SUCCESS] Setting 1-second timeout to clear overlay`)
          setTimeout(() => {
            console.log(`🟢 [IP CHECK TIMEOUT] 1-second timeout triggered, clearing overlay`)
            setIpCheckMessage("")
            setIsCheckingIP(false)
            console.log(`🟢 [IP CHECK CLEAR] Set isCheckingIP=false, overlay should disappear`)
          }, 1000)

          const totalTime = Date.now() - startTime
          console.log(`🟢 [IP CHECK COMPLETE] Total check time: ${totalTime}ms, returning true`)
          return true
        } else {
          console.log(`🔴 [IP CHECK FAILED] IP ${targetIP} is not reachable`)
          setIpCheckMessage(`❌ ${result.message}`)
          console.log(`🔴 [IP CHECK FAILED] Showing error message for 4 seconds`)

          // Keep overlay visible to show error message for 4 seconds
          setTimeout(() => {
            console.log(`🔴 [IP CHECK FAILED] 4-second timeout complete, hiding overlay`)
            setIpCheckMessage("")
            setIsCheckingIP(false)
          }, 4000)

          return false
        }
      } else {
        const error = await response.json()
        console.log(`🔴 [IP CHECK ERROR] API error:`, error)
        setIpCheckMessage(`❌ Error checking IP: ${error.detail}`)

        // Keep overlay visible to show error message for 4 seconds
        setTimeout(() => {
          console.log(`🔴 [IP CHECK ERROR] 4-second timeout complete, hiding overlay`)
          setIpCheckMessage("")
          setIsCheckingIP(false)
        }, 4000)

        return false
      }
    } catch (error) {
      console.log(`🔴 [IP CHECK EXCEPTION] Exception occurred:`, error)
      setIpCheckMessage(`❌ Failed to check IP connectivity`)

      // Keep overlay visible to show error message for 4 seconds
      setTimeout(() => {
        console.log(`🔴 [IP CHECK EXCEPTION] 4-second timeout complete, hiding overlay`)
        setIpCheckMessage("")
        setIsCheckingIP(false)
      }, 4000)

      return false
    }
  }

  // No simulated scan updates - start completely fresh

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "completed":
        return <CheckCircle className="w-4 h-4 text-green-500" />
      case "running":
        return <Activity className="w-4 h-4 text-blue-500 animate-pulse" />
      case "failed":
        return <XCircle className="w-4 h-4 text-red-500" />
      default:
        return <Clock className="w-4 h-4 text-gray-500" />
    }
  }

  const getScanTypeIcon = (scanType: string) => {
    switch (scanType) {
      case "light":
        return <Zap className="w-4 h-4 text-yellow-400" />
      case "medium":
        return <Shield className="w-4 h-4 text-orange-400" />
      case "deep":
        return <Target className="w-4 h-4 text-red-400" />
      default:
        return <Activity className="w-4 h-4 text-gray-400" />
    }
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "completed":
        return "bg-green-500/20 text-green-400 border-green-500/30"
      case "running":
        return "bg-blue-500/20 text-blue-400 border-blue-500/30 animate-pulse"
      case "failed":
        return "bg-red-500/20 text-red-400 border-red-500/30"
      default:
        return "bg-gray-500/20 text-gray-400 border-gray-500/30"
    }
  }

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case "critical":
        return "text-red-400 bg-red-500/20 border-red-500/30"
      case "high":
        return "text-orange-400 bg-orange-500/20 border-orange-500/30"
      case "medium":
        return "text-yellow-400 bg-yellow-500/20 border-yellow-500/30"
      case "low":
        return "text-green-400 bg-green-500/20 border-green-500/30"
      default:
        return "text-gray-400 bg-gray-500/20 border-gray-500/30"
    }
  }

  const filteredScans = scanHistory.filter(
    (scan) =>
      scan.target.toLowerCase().includes(searchTerm.toLowerCase()) ||
      scan.type.toLowerCase().includes(searchTerm.toLowerCase()),
  )

  const generateReport = async (scanId: string) => {
    try {
      const token = localStorage.getItem('access_token')
      const response = await fetch('http://localhost:8000/scanning/generate-report', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          scan_id: scanId
        })
      })

      if (response.ok) {
        const result = await response.json()
        console.log('Report generated:', result)
        addTerminalLine('success', '📄 PDF report generated successfully! Check Reports section.')

        // Report generation completed
        setIsGeneratingReport(false)

        // Don't change scan status - keep it as "completed"
        // Just add a message about PDF completion
        setScanMessage('Scan completed! PDF report ready for download.')

        // Reset scan state immediately after PDF generation
        setScanStatus('idle')
        setScanProgress(0)
        setScanMessage('')
        setIsScanning(false)
        setCurrentScanId(null)
        setCurrentScanType('')
        setHasActiveScan(false)

        // Clear localStorage state when fully done
        clearScanState()
      } else {
        const error = await response.json()
        console.error('Failed to generate report:', error)
        setScanMessage('Failed to generate report. Please try again.')
      }
    } catch (error) {
      console.error('Error generating report:', error)
      setScanMessage('Error generating report. Please try again.')
    }
  }

  // Terminal output functions
  const addTerminalLine = (type: 'info' | 'success' | 'warning' | 'error' | 'scan', content: string) => {
    const newLine = {
      id: `line-${Date.now()}-${Math.random()}`,
      timestamp: new Date().toLocaleTimeString(),
      type,
      content,
      highlight: type === 'error' || type === 'warning'
    }
    setTerminalLines(prev => [...prev, newLine])
  }

  const clearTerminal = () => {
    setTerminalLines([])
  }

  // Get port limit for scan type
  const getPortLimit = (scanType: string) => {
    console.log(`🔧 getPortLimit called with scanType: "${scanType}"`)
    const limits = {
      'light': 1000,
      'medium': 5000,
      'deep': 10000
    }
    const limit = limits[scanType as keyof typeof limits] || 1000
    console.log(`📊 Port limit for "${scanType}": ${limit}`)
    return limit
  }

  // Scroll to live scan progress
  const scrollToLiveProgress = () => {
    setTimeout(() => {
      const progressElement = document.getElementById('live-scan-progress-section')
      if (progressElement) {
        progressElement.scrollIntoView({ behavior: 'smooth', block: 'start' })
      }
    }, 500)
  }

  // Scan duration mapping
  const getScanDuration = (scanType: string) => {
    switch (scanType) {
      case 'light': return 60000 // 60 seconds
      case 'medium': return 150000 // 2.5 minutes
      case 'deep': return 210000 // 3.5 minutes
      default: return 60000
    }
  }

  // DEPRECATED: Progress simulation now handled by GlobalProgressManager
  const simulateIncrementalProgress = (scanType: string, scanId: string) => {
    const duration = getScanDuration(scanType)
    const progressSteps = [10, 20, 30, 40, 50, 60, 70, 80, 90, 95, 98]

    const messages = {
      light: [
        `🚀 Initializing XploitEye light scanning engine...`,
        `🔍 Target validation: ${targetInput}`,
        `✅ Target accessibility verified`,
        `🌐 Starting reconnaissance phase...`,
        `📡 Host connectivity check completed`,
        `📡 Scanning ports 1-1000...`,
        `🔍 Port enumeration in progress...`,
        `🎯 Service detection phase...`,
        `🕷️ CVE vulnerability lookup...`,
        `🔎 SSL/TLS analysis...`,
        `🤖 AI-powered analysis...`,
        `📊 Compiling scan results...`,
        `📈 Risk assessment...`,
        `🛡️ Security evaluation...`,
        `📄 Generating security report...`,
        `📋 Report formatting...`,
        `🔍 Final vulnerability analysis...`,
        `📊 Statistics compilation...`,
        `✅ Preparing final results...`
      ],
      medium: [
        `🚀 Initializing XploitEye medium scanning engine...`,
        `🔍 Target validation: ${targetInput}`,
        `✅ Target accessibility verified`,
        `🌐 Starting reconnaissance phase...`,
        `📡 Host connectivity check completed`,
        `📡 Scanning ports 1-5000...`,
        `🔍 Advanced port enumeration...`,
        `🎯 Comprehensive service detection...`,
        `🕷️ CVE vulnerability lookup with VPN rotation...`,
        `🔎 SSL/TLS configuration analysis...`,
        `🛡️ Security misconfiguration check...`,
        `🤖 AI-powered threat modeling...`,
        `📊 Advanced risk assessment...`,
        `🔍 Deep vulnerability analysis...`,
        `📄 Comprehensive report generation...`,
        `📋 Executive summary creation...`,
        `🔍 Final security evaluation...`,
        `📊 Detailed statistics...`,
        `✅ Finalizing comprehensive results...`
      ],
      deep: [
        `🚀 Initializing XploitEye deep scanning engine...`,
        `🔍 Target validation: ${targetInput}`,
        `✅ Target accessibility verified`,
        `🌐 Starting reconnaissance phase...`,
        `📡 Host connectivity check completed`,
        `📡 Deep port scanning 1-10000...`,
        `🔍 Extensive service enumeration...`,
        `🎯 Advanced banner grabbing...`,
        `🕷️ Extensive CVE database lookup...`,
        `🔎 SSL/TLS and certificate analysis...`,
        `🛡️ Security configuration assessment...`,
        `🤖 Advanced AI threat analysis...`,
        `📊 Enterprise risk modeling...`,
        `🔍 Penetration testing simulation...`,
        `📄 Executive-level report generation...`,
        `📋 Compliance assessment...`,
        `🔍 Advanced threat intelligence...`,
        `📊 Comprehensive analytics...`,
        `✅ Finalizing enterprise results...`
      ]
    }

    let currentStep = 0
    const stepInterval = duration / progressSteps.length

    const progressTimer = setInterval(() => {
      if (currentStep < progressSteps.length && currentScanId === scanId) {
        const progress = progressSteps[currentStep]
        const message = messages[scanType as keyof typeof messages]?.[currentStep] || `🔍 Scanning in progress... ${progress}%`

        setScanProgress(progress)
        // Remove the simulated terminal messages
        // addTerminalLine('info', message)
        currentStep++
      } else {
        clearInterval(progressTimer)
      }
    }, stepInterval)

    // Return null since we're using GlobalProgressManager now
    return null
  }

  // Network Discovery handler
  const handleNetworkDiscovery = async () => {
    try {
      setIsNetworkDiscoveryLoading(true)
      setScanErrorMessage("")

      // Use target input as network range if provided, otherwise auto-detect
      const networkRange = targetInput.trim() || undefined

      const response = await startNetworkDiscovery(networkRange)

      setNetworkDiscoveryData(response.data)

      // Play scan completion sound
      try {
        const audio = new Audio('/scan-complete.wav')
        await audio.play()
      } catch (audioError) {
        // Silently ignore audio errors
      }

    } catch (error) {
      setScanErrorMessage(`Network discovery failed: ${error instanceof Error ? error.message : 'Unknown error'}`)
      setTimeout(() => setScanErrorMessage(""), 5000)
    } finally {
      setIsNetworkDiscoveryLoading(false)
    }
  }

  // Port Discovery handler
  const handlePortDiscovery = async () => {
    if (!targetInput.trim() || !selectedPort.trim()) {
      setScanErrorMessage("Please enter both target IP and port number")
      return
    }

    const port = parseInt(selectedPort.trim())
    if (isNaN(port) || port < 1 || port > 65535) {
      setScanErrorMessage("Please enter a valid port number (1-65535)")
      return
    }

    try {
      setIsPortDiscoveryLoading(true)
      setScanErrorMessage("")
      setPortDiscoveryData(null)
      setPortDiscoveryAnalysis(null)

      const response = await startPortDiscovery(targetInput.trim(), port)
      setPortDiscoveryData(response.data)
      setPortDiscoveryAnalysis(response.json_result)

      // Play scan completion sound
      try {
        const audio = new Audio('/scan-complete.wav')
        await audio.play()
      } catch (audioError) {
        // Silently ignore audio errors
      }

    } catch (error) {
      setScanErrorMessage(`Port discovery failed: ${error instanceof Error ? error.message : 'Unknown error'}`)
      setTimeout(() => setScanErrorMessage(""), 5000)
    } finally {
      setIsPortDiscoveryLoading(false)
    }
  }

  // Wrapper function that checks IP first, then launches scan
  const handleScanButtonClick = async (scanType: string) => {
    console.log(`🚀 [SCAN BUTTON] ${scanType.toUpperCase()} scan button clicked`)

    // Special handling for network discovery
    if (selectedScanMode === 'network-discovery') {
      await handleNetworkDiscovery()
      return
    }

    // Special handling for port discovery
    if (selectedScanMode === 'specific-port') {
      await handlePortDiscovery()
      return
    }

    if (!targetInput.trim()) {
      console.log(`🚀 [SCAN BUTTON] No target input, showing alert`)
      alert("Please enter a target IP address or network range")
      return
    }

    // Validate IP before proceeding
    const validation = validateIPInput(targetInput)
    if (!validation.isValid) {
      console.log(`🚀 [SCAN BUTTON] IP validation failed: ${validation.message}`)
      setIpValidationError(validation.message)
      setScanErrorMessage("Cannot start scan: " + validation.message)
      setTimeout(() => setScanErrorMessage(""), 5000)
      return
    }

    // Check if a scan is already running
    if (isScanning) {
      console.log(`🚀 [SCAN BUTTON] Scan already running, showing error`)
      setScanErrorMessage("A scan is already in progress. Please wait for it to complete before starting a new scan.")
      setTimeout(() => setScanErrorMessage(""), 4000)
      return
    }

    console.log(`🚀 [SCAN BUTTON] Starting Phase 1: IP reachability check for ${targetInput}`)

    // Phase 1: Check IP reachability
    const isReachable = await checkIPReachability(targetInput)

    console.log(`🚀 [SCAN BUTTON] Phase 1 complete. IP reachable: ${isReachable}`)

    if (!isReachable) {
      // IP is not reachable, error message already handled in checkIPReachability
      console.log(`🚀 [SCAN BUTTON] IP not reachable, error message already showing`)
      return
    }

    console.log(`🚀 [SCAN BUTTON] Starting Phase 2: Launch ${scanType} scan`)
    // Phase 2: IP is reachable, proceed with scan
    handleScanLaunch(scanType)
  }

  const handleScanLaunch = async (scanType: string) => {
    console.log(`🔵 [SCAN LAUNCH] Phase 2 started: handleScanLaunch(${scanType})`)

    // Clean up all old scan data before starting new scan
    Object.keys(localStorage).forEach(key => {
      if (key.includes('scan_progress_') || key.includes('scan_start_') || key.includes('scan_state_') || key.includes('xploiteye_v1_')) {
        localStorage.removeItem(key)
        console.log(`🧹 [CLEANUP] Removed old localStorage key: ${key}`)
      }
    })

    // Check for existing active scans to prevent conflicts
    const existingState = localStorage.getItem(CURRENT_SCAN_KEY)
    if (existingState) {
      try {
        const state = JSON.parse(existingState)
        if (state.isScanning && state.currentScanId) {
          console.log(`🚫 [SCAN LAUNCH] Active scan detected: ${state.currentScanId}`)
          setScanErrorMessage("An active scan is already running. Please wait for it to complete.")
          setTimeout(() => setScanErrorMessage(""), 5000)
          return
        } else if (state.scanStatus === 'completed' || state.scanProgress >= 100) {
          // Clear completed scan data before starting new scan
          console.log(`🧹 [SCAN LAUNCH] Clearing completed scan data before starting new scan`)
          clearAllScanData()
          // Reset component state to ensure clean start
          setScanProgress(0)
          setScanStatus('idle')
          setIsScanning(false)
          setCurrentScanId(null)
          setActiveScan(null)
          setHasActiveScan(false)
        }
      } catch (error) {
        // Clear corrupted state
        localStorage.removeItem(CURRENT_SCAN_KEY)
      }
    }

    // Stop any existing polling to prevent conflicts
    if (isPolling) {
      console.log(`🛑 [SCAN LAUNCH] Stopping existing polling before new scan`)
      setIsPolling(false)
    }

    // Stop progress animation if running
    stopProgressAnimation()

    console.log(`🔵 [SCAN LAUNCH] Starting ${scanType.toUpperCase()} scan - Complete state reset`)
    console.log(`🔵 [SCAN LAUNCH] PRE-RESET STATE:`, {
      currentScanType,
      actualPortsScanned,
      actualServicesFound,
      actualVulnerabilitiesFound,
      actualOpenPortsFound,
      portLimit: getPortLimit(currentScanType || 'light')
    })

    // Complete state reset for new scan
    clearTerminal()
    setScanStatus('scanning')
    setScanProgress(0)
    setScanMessage(`XploitEye ${scanType} scan is in progress...`)
    setIsScanning(true)
    setCurrentScanType(scanType)
    setScanErrorMessage("")
    setFoundCVEs([])
    setHasActiveScan(true)
    setActualPortsScanned(0)
    setActualServicesFound(0)
    setActualVulnerabilitiesFound(0)
    setActualOpenPortsFound(0)
    setScanSummary(null)
    setActiveScan(null)
    setScanGeneration(prev => prev + 1)

    console.log(`🔵 [SCAN LAUNCH] State reset complete, isScanning=true, blue overlay should appear`)

    // Start realistic progress animation
    startProgressAnimation(scanType)

    // Clear old CVE data and scan statistics immediately
    setFoundCVEs([])
    setHasActiveScan(true)
    setActualPortsScanned(0)
    setActualServicesFound(0)
    setActualVulnerabilitiesFound(0)
    setActualOpenPortsFound(0)
    setScanSummary(null)
    setActiveScan(null) // Clear previous scan data
    setScanGeneration(prev => prev + 1) // Force component refresh

    // Don't clear localStorage here - we'll save new state after scan starts

    console.log(`✅ State reset complete for ${scanType} scan on ${targetInput}`)
    console.log(`📊 POST-RESET STATE:`, {
      newScanType: scanType,
      portsScanned: 0,
      servicesFound: 0,
      vulnerabilitiesFound: 0,
      openPortsFound: 0,
      newPortLimit: getPortLimit(scanType)
    })

    // Auto-scroll to live scan progress section
    scrollToLiveProgress()

    addTerminalLine('info', `🎯 Launching ${scanType.toUpperCase()} scan on ${targetInput}`)
    console.log(`Launching ${scanType} scan on ${targetInput}`)

    try {
      const token = localStorage.getItem('access_token')
      const response = await fetch('http://localhost:8000/scanning/start', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          scan_type: scanType,
          target: targetInput
        })
      })

      if (response.ok) {
        const scanData = await response.json()
        console.log('Scan started:', scanData)
        setCurrentScanId(scanData.scan_id)

        // Store scan start time for time-based progress calculation
        const scanStartTime = Date.now()
        localStorage.setItem(`scan_start_${scanData.scan_id}`, scanStartTime.toString())
        console.log(`⏰ [TIMING] Scan start time saved for ${scanData.scan_id}: ${new Date(scanStartTime).toISOString()}`)

        // Add the new scan to active scans and start monitoring
        // Set active scan with completely fresh data
        const newActiveScan = {
          id: scanData.scan_id,
          target: scanData.target,
          type: `${scanType.charAt(0).toUpperCase() + scanType.slice(1)} Scan`,
          scanType: scanData.scan_type,
          status: 'running',
          startTime: new Date(scanData.started_at).toLocaleString(),
          duration: '0m 0s',
          progress: 0,
          vulnerabilities: { critical: 0, high: 0, medium: 0, low: 0 },
          exploitPaths: 0,
          remediationTasks: 0,
        }

        setActiveScan(newActiveScan)
        console.log('🎯 Set new active scan:', newActiveScan)

        // Save NEW scan state directly to localStorage
        const newScanState = {
          currentScanId: scanData.scan_id,
          isScanning: true,
          targetInput: targetInput,
          scanProgress: 0,
          scanStatus: 'scanning',
          scanMessage: `XploitEye ${scanType} scan is in progress...`,
          currentScanType: scanType,
          activeScan: newActiveScan,
          hasActiveScan: true,
          timestamp: Date.now()
        }
        // State will be saved by saveScanState call below

        // Start global progress animation that runs across all pages
        globalProgressManager.startGlobalProgress(scanData.scan_id, scanType)

        // Save scan state to localStorage immediately with correct scan ID
        const state = {
          currentScanId: scanData.scan_id,  // Use the new scan ID directly
          isScanning,
          targetInput,
          scanProgress,
          scanStatus,
          scanMessage,
          currentScanType,
          hasActiveScan,
          activeScan,
          actualPortsScanned,
          actualServicesFound,
          actualVulnerabilitiesFound,
          actualOpenPortsFound,
          timestamp: Date.now()
        }
        localStorage.setItem(CURRENT_SCAN_KEY, JSON.stringify(state))
        console.log(`💾 [SCAN START] Saved scan state with ID ${scanData.scan_id}`)

        // Start polling for scan status
        console.log(`🚀 [SCAN START] About to start polling for scan ${scanData.scan_id}`)
        pollScanStatus(scanData.scan_id)
      } else {
        const error = await response.json()
        addTerminalLine('error', `❌ Failed to start scan: ${error.detail}`)
        alert(`Failed to start scan: ${error.detail}`)
        // Only set isScanning to false on failure
        setIsScanning(false)
      }
    } catch (error) {
      console.error('Error starting scan:', error)
      addTerminalLine('error', '❌ Failed to start scan. Please check your connection.')
      alert('Failed to start scan. Please check your connection.')
      // Only set isScanning to false on error
      setIsScanning(false)
    }
  }

  const pollScanStatus = async (scanId: string) => {
    console.log(`🚀 [POLLING] Starting pollScanStatus for scan ${scanId}`)

    // Enhanced conflict prevention
    if (isPolling) {
      console.log(`🚫 [POLLING] Already active for scan ${scanId}, skipping duplicate`)
      return
    }

    // Validate scan ownership and freshness
    const stored = localStorage.getItem(CURRENT_SCAN_KEY)
    if (!stored) {
      console.log(`🚫 [POLLING] No scan state found, aborting`)
      return
    }
    const currentState = JSON.parse(stored)
    if (!currentState || currentState.currentScanId !== scanId) {
      console.log(`🚫 [POLLING] Scan ${scanId} not in current state, aborting`)
      return
    }

    setIsPolling(true)
    const token = localStorage.getItem('access_token')
    let shouldContinuePolling = true
    let pollCount = 0

    console.log(`🔄 [POLLING] Started monitoring scan ${scanId}`)

    // Enhanced stop polling with cleanup
    const stopPolling = (reason: string = 'manual') => {
      shouldContinuePolling = false
      setIsPolling(false)
      console.log(`🛑 [POLLING] Stopped for scan ${scanId}: ${reason}`)

      // Stop global progress when polling stops
      globalProgressManager.stopGlobalProgress()
    }

    const poll = async () => {
      pollCount++

      // Stop polling if flag is false
      if (!shouldContinuePolling) {
        setIsPolling(false)
        return
      }

      // Validate we should still be polling this scan
      const stored = localStorage.getItem(CURRENT_SCAN_KEY)
      if (!stored) {
        console.log(`🚫 [POLLING] No scan state found, stopping`)
        stopPolling('scan_changed')
        return
      }
      const currentState = JSON.parse(stored)
      if (!currentState || currentState.currentScanId !== scanId) {
        console.log(`🚫 [POLLING] Scan ${scanId} no longer current (poll #${pollCount}), stopping`)
        stopPolling('scan_changed')
        return
      }

      // Safety check: stop polling after too many attempts
      if (pollCount > 1440) { // 2 hours at 5-second intervals
        console.log(`⏰ [POLLING] Max polling attempts reached for scan ${scanId}`)
        stopPolling('timeout')
        return
      }

      try {
        console.log(`📡 [POLLING] Making API call for scan ${scanId}`)
        const response = await fetch(`http://localhost:8000/scanning/status/${scanId}`, {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        })

        console.log(`📡 [POLLING] API response status: ${response.status}`)

        if (response.ok) {
          const scanData = await response.json()
          console.log(`📡 [POLLING] Received scan data:`, scanData)

          // Note: Don't save full state during polling to avoid overwriting UI state
          // Only update progress-related fields if needed
          // saveScanState(scanData) // REMOVED to fix localStorage inconsistency

          // Update real-time progress if available
          if (scanData.progress !== undefined) {
            setScanProgress(scanData.progress)
          }

          // Extract data from scan results FIRST (outside of state updates)
          let vulnerabilities = { critical: 0, high: 0, medium: 0, low: 0 }
          let openPorts: any[] = []
          let services: any[] = []
          let summaryData: any = null

          if (scanData.results) {
            // Extract vulnerabilities from actual structure
            if (scanData.results.vulnerabilities) {
              const vulns = scanData.results.vulnerabilities
              vulnerabilities = {
                critical: vulns.filter((v: any) => v.severity === 'critical').length,
                high: vulns.filter((v: any) => v.severity === 'high').length,
                medium: vulns.filter((v: any) => v.severity === 'medium').length,
                low: vulns.filter((v: any) => v.severity === 'low').length,
              }
            }

            // Extract services from actual structure
            if (scanData.results.services) {
              services = scanData.results.services
              // Create openPorts array from services for backwards compatibility
              openPorts = services.map((service: any) => service.port)
            }

            // Extract summary data
            if (scanData.results.summary) {
              summaryData = scanData.results.summary
            }
          }

          // Update state with extracted data IMMEDIATELY from ANY available JSON data
          console.log('🔍 DEBUGGING: JSON Data Available:', {
            hasSummary: !!summaryData,
            hasServices: services.length > 0,
            hasVulnerabilities: Object.values(vulnerabilities).some(v => v > 0),
            servicesCount: services.length,
            vulnerabilitiesTotal: vulnerabilities.critical + vulnerabilities.high + vulnerabilities.medium + vulnerabilities.low
          })

          // SIMPLE: Always update stats from JSON data when available
          if (summaryData || services.length > 0 || Object.values(vulnerabilities).some(v => v > 0)) {
            // Calculate statistics from available JSON data
            const calculatedPortsScanned = summaryData?.ports_scanned || services.length || 0
            const calculatedServicesFound = services.length || summaryData?.open_ports || 0
            const calculatedVulnerabilitiesFound = vulnerabilities.critical + vulnerabilities.high + vulnerabilities.medium + vulnerabilities.low
            const calculatedOpenPorts = openPorts.length || summaryData?.open_ports || 0

            console.log(`📊 SIMPLE UPDATE - JSON data found, updating stats:`, {
              portsScanned: calculatedPortsScanned,
              servicesFound: calculatedServicesFound,
              vulnerabilities: calculatedVulnerabilitiesFound,
              openPorts: calculatedOpenPorts,
              scanId: scanId,
              currentScanId: currentScanId
            })

            // JUMP PROGRESS TO 100% IMMEDIATELY when scan results are available
            console.log(`🚀 [PROGRESS] Scan results available - jumping progress to 100%`)
            stopProgressAnimation()
            setScanProgress(100)

            // Update localStorage with 100% progress
            const stored = localStorage.getItem(CURRENT_SCAN_KEY)
            if (stored) {
              try {
                const state = JSON.parse(stored)
                state.scanProgress = 100
                localStorage.setItem(CURRENT_SCAN_KEY, JSON.stringify(state))
                console.log(`💾 [STORAGE] Updated localStorage progress to 100%`)
              } catch (error) {
                console.error('Error updating localStorage progress:', error)
              }
            }

            // Update global progress storage
            const globalData = JSON.parse(localStorage.getItem(GLOBAL_PROGRESS_KEY) || '{}')
            if (globalData.scanId === scanId) {
              globalData.currentProgress = 100
              localStorage.setItem(GLOBAL_PROGRESS_KEY, JSON.stringify(globalData))
              console.log(`🌐 [GLOBAL] Updated global progress to 100%`)
            }

            // Update statistics immediately from JSON data - no complex conditions
            setActualPortsScanned(calculatedPortsScanned)
            setActualServicesFound(calculatedServicesFound)
            setActualVulnerabilitiesFound(calculatedVulnerabilitiesFound)
            setActualOpenPortsFound(calculatedOpenPorts)

            // DISPLAY CVE DATA IMMEDIATELY when scan results are available
            if (scanData.results && scanData.results.vulnerabilities && scanData.results.vulnerabilities.length > 0) {
              addTerminalLine('info', `🔍 Processing ${scanData.results.vulnerabilities.length} vulnerabilities...`)
              console.log('Vulnerabilities to display immediately:', scanData.results.vulnerabilities)

              // Convert scan results to CVE format and display immediately
              const cveData = scanData.results.vulnerabilities.map((vuln: any, index: number) => ({
                id: vuln.cve_id || `VULN-${index + 1}`,
                cve_id: vuln.cve_id || `VULN-${index + 1}`,
                title: vuln.title || vuln.name || 'Vulnerability',
                description: vuln.description || 'No description available',
                severity: vuln.severity || 'unknown',
                cvss_score: vuln.cvss_score || 0,
                references: vuln.references || [],
                affected_service: vuln.service || vuln.port || 'Unknown',
                remediation: vuln.remediation || 'No remediation available'
              }))

              // Display CVEs immediately at the same time as progress reaches 100%
              setFoundCVEs(cveData)
              setHasActiveScan(false) // Clear active scan flag
              addTerminalLine('success', `✅ Displayed ${cveData.length} vulnerabilities immediately`)

              // Store CVEs to database in background (non-blocking) - no delay needed
              storeCVEsFromScan(scanId, scanData.results.vulnerabilities)
            } else if (scanData.results) {
              // Clear hasActiveScan flag and show empty state when results are available but no vulnerabilities
              setHasActiveScan(false)
              setFoundCVEs([])
              addTerminalLine('info', '📊 No vulnerabilities found in scan')
            }

            console.log(`✅ SIMPLE UPDATE COMPLETE: ${calculatedPortsScanned} ports, ${calculatedServicesFound} services, ${calculatedVulnerabilitiesFound} vulnerabilities`)
          } else {
            console.log(`ℹ️ No JSON data to update - waiting for scan results`)
          }

          // Store detailed summary data if available
          if (summaryData) {

            // Store additional summary data for detailed display
            setScanSummary({
              target: summaryData.target,
              scan_type: summaryData.scan_type,
              scan_duration: summaryData.scan_duration,
              ports_scanned: summaryData.ports_scanned,
              open_ports: summaryData.open_ports,
              critical_ports: summaryData.critical_ports,
              vulnerable_ports: summaryData.vulnerable_ports,
              cves_found: summaryData.cves_found,
              risk_score: summaryData.risk_score,
              risk_level: summaryData.risk_level
            })

            console.log(`✅ Updated scan data: ${summaryData.ports_scanned} ports, ${services.length} services, ${vulnerabilities.critical + vulnerabilities.high + vulnerabilities.medium + vulnerabilities.low} vulnerabilities`)
          } else {
            console.log('❌ DEBUGGING: No summary data found in scan results')
            console.log('❌ DEBUGGING: Full scan results:', scanData.results)
          }

          // Update active scan with basic scan info (separate from data state)
          setActiveScan((prev: any) => {
            if (prev && prev.id === scanId) {
              const startTime = new Date(scanData.started_at)
              const currentTime = new Date()
              const durationMs = currentTime.getTime() - startTime.getTime()
              const minutes = Math.floor(durationMs / 60000)
              const seconds = Math.floor((durationMs % 60000) / 1000)
              const duration = `${minutes}m ${seconds}s`

              // Note: State is already saved at the beginning of poll function

              // Handle scan completion
              if (scanData.status === 'completed') {
                console.log(`✅ [BACKEND] Scan completion detected - forcing progress to 100%`)

                // FORCE IMMEDIATE COMPLETION - Stop any progress animation
                stopProgressAnimation()

                // Global progress will be stopped by stopPolling() function

                // IMMEDIATE jump to 100% regardless of current progress
                setScanProgress(100)
                setScanStatus('completed')
                setScanMessage('Scan completed! Results are ready.')

                // Scan completed

                // Progress completed

                console.log(`🎯 [BACKEND] Progress forced to 100% due to backend completion status and synced to all tabs`)

                // Show PDF generation notification immediately
                showPdfGenerationNotification()

                // Auto-reset to idle state after 3 seconds to allow new scans
                setTimeout(() => {
                  console.log("🧹 [AUTO-RESET] Automatically resetting completed scan to idle state")

                  // Clear localStorage
                  localStorage.removeItem(CURRENT_SCAN_KEY)
                  localStorage.removeItem(GLOBAL_PROGRESS_KEY)

                  // Reset component state
                  setScanProgress(0)
                  setScanStatus('idle')
                  setIsScanning(false)
                  setCurrentScanId(null)
                  setActiveScan(null)
                  setHasActiveScan(false)
                  setScanMessage('')
                  setCurrentScanType(null)

                  console.log("✅ [AUTO-RESET] Scan state reset to idle - ready for new scans")
                }, 3000)

                // Play completion sound notification
                try {
                  const audio = new Audio('/scan-complete.wav'); 
                  audio.volume = 0.3
                  audio.play().catch(e => console.log('Audio play failed:', e))
                } catch (e) {
                  console.log('Audio creation failed:', e)
                }

                // Add terminal output for completion
                addTerminalLine('success', '🔊 Scan completed successfully!')

                // Display real scan results in terminal
                if (openPorts.length > 0) {
                  addTerminalLine('scan', `📡 Found ${openPorts.length} open ports`)
                  openPorts.slice(0, 5).forEach((port: any) => {
                    addTerminalLine('scan', `  └─ Port ${port}/tcp open`)
                  })
                }

                if (services.length > 0) {
                  addTerminalLine('scan', `🎯 Identified ${services.length} services`)
                  services.slice(0, 3).forEach((service: any) => {
                    addTerminalLine('scan', `  └─ ${service.service}${service.version ? ` ${service.version}` : ''} on port ${service.port}`)
                  })
                }

                const totalVulns = vulnerabilities.critical + vulnerabilities.high + vulnerabilities.medium + vulnerabilities.low
                if (totalVulns > 0) {
                  addTerminalLine('warning', `🚨 Found ${totalVulns} vulnerabilities:`)
                  if (vulnerabilities.critical > 0) addTerminalLine('error', `  └─ ${vulnerabilities.critical} Critical`)
                  if (vulnerabilities.high > 0) addTerminalLine('warning', `  └─ ${vulnerabilities.high} High`)
                  if (vulnerabilities.medium > 0) addTerminalLine('warning', `  └─ ${vulnerabilities.medium} Medium`)
                  if (vulnerabilities.low > 0) addTerminalLine('info', `  └─ ${vulnerabilities.low} Low`)
                } else {
                  addTerminalLine('success', '✅ No critical vulnerabilities detected')
                }

                // CVE display has already been handled earlier when results became available
                // This ensures consistent timing between progress bar and data display
                console.log('✅ CVE display already handled - maintaining consistency')

                // PDF report will be generated automatically in background and emailed
                addTerminalLine('info', '📄 PDF report will be generated automatically and emailed to you...')
              }

              return {
                ...prev,
                status: scanData.status,
                duration,
                vulnerabilities,
                openPorts,
                services,
                scanResults: scanData.results,  // This will contain the JSON data
                completedAt: scanData.completed_at
              }
            }
            return prev
          })

          // Continue polling if scan is still running
          if (scanData.status === 'running' || scanData.status === 'pending') {
            setTimeout(poll, 5000) // Poll every 5 seconds
          } else if (scanData.status === 'completed') {
            // Scan completed - STOP polling after processing final data
            console.log(`✅ [BACKEND] Scan ${scanId} completion detected - stopping polling`)
            stopPolling() // Stop any further polling

            // Progress and data display already handled when results became available
            console.log(`🎯 [BACKEND] Progress and data display already handled consistently`)

            // Play completion sound notification
            try {
              const audio = new Audio('/scan-complete.wav'); 
              audio.volume = 0.3
              audio.play().catch(e => console.log('Audio play failed:', e))
            } catch (e) {
              console.log('Audio creation failed:', e)
            }

            // Update activeScan with final results before resetting state
            setActiveScan((prev: any) => {
              if (prev && prev.id === scanId) {
                return {
                  ...prev,
                  status: 'completed',
                  scanResults: scanData.results,  // Add the JSON results here
                  completedAt: scanData.completed_at
                }
              }
              return prev
            })

            // Reset scanning state but preserve results for display
            console.log(`✅ [COMPLETED] Scan ${scanId} finished - results saved for display`)
            setIsScanning(false)
            setHasActiveScan(false)
            setIsPolling(false)

            // Update state and save
            setScanStatus('completed')
            saveScanState()

            // Refresh scan history
            loadScanHistory()

            // Show PDF generation notification immediately
            showPdfGenerationNotification()

            // Auto-reset to idle state after 3 seconds to allow new scans
            setTimeout(() => {
              console.log("🧹 [AUTO-RESET] Automatically resetting completed scan to idle state")

              // Clear localStorage
              localStorage.removeItem(CURRENT_SCAN_KEY)
              localStorage.removeItem(GLOBAL_PROGRESS_KEY)

              // Reset component state
              setScanProgress(0)
              setScanStatus('idle')
              setIsScanning(false)
              setCurrentScanId(null)
              setActiveScan(null)
              setHasActiveScan(false)
              setScanMessage('')
              setCurrentScanType(null)

              console.log("✅ [AUTO-RESET] Scan state reset to idle - ready for new scans")
            }, 3000)
          } else if (scanData.status === 'completed_file_missing') {
            // Scan completed but files are missing - stop polling
            console.log(`⚠️ Scan ${scanId} completed with missing files - stopping polling`)
            stopPolling() // Stop any further polling
            addTerminalLine('warning', '⚠️ Scan completed but result files are missing')
            setIsScanning(false)
            setActiveScan(null)
            setHasActiveScan(false)
            setIsPolling(false)
            clearScanState()
          } else if (scanData.status === 'failed' || scanData.status === 'cancelled') {
            // Scan failed or cancelled - stop polling
            console.log(`❌ Scan ${scanId} ${scanData.status} - stopping polling`)
            stopPolling() // Stop any further polling

            // Stop progress animation
            stopProgressAnimation()
            setScanProgress(0)

            setIsScanning(false)
            setActiveScan(null)
            setHasActiveScan(false)
            setIsPolling(false)
            clearScanState()
          }
        } else {
          console.error(`❌ [POLLING] API request failed with status ${response.status}`)
          const errorText = await response.text().catch(() => 'Unknown error')
          console.error(`❌ [POLLING] Error response: ${errorText}`)

          // Handle case where scan is not found (maybe completed while away)
          console.log('⚠️ Scan not found, it may have completed while away')
          addTerminalLine('warning', '⚠️ Scan status not found - it may have completed')

          // Stop progress animation and clear state
          stopProgressAnimation()
          setScanProgress(0)

          // Clear localStorage and reset state
          clearScanState()
          setIsScanning(false)
          setActiveScan(null)
          setScanStatus('idle')
          setHasActiveScan(false)
          setIsPolling(false)

          // Load CVEs to show any completed results
          loadCVEs(targetInput)
        }
      } catch (error) {
        console.error(`❌ [POLLING] Error fetching scan status for ${scanId}:`, error)
        console.log('🔄 Continuing polling after error...')
        setTimeout(poll, 5000) // Continue polling
      }
    }

    poll()
  }

  const loadScanHistory = async () => {
    // Don't load scan history for completely fresh experience
    console.log('🔄 Skipping scan history load for fresh start')
  }

  // Store CVEs from scan results
  const storeCVEsFromScan = async (scanId: string, vulnerabilities: any[]) => {
    try {
      const token = localStorage.getItem('access_token')
      const response = await fetch('http://localhost:8000/scanning/store-cves', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          scan_id: scanId,
          target: targetInput,
          vulnerabilities: vulnerabilities
        })
      })

      if (response.ok) {
        const result = await response.json()
        console.log(`Stored ${result.stored_count || vulnerabilities.length} CVEs from scan`)
        addTerminalLine('success', `✅ Stored ${result.stored_count || vulnerabilities.length} CVEs in database`)
      } else {
        const error = await response.json()
        console.error('Failed to store CVEs:', error)
        addTerminalLine('warning', '⚠️ Failed to store some CVEs')
      }
    } catch (error) {
      console.error('Error storing CVEs:', error)
      addTerminalLine('error', '❌ Error storing CVEs')
    }
  }

  // Load CVEs for current target
  const loadCVEs = async (target?: string) => {
    // Don't load CVEs if we have an active scan running
    if (hasActiveScan) {
      console.log("🚫 Skipping CVE load - active scan in progress")
      return
    }

    setLoadingCVEs(true)
    try {
      const cves = await cveApi.getUserCVEs(target)
      setFoundCVEs(cves)
      console.log(`Loaded ${cves.length} CVEs for target: ${target || 'all'}`)
    } catch (error) {
      console.error('Error loading CVEs:', error)
    } finally {
      setLoadingCVEs(false)
    }
  }


  // Initialize CVE API and component state
  useEffect(() => {
    // IMMEDIATE CLEANUP: Check for completed scans and clear them first
    const immediateCheck = localStorage.getItem(CURRENT_SCAN_KEY)
    if (immediateCheck) {
      try {
        const state = JSON.parse(immediateCheck)
        if (state.scanStatus === 'completed' || state.scanProgress >= 100) {
          console.log("🚨 [IMMEDIATE CLEANUP] Found completed scan on mount - clearing immediately")

          // Clear localStorage completely
          localStorage.removeItem(CURRENT_SCAN_KEY)
          localStorage.removeItem(GLOBAL_PROGRESS_KEY)

          // Reset ALL component state immediately
          setScanProgress(0)
          setScanStatus('idle')
          setIsScanning(false)
          setCurrentScanId(null)
          setActiveScan(null)
          setHasActiveScan(false)
          setActualPortsScanned(0)
          setActualServicesFound(0)
          setActualVulnerabilitiesFound(0)
          setActualOpenPortsFound(0)
          setScanMessage('')
          setCurrentScanType(null)

          console.log("✅ [IMMEDIATE CLEANUP] Completed scan cleared - UI reset to idle state")

          // Don't continue with other logic if we just cleared everything
          return
        }
      } catch (error) {
        console.log("🧹 [IMMEDIATE CLEANUP] Clearing corrupted scan data")
        localStorage.removeItem(CURRENT_SCAN_KEY)
        localStorage.removeItem(GLOBAL_PROGRESS_KEY)
        return
      }
    }

    // Initialize CVE API with AuthContext
    if (apiCall) {
      cveApi.setApiCall(apiCall)
      console.log("✅ CVE API initialized with AuthContext")
    }

    // Clean up only old/stale scan data, preserve active scans
    const currentScanState = localStorage.getItem(CURRENT_SCAN_KEY)
    let activeScanId = null

    if (currentScanState) {
      try {
        const state = JSON.parse(currentScanState)
        // Only preserve if scan is actually active (scanning status)
        if (state.isScanning && state.scanStatus === 'scanning') {
          activeScanId = state.currentScanId
          console.log(`🔄 [NAVIGATION] Preserving active scan: ${activeScanId}`)
        }
      } catch (e) {
        console.log('Failed to parse scan state')
      }
    }

    // Clean up scan data, but preserve active scan
    Object.keys(localStorage).forEach(key => {
      if (!key.includes('token') && !key.includes('user_id') && !key.includes('auth') &&
          (key.includes('scan_') || key.includes('xploiteye') || key.includes('progress_'))) {

        // Don't remove the current active scan data
        if (key === CURRENT_SCAN_KEY && activeScanId) {
          console.log(`🔄 [NAVIGATION] Preserving current scan state for ${activeScanId}`)
          return
        }

        // Don't remove active scan timing data
        if (activeScanId && key.includes(activeScanId)) {
          console.log(`🔄 [NAVIGATION] Preserving active scan data: ${key}`)
          return
        }

        // Check global progress data - remove if completed or inactive
        if (key === GLOBAL_PROGRESS_KEY) {
          try {
            const globalData = JSON.parse(localStorage.getItem(key) || '{}')
            if (!globalData.isActive || globalData.currentProgress >= 100) {
              console.log(`🧹 [CLEANUP] Removing completed/inactive global progress data`)
              localStorage.removeItem(key)
              return
            }
            console.log(`🔄 [NAVIGATION] Preserving active global progress data`)
            return
          } catch (error) {
            console.log(`🧹 [CLEANUP] Removing corrupted global progress data`)
            localStorage.removeItem(key)
            return
          }
        }

        localStorage.removeItem(key)
        console.log(`🧹 [CLEANUP] Removed old scan data: ${key}`)
      }
    })
    console.log(`🧹 [CLEANUP] Selective cleanup completed`)

    // Check for completed scans and clear them
    const stored = localStorage.getItem(CURRENT_SCAN_KEY)
    if (stored) {
      const storedState = JSON.parse(stored)
      if (storedState && (storedState.scanStatus === 'completed' || storedState.scanProgress >= 100)) {
        console.log("🧹 [INIT] Found completed scan, clearing old data")
        clearAllScanData()

        // Set clean state
        setTargetInput("")
        setIsValidIP(false)
        setIpValidationError("")
        setScanProgress(0)
        setScanStatus('idle')
        setIsScanning(false)
        setCurrentScanId(null)

        console.log("✅ [INIT] Cleared completed scan data, starting fresh")
        return // Don't restore anything
      }
    }

    // Also check for stale global progress data independently
    const globalData = localStorage.getItem(GLOBAL_PROGRESS_KEY)
    if (globalData) {
      try {
        const parsedGlobalData = JSON.parse(globalData)
        if (!parsedGlobalData.isActive || parsedGlobalData.currentProgress >= 100) {
          console.log("🧹 [INIT] Found stale global progress data, removing")
          localStorage.removeItem(GLOBAL_PROGRESS_KEY)
        }
      } catch (error) {
        console.log("🧹 [INIT] Found corrupted global progress data, removing")
        localStorage.removeItem(GLOBAL_PROGRESS_KEY)
      }
    }

    // Try to restore scan state for navigation persistence
    const restored = loadScanStateFromStorage()

    if (restored) {
      console.log("✅ [INIT] Active scan state restored after navigation")
    } else {
      console.log("🔄 [INIT] No active scan found to restore")
    }
  }, [apiCall])

  // Global progress listener - updates UI from global progress
  useEffect(() => {
    if (!currentScanId || !isScanning) return

    const progressListener = setInterval(() => {
      const globalProgress = globalProgressManager.getCurrentProgress(currentScanId)
      if (globalProgress > 0) {
        setScanProgress(globalProgress)
      }
    }, 500) // Check every 500ms

    return () => clearInterval(progressListener)
  }, [currentScanId, isScanning])

  // Cleanup progress animation on component unmount
  useEffect(() => {
    return () => {
      if (progressInterval) {
        clearInterval(progressInterval)
      }
    }
  }, [progressInterval])

  // Enhanced cleanup on component unmount
  useEffect(() => {
    return () => {
      // Stop any active polling
      if (isPolling) {
        setIsPolling(false)
        console.log("🛑 [CLEANUP] Stopped polling on component unmount")
      }

      // Clear progress animation
      stopProgressAnimation()

      // Save current state before unmount (for navigation)
      if (currentScanId && isScanning) {
        saveScanState()
        console.log("💾 [CLEANUP] Saved state before unmount")
      }
    }
  }, [])

  // Expose cleanup function for logout (can be called by auth context)
  const handleUserLogout = () => {
    console.log("🚪 [LOGOUT] Cleaning up user scan data")

    // Stop all active operations
    setIsPolling(false)
    stopProgressAnimation()

    // Clear all user data from localStorage
    clearAllScanData()

    // Reset ALL component state including IP input
    setIsScanning(false)
    setCurrentScanId(null)
    setTargetInput("") // Clear the IP input
    setScanProgress(0)
    setScanStatus('idle')
    setScanMessage("")
    setFoundCVEs([])
    setHasActiveScan(false)
    setIsValidIP(false) // Reset IP validation
    setIpValidationError("") // Clear validation errors
    setIsCheckingIP(false)
    setIpCheckMessage("")

    console.log("✅ [LOGOUT] User scan data cleanup completed")
  }

  // Make cleanup function available globally for auth context
  useEffect(() => {
    (window as any).cleanupScanningModule = handleUserLogout
    return () => {
      delete (window as any).cleanupScanningModule
    }
  }, [])

  return (
    <div className="space-y-8 relative min-h-screen">

      {/* PDF Generation Notification Slider */}
      <AnimatePresence>
        {showPdfNotification && (
          <motion.div
            initial={{ x: 400, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: 400, opacity: 0 }}
            transition={{
              type: "spring",
              stiffness: 300,
              damping: 30,
              duration: 0.5
            }}
            className="fixed top-20 right-6 z-50 max-w-sm"
          >
            <div className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white p-4 rounded-lg shadow-2xl border border-blue-500/30">
              <div className="flex items-start space-x-3">
                <div className="flex-shrink-0">
                  <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-white">
                    📄 PDF report generating in background
                  </p>
                  <p className="text-xs text-blue-100 mt-1">
                    Check Reports section or your email
                  </p>
                </div>
                <button
                  onClick={() => setShowPdfNotification(false)}
                  className="flex-shrink-0 ml-2 text-blue-200 hover:text-white transition-colors"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <div
        id="scan-start"
        className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-gray-900/50 to-black/30 p-8 border border-green-500/20"
      >
        <motion.div
          animate={{
            backgroundPosition: ["0% 0%", "100% 100%"],
          }}
          transition={{
            duration: 20,
            repeat: Number.POSITIVE_INFINITY,
            repeatType: "reverse",
          }}
          className="absolute inset-0 opacity-20 bg-gradient-to-br from-green-500/10 via-cyan-500/10 to-green-500/10"
          style={{
            backgroundSize: "400% 400%",
          }}
        />

        <div className="relative z-10 space-y-8">
          <div className={`bg-gradient-to-br from-gray-800/50 to-gray-900/30 rounded-xl p-8 border transition-all duration-300 relative ${
            isScanning
              ? "border-gray-600/30 opacity-60"
              : "border-green-500/30"
          }`}>
            {/* Overlay when scanning or checking IP to block all interaction */}
            {(isScanning || isCheckingIP) && (
              <div className="absolute inset-0 bg-gray-900/20 backdrop-blur-[1px] rounded-xl z-10 pointer-events-auto cursor-not-allowed" />
            )}
            {/* Target Input Section */}
            <div className="mb-8 text-center">
              <h3 className="text-2xl font-semibold text-green-400 mb-6 flex items-center justify-center">
                <Target className="w-6 h-6 mr-3" />
                Enter Your Target
              </h3>
              <div className="flex justify-center">
                <div className="relative w-full max-w-2xl">
                  {(isScanning || scanStatus === 'scanning') ? (
                    // Disabled mock input during scan - completely uneditable
                    <div
                      className="text-lg px-6 py-6 border-gray-500/30 text-gray-400 bg-gray-600/30 opacity-40 cursor-not-allowed border rounded-xl select-none pointer-events-none transition-all duration-300 w-full text-center"
                      onClick={(e) => {
                        e.preventDefault()
                        e.stopPropagation()
                        setScanErrorMessage("Cannot modify target during active scan. Please wait for current scan to complete.")
                        setTimeout(() => setScanErrorMessage(""), 3000)
                      }}
                    >
                      {targetInput || "Scan in progress - please wait..."}
                    </div>
                  ) : (
                    // Normal input when not scanning
                    <Input
                      placeholder={
                        isNetworkDiscoveryLoading
                          ? "Network discovery in progress..."
                          : "Enter IP address or network range (e.g., 192.168.1.1, 10.0.0.0/24)"
                      }
                      value={targetInput}
                      onChange={(e) => {
                        // Extra safety check
                        if (isScanning || (scanStatus as string) === 'scanning' || isNetworkDiscoveryLoading) {
                          setScanErrorMessage("Cannot modify target during active scan!")
                          setTimeout(() => setScanErrorMessage(""), 3000)
                          return
                        }
                        setScanErrorMessage("")
                        handleIPInputChange(e.target.value)
                      }}
                      disabled={isScanning || isNetworkDiscoveryLoading}
                      className={`text-lg px-6 py-6 border-cyan-500/30 focus:border-cyan-500/50 focus:ring-2 focus:ring-cyan-500/20 text-white placeholder:text-gray-400 transition-all duration-300 rounded-xl text-center w-full shadow-lg ${
                        ipValidationError ? 'border-red-500/50 focus:border-red-500/70 focus:ring-red-500/20' : ''
                      } ${
                        isScanning || isNetworkDiscoveryLoading
                          ? 'bg-gray-700/60 cursor-not-allowed opacity-60'
                          : 'bg-slate-800/60 hover:bg-slate-800/80'
                      }`}
                    />
                  )}
                  <div className="absolute right-4 top-1/2 transform -translate-y-1/2">
                    <Target className="w-5 h-5 text-green-400" />
                  </div>
                </div>
              </div>

              {/* IP Validation Error Message */}
              {ipValidationError && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="flex items-center justify-center space-x-2 p-3 bg-red-500/10 border border-red-500/30 rounded-lg mt-4 max-w-2xl mx-auto"
                >
                  <XCircle className="w-4 h-4 text-red-400 flex-shrink-0" />
                  <span className="text-red-400 text-sm">{ipValidationError}</span>
                </motion.div>
              )}

              {/* Valid IP Indicator */}
              {isValidIP && targetInput.trim() && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="flex items-center justify-center space-x-2 p-3 bg-green-500/10 border border-green-500/30 rounded-lg mt-4 max-w-2xl mx-auto"
                >
                  <CheckCircle className="w-4 h-4 text-green-400 flex-shrink-0" />
                  <span className="text-green-400 text-sm">Valid local network target</span>
                </motion.div>
              )}

              {/* Scan Configuration Options */}
              <div className="mt-6 flex justify-center">
                <div className="flex flex-wrap items-center justify-center gap-6 p-4 bg-gray-800/30 border border-gray-700/50 rounded-xl backdrop-blur-sm">
                  <label className="flex items-center space-x-3 group cursor-pointer">
                    <div className="relative">
                      <input
                        type="radio"
                        name="scanMode"
                        value="network-discovery"
                        className="sr-only peer"
                        onChange={(e) => setSelectedScanMode(e.target.value)}
                      />
                      <div className="w-5 h-5 rounded-full border-2 border-green-500/50 group-hover:border-green-500/70 peer-checked:border-green-500 peer-checked:bg-green-500 transition-all duration-200 flex items-center justify-center">
                        <div className="w-2 h-2 bg-white rounded-full opacity-0 peer-checked:opacity-100 transition-opacity duration-200"></div>
                      </div>
                    </div>
                    <span className="text-green-400 font-medium group-hover:text-green-300 transition-colors duration-200">
                      Network Discovery
                    </span>
                    <div className="text-xs text-gray-400 bg-gray-700/50 px-2 py-1 rounded-md">
                      Active IPs
                    </div>
                  </label>

                  <div className="w-px h-8 bg-gray-600/50"></div>

                  <label className="flex items-center space-x-3 group cursor-pointer">
                    <div className="relative">
                      <input
                        type="radio"
                        name="scanMode"
                        value="specific-port"
                        className="sr-only peer"
                        onChange={(e) => setSelectedScanMode(e.target.value)}
                      />
                      <div className="w-5 h-5 rounded-full border-2 border-blue-500/50 group-hover:border-blue-500/70 peer-checked:border-blue-500 peer-checked:bg-blue-500 transition-all duration-200 flex items-center justify-center">
                        <div className="w-2 h-2 bg-white rounded-full opacity-0 peer-checked:opacity-100 transition-opacity duration-200"></div>
                      </div>
                    </div>
                    <span className="text-blue-400 font-medium group-hover:text-blue-300 transition-colors duration-200">
                      Specific Port Range
                    </span>
                    <div className="text-xs text-gray-400 bg-gray-700/50 px-2 py-1 rounded-md">
                      Custom
                    </div>
                  </label>

                  <div className="w-px h-8 bg-gray-600/50"></div>

                  <label className="flex items-center space-x-3 group cursor-pointer">
                    <div className="relative">
                      <input
                        type="radio"
                        name="scanMode"
                        value="vulnerability-scan"
                        defaultChecked
                        className="sr-only peer"
                        onChange={(e) => setSelectedScanMode(e.target.value)}
                      />
                      <div className="w-5 h-5 rounded-full border-2 border-orange-500/50 group-hover:border-orange-500/70 peer-checked:border-orange-500 peer-checked:bg-orange-500 transition-all duration-200 flex items-center justify-center">
                        <div className="w-2 h-2 bg-white rounded-full opacity-0 peer-checked:opacity-100 transition-opacity duration-200"></div>
                      </div>
                    </div>
                    <span className="text-orange-400 font-medium group-hover:text-orange-300 transition-colors duration-200">
                      Vulnerability Assessment
                    </span>
                    <div className="text-xs text-gray-400 bg-gray-700/50 px-2 py-1 rounded-md">
                      With Intensity
                    </div>
                  </label>
                </div>
              </div>

              {/* Error message for scan attempts during active scan */}
              {scanErrorMessage && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="flex items-center justify-center space-x-2 p-3 bg-red-500/10 border border-red-500/30 rounded-lg mt-4 max-w-2xl mx-auto"
                >
                  <XCircle className="w-4 h-4 text-red-400 flex-shrink-0" />
                  <span className="text-red-400 text-sm">{scanErrorMessage}</span>
                </motion.div>
              )}
            </div>

            {/* Scan Intensity Section - Compact Professional Design */}
            {selectedScanMode === "vulnerability-scan" && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                transition={{ duration: 0.3 }}
                className="mt-6 relative"
              >
                <div className={`bg-gray-800/40 border border-gray-700/50 rounded-xl p-6 backdrop-blur-sm transition-all duration-300 ${
                  isScanning || isCheckingIP ? 'opacity-30 pointer-events-none' : ''
                }`}>
                  <h3 className="text-lg font-semibold text-green-400 mb-4 flex items-center justify-center">
                    <Zap className="w-5 h-5 mr-2" />
                    Select Scan Intensity
                  </h3>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    {/* Light Scan */}
                    <motion.div
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.1 }}
                      whileHover={!isScanning ? { scale: 1.02, y: -2 } : {}}
                      className={`p-5 border rounded-lg transition-all ${
                        isScanning
                          ? "border-gray-500/20 bg-gray-500/5 opacity-50 cursor-not-allowed"
                          : "border-green-500/20 bg-green-500/5 hover:border-green-500/30 cursor-pointer"
                      }`}
                    >
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center space-x-2">
                          <Zap className="w-6 h-6 text-green-400" />
                          <span className="font-semibold text-green-400 text-lg">Light Scan</span>
                        </div>
                        <Badge className="bg-green-500/20 text-green-400 border-green-500/30">5-10 min</Badge>
                      </div>
                      <p className="text-sm text-muted-foreground mb-4">
                        Quick vulnerability assessment
                      </p>
                      <div className="space-y-2 mb-4">
                        {vulnerabilityConfigs[selectedTargetType as keyof typeof vulnerabilityConfigs]?.light.map(
                          (vuln, index) => (
                            <div key={index} className="flex items-center space-x-2">
                              <Checkbox checked={true} className="border-green-500/50" />
                              <span className="text-sm text-green-400">{vuln}</span>
                            </div>
                          ),
                        )}
                      </div>
                      <Button
                        className={`w-full text-white ${
                          isScanning
                            ? "bg-gradient-to-r from-gray-500 to-gray-600 cursor-not-allowed"
                            : "bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700"
                        }`}
                        onClick={() => handleScanButtonClick("light")}
                        disabled={!targetInput.trim() || !isValidIP || isScanning || isCheckingIP}
                      >
                        <Zap className="w-4 h-4 mr-2" />
                        {isCheckingIP ? "Checking IP..." : isScanning ? "Scan in Progress..." : "Launch Light Scan"}
                      </Button>
                    </motion.div>

                    {/* Medium Scan */}
                    <motion.div
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.2 }}
                      whileHover={!isScanning ? { scale: 1.02, y: -2 } : {}}
                      className={`p-5 border rounded-lg transition-all ${
                        isScanning
                          ? "border-gray-500/20 bg-gray-500/5 opacity-50 cursor-not-allowed"
                          : "border-blue-500/20 bg-blue-500/5 hover:border-blue-500/30 cursor-pointer"
                      }`}
                    >
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center space-x-2">
                          <Shield className="w-6 h-6 text-blue-400" />
                          <span className="font-semibold text-blue-400 text-lg">Medium Scan</span>
                        </div>
                        <Badge className="bg-blue-500/20 text-blue-400 border-blue-500/30">15-30 min</Badge>
                      </div>
                      <p className="text-sm text-muted-foreground mb-4">
                        Comprehensive security analysis
                      </p>
                      <div className="space-y-2 mb-4">
                        {vulnerabilityConfigs[selectedTargetType as keyof typeof vulnerabilityConfigs]?.medium.slice(0, 3).map(
                          (vuln, index) => (
                            <div key={index} className="flex items-center space-x-2">
                              <Checkbox checked={true} className="border-blue-500/50" />
                              <span className="text-sm text-blue-400">{vuln}</span>
                            </div>
                          ),
                        )}
                      </div>
                      <Button
                        className={`w-full text-white ${
                          isScanning
                            ? "bg-gradient-to-r from-gray-500 to-gray-600 cursor-not-allowed"
                            : "bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700"
                        }`}
                        onClick={() => handleScanButtonClick("medium")}
                        disabled={!targetInput.trim() || !isValidIP || isScanning || isCheckingIP}
                      >
                        <Shield className="w-4 h-4 mr-2" />
                        {isCheckingIP ? "Checking IP..." : isScanning ? "Scan in Progress..." : "Launch Medium Scan"}
                      </Button>
                    </motion.div>

                    {/* Deep Scan */}
                    <motion.div
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.3 }}
                      whileHover={!isScanning ? { scale: 1.02, y: -2 } : {}}
                      className={`p-5 border rounded-lg transition-all ${
                        isScanning
                          ? "border-gray-500/20 bg-gray-500/5 opacity-50 cursor-not-allowed"
                          : "border-red-500/20 bg-red-500/5 hover:border-red-500/30 cursor-pointer"
                      }`}
                    >
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center space-x-2">
                          <Target className="w-6 h-6 text-red-400" />
                          <span className="font-semibold text-red-400 text-lg">Deep Scan</span>
                        </div>
                        <Badge className="bg-red-500/20 text-red-400 border-red-500/30">
                          45-90 min
                        </Badge>
                      </div>
                      <p className="text-sm text-muted-foreground mb-4">Advanced penetration testing</p>
                      <div className="space-y-2 mb-4">
                        {vulnerabilityConfigs[selectedTargetType as keyof typeof vulnerabilityConfigs]?.deep.slice(0, 3).map(
                          (vuln, index) => (
                            <div key={index} className="flex items-center space-x-2">
                              <Checkbox checked={true} className="border-red-500/50" />
                              <span className="text-sm text-red-400">{vuln}</span>
                            </div>
                          ),
                        )}
                      </div>
                      <Button
                        className={`w-full text-white ${
                          isScanning
                            ? "bg-gradient-to-r from-gray-500 to-gray-600 cursor-not-allowed"
                            : "bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700"
                        }`}
                        onClick={() => handleScanButtonClick("deep")}
                        disabled={!targetInput.trim() || !isValidIP || isScanning || isCheckingIP}
                      >
                        <Target className="w-4 h-4 mr-2" />
                        {isCheckingIP ? "Checking IP..." : isScanning ? "Scan in Progress..." : "Launch Deep Scan"}
                      </Button>
                    </motion.div>
                  </div>
                </div>
              </motion.div>
            )}

            {/* Network Discovery Scan Button */}
            {selectedScanMode === "network-discovery" && (
              <div className="space-y-6 relative">
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.1 }}
                  whileHover={!isNetworkDiscoveryLoading ? { scale: 1.02, y: -2 } : {}}
                  className={`bg-gradient-to-br from-cyan-900/30 to-blue-900/20 backdrop-blur-sm rounded-2xl p-6 border border-cyan-500/20 shadow-xl transition-all duration-300 ${
                    isNetworkDiscoveryLoading ? 'opacity-70 pointer-events-none' : ''
                  }`}
                >
                  <div className="text-center mb-4">
                    <div className="relative">
                      <Network className={`w-12 h-12 text-cyan-400 mx-auto mb-3 transition-all duration-300 ${
                        isNetworkDiscoveryLoading ? 'animate-pulse' : ''
                      }`} />
                      {isNetworkDiscoveryLoading && (
                        <div className="absolute inset-0 flex items-center justify-center">
                          <div className="w-16 h-16 border-4 border-cyan-400 border-t-transparent rounded-full animate-spin"></div>
                        </div>
                      )}
                    </div>
                    <h3 className="text-lg font-semibold text-cyan-300 mb-2">Network Discovery</h3>
                    <p className="text-sm text-gray-400">
                      {isNetworkDiscoveryLoading
                        ? "Scanning network for active devices..."
                        : "Discover all active devices on your local network"
                      }
                    </p>
                  </div>

                  <Button
                    className={`w-full text-white transition-all duration-300 ${
                      isNetworkDiscoveryLoading
                        ? "bg-gradient-to-r from-gray-500 to-gray-600 cursor-not-allowed"
                        : "bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-600 hover:to-blue-700"
                    }`}
                    onClick={() => handleNetworkDiscovery()}
                    disabled={isNetworkDiscoveryLoading}
                  >
                    {isNetworkDiscoveryLoading ? (
                      <>
                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                        Discovering Network...
                      </>
                    ) : (
                      <>
                        <Network className="w-4 h-4 mr-2" />
                        Start Network Discovery
                      </>
                    )}
                  </Button>
                </motion.div>

                {/* Network Discovery Loading Overlay */}
                {isNetworkDiscoveryLoading && (
                  <div className="absolute inset-0 flex items-center justify-center z-50">
                    <div className="text-center p-8 bg-gray-900/95 rounded-xl border border-cyan-500/50 shadow-2xl max-w-md mx-4 backdrop-blur-sm">
                      <div className="flex items-center justify-center mb-4">
                        <div className="w-12 h-12 border-4 border-cyan-400 border-t-transparent rounded-full animate-spin mr-3"></div>
                        <div className="text-xl font-semibold text-white">
                          Network Discovery in Progress
                        </div>
                      </div>
                      <div className="text-cyan-200 mb-3 font-medium text-lg">
                        Scanning {targetInput || 'local network'}...
                      </div>
                      <div className="text-sm text-gray-300 mb-4">
                        This may take 15-30 seconds. Please wait while we discover active devices on your network.
                      </div>
                      <div className="flex items-center justify-center space-x-2">
                        <div className="w-2 h-2 bg-cyan-400 rounded-full animate-bounce"></div>
                        <div className="w-2 h-2 bg-cyan-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                        <div className="w-2 h-2 bg-cyan-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* IP Checking Overlay - Phase 1 */}
            {isCheckingIP && (
              <div className="absolute inset-0 flex items-center justify-center z-50">
                    <div className={`text-center p-8 bg-gray-900 rounded-xl shadow-2xl max-w-md mx-4 ${
                      ipCheckMessage.startsWith('❌')
                        ? 'border border-red-500/50'
                        : ipCheckMessage.startsWith('✅')
                        ? 'border border-green-500/50'
                        : 'border border-yellow-500/50'
                    }`}>
                      <div className="flex items-center justify-center mb-4">
                        {ipCheckMessage.startsWith('❌') ? (
                          <XCircle className="w-8 h-8 text-red-400 mr-3" />
                        ) : ipCheckMessage.startsWith('✅') ? (
                          <CheckCircle className="w-8 h-8 text-green-400 mr-3" />
                        ) : (
                          <div className="w-8 h-8 border-4 border-yellow-400 border-t-transparent rounded-full animate-spin mr-3"></div>
                        )}
                        <div className="text-xl font-semibold text-white">
                          {ipCheckMessage.startsWith('❌') ? 'IP Check Failed' :
                           ipCheckMessage.startsWith('✅') ? 'IP Check Success' :
                           'Checking IP Reachability'}
                        </div>
                      </div>
                      <div className={`mb-3 font-medium text-lg ${
                        ipCheckMessage.startsWith('❌') ? 'text-red-200' :
                        ipCheckMessage.startsWith('✅') ? 'text-green-200' :
                        'text-yellow-200'
                      }`}>
                        {ipCheckMessage}
                      </div>
                      <div className="text-sm text-gray-300">
                        {ipCheckMessage.startsWith('❌') ? 'IP is not responding to network requests' :
                         ipCheckMessage.startsWith('✅') ? 'IP is active and ready for scanning' :
                         'Using arping to verify network connectivity'}
                      </div>
                    </div>
                  </div>
                )}

                {/* Scanning Overlay - Phase 2 - Outside the blurred container */}
                {isScanning && !isCheckingIP && (
                  <div className="absolute inset-0 flex items-center justify-center z-50">
                    <div className="text-center p-8 bg-gray-900 rounded-xl border border-blue-500/50 shadow-2xl max-w-md mx-4">
                      <div className="flex items-center justify-center mb-4">
                        <Activity className="w-8 h-8 text-blue-400 animate-pulse mr-3" />
                        <div className="text-xl font-semibold text-white">
                          {currentScanType ? `${currentScanType.charAt(0).toUpperCase() + currentScanType.slice(1)} Scan` : 'Scan'} in Progress
                        </div>
                      </div>
                      <div className="text-blue-200 mb-3 font-medium text-lg">
                        Scanning {targetInput}...
                      </div>
                      <div className="text-sm text-gray-300">
                        Please wait for the current scan to complete before starting a new one
                      </div>
                      <div className="mt-6 flex items-center justify-center space-x-2">
                        <div className="w-3 h-3 bg-blue-400 rounded-full animate-bounce"></div>
                        <div className="w-3 h-3 bg-blue-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                        <div className="w-3 h-3 bg-blue-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                      </div>
                    </div>
                  </div>
                )}
          </div>
        </div>
      </div>

      {/* Conditional Rendering: Network Discovery vs Vulnerability Scanning */}
      <motion.div
        id="live-scan-progress-section"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full"
      >
        {selectedScanMode === 'network-discovery' ? (
          // Network Discovery Results
          <NetworkDiscoveryResults
            data={networkDiscoveryData || {
              network_range: targetInput ? `${targetInput}/24` : '192.168.1.0/24',
              timestamp: new Date().toISOString(),
              scan_status: isNetworkDiscoveryLoading ? 'running' : 'completed',
              devices: [],
              summary: {
                total_devices: 0,
                online_devices: 0,
                discovery_methods: []
              }
            }}
            onRefresh={handleNetworkDiscovery}
            onExport={() => {
              if (networkDiscoveryData) {
                // Export as CSV
                const csvContent = [
                  'IP Address,MAC Address,Hostname,Vendor,Status,Discovery Method',
                  ...networkDiscoveryData.devices.map(device =>
                    `${device.ip},${device.mac || 'N/A'},${device.hostname || 'Unknown'},${device.vendor || 'Unknown'},${device.status},${device.discovery_method}`
                  )
                ].join('\n')

                const blob = new Blob([csvContent], { type: 'text/csv' })
                const url = window.URL.createObjectURL(blob)
                const a = document.createElement('a')
                a.href = url
                a.download = `network_discovery_${new Date().toISOString().split('T')[0]}.csv`
                a.click()
                window.URL.revokeObjectURL(url)
              }
            }}
          />
        ) : selectedScanMode === 'specific-port' ? (
          // Port Discovery Interface and Results
          <div className="space-y-6">
            {/* Port Discovery Configuration */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className={`bg-gradient-to-br from-purple-900/30 to-indigo-900/20 backdrop-blur-sm rounded-2xl p-6 border border-purple-500/20 shadow-xl transition-all duration-300 ${
                isPortDiscoveryLoading ? 'opacity-70 pointer-events-none' : ''
              }`}
            >
              <div className="flex items-center space-x-3 mb-6">
                <Server className="w-6 h-6 text-purple-400" />
                <div>
                  <h3 className="text-xl font-bold text-white">Port Discovery Scanner</h3>
                  <p className="text-gray-400 text-sm">Scan specific ports for services and vulnerabilities</p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-300">Target IP Address</label>
                  <Input
                    type="text"
                    placeholder="192.168.1.1"
                    value={targetInput}
                    onChange={(e) => setTargetInput(e.target.value)}
                    disabled={isPortDiscoveryLoading}
                    className="bg-gray-900/50 border-gray-700 text-white placeholder:text-gray-400 focus:border-purple-500"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-300">Port Number</label>
                  <Input
                    type="number"
                    placeholder="22"
                    value={selectedPort}
                    onChange={(e) => setSelectedPort(e.target.value)}
                    disabled={isPortDiscoveryLoading}
                    min="1"
                    max="65535"
                    className="bg-gray-900/50 border-gray-700 text-white placeholder:text-gray-400 focus:border-purple-500"
                  />
                </div>
              </div>

              {/* Common Ports Quick Select */}
              <div className="mb-6">
                <label className="text-sm font-medium text-gray-300 mb-3 block">Common Ports</label>
                <div className="flex flex-wrap gap-2">
                  {[
                    { port: 22, name: 'SSH' },
                    { port: 23, name: 'Telnet' },
                    { port: 53, name: 'DNS' },
                    { port: 80, name: 'HTTP' },
                    { port: 443, name: 'HTTPS' },
                    { port: 21, name: 'FTP' },
                    { port: 25, name: 'SMTP' },
                    { port: 110, name: 'POP3' },
                    { port: 143, name: 'IMAP' },
                    { port: 993, name: 'IMAPS' },
                    { port: 995, name: 'POP3S' },
                    { port: 3389, name: 'RDP' },
                  ].map(({ port, name }) => (
                    <Button
                      key={port}
                      variant="outline"
                      size="sm"
                      onClick={() => setSelectedPort(port.toString())}
                      disabled={isPortDiscoveryLoading}
                      className={`border-purple-500/30 text-purple-400 hover:bg-purple-500/10 ${
                        selectedPort === port.toString() ? 'bg-purple-500/20 border-purple-500' : ''
                      }`}
                    >
                      {port} ({name})
                    </Button>
                  ))}
                </div>
              </div>

              {/* Error Message */}
              {scanErrorMessage && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="mb-4 p-3 bg-red-500/10 border border-red-500/30 rounded-lg"
                >
                  <div className="flex items-center space-x-2 text-red-400">
                    <XCircle className="w-4 h-4" />
                    <span className="text-sm font-medium">{scanErrorMessage}</span>
                  </div>
                </motion.div>
              )}

              {/* Scan Button */}
              <Button
                onClick={() => handlePortDiscovery()}
                disabled={isPortDiscoveryLoading || !targetInput.trim() || !selectedPort.trim()}
                className={`w-full py-4 text-lg font-semibold transition-all duration-300 ${
                  isPortDiscoveryLoading
                    ? 'bg-purple-500/30 text-purple-300 cursor-not-allowed'
                    : 'bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white shadow-lg hover:shadow-purple-500/25'
                }`}
              >
                {isPortDiscoveryLoading ? (
                  <>
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-3"></div>
                    Scanning Port {selectedPort}...
                  </>
                ) : (
                  <>
                    <Target className="w-5 h-5 mr-3" />
                    Scan Port {selectedPort || 'X'}
                  </>
                )}
              </Button>
            </motion.div>

            {/* Port Discovery Results */}
            <PortDiscoveryResults
              data={portDiscoveryData}
              analysis={portDiscoveryAnalysis}
              isLoading={isPortDiscoveryLoading}
              onRescan={() => handlePortDiscovery()}
              onExport={() => {
                if (portDiscoveryData && portDiscoveryAnalysis) {
                  const exportData = {
                    target: portDiscoveryData.target,
                    port: portDiscoveryData.port,
                    timestamp: portDiscoveryData.timestamp,
                    results: portDiscoveryData.results,
                    analysis: portDiscoveryAnalysis
                  }
                  const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' })
                  const url = window.URL.createObjectURL(blob)
                  const a = document.createElement('a')
                  a.href = url
                  a.download = `port_discovery_${portDiscoveryData.target}_${portDiscoveryData.port}_${new Date().toISOString().split('T')[0]}.json`
                  a.click()
                  window.URL.revokeObjectURL(url)
                }
              }}
            />
          </div>
        ) : (
          // Vulnerability Scanning Progress (existing)
          <RealTimeScanProgress
            key={`scan-${currentScanType}-${scanGeneration}`} // Force remount on scan type changes
            scan={(() => {
              // Determine if we should show live data or start fresh
              const showLiveData = isScanning && hasActiveScan && currentScanId && scanStatus === 'scanning'

              const scanData = {
                id: currentScanId ? parseInt(currentScanId) : 0,
                target: targetInput || 'No target selected',
                type: currentScanType ? `${currentScanType.charAt(0).toUpperCase() + currentScanType.slice(1)} Scan` : 'Select scan type',
                scanType: currentScanType || 'none',
                status: isScanning ? 'running' : scanStatus,
                progress: scanProgress,
                vulnerabilities: {
                  critical: 0,
                  high: 0,
                  medium: 0,
                  low: 0
                },
                // Always show the actual data from JSON - simple and direct
                actualPortsScanned: actualPortsScanned,
                actualServicesFound: actualServicesFound,
                actualVulnerabilitiesFound: actualVulnerabilitiesFound,
                actualOpenPortsFound: actualOpenPortsFound,
                // Report generation status
                isGeneratingReport: isGeneratingReport,
                portLimit: getPortLimit(currentScanType || 'light'),
                // Pass scanResults immediately when backend indicates completion
                scanResults: activeScan?.scanResults || null
              }

              console.log(`🎯 RealTimeScanProgress Data:`, {
                ...scanData,
                showLiveData,
                scanGeneration,
                componentKey: `scan-${currentScanType}-${scanGeneration}`
              })

              return scanData
            })()}
          />
        )}
      </motion.div>


      {selectedScanMode !== 'network-discovery' && selectedScanMode !== 'specific-port' && (
        <Tabs defaultValue="exploits" className="space-y-6">
          <TabsList className="grid w-full grid-cols-2 bg-gray-900/50 border border-gray-800">
            <TabsTrigger
              value="exploits"
              className="data-[state=active]:bg-green-500/20 data-[state=active]:text-green-400"
            >
              <Bug className="w-4 h-4 mr-2" />
              CVE Exploitability Matrix
            </TabsTrigger>
            <TabsTrigger
              value="history"
              className="data-[state=active]:bg-green-500/20 data-[state=active]:text-green-400"
            >
              <Clock className="w-4 h-4 mr-2" />
              History
            </TabsTrigger>
          </TabsList>

        <TabsContent value="exploits" className="space-y-6">
          <Card className="bg-gradient-to-br from-gray-900/50 to-gray-800/30 border-green-500/20">
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Bug className="w-5 h-5 text-green-400" />
                <span>CVE Exploitability Matrix - Discovered Vulnerabilities</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {loadingCVEs ? (
                  <div className="flex items-center justify-center p-8">
                    <div className="text-gray-400">Loading CVEs...</div>
                  </div>
                ) : foundCVEs.length === 0 ? (
                  <div className="flex items-center justify-center p-8">
                    <div className="text-gray-400">No CVEs found. Run a scan to discover vulnerabilities.</div>
                  </div>
                ) : (
                  <>
                    {foundCVEs.map((cve) => (
                      <motion.div
                        key={cve.id}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="p-4 border border-gray-700 rounded-lg bg-gray-800/50"
                      >
                        <div className="flex items-center justify-between mb-3">
                          <div className="flex items-center space-x-3">
                            <Badge className={getSeverityColor(cve.severity)}>{cve.cve_id}</Badge>
                            <span className="font-medium text-white">{cve.description}</span>
                            {cve.cvss_score && (
                              <Badge variant="outline" className="text-xs">
                                CVSS: {cve.cvss_score}
                              </Badge>
                            )}
                          </div>
                          {cve.privilege_escalation && (
                            <Badge className="bg-purple-500/20 text-purple-400 border-purple-500/30 text-xs">
                              Privilege Escalation
                            </Badge>
                          )}
                        </div>
                        <div className="flex items-center space-x-2">
                          {cve.exploitable && (
                            <Badge className="bg-red-500/20 text-red-400 border-red-500/30">Exploitable</Badge>
                          )}
                          {cve.remediated && (
                            <Badge className="bg-green-500/20 text-green-400 border-green-500/30">Remediated</Badge>
                          )}
                          {cve.port && (
                            <Badge variant="outline" className="text-xs">
                              Port: {cve.port}
                            </Badge>
                          )}
                          {cve.service && (
                            <Badge variant="outline" className="text-xs">
                              Service: {cve.service}
                            </Badge>
                          )}
                          <Badge variant="outline" className="text-xs">
                            Target: {cve.target}
                          </Badge>
                        </div>

                        <div className="flex items-center space-x-2 mt-3">
                          {cve.exploitable && (
                            <Link href="/dashboard/red-agent">
                              <Button
                                size="sm"
                                className="bg-red-600 text-white border border-red-600 hover:bg-red-700 transition-colors"
                              >
                                <Target className="w-4 h-4 mr-2" />
                                Exploit with Red Agent
                              </Button>
                            </Link>
                          )}
                          <Link href="/dashboard/blue-agent">
                            <Button
                              size="sm"
                              className="bg-blue-600 text-white border border-blue-600 hover:bg-blue-700 transition-colors"
                            >
                              <Shield className="w-4 h-4 mr-2" />
                              Remediate with Blue Agent
                            </Button>
                          </Link>
                        </div>
                      </motion.div>
                    ))}
                  </>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="history" className="space-y-6">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
            <Card className="bg-gradient-to-br from-gray-900/50 to-gray-800/30 border-gray-700">
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle className="flex items-center space-x-2">
                  <Clock className="w-5 h-5 text-teal-400" />
                  <span>Advanced Scan History</span>
                </CardTitle>
                <div className="flex items-center space-x-2">
                  <Select defaultValue="all">
                    <SelectTrigger className="w-32">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Scans</SelectItem>
                      <SelectItem value="light">Light Scans</SelectItem>
                      <SelectItem value="medium">Medium Scans</SelectItem>
                      <SelectItem value="deep">Deep Scans</SelectItem>
                    </SelectContent>
                  </Select>
                  <Input
                    placeholder="Search scans..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-64"
                  />
                </div>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Target</TableHead>
                      <TableHead>Scan Type</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Progress</TableHead>
                      <TableHead>Vulnerabilities</TableHead>
                      <TableHead>Exploit Paths</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredScans.map((scan) => (
                      <motion.tr
                        key={scan.id}
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        whileHover={{ backgroundColor: "rgba(20, 184, 166, 0.05)" }}
                        className="cursor-pointer"
                      >
                        <TableCell className="font-medium">
                          <div className="flex items-center space-x-2">
                            <Network className="w-4 h-4 text-teal-400" />
                            <span>{scan.target}</span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center space-x-2">
                            {getScanTypeIcon(scan.scanType)}
                            <span className="text-sm">{scan.type}</span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center space-x-2">
                            {getStatusIcon(scan.status)}
                            <Badge variant="outline" className={getStatusBadge(scan.status)}>
                              {scan.status}
                            </Badge>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center space-x-2">
                            <Progress value={scan.progress} className="w-16 h-2" />
                            <span className="text-xs text-muted-foreground">{scan.progress}%</span>
                          </div>
                        </TableCell>
                        <TableCell>
                          {scan.status === "completed" && (
                            <div className="flex space-x-1">
                              {scan.vulnerabilities.critical > 0 && (
                                <Badge className="bg-red-500/20 text-red-400 text-xs">
                                  {scan.vulnerabilities.critical}C
                                </Badge>
                              )}
                              {scan.vulnerabilities.high > 0 && (
                                <Badge className="bg-orange-500/20 text-orange-400 text-xs">
                                  {scan.vulnerabilities.high}H
                                </Badge>
                              )}
                              {scan.vulnerabilities.medium > 0 && (
                                <Badge className="bg-yellow-500/20 text-yellow-400 text-xs">
                                  {scan.vulnerabilities.medium}M
                                </Badge>
                              )}
                              {scan.vulnerabilities.low > 0 && (
                                <Badge className="bg-green-500/20 text-green-400 text-xs">
                                  {scan.vulnerabilities.low}L
                                </Badge>
                              )}
                            </div>
                          )}
                        </TableCell>
                        <TableCell>
                          {scan.exploitPaths > 0 && (
                            <div className="flex items-center space-x-1">
                              <Bug className="w-4 h-4 text-red-400" />
                              <span className="text-sm text-red-400">{scan.exploitPaths}</span>
                            </div>
                          )}
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center space-x-2">
                            <Button variant="ghost" size="sm">
                              <Eye className="w-4 h-4" />
                            </Button>
                            {scan.status === "completed" && (
                              <Button variant="ghost" size="sm">
                                <Download className="w-4 h-4" />
                              </Button>
                            )}
                            <Button variant="ghost" size="sm">
                              <ChevronRight className="w-4 h-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </motion.tr>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </motion.div>
        </TabsContent>
        </Tabs>
      )}
    </div>
  )
}

export default function ScanningPage() {
  return (
    <>
      <Head>
        <title>Scanning - XploitEye Dashboard</title>
        <meta name="description" content="Network and vulnerability scanning tools" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
      </Head>
      <DashboardLayout>
        <ScanningModule />
      </DashboardLayout>
    </>
  );
}
