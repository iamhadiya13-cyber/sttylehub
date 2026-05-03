"use client";

import { useEffect, useMemo, useState } from "react";
import Image from "next/image";
import { Area, AreaChart, Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { toast } from "react-hot-toast";
import { IndianRupee, Package, Receipt, Wallet } from "lucide-react";
import { SellerShell } from "@/components/shells";
import { Button, EmptyState, fallbackImage, fetchJson, TextInput, useApi, type Order, type Product } from "@/components/screens/shared";
import { useConfirmModal } from "@/hooks/useConfirmModal";
import { formatCurrency } from "@/lib/utils";

type SellerDashboardResponse = {
  thisMonthRevenue: number;
  lastMonthRevenue: number;
  revenueGrowthPercent: number;
  totalOrders: number;
  pendingOrders: number;
  returnedOrders: number;
  cancelledOrders: number;
  totalProducts: number;
  totalEarnings: number;
  pendingPayout: number;
  paidOutTotal: number;
  requestedPayoutTotal: number;
  listingStates: {
    live: number;
    draft: number;
    archived: number;
    outOfStock: number;
  };
  revenueChart: Array<{ date: string; revenue: number; orders: number }>;
  topProducts: Array<Product & { revenue?: number; unitsSold?: number; orderCount?: number }>;
  recentOrders: Order[];
  lowStockProducts: Product[];
  outOfStockProducts: Product[];
  recentPayouts: Array<{ _id: string; amount: number; status: string; createdAt?: string }>;
  topCategories: Array<{ name: string; revenue: number; unitsSold: number }>;
};

type SellerProductsResponse = {
  products: Product[];
  total: number;
  page: number;
  totalPages: number;
};

type SellerOrdersResponse = {
  orders: Order[];
  total: number;
  page: number;
  totalPages: number;
};

type SellerPayoutsResponse = {
  totalEarnings: number;
  pendingPayout: number;
  history: Array<{
    _id: string;
    amount: number;
    status: "pending" | "approved" | "rejected" | "paid";
    notes?: string;
    createdAt?: string;
    updatedAt?: string;
  }>;
};

type SellerProfileResponse = {
  shopName: string;
  shopSlug?: string;
  shopLogo?: string;
  shopBanner?: string;
  description?: string;
  shopCategory?: string;
  phone?: string;
  businessType?: string;
  panNumber?: string;
  gstNumber?: string;
  bankDetails?: {
    accountName?: string;
    bankName?: string;
    accountNumber?: string;
    ifscCode?: string;
  };
  isApproved?: boolean;
  isActive?: boolean;
  appliedAt?: string;
  approvedAt?: string;
  rejectedAt?: string | null;
  rejectionReason?: string;
  totalEarnings?: number;
  pendingPayout?: number;
};

type SellerReviewRecord = {
  _id: string;
  title: string;
  comment: string;
  rating: number;
  createdAt?: string;
  user?: { name?: string };
  product?: { _id?: string; title?: string };
};

type SellerReviewsResponse = {
  reviews: SellerReviewRecord[];
};

type SellerReturnRequestRecord = {
  _id: string;
  type: "return" | "exchange";
  status: "pending" | "approved" | "rejected" | "completed";
  reason: string;
  customReason?: string;
  evidenceImages: string[];
  sellerNote?: string;
  createdAt?: string;
  order?: { _id?: string; orderNumber?: string; createdAt?: string };
  customer?: { name?: string; email?: string };
  refundMethod?: {
    type?: "bank" | "upi";
    details?: {
      accountHolderName?: string;
      bankName?: string;
      accountNumber?: string;
      ifscCode?: string;
      upiId?: string;
    };
  };
  items: Array<{
    productId: string;
    variantId?: string;
    product?: { _id?: string; title?: string; images?: string[] } | null;
  }>;
};

type SellerReturnRequestsResponse = {
  requests: SellerReturnRequestRecord[];
};

function SummaryCard({
  label,
  value,
  icon: Icon,
}: {
  label: string;
  value: string;
  icon: React.ComponentType<{ className?: string }>;
}) {
  return (
    <div className="rounded-[28px] border border-white/10 bg-white/[0.04] p-5 backdrop-blur sm:p-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-sm text-white/60">{label}</p>
          <p className="mt-3 text-3xl font-black text-white sm:text-4xl">{value}</p>
        </div>
        <div className="rounded-2xl bg-[#6366F1]/12 p-3 text-[#C7D2FE]">
          <Icon className="h-5 w-5" />
        </div>
      </div>
    </div>
  );
}

function SectionCard({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="rounded-[28px] border border-white/10 bg-white/[0.04] p-5 backdrop-blur sm:p-6 lg:p-7">
      <h2 className="mb-5 text-xl font-bold text-white sm:text-2xl">{title}</h2>
      {children}
    </section>
  );
}

function chartTooltip() {
  return { background: "#111111", border: "1px solid #1F1F1F", borderRadius: 16, color: "#ffffff" };
}

function sellerProductStatus(product: Product) {
  if (product.archivedAt) return { label: "Archived", className: "bg-white/10 text-white/75" };
  if (!product.isPublished) return { label: "Draft", className: "bg-white/10 text-white/75" };
  if (Number(product.totalStock ?? 0) === 0) return { label: "Out of Stock", className: "bg-red-500/15 text-red-300" };
  return { label: "Live", className: "bg-emerald-500/15 text-emerald-300" };
}

function sellerOrderStatusTone(status?: string) {
  if (status === "returned" || status === "cancelled") return "bg-red-500/15 text-red-300";
  if (status === "delivered") return "bg-emerald-500/15 text-emerald-300";
  if (status === "shipped") return "bg-blue-500/15 text-blue-300";
  return "bg-[#4F46E5]/14 text-[#C7D2FE]";
}

function sellerPayoutStatusTone(status: string) {
  if (status === "paid") return "bg-emerald-500/15 text-emerald-300";
  if (status === "rejected") return "bg-red-500/15 text-red-300";
  if (status === "approved") return "bg-blue-500/15 text-blue-300";
  return "bg-[#4F46E5]/14 text-[#C7D2FE]";
}
export function SellerDashboardScreen() {
  const { data, loading, error } = useApi<SellerDashboardResponse>("/api/seller/dashboard", {
    thisMonthRevenue: 0,
    lastMonthRevenue: 0,
    revenueGrowthPercent: 0,
    totalOrders: 0,
    pendingOrders: 0,
    returnedOrders: 0,
    cancelledOrders: 0,
    totalProducts: 0,
    totalEarnings: 0,
    pendingPayout: 0,
    paidOutTotal: 0,
    requestedPayoutTotal: 0,
    listingStates: { live: 0, draft: 0, archived: 0, outOfStock: 0 },
    revenueChart: [],
    topProducts: [],
    recentOrders: [],
    lowStockProducts: [],
    outOfStockProducts: [],
    recentPayouts: [],
    topCategories: [],
  });
  const {
    data: pendingReviewsData,
    loading: pendingReviewsLoading,
    error: pendingReviewsError,
    refetch: refetchPendingReviews,
  } = useApi<SellerReviewsResponse>("/api/seller/reviews", {
    reviews: [],
  });
  const [reviewActionState, setReviewActionState] = useState<{
    reviewId: string;
    action: "approve" | "reject";
  } | null>(null);

  const chartData = data.revenueChart.map((item) => ({
    date: item.date ? new Date(String(item.date)).toLocaleDateString("en-IN", { day: "2-digit", month: "short" }) : "",
    revenue: Number(item.revenue || 0),
    orders: Number(item.orders || 0),
  }));

  const moderateReview = async (reviewId: string, action: "approve" | "reject") => {
    try {
      setReviewActionState({ reviewId, action });
      if (action === "approve") {
        await fetchJson(`/api/admin/reviews/${reviewId}/approve`, { method: "PUT" });
        toast.success("Review approved");
      } else {
        await fetchJson("/api/admin/reviews", {
          method: "DELETE",
          body: JSON.stringify({ reviewId }),
        });
        toast.success("Review rejected");
      }
      await refetchPendingReviews();
    } catch (reviewError) {
      toast.error(reviewError instanceof Error ? reviewError.message : "Failed to update review");
    } finally {
      setReviewActionState(null);
    }
  };

  return (
    <SellerShell title="Dashboard">
      {loading ? (
        <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-4">
          {Array.from({ length: 4 }).map((_, index) => <div key={index} className="h-[150px] animate-pulse rounded-[28px] border border-white/10 bg-white/[0.04]" />)}
        </div>
      ) : error ? (
        <EmptyState title="Seller dashboard unavailable" description={error} />
      ) : (
        <div className="space-y-8">
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            <SummaryCard label="This Month Revenue" value={formatCurrency(data.thisMonthRevenue)} icon={IndianRupee} />
            <SummaryCard label="Total Orders" value={String(data.totalOrders)} icon={Receipt} />
            <SummaryCard label="Products" value={String(data.totalProducts)} icon={Package} />
            <SummaryCard label="Pending Payout" value={formatCurrency(data.pendingPayout)} icon={Wallet} />
          </div>
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            <div className="rounded-2xl border border-white/10 bg-black/20 p-4"><p className="text-[11px] font-bold uppercase tracking-[0.22em] text-white/50">Growth</p><p className="mt-3 text-2xl font-black text-[#C7D2FE]">{`${Math.round(data.revenueGrowthPercent)}%`}</p></div>
            <div className="rounded-2xl border border-white/10 bg-black/20 p-4"><p className="text-[11px] font-bold uppercase tracking-[0.22em] text-white/50">Paid Out</p><p className="mt-3 text-2xl font-black text-emerald-300">{formatCurrency(data.paidOutTotal)}</p></div>
            <div className="rounded-2xl border border-white/10 bg-black/20 p-4"><p className="text-[11px] font-bold uppercase tracking-[0.22em] text-white/50">Returns</p><p className="mt-3 text-2xl font-black text-red-300">{data.returnedOrders}</p></div>
            <div className="rounded-2xl border border-white/10 bg-black/20 p-4"><p className="text-[11px] font-bold uppercase tracking-[0.22em] text-white/50">Pending Orders</p><p className="mt-3 text-2xl font-black text-[#C7D2FE]">{data.pendingOrders}</p></div>
          </div>
          <div className="grid gap-6 xl:grid-cols-[1.2fr,0.8fr]">
            <SectionCard title="Revenue Trend"><div className="h-[280px]"><ResponsiveContainer width="100%" height="100%"><AreaChart data={chartData}><defs><linearGradient id="seller-revenue-fill" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="rgba(99,102,241,0.42)" stopOpacity={1} /><stop offset="95%" stopColor="rgba(99,102,241,0.05)" stopOpacity={1} /></linearGradient></defs><CartesianGrid stroke="#1F1F1F" vertical={false} /><XAxis dataKey="date" tick={{ fill: "#888888" }} stroke="#1F1F1F" /><YAxis tick={{ fill: "#888888" }} stroke="#1F1F1F" /><Tooltip contentStyle={chartTooltip()} /><Area type="monotone" dataKey="revenue" stroke="#818CF8" fill="url(#seller-revenue-fill)" strokeWidth={3} /></AreaChart></ResponsiveContainer></div></SectionCard>
            <SectionCard title="Order Flow"><div className="h-[280px]"><ResponsiveContainer width="100%" height="100%"><BarChart data={chartData}><CartesianGrid stroke="#1F1F1F" vertical={false} /><XAxis dataKey="date" tick={{ fill: "#888888" }} stroke="#1F1F1F" /><YAxis tick={{ fill: "#888888" }} stroke="#1F1F1F" /><Tooltip contentStyle={chartTooltip()} /><Bar dataKey="orders" fill="#6366F1" radius={[10, 10, 0, 0]} /></BarChart></ResponsiveContainer></div></SectionCard>
          </div>
          <div className="grid gap-6 xl:grid-cols-[1fr,1fr]">
            <SectionCard title="Top Products"><div className="space-y-3.5">{data.topProducts.length ? data.topProducts.map((product) => (<div key={product._id} className="flex items-center gap-3 rounded-2xl border border-white/10 bg-black/20 p-4"><div className="relative h-14 w-12 shrink-0 overflow-hidden rounded-xl"><Image src={fallbackImage(product.images?.[0])} alt={product.title} fill className="object-cover" /></div><div className="min-w-0 flex-1"><p className="truncate font-semibold text-white">{product.title}</p><p className="text-sm text-white/50">{product.unitsSold || 0} units · {product.orderCount || 0} orders</p></div><span className="text-sm font-semibold text-[#C7D2FE]">{formatCurrency(product.revenue || 0)}</span></div>)) : <p className="text-sm text-white/50">No product sales yet</p>}</div></SectionCard>
            <SectionCard title="Listing States"><div className="grid gap-3 sm:grid-cols-2">{[{ label: "Live", value: data.listingStates.live, tone: "text-emerald-300" },{ label: "Draft", value: data.listingStates.draft, tone: "text-white" },{ label: "Archived", value: data.listingStates.archived, tone: "text-white/70" },{ label: "Out of Stock", value: data.listingStates.outOfStock, tone: "text-red-300" }].map((item) => (<div key={item.label} className="rounded-2xl border border-white/10 bg-black/20 p-4"><p className="text-[11px] font-bold uppercase tracking-[0.22em] text-white/50">{item.label}</p><p className={`mt-3 text-2xl font-black ${item.tone}`}>{item.value}</p></div>))}</div></SectionCard>
          </div>
          <div className="grid gap-6 xl:grid-cols-[1fr,1fr]">
            <SectionCard title="Stock Warnings"><div className="space-y-3.5">{data.lowStockProducts.length ? data.lowStockProducts.map((product) => (<div key={product._id} className="flex items-center gap-3 rounded-2xl border border-white/10 bg-black/20 p-4"><div className="relative h-14 w-12 shrink-0 overflow-hidden rounded-xl"><Image src={fallbackImage(product.images?.[0])} alt={product.title} fill className="object-cover" /></div><div className="min-w-0 flex-1"><p className="truncate font-semibold text-white">{product.title}</p><p className="text-sm text-white/50">{product.brand}</p></div><span className="text-sm font-semibold text-amber-300">{product.totalStock || 0} left</span></div>)) : <p className="text-sm text-white/50">No low-stock items</p>}</div></SectionCard>
            <SectionCard title="Recent Payouts"><div className="space-y-3.5">{data.recentPayouts.length ? data.recentPayouts.map((payout) => (<div key={payout._id} className="flex items-center justify-between gap-3 rounded-2xl border border-white/10 bg-black/20 p-4"><div><p className="font-semibold text-white">{formatCurrency(payout.amount)}</p><p className="text-sm text-white/50">{payout.createdAt ? new Date(payout.createdAt).toLocaleDateString() : "Now"}</p></div><span className={`rounded-full px-3 py-1 text-[11px] font-semibold uppercase ${sellerPayoutStatusTone(payout.status)}`}>{payout.status}</span></div>)) : <p className="text-sm text-white/50">No payout history yet</p>}</div></SectionCard>
          </div>
          <div className="grid gap-6 xl:grid-cols-[1fr,1fr]">
            <SectionCard title="Top Categories"><div className="space-y-3.5">{data.topCategories.length ? data.topCategories.map((category) => (<div key={category.name} className="flex items-center justify-between gap-3 rounded-2xl border border-white/10 bg-black/20 p-4"><div><p className="font-semibold text-white">{category.name}</p><p className="text-sm text-white/50">{category.unitsSold} units</p></div><span className="text-sm font-semibold text-[#C7D2FE]">{formatCurrency(category.revenue)}</span></div>)) : <p className="text-sm text-white/50">No category performance yet</p>}</div></SectionCard>
            <SectionCard title="Recent Orders"><div className="space-y-3.5">{data.recentOrders.length ? data.recentOrders.map((order) => (<div key={order._id} className="rounded-2xl border border-white/10 bg-black/20 p-4"><div className="flex flex-wrap items-center justify-between gap-3"><div><p className="font-semibold text-white">#{order.orderNumber}</p><p className="text-sm text-white/50">{order.user?.name || "Customer"}</p></div><span className={`rounded-full px-3 py-1 text-[11px] font-semibold uppercase ${sellerOrderStatusTone(order.orderStatus)}`}>{order.orderStatus}</span></div></div>)) : <p className="text-sm text-white/50">No recent orders</p>}</div></SectionCard>
          </div>
          <SectionCard title="Pending Reviews">
            {pendingReviewsLoading ? (
              <div className="space-y-4">
                {Array.from({ length: 3 }).map((_, index) => (
                  <div key={index} className="h-32 animate-pulse rounded-2xl border border-white/10 bg-black/20" />
                ))}
              </div>
            ) : pendingReviewsError ? (
              <EmptyState title="Reviews unavailable" description={pendingReviewsError} />
            ) : pendingReviewsData.reviews.length ? (
              <div className="space-y-4">
                {pendingReviewsData.reviews.map((review) => {
                  const isApproving =
                    reviewActionState?.reviewId === review._id && reviewActionState.action === "approve";
                  const isRejecting =
                    reviewActionState?.reviewId === review._id && reviewActionState.action === "reject";

                  return (
                    <div
                      key={review._id}
                      className="rounded-2xl border border-white/10 bg-black/20 p-4 sm:p-5"
                    >
                      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                        <div className="space-y-2.5">
                          <p className="text-sm font-semibold uppercase tracking-[0.18em] text-[#A5B4FC]">
                            {review.product?.title || "Product"}
                          </p>
                          <div className="flex flex-wrap items-center gap-2 text-sm">
                            <span className="rounded-full bg-[#4F46E5]/14 px-3 py-1 font-semibold text-[#C7D2FE]">
                              {`${"★".repeat(Math.max(0, Math.min(5, review.rating)))}${"☆".repeat(Math.max(0, 5 - Math.min(5, review.rating)))}`}
                            </span>
                            <span className="text-white/50">{review.user?.name || "Customer"}</span>
                            <span className="text-white/35">
                              {review.createdAt ? new Date(review.createdAt).toLocaleDateString("en-IN") : ""}
                            </span>
                          </div>
                          <h3 className="text-lg font-bold text-white">{review.title}</h3>
                          <p className="text-sm leading-7 text-white/70">{review.comment}</p>
                        </div>
                        <div className="flex flex-wrap gap-2">
                          <Button
                            type="button"
                            loading={isApproving}
                            loadingText="Approving..."
                            disabled={Boolean(reviewActionState)}
                            onClick={() => void moderateReview(review._id, "approve")}
                          >
                            Approve
                          </Button>
                          <Button
                            type="button"
                            variant="danger"
                            loading={isRejecting}
                            loadingText="Rejecting..."
                            disabled={Boolean(reviewActionState)}
                            onClick={() => void moderateReview(review._id, "reject")}
                          >
                            Reject
                          </Button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <EmptyState title="No pending reviews" description="New customer reviews for your products will appear here." />
            )}
          </SectionCard>
        </div>
      )}
    </SellerShell>
  );
}
export function SellerProductsScreen() {
  const [status, setStatus] = useState<"all" | "live" | "draft" | "archived" | "featured">("all");
  const [stock, setStock] = useState<"all" | "low" | "out">("all");
  const { data, loading, error } = useApi<SellerProductsResponse>(`/api/seller/products?status=${status}&stock=${stock}&limit=40`, { products: [], total: 0, page: 1, totalPages: 1 });
  const chipClass = (active: boolean) => active ? "rounded-full bg-[#4F46E5]/14 px-4 py-2 text-sm font-semibold uppercase text-[#C7D2FE]" : "rounded-full border border-[#1F1F1F] px-4 py-2 text-sm font-semibold uppercase text-[#888888]";

  return (
    <SellerShell title="Products">
      <div className="space-y-6">
        <div className="flex flex-wrap gap-3">
          {(["all", "live", "draft", "archived", "featured"] as const).map((value) => <button key={value} type="button" onClick={() => setStatus(value)} className={chipClass(status === value)}>{value}</button>)}
          {(["all", "low", "out"] as const).map((value) => <button key={value} type="button" onClick={() => setStock(value)} className={chipClass(stock === value)}>{value === "all" ? "all stock" : value === "low" ? "low stock" : "out of stock"}</button>)}
        </div>
        {loading ? <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">{Array.from({ length: 6 }).map((_, index) => <div key={index} className="h-[220px] animate-pulse rounded-[28px] border border-white/10 bg-white/[0.04]" />)}</div> : error ? <EmptyState title="Products unavailable" description={error} /> : data.products.length ? <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">{data.products.map((product) => { const badge = sellerProductStatus(product); return <div key={product._id} className="rounded-[28px] border border-white/10 bg-white/[0.04] p-4 backdrop-blur"><div className="relative aspect-[4/5] overflow-hidden rounded-[22px] bg-black/20"><Image src={fallbackImage(product.images?.[0])} alt={product.title} fill className="object-cover" /></div><div className="mt-4 flex items-start justify-between gap-3"><div className="min-w-0"><p className="truncate font-semibold text-white">{product.title}</p><p className="mt-1 text-sm text-white/50">{product.brand}</p></div><span className={`rounded-full px-3 py-1 text-[11px] font-semibold uppercase ${badge.className}`}>{badge.label}</span></div><div className="mt-4 flex items-center justify-between text-sm"><span className="font-semibold text-[#C7D2FE]">{formatCurrency(product.discountPrice || product.price)}</span><span className={Number(product.totalStock ?? 0) > 0 ? "text-amber-300" : "text-red-300"}>{product.totalStock ?? 0} in stock</span></div><div className="mt-3 flex flex-wrap gap-2">{product.campaignKey ? <span className="rounded-full border border-white/10 px-3 py-1 text-[11px] text-white/70">{product.campaignKey}</span> : null}{product.isFeatured ? <span className="rounded-full bg-[#4F46E5]/14 px-3 py-1 text-[11px] font-semibold text-[#C7D2FE]">Featured</span> : null}</div></div>; })}</div> : <EmptyState title="No products found" />}
      </div>
    </SellerShell>
  );
}

export function SellerOrdersScreen() {
  const [status, setStatus] = useState("all");
  const { data, loading, error } = useApi<SellerOrdersResponse>(`/api/seller/orders?status=${status}&limit=30`, { orders: [], total: 0, page: 1, totalPages: 1 });

  return (
    <SellerShell title="Orders">
      <div className="space-y-6">
        <div className="flex flex-wrap gap-3">
          {["all", "pending", "confirmed", "processing", "shipped", "delivered", "returned", "cancelled"].map((value) => <button key={value} type="button" onClick={() => setStatus(value)} className={status === value ? "rounded-full bg-[#4F46E5]/14 px-4 py-2 text-sm font-semibold uppercase text-[#C7D2FE]" : "rounded-full border border-[#1F1F1F] px-4 py-2 text-sm font-semibold uppercase text-[#888888]"}>{value}</button>)}
        </div>
        {loading ? <div className="space-y-4">{Array.from({ length: 6 }).map((_, index) => <div key={index} className="h-[132px] animate-pulse rounded-[28px] border border-white/10 bg-white/[0.04]" />)}</div> : error ? <EmptyState title="Orders unavailable" description={error} /> : data.orders.length ? <div className="space-y-4">{data.orders.map((order) => <div key={order._id} className="rounded-[28px] border border-white/10 bg-white/[0.04] p-5 backdrop-blur"><div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between"><div><div className="flex flex-wrap items-center gap-2"><p className="font-semibold text-white">#{order.orderNumber}</p><span className={`rounded-full px-3 py-1 text-[11px] font-semibold uppercase ${sellerOrderStatusTone(order.orderStatus)}`}>{order.orderStatus}</span>{order.orderStatus === "returned" || order.orderStatus === "cancelled" ? <span className="rounded-full bg-red-500/15 px-3 py-1 text-[11px] font-semibold uppercase text-red-300">Issue</span> : null}</div><p className="mt-2 text-sm text-white/50">{order.user?.name || "Customer"} · {order.paymentMethod}</p>{order.trackingNumber ? <p className="mt-2 text-sm text-[#C7D2FE]">Tracking: {order.trackingNumber}</p> : null}</div><div className="text-sm sm:text-right"><p className="font-semibold text-white">{formatCurrency(order.total)}</p><p className="mt-1 text-white/50">{order.createdAt ? new Date(order.createdAt).toLocaleDateString() : ""}</p></div></div></div>)}</div> : <EmptyState title="No orders found" />}
      </div>
    </SellerShell>
  );
}

export function SellerReturnRequestsScreen() {
  const { confirm } = useConfirmModal();
  const { data, loading, error, refetch } = useApi<SellerReturnRequestsResponse>("/api/seller/return-requests", {
    requests: [],
  });
  const [actionState, setActionState] = useState<{ id: string; action: "approve" | "reject" } | null>(null);
  const [rejectingId, setRejectingId] = useState<string | null>(null);
  const [sellerNote, setSellerNote] = useState("");

  const updateRequest = async (requestId: string, status: "approved" | "rejected", note?: string) => {
    try {
      setActionState({ id: requestId, action: status === "approved" ? "approve" : "reject" });
      const response = await fetchJson(`/api/seller/return-requests/${requestId}`, {
        method: "PATCH",
        body: JSON.stringify({ status, sellerNote: note || "" }),
      });
      toast.success(response.message || "Request updated");
      setRejectingId(null);
      setSellerNote("");
      await refetch();
    } catch (requestError) {
      toast.error(requestError instanceof Error ? requestError.message : "Failed to update request");
    } finally {
      setActionState(null);
    }
  };

  const pendingRequests = data.requests.filter((request) => request.status === "pending");

  return (
    <SellerShell title="Returns & Exchanges">
      <SectionCard title="Pending Requests">
        {loading ? (
          <div className="space-y-4">
            {Array.from({ length: 4 }).map((_, index) => (
              <div key={index} className="h-40 animate-pulse rounded-2xl border border-white/10 bg-black/20" />
            ))}
          </div>
        ) : error ? (
          <EmptyState title="Requests unavailable" description={error} />
        ) : pendingRequests.length ? (
          <div className="space-y-4">
            {pendingRequests.map((request) => {
              const isApproving = actionState?.id === request._id && actionState.action === "approve";
              const isRejecting = actionState?.id === request._id && actionState.action === "reject";
              const productNames = request.items
                .map((item) => item.product?.title)
                .filter(Boolean)
                .join(", ");

              return (
                <div key={request._id} className="rounded-2xl border border-white/10 bg-black/20 p-4 sm:p-5">
                  <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                    <div className="space-y-3">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="rounded-full bg-[#4F46E5]/14 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.16em] text-[#C7D2FE]">
                          {request.type}
                        </span>
                        <span className="text-sm text-white/50">Order #{request.order?.orderNumber || "-"}</span>
                        <span className="text-sm text-white/35">
                          {request.createdAt ? new Date(request.createdAt).toLocaleDateString("en-IN") : ""}
                        </span>
                      </div>
                      <div>
                        <p className="font-semibold text-white">{request.customer?.name || request.customer?.email || "Customer"}</p>
                        <p className="mt-1 text-sm text-white/60">{productNames || "Product"}</p>
                      </div>
                      <p className="text-sm leading-6 text-white/70">
                        {request.reason}
                        {request.reason === "Other" && request.customReason ? ` — ${request.customReason}` : ""}
                      </p>
                      {request.evidenceImages.length ? (
                        <div className="flex flex-wrap gap-2">
                          {request.evidenceImages.map((image, index) => (
                            <div key={`${request._id}-evidence-${index}`} className="relative h-14 w-14 overflow-hidden rounded-xl border border-white/10">
                              <Image src={fallbackImage(image)} alt="Evidence" fill className="object-cover" />
                            </div>
                          ))}
                        </div>
                      ) : null}
                      {request.type === "return" && request.refundMethod?.type ? (
                        <div className="rounded-xl border border-white/10 bg-[#0C0F18] p-3 text-sm text-white/65">
                          <p className="font-semibold text-white">Refund Details</p>
                          <p className="mt-1 uppercase tracking-[0.14em] text-[#A5B4FC]">{request.refundMethod.type}</p>
                          {request.refundMethod.type === "bank" ? (
                            <p className="mt-2">
                              {request.refundMethod.details?.accountHolderName || "-"} · {request.refundMethod.details?.bankName || "-"} · {request.refundMethod.details?.accountNumber || "-"} · {request.refundMethod.details?.ifscCode || "-"}
                            </p>
                          ) : (
                            <p className="mt-2">{request.refundMethod.details?.upiId || "-"}</p>
                          )}
                        </div>
                      ) : null}
                    </div>
                    <div className="flex w-full max-w-[280px] flex-col gap-2">
                      <Button
                        type="button"
                        loading={isApproving}
                        loadingText="Approving..."
                        disabled={Boolean(actionState)}
                        onClick={() => void updateRequest(request._id, "approved")}
                      >
                        Approve
                      </Button>
                      {rejectingId === request._id ? (
                        <div className="space-y-2 rounded-xl border border-white/10 bg-[#0C0F18] p-3">
                          <TextInput
                            label="Rejection note"
                            leftPad={false}
                            placeholder="Reason for rejection"
                            value={sellerNote}
                            onChange={(event) => setSellerNote(event.target.value)}
                          />
                          <div className="flex gap-2">
                            <Button
                              type="button"
                              variant="danger"
                              loading={isRejecting}
                              loadingText="Rejecting..."
                              disabled={Boolean(actionState) || !sellerNote.trim()}
                              onClick={() =>
                                void confirm({
                                  title: "Reject return request?",
                                  message: "The customer will be notified that their request was rejected.",
                                  confirmText: "Reject",
                                  variant: "warning",
                                  action: async () => {
                                    await updateRequest(request._id, "rejected", sellerNote);
                                  },
                                })
                              }
                            >
                              Confirm Reject
                            </Button>
                            <Button type="button" variant="secondary" onClick={() => { setRejectingId(null); setSellerNote(""); }}>
                              Cancel
                            </Button>
                          </div>
                        </div>
                      ) : (
                        <Button
                          type="button"
                          variant="danger"
                          disabled={Boolean(actionState)}
                          onClick={() => {
                            setRejectingId(request._id);
                            setSellerNote(request.sellerNote || "");
                          }}
                        >
                          Reject
                        </Button>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <EmptyState title="No pending requests" description="Return and exchange requests will appear here." />
        )}
      </SectionCard>
    </SellerShell>
  );
}

export function SellerPayoutsScreen() {
  const { data, loading, error, refetch } = useApi<SellerPayoutsResponse>("/api/seller/payouts", { totalEarnings: 0, pendingPayout: 0, history: [] });
  const [requesting, setRequesting] = useState(false);
  const paidTotal = useMemo(() => data.history.filter((item) => item.status === "paid").reduce((sum, item) => sum + Number(item.amount || 0), 0), [data.history]);

  const requestPayout = async () => {
    try {
      setRequesting(true);
      const response = await fetchJson("/api/seller/payout-request", { method: "POST" });
      toast.success(response.message || "Payout requested");
      await refetch();
    } catch (requestError) {
      toast.error(requestError instanceof Error ? requestError.message : "Failed to request payout");
    } finally {
      setRequesting(false);
    }
  };

  return (
    <SellerShell title="Payouts" action={<Button type="button" loading={requesting} loadingText="Saving..." disabled={data.pendingPayout <= 0} onClick={() => void requestPayout()}>Request Payout</Button>}>
      <div className="space-y-6">
        <div className="grid gap-4 md:grid-cols-3">
          <SummaryCard label="Total Earnings" value={formatCurrency(data.totalEarnings)} icon={IndianRupee} />
          <SummaryCard label="Pending Payout" value={formatCurrency(data.pendingPayout)} icon={Wallet} />
          <SummaryCard label="Paid Out" value={formatCurrency(paidTotal)} icon={Receipt} />
        </div>
        <SectionCard title="Payout History">
          <div className="space-y-4">
            {loading ? Array.from({ length: 5 }).map((_, index) => <div key={index} className="h-16 animate-pulse rounded-2xl border border-white/10 bg-black/20" />) : error ? <EmptyState title="Payouts unavailable" description={error} /> : data.history.length ? data.history.map((payout) => <div key={payout._id} className="flex flex-col gap-3 rounded-2xl border border-white/10 bg-black/20 p-4 sm:flex-row sm:items-center sm:justify-between"><div><p className="font-semibold text-white">{formatCurrency(payout.amount)}</p><p className="mt-1 text-sm text-white/50">{payout.createdAt ? new Date(payout.createdAt).toLocaleDateString() : "Now"}</p></div><div className="flex items-center gap-3">{payout.notes ? <span className="text-sm text-white/50">{payout.notes}</span> : null}<span className={`rounded-full px-3 py-1 text-[11px] font-semibold uppercase ${sellerPayoutStatusTone(payout.status)}`}>{payout.status}</span></div></div>) : <EmptyState title="No payout history yet" />}
          </div>
        </SectionCard>
      </div>
    </SellerShell>
  );
}

export function SellerProfileScreen() {
  const { data, loading, error, refetch } = useApi<SellerProfileResponse>("/api/seller/profile", { shopName: "", description: "", shopCategory: "", phone: "", shopLogo: "", shopBanner: "", bankDetails: { accountName: "", bankName: "", accountNumber: "", ifscCode: "" } });
  const [form, setForm] = useState<SellerProfileResponse | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => { setForm(data); }, [data]);

  const saveProfile = async () => {
    if (!form) return;
    try {
      setSaving(true);
      const response = await fetchJson("/api/seller/profile", {
        method: "PUT",
        body: JSON.stringify({
          shopName: form.shopName,
          description: form.description || "",
          shopCategory: form.shopCategory || "",
          phone: form.phone || "",
          shopLogo: form.shopLogo || "",
          shopBanner: form.shopBanner || "",
          bankDetails: {
            accountName: form.bankDetails?.accountName || "",
            bankName: form.bankDetails?.bankName || "",
            accountNumber: form.bankDetails?.accountNumber || "",
            ifscCode: form.bankDetails?.ifscCode || "",
          },
        }),
      });
      toast.success(response.message || "Profile updated");
      await refetch();
    } catch (saveError) {
      toast.error(saveError instanceof Error ? saveError.message : "Failed to update profile");
    } finally {
      setSaving(false);
    }
  };

  return (
    <SellerShell title="Profile" action={<Button type="button" loading={saving} loadingText="Saving..." onClick={() => void saveProfile()}>Save Profile</Button>}>
      {loading ? <div className="h-[420px] animate-pulse rounded-[28px] border border-white/10 bg-white/[0.04]" /> : error || !form ? <EmptyState title="Seller profile unavailable" description={error || "Profile not found"} /> : <div className="space-y-6"><div className="rounded-[28px] border border-white/10 bg-white/[0.04] p-5 backdrop-blur sm:p-6"><div className="flex flex-wrap items-center gap-3"><span className={`rounded-full px-3 py-1 text-[11px] font-semibold uppercase ${form.isApproved ? "bg-emerald-500/15 text-emerald-300" : "bg-[#4F46E5]/14 text-[#C7D2FE]"}`}>{form.isApproved ? "Approved" : "Pending"}</span>{form.shopSlug ? <span className="rounded-full border border-white/10 px-3 py-1 text-[11px] text-white/70">{form.shopSlug}</span> : null}</div><div className="mt-5 grid gap-4 md:grid-cols-2"><TextInput label="Shop Name" leftPad={false} placeholder="StyleHub Studio" value={form.shopName} onChange={(e) => setForm((current) => current ? { ...current, shopName: e.target.value } : current)} /><TextInput label="Category" leftPad={false} placeholder="Streetwear" value={form.shopCategory || ""} onChange={(e) => setForm((current) => current ? { ...current, shopCategory: e.target.value } : current)} /><TextInput label="Phone" leftPad={false} placeholder="9876543210" value={form.phone || ""} onChange={(e) => setForm((current) => current ? { ...current, phone: e.target.value } : current)} /><TextInput label="Logo URL" leftPad={false} placeholder="https://cdn.example.com/logo.jpg" value={form.shopLogo || ""} onChange={(e) => setForm((current) => current ? { ...current, shopLogo: e.target.value } : current)} /><div className="md:col-span-2"><TextInput label="Banner URL" leftPad={false} placeholder="https://cdn.example.com/banner.jpg" value={form.shopBanner || ""} onChange={(e) => setForm((current) => current ? { ...current, shopBanner: e.target.value } : current)} /></div><label className="space-y-2 md:col-span-2"><span className="app-label">Description</span><textarea value={form.description || ""} onChange={(e) => setForm((current) => current ? { ...current, description: e.target.value } : current)} placeholder="Store description" className="min-h-[120px] w-full rounded-2xl border border-[#1F1F1F] bg-[#0D0F15] px-4 py-3 text-sm text-white outline-none transition focus:border-[#6366F1]" /></label></div></div><SectionCard title="Bank Details"><div className="grid gap-4 md:grid-cols-2"><TextInput label="Account Name" leftPad={false} placeholder="StyleHub Studio" value={form.bankDetails?.accountName || ""} onChange={(e) => setForm((current) => current ? { ...current, bankDetails: { ...current.bankDetails, accountName: e.target.value } } : current)} /><TextInput label="Bank Name" leftPad={false} placeholder="HDFC Bank" value={form.bankDetails?.bankName || ""} onChange={(e) => setForm((current) => current ? { ...current, bankDetails: { ...current.bankDetails, bankName: e.target.value } } : current)} /><TextInput label="Account Number" leftPad={false} placeholder="XXXXXX1234" value={form.bankDetails?.accountNumber || ""} onChange={(e) => setForm((current) => current ? { ...current, bankDetails: { ...current.bankDetails, accountNumber: e.target.value } } : current)} /><TextInput label="IFSC Code" leftPad={false} placeholder="HDFC0001234" value={form.bankDetails?.ifscCode || ""} onChange={(e) => setForm((current) => current ? { ...current, bankDetails: { ...current.bankDetails, ifscCode: e.target.value.toUpperCase() } } : current)} /></div></SectionCard></div>}
    </SellerShell>
  );
}
