"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ShoppingBag, Trash2 } from "lucide-react";
import { RecentlyViewedRail } from "@/components/storefront/RecentlyViewedRail";
import CouponInput from "@/components/ui/CouponInput";
import LoadingButton from "@/components/ui/LoadingButton";
import { Button, fallbackImage, PageShell, SectionHeading, useApi } from "@/components/screens/shared";
import { useButtonLoading } from "@/hooks/useButtonLoading";
import { useConfirmModal } from "@/hooks/useConfirmModal";
import { formatCurrency } from "@/lib/utils";
import { useCartStore } from "@/stores/cart-store";
import { useLoadingStore } from "@/stores/loading-store";

export function CartPageScreen() {
  const router = useRouter();
  const items = useCartStore((state) => state.items);
  const totalPrice = useCartStore((state) => state.totalPrice);
  const updateQty = useCartStore((state) => state.updateQty);
  const removeItem = useCartStore((state) => state.removeItem);
  const [removingKey, setRemovingKey] = useState<string | null>(null);
  const { loading: checkoutLoading, trigger: triggerCheckout } = useButtonLoading();
  const { confirm } = useConfirmModal();
  const setLoading = useLoadingStore((state) => state.setLoading);
  const coupon = useCartStore((state) => state.coupon);
  const setCoupon = useCartStore((state) => state.setCoupon);
  const { data: shippingConfig } = useApi<{ shippingFee: number; freeShippingThreshold: number; completedOrders: number; reason?: string }>(
    `/api/store-config/shipping?subtotal=${totalPrice}`,
    { shippingFee: totalPrice >= 499 || totalPrice === 0 ? 0 : 49, freeShippingThreshold: 499, completedOrders: 0 },
  );
  const shipping = shippingConfig.shippingFee;
  const total = Math.max(0, totalPrice + shipping - (coupon?.discount || 0));

  return (
    <PageShell>
      <main className="mx-auto max-w-7xl space-y-8 px-4 py-12 sm:px-6 lg:px-8">
        <SectionHeading eyebrow="Bag" title="Your Cart" />
        {items.length ? (
          <div className="space-y-10">
            <div className="grid gap-8 lg:grid-cols-[1.2fr,0.8fr]">
              <div className="space-y-4">
                {items.map((item) => (
                  <div
                    key={`${item.productId}-${item.variantId || ""}-${item.size}-${item.color?.name || ""}`}
                    className="grid gap-4 rounded-3xl border border-[#1F1F1F] bg-[#111111] p-4 sm:grid-cols-[120px,1fr]"
                  >
                    <div className="relative h-20 w-16 overflow-hidden rounded-xl bg-black/20">
                      {item.image.includes("image.pollinations.ai") ? (
                        <img src={fallbackImage(item.image)} alt={item.title} className="h-full w-full object-cover object-top" />
                      ) : (
                        <Image src={fallbackImage(item.image)} alt={item.title} fill className="object-cover object-top" />
                      )}
                    </div>
                    <div className="space-y-4">
                      <div className="flex items-start justify-between gap-4">
                        <div>
                          <p className="text-lg font-semibold">{item.title}</p>
                          <p className="text-sm text-[#888888]">
                            {item.size || "Selected size"}
                            {item.color ? ` • ${item.color.name}` : ""}
                          </p>
                        </div>
                        <LoadingButton
                          type="button"
                          loading={removingKey === `${item.productId}-${item.variantId || ""}-${item.size}-${item.color?.name || ""}`}
                          onClick={async () => {
                            const key = `${item.productId}-${item.variantId || ""}-${item.size}-${item.color?.name || ""}`;
                            await confirm({
                              title: "Remove item?",
                              message: "This item will be removed from your cart.",
                              confirmText: "Remove",
                              variant: "danger",
                              action: async () => {
                                setRemovingKey(key);
                                try {
                                  removeItem(item.productId, item.size, item.color?.name, item.variantId);
                                  await Promise.resolve();
                                } finally {
                                  setRemovingKey((current) => (current === key ? null : current));
                                }
                              },
                            });
                          }}
                          className="rounded-full border border-[#1F1F1F] p-2 text-[#FF4444]"
                        >
                          <Trash2 className="h-4 w-4" />
                        </LoadingButton>
                      </div>
                      <div className="flex flex-wrap items-center justify-between gap-4">
                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            onClick={() => updateQty(item.productId, item.size, item.color?.name, item.qty - 1, item.variantId)}
                            className="flex h-7 w-7 items-center justify-center rounded-md border border-[#1F1F1F] bg-[#1A1A1A] text-white hover:border-[#6366F1]"
                          >
                            -
                          </button>
                          <span className="min-w-6 text-center text-sm font-semibold text-white">{item.qty}</span>
                          <button
                            type="button"
                            disabled={item.qty >= item.maxQty}
                            onClick={() => updateQty(item.productId, item.size, item.color?.name, item.qty + 1, item.variantId)}
                            className="flex h-7 w-7 items-center justify-center rounded-md border border-[#1F1F1F] bg-[#1A1A1A] text-white hover:border-[#6366F1] disabled:cursor-not-allowed disabled:opacity-40"
                          >
                            +
                          </button>
                        </div>
                        <div className="text-right">
                          <p className="text-lg font-bold text-[#C7D2FE]">{formatCurrency(item.discountPrice * item.qty)}</p>
                          {item.maxQty === 0 ? (
                            <p className="text-xs text-red-400">Variant unavailable</p>
                          ) : item.maxQty - item.qty <= 2 ? (
                            <p className="text-xs text-amber-300">Only {item.maxQty} left</p>
                          ) : null}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              <aside className="h-fit rounded-3xl border border-[#1F1F1F] bg-[#111111] p-5">
                <h3 className="text-xl font-bold">Order Summary</h3>
                <div className="mt-5">
                  <CouponInput
                    cartTotal={totalPrice}
                    appliedCoupon={coupon}
                    onApply={(nextCoupon) => setCoupon(nextCoupon)}
                    onRemove={() => setCoupon(null)}
                  />
                </div>
                <div className="mt-5 space-y-3 text-sm text-[#BDBDBD]">
                  <div className="flex justify-between">
                    <span>Subtotal</span>
                    <span>{formatCurrency(totalPrice)}</span>
                  </div>
                  {coupon ? (
                    <div className="flex justify-between text-[#76E48E]">
                      <span>Discount ({coupon.code})</span>
                      <span>-{formatCurrency(coupon.discount)}</span>
                    </div>
                  ) : null}
                  <div className="flex justify-between">
                    <span>Shipping</span>
                    <span>{shipping ? formatCurrency(shipping) : "Free"}</span>
                  </div>
                  <div className="flex justify-between border-t border-[#1F1F1F] pt-4 text-lg font-bold text-white">
                    <span>Total</span>
                    <span>{formatCurrency(total)}</span>
                  </div>
                </div>
                <div className="mt-6 grid gap-3">
                  <Button
                    type="button"
                    loading={checkoutLoading}
                    loadingText="Loading checkout..."
                    onClick={() =>
                      void triggerCheckout(async () => {
                        setLoading(true);
                        router.push("/checkout");
                      })
                    }
                    className="w-full"
                  >
                    Proceed to Checkout
                  </Button>
                  <Link href="/products" className="text-center text-sm text-[#888888]">
                    Continue Shopping
                  </Link>
                </div>
              </aside>
            </div>

            <RecentlyViewedRail />
          </div>
        ) : (
          <section className="flex min-h-[60vh] items-center justify-center">
            <div className="flex max-w-md flex-col items-center text-center">
              <div className="mb-5 flex h-16 w-16 items-center justify-center rounded-full bg-[#4F46E5]/14 text-[#A5B4FC]">
                <ShoppingBag className="h-8 w-8" />
              </div>
              <h2 className="text-2xl font-bold text-white">Your cart is empty</h2>
              <p className="mt-2 text-sm leading-6 text-[#9CA3AF]">Add some items to get started</p>
              <Link
                href="/products"
                className="mt-6 rounded-xl bg-[linear-gradient(135deg,#4F46E5_0%,#4338CA_100%)] px-5 py-3 text-sm font-semibold text-[#F8FAFC]"
              >
                Shop Now
              </Link>
            </div>
          </section>
        )}
      </main>
    </PageShell>
  );
}
