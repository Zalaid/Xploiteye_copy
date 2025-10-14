"use client"

import { motion } from "framer-motion"
import Link from "next/link"
import { useRouter } from "next/router"
import { useAuth } from '../../auth/AuthContext'
import {
  Home,
  Search,
  Shield,
  Bot,
  FileText,
  LogOut,
  ChevronLeft,
  Activity,
  MessageSquare,
  Settings,
  TrendingUp,
  Globe,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

interface DashboardSidebarProps {
  collapsed: boolean
  onToggle: () => void
  userRole: "admin" | "analyst" | "viewer"
}

const menuItems = [
  { icon: Home, label: "Dashboard", href: "/dashboard", roles: ["admin", "analyst", "viewer"] },
  { icon: Search, label: "Network Scanning", href: "/dashboard/scanning", roles: ["admin", "analyst", "viewer"] },
  {
    icon: TrendingUp,
    label: "Vulnerability Analysis",
    href: "/dashboard/vulnerability-analysis",
    roles: ["admin", "analyst", "viewer"],
  },
  { icon: Bot, label: "Red Agent", href: "/dashboard/red-agent", roles: ["admin", "analyst", "viewer"] },
  { icon: Shield, label: "Blue Agent", href: "/dashboard/blue-agent", roles: ["admin", "analyst", "viewer"] },
  {
    icon: MessageSquare,
    label: "RAG Chatbot",
    href: "/dashboard/rag-chatbot",
    roles: ["admin", "analyst", "viewer"],
  },
  { icon: FileText, label: "Reports", href: "/dashboard/reports", roles: ["admin", "analyst", "viewer"] },
  { icon: Settings, label: "Settings", href: "/dashboard/settings", roles: ["admin", "analyst", "viewer"] },
]

export function DashboardSidebar({ collapsed, onToggle, userRole }: DashboardSidebarProps) {
  const router = useRouter()
  const { logout } = useAuth()
  const pathname = router.pathname

  const filteredMenuItems = menuItems.filter((item) => item.roles.includes(userRole))

  const handleLogout = async () => {
    try {
      await logout()
      router.push('/')
    } catch (error) {
      console.error('Logout error:', error)
      // Force logout even if backend call fails
      router.push('/')
    }
  }

  return (
    <motion.div
      initial={false}
      animate={{ width: collapsed ? 64 : 256 }}
      className="fixed left-0 top-0 h-full bg-card border-r border-border z-50"
    >
      <div className="flex flex-col h-full">
        {/* Header */}
        <div className="p-4 border-b border-border">
          <div className="flex items-center justify-between">
            {!collapsed && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="flex items-center space-x-2"
              >
                <div className="w-8 h-8 bg-gradient-to-br from-green-400 to-emerald-600 rounded-lg flex items-center justify-center">
                  <Activity className="w-5 h-5 text-white" />
                </div>
                <span className="font-bold text-lg bg-gradient-to-r from-green-400 to-emerald-600 bg-clip-text text-transparent">
                  XploitEye
                </span>
              </motion.div>
            )}
            <Button variant="ghost" size="sm" onClick={onToggle} className="hover:bg-accent">
              <ChevronLeft className={cn("w-4 h-4 transition-transform", collapsed && "rotate-180")} />
            </Button>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 p-2">
          <ul className="space-y-1">
            {filteredMenuItems.map((item) => {
              const isActive = pathname === item.href
              return (
                <li key={item.href}>
                  <Link href={item.href}>
                    <motion.div
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      className={cn(
                        "flex items-center space-x-3 px-3 py-2 rounded-lg transition-all duration-200",
                        isActive
                          ? "bg-gradient-to-r from-green-500/20 to-emerald-500/20 text-green-400 border border-green-500/30"
                          : "hover:bg-accent text-muted-foreground hover:text-foreground",
                      )}
                    >
                      <motion.div whileHover={{ rotate: 360 }} transition={{ duration: 0.3 }}>
                        <item.icon className={cn("w-5 h-5", isActive && "text-green-400")} />
                      </motion.div>
                      {!collapsed && (
                        <motion.span
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          exit={{ opacity: 0 }}
                          className="font-medium"
                        >
                          {item.label}
                        </motion.span>
                      )}
                    </motion.div>
                  </Link>
                </li>
              )
            })}
          </ul>
        </nav>

        {/* Footer */}
        <div className="p-2 border-t border-border space-y-1">
          <Link href="/">
            <Button
              variant="ghost"
              className="w-full justify-start text-muted-foreground hover:text-foreground"
            >
              <Globe className="w-5 h-5" />
              {!collapsed && <span className="ml-3">Back to Website</span>}
            </Button>
          </Link>
          <Button
            variant="ghost"
            className="w-full justify-start text-muted-foreground hover:text-foreground"
            onClick={handleLogout}
          >
            <LogOut className="w-5 h-5" />
            {!collapsed && <span className="ml-3">Sign Out</span>}
          </Button>
        </div>
      </div>
    </motion.div>
  )
}
