import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import api from '../services/api';

export const PERMISSION_ALIASES = {
  CLIENT_VIEW: ['CLIENT_VIEW', 'PARTY_VIEW'],
  PARTY_VIEW: ['PARTY_VIEW', 'CLIENT_VIEW'],
  CLIENT_CREATE: ['CLIENT_CREATE', 'PARTY_CREATE'],
  PARTY_CREATE: ['PARTY_CREATE', 'CLIENT_CREATE'],
  CLIENT_EDIT: ['CLIENT_EDIT', 'PARTY_EDIT'],
  PARTY_EDIT: ['PARTY_EDIT', 'CLIENT_EDIT'],
  CLIENT_DELETE: ['CLIENT_DELETE', 'PARTY_DELETE'],
  PARTY_DELETE: ['PARTY_DELETE', 'CLIENT_DELETE'],
};

export const getEquivalentPermissionCodes = (permissionCode) => {
  if (!permissionCode) return [];
  if (Array.isArray(permissionCode)) {
    return Array.from(new Set(permissionCode.flatMap((c) => getEquivalentPermissionCodes(c))));
  }
  return PERMISSION_ALIASES[permissionCode] || [permissionCode];
};

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

    const codesToCheck = getEquivalentPermissionCodes(permissionCode);

    // 1. Check user-level permission overrides
    if (user.permissions && Array.isArray(user.permissions)) {
      const userOverrides = user.permissions.filter((item) => {
        const code = typeof item.permission === 'string'
          ? item.permission
          : item.permission?.permissionCode;
        return codesToCheck.includes(code);
      });

      if (userOverrides.some((item) => item.effect === 'DENY')) return false;
      if (userOverrides.some((item) => item.effect === 'ALLOW')) return true;
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
        const permCode = typeof perm === 'string' ? perm : perm.permissionCode;
        return codesToCheck.includes(permCode);
      });
    });
  }, [user]);

  const isAdmin = React.useMemo(() => {
    if (!user) return false;
    const rolesArray = user.roles ? user.roles : user.role ? [user.role] : [];
    return rolesArray.some((r) => {
      if (!r) return false;
      const roleName = typeof r === 'string' ? r : r.roleName;
      return roleName?.toLowerCase() === 'admin';
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
        isAdmin,
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
