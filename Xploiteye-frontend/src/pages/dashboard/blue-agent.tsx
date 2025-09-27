"use client"

import React from 'react';
import Head from 'next/head';
import { DashboardLayout } from '@/components/layouts/DashboardLayout';
import { useState } from "react"
import { motion } from "framer-motion"
import {
  Shield,
  CheckCircle,
  Clock,
  AlertTriangle,
  TrendingUp,
  Activity,
  FileText,
  Download,
  Eye,
  Play,
  RotateCcw,
} from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
} from "recharts"
import { Progress } from "@/components/ui/progress"

const vulnerabilityTracking = [
  {
    id: 1,
    vulnerability: "SQL Injection - Login Form",
    target: "webapp-prod.example.com",
    severity: "critical",
    status: "patched",
    patchDate: "2024-01-15",
    verificationStatus: "verified",
    cve: "CVE-2023-1234",
    remediationSteps: 4,
    completedSteps: 4,
    assignee: "Security Team",
    businessImpact: "High",
  },
  {
    id: 2,
    vulnerability: "XSS - Search Function",
    target: "webapp-prod.example.com",
    severity: "high",
    status: "in-progress",
    patchDate: null,
    verificationStatus: "pending",
    cve: "CVE-2023-5678",
    remediationSteps: 3,
    completedSteps: 2,
    assignee: "Dev Team Alpha",
    businessImpact: "Medium",
  },
  {
    id: 3,
    vulnerability: "IDOR - User Profiles",
    target: "api.example.com",
    severity: "medium",
    status: "scheduled",
    patchDate: "2024-01-20",
    verificationStatus: "not-started",
    cve: "CVE-2023-9012",
    remediationSteps: 5,
    completedSteps: 0,
    assignee: "Dev Team Beta",
    businessImpact: "Low",
  },
]

const patchDeployments = [
  {
    id: 1,
    patch: "Security Update v2.1.3",
    target: "webapp-prod.example.com",
    status: "deployed",
    deployDate: "2024-01-15 14:30",
    success: true,
    rollbackPlan: "Available",
    testingStatus: "Passed",
    affectedSystems: 3,
  },
  {
    id: 2,
    patch: "XSS Mitigation Patch",
    target: "webapp-staging.example.com",
    status: "testing",
    deployDate: "2024-01-16 09:15",
    success: null,
    rollbackPlan: "Ready",
    testingStatus: "In Progress",
    affectedSystems: 1,
  },
  {
    id: 3,
    patch: "API Security Enhancement",
    target: "api.example.com",
    status: "scheduled",
    deployDate: "2024-01-20 02:00",
    success: null,
    rollbackPlan: "Prepared",
    testingStatus: "Pending",
    affectedSystems: 2,
  },
]

const defenseAnalytics = [
  { month: "Oct", vulnerabilities: 45, patched: 42, remaining: 3, newThreats: 8 },
  { month: "Nov", vulnerabilities: 38, patched: 35, remaining: 3, newThreats: 12 },
  { month: "Dec", vulnerabilities: 52, patched: 48, remaining: 4, newThreats: 15 },
  { month: "Jan", vulnerabilities: 31, patched: 28, remaining: 3, newThreats: 6 },
]

const patchEffectiveness = [
  { category: "Critical", patched: 12, total: 15, percentage: 80 },
  { category: "High", patched: 28, total: 32, percentage: 87.5 },
  { category: "Medium", patched: 45, total: 48, percentage: 93.75 },
  { category: "Low", patched: 67, total: 70, percentage: 95.7 },
]

const remediationGuidance = [
  {
    category: "SQL Injection",
    steps: [
      "Implement parameterized queries/prepared statements",
      "Input validation and sanitization",
      "Use stored procedures with proper input handling",
      "Apply principle of least privilege to database accounts",
      "Regular security testing and code review",
    ],
    priority: "Critical",
    estimatedTime: "2-4 hours",
    tools: ["SQLMap", "Burp Suite", "OWASP ZAP"],
  },
  {
    category: "Cross-Site Scripting (XSS)",
    steps: [
      "Implement Content Security Policy (CSP)",
      "Output encoding/escaping",
      "Input validation on server-side",
      "Use secure frameworks and libraries",
      "Regular penetration testing",
    ],
    priority: "High",
    estimatedTime: "1-3 hours",
    tools: ["XSSHunter", "BeEF", "DOMPurify"],
  },
  {
    category: "Insecure Direct Object References (IDOR)",
    steps: [
      "Implement proper access controls",
      "Use indirect reference maps",
      "Validate user permissions for each request",
      "Implement session management",
      "Regular access control testing",
    ],
    priority: "Medium",
    estimatedTime: "3-6 hours",
    tools: ["Burp Suite", "OWASP ZAP", "Postman"],
  },
]

