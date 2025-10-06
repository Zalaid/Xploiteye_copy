import React from "react";
import Link from "next/link";

export default function Footer() {
  return (
    <>
      {/* Footer Styles */}
      <style dangerouslySetInnerHTML={{ __html: `
        /* Footer Styles */
        .footer {
          position: relative;
          background: linear-gradient(180deg, rgba(0, 0, 0, 0.95) 0%, rgba(0, 26, 10, 0.98) 100%);
          color: #ffffff;
          overflow: hidden;
          margin-top: 4rem;
        }
        
        .footer-content {
          position: relative;
          z-index: 2;
          padding: 4rem 0 0;
        }
        
        .footer-container {
          max-width: 1200px;
          margin: 0 auto;
          padding: 0 2rem;
          display: grid;
          grid-template-columns: 2fr 1fr 1fr 1fr 1fr;
          gap: 3rem;
          margin-bottom: 3rem;
        }
        
        .company-info {
          max-width: 350px;
        }
        
        .footer-logo {
          margin-bottom: 1.5rem;
        }
        
                .footer__logo-image {
          height: var(--footer-logo-height, 120px);
          width: auto;
          max-width: var(--footer-logo-max-width, 500px);
          transition: all 0.3s ease;
          filter: brightness(1.2);
          cursor: pointer;
        }
        
        .footer__logo-image:hover {
          transform: scale(1.05);
        }
        
        .company-description {
          color: rgba(255, 255, 255, 0.8);
          line-height: 1.6;
          margin-bottom: 2rem;
          font-size: 0.95rem;
        }
        
        .social-links {
          display: flex;
          gap: 1rem;
        }
        
        .social-link {
          display: flex;
          align-items: center;
          justify-content: center;
          width: 40px;
          height: 40px;
          background: rgba(0, 240, 120, 0.1);
          border: 1px solid rgba(0, 240, 120, 0.3);
          border-radius: 8px;
          color: rgba(255, 255, 255, 0.8);
          text-decoration: none;
          transition: all 0.3s ease;
        }
        
        .social-link:hover {
          background: rgba(0, 240, 120, 0.2);
          border-color: rgba(0, 240, 120, 0.6);
          color: #00f078;
          transform: translateY(-2px);
        }
        
        .footer-section {
          display: flex;
          flex-direction: column;
        }
        
        .footer-title {
          font-size: 1.1rem;
          font-weight: 600;
          color: #ffffff;
          margin-bottom: 1.5rem;
          letter-spacing: 0.5px;
        }
        
        .footer-links {
          list-style: none;
          padding: 0;
          margin: 0;
        }
        
        .footer-links li {
          margin-bottom: 0.75rem;
        }
        
        .footer-link {
          color: rgba(255, 255, 255, 0.7);
          text-decoration: none;
          font-size: 0.9rem;
          transition: all 0.3s ease;
          display: inline-block;
        }
        
        .footer-link:hover {
          color: #00f078;
          transform: translateX(4px);
        }
        
        .footer-bottom {
          border-top: 1px solid rgba(0, 240, 120, 0.2);
          padding: 2rem 0;
          background: rgba(0, 0, 0, 0.3);
          backdrop-filter: blur(10px);
        }
        
        .footer-bottom-content {
          max-width: 1200px;
          margin: 0 auto;
          padding: 0 2rem;
          display: flex;
          justify-content: space-between;
          align-items: center;
          flex-wrap: wrap;
          gap: 1rem;
        }
        
        .copyright {
          color: rgba(255, 255, 255, 0.6);
          font-size: 0.9rem;
          margin: 0;
        }
        
        .footer-bottom-links {
          display: flex;
          gap: 2rem;
        }
        
        .footer-bottom-link {
          color: rgba(255, 255, 255, 0.6);
          text-decoration: none;
          font-size: 0.9rem;
          transition: color 0.3s ease;
        }
        
        .footer-bottom-link:hover {
          color: #00f078;
        }

        /* Footer Responsive Design */
        @media (max-width: 1024px) {
          .footer-container {
            grid-template-columns: 2fr 1fr 1fr;
            gap: 2.5rem;
          }
          
          .footer-section:nth-child(4),
          .footer-section:nth-child(5) {
            grid-column: span 1;
          }
        }

        @media (max-width: 768px) {
          .footer-container {
            grid-template-columns: 1fr 1fr;
            gap: 2rem;
          }
          
          .company-info {
            grid-column: span 2;
            max-width: 100%;
            text-align: center;
            margin-bottom: 1rem;
          }
          
          .footer-content {
            padding: 3rem 0 0;
          }
          
          .footer-bottom-content {
            flex-direction: column;
            text-align: center;
          }
        }

        @media (max-width: 480px) {
          .footer-container {
            grid-template-columns: 1fr;
            gap: 2rem;
            padding: 0 1rem;
          }
          
          .company-info {
            grid-column: span 1;
          }
          
          .footer-content {
            padding: 2rem 0 0;
          }
          
          .footer-bottom-content {
            padding: 0 1rem;
          }
          
          .footer-bottom-links {
            gap: 1rem;
          }
        }
      `}} />

      <footer className="footer">
        <div className="footer-content">
          <div className="footer-container">
            {/* Company Info Section */}
            <div className="footer-section company-info">
              <div className="footer-logo">
                <img 
                  src="/images/logo.svg"
                  alt="XPLOITEYE Logo" 
                  className="footer__logo-image"
                />
              </div>
              <p className="company-description">
                Secure your software supply chain with advanced vulnerability detection and AI-powered security solutions.
              </p>
              <div className="social-links">
                <a href="#" className="social-link" aria-label="Twitter">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M23.953 4.57a10 10 0 01-2.825.775 4.958 4.958 0 002.163-2.723c-.951.555-2.005.959-3.127 1.184a4.92 4.92 0 00-8.384 4.482C7.69 8.095 4.067 6.13 1.64 3.162a4.822 4.822 0 00-.666 2.475c0 1.71.87 3.213 2.188 4.096a4.904 4.904 0 01-2.228-.616v.06a4.923 4.923 0 003.946 4.827 4.996 4.996 0 01-2.212.085 4.936 4.936 0 004.604 3.417 9.867 9.867 0 01-6.102 2.105c-.39 0-.779-.023-1.17-.067a13.995 13.995 0 007.557 2.209c9.053 0 13.998-7.496 13.998-13.985 0-.21 0-.42-.015-.63A9.935 9.935 0 0024 4.59z"/>
                  </svg>
                </a>
                <a href="#" className="social-link" aria-label="LinkedIn">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/>
                  </svg>
                </a>
                <a href="#" className="social-link" aria-label="GitHub">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/>
                  </svg>
                </a>
              </div>
            </div>

            {/* Products Section */}
            <div className="footer-section">
              <h3 className="footer-title">Products</h3>
              <ul className="footer-links">
                <li><Link href="/dashboard" className="footer-link">XPLOITEYE Core</Link></li>
                <li><Link href="/dashboard" className="footer-link">XPLOITEYE Pro</Link></li>
                <li><Link href="/dashboard" className="footer-link">XPLOITEYE Patches</Link></li>
                <li><Link href="/contactus" className="footer-link">Enterprise Solutions</Link></li>
              </ul>
            </div>

            {/* Legal & Policies Section */}
            <div className="footer-section">
              <h3 className="footer-title">Legal & Policies</h3>
              <ul className="footer-links">
                <li><Link href="/payment_req#privacy-policy" className="footer-link">Privacy Policy</Link></li>
                <li><Link href="/payment_req#terms-conditions" className="footer-link">Terms and Conditions</Link></li>
                <li><Link href="/payment_req#return-policy" className="footer-link">Return Policy</Link></li>
                <li><Link href="/payment_req#refund-policy" className="footer-link">Refund Policy</Link></li>
                <li><Link href="/payment_req#shipping-policy" className="footer-link">Shipping Policy</Link></li>
              </ul>
            </div>

            {/* Company Section */}
            <div className="footer-section">
              <h3 className="footer-title">Company</h3>
              <ul className="footer-links">
                <li><Link href="/about" className="footer-link">About Us</Link></li>
                <li><Link href="/payment_req#address" className="footer-link">Address</Link></li>
                <li><Link href="/contactus" className="footer-link">Contact</Link></li>
                <li><Link href="/doc" className="footer-link">Documentation</Link></li>
              </ul>
            </div>

            {/* Support Section */}
            <div className="footer-section">
              <h3 className="footer-title">Support</h3>
              <ul className="footer-links">
                <li><Link href="/payment_req#faqs" className="footer-link">Help Center</Link></li>
                <li><Link href="/payment_req#customer-service" className="footer-link">Customer Service</Link></li>
                <li><Link href="/payment_req#operational-hours" className="footer-link">Support Hours</Link></li>
                <li><Link href="/contactus" className="footer-link">Contact Support</Link></li>
              </ul>
            </div>

            {/* Policies Section */}
            <div className="footer-section">
              <h3 className="footer-title">Policies</h3>
              <ul className="footer-links">
                <li><Link href="/payment_req#return-policy" className="footer-link">Return Policy</Link></li>
                <li><Link href="/payment_req#refund-policy" className="footer-link">Refund Policy</Link></li>
                <li><Link href="/payment_req#shipping-policy" className="footer-link">Shipping Policy</Link></li>
                <li><Link href="/payment_req#faqs" className="footer-link">FAQs</Link></li>
              </ul>
            </div>
          </div>

          {/* Footer Bottom */}
          <div className="footer-bottom">
            <div className="footer-bottom-content">
              <p className="copyright">
                © 2024 XPLOITEYE. All rights reserved.
              </p>
              <div className="footer-bottom-links">
                <a href="#" className="footer-bottom-link">Privacy</a>
                <a href="#" className="footer-bottom-link">Terms</a>
                <a href="#" className="footer-bottom-link">Cookies</a>
              </div>
            </div>
          </div>
        </div>
      </footer>
    </>
  );
}