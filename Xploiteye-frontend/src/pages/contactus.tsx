// src/App.tsx

import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';

// --- TypeScript Interfaces for Type Safety ---
interface FormData {
  name: string;
  email: string;
  company: string;
  phone: string;
  subject: string;
  message: string;
  inquiryType: string;
}

interface VisibilityState {
  [key: string]: boolean;
}

// --- Main App Component ---
const App: React.FC = () => {
  const [isVisible, setIsVisible] = useState<VisibilityState>({});
  const [formData, setFormData] = useState<FormData>({
    name: '',
    email: '',
    company: '',
    phone: '',
    subject: '',
    message: '',
    inquiryType: 'general'
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitStatus, setSubmitStatus] = useState<'success' | null>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setIsVisible(prev => ({
              ...prev,
              [entry.target.id]: entry.isIntersecting
            }));
          }
        });
      },
      { threshold: 0.1 }
    );

    const elements = document.querySelectorAll('[id]');
    elements.forEach((el) => observer.observe(el));

    return () => observer.disconnect();
  }, []);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    // Simulate form submission for demonstration
    setTimeout(() => {
      setIsSubmitting(false);
      setSubmitStatus('success');
      setFormData({
        name: '', email: '', company: '', phone: '', subject: '', message: '', inquiryType: 'general'
      });
      
      setTimeout(() => {
        setSubmitStatus(null);
      }, 5000);
    }, 2000);
  };


  const inquiryTypes = [
    { value: 'general', label: 'General Inquiry' },
    { value: 'sales', label: 'Sales & Pricing' },
    { value: 'support', label: 'Technical Support' },
    { value: 'partnership', label: 'Partnership' },
    { value: 'demo', label: 'Request Demo' },
    { value: 'security', label: 'Security Concern' }
  ];

  const faqs = [
    { question: 'What makes XploitEye different from other cybersecurity platforms?', answer: 'XploitEye combines advanced AI, multi-agent LLMs, and RAG technology to automate the complete cyber kill chain - from reconnaissance to persistence testing. Our platform makes enterprise-grade security assessments accessible to non-experts through an intuitive dashboard.' },
    { question: 'What types of systems and applications can XploitEye assess?', answer: 'Our platform validates security through testing on Metasploitable2, Damn Vulnerable Linux, Alt-Linux Exploitable Build, DVWA, WebGoat, Juice Shop, Mutillidae, and bWAPP. We also test Web APIs, Library APIs, OS APIs, Database APIs, Hardware APIs, and Service APIs.' },
    { question: 'How does the AI-driven vulnerability assessment work?', answer: 'XploitEye uses fine-tuned Large Language Models and RAG-based agents to interpret vulnerability data, simulate attack paths, recommend layered defenses, and generate structured reports aligned with ISO and ISC2 standards - all in real-time.' },
    { question: 'Is XploitEye suitable for non-technical users like SMEs and students?', answer: 'Absolutely! Our platform empowers non-expert users such as SMEs, students, and startup developers to conduct self-guided cybersecurity assessments using an intuitive dashboard without requiring formal security training.' },
    { question: 'What security standards does XploitEye comply with?', answer: 'XploitEye generates reports compliant with ISO and ISC2 standards. Our secure web interface prevents session hijacking, brute force attacks, and implements strong authentication with encrypted transactions and proper password salting.' },
    { question: 'How does the AI chatbot assist with security assessments?', answer: 'Our AI-driven RAG chatbot provides real-time assistance by answering questions, guiding security assessments, interpreting technical results in simple language, and generating compliance reports - making cybersecurity accessible to everyone.' }
  ];

  const offices = [
    { city: 'San Francisco', address: '123 Cyber Street, Tech City, CA 94105', phone: '+1 (555) 123-4567', email: 'sf@xploiteye.com' },
    { city: 'New York', address: '456 Security Ave, NYC, NY 10001', phone: '+1 (555) 234-5678', email: 'ny@xploiteye.com' },
    { city: 'London', address: '789 Cyber Lane, London, UK EC1A 1BB', phone: '+44 20 1234 5678', email: 'london@xploiteye.com' }
  ];

  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: `
        /* --- CONVERTED & MERGED CSS --- */
        body { background-color: black; color: white; margin: 0; font-family: system-ui, -apple-system, sans-serif; overflow-x: hidden; }

        /* Mobile overflow fixes */
        @media (max-width: 768px) {
          html, body {
            overflow-x: hidden !important;
            width: 100% !important;
          }

          .contact-page {
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

          /* Contact form and FAQ sections */
          .contact-form-section, .faq-section {
            padding-left: 1rem !important;
            padding-right: 1rem !important;
            width: 100% !important;
            max-width: 100% !important;
            box-sizing: border-box !important;
          }

          .faq-grid, .form-layout {
            width: 100% !important;
            max-width: 100% !important;
            padding-left: 0 !important;
            padding-right: 0 !important;
            box-sizing: border-box !important;
          }

          .faq-item, .form-container {
            max-width: 100% !important;
            width: 100% !important;
            margin-left: 0 !important;
            margin-right: 0 !important;
            box-sizing: border-box !important;
          }
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


        :root {
          --color-almost-black: #0d0d0d;
          --color-pure-white: #ffffff;
          --color-endor-green: #00f078;
          --color-bright-green: #00ff88;
        }
        body { margin: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', 'Oxygen', 'Ubuntu', 'Cantarell', 'Fira Sans', 'Droid Sans', 'Helvetica Neue', sans-serif; -webkit-font-smoothing: antialiased; -moz-osx-font-smoothing: grayscale; }
        .container {
          max-width: 1200px;
          margin: 0 auto;
          padding: 0 1rem;
        }
        
        /* --- ALL CSS FROM YOUR FILE IS PASTED BELOW --- */
        .contact-page { background: var(--color-almost-black); color: var(--color-pure-white); min-height: 100vh; }
        .contact-hero { padding: 150px 0 40px; position: relative; background: radial-gradient(ellipse at center, rgba(0, 255, 127, 0.1) 0%, transparent 70%); text-align: center; }
        .contact-hero::before { content: ''; position: absolute; top: 0; left: 0; right: 0; bottom: 0; background: linear-gradient(135deg, rgba(0, 255, 127, 0.05) 0%, transparent 50%, rgba(0, 255, 127, 0.03) 100%); pointer-events: none; }
        .contact-hero__content { max-width: 800px; margin: 0 auto; position: relative; z-index: 2; }
        .contact-hero__title { font-size: clamp(2.5rem, 5vw, 4rem); font-weight: 700; line-height: 1.1; margin-bottom: 1rem; }
        .title-gradient { background: linear-gradient(135deg, var(--color-endor-green) 0%, var(--color-bright-green) 100%); -webkit-background-clip: text; -webkit-text-fill-color: transparent; background-clip: text; }
        .contact-hero__description { font-size: 1.2rem; line-height: 1.6; color: rgba(255, 255, 255, 0.8); max-width: 700px; margin: 0 auto; }
        .contact-form-section {
          padding: 100px 0;
        }
        .form-layout { display: grid; grid-template-columns: 1fr 1.2fr; gap: 4rem; max-width: 1200px; margin: 0 auto; align-items: start; }
        .form-info { padding-right: 2rem; }
        .section-title { font-size: clamp(2rem, 4vw, 2.5rem); font-weight: 700; color: var(--color-pure-white); margin-bottom: 1rem; }
        .section-description { font-size: 1.1rem; color: rgba(255, 255, 255, 0.8); line-height: 1.6; margin-bottom: 2rem; }
        .contact-benefits { display: flex; flex-direction: column; gap: 1rem; }
        .benefit-item { display: flex; align-items: center; gap: 1rem; padding: 1rem; background: rgba(0, 255, 127, 0.05); border: 1px solid rgba(0, 255, 127, 0.1); border-radius: 12px; transition: all 0.3s ease; }
        .benefit-item:hover { background: rgba(0, 255, 127, 0.1); border-color: rgba(0, 255, 127, 0.2); transform: translateX(10px); }
        .benefit-icon { font-size: 1.2rem; filter: drop-shadow(0 0 10px rgba(0, 255, 127, 0.3)); }
        .form-container { background: rgba(255, 255, 255, 0.03); border: 1px solid rgba(255, 255, 255, 0.1); border-radius: 20px; padding: 3rem; backdrop-filter: blur(10px); }
        .contact-form { display: flex; flex-direction: column; gap: 1.5rem; }
        .form-row { display: grid; grid-template-columns: 1fr 1fr; gap: 1.5rem; }
        .form-group { display: flex; flex-direction: column; gap: 0.5rem; }
        .form-group label { font-size: 0.9rem; font-weight: 500; color: var(--color-endor-green); text-transform: uppercase; letter-spacing: 1px; }
        .form-group input, .form-group select, .form-group textarea { padding: 1rem; background: rgba(255, 255, 255, 0.05); border: 1px solid rgba(255, 255, 255, 0.2); border-radius: 12px; color: var(--color-pure-white); font-size: 1rem; transition: all 0.3s ease; backdrop-filter: blur(10px); }
        .form-group input:focus, .form-group select:focus, .form-group textarea:focus { outline: none; border-color: var(--color-endor-green); box-shadow: 0 0 20px rgba(0, 255, 127, 0.2); background: rgba(255, 255, 255, 0.08); }
        .form-group input::placeholder, .form-group textarea::placeholder { color: rgba(255, 255, 255, 0.5); }
        .form-group select { appearance: none; -webkit-appearance: none; background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='16' height='16' fill='%2300f078' viewBox='0 0 16 16'%3E%3Cpath fill-rule='evenodd' d='M1.646 4.646a.5.5 0 0 1 .708 0L8 10.293l5.646-5.647a.5.5 0 0 1 .708.708l-6 6a.5.5 0 0 1-.708 0l-6-6a.5.5 0 0 1 0-.708z'/%3E%3C/svg%3E"); background-repeat: no-repeat; background-position: right 1rem center; cursor: pointer; }
        .form-group select option { background: var(--color-almost-black); color: var(--color-pure-white); }
        .form-group textarea { resize: vertical; min-height: 120px; font-family: inherit; }
        .submit-btn { background: linear-gradient(135deg, var(--color-endor-green) 0%, var(--color-bright-green) 100%); color: var(--color-almost-black); border: none; padding: 1.2rem 2rem; border-radius: 12px; font-size: 1rem; font-weight: 600; cursor: pointer; transition: all 0.3s ease; box-shadow: 0 4px 15px rgba(0, 255, 127, 0.3); display: flex; align-items: center; justify-content: center; gap: 0.5rem; margin-top: 1rem; }
        .submit-btn:hover:not(:disabled) { transform: translateY(-2px); box-shadow: 0 8px 25px rgba(0, 255, 127, 0.4); }
        .submit-btn:disabled { opacity: 0.7; cursor: not-allowed; }
        .submit-btn.submitting { background: rgba(0, 255, 127, 0.3); color: var(--color-pure-white); }
        .spinner { width: 16px; height: 16px; border: 2px solid transparent; border-top: 2px solid currentColor; border-radius: 50%; animation: spin 1s linear infinite; }
        @keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }
        .success-message { background: rgba(76, 175, 80, 0.1); border: 1px solid rgba(76, 175, 80, 0.3); color: #4caf50; padding: 1rem; border-radius: 12px; text-align: center; font-weight: 500; margin-top: 1rem; }
        .faq-section {
          padding: 100px 0;
          background: linear-gradient(180deg, transparent 0%, rgba(0, 255, 127, 0.02) 50%, transparent 100%);
        }
        .section-header { text-align: center; margin-bottom: 3rem; }
        .faq-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
          gap: 2rem;
          max-width: 1000px;
          margin: 0 auto;
          width: 100%;
        }
        .faq-item { background: rgba(255, 255, 255, 0.05); border: 1px solid rgba(255, 255, 255, 0.1); border-radius: 16px; padding: 2rem; transition: all 0.3s ease; backdrop-filter: blur(10px); }
        .faq-item:hover { transform: translateY(-5px); border-color: rgba(0, 255, 127, 0.3); box-shadow: 0 15px 30px rgba(0, 255, 127, 0.1); }
        .faq-question { font-size: 1.2rem; font-weight: 600; color: var(--color-endor-green); margin-bottom: 1rem; line-height: 1.4; }
        .faq-answer { color: rgba(255, 255, 255, 0.8); line-height: 1.6; font-size: 0.95rem; }
        @media (max-width: 1024px) { .form-layout { grid-template-columns: 1fr; gap: 3rem; } .form-info { padding-right: 0; text-align: center; } .contact-benefits { max-width: 500px; margin: 0 auto; } }
        @media (max-width: 768px) {
          .contact-hero { padding: 100px 0 60px; }
          .form-container { padding: 2rem; }
          .form-row { grid-template-columns: 1fr; gap: 1rem; }
          .faq-grid {
            grid-template-columns: 1fr;
            grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
          }
          .benefit-item:hover { transform: translateX(5px); }
          .container { padding: 0 0.8rem; }
        }
        @media (max-width: 480px) {
          .contact-hero { padding: 170px 0 40px; }
          .contact-hero__title { font-size: 2rem; }
          .form-container { padding: 1.5rem; }
          .form-group input, .form-group select, .form-group textarea { padding: 0.75rem; }
          .submit-btn { padding: 1rem 1.5rem; }
          .faq-item { padding: 1.5rem; }
          .section-title { font-size: 1.75rem; }
          .container { padding: 0 0.5rem; }
          .faq-grid { grid-template-columns: 1fr; }
        }
      `}} />
    <div className="contact-page">
      {/* Hero Section */}
      <motion.section 
        className="contact-hero"
        id="hero"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 1 }}
      >
        <div className="container">
          <motion.div 
            className="contact-hero__content"
            initial={{ y: 50, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ duration: 0.8, delay: 0.2 }}
          >
            <h1 className="contact-hero__title">
              Get in <span className="title-gradient">Touch</span>
            </h1>
            <p className="contact-hero__description">
              Ready to revolutionize your cybersecurity? Our experts are here to help you 
              get started with XploitEye and answer any questions you may have.
            </p>
          </motion.div>
        </div>
      </motion.section>


      {/* Contact Form Section */}
      <motion.section 
        className="contact-form-section"
        id="form"
        initial={{ opacity: 0 }}
        animate={isVisible.form ? { opacity: 1 } : { opacity: 0 }}
        transition={{ duration: 0.8 }}
      >
        <div className="container">
          <div className="form-layout">
            <motion.div 
              className="form-info"
              initial={{ x: -50, opacity: 0 }}
              animate={isVisible.form ? { x: 0, opacity: 1 } : { x: -50, opacity: 0 }}
              transition={{ duration: 0.8 }}
            >
              <h2 className="section-title">Send Us a Message</h2>
              <p className="section-description">
                Have a specific question or need personalized assistance? 
                Fill out the form and our team will get back to you within 24 hours.
              </p>
              <div className="contact-benefits">
                <div className="benefit-item"><span className="benefit-icon">⚡</span><span>Quick Response Time</span></div>
                <div className="benefit-item"><span className="benefit-icon">🔒</span><span>Secure Communication</span></div>
                <div className="benefit-item"><span className="benefit-icon">👥</span><span>Expert Consultation</span></div>
              </div>
            </motion.div>

            <motion.div 
              className="form-container"
              initial={{ x: 50, opacity: 0 }}
              animate={isVisible.form ? { x: 0, opacity: 1 } : { x: 50, opacity: 0 }}
              transition={{ duration: 0.8, delay: 0.2 }}
            >
              <form onSubmit={handleSubmit} className="contact-form">
                <div className="form-row">
                  <div className="form-group"><label htmlFor="name">Full Name *</label><input type="text" id="name" name="name" value={formData.name} onChange={handleInputChange} required placeholder="Enter your full name"/></div>
                  <div className="form-group"><label htmlFor="email">Email Address *</label><input type="email" id="email" name="email" value={formData.email} onChange={handleInputChange} required placeholder="Enter your email"/></div>
                </div>
                <div className="form-row">
                  <div className="form-group"><label htmlFor="company">Company</label><input type="text" id="company" name="company" value={formData.company} onChange={handleInputChange} placeholder="Enter your company name"/></div>
                  <div className="form-group"><label htmlFor="phone">Phone Number</label><input type="tel" id="phone" name="phone" value={formData.phone} onChange={handleInputChange} placeholder="Enter your phone number"/></div>
                </div>
                <div className="form-group">
                  <label htmlFor="inquiryType">Inquiry Type</label>
                  <select id="inquiryType" name="inquiryType" value={formData.inquiryType} onChange={handleInputChange}>
                    {inquiryTypes.map((type) => (<option key={type.value} value={type.value}>{type.label}</option>))}
                  </select>
                </div>
                <div className="form-group"><label htmlFor="subject">Subject *</label><input type="text" id="subject" name="subject" value={formData.subject} onChange={handleInputChange} required placeholder="Enter the subject of your inquiry"/></div>
                <div className="form-group"><label htmlFor="message">Message *</label><textarea id="message" name="message" value={formData.message} onChange={handleInputChange} required rows={6} placeholder="Tell us more about your inquiry..."></textarea></div>
                <motion.button type="submit" className={`submit-btn ${isSubmitting ? 'submitting' : ''}`} disabled={isSubmitting} whileHover={{ scale: isSubmitting ? 1 : 1.02 }} whileTap={{ scale: isSubmitting ? 1 : 0.98 }}>
                  {isSubmitting ? (<><span className="spinner"></span><span>Sending...</span></>) : ('Send Message')}
                </motion.button>
                {submitStatus === 'success' && (<motion.div className="success-message" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>✅ Thank you! Your message has been sent successfully. We'll get back to you soon.</motion.div>)}
              </form>
            </motion.div>
          </div>
        </div>
      </motion.section>

      {/* FAQ Section */}
      <motion.section 
        className="faq-section"
        id="faq"
        initial={{ opacity: 0 }}
        animate={isVisible.faq ? { opacity: 1 } : { opacity: 0 }}
        transition={{ duration: 0.8 }}
      >
        <div className="container">
          <motion.div className="section-header" initial={{ y: 30, opacity: 0 }} animate={isVisible.faq ? { y: 0, opacity: 1 } : { y: 30, opacity: 0 }} transition={{ duration: 0.6 }}>
            <h2 className="section-title">Frequently Asked Questions</h2>
            <p className="section-description">Find quick answers to common questions about XploitEye.</p>
          </motion.div>
          <div className="faq-grid">
            {faqs.map((faq, index) => (
              <motion.div key={index} className="faq-item" initial={{ y: 30, opacity: 0 }} animate={isVisible.faq ? { y: 0, opacity: 1 } : { y: 30, opacity: 0 }} transition={{ duration: 0.6, delay: index * 0.1 }}>
                <h3 className="faq-question">{faq.question}</h3>
                <p className="faq-answer">{faq.answer}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </motion.section>

    </div>
    </>
  );
};

export default App;