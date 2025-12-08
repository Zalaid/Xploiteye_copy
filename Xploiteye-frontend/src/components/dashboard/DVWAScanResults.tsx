"use client"

import React from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  AlertTriangle,
  CheckCircle2,
  Clock,
  Globe,
  Zap,
  ChevronDown,
  Shield,
  AlertCircle,
  Bug,
  Flame,
} from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { DVWAScanResult, DVWAVulnerability } from '@/services/dvwaApi'

interface DVWAScanResultsProps {
  result: DVWAScanResult
  isLoading?: boolean
  onExploit?: (vulnerability: DVWAVulnerability) => void
}

export function DVWAScanResults({ result, isLoading = false, onExploit }: DVWAScanResultsProps) {
  const [expandedVulns, setExpandedVulns] = React.useState<Set<number>>(new Set())

  const toggleExpand = (index: number) => {
    const newExpanded = new Set(expandedVulns)
    if (newExpanded.has(index)) {
      newExpanded.delete(index)
    } else {
      newExpanded.add(index)
    }
    setExpandedVulns(newExpanded)
  }

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'CRITICAL':
        return 'bg-red-500/20 text-red-400 border-red-500/50'
      case 'HIGH':
        return 'bg-orange-500/20 text-orange-400 border-orange-500/50'
      case 'MEDIUM':
        return 'bg-yellow-500/20 text-yellow-400 border-yellow-500/50'
      case 'LOW':
        return 'bg-blue-500/20 text-blue-400 border-blue-500/50'
      default:
        return 'bg-gray-500/20 text-gray-400 border-gray-500/50'
    }
  }

  const getSeverityIcon = (severity: string) => {
    switch (severity) {
      case 'CRITICAL':
        return <AlertTriangle className="w-5 h-5 text-red-500" />
      case 'HIGH':
        return <AlertCircle className="w-5 h-5 text-orange-500" />
      case 'MEDIUM':
        return <Bug className="w-5 h-5 text-yellow-500" />
      case 'LOW':
        return <Shield className="w-5 h-5 text-blue-500" />
      default:
        return <Shield className="w-5 h-5 text-gray-500" />
    }
  }

  return (
    <div className="space-y-6">
      {/* Loading State */}
      {isLoading && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50"
        >
          <Card className="bg-gradient-to-br from-gray-900 to-gray-800 border-gray-700">
            <CardContent className="pt-8 pb-8 text-center">
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
                className="flex justify-center mb-4"
              >
                <Zap className="w-12 h-12 text-blue-400" />
              </motion.div>
              <p className="text-lg font-medium text-gray-200">Scanning DVWA...</p>
              <p className="text-sm text-gray-400 mt-2">This may take a moment</p>
            </CardContent>
          </Card>
        </motion.div>
      )}

      {/* Summary Cards */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="grid grid-cols-1 md:grid-cols-5 gap-4"
      >
        {/* Total Vulnerabilities */}
        <Card className="bg-gradient-to-br from-red-900/30 to-red-800/20 border-red-500/20">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-400 text-sm">Total Found</p>
                <p className="text-3xl font-bold text-red-400 mt-1">
                  {result.total_vulnerabilities}
                </p>
              </div>
              <AlertTriangle className="w-10 h-10 text-red-500/40" />
            </div>
          </CardContent>
        </Card>

        {/* Critical */}
        <Card className="bg-gradient-to-br from-red-900/30 to-red-800/20 border-red-500/20">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-400 text-sm">Critical</p>
                <p className="text-3xl font-bold text-red-400 mt-1">
                  {result.severity_breakdown.CRITICAL}
                </p>
              </div>
              <span className="text-2xl">🔴</span>
            </div>
          </CardContent>
        </Card>

        {/* High */}
        <Card className="bg-gradient-to-br from-orange-900/30 to-orange-800/20 border-orange-500/20">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-400 text-sm">High</p>
                <p className="text-3xl font-bold text-orange-400 mt-1">
                  {result.severity_breakdown.HIGH}
                </p>
              </div>
              <span className="text-2xl">🟠</span>
            </div>
          </CardContent>
        </Card>

        {/* Duration */}
        <Card className="bg-gradient-to-br from-blue-900/30 to-blue-800/20 border-blue-500/20">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-400 text-sm">Duration</p>
                <p className="text-3xl font-bold text-blue-400 mt-1">
                  {result.scan_duration.toFixed(1)}s
                </p>
              </div>
              <Clock className="w-10 h-10 text-blue-500/40" />
            </div>
          </CardContent>
        </Card>

        {/* Target */}
        <Card className="bg-gradient-to-br from-purple-900/30 to-purple-800/20 border-purple-500/20">
          <CardContent className="pt-6">
            <div className="flex items-center gap-2">
              <Globe className="w-5 h-5 text-purple-400 flex-shrink-0" />
              <div className="min-w-0 flex-1">
                <p className="text-gray-400 text-sm">Target</p>
                <p className="text-xs font-mono text-purple-300 mt-1 truncate">
                  {result.target.replace('http://', '').replace('https://', '')}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Vulnerabilities List */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.1 }}
      >
        <Card className="bg-gradient-to-br from-gray-900/50 to-gray-800/30 border-gray-700/50">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Bug className="w-5 h-5 text-blue-400" />
              <span>Vulnerabilities Found ({result.total_vulnerabilities})</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            {result.total_vulnerabilities === 0 ? (
              <div className="text-center py-12">
                <CheckCircle2 className="w-16 h-16 text-green-600/40 mx-auto mb-4" />
                <p className="text-gray-300 text-lg font-medium">No Vulnerabilities Found</p>
                <p className="text-gray-400 text-sm mt-1">This target appears to be secure</p>
              </div>
            ) : (
              <div className="space-y-3">
                <AnimatePresence>
                  {result.vulnerabilities.map((vuln, index) => (
                    <motion.div
                      key={index}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.05 }}
                      className="border border-gray-700/50 rounded-lg overflow-hidden bg-gray-800/20 hover:bg-gray-800/40 transition-all"
                    >
                      {/* Vulnerability Header */}
                      <button
                        onClick={() => toggleExpand(index)}
                        className="w-full text-left"
                      >
                        <div className="p-4 flex items-center justify-between hover:bg-gray-800/60 transition-colors">
                          <div className="flex items-start gap-3 flex-1 min-w-0">
                            <div className="mt-0.5 flex-shrink-0">
                              {getSeverityIcon(vuln.severity)}
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2 flex-wrap">
                                <h3 className="font-semibold text-white text-sm md:text-base">
                                  {vuln.name}
                                </h3>
                                <Badge
                                  className={`border ${getSeverityColor(
                                    vuln.severity
                                  )} text-xs font-medium`}
                                >
                                  {vuln.severity}
                                </Badge>
                                <Badge className="bg-gray-700/50 text-gray-300 text-xs font-mono">
                                  {vuln.type}
                                </Badge>
                              </div>
                              <p className="text-xs text-gray-400 mt-2 font-mono">
                                {vuln.path}
                              </p>
                            </div>
                          </div>

                          {/* Expand Icon */}
                          <motion.div
                            animate={{
                              rotate: expandedVulns.has(index) ? 180 : 0,
                            }}
                            transition={{ duration: 0.2 }}
                            className="flex-shrink-0 ml-2"
                          >
                            <ChevronDown className="w-5 h-5 text-gray-400" />
                          </motion.div>
                        </div>
                      </button>

                      {/* Vulnerability Details */}
                      <AnimatePresence>
                        {expandedVulns.has(index) && (
                          <motion.div
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: 'auto' }}
                            exit={{ opacity: 0, height: 0 }}
                            transition={{ duration: 0.2 }}
                            className="border-t border-gray-700/50 bg-gray-800/20"
                          >
                            <div className="p-4 space-y-3">
                              <div>
                                <p className="text-xs font-medium text-gray-400 uppercase tracking-wide">
                                  Description
                                </p>
                                <p className="text-sm text-gray-300 mt-1 leading-relaxed">
                                  {vuln.description}
                                </p>
                              </div>

                              <div className="grid grid-cols-2 gap-4">
                                <div>
                                  <p className="text-xs font-medium text-gray-400 uppercase tracking-wide">
                                    Type
                                  </p>
                                  <p className="text-sm text-gray-200 mt-1 font-mono">{vuln.type}</p>
                                </div>
                                <div>
                                  <p className="text-xs font-medium text-gray-400 uppercase tracking-wide">
                                    Status
                                  </p>
                                  <p className="text-sm text-red-400 mt-1 font-semibold">
                                    {vuln.status}
                                  </p>
                                </div>
                              </div>

                              <div>
                                <p className="text-xs font-medium text-gray-400 uppercase tracking-wide">
                                  Vulnerable Endpoint
                                </p>
                                <div className="bg-gray-900/50 rounded p-2 mt-1 border border-gray-700/50 overflow-auto">
                                  <code className="text-xs text-gray-300 font-mono break-all">
                                    {vuln.path}
                                  </code>
                                </div>
                              </div>

                              {/* Quick Fix Recommendations */}
                              <div className="bg-blue-500/10 border border-blue-500/30 rounded p-3 mt-2">
                                <p className="text-xs font-medium text-blue-400 uppercase tracking-wide mb-1">
                                  Remediation Tip
                                </p>
                                <p className="text-xs text-blue-200">
                                  {getRemediationTip(vuln.type)}
                                </p>
                              </div>

                              {/* Exploit Button */}
                              {onExploit && (
                                <motion.button
                                  whileHover={{ scale: 1.02 }}
                                  whileTap={{ scale: 0.98 }}
                                  onClick={() => onExploit(vuln)}
                                  className="w-full mt-4 bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800 text-white font-semibold py-2 px-4 rounded-lg transition-all duration-200 flex items-center justify-center gap-2"
                                >
                                  <Zap className="w-4 h-4" />
                                  <span>Exploit This Vulnerability</span>
                                </motion.button>
                              )}
                            </div>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </motion.div>
                  ))}
                </AnimatePresence>
              </div>
            )}
          </CardContent>
        </Card>
      </motion.div>

      {/* Scan Info */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.2 }}
        className="bg-gray-900/30 border border-gray-700/50 rounded-lg p-4 flex items-start gap-3"
      >
        <AlertCircle className="w-5 h-5 text-gray-400 flex-shrink-0 mt-0.5" />
        <div className="text-sm text-gray-300 space-y-1">
          <p className="font-medium">Scan Details</p>
          <p className="text-xs text-gray-400">
            Scan ID: <span className="font-mono text-gray-300">{result.scan_id}</span>
          </p>
          <p className="text-xs text-gray-400">
            Timestamp: <span className="font-mono text-gray-300">{result.timestamp}</span>
          </p>
        </div>
      </motion.div>
    </div>
  )
}

// Helper function for remediation tips
function getRemediationTip(type: string): string {
  const tips: Record<string, string> = {
    RCE: 'Validate and sanitize all user inputs. Use parameterized queries and avoid executing user-supplied commands.',
    CSRF: 'Implement CSRF tokens in all state-changing operations. Validate origin and referer headers.',
    SQLi: 'Use prepared statements and parameterized queries. Never concatenate user input into SQL.',
    'Blind SQLi': 'Use parameterized queries exclusively. Implement proper error handling to avoid information leakage.',
    'XSS (Reflected)': 'Encode output based on context (HTML, URL, JavaScript). Use Content Security Policy headers.',
    'XSS (Stored)': 'Sanitize all user inputs on storage and output. Use security libraries for HTML sanitization.',
    'LFI/RFI': 'Whitelist allowed files. Use basename() function. Avoid passing user input to file inclusion functions.',
  }

  return (
    tips[type] ||
    'Review OWASP Top 10 guidelines for this vulnerability type and implement appropriate controls.'
  )
}
