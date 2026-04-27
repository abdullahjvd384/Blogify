import axios from 'axios';
import { env } from '@/env';

/**
 * Axios instance used for ALL API calls.
 * - sends cookies (auth)
 * - tags requests with X-Request-Id for traceability
 * - on 401, attempts a single refresh and retries the original request
 */
export const api = axios.create({
  baseURL: env.apiBaseUrl,
  withCredentials: true,
  timeout: 15_000,
});

api.interceptors.request.use((config) => {
  config.headers = config.headers || {};
  if (!config.headers['X-Request-Id']) {
    config.headers['X-Request-Id'] = crypto.randomUUID();
  }
  return config;
});

let refreshing = null;

api.interceptors.response.use(
  (res) => res,
  async (error) => {
    const original = error.config;
    const status = error.response?.status;

    if (status !== 401 || original?._retry || original?.url?.includes('/auth/')) {
      return Promise.reject(error);
    }

    original._retry = true;
    try {
      refreshing =
        refreshing ||
        api.post('/auth/refresh').finally(() => {
          refreshing = null;
        });
      await refreshing;
      return api(original);
    } catch (refreshErr) {
      return Promise.reject(refreshErr);
    }
  },
);
