"use client"

import { useState } from "react"
import {
  Settings,
  Brain,
  Code,
  Play,
  Wrench,
  Layers,
  Search,
  Shield,
  Cloud,
  Cog,
  CheckCircle,
  FileText,
  ChevronRight,
  Menu,
} from "lucide-react"

// ---------------- Global Styles ----------------
const GlobalStyles = () => (
  <style>{`
    @import "tailwindcss";
    :root {
      --background: #ffffff;
      --foreground: #1f2937;
      --card: #ffffff;
      --card-foreground: #1f2937;
      --primary: #059669;
      --primary-foreground: #ffffff;
      --border: #e5e7eb;
      --sidebar: #f9fafb;
      --sidebar-border: #e5e7eb;
      --muted-foreground: #6b7280;
    }
    body {
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
    }
  `}</style>
)

// ---------------- FeatureCard ----------------
interface FeatureCardProps {
  icon: React.ComponentType<{ className?: string }>
  title: string
  description: string
}

function FeatureCard({ icon: Icon, title, description }: FeatureCardProps) {
  return (
    <div className="group border-2 border-green-500 hover:border-green-600 transition-all duration-200 hover:shadow-md cursor-pointer rounded-lg bg-white hover:bg-green-50">
      <div className="p-6">
        <div className="flex flex-col items-start space-y-4">
          <div className="p-3 bg-gray-100 group-hover:bg-green-100 rounded-lg transition-colors duration-200">
            <Icon className="w-6 h-6 text-gray-600 group-hover:text-green-600 transition-colors duration-200" />
          </div>
          <div>
            <h3 className="font-semibold text-lg text-gray-900 group-hover:text-green-700 mb-2 transition-colors duration-200">{title}</h3>
            <p className="text-sm text-gray-600 leading-relaxed">{description}</p>
          </div>
        </div>
      </div>
    </div>
  )
}

// ---------------- Feedback Section ----------------
function FeedbackSection() {
  return (
    <div className="mt-12 pt-8 border-t border-gray-200">
      <h2 className="text-xl font-semibold mb-4 text-gray-900">Feedback</h2>
      <p className="text-gray-600 mb-4">Was this page helpful?</p>
      <div className="flex gap-3">
        <button className="px-4 py-2 rounded-md bg-green-600 text-white hover:bg-green-700 transition-colors duration-200">Yes</button>
        <button className="px-4 py-2 rounded-md bg-green-600 text-white hover:bg-green-700 transition-colors duration-200">No</button>
      </div>
    </div>
  )
}

// ---------------- Navigation Item Component ----------------
interface NavItemProps {
  title: string
  index: number
}

function NavItem({ title, index }: NavItemProps) {
  return (
    <a href="#" className="flex items-center justify-between px-3 py-2 text-sm text-gray-700 hover:text-green-600 hover:bg-green-50 rounded-md transition-colors group">
      <span>{title}</span>
      <ChevronRight className="w-4 h-4 opacity-0 group-hover:opacity-100 transition-opacity text-green-600" />
    </a>
  )
}

// ---------------- Sidebar ----------------
function Sidebar({ open }: { open: boolean }) {
  return (
    <aside
      className={`fixed sm:static top-16 sm:top-0 left-0 h-full sm:h-screen w-64 bg-gray-50 p-4 z-40 transform transition-transform ${
        open ? "translate-x-0" : "-translate-x-full sm:translate-x-0"
      }`}
    >
      <div className="mb-6">
        <h2 className="text-sm font-semibold text-gray-500 mb-4 uppercase tracking-wide">Documentation</h2>
      </div>
      <nav className="space-y-1 overflow-y-auto h-[calc(100vh-10rem)]">
        <NavItem key="nav1" title="Introduction to XploitEye" index={1} />
        <NavItem key="nav2" title="Getting started" index={2} />
        <NavItem key="nav3" title="Deploy XploitEye" index={3} />
        <NavItem key="nav4" title="Scan projects" index={4} />
        <NavItem key="nav5" title="AI inventory and governance" index={5} />
        <NavItem key="nav6" title="Dashboards" index={6} />
        <NavItem key="nav7" title="Policies" index={7} />
        <NavItem key="nav8" title="Manage projects" index={8} />
        <NavItem key="nav9" title="SAST scan with Endor Labs" index={9} />
        <NavItem key="nav10" title="Upgrades and remediation" index={10} />
        <NavItem key="nav11" title="CI/CD Security" index={11} />
        <NavItem key="nav12" title="Detect secret leaks" index={12} />
        <NavItem key="nav13" title="Manage SBOMs" index={13} />
        <NavItem key="nav14" title="XploitEye CLI" index={14} />
        <NavItem key="nav15" title="REST API" index={15} />
        <NavItem key="nav16" title="Administration" index={16} />
        <NavItem key="nav17" title="XploitEye integrations" index={17} />
        <NavItem key="nav18" title="Research Open Source Risks" index={18} />
      </nav>
    </aside>
  )
}

