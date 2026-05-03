"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";
import { useWishlistStore } from "@/stores/wishlist-store";

export default function WishlistUndoSync() {
  const pathname = usePathname();
  const flushPendingRemovals = useWishlistStore((state) => state.flushPendingRemovals);

  useEffect(() => {
    return () => {
      flushPendingRemovals();
    };
  }, [flushPendingRemovals, pathname]);

  useEffect(() => {
    const handlePageHide = () => {
      flushPendingRemovals();
    };

    window.addEventListener("pagehide", handlePageHide);
    window.addEventListener("beforeunload", handlePageHide);

    return () => {
      window.removeEventListener("pagehide", handlePageHide);
      window.removeEventListener("beforeunload", handlePageHide);
    };
  }, [flushPendingRemovals]);

  return null;
}
