import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { useAuth } from '../auth/AuthContext';

export default function Header() {
  const router = useRouter();
  const [isMenuOpen, setIsMenuOpen] = useState<boolean>(false);
  const [isScrolled, setIsScrolled] = useState<boolean>(false);
  const [show, setShow] = useState<boolean>(true);
  const [isUserMenuOpen, setIsUserMenuOpen] = useState<boolean>(false);
  const lastScrollY = useRef<number>(0);
  const userMenuRef = useRef<HTMLDivElement>(null);
  const { isAuthenticated, user, logout } = useAuth();

  // Handle scroll effect for header shadow and visibility
  useEffect(() => {
    const handleScroll = () => {
      const currentScrollY = window.scrollY;

      setIsScrolled(currentScrollY > 0);

      if (currentScrollY > lastScrollY.current && currentScrollY > 100) {
        // Scrolling down - hide header
        setShow(false);
      } else if (currentScrollY < lastScrollY.current) {
        // Scrolling up - show header
        setShow(true);
      }

      lastScrollY.current = currentScrollY;
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Handle body overflow when menu is open
  useEffect(() => {
    if (isMenuOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }

    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isMenuOpen]);

  // Dynamic logo sizing based on screen width
  const updateLogoSize = () => {
    const width = window.innerWidth;
    const root = document.documentElement;
    
    if (width >= 1440) {
      root.style.setProperty('--logo-height', '190px');
      root.style.setProperty('--logo-max-width', '380px');
    } else if (width >= 1200) {
      root.style.setProperty('--logo-height', '180px');
      root.style.setProperty('--logo-max-width', '350px');
    } else if (width >= 1024) {
      root.style.setProperty('--logo-height', '170px');
      root.style.setProperty('--logo-max-width', '320px');
    } else if (width >= 768) {
      root.style.setProperty('--logo-height', '140px');
      root.style.setProperty('--logo-max-width', '250px');
    } else {
      root.style.setProperty('--logo-height', '130px');
      root.style.setProperty('--logo-max-width', '200px');
    }
  };

  // Set up resize listener for responsive logo sizing
  useEffect(() => {
    window.addEventListener('resize', updateLogoSize);
    updateLogoSize();

    return () => {
      window.removeEventListener('resize', updateLogoSize);
    };
  }, []);

  // Handle clicks outside user menu to close it
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (userMenuRef.current && !userMenuRef.current.contains(event.target as Node)) {
        setIsUserMenuOpen(false);
      }
    };

    if (isUserMenuOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isUserMenuOpen]);

  const toggleMenu = () => {
    setIsMenuOpen(!isMenuOpen);
  };

  const toggleUserMenu = () => {
    setIsUserMenuOpen(!isUserMenuOpen);
  };

  const handleLogout = async () => {
    await logout();
    setIsUserMenuOpen(false);
    router.push('/');
  };

  const handleNavClick = () => {
    setIsMenuOpen(false);
  };

  const navigationLinks = [
    { name: 'Home', path: '/' },
    { name: 'Platform', path: '/platform' },
    { name: 'Use Cases', path: '/usecase' },
    { name: 'Pricing', path: '/pricing' },
    { name: 'Docs', path: '/doc' },
    { name: 'About Us', path: '/about' },
    { name: 'Contact Us', path: '/contactus' }
  ];

  return (
    <>
      {/* Header Styles */}
      <style dangerouslySetInnerHTML={{ __html: `
        :root {
          --white: #ffffff;
          --grey-5: rgba(255, 255, 255, 0.7);
          --text-primary: #ffffff;
          --accent-primary: #00f078;
          --border-color: rgba(255, 255, 255, 0.1);
          --surface-hover: rgba(255, 255, 255, 0.05);
        }
        
        /* Header Styles */
        .header {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          width: 100%;
          z-index: 9999;
          background: rgba(0, 0, 0, 0.95);
          backdrop-filter: blur(15px);
          transition: transform 0.3s ease, box-shadow 0.3s ease;
          border-bottom: 1px solid rgba(255, 255, 255, 0.1);
          height: 70px;
          box-shadow: 0 2px 20px rgba(0, 0, 0, 0.3);
          transform: translateY(0);
        }

        .header--hidden {
          transform: translateY(-100%);
        }

        @media (min-width: 501px) {
          .header--hidden {
            transform: translateY(0) !important;
          }
        }

        .header--scrolled {
          box-shadow: 0 4px 20px rgba(0, 240, 120, 0.1);
          border-bottom-color: rgba(255, 255, 255, 0.1);
        }
        
        .header__container {
          align-items: center;
          width: 100%;
          max-width: 86rem;
          height: 100%;
          margin-left: auto;
          margin-right: auto;
          display: flex;
          padding: 0.25rem 1.5rem;
          min-height: 70px;
          gap: 20px;
        }
        
        .logo-section {
          display: flex;
          align-items: center;
          flex: 0 0 auto;
          min-width: 200px;
        }
        
        .logo-section a {
          display: flex;
          align-items: center;
          text-decoration: none;
          transition: all 0.3s ease;
          outline: none;
        }
        
        .logo-section a:hover {
          transform: scale(1.05);
        }
        
        .header__logo-image {
          height: var(--logo-height, 60px);
          width: auto;
          max-width: var(--logo-max-width, 300px);
          transition: all 0.3s ease;
          filter: brightness(1.1);
          cursor: pointer;
          outline: none;
          user-select: none;
        }
        
        .nav-section {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 35px;
          flex: 1;
          min-width: 0;
        }
        
        .nav-section a,
        .nav-link {
          color: var(--grey-5);
          text-decoration: none;
          font-weight: 600;
          font-size: 0.9rem;
          padding: 1rem 0;
          height: 50px;
          box-sizing: border-box;
          display: flex;
          align-items: center;
          position: relative;
          transition: all 0.3s ease;
          white-space: nowrap;
          overflow: hidden;
          outline: none;
          background: none;
          border: none;
          cursor: pointer;
          font-family: inherit;
        }
        
        .nav-section a:hover,
        .nav-link:hover {
          color: var(--text-primary);
          transform: translate3d(0px, -2px, 0px) scale3d(1.05, 1.05, 1);
        }
        
        .nav-link--active {
          color: var(--text-primary) !important;
          font-weight: 700;
        }

        .nav-link--active::after {
          width: 100% !important;
          background: var(--accent-primary) !important;
        }
        
        .nav-section a::after {
          content: '';
          position: absolute;
          bottom: 0;
          left: 0;
          width: 0;
          height: 2px;
          background: var(--accent-primary);
          transition: width 0.3s ease;
        }
        
        .nav-section a:hover::after {
          width: 100%;
        }
        
        .auth-section {
          display: flex;
          align-items: center;
          gap: 10px;
          flex: 0 0 auto;
          margin-left: auto;
        }
        
        .login-btn {
          background: transparent;
          color: #31ff94;
          border: 1px solid var(--border-color);
          padding: 0.5rem 1rem;
          border-radius: 12px;
          font-weight: 600;
          font-size: 0.9rem;
          cursor: pointer;
          transition: all 0.3s ease;
          display: flex;
          align-items: center;
          gap: 0.5rem;
          white-space: nowrap;
          text-decoration: none;
        }
        
        .login-btn:hover {
          background: var(--surface-hover);
          border-color: #31ff94;
          transform: translateY(-1px);
        }
        
        .dashboard-btn {
          background: transparent;
          color: #31ff94;
          border: 1px solid var(--border-color);
          padding: 0.5rem 1rem;
          border-radius: 12px;
          font-weight: 600;
          font-size: 0.9rem;
          cursor: pointer;
          transition: all 0.3s ease;
          display: flex;
          align-items: center;
          gap: 0.5rem;
          text-decoration: none;
        }
        
        .dashboard-btn:hover {
          background: var(--surface-hover);
          border-color: #31ff94;
          transform: translateY(-1px);
        }
        
        .user-greeting {
          color: #31ff94;
          font-size: 0.85rem;
          margin: 0 0.5rem;
        }
        
        .logout-btn {
          background: transparent;
          color: #ff6b6b;
          border: 1px solid #ff6b6b;
          padding: 0.4rem 0.8rem;
          border-radius: 8px;
          font-weight: 500;
          font-size: 0.8rem;
          cursor: pointer;
          transition: all 0.3s ease;
        }

        .logout-btn:hover {
          background: #ff6b6b;
          color: white;
          transform: translateY(-1px);
        }

        .user-icon {
          width: 16px;
          height: 16px;
          color: #31ff94;
          opacity: 1;
        }

        /* User Profile Menu Styles */
        .user-profile-container {
          position: relative;
          display: flex;
          align-items: center;
          gap: 12px;
        }

        .user-profile-button {
          display: flex;
          align-items: center;
          gap: 10px;
          padding: 6px 12px;
          background: rgba(255, 255, 255, 0.05);
          border: 1px solid rgba(255, 255, 255, 0.1);
          border-radius: 50px;
          cursor: pointer;
          transition: all 0.3s ease;
        }

        .user-profile-button:hover {
          background: rgba(0, 240, 120, 0.1);
          border-color: rgba(0, 240, 120, 0.3);
        }

        .user-avatar {
          width: 36px;
          height: 36px;
          border-radius: 50%;
          border: 2px solid #00f078;
          object-fit: cover;
          background: rgba(0, 240, 120, 0.2);
        }

        .user-avatar-placeholder {
          width: 36px;
          height: 36px;
          border-radius: 50%;
          border: 2px solid #00f078;
          background: linear-gradient(135deg, #00f078 0%, #00c060 100%);
          display: flex;
          align-items: center;
          justify-content: center;
          font-weight: 700;
          font-size: 16px;
          color: #000;
          text-transform: uppercase;
        }

        .user-name-text {
          color: #ffffff;
          font-size: 0.9rem;
          font-weight: 600;
          max-width: 120px;
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
        }

        .user-dropdown-arrow {
          width: 16px;
          height: 16px;
          color: rgba(255, 255, 255, 0.7);
          transition: transform 0.3s ease;
        }

        .user-dropdown-arrow.open {
          transform: rotate(180deg);
        }

        /* Hide name and arrow on mobile */
        @media (max-width: 500px) {
          .user-name-text {
            display: none;
          }

          .user-dropdown-arrow {
            display: none;
          }

          .user-profile-button {
            padding: 4px;
            min-width: auto;
            gap: 0;
          }

          .user-avatar,
          .user-avatar-placeholder {
            width: 32px;
            height: 32px;
            font-size: 14px;
          }
        }

        @media (max-width: 400px) {
          .user-avatar,
          .user-avatar-placeholder {
            width: 30px;
            height: 30px;
            font-size: 13px;
          }

          .user-profile-button {
            padding: 3px;
          }
        }

        @media (max-width: 300px) {
          .user-avatar,
          .user-avatar-placeholder {
            width: 28px;
            height: 28px;
            font-size: 12px;
          }

          .user-profile-button {
            padding: 2px;
          }
        }

        .user-dropdown-menu {
          position: absolute;
          top: calc(100% + 10px);
          right: 0;
          min-width: 200px;
          background: rgba(0, 26, 10, 0.95);
          backdrop-filter: blur(15px);
          border: 1px solid rgba(0, 240, 120, 0.3);
          border-radius: 16px;
          box-shadow: 0 8px 32px rgba(0, 0, 0, 0.5), 0 0 20px rgba(0, 240, 120, 0.1);
          overflow: hidden;
          z-index: 10000;
          opacity: 0;
          visibility: hidden;
          transform: translateY(-10px);
          transition: all 0.3s ease;
        }

        .user-dropdown-menu.open {
          opacity: 1;
          visibility: visible;
          transform: translateY(0);
        }

        .user-dropdown-header {
          padding: 16px;
          border-bottom: 1px solid rgba(255, 255, 255, 0.1);
          background: rgba(0, 240, 120, 0.05);
        }

        .user-dropdown-name {
          font-size: 0.95rem;
          font-weight: 600;
          color: #ffffff;
          margin-bottom: 4px;
        }

        .user-dropdown-email {
          font-size: 0.8rem;
          color: rgba(255, 255, 255, 0.6);
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
        }

        .user-dropdown-item {
          display: flex;
          align-items: center;
          gap: 12px;
          padding: 12px 16px;
          color: rgba(255, 255, 255, 0.8);
          text-decoration: none;
          font-size: 0.9rem;
          transition: all 0.2s ease;
          cursor: pointer;
          background: none;
          border: none;
          width: 100%;
          text-align: left;
          font-family: inherit;
        }

        .user-dropdown-item:hover {
          background: rgba(0, 240, 120, 0.1);
          color: #00f078;
        }

        .user-dropdown-item svg {
          width: 18px;
          height: 18px;
          opacity: 0.8;
        }

        .user-dropdown-divider {
          height: 1px;
          background: rgba(255, 255, 255, 0.1);
          margin: 4px 0;
        }

        .user-dropdown-logout {
          color: #ff6b6b;
        }

        .user-dropdown-logout:hover {
          background: rgba(255, 107, 107, 0.1);
          color: #ff4444;
        }

        /* Responsive dropdown adjustments */
        @media (max-width: 500px) {
          .user-dropdown-menu {
            min-width: 220px;
            right: -10px;
            left: auto;
          }

          .user-dropdown-header {
            padding: 12px;
          }

          .user-dropdown-name {
            font-size: 0.9rem;
          }

          .user-dropdown-email {
            font-size: 0.75rem;
          }

          .user-dropdown-item {
            padding: 10px 14px;
            font-size: 0.85rem;
          }

          .user-dropdown-item svg {
            width: 16px;
            height: 16px;
          }
        }

        @media (max-width: 400px) {
          .user-dropdown-menu {
            min-width: 200px;
            right: -15px;
          }

          .user-dropdown-header {
            padding: 10px;
          }

          .user-dropdown-name {
            font-size: 0.85rem;
          }

          .user-dropdown-email {
            font-size: 0.7rem;
          }

          .user-dropdown-item {
            padding: 9px 12px;
            font-size: 0.8rem;
          }

          .user-dropdown-item svg {
            width: 14px;
            height: 14px;
          }
        }

        @media (max-width: 300px) {
          .user-dropdown-menu {
            min-width: 180px;
            right: -20px;
          }

          .user-dropdown-header {
            padding: 8px;
          }

          .user-dropdown-name {
            font-size: 0.8rem;
          }

          .user-dropdown-email {
            font-size: 0.65rem;
          }

          .user-dropdown-item {
            padding: 8px 10px;
            font-size: 0.75rem;
            gap: 8px;
          }

          .user-dropdown-item svg {
            width: 12px;
            height: 12px;
          }
        }

        .signup-btn {
          z-index: 5;
          background-color: #31ff94;
          box-shadow: 0 0 48px 0 #31ff94;
          color: black;
          text-align: center;
          cursor: pointer;
          border: 1px solid transparent;
          border-radius: 20rem;
          padding: 0.5rem 1.2rem;
          font-weight: 500;
          text-decoration: none;
          transition: box-shadow 0.8s, background-color 0.3s ease-in-out;
          position: relative;
          align-items: center;
          height: 2.25rem;
          line-height: 1;
          display: flex;
          max-width: 100%;
          font-family: inherit;
          font-size: 1rem;
          white-space: nowrap;
        }
        
        .signup-btn:hover {
          background-color: #28e085;
          box-shadow: 0 0 36px -6px #31ff94;
          transform: translate3d(0px, -2px, 0px) scale3d(1.02, 1.02, 1);
        }
        
        .header__menu-toggle {
          display: none;
          flex-direction: column;
          justify-content: center;
          align-items: center;
          width: 44px;
          height: 44px;
          background: rgba(255, 255, 255, 0.05);
          border: 2px solid rgba(255, 255, 255, 0.1);
          border-radius: 12px;
          cursor: pointer;
          z-index: 1002;
          transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
          position: relative;
          overflow: hidden;
        }
        
        .header__menu-toggle:hover {
          background: rgba(0, 240, 120, 0.1);
          border-color: rgba(0, 240, 120, 0.3);
          transform: scale(1.05);
          box-shadow: 0 4px 12px rgba(0, 240, 120, 0.2);
        }
        
        .header__menu-toggle-line {
          width: 20px;
          height: 2px;
          background: var(--white);
          border-radius: 2px;
          transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
          transform-origin: center;
          position: relative;
          margin: 2px 0;
        }
        
        .header__menu-toggle--open {
          background: rgba(0, 240, 120, 0.15);
          border-color: #00f078;
          transform: rotate(180deg);
        }
        
        .header__menu-toggle--open .header__menu-toggle-line:nth-child(1) {
          transform: rotate(45deg) translate(6px, 6px);
          background: #00f078;
        }
        
        .header__menu-toggle--open .header__menu-toggle-line:nth-child(2) {
          opacity: 0;
          transform: scale(0);
        }
        
        .header__menu-toggle--open .header__menu-toggle-line:nth-child(3) {
          transform: rotate(-45deg) translate(6px, -6px);
          background: #00f078;
        }

        /* Responsive Design */
        @media (max-width: 1200px) {
          .header__container {
            padding: 0.5rem 1.25rem;
            max-width: 100%;
          }
          
          .nav-section {
            gap: 28px;
          }
          
          .nav-section a {
            font-size: 0.85rem;
          }
        }
        
        @media (max-width: 1024px) {
          .header__container {
            padding: 0.5rem 1rem;
          }
          
          .nav-section {
            gap: 24px;
          }
          
          .nav-section a {
            font-size: 0.8rem;
            padding: 1.5rem 0;
          }
          
          .auth-section {
            gap: 8px;
          }
          
          .login-btn,
          .signup-btn {
            padding: 0.7rem 1.3rem;
            font-size: 0.85rem;
          }
        }
        
        @media (max-width: 768px) {
          .header {
            backdrop-filter: blur(10px);
            z-index: 1000;
          }

          .header__container {
            padding: 0.5rem 1rem;
            min-height: 50px;
            justify-content: space-between;
            gap: 0;
          }

          .logo-section {
            flex: 0 0 auto;
            z-index: 1001;
            position: relative;
          }

          .auth-section {
            display: flex;
            align-items: center;
            gap: 8px;
            order: 2;
          }

          .user-profile-container {
            margin-right: 0;
          }
          
          .nav-section {
            position: fixed;
            top: 0;
            left: 0;
            right: 0;
            bottom: 0;
            width: 100vw;
            height: 100vh;
            background: linear-gradient(135deg, rgba(0, 26, 10, 0.99) 0%, rgba(0, 0, 0, 0.98) 100%);
            backdrop-filter: blur(25px);
            padding: 5rem 1.5rem 2.5rem 1.5rem;
            flex-direction: column;
            justify-content: flex-start;
            gap: 0.75rem;
            transform: translateX(100%) scale(0.9);
            opacity: 0;
            visibility: hidden;
            transition: all 0.5s cubic-bezier(0.25, 0.46, 0.45, 0.94);
            z-index: 9999;
            overflow-y: auto;
            overflow-x: hidden;
          }
          
          .nav-section.open {
            transform: translateX(0) scale(1);
            opacity: 1;
            visibility: visible;
          }
          
          .nav-section a,
          .nav-link {
            font-size: 1.2rem;
            font-weight: 600;
            padding: 1.25rem 2rem;
            width: 100%;
            text-align: center;
            border-radius: 16px;
            background: rgba(255, 255, 255, 0.03);
            border: 1px solid rgba(255, 255, 255, 0.08);
            margin: 0.5rem 0;
            transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
            position: relative;
            overflow: hidden;
            height: auto;
          }
          
          .nav-section a:hover,
          .nav-link:hover {
            background: rgba(0, 240, 120, 0.12);
            border-color: rgba(0, 240, 120, 0.4);
            transform: translateY(-3px) scale(1.02);
            box-shadow: 0 8px 25px rgba(0, 240, 120, 0.25);
          }
          
          .nav-link--active {
            background: rgba(0, 240, 120, 0.2);
            border-color: rgba(0, 240, 120, 0.6);
            color: #ffffff;
            font-weight: 700;
            box-shadow: 0 4px 15px rgba(0, 240, 120, 0.3);
          }
          
          .header__menu-toggle {
            display: flex;
            margin-left: 0;
            order: 3;
            z-index: 10000;
            position: relative;
          }
        }

        @media (max-width: 500px) {
          .auth-section {
            gap: 6px;
          }

          .header__menu-toggle {
            width: 40px;
            height: 40px;
          }

          .header__menu-toggle-line {
            width: 18px;
          }
        }

        @media (max-width: 400px) {
          .auth-section {
            gap: 4px;
          }

          .header__menu-toggle {
            width: 38px;
            height: 38px;
          }

          .header__menu-toggle-line {
            width: 16px;
          }
        }

        @media (max-width: 300px) {
          .auth-section {
            gap: 2px;
          }

          .header__menu-toggle {
            width: 36px;
            height: 36px;
          }

          .header__menu-toggle-line {
            width: 14px;
          }
        }
        
        @media (max-width: 480px) {
          .header__container {
            padding: 0.5rem 0.75rem;
            min-height: 54px;
          }

          .nav-section {
            padding: 4rem 1rem 1.75rem 1rem;
            gap: 0.375rem;
          }

          .nav-section a {
            font-size: 1rem;
            padding: 1rem 1.5rem;
            margin: 0.25rem 0;
            border-radius: 12px;
          }

          .auth-section {
            gap: 0.25rem;
          }

          .login-btn {
            padding: 0.55rem 0.85rem;
            font-size: 0.7rem;
            gap: 0.25rem;
          }

          .signup-btn {
            padding: 0.55rem 0.95rem;
            font-size: 0.7rem;
          }

          .header__menu-toggle {
            width: 38px;
            height: 38px;
            margin-left: 0.375rem;
          }

          .header__menu-toggle-line {
            width: 16px;
            height: 1.5px;
          }
        }

        @media (max-width: 410px) {
          .signup-btn {
            display: none;
          }
        }

        /* Hide signup in navigation by default (shows only on mobile) */
        .mobile-signup-link {
          display: none;
        }

        /* Show signup in hamburger menu only on screens ≤ 410px */
        @media (max-width: 410px) {
          .mobile-signup-link {
            display: flex;
          }
        }

        /* Hide signup in navigation on screens > 768px */
        @media (min-width: 769px) {
          .mobile-signup-link {
            display: none !important;
          }
        }
      `}} />

      <header className={`header ${isScrolled ? 'header--scrolled' : ''} ${!show ? 'header--hidden' : ''}`}>
        <div className="header__container">
          {/* Section 1 - Logo Div (Left) */}
          <div className="logo-section">
            <Link href="/" onClick={handleNavClick}>
              <img 
                src="/images/logo.svg"
                alt="XploitEye Logo"
                className="header__logo-image"
              />
            </Link>
          </div>

          {/* Section 2 - Navigation Div (Center) */}
          <div className={`nav-section ${isMenuOpen ? 'open' : ''}`}>
            {navigationLinks.map((link, index) => (
              link.path === '#' ? (
                <button
                  key={index}
                  className="nav-link"
                  onClick={handleNavClick}
                >
                  {link.name}
                </button>
              ) : (
                <Link
                  key={index}
                  href={link.path}
                  className={`nav-link ${router.pathname === link.path ? 'nav-link--active' : ''}`}
                  onClick={handleNavClick}
                >
                  {link.name}
                </Link>
              )
            ))}
            <Link
              href="/signup"
              className="nav-link mobile-signup-link"
              onClick={handleNavClick}
            >
              Sign Up
            </Link>
          </div>

          {/* Section 3 - Auth Buttons (Right) */}
          <div className="auth-section">
            {isAuthenticated && user ? (
              <div className="user-profile-container" ref={userMenuRef}>
                <button className="user-profile-button" onClick={toggleUserMenu}>
                  {/* User Avatar */}
                  {user.id ? (
                    <img
                      src={`http://localhost:8000/auth/profile-image/${user.id}`}
                      alt={user.name || user.username}
                      className="user-avatar"
                      onError={(e) => {
                        // Fallback to placeholder if image fails to load
                        const target = e.target as HTMLImageElement;
                        target.style.display = 'none';
                        const placeholder = target.nextElementSibling as HTMLElement;
                        if (placeholder) placeholder.style.display = 'flex';
                      }}
                    />
                  ) : null}
                  <div className="user-avatar-placeholder" style={{ display: user.id ? 'none' : 'flex' }}>
                    {(user.name || user.username || 'U').charAt(0).toUpperCase()}
                  </div>

                  {/* User Name */}
                  <span className="user-name-text">
                    {user.name || user.username}
                  </span>

                  {/* Dropdown Arrow */}
                  <svg
                    className={`user-dropdown-arrow ${isUserMenuOpen ? 'open' : ''}`}
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <polyline points="6 9 12 15 18 9" />
                  </svg>
                </button>

                {/* Dropdown Menu */}
                <div className={`user-dropdown-menu ${isUserMenuOpen ? 'open' : ''}`}>
                  {/* User Info Header */}
                  <div className="user-dropdown-header">
                    <div className="user-dropdown-name">{user.name || user.username}</div>
                    <div className="user-dropdown-email">{user.email}</div>
                  </div>

                  {/* Menu Items */}
                  <Link href="/dashboard" className="user-dropdown-item" onClick={() => setIsUserMenuOpen(false)}>
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <rect x="3" y="3" width="7" height="9" strokeLinecap="round" strokeLinejoin="round"/>
                      <rect x="14" y="3" width="7" height="5" strokeLinecap="round" strokeLinejoin="round"/>
                      <rect x="14" y="12" width="7" height="9" strokeLinecap="round" strokeLinejoin="round"/>
                      <rect x="3" y="16" width="7" height="5" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                    Dashboard
                  </Link>

                  <Link href="/dashboard/settings" className="user-dropdown-item" onClick={() => setIsUserMenuOpen(false)}>
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <circle cx="12" cy="12" r="3" strokeLinecap="round" strokeLinejoin="round"/>
                      <path d="M12 1v6m0 6v6M5.64 5.64l4.24 4.24m4.24 4.24l4.24 4.24M1 12h6m6 0h6M5.64 18.36l4.24-4.24m4.24-4.24l4.24-4.24" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                    Settings
                  </Link>

                  <div className="user-dropdown-divider" />

                  <button className="user-dropdown-item user-dropdown-logout" onClick={handleLogout}>
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" strokeLinecap="round" strokeLinejoin="round"/>
                      <polyline points="16 17 21 12 16 7" strokeLinecap="round" strokeLinejoin="round"/>
                      <line x1="21" y1="12" x2="9" y2="12" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                    Logout
                  </button>
                </div>
              </div>
            ) : (
              <>
                <Link href="/signin" className="login-btn" onClick={handleNavClick}>
                  <svg className="user-icon" width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                    <circle cx="12" cy="7" r="4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                  Login
                </Link>
                <Link href="/signup" className="signup-btn" onClick={handleNavClick}>Sign Up</Link>
              </>
            )}
          </div>

          {/* Mobile Menu Toggle - End of Header */}
          <button 
            className={`header__menu-toggle ${isMenuOpen ? 'header__menu-toggle--open' : ''}`}
            onClick={toggleMenu}
            aria-label="Toggle navigation menu"
            aria-expanded={isMenuOpen}
          >
            <span className="header__menu-toggle-line"></span>
            <span className="header__menu-toggle-line"></span>
            <span className="header__menu-toggle-line"></span>
          </button>
        </div>
      </header>
    </>
  );
}