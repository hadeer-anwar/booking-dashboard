import axios from 'axios';
import { useAuthStore } from '@/src/features/auth/store/auth.store';

const API_URL =
  process.env.NEXT_PUBLIC_API_URL;

export const api = axios.create({
  baseURL: API_URL,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
  withCredentials: true,
});

/** Let the browser set multipart boundary when sending FormData. */
api.interceptors.request.use((config) => {
  if (config.data instanceof FormData && config.headers) {
    delete (config.headers as Record<string, unknown>)['Content-Type'];
  }
  return config;
});


function forceLogoutAndRedirect() {
  if (typeof window === 'undefined') return;

  try {
    useAuthStore.getState().logout();
  } catch {
    // ignore store errors
  }

  if (!window.location.pathname.startsWith('/login')) {
    window.location.replace('/login');
  }
}


let refreshPromise: Promise<unknown> | null = null;

function refreshAccessToken() {
  if (!refreshPromise) {
    refreshPromise = api.post('/auth/refresh').finally(() => {
      refreshPromise = null;
    });
  }
  return refreshPromise;
}

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    if (
      error.response?.status === 401 &&
      !originalRequest._retry &&
      !originalRequest.url?.includes('/auth/login') &&
      !originalRequest.url?.includes('/auth/refresh')
    ) {
      originalRequest._retry = true;

      try {
     
        await refreshAccessToken();

   
        return api(originalRequest);
      } catch {

        forceLogoutAndRedirect();
      }
    }

    if (
      error.response?.status === 401 &&
      originalRequest?.url?.includes('/auth/refresh')
    ) {
      forceLogoutAndRedirect();
    }

    return Promise.reject(error);
  }
);
