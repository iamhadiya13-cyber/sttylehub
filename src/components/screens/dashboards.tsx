"use client";

import { useEffect, useMemo, useState } from "react";
import Image from "next/image";
import CountUp from "react-countup";
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Line,
  LineChart,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import ConfirmModal from "@/components/ui/ConfirmModal";
import { StatCardSkeleton, TableRowSkeleton } from "@/components/ui/Skeletons";
import {
  Package,
  ShoppingBag,
  Users,
  Store,
  IndianRupee,
  Wallet,
  Plus,
  Pencil,
  Trash2,
  X,
} from "lucide-react";
import { toast } from "react-hot-toast";
import { motion, AnimatePresence } from "framer-motion";
import { AdminShell } from "@/components/admin/AdminSidebar";
import { SellerShell } from "@/components/shells";
import { Button, EmptyState, fallbackImage, fetchJson, TextArea, TextInput, type Category, type Order, type Product, useApi } from "@/components/screens/shared";
import { formatCurrency } from "@/lib/utils";

type DashboardStats = Record<string, unknown>;

type AdminProductResponse = { products: Product[] };

type ProductFormState = {
  title: string;
  brand: string;
  description: string;
  shortDescription: string;
  price: string;
  discountPrice: string;
  categoryId: string;
  stock: string;
  tags: string;
  sizes: string[];
  colors: { name: string; hex: string }[];
  images: string;
  isPublished: boolean;
  isFeatured: boolean;
};

function getInitialProductForm(product?: Product): ProductFormState {
  return {
    title: product?.title || "",
    brand: product?.brand || "",
    description: product?.description || "",
    shortDescription: product?.shortDescription || "",
    price: product?.price ? String(product.price) : "",
    discountPrice: product?.discountPrice ? String(product.discountPrice) : "",
    categoryId: product?.category?._id || "",
    stock: product?.stock !== undefined ? String(product.stock) : "20",
    tags: product?.tags?.join(", ") || "",
    sizes: product?.sizes?.length ? product.sizes : ["XS", "S", "M", "L", "XL", "XXL"],
    colors: product?.colors?.length ? product.colors : [{ name: "Black", hex: "#000000" }, { name: "White", hex: "#FFFFFF" }],
    images: product?.images?.join("\n") || "",
    isPublished: product?.isPublished ?? true,
    isFeatured: product?.isFeatured ?? false,
  };
}

function normalizeProducts(data: unknown): Product[] {
  if (Array.isArray(data)) return data as Product[];
  if (data && typeof data === "object" && Array.isArray((data as { products?: unknown[] }).products)) {
    return (data as { products: Product[] }).products;
  }
  return [];
}

function StatCard({ label, value, prefix, icon: Icon }: { label: string; value: number; prefix?: string; icon: React.ComponentType<{ className?: string }> }) {
  return (
    <div className="rounded-3xl border border-white/10 bg-white/[0.04] p-5 backdrop-blur sm:p-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-sm text-white/60">{label}</p>
          <p className="mt-3 text-3xl font-black text-white sm:mt-4 sm:text-4xl"><CountUp end={value} separator="," prefix={prefix} /></p>
        </div>
        <div className="rounded-2xl bg-[#6366F1]/12 p-2.5 text-[#C7D2FE] sm:p-3">
          <Icon className="h-5 w-5 sm:h-6 sm:w-6" />
        </div>
      </div>
    </div>
  );
}

function ChartCard({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="rounded-[28px] border border-white/10 bg-white/[0.04] p-5 backdrop-blur sm:p-6 lg:p-7">
      <h2 className="mb-5 text-xl font-bold text-white sm:mb-6 sm:text-2xl">{title}</h2>
      <div className="h-[260px] sm:h-[300px] lg:h-80">{children}</div>
    </div>
  );
}

function ChartEmptyState({ title, description }: { title: string; description?: string }) {
  return (
    <div className="flex h-full flex-col items-center justify-center rounded-[24px] border border-dashed border-white/10 bg-black/20 px-6 text-center">
      <p className="text-lg font-bold text-white">{title}</p>
      {description ? <p className="mt-2 max-w-sm text-sm leading-6 text-white/55">{description}</p> : null}
    </div>
  );
}

