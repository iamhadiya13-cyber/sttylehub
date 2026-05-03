"use client";

import Image from "next/image";
import Link from "next/link";
import { Trash2 } from "lucide-react";
import { formatCurrency } from "@/lib/utils";
import { fallbackImage, isPollinationsImage } from "@/components/storefront/media";
import { useRecentlyViewedStore } from "@/stores/recently-viewed-store";

export function RecentlyViewedRail({
  lowStockIds = [],
  currentProductId,
}: {
  lowStockIds?: string[];
  currentProductId?: string;
}) {
  const items = useRecentlyViewedStore((state) => state.items);
  const clearAll = useRecentlyViewedStore((state) => state.clearAll);

  const visibleItems = items.filter((item) => item.productId !== currentProductId);

  if (visibleItems.length < 2) {
    return null;
  }

  return (
    <section className="space-y-5">
      <div className="flex items-center justify-between gap-4">
        <div>
          <p className="text-[11px] font-bold uppercase tracking-[0.24em] text-[#A5B4FC]">History</p>
          <h3 className="mt-2 text-2xl font-black uppercase tracking-[0.16em] text-white">Recently Viewed</h3>
        </div>
        <button
          type="button"
          onClick={clearAll}
          className="inline-flex items-center gap-2 rounded-full border border-white/10 px-3 py-2 text-xs font-semibold uppercase tracking-[0.16em] text-[#A5A5B8] transition hover:border-[#7F77DD]/40 hover:text-white"
        >
          <Trash2 className="h-3.5 w-3.5" />
          Clear All
        </button>
      </div>

      <div className="overflow-x-auto pb-1 [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden">
        <div className="flex gap-4 pr-2" style={{ scrollBehavior: "smooth" }}>
          {visibleItems.map((item) => {
            const lowStock = lowStockIds.includes(item.productId);
            const discounted = item.price > item.discountPrice;

            return (
              <Link
                key={item.productId}
                href={`/products/${item.slug}`}
                className="group block w-[220px] flex-none overflow-hidden rounded-[18px] border border-white/8 bg-[linear-gradient(180deg,#0F1220_0%,#0B0E18_100%)] transition-all duration-300 hover:border-[#6366F1]/30 hover:shadow-[0_20px_44px_rgba(2,6,23,0.42)]"
              >
                <div className="relative aspect-[4/5] overflow-hidden bg-[#141827]">
                  {isPollinationsImage(item.image) ? (
                    <img
                      src={fallbackImage(item.image)}
                      alt={item.name}
                      className="h-full w-full object-cover object-center transition duration-500 group-hover:scale-[1.04]"
                    />
                  ) : (
                    <Image
                      src={fallbackImage(item.image)}
                      alt={item.name}
                      fill
                      sizes="220px"
                      className="object-cover object-center transition duration-500 group-hover:scale-[1.04]"
                    />
                  )}
                  <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(8,11,19,0.02)_0%,rgba(8,11,19,0.08)_38%,rgba(8,11,19,0.42)_100%)]" />
                  {lowStock ? (
                    <div className="absolute left-0 top-0 p-[10px]">
                      <span className="inline-flex rounded-full bg-amber-500/15 px-[10px] py-[3px] text-[10px] font-bold uppercase tracking-[1px] text-amber-300">
                        Almost Gone
                      </span>
                    </div>
                  ) : null}
                </div>
                <div className="space-y-2.5 px-3.5 pb-4 pt-3.5">
                  <div className="line-clamp-2 text-[13px] font-semibold leading-[1.4] text-[#F4F1EA]">
                    {item.name}
                  </div>
                  <div className="flex flex-wrap items-center gap-2.5">
                    <span className="text-[15px] font-bold text-[#C7D2FE]">
                      {formatCurrency(item.discountPrice)}
                    </span>
                    {discounted ? (
                      <span className="text-[12px] text-[#555555] line-through">
                        {formatCurrency(item.price)}
                      </span>
                    ) : null}
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      </div>
    </section>
  );
}
