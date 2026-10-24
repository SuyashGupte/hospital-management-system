import apiClient, { AUTH_TOKEN_KEY, USER_INFO_KEY } from '../api/client';
import type {
  Employee,
  LoginRequest,
  LoginResponse,
  ChangePasswordRequest,
} from '../api/types';

export const authService = {
  /**
   * Login with username/email and password
   */
  async login(credentials: LoginRequest): Promise<LoginResponse> {
    const response = await apiClient.post<LoginResponse>('/auth/login', credentials);
    const data = response.data;
    if (data.token) {
      localStorage.setItem(AUTH_TOKEN_KEY, data.token);
      localStorage.setItem(USER_INFO_KEY, JSON.stringify(data.employee));
    }
    return data;
  },

  /**
   * Get current authenticated user profile
   */
  async getCurrentUser(): Promise<Employee> {
    const response = await apiClient.get<Employee>('/auth/me');
    localStorage.setItem(USER_INFO_KEY, JSON.stringify(response.data));
    return response.data;
  },

  /**
   * Change current user's password
   */
  async changePassword(request: ChangePasswordRequest): Promise<void> {
    await apiClient.post('/auth/change-password', request);
  },

  /**
   * Logout user and clear tokens
   */
  async logout(): Promise<void> {
    try {
      await apiClient.post('/auth/logout');
    } catch {
      // Ignore network errors on logout
    } finally {
      localStorage.removeItem(AUTH_TOKEN_KEY);
      localStorage.removeItem(USER_INFO_KEY);
    }
  },

  /**
   * Get stored token
   */
  getToken(): string | null {
    return localStorage.getItem(AUTH_TOKEN_KEY);
  },

  /**
   * Get cached user
   */
  getCachedUser(): Employee | null {
    const cached = localStorage.getItem(USER_INFO_KEY);
    if (!cached) return null;
    try {
      return JSON.parse(cached) as Employee;
    } catch {
      return null;
    }
  },
};
