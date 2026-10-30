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
      return {
        error: {
          status: err.response?.status,
          data: err.response?.data || err.message,
        },
      };
    }
  };

export default axiosBaseQuery;
