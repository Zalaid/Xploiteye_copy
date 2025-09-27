// src/App.tsx

import React, { useState, useEffect, useMemo } from 'react';
import { motion } from 'framer-motion';

// --- 1. RECREATED MISSING COMPONENTS ---

// TypingText Component
interface TypingTextProps { text: string; className?: string; speed?: number; }
const TypingText: React.FC<TypingTextProps> = ({ text, className = '', speed = 80 }) => {
  const [displayedText, setDisplayedText] = useState('');
  useEffect(() => {
    setDisplayedText('');
    let i = 0;
    const typingInterval = setInterval(() => {
      if (i < text.length) {
        setDisplayedText((prev) => prev + text.charAt(i));
        i++;
      } else { clearInterval(typingInterval); }
    }, speed);
    return () => clearInterval(typingInterval);
  }, [text, speed]);
  return <p className={className}>{displayedText}</p>;
};


// --- 2. HELPER COMPONENTS FROM about.jsx ---

const GlitchText: React.FC<{ children: React.ReactNode; className?: string }> = ({ children, className }) => (
  <motion.h1 className={`relative ${className}`} animate={{ textShadow: ["0 0 0 #31ff94", "2px 0 0 #ff0040, -2px 0 0 #00ffff", "0 0 0 #31ff94"] }} transition={{ duration: 0.3, repeat: Infinity, repeatDelay: 3 }}>
    {children}
  </motion.h1>
);

const MatrixRain: React.FC = () => {
  const [rainDrops, setRainDrops] = useState<any[]>([]);
  useEffect(() => {
    // FIX: Generate drops only once on mount to prevent hydration errors.
    const drops = Array.from({ length: 50 }).map((_, i) => ({ id: i, left: Math.random() * 100, duration: Math.random() * 3 + 2, delay: Math.random() * 2, text: Math.random().toString(36).substring(2, 15) }));
    setRainDrops(drops);
  }, []);
  return (
    <div className="matrix-rain-container">
      {rainDrops.map((drop) => (
        <motion.div key={drop.id} className="matrix-drop" style={{ left: `${drop.left}%` }} animate={{ y: ["-10vh", "110vh"] }} transition={{ duration: drop.duration, repeat: Infinity, delay: drop.delay, ease: "linear" }}>
          {drop.text}
        </motion.div>
      ))}
    </div>
  );
};


