import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/router';
import Head from 'next/head';

// Background Animation Styles Component
const ForgotPasswordStyles: React.FC = () => (
  <style jsx global>{`
    :root {
      --almost-black: #111317;
      --endor-green: #00f078;
      --endor-bright-green: #3fe1f3;
    }

    .forgot-password-container {
      min-height: 100vh;
      background-color: var(--almost-black);
      display: flex;
      align-items: flex-start;
      justify-content: center;
      position: relative;
      overflow: hidden;
      padding: 40px 20px 20px 20px;
      box-sizing: border-box;
    }

    /* Background Animation - Same as signin/signup */
    .forgot-password-background-animation {
      position: absolute;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      background: radial-gradient(
        ellipse 100% 100% at 50% 50%,
        var(--almost-black) 0%,
        rgba(63, 225, 243, 0.02) 30%,
        rgba(159, 105, 247, 0.02) 70%,
        var(--almost-black) 100%
      );
      animation: pulseGlow 6s ease-in-out infinite;
      z-index: 1;
    }

    .forgot-password-background-animation::before {
      content: '';
      position: absolute;
      top: 0;
      left: 0;
      width: 200%;
      height: 200%;
      background: conic-gradient(
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

    /* Logo Styles */
    .forgot-password-logo {
      position: absolute;
      top: -22px;
      left: 20px;
      z-index: 1000;
    }

    .forgot-password-logo-image {
      height: 120px;
      width: auto;
      opacity: 0.9;
      transition: opacity 0.3s ease;
      cursor: pointer;
    }

    .forgot-password-logo-image:hover {
      opacity: 1;
    }

    /* Navigation Back Button */
    .back-button {
      position: absolute;
      top: 20px;
      right: 20px;
      z-index: 1000;
      background: rgba(255, 255, 255, 0.1);
      border: 1px solid rgba(255, 255, 255, 0.2);
      color: #ffffff;
      padding: 12px 20px;
      border-radius: 8px;
      font-size: 14px;
      font-weight: 500;
      cursor: pointer;
      transition: all 0.3s ease;
      backdrop-filter: blur(10px);
      display: flex;
      align-items: center;
      gap: 8px;
    }

    .back-button:hover {
      background: rgba(255, 255, 255, 0.15);
      border-color: rgba(0, 240, 120, 0.4);
      transform: translateY(-1px);
    }

    /* Content positioning */
    .forgot-password-content {
      position: relative;
      z-index: 2;
      width: 100%;
      max-width: 28rem;
      margin: 60px auto 0 auto;
      animation: slideInUp 0.8s ease-out forwards;
    }

    @keyframes slideInUp {
      from {
        opacity: 0.7;
        transform: translateY(30px);
      }
      to {
        opacity: 1;
        transform: translateY(0);
      }
    }

    /* Responsive adjustments */
    @media (max-height: 800px) {
      .forgot-password-content {
        margin: 20px auto 0 auto;
      }
      .forgot-password-container {
        padding: 20px 20px 20px 20px;
      }
    }

    @media (max-width: 480px) {
      .forgot-password-logo {
        top: -24px;
        left: 15px;
      }
      .forgot-password-logo-image {
        height: 105px;
      }
      .back-button {
        top: 15px;
        right: 15px;
        padding: 10px 16px;
        font-size: 13px;
      }
    }
  `}</style>
);

interface FormData {
  email: string;
}

interface FormErrors {
  email?: string;
  general?: string;
}

