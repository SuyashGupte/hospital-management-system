import React, { createContext, useContext, useEffect, useState, useCallback, useMemo } from 'react';
import type { Employee, LoginRequest } from '../api/types';
import { authService } from '../services/authService';

interface AuthContextType {
  user: Employee | null;
  token: string | null;
  role: string | null;
  isAuthenticated: boolean;
  loading: boolean;
  login: (credentials: LoginRequest) => Promise<void>;
  logout: () => Promise<void>;
  refreshProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [token, setToken] = useState<string | null>(() => authService.getToken());
  const [user, setUser] = useState<Employee | null>(() => authService.getCachedUser());
  const [loading, setLoading] = useState<boolean>(true);

  const role = useMemo(() => user?.type || null, [user]);
  const isAuthenticated = useMemo(() => !!token && !!user, [token, user]);

  const refreshProfile = useCallback(async () => {
    if (!authService.getToken()) {
      setLoading(false);
      return;
    }

    try {
      const currentUser = await authService.getCurrentUser();
      setUser(currentUser);
    } catch (err) {
      console.error('Failed to restore user session:', err);
      setUser(null);
      setToken(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refreshProfile();

    const handleUnauthorized = () => {
      setToken(null);
      setUser(null);
    };

    window.addEventListener('auth:unauthorized', handleUnauthorized);
    return () => window.removeEventListener('auth:unauthorized', handleUnauthorized);
  }, [refreshProfile]);

  const login = useCallback(async (credentials: LoginRequest) => {
    setLoading(true);
    try {
      const response = await authService.login(credentials);
      setToken(response.token);
      setUser(response.employee);
    } finally {
      setLoading(false);
    }
  }, []);

  const logout = useCallback(async () => {
    setLoading(true);
    try {
      await authService.logout();
    } finally {
      setToken(null);
      setUser(null);
      setLoading(false);
    }
  }, []);

  const value = useMemo(
    () => ({
      user,
      token,
      role,
      isAuthenticated,
      loading,
      login,
      logout,
      refreshProfile,
    }),
    [user, token, role, isAuthenticated, loading, login, logout, refreshProfile]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export function useAuth(): AuthContextType {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
