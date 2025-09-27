"use client"

import React from 'react';
import Head from 'next/head';
import { motion } from "framer-motion"
import { VulnerabilityCard } from "@/components/dashboard/VulnerabilityCard"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Activity, Clock, Shield, Target, TrendingUp, Bot, FileText, Zap } from "lucide-react"
import Link from "next/link"
import { useAuth } from "../../auth/AuthContext"
import { DashboardLayout } from '@/components/layouts/DashboardLayout';

// Mock data
const vulnerabilityStats = {
  critical: 3,
  high: 12,
  medium: 28,
  low: 45,
}

const recentActivity = [
  { id: 1, action: "Scan completed", target: "webapp-prod.example.com", time: "2 minutes ago", status: "success" },
  {
    id: 2,
    action: "Critical vulnerability found",
    target: "api.example.com",
    time: "15 minutes ago",
    status: "critical",
  },
  { id: 3, action: "Red Agent task completed", target: "CVE-2023-1234", time: "1 hour ago", status: "info" },
  { id: 4, action: "Blue Agent patch deployed", target: "web-server-01", time: "2 hours ago", status: "success" },
]

const quickStats = [
  { label: "Active Scans", value: "4", icon: Activity, color: "text-green-400", trend: "+12%" },
  { label: "Threat Intelligence", value: "2.3K", icon: Shield, color: "text-cyan-400", trend: "+8%" },
  { label: "Security Score", value: "94.2", icon: TrendingUp, color: "text-emerald-400", trend: "+2.1%" },
  { label: "System Health", value: "99.9%", icon: Zap, color: "text-lime-400", trend: "stable" },
]

