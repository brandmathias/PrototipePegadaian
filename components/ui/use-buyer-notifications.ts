"use client";

import * as React from "react";

export type BuyerNotification = {
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

type NotificationResponse = {
  data?: BuyerNotification[];
};

export function useBuyerNotifications(enabled: boolean) {
  const [notifications, setNotifications] = React.useState<BuyerNotification[]>([]);

  const refresh = React.useCallback(async () => {
    if (!enabled) {
      return;
    }

    try {
      const response = await fetch("/api/user/notifikasi?limit=12", {
        cache: "no-store"
      });

      if (!response.ok) {
        return;
      }

      const payload = (await response.json()) as NotificationResponse;
      setNotifications(Array.isArray(payload.data) ? payload.data : []);
    } catch {
      // Notification polling must never break the main buyer navigation.
    }
  }, [enabled]);

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

  const markAsRead = React.useCallback(async (id: string) => {
    setNotifications((current) =>
      current.map((notification) =>
        notification.id === id ? { ...notification, isRead: true, readAt: new Date().toISOString() } : notification
      )
    );

    try {
      await fetch(`/api/user/notifikasi/${id}`, {
        method: "PATCH"
      });
    } catch {
      // The next polling cycle will reconcile optimistic UI if the request fails.
    }
  }, []);

  const markAllAsRead = React.useCallback(async () => {
    setNotifications((current) =>
      current.map((notification) => ({
        ...notification,
        isRead: true,
        readAt: notification.readAt ?? new Date().toISOString()
      }))
    );

    try {
      await fetch("/api/user/notifikasi/read-all", {
        method: "POST"
      });
    } catch {
      // The next polling cycle will reconcile optimistic UI if the request fails.
    }
  }, []);

  return {
    notifications,
    unreadCount: notifications.filter((notification) => !notification.isRead).length,
    refresh,
    markAsRead,
    markAllAsRead
  };
}
