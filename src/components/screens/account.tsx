/* eslint-disable react-hooks/set-state-in-effect */

"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useSession } from "next-auth/react";
import { motion } from "framer-motion";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "react-hot-toast";
import AddressForm, { type AddressFormData } from "@/components/ui/AddressForm";
import CancelOrderModal from "@/components/ui/CancelOrderModal";
import OrderTimeline from "@/components/ui/OrderTimeline";
import ReturnExchangeRequestModal from "@/components/ui/ReturnExchangeRequestModal";
import VerificationRequiredModal from "@/components/ui/VerificationRequiredModal";
import VendorApplyModal from "@/components/ui/VendorApplyModal";
import {
  Button,
  EmptyState,
  fallbackImage,
  Field,
  orderTabs,
  PageShell,
  SectionHeading,
  TextArea,
  TextInput,
  type Address,
  type Order,
  type Profile,
  useApi,
} from "@/components/screens/shared";
import Pagination from "@/components/ui/Pagination";
import {
  AddressCardSkeleton,
  OrderCardSkeleton,
  ProductGridSkeleton,
  ProfileSkeleton,
} from "@/components/ui/Skeletons";
import { useButtonLoading } from "@/hooks/useButtonLoading";
import { useConfirmModal } from "@/hooks/useConfirmModal";
import { useVerifiedSessionState } from "@/hooks/useVerifiedSessionState";
import { profileFormSchema } from "@/lib/client-schemas";
import { useDebounceCallback } from "@/hooks/useDebounce";
import { useCartStore } from "@/stores/cart-store";
import { useLoadingStore } from "@/stores/loading-store";
import { useWishlistStore } from "@/stores/wishlist-store";

export function OrdersPageScreen() {
  const [status, setStatus] = useState("all");
  const [page, setPage] = useState(1);
  const limit = 10;
  const { data, loading, error, refetch } = useApi<{ orders: Order[]; total: number; page: number; totalPages: number }>(
    `/api/orders?page=${page}&limit=${limit}${status !== "all" ? `&status=${status}` : ""}`,
    { orders: [], total: 0, page: 1, totalPages: 1 },
  );

  // eslint-disable-next-line react-hooks/set-state-in-effect -- changing the order status filter should always reset pagination to page 1
  useEffect(() => {
    setPage(1);
  }, [status]);

  return (
    <PageShell>
      <main className="mx-auto max-w-7xl space-y-8 px-4 py-12 pb-[calc(112px+env(safe-area-inset-bottom))] sm:px-6 md:pb-[calc(112px+env(safe-area-inset-bottom))] lg:px-8 lg:pb-12">
        <SectionHeading eyebrow="Account" title="My Orders" />
        <div className="flex flex-wrap gap-3">
          {orderTabs.map((tab) => (
            <button
              key={tab}
              type="button"
              onClick={() => setStatus(tab)}
              className={
                status === tab
                  ? "rounded-full bg-[#4F46E5]/14 px-4 py-2 text-sm font-semibold capitalize text-[#C7D2FE]"
                  : "rounded-full border border-[#1F1F1F] px-4 py-2 text-sm font-semibold capitalize text-[#888888]"
              }
            >
              {tab}
            </button>
          ))}
        </div>

        {loading ? (
          <div className="space-y-4">
            {Array.from({ length: 4 }).map((_, index) => (
              <OrderCardSkeleton key={index} />
            ))}
          </div>
        ) : error ? (
          <EmptyState
            title="Orders unavailable"
            description={error}
            action={
              <Button type="button" onClick={() => void refetch()}>
                Retry
              </Button>
            }
          />
        ) : data.orders.length ? (
          <div className="space-y-4">
            {data.orders.map((order) => (
              <div key={order._id} className="rounded-3xl border border-[#1F1F1F] bg-[#111111] p-5">
                <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                  <div>
                    <p className="text-sm uppercase tracking-[0.2em] text-[#888888]">Order</p>
                    <h3 className="mt-1 text-2xl font-bold">#{order.orderNumber}</h3>
                    <p className="mt-2 text-sm text-[#888888]">{new Date(order.createdAt).toLocaleString()}</p>
                  </div>
                  <div className="flex flex-wrap items-center gap-3">
                    <span
                      className={
                        order.orderStatus === "cancelled"
                          ? "rounded-full bg-red-500/15 px-3 py-1 text-xs font-bold uppercase text-red-300"
                          : "rounded-full bg-[#4F46E5]/14 px-3 py-1 text-xs font-bold uppercase text-[#C7D2FE]"
                      }
                    >
                      {order.orderStatus}
                    </span>
                    {order.orderStatus === "cancelled" && order.cancelledAt ? (
                      <span className="text-xs text-[#888888]">
                        Cancelled on {new Date(order.cancelledAt).toLocaleDateString("en-IN")}
                      </span>
                    ) : null}
                    <Link href={`/orders/${order._id}`} className="rounded-xl border border-[#1F1F1F] px-4 py-2 text-sm font-semibold">
                      View Details
                    </Link>
                  </div>
                </div>
                <div className="mt-5 flex flex-wrap items-center gap-3">
                  {order.items.slice(0, 2).map((item, index) => (
                    <div key={`${item.title}-${index}`} className="relative h-16 w-14 overflow-hidden rounded-xl border border-[#1F1F1F]">
                      <Image src={fallbackImage(item.image || item.product?.images?.[0])} alt={item.title} fill className="object-cover" />
                    </div>
                  ))}
                      <span className="ml-auto text-lg font-bold text-[#C7D2FE]">{order.total}</span>
                </div>
              </div>
            ))}
            <Pagination
              currentPage={data.page}
              totalPages={data.totalPages}
              totalItems={data.total}
              itemsPerPage={limit}
              onPageChange={(nextPage) => {
                setPage(nextPage);
                window.scrollTo({ top: 0, behavior: "smooth" });
              }}
            />
          </div>
        ) : (
          <EmptyState
            title="No orders yet"
            action={
                <Link href="/products" className="rounded-xl bg-[linear-gradient(135deg,#4F46E5_0%,#4338CA_100%)] px-4 py-2 text-sm font-semibold text-[#F8FAFC]">
                Shop now
              </Link>
            }
          />
        )}
      </main>
    </PageShell>
  );
}

