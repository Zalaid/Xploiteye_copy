import React, { FC, useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import { CheckCircle2, Download, ArrowRight, Shield, Home } from 'lucide-react';
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

  const [verifying, setVerifying] = useState(true);
  const [verified, setVerified] = useState(false);
  const [paymentDetails, setPaymentDetails] = useState<any>(null);

  useEffect(() => {
    // Verify payment with backend
    const verifyPayment = async () => {
      if (!transaction_id || !validation_hash) {
        setVerifying(false);
        return;
      }

      try {
        const response = await fetch(
          `${process.env.NEXT_PUBLIC_API_URL}/api/payfast/verify`,
          {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${localStorage.getItem('token')}`
            },
            body: JSON.stringify({
              transaction_id,
              basket_id,
              err_code,
              validation_hash,
              PaymentName,
              transaction_amount,
              transaction_currency
            })
          }
        );

        const data = await response.json();

        if (response.ok && data.verified) {
          setVerified(true);
          setPaymentDetails(data.payment);
        }
      } catch (error) {
        console.error('Verification error:', error);
      } finally {
        setVerifying(false);
      }
    };

    verifyPayment();
  }, [transaction_id, validation_hash]);

  const downloadInvoice = async () => {
    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/payfast/invoice/${transaction_id}`,
        {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`
          }
        }
      );

      if (response.ok) {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `invoice-${basket_id}.pdf`;
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
    .success-page {
      min-height: 100vh;
      background: #000000;
      color: #ffffff;
      padding: 80px 20px;
      position: relative;
      display: flex;
      align-items: center;
      justify-content: center;
    }

    .success-bg-gradient {
      position: absolute;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      background: radial-gradient(ellipse at center, rgba(0, 240, 120, 0.12) 0%, transparent 50%);
      pointer-events: none;
    }

    .success-container {
      max-width: 700px;
      width: 100%;
      position: relative;
      z-index: 1;
    }

    .success-card {
      background: linear-gradient(135deg, rgba(0, 240, 120, 0.08) 0%, rgba(0, 0, 0, 0.6) 100%);
      border: 2px solid rgba(0, 240, 120, 0.3);
      border-radius: 24px;
      padding: 60px 48px;
      text-align: center;
      position: relative;
      overflow: hidden;
    }

    .success-card::before {
      content: '';
      position: absolute;
      top: -2px;
      left: -2px;
      right: -2px;
      bottom: -2px;
      background: linear-gradient(135deg, #00f078 0%, transparent 50%, #00f078 100%);
      opacity: 0.3;
      z-index: -1;
      border-radius: 24px;
      animation: borderGlow 3s ease-in-out infinite;
    }

    @keyframes borderGlow {
      0%, 100% { opacity: 0.3; }
      50% { opacity: 0.6; }
    }

    .success-icon-wrapper {
      width: 100px;
      height: 100px;
      background: linear-gradient(135deg, #00f078 0%, #00c060 100%);
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      margin: 0 auto 32px;
      animation: successPulse 2s ease-in-out infinite;
      box-shadow: 0 0 40px rgba(0, 240, 120, 0.4);
    }

    @keyframes successPulse {
      0%, 100% { transform: scale(1); box-shadow: 0 0 40px rgba(0, 240, 120, 0.4); }
      50% { transform: scale(1.05); box-shadow: 0 0 60px rgba(0, 240, 120, 0.6); }
    }

    .success-icon {
      color: #000000;
    }

    .success-title {
      font-size: 2.5rem;
      font-weight: 700;
      color: #ffffff;
      margin-bottom: 16px;
      background: linear-gradient(135deg, #ffffff 0%, #00f078 100%);
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
      background-clip: text;
    }

    .success-message {
      font-size: 1.1rem;
      color: rgba(255, 255, 255, 0.7);
      line-height: 1.6;
      margin-bottom: 40px;
    }

    .payment-details {
      background: rgba(0, 0, 0, 0.4);
      border: 1px solid rgba(255, 255, 255, 0.1);
      border-radius: 16px;
      padding: 32px;
      margin-bottom: 40px;
      text-align: left;
    }

    .details-title {
      font-size: 1.1rem;
      font-weight: 600;
      color: #00f078;
      margin-bottom: 24px;
      display: flex;
      align-items: center;
      gap: 10px;
    }

    .detail-row {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 14px 0;
      border-bottom: 1px solid rgba(255, 255, 255, 0.05);
    }

    .detail-row:last-child {
      border-bottom: none;
    }

    .detail-label {
      font-size: 0.95rem;
      color: rgba(255, 255, 255, 0.6);
    }

    .detail-value {
      font-size: 0.95rem;
      color: #ffffff;
      font-weight: 500;
    }

    .detail-highlight {
      color: #00f078;
      font-weight: 600;
    }

    .success-actions {
      display: flex;
      gap: 16px;
      justify-content: center;
      flex-wrap: wrap;
    }

    .action-button {
      padding: 16px 32px;
      border-radius: 12px;
      font-size: 1rem;
      font-weight: 600;
      cursor: pointer;
      transition: all 0.3s ease;
      display: inline-flex;
      align-items: center;
      gap: 10px;
      text-decoration: none;
      border: none;
    }

    .primary-button {
      background: linear-gradient(135deg, #00f078 0%, #00c060 100%);
      color: #000000;
    }

    .primary-button:hover {
      background: linear-gradient(135deg, #00ff88 0%, #00d070 100%);
      transform: translateY(-2px);
      box-shadow: 0 8px 24px rgba(0, 240, 120, 0.3);
    }

    .secondary-button {
      background: transparent;
      color: #00f078;
      border: 2px solid #00f078;
    }

    .secondary-button:hover {
      background: rgba(0, 240, 120, 0.1);
      border-color: #00ff88;
      transform: translateY(-2px);
    }

    .loading-state {
      text-align: center;
      padding: 60px 20px;
    }

    .loading-spinner {
      width: 60px;
      height: 60px;
      border: 4px solid rgba(0, 240, 120, 0.2);
      border-top-color: #00f078;
      border-radius: 50%;
      animation: spin 1s linear infinite;
      margin: 0 auto 24px;
    }

    @keyframes spin {
      to { transform: rotate(360deg); }
    }

    .loading-text {
      font-size: 1.1rem;
      color: rgba(255, 255, 255, 0.7);
    }

    .verification-badge {
      display: inline-flex;
      align-items: center;
      gap: 6px;
      background: rgba(0, 240, 120, 0.1);
      border: 1px solid rgba(0, 240, 120, 0.3);
      padding: 8px 16px;
      border-radius: 20px;
      font-size: 0.85rem;
      color: #00f078;
      margin-top: 24px;
    }

    @media (max-width: 768px) {
      .success-card {
        padding: 40px 28px;
      }

      .success-title {
        font-size: 2rem;
      }

      .success-actions {
        flex-direction: column;
      }

      .action-button {
        width: 100%;
        justify-content: center;
      }
    }
  `;

  return (
    <>
      <style>{pageStyles}</style>
      <div className="success-page">
        <div className="success-bg-gradient"></div>

        <div className="success-container">
          {verifying ? (
            <div className="success-card">
              <div className="loading-state">
                <div className="loading-spinner"></div>
                <p className="loading-text">Verifying your payment...</p>
              </div>
            </div>
          ) : (
            <div className="success-card">
              <div className="success-icon-wrapper">
                <CheckCircle2 className="success-icon" size={56} />
              </div>

              <h1 className="success-title">Payment Successful!</h1>
              <p className="success-message">
                Thank you for your subscription. Your account has been activated and you can now
                access all premium features.
              </p>

              {verified && (
                <div className="verification-badge">
                  <Shield size={14} />
                  Payment Verified & Secured
                </div>
              )}

              <div className="payment-details">
                <h3 className="details-title">
                  <Shield size={20} />
                  Payment Details
                </h3>

                <div className="detail-row">
                  <span className="detail-label">Transaction ID</span>
                  <span className="detail-value detail-highlight">
                    {transaction_id || 'N/A'}
                  </span>
                </div>

                <div className="detail-row">
                  <span className="detail-label">Order ID</span>
                  <span className="detail-value">{basket_id || 'N/A'}</span>
                </div>

                <div className="detail-row">
                  <span className="detail-label">Payment Method</span>
                  <span className="detail-value">{PaymentName || 'N/A'}</span>
                </div>

                <div className="detail-row">
                  <span className="detail-label">Amount Paid</span>
                  <span className="detail-value detail-highlight">
                    {transaction_currency} {transaction_amount || '0'}
                  </span>
                </div>

                <div className="detail-row">
                  <span className="detail-label">Date</span>
                  <span className="detail-value">
                    {order_date
                      ? new Date(order_date as string).toLocaleString()
                      : new Date().toLocaleString()
                    }
                  </span>
                </div>

                <div className="detail-row">
                  <span className="detail-label">Status</span>
                  <span className="detail-value detail-highlight">
                    ✓ Completed
                  </span>
                </div>
              </div>

              <div className="success-actions">
                <button
                  className="action-button secondary-button"
                  onClick={downloadInvoice}
                >
                  <Download size={20} />
                  Download Invoice
                </button>

                <Link href="/dashboard" className="action-button primary-button">
                  Go to Dashboard
                  <ArrowRight size={20} />
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
