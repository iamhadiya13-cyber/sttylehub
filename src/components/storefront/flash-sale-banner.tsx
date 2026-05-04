/* eslint-disable react-hooks/set-state-in-effect */

"use client";

import { useEffect, useMemo, useState } from "react";
import { Flame, X } from "lucide-react";
import { fetchJson } from "@/components/storefront/api";
import { cn } from "@/lib/utils";

type FlashSaleBannerData = {
  sale: {
    _id: string;
    name: string;
    startTime: string;
    endTime: string;
    discountPercent: number;
    productIds: string[];
    status: "draft" | "active" | "paused" | "ended";
  } | null;
  serverNow: string;
};

function formatCountdown(totalSeconds: number) {
  const safe = Math.max(0, totalSeconds);
  const hours = String(Math.floor(safe / 3600)).padStart(2, "0");
  const minutes = String(Math.floor((safe % 3600) / 60)).padStart(2, "0");
  const seconds = String(safe % 60).padStart(2, "0");
  return `${hours}:${minutes}:${seconds}`;
}

export function FlashSaleSiteBanner() {
  const [dismissed, setDismissed] = useState(false);
  const [data, setData] = useState<FlashSaleBannerData | null>(null);
  const [serverNowMs, setServerNowMs] = useState<number | null>(null);

  // eslint-disable-next-line react-hooks/set-state-in-effect -- initial sessionStorage read seeds dismissed state before the banner fetch runs
  useEffect(() => {
    const dismissedForSession =
      typeof window !== "undefined" && window.sessionStorage.getItem("stylehub-flash-sale-banner-dismissed") === "1";
    setDismissed(dismissedForSession);
  }, []);

  useEffect(() => {
    if (dismissed) {
      return;
    }

    let cancelled = false;
    void fetchJson<FlashSaleBannerData>("/api/flash-sale/active", { method: "GET" }, { cacheTtlMs: 15_000 })
      .then((response) => {
        if (cancelled) {
          return;
        }
        const nextData = response.data || null;
        setData(nextData);
        setServerNowMs(nextData?.serverNow ? new Date(nextData.serverNow).getTime() : Date.now());
      })
      .catch(() => {
        if (!cancelled) {
          setData(null);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [dismissed]);

  // eslint-disable-next-line react-hooks/set-state-in-effect -- server time is intentionally seeded once before the ticking interval starts
  useEffect(() => {
    if (!data?.serverNow) {
      return;
    }

    const baseMs = new Date(data.serverNow).getTime();
    const startedAt = Date.now();
    setServerNowMs(baseMs);
    const intervalId = window.setInterval(() => {
      setServerNowMs(baseMs + (Date.now() - startedAt));
    }, 1000);

    return () => window.clearInterval(intervalId);
  }, [data?.serverNow]);

  const sale = data?.sale;
  const remainingSeconds = useMemo(() => {
    if (!sale || !serverNowMs) {
      return 0;
    }
    return Math.max(0, Math.floor((new Date(sale.endTime).getTime() - serverNowMs) / 1000));
  }, [sale, serverNowMs]);

  if (dismissed || !sale || sale.status !== "active") {
    return null;
  }

  return (
    <section className="border-b border-red-500/12 bg-[linear-gradient(90deg,rgba(127,29,29,0.86)_0%,rgba(120,53,15,0.76)_100%)] px-4 py-2.5 sm:px-6 lg:px-8">
      <div className="mx-auto flex max-w-7xl items-center justify-between gap-3">
        <div className="flex min-w-0 items-center gap-3">
          <span className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-red-300/20 bg-red-500/15 text-red-100">
            <Flame className="h-4 w-4" />
          </span>
          <div className="min-w-0">
            <p className="truncate text-sm font-semibold text-white">{sale.name}</p>
          </div>
        </div>
        <div className="flex shrink-0 items-center gap-3">
          <span
            className={cn(
              "text-sm font-black tracking-[0.18em] text-white",
              remainingSeconds <= 600 && "animate-pulse text-red-100",
            )}
          >
            {formatCountdown(remainingSeconds)}
          </span>
          <button
            type="button"
            aria-label="Dismiss flash sale banner"
            onClick={() => {
              window.sessionStorage.setItem("stylehub-flash-sale-banner-dismissed", "1");
              setDismissed(true);
            }}
            className="rounded-full border border-white/10 p-1.5 text-white/70 transition hover:text-white"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      </div>
    </section>
  );
}

export default FlashSaleSiteBanner;
