"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/router"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import {
  Swords,
  FileCheck,
  GraduationCap,
  Target,
  Building,
  BarChart3,
  Bot,
  Search,
  Cpu,
  Shield,
  Network,
  Users,
  Lock,
  Activity,
  CheckCircle,
  ArrowRight,
  Star,
  TrendingUp,
} from "lucide-react"

export default function UseCasePage() {
  const [activeUseCase, setActiveUseCase] = useState(0)
  const [isVisible, setIsVisible] = useState(false)
  const router = useRouter()

  useEffect(() => {
    setIsVisible(true)
  }, [])

  const handleNavigation = (path: string) => {
    router.push(path)
  }

  const useCases = [
    {
      title: "Linux Kernel & Web Application Security Assessment",
      description:
        "Complete cyber kill chain automation including reconnaissance, scanning, exploitation simulation, and privilege escalation testing on Linux systems",
      icon: Shield,
      features: [
        "Metasploitable2, Damn Vulnerable Linux testing",
        "Kernel-level vulnerability detection",
        "Web API penetration testing",
        "Automated persistence exploitation",
      ],
      targetAudience: "Security Professionals",
      complexity: "Advanced",
      timeToValue: "2-4 Hours",
      roi: "300% faster than manual testing",
    },
    {
      title: "Multi-Agent AI-Powered Analysis",
      description: "Fine-tuned LLMs with RAG-based agents for vulnerability interpretation, attack path simulation, and defense recommendations",
      icon: Bot,
      features: [
        "AI-driven vulnerability analysis",
        "Attack path simulation & modeling",
        "Layered defense recommendations",
        "Real-time threat intelligence",
      ],
      targetAudience: "Enterprise & SMEs",
      complexity: "Professional",
      timeToValue: "1-2 Hours",
      roi: "85% reduction in analysis time",
    },
    {
      title: "Compliance & Standards Reporting",
      description: "Automated report generation aligned with ISO 27001/27002 and ISC2 standards for regulatory compliance",
      icon: FileCheck,
      features: [
        "ISO 27001/27002 compliance reports",
        "ISC2 standards alignment",
        "Automated evidence collection",
        "Executive-ready documentation",
      ],
      targetAudience: "Enterprise & Government",
      complexity: "Professional",
      timeToValue: "1-2 Days",
      roi: "70% reduction in compliance costs",
    },
    {
      title: "Educational Platform for Non-Experts",
      description: "User-friendly interface enabling SMEs, students, and startups to conduct self-guided security assessments without formal training",
      icon: GraduationCap,
      features: [
        "DVWA, WebGoat, Juice Shop integration",
        "Intuitive dashboard for beginners",
        "AI chatbot assistance & guidance",
        "Self-guided assessment workflows",
      ],
      targetAudience: "Students, SMEs & Startups",
      complexity: "Beginner to Intermediate",
      timeToValue: "Immediate",
      roi: "90% reduction in learning curve",
    },
  ]

  const stats = [
    {
      label: "Critical Vulnerabilities Identified",
      value: "15,000+",
      icon: Target,
      description: "Across 500+ organizations",
    },
    { label: "Enterprise Clients Protected", value: "500+", icon: Building, description: "Fortune 500 & Government" },
    {
      label: "Security Assessments Completed",
      value: "3,500+",
      icon: BarChart3,
      description: "With 99.7% accuracy rate",
    },
    { label: "Average Efficiency Gain", value: "85%", icon: TrendingUp, description: "Compared to manual processes" },
  ]

  const userTypes = [
    {
      name: "Small & Medium Enterprises",
      icon: Building,
      description: "Cost-effective cybersecurity solutions for growing businesses without dedicated security teams",
      challenges: ["Automated vulnerability scanning", "Compliance reporting", "Budget-friendly security"],
      clientCount: "300+",
    },
    {
      name: "Educational Institutions",
      icon: GraduationCap,
      description: "Comprehensive training platform for cybersecurity education and hands-on learning experiences",
      challenges: ["Student training programs", "Faculty development", "Research security projects"],
      clientCount: "200+",
    },
    {
      name: "Enterprise Organizations",
      icon: Shield,
      description: "Advanced multi-agent security testing for large-scale infrastructure and complex environments",
      challenges: ["Enterprise-grade assessments", "Multi-team coordination", "Advanced threat simulation"],
      clientCount: "150+",
    },
    {
      name: "Government & Defense",
      icon: Lock,
      description: "Mission-critical cybersecurity for public sector and critical infrastructure protection",
      challenges: ["Compliance validation", "Critical infrastructure protection", "Classified data security"],
      clientCount: "30+",
    },
  ]

  const benefits = [
    {
      title: "Dramatically Reduce Security Costs",
      description: "Eliminate 85% of manual security testing overhead while improving coverage and accuracy",
      icon: BarChart3,
      metric: "85% Cost Reduction",
      details: "Average savings of $2.3M annually",
    },
    {
      title: "Accelerate Compliance Reporting",
      description: "Generate comprehensive compliance reports in minutes with automated evidence collection",
      icon: CheckCircle,
      metric: "10x Faster Reporting",
      details: "From weeks to hours",
    },
    {
      title: "Achieve Complete Asset Coverage",
      description: "Comprehensive security assessment across web applications, networks, and cloud infrastructure",
      icon: Activity,
      metric: "100% Asset Visibility",
      details: "Zero blind spots guaranteed",
    },
    {
      title: "Scale Security Operations",
      description: "Enable lean security teams to perform enterprise-grade assessments with AI assistance",
      icon: Users,
      metric: "5x Team Productivity",
      details: "Handle 5x more assessments",
    },
  ]

  const ActiveUseCaseIcon = useCases[activeUseCase].icon

  return (
    <div className="min-h-screen bg-black text-foreground">
      {/* Embedded Global CSS from xploiteye-usecase */}
      <style jsx global>{`
        /* Global overflow fixes */
        html, body {
          overflow-x: hidden !important;
          max-width: 100vw !important;
          width: 100% !important;
          background-color: black !important;
          margin: 0 !important;
          padding: 0 !important;
        }

        * {
          box-sizing: border-box;
          margin: 0;
          padding: 0;
        }

        body, #__next, #root {
          margin: 0 !important;
          padding: 0 !important;
        }

        .min-h-screen {
          overflow-x: hidden;
          width: 100%;
          max-width: 100vw;
        }

        @import 'tailwindcss';
        @import 'tw-animate-css';

        @custom-variant dark (&:is(.dark *));

        :root {
          --background: oklch(1 0 0);
          --foreground: oklch(0.145 0 0);
          --card: oklch(1 0 0);
          --card-foreground: oklch(0.145 0 0);
          --popover: oklch(1 0 0);
          --popover-foreground: oklch(0.145 0 0);
          --primary: oklch(0.205 0 0);
          --primary-foreground: oklch(0.985 0 0);
          --secondary: oklch(0.97 0 0);
          --secondary-foreground: oklch(0.205 0 0);
          --muted: oklch(0.97 0 0);
          --muted-foreground: oklch(0.556 0 0);
          --accent: oklch(0.97 0 0);
          --accent-foreground: oklch(0.205 0 0);
          --destructive: oklch(0.577 0.245 27.325);
          --destructive-foreground: oklch(0.577 0.245 27.325);
          --border: oklch(0.922 0 0);
          --input: oklch(0.922 0 0);
          --ring: oklch(0.708 0 0);
          --chart-1: oklch(0.646 0.222 41.116);
          --chart-2: oklch(0.6 0.118 184.704);
          --chart-3: oklch(0.398 0.07 227.392);
          --chart-4: oklch(0.828 0.189 84.429);
          --chart-5: oklch(0.769 0.188 70.08);
          --radius: 0.625rem;
          --sidebar: oklch(0.985 0 0);
          --sidebar-foreground: oklch(0.145 0 0);
          --sidebar-primary: oklch(0.205 0 0);
          --sidebar-primary-foreground: oklch(0.985 0 0);
          --sidebar-accent: oklch(0.97 0 0);
          --sidebar-accent-foreground: oklch(0.205 0 0);
          --sidebar-border: oklch(0.922 0 0);
          --sidebar-ring: oklch(0.708 0 0);
        }

        .dark {
          --background: oklch(0.145 0 0);
          --foreground: oklch(0.985 0 0);
          --card: oklch(0.145 0 0);
          --card-foreground: oklch(0.985 0 0);
          --popover: oklch(0.145 0 0);
          --popover-foreground: oklch(0.985 0 0);
          --primary: oklch(0.985 0 0);
          --primary-foreground: oklch(0.205 0 0);
          --secondary: oklch(0.269 0 0);
          --secondary-foreground: oklch(0.985 0 0);
          --muted: oklch(0.269 0 0);
          --muted-foreground: oklch(0.708 0 0);
          --accent: oklch(0.269 0 0);
          --accent-foreground: oklch(0.985 0 0);
          --destructive: oklch(0.396 0.141 25.723);
          --destructive-foreground: oklch(0.637 0.237 25.331);
          --border: oklch(0.269 0 0);
          --input: oklch(0.269 0 0);
          --ring: oklch(0.439 0 0);
          --chart-1: oklch(0.488 0.243 264.376);
          --chart-2: oklch(0.696 0.17 162.48);
          --chart-3: oklch(0.769 0.188 70.08);
          --chart-4: oklch(0.627 0.265 303.9);
          --chart-5: oklch(0.645 0.246 16.439);
          --sidebar: oklch(0.205 0 0);
          --sidebar-foreground: oklch(0.985 0 0);
          --sidebar-primary: oklch(0.488 0.243 264.376);
          --sidebar-primary-foreground: oklch(0.985 0 0);
          --sidebar-accent: oklch(0.269 0 0);
          --sidebar-accent-foreground: oklch(0.985 0 0);
          --sidebar-border: oklch(0.269 0 0);
          --sidebar-ring: oklch(0.439 0 0);
        }

        :root {
          --font-sans: var(--font-geist-sans);
          --font-mono: var(--font-geist-mono);
          --color-background: var(--background);
          --color-foreground: var(--foreground);
          --color-card: var(--card);
          --color-card-foreground: var(--card-foreground);
          --color-popover: var(--popover);
          --color-popover-foreground: var(--popover-foreground);
          --color-primary: var(--primary);
          --color-primary-foreground: var(--primary-foreground);
          --color-secondary: var(--secondary);
          --color-secondary-foreground: var(--secondary-foreground);
          --color-muted: var(--muted);
          --color-muted-foreground: var(--muted-foreground);
          --color-accent: var(--accent);
          --color-accent-foreground: var(--accent-foreground);
          --color-destructive: var(--destructive);
          --color-destructive-foreground: var(--destructive-foreground);
          --color-border: var(--border);
          --color-input: var(--input);
          --color-ring: var(--ring);
          --color-chart-1: var(--chart-1);
          --color-chart-2: var(--chart-2);
          --color-chart-3: var(--chart-3);
          --color-chart-4: var(--chart-4);
          --color-chart-5: var(--chart-5);
          --radius-sm: calc(var(--radius) - 4px);
          --radius-md: calc(var(--radius) - 2px);
          --radius-lg: var(--radius);
          --radius-xl: calc(var(--radius) + 4px);
          --color-sidebar: var(--sidebar);
          --color-sidebar-foreground: var(--sidebar-foreground);
          --color-sidebar-primary: var(--sidebar-primary);
          --color-sidebar-primary-foreground: var(--sidebar-primary-foreground);
          --color-sidebar-accent: var(--sidebar-accent);
          --color-sidebar-accent-foreground: var(--sidebar-accent-foreground);
          --color-sidebar-border: var(--sidebar-border);
          --color-sidebar-ring: var(--sidebar-ring);
        }

        * {
          border-color: var(--border);
          outline-color: color-mix(in oklch, var(--ring) 50%, transparent);
        }
        body {
          background-color: var(--background);
          color: var(--foreground);
        }
      `}</style>

      {/* Hero Section */}
      <section className="relative py-24 px-4 cyber-grid matrix-bg">
        <div className="max-w-7xl mx-auto text-center">
          <div
            className={`transition-all duration-1000 ${isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-10"}`}
          >
            <Badge
              variant="secondary"
              className="mb-6 text-black bg-[#00f078]/90 border-[#00f078] px-4 py-2 text-sm font-semibold"
            >
              Enterprise Cybersecurity Platform
            </Badge>
            <h1 className="text-4xl sm:text-5xl md:text-7xl font-bold mb-8 text-balance leading-tight">
              <span className="text-white">XploitEye</span> <span className="text-[#00f078]">Use Cases</span>
            </h1>
            <p className="text-xl md:text-2xl text-gray-300 mb-10 max-w-4xl mx-auto text-pretty leading-relaxed">
              Discover how Fortune 500 companies and government agencies leverage XploitEye's AI-powered multi-agent
              system to automate vulnerability assessment, accelerate compliance, and strengthen their security posture
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button
                size="lg"
                className="bg-[#00f078] hover:bg-[#00f078]/90 text-black font-semibold glow-effect px-8 py-4 text-lg"
                onClick={() => handleNavigation('/signin')}
              >
                Start Security Assessment
                <ArrowRight className="ml-2 w-5 h-5" />
              </Button>
              <Button
                size="lg"
                variant="outline"
                className="border-[#00f078] text-[#00f078] hover:bg-[#00f078]/20 hover:border-[#00f078] bg-transparent px-8 py-4 text-lg transition-all"
                onClick={() => handleNavigation('/contactus')}
              >
                Schedule Demo
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Enhanced Stats Section */}
      <section className="py-20 px-4 bg-gradient-to-b from-gray-900/50 to-transparent">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">Proven Results Across Industries</h2>
            <p className="text-xl text-gray-300 max-w-3xl mx-auto">
              Trusted by leading organizations worldwide to secure their digital infrastructure
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {stats.map((stat, index) => (
              <div key={index} className="text-center group">
                <div className="bg-[#0f1b17] border border-gray-800 rounded-xl p-6 hover:border-[#00f078]/50 transition-all duration-300">
                  <stat.icon className="w-12 h-12 mx-auto mb-4 text-[#00f078] group-hover:scale-110 transition-transform" />
                  <div className="text-3xl font-bold text-[#00f078] mb-2">{stat.value}</div>
                  <div className="text-lg font-semibold text-white mb-2">{stat.label}</div>
                  <div className="text-sm text-gray-400">{stat.description}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Enhanced Benefits Section */}
      <section className="py-20 px-4">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold mb-6">Measurable Business Impact</h2>
            <p className="text-xl text-gray-300 max-w-3xl mx-auto">
              Transform your cybersecurity operations with quantifiable ROI and enterprise-grade capabilities
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {benefits.map((benefit, index) => (
              <Card
                key={index}
                className="bg-[#0f1b17] border-gray-800 hover:border-[#00f078]/50 transition-all duration-300 group"
              >
                <CardHeader className="text-center p-6">
                  <benefit.icon className="w-14 h-14 mx-auto mb-4 text-[#00f078] group-hover:scale-110 transition-transform" />
                  <CardTitle className="text-lg mb-2">{benefit.title}</CardTitle>
                  <div className="text-2xl font-bold text-[#00f078] mb-2">{benefit.metric}</div>
                  <div className="text-sm text-gray-400">{benefit.details}</div>
                </CardHeader>
                <CardContent className="p-6 pt-0">
                  <p className="text-gray-300 text-sm leading-relaxed">{benefit.description}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Enhanced Use Cases Grid */}
      <section className="py-20 px-4 bg-gradient-to-b from-gray-900/30 to-transparent">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold mb-6">Comprehensive Security Solutions</h2>
            <p className="text-xl text-gray-300 max-w-4xl mx-auto">
              From advanced red team simulations to automated compliance reporting, XploitEye delivers enterprise-grade
              security solutions tailored to your organization's specific needs
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {useCases.map((useCase, index) => (
              <Card
                key={index}
                className={`group cursor-pointer transition-all duration-300 hover:scale-[1.02] hover:shadow-2xl bg-[#0f1b17] border-gray-800 hover:border-[#00f078]/50 ${
                  activeUseCase === index ? "ring-2 ring-[#00f078] shadow-lg shadow-[#00f078]/20" : ""
                }`}
                onClick={() => setActiveUseCase(index)}
              >
                <CardHeader className="p-8">
                  <div className="flex items-start gap-4 mb-4">
                    <div className="p-3 bg-[#00f078]/10 rounded-lg">
                      <useCase.icon className="w-8 h-8 text-[#00f078]" />
                    </div>
                    <div className="flex-1">
                      <CardTitle className="text-xl mb-2 text-white group-hover:text-[#00f078] transition-colors">
                        {useCase.title}
                      </CardTitle>
                      <div className="text-sm font-semibold text-[#00f078] mb-2">{useCase.roi}</div>
                    </div>
                  </div>
                  <CardDescription className="text-gray-300 text-base leading-relaxed">
                    {useCase.description}
                  </CardDescription>
                </CardHeader>
                <CardContent className="p-8 pt-0">
                  <div className="space-y-6">
                    <div className="flex flex-wrap gap-2">
                      <Badge variant="secondary" className="bg-[#00f078]/80 text-black border-[#00f078]/30">
                        {useCase.targetAudience}
                      </Badge>
                      <Badge variant="outline" className="border-gray-600 text-gray-300">
                        {useCase.complexity}
                      </Badge>
                      <Badge variant="outline" className="border-cyan-500/50 text-cyan-400">
                        {useCase.timeToValue}
                      </Badge>
                    </div>
                    <div>
                      <h4 className="font-semibold text-white mb-3">Key Capabilities:</h4>
                      <ul className="space-y-2">
                        {useCase.features.map((feature, featureIndex) => (
                          <li key={featureIndex} className="flex items-center gap-3 text-sm">
                            <CheckCircle className="w-4 h-4 text-[#00f078] flex-shrink-0" />
                            <span className="text-gray-300">{feature}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Enhanced Industries Section */}
      <section className="py-20 px-4">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold mb-6">Who Can Use XploitEye?</h2>
            <p className="text-xl text-gray-300 max-w-4xl mx-auto">
              XploitEye is designed for organizations of all sizes seeking to strengthen their cybersecurity posture
              with AI-powered automation and comprehensive vulnerability assessment capabilities
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {userTypes.map((userType, index) => (
              <Card
                key={index}
                className="bg-[#0f1b17] border-gray-800 hover:border-[#00f078]/50 transition-all duration-300 group"
              >
                <CardHeader className="text-center p-6">
                  <userType.icon className="w-16 h-16 mx-auto mb-4 text-[#00f078] group-hover:scale-110 transition-transform" />
                  <CardTitle className="text-xl mb-2">{userType.name}</CardTitle>
                  <div className="text-sm text-[#00f078] font-semibold mb-3">{userType.clientCount} organizations</div>
                  <CardDescription className="text-gray-300 text-sm leading-relaxed">
                    {userType.description}
                  </CardDescription>
                </CardHeader>
                <CardContent className="p-6 pt-0">
                  <div className="space-y-3">
                    <h4 className="font-semibold text-white text-sm">Perfect For:</h4>
                    <ul className="space-y-2">
                      {userType.challenges.map((challenge, challengeIndex) => (
                        <li key={challengeIndex} className="flex items-center gap-2 text-xs text-gray-300">
                          <Star className="w-3 h-3 text-[#00f078] flex-shrink-0" />
                          {challenge}
                        </li>
                      ))}
                    </ul>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>




      {/* Technology Stack */}
      <section className="py-12 sm:py-16 md:py-20 px-2 sm:px-4 bg-card/30">
        <div className="max-w-7xl mx-auto text-center">
          <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold mb-4">Powered by Advanced AI</h2>
          <p className="text-base sm:text-lg md:text-xl text-muted-foreground mb-8 sm:mb-12 max-w-3xl mx-auto px-2">
            XploitEye leverages cutting-edge technologies to deliver comprehensive cybersecurity solutions
          </p>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-6 md:gap-8 px-2 sm:px-0">
            <Card className="bg-[#0f1b17] border-border/50">
              <CardHeader className="p-4 sm:p-6">
                <Bot className="w-12 h-12 sm:w-14 sm:h-14 md:w-16 md:h-16 mx-auto mb-4 text-[#00f078]" />
                <CardTitle className="text-base sm:text-lg md:text-xl">Multi-Agent LLMs</CardTitle>
              </CardHeader>
              <CardContent className="p-4 sm:p-6 pt-0">
                <p className="text-muted-foreground text-xs sm:text-sm">
                  Fine-tuned Large Language Models working in coordination to simulate attack scenarios and recommend
                  defenses
                </p>
              </CardContent>
            </Card>

            <Card className="bg-[#0f1b17] border-border/50">
              <CardHeader className="p-4 sm:p-6">
                <Search className="w-12 h-12 sm:w-14 sm:h-14 md:w-16 md:h-16 mx-auto mb-4 text-[#00f078]" />
                <CardTitle className="text-base sm:text-lg md:text-xl">RAG Architecture</CardTitle>
              </CardHeader>
              <CardContent className="p-4 sm:p-6 pt-0">
                <p className="text-muted-foreground text-xs sm:text-sm">
                  Retrieval-Augmented Generation for real-time vulnerability analysis and contextual security
                  recommendations
                </p>
              </CardContent>
            </Card>

            <Card className="bg-[#0f1b17] border-border/50">
              <CardHeader className="p-4 sm:p-6">
                <Cpu className="w-12 h-12 sm:w-14 sm:h-14 md:w-16 md:h-16 mx-auto mb-4 text-[#00f078]" />
                <CardTitle className="text-base sm:text-lg md:text-xl">MCP Orchestration</CardTitle>
              </CardHeader>
              <CardContent className="p-4 sm:p-6 pt-0">
                <p className="text-muted-foreground text-xs sm:text-sm">
                  Multi-Context Protocol layer managing workflows, access control, and automated security processes
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Enhanced CTA Section */}
      <section className="py-20 px-4 bg-gradient-to-r from-[#00f078]/10 via-transparent to-cyan-400/10">
        <div className="max-w-5xl mx-auto text-center">
          <h2 className="text-3xl md:text-5xl font-bold mb-6">Ready to Transform Your Security Operations?</h2>
          <p className="text-xl text-gray-300 mb-8 leading-relaxed">
            Join 500+ organizations already using XploitEye to automate vulnerability assessments, accelerate
            compliance, and strengthen their security posture with measurable ROI
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center mb-8">
            <Button
              size="lg"
              className="bg-[#00f078] hover:bg-[#00f078]/90 text-black font-semibold glow-effect px-8 py-4 text-lg"
              onClick={() => handleNavigation('/register')}
            >
              Start Free Assessment
              <ArrowRight className="ml-2 w-5 h-5" />
            </Button>
            <Button
              size="lg"
              variant="outline"
              className="border-[#00f078] text-[#00f078] hover:bg-[#00f078]/20 hover:border-[#00f078] bg-transparent px-8 py-4 text-lg transition-all"
              onClick={() => handleNavigation('/contactus')}
            >
              Contact Our Team
            </Button>
          </div>
          <p className="text-sm text-gray-400">
            ✓ 30-day free trial ✓ No credit card required ✓ Enterprise support included
          </p>
        </div>
      </section>


      <style jsx>{`
        .cyber-grid {
          background-image: 
            linear-gradient(rgba(0, 240, 120, 0.1) 1px, transparent 1px),
            linear-gradient(90deg, rgba(0, 240, 120, 0.1) 1px, transparent 70%);
          background-size: 50px 50px;
        }
        
        .matrix-bg {
          position: relative;
          overflow: hidden;
        }
        
        .matrix-bg::before {
          content: '';
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: radial-gradient(circle at 50% 50%, rgba(0, 240, 120, 0.1) 0%, transparent 70%);
          animation: pulse 4s ease-in-out infinite;
        }
        
        .glow-effect {
          box-shadow: 0 0 20px rgba(0, 240, 120, 0.3);
        }
        
        .glow-effect:hover {
          box-shadow: 0 0 30px rgba(0, 240, 120, 0.5);
        }
        
        @keyframes pulse {
          0%, 100% { opacity: 0.5; }
          50% { opacity: 1; }
        }
      `}</style>
    </div>
  )
}