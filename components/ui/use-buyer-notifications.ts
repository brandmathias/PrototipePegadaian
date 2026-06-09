"use client";

import * as React from "react";

export type PersistedNotification = {
  id: string;
  title: string;
  message: string;
  type: string;
  entityType?: string | null;
  entityId?: string | null;
  actionHref?: string | null;
  isRead: boolean;
  createdAt: string;
  readAt?: string | null;
  metadata?: unknown;
};

export type BuyerNotification = PersistedNotification;

type NotificationResponse = {
  data?: PersistedNotification[];
};

type PersistedNotificationEndpoints = {
  list: string;
  read: (id: string) => string;
  readAll: string;
};

const BUYER_NOTIFICATION_ENDPOINTS: PersistedNotificationEndpoints = {
  list: "/api/user/notifikasi?limit=12",
  read: (id) => `/api/user/notifikasi/${id}`,
  readAll: "/api/user/notifikasi/read-all"
};

const SUPERADMIN_NOTIFICATION_ENDPOINTS: PersistedNotificationEndpoints = {
  list: "/api/superadmin/notifikasi?limit=12",
  read: (id) => `/api/superadmin/notifikasi/${id}`,
  readAll: "/api/superadmin/notifikasi/read-all"
};

function usePersistedNotifications(enabled: boolean, endpoints: PersistedNotificationEndpoints) {
  const [notifications, setNotifications] = React.useState<PersistedNotification[]>([]);

  const refresh = React.useCallback(async () => {
    if (!enabled) {
      return;
    }

    try {
      const response = await fetch(endpoints.list, {
        cache: "no-store"
      });

      if (!response.ok) {
        return;
      }

      const payload = (await response.json()) as NotificationResponse;
      setNotifications(Array.isArray(payload.data) ? payload.data : []);
    } catch {
      // Notification polling must never break the main navigation.
    }
  }, [enabled, endpoints.list]);

  React.useEffect(() => {
    if (!enabled) {
      setNotifications([]);
      return;
    }

    void refresh();
    const intervalId = window.setInterval(() => {
      void refresh();
    }, 30_000);

    return () => window.clearInterval(intervalId);
  }, [enabled, refresh]);

  const markAsRead = React.useCallback(
    async (id: string) => {
      setNotifications((current) =>
        current.map((notification) =>
          notification.id === id ? { ...notification, isRead: true, readAt: new Date().toISOString() } : notification
        )
      );

      try {
        await fetch(endpoints.read(id), {
          method: "PATCH"
        });
      } catch {
        // The next polling cycle will reconcile optimistic UI if the request fails.
      }
    },
    [endpoints]
  );

  const markAllAsRead = React.useCallback(
    async () => {
      setNotifications((current) =>
        current.map((notification) => ({
          ...notification,
          isRead: true,
          readAt: notification.readAt ?? new Date().toISOString()
        }))
      );

      try {
        await fetch(endpoints.readAll, {
          method: "POST"
        });
      } catch {
        // The next polling cycle will reconcile optimistic UI if the request fails.
      }
    },
    [endpoints]
  );

  return {
    notifications,
    unreadCount: notifications.filter((notification) => !notification.isRead).length,
    refresh,
    markAsRead,
    markAllAsRead
  };
}

export function useBuyerNotifications(enabled: boolean) {
  return usePersistedNotifications(enabled, BUYER_NOTIFICATION_ENDPOINTS);
}

export function useSuperAdminNotifications(enabled: boolean) {
  return usePersistedNotifications(enabled, SUPERADMIN_NOTIFICATION_ENDPOINTS);
}
