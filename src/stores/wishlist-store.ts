"use client";

import { createElement } from "react";
import { create } from "zustand";
import { persist } from "zustand/middleware";
import { toast } from "react-hot-toast";

export type WishlistItem = {
  productId: string;
  variantId?: string;
  slug: string;
  title: string;
  image: string;
  price: number;
  discountPrice: number;
  compareAtPrice?: number;
  brand: string;
  size?: string;
  color?: { name: string; hex: string };
  variantSku?: string;
  variantAvailable?: boolean;
};

type PendingRemoval = {
  item: WishlistItem;
  toastId: string;
  timeoutId: number;
};

type WishlistState = {
  items: WishlistItem[];
  toggle: (item: WishlistItem) => void;
  remove: (productId: string, variantId?: string) => void;
  has: (productId: string, variantId?: string) => boolean;
  flushPendingRemovals: () => void;
  clearStore: () => void;
};

const WISHLIST_STORAGE_KEY = "stylehub-wishlist";

const pendingRemovals = new Map<string, PendingRemoval>();

function getWishlistKey(productId: string, variantId?: string) {
  return `${productId}::${variantId || ""}`;
}

function matchesWishlistItem(item: WishlistItem, productId: string, variantId?: string) {
  return item.productId === productId && (item.variantId || "") === (variantId || "");
}

function addItem(items: WishlistItem[], item: WishlistItem) {
  const withoutExisting = items.filter(
    (wishlistItem) => !matchesWishlistItem(wishlistItem, item.productId, item.variantId),
  );
  return [...withoutExisting, item];
}

function removeItem(items: WishlistItem[], productId: string, variantId?: string) {
  return items.filter((item) => !matchesWishlistItem(item, productId, variantId));
}

function finalizePendingRemoval(productId: string, variantId?: string) {
  const key = getWishlistKey(productId, variantId);
  const pending = pendingRemovals.get(key);
  if (!pending) {
    return;
  }

  window.clearTimeout(pending.timeoutId);
  toast.dismiss(pending.toastId);
  pendingRemovals.delete(key);
}

function undoPendingRemoval(productId: string, variantId?: string) {
  const key = getWishlistKey(productId, variantId);
  const pending = pendingRemovals.get(key);
  if (!pending) {
    return;
  }

  window.clearTimeout(pending.timeoutId);
  pendingRemovals.delete(key);
  useWishlistStore.setState((state) => ({
    items: addItem(state.items, pending.item),
  }));
  toast.dismiss(pending.toastId);
  toast.success("Added back");
}

function scheduleRemoval(item: WishlistItem) {
  const key = getWishlistKey(item.productId, item.variantId);
  finalizePendingRemoval(item.productId, item.variantId);

  useWishlistStore.setState((state) => ({
    items: removeItem(state.items, item.productId, item.variantId),
  }));

  const toastId = `${key}-${Date.now()}`;
  const timeoutId = window.setTimeout(() => {
    finalizePendingRemoval(item.productId, item.variantId);
  }, 4000);

  pendingRemovals.set(key, { item, toastId, timeoutId });

  toast.custom(
    (toastInstance) =>
      createElement(
        "div",
        {
          className: `pointer-events-auto flex items-center gap-3 rounded-2xl border border-white/10 bg-[#111111] px-4 py-3 text-sm text-white shadow-[0_18px_40px_rgba(0,0,0,0.35)] ${
            toastInstance.visible ? "animate-enter" : "animate-leave"
          }`,
        },
        createElement("span", { className: "text-[#D4D4D8]" }, "Removed from wishlist"),
        createElement(
          "button",
          {
            type: "button",
            onClick: () => undoPendingRemoval(item.productId, item.variantId),
            className: "text-xs font-medium text-white underline underline-offset-2",
          },
          "Undo",
        ),
      ),
    {
      id: toastId,
      duration: 4000,
    },
  );
}

export const useWishlistStore = create<WishlistState>()(
  persist(
    (set, get) => ({
      items: [],
      toggle: (item) => {
        const key = getWishlistKey(item.productId, item.variantId);
        const pending = pendingRemovals.get(key);

        if (pending) {
          undoPendingRemoval(item.productId, item.variantId);
          return;
        }

        const exists = get().items.some((wishlistItem) =>
          matchesWishlistItem(wishlistItem, item.productId, item.variantId),
        );

        if (exists) {
          scheduleRemoval(item);
          return;
        }

        set((state) => ({
          items: addItem(state.items, item),
        }));
      },
      remove: (productId, variantId) => {
        const item = get().items.find((wishlistItem) =>
          matchesWishlistItem(wishlistItem, productId, variantId),
        );
        if (!item) {
          return;
        }

        scheduleRemoval(item);
      },
      has: (productId, variantId) =>
        get().items.some((item) => matchesWishlistItem(item, productId, variantId)),
      flushPendingRemovals: () => {
        Array.from(pendingRemovals.values()).forEach((pending) => {
          window.clearTimeout(pending.timeoutId);
          toast.dismiss(pending.toastId);
        });
        pendingRemovals.clear();
      },
      clearStore: () => {
        Array.from(pendingRemovals.values()).forEach((pending) => {
          window.clearTimeout(pending.timeoutId);
          toast.dismiss(pending.toastId);
        });
        pendingRemovals.clear();
        if (typeof window !== "undefined") {
          window.localStorage.removeItem(WISHLIST_STORAGE_KEY);
        }
        set({ items: [] });
      },
    }),
    {
      name: WISHLIST_STORAGE_KEY,
      partialize: (state) => ({ items: state.items }),
    },
  ),
);
