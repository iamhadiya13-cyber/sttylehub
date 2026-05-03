"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import {
  Bell,
  CheckCheck,
  CircleAlert,
  ClipboardCheck,
  MessageSquareQuote,
  Package,
  RefreshCcw,
  ShieldCheck,
  Store,
} from "lucide-react";
import { useNotificationStream, type StreamNotification } from "@/hooks/useNotificationStream";

type NotificationBellProps = {
  scope?: "personal" | "admin";
  sellerId?: string | null;
  mobileTopOffsetClassName?: string;
};

export function formatNotificationTime(value?: string) {
  if (!value) return "Just now";
  const diffMs = Date.now() - new Date(value).getTime();
  const minutes = Math.max(0, Math.floor(diffMs / 60000));
  if (minutes < 1) return "Just now";
  if (minutes < 60) return `${minutes} minute${minutes === 1 ? "" : "s"} ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours} hour${hours === 1 ? "" : "s"} ago`;
  const days = Math.floor(hours / 24);
  return `${days} day${days === 1 ? "" : "s"} ago`;
}

function notificationAccent(type: string) {
  if (type.includes("order")) return "border-[#7F77DD]";
  if (type.includes("review")) return "border-amber-400";
  if (type.includes("approved")) return "border-emerald-400";
  if (type.includes("cancel") || type.includes("reject")) return "border-red-400";
  return "border-[#7F77DD]";
}

function NotificationTypeIcon({ type }: { type: string }) {
  if (type.includes("order")) return <Package className="h-4 w-4 text-[#A5B4FC]" />;
  if (type.includes("review")) return <MessageSquareQuote className="h-4 w-4 text-amber-300" />;
  if (type.includes("approved")) return <ShieldCheck className="h-4 w-4 text-emerald-300" />;
  if (type.includes("return") || type.includes("exchange")) return <RefreshCcw className="h-4 w-4 text-[#A5B4FC]" />;
  if (type.includes("seller")) return <Store className="h-4 w-4 text-[#A5B4FC]" />;
  if (type.includes("cancel") || type.includes("reject")) return <CircleAlert className="h-4 w-4 text-red-300" />;
  return <Bell className="h-4 w-4 text-[#A5B4FC]" />;
}

export function NotificationRow({
  notification,
  onClick,
}: {
  notification: StreamNotification;
  onClick?: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`flex w-full items-start gap-3 rounded-2xl border-l-4 px-3 py-3 text-left ${notificationAccent(notification.type)}`}
      style={{
        background: notification.isRead ? "rgba(var(--bg-primary-rgb), 0.45)" : "var(--accent-muted)",
      }}
    >
      <div
        className="mt-0.5 rounded-xl border p-2"
        style={{
          borderColor: "var(--border-default)",
          background: "rgba(var(--text-primary-rgb), 0.03)",
        }}
      >
        <NotificationTypeIcon type={notification.type} />
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-sm font-semibold" style={{ color: "var(--text-primary)" }}>{notification.title}</p>
        <p className="mt-1 text-xs leading-6" style={{ color: "var(--text-secondary)" }}>{notification.message}</p>
        <p className="mt-2 text-[11px]" style={{ color: "var(--text-tertiary)" }}>{formatNotificationTime(notification.createdAt)}</p>
      </div>
    </button>
  );
}

