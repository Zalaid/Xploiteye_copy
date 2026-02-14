import React, { createContext, useContext, useState, useEffect } from 'react';

const AuthContext = createContext();

// Backend API configuration: use env so rewrites (empty) or direct backend URL both work
const getApiBaseUrl = () => {
  const url = (typeof process !== 'undefined' && process.env?.NEXT_PUBLIC_API_URL) || '';
  return url.replace(/\/+$/, ''); // no trailing slash to avoid double slashes
};
const API_BASE_URL = getApiBaseUrl();

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // Check if user is authenticated on app startup
  useEffect(() => {
    checkAuthStatus();
  }, []);

  const checkAuthStatus = async () => {
    try {
      // Check for token (also check access_token for migration from old key)
      const token = localStorage.getItem('access_token');
      if (!token) {
        setLoading(false);
        return;
      }

      // No migration needed, using access_token consistently

      // Verify token with backend (use same base as login)
      const base = getApiBaseUrl();
      const meUrl = base ? `${base}/api/auth/me` : '/api/auth/me';
      const response = await fetch(meUrl, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        const userData = await response.json();
        setIsAuthenticated(true);
        setUser(userData);
      } else {
        // Token is invalid, remove it
        localStorage.removeItem('access_token');
        localStorage.removeItem('user');
        setIsAuthenticated(false);
        setUser(null);
      }
    } catch (error) {
      console.error('Auth check failed:', error);
      localStorage.removeItem('access_token');
      localStorage.removeItem('user');
      setIsAuthenticated(false);
      setUser(null);
    }
    setLoading(false);
  };

  const checkUsernameAvailability = async (username) => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/auth/check-username/${encodeURIComponent(username)}`);

      if (response.ok) {
        const data = await response.json();
        return { success: true, available: data.available };
      } else if (response.status === 404) {
        // Endpoint doesn't exist, return unknown status
        return { success: false, error: 'Username check not available' };
      } else {
        const data = await response.json();
        return { success: false, error: data.detail || 'Username check failed' };
      }
    } catch (error) {
      console.error('Username check error:', error);
      return { success: false, error: 'Network error. Please try again.' };
    }
  };

  const register = async (email, username, password, name = '') => {
    try {
      // Ensure name is not empty - use username as fallback
      const validName = (name && name.trim()) ? name.trim() : username;

      const response = await fetch(`${API_BASE_URL}/api/auth/register`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email,
          username,
          password,
          name: validName,
          display_name: validName
        }),
      });

      let data;
      try {
        data = await response.json();
      } catch (parseError) {
        console.error('Failed to parse response JSON:', parseError);
        return { success: false, error: 'Invalid response from server. Please try again.' };
      }

      if (response.ok) {
        return { success: true, message: data.message || 'Registration successful!' };
      } else {
        // Handle validation errors more specifically
        if (response.status === 422 && data && data.detail) {
          console.log('Processing 422 validation error:', data);
          // Parse validation errors from FastAPI
          if (Array.isArray(data.detail)) {
            const errors = {};
            data.detail.forEach(error => {
              if (error.loc && error.loc.length > 0 && error.msg) {
                const field = error.loc[error.loc.length - 1]; // Get the field name
                errors[field] = error.msg;
                console.log(`Field error - ${field}: ${error.msg}`);
              }
            });
            if (Object.keys(errors).length > 0) {
              console.log('Returning validation errors:', errors);
              return { success: false, validationErrors: errors };
            }
          }
          // If it's a single validation error string
          if (typeof data.detail === 'string') {
            return { success: false, error: data.detail };
          }
        }
        return { success: false, error: (data && data.detail) || 'Registration failed. Please try again.' };
      }
    } catch (error) {
      console.error('Registration error:', error);
      return { success: false, error: 'Network error. Please try again.' };
    }
  };

  const login = async (username, password) => {
    try {
      const base = getApiBaseUrl();
      const loginUrl = base ? `${base}/api/auth/login` : '/api/auth/login';
      const response = await fetch(loginUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          username,
          password,
        }),
      });

      let data;
      try {
        data = await response.json();
      } catch (_) {
        data = {};
      }

      if (response.ok) {
        // Check if MFA is required
        if (data.mfa_required) {
          return {
            success: true,
            mfa_required: true,
            temp_token: data.temp_token,
            email: data.email
          };
        }

        // Normal login - store JWT token
        localStorage.setItem('access_token', data.access_token);

        // Get user info (if this 404s, token stays but dashboard may redirect; avoid breaking login success)
        await checkAuthStatus();

        return { success: true };
      } else {
        const msg = data.detail || 'Login failed';
        const friendlyError = response.status === 404
          ? 'Login service unavailable. Ensure the backend is running and NEXT_PUBLIC_API_URL is set if needed.'
          : msg;
        return {
          success: false,
          error: friendlyError
        };
      }
    } catch (error) {
      console.error('Login error:', error);
      return {
        success: false,
        error: 'Network error. Please check your connection.'
      };
    }
  };

  const logout = async () => {
    try {
      const token = localStorage.getItem('access_token');
      if (token) {
        // Call backend logout endpoint
        await fetch(`${API_BASE_URL}/api/auth/logout`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        });
      }
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      // Clear local state regardless of backend response
      localStorage.removeItem('access_token');
      localStorage.removeItem('user');
      setIsAuthenticated(false);
      setUser(null);
    }
  };

  // Helper function to determine user role for dashboard access
  const getUserRole = () => {
    if (!user) return 'viewer';
    const email = user.email?.toLowerCase() || '';
    if (email.includes('admin')) return 'admin';
    if (email.includes('analyst') || email.includes('red') || email.includes('blue')) return 'analyst';
    return 'viewer';
  };

  const hasRole = (requiredRole) => {
    const userRole = getUserRole();
    const roles = ['viewer', 'analyst', 'admin'];
    const userRoleIndex = roles.indexOf(userRole);
    const requiredRoleIndex = roles.indexOf(requiredRole);
    return userRoleIndex >= requiredRoleIndex;
  };

  // API helper function for authenticated requests
  const apiCall = async (endpoint, options = {}) => {
    // Ensure endpoint starts with /api
    const apiEndpoint = endpoint.startsWith('/api') ? endpoint : `/api${endpoint.startsWith('/') ? '' : '/'}${endpoint}`;

    const token = localStorage.getItem('access_token');
    const defaultOptions = {
      headers: {
        'Content-Type': 'application/json',
        ...(token && { 'Authorization': `Bearer ${token}` }),
      },
    };

    const finalOptions = {
      ...defaultOptions,
      ...options,
      headers: {
        ...defaultOptions.headers,
        ...options.headers,
      },
    };

    try {
      const response = await fetch(`${API_BASE_URL}${apiEndpoint}`, finalOptions);

      // Handle session expired
      if (response.status === 401) {
        const data = await response.json();
        if (data.detail?.includes('Session expired')) {
          localStorage.removeItem('access_token');
          localStorage.removeItem('user');
          setIsAuthenticated(false);
          setUser(null);
        }
      }

      return response;
    } catch (error) {
      console.error('API call failed:', error);
      throw error;
    }
  };

  const value = {
    isAuthenticated,
    user,
    loading,
    login,
    register,
    logout,
    hasRole,
    getUserRole,
    apiCall,
    checkAuthStatus,
    checkUsernameAvailability
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};