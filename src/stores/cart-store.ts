"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";

export type CartItem = {
  productId: string;
  variantId?: string;
  slug: string;
  title: string;
  image: string;
  price: number;
  discountPrice: number;
  compareAtPrice?: number;
  qty: number;
  size?: string;
  color?: { name: string; hex: string };
  variantSku?: string;
  maxQty: number;
  gender?: "men" | "women" | "unisex";
  acceptedPayments?: {
    razorpay: boolean;
    stripe: boolean;
    cod: boolean;
  };
};

type CartState = {
  items: CartItem[];
  coupon: { code: string; discount: number; couponId?: string } | null;
  totalItems: number;
  totalPrice: number;
  addItem: (item: CartItem) => void;
  removeItem: (productId: string, size?: string, colorName?: string, variantId?: string) => void;
  updateQty: (productId: string, size: string | undefined, colorName: string | undefined, newQty: number, variantId?: string) => void;
  updateItemData: (
    productId: string,
    size: string | undefined,
    colorName: string | undefined,
    patch: Partial<Pick<CartItem, "price" | "discountPrice" | "compareAtPrice" | "maxQty" | "acceptedPayments" | "image" | "variantId" | "variantSku">>,
    variantId?: string,
  ) => void;
  clearCart: () => void;
  setCoupon: (coupon: { code: string; discount: number; couponId?: string } | null) => void;
};

const computeTotals = (items: CartItem[]) => ({
  totalItems: items.reduce((sum, item) => sum + item.qty, 0),
  totalPrice: items.reduce((sum, item) => sum + item.discountPrice * item.qty, 0),
});

const matchCartItem = (
  item: CartItem,
  productId: string,
  size?: string,
  colorName?: string,
  variantId?: string,
) =>
  item.productId === productId &&
  ((variantId && item.variantId === variantId) ||
    (!variantId &&
      item.size === size &&
      (item.color?.name || "") === (colorName || "")));

const findIndex = (items: CartItem[], productId: string, size?: string, colorName?: string, variantId?: string) =>
  items.findIndex(
    (item) => matchCartItem(item, productId, size, colorName, variantId),
  );

export const useCartStore = create<CartState>()(
  persist(
    (set) => ({
      items: [],
      coupon: null,
      totalItems: 0,
      totalPrice: 0,
      addItem: (item) =>
        set((state) => {
          const colorName = item.color?.name;
          const index = findIndex(state.items, item.productId, item.size, colorName, item.variantId);
          if (index >= 0) {
            const items = [...state.items];
            const current = items[index];
            items[index] = {
              ...current,
              qty: Math.min(current.maxQty || item.maxQty, current.qty + item.qty),
              maxQty: item.maxQty,
              variantId: item.variantId || current.variantId,
              variantSku: item.variantSku || current.variantSku,
              price: item.price,
              discountPrice: item.discountPrice,
              compareAtPrice: item.compareAtPrice ?? current.compareAtPrice,
              color: item.color ?? current.color,
              acceptedPayments: item.acceptedPayments ?? current.acceptedPayments,
              gender: item.gender ?? current.gender,
            };
            return { items, ...computeTotals(items) };
          }

          const items = [...state.items, item];
          return { items, ...computeTotals(items) };
        }),
      removeItem: (productId, size, colorName, variantId) =>
        set((state) => {
          const items = state.items.filter(
            (item) => !matchCartItem(item, productId, size, colorName, variantId),
          );
          return { items, ...computeTotals(items) };
        }),
      updateQty: (productId, size, colorName, newQty, variantId) =>
        set((state) => {
          const items = state.items.map((item) =>
            matchCartItem(item, productId, size, colorName, variantId)
              ? { ...item, qty: Math.max(1, Math.min(item.maxQty || 99, newQty)) }
              : item,
          );
          return { items, ...computeTotals(items) };
        }),
      updateItemData: (productId, size, colorName, patch, variantId) =>
        set((state) => {
          const items = state.items.map((item) =>
            matchCartItem(item, productId, size, colorName, variantId)
              ? { ...item, ...patch }
              : item,
          );
          return { items, ...computeTotals(items) };
        }),
      clearCart: () => set({ items: [], coupon: null, totalItems: 0, totalPrice: 0 }),
      setCoupon: (coupon) => set({ coupon }),
    }),
    {
      name: "stylehub-cart",
    },
  ),
);