export function OrderDetailPageScreen({ id }: { id: string }) {
  const DAY_MS = 24 * 60 * 60 * 1000;
  const router = useRouter();
  const { loading: backLoading, trigger: triggerBack } = useButtonLoading();
  const setLoading = useLoadingStore((state) => state.setLoading);
  const searchParams = useSearchParams();
  const { data: session } = useSession();
  const { data: order, loading, error, refetch } = useApi<Order | null>(`/api/orders/${id}`, null);
  const [loadingAction, setLoadingAction] = useState(false);
  const [cancelOpen, setCancelOpen] = useState(false);
  const [returnModalOpen, setReturnModalOpen] = useState(false);
  const [exchangeModalOpen, setExchangeModalOpen] = useState(false);
  const [reviewProductId, setReviewProductId] = useState("");
  const [reviewRating, setReviewRating] = useState(5);
  const [reviewComment, setReviewComment] = useState("");
  const [reviewSubmitting, setReviewSubmitting] = useState(false);
  const isSuccess = searchParams?.get("success") === "true";

  const runAction = useDebounceCallback(async (path: string, method: "PUT" | "POST", body?: Record<string, unknown>) => {
    setLoadingAction(true);
    try {
      const response = await fetch(path, {
        method,
        headers: body ? { "Content-Type": "application/json" } : undefined,
        body: body ? JSON.stringify(body) : undefined,
      });
      const json = (await response.json()) as { success: boolean; message?: string };
      if (!response.ok || !json.success) throw new Error(json.message || "Action failed");
      toast.success(json.message || "Updated");
      await refetch();
    } catch (errorValue) {
      toast.error(errorValue instanceof Error ? errorValue.message : "Action failed");
    } finally {
      setLoadingAction(false);
    }
  }, 1000);

  const runCancellation = useDebounceCallback(
    async (payload: { reason: string; customReason?: string }) => {
      setLoadingAction(true);
      try {
        const response = await fetch(`/api/orders/${order?._id}/cancel`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
        const json = (await response.json()) as { success?: boolean; message?: string };
        if (!response.ok || !json.success) {
          throw new Error(json.message || "Failed to cancel order");
        }
        toast.success("Your order has been cancelled.");
        await refetch();
        window.setTimeout(() => {
          setLoading(true);
          router.push("/orders");
        }, 2000);
      } catch (errorValue) {
        toast.error(errorValue instanceof Error ? errorValue.message : "Action failed");
      } finally {
        setLoadingAction(false);
      }
    },
    1000,
  );

  useEffect(() => {
    if (!order?.items?.length) {
      return;
    }
    const firstReviewableProductId = order.items.find((item) => item.product?._id)?.product?._id;
    if (firstReviewableProductId) {
      setReviewProductId(firstReviewableProductId);
    }
  }, [order?._id, order?.items]);

  if (loading) {
    return (
      <PageShell>
        <main className="mx-auto max-w-7xl px-4 py-12">
          <div className="h-[520px] animate-pulse rounded-3xl border border-[#1F1F1F] bg-[#111111]" />
        </main>
      </PageShell>
    );
  }

  if (error || !order) {
    return (
      <PageShell>
        <main className="mx-auto max-w-7xl px-4 py-12">
          <EmptyState
            title="Order unavailable"
            description={error || "We couldn't load this order."}
            action={
              <Button type="button" loading={backLoading} loadingText="Loading..." onClick={() => void triggerBack(async () => { setLoading(true); router.push("/orders"); })}>
                Back to Orders
              </Button>
            }
          />
        </main>
      </PageShell>
    );
  }

  const deliveredAtMs = order.deliveredAt ? new Date(order.deliveredAt).getTime() : 0;
  const nowMs = Date.now();
  const returnSupportedItems = order.items.filter((item) => item.product?.returnAllowed);
  const exchangeSupportedItems = order.items.filter((item) => item.product?.exchangeAllowed);
  const returnEligibleItems = returnSupportedItems.filter(
    (item) => deliveredAtMs && nowMs <= deliveredAtMs + (item.product?.returnWindowDays || 7) * DAY_MS,
  );
  const exchangeEligibleItems = exchangeSupportedItems.filter(
    (item) => deliveredAtMs && nowMs <= deliveredAtMs + (item.product?.exchangeWindowDays || 7) * DAY_MS,
  );
  const returnExpiryMs = returnSupportedItems.length
    ? Math.max(...returnSupportedItems.map((item) => deliveredAtMs + (item.product?.returnWindowDays || 7) * DAY_MS))
    : null;
  const exchangeExpiryMs = exchangeSupportedItems.length
    ? Math.max(...exchangeSupportedItems.map((item) => deliveredAtMs + (item.product?.exchangeWindowDays || 7) * DAY_MS))
    : null;
  const selectedReviewProduct = order.items.find((item) => item.product?._id === reviewProductId) || order.items[0];

  const submitReview = async () => {
    if (!reviewProductId) {
      toast.error("Select a product to review.");
      return;
    }
    if (!reviewComment.trim()) {
      toast.error("Write a short review.");
      return;
    }
    try {
      setReviewSubmitting(true);
      const response = await fetch("/api/reviews", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          productId: reviewProductId,
          rating: reviewRating,
          title: `Review for ${selectedReviewProduct?.title || "product"}`,
          comment: reviewComment.trim(),
          images: [],
        }),
      });
      const json = (await response.json()) as { success?: boolean; message?: string };
      if (!response.ok || !json.success) {
        throw new Error(json.message || "Failed to submit review");
      }
      toast.success(json.message || "Review submitted");
      setReviewComment("");
      setReviewRating(5);
    } catch (reviewError) {
      toast.error(reviewError instanceof Error ? reviewError.message : "Failed to submit review");
    } finally {
      setReviewSubmitting(false);
    }
  };

  return (
    <PageShell>
      <main className="mx-auto max-w-7xl space-y-8 px-4 py-12 sm:px-6 lg:px-8">
        <SectionHeading eyebrow="Order Detail" title={`#${order.orderNumber}`} description={`Placed on ${new Date(order.createdAt).toLocaleString()}`} />
        {isSuccess ? (
          <motion.div
            initial={{ y: -100, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            style={{
              background: "rgba(34,197,94,0.08)",
              border: "1px solid rgba(34,197,94,0.2)",
              borderRadius: 12,
              padding: "20px 24px",
              display: "flex",
              alignItems: "center",
              gap: 16,
            }}
          >
            <span style={{ fontSize: 40 }}>Ã°Å¸Å½â€°</span>
            <div>
              <h3 style={{ color: "#22C55E", fontSize: 18, fontWeight: 700, margin: 0 }}>Order Placed Successfully!</h3>
              <p style={{ color: "#888", fontSize: 14, margin: "4px 0 0" }}>
                We&apos;ll send you updates at {session?.user?.email || "your email"}
              </p>
            </div>
          </motion.div>
        ) : null}
        <div className="grid gap-8 lg:grid-cols-[1fr,360px]">
          <div className="space-y-6">
            <div className="rounded-3xl border border-[#1F1F1F] bg-[#111111] p-5">
              <h3 className="text-xl font-bold">Order Timeline</h3>
              <div className="mt-4">
                <OrderTimeline
                  currentStatus={order.orderStatus}
                  trackingNumber={order.trackingNumber}
                  carrier={order.carrier}
                  statusHistory={order.statusHistory || []}
                />
              </div>
            </div>
            <div className="rounded-3xl border border-[#1F1F1F] bg-[#111111] p-5">
              <h3 className="text-xl font-bold">Items</h3>
              <div className="mt-4 space-y-4">
                {order.items.map((item, index) => (
                  <div key={`${item.title}-${index}`} className="flex gap-4 rounded-2xl border border-[#1F1F1F] bg-black/20 p-3">
                    <div className="relative h-24 w-20 overflow-hidden rounded-xl">
                      <Image src={fallbackImage(item.image || item.product?.images?.[0])} alt={item.title} fill className="object-cover" />
                    </div>
                    <div className="flex-1">
                      <p className="font-semibold">{item.title}</p>
                      <p className="mt-1 text-sm text-[#888888]">Qty {item.qty}</p>
                      <p className="mt-3 text-[#C7D2FE]">{(item.discountPrice || item.price) * item.qty}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <aside className="space-y-6">
            <div className="rounded-3xl border border-[#1F1F1F] bg-[#111111] p-5">
              <h3 className="text-lg font-bold">Pricing</h3>
              <div className="mt-4 space-y-3 text-sm text-[#BDBDBD]">
                <div className="flex justify-between"><span>Subtotal</span><span>{order.subtotal}</span></div>
                <div className="flex justify-between"><span>Discount</span><span>-{order.discount}</span></div>
                <div className="flex justify-between"><span>Shipping</span><span>{order.shippingCharge || "Free"}</span></div>
                <div className="flex justify-between border-t border-[#1F1F1F] pt-3 text-lg font-bold text-white"><span>Total</span><span>{order.total}</span></div>
              </div>
            </div>

            <div className="rounded-3xl border border-[#1F1F1F] bg-[#111111] p-5">
              <h3 className="text-lg font-bold">Delivery Address</h3>
              <p className="mt-4 text-sm leading-6 text-[#BDBDBD]">
                {order.shippingAddress.fullName ? (
                  <>
                    {order.shippingAddress.fullName}
                    <br />
                  </>
                ) : null}
                {order.shippingAddress.street}
                <br />
                {order.shippingAddress.locality ? `${order.shippingAddress.locality}, ` : ""}
                {order.shippingAddress.city}, {order.shippingAddress.state} {order.shippingAddress.pincode}
                <br />
                {order.shippingAddress.country}
              </p>
            </div>

            {order.orderStatus === "cancelled" && order.cancelReason ? (
              <div
                style={{
                  padding: "12px 16px",
                  background: "rgba(239,68,68,0.06)",
                  border: "1px solid rgba(239,68,68,0.15)",
                  borderRadius: 8,
                  borderLeft: "3px solid #EF4444",
                  marginTop: 16,
                }}
              >
                <p
                  style={{
                    fontSize: 11,
                    color: "#EF4444",
                    fontWeight: 700,
                    letterSpacing: 1,
                    textTransform: "uppercase",
                    margin: "0 0 4px",
                  }}
                >
                  Cancellation Reason
                </p>
                <p style={{ fontSize: 14, color: "#888", margin: 0, lineHeight: 1.6 }}>{order.cancelReason}</p>
                {order.cancelledAt ? (
                  <p style={{ fontSize: 11, color: "#555", margin: "6px 0 0" }}>
                    Cancelled on {new Date(order.cancelledAt).toLocaleDateString("en-IN")}
                  </p>
                ) : null}
              </div>
            ) : null}

            {order.orderStatus === "pending" ? (
              <Button
                type="button"
                variant="danger"
                loading={loadingAction}
                loadingText="Cancelling..."
                onClick={() => setCancelOpen(true)}
                className="w-full"
              >
                Cancel Order
              </Button>
            ) : null}
          </aside>
        </div>
        {order.orderStatus === "delivered" ? (
          <section className="space-y-5">
            <SectionHeading eyebrow="After Delivery" title="Post-Delivery Options" />
            <div className="grid gap-4 lg:grid-cols-3">
              <div className="rounded-3xl border border-[#1F1F1F] bg-[#111111] p-5">
                <p className="text-sm font-semibold uppercase tracking-[0.16em] text-[#A5B4FC]">Rate this order</p>
                {order.items.length > 1 ? (
                  <div className="mt-4">
                    <label className="space-y-2">
                      <span className="app-label">Product</span>
                      <select
                        value={reviewProductId}
                        onChange={(event) => setReviewProductId(event.target.value)}
                        className="app-input h-11 cursor-pointer"
                      >
                        {order.items.map((item, index) => (
                          <option key={`${item.product?._id || item.title}-${index}`} value={item.product?._id || ""}>
                            {item.title}
                          </option>
                        ))}
                      </select>
                    </label>
                  </div>
                ) : null}
                <div className="mt-4 flex gap-2">
                  {[1, 2, 3, 4, 5].map((value) => (
                    <button
                      key={value}
                      type="button"
                      onClick={() => setReviewRating(value)}
                      className="rounded-full border border-[#1F1F1F] p-2"
                    >
                      <span className={value <= reviewRating ? "text-[#818CF8]" : "text-[#555555]"}>★</span>
                    </button>
                  ))}
                </div>
                <div className="mt-4">
                  <TextArea
                    value={reviewComment}
                    onChange={(event) => setReviewComment(event.target.value)}
                    placeholder="Tell us how the item fit and how the quality felt."
                  />
                </div>
                <Button type="button" className="mt-4 w-full" loading={reviewSubmitting} loadingText="Submitting..." onClick={() => void submitReview()}>
                  Submit Review
                </Button>
              </div>

              <div className="rounded-3xl border border-[#1F1F1F] bg-[#111111] p-5">
                <p className="text-sm font-semibold uppercase tracking-[0.16em] text-[#A5B4FC]">Request Return</p>
                {returnEligibleItems.length ? (
                  <>
                    <p className="mt-4 text-sm leading-6 text-[#BDBDBD]">Submit a return request for eligible delivered items within the policy window.</p>
                    <Button type="button" className="mt-4 w-full" onClick={() => setReturnModalOpen(true)}>
                      Request Return
                    </Button>
                  </>
                ) : returnSupportedItems.length && returnExpiryMs ? (
                  <p className="mt-4 text-sm leading-6 text-[#888888]">
                    Return window expired on {new Date(returnExpiryMs).toLocaleDateString("en-IN")}.
                  </p>
                ) : (
                  <p className="mt-4 text-sm leading-6 text-[#888888]">Returns not accepted for this order.</p>
                )}
              </div>

              <div className="rounded-3xl border border-[#1F1F1F] bg-[#111111] p-5">
                <p className="text-sm font-semibold uppercase tracking-[0.16em] text-[#A5B4FC]">Request Exchange</p>
                {exchangeEligibleItems.length ? (
                  <>
                    <p className="mt-4 text-sm leading-6 text-[#BDBDBD]">Choose a replacement variant for an eligible item while the exchange window is still open.</p>
                    <Button type="button" className="mt-4 w-full" onClick={() => setExchangeModalOpen(true)}>
                      Request Exchange
                    </Button>
                  </>
                ) : exchangeSupportedItems.length && exchangeExpiryMs ? (
                  <p className="mt-4 text-sm leading-6 text-[#888888]">
                    Exchange window expired on {new Date(exchangeExpiryMs).toLocaleDateString("en-IN")}.
                  </p>
                ) : (
                  <p className="mt-4 text-sm leading-6 text-[#888888]">Exchanges not accepted for this order.</p>
                )}
              </div>
            </div>
          </section>
        ) : null}
        <CancelOrderModal
          isOpen={cancelOpen}
          orderId={order._id}
          orderNumber={order.orderNumber}
          loading={loadingAction}
          onClose={() => setCancelOpen(false)}
          onConfirm={(payload) => {
            setCancelOpen(false);
            void runCancellation(payload);
          }}
        />
        <ReturnExchangeRequestModal
          isOpen={returnModalOpen}
          type="return"
          order={order}
          onClose={() => setReturnModalOpen(false)}
          onSubmitted={() => refetch()}
        />
        <ReturnExchangeRequestModal
          isOpen={exchangeModalOpen}
          type="exchange"
          order={order}
          onClose={() => setExchangeModalOpen(false)}
          onSubmitted={() => refetch()}
        />
      </main>
    </PageShell>
  );
}

export function ProfilePageScreen() {
  const searchParams = useSearchParams();
  const { confirm } = useConfirmModal();
  const [tab, setTab] = useState<"profile" | "addresses" | "orders" | "seller" | "security">("profile");
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingAddress, setEditingAddress] = useState<Address | null>(null);
  const [vendorOpen, setVendorOpen] = useState(false);
  const [resendingVerification, setResendingVerification] = useState(false);
  const [verificationCooldown, setVerificationCooldown] = useState(0);

  const { data: profile, loading, error, refetch } = useApi<Profile | null>("/api/user/profile", null);
  const { data: addresses, loading: addressesLoading, error: addressesError, refetch: refetchAddresses } = useApi<Address[]>(
    "/api/user/address",
    [],
  );
  const { data: ordersData } = useApi<{ orders: Order[]; total: number }>("/api/orders", { orders: [], total: 0 });
  const { data: sellerStatus, refetch: refetchSellerStatus } = useApi<{
    status: "not_logged_in" | "none" | "pending" | "approved" | "rejected";
    seller?: {
      shopName?: string;
      appliedAt?: string;
      approvedAt?: string;
      rejectionReason?: string;
      shopSlug?: string;
    };
  }>("/api/seller/apply", { status: "none" });

  const profileForm = useForm({
    resolver: zodResolver(profileFormSchema),
    defaultValues: { name: "", phone: "", dateOfBirth: "", genderPreference: "unisex" as const },
  });
  const passwordForm = useForm({
    defaultValues: { currentPassword: "", newPassword: "", confirmPassword: "" },
  });

  useEffect(() => {
    if (searchParams?.get("verification") === "required") {
      setTab("profile");
    }
  }, [searchParams]);

  useEffect(() => {
    setVerificationCooldown(profile?.verificationResendCooldown || 0);
  }, [profile?.verificationResendCooldown]);

  useEffect(() => {
    if (!verificationCooldown) return;
    const timer = window.setTimeout(() => setVerificationCooldown((current) => Math.max(0, current - 1)), 1000);
    return () => window.clearTimeout(timer);
  }, [verificationCooldown]);

  useEffect(() => {
    if (profile) {
      profileForm.reset({
        name: profile.name || "",
        phone: profile.phone || "",
        dateOfBirth: profile.dateOfBirth ? String(profile.dateOfBirth).slice(0, 10) : "",
        genderPreference: profile.genderPreference || "unisex",
      });
    }
  }, [profile, profileForm]);

  const saveProfile = profileForm.handleSubmit(async (values) => {
    const response = await fetch("/api/user/profile", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(values),
    });
    const json = (await response.json()) as { success: boolean; message?: string };
    if (!response.ok || !json.success) {
      toast.error(json.message || "Failed to update profile");
      return;
    }
    toast.success(json.message || "Profile updated");
    await refetch();
  });

  const saveAddress = async (values: AddressFormData) => {
    const response = await fetch(
      editingAddress ? `/api/user/address/${editingAddress._id}` : "/api/user/address",
      {
        method: editingAddress ? "PUT" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          label: values.addressType,
          ...values,
        }),
      },
    );
    const json = (await response.json()) as { success: boolean; message?: string };
    if (!response.ok || !json.success) {
      toast.error(json.message || "Failed to save address");
      return;
    }
    toast.success(json.message || "Address saved");
    setShowAddForm(false);
    setEditingAddress(null);
    await Promise.all([refetchAddresses(), refetch()]);
  };

  const updatePassword = passwordForm.handleSubmit(async (values) => {
    const response = await fetch("/api/user/password", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(values),
    });
    const json = (await response.json()) as { success: boolean; message?: string };
    if (!response.ok || !json.success) {
      toast.error(json.message || "Failed to update password");
      return;
    }
    toast.success(json.message || "Password updated");
    passwordForm.reset();
  });

  const setDefaultAddress = async (addressId: string) => {
    const response = await fetch(`/api/user/address/${addressId}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ isDefault: true }),
    });
    const json = (await response.json()) as { success: boolean; message?: string };
    if (!response.ok || !json.success) {
      toast.error(json.message || "Failed to set default address");
      return;
    }
    toast.success(json.message || "Default address updated");
    await Promise.all([refetchAddresses(), refetch()]);
  };

  const resendVerificationCode = useDebounceCallback(async () => {
    if (!profile?.email || verificationCooldown > 0) return;

    setResendingVerification(true);
    try {
      const response = await fetch("/api/auth/resend-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: profile.email }),
      });
      const json = (await response.json()) as { success: boolean; message?: string; data?: { cooldownSeconds?: number }; retryAfterSeconds?: number };
      if (!response.ok || !json.success) {
        if (response.status === 429) {
          setVerificationCooldown(json.retryAfterSeconds || 60);
        }
        throw new Error(json.message || "Could not resend code");
      }
      setVerificationCooldown(json.data?.cooldownSeconds || 60);
      toast.success(json.message || "Verification code sent");
      await refetch();
    } catch (errorValue) {
      toast.error(errorValue instanceof Error ? errorValue.message : "Could not resend code");
    } finally {
      setResendingVerification(false);
    }
  }, 1000);

  const deleteAddress = async (addressId: string) => {
    const target = addresses.find((address) => address._id === addressId) || null;
    if (!target) {
      return;
    }

    await confirm({
      title: "Delete address?",
      message: "This address will be permanently deleted.",
      confirmText: "Delete",
      variant: "danger",
      action: async () => {
        const response = await fetch(`/api/user/address/${target._id}`, { method: "DELETE" });
        const json = (await response.json()) as { success: boolean; message?: string };
        if (!response.ok || !json.success) {
          toast.error(json.message || "Failed to remove address");
          throw new Error(json.message || "Failed to remove address");
        }
        toast.success(json.message || "Address removed");
        if (editingAddress?._id === target._id) {
          setEditingAddress(null);
          setShowAddForm(false);
        }
        await Promise.all([refetchAddresses(), refetch()]);
      },
    });
  };

  if (loading) {
    return (
      <PageShell>
        <main className="mx-auto max-w-7xl px-4 py-12">
          <ProfileSkeleton />
        </main>
      </PageShell>
    );
  }

  if (error || !profile) {
    return (
      <PageShell>
        <main className="mx-auto max-w-7xl px-4 py-12">
          <EmptyState title="Profile unavailable" description={error || "We couldn't load your profile."} />
        </main>
      </PageShell>
    );
  }

  return (
    <PageShell>
      <main className="mx-auto max-w-7xl space-y-8 px-4 py-12 sm:px-6 lg:px-8">
        <SectionHeading eyebrow="Account" title="Profile" />
        <div className="grid gap-8 lg:grid-cols-[240px,1fr]">
          <aside className="h-fit rounded-3xl border border-[#1F1F1F] bg-[#111111] p-4">
            {["profile", "addresses", "orders", "seller", "security"].map((item) => (
              <button
                key={item}
                type="button"
                onClick={() => setTab(item as "profile" | "addresses" | "orders" | "seller" | "security")}
                className={
                  tab === item
                    ? "flex w-full items-center rounded-2xl bg-[#4F46E5]/14 px-4 py-3 text-left text-sm font-semibold capitalize text-[#C7D2FE]"
                    : "flex w-full items-center rounded-2xl px-4 py-3 text-left text-sm font-semibold capitalize text-[#BDBDBD]"
                }
              >
                {item === "profile" ? "Personal Info" : item}
              </button>
            ))}
          </aside>

            <div className="rounded-3xl border border-[#1F1F1F] bg-[#111111] p-5 sm:p-6">
              {tab === "profile" ? (
                <form onSubmit={saveProfile} className="space-y-5">
                  {!profile.isVerified ? (
                    <div className="rounded-2xl border border-[#6366F1]/20 bg-[#4F46E5]/10 p-4">
                      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                        <div>
                          <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[#A5B4FC]">Verification required</p>
                          <p className="mt-2 text-sm text-[#E7E5E4]">{profile.email}</p>
                        </div>
                        <div className="flex flex-wrap gap-2">
                          <Link href={`/verify-email?email=${encodeURIComponent(profile.email)}`} className="rounded-full bg-[linear-gradient(135deg,#4F46E5_0%,#4338CA_100%)] px-4 py-2 text-xs font-semibold uppercase tracking-[0.14em] text-[#F8FAFC]">
                            Enter Code
                          </Link>
                          <button
                            type="button"
                            onClick={() => void resendVerificationCode()}
                            disabled={resendingVerification || verificationCooldown > 0}
                            className="rounded-full border border-white/12 px-4 py-2 text-xs font-semibold uppercase tracking-[0.14em] text-[#E7E5E4] disabled:cursor-not-allowed disabled:opacity-50"
                          >
                            {resendingVerification ? "Sending" : verificationCooldown > 0 ? `Resend ${verificationCooldown}s` : "Resend Code"}
                          </button>
                        </div>
                      </div>
                    </div>
                  ) : null}
                  <Field label="Full Name">
                    <TextInput leftPad={false} {...profileForm.register("name")} />
                  </Field>
                <Field label="Email">
                  <div className="flex items-center gap-3">
                    <TextInput leftPad={false} value={profile.email} readOnly />
                    <span className={profile.isVerified ? "rounded-full bg-green-500/15 px-3 py-2 text-xs font-semibold text-green-300" : "rounded-full bg-white/8 px-3 py-2 text-xs font-semibold text-[#B8C0D9]"}>
                      {profile.isVerified ? "Verified" : "Unverified"}
                    </span>
                  </div>
                </Field>
                <Field label="Phone Number">
                  <div className="flex items-center gap-3">
                    <span className="rounded-lg border border-[#1F1F1F] bg-[#0A0A0A] px-4 py-3 text-sm text-[#888888]">+91</span>
                    <TextInput leftPad={false} {...profileForm.register("phone")} />
                  </div>
                </Field>
                <Field label="Date of Birth">
                  <TextInput leftPad={false} type="date" {...profileForm.register("dateOfBirth")} />
                </Field>
                <div className="space-y-2">
                  <span className="text-sm text-[#888888]">Gender Preference</span>
                  <div className="flex gap-3">
                    {(["men", "women", "unisex"] as const).map((item) => (
                      <button
                        key={item}
                        type="button"
                        onClick={() => profileForm.setValue("genderPreference", item)}
                        className={
                          profileForm.watch("genderPreference") === item
                  ? "rounded-full bg-[#4F46E5]/14 px-4 py-2 text-sm font-semibold text-[#C7D2FE]"
                            : "rounded-full border border-[#1F1F1F] px-4 py-2 text-sm font-semibold text-[#888888]"
                        }
                      >
                        {item}
                      </button>
                    ))}
                  </div>
                </div>
                <Button type="submit" loading={profileForm.formState.isSubmitting} loadingText="Saving..." className="w-full">
                  Save Changes
                </Button>
              </form>
            ) : null}

            {tab === "addresses" ? (
              <div className="space-y-6">
                {!profile.isVerified ? (
                  <div className="rounded-2xl border border-[#6366F1]/20 bg-[#4F46E5]/10 p-5">
                    <p className="text-sm uppercase tracking-[0.18em] text-[#A5B4FC]">Verification required</p>
                    <p className="mt-2 text-sm text-[#D1D5DB]">Verify your email before managing addresses.</p>
                    <div className="mt-4 flex flex-wrap gap-2">
                      <Link href={`/verify-email?email=${encodeURIComponent(profile.email)}`} className="rounded-full bg-[linear-gradient(135deg,#4F46E5_0%,#4338CA_100%)] px-4 py-2 text-xs font-semibold uppercase tracking-[0.14em] text-[#F8FAFC]">
                        Enter Code
                      </Link>
                      <button
                        type="button"
                        onClick={() => void resendVerificationCode()}
                        disabled={resendingVerification || verificationCooldown > 0}
                        className="rounded-full border border-white/12 px-4 py-2 text-xs font-semibold uppercase tracking-[0.14em] text-[#E7E5E4] disabled:cursor-not-allowed disabled:opacity-50"
                      >
                        {resendingVerification ? "Sending" : verificationCooldown > 0 ? `Resend ${verificationCooldown}s` : "Resend Code"}
                      </button>
                    </div>
                  </div>
                ) : null}
                {addressesLoading ? (
                  <div className="space-y-3">
                    {Array.from({ length: 2 }).map((_, index) => (
                      <AddressCardSkeleton key={index} />
                    ))}
                  </div>
                ) : null}

                {addressesError ? (
                  <EmptyState
                    compact
                    title="Addresses unavailable"
                    description={addressesError}
                    action={
                      <Button type="button" onClick={() => void refetchAddresses()}>
                        Retry
                      </Button>
                    }
                  />
                ) : null}

                {profile.isVerified && !addressesLoading && !addressesError ? (
                  <div className="space-y-3">
                    {addresses.map((address) => (
                      <div
                        key={address._id}
                    className={address.isDefault ? "relative rounded-2xl border border-[#6366F1] bg-black/20 p-4" : "relative rounded-2xl border border-[#1F1F1F] bg-black/20 p-4"}
                      >
                        {address.isDefault ? (
                          <span className="absolute right-4 top-4 rounded-full bg-[#4F46E5]/14 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.16em] text-[#C7D2FE]">
                            Default
                          </span>
                        ) : null}
                        <span className="block text-[11px] font-semibold uppercase tracking-[0.18em] text-[#888888]">
                          {address.addressType || "Home"}
                        </span>
                        <p className="mt-2 text-base font-semibold text-white">{address.fullName}</p>
                        <p className="mt-2 text-sm leading-6 text-[#888888]">
                          {address.street}
                          {address.locality ? `, ${address.locality}` : ""}
                          <br />
                          {address.city}, {address.state} - {address.pincode}
                        </p>
                        <p className="mt-2 text-sm text-[#888888]">+91 {address.phone}</p>
                        <div className="mt-4 flex flex-wrap gap-2">
                          <button
                            type="button"
                            onClick={() => {
                              setEditingAddress(address);
                              setShowAddForm(true);
                            }}
                            className="rounded-lg border border-[#2A2A2A] px-3 py-2 text-xs font-semibold text-white"
                          >
                            Edit
                          </button>
                          {!address.isDefault ? (
                            <button
                              type="button"
                              onClick={() => void setDefaultAddress(address._id)}
                              className="rounded-lg border border-[#2A2A2A] px-3 py-2 text-xs font-semibold text-[#888888]"
                            >
                              Set Default
                            </button>
                          ) : null}
                          <button
                            type="button"
                            onClick={() => void deleteAddress(address._id)}
                            className="rounded-lg border border-[#EF4444] px-3 py-2 text-xs font-semibold text-[#EF4444]"
                          >
                            Delete
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : null}

                {profile.isVerified && !showAddForm ? (
                  <button
                    type="button"
                    onClick={() => {
                      setEditingAddress(null);
                      setShowAddForm(true);
                    }}
                    className="flex w-full items-center justify-center gap-2 rounded-2xl border-2 border-dashed border-[#2A2A2A] px-4 py-4 text-sm font-semibold text-[#888888]"
                  >
                    + Add New Address
                  </button>
                ) : null}

                {profile.isVerified && showAddForm ? (
                  <div className="rounded-3xl border border-[#1F1F1F] bg-black/20 p-5">
                    <h3 className="mb-5 text-lg font-semibold text-white">{editingAddress ? "Edit Address" : "Add New Address"}</h3>
                    <AddressForm
                      defaultValues={
                        editingAddress
                          ? {
                              fullName: editingAddress.fullName || "",
                              phone: editingAddress.phone || "",
                              street: editingAddress.street,
                              pincode: editingAddress.pincode,
                              locality: editingAddress.locality || "",
                              city: editingAddress.city,
                              state: editingAddress.state,
                              country: editingAddress.country,
                              landmark: editingAddress.landmark || "",
                              addressType: editingAddress.addressType || "Home",
                              isDefault: Boolean(editingAddress.isDefault),
                            }
                          : undefined
                      }
                      onSubmit={saveAddress}
                      onCancel={() => {
                        setShowAddForm(false);
                        setEditingAddress(null);
                      }}
                      submitLabel={editingAddress ? "Update Address" : "Save Address"}
                    />
                  </div>
                ) : null}
              </div>
            ) : null}

            {tab === "orders" ? (
              <div className="space-y-4">
                {ordersData.orders.length ? (
                  ordersData.orders.map((order) => (
                    <div key={order._id} className="rounded-2xl border border-[#1F1F1F] bg-black/20 p-4">
                      <div className="flex items-center justify-between gap-4">
                        <div>
                          <p className="text-sm text-[#888888]">#{order.orderNumber}</p>
                          <p className="text-lg font-semibold text-white">{new Date(order.createdAt).toLocaleDateString()}</p>
                        </div>
                    <Link href={`/orders/${order._id}`} className="text-sm font-semibold text-[#A5B4FC]">
                          View
                        </Link>
                      </div>
                    </div>
                  ))
                ) : (
                  <EmptyState compact title="No orders yet" />
                )}
              </div>
            ) : null}

            {tab === "seller" ? (
              <div className="space-y-5">
                {!profile.isVerified ? (
                  <div className="rounded-2xl border border-[#6366F1]/20 bg-[#4F46E5]/10 p-5">
                    <p className="text-sm uppercase tracking-[0.18em] text-[#A5B4FC]">Verification required</p>
                    <p className="mt-2 text-sm text-[#D1D5DB]">Verify your email before applying to sell on StyleHub.</p>
                    <div className="mt-4 flex flex-wrap gap-2">
                      <Link href={`/verify-email?email=${encodeURIComponent(profile.email)}`} className="rounded-full bg-[linear-gradient(135deg,#4F46E5_0%,#4338CA_100%)] px-4 py-2 text-xs font-semibold uppercase tracking-[0.14em] text-[#F8FAFC]">
                        Enter Code
                      </Link>
                      <button
                        type="button"
                        onClick={() => void resendVerificationCode()}
                        disabled={resendingVerification || verificationCooldown > 0}
                        className="rounded-full border border-white/12 px-4 py-2 text-xs font-semibold uppercase tracking-[0.14em] text-[#E7E5E4] disabled:cursor-not-allowed disabled:opacity-50"
                      >
                        {resendingVerification ? "Sending" : verificationCooldown > 0 ? `Resend ${verificationCooldown}s` : "Resend Code"}
                      </button>
                    </div>
                  </div>
                ) : null}
                {profile.isVerified && sellerStatus.status === "none" ? (
                  <div className="rounded-2xl border border-[#1F1F1F] bg-black/20 p-5">
              <p className="text-sm uppercase tracking-[0.18em] text-[#A5B4FC]">Become a Vendor</p>
                    <h3 className="mt-2 text-2xl font-bold text-white">Start selling on StyleHub</h3>
                    <Button type="button" className="mt-5" onClick={() => setVendorOpen(true)}>
                      Apply Now
                    </Button>
                  </div>
                ) : null}

                {profile.isVerified && sellerStatus.status === "pending" ? (
                  <div className="rounded-2xl border border-[#6366F1]/20 bg-[#4F46E5]/10 p-5">
                    <p className="text-sm uppercase tracking-[0.18em] text-[#C7D2FE]">Under review</p>
                    <h3 className="mt-2 text-2xl font-bold text-white">{sellerStatus.seller?.shopName}</h3>
                    <p className="mt-2 text-sm text-[#D1D5DB]">
                      Applied on {sellerStatus.seller?.appliedAt ? new Date(sellerStatus.seller.appliedAt).toLocaleDateString() : "-"}
                    </p>
                  </div>
                ) : null}

                {profile.isVerified && sellerStatus.status === "approved" ? (
                  <div className="rounded-2xl border border-green-500/20 bg-green-500/10 p-5">
                    <p className="text-sm uppercase tracking-[0.18em] text-green-300">Approved</p>
                    <h3 className="mt-2 text-2xl font-bold text-white">{sellerStatus.seller?.shopName}</h3>
                    <p className="mt-2 text-sm text-[#D1D5DB]">
                      Approved on {sellerStatus.seller?.approvedAt ? new Date(sellerStatus.seller.approvedAt).toLocaleDateString() : "-"}
                    </p>
                <Link href="/seller/dashboard" className="mt-5 inline-flex rounded-xl bg-[linear-gradient(135deg,#4F46E5_0%,#4338CA_100%)] px-4 py-2 text-sm font-semibold text-[#F8FAFC]">
                      Open Seller Dashboard
                    </Link>
                  </div>
                ) : null}

                {profile.isVerified && sellerStatus.status === "rejected" ? (
                  <div className="rounded-2xl border border-red-500/20 bg-red-500/10 p-5">
                    <p className="text-sm uppercase tracking-[0.18em] text-red-300">Rejected</p>
                    <h3 className="mt-2 text-2xl font-bold text-white">{sellerStatus.seller?.shopName}</h3>
                    <div className="mt-4 rounded-xl border border-[#1F1F1F] bg-[#0A0A0A] p-4 text-sm leading-7 text-[#D1D5DB]">
                      {sellerStatus.seller?.rejectionReason || "Application update needed."}
                    </div>
                    <Button type="button" className="mt-5" onClick={() => setVendorOpen(true)}>
                      Reapply
                    </Button>
                  </div>
                ) : null}
              </div>
            ) : null}

            {tab === "security" ? (
              <form onSubmit={updatePassword} className="space-y-5">
                <Field label="Current Password">
                  <TextInput leftPad={false} type="password" {...passwordForm.register("currentPassword")} />
                </Field>
                <Field label="New Password">
                  <TextInput leftPad={false} type="password" {...passwordForm.register("newPassword")} />
                </Field>
                <Field label="Confirm New Password">
                  <TextInput leftPad={false} type="password" {...passwordForm.register("confirmPassword")} />
                </Field>
                <Button type="submit" loading={passwordForm.formState.isSubmitting} loadingText="Updating...">
                  Update Password
                </Button>
              </form>
            ) : null}
          </div>
        </div>
        <VendorApplyModal
          isOpen={vendorOpen}
          onClose={() => {
            setVendorOpen(false);
            void refetchSellerStatus();
          }}
        />
      </main>
    </PageShell>
  );
}

export function WishlistPageScreen() {
  const router = useRouter();
  const { data: session, status, resolvedIsVerified, isVerificationSyncing } = useVerifiedSessionState();
  const items = useWishlistStore((state) => state.items);
  const remove = useWishlistStore((state) => state.remove);
  const addItem = useCartStore((state) => state.addItem);
  const [mounted] = useState(() => typeof window !== "undefined");
  const [verificationOpen, setVerificationOpen] = useState(false);
  const isVerifiedUser = Boolean(status === "authenticated" && resolvedIsVerified);

  return (
    <PageShell>
      <main className="mx-auto max-w-7xl space-y-8 px-4 py-12 sm:px-6 lg:px-8">
        <SectionHeading eyebrow="Saved" title="My Wishlist" />
        {!mounted ? (
          <ProductGridSkeleton count={8} />
        ) : items.length ? (
          <div className="grid grid-cols-2 gap-5 md:grid-cols-2 xl:grid-cols-4">
            {items.map((item) => (
              <div key={`${item.productId}-${item.variantId || ""}`} className="overflow-hidden rounded-3xl border border-[#1F1F1F] bg-[#111111]">
                <div className="relative aspect-[3/4] overflow-hidden bg-black/20">
                  <Image src={fallbackImage(item.image)} alt={item.title} fill className="object-cover" />
                </div>
                <div className="space-y-4 p-4">
                  <div>
                    <p className="text-xs uppercase tracking-[0.2em] text-[#888888]">{item.brand}</p>
                    <Link href={`/products/${item.slug}`} className="mt-1 block text-lg font-semibold">
                      {item.title}
                    </Link>
                    {item.size || item.color ? (
                      <p className="mt-2 text-sm text-[#888888]">
                        {item.size ? item.size : ""}
                        {item.size && item.color ? " / " : ""}
                        {item.color?.name || ""}
                      </p>
                    ) : null}
                    {item.variantId && item.variantAvailable === false ? (
                      <p className="mt-2 text-xs text-red-300">Selected variant is no longer available</p>
                    ) : null}
                  </div>
                  <div className="grid gap-3">
                    <Button
                      type="button"
                      onClick={() => {
                        if (!item.variantId) {
                          router.push(`/products/${item.slug}`);
                          return;
                        }
                        if (isVerificationSyncing) {
                          return;
                        }
                        if (!isVerifiedUser) {
                          setVerificationOpen(true);
                          return;
                        }
                        addItem({
                          productId: item.productId,
                          variantId: item.variantId,
                          slug: item.slug,
                          title: item.title,
                          image: item.image,
                          price: item.price,
                          discountPrice: item.discountPrice,
                          compareAtPrice: item.compareAtPrice,
                          qty: 1,
                          size: item.size,
                          color: item.color,
                          variantSku: item.variantSku,
                          maxQty: item.variantAvailable === false ? 0 : 10,
                        });
                      }}
                    >
                      {item.variantId ? "Move to Cart" : "Choose Variant"}
                    </Button>
                    <Button type="button" variant="secondary" onClick={() => remove(item.productId, item.variantId)}>
                      Remove
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <EmptyState
            title="Nothing saved yet"
            action={
                <Link href="/products" className="rounded-xl bg-[linear-gradient(135deg,#4F46E5_0%,#4338CA_100%)] px-4 py-2 text-sm font-semibold text-[#F8FAFC]">
                Discover products
              </Link>
            }
          />
        )}
        <VerificationRequiredModal
          isOpen={verificationOpen}
          onClose={() => setVerificationOpen(false)}
          description="Verify your email to move wishlist items into your cart."
        />
      </main>
    </PageShell>
  );
}

export function BecomeSellerPageScreen() {
  const { data: session, resolvedIsVerified, isVerificationSyncing } = useVerifiedSessionState();
  const router = useRouter();
  const form = useForm({ defaultValues: { shopName: "", description: "", gstNumber: "", bankAccount: "" } });
  const [verificationOpen, setVerificationOpen] = useState(false);
  const submit = form.handleSubmit(async (values) => {
    if (!session) {
      router.push("/login?callbackUrl=%2Fbecome-seller");
      return;
    }
    if (isVerificationSyncing) {
      return;
    }
    if (!resolvedIsVerified) {
      setVerificationOpen(true);
      return;
    }
    const response = await fetch("/api/seller/apply", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(values),
    });
    const json = (await response.json()) as { success: boolean; message?: string };
    if (!response.ok || !json.success) {
      toast.error(json.message || "Failed to submit application");
      return;
    }
    toast.success(json.message || "Application submitted");
    form.reset();
  });

  return (
    <PageShell>
      <main className="mx-auto grid max-w-7xl gap-10 px-4 py-12 sm:px-6 lg:grid-cols-[0.95fr,1.05fr] lg:px-8">
        <div className="space-y-6">
          <span className="inline-flex rounded-full bg-[#4F46E5]/14 px-4 py-2 text-xs font-bold uppercase tracking-[0.28em] text-[#C7D2FE]">
            Seller Program
          </span>
          <h1 className="text-4xl font-black uppercase sm:text-6xl">Turn Your Store Into A StyleHub Destination.</h1>
        </div>
        <form onSubmit={submit} className="space-y-5 rounded-[32px] border border-[#1F1F1F] bg-[#111111] p-6">
          <h2 className="text-2xl font-bold">Seller Application</h2>
          <TextInput label="Shop Name" required leftPad={false} placeholder="Urban Threads" {...form.register("shopName")} />
          <TextArea label="Brand Description" required placeholder="Brand, product focus, and style." {...form.register("description")} />
          <TextInput label="GST Number" leftPad={false} placeholder="22AAAAA0000A1Z5" {...form.register("gstNumber")} />
          <TextInput label="Primary Bank Account / UPI" required leftPad={false} placeholder="statebank@upi or 1234567890" {...form.register("bankAccount")} />
          <Button type="submit" loading={form.formState.isSubmitting}>
            Submit Application
          </Button>
        </form>
        <VerificationRequiredModal
          isOpen={verificationOpen}
          onClose={() => setVerificationOpen(false)}
          description="Verify your email to submit a seller application."
        />
      </main>
    </PageShell>
  );
}

