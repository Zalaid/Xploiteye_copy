/**
 * Port Discovery Results Component
 * Displays port scanning results with security analysis
 */

import React from 'react'
import { motion } from 'framer-motion'
import {
  Shield,
  ShieldAlert,
  ShieldCheck,
  ShieldX,
  Server,
  AlertTriangle,
  CheckCircle,
  XCircle,
  Clock,
  Target,
  Network,
  Bug,
  Download,
  RefreshCw,
  Copy
} from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import type {
  PortDiscoveryData,
  GPTAnalysis,
  CVEInfo,
  CVESummary
} from '@/services/portDiscoveryApi'

interface PortDiscoveryResultsProps {
  data?: PortDiscoveryData | null
  analysis?: GPTAnalysis | null
  isLoading?: boolean
  onRescan?: () => void
  onExport?: () => void
}

const getRiskColor = (level: string) => {
  switch (level?.toLowerCase()) {
    case 'critical': return 'text-red-500 bg-red-500/20 border-red-500/30'
    case 'high': return 'text-orange-500 bg-orange-500/20 border-orange-500/30'
    case 'medium': return 'text-yellow-500 bg-yellow-500/20 border-yellow-500/30'
    case 'low': return 'text-green-500 bg-green-500/20 border-green-500/30'
    default: return 'text-gray-500 bg-gray-500/20 border-gray-500/30'
  }
}

const getSeverityColor = (severity: string) => {
  switch (severity?.toLowerCase()) {
    case 'critical': return 'bg-red-500'
    case 'high': return 'bg-orange-500'
    case 'medium': return 'bg-yellow-500'
    case 'low': return 'bg-green-500'
    default: return 'bg-gray-500'
  }
}

const getPortStatusIcon = (status: string) => {
  switch (status?.toLowerCase()) {
    case 'open': return <CheckCircle className="w-5 h-5 text-green-400" />
    case 'closed': return <XCircle className="w-5 h-5 text-red-400" />
    case 'filtered': return <AlertTriangle className="w-5 h-5 text-yellow-400" />
    default: return <XCircle className="w-5 h-5 text-gray-400" />
  }
}

const getRiskIcon = (level: string) => {
  switch (level?.toLowerCase()) {
    case 'critical': return <ShieldX className="w-6 h-6" />
    case 'high': return <ShieldAlert className="w-6 h-6" />
    case 'medium': return <Shield className="w-6 h-6" />
    case 'low': return <ShieldCheck className="w-6 h-6" />
    default: return <Shield className="w-6 h-6" />
  }
}

const getRiskProgress = (level: string) => {
  switch (level?.toLowerCase()) {
    case 'critical': return 100
    case 'high': return 75
    case 'medium': return 50
    case 'low': return 25
    default: return 0
  }
}

