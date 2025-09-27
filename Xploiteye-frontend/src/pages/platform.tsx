import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import MultiAgentArchitecture from '../components/ui/MultiAgentArchitecture';
import Link from 'next/link';
import { TypingOnScroll } from '../components/ui/TypingOnScroll';

const Platform = () => {
  const [activeFeature, setActiveFeature] = useState(0);
  const [isVisible, setIsVisible] = useState({ tools: false, features: false });

  const allSecurityTools = [
    { name: "OWASP ZAP", category: "Web Security" },
    { name: "Nmap", category: "Network Scanning" },
    { name: "Nikto", category: "Web Scanning" },
    { name: "SQLmap", category: "Database Security" },
    { name: "Hydra", category: "Authentication" },
    { name: "Metasploit", category: "Exploitation" },
    { name: "Burp Suite", category: "Web Testing" },
    { name: "Wireshark", category: "Network Analysis" },
    { name: "John the Ripper", category: "Password Cracking" },
    { name: "Aircrack-ng", category: "Wireless Security" },
    { name: "Ghidra", category: "Reverse Engineering" },
    { name: "Nessus", category: "Vulnerability Scanning" },
    { name: "Snort", category: "IDS/IPS" },
    { name: "Wazuh", category: "SIEM/XDR" },
    { name: "Shodan", category: "Asset Discovery" },
    { name: "Maltego", category: "Threat Intelligence" },
    { name: "Autopsy", category: "Digital Forensics" },
    { name: "Volatility", category: "Memory Forensics" },
    { name: "ClamAV", category: "Antivirus" },
    { name: "Radare2", category: "Reverse Engineering" },
    { name: "OpenVAS", category: "Vulnerability Scanning" },
    { name: "TheHive", category: "Incident Response" },
    { name: "MISP", category: "Threat Intelligence" },
    { name: "GoBuster", category: "Directory Brute-forcing" },
    { name: "Hashcat", category: "Password Recovery" },
    { name: "Kismet", category: "Wireless Sniffing" },
    { name: "OSSEC", category: "Host-based IDS" },
    { name: "Cuckoo Sandbox", category: "Malware Analysis" },
    { name: "BloodHound", category: "Active Directory" },
    { name: "Bettercap", category: "MITM Attacks" },
  ];

  const toolsRow1 = allSecurityTools.slice(0, 15);
  const toolsRow2 = allSecurityTools.slice(15);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setIsVisible(prev => ({ ...prev, [entry.target.id]: true }));
          }
        });
      },
      { threshold: 0.1 }
    );

    const elementsToAnimate = document.querySelectorAll('[data-animate]');
    elementsToAnimate.forEach((el) => observer.observe(el));

    const scrollers = document.querySelectorAll(".scroller");
    if (!window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      scrollers.forEach((scroller) => {
        scroller.setAttribute("data-animated", "true");
      });
    }

    return () => observer.disconnect();
  }, []);

  const platformFeatures = [
    {
      title: "Vulnerability Assessment",
      description: "Advanced AI-powered scanning engine that conducts comprehensive security assessments for web applications, networks, and infrastructure with industry-leading accuracy and minimal false positives.",
      icon: <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"/><path d="M21 21l-4.35-4.35"/></svg>,
      details: [ 
        "OWASP Top 10 Detection", 
        "Network Port Scanning", 
        "SSL/TLS Certificate Analysis",
        "SQL Injection Testing",
        "XSS Vulnerability Checks",
        "Authentication Bypass Tests"
      ]
    },
    {
      title: "Multi-Agent Penetration Testing",
      description: "Coordinated AI agents simulate sophisticated attack scenarios from initial reconnaissance through full exploitation, providing comprehensive security validation with automated attack chains.",
      icon: <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="14,6 10,14 21,3 3,21 10,14"/><path d="M14 6L21 3L10 14"/></svg>,
      details: [ 
        "Automated Reconnaissance", 
        "Exploit Chain Discovery", 
        "Privilege Escalation Paths",
        "Lateral Movement Testing",
        "Data Exfiltration Simulation",
        "Persistence Mechanism Analysis"
      ]
    },
    {
      title: "Compliance & Reporting",
      description: "Generate comprehensive security reports aligned with international standards including ISO 27001, ISC2, NIST, and industry best practices with executive-level insights and technical details.",
      icon: <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"/><polyline points="9,9 15,9"/><polyline points="9,15 15,15"/><line x1="9" y1="12" x2="15" y2="12"/></svg>,
      details: [ 
        "ISO 27001 Compliance Reports", 
        "Executive Summary Dashboards", 
        "Risk Assessment Matrices",
        "CVSS Scoring Integration",
        "Remediation Priority Ranking",
        "Regulatory Compliance Mapping"
      ]
    },
    {
      title: "Intelligent AI Assistant",
      description: "RAG-enhanced AI chatbot provides real-time security guidance, explains complex vulnerabilities in plain language, and offers actionable remediation advice with contextual understanding.",
      icon: <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/><path d="M8 10h.01"/><path d="M12 10h.01"/><path d="M16 10h.01"/></svg>,
      details: [ 
        "Natural Language Explanations", 
        "Interactive Q&A Interface", 
        "24/7 Security Consultation",
        "Contextual Vulnerability Analysis",
        "Remediation Step-by-Step Guides",
        "Security Best Practice Recommendations"
      ]
    }
  ];

  return (
    <>
      {/* All CSS styles are embedded here for a single-file solution */}
      <style dangerouslySetInnerHTML={{ __html: `
        * {
          margin: 0;
          padding: 0;
          box-sizing: border-box;
        }
        html, body {
          overflow-x: hidden !important;
          max-width: 100vw !important;
          margin: 0 !important;
          padding: 0 !important;
        }
        :root {
          --color-primary-green: #00f078;
          --color-bright-green: #00ff88;
          --color-almost-black: #0d0d0d;
          --color-pure-white: #ffffff;
        }
        body {
          margin: 0;
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', 'Oxygen',
            'Ubuntu', 'Cantarell', 'Fira Sans', 'Droid Sans', 'Helvetica Neue',
            sans-serif;
          -webkit-font-smoothing: antialiased;
          -moz-osx-font-smoothing: grayscale;
        }
        .platform-page {
          background: #0d0d0d;
          color: #ffffff;
          min-height: 100vh;
          overflow-x: hidden;
        }
        .platform-hero {
          padding: 150px 0 40px;
          position: relative;
          background: radial-gradient(ellipse at center, rgba(0, 255, 127, 0.1) 0%, transparent 70%);
        }
        .platform-hero::before {
          content: '';
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: linear-gradient(135deg, rgba(0, 255, 127, 0.05) 0%, transparent 50%, rgba(0, 255, 127, 0.03) 100%);
          pointer-events: none;
        }
        .container {
            max-width: 1200px;
            margin: 0 auto;
            padding: 0 1rem;
        }
        .platform-hero__content {
          text-align: center;
          max-width: 900px;
          margin: 0 auto;
          position: relative;
          z-index: 2;
        }
        .platform-hero__title {
          font-size: clamp(2.5rem, 5vw, 4rem);
          font-weight: 700;
          line-height: 1.1;
          margin-bottom: 1rem;
          text-shadow: 0 0 30px rgba(0, 255, 127, 0.3);
        }
        .title-white {
          color: #ffffff;
        }
        .title-gradient {
          background-image: linear-gradient(98deg, #00f078, #3fe1f3 58%, #9f69f7);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
        }
        .platform-hero__description {
          font-size: 1.25rem;
          line-height: 1.6;
          color: rgba(255, 255, 255, 0.95);
          margin-bottom: 3rem;
          max-width: 700px;
          margin-left: auto;
          margin-right: auto;
          text-shadow: 0 0 10px rgba(255, 255, 255, 0.3);
        }
        .platform-hero__stats {
          display: flex;
          justify-content: center;
          gap: 3rem;
          flex-wrap: wrap;
        }
        .stat-item {
          text-align: center;
          padding: 1.5rem;
          border-radius: 12px;
          background: rgba(0, 255, 127, 0.1);
          border: 1px solid rgba(0, 255, 127, 0.2);
          backdrop-filter: blur(5px);
          transition: all 0.3s ease;
        }
        .stat-item:hover {
          transform: translateY(-5px);
          box-shadow: 0 10px 30px rgba(0, 255, 127, 0.2);
          border-color: rgba(0, 255, 127, 0.4);
        }
        .stat-number {
          display: block;
          font-size: 2.5rem;
          font-weight: 700;
          color: #ffffff;
          margin-bottom: 0.5rem;
          text-shadow: 0 0 15px rgba(255, 255, 255, 0.5);
        }
        .stat-label {
          font-size: 0.9rem;
          color: rgba(255, 255, 255, 0.9);
          font-weight: 400;
          text-shadow: 0 0 8px rgba(255, 255, 255, 0.4);
          text-transform: uppercase;
          letter-spacing: 1px;
        }
        .platform-features {
          padding: 60px 0;
          position: relative;
          background: rgba(0, 0, 0, 0.2);
        }
        .section-header {
          text-align: center;
          margin-bottom: 2rem;
        }
        .section-title {
          font-size: clamp(2rem, 4vw, 3rem);
          font-weight: 700;
          margin-bottom: 1rem;
          color: #ffffff;
          text-shadow: 0 0 20px rgba(255, 255, 255, 0.5);
        }
        .section-description {
          font-size: 1.1rem;
          color: rgba(255, 255, 255, 0.95);
          max-width: 600px;
          margin: 0 auto;
          line-height: 1.6;
          text-shadow: 0 0 10px rgba(255, 255, 255, 0.3);
        }
        .features-grid {
          display: grid;
          grid-template-columns: repeat(2, 1fr);
          gap: 2rem;
          margin-top: 3rem;
          max-width: 1200px;
          margin-left: auto;
          margin-right: auto;
          padding: 0;
        }
        .feature-card {
          background: rgba(255, 255, 255, 0.05);
          border: 1px solid rgba(255, 255, 255, 0.1);
          border-radius: 16px;
          padding: 2rem;
          transition: transform 0.2s ease, border-color 0.2s ease;
          position: relative;
          overflow: hidden;
          backdrop-filter: blur(5px);
          min-height: 400px;
          display: flex;
          flex-direction: column;
        }
        .feature-card::before {
          content: '';
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: linear-gradient(135deg, rgba(0, 255, 127, 0.1) 0%, transparent 50%);
          opacity: 0;
          transition: opacity 0.15s ease;
        }
        .feature-card:hover::before,
        .feature-card.active::before {
          opacity: 1;
        }
        .feature-card:hover,
        .feature-card.active {
          transform: translateY(-10px);
          border-color: rgba(0, 255, 127, 0.3);
          box-shadow: 0 20px 40px rgba(0, 255, 127, 0.1);
        }
        .feature-card__icon {
          width: 48px;
          height: 48px;
          margin-bottom: 1.5rem;
          color: #00f078;
          filter: drop-shadow(0 0 15px rgba(0, 255, 127, 0.4));
        }
        .feature-card__title {
          font-size: 1.5rem;
          font-weight: 700;
          margin-bottom: 1rem;
          color: #ffffff;
          text-shadow: 0 0 10px rgba(255, 255, 255, 0.3);
          position: relative;
          z-index: 2;
          line-height: 1.3;
        }
        .feature-card__description {
          font-size: 1rem;
          color: rgba(255, 255, 255, 0.9);
          line-height: 1.6;
          margin-bottom: 2rem;
          text-shadow: 0 0 5px rgba(255, 255, 255, 0.2);
          position: relative;
          z-index: 2;
        }
        .feature-card__details {
          list-style: none;
          padding: 0;
          margin: 0;
          position: relative;
          z-index: 2;
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 0.5rem;
          flex-grow: 1;
        }
        .feature-card__details li {
          padding: 0.5rem 0;
          color: rgba(255, 255, 255, 0.8);
          position: relative;
          padding-left: 1.5rem;
          font-size: 0.9rem;
          line-height: 1.4;
        }
        .feature-card__details li::before {
          content: '✓';
          position: absolute;
          left: 0;
          color: #00f078;
          font-weight: bold;
        }
        .security-tools {
          padding: 60px 0;
          background: linear-gradient(135deg, rgba(0, 255, 127, 0.08) 0%, rgba(0, 255, 127, 0.03) 50%, rgba(0, 255, 127, 0.05) 100%);
        }
        .tool-card {
          background: rgba(255, 255, 255, 0.05);
          border-radius: 12px;
          padding: 1.5rem;
          transition: all 0.3s ease;
          backdrop-filter: blur(5px);
          position: relative;
          overflow: hidden;
          flex-shrink: 0;
          /* New subtle gradient-like box-shadow */
          box-shadow: 0 0 0 1px rgba(0, 255, 127, 0.05), /* Very light inner border */
                      0 0 10px rgba(0, 255, 127, 0.03); /* Subtle outer glow */
        }
        .tool-card:hover {
          transform: translateY(-5px);
          /* Enhanced glow on hover */
          box-shadow: 0 0 0 1px rgba(0, 255, 127, 0.2), /* More visible inner border */
                      0 0 25px rgba(0, 255, 127, 0.3); /* Stronger outer glow */
        }
        .tool-card__header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 0.5rem;
        }
        .tool-card__name {
          font-size: 1.1rem;
          font-weight: 600;
          color: #ffffff;
        }
        .tool-card__status {
          font-size: 1.2rem;
        }
        .tool-card__category {
          color: rgba(255, 255, 255, 0.6);
          font-size: 0.9rem;
        }
        .scroller {
          max-width: 100%;
          overflow: hidden;
          -webkit-mask: linear-gradient(90deg, transparent, white 20%, white 80%, transparent);
          mask: linear-gradient(90deg, transparent, white 20%, white 80%, transparent);
        }
        .scroller__inner {
          padding: 1rem 0;
          display: flex;
          flex-wrap: nowrap;
          gap: 1.5rem;
          width: max-content;
        }
        .scroller[data-animated="true"] .scroller__inner {
          animation: scroll 60s linear infinite;
        }
        .scroller[data-direction="right"] .scroller__inner {
          animation-direction: reverse;
        }
        @keyframes scroll {
          to {
            transform: translate(calc(-50% - 0.75rem));
          }
        }
        .platform-cta {
          padding: 60px 0;
          background: linear-gradient(135deg, rgba(0, 255, 127, 0.15) 0%, rgba(0, 255, 127, 0.08) 30%, rgba(0, 255, 127, 0.12) 70%, rgba(0, 255, 127, 0.1) 100%);
          text-align: center;
          position: relative;
          overflow: hidden;
        }
        .platform-cta::before {
          content: '';
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: radial-gradient(ellipse at center, rgba(0, 255, 127, 0.2) 0%, transparent 70%);
          pointer-events: none;
        }
        .cta-content {
          max-width: 600px;
          margin: 0 auto;
        }
        .cta-title {
          font-size: clamp(2rem, 4vw, 3rem);
          font-weight: 700;
          margin-bottom: 1.5rem;
          color: #ffffff;
          text-shadow: 0 0 20px rgba(255, 255, 255, 0.5);
          position: relative;
          z-index: 1;
        }
        .cta-description {
          font-size: 1.1rem;
          color: rgba(255, 255, 255, 0.95);
          margin-bottom: 2.5rem;
          line-height: 1.6;
          text-shadow: 0 0 10px rgba(255, 255, 255, 0.3);
          position: relative;
          z-index: 1;
        }
        .cta-buttons {
          display: flex;
          gap: 1rem;
          justify-content: center;
          flex-wrap: wrap;
        }
        .btn {
          padding: 1rem 2rem;
          border-radius: 8px;
          font-size: 1rem;
          font-weight: 600;
          text-decoration: none;
          border: none;
          cursor: pointer;
          transition: all 0.3s ease;
          position: relative;
          overflow: hidden;
        }
        .btn--primary {
          background: linear-gradient(135deg, #00f078 0%, #00ff88 100%);
          color: #0d0d0d;
          box-shadow: 0 4px 15px rgba(0, 255, 127, 0.3);
        }
        .btn--primary:hover {
          transform: translateY(-2px);
          box-shadow: 0 8px 25px rgba(0, 255, 127, 0.4);
        }
        .btn--secondary {
          background: transparent;
          color: #00f078;
          border: 2px solid #00f078;
        }
        .btn--secondary:hover {
          background: rgba(0, 255, 127, 0.1);
          transform: translateY(-2px);
          box-shadow: 0 8px 25px rgba(0, 255, 127, 0.2);
        }
        @media (max-width: 1024px) {
          .features-grid { 
            max-width: 900px; 
            gap: 1.5rem; 
            margin-left: auto; 
            margin-right: auto; 
            padding: 0; 
          }
          .feature-card { 
            padding: 1.5rem; 
            min-height: 350px; 
          }
        }
        @media (max-width: 768px) {
          .platform-hero { padding: 180px 0 60px; }
          .platform-hero__stats { gap: 1.5rem; }
          .stat-item { padding: 1rem; }
          .features-grid { 
            grid-template-columns: 1fr; 
            gap: 1.5rem; 
            max-width: 100%; 
            margin-left: auto; 
            margin-right: auto; 
            padding: 0 1rem; 
          }
          .cta-buttons { flex-direction: column; align-items: center; }
          .btn { width: 100%; max-width: 300px; }
        }
        @media (max-width: 480px) {
          .platform-hero__stats { flex-direction: column; gap: 1rem; }
          .features-grid { 
            grid-template-columns: 1fr; 
            gap: 1rem; 
            max-width: 100%; 
            margin-left: auto; 
            margin-right: auto; 
            padding: 0 1rem; 
          }
          .feature-card { min-height: 300px; padding: 1.2rem; }
          .feature-card__icon { width: 36px; height: 36px; margin-bottom: 1rem; }
          .feature-card__title { font-size: 1.2rem; }
          .feature-card__description { font-size: 0.9rem; }
          .feature-card__details { grid-template-columns: 1fr; gap: 0.3rem; }
          .feature-card__details li { font-size: 0.8rem; padding: 0.3rem 0; }
        }
      `}} />

      <div className="platform-page">
        {/* Hero Section */}
        <section className="platform-hero">
          <div className="container">
            <motion.div
              className="platform-hero__content"
              initial={{ opacity: 0, y: 50 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8 }}
            >
              <h1 className="platform-hero__title">
                <span className="title-white">XploitEye</span>
                <br />
                <span className="title-gradient">Multi-Agentic Security Platform</span>
              </h1>
              <p className="platform-hero__description">
                Revolutionary AI-powered cybersecurity platform that automates the complete
                cyber kill chain, from reconnaissance to remediation, making enterprise-grade
                security accessible to organizations of all sizes.
              </p>
              <div className="platform-hero__stats">
                <div className="stat-item">
                  <span className="stat-number">99.7%</span>
                  <span className="stat-label">Detection Accuracy</span>
                </div>
                <div className="stat-item">
                  <span className="stat-number">80%</span>
                  <span className="stat-label">Faster Assessment</span>
                </div>
                <div className="stat-item">
                  <span className="stat-number">24/7</span>
                  <span className="stat-label">AI Monitoring</span>
                </div>
              </div>
            </motion.div>
          </div>
        </section>

        <MultiAgentArchitecture />

        {/* Security Tools Integration */}
        <section className="platform-features" id="tools" data-animate>
          <div className="container">
            <motion.div
              className="section-header"
              initial={{ opacity: 0 }}
              animate={isVisible.tools ? { opacity: 1 } : {}}
              transition={{ duration: 0.6 }}
            >
              <h2 className="section-title">
                <span className="title-gradient">Integrated Security Arsenal</span>
              </h2>
              <p className="section-description">
                Industry-leading tools orchestrated by AI for comprehensive security testing
              </p>
            </motion.div>
          </div>
          <div className="scroller" data-speed="slow" data-direction="right">
            <div className="scroller__inner">
              {[...toolsRow1, ...toolsRow1].map((tool, index) => (
                <div key={index} className="tool-card">
                  <div className="tool-card__header">
                    <h4 className="tool-card__name">{tool.name}</h4>
                    <span className="tool-card__status active">🟢</span>
                  </div>
                  <p className="tool-card__category">{tool.category}</p>
                </div>
              ))}
            </div>
          </div>
          <div className="scroller" data-speed="slow" data-direction="left">
            <div className="scroller__inner">
              {[...toolsRow2, ...toolsRow2].map((tool, index) => (
                <div key={index} className="tool-card">
                  <div className="tool-card__header">
                    <h4 className="tool-card__name">{tool.name}</h4>
                    <span className="tool-card__status active">🟢</span>
                  </div>
                  <p className="tool-card__category">{tool.category}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Core Features Section */}
        <section className="platform-features" id="features" data-animate>
          <div className="container">
            <motion.div
              className="section-header"
              initial={{ opacity: 0 }}
              animate={isVisible.features ? { opacity: 1 } : {}}
              transition={{ duration: 0.6 }}
            >
              <h2 className="section-title">
                <span className="title-gradient">Platform Capabilities</span>
              </h2>
              <p className="section-description">
                Comprehensive security testing powered by advanced AI and industry-standard tools
              </p>
            </motion.div>

            <div className="features-grid">
              {platformFeatures.map((feature, index) => (
                <motion.div
                  key={index}
                  className={`feature-card ${activeFeature === index ? 'active' : ''}`}
                  initial={{ opacity: 0, y: 30 }}
                  animate={isVisible.features ? { opacity: 1, y: 0 } : {}}
                  transition={{ duration: 0.6, delay: index * 0.1 }}
                  onMouseEnter={() => setActiveFeature(index)}
                >
                  <div className="feature-card__icon">{feature.icon}</div>
                  <h3 className="feature-card__title">{feature.title}</h3>
                  <p className="feature-card__description">{feature.description}</p>
                  <ul className="feature-card__details">
                    {feature.details.map((detail, idx) => (
                      <li key={idx}>{detail}</li>
                    ))}
                  </ul>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="platform-cta">
          <div className="container">
            <motion.div
              className="cta-content"
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.8 }}
            >
              <h2 className="cta-title">
                Ready to{' '}
                <span className="title-gradient">
                  <TypingOnScroll text="Revolutionize" />
                </span>
                {' '}Your Security?
              </h2>
              <p className="cta-description">
                Join the future of cybersecurity with AI-powered vulnerability assessment
              </p>
              <div className="cta-buttons">
                <Link href="/signin">
                  <button className="btn btn--primary">
                    Start Free Trial
                  </button>
                </Link>
                <Link href="/signin">
                  <button className="btn btn--secondary">
                    Schedule Demo
                  </button>
                </Link>
              </div>
            </motion.div>
          </div>
        </section>
      </div>
    </>
  );
};

export default Platform;
