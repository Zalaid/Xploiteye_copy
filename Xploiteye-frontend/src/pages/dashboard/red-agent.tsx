"use client"

import React from 'react';
import Head from 'next/head';
import { DashboardLayout } from '@/components/layouts/DashboardLayout';
import { useState } from "react"
import { motion } from "framer-motion"
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
} from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"

const taskQueue = [
  {
    id: 1,
    target: "webapp-prod.example.com",
    task: "Exploit SQL Injection",
    cve: "CVE-2023-1234",
    status: "running",
    progress: 65,
    priority: "high",
    exploitType: "Web Application",
    payloadGenerated: true,
    estimatedTime: "15 min",
  },
  {
    id: 2,
    target: "api.example.com",
    task: "Generate XSS PoC",
    cve: "CVE-2023-5678",
    status: "queued",
    progress: 0,
    priority: "medium",
    exploitType: "API Endpoint",
    payloadGenerated: false,
    estimatedTime: "8 min",
  },
  {
    id: 3,
    target: "staging.example.com",
    task: "Directory Traversal Test",
    cve: null,
    status: "completed",
    progress: 100,
    priority: "low",
    exploitType: "File System",
    payloadGenerated: true,
    estimatedTime: "Completed",
  },
]

const cveLibrary = [
  {
    id: "CVE-2023-1234",
    title: "SQL Injection in Web Applications",
    severity: "critical",
    score: 9.8,
    exploitAvailable: true,
    description: "A critical SQL injection vulnerability affecting login forms",
    attackVector: "Network",
    complexity: "Low",
    privilegesRequired: "None",
    userInteraction: "None",
    scope: "Changed",
    confidentiality: "High",
    integrity: "High",
    availability: "High",
  },
  {
    id: "CVE-2023-5678",
    title: "Cross-Site Scripting (XSS)",
    severity: "high",
    score: 7.5,
    exploitAvailable: true,
    description: "Stored XSS vulnerability in search functionality",
    attackVector: "Network",
    complexity: "Low",
    privilegesRequired: "Low",
    userInteraction: "Required",
    scope: "Changed",
    confidentiality: "Low",
    integrity: "Low",
    availability: "None",
  },
  {
    id: "CVE-2023-9012",
    title: "Remote Code Execution",
    severity: "critical",
    score: 9.9,
    exploitAvailable: false,
    description: "RCE vulnerability in file upload functionality",
    attackVector: "Network",
    complexity: "Low",
    privilegesRequired: "None",
    userInteraction: "None",
    scope: "Changed",
    confidentiality: "High",
    integrity: "High",
    availability: "High",
  },
]

const executionLogs = [
  {
    id: 1,
    timestamp: "15:42:33",
    level: "info",
    message: "Starting SQL injection exploit against webapp-prod.example.com",
    category: "exploit",
  },
  {
    id: 2,
    timestamp: "15:42:35",
    level: "success",
    message: "Successfully bypassed authentication",
    category: "authentication",
  },
  {
    id: 3,
    timestamp: "15:42:37",
    level: "warning",
    message: "Database enumeration in progress",
    category: "enumeration",
  },
  {
    id: 4,
    timestamp: "15:42:40",
    level: "success",
    message: "Extracted 1,247 user records",
    category: "data-extraction",
  },
  {
    id: 5,
    timestamp: "15:42:42",
    level: "info",
    message: "Generating exploitation report",
    category: "reporting",
  },
]

const exploitTemplates = [
  {
    id: 1,
    name: "SQL Injection - Union Based",
    category: "Web Application",
    difficulty: "Medium",
    payload: "' UNION SELECT 1,2,3,database(),user(),version()--",
    description: "Extract database information using UNION-based SQL injection",
  },
  {
    id: 2,
    name: "XSS - Stored Payload",
    category: "Web Application",
    difficulty: "Easy",
    payload: "<script>alert('XSS')</script>",
    description: "Basic stored XSS payload for testing input validation",
  },
  {
    id: 3,
    name: "Command Injection - Linux",
    category: "System",
    difficulty: "Hard",
    payload: "; cat /etc/passwd",
    description: "Execute system commands through vulnerable input fields",
  },
]

