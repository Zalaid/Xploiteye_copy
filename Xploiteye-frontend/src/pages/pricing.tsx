import React, { FC, useState } from 'react';
import { useRouter } from 'next/router';

interface PricingPlan {
  id: string;
  name: string;
  description: string;
  monthlyPrice: string;
  annualPrice: string;
  features: string[];
  highlighted?: boolean;
  cta: string;
}

const Pricing: FC = () => {
  const router = useRouter();
  const [billingCycle, setBillingCycle] = useState<'monthly' | 'annual'>('monthly');

  const handlePlanSelect = (plan: PricingPlan) => {
    if (plan.id === 'enterprise') {
      // For enterprise, redirect to contact page
      router.push('/contactus');
    } else {
      // For other plans, go to checkout
      router.push(`/payment/checkout?plan=${plan.id}&billing=${billingCycle}`);
    }
  };

  const pricingPlans: PricingPlan[] = [
    {
      id: 'starter',
      name: 'Starter',
      description: 'Perfect for individual developers and small projects',
      monthlyPrice: '1000',
      annualPrice: '8000',
      features: [
        'Up to 5 active scans',
        'Basic vulnerability detection',
        'Email support',
        'Community access',
        'Basic reporting',
        '30-day scan history'
      ],
      cta: 'Start Free Trial'
    },
    {
      id: 'professional',
      name: 'Professional',
      description: 'For growing teams and serious security needs',
      monthlyPrice: '1500',
      annualPrice: '5000',
      highlighted: true,
      features: [
        'Unlimited active scans',
        'Advanced threat detection',
        'Priority support 24/7',
        'API access',
        'Custom integrations',
        'Advanced analytics',
        'Compliance reports',
        '1-year scan history',
        'Team collaboration'
      ],
      cta: 'Start Free Trial'
    },
    {
      id: 'enterprise',
      name: 'Enterprise',
      description: 'Custom solutions for large organizations',
      monthlyPrice: 'Custom',
      annualPrice: 'Custom',
      features: [
        'Everything in Professional',
        'Dedicated account manager',
        'Custom deployment options',
        'SLA guarantees',
        'Advanced security features',
        'Unlimited scan history',
        'White-label options',
        'Custom training'
      ],
      cta: 'Contact Sales'
    }
  ];

  const pageStyles = `
    /* Reset and Base */
    html, body {
      overflow-x: hidden !important;
      max-width: 100vw !important;
      width: 100% !important;
      background-color: #000000 !important;
      margin: 0 !important;
      padding: 0 !important;
    }

    * {
      box-sizing: border-box;
    }

    .pricing-page {
      min-height: 100vh;
      background: #000000;
      color: #ffffff;
      padding: 120px 20px 80px;
      position: relative;
      overflow-x: hidden;
    }

    /* Background Effects */
    .pricing-bg-gradient {
      position: absolute;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      background: radial-gradient(ellipse at top, rgba(0, 240, 120, 0.1) 0%, transparent 50%);
      pointer-events: none;
      z-index: 0;
    }

    /* Container */
    .pricing-container {
      max-width: 1400px;
      margin: 0 auto;
      position: relative;
      z-index: 1;
    }

    /* Header Section */
    .pricing-header {
      text-align: center;
      margin-bottom: 60px;
    }

    .pricing-title {
      font-size: 3.5rem;
      font-weight: 700;
      color: #ffffff;
      margin-bottom: 16px;
      background: linear-gradient(135deg, #ffffff 0%, #00f078 100%);
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
      background-clip: text;
    }

    .pricing-subtitle {
      font-size: 1.2rem;
      color: rgba(255, 255, 255, 0.7);
      max-width: 600px;
      margin: 0 auto 40px;
      line-height: 1.6;
    }

    /* Billing Toggle */
    .billing-toggle {
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 16px;
      margin-bottom: 60px;
    }

    .toggle-label {
      font-size: 1rem;
      color: rgba(255, 255, 255, 0.6);
      transition: color 0.3s ease;
    }

    .toggle-label.active {
      color: #00f078;
      font-weight: 600;
    }

    .toggle-switch {
      position: relative;
      width: 56px;
      height: 28px;
      background: rgba(255, 255, 255, 0.1);
      border-radius: 14px;
      cursor: pointer;
      transition: background 0.3s ease;
      border: 1px solid rgba(255, 255, 255, 0.2);
    }

    .toggle-switch:hover {
      background: rgba(255, 255, 255, 0.15);
    }

    .toggle-slider {
      position: absolute;
      top: 2px;
      left: 2px;
      width: 22px;
      height: 22px;
      background: #00f078;
      border-radius: 50%;
      transition: transform 0.3s ease;
      box-shadow: 0 2px 8px rgba(0, 240, 120, 0.4);
    }

    .toggle-switch.annual .toggle-slider {
      transform: translateX(28px);
    }

    .savings-badge {
      display: inline-block;
      background: linear-gradient(135deg, #00f078 0%, #00c060 100%);
      color: #000000;
      padding: 4px 12px;
      border-radius: 12px;
      font-size: 0.75rem;
      font-weight: 600;
      margin-left: 8px;
    }

    /* Pricing Grid */
    .pricing-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(340px, 1fr));
      gap: 32px;
      margin-bottom: 80px;
    }

    /* Pricing Card */
    .pricing-card {
      background: linear-gradient(135deg, rgba(0, 26, 10, 0.4) 0%, rgba(0, 0, 0, 0.6) 100%);
      border: 1px solid rgba(255, 255, 255, 0.1);
      border-radius: 24px;
      padding: 40px;
      position: relative;
      transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
      display: flex;
      flex-direction: column;
      height: 100%;
    }

    .pricing-card:hover {
      transform: translateY(-8px);
      border-color: rgba(0, 240, 120, 0.3);
      box-shadow: 0 20px 60px rgba(0, 240, 120, 0.15);
    }

    .pricing-card.highlighted {
      background: linear-gradient(135deg, rgba(0, 240, 120, 0.1) 0%, rgba(0, 0, 0, 0.8) 100%);
      border: 2px solid #00f078;
      transform: scale(1.05);
    }

    .pricing-card.highlighted:hover {
      transform: translateY(-8px) scale(1.05);
    }

    .popular-badge {
      position: absolute;
      top: -12px;
      right: 32px;
      background: linear-gradient(135deg, #00f078 0%, #00c060 100%);
      color: #000000;
      padding: 6px 16px;
      border-radius: 20px;
      font-size: 0.75rem;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }

    /* Card Header */
    .card-plan-name {
      font-size: 1.8rem;
      font-weight: 700;
      color: #ffffff;
      margin-bottom: 8px;
    }

    .card-plan-description {
      font-size: 0.95rem;
      color: rgba(255, 255, 255, 0.6);
      margin-bottom: 28px;
      line-height: 1.5;
    }

    /* Pricing */
    .card-pricing {
      margin-bottom: 32px;
    }

    .price-amount {
      display: flex;
      align-items: baseline;
      gap: 8px;
      margin-bottom: 8px;
    }

    .currency {
      font-size: 1.5rem;
      color: #00f078;
      font-weight: 600;
    }

    .price {
      font-size: 3.5rem;
      font-weight: 700;
      color: #ffffff;
      line-height: 1;
    }

    .price-period {
      font-size: 1rem;
      color: rgba(255, 255, 255, 0.5);
    }

    .price-note {
      font-size: 0.85rem;
      color: rgba(255, 255, 255, 0.4);
    }

    /* Features List */
    .features-list {
      list-style: none;
      padding: 0;
      margin: 0 0 32px 0;
      flex-grow: 1;
    }

    .feature-item {
      display: flex;
      align-items: flex-start;
      gap: 12px;
      margin-bottom: 16px;
      color: rgba(255, 255, 255, 0.8);
      font-size: 0.95rem;
      line-height: 1.5;
    }

    .feature-icon {
      color: #00f078;
      font-size: 1.2rem;
      flex-shrink: 0;
      margin-top: 2px;
    }

    /* CTA Button */
    .pricing-cta {
      width: 100%;
      padding: 16px 24px;
      font-size: 1rem;
      font-weight: 600;
      border: none;
      border-radius: 12px;
      cursor: pointer;
      transition: all 0.3s ease;
      position: relative;
      overflow: hidden;
    }

    .pricing-cta.primary {
      background: linear-gradient(135deg, #00f078 0%, #00c060 100%);
      color: #000000;
    }

    .pricing-cta.primary:hover {
      background: linear-gradient(135deg, #00ff88 0%, #00d070 100%);
      transform: translateY(-2px);
      box-shadow: 0 8px 24px rgba(0, 240, 120, 0.3);
    }

    .pricing-cta.secondary {
      background: transparent;
      color: #00f078;
      border: 2px solid #00f078;
    }

    .pricing-cta.secondary:hover {
      background: rgba(0, 240, 120, 0.1);
      border-color: #00ff88;
      transform: translateY(-2px);
    }

    /* FAQ Section */
    .pricing-faq {
      margin-top: 80px;
      max-width: 900px;
      margin-left: auto;
      margin-right: auto;
    }

    .faq-title {
      font-size: 2.5rem;
      font-weight: 700;
      text-align: center;
      margin-bottom: 48px;
      background: linear-gradient(135deg, #ffffff 0%, #00f078 100%);
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
      background-clip: text;
    }

    .faq-item {
      background: rgba(255, 255, 255, 0.03);
      border: 1px solid rgba(255, 255, 255, 0.1);
      border-radius: 16px;
      padding: 24px;
      margin-bottom: 16px;
      transition: all 0.3s ease;
    }

    .faq-item:hover {
      background: rgba(255, 255, 255, 0.05);
      border-color: rgba(0, 240, 120, 0.3);
    }

    .faq-question {
      font-size: 1.1rem;
      font-weight: 600;
      color: #ffffff;
      margin-bottom: 12px;
    }

    .faq-answer {
      font-size: 0.95rem;
      color: rgba(255, 255, 255, 0.7);
      line-height: 1.6;
    }

    /* Responsive */
    @media (max-width: 1200px) {
      .pricing-grid {
        grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
      }

      .pricing-card.highlighted {
        transform: scale(1);
      }

      .pricing-card.highlighted:hover {
        transform: translateY(-8px) scale(1);
      }
    }

    @media (max-width: 768px) {
      .pricing-page {
        padding: 100px 16px 60px;
      }

      .pricing-title {
        font-size: 2.5rem;
      }

      .pricing-subtitle {
        font-size: 1rem;
      }

      .pricing-grid {
        grid-template-columns: 1fr;
        gap: 24px;
      }

      .pricing-card {
        padding: 32px 24px;
      }

      .price {
        font-size: 2.8rem;
      }

      .faq-title {
        font-size: 2rem;
      }
    }

    @media (max-width: 480px) {
      .pricing-title {
        font-size: 2rem;
      }

      .billing-toggle {
        flex-direction: column;
        gap: 12px;
      }

      .card-plan-name {
        font-size: 1.5rem;
      }

      .price {
        font-size: 2.5rem;
      }
    }
  `;

  return (
    <>
      <style>{pageStyles}</style>
      <div className="pricing-page">
        <div className="pricing-bg-gradient"></div>

        <div className="pricing-container">
          {/* Header */}
          <div className="pricing-header">
            <h1 className="pricing-title">Choose Your Plan</h1>
            <p className="pricing-subtitle">
              Scale your security with flexible pricing designed for teams of all sizes
            </p>
          </div>

          {/* Billing Toggle */}
          <div className="billing-toggle">
            <span className={`toggle-label ${billingCycle === 'monthly' ? 'active' : ''}`}>
              Monthly
            </span>
            <div
              className={`toggle-switch ${billingCycle === 'annual' ? 'annual' : ''}`}
              onClick={() => setBillingCycle(billingCycle === 'monthly' ? 'annual' : 'monthly')}
            >
              <div className="toggle-slider"></div>
            </div>
            <span className={`toggle-label ${billingCycle === 'annual' ? 'active' : ''}`}>
              Annual
              <span className="savings-badge">Save 17%</span>
            </span>
          </div>

          {/* Pricing Cards */}
          <div className="pricing-grid">
            {pricingPlans.map((plan) => (
              <div
                key={plan.id}
                className={`pricing-card ${plan.highlighted ? 'highlighted' : ''}`}
              >
                {plan.highlighted && (
                  <div className="popular-badge">Most Popular</div>
                )}

                <h3 className="card-plan-name">{plan.name}</h3>
                <p className="card-plan-description">{plan.description}</p>

                <div className="card-pricing">
                  {plan.monthlyPrice === 'Custom' ? (
                    <div className="price-amount">
                      <span className="price">Custom</span>
                    </div>
                  ) : (
                    <>
                      <div className="price-amount">
                        <span className="currency">Rs</span>
                        <span className="price">
                          {billingCycle === 'monthly' ? plan.monthlyPrice : plan.annualPrice}
                        </span>
                        <span className="price-period">
                          /{billingCycle === 'monthly' ? 'mo' : 'yr'}
                        </span>
                      </div>
                      {billingCycle === 'annual' && (
                        <p className="price-note">
                          Rs{(parseInt(plan.annualPrice) / 12).toFixed(0)}/month billed annually
                        </p>
                      )}
                    </>
                  )}
                </div>

                <ul className="features-list">
                  {plan.features.map((feature, index) => (
                    <li key={index} className="feature-item">
                      <span className="feature-icon">✓</span>
                      <span>{feature}</span>
                    </li>
                  ))}
                </ul>

                <button
                  className={`pricing-cta ${plan.highlighted ? 'primary' : 'secondary'}`}
                  onClick={() => handlePlanSelect(plan)}
                >
                  {plan.cta}
                </button>
              </div>
            ))}
          </div>

          {/* FAQ Section */}
          <div className="pricing-faq">
            <h2 className="faq-title">Frequently Asked Questions</h2>

            <div className="faq-item">
              <h3 className="faq-question">Can I change plans later?</h3>
              <p className="faq-answer">
                Yes, you can upgrade or downgrade your plan at any time. Changes take effect immediately and we'll prorate the costs accordingly.
              </p>
            </div>

            <div className="faq-item">
              <h3 className="faq-question">Do you offer a free trial?</h3>
              <p className="faq-answer">
                Yes! All plans come with a 14-day free trial. No credit card required to start.
              </p>
            </div>

            <div className="faq-item">
              <h3 className="faq-question">What payment methods do you accept?</h3>
              <p className="faq-answer">
                We accept all major credit cards, PayPal, and bank transfers for Enterprise plans.
              </p>
            </div>

            <div className="faq-item">
              <h3 className="faq-question">Is there a setup fee?</h3>
              <p className="faq-answer">
                No, there are no setup fees or hidden charges. You only pay for your chosen plan.
              </p>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default Pricing;
