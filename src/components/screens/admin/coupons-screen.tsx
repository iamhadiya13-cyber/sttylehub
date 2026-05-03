"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { AnimatePresence, motion } from "framer-motion";
import { Plus, Trash2, X } from "lucide-react";
import { toast } from "react-hot-toast";
import { AdminShell } from "@/components/admin/AdminSidebar";
import ConfirmModal from "@/components/ui/ConfirmModal";
import { Button, EmptyState, fetchJson, TextInput, type Category, useApi } from "@/components/screens/shared";
import {
  CouponAnalytics,
  CouponRecord,
  couponAudienceSummary,
  couponValueLabel,
  getInitialCouponForm,
  tableCell,
  tableHead,
  tableWrap,
  type CouponFormState,
} from "@/components/screens/admin/shared";
import { formatCurrency } from "@/lib/utils";

type CouponResponse = {
  coupons: CouponRecord[];
  analytics: CouponAnalytics;
};

function CouponModal({
  open,
  onClose,
  onSaved,
}: {
  open: boolean;
  onClose: () => void;
  onSaved: () => void;
}) {
  const [form, setForm] = useState<CouponFormState>(getInitialCouponForm());
  const [saving, setSaving] = useState(false);
  const { data: categories } = useApi<Category[]>(open ? "/api/categories" : null, []);

  useEffect(() => {
    if (open) setForm(getInitialCouponForm());
  }, [open]);

  const submit = async () => {
    try {
      setSaving(true);
      await fetchJson("/api/admin/coupons", {
        method: "POST",
        body: JSON.stringify({
          code: form.code.toUpperCase(),
          discountType: form.discountType,
          discountValue: Number(form.discountValue),
          minOrderAmount: Number(form.minOrderAmount || 0),
          maxDiscountAmount: Number(form.maxDiscountAmount || 0),
          expiryDate: form.expiryDate,
          usageLimit: Number(form.usageLimit || 0),
          audienceType: form.audienceType,
          limitedUserEmails: form.limitedUserEmails.split(",").map((item) => item.trim()).filter(Boolean),
          perUserLimit: Number(form.perUserLimit || 1),
          minCompletedOrders: Number(form.minCompletedOrders || 0),
          applicableCategories: form.applicableCategories,
          isActive: form.isActive,
        }),
      });
      toast.success("Coupon created");
      onSaved();
      onClose();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to create coupon");
    } finally {
      setSaving(false);
    }
  };

  return (
    <AnimatePresence>
      {open ? (
        <>
          <motion.button
            type="button"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-40 bg-black/80"
            onClick={onClose}
          />
          <motion.div
            initial={{ x: 520 }}
            animate={{ x: 0 }}
            exit={{ x: 520 }}
            className="fixed inset-y-0 right-0 z-50 flex w-full max-w-[520px] flex-col border-l border-[#1F1F1F] bg-[#111111]"
          >
            <div className="flex shrink-0 items-center justify-between border-b border-[#1F1F1F] px-4 py-4 sm:px-6">
              <h2 className="text-base font-bold uppercase tracking-[0.18em] text-white">Add Coupon</h2>
              <button type="button" onClick={onClose} className="rounded-xl border border-[#1F1F1F] p-2 text-white">
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto px-4 py-5 sm:px-6">
              <div className="grid gap-4 md:grid-cols-2">
                <TextInput label="Coupon Code" leftPad={false} placeholder="NEW60" value={form.code} onChange={(e) => setForm((v) => ({ ...v, code: e.target.value.toUpperCase() }))} />

                <div className="space-y-2">
                  <p className="app-label">Discount Type</p>
                  <div className="flex gap-2">
                    {(["percentage", "flat"] as const).map((type) => (
                      <button
                        key={type}
                        type="button"
                        onClick={() => setForm((v) => ({ ...v, discountType: type }))}
                        className={
                          form.discountType === type
                            ? "flex-1 rounded-xl bg-[#6366F1] px-3 py-3 text-sm font-semibold text-white"
                            : "flex-1 rounded-xl border border-[#1F1F1F] px-3 py-3 text-sm font-semibold text-white"
                        }
                      >
                        {type === "percentage" ? "Percentage" : "Flat"}
                      </button>
                    ))}
                  </div>
                </div>

                <TextInput label="Discount Value" leftPad={false} type="number" placeholder={form.discountType === "flat" ? "500" : "15"} value={form.discountValue} onChange={(e) => setForm((v) => ({ ...v, discountValue: e.target.value }))} />
                <TextInput label="Minimum Order" leftPad={false} type="number" placeholder="1999" value={form.minOrderAmount} onChange={(e) => setForm((v) => ({ ...v, minOrderAmount: e.target.value }))} />
                <TextInput label="Maximum Discount" leftPad={false} type="number" placeholder="1000" value={form.maxDiscountAmount} onChange={(e) => setForm((v) => ({ ...v, maxDiscountAmount: e.target.value }))} />
                <TextInput label="Expiry Date" leftPad={false} type="date" value={form.expiryDate} onChange={(e) => setForm((v) => ({ ...v, expiryDate: e.target.value }))} />
                <TextInput label="Usage Limit" leftPad={false} type="number" placeholder="100" value={form.usageLimit} onChange={(e) => setForm((v) => ({ ...v, usageLimit: e.target.value }))} />
                <div className="space-y-2">
                  <TextInput label="Per User Limit" leftPad={false} type="number" placeholder="1" value={form.perUserLimit} onChange={(e) => setForm((v) => ({ ...v, perUserLimit: e.target.value }))} />
                  <p className="text-xs text-[#666666]">How many times each user can use this coupon. Set to 0 for unlimited.</p>
                </div>

                <label className="space-y-2 md:col-span-2">
                  <span className="app-label">Audience Type</span>
                  <select
                    value={form.audienceType}
                    onChange={(e) => setForm((v) => ({ ...v, audienceType: e.target.value as CouponFormState["audienceType"] }))}
                    className="app-input h-11 w-full"
                  >
                    <option value="all">All users</option>
                    <option value="new_user">New users</option>
                    <option value="second_order">Second order</option>
                    <option value="repeat_customer">Repeat customers</option>
                    <option value="limited_users">Limited users</option>
                  </select>
                </label>

                <TextInput label="Minimum Completed Orders" leftPad={false} type="number" placeholder="2" value={form.minCompletedOrders} onChange={(e) => setForm((v) => ({ ...v, minCompletedOrders: e.target.value }))} />
                <label className="rounded-2xl border border-[#1F1F1F] bg-black/20 px-4 py-3 text-sm text-white">
                  <span className="mb-3 block app-label">Active</span>
                  <span className="flex items-center justify-between">
                    <span>{form.isActive ? "Live" : "Paused"}</span>
                    <input
                      type="checkbox"
                      checked={form.isActive}
                      onChange={(e) => setForm((v) => ({ ...v, isActive: e.target.checked }))}
                      className="h-4 w-4 accent-[#6366F1]"
                    />
                  </span>
                </label>

                <div className="md:col-span-2">
                  <TextInput label="Limited User Emails" leftPad={false} placeholder="vip@example.com, crew@example.com" value={form.limitedUserEmails} onChange={(e) => setForm((v) => ({ ...v, limitedUserEmails: e.target.value }))} />
                </div>

                <div className="space-y-3 md:col-span-2 rounded-2xl border border-[#1F1F1F] bg-black/20 p-4">
                  <p className="app-label">Categories</p>
                  <div className="flex max-h-[220px] flex-wrap gap-2 overflow-y-auto">
                    {categories.map((category) => (
                      <button
                        key={category._id}
                        type="button"
                        onClick={() =>
                          setForm((v) => ({
                            ...v,
                            applicableCategories: v.applicableCategories.includes(category._id)
                              ? v.applicableCategories.filter((id) => id !== category._id)
                              : [...v.applicableCategories, category._id],
                          }))
                        }
                        className={
                          form.applicableCategories.includes(category._id)
                            ? "rounded-full border border-[#6366F1] bg-[#4F46E5]/10 px-3 py-1.5 text-xs font-semibold text-[#C7D2FE]"
                            : "rounded-full border border-[#1F1F1F] px-3 py-1.5 text-xs font-semibold text-[#888888]"
                        }
                      >
                        {category.name}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            <div className="shrink-0 border-t border-[#1F1F1F] bg-[#111111] px-4 py-4 sm:px-6">
              <Button type="button" loading={saving} loadingText="Creating..." className="w-full" onClick={() => void submit()}>
                Create Coupon
              </Button>
            </div>
          </motion.div>
        </>
      ) : null}
    </AnimatePresence>
  );
}

export function AdminCouponsScreen() {
  const { data, loading, error, refetch } = useApi<CouponResponse>("/api/admin/coupons", {
    coupons: [],
    analytics: {
      activeCount: 0,
      expiredCount: 0,
      limitReachedCount: 0,
      totalRedemptions: 0,
      topCoupons: [],
      redemptionsTrend: [],
    },
  });
  const coupons = data.coupons;
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [confirmLoading, setConfirmLoading] = useState(false);
  const [couponToDelete, setCouponToDelete] = useState<CouponRecord | null>(null);
  const [open, setOpen] = useState(false);

  const removeCoupon = async (couponId: string) => {
    const target = coupons.find((coupon) => coupon._id === couponId) || null;
    setCouponToDelete(target);
    setConfirmOpen(true);
  };

  const confirmDeleteCoupon = async () => {
    if (!couponToDelete) return;
    try {
      setConfirmLoading(true);
      await fetchJson(`/api/coupons/${couponToDelete._id}`, { method: "DELETE" });
      toast.success("Coupon deleted");
      await refetch();
      setConfirmOpen(false);
      setCouponToDelete(null);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to delete coupon");
    } finally {
      setConfirmLoading(false);
    }
  };

  const maxTrend = Math.max(...data.analytics.redemptionsTrend.map((point) => point.redemptions), 1);

  return (
    <AdminShell
      title="Coupons"
      action={
        <Button type="button" onClick={() => setOpen(true)}>
          <Plus className="h-4 w-4" />
          Add Coupon
        </Button>
      }
    >
      <div className="space-y-6">
        <div className="rounded-2xl border border-[#1F1F1F] bg-[#111111] p-5">
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div>
              <h3 className="text-lg font-bold text-white">Coupon Controls</h3>
            </div>
            <Link href="/admin/settings" className="text-sm font-semibold text-[#A5B4FC]">
              Open settings →
            </Link>
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          {[
            { label: "Active", value: data.analytics.activeCount },
            { label: "Expired", value: data.analytics.expiredCount },
            { label: "Limit Reached", value: data.analytics.limitReachedCount },
            { label: "Redemptions", value: data.analytics.totalRedemptions },
          ].map((item) => (
            <div key={item.label} className="rounded-2xl border border-[#1F1F1F] bg-[#111111] p-5">
              <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-[#888888]">{item.label}</p>
              <p className="mt-3 text-3xl font-black text-white">{item.value}</p>
            </div>
          ))}
        </div>

        <div className="grid gap-4 xl:grid-cols-[1.1fr,0.9fr]">
          <div className="rounded-2xl border border-[#1F1F1F] bg-[#111111] p-5">
            <p className="text-xs font-bold uppercase tracking-[0.18em] text-[#A5B4FC]">Top Performing Coupons</p>
            <div className="mt-4 space-y-3">
              {data.analytics.topCoupons.length ? data.analytics.topCoupons.map((coupon) => (
                <div key={coupon.code} className="flex items-center justify-between gap-3 rounded-xl border border-white/10 bg-black/20 px-4 py-3">
                  <div>
                    <p className="text-sm font-semibold text-white">{coupon.code}</p>
                    <p className="mt-1 text-xs text-[#888888]">{coupon.usedCount} redemptions</p>
                  </div>
                  <p className="text-sm font-semibold text-[#C7D2FE]">{formatCurrency(coupon.revenueLift)}</p>
                </div>
              )) : <EmptyState compact title="No coupon activity yet" />}
            </div>
          </div>

          <div className="rounded-2xl border border-[#1F1F1F] bg-[#111111] p-5">
            <p className="text-xs font-bold uppercase tracking-[0.18em] text-[#A5B4FC]">Redemption Trend</p>
            <div className="mt-4 flex min-h-[170px] items-end gap-2">
              {data.analytics.redemptionsTrend.length ? data.analytics.redemptionsTrend.map((point) => (
                <div key={point.date} className="flex flex-1 flex-col items-center gap-2">
                  <div
                    className="w-full rounded-full bg-[#6366F1]/80"
                    style={{ height: `${Math.max((point.redemptions / maxTrend) * 120, point.redemptions ? 12 : 6)}px` }}
                  />
                  <span className="text-[10px] text-[#666666]">{point.date.slice(5)}</span>
                </div>
              )) : <EmptyState compact title="No redemption trend yet" />}
            </div>
          </div>
        </div>

        {tableWrap(
          loading ? (
            <div className="space-y-3 p-6">
              {Array.from({ length: 6 }).map((_, index) => (
                <div key={index} className="h-14 animate-pulse rounded-xl bg-white/5" />
              ))}
            </div>
          ) : error ? (
            <div className="p-6">
              <EmptyState title="Coupons unavailable" description={error} />
            </div>
          ) : coupons.length ? (
            <>
              <div className="grid gap-4 p-4 md:hidden">
                {coupons.map((coupon) => (
                  <div key={coupon._id} className="rounded-2xl border border-[#1F1F1F] bg-black/20 p-4">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="text-base font-semibold text-white">{coupon.code}</p>
                        <p className="mt-1 text-xs text-[#888888]">{coupon.audienceType || "all"} · Orders {coupon.minCompletedOrders || 0}</p>
                      </div>
                      <span className={coupon.isActive ? "inline-flex rounded-full bg-green-500/15 px-3 py-1 text-[11px] font-semibold text-green-300" : "inline-flex rounded-full bg-red-500/15 px-3 py-1 text-[11px] font-semibold text-red-300"}>
                        {coupon.isActive ? "Active" : "Inactive"}
                      </span>
                    </div>
                    <div className="mt-4 grid grid-cols-2 gap-3 text-sm">
                      <div className="rounded-xl border border-[#1F1F1F] bg-[#111111] p-3">
                        <p className="text-[11px] uppercase tracking-[0.18em] text-[#666666]">Value</p>
                        <p className="mt-1 text-white">{couponValueLabel(coupon)}</p>
                      </div>
                      <div className="rounded-xl border border-[#1F1F1F] bg-[#111111] p-3">
                        <p className="text-[11px] uppercase tracking-[0.18em] text-[#666666]">Min Order</p>
                        <p className="mt-1 text-white">{formatCurrency(coupon.minOrderAmount || 0)}</p>
                      </div>
                      <div className="rounded-xl border border-[#1F1F1F] bg-[#111111] p-3">
                        <p className="text-[11px] uppercase tracking-[0.18em] text-[#666666]">Expiry</p>
                        <p className="mt-1 text-white">{coupon.expiryDate ? new Date(coupon.expiryDate).toLocaleDateString() : "No expiry"}</p>
                      </div>
                      <div className="rounded-xl border border-[#1F1F1F] bg-[#111111] p-3">
                        <p className="text-[11px] uppercase tracking-[0.18em] text-[#666666]">Used</p>
                        <p className="mt-1 text-white">{`${coupon.usedCount || 0}/${coupon.usageLimit || 0}${coupon.perUserLimit === 0 ? " · unlimited/user" : ` · ${coupon.perUserLimit || 1}/user`}`}</p>
                      </div>
                    </div>
                    <div className="mt-4 flex justify-end">
                      <Button type="button" className="h-10 bg-red-500 px-3 text-white hover:brightness-95" onClick={() => void removeCoupon(coupon._id)}>
                        <Trash2 className="h-4 w-4" />
                        Delete
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
              <div className="hidden overflow-x-auto md:block">
                <table className="min-w-full">
                  <thead>
                    <tr>
                      {tableHead("Code")}
                      {tableHead("Type")}
                      {tableHead("Value")}
                      {tableHead("Audience")}
                      {tableHead("Min Order")}
                      {tableHead("Expiry")}
                      {tableHead("Used")}
                      {tableHead("Active")}
                      {tableHead("Delete")}
                    </tr>
                  </thead>
                  <tbody>
                    {coupons.map((coupon) => (
                      <tr key={coupon._id} className="border-b border-[#1F1F1F] hover:bg-[#1A1A1A]">
                        {tableCell(coupon.code)}
                        {tableCell(coupon.discountType)}
                        {tableCell(couponValueLabel(coupon))}
                        {tableCell(couponAudienceSummary(coupon))}
                        {tableCell(formatCurrency(coupon.minOrderAmount || 0))}
                        {tableCell(coupon.expiryDate ? new Date(coupon.expiryDate).toLocaleDateString() : "No expiry")}
                        {tableCell(`${coupon.usedCount || 0}/${coupon.usageLimit || 0}${coupon.perUserLimit === 0 ? " / unlimited per user" : ` / ${coupon.perUserLimit || 1} per user`}`)}
                        {tableCell(
                          coupon.isActive ? (
                            <span className="inline-flex rounded-full bg-green-500/15 px-3 py-1 text-[11px] font-semibold text-green-300">
                              Active
                            </span>
                          ) : (
                            <span className="inline-flex rounded-full bg-red-500/15 px-3 py-1 text-[11px] font-semibold text-red-300">
                              Inactive
                            </span>
                          ),
                        )}
                        {tableCell(
                          <Button
                            type="button"
                            className="h-10 bg-red-500 px-3 text-white hover:brightness-95"
                            onClick={() => void removeCoupon(coupon._id)}
                          >
                            <Trash2 className="h-4 w-4" />
                            Delete
                          </Button>,
                        )}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </>
          ) : (
            <div className="p-6">
              <EmptyState title="No coupons yet" />
            </div>
          ),
        )}
      </div>

      <CouponModal open={open} onClose={() => setOpen(false)} onSaved={() => void refetch()} />
      <ConfirmModal
        isOpen={confirmOpen}
        onClose={() => {
          if (!confirmLoading) setConfirmOpen(false);
        }}
        onConfirm={confirmDeleteCoupon}
        title="Delete Coupon"
        message={couponToDelete ? `Delete coupon "${couponToDelete.code}"?` : "Delete this coupon?"}
        confirmLabel="Delete"
        variant="danger"
        loading={confirmLoading}
        loadingLabel="Deleting..."
      />
    </AdminShell>
  );
}
