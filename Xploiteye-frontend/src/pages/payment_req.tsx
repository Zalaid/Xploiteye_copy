import React, { useState } from 'react';
import { useRouter } from 'next/router';

const PaymentRequirements = () => {
  const [activeSection, setActiveSection] = useState('return-policy');
  const router = useRouter();

  // Handle section navigation from URL hash
  React.useEffect(() => {
    const hash = router.asPath.split('#')[1];
    if (hash) {
      setActiveSection(hash);
    }
  }, [router.asPath]);

  const sections = [
    { id: 'return-policy', title: 'Return Policy', icon: '↩️' },
    { id: 'privacy-policy', title: 'Privacy Policy', icon: '🔒' },
    { id: 'refund-policy', title: 'Refund Policy', icon: '💰' },
    { id: 'terms-conditions', title: 'Terms & Conditions', icon: '📋' },
    { id: 'faqs', title: 'FAQs', icon: '❓' },
    { id: 'customer-service', title: 'Customer Service', icon: '📞' },
    { id: 'operational-hours', title: 'Operational Hours', icon: '🕒' },
    { id: 'address', title: 'Address', icon: '📍' },
    { id: 'shipping-policy', title: 'Shipping Policy', icon: '📦' }
  ];

  const renderContent = () => {
    switch (activeSection) {
      case 'return-policy':
        return (
          <div className="policy-content">
            <h2>Return Policy</h2>
            <div className="policy-section">
              <h3>Digital Services Return Policy</h3>
              <p>XploitEye provides cybersecurity scanning and vulnerability assessment services. Due to the nature of our digital services:</p>
              <ul>
                <li>Completed vulnerability scans and reports cannot be returned once delivered</li>
                <li>Subscription services can be cancelled at any time with 30 days notice</li>
                <li>Enterprise licenses can be returned within 14 days if no scans have been performed</li>
                <li>Custom security assessments are non-returnable once initiated</li>
              </ul>
              
              <h3>Refund Eligibility</h3>
              <p>You may be eligible for a refund if:</p>
              <ul>
                <li>Technical issues prevent service delivery for more than 48 hours</li>
                <li>Service does not meet documented specifications</li>
                <li>Billing errors or duplicate charges occur</li>
              </ul>
              
              <h3>Return Process</h3>
              <p>To initiate a return request:</p>
              <ol>
                <li>Contact our support team at xploiteye@gmail.com</li>
                <li>Provide your account details and reason for return</li>
                <li>Allow 5-7 business days for review and processing</li>
              </ol>
            </div>
          </div>
        );

      case 'privacy-policy':
        return (
          <div className="policy-content">
            <h2>Privacy Policy</h2>
            <div className="policy-section">
              <h3>Information We Collect</h3>
              <p>XploitEye collects the following information to provide cybersecurity services:</p>
              <ul>
                <li>Account information (email, username, password)</li>
                <li>Network scan data and vulnerability reports</li>
                <li>Usage analytics and service performance metrics</li>
                <li>Payment and billing information</li>
              </ul>
              
              <h3>How We Use Your Information</h3>
              <ul>
                <li>Provide vulnerability scanning and security assessment services</li>
                <li>Generate and deliver security reports</li>
                <li>Improve our AI-powered security solutions</li>
                <li>Send service notifications and security alerts</li>
                <li>Process payments and manage subscriptions</li>
              </ul>
              
              <h3>Data Security</h3>
              <p>We implement industry-standard security measures:</p>
              <ul>
                <li>End-to-end encryption for all data transmission</li>
                <li>Secure cloud storage with regular backups</li>
                <li>Multi-factor authentication for account access</li>
                <li>Regular security audits and penetration testing</li>
              </ul>
              
              <h3>Data Sharing</h3>
              <p>We do not sell or share your personal data with third parties except:</p>
              <ul>
                <li>When required by law or legal process</li>
                <li>To prevent fraud or security threats</li>
                <li>With your explicit consent</li>
              </ul>
            </div>
          </div>
        );

      case 'refund-policy':
        return (
          <div className="policy-content">
            <h2>Refund Policy</h2>
            <div className="policy-section">
              <h3>Refund Eligibility</h3>
              <p>XploitEye offers refunds under the following conditions:</p>
              <ul>
                <li>Service outages exceeding 48 hours due to our technical issues</li>
                <li>Billing errors or unauthorized charges</li>
                <li>Failure to deliver promised security features</li>
                <li>Cancellation within 14 days of initial subscription (unused services only)</li>
              </ul>
              
              <h3>Non-Refundable Services</h3>
              <ul>
                <li>Completed vulnerability scans and delivered reports</li>
                <li>Custom security assessments once initiated</li>
                <li>Enterprise consulting services after commencement</li>
                <li>Third-party tool licenses and integrations</li>
              </ul>
              
              <h3>Refund Process</h3>
              <ol>
                <li>Submit refund request to xploiteye@gmail.com</li>
                <li>Include account details and reason for refund</li>
                <li>Provide supporting documentation if applicable</li>
                <li>Allow 7-10 business days for processing</li>
                <li>Refunds processed to original payment method</li>
              </ol>
              
              <h3>Partial Refunds</h3>
              <p>Partial refunds may be issued for:</p>
              <ul>
                <li>Unused portions of annual subscriptions</li>
                <li>Service credits for extended outages</li>
                <li>Pro-rated refunds for plan downgrades</li>
              </ul>
            </div>
          </div>
        );

      case 'terms-conditions':
        return (
          <div className="policy-content">
            <h2>Terms & Conditions</h2>
            <div className="policy-section">
              <h3>Service Agreement</h3>
              <p>By using XploitEye services, you agree to:</p>
              <ul>
                <li>Use services only for legitimate security testing purposes</li>
                <li>Comply with all applicable laws and regulations</li>
                <li>Not attempt to reverse engineer or exploit our platform</li>
                <li>Maintain confidentiality of your account credentials</li>
              </ul>
              
              <h3>Acceptable Use</h3>
              <p>You may not use XploitEye services to:</p>
              <ul>
                <li>Scan networks or systems without proper authorization</li>
                <li>Conduct malicious attacks or unauthorized penetration testing</li>
                <li>Violate privacy rights or applicable data protection laws</li>
                <li>Interfere with service availability for other users</li>
              </ul>
              
              <h3>Service Availability</h3>
              <ul>
                <li>We strive for 99.9% uptime but do not guarantee uninterrupted service</li>
                <li>Scheduled maintenance will be announced in advance</li>
                <li>Emergency maintenance may occur without prior notice</li>
              </ul>
              
              <h3>Limitation of Liability</h3>
              <p>XploitEye provides security scanning services "as is" and:</p>
              <ul>
                <li>Does not guarantee detection of all vulnerabilities</li>
                <li>Is not liable for damages resulting from security breaches</li>
                <li>Limits liability to the amount paid for services</li>
              </ul>
              
              <h3>Termination</h3>
              <p>We may terminate accounts for:</p>
              <ul>
                <li>Violation of terms of service</li>
                <li>Fraudulent or illegal activities</li>
                <li>Non-payment of fees</li>
                <li>Abuse of service resources</li>
              </ul>
            </div>
          </div>
        );

      case 'faqs':
        return (
          <div className="policy-content">
            <h2>Frequently Asked Questions</h2>
            <div className="policy-section">
              <h3>General Questions</h3>
              
              <div className="faq-item">
                <h4>What is XploitEye?</h4>
                <p>XploitEye is an AI-powered cybersecurity platform that provides vulnerability scanning, network discovery, and security assessment services for organizations of all sizes.</p>
              </div>
              
              <div className="faq-item">
                <h4>How does the vulnerability scanning work?</h4>
                <p>Our platform uses advanced scanning engines including Nuclei, Nmap, and custom AI agents to identify security vulnerabilities, open ports, and potential attack vectors in your network infrastructure.</p>
              </div>
              
              <div className="faq-item">
                <h4>Is my data secure?</h4>
                <p>Yes, we use end-to-end encryption, secure cloud storage, and follow industry best practices for data protection. All scan data is encrypted and stored securely.</p>
              </div>
              
              <h3>Billing & Subscriptions</h3>
              
              <div className="faq-item">
                <h4>What payment methods do you accept?</h4>
                <p>We accept major credit cards, PayPal, and wire transfers for enterprise accounts. All payments are processed securely through encrypted channels.</p>
              </div>
              
              <div className="faq-item">
                <h4>Can I cancel my subscription anytime?</h4>
                <p>Yes, you can cancel your subscription at any time. Your service will continue until the end of your current billing period.</p>
              </div>
              
              <h3>Technical Support</h3>
              
              <div className="faq-item">
                <h4>How do I get technical support?</h4>
                <p>Contact our support team at xploiteye@gmail.com or through the in-app support chat. Enterprise customers have access to priority support.</p>
              </div>
              
              <div className="faq-item">
                <h4>What scan types are available?</h4>
                <p>We offer light scans for basic vulnerability detection, comprehensive scans for detailed analysis, and custom scans tailored to your specific requirements.</p>
              </div>
              
              <div className="faq-item">
                <h4>How long do scans take?</h4>
                <p>Scan duration depends on the target size and scan type. Light scans typically complete in 5-15 minutes, while comprehensive scans may take 30-60 minutes.</p>
              </div>
            </div>
          </div>
        );

      case 'customer-service':
        return (
          <div className="policy-content">
            <h2>Customer Service</h2>
            <div className="policy-section">
              <h3>Contact Information</h3>
              <div className="contact-info">
                <div className="contact-item">
                  <h4>📧 Email Support</h4>
                  <p>xploiteye@gmail.com</p>
                  <p>Response time: 24-48 hours</p>
                </div>
                
                <div className="contact-item">
                  <h4>📞 Phone Support</h4>
                  <p>+92 3164454571</p>
                  <p>Available during business hours</p>
                </div>
                
                <div className="contact-item">
                  <h4>💬 Live Chat</h4>
                  <p>Available in dashboard</p>
                  <p>Monday-Friday: 9 AM - 6 PM EST</p>
                </div>
              </div>
              
              <h3>Support Tiers</h3>
              <ul>
                <li><strong>Basic Support:</strong> Email support for all users</li>
                <li><strong>Priority Support:</strong> Faster response times for Pro users</li>
                <li><strong>Enterprise Support:</strong> Dedicated support manager and phone support</li>
                <li><strong>Emergency Support:</strong> 24/7 critical issue resolution for Enterprise</li>
              </ul>
              
              <h3>Before Contacting Support</h3>
              <p>To help us assist you better, please:</p>
              <ul>
                <li>Check our documentation and FAQ section</li>
                <li>Have your account information ready</li>
                <li>Describe the issue with specific details</li>
                <li>Include error messages or screenshots if applicable</li>
              </ul>
              
              <h3>Support Languages</h3>
              <p>We provide support in English. Additional language support available for Enterprise customers upon request.</p>
            </div>
          </div>
        );

      case 'operational-hours':
        return (
          <div className="policy-content">
            <h2>Operational Hours</h2>
            <div className="policy-section">
              <h3>Service Availability</h3>
              <p>XploitEye platform operates 24/7 with the following support schedule:</p>
              
              <div className="hours-grid">
                <div className="hours-item">
                  <h4>🌐 Platform Access</h4>
                  <p>24/7 - Always available</p>
                  <p>Automated scanning and reporting</p>
                </div>
                
                <div className="hours-item">
                  <h4>💬 Live Support</h4>
                  <p>Monday - Friday: 9:00 AM - 6:00 PM EST</p>
                  <p>Saturday: 10:00 AM - 4:00 PM EST</p>
                  <p>Sunday: Closed</p>
                </div>
                
                <div className="hours-item">
                  <h4>📧 Email Support</h4>
                  <p>24/7 - Responses within 24-48 hours</p>
                  <p>Priority support: 4-8 hours</p>
                </div>
                
                <div className="hours-item">
                  <h4>🚨 Emergency Support</h4>
                  <p>24/7 for Enterprise customers</p>
                  <p>Critical security incidents only</p>
                </div>
              </div>
              
              <h3>Maintenance Windows</h3>
              <ul>
                <li><strong>Scheduled Maintenance:</strong> Sundays 2:00 AM - 4:00 AM EST</li>
                <li><strong>Emergency Maintenance:</strong> As needed with advance notice when possible</li>
                <li><strong>Notification:</strong> All maintenance announced 48 hours in advance</li>
              </ul>
              
              <h3>Holiday Schedule</h3>
              <p>Support hours may be reduced during major holidays:</p>
              <ul>
                <li>New Year's Day</li>
                <li>Independence Day</li>
                <li>Thanksgiving Day</li>
                <li>Christmas Day</li>
              </ul>
              <p>Platform remains operational during all holidays.</p>
            </div>
          </div>
        );

      case 'address':
        return (
          <div className="policy-content">
            <h2>Company Address</h2>
            <div className="policy-section">
              <h3>Headquarters</h3>
              <div className="address-card">
                <h4>XploitEye Cybersecurity Solutions</h4>
                <p>CL-3 Abdalian Housing Society<br/>
                Johar Town, Lahore<br/>
                Pakistan</p>
              </div>
              
              <h3>Regional Offices</h3>
              <div className="business-hours">
                <h4>Business Hours</h4>
                <p>Monday - Friday: 9:00 AM - 6:00 PM EST</p>
                <p>Saturday: 10:00 AM - 4:00 PM EST</p>
                <p>Sunday: Closed</p>
                <p><em>Emergency support available 24/7 for Enterprise customers</em></p>
              </div>
              
              <h3>Mailing Address</h3>
              <p>For legal documents and official correspondence:</p>
              <div className="address-card">
                <p>XploitEye Legal Department<br/>
                CL-3 Abdalian Housing Society<br/>
                Johar Town, Lahore<br/>
                Pakistan</p>
              </div>
              
              <h3>Contact Methods</h3>
              <ul>
                <li><strong>Email:</strong> xploiteye@gmail.com</li>
                <li><strong>Phone:</strong> 92 3164454571</li>
                <li><strong>Business Registration:</strong> XploitEye Inc.</li>
                <li><strong>Mailing Address:</strong> CL-3 Abdalian Housing Society, Johar Town, Lahore</li>
              </ul>
            </div>
          </div>
        );

      case 'shipping-policy':
        return (
          <div className="policy-content">
            <h2>Shipping Policy</h2>
            <div className="policy-section">
              <h3>Digital Service Delivery</h3>
              <p>XploitEye primarily provides digital cybersecurity services. Most deliverables are provided electronically:</p>
              
              <div className="delivery-methods">
                <div className="delivery-item">
                  <h4>📧 Email Delivery</h4>
                  <p>Vulnerability reports and scan results</p>
                  <p>Delivery time: Immediate upon completion</p>
                </div>
                
                <div className="delivery-item">
                  <h4>🌐 Dashboard Access</h4>
                  <p>Real-time scan progress and results</p>
                  <p>Available 24/7 through secure portal</p>
                </div>
                
                <div className="delivery-item">
                  <h4>📱 API Integration</h4>
                  <p>Automated delivery to your systems</p>
                  <p>Real-time data feeds and alerts</p>
                </div>
              </div>
              
              <h3>Physical Deliveries</h3>
              <p>For enterprise customers requiring physical deliverables:</p>
              
              <ul>
                <li><strong>Hardware Security Keys:</strong> 3-5 business days via secure courier</li>
                <li><strong>Printed Reports:</strong> 5-7 business days via certified mail</li>
                <li><strong>USB Drives:</strong> 3-5 business days with encrypted storage</li>
                <li><strong>Documentation:</strong> 7-10 business days for bound materials</li>
              </ul>
              
              <h3>Shipping Regions</h3>
              <p>Physical deliveries available to:</p>
              <ul>
                <li>United States and Canada</li>
                <li>European Union countries</li>
                <li>Australia and New Zealand</li>
                <li>Other regions upon request</li>
              </ul>
              
              <h3>Delivery Confirmation</h3>
              <ul>
                <li>Email notifications for all digital deliveries</li>
                <li>Tracking numbers for physical shipments</li>
                <li>Delivery confirmation required for sensitive materials</li>
                <li>Secure disposal of packaging materials</li>
              </ul>
              
              <h3>Shipping Costs</h3>
              <p>Digital services: No shipping charges</p>
              <p>Physical deliveries:</p>
              <ul>
                <li>Standard shipping: $15-25</li>
                <li>Express shipping: $35-50</li>
                <li>International: $50-100</li>
                <li>Secure courier: $100-200</li>
              </ul>
            </div>
          </div>
        );

      default:
        return <div>Select a section from the navigation</div>;
    }
  };

  return (
    <>
      <style dangerouslySetInnerHTML={{
        __html: `
          .payment-requirements {
            min-height: 100vh;
            background: linear-gradient(180deg, rgba(0, 0, 0, 0.95) 0%, rgba(0, 26, 10, 0.98) 100%);
            color: #ffffff;
            padding: 2rem 0;
          }
          
          .container {
            max-width: 1200px;
            margin: 0 auto;
            padding: 0 2rem;
          }
          
          .page-header {
            text-align: center;
            margin-bottom: 3rem;
            padding: 2rem 0;
          }
          
          .page-title {
            font-size: 2.5rem;
            font-weight: 700;
            color: #00f078;
            margin-bottom: 1rem;
            text-shadow: 0 0 20px rgba(0, 240, 120, 0.3);
          }
          
          .page-subtitle {
            font-size: 1.1rem;
            color: rgba(255, 255, 255, 0.8);
            max-width: 600px;
            margin: 0 auto;
            line-height: 1.6;
          }
          
          .content-wrapper {
            display: grid;
            grid-template-columns: 300px 1fr;
            gap: 3rem;
            align-items: start;
          }
          
          .navigation {
            position: sticky;
            top: 2rem;
            background: rgba(0, 0, 0, 0.6);
            border: 1px solid rgba(0, 240, 120, 0.2);
            border-radius: 12px;
            padding: 1.5rem;
            backdrop-filter: blur(10px);
          }
          
          .nav-title {
            font-size: 1.2rem;
            font-weight: 600;
            color: #00f078;
            margin-bottom: 1.5rem;
            text-align: center;
          }
          
          .nav-list {
            list-style: none;
            padding: 0;
            margin: 0;
          }
          
          .nav-item {
            margin-bottom: 0.5rem;
          }
          
          .nav-button {
            width: 100%;
            padding: 0.75rem 1rem;
            background: transparent;
            border: 1px solid rgba(0, 240, 120, 0.2);
            border-radius: 8px;
            color: rgba(255, 255, 255, 0.8);
            font-size: 0.9rem;
            cursor: pointer;
            transition: all 0.3s ease;
            display: flex;
            align-items: center;
            gap: 0.5rem;
            text-align: left;
          }
          
          .nav-button:hover {
            background: rgba(0, 240, 120, 0.1);
            border-color: rgba(0, 240, 120, 0.4);
            color: #00f078;
            transform: translateX(4px);
          }
          
          .nav-button.active {
            background: rgba(0, 240, 120, 0.2);
            border-color: #00f078;
            color: #00f078;
          }
          
          .content-area {
            background: rgba(0, 0, 0, 0.4);
            border: 1px solid rgba(0, 240, 120, 0.2);
            border-radius: 12px;
            padding: 2rem;
            backdrop-filter: blur(10px);
            min-height: 600px;
          }
          
          .policy-content h2 {
            font-size: 2rem;
            color: #00f078;
            margin-bottom: 2rem;
            padding-bottom: 1rem;
            border-bottom: 2px solid rgba(0, 240, 120, 0.3);
          }
          
          .policy-content h3 {
            font-size: 1.4rem;
            color: #ffffff;
            margin: 2rem 0 1rem 0;
            font-weight: 600;
          }
          
          .policy-content h4 {
            font-size: 1.1rem;
            color: #00f078;
            margin: 1.5rem 0 0.5rem 0;
            font-weight: 500;
          }
          
          .policy-content p {
            color: rgba(255, 255, 255, 0.9);
            line-height: 1.7;
            margin-bottom: 1rem;
          }
          
          .policy-content ul, .policy-content ol {
            color: rgba(255, 255, 255, 0.9);
            padding-left: 1.5rem;
            margin-bottom: 1.5rem;
          }
          
          .policy-content li {
            margin-bottom: 0.5rem;
            line-height: 1.6;
          }
          
          .policy-section {
            margin-bottom: 2rem;
          }
          
          .contact-info, .hours-grid, .offices-grid, .delivery-methods {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
            gap: 1.5rem;
            margin: 2rem 0;
          }
          
          .contact-item, .hours-item, .office-item, .delivery-item {
            background: rgba(0, 240, 120, 0.05);
            border: 1px solid rgba(0, 240, 120, 0.2);
            border-radius: 8px;
            padding: 1.5rem;
          }
          
          .contact-item h4, .hours-item h4, .office-item h4, .delivery-item h4 {
            color: #00f078;
            margin-bottom: 1rem;
            font-size: 1.1rem;
          }
          
          .address-card {
            background: rgba(0, 240, 120, 0.05);
            border: 1px solid rgba(0, 240, 120, 0.2);
            border-radius: 8px;
            padding: 1.5rem;
            margin: 1rem 0;
            max-width: 400px;
          }
          
          .faq-item {
            background: rgba(0, 240, 120, 0.03);
            border-left: 3px solid #00f078;
            padding: 1.5rem;
            margin: 1.5rem 0;
            border-radius: 0 8px 8px 0;
          }
          
          .faq-item h4 {
            color: #00f078;
            margin-bottom: 0.5rem;
          }
          
          @media (max-width: 768px) {
            .content-wrapper {
              grid-template-columns: 1fr;
              gap: 2rem;
            }
            
            .navigation {
              position: static;
              order: 2;
            }
            
            .content-area {
              order: 1;
            }
            
            .page-title {
              font-size: 2rem;
            }
            
            .contact-info, .hours-grid, .offices-grid, .delivery-methods {
              grid-template-columns: 1fr;
            }
          }
        `
      }} />
      
      <div className="payment-requirements">
        <div className="container">
          <div className="page-header">
            <h1 className="page-title">Legal & Support Information</h1>
            <p className="page-subtitle">
              Comprehensive policies and support information for XploitEye cybersecurity services
            </p>
          </div>
          
          <div className="content-wrapper">
            <nav className="navigation">
              <h3 className="nav-title">Quick Navigation</h3>
              <ul className="nav-list">
                {sections.map((section) => (
                  <li key={section.id} className="nav-item">
                    <button
                      className={`nav-button ${activeSection === section.id ? 'active' : ''}`}
                      onClick={() => setActiveSection(section.id)}
                    >
                      <span>{section.icon}</span>
                      <span>{section.title}</span>
                    </button>
                  </li>
                ))}
              </ul>
            </nav>
            
            <main className="content-area">
              {renderContent()}
            </main>
          </div>
        </div>
      </div>
    </>
  );
};

export default PaymentRequirements;