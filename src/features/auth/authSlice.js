import { createSlice, createSelector } from '@reduxjs/toolkit';

export const PERMISSION_ALIASES = {
  CLIENT_VIEW: ['CLIENT_VIEW', 'PARTY_VIEW'],
  PARTY_VIEW: ['PARTY_VIEW', 'CLIENT_VIEW'],
  CLIENT_CREATE: ['CLIENT_CREATE', 'PARTY_CREATE'],
  PARTY_CREATE: ['PARTY_CREATE', 'CLIENT_CREATE'],
  CLIENT_EDIT: ['CLIENT_EDIT', 'PARTY_EDIT'],
  PARTY_EDIT: ['PARTY_EDIT', 'CLIENT_EDIT'],
  CLIENT_DELETE: ['CLIENT_DELETE', 'PARTY_DELETE'],
  PARTY_DELETE: ['PARTY_DELETE', 'CLIENT_DELETE'],
  TERM_VIEW: ['TERM_VIEW', 'TERMS_VIEW', 'QUOTATION_VIEW'],
  TERMS_VIEW: ['TERMS_VIEW', 'TERM_VIEW', 'QUOTATION_VIEW'],
  TERM_CREATE: ['TERM_CREATE', 'TERMS_CREATE', 'QUOTATION_CREATE', 'TERM_EDIT'],
  TERMS_CREATE: ['TERMS_CREATE', 'TERM_CREATE', 'QUOTATION_CREATE', 'TERM_EDIT'],
  TERM_EDIT: ['TERM_EDIT', 'TERMS_EDIT', 'QUOTATION_EDIT'],
  TERMS_EDIT: ['TERMS_EDIT', 'TERM_EDIT', 'QUOTATION_EDIT'],
  TERM_DELETE: ['TERM_DELETE', 'TERMS_DELETE', 'TERM_EDIT', 'QUOTATION_EDIT'],
  TERMS_DELETE: ['TERMS_DELETE', 'TERM_DELETE', 'TERM_EDIT', 'QUOTATION_EDIT'],
};

export const getEquivalentPermissionCodes = (permissionCode) => {
  if (!permissionCode) return [];
  if (Array.isArray(permissionCode)) {
    return Array.from(new Set(permissionCode.flatMap((c) => getEquivalentPermissionCodes(c))));
  }
  return PERMISSION_ALIASES[permissionCode] || [permissionCode];
};

export const isUserAdmin = (user) => {
  if (!user) return false;
  const rolesArray = user.roles
    ? user.roles
    : user.role
    ? [user.role]
    : [];

  return rolesArray.some((r) => {
    if (!r) return false;
    const roleName = typeof r === 'string' ? r : r.roleName;
    const clean = roleName?.toLowerCase()?.replace(/[\s_-]+/g, '');
    return clean === 'admin' || clean === 'superadmin' || clean === 'administrator';
  });
};

/**
 * Pure RBAC Permission Checker
 * Evaluates user-specific overrides first (DENY -> ALLOW), then Admin role bypass, then Role permissions union.
 */
export const checkUserPermission = (user, permissionCode) => {
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

  // 2. Check if user has an "Admin" role (Admin has all permissions)
  if (isUserAdmin(user)) return true;

  // Support both user.roles (array) and fallback user.role (object)
  const rolesArray = user.roles
    ? user.roles
    : user.role
    ? [user.role]
    : [];

  if (!Array.isArray(rolesArray) || rolesArray.length === 0) return false;

  // 3. Check union of all assigned roles permissions
  return rolesArray.some((role) => {
    if (!role || typeof role === 'string' || !role.permissions || !Array.isArray(role.permissions)) return false;
    return role.permissions.some((perm) => {
      if (!perm) return false;
      const permCode = typeof perm === 'string' ? perm : perm.permissionCode;
      return codesToCheck.includes(permCode);
    });
  });
};

const getInitialUser = () => {
  try {
    const saved = localStorage.getItem('netfil_user');
    return saved ? JSON.parse(saved) : null;
  } catch (e) {
    console.error('Failed to parse cached user:', e);
    return null;
  }
};

const getInitialToken = () => {
  return localStorage.getItem('netfil_token') || null;
};

const initialState = {
  user: getInitialUser(),
  token: getInitialToken(),
  isAuthenticated: !!getInitialToken(),
  loading: false,
  error: null,
};

export const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    setCredentials: (state, action) => {
      const { user, token } = action.payload;
      state.user = user;
      state.token = token;
      state.isAuthenticated = Boolean(token && user);
      state.error = null;

      if (token) {
        localStorage.setItem('netfil_token', token);
      }
      if (user) {
        localStorage.setItem('netfil_user', JSON.stringify(user));
      }
    },
    updateUser: (state, action) => {
      state.user = action.payload;
      if (action.payload) {
        localStorage.setItem('netfil_user', JSON.stringify(action.payload));
      }
    },
    logout: (state) => {
      state.user = null;
      state.token = null;
      state.isAuthenticated = false;
      state.error = null;
      localStorage.removeItem('netfil_token');
      localStorage.removeItem('netfil_user');
    },
    setAuthLoading: (state, action) => {
      state.loading = Boolean(action.payload);
    },
    setAuthError: (state, action) => {
      state.error = action.payload;
    },
  },
});

export const { setCredentials, updateUser, logout, setAuthLoading, setAuthError } = authSlice.actions;

// Selectors
export const selectCurrentUser = (state) => state.auth.user;
export const selectCurrentToken = (state) => state.auth.token;
export const selectIsAuthenticated = (state) => state.auth.isAuthenticated;
export const selectAuthLoading = (state) => state.auth.loading;
export const selectAuthError = (state) => state.auth.error;

export const selectIsAdmin = createSelector([selectCurrentUser], (user) => isUserAdmin(user));

export const makeSelectHasPermission = (permissionCode) =>
  createSelector([selectCurrentUser], (user) => checkUserPermission(user, permissionCode));

export default authSlice.reducer;
