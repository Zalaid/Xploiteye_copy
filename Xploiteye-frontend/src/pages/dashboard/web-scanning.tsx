"use client"

import React from 'react'
import Head from 'next/head'
import { DashboardLayout } from '@/components/layouts/DashboardLayout'
import { motion } from 'framer-motion'
import { Globe, Zap, CheckCircle2, History, Flame, AlertTriangle, Copy } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { WebScanning } from '@/components/dashboard/WebScanning'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { DVWAVulnerability } from '@/services/dvwaApi'

interface ScanHistory {
  id: string
  url: string
  environment: string
  timestamp: string
  status: 'completed' | 'failed' | 'running'
  vulnerabilitiesFound: number
}

interface ExploitationData {
  vulnerability: DVWAVulnerability
  timestamp: string
  status: 'ready' | 'exploiting' | 'completed' | 'failed'
  payload?: string
  result?: string
}

export default function WebScanningPage() {
  const [recentScans, setRecentScans] = React.useState<ScanHistory[]>([])
  const [selectedExploit, setSelectedExploit] = React.useState<ExploitationData | null>(null)
  const [exploitHistory, setExploitHistory] = React.useState<ExploitationData[]>([])
  const [activeTab, setActiveTab] = React.useState('scanner')

  const handleExploit = (vulnerability: DVWAVulnerability) => {
    const exploitData: ExploitationData = {
      vulnerability,
      timestamp: new Date().toLocaleString(),
      status: 'ready',
    }
    setSelectedExploit(exploitData)
    setExploitHistory([exploitData, ...exploitHistory.slice(0, 9)])
    setActiveTab('exploitation')
  }

  const handleWebScanStart = (url: string, config: { isLive: boolean; isLab: boolean }) => {
    const environments = []
    if (config.isLive) environments.push('Live')
    if (config.isLab) environments.push('Lab')

    const newScan: ScanHistory = {
      id: `scan-${Date.now()}`,
      url,
      environment: environments.join(' + '),
      timestamp: new Date().toLocaleString(),
      status: 'running',
      vulnerabilitiesFound: 0,
    }

    setRecentScans([newScan, ...recentScans.slice(0, 4)])

    // Simulate scan completion after 3 seconds
    setTimeout(() => {
      setRecentScans((prev) =>
        prev.map((scan) =>
          scan.id === newScan.id
            ? {
                ...scan,
                status: 'completed',
                vulnerabilitiesFound: Math.floor(Math.random() * 15) + 1,
              }
            : scan
        )
      )
    }, 3000)
  }

  return (
    <>
      <Head>
        <title>Web Scanning | XploitEye</title>
        <meta name="description" content="Web Application Vulnerability Scanning" />
      </Head>

      <DashboardLayout>
        <div className="space-y-6">
          {/* Header */}
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
            className="flex items-center justify-between"
          >
            <div>
              <h1 className="text-3xl font-bold flex items-center space-x-2">
                <Globe className="w-8 h-8 text-blue-400" />
                <span>Web Application Scanning</span>
              </h1>
              <p className="text-gray-400 mt-2">Discover and analyze web vulnerabilities in real-time</p>
            </div>
          </motion.div>

          {/* Tabs */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.2 }}
          >
            <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
              <TabsList className="grid w-full grid-cols-3 bg-gray-900/50 border border-gray-800">
                <TabsTrigger
                  value="scanner"
                  className="data-[state=active]:bg-blue-500/20 data-[state=active]:text-blue-400"
                >
                  <Zap className="w-4 h-4 mr-2" />
                  Web Scanner
                </TabsTrigger>
                <TabsTrigger
                  value="history"
                  className="data-[state=active]:bg-blue-500/20 data-[state=active]:text-blue-400"
                >
                  <History className="w-4 h-4 mr-2" />
                  Scan History
                </TabsTrigger>
                <TabsTrigger
                  value="exploitation"
                  className="data-[state=active]:bg-red-500/20 data-[state=active]:text-red-400"
                >
                  <Flame className="w-4 h-4 mr-2" />
                  Exploitation
                </TabsTrigger>
              </TabsList>

              {/* Scanner Tab */}
              <TabsContent value="scanner" className="space-y-6">
                <WebScanning onScanStart={handleWebScanStart} onExploit={handleExploit} />
              </TabsContent>

              {/* History Tab */}
              <TabsContent value="history" className="space-y-6">
                <Card className="bg-gradient-to-br from-gray-900/50 to-gray-800/30 border-gray-700/50">
                  <CardHeader>
                    <CardTitle className="flex items-center space-x-2">
                      <History className="w-5 h-5 text-gray-400" />
                      <span>Recent Scans</span>
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    {recentScans.length === 0 ? (
                      <div className="text-center py-12">
                        <Globe className="w-16 h-16 text-gray-600 mx-auto mb-4" />
                        <p className="text-gray-400 text-lg">No scans yet</p>
                        <p className="text-gray-500 text-sm mt-1">Start a web scan to see results here</p>
                      </div>
                    ) : (
                      <div className="space-y-3">
                        {recentScans.map((scan) => (
                          <motion.div
                            key={scan.id}
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            className="flex items-center justify-between p-4 rounded-lg border border-gray-700/50 bg-gray-800/30 hover:bg-gray-800/50 transition-all"
                          >
                            <div className="flex-1">
                              <div className="flex items-center space-x-3">
                                {scan.status === 'running' && (
                                  <motion.div
                                    animate={{ rotate: 360 }}
                                    transition={{ duration: 1, repeat: Infinity }}
                                  >
                                    <Zap className="w-4 h-4 text-yellow-400" />
                                  </motion.div>
                                )}
                                {scan.status === 'completed' && (
                                  <CheckCircle2 className="w-4 h-4 text-green-400" />
                                )}
                                <div>
                                  <p className="font-medium text-white">{scan.url}</p>
                                  <p className="text-sm text-gray-400">
                                    {scan.environment} • {scan.timestamp}
                                  </p>
                                </div>
                              </div>
                            </div>
                            <div className="text-right ml-4">
                              <p className="text-sm font-medium text-gray-300">
                                {scan.vulnerabilitiesFound} found
                              </p>
                              <p
                                className={`text-xs mt-1 ${
                                  scan.status === 'running'
                                    ? 'text-yellow-400'
                                    : 'text-green-400'
                                }`}
                              >
                                {scan.status === 'running' ? 'Scanning...' : 'Completed'}
                              </p>
                            </div>
                          </motion.div>
                        ))}
                      </div>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>

              {/* Exploitation Tab */}
              <TabsContent value="exploitation" className="space-y-6">
                {selectedExploit ? (
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.4 }}
                    className="space-y-6"
                  >
                    {/* Selected Vulnerability Card */}
                    <Card className="bg-gradient-to-br from-red-900/30 to-red-800/20 border-red-500/20">
                      <CardHeader>
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <Flame className="w-6 h-6 text-red-400" />
                            <div>
                              <CardTitle>Exploitation Target</CardTitle>
                              <p className="text-xs text-gray-400 mt-1">
                                {selectedExploit.timestamp}
                              </p>
                            </div>
                          </div>
                          <Badge
                            className={`${
                              selectedExploit.status === 'completed'
                                ? 'bg-green-500/20 text-green-400 border-green-500/50'
                                : selectedExploit.status === 'exploiting'
                                ? 'bg-yellow-500/20 text-yellow-400 border-yellow-500/50'
                                : 'bg-gray-500/20 text-gray-400 border-gray-500/50'
                            } border`}
                          >
                            {selectedExploit.status.toUpperCase()}
                          </Badge>
                        </div>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <p className="text-xs font-medium text-gray-400 uppercase tracking-wide">
                              Vulnerability
                            </p>
                            <p className="text-sm text-white font-medium mt-2">
                              {selectedExploit.vulnerability.name}
                            </p>
                          </div>
                          <div>
                            <p className="text-xs font-medium text-gray-400 uppercase tracking-wide">
                              Type
                            </p>
                            <p className="text-sm text-white font-medium mt-2">
                              {selectedExploit.vulnerability.type}
                            </p>
                          </div>
                        </div>

                        <div>
                          <p className="text-xs font-medium text-gray-400 uppercase tracking-wide">
                            Severity
                          </p>
                          <div className="mt-2">
                            <Badge
                              className={`${
                                selectedExploit.vulnerability.severity === 'CRITICAL'
                                  ? 'bg-red-500/20 text-red-400 border-red-500/50'
                                  : 'bg-orange-500/20 text-orange-400 border-orange-500/50'
                              } border`}
                            >
                              {selectedExploit.vulnerability.severity}
                            </Badge>
                          </div>
                        </div>

                        <div>
                          <p className="text-xs font-medium text-gray-400 uppercase tracking-wide">
                            Description
                          </p>
                          <p className="text-sm text-gray-300 mt-2 leading-relaxed">
                            {selectedExploit.vulnerability.description}
                          </p>
                        </div>

                        <div>
                          <p className="text-xs font-medium text-gray-400 uppercase tracking-wide">
                            Vulnerable Endpoint
                          </p>
                          <div className="bg-gray-900/50 rounded p-3 mt-2 border border-gray-700/50 flex items-center justify-between group">
                            <code className="text-xs text-gray-300 font-mono break-all">
                              {selectedExploit.vulnerability.path}
                            </code>
                            <motion.button
                              whileHover={{ scale: 1.1 }}
                              whileTap={{ scale: 0.95 }}
                              className="opacity-0 group-hover:opacity-100 transition-opacity p-2"
                              onClick={() => {
                                navigator.clipboard.writeText(selectedExploit.vulnerability.path)
                              }}
                            >
                              <Copy className="w-4 h-4 text-gray-400 hover:text-gray-200" />
                            </motion.button>
                          </div>
                        </div>
                      </CardContent>
                    </Card>

                    {/* Exploitation Actions */}
                    <Card className="bg-gradient-to-br from-gray-900/50 to-gray-800/30 border-gray-700/50">
                      <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                          <AlertTriangle className="w-5 h-5 text-yellow-400" />
                          Exploitation Options
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        <motion.button
                          whileHover={{ scale: 1.02 }}
                          whileTap={{ scale: 0.98 }}
                          className="w-full mt-6 bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800 text-white font-semibold py-3 rounded-lg transition-all duration-200 flex items-center justify-center gap-2"
                          onClick={() => {
                            // Simulate exploitation
                            setSelectedExploit({
                              ...selectedExploit,
                              status: 'exploiting',
                            })
                            setTimeout(() => {
                              setSelectedExploit({
                                ...selectedExploit,
                                status: 'completed',
                                result: 'Exploitation successful! System compromised.',
                              })
                            }, 2000)
                          }}
                        >
                          <Flame className="w-5 h-5" />
                          <span>Launch Exploitation</span>
                        </motion.button>
                      </CardContent>
                    </Card>
                  </motion.div>
                ) : (
                  <Card className="bg-gradient-to-br from-gray-900/50 to-gray-800/30 border-gray-700/50">
                    <CardContent className="pt-8">
                      <div className="text-center py-12">
                        <Flame className="w-16 h-16 text-gray-600 mx-auto mb-4" />
                        <p className="text-gray-400 text-lg">No vulnerability selected</p>
                        <p className="text-gray-500 text-sm mt-1">
                          Expand a vulnerability and click "Exploit This Vulnerability" to begin
                        </p>
                      </div>
                    </CardContent>
                  </Card>
                )}
              </TabsContent>
            </Tabs>
          </motion.div>
        </div>
      </DashboardLayout>
    </>
  )
}
