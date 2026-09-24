import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';

import {
  createNotification,
  fetchNotifications,
  markAllNotificationsRead,
  markNotificationRead,
  type AppNotification,
  type NewNotification,
  type NotificationAudience,
} from '../services/notificationService';
import { useAuth } from '../hooks/useAuth';
import type { Role } from '../types';

export type { AppNotification };

type NotificationsContextValue = {
  notifications: AppNotification[];
  unreadCount: number;
  loading: boolean;
  refresh: () => Promise<void>;
  pushNotification: (input: NewNotification) => Promise<void>;
  markAsRead: (id: string) => Promise<void>;
  markAllAsRead: () => Promise<void>;
};

const NotificationsContext = createContext<NotificationsContextValue | undefined>(
  undefined
);

function audienceForRole(role: Role | null): NotificationAudience | null {
  if (role === 'driver') return 'driver';
  if (role === 'customer') return 'customer';
  return null;
}

export function NotificationsProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const { role } = useAuth();
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [loading, setLoading] = useState(true);

  const audience = audienceForRole(role);
  const recipientName = '';

  const refresh = useCallback(async () => {
    setLoading(true);
    try {
      const records = await fetchNotifications('customer', '');
      setNotifications(records);
    } catch {
      setNotifications([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    setLoading(true);
    refresh();
  }, [refresh]);

  const pushNotification = useCallback(async (input: NewNotification) => {
    const record = await createNotification(input);
    setNotifications((prev) => [record, ...prev]);
  }, []);

  const markAsRead = useCallback(async (id: string) => {
    setNotifications((prev) =>
      prev.map((item) => (item.id === id ? { ...item, read: true } : item))
    );
    try {
      await markNotificationRead(id);
    } catch {
      // keep optimistic state; next refresh will reconcile
    }
  }, []);

  const markAllAsRead = useCallback(async () => {
    if (!audience) return;
    setNotifications((prev) =>
      prev.map((item) => ({ ...item, read: true }))
    );
    try {
      await markAllNotificationsRead(audience, recipientName);
    } catch {
      // keep optimistic state; next refresh will reconcile
    }
  }, [audience, recipientName]);

  const unreadCount = useMemo(
    () => notifications.filter((item) => !item.read).length,
    [notifications]
  );

  const value = useMemo<NotificationsContextValue>(
    () => ({
      notifications,
      unreadCount,
      loading,
      refresh,
      pushNotification,
      markAsRead,
      markAllAsRead,
    }),
    [
      notifications,
      unreadCount,
      loading,
      refresh,
      pushNotification,
      markAsRead,
      markAllAsRead,
    ]
  );

  return (
    <NotificationsContext.Provider value={value}>
      {children}
    </NotificationsContext.Provider>
  );
}

export function useNotifications(): NotificationsContextValue {
  const context = useContext(NotificationsContext);
  if (context === undefined) {
    throw new Error(
      'useNotifications must be used within a NotificationsProvider'
    );
  }
  return context;
}
