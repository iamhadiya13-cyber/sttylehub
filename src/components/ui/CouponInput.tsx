"use client";

import { useEffect, useMemo, useState } from "react";
import toast from "react-hot-toast";
import { ChevronDown, Link2, Tag, X } from "lucide-react";
import LoadingButton from "@/components/ui/LoadingButton";
import { SkeletonBox } from "@/components/ui/skeletons/SkeletonBase";
import { useDebounceCallback } from "@/hooks/useDebounce";
import {
  calculateCouponPreview,
  getCouponDescription,
  getCouponExpiryMeta,
  type AvailableCouponOffer,
} from "@/lib/coupon-offers";
import { formatCurrency } from "@/lib/utils";

interface CouponInputProps {
  cartTotal: number;
  onApply: (coupon: {
    code: string;
    discount: number;
    couponId: string;
  }) => void;
  onRemove: () => void;
  appliedCoupon?: {
    code: string;
    discount: number;
  } | null;
}

export default function CouponInput({
  cartTotal,
  onApply,
  onRemove,
  appliedCoupon,
}: CouponInputProps) {
  const [code, setCode] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [availableCoupons, setAvailableCoupons] = useState<AvailableCouponOffer[]>([]);
  const [showCoupons, setShowCoupons] = useState(false);
  const [loadingCoupons, setLoadingCoupons] = useState(false);
  const [copiedCode, setCopiedCode] = useState<string | null>(null);
  const [desktopPreviewCode, setDesktopPreviewCode] = useState<string | null>(null);
  const [mobilePreviewCode, setMobilePreviewCode] = useState<string | null>(null);

  const fetchAvailableCoupons = async () => {
    setLoadingCoupons(true);
    try {
      const res = await fetch(`/api/coupons/available?total=${cartTotal}&includeLocked=true`, {
        cache: "no-store",
      });
      const data = (await res.json()) as { success: boolean; data?: AvailableCouponOffer[] };
      if (data.success) {
        setAvailableCoupons(data.data || []);
      }
    } finally {
      setLoadingCoupons(false);
    }
  };

  useEffect(() => {
    void fetchAvailableCoupons();
  }, [cartTotal]);

  const handleApplyWithCode = useDebounceCallback(async (couponCode: string) => {
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/coupons/validate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          code: couponCode,
          cartTotal,
        }),
      });
      const data = (await res.json()) as {
        success?: boolean;
        message?: string;
        data?: { discount: number; couponId: string };
      };
      if (!res.ok || !data.success || !data.data) {
        setError(data.message || "Invalid coupon");
        return;
      }
      onApply({
        code: couponCode,
        discount: data.data.discount,
        couponId: data.data.couponId,
      });
      setCode("");
      toast.success(`${couponCode} applied! -${formatCurrency(data.data.discount)}`);
    } catch {
      setError("Could not apply coupon");
    } finally {
      setLoading(false);
    }
  }, 500);

  const handleApply = () => {
    if (!code.trim()) {
      setError("Enter a coupon code");
      return;
    }
    void handleApplyWithCode(code.trim().toUpperCase());
  };

  const copyCode = async (couponCode: string) => {
    try {
      await navigator.clipboard.writeText(couponCode);
      setCopiedCode(couponCode);
      window.setTimeout(() => {
        setCopiedCode((current) => (current === couponCode ? null : current));
      }, 2000);
    } catch {
      setCopiedCode(null);
    }
  };

  const applyDiscoveredCoupon = (couponCode: string) => {
    setCode(couponCode);
    setShowCoupons(false);
    setMobilePreviewCode(null);
    window.setTimeout(() => {
      void handleApplyWithCode(couponCode);
    }, 100);
  };

  const activeDesktopPreview = useMemo(
    () => availableCoupons.find((coupon) => coupon.code === desktopPreviewCode) || null,
    [availableCoupons, desktopPreviewCode],
  );
  const activeMobilePreview = useMemo(
    () => availableCoupons.find((coupon) => coupon.code === mobilePreviewCode) || null,
    [availableCoupons, mobilePreviewCode],
  );

  return (
    <div className="space-y-3">
      {appliedCoupon ? (
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            padding: "10px 14px",
            background: "rgba(34,197,94,0.06)",
            border: "1px solid rgba(34,197,94,0.15)",
            borderRadius: 8,
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <span style={{ fontSize: 16 }}>🏷️</span>
            <div>
              <p style={{ color: "#22C55E", fontSize: 13, fontWeight: 700, margin: 0 }}>{appliedCoupon.code}</p>
              <p style={{ color: "#888", fontSize: 11, margin: 0 }}>-{formatCurrency(appliedCoupon.discount)} discount</p>
            </div>
          </div>
          <button
            onClick={onRemove}
            style={{
              background: "none",
              border: "none",
              color: "#888",
              cursor: "pointer",
              fontSize: 18,
              padding: "0 4px",
            }}
          >
            ×
          </button>
        </div>
      ) : (
        <div>
          <div style={{ display: "flex", gap: 8 }}>
            <input
              value={code}
              onChange={(event) => {
                setCode(event.target.value.toUpperCase());
                setError("");
              }}
              onKeyDown={(event) => {
                if (event.key === "Enter") {
                  event.preventDefault();
                  handleApply();
                }
              }}
              placeholder="Enter coupon code"
              style={{
                flex: 1,
                padding: "10px 14px",
                background: "#0A0A0A",
                border: `1px solid ${error ? "#EF4444" : "#2A2A2A"}`,
                borderRadius: 8,
                color: "#fff",
                fontSize: 13,
                outline: "none",
                letterSpacing: 1,
                textTransform: "uppercase",
                fontFamily: "monospace",
              }}
            />
            <LoadingButton
              onClick={handleApply}
              loading={loading}
              loadingText="Applying..."
              disabled={!code.trim()}
              style={{
                padding: "10px 16px",
                background: loading || !code.trim() ? "#1A1A1A" : "linear-gradient(135deg, #4F46E5 0%, #6366F1 100%)",
                color: loading || !code.trim() ? "#555" : "#F8FAFC",
                border: "none",
                borderRadius: 8,
                fontWeight: 700,
                fontSize: 13,
                cursor: loading || !code.trim() ? "not-allowed" : "pointer",
                whiteSpace: "nowrap",
                minWidth: 80,
                display: "inline-flex",
                alignItems: "center",
                justifyContent: "center",
                gap: 8,
              }}
            >
              Apply
            </LoadingButton>
          </div>
          {error ? <p style={{ fontSize: 11, color: "#EF4444", marginTop: 4 }}>⚠ {error}</p> : null}
        </div>
      )}

      <div className="relative rounded-xl border border-[#1F1F1F] bg-[#0E0E0E]">
        <button
          type="button"
          onClick={() => setShowCoupons((current) => !current)}
          className="flex w-full items-center justify-between gap-3 px-4 py-3 text-left"
        >
          <div className="flex items-center gap-2">
            <span className="text-sm font-bold uppercase tracking-[0.16em] text-white">Available Coupons</span>
            <span className="rounded-full bg-[#4F46E5]/16 px-2.5 py-1 text-[11px] font-bold text-[#D9DDFF]">
              {loadingCoupons ? "..." : availableCoupons.length}
            </span>
          </div>
          <ChevronDown className={showCoupons ? "h-4 w-4 rotate-180 text-[#A5B4FC] transition-transform" : "h-4 w-4 text-[#A5B4FC] transition-transform"} />
        </button>

        {showCoupons ? (
          <div className="border-t border-[#1F1F1F] px-3 pb-3 pt-3">
            {loadingCoupons ? (
              <div className="space-y-3">
                {Array.from({ length: 4 }).map((_, index) => (
                  <div key={index} className="rounded-xl border border-[#1A1A1A] bg-[#111111] p-3">
                    <div className="flex items-start gap-3">
                      <SkeletonBox width={18} height={18} borderRadius={999} />
                      <div className="flex-1 space-y-2">
                        <SkeletonBox width={90} height={30} borderRadius={999} />
                        <SkeletonBox width="60%" height={12} borderRadius={8} />
                        <SkeletonBox width="45%" height={10} borderRadius={8} />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : availableCoupons.length === 0 ? (
              <div className="px-2 py-3 text-sm text-[#777777]">No coupons available right now</div>
            ) : (
              <div className="space-y-3">
                {availableCoupons.map((coupon) => {
                  const preview = calculateCouponPreview(coupon, cartTotal);
                  const expiry = getCouponExpiryMeta(coupon.expiryDate);
                  const locked = !preview.qualifies;

                  return (
                    <div
                      key={coupon.code}
                      className={locked ? "relative rounded-xl border border-[#1F1F1F] bg-[#111111] p-3 opacity-75" : "relative rounded-xl border border-[#1F1F1F] bg-[#111111] p-3"}
                      onMouseEnter={() => {
                        if (typeof window !== "undefined" && window.innerWidth >= 768) {
                          setDesktopPreviewCode(coupon.code);
                        }
                      }}
                      onMouseLeave={() => {
                        if (typeof window !== "undefined" && window.innerWidth >= 768) {
                          setDesktopPreviewCode((current) => (current === coupon.code ? null : current));
                        }
                      }}
                    >
                      <div className="flex items-start gap-3">
                        <Tag className="mt-0.5 h-4 w-4 flex-shrink-0 text-[#A5B4FC]" />
                        <div className="min-w-0 flex-1 space-y-2">
                          <div className="flex flex-wrap items-center gap-2">
                            <button
                              type="button"
                              onClick={() => void copyCode(coupon.code)}
                              className="min-h-[34px] rounded-full border border-[#6366F1]/25 bg-[#4F46E5]/10 px-3 py-1 text-xs font-bold uppercase tracking-[0.18em] text-[#D9DDFF]"
                            >
                              {copiedCode === coupon.code ? "Copied!" : coupon.code}
                            </button>
                            {expiry.label ? (
                              <span className={expiry.urgent ? "text-xs font-semibold text-amber-300" : "text-xs font-semibold text-[#8D867A]"}>
                                {expiry.label}
                              </span>
                            ) : null}
                          </div>

                          <div className="space-y-1">
                            <p className="text-sm font-medium text-white">{getCouponDescription(coupon)}</p>
                            <p className="text-xs text-[#9CA3AF]">
                              {(coupon.minOrderAmount || 0) > 0
                                ? `on orders above ${formatCurrency(coupon.minOrderAmount || 0)}`
                                : "No minimum order requirement"}
                              {coupon.discountType === "percentage" && (coupon.maxDiscountAmount || 0) > 0
                                ? ` · Max discount ${formatCurrency(coupon.maxDiscountAmount || 0)}`
                                : ""}
                            </p>
                            {locked ? (
                              <p className="text-xs font-medium text-[#9CA3AF]">
                                Add {formatCurrency(preview.remainingToUnlock)} more to unlock
                              </p>
                            ) : null}
                          </div>

                          <div className="flex flex-wrap items-center gap-2 pt-1">
                            <button
                              type="button"
                              onClick={() => {
                                if (typeof window !== "undefined" && window.innerWidth < 768) {
                                  setMobilePreviewCode(coupon.code);
                                } else {
                                  setDesktopPreviewCode((current) => (current === coupon.code ? null : coupon.code));
                                }
                              }}
                              className="inline-flex min-h-[34px] items-center rounded-lg border border-[#2A2A2A] px-3 text-xs font-semibold text-[#D7D7E4]"
                            >
                              Preview
                            </button>
                            <button
                              type="button"
                              disabled={locked}
                              onClick={() => applyDiscoveredCoupon(coupon.code)}
                              className={locked
                                ? "inline-flex min-h-[34px] items-center rounded-lg border border-[#2A2A2A] px-3 text-xs font-semibold text-[#666666]"
                                : "inline-flex min-h-[34px] items-center rounded-lg border border-[#6366F1]/35 bg-[#4F46E5]/10 px-3 text-xs font-semibold text-[#D9DDFF]"}
                            >
                              Apply
                            </button>
                          </div>
                        </div>
                      </div>

                      {activeDesktopPreview?.code === coupon.code ? (
                        <div className="absolute right-3 top-[calc(100%+8px)] z-20 hidden w-[250px] rounded-2xl border border-white/10 bg-[#0B0B0B] p-4 shadow-[0_20px_40px_rgba(0,0,0,0.35)] md:block">
                          <CouponPreviewCard coupon={coupon} subtotal={cartTotal} />
                        </div>
                      ) : null}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        ) : null}
      </div>

      {activeMobilePreview ? (
        <div className="fixed inset-0 z-[120] bg-black/70 backdrop-blur-[4px] md:hidden">
          <button type="button" className="absolute inset-0" onClick={() => setMobilePreviewCode(null)} aria-label="Close coupon preview" />
          <div className="absolute bottom-0 left-0 right-0 rounded-t-[24px] border border-white/10 bg-[#0B0B0B] p-5">
            <div className="mb-4 flex items-center justify-between">
              <div>
                <p className="text-sm font-bold uppercase tracking-[0.16em] text-white">Coupon Preview</p>
                <p className="mt-1 text-xs text-[#8D867A]">{activeMobilePreview.code}</p>
              </div>
              <button
                type="button"
                onClick={() => setMobilePreviewCode(null)}
                className="rounded-full border border-[#1F1F1F] p-2 text-[#D7D7E4]"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
            <CouponPreviewCard coupon={activeMobilePreview} subtotal={cartTotal} />
            <div className="mt-4 grid gap-3">
              <button
                type="button"
                onClick={() => void copyCode(activeMobilePreview.code)}
                className="inline-flex min-h-[42px] items-center justify-center gap-2 rounded-xl border border-[#2A2A2A] px-4 text-sm font-semibold text-[#D7D7E4]"
              >
                <Link2 className="h-4 w-4" />
                {copiedCode === activeMobilePreview.code ? "Copied!" : "Copy Code"}
              </button>
              <button
                type="button"
                disabled={!calculateCouponPreview(activeMobilePreview, cartTotal).qualifies}
                onClick={() => applyDiscoveredCoupon(activeMobilePreview.code)}
                className={!calculateCouponPreview(activeMobilePreview, cartTotal).qualifies
                  ? "min-h-[44px] rounded-xl border border-[#2A2A2A] px-4 text-sm font-semibold text-[#666666]"
                  : "min-h-[44px] rounded-xl bg-[linear-gradient(135deg,#4F46E5_0%,#6366F1_100%)] px-4 text-sm font-semibold text-[#F8FAFC]"}
              >
                Apply Coupon
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}

function CouponPreviewCard({
  coupon,
  subtotal,
}: {
  coupon: AvailableCouponOffer;
  subtotal: number;
}) {
  const preview = calculateCouponPreview(coupon, subtotal);

  return (
    <div className="space-y-3">
      <div className="space-y-1">
        <p className="text-sm font-semibold text-white">{getCouponDescription(coupon)}</p>
        {!preview.qualifies ? (
          <p className="text-xs text-[#9CA3AF]">
            Add {formatCurrency(preview.remainingToUnlock)} more to unlock this coupon.
          </p>
        ) : null}
      </div>
      <div className="space-y-2 text-sm">
        <div className="flex items-center justify-between text-[#BDBDBD]">
          <span>Original subtotal</span>
          <span>{formatCurrency(subtotal)}</span>
        </div>
        <div className="flex items-center justify-between text-[#BDBDBD]">
          <span>Discount</span>
          <span>-{formatCurrency(preview.discountAmount)}</span>
        </div>
        <div className="flex items-center justify-between text-white">
          <span>New total</span>
          <span>{formatCurrency(preview.newTotal)}</span>
        </div>
        <div className="flex items-center justify-between border-t border-[#1F1F1F] pt-2 text-[#76E48E]">
          <span>Savings</span>
          <span>{formatCurrency(preview.savingsAmount)}</span>
        </div>
      </div>
    </div>
  );
}
