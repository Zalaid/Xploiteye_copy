import React, { FC, useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import { CheckCircle2, Download, ArrowRight, Shield, Home, XCircle, AlertTriangle } from 'lucide-react';
import Link from 'next/link';

interface PaymentSuccessProps {}

const PaymentSuccess: FC<PaymentSuccessProps> = () => {
  const router = useRouter();
  const {
    transaction_id,
    basket_id,
    err_code,
    PaymentName,
    transaction_amount,
    transaction_currency,
    validation_hash,
    order_date
  } = router.query;

  const [mounted, setMounted] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isVerified, setIsVerified] = useState<boolean | null>(null); // null = loading, true = success, false = error
  const [paymentDetails, setPaymentDetails] = useState<any>(null);

  // Fix hydration: only run after component mounts on client
  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    // Only verify after component is mounted on client
    if (!mounted) return;

    // Wait for router query params to load
    if (!transaction_id || !validation_hash) {
      console.log('⏳ Waiting for URL parameters to load...');
      return; // Don't mark as failed, just wait
    }

    // Verify payment with backend
    const verifyPayment = async () => {
      // Normalize validation_hash to string (router.query can return string | string[])
      const hashValue = Array.isArray(validation_hash) ? validation_hash[0] : validation_hash;
      console.log('🔍 Verifying payment...', { transaction_id, basket_id, validation_hash: hashValue?.substring(0, 10) + '...' });

      try {
        // Safe localStorage access (only on client)
        const token = typeof window !== 'undefined' ? localStorage.getItem('access_token') || localStorage.getItem('token') : null;

        const response = await fetch(
          `${process.env.NEXT_PUBLIC_API_URL}/api/payfast/verify`,
          {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              ...(token && { 'Authorization': `Bearer ${token}` })
            },
            body: JSON.stringify({
              transaction_id,
              basket_id,
              err_code,
              validation_hash: hashValue
              // Removed: PaymentName, transaction_amount, transaction_currency (not used by backend)
            })
          }
        );

        console.log('📡 Response status:', response.status);
        const data = await response.json();
        console.log('📦 Response data:', data);

        if (response.ok && data.verified) {
          console.log('✅ Payment verified successfully!');
          setIsVerified(true);
          setPaymentDetails(data.payment);
        } else {
          console.log('❌ Payment verification failed:', data.message || 'Unknown error');
          setIsVerified(false);
        }
      } catch (error) {
        console.error('❌ Verification error:', error);
        setIsVerified(false);
      } finally {
        console.log('🏁 Verification complete, hiding loader');
        setIsLoading(false);
      }
    };

    verifyPayment();
  }, [mounted, transaction_id, validation_hash]);

  const downloadInvoice = async () => {
    try {
      // Safe localStorage access (only on client)
      const token = typeof window !== 'undefined' ? localStorage.getItem('access_token') || localStorage.getItem('token') : null;

      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/payfast/invoice/${paymentDetails?.transaction_id || transaction_id}`,
        {
          headers: {
            ...(token && { 'Authorization': `Bearer ${token}` })
          }
        }
      );

      if (response.ok) {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `invoice-${paymentDetails?.basket_id || basket_id}.pdf`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
      }
    } catch (error) {
      console.error('Download error:', error);
    }
  };

  const pageStyles = `
    /* Global Variables */
    :root {
      --almost-black: #111317;
      --endor-green: #00f078;
      --endor-bright-green: #3fe1f3;
      --purple: #9f69f7;
    }

    /* Page Container */
    .payment-page {
      height: 100vh;
      background: var(--almost-black);
      color: #ffffff;
      padding: 0;
      position: relative;
      overflow: hidden;
      display: flex;
      align-items: center;
      justify-content: center;
    }

    /* Matrix Rain Background */
    .matrix-bg {
      position: fixed;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      background:
        radial-gradient(ellipse at center, rgba(0, 240, 120, 0.03) 0%, transparent 70%),
        linear-gradient(
          180deg,
          var(--almost-black) 0%,
          rgba(63, 225, 243, 0.02) 30%,
          rgba(159, 105, 247, 0.02) 70%,
          var(--almost-black) 100%
        );
      animation: pulseGlow 6s ease-in-out infinite;
      z-index: 0;
    }

    .matrix-bg::before {
      content: '';
      position: absolute;
      top: 0;
      left: 0;
      width: 200%;
      height: 200%;
      background-image:
        repeating-conic-gradient(
          from 0deg at 50% 50%,
          transparent 0deg,
          rgba(0, 240, 120, 0.05) 15deg,
          transparent 30deg,
          rgba(63, 225, 243, 0.05) 45deg,
          transparent 60deg
        );
      animation: spiralRotate 25s linear infinite;
      transform-origin: center;
    }

    .matrix-bg::after {
      content: '';
      position: absolute;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      background-image:
        radial-gradient(circle at 15% 25%, rgba(159, 105, 247, 0.08) 0%, transparent 25%),
        radial-gradient(circle at 85% 75%, rgba(0, 240, 120, 0.08) 0%, transparent 25%),
        radial-gradient(circle at 50% 10%, rgba(63, 225, 243, 0.06) 0%, transparent 30%);
      animation: driftingParticles 18s ease-in-out infinite;
    }

    @keyframes pulseGlow {
      0%, 100% {
        opacity: 0.8;
        transform: scale(1);
      }
      50% {
        opacity: 1;
        transform: scale(1.02);
      }
    }

    @keyframes spiralRotate {
      0% {
        transform: rotate(0deg) scale(0.8);
      }
      100% {
        transform: rotate(360deg) scale(0.8);
      }
    }

    @keyframes driftingParticles {
      0%, 100% {
        transform: translate(0, 0) rotate(0deg);
      }
      25% {
        transform: translate(20px, -15px) rotate(90deg);
      }
      50% {
        transform: translate(-10px, -25px) rotate(180deg);
      }
      75% {
        transform: translate(-25px, 10px) rotate(270deg);
      }
    }

    /* Content Container */
    .payment-content {
      position: relative;
      z-index: 1;
      max-width: 900px;
      width: 100%;
      padding: 20px;
      max-height: 95vh;
      display: flex;
      align-items: center;
      justify-content: center;
    }

    /* Card Styles */
    .payment-card {
      background: rgba(255, 255, 255, 0.05);
      backdrop-filter: blur(10px);
      border: 2px solid rgba(0, 240, 120, 0.3);
      border-radius: 24px;
      padding: 30px 40px;
      box-shadow:
        0 8px 32px rgba(0, 0, 0, 0.3),
        0 0 30px rgba(0, 240, 120, 0.3),
        0 0 60px rgba(0, 240, 120, 0.1);
      animation: slideInUp 0.3s ease-out;
      width: 100%;
      max-width: 800px;
    }

    .payment-card.error {
      border-color: rgba(255, 68, 68, 0.3);
      box-shadow:
        0 8px 32px rgba(0, 0, 0, 0.3),
        0 0 30px rgba(255, 68, 68, 0.3),
        0 0 60px rgba(255, 68, 68, 0.1);
    }

    @keyframes slideInUp {
      from {
        opacity: 0.7;
        transform: translateY(15px);
      }
      to {
        opacity: 1;
        transform: translateY(0);
      }
    }

    /* Icon Wrapper */
    .icon-wrapper {
      width: 80px;
      height: 80px;
      background: linear-gradient(135deg, var(--endor-green) 0%, var(--endor-bright-green) 100%);
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      margin: 0 auto 20px;
      animation: iconPulse 2s ease-in-out infinite;
      box-shadow: 0 0 40px rgba(0, 240, 120, 0.4);
    }

    .icon-wrapper svg {
      width: 45px;
      height: 45px;
    }

    .icon-wrapper.error {
      background: linear-gradient(135deg, #ff4444 0%, #cc0000 100%);
      box-shadow: 0 0 40px rgba(255, 68, 68, 0.4);
    }

    @keyframes iconPulse {
      0%, 100% {
        transform: scale(1);
        box-shadow: 0 0 40px rgba(0, 240, 120, 0.4);
      }
      50% {
        transform: scale(1.05);
        box-shadow: 0 0 60px rgba(0, 240, 120, 0.6);
      }
    }

    /* Typography */
    .page-title {
      font-size: 2.25rem;
      font-weight: 700;
      color: #ffffff;
      margin-bottom: 12px;
      text-align: center;
      background: linear-gradient(135deg, #ffffff 0%, var(--endor-green) 100%);
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
      background-clip: text;
    }

    .page-message {
      font-size: 1.05rem;
      color: rgba(255, 255, 255, 0.7);
      line-height: 1.5;
      margin-bottom: 20px;
      text-align: center;
    }

    /* Badge */
    .verification-badge {
      display: inline-flex;
      align-items: center;
      gap: 8px;
      background: rgba(0, 240, 120, 0.1);
      border: 1px solid rgba(0, 240, 120, 0.3);
      padding: 10px 18px;
      border-radius: 20px;
      font-size: 0.95rem;
      color: var(--endor-green);
      margin: 0 auto 20px;
      display: flex;
      width: fit-content;
    }

    .verification-badge svg {
      width: 16px;
      height: 16px;
    }

    .verification-badge.error {
      background: rgba(255, 68, 68, 0.1);
      border-color: rgba(255, 68, 68, 0.3);
      color: #ff4444;
    }

    /* Details Section */
    .payment-details {
      background: rgba(0, 0, 0, 0.4);
      border: 1px solid rgba(255, 255, 255, 0.1);
      border-radius: 16px;
      padding: 20px 24px;
      margin-bottom: 20px;
    }

    .details-title {
      font-size: 1.1rem;
      font-weight: 600;
      color: var(--endor-green);
      margin-bottom: 16px;
      display: flex;
      align-items: center;
      gap: 8px;
    }

    .details-title svg {
      width: 20px;
      height: 20px;
    }

    .details-title.error {
      color: #ff4444;
    }

    .detail-row {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 10px 0;
      border-bottom: 1px solid rgba(255, 255, 255, 0.05);
    }

    .detail-row:last-child {
      border-bottom: none;
    }

    .detail-label {
      font-size: 0.92rem;
      color: rgba(255, 255, 255, 0.6);
    }

    .detail-value {
      font-size: 0.92rem;
      color: #ffffff;
      font-weight: 500;
      text-align: right;
      max-width: 60%;
      word-break: break-word;
    }

    .detail-highlight {
      color: var(--endor-green);
      font-weight: 600;
    }

    /* Help Text */
    .help-text {
      text-align: left;
      color: rgba(255, 255, 255, 0.7);
      font-size: 0.9rem;
      line-height: 1.5;
      margin-bottom: 0;
    }

    .help-text strong {
      color: rgba(255, 255, 255, 0.9);
      display: block;
      margin-bottom: 6px;
      margin-top: 8px;
    }

    .help-text strong:first-child {
      margin-top: 0;
    }

    .help-text ul {
      margin-left: 18px;
      margin-bottom: 0;
    }

    .help-text li {
      margin-bottom: 4px;
    }

    /* Actions */
    .payment-actions {
      display: flex;
      gap: 12px;
      justify-content: center;
      flex-wrap: wrap;
    }

    .action-button {
      padding: 13px 26px;
      border-radius: 10px;
      font-size: 0.95rem;
      font-weight: 600;
      cursor: pointer;
      transition: all 0.3s ease;
      display: inline-flex;
      align-items: center;
      gap: 8px;
      text-decoration: none;
      border: none;
    }

    .action-button svg {
      width: 19px;
      height: 19px;
    }

    .action-button.primary {
      background: linear-gradient(135deg, var(--endor-green) 0%, var(--endor-bright-green) 100%);
      color: #000000;
    }

    .action-button.primary:hover {
      background: linear-gradient(135deg, #00ff88 0%, #00d070 100%);
      transform: translateY(-2px);
      box-shadow: 0 8px 24px rgba(0, 240, 120, 0.3);
    }

    .action-button.secondary {
      background: transparent;
      color: var(--endor-green);
      border: 2px solid var(--endor-green);
    }

    .action-button.secondary:hover {
      background: rgba(0, 240, 120, 0.1);
      border-color: #00ff88;
      transform: translateY(-2px);
    }

    .action-button.danger {
      background: linear-gradient(135deg, #ff4444 0%, #cc0000 100%);
      color: #ffffff;
    }

    .action-button.danger:hover {
      background: linear-gradient(135deg, #ff5555 0%, #dd0000 100%);
      transform: translateY(-2px);
      box-shadow: 0 8px 24px rgba(255, 68, 68, 0.3);
    }

    /* Loading State */
    .loading-state {
      text-align: center;
      padding: 40px 20px;
    }

    .loading-spinner {
      width: 50px;
      height: 50px;
      border: 4px solid rgba(0, 240, 120, 0.2);
      border-top-color: var(--endor-green);
      border-radius: 50%;
      animation: spin 1s linear infinite;
      margin: 0 auto 20px;
    }

    @keyframes spin {
      to { transform: rotate(360deg); }
    }

    .loading-text {
      font-size: 1rem;
      color: rgba(255, 255, 255, 0.7);
    }

    /* Responsive */
    @media (max-width: 768px) {
      .payment-card {
        padding: 24px 20px;
      }

      .page-title {
        font-size: 1.75rem;
      }

      .page-message {
        font-size: 0.9rem;
      }

      .payment-actions {
        flex-direction: column;
      }

      .action-button {
        width: 100%;
        justify-content: center;
      }

      .detail-row {
        flex-direction: column;
        align-items: flex-start;
        gap: 6px;
        padding: 8px 0;
      }

      .detail-value {
        max-width: 100%;
        text-align: left;
      }

      .payment-details {
        padding: 16px 18px;
      }
    }

    /* Reduced Motion */
    @media (prefers-reduced-motion: reduce) {
      .matrix-bg,
      .matrix-bg::before,
      .matrix-bg::after,
      .icon-wrapper,
      .payment-card {
        animation: none;
      }
    }
  `;

  // Prevent hydration mismatch by not rendering until mounted
  if (!mounted) {
    return null;
  }

  return (
    <>
      <style>{pageStyles}</style>
      <div className="payment-page">
        <div className="matrix-bg"></div>

        <div className="payment-content">
          {isLoading ? (
            <div className="payment-card">
              <div className="loading-state">
                <div className="loading-spinner"></div>
                <p className="loading-text">Verifying your payment...</p>
              </div>
            </div>
          ) : isVerified === true ? (
            <div className="payment-card">
              <div className="icon-wrapper">
                <CheckCircle2 />
              </div>

              <h1 className="page-title">Payment Successful!</h1>
              <p className="page-message">
                Thank you for your subscription. Your account has been activated and you can now
                access all premium features.
              </p>

              <div className="verification-badge">
                <Shield />
                Payment Verified & Secured
              </div>

              <div className="payment-details">
                <h3 className="details-title">
                  <Shield />
                  Payment Details
                </h3>

                <div className="detail-row">
                  <span className="detail-label">Transaction ID</span>
                  <span className="detail-value detail-highlight">
                    {paymentDetails?.transaction_id || 'N/A'}
                  </span>
                </div>

                <div className="detail-row">
                  <span className="detail-label">Order ID</span>
                  <span className="detail-value">{paymentDetails?.basket_id || 'N/A'}</span>
                </div>

                <div className="detail-row">
                  <span className="detail-label">Payment Method</span>
                  <span className="detail-value">{paymentDetails?.payment_method || 'N/A'}</span>
                </div>

                <div className="detail-row">
                  <span className="detail-label">Amount Paid</span>
                  <span className="detail-value detail-highlight">
                    {paymentDetails?.currency || 'PKR'} {paymentDetails?.amount || '0'}
                  </span>
                </div>

                <div className="detail-row">
                  <span className="detail-label">Date (PKT)</span>
                  <span className="detail-value">
                    {paymentDetails?.completed_at
                      ? new Date(paymentDetails.completed_at).toLocaleString('en-PK', {
                          timeZone: 'Asia/Karachi',
                          year: 'numeric',
                          month: '2-digit',
                          day: '2-digit',
                          hour: '2-digit',
                          minute: '2-digit',
                          second: '2-digit',
                          hour12: true
                        })
                      : 'N/A'
                    }
                  </span>
                </div>

                <div className="detail-row">
                  <span className="detail-label">Status</span>
                  <span className="detail-value detail-highlight">
                    ✓ {paymentDetails?.status || 'Completed'}
                  </span>
                </div>
              </div>

              <div className="payment-actions">
                <button
                  className="action-button secondary"
                  onClick={downloadInvoice}
                >
                  <Download />
                  Download Invoice
                </button>

                <Link href="/dashboard" className="action-button primary">
                  Go to Dashboard
                  <ArrowRight />
                </Link>
              </div>
            </div>
          ) : (
            <div className="payment-card error">
              <div className="icon-wrapper error">
                <XCircle />
              </div>

              <h1 className="page-title">Payment Verification Failed</h1>
              <p className="page-message">
                We couldn't verify your payment. This could mean the payment URL is invalid or has been tampered with.
              </p>

              <div className="verification-badge error">
                <AlertTriangle />
                Verification Failed
              </div>

              <div className="payment-details">
                <h3 className="details-title error">
                  <AlertTriangle />
                  What Happened?
                </h3>

                <div className="help-text">
                  <strong>Possible reasons:</strong>
                  <ul>
                    <li>Payment URL was manually entered or modified</li>
                    <li>Payment session has expired</li>
                    <li>Invalid transaction reference</li>
                    <li>Security verification hash mismatch</li>
                  </ul>

                  <strong>What to do:</strong>
                  <ul>
                    <li>If you just completed a payment, please wait for our confirmation email</li>
                    <li>Check your email for payment receipt</li>
                    <li>Contact support if you were charged but didn't receive confirmation</li>
                  </ul>
                </div>
              </div>

              <div className="payment-actions">
                <Link href="/pricing" className="action-button secondary">
                  <ArrowRight style={{ transform: 'rotate(180deg)' }} />
                  Back to Pricing
                </Link>

                <Link href="/contactus" className="action-button danger">
                  Contact Support
                  <AlertTriangle />
                </Link>
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  );
};

export default PaymentSuccess;
