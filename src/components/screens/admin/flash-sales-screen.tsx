"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Image from "next/image";
import { AnimatePresence, motion } from "framer-motion";
import {
  CartesianGrid,
  Line,
  LineChart,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import {
  Flame,
  PauseCircle,
  PlayCircle,
  TimerReset,
  Trash2,
  Zap,
} from "lucide-react";
import { toast } from "react-hot-toast";
import { AdminShell } from "@/components/admin/AdminSidebar";
import { Button, EmptyState, TextInput, fallbackImage, fetchJson, useApi, useDebouncedValue, type Product } from "@/components/screens/shared";
import { useConfirmModal } from "@/hooks/useConfirmModal";
import { formatCurrency } from "@/lib/utils";

type FlashSaleRecord = {
  _id: string;
  name: string;
  startTime: string;
  endTime: string;
  discountPercent: number;
  productIds: string[];
  status: "draft" | "active" | "paused" | "ended";
  pausedRemainingMs?: number;
  createdAt?: string;
  updatedAt?: string;
};

type FlashSalesResponse = {
  sales: FlashSaleRecord[];
  activeSale: FlashSaleRecord | null;
  serverNow: string;
};

type FlashSaleStatsResponse = {
  sale: FlashSaleRecord;
  serverNow: string;
  headline: {
    totalOrders: number;
    totalRevenue: number;
    activeViewers: number;
    activeProducts: number;
  };
  recentOrders: Array<{
    _id: string;
    customer: string;
    items: string;
    total: number;
    createdAt: string;
  }>;
  perProduct: Array<{
    productId: string;
    name: string;
    image: string;
    originalPrice: number;
    salePrice: number;
    unitsSold: number;
    revenue: number;
    currentStock: number;
    depletionRatio: number;
  }>;
  timeline: Array<{
    minute: number;
    orders: number;
  }>;
};

type ProductSearchResponse = {
  products: Product[];
  total: number;
  page: number;
  totalPages: number;
};

const durationOptions = [
  { label: "1 hour", value: "1" },
  { label: "2 hours", value: "2" },
  { label: "4 hours", value: "4" },
  { label: "6 hours", value: "6" },
  { label: "12 hours", value: "12" },
  { label: "24 hours", value: "24" },
  { label: "Custom", value: "custom" },
] as const;

function formatCountdown(totalSeconds: number) {
  const safe = Math.max(0, totalSeconds);
  const hours = String(Math.floor(safe / 3600)).padStart(2, "0");
  const minutes = String(Math.floor((safe % 3600) / 60)).padStart(2, "0");
  const seconds = String(safe % 60).padStart(2, "0");
  return `${hours}:${minutes}:${seconds}`;
}

function formatRelativeTime(value: string, serverNowMs: number) {
  const diffSeconds = Math.max(0, Math.floor((serverNowMs - new Date(value).getTime()) / 1000));
  if (diffSeconds < 60) {
    return `${diffSeconds} seconds ago`;
  }
  return `${Math.floor(diffSeconds / 60)} minutes ago`;
}

function stockBarColor(remainingRatio: number) {
  if (remainingRatio <= 0.2) return "#EF4444";
  if (remainingRatio <= 0.5) return "#F59E0B";
  return "#22C55E";
}

function TimelineTooltip({
  active,
  payload,
}: {
  active?: boolean;
  payload?: Array<{ value: number; payload: { minute: number } }>;
}) {
  if (!active || !payload?.length) {
    return null;
  }

  return (
    <div className="rounded-2xl border border-white/10 bg-[#0D101A] px-3 py-2 text-xs text-white shadow-xl">
      <p>{payload[0].value} orders</p>
      <p className="mt-1 text-white/60">{payload[0].payload.minute} min since start</p>
    </div>
  );
}

function getInitialStartTime() {
  const now = new Date();
  now.setMinutes(now.getMinutes() - now.getTimezoneOffset());
  return now.toISOString().slice(0, 16);
}

export function AdminFlashSalesScreen() {
  const { confirm } = useConfirmModal();
  const { data, loading, error, refetch } = useApi<FlashSalesResponse>("/api/admin/flash-sales", {
    sales: [],
    activeSale: null,
    serverNow: new Date().toISOString(),
  });
  const [stats, setStats] = useState<FlashSaleStatsResponse | null>(null);
  const [statsLoading, setStatsLoading] = useState(false);
  const [serverNowMs, setServerNowMs] = useState(() => new Date().getTime());
  const [saleName, setSaleName] = useState("");
  const [discountPercent, setDiscountPercent] = useState("20");
  const [startTime, setStartTime] = useState(getInitialStartTime());
  const [duration, setDuration] = useState<(typeof durationOptions)[number]["value"]>("6");
  const [customEndTime, setCustomEndTime] = useState("");
  const [productQuery, setProductQuery] = useState("");
  const [selectedProducts, setSelectedProducts] = useState<Product[]>([]);
  const [launching, setLaunching] = useState(false);
  const [actionLoading, setActionLoading] = useState<"extend" | "pause" | "resume" | "end" | null>(null);
  const debouncedProductQuery = useDebouncedValue(productQuery, 250);
  const endedByTimerRef = useRef<string | null>(null);
  const previousOrderIdsRef = useRef<string[]>([]);
  const activeSale = data.activeSale && (data.activeSale.status === "active" || data.activeSale.status === "paused")
    ? data.activeSale
    : null;

  const { data: productSearch } = useApi<ProductSearchResponse>(
    debouncedProductQuery ? `/api/admin/products?page=1&limit=12&search=${encodeURIComponent(debouncedProductQuery)}` : null,
    { products: [], total: 0, page: 1, totalPages: 1 },
    { enabled: Boolean(debouncedProductQuery), keepPreviousData: true },
  );

  useEffect(() => {
    const baseMs = new Date(data.serverNow).getTime();
    const startedAt = Date.now();
    setServerNowMs(baseMs);
    const intervalId = window.setInterval(() => {
      setServerNowMs(baseMs + (Date.now() - startedAt));
    }, 1000);
    return () => window.clearInterval(intervalId);
  }, [data.serverNow]);

  useEffect(() => {
    if (!activeSale) {
      setStats(null);
      previousOrderIdsRef.current = [];
      return;
    }

    let cancelled = false;
    const loadStats = async () => {
      try {
        setStatsLoading(true);
        const response = await fetchJson<FlashSaleStatsResponse>(`/api/admin/flash-sales/${activeSale._id}/stats`);
        const nextStats = response.data || null;
        if (cancelled || !nextStats) {
          return;
        }
        const previous = previousOrderIdsRef.current;
        const current = nextStats.recentOrders.map((order) => order._id);
        const hasNewOrders = previous.length > 0 && current.some((id) => !previous.includes(id));
        previousOrderIdsRef.current = current;
        setStats(nextStats);
        setServerNowMs(new Date(nextStats.serverNow).getTime());
        if (hasNewOrders) {
          setStats((currentStats) => (currentStats ? { ...nextStats } : nextStats));
        }
      } catch (fetchError) {
        if (!cancelled) {
          toast.error(fetchError instanceof Error ? fetchError.message : "Failed to refresh flash sale stats");
        }
      } finally {
        if (!cancelled) {
          setStatsLoading(false);
        }
      }
    };

    void loadStats();
    const intervalId = window.setInterval(() => {
      void loadStats();
    }, 5000);

    return () => {
      cancelled = true;
      window.clearInterval(intervalId);
    };
  }, [activeSale?._id]);

  const previewEndTime = useMemo(() => {
    const nextStart = startTime ? new Date(startTime) : new Date();
    if (duration === "custom") {
      return customEndTime ? new Date(customEndTime) : nextStart;
    }
    return new Date(nextStart.getTime() + Number(duration) * 60 * 60 * 1000);
  }, [customEndTime, duration, startTime]);

  const previewSeconds = useMemo(() => {
    const nextStart = startTime ? new Date(startTime).getTime() : Date.now();
    return Math.max(0, Math.floor((previewEndTime.getTime() - nextStart) / 1000));
  }, [previewEndTime, startTime]);

  const countdownSeconds = useMemo(() => {
    if (!activeSale) {
      return 0;
    }
    if (activeSale.status === "paused") {
      return Math.floor((activeSale.pausedRemainingMs || 0) / 1000);
    }
    return Math.max(0, Math.floor((new Date(activeSale.endTime).getTime() - serverNowMs) / 1000));
  }, [activeSale, serverNowMs]);

  useEffect(() => {
    if (!activeSale || activeSale.status !== "active" || countdownSeconds > 0 || actionLoading || endedByTimerRef.current === activeSale._id) {
      return;
    }

    endedByTimerRef.current = activeSale._id;
    void fetchJson(`/api/admin/flash-sales/${activeSale._id}`, {
      method: "PATCH",
      body: JSON.stringify({ action: "end" }),
    })
      .then(() => refetch())
      .catch(() => {
        endedByTimerRef.current = null;
      });
  }, [actionLoading, activeSale, countdownSeconds, refetch]);

  const selectedProductIds = useMemo(() => new Set(selectedProducts.map((product) => product._id)), [selectedProducts]);
  const availableProducts = useMemo(
    () => (productSearch.products || []).filter((product) => !selectedProductIds.has(product._id)),
    [productSearch.products, selectedProductIds],
  );

  const timelineData = useMemo(
    () => (stats?.timeline || []).map((point) => ({ ...point, label: `${point.minute}m` })),
    [stats?.timeline],
  );

  const currentMinute = activeSale ? Math.max(0, Math.floor((serverNowMs - new Date(activeSale.startTime).getTime()) / 60000)) : 0;

  const launchSale = async () => {
    if (!saleName.trim()) {
      toast.error("Enter a sale name");
      return;
    }
    if (!selectedProducts.length) {
      toast.error("Add at least one product");
      return;
    }

    const parsedDiscount = Number(discountPercent);
    if (!Number.isFinite(parsedDiscount) || parsedDiscount < 1 || parsedDiscount > 90) {
      toast.error("Discount must be between 1 and 90");
      return;
    }

    try {
      setLaunching(true);
      const response = await fetchJson("/api/admin/flash-sales", {
        method: "POST",
        body: JSON.stringify({
          name: saleName.trim(),
          startTime: new Date(startTime).toISOString(),
          endTime: previewEndTime.toISOString(),
          discountPercent: parsedDiscount,
          productIds: selectedProducts.map((product) => product._id),
          status: "active",
        }),
      });
      toast.success(response.message || "Flash sale launched");
      setSaleName("");
      setDiscountPercent("20");
      setStartTime(getInitialStartTime());
      setDuration("6");
      setCustomEndTime("");
      setSelectedProducts([]);
      setProductQuery("");
      await refetch();
    } catch (launchError) {
      toast.error(launchError instanceof Error ? launchError.message : "Failed to launch flash sale");
    } finally {
      setLaunching(false);
    }
  };

  const runAction = async (action: "extend" | "pause" | "resume" | "end") => {
    if (!activeSale) {
      return;
    }

    try {
      setActionLoading(action);
      const response = await fetchJson(`/api/admin/flash-sales/${activeSale._id}`, {
        method: "PATCH",
        body: JSON.stringify({ action, minutes: 30 }),
      });
      toast.success(response.message || "Flash sale updated");
      await refetch();
    } catch (updateError) {
      toast.error(updateError instanceof Error ? updateError.message : "Failed to update flash sale");
    } finally {
      setActionLoading(null);
    }
  };

  if (loading) {
    return (
      <AdminShell title="Flash Sales">
        <div className="h-[640px] animate-pulse rounded-[28px] border border-white/10 bg-white/[0.04]" />
      </AdminShell>
    );
  }

  if (error) {
    return (
      <AdminShell title="Flash Sales">
        <EmptyState title="Flash sale control unavailable" description={error} />
      </AdminShell>
    );
  }

  return (
    <AdminShell title="Flash Sales">
      {!activeSale ? (
        <div className="mx-auto max-w-5xl rounded-[28px] border border-white/10 bg-white/[0.04] p-6 backdrop-blur sm:p-7">
          <div className="grid gap-7 xl:grid-cols-[1.08fr,0.92fr]">
            <div className="space-y-5">
              <div>
                <p className="text-[11px] font-bold uppercase tracking-[0.22em] text-[#A5B4FC]">Setup Mode</p>
                <h2 className="mt-3 text-2xl font-black uppercase text-white">Create Flash Sale</h2>
              </div>

              <TextInput
                label="Sale name"
                leftPad={false}
                placeholder="Weekend Heat Check"
                value={saleName}
                onChange={(event) => setSaleName(event.target.value)}
              />

              <div className="grid gap-4 md:grid-cols-2">
                <label className="space-y-2 text-sm text-white">
                  <span>Start time</span>
                  <input
                    type="datetime-local"
                    value={startTime}
                    onChange={(event) => setStartTime(event.target.value)}
                    className="h-12 w-full rounded-xl border border-white/10 bg-[#111111] px-4 text-white outline-none"
                  />
                </label>
                <label className="space-y-2 text-sm text-white">
                  <span>Duration</span>
                  <select
                    value={duration}
                    onChange={(event) => setDuration(event.target.value as (typeof durationOptions)[number]["value"])}
                    className="h-12 w-full rounded-xl border border-white/10 bg-[#111111] px-4 text-white outline-none"
                  >
                    {durationOptions.map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                </label>
              </div>

              {duration === "custom" ? (
                <label className="space-y-2 text-sm text-white">
                  <span>End time</span>
                  <input
                    type="datetime-local"
                    value={customEndTime}
                    onChange={(event) => setCustomEndTime(event.target.value)}
                    className="h-12 w-full rounded-xl border border-white/10 bg-[#111111] px-4 text-white outline-none"
                  />
                </label>
              ) : null}

              <div className="space-y-2">
                <TextInput
                  label="Discount percentage"
                  leftPad={false}
                  type="number"
                  min="1"
                  max="90"
                  placeholder="20"
                  value={discountPercent}
                  onChange={(event) => setDiscountPercent(event.target.value)}
                />
                <p className="text-sm text-[#C7D2FE]">
                  Products will be shown at {discountPercent || "0"}% off
                </p>
              </div>

              <div className="space-y-3">
                <TextInput
                  label="Product selector"
                  leftPad={false}
                  placeholder="Search products"
                  value={productQuery}
                  onChange={(event) => setProductQuery(event.target.value)}
                />

                {productQuery.trim() ? (
                  <div className="max-h-[280px] space-y-2 overflow-y-auto rounded-2xl border border-white/10 bg-[#0D101A] p-3">
                    {availableProducts.length ? (
                      availableProducts.map((product) => (
                        <button
                          key={product._id}
                          type="button"
                          onClick={() => {
                            setSelectedProducts((current) => [...current, product]);
                            setProductQuery("");
                          }}
                          className="flex w-full items-center gap-3 rounded-2xl border border-white/8 bg-black/20 px-3 py-3 text-left transition hover:border-[#6366F1]/25"
                        >
                          <div className="relative h-11 w-11 shrink-0 overflow-hidden rounded-xl bg-black/20">
                            <Image src={fallbackImage(product.images?.[0])} alt={product.title} fill className="object-cover" />
                          </div>
                          <div className="min-w-0 flex-1">
                            <p className="truncate text-sm font-semibold text-white">{product.title}</p>
                            <p className="mt-1 text-xs text-white/50">{product.brand}</p>
                          </div>
                          <span className="text-sm font-semibold text-[#C7D2FE]">
                            {formatCurrency(product.discountPrice || product.price)}
                          </span>
                        </button>
                      ))
                    ) : (
                      <p className="text-sm text-white/45">No matching products found.</p>
                    )}
                  </div>
                ) : null}

                {selectedProducts.length ? (
                  <div className="grid gap-3 sm:grid-cols-2">
                    {selectedProducts.map((product) => (
                      <div key={product._id} className="flex items-center gap-3 rounded-2xl border border-[#6366F1]/20 bg-[#4F46E5]/10 px-3 py-3">
                        <div className="relative h-11 w-11 shrink-0 overflow-hidden rounded-xl bg-black/20">
                          <Image src={fallbackImage(product.images?.[0])} alt={product.title} fill className="object-cover" />
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="truncate text-sm font-semibold text-white">{product.title}</p>
                          <p className="mt-1 text-xs text-[#C7D2FE]">{formatCurrency(product.discountPrice || product.price)}</p>
                        </div>
                        <button
                          type="button"
                          onClick={() => setSelectedProducts((current) => current.filter((item) => item._id !== product._id))}
                          className="rounded-full border border-white/10 p-2 text-white/65 transition hover:text-white"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-white/45">Minimum 1 product required.</p>
                )}
              </div>

              <Button type="button" loading={launching} loadingText="Launching..." onClick={() => void launchSale()} className="w-full">
                Launch Sale
              </Button>
            </div>

            <div className="space-y-5 rounded-[28px] border border-red-500/14 bg-[linear-gradient(135deg,#2B0B0B_0%,#0F111A_100%)] p-6">
              <p className="text-[11px] font-bold uppercase tracking-[0.22em] text-red-200/70">Customer Preview</p>
              <div className="rounded-[24px] border border-red-500/18 bg-black/25 p-5">
                <div className="flex items-center gap-3">
                  <span className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-red-400/20 bg-red-500/12 text-red-100">
                    <Flame className="h-4 w-4" />
                  </span>
                  <div>
                    <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-red-200/70">Flash Sale</p>
                    <p className="text-lg font-semibold text-white">{saleName || "Weekend Heat Check"}</p>
                  </div>
                </div>
                <div className="mt-6 flex items-center justify-between rounded-full border border-white/10 bg-black/30 px-4 py-3">
                  <span className="text-[11px] font-bold uppercase tracking-[0.2em] text-white/60">Ends In</span>
                  <span className="text-2xl font-black tracking-[0.18em] text-white">{formatCountdown(previewSeconds)}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      ) : (
        <div className="space-y-6">
          <div className="rounded-[30px] border border-red-500/15 bg-[linear-gradient(135deg,#2F0A0A_0%,#151A28_56%,#0A0D18_100%)] p-6">
            <div className="grid gap-6 xl:grid-cols-[1fr,auto,1fr] xl:items-center">
              <div>
                <p className="text-[11px] font-bold uppercase tracking-[0.22em] text-red-100/70">Flash Sale</p>
                <div className="mt-2 flex flex-wrap items-center gap-3">
                  <h2 className="text-2xl font-black uppercase text-white">{activeSale.name}</h2>
                  <span className={activeSale.status === "active" ? "rounded-full bg-emerald-500/15 px-3 py-1 text-[11px] font-semibold uppercase text-emerald-300" : "rounded-full bg-amber-500/15 px-3 py-1 text-[11px] font-semibold uppercase text-amber-300"}>
                    {activeSale.status}
                  </span>
                </div>
              </div>

              <div className="text-center">
                <p className="text-[11px] font-bold uppercase tracking-[0.22em] text-white/55">Countdown</p>
                <p className={`mt-2 text-[2.25rem] font-black tracking-[0.18em] ${countdownSeconds <= 600 ? "animate-pulse text-red-200" : "text-white"}`}>
                  {countdownSeconds > 0 ? formatCountdown(countdownSeconds) : "Sale Ended"}
                </p>
              </div>

              <div className="grid gap-3 sm:grid-cols-3">
                <div className="rounded-2xl border border-white/10 bg-black/20 p-4">
                  <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-white/50">Total Orders</p>
                  <p className="mt-3 text-2xl font-black text-white">{stats?.headline.totalOrders || 0}</p>
                </div>
                <div className="rounded-2xl border border-white/10 bg-black/20 p-4">
                  <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-white/50">Total Revenue</p>
                  <p className="mt-3 text-2xl font-black text-white">{formatCurrency(stats?.headline.totalRevenue || 0)}</p>
                </div>
                <div className="rounded-2xl border border-white/10 bg-black/20 p-4">
                  <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-white/50">Active Products</p>
                  <p className="mt-3 text-2xl font-black text-white">{stats?.headline.activeProducts || activeSale.productIds.length}</p>
                </div>
              </div>
            </div>

            <div className="mt-6 flex flex-wrap gap-3">
              <Button type="button" variant="secondary" loading={actionLoading === "extend"} loadingText="Extending..." onClick={() => void runAction("extend")}>
                <TimerReset className="h-4 w-4" />
                Extend 30 min
              </Button>
              {activeSale.status === "paused" ? (
                <Button type="button" variant="secondary" loading={actionLoading === "resume"} loadingText="Resuming..." onClick={() => void runAction("resume")}>
                  <PlayCircle className="h-4 w-4" />
                  Resume Sale
                </Button>
              ) : (
                <Button type="button" variant="secondary" loading={actionLoading === "pause"} loadingText="Pausing..." onClick={() => void runAction("pause")}>
                  <PauseCircle className="h-4 w-4" />
                  Pause Sale
                </Button>
              )}
              <Button
                type="button"
                loading={actionLoading === "end"}
                loadingText="Ending..."
                className="bg-red-600 hover:bg-red-500"
                onClick={() =>
                  void confirm({
                    title: "End flash sale early?",
                    message: "This will stop the sale immediately for customers.",
                    confirmText: "End Sale",
                    variant: "danger",
                    action: async () => {
                      await runAction("end");
                    },
                  })
                }
              >
                <Zap className="h-4 w-4" />
                End Sale Early
              </Button>
            </div>
          </div>

          <div className="grid gap-6 xl:grid-cols-[0.9fr,1.15fr,0.95fr]">
            <section className="rounded-[28px] border border-white/10 bg-white/[0.04] p-5 backdrop-blur">
              <div className="flex items-center justify-between gap-3">
                <h3 className="text-lg font-bold text-white">Live Orders</h3>
                <div className="flex items-center gap-2 text-xs text-white/45">
                  <span className="h-2.5 w-2.5 animate-pulse rounded-full bg-emerald-400" />
                  Live
                </div>
              </div>
              <div className="mt-5 max-h-[640px] space-y-3 overflow-y-auto pr-1">
                <AnimatePresence initial={false}>
                  {(stats?.recentOrders || []).map((order) => (
                    <motion.div
                      key={order._id}
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.2, ease: "easeOut" }}
                      className="rounded-[22px] border border-white/8 bg-black/20 p-4"
                    >
                      <div className="flex items-start justify-between gap-4">
                        <div>
                          <p className="text-sm font-semibold text-white">{order.customer}</p>
                          <p className="mt-1 line-clamp-2 max-w-[30ch] text-xs leading-6 text-white/55">{order.items}</p>
                        </div>
                        <div className="text-right">
                          <p className="text-sm font-semibold text-[#C7D2FE]">{formatCurrency(order.total)}</p>
                          <p className="mt-1 text-xs text-white/45">{formatRelativeTime(order.createdAt, serverNowMs)}</p>
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </AnimatePresence>
                {!statsLoading && !(stats?.recentOrders || []).length ? (
                  <p className="text-sm text-white/45">No sale orders yet.</p>
                ) : null}
              </div>
            </section>

            <section className="rounded-[28px] border border-white/10 bg-white/[0.04] p-5 backdrop-blur">
              <div className="flex items-center justify-between gap-3">
                <h3 className="text-lg font-bold text-white">Product Performance</h3>
                <span className="text-xs text-white/45">Best performers first</span>
              </div>
              <div className="mt-5 grid gap-4 sm:grid-cols-2">
                {(stats?.perProduct || []).map((product) => {
                  const remainingRatio = Math.max(0, 1 - product.depletionRatio);
                  return (
                    <div key={product.productId} className="rounded-[24px] border border-white/8 bg-black/20 p-4">
                      <div className="flex gap-3">
                        <div className="relative h-12 w-12 shrink-0 overflow-hidden rounded-xl bg-black/20">
                          <Image src={fallbackImage(product.image)} alt={product.name} fill className="object-cover" />
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="line-clamp-2 text-sm font-semibold text-white">{product.name}</p>
                          <div className="mt-2 flex items-center gap-2">
                            <span className="text-sm font-bold text-[#C7D2FE]">{formatCurrency(product.salePrice)}</span>
                            <span className="text-xs text-white/35 line-through">{formatCurrency(product.originalPrice)}</span>
                          </div>
                        </div>
                      </div>
                      <div className="mt-4 grid grid-cols-2 gap-3 text-sm">
                        <div>
                          <p className="text-white/45">Units Sold</p>
                          <p className="mt-1 font-semibold text-white">{product.unitsSold}</p>
                        </div>
                        <div>
                          <p className="text-white/45">Revenue</p>
                          <p className="mt-1 font-semibold text-white">{formatCurrency(product.revenue)}</p>
                        </div>
                      </div>
                      <div className="mt-4">
                        <div className="mb-2 flex items-center justify-between text-xs text-white/45">
                          <span>Stock remaining</span>
                          <span>{product.currentStock} left</span>
                        </div>
                        <div className="h-2 overflow-hidden rounded-full bg-white/8">
                          <div
                            className="h-full rounded-full"
                            style={{
                              width: `${Math.max(6, remainingRatio * 100)}%`,
                              backgroundColor: stockBarColor(remainingRatio),
                            }}
                          />
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </section>

            <section className="rounded-[28px] border border-white/10 bg-white/[0.04] p-5 backdrop-blur">
              <div className="flex items-center justify-between gap-3">
                <h3 className="text-lg font-bold text-white">Order Velocity</h3>
                <span className="text-xs text-white/45">Updates every 5s</span>
              </div>
              <div className="mt-5 h-[360px]">
                {timelineData.length ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={timelineData}>
                      <CartesianGrid stroke="#1F1F1F" vertical={false} />
                      <XAxis dataKey="label" tick={{ fill: "#6B7280", fontSize: 12 }} stroke="#1F1F1F" />
                      <YAxis tick={{ fill: "#6B7280", fontSize: 12 }} stroke="#1F1F1F" />
                      <Tooltip content={<TimelineTooltip />} />
                      <ReferenceLine x={`${currentMinute}m`} stroke="#EF4444" strokeDasharray="4 4" />
                      <Line type="monotone" dataKey="orders" stroke="#818CF8" strokeWidth={3} dot={false} />
                    </LineChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="flex h-full items-center justify-center rounded-[24px] border border-dashed border-white/10 bg-black/20 text-sm text-white/45">
                    No order velocity yet.
                  </div>
                )}
              </div>
            </section>
          </div>
        </div>
      )}
    </AdminShell>
  );
}

export default AdminFlashSalesScreen;
