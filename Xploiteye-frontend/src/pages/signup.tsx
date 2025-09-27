import React, { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/router';
import Head from 'next/head';
import { useAuth } from '../auth/AuthContext';

// Background Animation Styles Component
const SignupStyles: React.FC = () => (
  <style jsx global>{`
    :root {
      --almost-black: #111317;
      --endor-green: #00f078;
      --endor-bright-green: #3fe1f3;
    }

    .signup-container {
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

    /* Background Animation - Wave Pattern */
    .signup-background-animation {
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

    .signup-background-animation::before {
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

    .signup-background-animation::after {
      content: '';
      position: absolute;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      background: 
        radial-gradient(circle at 25% 25%, rgba(0, 240, 120, 0.08) 0%, transparent 25%),
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

    /* Logo Styles */
    .signup-logo {
      position: absolute;
      top: -22px;
      left: 20px;
      z-index: 1000;
    }

    .signup-logo-image {
      height: 120px;
      width: auto;
      opacity: 0.9;
      transition: opacity 0.3s ease;
      cursor: pointer;
    }

    .signup-logo-image:hover {
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

    .back-button:active {
      transform: translateY(0);
    }

    /* Reduced Motion Accessibility */
    @media (prefers-reduced-motion: reduce) {
      .signup-background-animation, 
      .signup-background-animation::before, 
      .signup-background-animation::after { 
        animation: none; 
      }
      .back-button,
      .signup-logo-image {
        transition: none;
      }
    }

    /* Content positioning */
    .signup-content {
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
      .signup-content {
        margin: 20px auto 0 auto;
      }
      .signup-container {
        padding: 20px 20px 20px 20px;
      }
    }

    @media (max-width: 480px) {
      .signup-logo { 
        top: -24px; 
        left: 15px; 
      }
      .signup-logo-image { 
        height: 105px; 
      }
      .back-button {
        top: 15px;
        right: 15px;
        padding: 10px 16px;
        font-size: 13px;
      }
    }

    @media (max-width: 360px) {
      .signup-logo { 
        top: -27px; 
        left: 10px; 
      }
      .signup-logo-image { 
        height: 90px; 
      }
      .back-button {
        top: 10px;
        right: 10px;
        padding: 8px 12px;
        font-size: 12px;
      }
    }
  `}</style>
);

interface FormData {
  name: string;
  email: string;
  username: string;
  password: string;
  confirmPassword: string;
}

interface VerificationData {
  email: string;
  code: string;
}

interface FormErrors {
  name?: string;
  email?: string;
  username?: string;
  password?: string;
  confirmPassword?: string;
  general?: string;
  [key: string]: string | undefined;
}

export default function SignUp() {
  const router = useRouter();
  const { register, checkUsernameAvailability: authCheckUsername, checkAuthStatus } = useAuth();
  
  const [formData, setFormData] = useState<FormData>({
    name: '',
    email: '',
    username: '',
    password: '',
    confirmPassword: ''
  });
  
  const [errors, setErrors] = useState<FormErrors>({});
  const [isLoading, setIsLoading] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const [isCheckingUsername, setIsCheckingUsername] = useState(false);
  const [usernameAvailable, setUsernameAvailable] = useState<boolean | null>(null);
  const [isMounted, setIsMounted] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  // Email verification states
  const [showVerificationForm, setShowVerificationForm] = useState(false);
  const [verificationData, setVerificationData] = useState<VerificationData>({ email: '', code: '' });
  const [isVerifying, setIsVerifying] = useState(false);
  const [resendLoading, setResendLoading] = useState(false);
  
  // Password validation states
  const [passwordValidation, setPasswordValidation] = useState({
    length: false,
    uppercase: false,
    lowercase: false,
    number: false,
    special: false
  });
  
  // Real-time field validation states
  const [fieldValidation, setFieldValidation] = useState({
    email: { isValid: false, isChecking: false },
    username: { isValid: false, isChecking: false },
    password: { isValid: false, isChecking: false },
    confirmPassword: { isValid: false, isChecking: false }
  });

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
    
    // Update password field validation
    const allValid = Object.values(validation).every(v => v);
    setFieldValidation(prev => ({
      ...prev,
      password: { isValid: allValid, isChecking: false }
    }));
    
    return validation;
  };

  // Email validation function
  const validateEmail = (email: string) => {
    const isValid = email.trim() !== '' && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
    setFieldValidation(prev => ({
      ...prev,
      email: { isValid, isChecking: false }
    }));
    return isValid;
  };

  // Username validation function
  const validateUsernameFormat = (username: string) => {
    if (!username.trim()) {
      setFieldValidation(prev => ({
        ...prev,
        username: { isValid: false, isChecking: false }
      }));
      return false;
    }

    const isValidFormat = (
      username.length >= 3 &&
      username.length <= 50 &&
      /^[a-z0-9_]+$/.test(username) &&
      !username.startsWith('_') &&
      !username.endsWith('_') &&
      !username.includes('__')
    );

    if (isValidFormat) {
      setFieldValidation(prev => ({
        ...prev,
        username: { isValid: false, isChecking: true }
      }));
      // Will be updated by the username availability check
    } else {
      setFieldValidation(prev => ({
        ...prev,
        username: { isValid: false, isChecking: false }
      }));
    }
    
    return isValidFormat;
  };

  // Confirm password validation function
  const validateConfirmPassword = (confirmPassword: string) => {
    const isValid = confirmPassword !== '' && confirmPassword === formData.password;
    setFieldValidation(prev => ({
      ...prev,
      confirmPassword: { isValid, isChecking: false }
    }));
    return isValid;
  };

  // Track component mount status
  useEffect(() => {
    setIsMounted(true);
    return () => setIsMounted(false);
  }, []);

  // Check username availability
  const checkUsernameAvailability = useCallback(async (username: string) => {
    if (username.length < 3) {
      setUsernameAvailable(null);
      return;
    }

    console.log(`Starting username check for: "${username}"`);
    setIsCheckingUsername(true);
    setFieldValidation(prev => ({
      ...prev,
      username: { isValid: false, isChecking: true }
    }));
    
    try {
      const result = await authCheckUsername(username);
      console.log('Username check result:', result);
      
      if (result.success) {
        setUsernameAvailable(result.available);
        setFieldValidation(prev => ({
          ...prev,
          username: { isValid: result.available, isChecking: false }
        }));
        console.log(`Username "${username}" availability:`, result.available);
      } else {
        console.warn('Username check failed:', result.error);
        setUsernameAvailable(null);
        setFieldValidation(prev => ({
          ...prev,
          username: { isValid: false, isChecking: false }
        }));
      }
    } catch (error) {
      console.error('Username check failed:', error);
      setUsernameAvailable(null);
      setFieldValidation(prev => ({
        ...prev,
        username: { isValid: false, isChecking: false }
      }));
    } finally {
      setIsCheckingUsername(false);
    }
  }, [authCheckUsername]);

  // Debounced username check
  useEffect(() => {
    const timer = setTimeout(() => {
      if (formData.username.trim()) {
        // First validate format
        const hasValidFormat = validateUsernameFormat(formData.username.trim());
        if (hasValidFormat) {
          // Only check availability if format is valid
          checkUsernameAvailability(formData.username.trim());
        } else {
          setUsernameAvailable(null);
        }
      } else {
        setUsernameAvailable(null);
        setFieldValidation(prev => ({
          ...prev,
          username: { isValid: false, isChecking: false }
        }));
      }
    }, 500);

    return () => clearTimeout(timer);
  }, [formData.username, checkUsernameAvailability]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    
    // Real-time validation based on field type
    if (name === 'email') {
      validateEmail(value);
    } else if (name === 'username') {
      setUsernameAvailable(null);
      // validateUsernameFormat will be called by the debounced useEffect
    } else if (name === 'password') {
      validatePasswordStrength(value);
      // Also re-validate confirm password if it exists
      if (formData.confirmPassword) {
        validateConfirmPassword(formData.confirmPassword);
      }
    } else if (name === 'confirmPassword') {
      validateConfirmPassword(value);
    }
    
    // Clear error for this field when user starts typing
    if (errors[name as keyof FormErrors]) {
      setErrors(prev => ({ ...prev, [name]: undefined }));
    }
  };

  const validateForm = (): boolean => {
    const newErrors: FormErrors = {};

    // Name validation - make it optional but if provided, must be at least 2 characters
    if (formData.name.trim() && formData.name.trim().length < 2) {
      newErrors.name = 'Full name must be at least 2 characters long';
    }

    // Email validation
    if (!formData.email.trim()) {
      newErrors.email = 'Email is required';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = 'Please enter a valid email address';
    }

    // Username validation - only lowercase allowed
    if (!formData.username.trim()) {
      newErrors.username = 'Username is required';
    } else if (formData.username.length < 3) {
      newErrors.username = 'Username must be at least 3 characters long';
    } else if (formData.username.length > 50) {
      newErrors.username = 'Username must be no more than 50 characters';
    } else if (!/^[a-z0-9_]+$/.test(formData.username)) {
      newErrors.username = 'Username can only contain lowercase letters, numbers, and underscores';
    } else if (formData.username.startsWith('_') || formData.username.endsWith('_')) {
      newErrors.username = 'Username cannot start or end with underscore';
    } else if (formData.username.includes('__')) {
      newErrors.username = 'Username cannot contain consecutive underscores';
    } else if (usernameAvailable === false) {
      newErrors.username = 'Username is already taken. Please choose another one.';
    }

    // Password validation - comprehensive requirements
    if (!formData.password) {
      newErrors.password = 'Password is required';
    } else {
      const validation = validatePasswordStrength(formData.password);
      const failedRequirements = [];
      
      if (!validation.length) failedRequirements.push('at least 8 characters');
      if (!validation.uppercase) failedRequirements.push('one uppercase letter');
      if (!validation.lowercase) failedRequirements.push('one lowercase letter');
      if (!validation.number) failedRequirements.push('one number');
      if (!validation.special) failedRequirements.push('one special character');
      
      if (failedRequirements.length > 0) {
        newErrors.password = `Password must contain ${failedRequirements.join(', ')}`;
      } else if (formData.password.length > 128) {
        newErrors.password = 'Password must be no more than 128 characters';
      }
    }

    // Confirm password validation
    if (!formData.confirmPassword) {
      newErrors.confirmPassword = 'Please confirm your password';
    } else if (formData.password !== formData.confirmPassword) {
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

    setIsLoading(true);
    setErrors({});

    try {
      const result = await register(formData.email, formData.username, formData.password, formData.name);
      
      // Check if component is still mounted before updating state
      if (!isMounted) return;
      
      if (result.success) {
        setSuccessMessage(result.message || 'Verification code sent to your email!');
        // Show verification form instead of redirecting
        setShowVerificationForm(true);
        setVerificationData({ email: formData.email, code: '' });
      } else {
        console.error('Registration failed:', result.error || result.validationErrors);
        
        // Handle validation errors from backend
        if (result.validationErrors && typeof result.validationErrors === 'object') {
          const backendErrors: FormErrors = {};
          Object.keys(result.validationErrors).forEach(field => {
            let errorMessage = result.validationErrors[field];
            // Customize error messages for better UX
            if (field === 'password') {
              if (errorMessage.includes('at least 8') || errorMessage.includes('ensure this value has at least 8')) {
                errorMessage = 'Password must be at least 8 characters long';
              }
            } else if (field === 'name') {
              if (errorMessage.includes('at least 2') || errorMessage.includes('ensure this value has at least 2')) {
                errorMessage = 'Full name must be at least 2 characters long';
              }
            } else if (field === 'username') {
              if (errorMessage.includes('at least 3') || errorMessage.includes('ensure this value has at least 3')) {
                errorMessage = 'Username must be at least 3 characters long';
              }
            } else if (field === 'email') {
              if (errorMessage.includes('valid email') || errorMessage.includes('not a valid email')) {
                errorMessage = 'Please enter a valid email address';
              }
            }
            backendErrors[field] = errorMessage;
          });
          
          if (Object.keys(backendErrors).length > 0) {
            if (isMounted) setErrors(backendErrors);
            
            // Update username availability if username error
            if (backendErrors.username && isMounted) {
              setUsernameAvailable(false);
            }
          } else {
            if (isMounted) setErrors({ general: 'Validation failed. Please check your input.' });
          }
        } else {
          // Check if it's a username-specific error
          if (result.error && typeof result.error === 'string' && result.error.toLowerCase().includes('username')) {
            if (isMounted) {
              setErrors({ username: result.error });
              // Update the username availability status
              setUsernameAvailable(false);
            }
          } else {
            if (isMounted) setErrors({ general: result.error || 'Registration failed. Please try again.' });
          }
        }
      }
    } catch (error) {
      console.error('Registration error:', error);
      if (isMounted) setErrors({ general: 'An unexpected error occurred. Please try again.' });
    } finally {
      if (isMounted) setIsLoading(false);
    }
  };

  const handleVerificationSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!verificationData.code || verificationData.code.length !== 6) {
      setErrors({ general: 'Please enter a valid 6-digit verification code' });
      return;
    }

    setIsVerifying(true);
    setErrors({});

    try {
      console.log('Sending verification request:', verificationData);

      const response = await fetch('http://localhost:8000/auth/verify-email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(verificationData)
      });

      console.log('Verification response status:', response.status);

      const result = await response.json();
      console.log('Verification response data:', result);

      if (!isMounted) return;

      if (response.ok) {
        // Auto-login the user with the returned token
        if (result.access_token && result.user) {
          // Store the token in localStorage
          localStorage.setItem('access_token', result.access_token);

          // Update auth context by calling checkAuthStatus to refresh the auth state
          if (checkAuthStatus) {
            await checkAuthStatus();
          }

          setSuccessMessage('Email verified successfully! Redirecting to dashboard...');
          setTimeout(() => {
            if (isMounted) router.push('/dashboard');
          }, 1500);
        } else {
          // Fallback to sign-in page if no token returned
          setSuccessMessage('Email verified successfully! Redirecting to sign in...');
          setTimeout(() => {
            if (isMounted) router.push('/signin');
          }, 2000);
        }
      } else {
        console.error('Verification failed:', result);
        setErrors({ general: result.detail || 'Verification failed. Please try again.' });
      }
    } catch (error) {
      console.error('Verification error:', error);
      if (isMounted) setErrors({ general: 'An unexpected error occurred. Please try again.' });
    } finally {
      if (isMounted) setIsVerifying(false);
    }
  };

  const handleResendCode = async () => {
    setResendLoading(true);
    setErrors({});

    try {
      const response = await fetch('http://localhost:8000/auth/resend-verification', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: verificationData.email })
      });

      const result = await response.json();

      if (!isMounted) return;

      if (response.ok) {
        setSuccessMessage('New verification code sent to your email!');
      } else {
        setErrors({ general: result.detail || 'Failed to resend code. Please try again.' });
      }
    } catch (error) {
      console.error('Resend error:', error);
      if (isMounted) setErrors({ general: 'An unexpected error occurred. Please try again.' });
    } finally {
      if (isMounted) setResendLoading(false);
    }
  };

  const handleVerificationCodeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { value } = e.target;
    // Only allow numbers and limit to 6 characters
    const numericValue = value.replace(/\D/g, '').slice(0, 6);
    setVerificationData(prev => ({ ...prev, code: numericValue }));

    // Clear errors when user starts typing
    if (errors.general) {
      setErrors({});
    }
  };

  return (
    <>
      <Head>
        <title>Sign Up - XploitEye</title>
        <meta name="description" content="Create your XploitEye account and start securing your digital infrastructure" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
      </Head>

      <SignupStyles />
      <div className="signup-container">
        {/* Background Animation - Same as signin */}
        <div className="signup-background-animation"></div>
        
        {/* Logo */}
        <div className="signup-logo">
          <img 
            src="/images/logo.svg" 
            alt="XploitEye Logo" 
            className="signup-logo-image"
            onClick={() => router.push('/')}
          />
        </div>

        {/* Back/Home Button */}
        <button 
          className="back-button"
          onClick={() => router.push('/')}
          aria-label="Go back to home"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
          </svg>
          Back to Home
        </button>

        <div className="signup-content">
          <div className="bg-gray-900/80 backdrop-blur-xl border border-gray-700 rounded-2xl p-8 shadow-2xl">
            {/* Header */}
            <div className="text-center mb-8">
              <h1 className="text-3xl font-bold mb-2">
                <span className="text-white">Create</span>
                <span className="bg-gradient-to-r from-green-400 to-cyan-400 bg-clip-text text-transparent"> Account</span>
              </h1>
              <p className="text-gray-400">Join us and start your cybersecurity journey</p>
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
                    <p className="font-medium">Creating your account...</p>
                    <p className="text-sm text-blue-200">This may take a few seconds while we send your verification email.</p>
                  </div>
                </div>
              </div>
            )}

            {/* Conditional Form Rendering */}
            {!showVerificationForm ? (
              /* Registration Form */
              <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <label htmlFor="name" className="block text-sm font-medium text-gray-300 mb-2">
                  Full Name
                </label>
                <input
                  id="name"
                  name="name"
                  type="text"
                  value={formData.name}
                  onChange={handleInputChange}
                  className={`w-full px-4 py-3 bg-gray-800/50 border ${
                    errors.name ? 'border-red-500' : 'border-gray-600'
                  } rounded-lg focus:ring-2 focus:ring-green-400 focus:border-transparent outline-none transition-all duration-200`}
                  placeholder="Enter your full name"
                />
                {errors.name && <p className="mt-1 text-sm text-red-400">{errors.name}</p>}
              </div>

              <div>
                <label htmlFor="email" className="block text-sm font-medium text-gray-300 mb-2">
                  Email Address
                </label>
                <div className="relative">
                  <input
                    id="email"
                    name="email"
                    type="email"
                    value={formData.email}
                    onChange={handleInputChange}
                    className={`w-full px-4 py-3 pr-12 bg-gray-800/50 border ${
                      errors.email 
                        ? 'border-red-500' 
                        : formData.email && fieldValidation.email.isValid
                        ? 'border-green-500'
                        : formData.email && !fieldValidation.email.isValid
                        ? 'border-red-500'
                        : 'border-gray-600'
                    } rounded-lg focus:ring-2 focus:ring-green-400 focus:border-transparent outline-none transition-all duration-200`}
                    placeholder="Enter your email"
                  />
                  {formData.email && (
                    <div className="absolute inset-y-0 right-0 flex items-center pr-3">
                      {fieldValidation.email.isValid ? (
                        <span className="text-green-400 text-lg">✓</span>
                      ) : (
                        <span className="text-red-400 text-lg">✗</span>
                      )}
                    </div>
                  )}
                </div>
                {errors.email && <p className="mt-1 text-sm text-red-400">{errors.email}</p>}
              </div>

              <div>
                <label htmlFor="username" className="block text-sm font-medium text-gray-300 mb-2">
                  Username
                </label>
                <div className="relative">
                  <input
                    id="username"
                    name="username"
                    type="text"
                    value={formData.username}
                    onChange={handleInputChange}
                    className={`w-full px-4 py-3 pr-12 bg-gray-800/50 border ${
                      errors.username 
                        ? 'border-red-500' 
                        : fieldValidation.username.isValid 
                        ? 'border-green-500' 
                        : formData.username && !fieldValidation.username.isChecking && !fieldValidation.username.isValid
                        ? 'border-red-500' 
                        : 'border-gray-600'
                    } rounded-lg focus:ring-2 focus:ring-green-400 focus:border-transparent outline-none transition-all duration-200`}
                    placeholder="Choose a username (lowercase, numbers, _ only)"
                  />
                  <div className="absolute inset-y-0 right-0 flex items-center pr-3">
                    {fieldValidation.username.isChecking && (
                      <div className="w-4 h-4 border-2 border-gray-400 border-t-green-400 rounded-full animate-spin"></div>
                    )}
                    {!fieldValidation.username.isChecking && formData.username && (
                      fieldValidation.username.isValid ? (
                        <span className="text-green-400 text-lg">✓</span>
                      ) : (
                        <span className="text-red-400 text-lg">✗</span>
                      )
                    )}
                </div>
                {errors.username && <p className="mt-1 text-sm text-red-400">{errors.username}</p>}
                {!errors.username && fieldValidation.username.isValid && (
                  <p className="mt-1 text-sm text-green-400">✓ Username is available</p>
                )}
                {!errors.username && formData.username && !fieldValidation.username.isChecking && !fieldValidation.username.isValid && (
                  <p className="mt-1 text-sm text-red-400">✗ Username is invalid or already taken</p>
                )}
              </div>

              <div>
                <label htmlFor="password" className="block text-sm font-medium text-gray-300 mb-2">
                  Password
                </label>
                <div className="relative">
                  <input
                    id="password"
                    name="password"
                    type={showPassword ? "text" : "password"}
                    value={formData.password}
                    onChange={handleInputChange}
                    className={`w-full px-4 py-3 pr-12 bg-gray-800/50 border ${
                      errors.password ? 'border-red-500' : 'border-gray-600'
                    } rounded-lg focus:ring-2 focus:ring-green-400 focus:border-transparent outline-none transition-all duration-200`}
                    placeholder="Create a password"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute inset-y-0 right-0 flex items-center justify-center pr-3 text-gray-400 hover:text-white transition-colors z-10 cursor-pointer"
                    aria-label={showPassword ? "Hide password" : "Show password"}
                  >
                    {showPassword ? (
                      // Eye with slash (hide password)
                      <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M3.707 2.293a1 1 0 00-1.414 1.414l14 14a1 1 0 001.414-1.414l-1.473-1.473A10.014 10.014 0 0019.542 10C18.268 5.943 14.478 3 10 3a9.958 9.958 0 00-4.512 1.074l-1.78-1.781zm4.261 4.26l1.514 1.515a2.003 2.003 0 012.45 2.45l1.514 1.514a4 4 0 00-5.478-5.478z" clipRule="evenodd" />
                        <path d="M12.454 16.697L9.75 13.992a4 4 0 01-3.742-3.741L2.335 6.578A9.98 9.98 0 00.458 10c1.274 4.057 5.065 7 9.542 7 .847 0 1.669-.105 2.454-.303z" />
                      </svg>
                    ) : (
                      // Eye (show password)
                      <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                        <path d="M10 12a2 2 0 100-4 2 2 0 000 4z" />
                        <path fillRule="evenodd" d="M.458 10C1.732 5.943 5.522 3 10 3s8.268 2.943 9.542 7c-1.274 4.057-5.064 7-9.542 7S1.732 14.057.458 10zM14 10a4 4 0 11-8 0 4 4 0 018 0z" clipRule="evenodd" />
                      </svg>
                    )}
                  </button>
                </div>
                
                {/* Password Strength Indicators */}
                {formData.password && (
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
                
                {errors.password && <p className="mt-2 text-sm text-red-400">{errors.password}</p>}
                </div>
              </div>

              <div>
                <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-300 mb-2">
                  Confirm Password
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
                        : formData.confirmPassword && fieldValidation.confirmPassword.isValid
                        ? 'border-green-500'
                        : formData.confirmPassword && !fieldValidation.confirmPassword.isValid
                        ? 'border-red-500'
                        : 'border-gray-600'
                    } rounded-lg focus:ring-2 focus:ring-green-400 focus:border-transparent outline-none transition-all duration-200`}
                    placeholder="Confirm your password"
                  />
                  {formData.confirmPassword && (
                    <div className="absolute inset-y-0 right-12 flex items-center pr-1">
                      {fieldValidation.confirmPassword.isValid ? (
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
                      // Eye with slash (hide password)
                      <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M3.707 2.293a1 1 0 00-1.414 1.414l14 14a1 1 0 001.414-1.414l-1.473-1.473A10.014 10.014 0 0019.542 10C18.268 5.943 14.478 3 10 3a9.958 9.958 0 00-4.512 1.074l-1.78-1.781zm4.261 4.26l1.514 1.515a2.003 2.003 0 012.45 2.45l1.514 1.514a4 4 0 00-5.478-5.478z" clipRule="evenodd" />
                        <path d="M12.454 16.697L9.75 13.992a4 4 0 01-3.742-3.741L2.335 6.578A9.98 9.98 0 00.458 10c1.274 4.057 5.065 7 9.542 7 .847 0 1.669-.105 2.454-.303z" />
                      </svg>
                    ) : (
                      // Eye (show password)
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
                  isCheckingUsername || 
                  usernameAvailable === false ||
                  !fieldValidation.email.isValid ||
                  !fieldValidation.username.isValid ||
                  !fieldValidation.password.isValid ||
                  !fieldValidation.confirmPassword.isValid ||
                  fieldValidation.username.isChecking
                }
                className={`w-full py-3 px-4 rounded-lg font-semibold transition-all duration-200 ${
                  isLoading || 
                  isCheckingUsername || 
                  usernameAvailable === false ||
                  !fieldValidation.email.isValid ||
                  !fieldValidation.username.isValid ||
                  !fieldValidation.password.isValid ||
                  !fieldValidation.confirmPassword.isValid ||
                  fieldValidation.username.isChecking
                    ? 'bg-gray-600 cursor-not-allowed'
                    : 'bg-gradient-to-r from-green-500 to-cyan-500 hover:from-green-400 hover:to-cyan-400 hover:transform hover:scale-[1.02] active:scale-[0.98]'
                } text-black focus:ring-2 focus:ring-green-400 focus:ring-offset-2 focus:ring-offset-gray-900`}
              >
                {isLoading
                  ? (
                    <div className="flex items-center justify-center space-x-2">
                      <div className="w-4 h-4 border-2 border-gray-300 border-t-black rounded-full animate-spin"></div>
                      <span>Sending verification email...</span>
                    </div>
                  )
                  : isCheckingUsername
                  ? 'Checking Username...'
                  : 'Create Account'
                }
              </button>
            </form>
            ) : (
              /* Email Verification Form */
              <form onSubmit={handleVerificationSubmit} className="space-y-6">
                <div className="text-center mb-6">
                  <h2 className="text-2xl font-bold mb-2">
                    <span className="text-white">Verify Your</span>
                    <span className="bg-gradient-to-r from-green-400 to-cyan-400 bg-clip-text text-transparent"> Email</span>
                  </h2>
                  <p className="text-gray-400 text-sm">
                    We've sent a 6-digit verification code to
                  </p>
                  <p className="text-green-400 font-medium">{verificationData.email}</p>
                </div>

                <div>
                  <label htmlFor="verificationCode" className="block text-sm font-medium text-gray-300 mb-2">
                    Verification Code
                  </label>
                  <input
                    id="verificationCode"
                    name="verificationCode"
                    type="text"
                    inputMode="numeric"
                    pattern="[0-9]*"
                    maxLength={6}
                    value={verificationData.code}
                    onChange={handleVerificationCodeChange}
                    className={`w-full px-4 py-3 bg-gray-800/50 border ${
                      errors.general ? 'border-red-500' : 'border-gray-600'
                    } rounded-lg focus:ring-2 focus:ring-green-400 focus:border-transparent outline-none transition-all duration-200 text-center text-2xl tracking-widest font-mono`}
                    placeholder="000000"
                    autoComplete="one-time-code"
                  />
                  <p className="mt-2 text-xs text-gray-400 text-center">
                    Enter the 6-digit code sent to your email
                  </p>
                </div>

                <div className="space-y-3">
                  <button
                    type="submit"
                    disabled={isVerifying || verificationData.code.length !== 6}
                    className={`w-full py-3 px-4 rounded-lg font-semibold transition-all duration-200 ${
                      isVerifying || verificationData.code.length !== 6
                        ? 'bg-gray-600 cursor-not-allowed'
                        : 'bg-gradient-to-r from-green-500 to-cyan-500 hover:from-green-400 hover:to-cyan-400 hover:transform hover:scale-[1.02] active:scale-[0.98]'
                    } text-black focus:ring-2 focus:ring-green-400 focus:ring-offset-2 focus:ring-offset-gray-900`}
                  >
                    {isVerifying ? 'Verifying...' : 'Verify Email'}
                  </button>

                  <button
                    type="button"
                    onClick={handleResendCode}
                    disabled={resendLoading}
                    className="w-full py-2 px-4 text-sm text-gray-400 hover:text-white transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {resendLoading ? 'Sending...' : 'Resend verification code'}
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setShowVerificationForm(false);
                      setVerificationData({ email: '', code: '' });
                      setErrors({});
                      setSuccessMessage('');
                    }}
                    className="w-full py-2 px-4 text-sm text-gray-500 hover:text-gray-300 transition-colors"
                  >
                    ← Back to registration
                  </button>
                </div>
              </form>
            )}

            {/* Sign In Link - Only show if not in verification mode */}
            {!showVerificationForm && (
              <div className="mt-8 text-center">
                <p className="text-gray-400">
                  Already have an account?{' '}
                  <Link href="/signin" className="text-green-400 hover:text-green-300 font-medium transition-colors">
                    Sign in here
                  </Link>
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
}