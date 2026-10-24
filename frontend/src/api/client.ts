import axios, {
  type AxiosError,
  type AxiosInstance,
  type AxiosRequestConfig,
  type AxiosResponse,
  type InternalAxiosRequestConfig,
} from 'axios';
import type { ApiErrorResponse } from './types';

export const AUTH_TOKEN_KEY = 'hospital_auth_token';
export const USER_INFO_KEY = 'hospital_user_info';
export const THEME_KEY = 'hospital_theme_preference';

/**
 * Normalized API Error class providing structured error details
 */
export class ApiError extends Error {
  public status: number;
  public timestamp?: string;
  public path?: string;
  public fieldErrors?: Record<string, string>;
  public rawError: unknown;

  constructor(
    message: string,
    status = 500,
    fieldErrors?: Record<string, string>,
    path?: string,
    timestamp?: string,
    rawError?: unknown
  ) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.fieldErrors = fieldErrors;
    this.path = path;
    this.timestamp = timestamp;
    this.rawError = rawError;
  }
}

/**
 * Base Axios instance configured for Spring Boot REST API
 */
const apiClient: AxiosInstance = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || '/api',
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
    Accept: 'application/json',
  },
  withCredentials: true,
});

/**
 * Request Interceptor: Attach JWT Bearer Token and trace headers
 */
apiClient.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    const token = localStorage.getItem(AUTH_TOKEN_KEY);
    if (token && config.headers) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    if (import.meta.env.DEV) {
      console.debug(`[HTTP Request] ${config.method?.toUpperCase()} ${config.url}`, {
        params: config.params,
        data: config.data,
      });
    }

    return config;
  },
  (error: AxiosError) => {
    return Promise.reject(error);
  }
);

/**
 * Response Interceptor: Format responses, handle 401s, normalize backend error bodies
 */
apiClient.interceptors.response.use(
  (response: AxiosResponse) => {
    if (import.meta.env.DEV) {
      console.debug(`[HTTP Response] ${response.status} ${response.config.url}`, response.data);
    }
    return response;
  },
  async (error: AxiosError<ApiErrorResponse>) => {
    const config = error.config as AxiosRequestConfig & { _retryCount?: number };

    // Retry transient network errors or 503/504 errors up to 2 times
    if (
      config &&
      (!error.response || [502, 503, 504].includes(error.response.status)) &&
      (config._retryCount || 0) < 2 &&
      config.method?.toLowerCase() === 'get'
    ) {
      config._retryCount = (config._retryCount || 0) + 1;
      const delay = Math.pow(2, config._retryCount) * 500;
      await new Promise((resolve) => setTimeout(resolve, delay));
      return apiClient(config);
    }

    // Handle 401 Unauthorized (Expired or Invalid JWT)
    if (error.response?.status === 401) {
      const isAuthRequest = config?.url?.includes('/auth/login');
      if (!isAuthRequest) {
        localStorage.removeItem(AUTH_TOKEN_KEY);
        localStorage.removeItem(USER_INFO_KEY);
        window.dispatchEvent(new CustomEvent('auth:unauthorized'));
      }
    }

    // Normalize error data
    const status = error.response?.status || 500;
    const errorData = error.response?.data;

    let message = 'An unexpected error occurred. Please try again.';
    let fieldErrors: Record<string, string> | undefined;
    let path: string | undefined;
    let timestamp: string | undefined;

    if (errorData) {
      if (typeof errorData === 'object') {
        message = errorData.message || errorData.error || message;
        fieldErrors = errorData.fieldErrors;
        path = errorData.path;
        timestamp = errorData.timestamp;
      } else if (typeof errorData === 'string') {
        message = errorData;
      }
    } else if (error.message) {
      message = error.message;
    }

    const normalizedError = new ApiError(
      message,
      status,
      fieldErrors,
      path,
      timestamp,
      error
    );

    if (import.meta.env.DEV) {
      console.error(`[HTTP Error] ${status} ${config?.url}:`, normalizedError);
    }

    return Promise.reject(normalizedError);
  }
);

export default apiClient;
