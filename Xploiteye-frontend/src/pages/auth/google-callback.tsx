import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/router';

/**
 * Google redirects here after user picks account (when redirect_uri is frontend).
 * We send the code to the backend, get a session_token, then redirect to /auth/callback.
 */
export default function GoogleCallbackPage() {
  const router = useRouter();
  const [status, setStatus] = useState<'loading' | 'done' | 'error'>('loading');
  const [error, setError] = useState('');

  useEffect(() => {
    if (!router.isReady) return;

    const { code, state } = router.query;
    if (!code || typeof code !== 'string') {
      setError('Missing authorization code from Google');
      setStatus('error');
      setTimeout(() => router.replace('/signin?error=google_login_failed'), 2000);
      return;
    }

    const run = async () => {
      try {
        const res = await fetch('/api/auth/google/exchange-code', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ code, state: state ?? undefined }),
        });

        if (!res.ok) {
          const data = await res.json().catch(() => ({}));
          throw new Error(data.detail || `Request failed: ${res.status}`);
        }

        const data = await res.json();
        const session = data.session_token;
        const redirectUrl = data.redirect_url;

        if (!session) {
          throw new Error('No session token returned');
        }

        setStatus('done');
        const params = new URLSearchParams({ session });
        if (redirectUrl) params.set('redirect', encodeURIComponent(redirectUrl));
        router.replace(`/auth/callback?${params.toString()}`);
      } catch (e) {
        setError(e instanceof Error ? e.message : 'Google sign-in failed');
        setStatus('error');
        setTimeout(() => router.replace('/signin?error=google_login_failed'), 3000);
      }
    };

    run();
  }, [router.isReady, router.query.code, router.query.state]);

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        background: '#0a0a0a',
        color: '#fff',
        fontFamily: 'system-ui, sans-serif',
      }}
    >
      {status === 'loading' && <p>Completing Google sign-in…</p>}
      {status === 'done' && <p>Redirecting…</p>}
      {status === 'error' && <p>{error}</p>}
    </div>
  );
}
