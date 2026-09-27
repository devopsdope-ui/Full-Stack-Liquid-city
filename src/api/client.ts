import axios, { type AxiosInstance, type AxiosError, AxiosRequestConfig } from 'axios';
import type { ApiError } from '../types';

const BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000';

const api: AxiosInstance = axios.create({
  baseURL: BASE_URL,
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor – attach auth token if available
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('lc_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor – normalize errors
api.interceptors.response.use(
  (response) => response,
  (error: AxiosError) => {
    const apiError: ApiError = {
      status: error.response?.status ?? 0,
      message: getErrorMessage(error),
      detail: typeof error.response?.data === 'object'
        ? (error.response.data as Record<string, string>).detail
        : String(error.response?.data ?? ''),
    };

    if (apiError.status === 401) {
      // Clear session and redirect
      localStorage.removeItem('lc_token');
      localStorage.removeItem('lc_user');
      if (window.location.pathname !== '/login') {
        window.location.href = '/login?expired=1';
      }
    }

    return Promise.reject(apiError);
  }
);

function getErrorMessage(error: AxiosError): string {
  if (!error.response) {
    return 'Liquid City backend is currently unavailable.';
  }
  switch (error.response.status) {
    case 401:
      return 'Session expired. Please log in again.';
    case 403:
      return 'You do not have permission to perform this action.';
    case 404:
      return 'Information not found.';
    case 422:
      return 'Please check the submitted information.';
    case 500:
    case 502:
    case 503:
      return 'Something went wrong. Try again.';
    default:
      return `Request failed (${error.response.status}).`;
  }
}

export default api;

// Typed GET helper
export async function get<T>(url: string, config?: AxiosRequestConfig): Promise<T> {
  const res = await api.get<T>(url, config);
  return res.data;
}

// Typed POST helper
export async function post<T>(url: string, data?: unknown, config?: AxiosRequestConfig): Promise<T> {
  const res = await api.post<T>(url, data, config);
  return res.data;
}

// Typed PUT helper
export async function put<T>(url: string, data?: unknown, config?: AxiosRequestConfig): Promise<T> {
  const res = await api.put<T>(url, data, config);
  return res.data;
}

// Typed DELETE helper
export async function del<T>(url: string, config?: AxiosRequestConfig): Promise<T> {
  const res = await api.delete<T>(url, config);
  return res.data;
}

export { api };
