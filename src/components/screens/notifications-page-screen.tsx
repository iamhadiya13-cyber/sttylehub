"use client";

import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { useSession } from "next-auth/react";
import { CheckCheck } from "lucide-react";
import { NotificationRow } from "@/components/ui/NotificationBell";
import { Button, EmptyState, PageShell } from "@/components/screens/shared";

type NotificationRecord = {
  _id: string;
  type: string;
  title: string;
  message: string;
  link?: string;
  isRead?: boolean;
  createdAt?: string;
};

type NotificationPageResponse = {
  items: NotificationRecord[];
  unreadCount: number;
  total: number;
  page: number;
  totalPages: number;
};

export function NotificationsPageScreen() {
  const { data: session, status } = useSession();
  const searchParams = useSearchParams();
  const [page, setPage] = useState(1);
  const [data, setData] = useState<NotificationPageResponse>({
    items: [],
    unreadCount: 0,
    total: 0,
    page: 1,
    totalPages: 1,
  });
  const [loading, setLoading] = useState(true);
  const scope = session?.user?.role === "admin" || searchParams?.get("scope") === "admin" ? "admin" : "personal";

  useEffect(() => {
    const nextPage = Number(searchParams?.get("page") || 1);
    setPage(nextPage);
  }, [searchParams]);

  useEffect(() => {
    if (status !== "authenticated") {
      return;
    }

    let cancelled = false;

    const fetchNotifications = async () => {
      setLoading(true);
      const params = new URLSearchParams({
        page: String(page),
        limit: "20",
      });
      if (scope === "admin") {
        params.set("scope", "admin");
      }

      const response = await fetch(`/api/notifications?${params.toString()}`, {
        cache: "no-store",
      });
      const json = (await response.json()) as {
        success: boolean;
        data?: NotificationPageResponse;
      };

      if (!cancelled && json.success && json.data) {
        setData(json.data);
      }
      if (!cancelled) {
        setLoading(false);
      }
    };

    void fetchNotifications();

    return () => {
      cancelled = true;
    };
  }, [page, scope, status]);

  const markAllRead = async () => {
    const suffix = scope === "admin" ? "?scope=admin" : "";
    await fetch(`/api/notifications${suffix}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ markAll: true }),
    });
    setData((current) => ({
      ...current,
      unreadCount: 0,
      items: current.items.map((item) => ({ ...item, isRead: true })),
    }));
  };

  const markOneRead = async (id: string) => {
    const suffix = scope === "admin" ? "?scope=admin" : "";
    await fetch(`/api/notifications${suffix}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id }),
    });
    setData((current) => ({
      ...current,
      unreadCount: Math.max(0, current.unreadCount - (current.items.some((item) => item._id === id && !item.isRead) ? 1 : 0)),
      items: current.items.map((item) => (item._id === id ? { ...item, isRead: true } : item)),
    }));
  };

  return (
    <PageShell hideFooter>
      <main className="mx-auto max-w-5xl px-4 py-10 sm:px-6 lg:px-8">
        <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-[11px] font-bold uppercase tracking-[0.22em] text-[#666666]">Inbox</p>
            <h1 className="text-[26px] font-bold text-white">Notifications</h1>
          </div>
          <Button type="button" variant="secondary" onClick={() => void markAllRead()}>
            <CheckCheck className="h-4 w-4" />
            Mark all as read
          </Button>
        </div>

        {loading ? (
          <div className="space-y-3">
            {Array.from({ length: 6 }).map((_, index) => (
              <div key={index} className="h-[96px] animate-pulse rounded-2xl border border-white/10 bg-white/[0.03]" />
            ))}
          </div>
        ) : data.items.length ? (
          <>
            <div className="space-y-3">
              {data.items.map((item) => (
                <NotificationRow
                  key={item._id}
                  notification={{
                    id: item._id,
                    type: item.type,
                    title: item.title,
                    message: item.message,
                    link: item.link || "",
                    createdAt: item.createdAt || new Date().toISOString(),
                    isRead: Boolean(item.isRead),
                  }}
                  onClick={() => void markOneRead(item._id)}
                />
              ))}
            </div>

            {data.totalPages > 1 ? (
              <div className="mt-6 flex items-center justify-center gap-3">
                <Button type="button" variant="secondary" disabled={page <= 1} onClick={() => setPage((current) => Math.max(1, current - 1))}>
                  Previous
                </Button>
                <span className="text-sm text-[#888888]">
                  Page {data.page} of {data.totalPages}
                </span>
                <Button type="button" variant="secondary" disabled={page >= data.totalPages} onClick={() => setPage((current) => Math.min(data.totalPages, current + 1))}>
                  Next
                </Button>
              </div>
            ) : null}
          </>
        ) : (
          <EmptyState title="No notifications yet" />
        )}
      </main>
    </PageShell>
  );
}
