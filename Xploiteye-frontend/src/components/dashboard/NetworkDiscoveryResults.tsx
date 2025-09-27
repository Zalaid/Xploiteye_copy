"use client"

import React from 'react';
import { motion } from "framer-motion"
import {
  Network,
  Wifi,
  Monitor,
  Smartphone,
  Router,
  HardDrive,
  Download,
  RefreshCw,
  Filter,
  Copy,
  CheckCircle,
  AlertCircle,
} from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"

interface Device {
  ip: string
  mac: string | null
  status: string
  hostname: string | null
  vendor: string
  discovery_method: string
}

interface NetworkDiscoveryData {
  network_range: string
  timestamp: string
  scan_status: string
  devices: Device[]
  summary: {
    total_devices: number
    online_devices: number
    discovery_methods: string[]
  }
}

interface NetworkDiscoveryResultsProps {
  data: NetworkDiscoveryData
  onRefresh?: () => void
  onExport?: () => void
}

export function NetworkDiscoveryResults({ data, onRefresh, onExport }: NetworkDiscoveryResultsProps) {
  const getDeviceIcon = (vendor: string, hostname: string | null) => {
    const vendorLower = vendor?.toLowerCase() || ''
    const hostnameLower = hostname?.toLowerCase() || ''

    if (hostnameLower.includes('router') || vendorLower.includes('cisco') || vendorLower.includes('linksys')) {
      return <Router className="w-4 h-4 text-blue-400" />
    }
    if (hostnameLower.includes('phone') || hostnameLower.includes('android') || hostnameLower.includes('iphone')) {
      return <Smartphone className="w-4 h-4 text-green-400" />
    }
    if (hostnameLower.includes('laptop') || hostnameLower.includes('desktop') || vendorLower.includes('apple') || vendorLower.includes('dell')) {
      return <Monitor className="w-4 h-4 text-purple-400" />
    }
    if (hostnameLower.includes('tv') || hostnameLower.includes('smart')) {
      return <HardDrive className="w-4 h-4 text-orange-400" />
    }
    return <Network className="w-4 h-4 text-gray-400" />
  }

  const getStatusBadge = (status: string) => {
    return status === 'online' ? (
      <Badge className="bg-green-500/20 text-green-400 border-green-500/30">
        <CheckCircle className="w-3 h-3 mr-1" />
        Online
      </Badge>
    ) : (
      <Badge className="bg-red-500/20 text-red-400 border-red-500/30">
        <AlertCircle className="w-3 h-3 mr-1" />
        Offline
      </Badge>
    )
  }

  const copyIPsToClipboard = () => {
    const ips = data.devices.map(device => device.ip).join('\n')
    navigator.clipboard.writeText(ips)
  }

  const formatTimestamp = (timestamp: string) => {
    return new Date(timestamp).toLocaleString()
  }

  const truncateMac = (mac: string | null) => {
    if (!mac) return 'N/A'
    return mac.toUpperCase()
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="w-full space-y-6"
    >
      {/* Header Dashboard */}
      <Card className="bg-gradient-to-br from-gray-900/80 to-gray-800/50 border-cyan-500/30 shadow-lg">
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Network className="w-6 h-6 text-cyan-400" />
              <span className="text-xl">Network Discovery Results</span>
            </div>
            <Badge className="bg-cyan-500/20 text-cyan-400 text-sm px-3 py-1">
              {data.scan_status.toUpperCase()}
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
            <div className="bg-slate-800/50 rounded-lg p-4 border border-slate-700/50">
              <div className="flex items-center space-x-2">
                <Wifi className="w-5 h-5 text-blue-400" />
                <div>
                  <p className="text-sm text-gray-400">Network Range</p>
                  <p className="font-semibold text-white">{data.network_range}</p>
                </div>
              </div>
            </div>

            <div className="bg-slate-800/50 rounded-lg p-4 border border-slate-700/50">
              <div className="flex items-center space-x-2">
                <Network className="w-5 h-5 text-green-400" />
                <div>
                  <p className="text-sm text-gray-400">Total Devices</p>
                  <p className="font-semibold text-white">{data.summary.total_devices}</p>
                </div>
              </div>
            </div>

            <div className="bg-slate-800/50 rounded-lg p-4 border border-slate-700/50">
              <div className="flex items-center space-x-2">
                <CheckCircle className="w-5 h-5 text-emerald-400" />
                <div>
                  <p className="text-sm text-gray-400">Online Devices</p>
                  <p className="font-semibold text-white">{data.summary.online_devices}</p>
                </div>
              </div>
            </div>

            <div className="bg-slate-800/50 rounded-lg p-4 border border-slate-700/50">
              <div className="flex items-center space-x-2">
                <RefreshCw className="w-5 h-5 text-purple-400" />
                <div>
                  <p className="text-sm text-gray-400">Scan Time</p>
                  <p className="font-semibold text-white text-xs">{formatTimestamp(data.timestamp)}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-wrap gap-2 mb-4">
            <Button
              onClick={onRefresh}
              variant="outline"
              size="sm"
              className="border-cyan-500/30 text-cyan-400 hover:bg-cyan-500/10"
            >
              <RefreshCw className="w-4 h-4 mr-2" />
              Refresh
            </Button>

            <Button
              onClick={onExport}
              variant="outline"
              size="sm"
              className="border-green-500/30 text-green-400 hover:bg-green-500/10"
            >
              <Download className="w-4 h-4 mr-2" />
              Export CSV
            </Button>

            <Button
              onClick={copyIPsToClipboard}
              variant="outline"
              size="sm"
              className="border-purple-500/30 text-purple-400 hover:bg-purple-500/10"
            >
              <Copy className="w-4 h-4 mr-2" />
              Copy IPs
            </Button>

            <Button
              variant="outline"
              size="sm"
              className="border-orange-500/30 text-orange-400 hover:bg-orange-500/10"
            >
              <Filter className="w-4 h-4 mr-2" />
              Filter
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Devices Table */}
      <Card className="bg-gradient-to-br from-gray-900/80 to-gray-800/50 border-cyan-500/30 shadow-lg">
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Monitor className="w-5 h-5 text-cyan-400" />
            <span>Discovered Devices</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="border-slate-700 hover:bg-slate-800/50">
                  <TableHead className="text-cyan-400 font-semibold">
                    <div className="flex items-center space-x-1">
                      <Network className="w-4 h-4" />
                      <span>IP Address</span>
                    </div>
                  </TableHead>
                  <TableHead className="text-cyan-400 font-semibold">
                    <div className="flex items-center space-x-1">
                      <Wifi className="w-4 h-4" />
                      <span>MAC Address</span>
                    </div>
                  </TableHead>
                  <TableHead className="text-cyan-400 font-semibold">
                    <div className="flex items-center space-x-1">
                      <HardDrive className="w-4 h-4" />
                      <span>Hostname</span>
                    </div>
                  </TableHead>
                  <TableHead className="text-cyan-400 font-semibold">
                    <div className="flex items-center space-x-1">
                      <Monitor className="w-4 h-4" />
                      <span>Vendor</span>
                    </div>
                  </TableHead>
                  <TableHead className="text-cyan-400 font-semibold">Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {data.devices.map((device, index) => (
                  <motion.tr
                    key={device.ip}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.3, delay: index * 0.05 }}
                    className="border-slate-700 hover:bg-slate-800/50 transition-colors"
                  >
                    <TableCell>
                      <div className="flex items-center space-x-2">
                        {getDeviceIcon(device.vendor, device.hostname)}
                        <span className="font-mono text-blue-300">{device.ip}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <span className="font-mono text-gray-300 text-sm">
                        {truncateMac(device.mac)}
                      </span>
                    </TableCell>
                    <TableCell>
                      <span className="text-gray-300">
                        {device.hostname || 'Unknown'}
                      </span>
                    </TableCell>
                    <TableCell>
                      <span className="text-gray-300">
                        {device.vendor || 'Unknown'}
                      </span>
                    </TableCell>
                    <TableCell>
                      {getStatusBadge(device.status)}
                    </TableCell>
                  </motion.tr>
                ))}
              </TableBody>
            </Table>
          </div>

          {data.devices.length === 0 && (
            <div className="text-center py-8">
              <Network className="w-12 h-12 text-gray-500 mx-auto mb-3" />
              <p className="text-gray-400">No devices discovered</p>
              <p className="text-sm text-gray-500">Try refreshing or check your network range</p>
            </div>
          )}
        </CardContent>
      </Card>
    </motion.div>
  )
}