function MiniMetricCard({ label, value, accent = "#818CF8" }: { label: string; value: string; accent?: string }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-black/20 p-4">
      <p className="text-[11px] font-bold uppercase tracking-[0.22em] text-white/50">{label}</p>
      <p className="mt-3 text-xl font-black sm:text-2xl" style={{ color: accent }}>{value}</p>
    </div>
  );
}

function chartTooltip() {
  return { background: "#111111", border: "1px solid #1F1F1F", borderRadius: 16, color: "#ffffff" };
}

export function AdminDashboardScreen() {
  const { data, loading, error } = useApi<DashboardStats>("/api/admin/dashboard", {});
  const chartData = ((data.revenueChart as Array<Record<string, unknown>>) || []).map((item) => ({
    date: item.date ? new Date(String(item.date)).toLocaleDateString("en-IN", { day: "2-digit", month: "short" }) : "",
    revenue: Number(item.revenue || 0),
    orders: Number(item.orders || 0),
  }));
  const hasChartData = chartData.some((item) => item.revenue > 0 || item.orders > 0);

  return (
    <AdminShell title="Dashboard">
      {loading ? <>
        <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-4">
          {Array.from({ length: 4 }).map((_, index) => <StatCardSkeleton key={index} />)}
        </div>
        <div className="grid gap-7 xl:grid-cols-[1.15fr,0.85fr]">
          <div className="skeleton h-[280px] rounded-xl" />
          <div className="skeleton h-[280px] rounded-xl" />
        </div>
        <div className="overflow-x-auto rounded-[32px] border border-white/10 bg-white/[0.04] p-6 backdrop-blur">
          <table className="min-w-full">
            <tbody><TableRowSkeleton cols={5} rows={5} /></tbody>
          </table>
        </div>
      </> : error ? <EmptyState title="Admin dashboard unavailable" description={error} /> : <>
        <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-4">
          <StatCard label="Gross Revenue" value={Number(data.grossRevenue || 0)} prefix="₹" icon={IndianRupee} />
          <StatCard label="Orders" value={Number(data.totalOrders || 0)} icon={ShoppingBag} />
          <StatCard label="Users" value={Number(data.totalUsers || 0)} icon={Users} />
          <StatCard label="Products" value={Number(data.totalProducts || 0)} icon={Package} />
        </div>
        <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-4">
          <MiniMetricCard label="Paid Orders" value={String(Number(data.paidOrders || 0))} accent="#22C55E" />
          <MiniMetricCard label="Pending Orders" value={String(Number(data.pendingOrders || 0))} accent="#818CF8" />
          <MiniMetricCard label="Delivered Orders" value={String(Number(data.deliveredOrders || 0))} accent="#3B82F6" />
          <MiniMetricCard label="COD Pending" value={formatCurrency(Number(data.codPendingAmount || 0))} accent="#6366F1" />
        </div>
        <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
          <MiniMetricCard label="Low Stock Threshold" value={String(Number(data.lowStockThreshold || 0))} accent="#C7D2FE" />
          <MiniMetricCard label="Low Stock Products" value={String(Number(data.lowStockCount || 0))} accent="#F59E0B" />
          <MiniMetricCard label="Out of Stock" value={String(Number(data.outOfStockCount || 0))} accent="#EF4444" />
        </div>
        <div className="grid gap-7 xl:grid-cols-[1.15fr,0.85fr]">
          <ChartCard title="Revenue Trend">
            {hasChartData ? <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData}>
                <defs>
                  <linearGradient id="revenue-fill" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="rgba(129,140,248,0.42)" stopOpacity={1} />
                    <stop offset="95%" stopColor="rgba(129,140,248,0.05)" stopOpacity={1} />
                  </linearGradient>
                </defs>
                <CartesianGrid stroke="#1F1F1F" vertical={false} />
                <XAxis dataKey="date" tick={{ fill: "#888888" }} stroke="#1F1F1F" />
                <YAxis tick={{ fill: "#888888" }} stroke="#1F1F1F" />
                <Tooltip contentStyle={chartTooltip()} />
                <Area type="monotone" dataKey="revenue" stroke="#818CF8" fill="url(#revenue-fill)" strokeWidth={3} />
              </AreaChart>
            </ResponsiveContainer> : <ChartEmptyState title="No revenue activity yet" />}
          </ChartCard>
          <ChartCard title="Orders">
            {hasChartData ? <ResponsiveContainer width="100%" height="100%">
              <LineChart data={chartData}>
                <CartesianGrid stroke="#1F1F1F" vertical={false} />
                <XAxis dataKey="date" tick={{ fill: "#888888" }} stroke="#1F1F1F" />
                <YAxis tick={{ fill: "#888888" }} stroke="#1F1F1F" />
                <Tooltip contentStyle={chartTooltip()} />
                <Line type="monotone" dataKey="orders" stroke="#8B5CF6" strokeWidth={3} dot={false} />
              </LineChart>
            </ResponsiveContainer> : <ChartEmptyState title="No order trend available" />}
          </ChartCard>
        </div>
        <div className="grid gap-7 xl:grid-cols-[1fr,1fr]">
          <div className="rounded-[28px] border border-white/10 bg-white/[0.04] p-5 backdrop-blur sm:p-6 lg:p-7">
            <h2 className="mb-5 text-xl font-bold text-white sm:text-2xl">Recent Orders</h2>
            <div className="space-y-3.5">{((data.recentOrders as Order[]) || []).length ? ((data.recentOrders as Order[]) || []).map((order) => <div key={order._id} className="rounded-2xl border border-white/10 bg-black/20 p-4 sm:p-4"><div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between sm:gap-4"><div className="min-w-0"><p className="truncate font-semibold text-white">#{order.orderNumber}</p><p className="text-sm text-white/50">{order.user?.name || "Customer"}</p></div><span className="text-sm font-semibold text-[#C7D2FE]">{formatCurrency(order.total)}</span></div></div>) : <p className="text-sm text-white/50">No orders</p>}</div>
          </div>
          <div className="rounded-[28px] border border-white/10 bg-white/[0.04] p-5 backdrop-blur sm:p-6 lg:p-7">
            <h2 className="mb-5 text-xl font-bold text-white sm:text-2xl">Top Products</h2>
            <div className="space-y-3.5">{((data.topProducts as Product[]) || []).length ? ((data.topProducts as Product[]) || []).map((product, index) => <div key={product._id} className="flex items-center gap-3 rounded-2xl border border-white/10 bg-black/20 p-3.5 sm:gap-4 sm:p-4"><span className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-white/10 text-xs font-bold sm:h-9 sm:w-9 sm:text-sm">{index + 1}</span><div className="relative h-12 w-10 shrink-0 overflow-hidden rounded-xl sm:h-14 sm:w-12"><Image src={fallbackImage(product.images?.[0])} alt={product.title} fill className="object-cover" /></div><div className="min-w-0 flex-1"><p className="truncate font-semibold text-white">{product.title}</p><p className="text-sm text-white/50">Sold: {product.totalSold || 0}</p></div><span className="text-sm font-semibold text-[#C7D2FE]">{formatCurrency(product.discountPrice || product.price)}</span></div>) : <p className="text-sm text-white/50">No products</p>}</div>
          </div>
        </div>
        <div className="grid gap-7 xl:grid-cols-[1fr,1fr]">
          <div className="rounded-[28px] border border-white/10 bg-white/[0.04] p-5 backdrop-blur sm:p-6 lg:p-7">
            <h2 className="mb-5 text-xl font-bold text-white sm:text-2xl">Low Stock</h2>
            <div className="space-y-3.5">
              {((data.lowStockProducts as Product[]) || []).length ? ((data.lowStockProducts as Product[]) || []).map((product) => (
                <div key={product._id} className="flex items-center gap-3 rounded-2xl border border-white/10 bg-black/20 p-4">
                  <div className="relative h-14 w-12 shrink-0 overflow-hidden rounded-xl">
                    <Image src={fallbackImage(product.images?.[0])} alt={product.title} fill className="object-cover" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-semibold text-white">{product.title}</p>
                    <p className="text-sm text-white/50">{product.brand}</p>
                  </div>
                  <span className="text-sm font-semibold text-amber-300">{product.totalStock || 0} left</span>
                </div>
              )) : <p className="text-sm text-white/50">No low stock products</p>}
            </div>
          </div>
          <div className="rounded-[28px] border border-white/10 bg-white/[0.04] p-5 backdrop-blur sm:p-6 lg:p-7">
            <h2 className="mb-5 text-xl font-bold text-white sm:text-2xl">Out of Stock</h2>
            <div className="space-y-3.5">
              {((data.outOfStockProducts as Product[]) || []).length ? ((data.outOfStockProducts as Product[]) || []).map((product) => (
                <div key={product._id} className="flex items-center gap-3 rounded-2xl border border-white/10 bg-black/20 p-4">
                  <div className="relative h-14 w-12 shrink-0 overflow-hidden rounded-xl">
                    <Image src={fallbackImage(product.images?.[0])} alt={product.title} fill className="object-cover" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-semibold text-white">{product.title}</p>
                    <p className="text-sm text-white/50">{product.brand}</p>
                  </div>
                  <span className="text-sm font-semibold text-red-400">0 left</span>
                </div>
              )) : <p className="text-sm text-white/50">No out-of-stock products</p>}
            </div>
          </div>
        </div>
      </>}
    </AdminShell>
  );
}

export function AdminAnalyticsScreen() {
  const { data, loading, error } = useApi<DashboardStats>("/api/admin/analytics", {});
  const monthly = ((data.monthlyRevenue as Array<Record<string, unknown>>) || []).map((item) => ({ month: `M${String(item._id || "")}`, revenue: Number(item.revenue || 0), orders: Number(item.orders || 0) }));
  const category = ((data.revenueByCategory as Array<Record<string, unknown>>) || []).map((item) => ({ name: String(item._id || "Unknown"), revenue: Number(item.revenue || 0) }));
  const hasMonthly = monthly.some((item) => item.revenue > 0 || item.orders > 0);
  const hasCategory = category.some((item) => item.revenue > 0);

  return (
    <AdminShell title="Analytics">
      {loading ? <div className="h-[640px] animate-pulse rounded-3xl border border-[#1F1F1F] bg-[#111111]" /> : error ? <EmptyState title="Analytics unavailable" description={error} /> : <div className="grid gap-6 xl:grid-cols-[1.2fr,0.8fr]">
        <ChartCard title="Monthly Revenue">
          {hasMonthly ? <ResponsiveContainer width="100%" height="100%">
            <LineChart data={monthly}>
              <CartesianGrid stroke="#1F1F1F" vertical={false} />
              <XAxis dataKey="month" tick={{ fill: "#888888" }} stroke="#1F1F1F" />
              <YAxis tick={{ fill: "#888888" }} stroke="#1F1F1F" />
              <Tooltip contentStyle={chartTooltip()} />
              <Line type="monotone" dataKey="revenue" stroke="#818CF8" strokeWidth={3} dot={false} />
              <Line type="monotone" dataKey="orders" stroke="#8B5CF6" strokeWidth={3} dot={false} />
            </LineChart>
          </ResponsiveContainer> : <ChartEmptyState title="No monthly revenue yet" />}
        </ChartCard>
        <ChartCard title="Revenue by Category">
          {hasCategory ? <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie data={category} dataKey="revenue" nameKey="name" innerRadius={70} outerRadius={110}>
                {category.map((entry, index) => <Cell key={entry.name} fill={["#818CF8", "#6366F1", "#3B82F6", "#22C55E", "#06B6D4"][index % 5]} />)}
              </Pie>
              <Tooltip contentStyle={chartTooltip()} />
            </PieChart>
          </ResponsiveContainer> : <ChartEmptyState title="No category revenue yet" />}
        </ChartCard>
      </div>}
    </AdminShell>
  );
}

function ProductModal({ open, onClose, onSaved, product }: { open: boolean; onClose: () => void; onSaved: () => void; product?: Product | null }) {
  const [form, setForm] = useState<ProductFormState>(getInitialProductForm(product || undefined));
  const [saving, setSaving] = useState(false);
  const { data: categories } = useApi<Category[]>(open ? "/api/categories" : null, []);

  useEffect(() => {
    setForm(getInitialProductForm(product || undefined));
  }, [product, open]);

  const discountPercent = useMemo(() => {
    const price = Number(form.price || 0);
    const discountPrice = Number(form.discountPrice || 0);
    if (!price || !discountPrice || discountPrice >= price) return 0;
    return Math.round(((price - discountPrice) / price) * 100);
  }, [form.discountPrice, form.price]);

  const imageList = form.images.split(/\r?\n/).map((item) => item.trim()).filter(Boolean);

  const submit = async () => {
    try {
      setSaving(true);
      const payload = {
        title: form.title,
        brand: form.brand,
        description: form.description,
        shortDescription: form.shortDescription,
        price: Number(form.price),
        discountPrice: Number(form.discountPrice || form.price || 0),
        categoryId: form.categoryId,
        stock: Number(form.stock || 0),
        tags: form.tags.split(",").map((item) => item.trim()).filter(Boolean),
        sizes: form.sizes,
        colors: form.colors,
        images: imageList,
        isPublished: form.isPublished,
        isFeatured: form.isFeatured,
      };
      const endpoint = product?._id ? `/api/products/${product._id}` : "/api/products";
      const method = product?._id ? "PUT" : "POST";
      const response = await fetchJson(endpoint, { method, body: JSON.stringify(payload) });
      toast.success(response.message || (product?._id ? "Product updated!" : "Product added!"));
      onSaved();
      onClose();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to save product");
    } finally {
      setSaving(false);
    }
  };

  return (
    <AnimatePresence>
      {open ? <>
        <motion.button type="button" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-40 bg-black/80" onClick={onClose} />
        <motion.div initial={{ x: "100%" }} animate={{ x: 0 }} exit={{ x: "100%" }} className="fixed right-0 top-0 z-50 h-full w-full max-w-3xl overflow-y-auto border-l border-[#1F1F1F] bg-[#0A0A0A] p-6">
          <div className="mb-6 flex items-center justify-between">
            <h2 className="text-2xl font-black uppercase text-white">{product?._id ? "Edit Product" : "Add Product"}</h2>
            <button type="button" onClick={onClose} className="rounded-xl border border-[#1F1F1F] p-2 text-white"><X className="h-5 w-5" /></button>
          </div>
          <div className="space-y-6">
            <section className="space-y-4 rounded-2xl border border-[#1F1F1F] bg-[#111111] p-5">
              <h3 className="text-sm font-bold uppercase tracking-[0.2em] text-[#A5B4FC]">Basic Info</h3>
              <TextInput leftPad={false} placeholder="Product Title" value={form.title} onChange={(e) => setForm((v) => ({ ...v, title: e.target.value }))} />
              <TextInput leftPad={false} placeholder="Brand" value={form.brand} onChange={(e) => setForm((v) => ({ ...v, brand: e.target.value }))} />
              <TextArea rows={4} placeholder="Description" value={form.description} onChange={(e) => setForm((v) => ({ ...v, description: e.target.value }))} />
              <TextArea rows={2} placeholder="Short Description" value={form.shortDescription} onChange={(e) => setForm((v) => ({ ...v, shortDescription: e.target.value }))} />
            </section>
            <section className="grid gap-4 rounded-2xl border border-[#1F1F1F] bg-[#111111] p-5 md:grid-cols-2">
              <div className="space-y-4">
                <h3 className="text-sm font-bold uppercase tracking-[0.2em] text-[#A5B4FC]">Pricing</h3>
                <TextInput leftPad={false} type="number" placeholder="Price ?" value={form.price} onChange={(e) => setForm((v) => ({ ...v, price: e.target.value }))} />
                <TextInput leftPad={false} type="number" placeholder="Discount Price ?" value={form.discountPrice} onChange={(e) => setForm((v) => ({ ...v, discountPrice: e.target.value }))} />
                <p className="text-sm text-[#888888]">Discount: <span className="font-semibold text-[#C7D2FE]">{discountPercent}%</span></p>
              </div>
              <div className="space-y-4">
                <h3 className="text-sm font-bold uppercase tracking-[0.2em] text-[#A5B4FC]">Category & Stock</h3>
                <select value={form.categoryId} onChange={(e) => setForm((v) => ({ ...v, categoryId: e.target.value }))} className="h-12 w-full rounded-lg border border-[#1F1F1F] bg-[#111111] px-4 text-sm text-white outline-none">
                  <option value="">Select Category</option>
                  {categories.map((category) => <option key={category._id} value={category._id}>{category.name}</option>)}
                </select>
                <TextInput leftPad={false} type="number" placeholder="Stock quantity" value={form.stock} onChange={(e) => setForm((v) => ({ ...v, stock: e.target.value }))} />
                <TextInput leftPad={false} placeholder="Tags, comma separated" value={form.tags} onChange={(e) => setForm((v) => ({ ...v, tags: e.target.value }))} />
              </div>
            </section>
            <section className="space-y-4 rounded-2xl border border-[#1F1F1F] bg-[#111111] p-5">
              <h3 className="text-sm font-bold uppercase tracking-[0.2em] text-[#A5B4FC]">Variants</h3>
              <div className="grid grid-cols-3 gap-2 md:grid-cols-6">{["XS", "S", "M", "L", "XL", "XXL"].map((size) => <button key={size} type="button" onClick={() => setForm((v) => ({ ...v, sizes: v.sizes.includes(size) ? v.sizes.filter((item) => item !== size) : [...v.sizes, size] }))} className={form.sizes.includes(size) ? "rounded-lg bg-[#6366F1] px-3 py-2 text-sm font-semibold text-white" : "rounded-lg border border-[#1F1F1F] px-3 py-2 text-sm font-semibold text-white"}>{size}</button>)}</div>
              <div className="space-y-3">{form.colors.map((color, index) => <div key={`${color.name}-${index}`} className="grid gap-3 md:grid-cols-[1fr,160px,auto]"><TextInput leftPad={false} placeholder="Color name" value={color.name} onChange={(e) => setForm((v) => ({ ...v, colors: v.colors.map((item, itemIndex) => itemIndex === index ? { ...item, name: e.target.value } : item) }))} /><div className="flex items-center gap-3 rounded-lg border border-[#1F1F1F] bg-[#111111] px-3"><input type="color" value={color.hex} onChange={(e) => setForm((v) => ({ ...v, colors: v.colors.map((item, itemIndex) => itemIndex === index ? { ...item, hex: e.target.value } : item) }))} className="h-10 w-12 border-0 bg-transparent" /><span className="text-sm text-white">{color.hex}</span></div><Button type="button" variant="secondary" onClick={() => setForm((v) => ({ ...v, colors: v.colors.filter((_, itemIndex) => itemIndex !== index) }))}>Remove</Button></div>)}</div>
              <Button type="button" variant="secondary" onClick={() => setForm((v) => ({ ...v, colors: [...v.colors, { name: "", hex: "#000000" }] }))}>Add Color</Button>
            </section>
            <section className="space-y-4 rounded-2xl border border-[#1F1F1F] bg-[#111111] p-5">
              <h3 className="text-sm font-bold uppercase tracking-[0.2em] text-[#A5B4FC]">Images</h3>
              <TextArea rows={5} placeholder="Enter image URLs (one per line)" value={form.images} onChange={(e) => setForm((v) => ({ ...v, images: e.target.value }))} />
              <p className="text-sm text-[#888888]">You can use Pollinations AI:</p>
              <p className="break-all text-xs text-[#A5B4FC]">https://image.pollinations.ai/prompt/YOUR+PRODUCT+NAME+streetwear+fashion?width=800&height=1000&nologo=true</p>
              <div className="grid grid-cols-2 gap-3 md:grid-cols-4">{imageList.map((image) => <div key={image} className="overflow-hidden rounded-xl border border-[#1F1F1F] bg-black/20">{image.includes("image.pollinations.ai") ? <img src={image} alt="Preview" className="h-32 w-full object-cover" /> : <div className="relative h-32 w-full"><Image src={image} alt="Preview" fill className="object-cover" /></div>}</div>)}</div>
            </section>
            <section className="space-y-4 rounded-2xl border border-[#1F1F1F] bg-[#111111] p-5">
              <h3 className="text-sm font-bold uppercase tracking-[0.2em] text-[#A5B4FC]">Settings</h3>
              <label className="flex items-center justify-between rounded-xl border border-[#1F1F1F] px-4 py-3 text-sm text-white"><span>Published</span><input type="checkbox" checked={form.isPublished} onChange={(e) => setForm((v) => ({ ...v, isPublished: e.target.checked }))} className="h-4 w-4 accent-[#6366F1]" /></label>
              <label className="flex items-center justify-between rounded-xl border border-[#1F1F1F] px-4 py-3 text-sm text-white"><span>Featured</span><input type="checkbox" checked={form.isFeatured} onChange={(e) => setForm((v) => ({ ...v, isFeatured: e.target.checked }))} className="h-4 w-4 accent-[#6366F1]" /></label>
            </section>
            <Button type="button" loading={saving} loadingText={product?._id ? "Saving changes..." : "Saving product..."} onClick={() => void submit()} className="w-full">{product?._id ? "Update Product" : "Save Product"}</Button>
          </div>
        </motion.div>
      </> : null}
    </AnimatePresence>
  );
}

export function AdminProductsScreen() {
  const { data, loading, error, refetch } = useApi<AdminProductResponse>("/api/admin/products", { products: [] });
  const products = normalizeProducts(data);
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<Product | null>(null);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [confirmLoading, setConfirmLoading] = useState(false);
  const [productToDelete, setProductToDelete] = useState<Product | null>(null);

  const removeProduct = async (product: Product) => {
    setProductToDelete(product);
    setConfirmOpen(true);
  };

  const confirmDeleteProduct = async () => {
    if (!productToDelete) return;
    try {
      setConfirmLoading(true);
      const response = await fetchJson(`/api/products/${productToDelete._id}`, { method: "DELETE" });
      toast.success(response.message || "Product deleted");
      await refetch();
      setConfirmOpen(false);
      setProductToDelete(null);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to delete product");
    } finally {
      setConfirmLoading(false);
    }
  };

  return (
    <AdminShell title="Products" action={<Button type="button" onClick={() => { setEditing(null); setModalOpen(true); }}><Plus className="h-4 w-4" />Add Product</Button>}>
      <div className="overflow-hidden rounded-[28px] border border-[#1F1F1F] bg-[#111111]">
        {loading ? <div className="space-y-3 p-6">{Array.from({ length: 6 }).map((_, index) => <div key={index} className="h-14 animate-pulse rounded-xl bg-white/5" />)}</div> : error ? <div className="p-6"><EmptyState title="Products unavailable" description={error} /></div> : products.length ? <div className="overflow-x-auto"><table className="min-w-full text-left text-sm"><thead className="border-b border-[#1F1F1F] text-[#888888]"><tr><th className="px-4 py-4">Image</th><th className="px-4 py-4">Title</th><th className="px-4 py-4">Category</th><th className="px-4 py-4">Price</th><th className="px-4 py-4">Stock</th><th className="px-4 py-4">Status</th><th className="px-4 py-4">Actions</th></tr></thead><tbody>{products.map((product) => <tr key={product._id} className="border-b border-[#1F1F1F] text-white"><td className="px-4 py-4"><div className="relative h-[60px] w-[50px] overflow-hidden rounded-lg bg-black/20">{product.images?.[0]?.includes("image.pollinations.ai") ? <img src={product.images[0]} alt={product.title} className="h-full w-full object-cover" /> : <Image src={fallbackImage(product.images?.[0])} alt={product.title} fill className="object-cover" />}</div></td><td className="px-4 py-4 font-medium">{product.title}</td><td className="px-4 py-4 text-[#888888]">{product.category?.name || "Uncategorized"}</td><td className="px-4 py-4">{formatCurrency(product.discountPrice || product.price)}</td><td className="px-4 py-4">{product.stock ?? 0}</td><td className="px-4 py-4"><span className={product.isPublished ? "rounded-full bg-emerald-500/15 px-3 py-1 text-xs font-semibold text-emerald-400" : "rounded-full bg-red-500/15 px-3 py-1 text-xs font-semibold text-red-400"}>{product.isPublished ? "Published" : "Draft"}</span></td><td className="px-4 py-4"><div className="flex gap-2"><Button type="button" variant="secondary" className="h-10 px-3" onClick={() => { setEditing(product); setModalOpen(true); }}><Pencil className="h-4 w-4" />Edit</Button><Button type="button" className="h-10 bg-red-500 px-3 text-white hover:brightness-95" onClick={() => void removeProduct(product)}><Trash2 className="h-4 w-4" />Delete</Button></div></td></tr>)}</tbody></table></div> : <div className="p-6"><EmptyState title="No products yet" description="Create your first product to start building the catalog." /></div>}
      </div>
      <ProductModal open={modalOpen} onClose={() => setModalOpen(false)} onSaved={() => void refetch()} product={editing} />
      <ConfirmModal
        isOpen={confirmOpen}
        onClose={() => { if (!confirmLoading) setConfirmOpen(false); }}
        onConfirm={confirmDeleteProduct}
        title="Delete Product"
        message={productToDelete ? `Are you sure you want to delete "${productToDelete.title}"?` : "Delete this product?"}
        confirmLabel="Delete Product"
        variant="danger"
        loading={confirmLoading}
      />
    </AdminShell>
  );
}

export function AdminSectionPlaceholderScreen({ title, description }: { title: string; description: string }) {
  return (
    <AdminShell title={title}>
      <EmptyState title={`${title} coming online`} description={description} />
    </AdminShell>
  );
}

export function SellerDashboardScreen() {
  const { data, loading, error } = useApi<DashboardStats>("/api/seller/dashboard", {});
  const chartData = ((data.revenueChart as Array<Record<string, unknown>>) || []).map((item) => ({ date: item.date ? new Date(String(item.date)).toLocaleDateString("en-IN", { day: "2-digit", month: "short" }) : "", revenue: Number(item.revenue || 0), orders: Number(item.orders || 0) }));
  return (
    <SellerShell title="Dashboard">
      <div className="space-y-8">
        {loading ? <>
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            {Array.from({ length: 4 }).map((_, index) => <StatCardSkeleton key={index} />)}
          </div>
          <div className="grid gap-6 xl:grid-cols-[1.15fr,0.85fr]">
            <div className="skeleton h-[280px] rounded-xl" />
            <div className="skeleton h-[280px] rounded-xl" />
          </div>
        </> : error ? <EmptyState title="Seller dashboard unavailable" description={error} /> : <>
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            <StatCard label="This Month Revenue" value={Number(data.thisMonthRevenue || 0)} prefix="Rs " icon={IndianRupee} />
            <StatCard label="Total Orders" value={Number(data.totalOrders || 0)} icon={ShoppingBag} />
            <StatCard label="Products" value={Number((data.topProducts as Product[] | undefined)?.length || 0)} icon={Store} />
            <StatCard label="Pending Payout" value={Number(data.pendingPayout || 0)} prefix="Rs " icon={Wallet} />
          </div>
          <div className="grid gap-6 xl:grid-cols-[1.15fr,0.85fr]">
            <ChartCard title="Revenue Trend"><ResponsiveContainer width="100%" height="100%"><AreaChart data={chartData}><defs><linearGradient id="seller-fill" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="rgba(99,102,241,0.42)" stopOpacity={1} /><stop offset="95%" stopColor="rgba(99,102,241,0.04)" stopOpacity={1} /></linearGradient></defs><CartesianGrid stroke="#1F1F1F" vertical={false} /><XAxis dataKey="date" tick={{ fill: "#888888" }} stroke="#1F1F1F" /><YAxis tick={{ fill: "#888888" }} stroke="#1F1F1F" /><Tooltip contentStyle={chartTooltip()} /><Area type="monotone" dataKey="revenue" stroke="#818CF8" fill="url(#seller-fill)" strokeWidth={3} /></AreaChart></ResponsiveContainer></ChartCard>
            <ChartCard title="Orders"><ResponsiveContainer width="100%" height="100%"><BarChart data={chartData}><CartesianGrid stroke="#1F1F1F" vertical={false} /><XAxis dataKey="date" tick={{ fill: "#888888" }} stroke="#1F1F1F" /><YAxis tick={{ fill: "#888888" }} stroke="#1F1F1F" /><Tooltip contentStyle={chartTooltip()} /><Bar dataKey="orders" fill="#6366F1" radius={[10, 10, 0, 0]} /></BarChart></ResponsiveContainer></ChartCard>
          </div>
        </>}
      </div>
    </SellerShell>
  );
}

