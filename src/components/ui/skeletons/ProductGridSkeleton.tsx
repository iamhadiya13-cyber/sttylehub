"use client";

import { ProductCardSkeleton } from "@/components/ui/skeletons/ProductCardSkeleton";
import { browseGridClassName } from "@/components/storefront/browse-grid";

type ProductGridSkeletonProps = {
  count?: number;
};

export function ProductGridSkeleton({ count = 9 }: ProductGridSkeletonProps) {
  const total = Math.max(count, 9);

  return (
    <div className={browseGridClassName}>
      {Array.from({ length: total }).map((_, index) => (
        <div
          key={index}
          className={index >= 6 ? "hidden lg:block" : undefined}
        >
          <ProductCardSkeleton />
        </div>
      ))}
    </div>
  );
}
