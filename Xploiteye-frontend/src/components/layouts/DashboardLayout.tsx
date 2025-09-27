"use client"

import React, { useState } from 'react'
import { DashboardSidebar } from '@/components/dashboard/DashboardSidebar'
import { useAuth } from '../../auth/AuthContext'
import ProtectedRoute from '../ProtectedRoute'

interface DashboardLayoutProps {
  children: React.ReactNode
}

export function DashboardLayout({ children }: DashboardLayoutProps) {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false)
  const { user } = useAuth()
  
  // Determine user role from context, default to 'viewer'
  const getUserRole = () => {
    if (!user) return 'viewer'
    const username = user.username?.toLowerCase() || ''
    if (username.includes('admin')) return 'admin'
    if (username.includes('analyst') || username.includes('red') || username.includes('blue')) return 'analyst'
    return 'viewer'
  }

  const userRole = getUserRole()

  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-background">
        <DashboardSidebar 
          collapsed={sidebarCollapsed}
          onToggle={() => setSidebarCollapsed(!sidebarCollapsed)}
          userRole={userRole}
        />
        
        <main 
          className={`transition-all duration-300 ${
            sidebarCollapsed ? 'ml-16' : 'ml-64'
          }`}
        >
          <div className="p-6">
            {children}
          </div>
        </main>
      </div>
    </ProtectedRoute>
  )
}