function DashboardHome() {
  const { user } = useAuth();
  return (
    <div className="space-y-6">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-center justify-between"
      >
        <div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-green-400 via-emerald-500 to-cyan-400 bg-clip-text text-transparent">
            XploitEye Security Command Center
          </h1>
          <p className="text-muted-foreground mt-1">Advanced AI-powered cybersecurity operations dashboard</p>
        </div>
        <div className="flex items-center space-x-2">
          <Badge variant="outline" className="bg-green-500/20 text-green-400 border-green-500/30">
            <div className="w-2 h-2 bg-green-400 rounded-full mr-2 animate-pulse" />
            All Systems Operational
          </Badge>
        </div>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4"
      >
        {quickStats.map((stat, index) => (
          <motion.div
            key={stat.label}
            whileHover={{ scale: 1.02, y: -2 }}
            transition={{ type: "spring", stiffness: 300 }}
          >
            <Card className="bg-gradient-to-br from-gray-900/80 to-gray-800/50 border-green-500/20 hover:border-green-400/40 transition-all duration-300">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">{stat.label}</p>
                    <p className="text-2xl font-bold text-white">{stat.value}</p>
                    <p className={`text-xs ${stat.color} flex items-center mt-1`}>
                      <TrendingUp className="w-3 h-3 mr-1" />
                      {stat.trend}
                    </p>
                  </div>
                  <motion.div
                    animate={{ rotate: [0, 5, -5, 0] }}
                    transition={{ duration: 2, repeat: Number.POSITIVE_INFINITY, repeatDelay: 3 }}
                  >
                    <stat.icon className={`w-8 h-8 ${stat.color}`} />
                  </motion.div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </motion.div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column */}
        <div className="lg:col-span-2 space-y-6">
          {/* Vulnerability Overview */}
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
            <Card className="bg-gradient-to-br from-gray-900/80 to-gray-800/50 border-green-500/20">
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Shield className="w-5 h-5 text-green-400" />
                  <span>Vulnerability Overview</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                  <VulnerabilityCard severity="critical" count={vulnerabilityStats.critical} />
                  <VulnerabilityCard severity="high" count={vulnerabilityStats.high} />
                  <VulnerabilityCard severity="medium" count={vulnerabilityStats.medium} />
                  <VulnerabilityCard severity="low" count={vulnerabilityStats.low} />
                </div>
              </CardContent>
            </Card>
          </motion.div>

          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
            <Card className="bg-gradient-to-br from-gray-900/80 to-gray-800/50 border-green-500/20">
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Activity className="w-5 h-5 text-green-400" />
                  <span>XploitEye Live Security Feed</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="bg-black/50 rounded-lg p-4 font-mono text-sm max-h-64 overflow-y-auto">
                  <div className="space-y-1">
                    <div className="text-green-400">[XploitEye] Initializing AI security agents...</div>
                    <div className="text-cyan-400">[Red Agent] CVE-2024-0001 exploit analysis complete</div>
                    <div className="text-blue-400">[Blue Agent] Patch deployment successful on 12 systems</div>
                    <div className="text-yellow-400">[Scanner] Port scan completed: 65535 ports analyzed</div>
                    <div className="text-green-400">[AI Engine] Threat intelligence updated: 2,341 new IOCs</div>
                    <div className="text-purple-400">[RAG System] Knowledge base synchronized</div>
                    <div className="text-orange-400">[Monitor] Real-time vulnerability detection active</div>
                    <div className="text-green-400 animate-pulse">[System] All security modules operational ✓</div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>

          {/* Recent Activity */}
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5 }}>
            <Card className="bg-gradient-to-br from-gray-900/80 to-gray-800/50 border-green-500/20">
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle className="flex items-center space-x-2">
                  <Clock className="w-5 h-5 text-green-400" />
                  <span>Recent Activity</span>
                </CardTitle>
                <Button
                  variant="outline"
                  size="sm"
                  className="border-green-500/30 text-green-400 hover:bg-green-500/10 bg-transparent"
                >
                  View All
                </Button>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {recentActivity.map((activity) => (
                    <div key={activity.id} className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
                      <div className="flex items-center space-x-3">
                        <div
                          className={`w-2 h-2 rounded-full ${
                            activity.status === "critical"
                              ? "bg-red-500"
                              : activity.status === "success"
                                ? "bg-green-500"
                                : "bg-blue-500"
                          }`}
                        />
                        <div>
                          <p className="text-sm font-medium">{activity.action}</p>
                          <p className="text-xs text-muted-foreground">{activity.target}</p>
                        </div>
                      </div>
                      <span className="text-xs text-muted-foreground">{activity.time}</span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </div>

        {/* Right Column */}
        <div className="space-y-6">
          {/* AI Security Robot */}
          <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.4 }}>
            <Card className="bg-gradient-to-br from-gray-900/80 to-gray-800/50 border-green-500/20">
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Bot className="w-5 h-5 text-green-400" />
                  <span>XploitEye AI Security Robot</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex flex-col items-center justify-center py-8">
                  <motion.div
                    animate={{
                      rotate: [0, 5, -5, 0],
                      scale: [1, 1.05, 1],
                    }}
                    transition={{
                      duration: 4,
                      repeat: Number.POSITIVE_INFINITY,
                      ease: "easeInOut",
                    }}
                    className="relative mb-4"
                  >
                    {/* Large Robot SVG Animation */}
                    <svg width="200" height="200" viewBox="0 0 200 200" className="text-green-400">
                      <defs>
                        <linearGradient id="robotGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                          <stop offset="0%" stopColor="#10b981" />
                          <stop offset="50%" stopColor="#06d6a0" />
                          <stop offset="100%" stopColor="#00ff41" />
                        </linearGradient>
                        <filter id="glow">
                          <feGaussianBlur stdDeviation="3" result="coloredBlur" />
                          <feMerge>
                            <feMergeNode in="coloredBlur" />
                            <feMergeNode in="SourceGraphic" />
                          </feMerge>
                        </filter>
                      </defs>

                      {/* Robot Body */}
                      <motion.rect
                        x="50"
                        y="80"
                        width="100"
                        height="80"
                        rx="15"
                        fill="url(#robotGradient)"
                        filter="url(#glow)"
                        animate={{ opacity: [0.8, 1, 0.8] }}
                        transition={{ duration: 2, repeat: Number.POSITIVE_INFINITY }}
                      />

                      {/* Robot Head */}
                      <motion.rect
                        x="60"
                        y="40"
                        width="80"
                        height="50"
                        rx="25"
                        fill="url(#robotGradient)"
                        filter="url(#glow)"
                        animate={{ y: [40, 35, 40] }}
                        transition={{ duration: 3, repeat: Number.POSITIVE_INFINITY }}
                      />

                      {/* Eyes */}
                      <motion.circle
                        cx="80"
                        cy="60"
                        r="8"
                        fill="#00ff41"
                        animate={{ opacity: [1, 0.3, 1] }}
                        transition={{ duration: 1.5, repeat: Number.POSITIVE_INFINITY }}
                      />
                      <motion.circle
                        cx="120"
                        cy="60"
                        r="8"
                        fill="#00ff41"
                        animate={{ opacity: [1, 0.3, 1] }}
                        transition={{ duration: 1.5, repeat: Number.POSITIVE_INFINITY, delay: 0.2 }}
                      />

                      {/* Scanner Visor */}
                      <motion.rect
                        x="45"
                        y="50"
                        width="110"
                        height="25"
                        rx="12"
                        fill="rgba(0,255,65,0.2)"
                        stroke="#00ff41"
                        strokeWidth="2"
                        animate={{ opacity: [0.5, 1, 0.5] }}
                        transition={{ duration: 2, repeat: Number.POSITIVE_INFINITY }}
                      />

                      {/* Arms */}
                      <motion.rect
                        x="25"
                        y="90"
                        width="25"
                        height="15"
                        rx="7"
                        fill="url(#robotGradient)"
                        animate={{ x: [25, 20, 25] }}
                        transition={{ duration: 2.5, repeat: Number.POSITIVE_INFINITY }}
                      />
                      <motion.rect
                        x="150"
                        y="90"
                        width="25"
                        height="15"
                        rx="7"
                        fill="url(#robotGradient)"
                        animate={{ x: [150, 155, 150] }}
                        transition={{ duration: 2.5, repeat: Number.POSITIVE_INFINITY, delay: 1 }}
                      />

                      {/* Antenna */}
                      <motion.line
                        x1="100"
                        y1="40"
                        x2="100"
                        y2="25"
                        stroke="#00ff41"
                        strokeWidth="3"
                        animate={{ strokeWidth: [3, 5, 3] }}
                        transition={{ duration: 1, repeat: Number.POSITIVE_INFINITY }}
                      />
                      <motion.circle
                        cx="100"
                        cy="25"
                        r="4"
                        fill="#00ff41"
                        animate={{ r: [4, 6, 4], opacity: [1, 0.7, 1] }}
                        transition={{ duration: 1, repeat: Number.POSITIVE_INFINITY }}
                      />

                      {/* Scanning Lines */}
                      <motion.line
                        x1="50"
                        y1="65"
                        x2="150"
                        y2="65"
                        stroke="#00ff41"
                        strokeWidth="2"
                        opacity="0.8"
                        animate={{ opacity: [0.3, 1, 0.3], strokeWidth: [1, 3, 1] }}
                        transition={{ duration: 1.5, repeat: Number.POSITIVE_INFINITY }}
                      />

                      {/* Status Indicators */}
                      <motion.circle
                        cx="70"
                        cy="100"
                        r="3"
                        fill="#00ff41"
                        animate={{ opacity: [0.5, 1, 0.5] }}
                        transition={{ duration: 0.8, repeat: Number.POSITIVE_INFINITY }}
                      />
                      <motion.circle
                        cx="100"
                        cy="100"
                        r="3"
                        fill="#06d6a0"
                        animate={{ opacity: [0.5, 1, 0.5] }}
                        transition={{ duration: 0.8, repeat: Number.POSITIVE_INFINITY, delay: 0.3 }}
                      />
                      <motion.circle
                        cx="130"
                        cy="100"
                        r="3"
                        fill="#10b981"
                        animate={{ opacity: [0.5, 1, 0.5] }}
                        transition={{ duration: 0.8, repeat: Number.POSITIVE_INFINITY, delay: 0.6 }}
                      />
                    </svg>

                    {/* Floating particles around robot */}
                    <motion.div
                      className="absolute inset-0 pointer-events-none"
                      animate={{ rotate: 360 }}
                      transition={{ duration: 20, repeat: Number.POSITIVE_INFINITY, ease: "linear" }}
                    >
                      {[...Array(8)].map((_, i) => (
                        <motion.div
                          key={i}
                          className="absolute w-2 h-2 bg-green-400 rounded-full"
                          style={{
                            left: `${50 + 40 * Math.cos((i * Math.PI * 2) / 8)}%`,
                            top: `${50 + 40 * Math.sin((i * Math.PI * 2) / 8)}%`,
                          }}
                          animate={{ opacity: [0.3, 1, 0.3], scale: [0.5, 1, 0.5] }}
                          transition={{
                            duration: 2,
                            repeat: Number.POSITIVE_INFINITY,
                            delay: i * 0.2,
                          }}
                        />
                      ))}
                    </motion.div>
                  </motion.div>

                  {/* Hello Text */}
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 1 }}
                    className="text-center mb-4"
                  >
                    <motion.h3
                      className="text-2xl font-bold bg-gradient-to-r from-green-400 via-emerald-500 to-cyan-400 bg-clip-text text-transparent"
                      animate={{ scale: [1, 1.05, 1] }}
                      transition={{ duration: 2, repeat: Number.POSITIVE_INFINITY }}
                    >
                      Hello, {user?.name || user?.display_name || user?.username || 'Security Expert'}! 👋
                    </motion.h3>
                    <p className="text-sm text-muted-foreground mt-2">
                      Your AI-powered cybersecurity assistant is ready to help
                    </p>
                  </motion.div>

                  {/* AI Stats below robot */}
                  <div className="grid grid-cols-2 gap-4 w-full">
                    <div className="text-center">
                      <div className="text-xl font-bold text-green-400">2,341</div>
                      <div className="text-xs text-muted-foreground">Threats Detected</div>
                    </div>
                    <div className="text-center">
                      <div className="text-xl font-bold text-cyan-400">98.7%</div>
                      <div className="text-xs text-muted-foreground">Detection Rate</div>
                    </div>
                    <div className="text-center">
                      <div className="text-xl font-bold text-emerald-400">156</div>
                      <div className="text-xs text-muted-foreground">CVEs Analyzed</div>
                    </div>
                    <div className="text-center">
                      <div className="text-xl font-bold text-lime-400">24/7</div>
                      <div className="text-xs text-muted-foreground">AI Monitoring</div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>

          {/* Quick Actions */}
          <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.6 }}>
            <Card className="bg-gradient-to-br from-gray-900/80 to-gray-800/50 border-green-500/20">
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Zap className="w-5 h-5 text-green-400" />
                  <span>Quick Actions</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <Link href="/dashboard/reports">
                  <Button
                    variant="outline"
                    className="w-full justify-start bg-transparent border-green-500/30 text-green-400 hover:bg-green-500/10"
                  >
                    <FileText className="w-4 h-4 mr-2" />
                    View Reports
                  </Button>
                </Link>
                <div className="grid grid-cols-2 gap-2">
                  <Link href="/dashboard/red-agent">
                    <Button
                      variant="outline"
                      className="w-full justify-start bg-transparent border-red-500/30 text-red-400 hover:bg-red-500/10 text-sm"
                    >
                      <Target className="w-4 h-4 mr-1" />
                      Red Agent
                    </Button>
                  </Link>
                  <Link href="/dashboard/blue-agent">
                    <Button
                      variant="outline"
                      className="w-full justify-start bg-transparent border-blue-500/30 text-blue-400 hover:bg-blue-500/10 text-sm"
                    >
                      <Shield className="w-4 h-4 mr-1" />
                      Blue Agent
                    </Button>
                  </Link>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </div>
      </div>
    </div>
  )
}

export default function DashboardPage() {
  return (
    <>
      <Head>
        <title>Dashboard - XploitEye</title>
        <meta name="description" content="XploitEye Security Dashboard" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
      </Head>
      <DashboardLayout>
        <DashboardHome />
      </DashboardLayout>
    </>
  );
}