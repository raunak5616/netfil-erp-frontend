import React, { createContext, useContext, useEffect, useCallback, useMemo } from 'react';
import api from '../services/api';
import { useAppDispatch, useAppSelector } from '../app/hooks';
import {
  setCredentials,
  updateUser,
  logout as authLogout,
  setAuthLoading,
  setAuthError,
  selectCurrentUser,
  selectCurrentToken,
  selectIsAuthenticated,
  selectAuthLoading,
  selectAuthError,
  selectIsAdmin,
  checkUserPermission,
  PERMISSION_ALIASES,
  getEquivalentPermissionCodes,
} from '../features/auth/authSlice';
import { apiSlice } from '../features/api/apiSlice';

export { PERMISSION_ALIASES, getEquivalentPermissionCodes };

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const dispatch = useAppDispatch();
  const user = useAppSelector(selectCurrentUser);
  const token = useAppSelector(selectCurrentToken);
  const isAuthenticated = useAppSelector(selectIsAuthenticated);
  const loading = useAppSelector(selectAuthLoading);
  const error = useAppSelector(selectAuthError);
  const isAdmin = useAppSelector(selectIsAdmin);

  // Initialize & verify session on startup
  useEffect(() => {
    const verifySession = async () => {
      if (token) {
        dispatch(setAuthLoading(true));
        try {
          const res = await api.get('/auth/me');
          if (res.data && res.data.success && res.data.user) {
            dispatch(updateUser(res.data.user));
          }
        } catch (err) {
          console.error("Session verification failed:", err);
          logout();
        } finally {
          dispatch(setAuthLoading(false));
        }
      } else {
        dispatch(setAuthLoading(false));
      }
    };

    verifySession();
  }, [token, dispatch]);

  // Login handler
  const login = async (username, password) => {
    dispatch(setAuthError(null));
    try {
      const response = await api.post('/auth/login', { username, password });
      const { success, token: authToken, user: userData, message } = response.data;

      if (success) {
        dispatch(setCredentials({ user: userData, token: authToken }));
        return { success: true };
      } else {
        const msg = message || 'Login failed';
        dispatch(setAuthError(msg));
        return { success: false, message: msg };
      }
    } catch (err) {
      const msg = err.response?.data?.message || 'Login failed. Please check your credentials.';
      dispatch(setAuthError(msg));
      return { success: false, message: msg };
    }
  };

  // Logout handler - clears auth state AND resets all RTK Query server caches to prevent data leakage between users
  const logout = useCallback(() => {
    dispatch(authLogout());
    dispatch(apiSlice.util.resetApiState());
  }, [dispatch]);

  /**
   * RBAC Permission Checker
   * Uses centralized pure checkUserPermission algorithm
   */
  const hasPermission = useCallback(
    (permissionCode) => {
      return checkUserPermission(user, permissionCode);
    },
    [user]
  );

  const contextValue = useMemo(
    () => ({
      user,
      token,
      loading,
      error,
      login,
      logout,
      hasPermission,
      isAdmin,
      isAuthenticated,
    }),
    [user, token, loading, error, logout, hasPermission, isAdmin, isAuthenticated]
  );

  return (
    <AuthContext.Provider value={contextValue}>
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

export default AuthContext;
