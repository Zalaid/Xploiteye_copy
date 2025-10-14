import React, { useState, useEffect, useRef, useLayoutEffect } from 'react';
import Head from 'next/head';
import type { FC, MouseEventHandler, FormEvent, ChangeEvent, ForwardedRef, InputHTMLAttributes } from 'react';
import { useRouter } from 'next/router';

import { useAuth } from '../auth/AuthContext';
import { MfaLoginModal } from '../components/MfaLoginModal';

// ==================================
//          STYLES
// ==================================
// All CSS from the original file is embedded here to make the component self-contained.
const LoginStyles: FC = () => (
  <style jsx global>{`
    :root {
      --almost-black: #111317;
      --white: #ffffff;
      --grey-70: #b3b3b3;
      --endor-green: #00f078;
      --endor-bright-green: #3fe1f3;
      --header-height: 80px; /* Assumed value for layout effect */
    }
    
    /* Login Page Styles */
    .login-container {
      height: 100vh;
      max-height: 100vh;
      background-color: var(--almost-black);
      display: flex;
      align-items: center;
      justify-content: center;
      position: relative;
      overflow: hidden;
      padding: 5px;
      box-sizing: border-box;
    }

    /* Logo Styles */
    .login-logo {
      position: absolute;
      top: -22px;
      left: 20px;
      z-index: 1000;
    }

    .login-logo-image {
      height: 120px;
      width: auto;
      opacity: 0.9;
      transition: opacity 0.3s ease;
      cursor: pointer;
    }

    .login-logo-image:hover {
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

    /* Background Animation - Wave Pattern */
    .login-background-animation {
      position: absolute;
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
      z-index: 1;
    }

    .login-background-animation::before {
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

    .login-background-animation::after {
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

    /* Content Styles */
    .login-content {
      position: relative;
      z-index: 2;
      width: 100%;
      max-width: 420px;
      padding: 0 15px;
      height: 100%;
      display: flex;
      align-items: center;
      justify-content: center;
      overflow: visible;
    }

    .login-form-wrapper {
      background: rgba(255, 255, 255, 0.05);
      backdrop-filter: blur(10px);
      border: 1px solid rgba(255, 255, 255, 0.1);
      border-radius: 16px;
      padding: 15px 16px;
      box-shadow: 
        0 8px 32px rgba(0, 0, 0, 0.3),
        0 0 30px rgba(0, 240, 120, 0.3),
        0 0 60px rgba(0, 240, 120, 0.1);
      animation: slideInUp 0.3s ease-out;
      max-height: 90vh;
      overflow-y: auto;
      overflow-x: hidden;
      width: 100%;
      max-width: 380px;
      display: flex;
      flex-direction: column;
      justify-content: center;
    }
    
    /* Form Styles */
    .login-form {
      display: flex;
      flex-direction: column;
      gap: 8px;
      margin-top: 5px;
    }

    .form-group {
      display: flex;
      flex-direction: column;
      gap: 3px;
      margin-bottom: 6px;
    }

    .form-label {
      color: var(--white);
      font-size: 0.875rem;
      font-weight: 500;
    }

    .form-input {
      width: 100%;
      padding: 8px 10px;
      background: rgba(255, 255, 255, 0.05);
      border: 1px solid rgba(255, 255, 255, 0.1);
      border-radius: 8px;
      color: var(--white);
      font-size: 0.85rem;
      transition: all 0.3s ease;
      backdrop-filter: blur(10px);
      box-sizing: border-box;
    }

    .form-input:focus {
      outline: none;
      border-color: var(--endor-green);
      box-shadow: 0 0 0 2px rgba(0, 240, 120, 0.22);
      background: rgba(255, 255, 255, 0.08);
    }

    .form-input::placeholder { color: var(--grey-70); }
    .form-input.error {
      border-color: #ff4757;
      box-shadow: 0 0 0 2px rgba(255, 71, 87, 0.2);
    }

    .error-message {
      color: #ff4757;
      font-size: 0.75rem;
      margin-top: 4px;
    }

    /* Form Options */
    .form-options {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin: 4px 0;
      gap: 6px;
    }

    .checkbox-label {
      display: flex;
      align-items: center;
      gap: 8px;
      cursor: pointer;
    }
    .checkbox { width: 16px; height: 16px; accent-color: var(--endor-green); }
    .checkbox-text { color: var(--grey-70); font-size: 0.875rem; }
    .forgot-link { color: var(--endor-green); text-decoration: none; font-size: 0.875rem; transition: color 0.3s ease; }
    .forgot-link:hover { color: var(--endor-bright-green); }

    /* Login Button */
    .login-button {
      width: 100%;
      padding: 8px;
      background: linear-gradient(135deg, var(--endor-green) 0%, var(--endor-bright-green) 100%);
      border: none;
      border-radius: 8px;
      color: var(--almost-black);
      font-size: 0.85rem;
      font-weight: 600;
      cursor: pointer;
      transition: all 0.3s ease;
      position: relative;
      overflow: hidden;
      margin-top: 4px;
    }

    .login-button:hover {
      transform: translateY(-2px);
      box-shadow: 0 8px 25px rgba(0, 240, 120, 0.3);
    }
    .login-button:active { transform: translateY(0); }

    /* Divider */
    .divider { display: flex; align-items: center; margin: 8px 0; position: relative; }
    .divider::before, .divider::after { content: ''; flex: 1; height: 1px; background: rgba(255, 255, 255, 0.1); }
    .divider-text {
      padding: 0 20px;
      color: var(--endor-green);
      font-size: 0.9rem;
      font-weight: 500;
      background: rgba(0, 240, 120, 0.1);
      backdrop-filter: blur(10px);
      border-radius: 20px;
      text-transform: uppercase;
      letter-spacing: 1px;
    }

    /* Google Login Button */
    .google-login-button {
      width: 100%;
      padding: 8px 16px;
      background: rgba(255, 255, 255, 0.05);
      border: 1px solid rgba(255, 255, 255, 0.1);
      border-radius: 8px;
      color: var(--white);
      font-size: 0.85rem;
      font-weight: 500;
      cursor: pointer;
      transition: all 0.3s ease;
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 8px;
      backdrop-filter: blur(10px);
    }
    
    .google-login-button:hover {
      background: rgba(255, 255, 255, 0.08);
      border-color: rgba(255, 255, 255, 0.2);
      transform: translateY(-1px);
      box-shadow: 0 4px 15px rgba(0, 0, 0, 0.2);
    }
    .google-login-button:active { transform: translateY(0); }
    .google-icon { flex-shrink: 0; display: inline-block; }

    /* Signup Prompt */
    .signup-prompt {
      text-align: center;
      margin-top: 5px;
      padding: 5px 0;
      border-top: 1px solid rgba(255, 255, 255, 0.1);
    }
    .signup-text { color: rgba(255, 255, 255, 0.7); font-size: 0.85rem; }
    .signup-link { color: var(--endor-green); text-decoration: none; font-weight: 600; font-size: 0.85rem; transition: color 0.3s ease; }
    .signup-link:hover { color: var(--endor-bright-green); text-decoration: underline; }

    /* Mascot Styles */
    .mascot-wrap {
      position: relative;
      width: 100px;
      margin: -3px auto 3px;
      pointer-events: none;
      filter: drop-shadow(0 4px 8px rgba(0,0,0,.25));
      z-index: 2;
      animation: mascotBob 4s ease-in-out infinite;
      transition: transform 0.6s cubic-bezier(0.19,1,0.22,1);
    }
    
    @keyframes mascotBob {
      0%, 100% { transform: translateY(0); }
      50% { transform: translateY(-2px); }
    }

    .mySVG {
      width: 100%;
      height: auto;
      display: block;
    }

    .mySVG .eyeL, .mySVG .eyeR {
      transition: transform 160ms cubic-bezier(.2,.7,.2,1);
      transform-origin: center center;
    }

    .mySVG .armL, .mySVG .armR {
      transition: transform 320ms cubic-bezier(.2,.7,.2,1);
      transform-origin: center center;
      will-change: transform;
    }

    .mySVG .mouthSmallBG, .mySVG .mouthMediumBG, .mySVG .mouthLargeBG {
      transition: opacity 140ms ease;
    }

    .mySVG [clip-path], .mySVG use {
      -webkit-mask-composite: source-over;
      mask-composite: add;
      shape-rendering: geometricPrecision;
    }

    .mySVG .mouthOutline, .mySVG .nose, .mySVG .outerEar, .mySVG .earHair path {
      filter: drop-shadow(0 0 0.15rem rgba(0, 240, 120, 0.25));
    }
    
    /* Responsive Design */
    @media (max-width: 480px) {
      .login-logo { top: -24px; left: 15px; }
      .login-logo-image { height: 105px; }
      .mascot-wrap { width: 120px; margin-top: -6px; }
      .back-button {
        top: 15px;
        right: 15px;
        padding: 10px 16px;
        font-size: 13px;
      }
    }

    @media (max-width: 360px) {
      .login-logo { top: -27px; left: 10px; }
      .login-logo-image { height: 90px; }
      .mascot-wrap { width: 100px; margin: -2px auto 2px; }
      .form-input { padding: 7px 9px; font-size: 0.75rem; }
      .form-label { font-size: 0.7rem; }
      .login-button { padding: 8px; font-size: 0.75rem; }
      .google-login-button { padding: 8px 10px; font-size: 0.7rem; }
      .google-icon { width: 12px; height: 12px; }
      .back-button {
        top: 10px;
        right: 10px;
        padding: 8px 12px;
        font-size: 12px;
      }
    }
    
    /* Reduced Motion Accessibility */
    @media (prefers-reduced-motion: reduce) {
      .mascot-wrap, .login-background-animation, .login-background-animation::before, .login-background-animation::after { animation: none; }
      .mySVG .eyeL, .mySVG .eyeR, .mySVG .armL, .mySVG .armR, .login-logo-image, .login-button, .google-login-button, .form-input, .back-button {
        transition: none;
      }
    }
  `}</style>
);


