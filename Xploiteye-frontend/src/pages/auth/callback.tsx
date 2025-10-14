import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import { useAuth } from '../../auth/AuthContext';

const AuthCallback = () => {
  const router = useRouter();
  const { checkAuthStatus } = useAuth();
  const [status, setStatus] = useState('processing');
  const [error, setError] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);

  useEffect(() => {
    const handleCallback = async () => {
      // Prevent multiple executions
      if (isProcessing) {
        console.log('Already processing, skipping...');
        return;
      }

      try {
        const { session, redirect } = router.query;

        if (!session || typeof session !== 'string') {
          throw new Error('No session token provided');
        }

        setIsProcessing(true);

        console.log('Session token received:', session);
        console.log('Redirect URL:', redirect);
        setStatus('authenticating');

        // Add a small delay for better UX
        await new Promise(resolve => setTimeout(resolve, 1500));

        // Exchange session token for JWT
        const response = await fetch('http://localhost:8000/auth/exchange-session-token', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            session_token: session
          }),
        });

        if (!response.ok) {
          const errorText = await response.text();
          console.error('Token exchange failed:', {
            status: response.status,
            statusText: response.statusText,
            body: errorText
          });
          throw new Error(`Failed to exchange session token: ${response.status} - ${errorText}`);
        }

        const tokenData = await response.json();

        // Store the JWT token
        localStorage.setItem('token', tokenData.access_token);

        // Update auth context with new token
        await checkAuthStatus();

        setStatus('success');
        setShowSuccess(true);

        // Wait for success animation then redirect
        setTimeout(() => {
          // Use redirect URL if provided, otherwise go to dashboard
          let redirectUrl = '/dashboard';
          if (redirect && typeof redirect === 'string') {
            // Decode the redirect URL
            try {
              redirectUrl = decodeURIComponent(redirect);
            } catch (e) {
              console.error('Failed to decode redirect URL:', e);
              redirectUrl = redirect;
            }
          }
          console.log('Redirecting to:', redirectUrl);
          router.push(redirectUrl);
        }, 2500);

      } catch (err) {
        console.error('Auth callback error:', err);
        setError(err instanceof Error ? err.message : 'Authentication failed');
        setStatus('error');
        setIsProcessing(false);
        
        // Redirect to signin page with error after 4 seconds
        setTimeout(() => {
          router.push('/signin?error=auth_failed');
        }, 4000);
      }
    };

    if (router.isReady && !isProcessing) {
      handleCallback();
    }
  }, [router.isReady, router.query, isProcessing]);

  return (
    <>
      {/* Full screen overlay without header/footer */}
      <div style={{ 
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        display: 'flex', 
        flexDirection: 'column', 
        alignItems: 'center', 
        justifyContent: 'center', 
        backgroundColor: '#0a0a0a', 
        color: '#ffffff',
        fontFamily: 'system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
        zIndex: 9999
      }}>
        <div style={{ textAlign: 'center', maxWidth: '400px', padding: '0 20px' }}>
          
          {/* Loading State */}
          {(status === 'processing' || status === 'authenticating') && (
            <div style={{ animation: 'fadeIn 0.5s ease-in-out' }}>
              <div style={{ margin: '40px 0' }}>
                <div style={{
                  display: 'flex',
                  justifyContent: 'center',
                  alignItems: 'center',
                  marginBottom: '30px'
                }}>
                  {/* Three dots animation */}
                  <div style={{
                    display: 'flex',
                    gap: '8px',
                    alignItems: 'center'
                  }}>
                    {[0, 1, 2].map((i) => (
                      <div
                        key={i}
                        style={{
                          width: '12px',
                          height: '12px',
                          borderRadius: '50%',
                          backgroundColor: '#00f078',
                          animation: `bounce 1.4s infinite ease-in-out both`,
                          animationDelay: `${i * 0.16}s`
                        }}
                      ></div>
                    ))}
                  </div>
                </div>
                <p style={{ 
                  fontSize: '18px', 
                  color: '#cccccc', 
                  fontWeight: '300',
                  letterSpacing: '0.5px',
                  margin: 0
                }}>
                  Processing Authentication
                </p>
              </div>
            </div>
          )}

          {/* Success State */}
          {status === 'success' && (
            <div style={{ 
              animation: showSuccess ? 'successPop 0.6s cubic-bezier(0.68, -0.55, 0.265, 1.55)' : 'none'
            }}>
              <div style={{ margin: '40px 0' }}>
                {/* Large green circle with checkmark */}
                <div style={{
                  width: '120px',
                  height: '120px',
                  borderRadius: '50%',
                  backgroundColor: '#00f078',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  margin: '0 auto 30px',
                  boxShadow: '0 10px 30px rgba(0, 240, 120, 0.3)',
                  position: 'relative'
                }}>
                  <div style={{
                    fontSize: '48px',
                    color: 'white',
                    fontWeight: 'bold',
                    animation: showSuccess ? 'checkmarkDraw 0.5s ease-in-out 0.3s both' : 'none'
                  }}>
                    ✓
                  </div>
                </div>
                <h2 style={{ 
                  fontSize: '24px', 
                  color: '#ffffff', 
                  margin: '0 0 10px 0',
                  fontWeight: '600',
                  letterSpacing: '0.5px'
                }}>
                  Authentication Successful
                </h2>
                <p style={{ 
                  fontSize: '16px', 
                  color: '#00f078', 
                  fontWeight: '500',
                  margin: '0 0 20px 0',
                  letterSpacing: '0.3px'
                }}>
                  XploitEye directing towards your dashboard...
                </p>
              </div>
            </div>
          )}

          {/* Error State */}
          {status === 'error' && (
            <div style={{ animation: 'fadeIn 0.5s ease-in-out' }}>
              <div style={{ margin: '40px 0' }}>
                <div style={{
                  width: '120px',
                  height: '120px',
                  borderRadius: '50%',
                  backgroundColor: '#ff4757',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  margin: '0 auto 30px',
                  boxShadow: '0 10px 30px rgba(255, 71, 87, 0.3)'
                }}>
                  <div style={{
                    fontSize: '48px',
                    color: 'white',
                    fontWeight: 'bold'
                  }}>
                    ✗
                  </div>
                </div>
                <h2 style={{ 
                  fontSize: '24px', 
                  color: '#ffffff', 
                  margin: '0 0 10px 0',
                  fontWeight: '600',
                  letterSpacing: '0.5px'
                }}>
                  Authentication Failed
                </h2>
                <p style={{ 
                  fontSize: '14px', 
                  color: '#ff9999', 
                  margin: '0 0 10px 0',
                  wordWrap: 'break-word'
                }}>
                  {error}
                </p>
                <p style={{ 
                  fontSize: '16px', 
                  color: '#cccccc', 
                  fontWeight: '300',
                  margin: 0
                }}>
                  Redirecting to sign-in page...
                </p>
              </div>
            </div>
          )}
        </div>

        <style jsx>{`
          @keyframes fadeIn {
            from { opacity: 0; transform: translateY(20px); }
            to { opacity: 1; transform: translateY(0); }
          }
          
          @keyframes bounce {
            0%, 80%, 100% { 
              transform: scale(0);
              opacity: 0.5;
            } 40% { 
              transform: scale(1.0);
              opacity: 1;
            }
          }
          
          @keyframes successPop {
            0% { 
              opacity: 0; 
              transform: scale(0.3) translateY(30px); 
            }
            50% { 
              transform: scale(1.05) translateY(-10px); 
            }
            100% { 
              opacity: 1; 
              transform: scale(1) translateY(0); 
            }
          }
          
          @keyframes checkmarkDraw {
            0% { 
              opacity: 0; 
              transform: scale(0.3) rotate(-45deg);
            }
            100% { 
              opacity: 1; 
              transform: scale(1) rotate(0deg);
            }
          }
        `}</style>
      </div>
    </>
  );
};

export default AuthCallback;