export default function NotificationBell({
  scope = "personal",
  sellerId,
  mobileTopOffsetClassName = "top-[64px]",
}: NotificationBellProps) {
  const router = useRouter();
  const { notifications, unreadCount, markAsRead, markAllAsRead } = useNotificationStream({
    scope,
    sellerId,
  });
  const [open, setOpen] = useState(false);
  const [pulse, setPulse] = useState(false);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const lastNotificationIdRef = useRef<string | null>(null);
  const hydratedRef = useRef(false);

  useEffect(() => {
    if (!notifications.length) {
      return;
    }

    const latestId = notifications[0].id;
    if (!hydratedRef.current) {
      hydratedRef.current = true;
      lastNotificationIdRef.current = latestId;
      return;
    }

    if (lastNotificationIdRef.current !== latestId) {
      lastNotificationIdRef.current = latestId;
      setPulse(true);
      const timer = window.setTimeout(() => setPulse(false), 550);
      return () => window.clearTimeout(timer);
    }
  }, [notifications]);

  useEffect(() => {
    if (!open) {
      return;
    }

    const handlePointerDown = (event: MouseEvent | TouchEvent) => {
      const target = event.target;
      if (target instanceof Node && !containerRef.current?.contains(target)) {
        setOpen(false);
      }
    };

    document.addEventListener("mousedown", handlePointerDown);
    document.addEventListener("touchstart", handlePointerDown);

    return () => {
      document.removeEventListener("mousedown", handlePointerDown);
      document.removeEventListener("touchstart", handlePointerDown);
    };
  }, [open]);

  const visibleNotifications = useMemo(() => notifications.slice(0, 20), [notifications]);

  return (
    <div ref={containerRef} className="relative">
      <button
        type="button"
        onClick={() => setOpen((current) => !current)}
        className="relative rounded-xl border p-2.5 transition"
        style={{
          borderColor: "var(--border-default)",
          background: "var(--bg-elevated)",
          color: "var(--text-secondary)",
        }}
        aria-label="Notifications"
      >
        <Bell className={pulse ? "h-5 w-5 scale-110 transition-transform" : "h-5 w-5 transition-transform"} />
        {unreadCount > 0 ? (
            <span
              className={
                pulse
                  ? "absolute -right-1 -top-1 rounded-full px-1.5 text-[10px] font-bold text-[var(--text-on-accent)] transition-transform"
                  : "absolute -right-1 -top-1 rounded-full px-1.5 text-[10px] font-bold text-[var(--text-on-accent)]"
              }
              style={{ background: "var(--accent-primary)" }}
            >
              {unreadCount > 99 ? "99+" : unreadCount}
            </span>
          ) : null}
      </button>

      {open ? (
        <>
          <div
            className={`fixed inset-x-0 ${mobileTopOffsetClassName} z-[90] border-y p-4 shadow-2xl md:absolute md:inset-x-auto md:right-0 md:top-[calc(100%+10px)] md:w-[360px] md:rounded-[24px] md:border md:p-4`}
            style={{
              borderColor: "var(--border-default)",
              background: "var(--bg-elevated)",
              boxShadow: "0 24px 60px rgba(var(--shadow-color-rgb), 0.35)",
            }}
          >
            <div className="mb-4 flex items-center justify-between gap-3">
              <p className="text-sm font-semibold" style={{ color: "var(--text-primary)" }}>Notifications</p>
              <button
                type="button"
                onClick={() => void markAllAsRead()}
                className="inline-flex items-center gap-1 text-xs font-semibold"
                style={{ color: "var(--accent-primary)" }}
              >
                <CheckCheck className="h-4 w-4" />
                Mark all read
              </button>
            </div>
            <div className="max-h-[60vh] space-y-2 overflow-y-auto pr-1">
              {visibleNotifications.length ? (
                visibleNotifications.map((notification) => (
                  <NotificationRow
                    key={notification.id}
                    notification={notification}
                    onClick={() => {
                      void markAsRead(notification.id);
                      setOpen(false);
                      if (notification.link) {
                        router.push(notification.link);
                      }
                    }}
                  />
                ))
              ) : (
                <div className="rounded-2xl border p-4 text-sm" style={{ borderColor: "var(--border-default)", background: "rgba(var(--bg-primary-rgb), 0.5)", color: "var(--text-secondary)" }}>
                  No notifications yet.
                </div>
              )}
            </div>
            <button
              type="button"
              onClick={() => {
                setOpen(false);
                router.push(scope === "admin" ? "/notifications?scope=admin" : "/notifications");
              }}
              className="mt-4 inline-flex items-center gap-2 text-sm font-semibold"
              style={{ color: "var(--accent-primary)" }}
            >
              <ClipboardCheck className="h-4 w-4" />
              View all notifications
            </button>
          </div>
          <button
            type="button"
            aria-label="Close notifications"
            className="fixed inset-0 z-[80] bg-transparent md:hidden"
            onClick={() => setOpen(false)}
          />
        </>
      ) : null}
    </div>
  );
}
