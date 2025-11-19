import axios from 'axios';
import { useAuthStore } from '../store/authStore';

const baseURL = import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:3000';

export const api = axios.create({
  baseURL,
  timeout: 10000,
});

let refreshPromise: Promise<string | null> | null = null;

async function refreshAccessToken(): Promise<string | null> {
  if (!refreshPromise) {
    refreshPromise = (async () => {
      const { refreshToken, setCredentials, logout } = useAuthStore.getState();
      if (!refreshToken) {
        logout();
        return null;
      }
      try {
        const response = await axios.post(`${baseURL}/auth/refresh`, {
          refreshToken,
        });
        const { accessToken, refreshToken: newRefreshToken, roles } = response.data;
        setCredentials({ accessToken, refreshToken: newRefreshToken, roles: roles ?? [] });
        return accessToken;
      } catch {
        logout();
        return null;
      } finally {
        refreshPromise = null;
      }
    })();
  }
  return refreshPromise;
}

api.interceptors.request.use((config) => {
  const token = useAuthStore.getState().accessToken;
  if (token && config.headers) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    if (error.response?.status === 401) {
      const newToken = await refreshAccessToken();
      if (newToken) {
        const config = error.config;
        config.headers.Authorization = `Bearer ${newToken}`;
        return api.request(config);
      }
    }
    return Promise.reject(error);
  },
);

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
}