const attackPaths = [
  {
    id: 1,
    name: "Web App → Database → Privilege Escalation",
    steps: ["SQL Injection", "Database Access", "Credential Extraction", "Lateral Movement"],
    riskLevel: "Critical",
    estimatedImpact: "Full System Compromise",
  },
  {
    id: 2,
    name: "API → Service Account → Internal Network",
    steps: ["API Exploitation", "Service Token", "Network Scanning", "Service Discovery"],
    riskLevel: "High",
    estimatedImpact: "Internal Network Access",
  },
]

export function RedAgentDashboard() {
  const [selectedTask, setSelectedTask] = useState<number | null>(null)
  const [selectedCVE, setSelectedCVE] = useState<string | null>(null)
  const [customPayload, setCustomPayload] = useState("")

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

  return (
    <div className="space-y-6">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-center justify-between"
      >
        <div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-red-400 via-lime-400 to-green-400 bg-clip-text text-transparent">
            Red Agent Dashboard
          </h1>
          <p className="text-muted-foreground mt-1">Offensive security operations and exploit development</p>
        </div>
        <div className="flex items-center space-x-2">
          <Badge className="bg-red-500/20 text-red-400 border-red-500/30 animate-pulse">
            <Bot className="w-3 h-3 mr-1" />
            Agent Active
          </Badge>
          <Badge className="bg-lime-500/20 text-lime-400 border-lime-500/30">
            <Flame className="w-3 h-3 mr-1" />3 Active Exploits
          </Badge>
        </div>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="grid grid-cols-1 md:grid-cols-5 gap-4"
      >
        <Card className="bg-gradient-to-br from-red-500/10 to-orange-500/10 border-red-500/20">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Active Exploits</p>
                <p className="text-2xl font-bold text-red-400">3</p>
              </div>
              <motion.div
                animate={{ rotate: [0, 360] }}
                transition={{ duration: 2, repeat: Number.POSITIVE_INFINITY, ease: "linear" }}
              >
                <Crosshair className="w-8 h-8 text-red-400" />
              </motion.div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-lime-500/10 to-green-500/10 border-lime-500/20">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Payloads Generated</p>
                <p className="text-2xl font-bold text-lime-400">47</p>
              </div>
              <motion.div whileHover={{ scale: 1.1, rotate: 10 }} transition={{ type: "spring", stiffness: 300 }}>
                <Code className="w-8 h-8 text-lime-400" />
              </motion.div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-yellow-500/10 to-orange-500/10 border-yellow-500/20">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">CVEs Analyzed</p>
                <p className="text-2xl font-bold text-yellow-400">156</p>
              </div>
              <motion.div
                animate={{ y: [0, -5, 0] }}
                transition={{ duration: 1.5, repeat: Number.POSITIVE_INFINITY, ease: "easeInOut" }}
              >
                <Bug className="w-8 h-8 text-yellow-400" />
              </motion.div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-purple-500/10 to-pink-500/10 border-purple-500/20">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Success Rate</p>
                <p className="text-2xl font-bold text-purple-400">87%</p>
              </div>
              <motion.div whileHover={{ scale: 1.2 }} transition={{ type: "spring", stiffness: 400 }}>
                <Target className="w-8 h-8 text-purple-400" />
              </motion.div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-cyan-500/10 to-blue-500/10 border-cyan-500/20">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Compromised</p>
                <p className="text-2xl font-bold text-cyan-400">12</p>
              </div>
              <motion.div
                animate={{ rotate: [0, 15, -15, 0] }}
                transition={{ duration: 2, repeat: Number.POSITIVE_INFINITY, ease: "easeInOut" }}
              >
                <Shield className="w-8 h-8 text-cyan-400" />
              </motion.div>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      <Tabs defaultValue="tasks" className="space-y-6">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="tasks">Active Tasks</TabsTrigger>
          <TabsTrigger value="cve">CVE Library</TabsTrigger>
          <TabsTrigger value="payloads">Exploit Payloads</TabsTrigger>
          <TabsTrigger value="logs">Execution Logs</TabsTrigger>
        </TabsList>

        <TabsContent value="tasks" className="space-y-6">
          <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.1 }}>
            <Card className="bg-gradient-to-br from-red-500/5 to-orange-500/5 border-red-500/20">
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Target className="w-5 h-5 text-red-400" />
                  <span>Active Task Queue</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Target</TableHead>
                      <TableHead>Task</TableHead>
                      <TableHead>Type</TableHead>
                      <TableHead>Priority</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Progress</TableHead>
                      <TableHead>ETA</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {taskQueue.map((task) => (
                      <TableRow key={task.id}>
                        <TableCell>
                          <div>
                            <p className="font-medium">{task.target}</p>
                            {task.cve && (
                              <Badge variant="outline" className="mt-1 text-xs">
                                {task.cve}
                              </Badge>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>{task.task}</TableCell>
                        <TableCell>
                          <Badge variant="outline" className="text-xs">
                            {task.exploitType}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline" className={getPriorityColor(task.priority)}>
                            {task.priority.toUpperCase()}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center space-x-2">
                            {getStatusIcon(task.status)}
                            <span className="capitalize">{task.status}</span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="space-y-1">
                            <Progress value={task.progress} className="h-2" />
                            <span className="text-xs text-muted-foreground">{task.progress}%</span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <span className="text-xs text-muted-foreground">{task.estimatedTime}</span>
                        </TableCell>
                        <TableCell>
                          <div className="flex space-x-1">
                            <motion.div whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }}>
                              <Button variant="ghost" size="sm" onClick={() => setSelectedTask(task.id)}>
                                <Eye className="w-3 h-3" />
                              </Button>
                            </motion.div>
                            <motion.div whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }}>
                              <Button variant="ghost" size="sm">
                                <Play className="w-3 h-3" />
                              </Button>
                            </motion.div>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </motion.div>
        </TabsContent>

        <TabsContent value="cve" className="space-y-6">
          <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.2 }}>
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Code className="w-5 h-5 text-red-400" />
                  <span>CVE Library & Analysis</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {cveLibrary.map((cve) => (
                  <div key={cve.id} className="p-4 bg-muted/50 rounded-lg border">
                    <div className="flex items-center justify-between mb-3">
                      <Badge variant="outline" className="text-xs font-mono">
                        {cve.id}
                      </Badge>
                      <div className="flex space-x-2">
                        <Badge variant="outline" className={getSeverityColor(cve.severity)}>
                          {cve.score}
                        </Badge>
                        <Badge
                          variant="outline"
                          className={
                            cve.exploitAvailable ? "bg-green-500/20 text-green-400" : "bg-gray-500/20 text-gray-400"
                          }
                        >
                          {cve.exploitAvailable ? "Exploit Available" : "No Exploit"}
                        </Badge>
                      </div>
                    </div>
                    <p className="text-sm font-medium mb-2">{cve.title}</p>
                    <p className="text-xs text-muted-foreground mb-3">{cve.description}</p>

                    <div className="grid grid-cols-2 md:grid-cols-4 gap-2 mb-3">
                      <div className="text-xs">
                        <span className="text-muted-foreground">Vector:</span> {cve.attackVector}
                      </div>
                      <div className="text-xs">
                        <span className="text-muted-foreground">Complexity:</span> {cve.complexity}
                      </div>
                      <div className="text-xs">
                        <span className="text-muted-foreground">Privileges:</span> {cve.privilegesRequired}
                      </div>
                      <div className="text-xs">
                        <span className="text-muted-foreground">Interaction:</span> {cve.userInteraction}
                      </div>
                    </div>

                    <div className="flex items-center justify-between">
                      <div className="flex space-x-2">
                        <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setSelectedCVE(cve.id)}
                            className="bg-cyan-500/20 text-cyan-400 hover:bg-cyan-500/30"
                          >
                            <Eye className="w-3 h-3 mr-1" />
                            Analyze
                          </Button>
                        </motion.div>
                        <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                          <Button variant="ghost" size="sm" className="bg-red-500/20 text-red-400 hover:bg-red-500/30">
                            <Play className="w-3 h-3 mr-1" />
                            Exploit
                          </Button>
                        </motion.div>
                      </div>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
          </motion.div>
        </TabsContent>

        <TabsContent value="payloads" className="space-y-6">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Zap className="w-5 h-5 text-lime-400" />
                  <span>Exploit Payload Generator</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-4">
                    <h4 className="font-medium">Payload Templates</h4>
                    {exploitTemplates.map((template) => (
                      <div key={template.id} className="p-3 bg-muted/50 rounded-lg border">
                        <div className="flex items-center justify-between mb-2">
                          <p className="font-medium text-sm">{template.name}</p>
                          <Badge variant="outline" className="text-xs">
                            {template.difficulty}
                          </Badge>
                        </div>
                        <p className="text-xs text-muted-foreground mb-2">{template.description}</p>
                        <div className="bg-black/50 p-2 rounded font-mono text-xs text-lime-400 mb-2">
                          {template.payload}
                        </div>
                        <Button variant="ghost" size="sm" className="w-full">
                          <Code className="w-3 h-3 mr-1" />
                          Use Template
                        </Button>
                      </div>
                    ))}
                  </div>

                  <div className="space-y-4">
                    <h4 className="font-medium">Custom Payload Builder</h4>
                    <div className="space-y-3">
                      <Input placeholder="Target URL or endpoint" />
                      <Textarea
                        placeholder="Enter custom payload..."
                        value={customPayload}
                        onChange={(e) => setCustomPayload(e.target.value)}
                        className="font-mono text-sm"
                      />
                      <div className="flex space-x-2">
                        <Button className="flex-1">
                          <Zap className="w-3 h-3 mr-1" />
                          Generate
                        </Button>
                        <Button variant="outline">
                          <Play className="w-3 h-3 mr-1" />
                          Test
                        </Button>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </TabsContent>

        <TabsContent value="logs" className="space-y-6">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5 }}>
            <Card className="bg-black/50 border-red-500/20">
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Terminal className="w-5 h-5 text-red-400" />
                  <span className="text-red-400">Real-time Execution Logs</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-64 overflow-y-auto bg-black/80 rounded-lg p-3 font-mono text-sm space-y-1">
                  {executionLogs.map((log) => (
                    <div key={log.id} className="flex items-center space-x-3">
                      <span className="text-gray-500 text-xs">{log.timestamp}</span>
                      <Badge
                        variant="outline"
                        className={`text-xs ${
                          log.level === "error"
                            ? "bg-red-500/20 text-red-400"
                            : log.level === "warning"
                              ? "bg-yellow-500/20 text-yellow-400"
                              : log.level === "success"
                                ? "bg-green-500/20 text-green-400"
                                : "bg-cyan-500/20 text-cyan-400"
                        }`}
                      >
                        {log.level.toUpperCase()}
                      </Badge>
                      <Badge variant="outline" className="text-xs bg-purple-500/20 text-purple-400">
                        {log.category}
                      </Badge>
                      <span
                        className={
                          log.level === "error"
                            ? "text-red-400"
                            : log.level === "warning"
                              ? "text-yellow-400"
                              : log.level === "success"
                                ? "text-green-400"
                                : "text-cyan-400"
                        }
                      >
                        {log.message}
                      </span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </TabsContent>
      </Tabs>
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
