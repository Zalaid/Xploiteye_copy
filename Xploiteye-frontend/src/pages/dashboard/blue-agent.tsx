"use client"

import React from 'react';
import Head from 'next/head';
import { DashboardLayout } from '@/components/layouts/DashboardLayout';
import { useState, useEffect, useRef } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { useAuth } from '@/auth/AuthContext'
import {
  Shield,
  CheckCircle,
  AlertTriangle,
  TrendingUp,
  Activity,
  FileText,
  Download,
  Eye,
  Play,
  RotateCcw,
  Network,
  Globe,
  Zap,
  Lock,
  Terminal,
  Mail,
  ChevronDown,
  Info,
  ArrowLeft,
  Loader2,
  Copy,
  Check,
  Brain,
  Inbox,
} from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Progress } from "@/components/ui/progress"

interface Vulnerability {
  id?: string
  port: number
  service: string
  version: string
  cve: string
  severity: "critical" | "high" | "medium" | "low"
  description?: string
  cvss?: number
}

interface RemediationState {
  currentStep: 1 | 2 | 3 | 4 | 5
  selectedVuln: Vulnerability | null
  remedyStrategy: any | null
  generatedScript: any | null
  impactAssessment: any | null
  isLoading: boolean
  error: string | null
  emailSent?: boolean
}

// ═══════════════════════════════════════════════════════════════════════════
// UTILITY FUNCTIONS
// ═══════════════════════════════════════════════════════════════════════════

const getSeverityColor = (severity: string | undefined): string => {
  switch (severity?.toLowerCase()) {
    case 'critical':
      return 'bg-red-500/20 text-red-400 border-red-500/30'
    case 'high':
      return 'bg-orange-500/20 text-orange-400 border-orange-500/30'
    case 'medium':
      return 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30'
    case 'low':
      return 'bg-green-500/20 text-green-400 border-green-500/30'
    default:
      return 'bg-slate-500/20 text-slate-400 border-slate-500/30'
  }
}

const getRiskLevelColor = (riskLevel: string): string => {
  switch (riskLevel?.toUpperCase()) {
    case 'HIGH':
      return 'text-red-400 bg-red-500/10'
    case 'MEDIUM':
      return 'text-yellow-400 bg-yellow-500/10'
    case 'LOW':
      return 'text-green-400 bg-green-500/10'
    default:
      return 'text-slate-400 bg-slate-500/10'
  }
}

// ═══════════════════════════════════════════════════════════════════════════
// NETWORK BLUE AGENT COMPONENT
// ═══════════════════════════════════════════════════════════════════════════

