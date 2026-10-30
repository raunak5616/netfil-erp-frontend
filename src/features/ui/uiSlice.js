import { createSlice } from '@reduxjs/toolkit';

const getInitialSidebarCollapsed = () => {
  return localStorage.getItem('netfil_sidebar_collapsed') === 'true';
};

const getInitialExpandedGroups = () => {
  const savedState = localStorage.getItem('netfil_sidebar_expanded_groups');
  if (savedState) {
    try {
      return JSON.parse(savedState);
    } catch (e) {
      console.error('Failed to parse expanded groups state:', e);
    }
  }
  return {
    'master-module': true,
    'item-master': true,
    'commercial-module': true,
    'bom-module': true,
    'production-module': true,
    'purchase-module': true,
    'store-module': true,
  };
};

const initialState = {
  sidebarCollapsed: getInitialSidebarCollapsed(),
  sidebarExpandedGroups: getInitialExpandedGroups(),
  mobileSidebarOpen: false,
  searchModalOpen: false,
  searchQuery: '',
  notification: null,
};

export const uiSlice = createSlice({
  name: 'ui',
  initialState,
  reducers: {
    toggleSidebar: (state) => {
      state.sidebarCollapsed = !state.sidebarCollapsed;
      localStorage.setItem('netfil_sidebar_collapsed', String(state.sidebarCollapsed));
    },
    setSidebarCollapsed: (state, action) => {
      state.sidebarCollapsed = Boolean(action.payload);
      localStorage.setItem('netfil_sidebar_collapsed', String(state.sidebarCollapsed));
    },
    toggleMobileSidebar: (state) => {
      state.mobileSidebarOpen = !state.mobileSidebarOpen;
    },
    setMobileSidebarOpen: (state, action) => {
      state.mobileSidebarOpen = Boolean(action.payload);
    },
    toggleNavGroup: (state, action) => {
      const groupId = action.payload;
      state.sidebarExpandedGroups = {
        ...state.sidebarExpandedGroups,
        [groupId]: !state.sidebarExpandedGroups[groupId],
      };
      localStorage.setItem('netfil_sidebar_expanded_groups', JSON.stringify(state.sidebarExpandedGroups));
    },
    setNavGroups: (state, action) => {
      state.sidebarExpandedGroups = {
        ...state.sidebarExpandedGroups,
        ...action.payload,
      };
      localStorage.setItem('netfil_sidebar_expanded_groups', JSON.stringify(state.sidebarExpandedGroups));
    },
    setSearchModalOpen: (state, action) => {
      state.searchModalOpen = Boolean(action.payload);
    },
    setSearchQuery: (state, action) => {
      state.searchQuery = action.payload;
    },
    showNotification: (state, action) => {
      state.notification = {
        id: Date.now(),
        type: action.payload.type || 'info', // 'success' | 'error' | 'warning' | 'info'
        message: action.payload.message || '',
      };
    },
    clearNotification: (state) => {
      state.notification = null;
    },
  },
});

export const {
  toggleSidebar,
  setSidebarCollapsed,
  toggleMobileSidebar,
  setMobileSidebarOpen,
  toggleNavGroup,
  setNavGroups,
  setSearchModalOpen,
  setSearchQuery,
  showNotification,
  clearNotification,
} = uiSlice.actions;

// Selectors
export const selectSidebarCollapsed = (state) => state.ui.sidebarCollapsed;
export const selectSidebarExpandedGroups = (state) => state.ui.sidebarExpandedGroups;
export const selectMobileSidebarOpen = (state) => state.ui.mobileSidebarOpen;
export const selectSearchModalOpen = (state) => state.ui.searchModalOpen;
export const selectSearchQuery = (state) => state.ui.searchQuery;
export const selectNotification = (state) => state.ui.notification;

export default uiSlice.reducer;
