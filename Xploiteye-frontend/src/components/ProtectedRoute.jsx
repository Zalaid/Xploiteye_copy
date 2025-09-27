import { useEffect } from 'react';
import { useRouter } from 'next/router';
import { useAuth } from '../auth/AuthContext';

const ProtectedRoute = ({ children }) => {
  const { isAuthenticated, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && !isAuthenticated) {
      // Redirect to login page if not authenticated
      router.push('/signin');
    }
  }, [isAuthenticated, loading, router]);

  // Show loading spinner while checking authentication
  if (loading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="text-green-400">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-green-400"></div>
          <p className="mt-4 text-center">Loading...</p>
        </div>
      </div>
    );
  }

  // Don't render children if not authenticated
  if (!isAuthenticated) {
    return null;
  }

  // Render the protected content
  return children;
};

export default ProtectedRoute;