// --- 3. MAIN APP COMPONENT (AboutPage) ---
const App: React.FC = () => {
  useEffect(() => {
    const updateEyeSize = () => {
      if (typeof window === 'undefined') return;
      const width = window.innerWidth;
      const root = document.documentElement;
      if (width >= 1500) { root.style.setProperty('--about-eye-width', 'clamp(128px, 15vw, 240px)'); } 
      else if (width >= 1491) { root.style.setProperty('--about-eye-width', 'clamp(128px, 15vw, 235px)'); } 
      else if (width >= 1477) { root.style.setProperty('--about-eye-width', 'clamp(128px, 15vw, 230px)'); } 
      else if (width >= 1453) { root.style.setProperty('--about-eye-width', 'clamp(128px, 15vw, 225px)'); } 
      else if (width >= 1436) { root.style.setProperty('--about-eye-width', 'clamp(128px, 15vw, 220px)'); } 
      else if (width >= 1421) { root.style.setProperty('--about-eye-width', 'clamp(128px, 15vw, 215px)'); } 
      else if (width >= 1406) { root.style.setProperty('--about-eye-width', 'clamp(128px, 15vw, 210px)'); } 
      else if (width >= 1391) { root.style.setProperty('--about-eye-width', 'clamp(128px, 15vw, 205px)'); } 
      else if (width >= 1376) { root.style.setProperty('--about-eye-width', 'clamp(128px, 15vw, 200px)'); } 
      else if (width >= 1367) { root.style.setProperty('--about-eye-width', 'clamp(128px, 15vw, 195px)'); } 
      else if (width >= 1348) { root.style.setProperty('--about-eye-width', 'clamp(120px, 15vw, 190px)'); } 
      else if (width >= 1310) { root.style.setProperty('--about-eye-width', 'clamp(120px, 15vw, 185px)'); } 
      else if (width >= 1200) { root.style.setProperty('--about-eye-width', 'clamp(120px, 15vw, 180px)'); } 
      else if (width >= 1100) { root.style.setProperty('--about-eye-width', 'clamp(110px, 15vw, 170px)'); } 
      else if (width >= 1025) { root.style.setProperty('--about-eye-width', 'clamp(105px, 14vw, 160px)'); } 
      else if (width >= 1000) { root.style.setProperty('--about-eye-width', 'clamp(100px, 14vw, 155px)'); } 
      else if (width >= 900) { root.style.setProperty('--about-eye-width', 'clamp(80px, 19vw, 150px)'); } 
      else if (width >= 800) { root.style.setProperty('--about-eye-width', 'clamp(80px, 19vw, 145px)'); } 
      else if (width >= 700) { root.style.setProperty('--about-eye-width', 'clamp(75px, 18vw, 140px)'); } 
      else if (width >= 600) { root.style.setProperty('--about-eye-width', 'clamp(70px, 16vw, 135px)'); } 
      else if (width >= 500) { root.style.setProperty('--about-eye-width', 'clamp(65px, 16vw, 130px)'); } 
      else if (width >= 400) { root.style.setProperty('--about-eye-width', 'clamp(60px, 26vw, 125px)'); } 
      else { root.style.setProperty('--about-eye-width', 'clamp(55px, 20vw, 120px)'); }
    }
    window.addEventListener('resize', updateEyeSize);
    updateEyeSize();
    return () => window.removeEventListener('resize', updateEyeSize);
  }, []);

  return (
    <>
    <style dangerouslySetInnerHTML={{ __html: `
        /* --- CONVERTED & MERGED CSS --- */
        body { background-color: #000503; color: white; margin: 0; font-family: system-ui, -apple-system, sans-serif; overflow-x: hidden; }

        /* Mobile overflow fixes */
        @media (max-width: 768px) {
          html, body {
            overflow-x: hidden !important;
            width: 100% !important;
          }

          .page-wrapper {
            overflow-x: hidden !important;
            width: 100% !important;
          }

          .container {
            max-width: 100% !important;
            width: 100% !important;
            padding-left: 1rem !important;
            padding-right: 1rem !important;
            margin-left: auto !important;
            margin-right: auto !important;
            box-sizing: border-box !important;
          }

          /* Values and Tech Stack sections */
          .vision-values-section, .tech-section {
            padding-left: 1rem !important;
            padding-right: 1rem !important;
            width: 100% !important;
            max-width: 100% !important;
            box-sizing: border-box !important;
          }

          .values-grid, .tech-grid {
            width: 100% !important;
            max-width: 100% !important;
            padding-left: 0 !important;
            padding-right: 0 !important;
            box-sizing: border-box !important;
          }

          .value-item, .tech-item {
            max-width: 100% !important;
            width: 100% !important;
            margin-left: 0 !important;
            margin-right: 0 !important;
            box-sizing: border-box !important;
          }
        }
        .container { width: 100%; margin-left: auto; margin-right: auto; }
        @media (min-width: 640px) { .container { max-width: 640px; } }
        @media (min-width: 768px) { .container { max-width: 768px; } }
        @media (min-width: 1024px) { .container { max-width: 1024px; } }
        @media (min-width: 1280px) { .container { max-width: 1280px; } }
        @media (min-width: 1536px) { .container { max-width: 1536px; } }

        /* Page Wrapper */
        .page-wrapper { min-height: 100vh; }

        /* Hero Section */
        .hero-section { position: relative; min-height: 100vh; display: flex; align-items: center; justify-content: center; padding: 1rem; }
        @media (min-width: 640px) { .hero-section { padding: 1.5rem; } }
        @media (min-width: 1024px) { .hero-section { padding: 2rem; } }

        .matrix-rain-container { position: absolute; top: 0; left: 0; right: 0; height: 50%; overflow: hidden; opacity: 0.1; }
        @media (min-width: 1024px) { .matrix-rain-container { height: 75%; } }
        .matrix-drop { position: absolute; color: #86efac; font-size: 0.875rem; font-family: monospace; font-weight: 700; }

        .hero-grid { display: flex; flex-direction: column; align-items: center; gap: 2rem; max-width: 80rem; margin: 0 auto; }
        @media (min-width: 1024px) { .hero-grid { flex-direction: row; gap: 3rem; } }

        .hero-text-content { flex: 1; text-align: center; }
        @media (min-width: 1024px) { .hero-text-content { width: 60%; text-align: left; } }

        .glitch-title { font-size: 1.875rem; font-weight: 700; margin-bottom: 1.5rem; background-image: linear-gradient(to right, #31ff94, #3fe1f3, #9f69f7); -webkit-background-clip: text; background-clip: text; color: transparent; }
        @media (min-width: 640px) { .glitch-title { font-size: 2.25rem; } }
        @media (min-width: 1024px) { .glitch-title { font-size: 3.75rem; } }
        
        .typing-subtitle-container { font-size: 1rem; color: #d1d5db; margin-bottom: 2rem; height: 2rem; }
        @media (min-width: 640px) { .typing-subtitle-container { font-size: 1.125rem; } }
        @media (min-width: 1024px) { .typing-subtitle-container { font-size: 1.25rem; } }
        .typing-subtitle-container p { font-family: monospace; }
        
        .eye-icon-container { flex: 1; display: flex; justify-content: center; }
        @media (min-width: 1024px) { .eye-icon-container { width: 40%; } }
        
        /* Mission Section */
        .mission-section { padding: 3rem 1rem; position: relative; }
        @media (min-width: 640px) { .mission-section { padding: 4rem 1.5rem; } }
        @media (min-width: 1024px) { .mission-section { padding: 5rem 2rem; } }

        .mission-container { margin: 0 auto; max-width: 56rem; text-align: center; position: relative; }
        .mission-bg-svg { position: absolute; inset: 0; display: flex; align-items: center; justify-content: center; opacity: 0.05; }
        .mission-title { font-size: 1.5rem; font-weight: 700; margin-bottom: 2rem; color: #3fe1f3; }
        @media (min-width: 640px) { .mission-title { font-size: 1.875rem; } }
        @media (min-width: 1024px) { .mission-title { font-size: 2.25rem; } }

        .mission-text { font-size: 1rem; color: #d1d5db; line-height: 1.75; position: relative; z-index: 10; }
        @media (min-width: 640px) { .mission-text { font-size: 1.125rem; } }
        @media (min-width: 1024px) { .mission-text { font-size: 1.25rem; } }

        .vision-values-section { padding: 3rem 1rem; }
        @media (min-width: 640px) { .vision-values-section { padding: 4rem 1.5rem; } }
        @media (min-width: 1024px) { .vision-values-section { padding: 5rem 2rem; } }

        .vision-values-grid { display: grid; grid-template-columns: 1fr; gap: 2rem; max-width: 72rem; margin: 0 auto; }
        @media (min-width: 1024px) { .vision-values-grid { grid-template-columns: repeat(2, 1fr); gap: 3rem; } }

        .vision-content, .values-content { display: flex; flex-direction: column; gap: 1.5rem; }
        .vision-header { display: flex; align-items: center; gap: 1rem; margin-bottom: 1rem; }
        .vision-icon-wrapper { width: 3rem; height: 3rem; border-radius: 9999px; background-image: linear-gradient(to right, #ffae00, #ff6b35); display: flex; align-items: center; justify-content: center; }
        .vision-title { font-size: 1.25rem; font-weight: 700; color: #ffae00; }
        @media (min-width: 640px) { .vision-title { font-size: 1.5rem; } }
        @media (min-width: 1024px) { .vision-title { font-size: 1.875rem; } }
        
        .vision-text { color: #d1d5db; font-size: 1rem; line-height: 1.75; }
        @media (min-width: 640px) { .vision-text { font-size: 1.125rem; } }

        .values-title { font-size: 1.25rem; font-weight: 700; color: #9f69f7; margin-bottom: 1.5rem; }
        @media (min-width: 640px) { .values-title { font-size: 1.5rem; } }
        @media (min-width: 1024px) { .values-title { font-size: 1.875rem; } }
        
        .values-list { display: flex; flex-direction: column; gap: 1rem; }
        .value-item { display: flex; align-items: center; gap: 1rem; padding: 1rem; border-radius: 0.5rem; background-color: rgba(17, 24, 39, 0.3); border: 1px solid; transition: all 0.3s; }
        .value-item-icon { font-size: 1.5rem; }
        .value-item-title { font-weight: 600; }
        .value-item-desc { font-size: 0.875rem; color: #9ca3af; }

        .timeline-section { padding: 3rem 1rem; }
        @media (min-width: 640px) { .timeline-section { padding: 4rem 1.5rem; } }
        @media (min-width: 1024px) { .timeline-section { padding: 5rem 2rem; } }

        .section-title { font-size: 1.5rem; font-weight: 700; text-align: center; margin-bottom: 3rem; background-image: linear-gradient(to right, #31ff94, #3fe1f3, #9f69f7, #ffae00); -webkit-background-clip: text; background-clip: text; color: transparent; }
        @media (min-width: 640px) { .section-title { font-size: 1.875rem; } }
        @media (min-width: 1024px) { .section-title { font-size: 2.25rem; } }
        
        .timeline-desktop { display: none; }
        @media (min-width: 1024px) { .timeline-desktop { display: block; } }

        .timeline-desktop-inner { position: relative; }
        .timeline-line { position: absolute; top: 50%; left: 0; right: 0; height: 2px; background-image: linear-gradient(to right, #31ff94, #3fe1f3, #9f69f7, #ffae00); transform: translateY(-50%);}
        .timeline-milestones { display: flex; justify-content: space-between; align-items: center; }
        .milestone { position: relative; display: flex; flex-direction: column; align-items: center; text-align: center; max-width: 16rem; }
        .milestone-dot { width: 1rem; height: 1rem; border-radius: 9999px; margin-bottom: 1rem; box-shadow: 0 0 20px 0px; }
        .milestone-icon { font-size: 2.25rem; margin-bottom: 0.5rem; }
        .milestone-title { font-weight: 700; margin-bottom: 0.25rem; }
        .milestone-year { font-size: 0.875rem; color: #9ca3af; margin-bottom: 0.25rem; }
        .milestone-desc { font-size: 0.75rem; color: #6b7280; }

        .timeline-mobile { display: flex; flex-direction: column; gap: 2rem; }
        @media (min-width: 1024px) { .timeline-mobile { display: none; } }

        .mobile-milestone { display: flex; align-items: flex-start; gap: 1rem; }
        .mobile-milestone-line-container { flex-shrink: 0; }
        .mobile-milestone-dot { width: 0.75rem; height: 0.75rem; border-radius: 9999px; margin-top: 0.5rem; }
        .mobile-milestone-line { width: 2px; height: 4rem; margin-left: 5px; margin-top: 0.5rem; opacity: 0.3; }
        .mobile-milestone-icon { font-size: 1.5rem; margin-bottom: 0.5rem; }
        .mobile-milestone-title { font-weight: 700; margin-bottom: 0.25rem; }
        .mobile-milestone-desc { font-size: 0.875rem; color: #9ca3af; }
        
        .tech-stack-section { padding: 3rem 1rem; }
        @media (min-width: 640px) { .tech-stack-section { padding: 4rem 1.5rem; } }
        @media (min-width: 1024px) { .tech-stack-section { padding: 5rem 2rem; } }

        .tech-title { color: transparent; background-image: linear-gradient(to right, #ffae00, #ff6b35); }
        .tech-stack-grid { display: none; }
        @media (min-width: 640px) { .tech-stack-grid { display: grid; grid-template-columns: repeat(2, 1fr); gap: 1.5rem; } }
        @media (min-width: 1024px) { .tech-stack-grid { grid-template-columns: repeat(3, 1fr); } }

        .tech-card-container { position: relative; height: 10rem; perspective: 1000px; }
        .tech-card-flipper { position: relative; width: 100%; height: 100%; transition: transform 0.7s; transform-style: preserve-3d; }
        .tech-card-container:hover .tech-card-flipper { transform: rotateY(180deg); }
        .tech-card-front, .tech-card-back { position: absolute; inset: 0; width: 100%; height: 100%; backface-visibility: hidden; border-radius: 0.5rem; display: flex; align-items: center; justify-content: center; padding: 1.5rem; transition: border-color 0.3s; }
        .tech-card-front { background-image: linear-gradient(to bottom right, rgb(17 24 39), rgb(31 41 55)); border: 1px solid; flex-direction: column; }
        .tech-card-back { transform: rotateY(180deg); border: 1px solid; }
        .tech-card-back p { font-size: 0.875rem; text-align: center; color: #d1d5db; }
        .tech-card-icon { font-size: 2.25rem; margin-bottom: 0.75rem; }
        .tech-card-title { font-weight: 700; margin-bottom: 0.5rem; }
        .tech-card-desc { font-size: 0.75rem; text-align: center; color: #9ca3af; }
        
        .tech-list-mobile { display: flex; flex-direction: column; gap: 1rem; }
        @media (min-width: 640px) { .tech-list-mobile { display: none; } }
        .mobile-tech-item { display: flex; align-items: center; gap: 1rem; padding: 1rem; background-color: rgba(17, 24, 39, 0.5); border: 1px solid #374151; border-radius: 0.5rem; }
        .mobile-tech-title { font-weight: 600; }
        .mobile-tech-desc { font-size: 0.875rem; color: #9ca3af; }
        
        .team-section { padding: 3rem 1rem; }
        @media (min-width: 640px) { .team-section { padding: 4rem 1.5rem; } }
        @media (min-width: 1024px) { .team-section { padding: 5rem 2rem; } }

        .team-title { color: #9f69f7; }
        .team-grid { display: grid; grid-template-columns: repeat(2, 1fr); gap: 1rem; }
        @media (min-width: 1024px) { .team-grid { grid-template-columns: repeat(4, 1fr); gap: 1.5rem; } }
        .team-card { background-image: linear-gradient(to bottom right, rgba(17, 24, 39, 0.5), rgba(31, 41, 55, 0.5)); border: 1px solid rgba(55, 65, 81, 0.5); border-radius: 0.5rem; padding: 1rem; text-align: center; transition: all 0.3s; }
        .team-card:hover { transform: scale(1.03); box-shadow: 0 10px 30px 0px; }
        .team-avatar { font-size: 2.25rem; margin-bottom: 0.75rem; transition: transform 0.3s; }
        .team-card:hover .team-avatar { transform: scale(1.1); }
        @media (min-width: 1024px) { .team-avatar { font-size: 3.75rem; margin-bottom: 1rem; } }
        .team-name { font-weight: 700; margin-bottom: 0.25rem; font-size: 0.875rem; }
        @media (min-width: 1024px) { .team-name { margin-bottom: 0.5rem; font-size: 1rem; } }
        .team-role { font-size: 0.75rem; color: #9ca3af; margin-bottom: 0.5rem; }
        @media (min-width: 1024px) { .team-role { font-size: 0.875rem; margin-bottom: 0.75rem; } }
        .team-bio { display: none; }
        @media (min-width: 1024px) { .team-bio { display: block; font-size: 0.75rem; color: #6b7280; line-height: 1.6; } }

        .closing-section { padding: 3rem 1rem; position: relative; overflow: hidden; }
        @media (min-width: 640px) { .closing-section { padding: 4rem 1.5rem; } }
        @media (min-width: 1024px) { .closing-section { padding: 5rem 2rem; } }
        .grid-bg-overlay { position: absolute; inset: 0; opacity: 0.1; background-size: 50px 50px; background-image: linear-gradient(rgba(49, 255, 148, 0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(63, 225, 243, 0.1) 1px, transparent 1px); }
        .closing-text-container { position: relative; }
        .closing-text { font-size: 1.125rem; font-weight: 700; color: transparent; background-clip: text; -webkit-background-clip: text; background-image: linear-gradient(to right, #31ff94, #3fe1f3, #9f69f7, #ffae00); text-align: center; }
        @media (min-width: 640px) { .closing-text { font-size: 1.25rem; } }
        @media (min-width: 1024px) { .closing-text { font-size: 1.5rem; } }
        .sheen-overlay { position: absolute; inset: 0; background-image: linear-gradient(to right, transparent, rgba(63, 225, 243, 0.3), transparent); }

    `}} />
    <div className="page-wrapper">
      <section className="hero-section">
        <MatrixRain />
        <div className="container">
          <div className="hero-grid">
            <div className="hero-text-content">
              <GlitchText className="glitch-title">Who We Are — XploitEye</GlitchText>
              <div className="typing-subtitle-container">
                <TypingText text="Reimagining Red & Blue Teaming with AI" className="font-mono" speed={80} />
              </div>
            </div>
            <div className="eye-icon-container">
              <motion.div className="relative" animate={{ scale: [1, 1.05, 1], filter: ["drop-shadow(0 0 20px #31ff94)", "drop-shadow(0 0 40px #3fe1f3)", "drop-shadow(0 0 20px #9f69f7)"] }} transition={{ duration: 3, repeat: Infinity }}>
                <img src="/images/eye.svg" alt="Eye icon" style={{ width: 'var(--about-eye-width, clamp(128px, 15vw, 192px))', height: 'auto' }} />
              </motion.div>
            </div>
          </div>
        </div>
      </section>

      <section className="mission-section">
        <div className="mission-container">
          <div className="mission-bg-svg">
            <svg width="300" height="300" viewBox="0 0 300 300"><rect x="50" y="50" width="200" height="200" rx="20" fill="none" stroke="#3fe1f3" strokeWidth="4" /><circle cx="150" cy="120" r="20" fill="#9f69f7" opacity="0.3" /><rect x="120" y="160" width="60" height="40" rx="5" fill="none" stroke="#ffae00" strokeWidth="2" /></svg>
          </div>
          <motion.h2 className="mission-title" initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }}>Our Mission</motion.h2>
          <motion.p className="mission-text" initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, delay: 0.2 }}>
            To empower organizations, students, and startups with cutting-edge cybersecurity solutions that bridge the gap between traditional penetration testing and modern AI-driven security assessment. We believe in making advanced security testing accessible, automated, and actionable for teams of all sizes.
          </motion.p>
        </div>
      </section>

       <section className="vision-values-section">
        <div className="container">
          <div className="vision-values-grid">
            <motion.div className="vision-content" initial={{ opacity: 0, x: -50 }} whileInView={{ opacity: 1, x: 0 }} transition={{ duration: 0.6 }}>
              <div className="vision-header">
                <div className="vision-icon-wrapper"><svg width="24" height="24" viewBox="0 0 24 24" fill="white"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z" /></svg></div>
                <h3 className="vision-title">Our Vision</h3>
              </div>
              <p className="vision-text">To become the leading AI-powered cybersecurity platform that transforms how organizations approach security testing, making advanced penetration testing capabilities accessible to everyone while maintaining the highest standards of security and reliability.</p>
            </motion.div>
            <motion.div className="values-content" initial={{ opacity: 0, x: 50 }} whileInView={{ opacity: 1, x: 0 }} transition={{ duration: 0.6 }}>
              <h3 className="values-title">Our Values</h3>
              <div className="values-list">
                {[
                  { icon: "⚡", title: "Innovation", desc: "Pushing boundaries with cutting-edge AI", color: "border-color: rgba(255, 174, 0, 0.3);", hoverColor: "border-color: #ffae00;", textColor: "color: #ffae00;" },
                  { icon: "🔒", title: "Security", desc: "Uncompromising commitment to protection", color: "border-color: rgba(63, 225, 243, 0.3);", hoverColor: "border-color: #3fe1f3;", textColor: "color: #3fe1f3;" },
                  { icon: "🌍", title: "Accessibility", desc: "Making security testing available to all", color: "border-color: rgba(49, 255, 148, 0.3);", hoverColor: "border-color: #31ff94;", textColor: "color: #31ff94;" },
                  { icon: "🤝", title: "Collaboration", desc: "Building stronger security communities", color: "border-color: rgba(159, 105, 247, 0.3);", hoverColor: "border-color: #9f69f7;", textColor: "color: #9f69f7;" },
                ].map((value, index) => (
                  <motion.div key={value.title} className="value-item" style={{'--default-border-color': value.color.split(';')[0].split(': ')[1], '--hover-border-color': value.hoverColor.split(';')[0].split(': ')[1]} as any} initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} transition={{ duration: 0.4, delay: index * 0.1 }} whileHover={{ scale: 1.02 }}>
                    <span className="value-item-icon">{value.icon}</span>
                    <div>
                      <h4 className="value-item-title" style={{color: value.textColor.split(': ')[1].slice(0, -1)}}>{value.title}</h4>
                      <p className="value-item-desc">{value.desc}</p>
                    </div>
                  </motion.div>
                ))}
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      <section className="timeline-section">
        <div className="container">
            <motion.h2 className="section-title" initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }}>Our Journey</motion.h2>
            <div className="timeline-desktop">
                <div className="timeline-desktop-inner">
                    <div className="timeline-line"></div>
                    <div className="timeline-milestones">
                        {[
                            { icon: "🚀", title: "Founded", year: "2023", desc: "Started with a vision", color: "#31ff94" },
                            { icon: "🤖", title: "AI Integration", year: "2024", desc: "Launched AI-powered testing", color: "#3fe1f3" },
                            { icon: "🛡️", title: "Security Focus", year: "2024", desc: "Enhanced protection protocols", color: "#9f69f7" },
                            { icon: "🌍", title: "Global Reach", year: "2025", desc: "Expanding worldwide", color: "#ffae00" },
                        ].map((milestone, index) => (
                        <motion.div key={milestone.title} className="milestone" initial={{ opacity: 0, y: 50 }} whileInView={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, delay: index * 0.2 }}>
                            <div className="milestone-dot" style={{ backgroundColor: milestone.color, boxShadow: `0 0 20px ${milestone.color}50` }}></div>
                            <div className="milestone-icon">{milestone.icon}</div>
                            <h4 className="milestone-title" style={{ color: milestone.color }}>{milestone.title}</h4>
                            <p className="milestone-year">{milestone.year}</p>
                            <p className="milestone-desc">{milestone.desc}</p>
                        </motion.div>
                        ))}
                    </div>
                </div>
            </div>
            <div className="timeline-mobile">
                 {[
                    { icon: "🚀", title: "Founded", year: "2023", desc: "Started with a vision to revolutionize cybersecurity", color: "#31ff94" },
                    { icon: "🤖", title: "AI Integration", year: "2024", desc: "Launched AI-powered testing capabilities", color: "#3fe1f3" },
                    { icon: "🛡️", title: "Security Focus", year: "2024", desc: "Enhanced protection protocols and methodologies", color: "#9f69f7" },
                    { icon: "🌍", title: "Global Reach", year: "2025", desc: "Expanding our services worldwide", color: "#ffae00" },
                ].map((milestone, index) => (
                <motion.div key={milestone.title} className="mobile-milestone" initial={{ opacity: 0, x: -50 }} whileInView={{ opacity: 1, x: 0 }} transition={{ duration: 0.6, delay: index * 0.1 }}>
                    <div className="mobile-milestone-line-container">
                        <div className="mobile-milestone-dot" style={{ backgroundColor: milestone.color }}></div>
                        {index < 3 && <div className="mobile-milestone-line" style={{ backgroundColor: milestone.color }}></div>}
                    </div>
                    <div>
                        <div className="mobile-milestone-icon">{milestone.icon}</div>
                        <h4 className="mobile-milestone-title" style={{ color: milestone.color }}>{milestone.title} - {milestone.year}</h4>
                        <p className="mobile-milestone-desc">{milestone.desc}</p>
                    </div>
                </motion.div>
                ))}
            </div>
        </div>
      </section>

      <section className="tech-stack-section">
        <div className="container">
            <motion.h2 className="section-title tech-title" initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }}>Our Tech Stack</motion.h2>
            <div className="tech-stack-grid">
                {[
                    { front: "🐧", back: "Advanced Linux security testing and kernel-level vulnerability assessment", title: "Linux", desc: "Kernel & User Security", color: "#31ff94" },
                    { front: "🌐", back: "Comprehensive web application security testing with modern frameworks", title: "Web Tech", desc: "Full-Stack Security", color: "#3fe1f3" },
                    { front: "🔍", back: "Machine learning algorithms for automated vulnerability detection", title: "AI/ML", desc: "Intelligent Analysis", color: "#9f69f7" },
                    { front: "⚙️", back: "Seamless integration with development and deployment pipelines", title: "DevOps", desc: "CI/CD Integration", color: "#ffae00" },
                    { front: "🤖", back: "Automated penetration testing with intelligent decision making", title: "Automation", desc: "Smart Testing", color: "#ff6b35" },
                    { front: "🛡️", back: "Multi-layered security architecture and threat protection", title: "Security", desc: "Defense Systems", color: "#d946ef" },
                ].map((tech, index) => (
                <motion.div key={tech.title} className="tech-card-container" initial={{ opacity: 0, y: 50 }} whileInView={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, delay: index * 0.1 }}>
                    <div className="tech-card-flipper">
                        <div className="tech-card-front" style={{ borderColor: `${tech.color}50` }} onMouseEnter={(e) => { e.currentTarget.style.borderColor = tech.color }} onMouseLeave={(e) => { e.currentTarget.style.borderColor = `${tech.color}50` }}>
                            <div className="tech-card-icon">{tech.front}</div>
                            <h4 className="tech-card-title" style={{ color: tech.color }}>{tech.title}</h4>
                            <p className="tech-card-desc">{tech.desc}</p>
                        </div>
                        <div className="tech-card-back" style={{ background: `linear-gradient(135deg, ${tech.color}20, ${tech.color}10)`, border: `1px solid ${tech.color}` }}><p>{tech.back}</p></div>
                    </div>
                </motion.div>
                ))}
            </div>
            <div className="tech-list-mobile">
                {[
                    { icon: "🐧", title: "Linux", desc: "Kernel + User Security", color: "#31ff94" }, { icon: "🌐", title: "Web Tech", desc: "Full-Stack Security", color: "#3fe1f3" }, { icon: "🔍", title: "AI/ML", desc: "Intelligent Analysis", color: "#9f69f7" }, { icon: "⚙️", title: "DevOps", desc: "CI/CD Integration", color: "#ffae00" }, { icon: "🤖", title: "Automation", desc: "Smart Testing", color: "#ff6b35" }, { icon: "🛡️", title: "Security", desc: "Defense Systems", color: "#d946ef" },
                ].map((tech, index) => (
                    <motion.div key={tech.title} className="mobile-tech-item" initial={{ opacity: 0, x: -50 }} whileInView={{ opacity: 1, x: 0 }} transition={{ duration: 0.4, delay: index * 0.1 }}>
                        <span className="text-2xl">{tech.icon}</span>
                        <div><h4 className="mobile-tech-title" style={{ color: tech.color }}>{tech.title}</h4><p className="mobile-tech-desc">{tech.desc}</p></div>
                    </motion.div>
                ))}
            </div>
        </div>
      </section>

      <section className="team-section">
        <div className="container">
            <motion.h2 className="section-title team-title" initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }}>Our Team</motion.h2>
            <div className="team-grid">
                 {[
                    { name: "Zelaid Butt", role: "CEO & Founder", avatar: "👨‍💻", bio: "Cybersecurity expert with 10+ years experience", color: "#31ff94" }, { name: "Shoaib Ahmed", role: "CTO", avatar: "👩‍💻", bio: "AI/ML specialist and security researcher", color: "#3fe1f3" }, { name: "Hafiz Umer Riaz", role: "Lead Security Engineer", avatar: "👨‍🔬", bio: "Penetration testing expert with OSCP", color: "#9f69f7" }, { name: "Naeem Ullah", role: "AI Research Lead", avatar: "👩‍🔬", bio: "Machine learning researcher", color: "#ffae00" },
                ].map((member, index) => (
                <motion.div key={member.name} className="team-card" style={{ borderColor: `${member.color}30` }} initial={{ opacity: 0, y: 50 }} whileInView={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, delay: index * 0.1 }} whileHover={{ scale: 1.03, borderColor: `${member.color}80`, boxShadow: `0 10px 30px ${member.color}20` }}>
                    <div className="team-avatar">{member.avatar}</div>
                    <h4 className="team-name" style={{ color: member.color }}>{member.name}</h4>
                    <p className="team-role">{member.role}</p>
                    <p className="team-bio">{member.bio}</p>
                </motion.div>
                ))}
            </div>
        </div>
      </section>

      <section className="closing-section">
        <div className="grid-bg-overlay"></div>
        <div className="container">
            <motion.div className="closing-text-container" initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} transition={{ duration: 0.8 }}>
                <div className="relative">
                    <motion.p className="closing-text" animate={{ filter: ["drop-shadow(0 0 10px #31ff94)", "drop-shadow(0 0 20px #3fe1f3) drop-shadow(0 0 30px #9f69f7)", "drop-shadow(0 0 15px #ffae00)"] }} transition={{ duration: 3, repeat: Infinity }}>
                        From reconnaissance to remediation — XploitEye has you covered.
                    </motion.p>
                    <motion.div className="sheen-overlay" animate={{ x: ["-100%", "100%"] }} transition={{ duration: 4, repeat: Infinity, repeatDelay: 2 }} />
                </div>
            </motion.div>
        </div>
      </section>
    </div>
    </>
  );
};

export default App;