export default function ForgotPassword() {
  const router = useRouter();

  const [formData, setFormData] = useState<FormData>({
    email: ''
  });

  const [errors, setErrors] = useState<FormErrors>({});
  const [isLoading, setIsLoading] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const [isMounted, setIsMounted] = useState(false);

  // Track component mount status
  useEffect(() => {
    setIsMounted(true);
    return () => setIsMounted(false);
  }, []);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));

    // Clear error for this field when user starts typing
    if (errors[name as keyof FormErrors]) {
      setErrors(prev => ({ ...prev, [name]: undefined }));
    }
  };

  const validateForm = (): boolean => {
    const newErrors: FormErrors = {};

    // Email validation
    if (!formData.email.trim()) {
      newErrors.email = 'Email is required';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = 'Please enter a valid email address';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    setIsLoading(true);
    setErrors({});

    try {
      const response = await fetch('http://localhost:8000/auth/forgot-password', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email: formData.email }),
      });

      const result = await response.json();

      // Check if component is still mounted before updating state
      if (!isMounted) return;

      if (response.ok) {
        setSuccessMessage(result.message || 'Password reset email sent successfully!');
        setFormData({ email: '' }); // Clear form
      } else {
        setErrors({ general: result.detail || 'Failed to send reset email. Please try again.' });
      }
    } catch (error) {
      console.error('Forgot password error:', error);
      if (isMounted) setErrors({ general: 'An unexpected error occurred. Please try again.' });
    } finally {
      if (isMounted) setIsLoading(false);
    }
  };

  return (
    <>
      <Head>
        <title>Forgot Password - XploitEye</title>
        <meta name="description" content="Reset your XploitEye account password" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
      </Head>

      <ForgotPasswordStyles />
      <div className="forgot-password-container">
        {/* Background Animation */}
        <div className="forgot-password-background-animation"></div>

        {/* Logo */}
        <div className="forgot-password-logo">
          <img
            src="/images/logo.svg"
            alt="XploitEye Logo"
            className="forgot-password-logo-image"
            onClick={() => router.push('/')}
          />
        </div>

        {/* Back Button */}
        <button
          className="back-button"
          onClick={() => router.push('/signin')}
          aria-label="Back to sign in"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
          </svg>
          Back to Sign In
        </button>

        <div className="forgot-password-content">
          <div className="bg-gray-900/80 backdrop-blur-xl border border-gray-700 rounded-2xl p-8 shadow-2xl">
            {/* Header */}
            <div className="text-center mb-8">
              <h1 className="text-3xl font-bold mb-2">
                <span className="text-white">Forgot</span>
                <span className="bg-gradient-to-r from-green-400 to-cyan-400 bg-clip-text text-transparent"> Password?</span>
              </h1>
              <p className="text-gray-400">Enter your email address and we'll send you a password reset link</p>
            </div>

            {/* Success/Error Messages */}
            {successMessage && (
              <div className="mb-6 p-4 bg-green-500/20 border border-green-500/50 rounded-lg text-green-300">
                {successMessage}
              </div>
            )}
            {errors.general && (
              <div className="mb-6 p-4 bg-red-500/20 border border-red-500/50 rounded-lg text-red-300">
                {errors.general}
              </div>
            )}
            {isLoading && (
              <div className="mb-6 p-4 bg-blue-500/20 border border-blue-500/50 rounded-lg text-blue-300">
                <div className="flex items-center space-x-3">
                  <div className="w-5 h-5 border-2 border-blue-300 border-t-transparent rounded-full animate-spin"></div>
                  <div>
                    <p className="font-medium">Sending reset email...</p>
                    <p className="text-sm text-blue-200">This may take a few seconds.</p>
                  </div>
                </div>
              </div>
            )}

            {/* Form */}
            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <label htmlFor="email" className="block text-sm font-medium text-gray-300 mb-2">
                  Email Address
                </label>
                <input
                  id="email"
                  name="email"
                  type="email"
                  value={formData.email}
                  onChange={handleInputChange}
                  className={`w-full px-4 py-3 bg-gray-800/50 border ${
                    errors.email ? 'border-red-500' : 'border-gray-600'
                  } rounded-lg focus:ring-2 focus:ring-green-400 focus:border-transparent outline-none transition-all duration-200`}
                  placeholder="Enter your email address"
                  disabled={isLoading}
                />
                {errors.email && <p className="mt-1 text-sm text-red-400">{errors.email}</p>}
              </div>

              <button
                type="submit"
                disabled={isLoading || !formData.email.trim()}
                className={`w-full py-3 px-4 rounded-lg font-semibold transition-all duration-200 ${
                  isLoading || !formData.email.trim()
                    ? 'bg-gray-600 cursor-not-allowed'
                    : 'bg-gradient-to-r from-green-500 to-cyan-500 hover:from-green-400 hover:to-cyan-400 hover:transform hover:scale-[1.02] active:scale-[0.98]'
                } text-black focus:ring-2 focus:ring-green-400 focus:ring-offset-2 focus:ring-offset-gray-900`}
              >
                {isLoading ? (
                  <div className="flex items-center justify-center space-x-2">
                    <div className="w-4 h-4 border-2 border-gray-300 border-t-black rounded-full animate-spin"></div>
                    <span>Sending reset email...</span>
                  </div>
                ) : (
                  'Send Reset Email'
                )}
              </button>
            </form>

            {/* Back to Sign In Link */}
            <div className="mt-8 text-center">
              <p className="text-gray-400">
                Remember your password?{' '}
                <Link href="/signin" className="text-green-400 hover:text-green-300 font-medium transition-colors">
                  Sign in here
                </Link>
              </p>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}