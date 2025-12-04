"use client"

import React from 'react'
import Head from 'next/head'
import { DashboardLayout } from '@/components/layouts/DashboardLayout'
import { motion } from 'framer-motion'
import { Globe, Zap, AlertTriangle, CheckCircle2, History, BarChart3 } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { WebScanning } from '@/components/dashboard/WebScanning'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'

interface ScanHistory {
  id: string
  url: string
  environment: string
  timestamp: string
  status: 'completed' | 'failed' | 'running'
  vulnerabilitiesFound: number
}

export default function WebScanningPage() {
  const [scanHistory, setScanHistory] = React.useState<ScanHistory[]>([])
  const [recentScans, setRecentScans] = React.useState<ScanHistory[]>([])

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

          {/* Stats Cards */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.1 }}
            className="grid grid-cols-1 md:grid-cols-4 gap-4"
          >
            <Card className="bg-gradient-to-br from-blue-900/30 to-blue-800/20 border-blue-500/20">
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-gray-400 text-sm">Total Scans</p>
                    <p className="text-2xl font-bold text-blue-400 mt-1">{recentScans.length}</p>
                  </div>
                  <Globe className="w-8 h-8 text-blue-500/40" />
                </div>
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-br from-green-900/30 to-green-800/20 border-green-500/20">
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-gray-400 text-sm">Completed</p>
                    <p className="text-2xl font-bold text-green-400 mt-1">
                      {recentScans.filter((s) => s.status === 'completed').length}
                    </p>
                  </div>
                  <CheckCircle2 className="w-8 h-8 text-green-500/40" />
                </div>
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-br from-yellow-900/30 to-yellow-800/20 border-yellow-500/20">
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-gray-400 text-sm">Running</p>
                    <p className="text-2xl font-bold text-yellow-400 mt-1">
                      {recentScans.filter((s) => s.status === 'running').length}
                    </p>
                  </div>
                  <Zap className="w-8 h-8 text-yellow-500/40" />
                </div>
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-br from-red-900/30 to-red-800/20 border-red-500/20">
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-gray-400 text-sm">Vulns Found</p>
                    <p className="text-2xl font-bold text-red-400 mt-1">
                      {recentScans.reduce((sum, s) => sum + s.vulnerabilitiesFound, 0)}
                    </p>
                  </div>
                  <AlertTriangle className="w-8 h-8 text-red-500/40" />
                </div>
              </CardContent>
            </Card>
          </motion.div>

          {/* Tabs */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.2 }}
          >
            <Tabs defaultValue="scanner" className="space-y-6">
              <TabsList className="grid w-full grid-cols-2 bg-gray-900/50 border border-gray-800">
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
              </TabsList>

              {/* Scanner Tab */}
              <TabsContent value="scanner" className="space-y-6">
                <WebScanning onScanStart={handleWebScanStart} />
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
            </Tabs>
          </motion.div>
        </div>
      </DashboardLayout>
    </>
  )
}
