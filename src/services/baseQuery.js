import api from './api';

/**
 * Custom baseQuery implementation for RTK Query backed by the application's existing Axios instance.
 * Ensures consistent baseURL (/api), Authorization header injection, FormData handling,
 * and 401 interceptor redirection.
 */
export const axiosBaseQuery =
  ({ baseUrl } = { baseUrl: '' }) =>
  async ({ url, method = 'get', data, params, headers }) => {
    try {
      const result = await api({
        url: baseUrl + url,
        method,
        data,
        params,
        headers,
      });
      return { data: result.data };
    } catch (axiosError) {
      const err = axiosError;
      const status = err.response?.status;
      let message = err.response?.data?.message || err.message;
      if (status === 413) {
        message = 'Request payload too large (HTTP 413). Please reduce file or payload size.';
      }
      return {
        error: {
          status,
          data: err.response?.data || err.message,
          message,
        },
      };
    }
  };

export default axiosBaseQuery;
