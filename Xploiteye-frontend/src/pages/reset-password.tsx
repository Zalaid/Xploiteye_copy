import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/router';
import Head from 'next/head';

// Background Animation Styles Component
const ResetPasswordStyles: React.FC = () => (
  <style jsx global>{`
    :root {
      --almost-black: #111317;
      --endor-green: #00f078;
      --endor-bright-green: #3fe1f3;
    }

    .reset-password-container {
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
    .reset-password-background-animation {
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

    .reset-password-background-animation::before {
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
    .reset-password-logo {
      position: absolute;
      top: -22px;
      left: 20px;
      z-index: 1000;
    }

    .reset-password-logo-image {
      height: 120px;
      width: auto;
      opacity: 0.9;
      transition: opacity 0.3s ease;
      cursor: pointer;
    }

    .reset-password-logo-image:hover {
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
    .reset-password-content {
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
      .reset-password-content {
        margin: 20px auto 0 auto;
      }
      .reset-password-container {
        padding: 20px 20px 20px 20px;
      }
    }

    @media (max-width: 480px) {
      .reset-password-logo {
        top: -24px;
        left: 15px;
      }
      .reset-password-logo-image {
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
  newPassword: string;
  confirmPassword: string;
}

interface FormErrors {
  newPassword?: string;
  confirmPassword?: string;
  general?: string;
}

export default function ResetPassword() {
  const router = useRouter();
  const { token } = router.query;

  const [formData, setFormData] = useState<FormData>({
    newPassword: '',
    confirmPassword: ''
  });

  const [errors, setErrors] = useState<FormErrors>({});
  const [isLoading, setIsLoading] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const [isMounted, setIsMounted] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  // Password validation states
  const [passwordValidation, setPasswordValidation] = useState({
    length: false,
    uppercase: false,
    lowercase: false,
    number: false,
    special: false
  });

  // Track component mount status
  useEffect(() => {
    setIsMounted(true);
    return () => setIsMounted(false);
  }, []);

  // Check if token is present
  useEffect(() => {
    if (router.isReady && !token) {
      router.push('/forgot-password');
    }
  }, [router.isReady, token, router]);

  // Password validation function
  const validatePasswordStrength = (password: string) => {
    const validation = {
      length: password.length >= 8,
      uppercase: /[A-Z]/.test(password),
      lowercase: /[a-z]/.test(password),
      number: /\d/.test(password),
      special: /[!@#$%^&*()_+\-=\[\]{}|;:,.<>?]/.test(password)
    };
    setPasswordValidation(validation);
    return validation;
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));

    // Real-time password validation
    if (name === 'newPassword') {
      validatePasswordStrength(value);
    }

    // Clear error for this field when user starts typing
    if (errors[name as keyof FormErrors]) {
      setErrors(prev => ({ ...prev, [name]: undefined }));
    }
  };

  const validateForm = (): boolean => {
    const newErrors: FormErrors = {};

    // Password validation
    if (!formData.newPassword) {
      newErrors.newPassword = 'New password is required';
    } else {
      const validation = validatePasswordStrength(formData.newPassword);
      const failedRequirements = [];

      if (!validation.length) failedRequirements.push('at least 8 characters');
      if (!validation.uppercase) failedRequirements.push('one uppercase letter');
      if (!validation.lowercase) failedRequirements.push('one lowercase letter');
      if (!validation.number) failedRequirements.push('one number');
      if (!validation.special) failedRequirements.push('one special character');

      if (failedRequirements.length > 0) {
        newErrors.newPassword = `Password must contain ${failedRequirements.join(', ')}`;
      }
    }

    // Confirm password validation
    if (!formData.confirmPassword) {
      newErrors.confirmPassword = 'Please confirm your password';
    } else if (formData.newPassword !== formData.confirmPassword) {
      newErrors.confirmPassword = 'Passwords do not match';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    if (!token) {
      setErrors({ general: 'Invalid reset token. Please request a new password reset.' });
      return;
    }

    setIsLoading(true);
    setErrors({});

    try {
      const response = await fetch('http://localhost:8000/auth/reset-password', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          token: token as string,
          new_password: formData.newPassword
        }),
      });

      const result = await response.json();

      // Check if component is still mounted before updating state
      if (!isMounted) return;

      if (response.ok) {
        setSuccessMessage(result.message || 'Password reset successful!');
        // Redirect to sign in after a delay
        setTimeout(() => {
          if (isMounted) router.push('/signin');
        }, 2000);
      } else {
        setErrors({ general: result.detail || 'Failed to reset password. Please try again.' });
      }
    } catch (error) {
      console.error('Reset password error:', error);
      if (isMounted) setErrors({ general: 'An unexpected error occurred. Please try again.' });
    } finally {
      if (isMounted) setIsLoading(false);
    }
  };

  if (!router.isReady) {
    return <div>Loading...</div>;
  }

  return (
    <>
      <Head>
        <title>Reset Password - XploitEye</title>
        <meta name="description" content="Set your new XploitEye account password" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
      </Head>

      <ResetPasswordStyles />
      <div className="reset-password-container">
        {/* Background Animation */}
        <div className="reset-password-background-animation"></div>

        {/* Logo */}
        <div className="reset-password-logo">
          <img
            src="/images/logo.svg"
            alt="XploitEye Logo"
            className="reset-password-logo-image"
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

        <div className="reset-password-content">
          <div className="bg-gray-900/80 backdrop-blur-xl border border-gray-700 rounded-2xl p-8 shadow-2xl">
            {/* Header */}
            <div className="text-center mb-8">
              <h1 className="text-3xl font-bold mb-2">
                <span className="text-white">Reset</span>
                <span className="bg-gradient-to-r from-green-400 to-cyan-400 bg-clip-text text-transparent"> Password</span>
              </h1>
              <p className="text-gray-400">Enter your new password below</p>
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
                    <p className="font-medium">Updating your password...</p>
                    <p className="text-sm text-blue-200">This may take a few seconds.</p>
                  </div>
                </div>
              </div>
            )}

            {/* Form */}
            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <label htmlFor="newPassword" className="block text-sm font-medium text-gray-300 mb-2">
                  New Password
                </label>
                <div className="relative">
                  <input
                    id="newPassword"
                    name="newPassword"
                    type={showPassword ? "text" : "password"}
                    value={formData.newPassword}
                    onChange={handleInputChange}
                    className={`w-full px-4 py-3 pr-12 bg-gray-800/50 border ${
                      errors.newPassword ? 'border-red-500' : 'border-gray-600'
                    } rounded-lg focus:ring-2 focus:ring-green-400 focus:border-transparent outline-none transition-all duration-200`}
                    placeholder="Enter your new password"
                    disabled={isLoading}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute inset-y-0 right-0 flex items-center justify-center pr-3 text-gray-400 hover:text-white transition-colors z-10 cursor-pointer"
                    aria-label={showPassword ? "Hide password" : "Show password"}
                  >
                    {showPassword ? (
                      <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M3.707 2.293a1 1 0 00-1.414 1.414l14 14a1 1 0 001.414-1.414l-1.473-1.473A10.014 10.014 0 0019.542 10C18.268 5.943 14.478 3 10 3a9.958 9.958 0 00-4.512 1.074l-1.78-1.781zm4.261 4.26l1.514 1.515a2.003 2.003 0 012.45 2.45l1.514 1.514a4 4 0 00-5.478-5.478z" clipRule="evenodd" />
                        <path d="M12.454 16.697L9.75 13.992a4 4 0 01-3.742-3.741L2.335 6.578A9.98 9.98 0 00.458 10c1.274 4.057 5.065 7 9.542 7 .847 0 1.669-.105 2.454-.303z" />
                      </svg>
                    ) : (
                      <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                        <path d="M10 12a2 2 0 100-4 2 2 0 000 4z" />
                        <path fillRule="evenodd" d="M.458 10C1.732 5.943 5.522 3 10 3s8.268 2.943 9.542 7c-1.274 4.057-5.064 7-9.542 7S1.732 14.057.458 10zM14 10a4 4 0 11-8 0 4 4 0 018 0z" clipRule="evenodd" />
                      </svg>
                    )}
                  </button>
                </div>

                {/* Password Strength Indicators */}
                {formData.newPassword && (
                  <div className="mt-3 space-y-2">
                    <p className="text-xs text-gray-400 font-medium">Password Requirements:</p>
                    <div className="grid grid-cols-1 gap-1">
                      <div className={`flex items-center text-xs transition-colors duration-200 ${passwordValidation.length ? 'text-green-400' : 'text-gray-500'}`}>
                        <span className={`mr-2 text-xs ${passwordValidation.length ? 'text-green-400' : 'text-gray-500'}`}>
                          {passwordValidation.length ? '✓' : '○'}
                        </span>
                        At least 8 characters
                      </div>
                      <div className={`flex items-center text-xs transition-colors duration-200 ${passwordValidation.uppercase ? 'text-green-400' : 'text-gray-500'}`}>
                        <span className={`mr-2 text-xs ${passwordValidation.uppercase ? 'text-green-400' : 'text-gray-500'}`}>
                          {passwordValidation.uppercase ? '✓' : '○'}
                        </span>
                        One uppercase letter (A-Z)
                      </div>
                      <div className={`flex items-center text-xs transition-colors duration-200 ${passwordValidation.lowercase ? 'text-green-400' : 'text-gray-500'}`}>
                        <span className={`mr-2 text-xs ${passwordValidation.lowercase ? 'text-green-400' : 'text-gray-500'}`}>
                          {passwordValidation.lowercase ? '✓' : '○'}
                        </span>
                        One lowercase letter (a-z)
                      </div>
                      <div className={`flex items-center text-xs transition-colors duration-200 ${passwordValidation.number ? 'text-green-400' : 'text-gray-500'}`}>
                        <span className={`mr-2 text-xs ${passwordValidation.number ? 'text-green-400' : 'text-gray-500'}`}>
                          {passwordValidation.number ? '✓' : '○'}
                        </span>
                        One number (0-9)
                      </div>
                      <div className={`flex items-center text-xs transition-colors duration-200 ${passwordValidation.special ? 'text-green-400' : 'text-gray-500'}`}>
                        <span className={`mr-2 text-xs ${passwordValidation.special ? 'text-green-400' : 'text-gray-500'}`}>
                          {passwordValidation.special ? '✓' : '○'}
                        </span>
                        One special character (!@#$%^&*...)
                      </div>
                    </div>
                  </div>
                )}

                {errors.newPassword && <p className="mt-2 text-sm text-red-400">{errors.newPassword}</p>}
              </div>

              <div>
                <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-300 mb-2">
                  Confirm New Password
                </label>
                <div className="relative">
                  <input
                    id="confirmPassword"
                    name="confirmPassword"
                    type={showConfirmPassword ? "text" : "password"}
                    value={formData.confirmPassword}
                    onChange={handleInputChange}
                    className={`w-full px-4 py-3 pr-16 bg-gray-800/50 border ${
                      errors.confirmPassword
                        ? 'border-red-500'
                        : formData.confirmPassword && formData.newPassword === formData.confirmPassword
                        ? 'border-green-500'
                        : formData.confirmPassword && formData.newPassword !== formData.confirmPassword
                        ? 'border-red-500'
                        : 'border-gray-600'
                    } rounded-lg focus:ring-2 focus:ring-green-400 focus:border-transparent outline-none transition-all duration-200`}
                    placeholder="Confirm your new password"
                    disabled={isLoading}
                  />
                  {formData.confirmPassword && (
                    <div className="absolute inset-y-0 right-12 flex items-center pr-1">
                      {formData.newPassword === formData.confirmPassword ? (
                        <span className="text-green-400 text-lg">✓</span>
                      ) : (
                        <span className="text-red-400 text-lg">✗</span>
                      )}
                    </div>
                  )}
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute inset-y-0 right-0 flex items-center justify-center pr-3 text-gray-400 hover:text-white transition-colors z-10 cursor-pointer"
                    aria-label={showConfirmPassword ? "Hide confirm password" : "Show confirm password"}
                  >
                    {showConfirmPassword ? (
                      <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M3.707 2.293a1 1 0 00-1.414 1.414l14 14a1 1 0 001.414-1.414l-1.473-1.473A10.014 10.014 0 0019.542 10C18.268 5.943 14.478 3 10 3a9.958 9.958 0 00-4.512 1.074l-1.78-1.781zm4.261 4.26l1.514 1.515a2.003 2.003 0 012.45 2.45l1.514 1.514a4 4 0 00-5.478-5.478z" clipRule="evenodd" />
                        <path d="M12.454 16.697L9.75 13.992a4 4 0 01-3.742-3.741L2.335 6.578A9.98 9.98 0 00.458 10c1.274 4.057 5.065 7 9.542 7 .847 0 1.669-.105 2.454-.303z" />
                      </svg>
                    ) : (
                      <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                        <path d="M10 12a2 2 0 100-4 2 2 0 000 4z" />
                        <path fillRule="evenodd" d="M.458 10C1.732 5.943 5.522 3 10 3s8.268 2.943 9.542 7c-1.274 4.057-5.064 7-9.542 7S1.732 14.057.458 10zM14 10a4 4 0 11-8 0 4 4 0 018 0z" clipRule="evenodd" />
                      </svg>
                    )}
                  </button>
                </div>
                {errors.confirmPassword && <p className="mt-1 text-sm text-red-400">{errors.confirmPassword}</p>}
              </div>

              <button
                type="submit"
                disabled={
                  isLoading ||
                  !formData.newPassword ||
                  !formData.confirmPassword ||
                  formData.newPassword !== formData.confirmPassword ||
                  !Object.values(passwordValidation).every(v => v)
                }
                className={`w-full py-3 px-4 rounded-lg font-semibold transition-all duration-200 ${
                  isLoading ||
                  !formData.newPassword ||
                  !formData.confirmPassword ||
                  formData.newPassword !== formData.confirmPassword ||
                  !Object.values(passwordValidation).every(v => v)
                    ? 'bg-gray-600 cursor-not-allowed'
                    : 'bg-gradient-to-r from-green-500 to-cyan-500 hover:from-green-400 hover:to-cyan-400 hover:transform hover:scale-[1.02] active:scale-[0.98]'
                } text-black focus:ring-2 focus:ring-green-400 focus:ring-offset-2 focus:ring-offset-gray-900`}
              >
                {isLoading ? (
                  <div className="flex items-center justify-center space-x-2">
                    <div className="w-4 h-4 border-2 border-gray-300 border-t-black rounded-full animate-spin"></div>
                    <span>Updating password...</span>
                  </div>
                ) : (
                  'Update Password'
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