export function PortDiscoveryResults({
  data,
  analysis,
  isLoading,
  onRescan,
  onExport
}: PortDiscoveryResultsProps) {
  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text)
  }

  if (isLoading) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center py-12"
      >
        <RefreshCw className="w-8 h-8 text-cyan-400 animate-spin mx-auto mb-4" />
        <div className="text-cyan-400 text-lg font-semibold mb-2">Scanning Port...</div>
        <div className="text-gray-400">Analyzing service and checking for vulnerabilities</div>
      </motion.div>
    )
  }

  if (!data || !analysis) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center py-12"
      >
        <Target className="w-12 h-12 text-gray-400 mx-auto mb-4" />
        <div className="text-gray-400 text-lg mb-2">No Port Discovery Results</div>
        <div className="text-gray-500 text-sm">Start a port scan to see detailed results here</div>
      </motion.div>
    )
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-6"
    >
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <Network className="w-6 h-6 text-cyan-400" />
          <div>
            <h2 className="text-xl font-bold text-white">Port Discovery Results</h2>
            <div className="text-sm text-gray-400">
              {data.target}:{data.port} • {new Date(data.timestamp).toLocaleString()}
            </div>
          </div>
        </div>
        <div className="flex space-x-2">
          {onRescan && (
            <Button
              onClick={onRescan}
              variant="outline"
              size="sm"
              className="border-cyan-500/30 text-cyan-400 hover:bg-cyan-500/10"
            >
              <RefreshCw className="w-4 h-4 mr-2" />
              Rescan
            </Button>
          )}
          {onExport && (
            <Button
              onClick={onExport}
              variant="outline"
              size="sm"
              className="border-green-500/30 text-green-400 hover:bg-green-500/10"
            >
              <Download className="w-4 h-4 mr-2" />
              Export
            </Button>
          )}
        </div>
      </div>

      {/* Status and Service Overview */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Port Status */}
        <Card className="bg-gray-800/50 border-gray-700/50">
          <CardContent className="p-4">
            <div className="flex items-center space-x-3">
              {getPortStatusIcon(data.results.port_state)}
              <div>
                <div className="text-sm font-medium text-white">Port Status</div>
                <div className="text-lg font-bold text-gray-300 capitalize">
                  {data.results.port_state}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Service Info */}
        <Card className="bg-gray-800/50 border-gray-700/50">
          <CardContent className="p-4">
            <div className="flex items-center space-x-3">
              <Server className="w-5 h-5 text-blue-400" />
              <div>
                <div className="text-sm font-medium text-white">Service</div>
                <div className="text-lg font-bold text-gray-300">
                  {data.results.service_name || 'Unknown'}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Risk Level */}
        <Card className="bg-gray-800/50 border-gray-700/50">
          <CardContent className="p-4">
            <div className="flex items-center space-x-3">
              <div className={getRiskColor(analysis.security_assessment?.risk_level)}>
                {getRiskIcon(analysis.security_assessment?.risk_level)}
              </div>
              <div>
                <div className="text-sm font-medium text-white">Risk Level</div>
                <div className={`text-lg font-bold capitalize ${getRiskColor(analysis.security_assessment?.risk_level)}`}>
                  {analysis.security_assessment?.risk_level || 'Unknown'}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* CVE Count */}
        <Card className="bg-gray-800/50 border-gray-700/50">
          <CardContent className="p-4">
            <div className="flex items-center space-x-3">
              <Bug className="w-5 h-5 text-red-400" />
              <div>
                <div className="text-sm font-medium text-white">Vulnerabilities</div>
                <div className="text-lg font-bold text-red-400">
                  {analysis.security_assessment?.vulnerabilities_found || data.results.cves?.length || 0}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Risk Assessment */}
      {analysis.security_assessment && (
        <Card className="bg-gray-800/50 border-gray-700/50">
          <CardHeader>
            <CardTitle className="text-white flex items-center space-x-2">
              <Shield className="w-5 h-5 text-cyan-400" />
              <span>Security Assessment</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-gray-300">Overall Risk Level</span>
              <Badge className={getRiskColor(analysis.security_assessment.risk_level)}>
                {analysis.security_assessment.risk_level?.toUpperCase()}
              </Badge>
            </div>

            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-gray-400">Risk Score</span>
                <span className="text-gray-300">{getRiskProgress(analysis.security_assessment.risk_level)}/100</span>
              </div>
              <Progress
                value={getRiskProgress(analysis.security_assessment.risk_level)}
                className="h-2"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <div className="text-sm font-medium text-white">Exploitable</div>
                <div className={`text-sm font-semibold ${analysis.security_assessment.exploitable ? 'text-red-400' : 'text-green-400'}`}>
                  {analysis.security_assessment.exploitable ? 'YES' : 'NO'}
                </div>
              </div>
              <div className="space-y-2">
                <div className="text-sm font-medium text-white">CVEs Found</div>
                <div className="text-sm font-semibold text-orange-400">
                  {analysis.security_assessment.vulnerabilities_found}
                </div>
              </div>
            </div>

            {analysis.security_assessment.recommendations && analysis.security_assessment.recommendations.length > 0 && (
              <div className="space-y-2">
                <div className="text-sm font-medium text-white">Recommendations</div>
                <ul className="list-disc list-inside space-y-1">
                  {analysis.security_assessment.recommendations.map((rec, index) => (
                    <li key={index} className="text-sm text-gray-300">{rec}</li>
                  ))}
                </ul>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Technical Details */}
      {analysis.technical_details && (
        <Card className="bg-gray-800/50 border-gray-700/50">
          <CardHeader>
            <CardTitle className="text-white flex items-center space-x-2">
              <Server className="w-5 h-5 text-cyan-400" />
              <span>Technical Details</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-gray-400">Port</span>
                  <span className="text-white font-mono">{analysis.technical_details.port}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Protocol</span>
                  <span className="text-white font-mono">{analysis.technical_details.protocol}</span>
                </div>
              </div>
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-gray-400">Service</span>
                  <span className="text-white font-mono text-right">{analysis.technical_details.service}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Version</span>
                  <span className="text-white font-mono text-right">{analysis.technical_details.version}</span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* CVE Details */}
      {(analysis.cve_summary && analysis.cve_summary.length > 0) || (data.results.cves && data.results.cves.length > 0) && (
        <Card className="bg-gray-800/50 border-gray-700/50">
          <CardHeader>
            <CardTitle className="text-white flex items-center space-x-2">
              <Bug className="w-5 h-5 text-red-400" />
              <span>Vulnerabilities Found</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {(analysis.cve_summary || data.results.cves || []).map((cve: CVESummary | CVEInfo, index) => (
                <div key={index} className="p-4 bg-gray-900/50 rounded-lg border border-gray-700/50">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center space-x-3">
                      <code className="text-cyan-400 font-mono text-sm bg-gray-800 px-2 py-1 rounded">
                        {cve.cve_id}
                      </code>
                      <Badge className={`${getSeverityColor(cve.severity)} text-white text-xs`}>
                        {cve.severity?.toUpperCase()}
                      </Badge>
                      {'exploitable' in cve && (
                        <Badge variant={cve.exploitable ? "destructive" : "secondary"} className="text-xs">
                          {cve.exploitable ? 'EXPLOITABLE' : 'NOT EXPLOITABLE'}
                        </Badge>
                      )}
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => copyToClipboard(cve.cve_id)}
                      className="text-gray-400 hover:text-white"
                    >
                      <Copy className="w-4 h-4" />
                    </Button>
                  </div>
                  <p className="text-gray-300 text-sm leading-relaxed">
                    {'description' in cve ? cve.description : ('summary' in cve ? cve.summary : 'No description available')}
                  </p>
                  {'cvss_score' in cve && cve.cvss_score && (
                    <div className="mt-2 text-xs text-gray-400">
                      CVSS Score: {cve.cvss_score}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Next Steps */}
      {analysis.next_steps && analysis.next_steps.length > 0 && (
        <Card className="bg-gray-800/50 border-gray-700/50">
          <CardHeader>
            <CardTitle className="text-white flex items-center space-x-2">
              <Clock className="w-5 h-5 text-green-400" />
              <span>Recommended Next Steps</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {analysis.next_steps.map((step, index) => (
                <div key={index} className="flex items-start space-x-3">
                  <div className="w-6 h-6 bg-cyan-500/20 border border-cyan-500/30 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                    <span className="text-cyan-400 text-sm font-semibold">{index + 1}</span>
                  </div>
                  <p className="text-gray-300 text-sm">{step}</p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </motion.div>
  )
}