export function NetworkBlueAgent() {
  const { user } = useAuth()
  const contentRef = useRef<HTMLDivElement>(null)
  const [vulnerabilities, setVulnerabilities] = useState<Vulnerability[]>([])
  const [isLoadingVulns, setIsLoadingVulns] = useState(true)
  const [loadError, setLoadError] = useState<string | null>(null)
  const [remediationState, setRemediationState] = useState<RemediationState>({
    currentStep: 1,
    selectedVuln: null,
    remedyStrategy: null,
    generatedScript: null,
    impactAssessment: null,
    isLoading: false,
    error: null,
  })

  // Auto-scroll to bottom when step changes
  useEffect(() => {
    if (remediationState.currentStep >= 1) {
      setTimeout(() => {
        window.scrollTo({ top: document.documentElement.scrollHeight, behavior: 'smooth' })
      }, 300)
    }
  }, [remediationState.currentStep])

  // Load vulnerabilities from scanning_results
  useEffect(() => {
    loadVulnerabilitiesFromScan()
  }, [])

  const loadVulnerabilitiesFromScan = async () => {
    try {
      setIsLoadingVulns(true)
      setLoadError(null)

      const scanningResults = localStorage.getItem('scanningResults')

      if (scanningResults) {
        const parsedResults = JSON.parse(scanningResults)

        // Transform based on scanning results format
        const vulns: Vulnerability[] = Array.isArray(parsedResults)
          ? parsedResults.map((result: any, idx: number) => ({
              id: `vuln-${idx}`,
              port: parseInt(result.port) || 0,
              service: (result.results?.service_name || result.service || 'Unknown').trim(),
              version: (result.results?.service_version || result.version || 'Unknown').trim(),
              cve: result.results?.cves?.[0]?.cve_id || result.cve_id || 'Unknown',
              severity: (result.severity || result.results?.cves?.[0]?.severity || 'medium').toLowerCase(),
              description: result.description || 'No description available',
              cvss: result.cvss_score || result.results?.cves?.[0]?.cvss_score || 0,
            }))
          : []

        if (vulns.length > 0) {
          setVulnerabilities(vulns)
          console.log('✅ Loaded vulnerabilities:', vulns)
        } else {
          setLoadError('No vulnerabilities found in scan results')
        }
      } else {
        setLoadError('No scanning results found. Please run a network scan first.')
      }
    } catch (error) {
      console.error('Error loading vulnerabilities:', error)
      setLoadError('Failed to load scanning results')
    } finally {
      setIsLoadingVulns(false)
    }
  }

  const handleRemediateClick = (vuln: Vulnerability) => {
    setRemediationState(prev => ({
      ...prev,
      selectedVuln: vuln,
      currentStep: 2,
      error: null,
    }))
  }

  const handleGenerateStrategy = async () => {
    if (!remediationState.selectedVuln) return

    setRemediationState(prev => ({ ...prev, isLoading: true, error: null }))

    try {
      // Correct payload structure for Node 2
      const response = await fetch('http://localhost:8000/api/blue-agent/fetch-remediation', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          vulnerability: {
            cve: remediationState.selectedVuln.cve,
            service: remediationState.selectedVuln.service,
            version: remediationState.selectedVuln.version,
            port: remediationState.selectedVuln.port,
            severity: remediationState.selectedVuln.severity,
            description: remediationState.selectedVuln.description,
          },
        }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.detail || 'Failed to fetch remediation strategy')
      }

      const data = await response.json()
      console.log('✅ Strategy received:', data)

      setRemediationState(prev => ({
        ...prev,
        remedyStrategy: data.strategy,
        currentStep: 3,
        isLoading: false,
      }))
    } catch (error: any) {
      console.error('Strategy error:', error)
      setRemediationState(prev => ({
        ...prev,
        error: error.message || 'Failed to generate strategy',
        isLoading: false,
      }))
    }
  }

  const handleGenerateScript = async () => {
    if (!remediationState.selectedVuln || !remediationState.remedyStrategy) return

    setRemediationState(prev => ({ ...prev, isLoading: true, error: null }))

    try {
      // Correct payload structure for Node 3
      const response = await fetch('http://localhost:8000/api/blue-agent/generate-script', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          vulnerability: {
            cve: remediationState.selectedVuln.cve,
            service: remediationState.selectedVuln.service,
            version: remediationState.selectedVuln.version,
            port: remediationState.selectedVuln.port,
            severity: remediationState.selectedVuln.severity,
            description: remediationState.selectedVuln.description,
          },
          remediation_strategy: remediationState.remedyStrategy,
        }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.detail || 'Failed to generate script')
      }

      const data = await response.json()
      console.log('✅ Script received:', data)

      setRemediationState(prev => ({
        ...prev,
        generatedScript: data.script,
        currentStep: 4,
        isLoading: false,
      }))
    } catch (error: any) {
      console.error('Script error:', error)
      setRemediationState(prev => ({
        ...prev,
        error: error.message || 'Failed to generate script',
        isLoading: false,
      }))
    }
  }

  const handleAssessImpact = async () => {
    if (!remediationState.selectedVuln || !remediationState.generatedScript) return

    setRemediationState(prev => ({ ...prev, isLoading: true, error: null }))

    try {
      // Correct payload structure for Node 4
      const response = await fetch('http://localhost:8000/api/blue-agent/assess-impact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          vulnerability: {
            cve: remediationState.selectedVuln.cve,
            service: remediationState.selectedVuln.service,
            version: remediationState.selectedVuln.version,
            port: remediationState.selectedVuln.port,
            severity: remediationState.selectedVuln.severity,
            description: remediationState.selectedVuln.description,
          },
          generated_script: remediationState.generatedScript,
        }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.detail || 'Failed to assess impact')
      }

      const data = await response.json()
      console.log('✅ Impact assessment received:', data)

      setRemediationState(prev => ({
        ...prev,
        impactAssessment: data.impact,
        currentStep: 5,
        isLoading: false,
      }))
    } catch (error: any) {
      console.error('Impact error:', error)
      setRemediationState(prev => ({
        ...prev,
        error: error.message || 'Failed to assess impact',
        isLoading: false,
      }))
    }
  }

  const handleDownloadPackage = async () => {
    if (!remediationState.selectedVuln || !remediationState.generatedScript || !remediationState.impactAssessment) {
      setRemediationState(prev => ({
        ...prev,
        error: 'Missing required data for package download',
      }))
      return
    }

    setRemediationState(prev => ({ ...prev, isLoading: true, error: null }))

    try {
      const response = await fetch('http://localhost:8000/api/blue-agent/download-package', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          vulnerability: {
            cve: remediationState.selectedVuln.cve,
            service: remediationState.selectedVuln.service,
            version: remediationState.selectedVuln.version,
            port: remediationState.selectedVuln.port,
            severity: remediationState.selectedVuln.severity,
            description: remediationState.selectedVuln.description,
          },
          generated_script: remediationState.generatedScript,
          impact_assessment: remediationState.impactAssessment,
        }),
      })

      if (!response.ok) {
        let errorMessage = `Server error: ${response.status} ${response.statusText}`
        throw new Error(errorMessage)
      }

      // Get the ZIP file from response as array buffer directly
      const arrayBuffer = await response.arrayBuffer()

      // Verify we got data
      if (!arrayBuffer || arrayBuffer.byteLength === 0) {
        throw new Error('Received empty response from server')
      }

      // Create blob from array buffer
      const blob = new Blob([arrayBuffer], { type: 'application/zip' })

      // Create download link
      const url = URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      link.download = `remediation_${remediationState.selectedVuln.cve.replace('/', '-')}_port-${remediationState.selectedVuln.port}.zip`
      link.style.display = 'none'

      // Trigger download
      document.body.appendChild(link)
      link.click()

      // Cleanup
      setTimeout(() => {
        try {
          document.body.removeChild(link)
        } catch (e) {
          // Already removed
        }
        URL.revokeObjectURL(url)
      }, 100)

      console.log('✅ Package downloaded successfully')
      setRemediationState(prev => ({ ...prev, isLoading: false }))
    } catch (error: any) {
      console.error('Download error:', error)
      setRemediationState(prev => ({
        ...prev,
        error: error.message || 'Failed to download package',
        isLoading: false,
      }))
    }
  }

  const handleEmailPackage = async () => {
    if (!user?.email) {
      setRemediationState(prev => ({
        ...prev,
        error: 'User email not available. Please ensure you are logged in.',
      }))
      return
    }

    if (!remediationState.selectedVuln || !remediationState.generatedScript || !remediationState.impactAssessment) {
      setRemediationState(prev => ({
        ...prev,
        error: 'Missing required data for packaging',
      }))
      return
    }

    setRemediationState(prev => ({ ...prev, isLoading: true, error: null }))

    try {
      // Correct payload structure for Node 5
      const response = await fetch('http://localhost:8000/api/blue-agent/package-and-email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          vulnerability: {
            cve: remediationState.selectedVuln.cve,
            service: remediationState.selectedVuln.service,
            version: remediationState.selectedVuln.version,
            port: remediationState.selectedVuln.port,
            severity: remediationState.selectedVuln.severity,
            description: remediationState.selectedVuln.description,
          },
          generated_script: remediationState.generatedScript,
          impact_assessment: remediationState.impactAssessment,
          user_email: user.email,
        }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.detail || 'Failed to send package')
      }

      const data = await response.json()
      console.log('✅ Package sent:', data)

      // Stay on Step 5 to allow further downloads - add success flag
      setRemediationState(prev => ({
        ...prev,
        isLoading: false,
        emailSent: true,
      }))
    } catch (error: any) {
      console.error('Email error:', error)
      setRemediationState(prev => ({
        ...prev,
        error: error.message || 'Failed to send package',
        isLoading: false,
      }))
    }
  }

  const handleBack = () => {
    setRemediationState({
      currentStep: 1,
      selectedVuln: null,
      remedyStrategy: null,
      generatedScript: null,
      impactAssessment: null,
      isLoading: false,
      error: null,
      emailSent: false,
    })
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-center justify-between"
      >
        <div>
          <h2 className="text-3xl font-bold bg-gradient-to-r from-blue-400 via-cyan-400 to-green-400 bg-clip-text text-transparent">
            Network Blue Agent
          </h2>
          <p className="text-muted-foreground mt-1">Automated remediation for network vulnerabilities</p>
        </div>
        <Badge className="bg-blue-500/20 text-blue-400 border-blue-500/30">
          <Network className="w-3 h-3 mr-1" />
          Network Mode
        </Badge>
      </motion.div>

      {/* Step Indicator */}
      {remediationState.currentStep > 1 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-gradient-to-r from-slate-800/50 to-slate-900/50 rounded-lg p-6 border border-slate-700/50"
        >
          <div className="flex items-center justify-between relative">
            {/* Progress Line */}
            <div className="absolute top-6 left-0 right-0 h-1 bg-slate-700/50 -z-10">
              <motion.div
                className="h-full bg-gradient-to-r from-blue-500 to-cyan-500"
                initial={{ width: "0%" }}
                animate={{ width: `${((remediationState.currentStep - 1) / 4) * 100}%` }}
                transition={{ duration: 0.5 }}
              />
            </div>

            {/* Steps */}
            {[
              { num: 2, title: "Strategy", icon: <FileText className="w-4 h-4" /> },
              { num: 3, title: "Script", icon: <Terminal className="w-4 h-4" /> },
              { num: 4, title: "Impact", icon: <AlertTriangle className="w-4 h-4" /> },
              { num: 5, title: "Email", icon: <Mail className="w-4 h-4" /> },
            ].map((step) => (
              <motion.button
                key={step.num}
                className="flex flex-col items-center relative z-10"
                disabled={step.num > remediationState.currentStep}
              >
                <motion.div
                  className={`w-12 h-12 rounded-full flex items-center justify-center font-bold text-lg transition-all ${
                    step.num < remediationState.currentStep
                      ? "bg-green-500/20 border-2 border-green-500 text-green-400"
                      : step.num === remediationState.currentStep
                        ? "bg-blue-500/20 border-2 border-blue-500 text-blue-400 shadow-lg shadow-blue-500/50"
                        : "bg-slate-700/50 border-2 border-slate-600 text-slate-400"
                  }`}
                >
                  {step.num < remediationState.currentStep ? <CheckCircle className="w-5 h-5" /> : step.num - 1}
                </motion.div>
                <p className="text-xs font-medium mt-2 text-slate-300">{step.title}</p>
              </motion.button>
            ))}
          </div>
        </motion.div>
      )}

      {/* Main Content */}
      <AnimatePresence mode="wait">
        {/* STEP 1: Load Vulnerabilities - Service Cards */}
        {remediationState.currentStep === 1 && (
          <motion.div
            ref={contentRef}
            key="step1"
            initial={{ opacity: 0, x: 50 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -50 }}
            transition={{ duration: 0.3 }}
            className="space-y-6"
          >
            <Card className="bg-gradient-to-br from-slate-800/50 to-slate-900/50 border-blue-500/20">
              <CardHeader>
                <CardTitle className="flex items-center space-x-3">
                  <Eye className="w-6 h-6 text-blue-400" />
                  <span>Scan Results Overview</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                {isLoadingVulns ? (
                  <div className="flex items-center justify-center py-12">
                    <div className="animate-spin">
                      <Zap className="w-8 h-8 text-blue-400" />
                    </div>
                    <p className="text-slate-400 ml-4">Loading vulnerabilities...</p>
                  </div>
                ) : loadError ? (
                  <div className="p-4 bg-red-500/20 border border-red-500/50 rounded-lg">
                    <div className="flex items-start space-x-3">
                      <AlertTriangle className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
                      <div>
                        <p className="text-sm font-medium text-red-400">Error Loading Vulnerabilities</p>
                        <p className="text-sm text-red-300 mt-1">{loadError}</p>
                      </div>
                    </div>
                  </div>
                ) : vulnerabilities.length > 0 ? (
                  <div className="space-y-6">
                    {/* Stats Grid */}
                    <div className="grid grid-cols-4 gap-3">
                      {/* Total Services Card */}
                      <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0, duration: 0.4 }}
                        whileHover={{ y: -4 }}
                      >
                        <Card className="bg-slate-700/50 border-slate-600/50 hover:border-slate-500/50 transition-all cursor-default hover:shadow-lg hover:shadow-slate-500/20">
                          <CardContent className="p-4">
                            <p className="text-xs text-slate-400">Total Services</p>
                            <motion.p
                              initial={{ opacity: 0 }}
                              animate={{ opacity: 1 }}
                              transition={{ delay: 0.2 }}
                              className="text-3xl font-bold text-slate-300 mt-1"
                            >
                              {new Set(vulnerabilities.map(v => v.service)).size}
                            </motion.p>
                          </CardContent>
                        </Card>
                      </motion.div>

                      {/* Critical Vulnerabilities Card */}
                      <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.1, duration: 0.4 }}
                        whileHover={{ y: -4 }}
                      >
                        <Card className="bg-red-500/10 border-red-500/30 hover:border-red-500/50 transition-all cursor-default hover:shadow-lg hover:shadow-red-500/20">
                          <CardContent className="p-4">
                            <p className="text-xs text-slate-400">Critical</p>
                            <motion.p
                              initial={{ opacity: 0 }}
                              animate={{ opacity: 1 }}
                              transition={{ delay: 0.3 }}
                              className="text-3xl font-bold text-red-400 mt-1"
                            >
                              {vulnerabilities.filter(v => v.severity === 'critical').length}
                            </motion.p>
                          </CardContent>
                        </Card>
                      </motion.div>

                      {/* High Severity Card */}
                      <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.2, duration: 0.4 }}
                        whileHover={{ y: -4 }}
                      >
                        <Card className="bg-orange-500/10 border-orange-500/30 hover:border-orange-500/50 transition-all cursor-default hover:shadow-lg hover:shadow-orange-500/20">
                          <CardContent className="p-4">
                            <p className="text-xs text-slate-400">High</p>
                            <motion.p
                              initial={{ opacity: 0 }}
                              animate={{ opacity: 1 }}
                              transition={{ delay: 0.4 }}
                              className="text-3xl font-bold text-orange-400 mt-1"
                            >
                              {vulnerabilities.filter(v => v.severity === 'high').length}
                            </motion.p>
                          </CardContent>
                        </Card>
                      </motion.div>

                      {/* Total CVEs Card */}
                      <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.3, duration: 0.4 }}
                        whileHover={{ y: -4 }}
                      >
                        <Card className="bg-blue-500/10 border-blue-500/30 hover:border-blue-500/50 transition-all cursor-default hover:shadow-lg hover:shadow-blue-500/20">
                          <CardContent className="p-4">
                            <p className="text-xs text-slate-400">Total CVEs</p>
                            <motion.p
                              initial={{ opacity: 0 }}
                              animate={{ opacity: 1 }}
                              transition={{ delay: 0.5 }}
                              className="text-3xl font-bold text-blue-400 mt-1"
                            >
                              {vulnerabilities.length}
                            </motion.p>
                          </CardContent>
                        </Card>
                      </motion.div>
                    </div>

                    {/* Service Cards */}
                    <div>
                      <motion.div
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.5, duration: 0.4 }}
                        className="flex items-center space-x-3 mb-4"
                      >
                        <div className="flex-1">
                          <h3 className="text-lg font-semibold text-slate-200">Select Service to Remediate</h3>
                          <p className="text-xs text-slate-500 mt-1">Click on a service card to start the remediation workflow</p>
                        </div>
                        <motion.div
                          animate={{ rotate: 360 }}
                          transition={{ duration: 4, repeat: Infinity, ease: 'linear' }}
                        >
                          <Shield className="w-6 h-6 text-cyan-400" />
                        </motion.div>
                      </motion.div>
                      <div className="space-y-3">
                        {vulnerabilities.map((vuln, index) => {
                          // Helper function to get CVSS color
                          const getCvssColor = (cvss: number | undefined, severity: string) => {
                            if (!cvss && !severity) return 'bg-slate-700/50 border-slate-600/50 text-slate-300';
                            if (cvss !== undefined) {
                              if (cvss >= 9.0) return 'bg-red-600/30 border-red-500/50 text-red-300';
                              if (cvss >= 7.0) return 'bg-orange-600/30 border-orange-500/50 text-orange-300';
                              if (cvss >= 4.0) return 'bg-yellow-600/30 border-yellow-500/50 text-yellow-300';
                              return 'bg-green-600/30 border-green-500/50 text-green-300';
                            }
                            if (severity === 'critical') return 'bg-red-600/30 border-red-500/50 text-red-300';
                            if (severity === 'high') return 'bg-orange-600/30 border-orange-500/50 text-orange-300';
                            if (severity === 'medium') return 'bg-yellow-600/30 border-yellow-500/50 text-yellow-300';
                            return 'bg-green-600/30 border-green-500/50 text-green-300';
                          };

                          const cvssScore = vuln.cvss ? parseFloat(String(vuln.cvss)) : undefined;
                          const riskLevel = vuln.severity === 'critical' ? 'Critical' : vuln.severity === 'high' ? 'High' : vuln.severity === 'medium' ? 'Medium' : 'Low';
                          const remediationFactor = vuln.severity === 'critical' ? 'Urgent' : vuln.severity === 'high' ? 'High Priority' : vuln.severity === 'medium' ? 'Standard' : 'Low';

                          return (
                            <motion.div
                              key={vuln.id}
                              initial={{ opacity: 0, x: -20 }}
                              animate={{ opacity: 1, x: 0 }}
                              transition={{ delay: 0.6 + index * 0.1, duration: 0.3, type: 'spring', stiffness: 400, damping: 10 }}
                              whileHover={{ scale: 1.01, y: -2 }}
                              onClick={() => handleRemediateClick(vuln)}
                              className={`p-5 rounded-lg border-2 transition-all cursor-pointer group ${getSeverityColor(vuln.severity)} hover:shadow-lg hover:shadow-cyan-500/20 hover:border-blue-400`}
                            >
                              <div className="flex items-start justify-between gap-4">
                                <div className="flex-1">
                                  <div className="flex items-center space-x-3 mb-2">
                                    <h4 className="text-lg font-semibold text-slate-100">{vuln.service}</h4>
                                    <Badge className={getSeverityColor(vuln.severity)}>
                                      {vuln.severity ? vuln.severity.charAt(0).toUpperCase() + vuln.severity.slice(1).toLowerCase() : 'UNKNOWN'}
                                    </Badge>
                                  </div>
                                  <p className="text-sm text-slate-400">
                                    {vuln.port ? `${vuln.port}/` : ''}
                                    {vuln.port ? 'tcp' : ''} • {vuln.version || 'Unknown'}
                                  </p>

                                  {/* Added: Remediation Factor & Risk Display */}
                                  <div className="flex gap-4 mt-3">
                                    <motion.div
                                      initial={{ opacity: 0 }}
                                      animate={{ opacity: 1 }}
                                      transition={{ delay: 0.7 + index * 0.1 }}
                                      className="text-sm"
                                    >
                                      <p className="text-xs text-slate-500">Remediation Factor</p>
                                      <p className="font-semibold text-slate-300">{remediationFactor}</p>
                                    </motion.div>
                                    <motion.div
                                      initial={{ opacity: 0 }}
                                      animate={{ opacity: 1 }}
                                      transition={{ delay: 0.75 + index * 0.1 }}
                                      className="text-sm"
                                    >
                                      <p className="text-xs text-slate-500">Risk Level</p>
                                      <p className="font-semibold text-slate-300">{riskLevel}</p>
                                    </motion.div>
                                  </div>
                                </div>

                                {/* Score Box - Enhanced with shadow and better styling */}
                                <motion.div
                                  whileHover={{ scale: 1.05 }}
                                  className={`p-4 rounded-lg border-2 flex flex-col items-center justify-center min-w-fit transition-all ${getCvssColor(cvssScore, vuln.severity)}`}
                                  style={{
                                    boxShadow: cvssScore !== undefined
                                      ? cvssScore >= 9.0
                                        ? '0 0 12px rgba(220, 38, 38, 0.4)'
                                        : cvssScore >= 7.0
                                        ? '0 0 12px rgba(234, 88, 12, 0.4)'
                                        : '0 0 12px rgba(59, 130, 246, 0.2)'
                                      : '0 0 12px rgba(59, 130, 246, 0.2)'
                                  }}
                                >
                                  <div className="text-center">
                                    {cvssScore !== undefined && (
                                      <>
                                        <p className="text-xs font-medium opacity-75 mb-1">CVSS Score</p>
                                        <p className="text-2xl font-bold">{cvssScore.toFixed(1)}</p>
                                      </>
                                    )}
                                    {(!cvssScore && vuln.severity) && (
                                      <>
                                        <p className="text-xs font-medium opacity-75 mb-1">Risk Level</p>
                                        <p className="text-xl font-bold">{riskLevel}</p>
                                      </>
                                    )}
                                  </div>
                                </motion.div>

                                {/* CVE Info */}
                                <div className="text-right">
                                  <p className="text-sm text-slate-400">CVE</p>
                                  <p className="text-base font-mono font-bold text-slate-200">{vuln.cve}</p>
                                </div>
                              </div>
                            </motion.div>
                          );
                        })}
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-12">
                    <Shield className="w-12 h-12 text-slate-500 mx-auto mb-4 opacity-50" />
                    <p className="text-slate-400">No vulnerabilities to remediate</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </motion.div>
        )}

        {/* STEP 2: Remediation Strategy */}
        {remediationState.currentStep === 2 && remediationState.selectedVuln && (
          <motion.div
            key="step2"
            initial={{ opacity: 0, x: 50 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -50 }}
            transition={{ duration: 0.3 }}
            className="space-y-6"
          >
            {/* Selected Service Header with Info Box */}
            <div className="grid grid-cols-3 gap-4">
              <div className="col-span-2">
                <Card className={`border-2 ${getSeverityColor(remediationState.selectedVuln.severity)}`}>
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className="text-2xl font-bold text-slate-100">{remediationState.selectedVuln.service}</h3>
                        <p className="text-slate-400 mt-1">{remediationState.selectedVuln.cve}</p>
                      </div>
                      <Badge className={getSeverityColor(remediationState.selectedVuln.severity)}>
                        {remediationState.selectedVuln.severity.toUpperCase()}
                      </Badge>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Vulnerability Info Box */}
              <Card className="bg-slate-800/50 border-slate-600/50 hover:border-slate-500 transition-all">
                <CardContent className="p-4 space-y-3">
                  <div>
                    <p className="text-xs text-slate-400 mb-1">CVE Score</p>
                    <p className="text-lg font-bold text-cyan-400">
                      {remediationState.selectedVuln.cvss ? remediationState.selectedVuln.cvss : 'N/A'}
                    </p>
                  </div>
                  <div className="border-t border-slate-700/50 pt-3">
                    <p className="text-xs text-slate-400 mb-1">Port</p>
                    <p className="text-sm font-semibold text-slate-300">{remediationState.selectedVuln.port}/tcp</p>
                  </div>
                  <div className="border-t border-slate-700/50 pt-3">
                    <p className="text-xs text-slate-400 mb-1">Critical Level</p>
                    <p className="text-sm font-semibold text-slate-300 capitalize">{remediationState.selectedVuln.severity}</p>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Strategy Card */}
            <Card className="bg-gradient-to-br from-slate-800/50 to-slate-900/50 border-blue-500/20">
              <CardHeader>
                <CardTitle className="flex items-center space-x-3">
                  <FileText className="w-6 h-6 text-blue-400" />
                  <span>Remediation Strategy</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {remediationState.isLoading ? (
                  <div className="flex flex-col items-center justify-center py-12 space-y-4">
                    <motion.div animate={{ y: [0, -10, 0] }} transition={{ duration: 2, repeat: Infinity }} className="flex items-center space-x-3">
                      <Brain className="w-8 h-8 text-blue-400" />
                      <Loader2 className="w-8 h-8 text-cyan-400 animate-spin" />
                    </motion.div>
                    <div className="text-center">
                      <p className="text-slate-300 font-medium">AI Agent is Creating Strategy</p>
                      <p className="text-slate-500 text-sm mt-1">Analyzing vulnerability and developing optimal remediation approach...</p>
                    </div>
                  </div>
                ) : remediationState.error ? (
                  <div className="p-4 bg-red-500/20 border border-red-500/50 rounded-lg">
                    <div className="flex items-start space-x-3">
                      <AlertTriangle className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
                      <div>
                        <p className="text-sm font-medium text-red-400">Error</p>
                        <p className="text-sm text-red-300 mt-1">{remediationState.error}</p>
                      </div>
                    </div>
                  </div>
                ) : remediationState.remedyStrategy ? (
                  <div className="space-y-4">
                    <div>
                      <h4 className="text-sm font-semibold text-slate-200 mb-3">Strategy Points:</h4>
                      <ul className="space-y-2">
                        {remediationState.remedyStrategy.strategy_points?.map((point: string, idx: number) => (
                          <li key={idx} className="flex items-start space-x-3 text-sm text-slate-300">
                            <span className="text-blue-400 font-bold mt-0.5">{idx + 1}.</span>
                            <span>{point}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                    {remediationState.remedyStrategy.estimated_complexity && (
                      <div className="pt-3 border-t border-slate-700">
                        <p className="text-sm text-slate-400">
                          <span className="font-semibold">Complexity:</span> {remediationState.remedyStrategy.estimated_complexity}
                        </p>
                      </div>
                    )}
                  </div>
                ) : null}

                {/* Action Buttons */}
                <div className="flex space-x-3 pt-4">
                  <Button
                    onClick={handleBack}
                    variant="outline"
                    className="flex items-center space-x-2"
                  >
                    <ArrowLeft className="w-4 h-4" />
                    <span>Back</span>
                  </Button>
                  <Button
                    onClick={handleGenerateStrategy}
                    disabled={remediationState.isLoading || remediationState.remedyStrategy !== null}
                    className="flex-1 bg-blue-600 hover:bg-blue-700 flex items-center justify-center space-x-2"
                  >
                    {remediationState.remedyStrategy ? (
                      <>
                        <CheckCircle className="w-4 h-4" />
                        <span>Strategy Generated</span>
                      </>
                    ) : (
                      <>
                        <Zap className="w-4 h-4" />
                        <span>Generate Strategy</span>
                      </>
                    )}
                  </Button>
                  <Button
                    onClick={handleGenerateScript}
                    disabled={!remediationState.remedyStrategy || remediationState.isLoading}
                    className="bg-cyan-600 hover:bg-cyan-700 flex items-center space-x-2"
                  >
                    <Terminal className="w-4 h-4" />
                    <span>Next</span>
                  </Button>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}

        {/* STEP 3: Generate Script */}
        {remediationState.currentStep === 3 && remediationState.selectedVuln && (
          <motion.div
            key="step3"
            initial={{ opacity: 0, x: 50 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -50 }}
            transition={{ duration: 0.3 }}
            className="space-y-6"
          >
            {/* Selected Service Header with Info Box */}
            <div className="grid grid-cols-3 gap-4">
              <div className="col-span-2">
                <Card className={`border-2 ${getSeverityColor(remediationState.selectedVuln.severity)}`}>
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className="text-2xl font-bold text-slate-100">{remediationState.selectedVuln.service}</h3>
                        <p className="text-slate-400 mt-1">{remediationState.selectedVuln.cve}</p>
                      </div>
                      <Badge className={getSeverityColor(remediationState.selectedVuln.severity)}>
                        {remediationState.selectedVuln.severity.toUpperCase()}
                      </Badge>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Vulnerability Info Box */}
              <Card className="bg-slate-800/50 border-slate-600/50 hover:border-slate-500 transition-all">
                <CardContent className="p-4 space-y-3">
                  <div>
                    <p className="text-xs text-slate-400 mb-1">CVE Score</p>
                    <p className="text-lg font-bold text-cyan-400">
                      {remediationState.selectedVuln.cvss ? remediationState.selectedVuln.cvss : 'N/A'}
                    </p>
                  </div>
                  <div className="border-t border-slate-700/50 pt-3">
                    <p className="text-xs text-slate-400 mb-1">Port</p>
                    <p className="text-sm font-semibold text-slate-300">{remediationState.selectedVuln.port}/tcp</p>
                  </div>
                  <div className="border-t border-slate-700/50 pt-3">
                    <p className="text-xs text-slate-400 mb-1">Critical Level</p>
                    <p className="text-sm font-semibold text-slate-300 capitalize">{remediationState.selectedVuln.severity}</p>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Script Card */}
            <Card className="bg-gradient-to-br from-slate-800/50 to-slate-900/50 border-blue-500/20">
              <CardHeader>
                <CardTitle className="flex items-center space-x-3">
                  <Terminal className="w-6 h-6 text-blue-400" />
                  <span>Remediation Script</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {remediationState.isLoading ? (
                  <div className="flex flex-col items-center justify-center py-12 space-y-4">
                    <motion.div animate={{ y: [0, -10, 0] }} transition={{ duration: 2, repeat: Infinity }} className="flex items-center space-x-3">
                      <Shield className="w-8 h-8 text-cyan-400" />
                      <Loader2 className="w-8 h-8 text-blue-400 animate-spin" />
                    </motion.div>
                    <div className="text-center">
                      <p className="text-slate-300 font-medium">AI Agent is Generating Script</p>
                      <p className="text-slate-500 text-sm mt-1">Our models are creating the optimal remediation script...</p>
                    </div>
                  </div>
                ) : remediationState.error ? (
                  <div className="p-4 bg-red-500/20 border border-red-500/50 rounded-lg">
                    <div className="flex items-start space-x-3">
                      <AlertTriangle className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
                      <div>
                        <p className="text-sm font-medium text-red-400">Error</p>
                        <p className="text-sm text-red-300 mt-1">{remediationState.error}</p>
                      </div>
                    </div>
                  </div>
                ) : remediationState.generatedScript ? (
                  <div className="space-y-4">
                    <div className="p-3 bg-yellow-500/10 border border-yellow-500/30 rounded-lg flex items-start space-x-3">
                      <AlertTriangle className="w-5 h-5 text-yellow-400 flex-shrink-0 mt-0.5" />
                      <div className="text-sm text-yellow-300">
                        <p className="font-semibold">⚠️ Review Before Execution</p>
                        <p className="text-xs mt-1">Always review the script and test in a non-production environment first.</p>
                      </div>
                    </div>

                    {/* Script Content */}
                    <div className="bg-slate-950 rounded-lg p-4 border border-slate-700 max-h-96 overflow-y-auto">
                      <pre className="text-xs font-mono text-slate-300 whitespace-pre-wrap break-words">
                        {remediationState.generatedScript.script_content?.substring(0, 1000)}
                        {remediationState.generatedScript.script_content?.length > 1000 ? '\n\n... (truncated) ...' : ''}
                      </pre>
                    </div>

                    {/* Script Details */}
                    <div className="grid grid-cols-2 gap-3">
                      <div className="p-3 bg-slate-700/50 rounded-lg">
                        <p className="text-xs text-slate-400">Filename</p>
                        <p className="text-sm font-mono text-slate-200 mt-1">{remediationState.generatedScript.filename}</p>
                      </div>
                      <div className="p-3 bg-slate-700/50 rounded-lg">
                        <p className="text-xs text-slate-400">Language</p>
                        <p className="text-sm font-mono text-slate-200 mt-1">{remediationState.generatedScript.language}</p>
                      </div>
                    </div>
                  </div>
                ) : null}

                {/* Action Buttons */}
                <div className="flex space-x-3 pt-4">
                  <Button
                    onClick={handleBack}
                    variant="outline"
                    className="flex items-center space-x-2"
                  >
                    <ArrowLeft className="w-4 h-4" />
                    <span>Back</span>
                  </Button>
                  <Button
                    onClick={handleGenerateScript}
                    disabled={remediationState.isLoading || remediationState.generatedScript !== null}
                    className="flex-1 bg-blue-600 hover:bg-blue-700 flex items-center justify-center space-x-2"
                  >
                    {remediationState.generatedScript ? (
                      <>
                        <CheckCircle className="w-4 h-4" />
                        <span>Script Generated</span>
                      </>
                    ) : (
                      <>
                        <Zap className="w-4 h-4" />
                        <span>Generate Script</span>
                      </>
                    )}
                  </Button>
                  <Button
                    onClick={handleAssessImpact}
                    disabled={!remediationState.generatedScript || remediationState.isLoading}
                    className="bg-cyan-600 hover:bg-cyan-700 flex items-center space-x-2"
                  >
                    <AlertTriangle className="w-4 h-4" />
                    <span>Assess Impact</span>
                  </Button>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}

        {/* STEP 4: Impact Assessment */}
        {remediationState.currentStep === 4 && remediationState.selectedVuln && (
          <motion.div
            key="step4"
            initial={{ opacity: 0, x: 50 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -50 }}
            transition={{ duration: 0.3 }}
            className="space-y-6"
          >
            {/* Selected Service Header with Info Box */}
            <div className="grid grid-cols-3 gap-4">
              <div className="col-span-2">
                <Card className={`border-2 ${getSeverityColor(remediationState.selectedVuln.severity)}`}>
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className="text-2xl font-bold text-slate-100">{remediationState.selectedVuln.service}</h3>
                        <p className="text-slate-400 mt-1">{remediationState.selectedVuln.cve}</p>
                      </div>
                      <Badge className={getSeverityColor(remediationState.selectedVuln.severity)}>
                        {remediationState.selectedVuln.severity.toUpperCase()}
                      </Badge>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Vulnerability Info Box */}
              <Card className="bg-slate-800/50 border-slate-600/50 hover:border-slate-500 transition-all">
                <CardContent className="p-4 space-y-3">
                  <div>
                    <p className="text-xs text-slate-400 mb-1">CVE Score</p>
                    <p className="text-lg font-bold text-cyan-400">
                      {remediationState.selectedVuln.cvss ? remediationState.selectedVuln.cvss : 'N/A'}
                    </p>
                  </div>
                  <div className="border-t border-slate-700/50 pt-3">
                    <p className="text-xs text-slate-400 mb-1">Port</p>
                    <p className="text-sm font-semibold text-slate-300">{remediationState.selectedVuln.port}/tcp</p>
                  </div>
                  <div className="border-t border-slate-700/50 pt-3">
                    <p className="text-xs text-slate-400 mb-1">Critical Level</p>
                    <p className="text-sm font-semibold text-slate-300 capitalize">{remediationState.selectedVuln.severity}</p>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Impact Assessment Card */}
            <Card className="bg-gradient-to-br from-slate-800/50 to-slate-900/50 border-blue-500/20">
              <CardHeader>
                <CardTitle className="flex items-center space-x-3">
                  <AlertTriangle className="w-6 h-6 text-blue-400" />
                  <span>Impact Assessment</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                {remediationState.isLoading ? (
                  <div className="flex flex-col items-center justify-center py-12 space-y-6">
                    <div className="flex items-center space-x-4">
                      <motion.div animate={{ scale: [1, 1.2, 1] }} transition={{ duration: 1.5, repeat: Infinity }} className="w-3 h-3 bg-cyan-400 rounded-full" />
                      <motion.div animate={{ scale: [1, 1.2, 1] }} transition={{ duration: 1.5, repeat: Infinity, delay: 0.2 }} className="w-3 h-3 bg-blue-400 rounded-full" />
                      <motion.div animate={{ scale: [1, 1.2, 1] }} transition={{ duration: 1.5, repeat: Infinity, delay: 0.4 }} className="w-3 h-3 bg-purple-400 rounded-full" />
                    </div>
                    <div className="text-center">
                      <p className="text-slate-300 font-medium">AI Agent is Analyzing Impact</p>
                      <p className="text-slate-500 text-sm mt-1">Evaluating risks and dependencies...</p>
                    </div>
                  </div>
                ) : remediationState.error ? (
                  <div className="p-4 bg-red-500/20 border border-red-500/50 rounded-lg">
                    <div className="flex items-start space-x-3">
                      <AlertTriangle className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
                      <div>
                        <p className="text-sm font-medium text-red-400">Error</p>
                        <p className="text-sm text-red-300 mt-1">{remediationState.error}</p>
                      </div>
                    </div>
                  </div>
                ) : remediationState.impactAssessment ? (
                  <div className="space-y-6">
                    {/* Risk Level */}
                    <div className="p-4 rounded-lg bg-slate-700/50">
                      <p className="text-sm text-slate-400 mb-2">Risk Level</p>
                      <Badge className={`text-lg px-4 py-2 ${getRiskLevelColor(remediationState.impactAssessment.risk_level)}`}>
                        {remediationState.impactAssessment.risk_level}
                      </Badge>
                    </div>

                    {/* Downtime */}
                    <div className="p-4 rounded-lg bg-slate-700/50">
                      <p className="text-sm text-slate-400 mb-2">Estimated Downtime</p>
                      <p className="text-2xl font-bold text-slate-100">
                        {remediationState.impactAssessment.estimated_downtime_seconds} <span className="text-sm text-slate-400">seconds</span>
                      </p>
                    </div>

                    {/* Affected Services */}
                    {remediationState.impactAssessment.affected_services?.length > 0 && (
                      <div className="p-4 rounded-lg bg-slate-700/50">
                        <p className="text-sm text-slate-400 mb-3">Affected Services</p>
                        <div className="flex flex-wrap gap-2">
                          {remediationState.impactAssessment.affected_services.map((svc: string, idx: number) => (
                            <Badge key={idx} className="bg-blue-500/20 text-blue-400 border-blue-500/30">
                              {svc}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Dangerous Commands */}
                    {remediationState.impactAssessment.dangerous_commands?.length > 0 && (
                      <div className="p-4 rounded-lg bg-orange-500/10 border border-orange-500/30">
                        <p className="text-sm text-orange-400 font-semibold mb-3">⚠️ Dangerous Commands Detected</p>
                        <ul className="space-y-1">
                          {remediationState.impactAssessment.dangerous_commands.map((cmd: string, idx: number) => (
                            <li key={idx} className="text-sm text-orange-300 font-mono">
                              {cmd}
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}

                    {/* Prerequisite Checklist */}
                    {remediationState.impactAssessment.prerequisite_checks?.length > 0 && (
                      <div className="p-4 rounded-lg bg-slate-700/50">
                        <p className="text-sm text-slate-400 font-semibold mb-3">Pre-Execution Checklist</p>
                        <ul className="space-y-2">
                          {remediationState.impactAssessment.prerequisite_checks.map((check: string, idx: number) => (
                            <li key={idx} className="flex items-start space-x-3 text-sm text-slate-300">
                              <span className="text-blue-400 mt-1">✓</span>
                              <span>{check}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}

                    {/* Reversibility */}
                    <div className="grid grid-cols-2 gap-3">
                      <div className="p-3 bg-slate-700/50 rounded-lg">
                        <p className="text-xs text-slate-400">Reversible</p>
                        <p className="text-sm font-semibold text-slate-200 mt-1">
                          {remediationState.impactAssessment.reversible ? '✓ Yes' : '✗ No'}
                        </p>
                      </div>
                      <div className="p-3 bg-slate-700/50 rounded-lg">
                        <p className="text-xs text-slate-400">Requires Sudo</p>
                        <p className="text-sm font-semibold text-slate-200 mt-1">
                          {remediationState.impactAssessment.requires_sudo ? '✓ Yes' : '✗ No'}
                        </p>
                      </div>
                    </div>
                  </div>
                ) : null}

                {/* Action Buttons */}
                <div className="flex space-x-3 pt-4">
                  <Button
                    onClick={handleBack}
                    variant="outline"
                    className="flex items-center space-x-2"
                  >
                    <ArrowLeft className="w-4 h-4" />
                    <span>Back</span>
                  </Button>
                  <Button
                    onClick={handleAssessImpact}
                    disabled={remediationState.isLoading || remediationState.impactAssessment !== null}
                    className="flex-1 bg-blue-600 hover:bg-blue-700 flex items-center justify-center space-x-2"
                  >
                    {remediationState.impactAssessment ? (
                      <>
                        <CheckCircle className="w-4 h-4" />
                        <span>Assessment Complete</span>
                      </>
                    ) : (
                      <>
                        <AlertTriangle className="w-4 h-4" />
                        <span>Assess Impact</span>
                      </>
                    )}
                  </Button>
                  <Button
                    onClick={() => setRemediationState(prev => ({ ...prev, currentStep: 5 }))}
                    disabled={!remediationState.impactAssessment || remediationState.isLoading}
                    className="bg-cyan-600 hover:bg-cyan-700 flex items-center space-x-2"
                  >
                    <Mail className="w-4 h-4" />
                    <span>Email Package</span>
                  </Button>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}

        {/* STEP 5: Package and Email */}
        {remediationState.currentStep === 5 && remediationState.selectedVuln && (
          <motion.div
            key="step5"
            initial={{ opacity: 0, x: 50 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -50 }}
            transition={{ duration: 0.3 }}
            className="space-y-6"
          >
            {/* Selected Service Header with Info Box */}
            <div className="grid grid-cols-3 gap-4">
              <div className="col-span-2">
                <Card className={`border-2 ${getSeverityColor(remediationState.selectedVuln.severity)}`}>
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className="text-2xl font-bold text-slate-100">{remediationState.selectedVuln.service}</h3>
                        <p className="text-slate-400 mt-1">{remediationState.selectedVuln.cve}</p>
                      </div>
                      <Badge className={getSeverityColor(remediationState.selectedVuln.severity)}>
                        {remediationState.selectedVuln.severity.toUpperCase()}
                      </Badge>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Vulnerability Info Box */}
              <Card className="bg-slate-800/50 border-slate-600/50 hover:border-slate-500 transition-all">
                <CardContent className="p-4 space-y-3">
                  <div>
                    <p className="text-xs text-slate-400 mb-1">CVE Score</p>
                    <p className="text-lg font-bold text-cyan-400">
                      {remediationState.selectedVuln.cvss ? remediationState.selectedVuln.cvss : 'N/A'}
                    </p>
                  </div>
                  <div className="border-t border-slate-700/50 pt-3">
                    <p className="text-xs text-slate-400 mb-1">Port</p>
                    <p className="text-sm font-semibold text-slate-300">{remediationState.selectedVuln.port}/tcp</p>
                  </div>
                  <div className="border-t border-slate-700/50 pt-3">
                    <p className="text-xs text-slate-400 mb-1">Critical Level</p>
                    <p className="text-sm font-semibold text-slate-300 capitalize">{remediationState.selectedVuln.severity}</p>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Email Package Card */}
            <Card className="bg-gradient-to-br from-slate-800/50 to-slate-900/50 border-blue-500/20">
              <CardHeader>
                <CardTitle className="flex items-center space-x-3">
                  <Mail className="w-6 h-6 text-blue-400" />
                  <span>Send Remediation Package</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Package Summary */}
                <div className="p-4 rounded-lg bg-slate-700/50 border border-slate-600">
                  <h4 className="text-sm font-semibold text-slate-200 mb-3">Package Contents</h4>
                  <ul className="space-y-2 text-sm text-slate-300">
                    <li className="flex items-center space-x-2">
                      <CheckCircle className="w-4 h-4 text-green-400" />
                      <span>Remediation Script</span>
                    </li>
                    <li className="flex items-center space-x-2">
                      <CheckCircle className="w-4 h-4 text-green-400" />
                      <span>Rollback Script</span>
                    </li>
                    <li className="flex items-center space-x-2">
                      <CheckCircle className="w-4 h-4 text-green-400" />
                      <span>Documentation (README)</span>
                    </li>
                    <li className="flex items-center space-x-2">
                      <CheckCircle className="w-4 h-4 text-green-400" />
                      <span>Impact Summary</span>
                    </li>
                    <li className="flex items-center space-x-2">
                      <CheckCircle className="w-4 h-4 text-green-400" />
                      <span>Execution Checklist</span>
                    </li>
                  </ul>
                </div>

                {/* User Email Display */}
                <div className="p-4 rounded-lg bg-blue-500/10 border border-blue-500/30">
                  <div className="flex items-center space-x-2">
                    <Mail className="w-4 h-4 text-blue-400" />
                    <div>
                      <p className="text-sm text-slate-400">Package will be sent to:</p>
                      <p className="font-mono text-blue-300">{user?.email || 'No email available'}</p>
                    </div>
                  </div>
                </div>

                {/* Success Card - Email Sent */}
                {remediationState.emailSent && (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.9, y: -20 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    transition={{ duration: 0.4, ease: "easeOut" }}
                    className="p-5 rounded-lg bg-gradient-to-r from-green-500/20 to-emerald-500/20 border-2 border-green-400/50"
                  >
                    <div className="flex items-center space-x-4">
                      <motion.div
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
                        className="flex-shrink-0"
                      >
                        <CheckCircle className="w-8 h-8 text-green-400" />
                      </motion.div>
                      <motion.div
                        initial={{ rotate: -20, opacity: 0 }}
                        animate={{ rotate: 0, opacity: 1 }}
                        transition={{ delay: 0.3 }}
                        className="flex-shrink-0"
                      >
                        <Inbox className="w-8 h-8 text-green-400" />
                      </motion.div>
                      <div className="flex-1">
                        <motion.p
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          transition={{ delay: 0.1 }}
                          className="font-semibold text-green-300 text-sm"
                        >
                          Remediation Package Sent Successfully!
                        </motion.p>
                        <motion.p
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          transition={{ delay: 0.2 }}
                          className="text-green-200/80 text-xs mt-1"
                        >
                          Package has been sent to <span className="font-mono text-green-300">{user?.email}</span>
                        </motion.p>
                      </div>
                    </div>
                  </motion.div>
                )}

                {remediationState.error && (
                  <div className="p-4 bg-red-500/20 border border-red-500/50 rounded-lg">
                    <div className="flex items-start space-x-3">
                      <AlertTriangle className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
                      <div>
                        <p className="text-sm font-medium text-red-400">Error</p>
                        <p className="text-sm text-red-300 mt-1">{remediationState.error}</p>
                      </div>
                    </div>
                  </div>
                )}

                {/* Action Buttons */}
                <div className="flex flex-col gap-3 pt-4">
                  <div className="flex space-x-3">
                    <Button
                      onClick={handleBack}
                      variant="outline"
                      className="flex items-center space-x-2"
                    >
                      <ArrowLeft className="w-4 h-4" />
                      <span>Back</span>
                    </Button>
                    <Button
                      onClick={handleDownloadPackage}
                      disabled={remediationState.isLoading}
                      className="flex-1 bg-purple-600 hover:bg-purple-700 flex items-center justify-center space-x-2"
                    >
                      {remediationState.isLoading ? (
                        <>
                          <Loader2 className="w-4 h-4 animate-spin" />
                          <span>Preparing...</span>
                        </>
                      ) : (
                        <>
                          <Download className="w-4 h-4" />
                          <span>Download Package</span>
                        </>
                      )}
                    </Button>
                  </div>
                  <Button
                    onClick={handleEmailPackage}
                    disabled={remediationState.isLoading || !user?.email}
                    className="w-full bg-green-600 hover:bg-green-700 flex items-center justify-center space-x-2"
                  >
                    {remediationState.isLoading ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        <span>Sending to {user?.email}...</span>
                      </>
                    ) : (
                      <>
                        <Mail className="w-4 h-4" />
                        <span>Send Remediation Package</span>
                      </>
                    )}
                  </Button>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

// ═══════════════════════════════════════════════════════════════════════════
// WEB BLUE AGENT COMPONENT (Placeholder)
// ═══════════════════════════════════════════════════════════════════════════

export function WebBlueAgent() {
  return (
    <Card className="bg-gradient-to-br from-slate-800/50 to-slate-900/50 border-blue-500/20">
      <CardContent className="p-12">
        <div className="text-center">
          <Globe className="w-12 h-12 text-slate-500 mx-auto mb-4 opacity-50" />
          <h3 className="text-lg font-semibold text-slate-300 mb-2">Web Blue Agent</h3>
          <p className="text-slate-500">Coming soon - Web vulnerability remediation</p>
        </div>
      </CardContent>
    </Card>
  )
}

// ═══════════════════════════════════════════════════════════════════════════
// MAIN BLUE AGENT DASHBOARD
// ═══════════════════════════════════════════════════════════════════════════

export function BlueAgentDashboard() {
  const [activeTab, setActiveTab] = useState('network')

  return (
    <div className="space-y-6">
      <Tabs defaultValue="network" value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full max-w-md grid-cols-2 bg-slate-800/50 border border-slate-700">
          <TabsTrigger
            value="network"
            className="flex items-center space-x-2 data-[state=active]:bg-blue-500/20 data-[state=active]:text-blue-400"
          >
            <Network className="w-4 h-4" />
            <span>Network</span>
          </TabsTrigger>
          <TabsTrigger
            value="web"
            className="flex items-center space-x-2 data-[state=active]:bg-green-500/20 data-[state=active]:text-green-400"
          >
            <Globe className="w-4 h-4" />
            <span>Web</span>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="network" className="mt-6">
          <NetworkBlueAgent />
        </TabsContent>
        <TabsContent value="web" className="mt-6">
          <WebBlueAgent />
        </TabsContent>
      </Tabs>
    </div>
  )
}

// ═══════════════════════════════════════════════════════════════════════════
// PAGE EXPORT
// ═══════════════════════════════════════════════════════════════════════════

export default function BlueAgentPage() {
  return (
    <>
      <Head>
        <title>Blue Agent - XploitEye</title>
        <meta name="description" content="Blue Agent - Automated vulnerability remediation" />
      </Head>
      <DashboardLayout>
        <BlueAgentDashboard />
      </DashboardLayout>
    </>
  )
}