const riskDistribution = [
  { name: "Critical", value: 15, color: "#ef4444" },
  { name: "High", value: 32, color: "#f97316" },
  { name: "Medium", value: 48, color: "#eab308" },
  { name: "Low", value: 70, color: "#22c55e" },
]

export function BlueAgentDashboard() {
  const [selectedVuln, setSelectedVuln] = useState<number | null>(null)
  const [selectedRemediation, setSelectedRemediation] = useState<string | null>(null)

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "patched":
        return <CheckCircle className="w-4 h-4 text-green-500" />
      case "deployed":
        return <CheckCircle className="w-4 h-4 text-green-500" />
      case "in-progress":
        return <Clock className="w-4 h-4 text-yellow-500 animate-pulse" />
      case "testing":
        return <Activity className="w-4 h-4 text-blue-500 animate-pulse" />
      case "scheduled":
        return <Clock className="w-4 h-4 text-blue-500" />
      default:
        return <AlertTriangle className="w-4 h-4 text-red-500" />
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case "patched":
        return "bg-green-500/20 text-green-400 border-green-500/30"
      case "deployed":
        return "bg-green-500/20 text-green-400 border-green-500/30"
      case "in-progress":
        return "bg-yellow-500/20 text-yellow-400 border-yellow-500/30"
      case "testing":
        return "bg-blue-500/20 text-blue-400 border-blue-500/30"
      case "scheduled":
        return "bg-purple-500/20 text-purple-400 border-purple-500/30"
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
          <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-400 via-cyan-400 to-green-400 bg-clip-text text-transparent">
            Blue Agent Dashboard
          </h1>
          <p className="text-muted-foreground mt-1">Defensive security operations and vulnerability remediation</p>
        </div>
        <div className="flex items-center space-x-2">
          <Badge className="bg-blue-500/20 text-blue-400 border-blue-500/30 animate-pulse">
            <Shield className="w-3 h-3 mr-1" />
            Agent Active
          </Badge>
          <Badge className="bg-green-500/20 text-green-400 border-green-500/30">
            <CheckCircle className="w-3 h-3 mr-1" />
            28 Patched Today
          </Badge>
        </div>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="grid grid-cols-1 md:grid-cols-4 gap-4"
      >
        <Card className="bg-gradient-to-br from-green-500/10 to-emerald-500/10 border-green-500/20">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Patches Deployed</p>
                <p className="text-2xl font-bold text-green-400">28</p>
              </div>
              <CheckCircle className="w-8 h-8 text-green-400" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-yellow-500/10 to-orange-500/10 border-yellow-500/20">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">In Progress</p>
                <p className="text-2xl font-bold text-yellow-400">5</p>
              </div>
              <Clock className="w-8 h-8 text-yellow-400 animate-pulse" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-blue-500/10 to-cyan-500/10 border-blue-500/20">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Scheduled</p>
                <p className="text-2xl font-bold text-blue-400">3</p>
              </div>
              <Activity className="w-8 h-8 text-blue-400" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-purple-500/10 to-pink-500/10 border-purple-500/20">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Success Rate</p>
                <p className="text-2xl font-bold text-purple-400">94%</p>
              </div>
              <TrendingUp className="w-8 h-8 text-purple-400" />
            </div>
          </CardContent>
        </Card>
      </motion.div>

      <Tabs defaultValue="vulnerabilities" className="space-y-6">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="vulnerabilities">Vulnerabilities</TabsTrigger>
          <TabsTrigger value="patches">Patch Management</TabsTrigger>
          <TabsTrigger value="remediation">Remediation Guide</TabsTrigger>
          <TabsTrigger value="analytics">Defense Analytics</TabsTrigger>
          <TabsTrigger value="reports">Reports</TabsTrigger>
        </TabsList>

        <TabsContent value="vulnerabilities" className="space-y-6">
          <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.2 }}>
            <Card className="bg-gradient-to-br from-blue-500/5 to-cyan-500/5 border-blue-500/20">
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Shield className="w-5 h-5 text-blue-400" />
                  <span>Vulnerability Fix Tracking</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Vulnerability</TableHead>
                      <TableHead>CVE</TableHead>
                      <TableHead>Severity</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Progress</TableHead>
                      <TableHead>Assignee</TableHead>
                      <TableHead>Impact</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {vulnerabilityTracking.map((vuln) => (
                      <TableRow key={vuln.id}>
                        <TableCell>
                          <div>
                            <p className="font-medium text-sm">{vuln.vulnerability}</p>
                            <p className="text-xs text-muted-foreground">{vuln.target}</p>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline" className="text-xs font-mono">
                            {vuln.cve}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline" className={getSeverityColor(vuln.severity)}>
                            {vuln.severity.toUpperCase()}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center space-x-2">
                            {getStatusIcon(vuln.status)}
                            <Badge variant="outline" className={getStatusColor(vuln.status)}>
                              {vuln.status}
                            </Badge>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="space-y-1">
                            <Progress value={(vuln.completedSteps / vuln.remediationSteps) * 100} className="h-2" />
                            <span className="text-xs text-muted-foreground">
                              {vuln.completedSteps}/{vuln.remediationSteps} steps
                            </span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <span className="text-xs">{vuln.assignee}</span>
                        </TableCell>
                        <TableCell>
                          <Badge
                            variant="outline"
                            className={
                              vuln.businessImpact === "High"
                                ? "bg-red-500/20 text-red-400"
                                : vuln.businessImpact === "Medium"
                                  ? "bg-yellow-500/20 text-yellow-400"
                                  : "bg-green-500/20 text-green-400"
                            }
                          >
                            {vuln.businessImpact}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <div className="flex space-x-1">
                            <Button variant="ghost" size="sm" onClick={() => setSelectedVuln(vuln.id)}>
                              <Eye className="w-3 h-3" />
                            </Button>
                            <Button variant="ghost" size="sm">
                              <Play className="w-3 h-3" />
                            </Button>
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

        <TabsContent value="patches" className="space-y-6">
          <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.3 }}>
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Activity className="w-5 h-5 text-blue-400" />
                  <span>Patch Deployment Management</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {patchDeployments.map((patch) => (
                    <div key={patch.id} className="p-4 bg-muted/50 rounded-lg border">
                      <div className="flex items-center justify-between mb-3">
                        <p className="font-medium">{patch.patch}</p>
                        <div className="flex space-x-2">
                          <Badge variant="outline" className={getStatusColor(patch.status)}>
                            {patch.status}
                          </Badge>
                          {patch.success !== null && (
                            <Badge
                              variant="outline"
                              className={
                                patch.success ? "bg-green-500/20 text-green-400" : "bg-red-500/20 text-red-400"
                              }
                            >
                              {patch.success ? "Success" : "Failed"}
                            </Badge>
                          )}
                        </div>
                      </div>

                      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-3">
                        <div className="text-xs">
                          <span className="text-muted-foreground">Target:</span> {patch.target}
                        </div>
                        <div className="text-xs">
                          <span className="text-muted-foreground">Deploy Time:</span> {patch.deployDate}
                        </div>
                        <div className="text-xs">
                          <span className="text-muted-foreground">Testing:</span> {patch.testingStatus}
                        </div>
                        <div className="text-xs">
                          <span className="text-muted-foreground">Systems:</span> {patch.affectedSystems}
                        </div>
                      </div>

                      <div className="flex items-center justify-between">
                        <Badge variant="outline" className="bg-purple-500/20 text-purple-400">
                          Rollback: {patch.rollbackPlan}
                        </Badge>
                        <div className="flex space-x-2">
                          <Button variant="ghost" size="sm">
                            <Eye className="w-3 h-3 mr-1" />
                            Details
                          </Button>
                          <Button variant="ghost" size="sm">
                            <RotateCcw className="w-3 h-3 mr-1" />
                            Rollback
                          </Button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </TabsContent>

        <TabsContent value="remediation" className="space-y-6">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}>
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <FileText className="w-5 h-5 text-green-400" />
                  <span>Comprehensive Remediation Guidance</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {remediationGuidance.map((guide) => (
                  <div key={guide.category} className="p-4 bg-muted/50 rounded-lg border">
                    <div className="flex items-center justify-between mb-3">
                      <h4 className="font-medium">{guide.category}</h4>
                      <div className="flex space-x-2">
                        <Badge
                          variant="outline"
                          className={
                            guide.priority === "Critical"
                              ? "bg-red-500/20 text-red-400"
                              : guide.priority === "High"
                                ? "bg-orange-500/20 text-orange-400"
                                : "bg-yellow-500/20 text-yellow-400"
                          }
                        >
                          {guide.priority}
                        </Badge>
                        <Badge variant="outline" className="bg-blue-500/20 text-blue-400">
                          {guide.estimatedTime}
                        </Badge>
                      </div>
                    </div>

                    <div className="space-y-2 mb-3">
                      <p className="text-sm font-medium text-muted-foreground">Remediation Steps:</p>
                      <ol className="list-decimal list-inside space-y-1">
                        {guide.steps.map((step, index) => (
                          <li key={index} className="text-sm">
                            {step}
                          </li>
                        ))}
                      </ol>
                    </div>

                    <div className="flex items-center justify-between">
                      <div className="flex space-x-2">
                        <span className="text-xs text-muted-foreground">Tools:</span>
                        {guide.tools.map((tool) => (
                          <Badge key={tool} variant="outline" className="text-xs bg-cyan-500/20 text-cyan-400">
                            {tool}
                          </Badge>
                        ))}
                      </div>
                      <Button variant="ghost" size="sm" onClick={() => setSelectedRemediation(guide.category)}>
                        <FileText className="w-3 h-3 mr-1" />
                        View Guide
                      </Button>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
          </motion.div>
        </TabsContent>

        <TabsContent value="analytics" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Defense Trend */}
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}>
              <Card>
                <CardHeader>
                  <CardTitle>Defense Analytics Trend</CardTitle>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={300}>
                    <LineChart data={defenseAnalytics}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                      <XAxis dataKey="month" stroke="#9CA3AF" />
                      <YAxis stroke="#9CA3AF" />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: "#1F2937",
                          border: "1px solid #374151",
                          borderRadius: "8px",
                        }}
                      />
                      <Line type="monotone" dataKey="vulnerabilities" stroke="#EF4444" strokeWidth={2} />
                      <Line type="monotone" dataKey="patched" stroke="#10B981" strokeWidth={2} />
                      <Line type="monotone" dataKey="remaining" stroke="#F59E0B" strokeWidth={2} />
                      <Line type="monotone" dataKey="newThreats" stroke="#8B5CF6" strokeWidth={2} />
                    </LineChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            </motion.div>

            {/* Risk Distribution */}
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5 }}>
              <Card>
                <CardHeader>
                  <CardTitle>Risk Distribution</CardTitle>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={300}>
                    <PieChart>
                      <Pie
                        data={riskDistribution}
                        cx="50%"
                        cy="50%"
                        outerRadius={80}
                        fill="#8884d8"
                        dataKey="value"
                        label={({ name, value }) => `${name}: ${value}`}
                      >
                        {riskDistribution.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            </motion.div>

            {/* Patch Effectiveness */}
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.6 }}>
              <Card className="lg:col-span-2">
                <CardHeader>
                  <CardTitle>Patch Effectiveness by Severity</CardTitle>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={patchEffectiveness}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                      <XAxis dataKey="category" stroke="#9CA3AF" />
                      <YAxis stroke="#9CA3AF" />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: "#1F2937",
                          border: "1px solid #374151",
                          borderRadius: "8px",
                        }}
                      />
                      <Bar dataKey="patched" fill="#10B981" />
                      <Bar dataKey="total" fill="#374151" />
                    </BarChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            </motion.div>
          </div>
        </TabsContent>

        <TabsContent value="reports" className="space-y-6">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.6 }}>
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <FileText className="w-5 h-5 text-cyan-400" />
                  <span>Security Reports & Documentation</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-3">
                    <h4 className="font-medium">Generate Reports</h4>
                    <div className="space-y-2">
                      <Button className="w-full justify-start">
                        <Download className="w-4 h-4 mr-2" />
                        Vulnerability Assessment Report
                      </Button>
                      <Button className="w-full justify-start bg-transparent" variant="outline">
                        <Download className="w-4 h-4 mr-2" />
                        Patch Management Summary
                      </Button>
                      <Button className="w-full justify-start bg-transparent" variant="outline">
                        <Download className="w-4 h-4 mr-2" />
                        Compliance Status Report
                      </Button>
                      <Button className="w-full justify-start bg-transparent" variant="outline">
                        <Download className="w-4 h-4 mr-2" />
                        Executive Security Dashboard
                      </Button>
                    </div>
                  </div>

                  <div className="space-y-3">
                    <h4 className="font-medium">Recent Reports</h4>
                    <div className="space-y-2">
                      <div className="p-3 bg-muted/50 rounded border">
                        <p className="text-sm font-medium">Monthly Security Report - January 2024</p>
                        <p className="text-xs text-muted-foreground">Generated: Jan 31, 2024</p>
                      </div>
                      <div className="p-3 bg-muted/50 rounded border">
                        <p className="text-sm font-medium">Vulnerability Remediation Summary</p>
                        <p className="text-xs text-muted-foreground">Generated: Jan 28, 2024</p>
                      </div>
                      <div className="p-3 bg-muted/50 rounded border">
                        <p className="text-sm font-medium">Compliance Audit Trail</p>
                        <p className="text-xs text-muted-foreground">Generated: Jan 25, 2024</p>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </TabsContent>
      </Tabs>
    </div>
  )
}

export default function BlueAgentPage() {
  return (
    <>
      <Head>
        <title>Blue Agent - XploitEye Dashboard</title>
        <meta name="description" content="Defensive security and monitoring tools" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
      </Head>
      <DashboardLayout>
        <BlueAgentDashboard />
      </DashboardLayout>
    </>
  );
}
