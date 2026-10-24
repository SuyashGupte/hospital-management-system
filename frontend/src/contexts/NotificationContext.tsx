import React, { createContext, useContext, useState, useCallback, useMemo } from 'react';
import type { AppNotification } from '../api/types';

interface NotificationContextType {
  notifications: AppNotification[];
  notify: (notification: Omit<AppNotification, 'id'>) => string;
  notifySuccess: (title: string, subtitle?: string) => string;
  notifyError: (title: string, subtitle?: string) => string;
  notifyWarning: (title: string, subtitle?: string) => string;
  notifyInfo: (title: string, subtitle?: string) => string;
  dismissNotification: (id: string) => void;
  clearAll: () => void;
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

export const NotificationProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [notifications, setNotifications] = useState<AppNotification[]>([]);

  const dismissNotification = useCallback((id: string) => {
    setNotifications((prev) => prev.filter((n) => n.id !== id));
  }, []);

  const notify = useCallback(
    (notification: Omit<AppNotification, 'id'>): string => {
      const id = `notif_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
      const newNotification: AppNotification = { ...notification, id };

      setNotifications((prev) => [...prev, newNotification]);

      // Auto dismiss after timeout (default 5000ms, or specified timeout, or 0 for persistent)
      const timeout = notification.timeout ?? 5000;
      if (timeout > 0) {
        setTimeout(() => {
          dismissNotification(id);
        }, timeout);
      }

      return id;
    },
    [dismissNotification]
  );

  const notifySuccess = useCallback(
    (title: string, subtitle?: string) => notify({ kind: 'success', title, subtitle }),
    [notify]
  );

  const notifyError = useCallback(
    (title: string, subtitle?: string) => notify({ kind: 'error', title, subtitle, timeout: 8000 }),
    [notify]
  );

  const notifyWarning = useCallback(
    (title: string, subtitle?: string) => notify({ kind: 'warning', title, subtitle }),
    [notify]
  );

  const notifyInfo = useCallback(
    (title: string, subtitle?: string) => notify({ kind: 'info', title, subtitle }),
    [notify]
  );

  const clearAll = useCallback(() => {
    setNotifications([]);
  }, []);

  const value = useMemo(
    () => ({
      notifications,
      notify,
      notifySuccess,
      notifyError,
      notifyWarning,
      notifyInfo,
      dismissNotification,
      clearAll,
    }),
    [notifications, notify, notifySuccess, notifyError, notifyWarning, notifyInfo, dismissNotification, clearAll]
  );

  return <NotificationContext.Provider value={value}>{children}</NotificationContext.Provider>;
};

export function useNotification(): NotificationContextType {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error('useNotification must be used within a NotificationProvider');
  }
  return context;
}
