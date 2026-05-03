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
};

const MAX_RECENTLY_VIEWED = 8;

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
    }),
    {
      name: "stylehub-recently-viewed",
    },
  ),
);
