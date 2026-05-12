/* eslint-disable react-hooks/set-state-in-effect */

"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { usePathname } from "next/navigation";
import { useSession } from "next-auth/react";
import { toast } from "react-hot-toast";

export type StreamNotification = {
  id: string;
  type: string;
  title: string;
  message: string;
  link?: string;
  createdAt: string;
  isRead: boolean;
};

type NotificationResponse = {
  items: Array<{
    _id: string;
    type: string;
    title: string;
    message: string;
    link?: string;
    isRead?: boolean;
    createdAt?: string;
  }>;
  unreadCount: number;
};

type UseNotificationStreamOptions = {
  scope?: "personal" | "admin";
  sellerId?: string | null;
};

function normalizeNotification(
  notification: NotificationResponse["items"][number] | StreamNotification,
): StreamNotification {
  if ("id" in notification) {
    return notification;
  }

  return {
    id: notification._id,
    type: notification.type,
    title: notification.title,
    message: notification.message,
    link: notification.link || "",
    createdAt: notification.createdAt || new Date().toISOString(),
    isRead: Boolean(notification.isRead),
  };
}

export function useNotificationStream(options?: UseNotificationStreamOptions) {
  const pathname = usePathname();
  const { status } = useSession();
  const scope = options?.scope || "personal";
  const params = new URLSearchParams();
  if (scope === "admin") {
    params.set("scope", "admin");
  }
  if (options?.sellerId) {
    params.set("sellerId", options.sellerId);
  }
  const query = params.toString();
  const apiPath = useMemo(
    () => `/api/notifications${query ? `?${query}` : ""}`,
    [query],
  );
  const streamPath = useMemo(
    () => `/api/notifications/stream${query ? `?${query}` : ""}`,
    [query],
  );

  const [notifications, setNotifications] = useState<StreamNotification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const eventSourceRef = useRef<EventSource | null>(null);
  const pollingRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const reconnectRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const connectRef = useRef<() => void>(() => undefined);
  const establishedRef = useRef(false);

  const fetchLatest = useCallback(async () => {
    if (status !== "authenticated") {
      return;
    }

    const response = await fetch(apiPath, { cache: "no-store" });
    const json = (await response.json()) as {
      success: boolean;
      data?: NotificationResponse;
    };

    if (!json.success || !json.data) {
      return;
    }

    setNotifications(json.data.items.map(normalizeNotification));
    setUnreadCount(json.data.unreadCount || 0);
  }, [apiPath, status]);

  const startPolling = useCallback(() => {
    if (pollingRef.current) {
      return;
    }

    void fetchLatest();
    pollingRef.current = setInterval(() => {
      void fetchLatest();
    }, 30_000);
  }, [fetchLatest]);

  const stopPolling = useCallback(() => {
    if (pollingRef.current) {
      clearInterval(pollingRef.current);
      pollingRef.current = null;
    }
  }, []);

  const closeEventSource = useCallback(() => {
    if (eventSourceRef.current) {
      eventSourceRef.current.close();
      eventSourceRef.current = null;
    }
  }, []);

  const scheduleReconnect = useCallback(() => {
    if (reconnectRef.current) {
      return;
    }

    reconnectRef.current = setTimeout(() => {
      reconnectRef.current = null;
      connectRef.current();
    }, 3000);
  }, []);

  const connect = useCallback(() => {
    closeEventSource();
    stopPolling();

    if (status !== "authenticated") {
      return;
    }

    if (typeof window === "undefined" || typeof EventSource === "undefined") {
      startPolling();
      return;
    }

    const source = new EventSource(streamPath);
    eventSourceRef.current = source;
    establishedRef.current = false;

    const initialTimeout = window.setTimeout(() => {
      if (!establishedRef.current) {
        closeEventSource();
        startPolling();
      }
    }, 5000);

    source.onopen = () => {
      establishedRef.current = true;
      window.clearTimeout(initialTimeout);
      void fetchLatest();
    };

    source.addEventListener("notification", (event) => {
      establishedRef.current = true;
      const payload = JSON.parse((event as MessageEvent<string>).data) as StreamNotification;
      setNotifications((current) => {
        if (current.some((item) => item.id === payload.id)) {
          return current;
        }
        return [payload, ...current].slice(0, 20);
      });
      if (!payload.isRead) {
        setUnreadCount((current) => current + 1);
      }
      if (pathname !== "/notifications") {
        toast(payload.message, { id: `notification-${payload.id}` });
      }
    });

    source.onerror = () => {
      window.clearTimeout(initialTimeout);
      closeEventSource();
      if (!establishedRef.current) {
        startPolling();
        return;
      }
      scheduleReconnect();
    };
  }, [closeEventSource, fetchLatest, pathname, scheduleReconnect, startPolling, status, stopPolling, streamPath]);

  useEffect(() => {
    connectRef.current = connect;
  }, [connect]);

  // eslint-disable-next-line react-hooks/set-state-in-effect -- initial fetch primes the local notification cache before live updates attach
  useEffect(() => {
    if (status !== "authenticated") {
      closeEventSource();
      stopPolling();
      setNotifications([]);
      setUnreadCount(0);
      return;
    }

    void fetchLatest();
    connect();

    return () => {
      closeEventSource();
      stopPolling();
      if (reconnectRef.current) {
        clearTimeout(reconnectRef.current);
      }
    };
  }, [closeEventSource, connect, fetchLatest, status, stopPolling]);

  const markAsRead = useCallback(
    async (notificationId: string) => {
      await fetch(apiPath, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: notificationId }),
      });
      setNotifications((current) =>
        current.map((item) =>
          item.id === notificationId ? { ...item, isRead: true } : item,
        ),
      );
      if (notifications.some((item) => item.id === notificationId && !item.isRead)) {
        setUnreadCount((current) => Math.max(0, current - 1));
      }
    },
    [apiPath, notifications],
  );

  const markAllAsRead = useCallback(async () => {
    await fetch(apiPath, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ markAll: true }),
    });
    setNotifications((current) =>
      current.map((item) => ({ ...item, isRead: true })),
    );
    setUnreadCount(0);
  }, [apiPath]);

  const clearAll = useCallback(() => {
    setNotifications([]);
    setUnreadCount(0);
  }, []);

  return {
    notifications,
    unreadCount,
    markAsRead,
    markAllAsRead,
    clearAll,
  };
}
