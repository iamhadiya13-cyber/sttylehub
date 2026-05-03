"use client";

import { useEffect, useMemo, useState } from "react";
import { ChevronDown, Tag } from "lucide-react";
import { SkeletonBox } from "@/components/ui/skeletons/SkeletonBase";
import {
  type AvailableCouponOffer,
  getCouponDescription,
  getCouponExpiryMeta,
} from "@/lib/coupon-offers";
import { formatCurrency } from "@/lib/utils";

type ProductAvailableOffersProps = {
  total: number;
  categoryId?: string | null;
};

export default function ProductAvailableOffers({
  total,
  categoryId,
}: ProductAvailableOffersProps) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [offers, setOffers] = useState<AvailableCouponOffer[]>([]);
  const [copiedCode, setCopiedCode] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    const fetchOffers = async () => {
      setLoading(true);
      try {
        const params = new URLSearchParams({
          total: String(Math.max(0, total)),
        });
        if (categoryId) {
          params.set("categoryId", categoryId);
        }

        const response = await fetch(`/api/coupons/available?${params.toString()}`, {
          cache: "no-store",
        });
        const json = (await response.json()) as {
          success: boolean;
          data?: AvailableCouponOffer[];
        };

        if (!cancelled && json.success) {
          setOffers(json.data || []);
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    };

    void fetchOffers();

    return () => {
      cancelled = true;
    };
  }, [categoryId, total]);

  const headerCount = useMemo(() => offers.length, [offers.length]);

  const copyCode = async (code: string) => {
    try {
      await navigator.clipboard.writeText(code);
      setCopiedCode(code);
      window.setTimeout(() => {
        setCopiedCode((current) => (current === code ? null : current));
      }, 2000);
    } catch {
      setCopiedCode(null);
    }
  };

  return (
    <section className="rounded-xl border border-[#1F1F1F] bg-[#111111]">
      <button
        type="button"
        onClick={() => setOpen((current) => !current)}
        className="flex w-full items-center justify-between gap-4 px-4 py-3 text-left"
      >
        <div className="flex items-center gap-2.5">
          <span className="text-sm font-bold uppercase tracking-[0.18em] text-white">Available Offers</span>
          <span className="rounded-full bg-[#4F46E5]/16 px-2.5 py-1 text-[11px] font-bold text-[#D9DDFF]">
            {loading ? "..." : headerCount}
          </span>
        </div>
        <ChevronDown
          className={open ? "h-4 w-4 rotate-180 text-[#A5B4FC] transition-transform" : "h-4 w-4 text-[#A5B4FC] transition-transform"}
        />
      </button>

      {open ? (
        <div className="border-t border-[#1F1F1F] px-4 py-3">
          {loading ? (
            <div className="space-y-3">
              {Array.from({ length: 3 }).map((_, index) => (
                <div key={index} className="rounded-xl border border-[#1A1A1A] bg-[#0E0E0E] p-3">
                  <div className="flex items-start gap-3">
                    <SkeletonBox width={18} height={18} borderRadius={999} />
                    <div className="flex-1 space-y-2">
                      <SkeletonBox width={92} height={28} borderRadius={999} />
                      <SkeletonBox width="60%" height={12} borderRadius={8} />
                      <SkeletonBox width="45%" height={10} borderRadius={8} />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : offers.length ? (
            <div className="space-y-3">
              {offers.map((offer) => {
                const expiry = getCouponExpiryMeta(offer.expiryDate);
                return (
                  <div key={offer.code} className="rounded-xl border border-[#1A1A1A] bg-[#0E0E0E] p-3">
                    <div className="flex items-start gap-3">
                      <Tag className="mt-0.5 h-4 w-4 text-[#A5B4FC]" />
                      <div className="min-w-0 flex-1 space-y-2">
                        <div className="flex flex-wrap items-center gap-2">
                          <button
                            type="button"
                            onClick={() => void copyCode(offer.code)}
                            className="min-h-[34px] rounded-full border border-[#6366F1]/25 bg-[#4F46E5]/10 px-3 py-1 text-xs font-bold uppercase tracking-[0.18em] text-[#D9DDFF]"
                          >
                            {copiedCode === offer.code ? "Copied!" : offer.code}
                          </button>
                          {expiry.label ? (
                            <span className={expiry.urgent ? "text-xs font-semibold text-amber-300" : "text-xs font-semibold text-[#8D867A]"}>
                              {expiry.label}
                            </span>
                          ) : null}
                        </div>
                        <p className="text-sm font-medium text-white">{getCouponDescription(offer)}</p>
                        <p className="text-xs text-[#9CA3AF]">
                          {(offer.minOrderAmount || 0) > 0
                            ? `on orders above ${formatCurrency(offer.minOrderAmount || 0)}`
                            : "No minimum order requirement"}
                          {offer.discountType === "percentage" && (offer.maxDiscountAmount || 0) > 0
                            ? ` · Max discount ${formatCurrency(offer.maxDiscountAmount || 0)}`
                            : ""}
                        </p>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <p className="text-sm text-[#777777]">No offers available right now</p>
          )}
        </div>
      ) : null}
    </section>
  );
}
