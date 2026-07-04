import axios, { AxiosError, AxiosRequestConfig } from 'axios';
import { setCookie, eraseCookie } from '@/lib/utils';

const BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'https://matri-entry.vercel.app/api';

const api = axios.create({
  baseURL: BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor: attach Authorization header
api.interceptors.request.use(
  (config) => {
    if (typeof window !== 'undefined') {
      const token = localStorage.getItem('accessToken');
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor: handle 401, try refresh
let isRefreshing = false;
let failedQueue: Array<{
  resolve: (value: unknown) => void;
  reject: (reason?: unknown) => void;
}> = [];

const processQueue = (error: AxiosError | null, token: string | null = null) => {
  failedQueue.forEach((prom) => {
    if (error) {
      prom.reject(error);
    } else {
      prom.resolve(token);
    }
  });
  failedQueue = [];
};

api.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const originalRequest = error.config as AxiosRequestConfig & { _retry?: boolean };

    if (error.response?.status === 401 && !originalRequest._retry) {
      if (isRefreshing) {
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject });
        })
          .then((token) => {
            if (originalRequest.headers) {
              originalRequest.headers['Authorization'] = `Bearer ${token}`;
            }
            return api(originalRequest);
          })
          .catch((err) => Promise.reject(err));
      }

      originalRequest._retry = true;
      isRefreshing = true;

      try {
        const response = await axios.post(`${BASE_URL}/auth/refresh`, {}, {
          withCredentials: true,
        });
        const { accessToken } = response.data;
        localStorage.setItem('accessToken', accessToken);
        setCookie('auth-token', accessToken, 7);
        processQueue(null, accessToken);
        if (originalRequest.headers) {
          originalRequest.headers['Authorization'] = `Bearer ${accessToken}`;
        }
        return api(originalRequest);
      } catch (refreshError) {
        processQueue(refreshError as AxiosError, null);
        localStorage.removeItem('accessToken');
        localStorage.removeItem('user');
        eraseCookie('auth-token');
        if (typeof window !== 'undefined') {
          window.location.href = '/login';
        }
        return Promise.reject(refreshError);
      } finally {
        isRefreshing = false;
      }
    }

    return Promise.reject(error);
  }
);

export default api;

// Auth APIs
export const authApi = {
  login: (username: string, password: string) =>
    api.post('/auth/login', { username, password }),
  logout: () => api.post('/auth/logout'),
  refresh: () => api.post('/auth/refresh'),
  getProfile: () => api.get('/auth/me'),
};

// Admin APIs
export const adminApi = {
  // Users
  getUsers: (params?: Record<string, unknown>) => api.get('/admin/users', { params }),
  createUser: (data: Record<string, unknown>) => api.post('/admin/users', data),
  updateUser: (id: string, data: Record<string, unknown>) => api.put(`/admin/users/${id}`, data),
  deleteUser: (id: string) => api.delete(`/admin/users/${id}`),
  resetPassword: (id: string, password: string) =>
    api.post(`/admin/users/${id}/reset-password`, { newPassword: password }),
  extendExpiry: (id: string, days: number) =>
    api.put(`/admin/users/${id}/extend-expiry`, { days }),
  toggleActive: (id: string) => api.put(`/admin/users/${id}/toggle-active`),
  updateAssignedCount: (id: string, newCount: number) =>
    api.put(`/admin/users/${id}/assigned-count`, { newCount }),

  // Entries
  getEntries: (params?: Record<string, unknown>) => api.get('/admin/entries', { params }),
  updateEntry: (id: string, data: Record<string, unknown>) =>
    api.put(`/admin/entries/${id}`, data),
  deleteEntry: (id: string) => api.delete(`/admin/entries/${id}`),
  exportEntries: () => api.get('/admin/entries/export', { responseType: 'blob' }),

  // Dashboard
  getDashboardStats: () => api.get('/admin/dashboard'),

  // Monitoring
  getMonitoring: () => api.get('/admin/monitoring'),
};

// User APIs
export const userApi = {
  getDashboard: () => api.get('/user/dashboard'),
  /** Returns the next blank/draft DataEntry document (includes _id, slotNumber) */
  getNextSlot: () => api.get('/user/entries/current'),
  /** Returns { completed, pending, assigned } counts */
  getProgress: () => api.get('/user/entries/progress'),
  /**
   * Submit or save draft for a specific entry slot.
   * @param id  - DataEntry _id (from getNextSlot response)
   * @param data - Form data (name, profileId, age …) + status
   */
  updateEntry: (id: string, data: Record<string, unknown>) =>
    api.put(`/user/entries/${id}`, data),
  getMyEntries: (params?: Record<string, unknown>) =>
    api.get('/user/entries', { params }),
  getProfile: () => api.get('/user/profile'),
};
