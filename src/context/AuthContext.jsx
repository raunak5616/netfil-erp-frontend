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
   * Evaluates user-specific overrides first (DENY -> ALLOW), then checks Admin role, then checks Role permissions union.
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

    // Support both user.roles (array) and fallback user.role (object)
    const rolesArray = user.roles
      ? user.roles
      : user.role
      ? [user.role]
      : [];

    if (!Array.isArray(rolesArray) || rolesArray.length === 0) return false;

    // 2. Check if user has an "Admin" role (Admin has all permissions)
    const isAdmin = rolesArray.some((r) => {
      if (!r) return false;
      const roleName = typeof r === 'string' ? r : r.roleName;
      return roleName?.toLowerCase() === 'admin';
    });

    if (isAdmin) return true;

    // 3. Check union of all assigned roles permissions
    return rolesArray.some((role) => {
      if (!role || typeof role === 'string' || !role.permissions || !Array.isArray(role.permissions)) return false;
      return role.permissions.some((perm) => {
        if (!perm) return false;
        if (typeof perm === 'string') return perm === permissionCode;
        return perm.permissionCode === permissionCode;
      });
    });
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
