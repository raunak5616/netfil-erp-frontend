import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import api from '../services/api';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(() => {
    const savedUser = localStorage.getItem('netfil_user');
    return savedUser ? JSON.parse(savedUser) : null;
  });
  const [token, setToken] = useState(() => localStorage.getItem('netfil_token') || null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Initialize & verify session on startup
  useEffect(() => {
    const verifySession = async () => {
      if (token) {
        try {
          const res = await api.get('/auth/me');
          if (res.data && res.data.success && res.data.user) {
            setUser(res.data.user);
            localStorage.setItem('netfil_user', JSON.stringify(res.data.user));
          }
        } catch (err) {
          console.error("Session verification failed:", err);
          logout();
        }
      }
      setLoading(false);
    };

    verifySession();
  }, [token]);

  // Login handler
  const login = async (username, password) => {
    setError(null);
    try {
      const response = await api.post('/auth/login', { username, password });
      const { success, token: authToken, user: userData, message } = response.data;

      if (success) {
        setToken(authToken);
        setUser(userData);
        localStorage.setItem('netfil_token', authToken);
        localStorage.setItem('netfil_user', JSON.stringify(userData));
        return { success: true };
      } else {
        setError(message || 'Login failed');
        return { success: false, message: message || 'Login failed' };
      }
    } catch (err) {
      const msg = err.response?.data?.message || 'Login failed. Please check your credentials.';
      setError(msg);
      return { success: false, message: msg };
    }
  };

  // Logout handler
  const logout = () => {
    setUser(null);
    setToken(null);
    localStorage.removeItem('netfil_token');
    localStorage.removeItem('netfil_user');
  };

  /**
   * RBAC Permission Checker
   * Evaluates user-specific overrides first (DENY -> ALLOW), then checks Role permissions.
   */
  const hasPermission = useCallback((permissionCode) => {
    if (!user) return false;

    // 1. Check user-level permission overrides
    if (user.permissions && Array.isArray(user.permissions)) {
      const userOverride = user.permissions.find(
        (item) => item.permission?.permissionCode === permissionCode
      );
      if (userOverride) {
        if (userOverride.effect === 'DENY') return false;
        if (userOverride.effect === 'ALLOW') return true;
      }
    }

    // 2. Check role permissions
    if (user.role && user.role.permissions && Array.isArray(user.role.permissions)) {
      return user.role.permissions.some((perm) => {
        if (typeof perm === 'string') return perm === permissionCode;
        return perm.permissionCode === permissionCode;
      });
    }

    return false;
  }, [user]);

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        loading,
        error,
        login,
        logout,
        hasPermission,
        isAuthenticated: !!token && !!user,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
