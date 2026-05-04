"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";

export type RecentlyViewedProduct = {
  productId: string;
  slug: string;
  name: string;
  price: number;
  discountPrice: number;
  image: string;
};

type RecentlyViewedState = {
  items: RecentlyViewedProduct[];
  addProduct: (product: RecentlyViewedProduct) => void;
  clearAll: () => void;
  clearStore: () => void;
};

const MAX_RECENTLY_VIEWED = 8;
const RECENTLY_VIEWED_STORAGE_KEY = "stylehub-recently-viewed";

export const useRecentlyViewedStore = create<RecentlyViewedState>()(
  persist(
    (set) => ({
      items: [],
      addProduct: (product) =>
        set((state) => {
          const deduped = state.items.filter((item) => item.productId !== product.productId);
          return {
            items: [product, ...deduped].slice(0, MAX_RECENTLY_VIEWED),
          };
        }),
      clearAll: () => set({ items: [] }),
      clearStore: () => {
        if (typeof window !== "undefined") {
          window.localStorage.removeItem(RECENTLY_VIEWED_STORAGE_KEY);
        }
        set({ items: [] });
      },
    }),
    {
      name: RECENTLY_VIEWED_STORAGE_KEY,
    },
  ),
);