// ==================================
//      UI COMPONENTS (Typed)
// ==================================
interface ButtonProps {
  children: React.ReactNode;
  onClick?: MouseEventHandler<HTMLButtonElement>;
  type?: 'button' | 'submit' | 'reset';
  className?: string;
}

const Button: FC<ButtonProps> = ({ children, onClick, type = 'button', className = '' }) => (
  <button 
    type={type} 
    onClick={onClick} 
    className={`px-4 py-2 text-white rounded transition-colors ${className}`}
  >
    {children}
  </button>
);

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  className?: string;
}

const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ type = 'text', className = '', ...props }, ref: ForwardedRef<HTMLInputElement>) => (
  <input 
    ref={ref}
    type={type} 
    className={`w-full ${className}`}
    {...props}
  />
));
Input.displayName = 'Input';


// ==================================
//        MAIN LOGIN COMPONENT
// ==================================
const Login: FC = () => {
  const [formData, setFormData] = useState({
    emailOrUsername: '',
    password: ''
  });
  const [errors, setErrors] = useState<{ [key: string]: string }>({});
  const [showMfaModal, setShowMfaModal] = useState(false);
  const [mfaRequired, setMfaRequired] = useState(false);
  const [tempLoginToken, setTempLoginToken] = useState('');
  const { login, checkAuthStatus } = useAuth();
  const router = useRouter();

  const emailRef = useRef<HTMLInputElement>(null);
  const passwordRef = useRef<HTMLInputElement>(null);
  const mascotMountRef = useRef<HTMLDivElement>(null);
  const cardRef = useRef<HTMLDivElement>(null);

  const [mascotScale, setMascotScale] = useState<number>(1);

  const handleChange = (e: ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  const validateForm = (): { [key: string]: string } => {
    const newErrors: { [key: string]: string } = {};
    if (!formData.emailOrUsername) newErrors.emailOrUsername = 'Email or Username is required';
    if (!formData.password) newErrors.password = 'Password is required';
    else if (formData.password.length < 6) newErrors.password = 'Password must be at least 6 characters';
    return newErrors;
  };

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const newErrors = validateForm();
    if (Object.keys(newErrors).length === 0) {
      try {
        const result = await login(formData.emailOrUsername, formData.password);
        if (result.success) {
          // Check if MFA is required
          if (result.mfa_required) {
            setTempLoginToken(result.temp_token);
            setMfaRequired(true);
            setShowMfaModal(true);
          } else {
            // Check for redirect URL
            const redirectUrl = router.query.redirect as string;
            router.push(redirectUrl || '/dashboard');
          }
        } else {
          setErrors({ general: result.error || 'Login failed. Please try again.' });
        }
      } catch (error) {
        setErrors({ general: 'Network error. Please check your connection.' });
      }
    } else {
      setErrors(newErrors);
    }
  };
  
  const handleMfaVerified = async () => {
    try {
      // Refresh auth context to update user state
      await checkAuthStatus();

      // Check for redirect URL
      const redirectUrl = router.query.redirect as string;

      // Force redirect
      window.location.href = redirectUrl || '/dashboard';
    } catch (error) {
      console.error('Auth refresh failed:', error);
      // Fallback - force redirect
      const redirectUrl = router.query.redirect as string;
      window.location.href = redirectUrl || '/dashboard';
    }
  };

  const handleGoogleLogin = () => {
    // Get redirect URL from query params
    const redirectUrl = router.query.redirect as string;

    // Pass redirect URL to backend OAuth endpoint via state parameter
    const backendUrl = 'http://localhost:8000/auth/google/login';
    if (redirectUrl) {
      // Encode redirect URL and pass it as state
      window.location.href = `${backendUrl}?redirect=${encodeURIComponent(redirectUrl)}`;
    } else {
      window.location.href = backendUrl;
    }
  };

  // Handle MFA required from Google OAuth redirect
  useEffect(() => {
    if (router.isReady && router.query.mfa_required === 'true' && router.query.temp_token) {
      setTempLoginToken(router.query.temp_token as string);
      setFormData(prev => ({
        ...prev,
        emailOrUsername: router.query.email as string || ''
      }));
      setMfaRequired(true);
      setShowMfaModal(true);
      
      // Clean up the URL
      router.replace('/signin', undefined, { shallow: true });
    }
  }, [router.isReady, router.query]);
  
  const mascotSvg = `
  <svg class="mySVG" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" viewBox="0 0 200 200">
    <defs>
      <circle id="armMaskPath" cx="100" cy="100" r="100"></circle>
      <circle id="mainClipPath" cx="100" cy="100" r="98"></circle>
    </defs>
    <clipPath id="armMask"><use xlink:href="#armMaskPath" overflow="visible"></use></clipPath>
    <clipPath id="mainClip"><use xlink:href="#mainClipPath" overflow="visible"></use></clipPath>
    <circle cx="100" cy="100" r="100" fill="#a9ddf3"></circle>
    <g clip-path="url(#mainClip)">
    <g class="body">
      <path fill="#FFFFFF" d="M193.3,135.9c-5.8-8.4-15.5-13.9-26.5-13.9H151V72c0-27.6-22.4-50-50-50S51,44.4,51,72v50H32.1 c-10.6,0-20,5.1-25.8,13l0,78h187L193.3,135.9z"></path>
      <path fill="none" stroke="#3A5E77" stroke-width="2.5" stroke-linecap="round" d="M193.3,135.9 c-5.8-8.4-15.5-13.9-26.5-13.9H151V72c0-27.6-22.4-50-50-50S51,44.4,51,72v50H32.1c-10.6,0-20,5.1-25.8,13"></path>
      <path fill="#DDF1FA" d="M100,156.4c-22.9,0-43,11.1-54.1,27.7c15.6,10,34.2,15.9,54.1,15.9s38.5-5.8,54.1-15.9 C143,167.5,122.9,156.4,100,156.4z"></path>
    </g>
    <g class="earL">
      <g class="outerEar" fill="#ddf1fa" stroke="#3a5e77" stroke-width="2.5">
        <circle cx="47" cy="83" r="11.5"></circle>
        <path d="M46.3 78.9c-2.3 0-4.1 1.9-4.1 4.1 0 2.3 1.9 4.1 4.1 4.1" stroke-linecap="round" stroke-linejoin="round"></path>
      </g>
      <g class="earHair">
        <rect x="51" y="64" fill="#FFFFFF" width="15" height="35"></rect>
        <path d="M53.4 62.8C48.5 67.4 45 72.2 42.8 77c3.4-.1 6.8-.1 10.1.1-4 3.7-6.8 7.6-8.2 11.6 2.1 0 4.2 0 6.3.2-2.6 4.1-3.8 8.3-3.7 12.5 1.2-.7 3.4-1.4 5.2-1.9" fill="#fff" stroke="#3a5e77" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"></path>
      </g>
    </g>
    <g class="earR">
      <g class="outerEar" fill="#ddf1fa" stroke="#3a5e77" stroke-width="2.5">
        <circle cx="155" cy="83" r="11.5"></circle>
        <path d="M155.7 78.9c2.3 0 4.1 1.9 4.1 4.1 0 2.3-1.9 4.1-4.1 4.1" stroke-linecap="round" stroke-linejoin="round"></path>
      </g>
      <g class="earHair">
        <rect x="131" y="64" fill="#FFFFFF" width="20" height="35"></rect>
        <path d="M148.6 62.8c4.9 4.6 8.4 9.4 10.6 14.2-3.4-.1-6.8-.1-10.1.1 4 3.7 6.8 7.6 8.2 11.6-2.1 0-4.2 0-6.3.2 2.6 4.1 3.8 8.3 3.7 12.5-1.2-.7-3.4-1.4-5.2-1.9" fill="#fff" stroke="#3a5e77" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"></path>
      </g>
    </g>
    <path class="chin" d="M84.1 121.6c2.7 2.9 6.1 5.4 9.8 7.5l.9-4.5c2.9 2.5 6.3 4.8 10.2 6.5 0-1.9-.1-3.9-.2-5.8 3 1.2 6.2 2 9.7 2.5-.3-2.1-.7-4.1-1.2-6.1" fill="none" stroke="#3a5e77" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"></path>
    <path class="face" fill="#DDF1FA" d="M134.5,46v35.5c0,21.815-15.446,39.5-34.5,39.5s-34.5-17.685-34.5-39.5V46"></path>
    <path class="hair" fill="#FFFFFF" stroke="#3A5E77" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" d="M81.457,27.929 c1.755-4.084,5.51-8.262,11.253-11.77c0.979,2.565,1.883,5.14,2.712,7.723c3.162-4.265,8.626-8.27,16.272-11.235 c-0.737,3.293-1.588,6.573-2.554,9.837c4.857-2.116,11.049-3.64,18.428-4.156c-2.403,3.23-5.021,6.391-7.852,9.474"></path>
    <g class="eyebrow">
      <path fill="#FFFFFF" d="M138.142,55.064c-4.93,1.259-9.874,2.118-14.787,2.599c-0.336,3.341-0.776,6.689-1.322,10.037 c-4.569-1.465-8.909-3.222-12.996-5.226c-0.98,3.075-2.07,6.137-3.267,9.179c-5.514-3.067-10.559-6.545-15.097-10.329 c-1.806,2.889-3.745,5.73-5.816,8.515c-7.916-4.124-15.053-9.114-21.296-14.738l1.107-11.768h73.475V55.064z"></path>
      <path fill="#FFFFFF" stroke="#3A5E77" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" d="M63.56,55.102 c6.243,5.624,13.38,10.614,21.296,14.738c2.071-2.785,4.01-5.626,5.816-8.515c4.537,3.785,9.583,7.263,15.097,10.329 c1.197-3.043,2.287-6.104,3.267-9.179c4.087,2.004,8.427,3.761,12.996,5.226c0.545-3.348,0.986-6.696,1.322-10.037 c4.913-0.481,9.857-1.34,14.787-2.599"></path>
    </g>
    <g class="eyeL"><circle cx="85.5" cy="78.5" r="3.5" fill="#3a5e77"></circle><circle cx="84" cy="76" r="1" fill="#fff"></circle></g>
    <g class="eyeR"><circle cx="114.5" cy="78.5" r="3.5" fill="#3a5e77"></circle><circle cx="113" cy="76" r="1" fill="#fff"></circle></g>
    <g class="mouth">
      <path class="mouthBG" fill="#617E92" d="M100.2,101c-0.4,0-1.4,0-1.8,0c-2.7-0.3-5.3-1.1-8-2.5c-0.7-0.3-0.9-1.2-0.6-1.8 c0.2-0.5,0.7-0.7,1.2-0.7c0.2,0,0.5,0.1,0.6,0.2c3,1.5,5.8,2.3,8.6,2.3s5.7-0.7,8.6-2.3c0.2-0.1,0.4-0.2,0.6-0.2 c0.5,0,1,0.3,1.2,0.7c0.4,0.7,0.1,1.5-0.6,1.9c-2.6,1.4-5.3,2.2-7.9,2.5C101.7,101,100.5,101,100.2,101z"></path>
      <path class="mouthSmallBG" fill="#617E92" style="display:none" d="M100.2,101c-0.4,0-1.4,0-1.8,0c-2.7-0.3-5.3-1.1-8-2.5c-0.7-0.3-0.9-1.2-0.6-1.8 c0.2-0.5,0.7-0.7,1.2-0.7c0.2,0,0.5,0.1,0.6,0.2c3,1.5,5.8,2.3,8.6,2.3s5.7-0.7,8.6-2.3c0.2-0.1,0.4-0.2,0.6-0.2 c0.5,0,1,0.3,1.2,0.7c0.4,0.7,0.1,1.5-0.6,1.9c-2.6,1.4-5.3,2.2-7.9,2.5C101.7,101,100.5,101,100.2,101z"></path>
      <path class="mouthMediumBG" style="display:none" d="M95,104.2c-4.5,0-8.2-3.7-8.2-8.2v-2c0-1.2,1-2.2,2.2-2.2h22c1.2,0,2.2,1,2.2,2.2v2 c0,4.5-3.7,8.2-8.2,8.2H95z"></path>
      <path class="mouthLargeBG" style="display:none" d="M100 110.2c-9 0-16.2-7.3-16.2-16.2 0-2.3 1.9-4.2 4.2-4.2h24c2.3 0 4.2 1.9 4.2 4.2 0 9-7.2 16.2-16.2 16.2z" fill="#617e92" stroke="#3a5e77" stroke-linejoin="round" stroke-width="2.5"></path>
      <defs><path id="mouthMaskPath" d="M100.2,101c-0.4,0-1.4,0-1.8,0c-2.7-0.3-5.3-1.1-8-2.5c-0.7-0.3-0.9-1.2-0.6-1.8 c0.2-0.5,0.7-0.7,1.2-0.7c0.2,0,0.5,0.1,0.6,0.2c3,1.5,5.8,2.3,8.6,2.3s5.7-0.7,8.6-2.3c0.2-0.1,0.4-0.2,0.6-0.2 c0.5,0,1,0.3,1.2,0.7c0.4,0.7,0.1,1.5-0.6,1.9c-2.6,1.4-5.3,2.2-7.9,2.5C101.7,101,100.5,101,100.2,101z"></path></defs>
      <clipPath id="mouthMask"><use xlink:href="#mouthMaskPath" overflow="visible"></use></clipPath>
      <g clip-path="url(#mouthMask)">
        <g class="tongue"><circle cx="100" cy="107" r="8" fill="#cc4a6c"></circle><ellipse class="tongueHighlight" cx="100" cy="100.5" rx="3" ry="1.5" opacity=".1" fill="#fff"></ellipse></g>
      </g>
      <path clip-path="url(#mouthMask)" class="tooth" style="fill:#FFFFFF;" d="M106,97h-4c-1.1,0-2-0.9-2-2v-2h8v2C108,96.1,107.1,97,106,97z"></path>
      <path class="mouthOutline" fill="none" stroke="#3A5E77" stroke-width="2.5" stroke-linejoin="round" d="M100.2,101c-0.4,0-1.4,0-1.8,0c-2.7-0.3-5.3-1.1-8-2.5c-0.7-0.3-0.9-1.2-0.6-1.8 c0.2-0.5,0.7-0.7,1.2-0.7c0.2,0,0.5,0.1,0.6,0.2c3,1.5,5.8,2.3,8.6,2.3s5.7-0.7,8.6-2.3c0.2-0.1,0.4-0.2,0.6-0.2 c0.5,0,1,0.3,1.2,0.7c0.4,0.7,0.1,1.5-0.6,1.9c-2.6,1.4-5.3,2.2-7.9,2.5C101.7,101,100.5,101,100.2,101z"></path>
    </g>
    <path class="nose" d="M97.7 79.9h4.7c1.9 0 3 2.2 1.9 3.7l-2.3 3.3c-.9 1.3-2.9 1.3-3.8 0l-2.3-3.3c-1.3-1.6-.2-3.7 1.8-3.7z" fill="#3a5e77"></path>
    <g class="arms" clip-path="url(#armMask)" style="display: none;">
      <g class="armL" data-svg-origin="1.2 46.2" transform="matrix(-0.25881,0.96592,-0.96592,-0.25881,-46.8636,276.9983)">
        <path fill="#ddf1fa" stroke="#3a5e77" stroke-linecap="round" stroke-linejoin="round" stroke-miterlimit="10" stroke-width="2.5" d="M121.3 97.4L111 58.7l38.8-10.4 20 36.1z"></path>
        <path fill="#ddf1fa" stroke="#3a5e77" stroke-linecap="round" stroke-linejoin="round" stroke-miterlimit="10" stroke-width="2.5" d="M134.4 52.5l19.3-5.2c2.7-.7 5.4.9 6.1 3.5.7 2.7-.9 5.4-3.5 6.1L146 59.7M160.8 76.5l19.4-5.2c2.7-.7 5.4.9 6.1 3.5.7 2.7-.9 5.4-3.5 6.1l-18.3 4.9M158.3 66.8l23.1-6.2c2.7-.7 5.4.9 6.1 3.5.7 2.7-.9 5.4-3.5 6.1l-23.1 6.2M150.9 58.4l26-7c2.7-.7 5.4.9 6.1 3.5.7 2.7-.9 5.4-3.5 6.1l-21.3 5.7"></path>
        <path fill="#a9ddf3" d="M178.8 74.7l2.2-.6c1.1-.3 2.2.3 2.4 1.4.3 1.1-.3 2.2-1.4 2.4l-2.2.6-1-3.8zM180.1 64l2.2-.6c1.1-.3 2.2.3 2.4 1.4.3 1.1-.3 2.2-1.4 2.4l-2.2.6-1-3.8zM175.5 54.9l2.2-.6c1.1-.3 2.2.3 2.4 1.4.3 1.1-.3 2.2-1.4 2.4l-2.2.6-1-3.8zM152.1 49.4l2.2-.6c1.1-.3 2.2.3 2.4 1.4.3 1.1-.3 2.2-1.4 2.4l-2.2.6-1-3.8z"></path>
        <path fill="#fff" stroke="#3a5e77" stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M123.5 96.8c-41.4 14.9-84.1 30.7-108.2 35.5L1.2 80c33.5-9.9 71.9-16.5 111.9-21.8"></path>
        <path fill="#fff" stroke="#3a5e77" stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M108.5 59.4c7.7-5.3 14.3-8.4 22.8-13.2-2.4 5.3-4.7 10.3-6.7 15.1 4.3.3 8.4.7 12.3 1.3-4.2 5-8.1 9.6-11.5 13.9 3.1 1.1 6 2.4 8.7 3.8-1.4 2.9-2.7 5.8-3.9 8.5 2.5 3.5 4.6 7.2 6.3 11-4.9-.8-9-.7-16.2-2.7M94.5 102.8c-.6 4-3.8 8.9-9.4 14.7-2.6-1.8-5-3.7-7.2-5.7-2.5 4.1-6.6 8.8-12.2 14-1.9-2.2-3.4-4.5-4.5-6.9-4.4 3.3-9.5 6.9-15.4 10.8-.2-3.4.1-7.1 1.1-10.9M97.5 62.9c-1.7-2.4-5.9-4.1-12.4-5.2-.9 2.2-1.8 4.3-2.5 6.5-3.8-1.8-9.4-3.1-17-3.8.5 2.3 1.2 4.5 1.9 6.8-5-.6-11.2-.9-18.4-1 2 2.9.9 3.5 3.9 6.2"></path>
      </g>
      <g class="armR" data-svg-origin="385.5 47.0353" transform="matrix(-0.25881,-0.96592,0.96592,-0.25881,346.8421,651.5733)">
        <path fill="#ddf1fa" stroke="#3a5e77" stroke-linecap="round" stroke-linejoin="round" stroke-miterlimit="10" stroke-width="2.5" d="M265.4 97.3l10.4-38.6-38.9-10.5-20 36.1z"></path>
        <path fill="#ddf1fa" stroke="#3a5e77" stroke-linecap="round" stroke-linejoin="round" stroke-miterlimit="10" stroke-width="2.5" d="M252.4 52.4L233 47.2c-2.7-.7-5.4.9-6.1 3.5-.7 2.7.9 5.4 3.5 6.1l10.3 2.8M226 76.4l-19.4-5.2c-2.7-.7-5.4.9-6.1 3.5-.7 2.7.9 5.4 3.5 6.1l18.3 4.9M228.4 66.7l-23.1-6.2c-2.7-.7-5.4.9-6.1 3.5-.7 2.7.9 5.4 3.5 6.1l-23.1 6.2M235.8 58.3l-26-7c-2.7-.7-5.4.9-6.1 3.5-.7 2.7.9 5.4 3.5 6.1l21.3 5.7"></path>
        <path fill="#a9ddf3" d="M207.9 74.7l-2.2-.6c-1.1-.3-2.2.3-2.4 1.4-.3 1.1.3 2.2 1.4 2.4l2.2.6 1-3.8zM206.7 64l-2.2-.6c-1.1-.3-2.2.3-2.4 1.4-.3 1.1.3 2.2 1.4 2.4l2.2.6 1-3.8zM211.2 54.8l-2.2-.6c-1.1-.3-2.2.3-2.4 1.4-.3 1.1.3 2.2 1.4 2.4l-2.2.6 1-3.8zM234.6 49.4l-2.2-.6c-1.1-.3-2.2.3-2.4 1.4-.3 1.1.3 2.2 1.4 2.4l-2.2.6 1-3.8z"></path>
        <path fill="#fff" stroke="#3a5e77" stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M263.3 96.7c41.4 14.9 84.1 30.7 108.2 35.5l14-52.3C352 70 313.6 63.5 273.6 58.1"></path>
        <path fill="#fff" stroke="#3a5e77" stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M278.2 59.3l-18.6-10 2.5 11.9-10.7 6.5 9.9 8.7-13.9 6.4 9.1 5.9-13.2 9.2 23.1-.9M284.5 100.1c-.4 4 1.8 8.9 6.7 14.8 3.5-1.8 6.7-3.6 9.7-5.5 1.8 4.2 5.1 8.9 10.1 14.1 2.7-2.1 5.1-4.4 7.1-6.8 4.1 3.4 9 7 14.7 11 1.2-3.4 1.8-7 1.7-10.9M314 66.7s5.4-5.7 12.6-7.4c1.7 2.9 3.3 5.7 4.9 8.6 3.8-2.5 9.8-4.4 18.2-5.7.1 3.1.1 6.1 0 9.2 5.5-1 12.5-1.6 20.8-1.9-1.4 3.9-2.5 8.4-2.5 8.4"></path>
      </g>
    </g>
    </g>
  </svg>`;
  
  useEffect(() => {
    if (!mascotMountRef.current) return;

    mascotMountRef.current.innerHTML = mascotSvg;

    const root = mascotMountRef.current;
    const svg = root.querySelector('svg');
    if (!svg) return;

    const EASE = 'cubic-bezier(0.19, 1, 0.22, 1)';
    const getPosition = (el: HTMLElement | SVGElement | null): { x: number; y: number } => {
      let x = 0, y = 0;
      let currentEl = el as HTMLElement;
      while (currentEl) {
          x += (currentEl.offsetLeft - currentEl.scrollLeft + currentEl.clientLeft);
          y += (currentEl.offsetTop - currentEl.scrollTop + currentEl.clientTop);
          currentEl = currentEl.offsetParent as HTMLElement;
      }
      return { x, y };
    };
    const getAngle = (x1: number, y1: number, x2: number, y2: number) => Math.atan2(x1 - x2, y1 - y2);
    const setTransform = (el: HTMLElement | SVGElement | null, transform: string, duration = 400) => {
      if (el) {
        el.style.transition = `transform ${duration}ms ${EASE}`;
        el.style.transform = transform;
      }
    };

    const eyeL = svg.querySelector<SVGElement>('.eyeL');
    const eyeR = svg.querySelector<SVGElement>('.eyeR');
    const nose = svg.querySelector<SVGElement>('.nose');
    const mouthGroup = svg.querySelector<SVGElement>('.mouth');
    const mouthBG = svg.querySelector<SVGElement>('.mouthBG');
    const mouthSmallBG = svg.querySelector<SVGElement>('.mouthSmallBG');
    const mouthMediumBG = svg.querySelector<SVGElement>('.mouthMediumBG');
    const mouthLargeBG = svg.querySelector<SVGElement>('.mouthLargeBG');
    const tooth = svg.querySelector<SVGElement>('.tooth');
    const tongue = svg.querySelector<SVGElement>('.tongue');
    const chin = svg.querySelector<SVGElement>('.chin');
    const face = svg.querySelector<SVGElement>('.face');
    const eyebrow = svg.querySelector<SVGElement>('.eyebrow');
    const outerEarL = svg.querySelector<SVGElement>('.earL .outerEar');
    const outerEarR = svg.querySelector<SVGElement>('.earR .outerEar');
    const earHairL = svg.querySelector<SVGElement>('.earL .earHair');
    const earHairR = svg.querySelector<SVGElement>('.earR .earHair');
    const hair = svg.querySelector<SVGElement>('.hair');
    const armL = svg.querySelector<SVGElement>('.armL');
    const armR = svg.querySelector<SVGElement>('.armR');
    
    if (armL) armL.style.transformOrigin = 'top left';
    if (armR) armR.style.transformOrigin = 'top right';
    setTransform(armL, 'translate(-93px, 220px) rotate(105deg)', 0);
    setTransform(armR, 'translate(-93px, 220px) rotate(-105deg)', 0);

    const emailEl = emailRef.current;
    const pwdEl = passwordRef.current;

    const setMouthMode = (mode: 'small' | 'medium' | 'large') => {
      if (mouthSmallBG) mouthSmallBG.style.display = (mode === 'small') ? 'block' : 'none';
      if (mouthMediumBG) mouthMediumBG.style.display = (mode === 'medium') ? 'block' : 'none';
      if (mouthLargeBG) mouthLargeBG.style.display = (mode === 'large') ? 'block' : 'none';

      if (mode === 'large') {
        setTransform(eyeL, 'translate(0,0) scale(0.65)'); setTransform(eyeR, 'translate(0,0) scale(0.65)');
        setTransform(tooth, 'translate(3px,-2px)'); setTransform(tongue, 'translate(0,2px)');
      } else if (mode === 'medium') {
        setTransform(eyeL, 'translate(0,0) scale(0.85)'); setTransform(eyeR, 'translate(0,0) scale(0.85)');
        setTransform(tooth, 'translate(0,0)'); setTransform(tongue, 'translate(0,1px)');
      } else {
        setTransform(eyeL, 'translate(0,0) scale(1)'); setTransform(eyeR, 'translate(0,0) scale(1)');
        setTransform(tooth, 'translate(0,0)'); setTransform(tongue, 'translate(0,0)');
      }
    };

    const updateFaceTowardsCaret = () => {
      if (!emailEl || !eyeL || !eyeR || !nose || !face) return;

      const carPos = emailEl.selectionEnd ?? (emailEl.value || '').length;

      const div = document.createElement('div');
      const span = document.createElement('span');
      const style = getComputedStyle(emailEl);
      Array.from(style).forEach(prop => { div.style[prop as any] = style[prop as any]; });
      div.style.position = 'absolute';
      div.style.visibility = 'hidden';
      div.style.whiteSpace = 'pre-wrap';
      div.style.width = `${emailEl.clientWidth}px`;
      div.textContent = emailEl.value.substring(0, carPos);
      span.textContent = emailEl.value.substring(carPos) || '.';
      div.appendChild(span);
      document.body.appendChild(div);

      const emailCoords = getPosition(emailEl);
      const caretCoords = getPosition(span);
      const svgCoords = getPosition(svg);
      const centerCoords = getPosition(svg);
      const screenCenter = centerCoords.x + (svg.getBoundingClientRect().width / 2);
      const dFromC = screenCenter - (caretCoords.x + emailCoords.x);

      const eyeLCoords = { x: svgCoords.x + 84, y: svgCoords.y + 76 };
      const eyeRCoords = { x: svgCoords.x + 113, y: svgCoords.y + 76 };

      const eyeLAngle = getAngle(eyeLCoords.x, eyeLCoords.y, emailCoords.x + caretCoords.x, emailCoords.y + 25);
      const eyeRAngle = getAngle(eyeRCoords.x, eyeRCoords.y, emailCoords.x + caretCoords.x, emailCoords.y + 25);
      
      const eyeLX = Math.cos(eyeLAngle) * 60;
      const eyeLY = Math.sin(eyeLAngle) * 30;
      const eyeRX = Math.cos(eyeRAngle) * 60;
      const eyeRY = Math.sin(eyeRAngle) * 30;
      const mouthX = Math.cos(eyeLAngle) * 50;
      const mouthY = Math.sin(eyeLAngle) * 25;
      const mouthR = Math.cos(eyeLAngle) * 20;
      const chinX = mouthX * 1.5;
      const chinY = mouthY * 1.2;
      let chinS = 1 - ((dFromC * 0.15) / 100);
      if (chinS > 1) chinS = 1 - (chinS - 1);
      const faceX = mouthX * 2.0;
      const faceY = mouthY * 2.0;
      const faceSkew = Math.cos(eyeLAngle) * 20;
      const eyebrowSkew = Math.cos(eyeLAngle) * 50;
      const outerEarX = Math.cos(eyeLAngle) * 15;
      const outerEarY = Math.cos(eyeLAngle) * 20;
      const hairX = Math.cos(eyeLAngle) * 25;

      setTransform(eyeL, `translate(${-eyeLX}px, ${-eyeLY}px)`);
      setTransform(eyeR, `translate(${-eyeRX}px, ${-eyeRY}px)`);
      setTransform(nose, `translate(${-mouthX}px, ${-mouthY}px) rotate(${mouthR}deg)`);
      setTransform(mouthGroup, `translate(${-mouthX}px, ${-mouthY}px) rotate(${mouthR}deg)`);
      setTransform(chin, `translate(${-chinX}px, ${-chinY}px) scaleY(${chinS})`);
      setTransform(face, `translate(${-faceX}px, ${-faceY}px) skewX(${-faceSkew}deg)`, 700);
      setTransform(eyebrow, `translate(${-faceX}px, ${-faceY}px) skewX(${-eyebrowSkew}deg)`, 700);
      setTransform(outerEarL, `translate(${outerEarX}px, ${-outerEarY}px)`);
      setTransform(outerEarR, `translate(${outerEarX}px, ${outerEarY}px)`);
      setTransform(earHairL, `translate(${-outerEarX}px, ${-outerEarY}px)`);
      setTransform(earHairR, `translate(${-outerEarX}px, ${outerEarY}px)`);
      setTransform(hair, `translate(${hairX}px, 0) scaleY(1.5)`);

      document.body.removeChild(div);
    };

    const resetFace = () => {
        setTransform(eyeL, `translate(0,0) scale(1)`);
        setTransform(eyeR, `translate(0,0) scale(1)`);
        setTransform(nose, `translate(0,0) rotate(0deg)`);
        setTransform(mouthGroup, `translate(0,0) rotate(0deg)`);
        setTransform(chin, `translate(0,0) scaleY(1)`);
        setTransform(face, `translate(0,0) skewX(0deg)`);
        setTransform(eyebrow, `translate(0,0) skewX(0deg)`);
        setTransform(outerEarL, `translate(0,0)`);
        setTransform(outerEarR, `translate(0,0)`);
        setTransform(earHairL, `translate(0,0)`);
        setTransform(earHairR, `translate(0,0)`);
        setTransform(hair, `translate(0,0) scaleY(1)`);
    };

    const coverEyes = () => {
        const arms = svg.querySelector<SVGElement>('.arms');
        if (arms) { arms.style.display = 'block'; arms.style.opacity = '1'; }
        setTransform(armL, 'translate(-93px, 2px) rotate(0deg)', 300);
        setTransform(armR, 'translate(-93px, 2px) rotate(0deg)', 300);
    };

    const uncoverEyes = () => {
        setTransform(armL, 'translate(-93px, 220px) rotate(105deg)', 400);
        setTransform(armR, 'translate(-93px, 220px) rotate(-105deg)', 400);
        setTimeout(() => {
            const arms = svg.querySelector<SVGElement>('.arms');
            if (arms) { arms.style.display = 'none'; arms.style.opacity = '0'; }
        }, 450);
    };

    const setMouthColor = (color: string) => {
        if(mouthBG) mouthBG.style.fill = color;
        if(mouthSmallBG) mouthSmallBG.style.fill = color;
        if(mouthMediumBG) mouthMediumBG.style.fill = color;
        if(mouthLargeBG) mouthLargeBG.style.fill = color;
    }

    const onEmailInput = (e: Event) => {
        updateFaceTowardsCaret();
        const v = (e.target as HTMLInputElement)?.value || '';
        if (v.length === 0) { setMouthMode('small'); setMouthColor('#617E92'); } 
        else if (v.includes('@')) { setMouthMode('large'); setMouthColor('#ff69b4'); }
        else { setMouthMode('medium'); setMouthColor('#617E92'); }
    };
    
    const onEmailBlur = () => { if (!emailEl?.value) setMouthMode('small'); resetFace(); };

    const onPwdBlur = () => {
      uncoverEyes();
      const v = emailEl?.value || '';
      if (v.includes('@')) { setMouthMode('large'); setMouthColor('#ff69b4'); }
      else if (v.length > 0) { setMouthMode('medium'); setMouthColor('#617E92'); }
      else { setMouthMode('small'); setMouthColor('#617E92'); }
    };

    if (emailEl) {
      emailEl.addEventListener('focus', updateFaceTowardsCaret);
      emailEl.addEventListener('blur', onEmailBlur);
      emailEl.addEventListener('input', onEmailInput);
      emailEl.addEventListener('keyup', updateFaceTowardsCaret);
      emailEl.addEventListener('click', updateFaceTowardsCaret);
    }
    if (pwdEl) {
      pwdEl.addEventListener('focus', coverEyes);
      pwdEl.addEventListener('blur', onPwdBlur);
    }

    setMouthMode('small');

    return () => {
      if (emailEl) {
        emailEl.removeEventListener('focus', updateFaceTowardsCaret);
        emailEl.removeEventListener('blur', onEmailBlur);
        emailEl.removeEventListener('input', onEmailInput);
        emailEl.removeEventListener('keyup', updateFaceTowardsCaret);
        emailEl.removeEventListener('click', updateFaceTowardsCaret);
      }
      if (pwdEl) {
        pwdEl.removeEventListener('focus', coverEyes);
        pwdEl.removeEventListener('blur', onPwdBlur);
      }
    };
  }, [mascotSvg]); // Dependency ensures this runs once after the SVG string is defined

  useLayoutEffect(() => {
    const applyScale = () => {
      const headerPx = parseInt(getComputedStyle(document.documentElement).getPropertyValue('--header-height') || '80', 10);
      const available = window.innerHeight - headerPx;
      const card = cardRef.current;
      if (!card) return;
      const rect = card.getBoundingClientRect();
      if (rect.height > available) {
        const overflow = rect.height - available;
        const s = Math.max(0.74, 1 - overflow / 520);
        setMascotScale(s);
      } else {
        setMascotScale(1);
      }
    };
    applyScale();
    const ro = new ResizeObserver(applyScale);
    if (cardRef.current) ro.observe(cardRef.current);
    window.addEventListener('resize', applyScale);
    return () => { ro.disconnect(); window.removeEventListener('resize', applyScale); };
  }, []);

  return (
    <>
      <Head>
        <title>Sign In - XploitEye</title>
        <meta name="description" content="Sign in to your XploitEye account" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
      </Head>
      <LoginStyles />
      <div className="login-container" style={{ paddingTop: '20px' }}>
        <div className="login-background-animation"></div>
        
        <div className="login-logo">
          <img 
            src="/images/logo.svg" 
            alt="XploitEye Logo" 
            className="login-logo-image"
            onClick={() => window.location.href = '/'}
          />
        </div>

        {/* Back/Home Button */}
        <button 
          className="back-button"
          onClick={() => window.location.href = '/'}
          aria-label="Go back to home"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
          </svg>
          Back to Home
        </button>

        <div className="login-content">
          <div className="login-form-wrapper" ref={cardRef}>
            <div
              className="mascot-wrap"
              ref={mascotMountRef}
              style={{ transform: `scale(${mascotScale})`, transformOrigin: 'center top' }}
            />

            <form className="login-form" onSubmit={handleSubmit} noValidate>
              {errors.general && (
                <div className="error-message" style={{ backgroundColor: '#ef4444', color: 'white', padding: '12px', borderRadius: '8px', marginBottom: '20px', textAlign: 'center', fontWeight: 'bold' }}>
                  {errors.general}
                </div>
              )}

              <div className="form-group">
                <label htmlFor="emailOrUsername" className="form-label">Email or Username</label>
                <Input
                  type="text"
                  id="emailOrUsername"
                  name="emailOrUsername"
                  value={formData.emailOrUsername}
                  onChange={handleChange}
                  className={`form-input ${errors.emailOrUsername ? 'error' : ''}`}
                  placeholder="Enter your email or username"
                  ref={emailRef}
                  autoComplete="off"
                  autoCorrect="off"
                  autoCapitalize="off"
                  spellCheck="false"
                />
                {errors.emailOrUsername && <span className="error-message">{errors.emailOrUsername}</span>}
              </div>

              <div className="form-group">
                <label htmlFor="password" className="form-label">Password</label>
                <Input
                  type="password"
                  id="password"
                  name="password"
                  value={formData.password}
                  onChange={handleChange}
                  className={`form-input ${errors.password ? 'error' : ''}`}
                  placeholder="Enter your password"
                  ref={passwordRef}
                  autoComplete="new-password"
                />
                {errors.password && <span className="error-message">{errors.password}</span>}
              </div>

              <div className="form-options">
                <label className="checkbox-label">
                  <input type="checkbox" className="checkbox" />
                  <span className="checkbox-text">Remember me</span>
                </label>
                <a href="/forgot-password" className="forgot-link">Forgot password?</a>
              </div>

              <Button type="submit" className="login-button w-full">Sign In</Button>
            </form>

            <div className="divider"><span className="divider-text">or</span></div>

            <button className="google-login-button" onClick={handleGoogleLogin}>
              <svg className="google-icon" viewBox="0 0 24 24" width="20" height="20" aria-hidden="true">
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
              </svg>
              Continue with Google
            </button>

            <div className="signup-prompt">
              <span className="signup-text">Don't have an account? </span>
              <a href="/signup" className="signup-link">Sign up</a>
            </div>
          </div>
        </div>
        
        {/* MFA Login Modal */}
        <MfaLoginModal
          isOpen={showMfaModal}
          onClose={() => {
            setShowMfaModal(false);
            setMfaRequired(false);
            setTempLoginToken('');
          }}
          onVerified={handleMfaVerified}
          userEmail={formData.emailOrUsername}
          tempToken={tempLoginToken}
        />
      </div>
    </>
  );
};

export default Login;