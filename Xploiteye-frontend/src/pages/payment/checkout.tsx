import React, { FC, useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { Shield, Lock, CreditCard, AlertTriangle, CheckCircle2, ArrowLeft } from 'lucide-react';

interface CheckoutProps {}

const PaymentCheckout: FC<CheckoutProps> = () => {
  const router = useRouter();
  const { plan, billing } = router.query;

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [checkingAuth, setCheckingAuth] = useState(true);
  const [formData, setFormData] = useState({
    customerName: '',
    customerMobile: ''
  });

  // Check authentication on mount
  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) {
      // Not logged in - redirect to signin with return URL
      const returnUrl = `/payment/checkout?plan=${plan}&billing=${billing}`;
      router.push(`/signin?redirect=${encodeURIComponent(returnUrl)}`);
    } else {
      setIsAuthenticated(true);
      setCheckingAuth(false);
    }
  }, [plan, billing, router]);

  const planPrices: Record<string, {monthly: number, annual: number}> = {
    starter: { monthly: 1000, annual: 8000 },
    professional: { monthly: 1500, annual: 5000 },
    enterprise: { monthly: 0, annual: 0 } // Custom pricing
  };

  const getPlanAmount = () => {
    if (!plan || typeof plan !== 'string') return 0;
    const prices = planPrices[plan];
    if (!prices) return 0;
    return billing === 'annual' ? prices.annual : prices.monthly;
  };

  const amount = getPlanAmount();

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const validateForm = () => {
    if (!formData.customerName || !formData.customerMobile) {
      setError('Please fill in all required fields');
      return false;
    }

    // Mobile validation (Pakistan format)
    const mobileRegex = /^(\+92|0)?3[0-9]{9}$/;
    if (!mobileRegex.test(formData.customerMobile)) {
      setError('Please enter a valid Pakistani mobile number');
      return false;
    }

    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!validateForm()) return;

    setLoading(true);

    try {
      // Call backend API to get access token and initiate payment
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/payfast/initiate`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({
          plan: plan,
          billingCycle: billing,
          amount: amount,
          customerInfo: formData
        })
      });

      const data = await response.json();

      if (response.ok && data.paymentForm) {
        // Create and submit hidden form to PayFast
        const form = document.createElement('form');
        form.method = 'POST';
        form.action = data.paymentForm.action;

        Object.keys(data.paymentForm.fields).forEach(key => {
          const input = document.createElement('input');
          input.type = 'hidden';
          input.name = key;
          input.value = data.paymentForm.fields[key];
          form.appendChild(input);
        });

        document.body.appendChild(form);
        form.submit();
      } else {
        setError(data.error || 'Failed to initiate payment');
        setLoading(false);
      }
    } catch (err) {
      setError('An error occurred. Please try again.');
      setLoading(false);
    }
  };

  const pageStyles = `
    .checkout-page {
      min-height: 100vh;
      background: #000000;
      color: #ffffff;
      padding: 120px 20px 80px;
      position: relative;
    }

    .checkout-bg-gradient {
      position: absolute;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      background: radial-gradient(ellipse at top, rgba(0, 240, 120, 0.08) 0%, transparent 50%);
      pointer-events: none;
    }

    .checkout-container {
      max-width: 900px;
      margin: 0 auto;
      position: relative;
      z-index: 1;
    }

    .back-button {
      display: inline-flex;
      align-items: center;
      gap: 8px;
      color: rgba(255, 255, 255, 0.7);
      text-decoration: none;
      margin-bottom: 32px;
      transition: color 0.3s ease;
      cursor: pointer;
      background: none;
      border: none;
      font-size: 0.95rem;
    }

    .back-button:hover {
      color: #00f078;
    }

    .checkout-header {
      text-align: center;
      margin-bottom: 48px;
    }

    .checkout-title {
      font-size: 2.5rem;
      font-weight: 700;
      color: #ffffff;
      margin-bottom: 12px;
      background: linear-gradient(135deg, #ffffff 0%, #00f078 100%);
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
      background-clip: text;
    }

    .checkout-subtitle {
      font-size: 1rem;
      color: rgba(255, 255, 255, 0.6);
    }

    .checkout-grid {
      display: grid;
      grid-template-columns: 1fr 380px;
      gap: 32px;
    }

    .checkout-form {
      background: linear-gradient(135deg, rgba(0, 26, 10, 0.3) 0%, rgba(0, 0, 0, 0.5) 100%);
      border: 1px solid rgba(255, 255, 255, 0.1);
      border-radius: 24px;
      padding: 40px;
    }

    .form-section {
      margin-bottom: 32px;
    }

    .section-title {
      font-size: 1.2rem;
      font-weight: 600;
      color: #ffffff;
      margin-bottom: 20px;
      display: flex;
      align-items: center;
      gap: 10px;
    }

    .section-icon {
      color: #00f078;
    }

    .form-group {
      margin-bottom: 20px;
    }

    .form-label {
      display: block;
      font-size: 0.9rem;
      color: rgba(255, 255, 255, 0.8);
      margin-bottom: 8px;
      font-weight: 500;
    }

    .required {
      color: #ff4444;
      margin-left: 4px;
    }

    .form-input {
      width: 100%;
      padding: 14px 16px;
      background: rgba(255, 255, 255, 0.05);
      border: 1px solid rgba(255, 255, 255, 0.1);
      border-radius: 12px;
      color: #ffffff;
      font-size: 0.95rem;
      transition: all 0.3s ease;
    }

    .form-input:focus {
      outline: none;
      border-color: #00f078;
      background: rgba(255, 255, 255, 0.08);
      box-shadow: 0 0 0 3px rgba(0, 240, 120, 0.1);
    }

    .form-input::placeholder {
      color: rgba(255, 255, 255, 0.3);
    }

    .security-notice {
      background: rgba(0, 240, 120, 0.05);
      border: 1px solid rgba(0, 240, 120, 0.2);
      border-radius: 12px;
      padding: 16px;
      display: flex;
      align-items: start;
      gap: 12px;
      margin-top: 24px;
    }

    .security-icon {
      color: #00f078;
      flex-shrink: 0;
      margin-top: 2px;
    }

    .security-text {
      font-size: 0.85rem;
      color: rgba(255, 255, 255, 0.7);
      line-height: 1.5;
    }

    .error-alert {
      background: rgba(255, 68, 68, 0.1);
      border: 1px solid rgba(255, 68, 68, 0.3);
      border-radius: 12px;
      padding: 16px;
      margin-bottom: 24px;
      display: flex;
      align-items: start;
      gap: 12px;
    }

    .error-icon {
      color: #ff4444;
      flex-shrink: 0;
    }

    .error-text {
      font-size: 0.9rem;
      color: rgba(255, 255, 255, 0.9);
    }

    .submit-button {
      width: 100%;
      padding: 18px 24px;
      background: linear-gradient(135deg, #00f078 0%, #00c060 100%);
      color: #000000;
      border: none;
      border-radius: 12px;
      font-size: 1.05rem;
      font-weight: 600;
      cursor: pointer;
      transition: all 0.3s ease;
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 10px;
      margin-top: 32px;
    }

    .submit-button:hover:not(:disabled) {
      background: linear-gradient(135deg, #00ff88 0%, #00d070 100%);
      transform: translateY(-2px);
      box-shadow: 0 8px 24px rgba(0, 240, 120, 0.3);
    }

    .submit-button:disabled {
      opacity: 0.6;
      cursor: not-allowed;
    }

    .order-summary {
      background: linear-gradient(135deg, rgba(0, 26, 10, 0.3) 0%, rgba(0, 0, 0, 0.5) 100%);
      border: 1px solid rgba(255, 255, 255, 0.1);
      border-radius: 24px;
      padding: 32px;
      height: fit-content;
      position: sticky;
      top: 100px;
    }

    .summary-title {
      font-size: 1.3rem;
      font-weight: 600;
      color: #ffffff;
      margin-bottom: 24px;
    }

    .summary-item {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 16px 0;
      border-bottom: 1px solid rgba(255, 255, 255, 0.1);
    }

    .summary-item:last-child {
      border-bottom: none;
    }

    .summary-label {
      font-size: 0.95rem;
      color: rgba(255, 255, 255, 0.7);
    }

    .summary-value {
      font-size: 0.95rem;
      color: #ffffff;
      font-weight: 500;
    }

    .summary-total {
      margin-top: 20px;
      padding-top: 20px;
      border-top: 2px solid rgba(0, 240, 120, 0.3);
    }

    .total-label {
      font-size: 1.1rem;
      color: #ffffff;
      font-weight: 600;
    }

    .total-value {
      font-size: 1.8rem;
      color: #00f078;
      font-weight: 700;
    }

    .plan-badge {
      display: inline-block;
      background: linear-gradient(135deg, #00f078 0%, #00c060 100%);
      color: #000000;
      padding: 6px 14px;
      border-radius: 8px;
      font-size: 0.75rem;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }

    .security-features {
      margin-top: 24px;
      padding-top: 24px;
      border-top: 1px solid rgba(255, 255, 255, 0.1);
    }

    .security-feature {
      display: flex;
      align-items: center;
      gap: 10px;
      margin-bottom: 12px;
      font-size: 0.85rem;
      color: rgba(255, 255, 255, 0.6);
    }

    .feature-check {
      color: #00f078;
      font-size: 1rem;
    }

    @media (max-width: 968px) {
      .checkout-grid {
        grid-template-columns: 1fr;
      }

      .order-summary {
        position: static;
      }
    }

    @media (max-width: 768px) {
      .checkout-page {
        padding: 100px 16px 60px;
      }

      .checkout-title {
        font-size: 2rem;
      }

      .checkout-form {
        padding: 28px 20px;
      }

      .order-summary {
        padding: 24px 20px;
      }
    }
  `;

  // Show loading while checking authentication
  if (checkingAuth) {
    return (
      <>
        <style>{pageStyles}</style>
        <div className="checkout-page">
          <div className="checkout-bg-gradient"></div>
          <div className="checkout-container" style={{ textAlign: 'center', paddingTop: '100px' }}>
            <h2 style={{ color: '#00f078' }}>Checking authentication...</h2>
          </div>
        </div>
      </>
    );
  }

  // Don't render if not authenticated (will redirect)
  if (!isAuthenticated) {
    return null;
  }

  return (
    <>
      <style>{pageStyles}</style>
      <div className="checkout-page">
        <div className="checkout-bg-gradient"></div>

        <div className="checkout-container">
          <button className="back-button" onClick={() => router.push('/pricing')}>
            <ArrowLeft size={18} />
            Back to Pricing
          </button>

          <div className="checkout-header">
            <h1 className="checkout-title">Secure Checkout</h1>
            <p className="checkout-subtitle">
              Complete your subscription with our secure payment gateway
            </p>
          </div>

          <div className="checkout-grid">
            {/* Payment Form */}
            <div className="checkout-form">
              {error && (
                <div className="error-alert">
                  <AlertTriangle className="error-icon" size={20} />
                  <div className="error-text">{error}</div>
                </div>
              )}

              <form onSubmit={handleSubmit}>
                {/* Personal Information */}
                <div className="form-section">
                  <h3 className="section-title">
                    <CreditCard className="section-icon" size={22} />
                    Personal Information
                  </h3>

                  <div className="form-group">
                    <label className="form-label">
                      Full Name<span className="required">*</span>
                    </label>
                    <input
                      type="text"
                      name="customerName"
                      className="form-input"
                      placeholder="Enter your full name"
                      value={formData.customerName}
                      onChange={handleInputChange}
                      required
                    />
                  </div>

                  <div className="form-group">
                    <label className="form-label">
                      Mobile Number<span className="required">*</span>
                    </label>
                    <input
                      type="tel"
                      name="customerMobile"
                      className="form-input"
                      placeholder="03001234567"
                      value={formData.customerMobile}
                      onChange={handleInputChange}
                      required
                    />
                  </div>
                </div>

                <div className="security-notice">
                  <Shield className="security-icon" size={20} />
                  <p className="security-text">
                    Your payment information is encrypted and secure. We use PayFast,
                    a PCI-DSS compliant payment gateway certified by the State Bank of Pakistan.
                  </p>
                </div>

                <button
                  type="submit"
                  className="submit-button"
                  disabled={loading}
                >
                  {loading ? (
                    <>Processing...</>
                  ) : (
                    <>
                      <Lock size={20} />
                      Proceed to Secure Payment
                    </>
                  )}
                </button>
              </form>
            </div>

            {/* Order Summary */}
            <div className="order-summary">
              <h3 className="summary-title">Order Summary</h3>

              <div className="summary-item">
                <span className="summary-label">Plan</span>
                <span className="summary-value">
                  <span className="plan-badge">{plan}</span>
                </span>
              </div>

              <div className="summary-item">
                <span className="summary-label">Billing Cycle</span>
                <span className="summary-value">
                  {billing === 'annual' ? 'Annual' : 'Monthly'}
                </span>
              </div>

              <div className="summary-item">
                <span className="summary-label">Subtotal</span>
                <span className="summary-value">Rs {amount}</span>
              </div>

              <div className="summary-item summary-total">
                <span className="total-label">Total</span>
                <span className="total-value">Rs {amount}</span>
              </div>

              <div className="security-features">
                <div className="security-feature">
                  <CheckCircle2 className="feature-check" size={16} />
                  256-bit SSL Encryption
                </div>
                <div className="security-feature">
                  <CheckCircle2 className="feature-check" size={16} />
                  PCI-DSS Compliant
                </div>
                <div className="security-feature">
                  <CheckCircle2 className="feature-check" size={16} />
                  SBP Certified Gateway
                </div>
                <div className="security-feature">
                  <CheckCircle2 className="feature-check" size={16} />
                  Instant Activation
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default PaymentCheckout;
