import React from 'react';
import { motion } from 'framer-motion';

const MultiAgentArchitecture = () => {
  const theme = { primary: '#ffffff', secondary: '#bbbbbb', background: '#0d0d0d', red: '#ff4d4d', blue: '#4d94ff', green: '#00f078' };

  const pathVariants = (delay = 0, duration = 1) => ({
    hidden: { pathLength: 0, opacity: 0 },
    visible: { pathLength: 1, opacity: 1, transition: { duration, delay } },
  });

  const fadeIn = (delay = 0, duration = 0.8) => ({
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0, transition: { duration, delay } },
  });

  const textStyle = {
    fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', 'Oxygen', 'Ubuntu', 'Cantarell', 'Fira Sans', 'Droid Sans', 'Helvetica Neue', sans-serif",
    letterSpacing: '0.5px',
    fill: theme.primary
  };

  const subTextStyle = { ...textStyle, fill: theme.secondary, fontSize: '16px' };

  return (
    <section className="security-tools" style={{ padding: '0', margin: '0' }}>
      <div className="container">
        <motion.div className="section-header" variants={fadeIn()} initial="hidden" whileInView="visible" viewport={{ once: true }}>
          <h2 className="section-title" style={textStyle}>
            Our <span className="title-gradient">Multi-Agent Architecture</span>
          </h2>
          <p className="section-description" style={subTextStyle}>
            At the heart of XploitEye is a sophisticated multi-agent system that simulates attacker and defender behaviors to provide a comprehensive security analysis.
          </p>
        </motion.div>
        <svg viewBox="0 0 1600 900" style={{ width: '100%', marginTop: '1rem' }}>
          
          <defs>
            <marker id="arrow-green" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
              <path d="M 0 0 L 10 5 L 0 10 z" fill={theme.green} />
            </marker>
            <filter id="glow-green" x="-50%" y="-50%" width="200%" height="200%">
              <feGaussianBlur in="SourceGraphic" stdDeviation="8" result="blur" />
              <feColorMatrix in="blur" mode="matrix" values="0 0 0 0 0 0 1 0 0 0.94 0 0 0 0 0.47 0 0 0 1 0" result="glow" />
              <feComposite in="glow" in2="SourceGraphic" operator="over" />
            </filter>
            <filter id="glow-purple" x="-50%" y="-50%" width="200%" height="200%">
              <feGaussianBlur in="SourceGraphic" stdDeviation="6" result="blur" />
              <feColorMatrix in="blur" mode="matrix" values="0.62 0 0 0 0.62 0.4 0 0 0.4 0.96 0 0 0.96 0 1 0" result="glow" />
              <feComposite in="glow" in2="SourceGraphic" operator="over" />
            </filter>
          </defs>

          {/* Core Box */}
          <motion.rect x="500" y="100" width="600" height="650" rx="20" fill="rgba(0, 240, 120, 0.05)" stroke={theme.green} strokeWidth="1" variants={fadeIn(1.5)} initial="hidden" whileInView="visible" viewport={{ once: true }} />

          {/* MCP Brain */}
          <motion.g variants={fadeIn(2.0)} initial="hidden" whileInView="visible" viewport={{ once: true }}>
            <circle cx="800" cy="425" r="70" fill="#1a0d2e" stroke="#9f69f7" strokeWidth="2" filter="url(#glow-purple)" />
            <image href="/images/mcp.svg" x="650" y="285" width="280" height="280" style={{ filter: 'invert(1)' }} />
            <text x="800" y="515" textAnchor="middle" style={{...textStyle, fontSize: '18px', fontWeight: 'bold'}}>MCP Server</text>
          </motion.g>

          {/* Agents in Corners */}
          <motion.g variants={fadeIn(2.5)} initial="hidden" whileInView="visible" viewport={{ once: true }}>
            {/* Scanning Agent */}
            <circle cx="600" cy="250" r="70" fill="rgba(255, 255, 255, 0.05)" stroke={theme.secondary} strokeWidth="1.5" />
            <image href="/images/scaning.svg" x="445" y="95" width="320" height="320" />
            <text x="600" y="345" textAnchor="middle" style={textStyle}>Scanning Agent</text>

            {/* Attack Agent */}
            <circle cx="1000" cy="250" r="70" fill="rgba(255, 255, 255, 0.05)" stroke={theme.red} strokeWidth="1.5" />
            <image href="/images/hacker.svg" x="920" y="170" width="160" height="160" />
            <text x="1000" y="345" textAnchor="middle" style={textStyle}>Attack Agent</text>

            {/* Remediation Agent */}
            <circle cx="600" cy="600" r="70" fill="#ffffff0d" stroke={theme.blue} strokeWidth="1.5" />
            <image href="/images/remedation.svg" x="435" y="440" width="320" height="320" />
            <text x="600" y="695" textAnchor="middle" style={textStyle}>Remediation Agent</text>

            {/* Reporting Agent */}
            <circle cx="1000" cy="600" r="70" fill="#ffffff0d" stroke={theme.primary} strokeWidth="1.5" />
            <image href="/images/report.svg" x="840" y="420" width="320" height="320" style={{ filter: 'invert(1)' }} />
            <text x="1000" y="695" textAnchor="middle" style={textStyle}>Reporting Agent</text>
          </motion.g>

          {/* Linking Lines */}
          <motion.g initial="hidden" whileInView="visible" viewport={{ once: true }}>
            <motion.path d="M650 290 L770 395" stroke={theme.secondary} strokeWidth="1" variants={pathVariants(3.0)} />
            <motion.path d="M950 290 L 830 395" stroke={theme.secondary} strokeWidth="1" variants={pathVariants(3.0)} />
            <motion.path d="M650 560 L770 455" stroke={theme.secondary} strokeWidth="1" variants={pathVariants(3.0)} />
            <motion.path d="M950 560 L 830 455" stroke={theme.secondary} strokeWidth="1" variants={pathVariants(3.0)} />
          </motion.g>

          {/* Arrows */}
          <motion.path d="M1220 200 H 1100" stroke={theme.secondary} strokeWidth="1.5" markerEnd="url(#arrow-green)" variants={pathVariants(1.0)} initial="hidden" whileInView="visible" viewport={{ once: true }} />
          <motion.path d="M1180 425 H 1100" stroke={theme.secondary} strokeWidth="1.5" markerEnd="url(#arrow-green)" variants={pathVariants(1.0)} initial="hidden" whileInView="visible" viewport={{ once: true }} />
          <motion.path d="M1200 650 H 1100" stroke={theme.secondary} strokeWidth="1.5" markerEnd="url(#arrow-green)" variants={pathVariants(1.0)} initial="hidden" whileInView="visible" viewport={{ once: true }} />
          
          <motion.path d="M500 200 H 400" stroke={theme.secondary} strokeWidth="1.5" markerEnd="url(#arrow-green)" variants={pathVariants(3.5)} initial="hidden" whileInView="visible" viewport={{ once: true }} />
          <motion.path d="M500 425 H 420" stroke={theme.secondary} strokeWidth="1.5" markerEnd="url(#arrow-green)" variants={pathVariants(3.5)} initial="hidden" whileInView="visible" viewport={{ once: true }} />
          <motion.path d="M500 650 H 400" stroke={theme.secondary} strokeWidth="1.5" markerEnd="url(#arrow-green)" variants={pathVariants(3.5)} initial="hidden" whileInView="visible" viewport={{ once: true }} />

          {/* Inputs (Right) */}
          <motion.g variants={fadeIn(0.5)} initial="hidden" whileInView="visible" viewport={{ once: true }}>
            <rect x="1220" y="160" width="160" height="80" rx="15" fill="rgba(255, 255, 255, 0.05)" stroke={theme.secondary} strokeWidth="1"/>
            <text x="1300" y="195" textAnchor="middle" style={{...textStyle, fontSize: '22px', fontWeight: '500'}}>IP Address</text>
            <text x="1300" y="220" textAnchor="middle" style={subTextStyle}>e.g., 192.168.1.1</text>

            <rect x="1180" y="370" width="240" height="110" rx="15" fill="rgba(255, 255, 255, 0.05)" stroke={theme.secondary} strokeWidth="1"/>
            <text x="1300" y="420" textAnchor="middle" style={{...textStyle, fontSize: '26px', fontWeight: '500'}}>Web URL</text>
            <text x="1300" y="450" textAnchor="middle" style={{...subTextStyle, fontSize: '18px'}}>e.g., https://example.com</text>

            <rect x="1200" y="610" width="160" height="80" rx="15" fill="rgba(255, 255, 255, 0.05)" stroke={theme.secondary} strokeWidth="1"/>
            <text x="1280" y="645" textAnchor="middle" style={{...textStyle, fontSize: '22px', fontWeight: '500'}}>API Endpoint</text>
            <text x="1280" y="670" textAnchor="middle" style={subTextStyle}>e.g., /v1/users</text>
          </motion.g>

          {/* Outputs (Left) */}
          <motion.g variants={fadeIn(4.0)} initial="hidden" whileInView="visible" viewport={{ once: true }}>
            <rect x="120" y="160" width="280" height="80" rx="15" fill="rgba(255, 255, 255, 0.05)" stroke={theme.secondary} strokeWidth="1"/>
            <text x="260" y="190" textAnchor="middle" style={{...textStyle, fontSize: '22px', fontWeight: '500'}}>CVE Report</text>
            <text x="260" y="215" textAnchor="middle" style={subTextStyle}>Identified: 12, Critical: 3</text>

            <rect x="100" y="370" width="320" height="110" rx="15" fill="rgba(255, 255, 255, 0.05)" stroke={theme.secondary} strokeWidth="1"/>
            <text x="260" y="420" textAnchor="middle" style={{...textStyle, fontSize: '26px', fontWeight: '500'}}>Remediation Plan</text>
            <text x="260" y="450" textAnchor="middle" style={{...subTextStyle, fontSize: '18px'}}>Generated Steps: 8</text>

            <rect x="120" y="610" width="280" height="80" rx="15" fill="rgba(255, 255, 255, 0.05)" stroke={theme.secondary} strokeWidth="1"/>
            <text x="260" y="640" textAnchor="middle" style={{...textStyle, fontSize: '22px', fontWeight: '500'}}>Attack Vectors</text>
            <text x="260" y="665" textAnchor="middle" style={subTextStyle}>Simulated Paths: 4</text>
          </motion.g>

        </svg>
      </div>
    </section>
  );
};

export default MultiAgentArchitecture;
