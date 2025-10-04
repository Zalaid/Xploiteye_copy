import React, { useState, useEffect, useRef } from 'react';
import { motion, useMotionValue, useTransform } from 'framer-motion';
import Lottie from 'lottie-react';
import { useRouter } from 'next/router';

export default function Home() {
  const router = useRouter();
  const [animationData, setAnimationData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [windowWidth, setWindowWidth] = useState(typeof window !== 'undefined' ? window.innerWidth : 1200);
  
  // Ref to access the Lottie animation instance for frame syncing
  const lottieRef = useRef<any>(null);
  // Progress (0..1) synced with Lottie current frame
  const progress = useMotionValue(0);

  // Map progress -> transforms for the eye icon (tweakable keyframes)
  const eyeTranslateX = useTransform(progress, [0, 0.25, 0.5, 0.75, 1], [-70, -40, -30, -20, -10]);
  const eyeTranslateY = useTransform(progress, [0, 0.25, 0.5, 0.75, 1], [7, -3, -8, -3, 5]);
  const eyeRotate = useTransform(progress, [0, 0.5, 1], [-8, 0, 6]);
  const eyeScale = useTransform(progress, [0, 0.5, 1], [0.85, 1.15, 0.95]);

  const updateEyePosition = () => {
    if (typeof window === 'undefined' || typeof document === 'undefined') return;
    
    const width = window.innerWidth;
    const root = document.documentElement;

    if (width >= 1600) {
      root.style.setProperty('--eye-top-position', '27%');
      root.style.setProperty('--eye-left-position', '47%');
      root.style.setProperty('--eye-width', 'clamp(85px, 15vw, 192px)');
    } else if (width >= 1500) {
      root.style.setProperty('--eye-top-position', '27%');
      root.style.setProperty('--eye-left-position', '46%');
      root.style.setProperty('--eye-width', 'clamp(85px, 15vw, 192px)');
    } else if (width >= 1491 && width <= 1498) {
      root.style.setProperty('--eye-top-position', '27%');
      root.style.setProperty('--eye-left-position', '47%');
      root.style.setProperty('--eye-width', 'clamp(85px, 15vw, 186px)');
    } else if (width >= 1477 && width <= 1490) {
      root.style.setProperty('--eye-top-position', '27%');
      root.style.setProperty('--eye-left-position', '47%');
      root.style.setProperty('--eye-width', 'clamp(85px, 15vw, 184px)');
    } else if (width >= 1453 && width <= 1476) {
      root.style.setProperty('--eye-top-position', '26%');
      root.style.setProperty('--eye-left-position', '46%');
      root.style.setProperty('--eye-width', 'clamp(85px, 15vw, 181px)');
    } else if (width >= 1436 && width <= 1452) {
      root.style.setProperty('--eye-top-position', '27%');
      root.style.setProperty('--eye-left-position', '47%');
      root.style.setProperty('--eye-width', 'clamp(85px, 15vw, 178px)');
    } else if (width >= 1421 && width <= 1435) {
      root.style.setProperty('--eye-top-position', '26%');
      root.style.setProperty('--eye-left-position', '47%');
      root.style.setProperty('--eye-width', 'clamp(85px, 15vw, 175px)');
    } else if (width >= 1406 && width <= 1420) {
      root.style.setProperty('--eye-top-position', '26%');
      root.style.setProperty('--eye-left-position', '47%');
      root.style.setProperty('--eye-width', 'clamp(85px, 15vw, 173px)');
    } else if (width >= 1391 && width <= 1405) {
      root.style.setProperty('--eye-top-position', '26%');
      root.style.setProperty('--eye-left-position', '47%');
      root.style.setProperty('--eye-width', 'clamp(85px, 15vw, 171px)');
    } else if (width >= 1376 && width <= 1390) {
      root.style.setProperty('--eye-top-position', '26%');
      root.style.setProperty('--eye-left-position', '47%');
      root.style.setProperty('--eye-width', 'clamp(85px, 15vw, 169px)');
    } else if (width >= 1367 && width <= 1375) {
      root.style.setProperty('--eye-top-position', '26%');
      root.style.setProperty('--eye-left-position', '46%');
      root.style.setProperty('--eye-width', 'clamp(85px, 15vw, 166px)');
    } else if (width >= 1348 && width <= 1366) {
      root.style.setProperty('--eye-top-position', '26%');
      root.style.setProperty('--eye-left-position', '46%');
      root.style.setProperty('--eye-width', 'clamp(80px, 15vw, 163px)');
    } else if (width >= 1310 && width <= 1347) {
      root.style.setProperty('--eye-top-position', '26%');
      root.style.setProperty('--eye-left-position', '46%');
      root.style.setProperty('--eye-width', 'clamp(80px, 15vw, 158px)');
    } else if (width >= 1200 && width <= 1309) {
      root.style.setProperty('--eye-top-position', '26%');
      root.style.setProperty('--eye-left-position', '46%');
      root.style.setProperty('--eye-width', 'clamp(80px, 15vw, 152px)');
    } else if (width >= 1100 && width <= 1199) {
      root.style.setProperty('--eye-top-position', '26%');
      root.style.setProperty('--eye-left-position', '46%');
      root.style.setProperty('--eye-width', 'clamp(75px, 15vw, 147px)');
    } else if (width >= 1025 && width <= 1099) {
      root.style.setProperty('--eye-top-position', '24%');
      root.style.setProperty('--eye-left-position', '46%');
      root.style.setProperty('--eye-width', 'clamp(71px, 14vw, 141px)');
    } else if (width >= 1000 && width <= 1024) {
      root.style.setProperty('--eye-top-position', '23%');
      root.style.setProperty('--eye-left-position', '46%');
      root.style.setProperty('--eye-width', 'clamp(70px, 14vw, 141px)');
    } else if (width >= 900 && width <= 999) {
      root.style.setProperty('--eye-top-position', '18%');
      root.style.setProperty('--eye-left-position', '46%');
      root.style.setProperty('--eye-width', 'clamp(70px, 14vw, 141px)');
    } else if (width >= 800 && width <= 899) {
      root.style.setProperty('--eye-top-position', '26%');
      root.style.setProperty('--eye-left-position', '47%');
      root.style.setProperty('--eye-width', 'clamp(50px, 26vw, 133px)');
    } else if (width >= 700 && width <= 799) {
      root.style.setProperty('--eye-top-position', '26%');
      root.style.setProperty('--eye-left-position', '46%');
      root.style.setProperty('--eye-width', 'clamp(50px, 18vw, 120px)');
    } else if (width >= 600 && width <= 699) {
      root.style.setProperty('--eye-top-position', '25%');
      root.style.setProperty('--eye-left-position', '45%');
      root.style.setProperty('--eye-width', 'clamp(50px, 26vw, 110px)');
    } else if (width >= 500 && width <= 599) {
      root.style.setProperty('--eye-top-position', '21%');
      root.style.setProperty('--eye-left-position', '45%');
      root.style.setProperty('--eye-width', 'clamp(50px, 26vw, 100px)');
    } else if (width >= 400 && width <= 499) {
      root.style.setProperty('--eye-top-position', '26%');
      root.style.setProperty('--eye-left-position', '53%');
      root.style.setProperty('--eye-width', 'clamp(50px, 26vw, 75px)');
    } else {
      root.style.setProperty('--eye-top-position', '25%');
      root.style.setProperty('--eye-left-position', '53%');
      root.style.setProperty('--eye-width', 'clamp(50px, 26vw, 62px)');
    }
  };

  // Set up resize listener for responsive eye positioning
  useEffect(() => {
    if (typeof window === 'undefined') return;

    // Initial positioning
    updateEyePosition();

    const handleResize = () => {
      setWindowWidth(window.innerWidth);
      updateEyePosition();
    };

    window.addEventListener('resize', handleResize);

    // Force update after a short delay to ensure DOM is ready
    const timeoutId = setTimeout(() => {
      updateEyePosition();
    }, 100);

    return () => {
      window.removeEventListener('resize', handleResize);
      clearTimeout(timeoutId);
    };
  }, []);

  // Sync animation progress with Lottie frames
  useEffect(() => {
    const inst = lottieRef.current?.animationItem || lottieRef.current;
    if (!inst || !inst.addEventListener) return;

    const handleEnterFrame = () => {
      try {
        const totalFrames = inst.totalFrames || inst.getDuration(true);
        const currentFrame = inst.currentFrame || 0;
        if (totalFrames && totalFrames > 0) {
          progress.set(currentFrame / totalFrames);
        }
      } catch {}
    };

    const timeoutId = setTimeout(() => {
      if (!inst || !inst.addEventListener) return;
      
      try {
        inst.addEventListener('enterFrame', handleEnterFrame);
      } catch (error) {
        // Silently handle errors
      }
    }, 100);

    return () => {
      clearTimeout(timeoutId);
      if (inst && inst.removeEventListener) {
        try {
          inst.removeEventListener('enterFrame', handleEnterFrame);
        } catch {}
      }
    };
  }, [animationData, progress]);

  // Load animation data
  useEffect(() => {
    const loadAnimation = async () => {
      try {
        setLoading(true);
        setError(null);
        
        const response = await fetch('/animations/endor-hero-animation.json');
        if (!response.ok) {
          throw new Error(`Failed to load animation: ${response.statusText}`);
        }
        
        const data = await response.json();
        
        // Process animation to hide E letter and pill
        const cloned = JSON.parse(JSON.stringify(data));

        const processLayers = (layers: any) => {
          if (!Array.isArray(layers)) return;
          
          layers.forEach((layer) => {
            const name = (layer && layer.nm) || '';
            
            // Hide E letter
            const isText = layer && layer.ty === 5;
            const hasEName = /(^|\b)E(\b|$)/i.test(name) || /letter[-_ ]?e/i.test(name);
            const isLogoLayer = /^logo$/i.test(name);
            let isEText = false;
            
            try {
              const txt = layer?.t?.d?.k?.[0]?.s?.t;
              if (typeof txt === 'string' && txt.trim().toUpperCase() === 'E') {
                isEText = true;
              }
            } catch {}
            
            if ((isText && isEText) || (hasEName && isText) || isLogoLayer) {
              layer.hd = true;
              
              if (layer.ks && layer.ks.o) {
                if (typeof layer.ks.o.k === 'number') {
                  layer.ks.o.k = 0;
                } else if (Array.isArray(layer.ks.o.k)) {
                  layer.ks.o.k = layer.ks.o.k.map((kf: any) => ({ ...kf, s: [0] }));
                }
              }
            }
            
            // Hide pill layer
            const isPillLayer = /pill/i.test(name);
            if (isPillLayer) {
              layer.hd = true;
              
              if (layer.ks && layer.ks.o) {
                if (typeof layer.ks.o.k === 'number') {
                  layer.ks.o.k = 0;
                } else if (Array.isArray(layer.ks.o.k)) {
                  layer.ks.o.k = layer.ks.o.k.map((kf: any) => ({ ...kf, s: [0] }));
                }
              }
            }
          });
        };

        if (cloned.layers) {
          processLayers(cloned.layers);
        }
        
        if (cloned.assets) {
          cloned.assets.forEach((asset: any) => {
            if (asset.layers) {
              processLayers(asset.layers);
            }
          });
        }
        
        setAnimationData(cloned);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load animation');
      } finally {
        setLoading(false);
      }
    };

    loadAnimation();
  }, []);

  return (
    <>
      {/* Embedded Styles */}
      <style dangerouslySetInnerHTML={{ __html: `
        /* Global overflow fixes */
        html, body {
          overflow-x: hidden !important;
          max-width: 100vw !important;
          width: 100% !important;
          background-color: black !important;
          margin: 0 !important;
          padding: 0 !important;
        }

        * {
          box-sizing: border-box;
          margin: 0;
          padding: 0;
        }

        body, #__next, #root {
          margin: 0 !important;
          padding: 0 !important;
        }

        /* Home Page Styles */
        .home-page {
          background-color: black;
          min-height: 100vh;
          color: white;
          overflow-x: hidden;
          width: 100%;
          max-width: 100vw;
          padding-top: 70px;
        }

        /* Desktop Section - Responsive for all devices */
        .desktop-section {
          width: 100%;
          max-width: 1533px;
          min-height: 400px;
          background-color: black;
          margin: 0 auto;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: flex-start;
          padding: 30px 1rem 50px 1rem;
        }

        /* Responsive adjustments for screens below 900px */
        @media (max-width: 900px) {
          .desktop-section {
            min-height: 450px;
            padding: 30px 1rem 60px 1rem;
          }
        }

        /* Height adjustment for screens below 770px */
        @media (max-width: 770px) {
          .desktop-section {
            min-height: 380px;
            padding: 20px 1rem 50px 1rem;
          }
        }

        /* Additional responsive adjustments for smaller screens */
        @media (max-width: 768px) {
          .desktop-section {
            padding-top: 20px;
            padding-bottom: 20px;
          }
        }

        /* Height adjustment for screens below 700px */
        @media (max-width: 700px) {
          .desktop-section {
            min-height: 400px;
            padding: 20px 1rem 60px 1rem;
          }
        }

        /* Height adjustment for screens below 530px */
        @media (max-width: 530px) {
          .desktop-section {
            min-height: 420px;
            padding: 20px 1rem 70px 1rem;
          }
        }

        .hero-text-content {
          text-align: center;
        }

        .hero-main-title {
          font-size: 3rem;
          font-weight: 600;
          line-height: 1.2;
          margin-bottom: 1rem;
          text-align: center;
        }

        .title-white {
          color: white;
        }

        .title-gradient {
          background-image: linear-gradient(98deg, #00f078, #3fe1f3 58%, #9f69f7);
          -webkit-text-fill-color: transparent;
          -webkit-background-clip: text;
          background-clip: text;
        }

        .hero-description {
          font-size: 1.25rem;
          margin-bottom: 0;
          font-weight: 300;
          color: rgba(255, 255, 255, 0.95);
          max-width: 800px;
          margin: 0 auto;
          text-shadow: 0 0 10px rgba(255, 255, 255, 0.3);
        }

        /* Container */
        .container {
          width: 100%;
          max-width: 1200px;
          margin: 0 auto;
          padding: 0 2rem;
        }

        /* Mobile and tablet responsive styles */
        @media (max-width: 1024px) {
          .container {
            padding: 0 1rem;
            max-width: 100%;
          }
        }

        /* Features Overview Section */
        .features-overview {
          padding: 4rem 0;
          background: black;
          overflow: hidden;
          position: relative;
        }

        .features-carousel-container {
          width: 100%;
          max-width: 1200px;
          margin: 0 auto;
          position: relative;
          display: flex;
          justify-content: center;
          align-items: center;
          overflow: hidden;
        }

        .features-carousel-container::before {
          content: '';
          position: absolute;
          left: 0;
          top: 0;
          width: 50px;
          height: 100%;
          background: linear-gradient(to right, black, transparent);
          z-index: 3;
          pointer-events: none;
        }

        .features-carousel-container::after {
          content: '';
          position: absolute;
          right: 0;
          top: 0;
          width: 50px;
          height: 100%;
          background: linear-gradient(to left, black, transparent);
          z-index: 3;
          pointer-events: none;
        }

        .features-carousel {
          display: flex;
          animation: carousel-slide 15s linear infinite;
          gap: 3rem;
          align-items: center;
        }

        /* Responsive animation speeds */
        @media (max-width: 700px) {
          .features-carousel {
            animation-duration: 20s;
          }
        }

        @media (max-width: 600px) {
          .features-carousel {
            animation-duration: 23s;
          }
        }

        @media (max-width: 500px) {
          .features-carousel {
            animation-duration: 25s;
          }
        }

        @media (max-width: 400px) {
          .features-carousel {
            animation-duration: 30s;
          }
        }

        @media (max-width: 300px) {
          .features-carousel {
            animation-duration: 35s;
          }
        }

        .feature-card {
          background: rgba(13, 13, 13, 0.8);
          border: 1px solid rgba(0, 240, 120, 0.1);
          border-radius: 16px;
          padding: 2.5rem 2rem;
          text-align: left;
          transition: all 0.4s ease;
          position: relative;
          overflow: hidden;
          backdrop-filter: blur(15px);
          flex: 0 0 350px;
          height: 350px;
          display: flex;
          flex-direction: column;
          justify-content: flex-start;
          box-shadow: 0 4px 20px rgba(0, 0, 0, 0.3);
        }

        .feature-card::before {
          content: '';
          position: absolute;
          top: 0;
          left: 0;
          width: 100%;
          height: 3px;
          background: linear-gradient(90deg, #00f078 0%, transparent 100%);
          opacity: 0.6;
          transition: opacity 0.3s ease;
        }

        .feature-card:hover::before {
          opacity: 1;
        }

        /* Dynamic center card highlighting - 3rd card in view */
        .feature-card:nth-child(3),
        .feature-card:nth-child(8) {
          transform: scale(1.05);
          border-color: rgba(0, 240, 120, 0.25);
          border-width: 1px;
          box-shadow: 0 8px 32px rgba(0, 240, 120, 0.12), 0 0 0 1px rgba(0, 240, 120, 0.08);
          z-index: 2;
          background: rgba(13, 13, 13, 0.9);
        }

        .feature-card:nth-child(3) .feature-icon,
        .feature-card:nth-child(3) h3,
        .feature-card:nth-child(3) p,
        .feature-card:nth-child(8) .feature-icon,
        .feature-card:nth-child(8) h3,
        .feature-card:nth-child(8) p {
          transform: scale(0.87);
        }

        .feature-card:hover {
          transform: translateY(-8px);
          border-color: rgba(0, 240, 120, 0.3);
          box-shadow: 0 12px 40px rgba(0, 240, 120, 0.15), 0 0 0 1px rgba(0, 240, 120, 0.1);
          background: rgba(13, 13, 13, 0.9);
        }

        .feature-card:nth-child(3):hover,
        .feature-card:nth-child(8):hover {
          transform: scale(1.05) translateY(-8px);
        }

        .feature-icon {
          width: 3.5rem;
          height: 3.5rem;
          margin: 0 0 2rem 0;
          display: block;
          fill: #00f078;
          transition: all 0.3s ease;
          filter: drop-shadow(0 2px 8px rgba(0, 240, 120, 0.3));
        }

        .feature-card:hover .feature-icon {
          fill: #00f078;
          transform: scale(1.05);
        }

        .feature-card h3 {
          font-size: 1.4rem;
          font-weight: 700;
          margin-bottom: 1.5rem;
          color: #ffffff;
          letter-spacing: -0.02em;
          line-height: 1.3;
        }

        .feature-card p {
          color: rgba(255, 255, 255, 0.75);
          line-height: 1.65;
          font-size: 0.95rem;
          font-weight: 400;
          margin: 0;
        }

        @keyframes carousel-slide {
          0% {
            transform: translateX(0);
          }
          100% {
            transform: translateX(calc(-5 * (350px + 3rem)));
          }
        }


        .feature-card:nth-child(3) .feature-icon,
        .feature-card:nth-child(3) h3,
        .feature-card:nth-child(3) p,
        .feature-card:nth-child(8) .feature-icon,
        .feature-card:nth-child(8) h3,
        .feature-card:nth-child(8) p {
          transform: scale(0.95);
        }

        /* Duplicate cards for seamless loop */
        .features-carousel::after {
          content: '';
          position: absolute;
          top: 0;
          left: 100%;
          width: 100%;
          height: 100%;
          background: transparent;
        }

        @media (max-width: 768px) {
          .feature-card {
            flex: 0 0 280px;
            height: 280px;
            padding: 1rem;
          }

          .feature-card.center-card {
            transform: scale(1.1);
          }

          .feature-card.center-card .feature-icon,
          .feature-card.center-card h3,
          .feature-card.center-card p {
            transform: scale(0.91);
          }

          .feature-card.center-card:hover {
            transform: scale(1.1) translateY(-5px);
          }

          .feature-icon {
            font-size: 2.5rem;
            margin-bottom: 1rem;
          }

          .feature-card h3 {
            font-size: 1.1rem;
          }

          .feature-card p {
            font-size: 0.9rem;
          }
        }

        /* Lottie Hero Section */
        .lottie-hero-section {
          max-width: 100%;
          width: 100%;
          position: relative;
          overflow: hidden;
        }

        /* Ensure animation covers full width */
        .lottie-hero-animation {
          width: 100% !important;
          height: 100% !important;
        }

        /* Mobile responsive adjustments for lottie hero section */
        @media (max-width: 768px) {
          .lottie-hero-section {
            margin-top: 0px !important;
          }
        }

        /* Hero Action Buttons */
        .hero-actions {
          display: flex;
          gap: 1.5rem;
          margin-top: 1rem;
          justify-content: center;
          align-items: center;
        }

        .btn-primary-glow {
          background: linear-gradient(135deg, #00f078, #3fe1f3);
          color: black;
          border: none;
          padding: 1rem 2rem;
          border-radius: 50px;
          font-size: 1.1rem;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.3s ease;
          position: relative;
          overflow: hidden;
          text-transform: uppercase;
          letter-spacing: 1px;
        }

        .btn-primary-glow::before {
          content: '';
          position: absolute;
          top: 0;
          left: -100%;
          width: 100%;
          height: 100%;
          background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.3), transparent);
          transition: left 0.7s ease;
        }

        .btn-primary-glow:hover::before {
          left: 100%;
        }

        .btn-primary-glow:hover {
          transform: translateY(-2px);
          box-shadow: 0 0 30px rgba(0, 240, 120, 0.6), 0 5px 20px rgba(0, 240, 120, 0.3);
        }

        .btn-secondary-outline {
          background: transparent;
          color: white;
          border: 2px solid #00f078;
          padding: 1rem 2rem;
          border-radius: 50px;
          font-size: 1.1rem;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.3s ease;
          text-transform: uppercase;
          letter-spacing: 1px;
        }

        .btn-secondary-outline:hover {
          background: #00f078;
          color: black;
          transform: translateY(-2px);
          box-shadow: 0 0 20px rgba(0, 240, 120, 0.4);
        }

        /* Loading and Error States */
        .endor-animation-loading, .endor-animation-error {
          display: flex;
          align-items: center;
          justify-content: center;
          background: black;
          color: white;
        }

        .loading-spinner {
          text-align: center;
        }

        .spinner {
          width: 40px;
          height: 40px;
          border: 4px solid rgba(0, 240, 120, 0.1);
          border-top: 4px solid #00f078;
          border-radius: 50%;
          animation: spin 1s linear infinite;
          margin: 0 auto 1rem;
        }

        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }

        .error-message {
          text-align: center;
          color: #ff6b6b;
        }

        /* Lottie Animation Styles */
        .responsive-lottie-container {
          position: relative !important;
          left: 50% !important;
          transform: translateX(-50%) !important;
          height: calc(252px + (100vw - 770px) * 0.33) !important;
        }

        /* Responsive SVG widths based on screen size */
        @media (max-width: 300px) {
          .responsive-lottie-container {
            width: 250vw !important;
            max-width: 1000px !important;
            height: 250px !important;
          }
        }

        @media (min-width: 301px) and (max-width: 400px) {
          .responsive-lottie-container {
            width: 250vw !important;
            max-width: 1000px !important;
            height: 250px !important;
          }
        }

        @media (min-width: 401px) and (max-width: 500px) {
          .responsive-lottie-container {
            width: 220vw !important;
            max-width: 1100px !important;
            height: 300px !important;
          }
        }

        @media (min-width: 501px) and (max-width: 600px) {
          .responsive-lottie-container {
            width: 200vw !important;
            max-width: 1200px !important;
          }
        }

        @media (min-width: 601px) and (max-width: 700px) {
          .responsive-lottie-container {
            width: 180vw !important;
            max-width: 1260px !important;
          }
        }

        @media (min-width: 701px) and (max-width: 990px) {
          .responsive-lottie-container {
            width: 150vw !important;
            max-width: 1485px !important;
          }
        }

        @media (min-width: 991px) {
          .responsive-lottie-container {
            width: 120vw !important;
            max-width: 1920px !important;
            height: calc(288px + (100vw - 1100px) * 0.26) !important;
          }
        }

        .responsive-lottie-container svg {
          width: 100% !important;
          height: 100% !important;
          max-width: none !important;
          max-height: none !important;
        }

        @media (max-width: 300px) {
          .responsive-lottie-container svg {
            transform: scale(1.3) !important;
          }
        }

        @media (min-width: 301px) and (max-width: 400px) {
          .responsive-lottie-container svg {
            transform: scale(1.4) !important;
          }
        }

        @media (min-width: 401px) and (max-width: 500px) {
          .responsive-lottie-container svg {
            transform: scale(1.4) !important;
          }
        }

        @media (min-width: 501px) and (max-width: 600px) {
          .responsive-lottie-container svg {
            transform: scale(1.3) !important;
          }
        }

        /* Processing Animation Box - Mobile Only */
        .mobile-processing-box {
          display: none;
        }

        @media (max-width: 500px) {
          .mobile-processing-box::before {
            content: '';
            position: absolute;
            width: 100%;
            height: 100%;
            top: 0;
            left: 0;
            background: radial-gradient(circle, rgba(255, 0, 0, 0.3) 0%, rgba(255, 0, 0, 0.15) 50%, transparent 100%);
            z-index: -1;
            filter: blur(20px);
          }

          .mobile-processing-box {
            display: flex;
            position: absolute;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            z-index: 10;
            background: linear-gradient(135deg, rgba(0, 0, 0, 0.98) 0%, rgba(0, 0, 0, 0.95) 100%);
            border: 1.5px solid rgba(0, 240, 120, 0.6);
            isolation: isolate;
            clip-path: polygon(
              8px 0,
              calc(100% - 8px) 0,
              100% 8px,
              100% calc(100% - 8px),
              calc(100% - 8px) 100%,
              8px 100%,
              0 calc(100% - 8px),
              0 8px
            );
            padding: 22px 10px;
            flex-direction: column;
            align-items: center;
            gap: 14px;
            box-shadow:
              0 4px 20px rgba(0, 240, 120, 0.2),
              0 0 30px rgba(0, 240, 120, 0.15),
              inset 0 1px 0 rgba(0, 240, 120, 0.1);
            backdrop-filter: blur(12px);
            width: 60px;
            height: 103px;
          }

          .processing-title {
            display: none;
          }

          .processing-bar-container {
            width: 100%;
            height: 3px;
            background: rgba(255, 255, 255, 0.1);
            border-radius: 2px;
            overflow: hidden;
            position: relative;
          }

          .processing-bar {
            position: absolute;
            top: 0;
            left: 0;
            height: 100%;
            width: 40%;
            background: linear-gradient(90deg, transparent, #00f078, transparent);
            border-radius: 2px;
            animation: processing-slide 1.5s ease-in-out infinite;
          }

          @keyframes processing-slide {
            0% {
              left: -40%;
            }
            100% {
              left: 100%;
            }
          }

          .processing-dots {
            display: flex;
            gap: 5px;
          }

          .processing-dot {
            width: 5px;
            height: 5px;
            background: #00f078;
            border-radius: 50%;
            animation: processing-dot-pulse 1.4s ease-in-out infinite;
          }

          .processing-dot:nth-child(1) {
            animation-delay: 0s;
          }

          .processing-dot:nth-child(2) {
            animation-delay: 0.2s;
          }

          .processing-dot:nth-child(3) {
            animation-delay: 0.4s;
          }

          @keyframes processing-dot-pulse {
            0%, 100% {
              opacity: 0.3;
              transform: scale(0.8);
            }
            50% {
              opacity: 1;
              transform: scale(1.2);
            }
          }

          .processing-text {
            display: none;
          }

          .shield-icon {
            width: 52px;
            height: 52px;
            opacity: 1;
            filter: drop-shadow(0 0 6px rgba(0, 240, 120, 0.6)) drop-shadow(0 0 8px rgba(63, 225, 243, 0.4));
          }

          .pulse-line {
            position: absolute;
            width: 100%;
            height: 2px;
            background: #00f078;
            top: 50%;
            left: 0;
            transform: translateY(-50%);
            animation: pulse-move 1.5s ease-in-out infinite;
          }

          @keyframes pulse-move {
            0%, 100% {
              opacity: 0;
              transform: translateY(-50%) scaleX(0);
            }
            50% {
              opacity: 1;
              transform: translateY(-50%) scaleX(1);
            }
          }

          .shield-container {
            position: relative;
            display: flex;
            align-items: center;
            justify-content: center;
            flex: 1;
          }

          .rotating-ring {
            position: absolute;
            width: 35px;
            height: 35px;
            border: 2px solid transparent;
            border-top-color: #3fe1f3;
            border-right-color: #9f69f7;
            border-radius: 50%;
            animation: ring-rotate 2s linear infinite;
            opacity: 0.8;
          }

          .rotating-ring::before {
            content: '';
            position: absolute;
            width: 100%;
            height: 100%;
            border: 1px solid transparent;
            border-left-color: #00f078;
            border-bottom-color: #00f078;
            border-radius: 50%;
            animation: ring-rotate-reverse 3s linear infinite;
            opacity: 0.5;
          }

          @keyframes ring-rotate {
            0% {
              transform: rotate(0deg);
            }
            100% {
              transform: rotate(360deg);
            }
          }

          @keyframes ring-rotate-reverse {
            0% {
              transform: rotate(0deg);
            }
            100% {
              transform: rotate(-360deg);
            }
          }

          .processing-particle {
            position: absolute;
            width: 3px;
            height: 3px;
            border-radius: 50%;
            animation: particle-orbit 3s linear infinite;
            box-shadow: 0 0 4px currentColor;
          }

          .particle-1 {
            background: #00f078;
            animation-delay: 0s;
          }

          .particle-2 {
            background: #3fe1f3;
            animation-delay: 1s;
          }

          .particle-3 {
            background: #9f69f7;
            animation-delay: 2s;
          }

          @keyframes particle-orbit {
            0% {
              transform: rotate(0deg) translateX(20px) rotate(0deg);
              opacity: 0;
            }
            50% {
              opacity: 1;
            }
            100% {
              transform: rotate(360deg) translateX(20px) rotate(-360deg);
              opacity: 0;
            }
          }

          .status-indicators {
            display: flex;
            gap: 4px;
            margin-top: 8px;
          }

          .status-bar {
            width: 12px;
            height: 3px;
            border-radius: 2px;
            animation: status-pulse 1.5s ease-in-out infinite;
          }

          .status-bar:nth-child(1) {
            animation-delay: 0s;
            background: rgba(0, 240, 120, 0.3);
          }

          .status-bar:nth-child(2) {
            animation-delay: 0.2s;
            background: rgba(0, 240, 120, 0.3);
          }

          .status-bar:nth-child(3) {
            animation-delay: 0.4s;
            background: rgba(0, 240, 120, 0.3);
          }

          @keyframes status-pulse {
            0%, 100% {
              opacity: 0.3;
              box-shadow: none;
            }
            50% {
              opacity: 1;
              box-shadow: 0 0 8px currentColor;
            }
          }
        }

        @media (min-width: 401px) and (max-width: 500px) {
          .mobile-processing-box {
            width: 55px;
          }
        }

        @media (max-width: 400px) {
          .mobile-processing-box {
            width: 50px;
          }
        }

        /* Eye breathing wrapper */
        .eye-breathing-wrapper {
          position: absolute;
          top: var(--eye-top-position, 42%);
          left: var(--eye-left-position, 48%);
          width: var(--eye-width, clamp(80px, 15vw, 150px));
          height: var(--eye-width, clamp(80px, 15vw, 150px));
          transform: translate(-50%, -50%);
          transform-origin: center;
          z-index: 10;
          pointer-events: none;
          animation: eyeBreathing 4s ease-in-out infinite;
        }

        @media (max-width: 500px) {
          .eye-breathing-wrapper {
            display: none;
          }
        }

        /* Eye overlay styles */
        .endor-eye-overlay {
          position: absolute;
          top: 50%;
          left: 50%;
          width: 100%;
          height: auto;
          transform: translate(-50%, -50%);
          transform-origin: center;
          pointer-events: none;
          animation: eyeGlow 3s ease-in-out infinite;
        }

        /* Human-like eye breathing animation */
        @keyframes eyeBreathing {
          0%, 100% {
            transform: translate(-50%, -50%) scale(1);
          }
          50% {
            transform: translate(-50%, -50%) scale(1.06);
          }
        }

        @keyframes eyeGlow {
          0%, 100% {
            filter: drop-shadow(0 0 10px rgba(255, 0, 0, 0.15)) drop-shadow(0 0 20px rgba(255, 0, 0, 0.1)) drop-shadow(0 0 30px rgba(255, 0, 0, 0.05));
          }
          50% {
            filter: drop-shadow(0 0 15px rgba(255, 0, 0, 0.25)) drop-shadow(0 0 30px rgba(255, 0, 0, 0.15)) drop-shadow(0 0 45px rgba(255, 0, 0, 0.1));
          }
        }

        @media (max-width: 480px) {
          .container {
            padding: 0 1rem;
          }
          
          .hero-main-title {
            font-size: 2rem !important;
          }
          
          .hero-actions {
            flex-direction: column;
            gap: 1rem;
          }
          
          .btn-primary-glow,
          .btn-secondary-outline {
            padding: 0.8rem 1.5rem;
            font-size: 0.9rem;
            width: 100%;
            max-width: 280px;
          }
          
          .features-overview {
            padding: 2rem 0;
          }
          
          .features-grid {
            gap: 1rem;
            margin-top: 0.5rem;
          }
          
          .feature-card {
            padding: 1rem;
          }
        }

        /* Arc Section */
        .arc-wrapper {
          background: black;
          padding: 6rem 0 8rem 0;
          width: 100vw;
          position: relative;
          left: 50%;
          transform: translateX(-50%);
          overflow: hidden;
        }

        .semi-circle-arc {
          width: 100vw;
          height: 400px;
          position: relative;
          left: 50%;
          transform: translateX(-50%);
          display: flex;
          justify-content: center;
          align-items: center;
          overflow: visible;
          background: transparent;
        }

        .semi-circle-arc::before {
          content: '';
          position: absolute;
          width: 150vw;
          height: 150vw;
          top: -60px;
          left: 50%;
          transform: translateX(-50%);
          border-radius: 50%;
          background: linear-gradient(135deg, #00f078 0%, #3fe1f3 50%, #9f69f7 100%);
          box-shadow:
            0 0 20px rgba(0, 240, 120, 0.2),
            0 0 40px rgba(63, 225, 243, 0.1);
          animation: arc-glow 4s ease-in-out infinite;
        }

        .semi-circle-arc::after {
          content: '';
          position: absolute;
          width: calc(150vw - 20px);
          height: calc(150vw - 20px);
          top: -50px;
          left: 50%;
          transform: translateX(-50%);
          border-radius: 50%;
          background: black;
          z-index: 1;
        }

        .arc-content {
          position: relative;
          z-index: 2;
          color: white;
          text-align: center;
          padding: 2rem;
          max-width: 600px;
        }


        @keyframes arc-glow {
          0%, 100% {
            box-shadow: 
              0 0 20px rgba(0, 240, 120, 0.2),
              0 0 40px rgba(63, 225, 243, 0.1);
          }
          50% {
            box-shadow: 
              0 0 30px rgba(0, 240, 120, 0.3),
              0 0 60px rgba(63, 225, 243, 0.15);
          }
        }

        .arc-content h2 {
          font-size: 3rem;
          font-weight: 700;
          margin-bottom: 1rem;
          background: linear-gradient(135deg, #00f078 0%, #3fe1f3 50%, #9f69f7 100%);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
          text-shadow: 0 0 30px rgba(0, 240, 120, 0.5);
          letter-spacing: 2px;
        }

        .arc-content p {
          font-size: 1.2rem;
          font-weight: 300;
          color: rgba(255, 255, 255, 0.9);
          line-height: 1.6;
          text-shadow: 0 0 20px rgba(255, 255, 255, 0.3);
        }

        /* More granular responsive text adjustments */
        @media (max-width: 768px) {
          .arc-content {
            padding: 1rem;
            max-width: 85%;
          }
          .arc-content h2 {
            font-size: 2.5rem;
            letter-spacing: 1px;
            line-height: 1.2;
          }
          .arc-content p {
            font-size: 1rem;
            line-height: 1.5;
          }
        }

        @media (max-width: 650px) {
          .arc-content {
            padding: 0.8rem;
            max-width: 80%;
          }
          .arc-content h2 {
            font-size: 2rem;
            letter-spacing: 0.5px;
            margin-bottom: 0.8rem;
          }
          .arc-content p {
            font-size: 0.95rem;
            line-height: 1.4;
          }
        }

        @media (max-width: 550px) {
          .arc-content {
            padding: 0.6rem;
            max-width: 75%;
          }
          .arc-content h2 {
            font-size: 1.8rem;
            letter-spacing: 0px;
            margin-bottom: 0.6rem;
          }
          .arc-content p {
            font-size: 0.9rem;
            line-height: 1.3;
          }
        }

        @media (max-width: 480px) {
          .arc-content {
            padding: 0.5rem;
            max-width: 70%;
          }
          .arc-content h2 {
            font-size: 1.6rem;
            margin-bottom: 0.5rem;
          }
          .arc-content p {
            font-size: 0.85rem;
            line-height: 1.3;
          }
        }

        /* Mobile responsive adjustments for arc */
        @media (max-width: 768px) {
          .semi-circle-arc {
            height: 320px;
          }

          .semi-circle-arc::before {
            width: 120vw;
            height: 120vw;
            top: -10px;
          }

          .semi-circle-arc::after {
            width: calc(120vw - 16px);
            height: calc(120vw - 16px);
            top: -2px;
          }
        }

        @media (max-width: 650px) {
          .semi-circle-arc {
            height: 300px;
          }

          .semi-circle-arc::before {
            width: 110vw;
            height: 110vw;
            top: -15px;
          }

          .semi-circle-arc::after {
            width: calc(110vw - 16px);
            height: calc(110vw - 16px);
            top: -7px;
          }
        }

        @media (max-width: 550px) {
          .semi-circle-arc {
            height: 280px;
          }

          .semi-circle-arc::before {
            width: 105vw;
            height: 105vw;
            top: -20px;
          }

          .semi-circle-arc::after {
            width: calc(105vw - 16px);
            height: calc(105vw - 16px);
            top: -12px;
          }
        }

        @media (max-width: 480px) {
          .semi-circle-arc {
            height: 250px;
          }

          .semi-circle-arc::before {
            width: 100vw;
            height: 100vw;
            top: -30px;
          }

          .semi-circle-arc::after {
            width: calc(100vw - 16px);
            height: calc(100vw - 16px);
            top: -22px;
          }

          .arc-content h2 {
            font-size: 1.5rem;
          }

          .arc-content p {
            font-size: 0.9rem;
          }

          .arc-content {
            padding: 1rem;
          }
        }

        /* Quote Section */
        .quote-section {
          background: black;
          padding: 2rem 0;
          width: 100vw;
          position: relative;
          left: 50%;
          transform: translateX(-50%);
          text-align: center;
          margin-top: -4rem;
        }

        .quote-container {
          max-width: 800px;
          margin: 0 auto;
          padding: 0 2rem;
        }

        .supervisor-photo {
          width: 180px;
          height: 180px;
          border-radius: 50%;
          margin: 0 auto 2rem;
          display: block;
          box-shadow: 0 0 40px rgba(0, 240, 120, 0.4);
          border: 4px solid rgba(0, 240, 120, 0.6);
        }

        .quote-text {
          color: white;
          font-style: italic;
          font-size: 1.8rem;
          line-height: 1.4;
          font-weight: 300;
          text-shadow: 0 0 20px rgba(255, 255, 255, 0.3);
          margin-bottom: 2rem;
        }

        .quote-text::before {
          content: '"';
          font-size: 2.5rem;
          color: #00f078;
          margin-right: 0.2rem;
        }

        .quote-text::after {
          content: '"';
          font-size: 2.5rem;
          color: #00f078;
          margin-left: 0.2rem;
        }

        .quote-author {
          color: rgba(255, 255, 255, 0.8);
          font-size: 1.1rem;
          font-weight: 500;
        }

        .quote-title {
          color: rgba(255, 255, 255, 0.6);
          font-size: 0.9rem;
          margin-top: 0.5rem;
        }

        @media (max-width: 768px) {
          .quote-container {
            padding: 0 1.5rem;
          }

          .supervisor-photo {
            width: 140px;
            height: 140px;
          }

          .quote-text {
            font-size: 1.4rem;
          }

          .quote-text::before,
          .quote-text::after {
            font-size: 2rem;
          }
        }

        @media (max-width: 480px) {
          .quote-text {
            font-size: 1.2rem;
          }

          .supervisor-photo {
            width: 120px;
            height: 120px;
          }
        }

        /* Final Tagline Section */
        .final-tagline-section {
          background: black;
          padding: 4rem 0 6rem 0;
          width: 100vw;
          position: relative;
          left: 50%;
          transform: translateX(-50%);
          text-align: center;
          overflow: hidden;
        }

        .tagline-text {
          font-size: 3rem;
          font-weight: 800;
          background: linear-gradient(135deg, #00f078 0%, #3fe1f3 30%, #9f69f7 60%, #ff6b9d 100%);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
          text-shadow: 0 0 40px rgba(0, 240, 120, 0.6);
          letter-spacing: 3px;
          line-height: 1.2;
          margin: 0 auto;
          max-width: 1000px;
          padding: 0 2rem;
          animation: tagline-glow 3s ease-in-out infinite;
        }

        @keyframes tagline-glow {
          0%, 100% {
            text-shadow: 0 0 40px rgba(0, 240, 120, 0.6), 0 0 80px rgba(63, 225, 243, 0.3);
          }
          50% {
            text-shadow: 0 0 60px rgba(0, 240, 120, 0.8), 0 0 120px rgba(63, 225, 243, 0.5);
          }
        }

        /* Shimmery Smoky Effects */
        .arc-smoke-effect {
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          height: 100%;
          pointer-events: none;
          overflow: hidden;
        }

        .smoke-particle {
          position: absolute;
          border-radius: 50%;
          opacity: 0;
          filter: blur(2px);
        }

        .smoke-left {
          left: 10%;
          width: 30px;
          height: 30px;
          background: radial-gradient(circle, rgba(0, 240, 120, 0.4), rgba(63, 225, 243, 0.2), transparent);
          animation: smoke-rise-left 8s ease-in-out infinite;
        }

        .smoke-right {
          right: 10%;
          width: 25px;
          height: 25px;
          background: radial-gradient(circle, rgba(159, 105, 247, 0.4), rgba(63, 225, 243, 0.2), transparent);
          animation: smoke-rise-right 6s ease-in-out infinite;
        }

        .smoke-center {
          left: 50%;
          transform: translateX(-50%);
          width: 40px;
          height: 40px;
          background: radial-gradient(circle, rgba(0, 240, 120, 0.3), rgba(255, 107, 157, 0.2), transparent);
          animation: smoke-rise-center 10s ease-in-out infinite;
        }

        .shimmer-effect {
          position: absolute;
          width: 2px;
          height: 100px;
          background: linear-gradient(to bottom, transparent, rgba(255, 255, 255, 0.8), transparent);
          animation: shimmer-move 4s ease-in-out infinite;
          opacity: 0;
        }

        .shimmer-1 {
          left: 20%;
          animation-delay: 0s;
        }

        .shimmer-2 {
          left: 50%;
          animation-delay: 1s;
        }

        .shimmer-3 {
          right: 20%;
          animation-delay: 2s;
        }

        /* Hide shimmer effects on mobile to prevent text overlap */
        @media (max-width: 800px) {
          .shimmer-1, .shimmer-3 {
            display: none;
          }
          .shimmer-2 {
            left: 50%;
            opacity: 0.5;
          }
        }

        @media (max-width: 700px) {
          .shimmer-effect {
            display: none;
          }
        }

        @keyframes smoke-rise-left {
          0% {
            bottom: 0;
            opacity: 0;
            transform: translateX(0) scale(0.8);
          }
          20% {
            opacity: 0.6;
            transform: translateX(-20px) scale(1);
          }
          80% {
            opacity: 0.3;
            transform: translateX(-40px) scale(1.2);
          }
          100% {
            bottom: 100%;
            opacity: 0;
            transform: translateX(-60px) scale(1.5);
          }
        }

        @keyframes smoke-rise-right {
          0% {
            bottom: 0;
            opacity: 0;
            transform: translateX(0) scale(0.8);
          }
          25% {
            opacity: 0.5;
            transform: translateX(20px) scale(1);
          }
          75% {
            opacity: 0.3;
            transform: translateX(40px) scale(1.3);
          }
          100% {
            bottom: 100%;
            opacity: 0;
            transform: translateX(60px) scale(1.6);
          }
        }

        @keyframes smoke-rise-center {
          0% {
            bottom: 0;
            opacity: 0;
            transform: translateX(-50%) scale(0.5);
          }
          30% {
            opacity: 0.7;
            transform: translateX(-50%) scale(1);
          }
          70% {
            opacity: 0.4;
            transform: translateX(-50%) scale(1.4);
          }
          100% {
            bottom: 100%;
            opacity: 0;
            transform: translateX(-50%) scale(2);
          }
        }

        @keyframes shimmer-move {
          0%, 100% {
            opacity: 0;
            transform: translateY(100px);
          }
          50% {
            opacity: 1;
            transform: translateY(-100px);
          }
        }

        @media (max-width: 768px) {
          .tagline-text {
            font-size: 2.2rem;
            letter-spacing: 2px;
          }
        }

        @media (max-width: 480px) {
          .tagline-text {
            font-size: 1.8rem;
            letter-spacing: 1px;
            padding: 0 1rem;
          }
        }

        /* Final Action Buttons Section */
        .final-action-buttons {
          background: black;
          padding: 3rem 0 5rem 0;
          width: 100vw;
          position: relative;
          left: 50%;
          transform: translateX(-50%);
          text-align: center;
        }

        .final-buttons-container {
          display: flex;
          gap: 1.5rem;
          justify-content: center;
          align-items: center;
        }

        @media (max-width: 480px) {
          .final-buttons-container {
            flex-direction: column;
            gap: 1rem;
          }
        }

        
      `}} />

      <div className="home-page">
        {/* Lottie Animation Section */}
        <div
          className="lottie-hero-section"
          style={{
            width: '100%',
            height: windowWidth >= 1000
              ? 'calc(288px + (100vw - 1100px) * 0.26)'
              : windowWidth <= 300
              ? '250px'
              : windowWidth <= 400
              ? '250px'
              : windowWidth <= 500
              ? '300px'
              : 'calc(252px + (100vw - 770px) * 0.33)',
            position: 'relative',
            overflow: 'visible',
            backgroundColor: 'black',
          }}
        >
          {loading && (
            <div className="endor-animation-loading" style={{ width: '100%', height: '100%' }}>
              <div className="loading-spinner">
                <div className="spinner"></div>
                <p>Xploiteye is loading</p>
              </div>
            </div>
          )}

          {error && (
            <div className="endor-animation-error" style={{ width: '100%', height: '100%' }}>
              <div className="error-message">
                <p>Failed to load animation</p>
                <small>{error}</small>
              </div>
            </div>
          )}

          {animationData && (
            <>
              <Lottie
                lottieRef={lottieRef}
                animationData={animationData}
                loop={true}
                autoplay={true}
                style={{
                  position: 'relative',
                  top: '0px',
                  left: '0',
                  transform: 'none',
                  width: '100%',
                  height: '100%',
                }}
                className="responsive-lottie-container"
              />
              
              {/* Mobile Processing Animation */}
              <div className="mobile-processing-box">
                <div className="shield-container">
                  <div className="rotating-ring"></div>
                  <div className="processing-particle particle-1"></div>
                  <div className="processing-particle particle-2"></div>
                  <div className="processing-particle particle-3"></div>
                  <svg className="shield-icon" viewBox="0 0 24 24">
                    <defs>
                      <linearGradient id="shield-gradient" x1="0%" y1="0%" x2="100%" y2="100%">
                        <stop offset="0%" style={{ stopColor: '#00f078', stopOpacity: 1 }} />
                        <stop offset="50%" style={{ stopColor: '#3fe1f3', stopOpacity: 1 }} />
                        <stop offset="100%" style={{ stopColor: '#9f69f7', stopOpacity: 1 }} />
                      </linearGradient>
                    </defs>
                    {/* First X line - outer */}
                    <path d="M5.5 5.5 L18.5 18.5" stroke="url(#shield-gradient)" strokeWidth="2" strokeLinecap="round"/>
                    {/* First X line - inner */}
                    <path d="M6.5 6.5 L17.5 17.5" stroke="url(#shield-gradient)" strokeWidth="1.5" strokeLinecap="round" opacity="0.6"/>

                    {/* Second X line - outer */}
                    <path d="M18.5 5.5 L5.5 18.5" stroke="url(#shield-gradient)" strokeWidth="2" strokeLinecap="round"/>
                    {/* Second X line - inner */}
                    <path d="M17.5 6.5 L6.5 17.5" stroke="url(#shield-gradient)" strokeWidth="1.5" strokeLinecap="round" opacity="0.6"/>
                  </svg>
                </div>
                <div className="status-indicators">
                  <div className="status-bar"></div>
                  <div className="status-bar"></div>
                  <div className="status-bar"></div>
                </div>
              </div>

              {/* Eye icon overlay synchronized with Lottie frames */}
              <div className="eye-breathing-wrapper">
                <motion.img
                  src="/images/eye.svg"
                  alt="Eye icon"
                  aria-label="Eye icon"
                  role="img"
                  className="endor-eye-overlay"
                  style={{
                    x: eyeTranslateX,
                    y: eyeTranslateY,
                    rotate: eyeRotate,
                    scale: eyeScale
                  }}
                  transition={{ type: "tween", ease: "linear", duration: 0 }}
                />
              </div>
            </>
          )}
        </div>
        
        {/* Desktop Section */}
        <div className="desktop-section">
          <h1 className="hero-main-title">
            <span className="title-gradient" data-text="Simulate. Exploit. Secure.">
              Simulate. Exploit. Secure.
            </span>
          </h1>
          <div className="hero-text-content">
            <p className="hero-description">
              XploitEye reimagines cybersecurity with multi-agent collaboration detecting, exploiting, and neutralizing threats faster than they emerge.
            </p>
            <div className="hero-actions">
              <button className="btn-primary-glow" onClick={() => router.push('/signin')}>Book a Demo</button>
              <button className="btn-secondary-outline" onClick={() => router.push('/platform')}>Learn More</button>
            </div>
          </div>
        </div>
        
        {/* Features Overview Section */}
        <section className="features-overview">
          <div className="features-carousel-container">
            <div className="features-carousel">
              {/* First set */}
              <div className="feature-card">
                <svg className="feature-icon" viewBox="0 0 24 24">
                  <path d="M12,1L3,5V11C3,16.55 6.84,21.74 12,23C17.16,21.74 21,16.55 21,11V5L12,1M12,7C13.4,7 14.8,8.6 14.8,10V11.5C15.4,11.5 16,12.4 16,13V16C16,17.4 15.4,18 14.8,18H9.2C8.6,18 8,17.4 8,16V13C8,12.4 8.6,11.5 9.2,11.5V10C9.2,8.6 10.6,7 12,7M12,8.2C11.2,8.2 10.5,8.7 10.5,10V11.5H13.5V10C13.5,8.7 12.8,8.2 12,8.2Z"/>
                </svg>
                <h3>Advanced Threat Detection</h3>
                <p>AI-powered threat intelligence that identifies and neutralizes cyber threats before they impact your business.</p>
              </div>
              
              <div className="feature-card">
                <svg className="feature-icon" viewBox="0 0 24 24">
                  <path d="M9.5,3A6.5,6.5 0 0,1 16,9.5C16,11.11 15.41,12.59 14.44,13.73L14.71,14H15.5L20.5,19L19,20.5L14,15.5V14.71L13.73,14.44C12.59,15.41 11.11,16 9.5,16A6.5,6.5 0 0,1 3,9.5A6.5,6.5 0 0,1 9.5,3M9.5,5C7,5 5,7 5,9.5C5,12 7,14 9.5,14C12,14 14,12 14,9.5C14,7 12,5 9.5,5Z"/>
                  <circle cx="15.5" cy="7.5" r="1.5"/>
                  <circle cx="20" cy="8" r="1"/>
                </svg>
                <h3>Real-time Monitoring</h3>
                <p>24/7 continuous monitoring of your digital infrastructure with instant alerts and automated response capabilities.</p>
              </div>
              
              <div className="feature-card">
                <svg className="feature-icon" viewBox="0 0 24 24">
                  <path d="M22,21H2V3H4V19H6V10H10V19H12V6H16V19H18V14H22V21Z"/>
                </svg>
                <h3>Security Analytics</h3>
                <p>Comprehensive dashboards and reports providing deep insights into your security posture and threat landscape.</p>
              </div>
              
              <div className="feature-card">
                <svg className="feature-icon" viewBox="0 0 24 24">
                  <path d="M12,2A2,2 0 0,1 14,4C14,4.74 13.6,5.39 13,5.73V7H14A7,7 0 0,1 21,14H22A1,1 0 0,1 23,15V18A1,1 0 0,1 22,19H21V20A2,2 0 0,1 19,22H5A2,2 0 0,1 3,20V19H2A1,1 0 0,1 1,18V15A1,1 0 0,1 2,14H3A7,7 0 0,1 10,7H11V5.73C10.4,5.39 10,4.74 10,4A2,2 0 0,1 12,2M7.5,13A0.5,0.5 0 0,0 7,13.5A0.5,0.5 0 0,0 7.5,14A0.5,0.5 0 0,0 8,13.5A0.5,0.5 0 0,0 7.5,13M16.5,13A0.5,0.5 0 0,0 16,13.5A0.5,0.5 0 0,0 16.5,14A0.5,0.5 0 0,0 17,13.5A0.5,0.5 0 0,0 16.5,13Z"/>
                </svg>
                <h3>Automated Response</h3>
                <p>Intelligent automation that responds to threats instantly, minimizing damage and reducing manual intervention requirements.</p>
              </div>
              
              <div className="feature-card">
                <svg className="feature-icon" viewBox="0 0 24 24">
                  <path d="M18,8A2,2 0 0,1 20,10V20A2,2 0 0,1 18,22H6A2,2 0 0,1 4,20V10C4,8.89 4.9,8 6,8H7V6A5,5 0 0,1 12,1A5,5 0 0,1 17,6V8H18M12,3A3,3 0 0,0 9,6V8H15V6A3,3 0 0,0 12,3Z"/>
                  <path d="M12,17A2,2 0 0,0 14,15A2,2 0 0,0 12,13A2,2 0 0,0 10,15A2,2 0 0,0 12,17Z"/>
                  <circle cx="18" cy="4" r="2" fill="#ff6b6b"/>
                </svg>
                <h3>Zero-Day Protection</h3>
                <p>Advanced machine learning algorithms detect and prevent zero-day exploits and unknown malware variants in real-time.</p>
              </div>
              
              {/* Duplicate set for seamless loop */}
              <div className="feature-card">
                <svg className="feature-icon" viewBox="0 0 24 24">
                  <path d="M12,1L3,5V11C3,16.55 6.84,21.74 12,23C17.16,21.74 21,16.55 21,11V5L12,1M12,7C13.4,7 14.8,8.6 14.8,10V11.5C15.4,11.5 16,12.4 16,13V16C16,17.4 15.4,18 14.8,18H9.2C8.6,18 8,17.4 8,16V13C8,12.4 8.6,11.5 9.2,11.5V10C9.2,8.6 10.6,7 12,7M12,8.2C11.2,8.2 10.5,8.7 10.5,10V11.5H13.5V10C13.5,8.7 12.8,8.2 12,8.2Z"/>
                </svg>
                <h3>Advanced Threat Detection</h3>
                <p>AI-powered threat intelligence that identifies and neutralizes cyber threats before they impact your business.</p>
              </div>
              
              <div className="feature-card">
                <svg className="feature-icon" viewBox="0 0 24 24">
                  <path d="M9.5,3A6.5,6.5 0 0,1 16,9.5C16,11.11 15.41,12.59 14.44,13.73L14.71,14H15.5L20.5,19L19,20.5L14,15.5V14.71L13.73,14.44C12.59,15.41 11.11,16 9.5,16A6.5,6.5 0 0,1 3,9.5A6.5,6.5 0 0,1 9.5,3M9.5,5C7,5 5,7 5,9.5C5,12 7,14 9.5,14C12,14 14,12 14,9.5C14,7 12,5 9.5,5Z"/>
                  <circle cx="15.5" cy="7.5" r="1.5"/>
                  <circle cx="20" cy="8" r="1"/>
                </svg>
                <h3>Real-time Monitoring</h3>
                <p>24/7 continuous monitoring of your digital infrastructure with instant alerts and automated response capabilities.</p>
              </div>
              
              <div className="feature-card">
                <svg className="feature-icon" viewBox="0 0 24 24">
                  <path d="M22,21H2V3H4V19H6V10H10V19H12V6H16V19H18V14H22V21Z"/>
                </svg>
                <h3>Security Analytics</h3>
                <p>Comprehensive dashboards and reports providing deep insights into your security posture and threat landscape.</p>
              </div>
              
              <div className="feature-card">
                <svg className="feature-icon" viewBox="0 0 24 24">
                  <path d="M12,2A2,2 0 0,1 14,4C14,4.74 13.6,5.39 13,5.73V7H14A7,7 0 0,1 21,14H22A1,1 0 0,1 23,15V18A1,1 0 0,1 22,19H21V20A2,2 0 0,1 19,22H5A2,2 0 0,1 3,20V19H2A1,1 0 0,1 1,18V15A1,1 0 0,1 2,14H3A7,7 0 0,1 10,7H11V5.73C10.4,5.39 10,4.74 10,4A2,2 0 0,1 12,2M7.5,13A0.5,0.5 0 0,0 7,13.5A0.5,0.5 0 0,0 7.5,14A0.5,0.5 0 0,0 8,13.5A0.5,0.5 0 0,0 7.5,13M16.5,13A0.5,0.5 0 0,0 16,13.5A0.5,0.5 0 0,0 16.5,14A0.5,0.5 0 0,0 17,13.5A0.5,0.5 0 0,0 16.5,13Z"/>
                </svg>
                <h3>Automated Response</h3>
                <p>Intelligent automation that responds to threats instantly, minimizing damage and reducing manual intervention requirements.</p>
              </div>
              
              <div className="feature-card">
                <svg className="feature-icon" viewBox="0 0 24 24">
                  <path d="M18,8A2,2 0 0,1 20,10V20A2,2 0 0,1 18,22H6A2,2 0 0,1 4,20V10C4,8.89 4.9,8 6,8H7V6A5,5 0 0,1 12,1A5,5 0 0,1 17,6V8H18M12,3A3,3 0 0,0 9,6V8H15V6A3,3 0 0,0 12,3Z"/>
                  <path d="M12,17A2,2 0 0,0 14,15A2,2 0 0,0 12,13A2,2 0 0,0 10,15A2,2 0 0,0 12,17Z"/>
                  <circle cx="18" cy="4" r="2" fill="#ff6b6b"/>
                </svg>
                <h3>Zero-Day Protection</h3>
                <p>Advanced machine learning algorithms detect and prevent zero-day exploits and unknown malware variants in real-time.</p>
              </div>
            </div>
          </div>
        </section>

        {/* Arc Section */}
        <div className="arc-wrapper">
          <div className="semi-circle-arc">
            <div className="arc-content">
              <h2>XploitEye Vulnerability Assessment Platform for Web Apps and Systems</h2>
              <p>Advanced multi-agent cybersecurity platform designed to simulate, detect, and neutralize sophisticated threats across web applications and enterprise systems.</p>
            </div>
            
            {/* Smoky Effects */}
            <div className="arc-smoke-effect">
              <div className="smoke-particle smoke-left"></div>
              <div className="smoke-particle smoke-right"></div>
              <div className="smoke-particle smoke-center"></div>
              <div className="shimmer-effect shimmer-1"></div>
              <div className="shimmer-effect shimmer-2"></div>
              <div className="shimmer-effect shimmer-3"></div>
            </div>
          </div>
        </div>

        {/* Quote Section */}
        <div className="quote-section">
          <div className="quote-container">
            <img 
              src="https://avatars.githubusercontent.com/u/10694441?v=4" 
              alt="Dr. Muhammad Arif Butt"
              className="supervisor-photo"
            />
            <div className="quote-text">
              XploitEye is absolutely the most groundbreaking and exceptional cybersecurity platform I have ever witnessed in my entire career - a truly revolutionary breakthrough that will completely transform and revolutionize how we defend against sophisticated cyber threats forever, setting new industry standards for digital security excellence
            </div>
            <div className="quote-author">Dr. Muhammad Arif Butt</div>
            <div className="quote-title">Project Supervisor • Cybersecurity Expert</div>
          </div>
        </div>

        {/* Final Tagline Section */}
        <div className="final-tagline-section">
          <div className="tagline-text">
            The Future of Cybersecurity is Here - Experience Unmatched Digital Protection with XploitEye
          </div>
        </div>

        {/* Final Action Buttons */}
        <div className="final-action-buttons">
          <div className="final-buttons-container">
            <button 
              className="btn-primary-glow"
              onClick={() => window.location.href = '/usecase'}
            >
              Get Started
            </button>
            <button
              className="btn-secondary-outline"
              onClick={() => router.push('/signin')}
            >
              Book a Demo
            </button>
          </div>
        </div>
      </div>
    </>
  );
}