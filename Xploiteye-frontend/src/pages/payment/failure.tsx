import React, { FC, useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { XCircle, RefreshCw, Home, HelpCircle, AlertTriangle, ArrowLeft } from 'lucide-react';
import Link from 'next/link';

interface PaymentFailureProps {}

const PaymentFailure: FC<PaymentFailureProps> = () => {
  const router = useRouter();
  const { err_code, err_msg, basket_id, transaction_id } = router.query;

  const [contacting, setContacting] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Error code mapping
  const getErrorDetails = (code: string) => {
    const errorMap: Record<string, { title: string; description: string; action: string }> = {
      '002': {
        title: 'Transaction Timeout',
        description: 'The transaction took too long to complete. Please try again.',
        action: 'Retry Payment'
      },
      '97': {
        title: 'Insufficient Balance',
        description: 'Your account does not have sufficient balance to complete this transaction.',
        action: 'Try Another Payment Method'
      },
      '106': {
        title: 'Transaction Limit Exceeded',
        description: 'Your transaction limit has been exceeded. Please contact your bank.',
        action: 'Contact Bank'
      },
      '03': {
        title: 'Inactive Account',
        description: 'The account you are trying to use is inactive.',
        action: 'Use Different Account'
      },
      '104': {
        title: 'Incorrect Details',
        description: 'The payment details entered are incorrect. Please verify and try again.',
        action: 'Retry Payment'
      },
      '55': {
        title: 'Invalid OTP/PIN',
        description: 'The OTP or PIN you entered is invalid.',
        action: 'Retry Payment'
      },
      '54': {
        title: 'Card Expired',
        description: 'The card you are trying to use has expired.',
        action: 'Use Different Card'
      },
      '13': {
        title: 'Invalid Amount',
        description: 'The transaction amount is invalid.',
        action: 'Contact Support'
      },
      '9000': {
        title: 'Transaction Rejected',
        description: 'This transaction has been rejected by our fraud prevention system.',
        action: 'Contact Support'
      }
    };

    return errorMap[code] || {
      title: 'Payment Failed',
      description: err_msg as string || 'An error occurred while processing your payment.',
      action: 'Retry Payment'
    };
  };

  const errorDetails = err_code ? getErrorDetails(err_code as string) : {
    title: 'Payment Failed',
    description: 'An error occurred while processing your payment.',
    action: 'Retry Payment'
  };

  const handleRetry = () => {
    router.push('/pricing');
  };

  const handleContactSupport = () => {
    setContacting(true);
    // Open support modal or redirect to support page
    router.push('/contactus');
  };

  const pageStyles = `
    .failure-page {
      min-height: 100vh;
      background: #000000;
      color: #ffffff;
      padding: 80px 20px;
      position: relative;
      display: flex;
      align-items: center;
      justify-content: center;
    }

    .failure-bg-gradient {
      position: absolute;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      background: radial-gradient(ellipse at center, rgba(255, 68, 68, 0.08) 0%, transparent 50%);
      pointer-events: none;
    }

    .failure-container {
      max-width: 700px;
      width: 100%;
      position: relative;
      z-index: 1;
    }

    .failure-card {
      background: linear-gradient(135deg, rgba(255, 68, 68, 0.05) 0%, rgba(0, 0, 0, 0.6) 100%);
      border: 2px solid rgba(255, 68, 68, 0.3);
      border-radius: 24px;
      padding: 60px 48px;
      text-align: center;
      position: relative;
      overflow: hidden;
    }

    .failure-icon-wrapper {
      width: 100px;
      height: 100px;
      background: linear-gradient(135deg, #ff4444 0%, #cc0000 100%);
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      margin: 0 auto 32px;
      animation: failurePulse 2s ease-in-out infinite;
      box-shadow: 0 0 40px rgba(255, 68, 68, 0.3);
    }

    @keyframes failurePulse {
      0%, 100% { transform: scale(1); box-shadow: 0 0 40px rgba(255, 68, 68, 0.3); }
      50% { transform: scale(1.05); box-shadow: 0 0 60px rgba(255, 68, 68, 0.5); }
    }

    .failure-icon {
      color: #ffffff;
    }

    .failure-title {
      font-size: 2.5rem;
      font-weight: 700;
      color: #ffffff;
      margin-bottom: 16px;
    }

    .failure-message {
      font-size: 1.1rem;
      color: rgba(255, 255, 255, 0.7);
      line-height: 1.6;
      margin-bottom: 40px;
      max-width: 500px;
      margin-left: auto;
      margin-right: auto;
    }

    .error-details {
      background: rgba(0, 0, 0, 0.4);
      border: 1px solid rgba(255, 255, 255, 0.1);
      border-radius: 16px;
      padding: 32px;
      margin-bottom: 40px;
      text-align: left;
    }

    .error-details-title {
      font-size: 1.1rem;
      font-weight: 600;
      color: #ff4444;
      margin-bottom: 20px;
      display: flex;
      align-items: center;
      gap: 10px;
    }

    .error-item {
      padding: 14px 0;
      border-bottom: 1px solid rgba(255, 255, 255, 0.05);
    }

    .error-item:last-child {
      border-bottom: none;
    }

    .error-label {
      font-size: 0.9rem;
      color: rgba(255, 255, 255, 0.5);
      margin-bottom: 6px;
    }

    .error-value {
      font-size: 0.95rem;
      color: rgba(255, 255, 255, 0.9);
      font-weight: 500;
    }

    .help-section {
      background: rgba(0, 240, 120, 0.05);
      border: 1px solid rgba(0, 240, 120, 0.2);
      border-radius: 16px;
      padding: 24px;
      margin-bottom: 40px;
    }

    .help-title {
      font-size: 1rem;
      font-weight: 600;
      color: #00f078;
      margin-bottom: 16px;
      display: flex;
      align-items: center;
      gap: 8px;
    }

    .help-list {
      list-style: none;
      padding: 0;
      margin: 0;
      text-align: left;
    }

    .help-item {
      padding: 10px 0;
      color: rgba(255, 255, 255, 0.7);
      font-size: 0.9rem;
      line-height: 1.5;
      display: flex;
      align-items: start;
      gap: 10px;
    }

    .help-bullet {
      color: #00f078;
      font-weight: bold;
      flex-shrink: 0;
    }

    .failure-actions {
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
      color: rgba(255, 255, 255, 0.8);
      border: 2px solid rgba(255, 255, 255, 0.2);
    }

    .secondary-button:hover {
      background: rgba(255, 255, 255, 0.05);
      border-color: rgba(255, 255, 255, 0.4);
      transform: translateY(-2px);
    }

    .tertiary-button {
      background: transparent;
      color: #00f078;
      border: 2px solid #00f078;
    }

    .tertiary-button:hover {
      background: rgba(0, 240, 120, 0.1);
      border-color: #00ff88;
      transform: translateY(-2px);
    }

    .warning-badge {
      display: inline-flex;
      align-items: center;
      gap: 6px;
      background: rgba(255, 68, 68, 0.1);
      border: 1px solid rgba(255, 68, 68, 0.3);
      padding: 8px 16px;
      border-radius: 20px;
      font-size: 0.85rem;
      color: #ff4444;
      margin-top: 24px;
    }

    @media (max-width: 768px) {
      .failure-card {
        padding: 40px 28px;
      }

      .failure-title {
        font-size: 2rem;
      }

      .failure-actions {
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
      <div className="failure-page">
        <div className="failure-bg-gradient"></div>

        <div className="failure-container">
          <div className="failure-card">
            <div className="failure-icon-wrapper">
              <XCircle className="failure-icon" size={56} />
            </div>

            <h1 className="failure-title">{errorDetails.title}</h1>
            <p className="failure-message">{errorDetails.description}</p>

            {err_code && (
              <div className="warning-badge">
                <AlertTriangle size={14} />
                Error Code: {err_code}
              </div>
            )}

            {(basket_id || transaction_id) && (
              <div className="error-details">
                <h3 className="error-details-title">
                  <AlertTriangle size={20} />
                  Transaction Details
                </h3>

                {basket_id && (
                  <div className="error-item">
                    <div className="error-label">Order ID</div>
                    <div className="error-value">{basket_id}</div>
                  </div>
                )}

                {transaction_id && (
                  <div className="error-item">
                    <div className="error-label">Transaction ID</div>
                    <div className="error-value">{transaction_id}</div>
                  </div>
                )}

                {err_code && (
                  <div className="error-item">
                    <div className="error-label">Error Code</div>
                    <div className="error-value">{err_code}</div>
                  </div>
                )}

                <div className="error-item">
                  <div className="error-label">Date & Time (PKT)</div>
                  <div className="error-value">
                    {mounted
                      ? new Date().toLocaleString('en-PK', {
                          timeZone: 'Asia/Karachi',
                          year: 'numeric',
                          month: '2-digit',
                          day: '2-digit',
                          hour: '2-digit',
                          minute: '2-digit',
                          second: '2-digit',
                          hour12: true
                        })
                      : '--'
                    }
                  </div>
                </div>
              </div>
            )}

            <div className="help-section">
              <h3 className="help-title">
                <HelpCircle size={18} />
                What can you do?
              </h3>
              <ul className="help-list">
                <li className="help-item">
                  <span className="help-bullet">•</span>
                  <span>Verify your payment details and try again</span>
                </li>
                <li className="help-item">
                  <span className="help-bullet">•</span>
                  <span>Check your account balance or transaction limits</span>
                </li>
                <li className="help-item">
                  <span className="help-bullet">•</span>
                  <span>Try using a different payment method</span>
                </li>
                <li className="help-item">
                  <span className="help-bullet">•</span>
                  <span>Contact our support team if the issue persists</span>
                </li>
              </ul>
            </div>

            <div className="failure-actions">
              <button
                className="action-button primary-button"
                onClick={handleRetry}
              >
                <RefreshCw size={20} />
                {errorDetails.action}
              </button>

              <button
                className="action-button tertiary-button"
                onClick={handleContactSupport}
                disabled={contacting}
              >
                <HelpCircle size={20} />
                {contacting ? 'Opening...' : 'Contact Support'}
              </button>

              <Link href="/" className="action-button secondary-button">
                <Home size={20} />
                Go to Home
              </Link>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default PaymentFailure;
