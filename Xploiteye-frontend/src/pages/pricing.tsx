import React, { FC } from 'react';

// Define the type for a single pricing plan
interface PricingPlan {
  id: string;
  name: string;
  subtitle: string;
  features: string[];
  buttonText: string;
  isPopular: boolean;
}

const Pricing: FC = () => {
  const pricingPlans: PricingPlan[] = [
    {
      id: 'core',
      name: 'CORE',
      subtitle: 'Reduce noise and prioritize OSS vulnerabilities.',
      features: [
        'SCA with reachability',
        'AI model discovery',
        'OSS package/model curation',
        'Top 10 OSS risk detection'
      ],
      buttonText: 'Get Started',
      isPopular: false
    },
    {
      id: 'pro',
      name: 'PRO',
      subtitle: 'Fix OSS vulnerabilities faster and secure the SDLC.',
      features: [
        'Everything in Core, plus...',
        'Upgrade impact analysis',
        'Container scanning',
        'Binary scanning'
      ],
      buttonText: 'Get Started',
      isPopular: true
    },
    {
      id: 'patches',
      name: 'PATCHES',
      subtitle: 'Patch OSS vulnerabilities without upgrading dependencies.',
      features: [
        'Use with Core, Pro, or Standalone',
        'Immediate resolution of CVEs',
        'Easy integration into workflows',
        'Verifiable SBOM'
      ],
      buttonText: 'Get Started',
      isPopular: false
    }
  ];

  const pageStyles = `
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

    .pricing-page {
      overflow-x: hidden;
      width: 100%;
      max-width: 100vw;
    }

    /* Pricing Page Styles */
    .pricing-page {
      min-height: 100vh;
      background: #000000;
      position: relative;
      overflow: hidden;
      padding-top: 110px;
    }
    
    /* Container */
    .pricing-container {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 2rem;
      max-width: 1200px;
      margin: 0 auto;
      padding: 2rem;
      min-height: 100vh;
      overflow-x: hidden;
      width: 100%;
    }
    
    .pricing-cards-wrapper {
      display: flex;
      justify-content: center;
      align-items: center;
      gap: 1.5rem;
      width: 100%;
      position: relative;
      z-index: 2;
      margin-top: -1rem;
      overflow-x: hidden;
    }
    
    /* Header */
    .pricing-header {
      text-align: center;
      margin-bottom: 2rem;
    }
    
    .pricing-title {
      font-size: 4rem;
      font-weight: 700;
      color: #ffffff;
      margin: 0;
      text-shadow: 0 0 30px rgba(0, 240, 120, 0.5);
      animation: titleGlow 3s ease-in-out infinite alternate;
    }
    
    @keyframes titleGlow {
      0% {
        text-shadow: 0 0 30px rgba(0, 240, 120, 0.5);
      }
      100% {
        text-shadow: 0 0 50px rgba(0, 240, 120, 0.8), 0 0 80px rgba(0, 240, 120, 0.3);
      }
    }
    
    /* Pricing Grid */
    .pricing-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(350px, 1fr));
      gap: 1.5rem;
      align-items: stretch;
    }
    
    /* Pricing Cards */
    .pricing-card {
      background: linear-gradient(145deg, rgba(0, 26, 10, 0.8) 0%, rgba(0, 0, 0, 0.9) 100%);
      border: 1px solid rgba(0, 240, 120, 0.3);
      border-radius: 20px;
      padding: 2rem;
      position: relative;
      overflow: hidden;
      backdrop-filter: blur(10px);
      transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
      animation: cardFloat 6s ease-in-out infinite;
      box-sizing: border-box;
    }
    
    /* Specific size for PATCHES card */
    .pricing-card[data-plan="patches"] {
      width: 410px !important;
      height: 502px !important;
    }
    
    /* Style for PATCHES card header div */
    .pricing-card[data-plan="patches"] .card-header {
      background: #ffffff1a !important;
      padding-bottom: 1.65rem !important;
      border-radius: .5rem !important;
      padding: 1.5rem !important;
    }
    
    /* Style for CORE card header div */
    .pricing-card[data-plan="core"] .card-header {
      background: #ffffff1a !important;
      padding-bottom: 1.65rem !important;
      border-radius: .5rem !important;
      padding: 1.5rem !important;
    }
    
    /* Override hover effects for PATCHES card header */
    .pricing-card[data-plan="patches"] .card-header:hover {
      background: #ffffff1a !important;
      border-color: rgba(0, 240, 120, 0.3);
      box-shadow: none !important;
      transform: none !important;
    }
    
    /* Override hover effects for CORE card header */
    .pricing-card[data-plan="core"] .card-header:hover {
      background: #ffffff1a !important;
      border-color: rgba(0, 240, 120, 0.3);
      box-shadow: none !important;
      transform: none !important;
    }
    
    /* Specific size for PRO card */
    .pricing-card[data-plan="pro"] {
      width: 410px !important;
      height: 534px !important;
    }
    
    /* Specific size for CORE card */
    .pricing-card[data-plan="core"] {
      width: 410px !important;
      height: 502px !important;
    }
    
    .pricing-card:nth-child(1) {
      animation-delay: 0s;
    }
    
    .pricing-card:nth-child(2) {
      animation-delay: 2s;
    }
    
    .pricing-card:nth-child(3) {
      animation-delay: 4s;
    }
    
    @keyframes cardFloat {
      0%, 100% {
        transform: translateY(0);
      }
      50% {
        transform: translateY(-10px);
      }
    }
    
    .pricing-card:hover {
      transform: translateY(-15px) scale(1.02);
      border-color: rgba(0, 240, 120, 0.6);
      box-shadow: 0 20px 60px rgba(0, 240, 120, 0.2);
    }
    
    /* Popular Card */
    .pricing-card.popular {
      border: 2px solid rgba(0, 240, 120, 0.6);
      box-shadow: 0 0 40px rgba(0, 240, 120, 0.3);
      transform: scale(1.05);
    }
    
    .pricing-card.popular:hover {
      transform: translateY(-15px) scale(1.07);
    }
    
    /* Card Glow Effect */
    .card-glow {
      position: absolute;
      top: -50%;
      left: -50%;
      width: 200%;
      height: 200%;
      background: radial-gradient(circle, rgba(0, 240, 120, 0.1) 0%, transparent 70%);
      opacity: 0;
      transition: opacity 0.4s ease;
      pointer-events: none;
    }
    
    .pricing-card:hover .card-glow {
      opacity: 1;
    }
    
    /* Card Header */
    .card-header {
      margin-bottom: 2rem;
      text-align: center;
      background: linear-gradient(135deg, #001e0f, #000503);
      border: 1px solid rgba(0, 240, 120, 0.2);
      border-radius: 12px;
      padding: 1.5rem;
      backdrop-filter: blur(10px);
      box-shadow: 0 4px 15px rgba(0, 240, 120, 0.1);
      transition: all 0.3s ease;
    }
    
    .card-header:hover {
      background: linear-gradient(135deg, rgba(0, 240, 120, 0.15) 0%, rgba(0, 240, 120, 0.08) 100%);
      border-color: rgba(0, 240, 120, 0.3);
      box-shadow: 0 6px 20px rgba(0, 240, 120, 0.15);
      transform: translateY(-2px);
    }
    
    .plan-name {
      font-size: 1.4rem;
      font-weight: 700;
      color: #ffffff;
      margin-bottom: 0.3rem;
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 0.5rem;
    }
    
    .brand-name {
      color: rgba(0, 240, 120, 0.8);
      font-size: 1.2rem;
    }
    
    .plan-subtitle {
      color: rgba(255, 255, 255, 0.8);
      font-size: 0.85rem;
      line-height: 1.3;
      margin: 0;
    }
    
    /* Card Body */
    .card-body {
      margin-bottom: 2.5rem;
    }
    
    .features-list {
      list-style: none;
      padding: 0;
      margin: 0;
      font-weight: 400;
    }
    
    .feature-item {
      display: flex;
      align-items: flex-start;
      gap: 0.75rem;
      margin-bottom: 0.6rem;
      padding: 0.5rem 0;
      transition: all 0.3s ease;
      width: 345px;
      height: 30px;
    }
    
    .feature-item:hover {
      background: rgba(0, 240, 120, 0.05);
      border-radius: 8px;
      padding-left: 0.5rem;
    }
    
    .feature-icon {
      color: #00f078;
      font-weight: bold;
      font-size: 1.1rem;
      flex-shrink: 0;
      width: 20px;
      text-align: center;
    }
    
    .feature-text {
      color: var(--white);
      font-family: Switzer, sans-serif;
      font-size: 1.1rem;
      font-weight: 400;
      line-height: 1.3;
    }
    
    /* Card Footer */
    .card-footer {
      text-align: center;
    }
    
    .pricing-btn {
      background: linear-gradient(135deg, #00f078 0%, #00c060 100%);
      color: #000000;
      border: none;
      padding: 0.8rem 1.5rem;
      border-radius: 10px;
      font-size: 0.95rem;
      font-weight: 600;
      cursor: pointer;
      transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
      position: relative;
      overflow: hidden;
      width: 100%;
      max-width: 200px;
    }
    
    .pricing-btn--primary {
      background: linear-gradient(135deg, #00f078 0%, #00c060 100%);
      color: #000000;
    }
    
    .pricing-btn--secondary {
      background: linear-gradient(135deg, #00ff88, #00f078);
      color: #000000;
      box-shadow: 0 0 30px rgba(0, 255, 136, 0.4);
    }
    
    .pricing-btn::before {
      content: '';
      position: absolute;
      top: 0;
      left: -100%;
      width: 100%;
      height: 100%;
      background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.3), transparent);
      transition: left 0.5s ease;
    }
    
    .pricing-btn:hover::before {
      left: 100%;
    }
    
    .pricing-btn:hover {
      transform: translateY(-2px);
      box-shadow: 0 10px 30px rgba(0, 240, 120, 0.4);
      background: linear-gradient(135deg, #00ff88 0%, #00d070 100%);
    }
    
    .pricing-btn:active {
      transform: translateY(0);
    }
    
    /* Responsive Design */
    
    /* Large Desktop */
    .pricing-grid {
      grid-template-columns: repeat(3, 1fr);
      max-width: 1200px;
      margin: 0 auto;
    }
    
    /* Tablet */
    .pricing-container {
      padding: 1.5rem;
    }
    
    .pricing-title {
      font-size: 3.5rem;
    }
    
    .pricing-grid {
      grid-template-columns: repeat(auto-fit, minmax(320px, 1fr));
      gap: 1.5rem;
    }
    
    .pricing-card {
      padding: 2rem;
    }
    
    /* Maintain specific card dimensions */
    .pricing-card[data-plan="patches"] {
      width: 410px !important;
      height: 502px !important;
    }
    
    .pricing-card[data-plan="pro"] {
      width: 410px !important;
      height: 534px !important;
    }
    
    .pricing-card[data-plan="core"] {
      width: 410px !important;
      height: 502px !important;
    }
    
    .bg-glow-1 {
      width: 600px;
      height: 400px;
    }
    
    .bg-glow-2, .bg-glow-3 {
      width: 400px;
      height: 300px;
    }
    
    /* Mobile Landscape */
    @media (max-width: 768px) {
      .pricing-page {
        padding-top: 160px;
      }
      
      .pricing-container {
        padding: 1rem;
        max-width: 100%;
      }
      
      .pricing-header {
        margin-bottom: 2rem;
      }
      
      .pricing-title {
        font-size: 2.5rem;
      }
      
      .pricing-grid {
        grid-template-columns: 1fr;
        gap: 1.5rem;
        max-width: 100%;
      }
      
      .pricing-cards-wrapper {
        flex-direction: column;
        gap: 1.5rem;
        margin-top: 0;
      }
      
      .pricing-card {
        padding: 1.5rem;
        margin: 0 auto;
        max-width: 90vw;
        width: 100% !important;
        height: auto !important;
        min-height: 400px;
      }
      
      /* Remove fixed dimensions for mobile */
      .pricing-card[data-plan="patches"],
      .pricing-card[data-plan="pro"],
      .pricing-card[data-plan="core"] {
        width: 100% !important;
        height: auto !important;
        max-width: 350px;
      }
      
      .pricing-card.popular {
        transform: scale(1);
      }
      
      .pricing-card.popular:hover {
        transform: translateY(-5px) scale(1.01);
      }
      
      .plan-name {
        font-size: 1.6rem;
        flex-direction: column;
        gap: 0.25rem;
      }
      
      .brand-name {
        font-size: 1rem;
      }
    
    }
    
    /* Mobile Portrait */
    @media (max-width: 480px) {
      .pricing-page {
        padding-top: 150px;
        background-position: center -50px;
      }
      
      .pricing-container {
        padding: 0.75rem;
      }
      
      .pricing-title {
        font-size: 2rem;
      }
      
      .pricing-card {
        padding: 1.25rem;
        max-width: 95vw;
      }
      
      /* Responsive card dimensions for small screens */
      .pricing-card[data-plan="patches"],
      .pricing-card[data-plan="pro"],
      .pricing-card[data-plan="core"] {
        width: 100% !important;
        height: auto !important;
        max-width: 320px;
      }
      
      .plan-name {
        font-size: 1.4rem;
      }
      
      .feature-text {
        font-size: 1rem;
      }
      
      .pricing-btn {
        padding: 0.875rem 1.5rem;
        font-size: 0.9rem;
      }
      
      .bg-glow-1 {
        width: 300px;
        height: 200px;
      }
      
      .bg-glow-2, .bg-glow-3 {
        width: 250px;
        height: 150px;
      }
    }
    
    /* Ultra Small Mobile */
    @media (max-width: 360px) {
      .pricing-container {
        padding: 0.5rem;
      }
      
      .pricing-title {
        font-size: 1.8rem;
      }
      
      .pricing-card {
        padding: 1rem;
        max-width: 98vw;
      }
      
      .pricing-card[data-plan="patches"],
      .pricing-card[data-plan="pro"],
      .pricing-card[data-plan="core"] {
        max-width: 300px;
      }
      
      .plan-name {
        font-size: 1.2rem;
      }
      
      .pricing-btn {
        padding: 0.75rem 1.25rem;
        font-size: 0.85rem;
      }
    }
  `;

  return (
    <>
      <style>{pageStyles}</style>
      <div className="pricing-page">
        <div className="pricing-container">
          {/* Page Title */}
          <div className="pricing-header">
            <h1 className="pricing-title">Plans</h1>
          </div>

          {/* Pricing Cards */}
          <div className="pricing-cards-wrapper">
            {pricingPlans.map((plan) => (
              <div
                key={plan.id}
                className={`pricing-card ${plan.isPopular ? 'popular' : ''}`}
                data-plan={plan.id}
              >
                {/* Card Glow Effect */}
                <div className="card-glow"></div>
                
                {/* Card Content */}
                <div className="card-header">
                  <h2 className="plan-name">
                    <span className="brand-name">XPLOITEYE</span> {plan.name}
                  </h2>
                  <p className="plan-subtitle">{plan.subtitle}</p>
                </div>

                <div className="card-body">
                  <ul className="features-list">
                    {plan.features.map((feature, featureIndex) => (
                      <li key={featureIndex} className="feature-item">
                        <span className="feature-icon">✓</span>
                        <span className="feature-text">{feature}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                <div className="card-footer">
                  <button className="pricing-btn pricing-btn--primary">
                    {plan.buttonText}
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </>
  );
};

export default Pricing;