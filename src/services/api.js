import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL || '/api';

const api = axios.create({
  baseURL: API_BASE_URL,
});

// Attach Bearer token from localStorage to every outgoing request & handle FormData content-type
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('netfil_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    if (config.data instanceof FormData) {
      // Allow browser / Axios to automatically set multipart/form-data boundary header
      delete config.headers['Content-Type'];
    } else if (!config.headers['Content-Type']) {
      config.headers['Content-Type'] = 'application/json';
    }

    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Global response interceptor for handling 401 errors and standardizing error messages
api.interceptors.response.use(
  (response) => response,
  (error) => {
    // Attach clean, normalized userMessage
    const serverMessage = error.response?.data?.message;
    error.userMessage = serverMessage || error.message || 'A network error occurred. Please try again.';

    if (error.response && error.response.status === 401) {
      // Clear credentials if token is invalid or expired
      localStorage.removeItem('netfil_token');
      localStorage.removeItem('netfil_user');

      // If not on login page, redirect to login
      if (window.location.pathname !== '/login') {
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);

export default api;
