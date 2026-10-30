import { configureStore } from '@reduxjs/toolkit';
import authReducer from '../features/auth/authSlice';
import uiReducer from '../features/ui/uiSlice';
import masterDataReducer from '../features/masterData/masterDataSlice';
import { apiSlice } from '../features/api/apiSlice';

/**
 * Central Redux Store Configuration.
 * Contains:
 * - auth: User session, credentials, and RBAC permissions
 * - ui: Global drawer, collapsed navigation, quick search, notifications
 * - masterData: Shared client-side reference preferences
 * - api: Unified RTK Query server state cache and deduplication layer
 */
export const store = configureStore({
  reducer: {
    auth: authReducer,
    ui: uiReducer,
    masterData: masterDataReducer,
    [apiSlice.reducerPath]: apiSlice.reducer,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: {
        // Ignore file uploads and multipart/blob payloads in RTK Query actions
        ignoredActions: [
          'api/executeMutation/pending',
          'api/executeMutation/fulfilled',
          'api/executeQuery/fulfilled',
        ],
        ignoredActionPaths: ['meta.arg.originalArgs', 'payload'],
        ignoredPaths: ['api.mutations', 'api.queries'],
      },
    }).concat(apiSlice.middleware),
  devTools: process.env.NODE_ENV !== 'production',
});

export default store;