// ---------------- Main App ----------------
export default function App() {
  const [sidebarOpen, setSidebarOpen] = useState(false)

  return (
    // 👇 changed pt-16 to pt-20 to push content below a taller header
    <div className="min-h-screen flex bg-white pt-20">
      <GlobalStyles />

      <div className="flex flex-1">
        <Sidebar open={sidebarOpen} />

        <main className="flex-1 p-8">
          <div className="max-w-6xl mx-auto">
            <div className="sm:hidden mb-4 flex items-center justify-between">
              <div className="relative w-full max-w-xs">
                <input
                  type="text"
                  placeholder="Search..."
                  className="w-full pl-10 pr-3 py-2 rounded-md border border-gray-300 focus:outline-none focus:ring-2 focus:ring-green-500 text-sm"
                />
                <Search className="absolute left-3 top-2.5 w-4 h-4 text-gray-400" />
              </div>
              <button
                className="ml-3 p-2 rounded-md border border-gray-300"
                onClick={() => setSidebarOpen(!sidebarOpen)}
              >
                <Menu className="w-5 h-5" />
              </button>
            </div>

            <div className="mb-8">
              <h1 className="text-4xl font-bold text-gray-900 mb-4">XploitEye User Documentation</h1>
              <p className="text-gray-600 text-lg leading-relaxed max-w-4xl">
                The XploitEye user documentation portal includes all essential technical documentation and release
                details you need to utilize the application and its APIs.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <FeatureCard key="feat0" icon={Settings} title="Getting started" description="Configure the Xploit Eye  tenant and start scanning your projects." />
              <FeatureCard key="feat1" icon={Brain} title="AI models & governance" description="Discover AI models and leverage AI for enhanced security analysis." />
              <FeatureCard key="feat2" icon={Code} title="REST API" description="Engage with XploitEye services programmatically." />
              <FeatureCard key="feat3" icon={Play} title="Run scans" description="Use XploitEye to scan and secure your codebase and software infrastructure." />
              <FeatureCard key="feat4" icon={Wrench} title="Upgrades and remediation" description="Discover and address vulnerabilities." />
              <FeatureCard key="feat5" icon={Layers} title="SAST" description="Detect vulnerabilities through code analysis." />
              <FeatureCard key="feat6" icon={Search} title="Detect secrets" description="Detect and triage leaked credentials or secrets." />
              <FeatureCard key="feat7" icon={Shield} title="Policy management" description="Efficiently manage and enforce policies to enhance security and compliance." />
              <FeatureCard key="feat8" icon={Cloud} title="Integrations" description="Streamline processes by building integrations with third-party systems." />
              <FeatureCard key="feat9" icon={Cog} title="Administration" description="Learn how to configure and manage important settings." />
              <FeatureCard key="feat10" icon={CheckCircle} title="Troubleshooting" description="Resolve issues you may encounter in the application." />
              <FeatureCard key="feat11" icon={FileText} title="Release updates" description="Stay up-to-date about our newest features and enhancements." />
            </div>

            <FeedbackSection />
          </div>
        </main>
      </div>

      {sidebarOpen && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 z-30 sm:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}
    </div>
  )
}
