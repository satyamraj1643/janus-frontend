import React, { createContext, useContext, useState, useEffect } from 'react';
import { authAPI, getToken, getStoredUser } from '../services/api';

const AuthContext = createContext(null);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Initialize auth state from localStorage
  useEffect(() => {
    const initAuth = async () => {
      const token = getToken();
      const storedUser = getStoredUser();

      if (token && storedUser) {
        setUser(storedUser);
        // Optionally validate token with backend
        try {
          const response = await authAPI.getProfile();
          if (response.success) {
            setUser(response.data);
          }
        } catch (err) {
          // Token might be expired, will be handled by interceptor
          console.log('Token validation failed:', err);
        }
      }
      setLoading(false);
    };

    initAuth();
  }, []);

  const login = async (email, password) => {
    setError(null);
    try {
      const response = await authAPI.login(email, password);
      if (response.success) {
        setUser(response.data.user);
        return { success: true };
      } else {
        setError(response.error || 'Login failed');
        return { success: false, error: response.error };
      }
    } catch (err) {
      const errorMsg = err.response?.data?.error || 'Login failed. Please try again.';
      setError(errorMsg);
      return { success: false, error: errorMsg };
    }
  };

  const register = async (name, email, password) => {
    setError(null);
    try {
      const response = await authAPI.register(name, email, password);
      if (response.success) {
        // Auto-login after registration
        return await login(email, password);
      } else {
        setError(response.error || 'Registration failed');
        return { success: false, error: response.error };
      }
    } catch (err) {
      const errorMsg = err.response?.data?.error || 'Registration failed. Please try again.';
      setError(errorMsg);
      return { success: false, error: errorMsg };
    }
  };

  const logout = () => {
    authAPI.logout();
    setUser(null);
  };

  const value = {
    user,
    loading,
    error,
    isAuthenticated: !!user,
    login,
    register,
    logout,
    clearError: () => setError(null),
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

export default AuthContext;
