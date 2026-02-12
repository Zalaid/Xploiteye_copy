"use client"

import React from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Globe, Shield, Zap, Search, Server, Cpu } from 'lucide-react'
import { motion } from 'framer-motion'

interface WebScanDetailsProps {
    reconData: any
    technologies: Record<string, string>
    sslInfo: any
    networkPorts: any
}

export function WebScanDetails({ reconData, technologies, sslInfo, networkPorts }: WebScanDetailsProps) {
    return (
        <div className="space-y-6 mt-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Technologies Detected */}
                <Card className="bg-gray-900/50 border-blue-500/20">
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm flex items-center gap-2">
                            <Cpu className="w-4 h-4 text-blue-400" />
                            <span>Technology Stack</span>
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="flex flex-wrap gap-2">
                            {Object.entries(technologies).map(([tech, version]) => (
                                <div key={tech} className="flex flex-col p-2 bg-gray-800/50 rounded border border-gray-700/50 min-w-[100px]">
                                    <span className="text-xs text-gray-400 uppercase font-bold tracking-tighter">{tech}</span>
                                    <span className="text-sm text-blue-300 font-mono">{version || 'Detected'}</span>
                                </div>
                            ))}
                            {Object.keys(technologies).length === 0 && (
                                <p className="text-xs text-gray-500">No specific technologies identified.</p>
                            )}
                        </div>
                    </CardContent>
                </Card>

                {/* SSL Status */}
                <Card className="bg-gray-900/50 border-green-500/20">
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm flex items-center gap-2">
                            <Shield className="w-4 h-4 text-green-400" />
                            <span>SSL Certificate</span>
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        {sslInfo && (
                            <div className="space-y-2">
                                <div className="flex justify-between items-center">
                                    <span className="text-xs text-gray-400">Issuer:</span>
                                    <span className="text-xs text-gray-200 truncate ml-2">{sslInfo.issuer || 'N/A'}</span>
                                </div>
                                <div className="flex justify-between items-center">
                                    <span className="text-xs text-gray-400">Expiry:</span>
                                    <Badge variant="outline" className="text-[10px] py-0 border-green-500/30 text-green-400">
                                        {sslInfo.expiry_date || 'N/A'}
                                    </Badge>
                                </div>
                                <div className="flex justify-between items-center">
                                    <span className="text-xs text-gray-400">Algorithm:</span>
                                    <span className="text-xs font-mono text-gray-300">{sslInfo.cipher || 'N/A'}</span>
                                </div>
                            </div>
                        )}
                    </CardContent>
                </Card>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* DNS / Recon */}
                <Card className="bg-gray-900/50 border-purple-500/20">
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm flex items-center gap-2">
                            <Search className="w-4 h-4 text-purple-400" />
                            <span>Reconnaissance (DNS)</span>
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        {reconData?.dns && (
                            <div className="space-y-1">
                                <div className="flex flex-wrap gap-1">
                                    {reconData.dns.ip?.map((ip: string) => (
                                        <Badge key={ip} className="bg-purple-500/10 text-purple-300 border-purple-500/30 font-mono text-[10px]">
                                            IP: {ip}
                                        </Badge>
                                    ))}
                                </div>
                                {reconData.dns.mx && (
                                    <div className="mt-2">
                                        <p className="text-[10px] text-gray-500 uppercase font-bold">Mail Servers (MX):</p>
                                        <div className="flex flex-wrap gap-1 mt-1">
                                            {reconData.dns.mx.map((mx: string) => (
                                                <span key={mx} className="text-[10px] font-mono text-gray-400 bg-black/20 px-1 rounded truncate max-w-full">{mx}</span>
                                            ))}
                                        </div>
                                    </div>
                                )}
                            </div>
                        )}
                    </CardContent>
                </Card>

                {/* Network Ports */}
                <Card className="bg-gray-900/50 border-yellow-500/20">
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm flex items-center gap-2">
                            <Server className="w-4 h-4 text-yellow-400" />
                            <span>Service Discovery</span>
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="flex flex-wrap gap-2">
                            {Array.isArray(networkPorts) && networkPorts.map((p: any) => (
                                <div key={p.port} className="flex items-center gap-2 bg-yellow-500/5 border border-yellow-500/20 px-2 py-1 rounded">
                                    <span className="text-xs font-bold text-yellow-400">{p.port}</span>
                                    <span className="text-xs text-gray-400">{p.service || 'unknown'}</span>
                                </div>
                            ))}
                            {(!networkPorts || networkPorts.length === 0) && (
                                <p className="text-xs text-gray-500">No open ports discovered.</p>
                            )}
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    )
}
