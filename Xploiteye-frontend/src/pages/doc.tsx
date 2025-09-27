import React, { useState, useEffect, FC, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

// ==================================
//          STYLES
// ==================================
// All CSS is embedded and refined for robust layout and text scaling.
const DocsStyles: FC = () => (
  <style>{`
    /* Global overflow fixes */
    html, body {
      overflow-x: hidden !important;
      max-width: 100vw !important;
      width: 100% !important;
      background-color: #111317 !important;
      margin: 0 !important;
      padding: 0 !important;
    }

    body, #__next, #root {
      margin: 0 !important;
      padding: 0 !important;
    }

    :root {
      --color-almost-black: #111317;
      --color-pure-white: #ffffff;
      --color-endor-green: #00f078;
      --color-bright-green: #3fe1f3;
    }

    *, *::before, *::after {
      box-sizing: border-box;
      margin: 0;
      padding: 0;
    }

    .docs-page {
      background: var(--color-almost-black);
      color: var(--color-pure-white);
      min-height: 100vh;
      overflow-x: hidden;
      width: 100%;
      max-width: 100vw;
    }

    .container {
      width: 100%;
      max-width: 1400px;
      margin-left: auto;
      margin-right: auto;
      padding-left: 1.5rem;
      padding-right: 1.5rem;
      overflow-x: hidden;
    }

    /* Hero Section */
    .docs-hero {
      padding: 140px 0 60px;
      position: relative;
      text-align: center;
      background: radial-gradient(ellipse at 50% 30%, rgba(0, 240, 120, 0.1) 0%, transparent 70%);
    }
    .docs-hero::before {
      content: '';
      position: absolute;
      inset: 0;
      background: linear-gradient(135deg, rgba(0, 240, 120, 0.05) 0%, transparent 50%);
      pointer-events: none;
    }
    .docs-hero__content { max-width: 800px; margin: 0 auto; position: relative; z-index: 2; }
    .docs-hero__title { font-size: clamp(2.8rem, 6vw, 4.5rem); font-weight: 700; line-height: 1.1; margin-bottom: 1rem; }
    .title-gradient { background: linear-gradient(135deg, var(--color-endor-green) 0%, var(--color-bright-green) 100%); -webkit-background-clip: text; -webkit-text-fill-color: transparent; background-clip: text; }
    .docs-hero__description { font-size: clamp(1rem, 2.5vw, 1.25rem); line-height: 1.6; color: rgba(255, 255, 255, 0.85); margin-bottom: 2.5rem; }
    .search-container { max-width: 550px; margin: 0 auto; }
    .search-box { position: relative; display: flex; align-items: center; }
    .search-icon { position: absolute; left: 1.25rem; font-size: 1.2rem; color: rgba(255, 255, 255, 0.5); z-index: 2; pointer-events: none; }
    .search-input { width: 100%; padding: 1rem 1rem 1rem 3.5rem; background: rgba(255, 255, 255, 0.08); border: 1px solid rgba(255, 255, 255, 0.15); border-radius: 12px; color: var(--color-pure-white); font-size: 1rem; backdrop-filter: blur(10px); transition: all 0.3s ease; }
    .search-input:focus { outline: none; border-color: var(--color-endor-green); box-shadow: 0 0 20px rgba(0, 240, 120, 0.2); }
    .search-input::placeholder { color: rgba(255, 255, 255, 0.5); }

    /* Docs Layout */
    .docs-content-section { padding: 60px 0; }
    .docs-layout { display: grid; grid-template-columns: 280px 1fr; gap: 3rem; }

    /* Sidebar */
    .docs-sidebar { position: sticky; top: 100px; height: calc(100vh - 120px); }
    .sidebar-content-wrapper { height: 100%; overflow-y: auto; background: rgba(255, 255, 255, 0.05); border: 1px solid rgba(255, 255, 255, 0.1); border-radius: 16px; padding: 2rem; backdrop-filter: blur(10px); }
    .sidebar-toggle { display: none; }
    .sidebar-content-wrapper h3 { font-size: 1.1rem; font-weight: 600; color: var(--color-endor-green); margin-bottom: 1.5rem; text-transform: uppercase; letter-spacing: 1.5px; }
    .sidebar-section { margin-bottom: 1rem; }
    .section-button { width: 100%; display: flex; align-items: center; gap: 0.75rem; padding: 0.75rem; background: transparent; border: 1px solid transparent; border-radius: 8px; color: rgba(255, 255, 255, 0.8); font-size: 0.95rem; cursor: pointer; transition: all 0.2s ease; text-align: left; }
    .section-button:hover { background: rgba(0, 240, 120, 0.1); color: var(--color-pure-white); }
    .section-button.active { background: rgba(0, 240, 120, 0.15); border-color: rgba(0, 240, 120, 0.2); color: var(--color-endor-green); font-weight: 600; }
    .section-icon { font-size: 1.1rem; }
    .section-title { font-weight: 500; }
    .section-button.active .section-title { font-weight: 600; }
    .subsections { margin-top: 0.5rem; padding-left: 2rem; display: flex; flex-direction: column; gap: 0.25rem; }
    .subsection-button { width: 100%; padding: 0.5rem 0.75rem; background: transparent; border: none; color: rgba(255, 255, 255, 0.7); font-size: 0.9rem; cursor: pointer; transition: all 0.2s ease; text-align: left; border-radius: 6px; }
    .subsection-button:hover, .subsection-button.active { background: rgba(0, 240, 120, 0.1); color: var(--color-endor-green); }

    /* Main Content */
    .docs-main { min-width: 0; } /* Fix for grid layout overflows */
    .docs-main-wrapper { background: rgba(255, 255, 255, 0.02); border: 1px solid rgba(255, 255, 255, 0.1); border-radius: 16px; padding: 2.5rem; backdrop-filter: blur(10px); }
    .doc-content h1 { font-size: clamp(2rem, 5vw, 2.8rem); font-weight: 700; color: var(--color-pure-white); margin-bottom: 1rem; line-height: 1.2; }
    .doc-content h2 { font-size: clamp(1.5rem, 4vw, 2rem); font-weight: 600; color: var(--color-endor-green); margin: 2.5rem 0 1rem 0; padding-bottom: 0.5rem; border-bottom: 1px solid rgba(255, 255, 255, 0.1); }
    .doc-content h3, .doc-content h4 { font-weight: 600; color: var(--color-pure-white); margin: 1.5rem 0 0.75rem 0; }
    .doc-content h3 { font-size: 1.5rem; }
    .doc-content h4 { font-size: 1.2rem; }
    .doc-content p, .doc-content li { font-size: 1rem; line-height: 1.7; color: rgba(255, 255, 255, 0.85); overflow-wrap: break-word; }
    .doc-intro { font-size: 1.1rem; line-height: 1.7; color: rgba(255, 255, 255, 0.9); margin-bottom: 2.5rem; padding: 1.5rem; background: rgba(0, 240, 120, 0.05); border-left: 4px solid var(--color-endor-green); border-radius: 0 8px 8px 0; }
    .doc-section { margin-bottom: 2.5rem; }
    .doc-list { list-style: none; padding: 0; }
    .doc-list li { position: relative; padding-left: 1.75rem; margin-bottom: 0.5rem; }
    .doc-list li::before { content: '✓'; position: absolute; left: 0; color: var(--color-endor-green); font-weight: bold; }

    /* Code Blocks */
    .code-block { margin: 1.5rem 0; border-radius: 12px; overflow: hidden; background: #0D0D0D; border: 1px solid rgba(255, 255, 255, 0.1); }
    .code-header { display: flex; justify-content: space-between; align-items: center; padding: 0.75rem 1.25rem; background: rgba(0, 0, 0, 0.5); border-bottom: 1px solid rgba(255, 255, 255, 0.1); }
    .code-header span { font-size: 0.85rem; color: var(--color-endor-green); font-weight: 500; }
    .copy-btn { background: rgba(0, 240, 120, 0.2); border: 1px solid rgba(0, 240, 120, 0.3); color: var(--color-endor-green); padding: 0.3rem 0.8rem; border-radius: 6px; font-size: 0.8rem; cursor: pointer; transition: all 0.2s ease; }
    .copy-btn:hover { background: rgba(0, 240, 120, 0.3); }
    .copy-btn.copied { background-color: var(--color-endor-green); color: var(--color-almost-black); border-color: var(--color-endor-green); }
    .code-block pre { margin: 0; padding: 1.5rem; overflow-x: auto; font-family: 'Fira Code', 'Menlo', 'Consolas', monospace; font-size: 0.9rem; line-height: 1.6; }
    .code-block code { color: #e6e6e6; }

    /* Special Content Grids */
    .learning-grid, .integration-grid { display: grid; gap: 1.5rem; margin-top: 2rem; }
    .learning-grid { grid-template-columns: repeat(auto-fit, minmax(240px, 1fr)); }
    .integration-grid { grid-template-columns: 1fr; }
    @media (min-width: 1200px) { .integration-grid { grid-template-columns: repeat(2, 1fr); } }
    .learning-item, .integration-card, .quick-link-card { background: rgba(255, 255, 255, 0.05); border: 1px solid rgba(255, 255, 255, 0.1); border-radius: 16px; padding: 2rem; transition: all 0.3s ease; display: flex; flex-direction: column; }
    .learning-item:hover, .integration-card:hover, .quick-link-card:hover { transform: translateY(-8px); border-color: rgba(0, 240, 120, 0.3); box-shadow: 0 15px 30px rgba(0, 0, 0, 0.2); }
    .learning-icon, .integration-icon, .quick-link-icon { font-size: 2.5rem; margin-bottom: 1rem; filter: drop-shadow(0 0 10px rgba(0, 240, 120, 0.3)); }
    .learning-item { text-align: center; }
    .learning-item p, .integration-card p, .quick-link-card p { flex-grow: 1; color: rgba(255, 255, 255, 0.75); font-size: 0.95rem; }
    .integration-steps { margin-top: auto; padding-top: 1rem; }
    .step { display: flex; align-items: center; gap: 1rem; padding: 0.75rem 0; border-bottom: 1px solid rgba(255, 255, 255, 0.1); }
    .step:last-child { border-bottom: none; }
    .step-number { width: 24px; height: 24px; background: var(--color-endor-green); color: var(--color-almost-black); border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 0.8rem; font-weight: 600; flex-shrink: 0; }
    .feature-list { margin-top: auto; padding-top: 1rem; }
    .feature-item { font-size: 0.9rem; margin-bottom: 0.5rem; }

    /* Quick Links Section */
    .quick-links { padding: 80px 0; }
    .section-header { text-align: center; margin-bottom: 3rem; }
    .section-title { font-size: clamp(2rem, 4vw, 3rem); font-weight: 700; }
    .quick-links-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(250px, 1fr)); gap: 2rem; }
    .quick-link-card { text-align: center; }
    .quick-link-icon { font-size: 3rem; }
    .quick-link-card h4 { font-size: 1.3rem; margin-bottom: 0.75rem; }
    .quick-link-btn { background: linear-gradient(135deg, var(--color-endor-green) 0%, var(--color-bright-green) 100%); color: var(--color-almost-black); border: none; padding: 0.75rem 1.5rem; border-radius: 8px; font-weight: 600; cursor: pointer; transition: all 0.3s ease; box-shadow: 0 4px 15px rgba(0, 240, 120, 0.2); margin-top: auto; }
    .quick-link-btn:hover { transform: translateY(-2px); box-shadow: 0 8px 25px rgba(0, 240, 120, 0.3); }

    /* Responsive Design */
    @media (max-width: 992px) {
      .docs-layout { grid-template-columns: 1fr; }
      .sidebar-toggle { position: fixed; top: 90px; left: 1rem; z-index: 1001; display: block; background: rgba(30,30,30,0.8); backdrop-filter: blur(5px); color: white; border-radius: 8px; width: 44px; height: 44px; font-size: 1.5rem; }
      .docs-sidebar { position: fixed; top: 0; left: -100%; width: 300px; height: 100%; z-index: 1000; transition: transform 0.3s ease-in-out; transform: translateX(-100%); box-shadow: 10px 0 30px rgba(0,0,0,0.3); }
      .docs-sidebar.open { transform: translateX(0); }
      .sidebar-backdrop { position: fixed; inset: 0; background: rgba(0,0,0,0.5); z-index: 999; }
    }
    @media (max-width: 480px) {
      .container { padding-left: 1rem; padding-right: 1rem; }
      .docs-hero { padding: 120px 0 40px; }
      .docs-main-wrapper { padding: 1.5rem; }
    }
  `}</style>
);

// ==================================
//      TYPE DEFINITIONS
// ==================================
interface Subsection {
  id: string;
  title: string;
}

interface DocSection {
  id: string;
  title: string;
  icon: string;
  subsections: Subsection[];
}

type CodeExamples = Record<string, string>;

// ==================================
//      DATA
// ==================================
const docSections: DocSection[] = [
  { id: 'getting-started', title: 'Getting Started', icon: '🚀', subsections: [ { id: 'quick-start', title: 'Quick Start Guide' }, { id: 'installation', title: 'Installation' } ] },
  { id: 'api-reference', title: 'API Reference', icon: '📚', subsections: [ { id: 'endpoints', title: 'API Endpoints' }, { id: 'authentication-api', title: 'Authentication API' } ] },
  { id: 'integrations', title: 'Integrations', icon: '🔗', subsections: [ { id: 'ci-cd', title: 'CI/CD Integration' }, { id: 'slack', title: 'Slack Integration' } ] },
  // Add other sections here...
];

const codeExamples: CodeExamples = {
  'quick-start': `# Install XploitEye CLI\nnpm install -g xploiteye-cli\n\n# Authenticate with your API key\nxploiteye auth --api-key YOUR_API_KEY\n\n# Run your first scan\nxploiteye scan --target https://example.com`,
  'authentication-api': `const XploitEye = require('xploiteye-sdk');\n\nconst client = new XploitEye({\n  apiKey: 'your-api-key',\n});\n\nconst auth = await client.authenticate();`,
  'scanning-api': `const scanConfig = {\n  target: 'https://example.com',\n  tools: ['owasp-zap', 'nmap'],\n};\n\nconst scan = await client.scans.create(scanConfig);`,
  'ci-cd': `name: XploitEye Security Scan\non:\n  push:\n    branches: [ main ]\njobs:\n  security-scan:\n    runs-on: ubuntu-latest\n    steps:\n    - uses: xploiteye/github-action@v1\n      with:\n        api-key: \${{ secrets.XPLOITEYE_API_KEY }}\n        target: \${{ github.event.repository.html_url }}`,
};


// ==================================
//      HELPER COMPONENTS
// ==================================
const CodeBlock: FC<{ language: string; code: string }> = ({ language, code }) => {
  const [copyText, setCopyText] = useState('Copy');

  const handleCopy = () => {
    navigator.clipboard.writeText(code);
    setCopyText('Copied!');
    setTimeout(() => setCopyText('Copy'), 2000);
  };

  return (
    <div className="code-block">
      <div className="code-header">
        <span>{language}</span>
        <button onClick={handleCopy} className={`copy-btn ${copyText === 'Copied!' ? 'copied' : ''}`}>{copyText}</button>
      </div>
      <pre><code>{code}</code></pre>
    </div>
  );
};

const ContentRenderer: FC<{ activeSection: string }> = ({ activeSection }) => {
  // In a real app, you would fetch this content or have more structured components
  switch (activeSection) {
    case 'getting-started':
      return (
        <div className="doc-content">
          <h1>Getting Started with XploitEye</h1>
          <p className="doc-intro">Welcome! This guide will help you get up and running with our AI-powered cybersecurity platform in minutes.</p>
          <div className="doc-section">
            <h2>Quick Start</h2>
            <p>The fastest way to start is with our CLI. Install, authenticate, and run your first scan with these simple commands.</p>
            <CodeBlock language="Terminal" code={codeExamples['quick-start']} />
          </div>
          <div className="doc-section">
            <h2>What You'll Learn</h2>
            <div className="learning-grid">
                <div className="learning-item"><div className="learning-icon">🔍</div><h4>Vulnerability Scanning</h4><p>How to configure and run comprehensive security scans.</p></div>
                <div className="learning-item"><div className="learning-icon">📊</div><h4>Report Analysis</h4><p>Understanding and acting on security findings.</p></div>
                <div className="learning-item"><div className="learning-icon">🔧</div><h4>Integration Setup</h4><p>Connecting XploitEye to your existing workflows.</p></div>
                <div className="learning-item"><div className="learning-icon">🛡️</div><h4>Best Practices</h4><p>Security testing methodologies and compliance.</p></div>
            </div>
          </div>
        </div>
      );
    case 'api-reference':
      return (
        <div className="doc-content">
          <h1>API Reference</h1>
          <p className="doc-intro">Complete reference for XploitEye's RESTful API. All endpoints require authentication and return JSON responses.</p>
          <div className="doc-section">
            <h2>Authentication</h2>
            <p>All API requests require a valid API key. Here's an example using our JavaScript SDK.</p>
            <CodeBlock language="JavaScript" code={codeExamples['authentication-api']} />
          </div>
          <div className="doc-section">
            <h2>Scanning Endpoints</h2>
            <p>Create and manage scans via the API.</p>
            <CodeBlock language="JavaScript" code={codeExamples['scanning-api']} />
          </div>
        </div>
      );
    case 'integrations':
        return (
          <div className="doc-content">
            <h1>Integrations</h1>
            <p className="doc-intro">Connect XploitEye with your existing development and security workflows for seamless automation.</p>
            <div className="integration-grid">
              <div className="integration-card">
                  <div className="integration-icon">🔄</div>
                  <h3>CI/CD Pipelines</h3>
                  <p>Integrate security scanning into your build and deployment processes with our GitHub Action.</p>
                  <CodeBlock language="GitHub Actions (YAML)" code={codeExamples['ci-cd']} />
              </div>
              <div className="integration-card">
                  <div className="integration-icon">💬</div>
                  <h3>Slack Notifications</h3>
                  <p>Get real-time alerts and scan results in your Slack channels.</p>
                  <div className="integration-steps">
                    <div className="step"><span className="step-number">1</span><span>Install XploitEye Slack app</span></div>
                    <div className="step"><span className="step-number">2</span><span>Configure webhook URL</span></div>
                    <div className="step"><span className="step-number">3</span><span>Set notification preferences</span></div>
                  </div>
              </div>
            </div>
          </div>
        );
    default:
      return (
        <div className="doc-content">
          <h1>Documentation</h1>
          <p className="doc-intro">Content for the section "<strong>{activeSection}</strong>" is not yet available. Please select another section from the sidebar.</p>
        </div>
      );
  }
};

// ==================================
//        MAIN DOCS COMPONENT
// ==================================
const Docs: FC = () => {
  const [activeSection, setActiveSection] = useState<string>('getting-started');
  const [isVisible, setIsVisible] = useState<{ [key: string]: boolean }>({});
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [isSidebarOpen, setIsSidebarOpen] = useState<boolean>(false);
  const observerRef = useRef<IntersectionObserver | null>(null);

  useEffect(() => {
    observerRef.current = new IntersectionObserver(
      (entries) => entries.forEach(entry => entry.isIntersecting && setIsVisible(prev => ({ ...prev, [entry.target.id]: true }))),
      { threshold: 0.1 }
    );
    const elements = document.querySelectorAll('[data-animate]');
    elements.forEach((el) => observerRef.current?.observe(el));
    return () => observerRef.current?.disconnect();
  }, []);
  
  const filteredSections = docSections.filter(section =>
    section.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    section.subsections.some(sub => sub.title.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  const handleSectionClick = (id: string) => {
    setActiveSection(id);
    setIsSidebarOpen(false); // Close sidebar on mobile after selection
  };
  
  return (
    <>
      <DocsStyles />
      <div className="docs-page">
        <section className="docs-hero">
          <div className="container">
            <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.7 }}>
              <h1 className="docs-hero__title"><span className="title-gradient">Documentation</span></h1>
              <p className="docs-hero__description">Everything you need to integrate and use XploitEye's AI-powered cybersecurity platform.</p>
              <div className="search-container">
                <div className="search-box">
                  <span className="search-icon">🔍</span>
                  <input type="text" placeholder="Search documentation..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="search-input" />
                </div>
              </div>
            </motion.div>
          </div>
        </section>

        <section className="docs-content-section">
          <div className="container">
            <div className="docs-layout">
              <AnimatePresence>
                {isSidebarOpen && <motion.div className="sidebar-backdrop" onClick={() => setIsSidebarOpen(false)} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} />}
              </AnimatePresence>
              
              <button className="sidebar-toggle" onClick={() => setIsSidebarOpen(!isSidebarOpen)} aria-label="Toggle documentation navigation" aria-expanded={isSidebarOpen}>☰</button>
              
              <aside className={`docs-sidebar ${isSidebarOpen ? 'open' : ''}`} role="navigation" aria-label="Documentation Sections">
                <div className="sidebar-content-wrapper">
                  <h3>Documentation</h3>
                  {filteredSections.map((section) => (
                    <div key={section.id} className="sidebar-section">
                      <button className={`section-button ${activeSection === section.id ? 'active' : ''}`} onClick={() => handleSectionClick(section.id)}>
                        <span className="section-icon">{section.icon}</span>
                        <span className="section-title">{section.title}</span>
                      </button>
                      {(activeSection === section.id || section.subsections.some(s => s.id === activeSection)) && (
                        <div className="subsections">
                          {section.subsections.map((sub) => (
                            <button key={sub.id} className={`subsection-button ${activeSection === sub.id ? 'active' : ''}`} onClick={() => handleSectionClick(sub.id)}>{sub.title}</button>
                          ))}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </aside>

              <main className="docs-main">
                <div className="docs-main-wrapper">
                  <AnimatePresence mode="wait">
                    <motion.div key={activeSection} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }} transition={{ duration: 0.3 }}>
                      <ContentRenderer activeSection={activeSection} />
                    </motion.div>
                  </AnimatePresence>
                </div>
              </main>
            </div>
          </div>
        </section>

        <section className="quick-links" id="links" data-animate>
          <div className="container">
            <motion.div className="section-header" initial={{ opacity: 0 }} animate={isVisible.links ? { opacity: 1 } : {}} transition={{ duration: 0.6 }}>
              <h2 className="section-title"><span className="title-gradient">Quick Links</span></h2>
            </motion.div>
            <div className="quick-links-grid">
              {[
                { icon: '📖', title: 'API Reference', desc: 'Complete API docs with examples', delay: 0.1 },
                { icon: '🚀', title: 'Quick Start', desc: 'Get up and running in 5 minutes', delay: 0.2 },
                { icon: '💬', title: 'Community', desc: 'Join our developer community', delay: 0.3 },
                { icon: '🎓', title: 'Tutorials', desc: 'Step-by-step video guides', delay: 0.4 },
              ].map(item => (
                <motion.div key={item.title} className="quick-link-card" initial={{ opacity: 0, y: 30 }} animate={isVisible.links ? { opacity: 1, y: 0 } : {}} transition={{ duration: 0.6, delay: item.delay }}>
                  <div className="quick-link-icon">{item.icon}</div>
                  <h4>{item.title}</h4>
                  <p>{item.desc}</p>
                  <button className="quick-link-btn">Learn More</button>
                </motion.div>
              ))}
            </div>
          </div>
        </section>
      </div>
    </>
  );
};

export default Docs;