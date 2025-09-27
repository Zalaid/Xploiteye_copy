"use client"

import React from 'react';
import Head from 'next/head';
import { DashboardLayout } from '@/components/layouts/DashboardLayout';
import { useState, useEffect } from "react"
import { motion } from "framer-motion"
import { FileText, Download, Eye, Share, Filter, Calendar } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"

// Interface for report data
interface Report {
  filename: string
  scan_id: string
  target: string
  scan_type: string
  generated_at: string
  file_size: number
  status: string
}

export function ReportsPage() {
  const [searchTerm, setSearchTerm] = useState("")
  const [filterType, setFilterType] = useState("all")
  const [selectedReport, setSelectedReport] = useState<string | null>(null)
  const [reports, setReports] = useState<Report[]>([])
  const [loading, setLoading] = useState(true)

  const getStatusColor = (status: string) => {
    switch (status) {
      case "completed":
        return "bg-green-500/20 text-green-400 border-green-500/30"
      case "generating":
        return "bg-blue-500/20 text-blue-400 border-blue-500/30"
      case "failed":
        return "bg-red-500/20 text-red-400 border-red-500/30"
      default:
        return "bg-gray-500/20 text-gray-400 border-gray-500/30"
    }
  }

  const filteredReports = reports.filter((report) => {
    const matchesSearch =
      report.filename.toLowerCase().includes(searchTerm.toLowerCase()) ||
      report.target.toLowerCase().includes(searchTerm.toLowerCase()) ||
      report.scan_id.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesType = filterType === "all" || report.scan_type.toLowerCase().includes(filterType.toLowerCase())
    return matchesSearch && matchesType
  })

  // Load available reports and scan history
  useEffect(() => {
    loadReportsData()
  }, [])

  const loadReportsData = async () => {
    try {
      const token = localStorage.getItem('access_token')
      console.log('Loading reports with token:', token ? 'Token present' : 'No token')

      // Load available PDF reports
      const reportsResponse = await fetch('http://localhost:8000/scanning/reports', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })

      console.log('Reports response status:', reportsResponse.status)

      if (reportsResponse.ok) {
        const reportsData = await reportsResponse.json()
        console.log('Raw reports data:', reportsData)
        setReports(reportsData.reports || [])
        console.log('Set reports state:', reportsData.reports)
      } else {
        const errorText = await reportsResponse.text()
        console.error('Failed to load reports:', errorText)
      }

    } catch (error) {
      console.error('Error loading reports data:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleDownload = async (filename: string) => {
    try {
      const token = localStorage.getItem('access_token')
      console.log('Downloading report:', filename)
      console.log('Using token:', token ? 'Token present' : 'No token')

      const response = await fetch(`http://localhost:8000/scanning/download-report/${filename}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })

      console.log('Download response status:', response.status)

      if (response.ok) {
        const blob = await response.blob()
        console.log('Blob size:', blob.size)

        const url = window.URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download = filename
        document.body.appendChild(a)
        a.click()
        window.URL.revokeObjectURL(url)
        document.body.removeChild(a)

        console.log('Download initiated successfully')
      } else {
        const errorText = await response.text()
        console.error('Download failed:', errorText)
        alert(`Failed to download report: ${response.status} - ${errorText}`)
      }
    } catch (error) {
      console.error('Error downloading report:', error)
      alert(`Error downloading report: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }

  const handleGenerateReport = async (scanId: string, target: string) => {
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
        alert(`Report generated successfully: ${result.pdf_file}`)
        // Refresh reports list
        loadReportsData()
      } else {
        const error = await response.json()
        alert(`Failed to generate report: ${error.detail}`)
      }
    } catch (error) {
      console.error('Error generating report:', error)
      alert('Failed to generate report')
    }
  }

  const handleShare = (filename: string) => {
    console.log(`Sharing report ${filename}`)
    // Implementation would open share dialog
  }

  const handlePreview = (filename: string) => {
    console.log(`Opening preview for report: ${filename}`)
    setSelectedReport(filename)
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
          <h1 className="text-3xl font-bold bg-gradient-to-r from-teal-400 to-cyan-600 bg-clip-text text-transparent">
            Security Reports
          </h1>
          <p className="text-muted-foreground mt-1">
            Generate, view, and share comprehensive security assessment reports
          </p>
        </div>
        <Button className="bg-gradient-to-r from-teal-500 to-cyan-600 hover:from-teal-600 hover:to-cyan-700">
          <FileText className="w-4 h-4 mr-2" />
          Generate New Report
        </Button>
      </motion.div>

      {/* Filters */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
        <Card>
          <CardContent className="p-4">
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="flex-1">
                <Input
                  placeholder="Search reports..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full"
                />
              </div>
              <Select value={filterType} onValueChange={setFilterType}>
                <SelectTrigger className="w-full sm:w-48">
                  <SelectValue placeholder="Filter by type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Types</SelectItem>
                  <SelectItem value="light">Light Scan</SelectItem>
                  <SelectItem value="medium">Medium Scan</SelectItem>
                  <SelectItem value="deep">Deep Scan</SelectItem>
                </SelectContent>
              </Select>
              <Button variant="outline">
                <Filter className="w-4 h-4 mr-2" />
                More Filters
              </Button>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Reports Table */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <FileText className="w-5 h-5 text-teal-400" />
              <span>Generated Reports</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Report File</TableHead>
                  <TableHead>Scan Type</TableHead>
                  <TableHead>Target</TableHead>
                  <TableHead>Generated</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Scan ID</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-8">
                      Loading reports...
                    </TableCell>
                  </TableRow>
                ) : filteredReports.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-8">
                      No reports found
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredReports.map((report, index) => (
                    <TableRow key={report.filename}>
                      <TableCell>
                        <div>
                          <p className="font-medium">{report.filename}</p>
                          <div className="flex items-center space-x-2 mt-1">
                            <Badge variant="outline" className="text-xs">
                              PDF
                            </Badge>
                            <span className="text-xs text-muted-foreground">
                              {report.file_size ? (report.file_size / 1024).toFixed(1) + ' KB' : 'N/A'}
                            </span>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>{report.scan_type}</TableCell>
                      <TableCell className="text-sm">{report.target}</TableCell>
                      <TableCell>
                        <div className="flex items-center space-x-1">
                          <Calendar className="w-3 h-3 text-muted-foreground" />
                          <span className="text-sm">
                            {report.generated_at ? new Date(report.generated_at).toLocaleDateString() : 'N/A'}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className={getStatusColor(report.status)}>
                          {report.status}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="text-xs text-muted-foreground">
                          Scan ID: {report.scan_id ? report.scan_id.substring(0, 8) + '...' : 'N/A'}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center space-x-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handlePreview(report.filename)}
                            className="hover:bg-blue-500/20"
                          >
                            <Eye className="w-4 h-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDownload(report.filename)}
                            className="hover:bg-green-500/20"
                          >
                            <Download className="w-4 h-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleShare(report.filename)}
                            className="hover:bg-purple-500/20"
                          >
                            <Share className="w-4 h-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </motion.div>

      {/* Report Preview Modal */}
      {selectedReport && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="fixed inset-0 bg-black/50 flex items-center justify-center z-50"
          onClick={() => setSelectedReport(null)}
        >
          <Card className="w-full max-w-4xl max-h-[80vh] overflow-auto m-4">
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>Report Preview - {selectedReport}</CardTitle>
              <Button variant="ghost" onClick={() => setSelectedReport(null)}>
                ×
              </Button>
            </CardHeader>
            <CardContent>
              <div className="text-center py-12 text-muted-foreground">
                <FileText className="w-16 h-16 mx-auto mb-4 opacity-50" />
                <p>PDF preview would be displayed here</p>
                <p className="text-sm mt-2">Click download to view the full report</p>
                <Button
                  className="mt-4"
                  onClick={() => handleDownload(selectedReport)}
                >
                  <Download className="w-4 h-4 mr-2" />
                  Download {selectedReport}
                </Button>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      )}
    </div>
  )
}

export default function ReportsPageWrapper() {
  return (
    <>
      <Head>
        <title>Reports - XploitEye Dashboard</title>
        <meta name="description" content="Security reports and documentation" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
      </Head>
      <DashboardLayout>
        <ReportsPage />
      </DashboardLayout>
    </>
  );
}
