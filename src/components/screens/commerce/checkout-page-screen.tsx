"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { AlertTriangle, RefreshCcw, Trash2 } from "lucide-react";
import { toast } from "react-hot-toast";
import {
  Button,
  EmptyState,
  fallbackImage,
  PageShell,
  SectionHeading,
  type Profile,
  useApi,
} from "@/components/screens/shared";
import AddressForm, { type AddressFormData } from "@/components/ui/AddressForm";
import { useDebounceCallback } from "@/hooks/useDebounce";
import { useButtonLoading } from "@/hooks/useButtonLoading";
import { formatCurrency } from "@/lib/utils";
import { useCartStore } from "@/stores/cart-store";
import { useLoadingStore } from "@/stores/loading-store";

type CheckoutPaymentMethod = "upi" | "credit_card" | "cod";

type CheckoutPaymentDetails = {
  upi: {
    upiId: string;
  };
  creditCard: {
    cardholderName: string;
    cardNumber: string;
    expiryMonth: string;
    expiryYear: string;
    cvv: string;
  };
};

type InvalidCheckoutItem = {
  productId: string;
  productName: string;
  productSlug?: string;
  variantId?: string;
  size?: string;
  color?: string;
  reason:
    | "product_unavailable"
    | "product_inactive"
    | "variant_unavailable"
    | "out_of_stock"
    | "quantity_exceeds_stock"
    | "payment_method_unavailable"
    | "price_changed";
  availableStock?: number;
  currentPrice?: number;
  currentDiscountPrice?: number;
};

type CheckoutValidation = {
  canPlaceOrder: boolean;
  invalidItems: InvalidCheckoutItem[];
  validItems: Array<{
    productId: string;
    productName: string;
    productSlug?: string;
    variantId?: string;
    size?: string;
    color?: string;
    qty: number;
    maxQty: number;
    price: number;
    discountPrice: number;
    acceptedPayments?: {
      upi: boolean;
      creditCard: boolean;
      cod: boolean;
    };
  }>;
  subtotal: number;
  discount: number;
  couponId?: string | null;
  couponMessage?: string;
  couponError?: string;
  shippingFee: number;
  shippingReason?: string;
  total: number;
};

function cartKey(productId: string, size?: string, color?: string, variantId?: string) {
  return `${productId}__${variantId || ""}__${size || ""}__${color || ""}`;
}

function invalidReasonLabel(item: InvalidCheckoutItem) {
  switch (item.reason) {
    case "product_unavailable":
      return "Product no longer exists";
    case "product_inactive":
      return "Product is no longer active";
    case "variant_unavailable":
      return "Selected size/color is no longer available";
    case "out_of_stock":
      return "This variant is out of stock";
    case "quantity_exceeds_stock":
      return `Only ${item.availableStock ?? 0} left in stock`;
    case "payment_method_unavailable":
      return "Selected payment method is not available for this item";
    case "price_changed":
      return "Price changed since this item was added";
    default:
      return "This item needs attention";
  }
}

function getPaymentDetailsError(
  paymentMethod: CheckoutPaymentMethod,
  paymentDetails: CheckoutPaymentDetails,
) {
  if (paymentMethod === "upi") {
    return paymentDetails.upi.upiId.trim() ? "" : "UPI ID is required";
  }

  if (paymentMethod === "credit_card") {
    const { cardholderName, cardNumber, expiryMonth, expiryYear, cvv } = paymentDetails.creditCard;
    if (!cardholderName.trim()) return "Cardholder name is required";
    if (cardNumber.replace(/\s+/g, "").length < 12) return "Enter a valid card number";
    if (!/^(0[1-9]|1[0-2])$/.test(expiryMonth.trim())) return "Expiry month must be in MM format";
    if (!/^\d{2,4}$/.test(expiryYear.trim())) return "Expiry year must be in YY or YYYY format";
    if (!/^\d{3,4}$/.test(cvv.trim())) return "Enter a valid CVV";
  }

  return "";
}

function buildPaymentDetailsPayload(
  paymentMethod: CheckoutPaymentMethod,
  paymentDetails: CheckoutPaymentDetails,
) {
  if (paymentMethod === "upi") {
    return {
      upi: {
        upiId: paymentDetails.upi.upiId.trim(),
      },
    };
  }

  if (paymentMethod === "credit_card") {
    return {
      creditCard: {
        cardholderName: paymentDetails.creditCard.cardholderName.trim(),
        cardNumber: paymentDetails.creditCard.cardNumber.replace(/\s+/g, ""),
        expiryMonth: paymentDetails.creditCard.expiryMonth.trim(),
        expiryYear: paymentDetails.creditCard.expiryYear.trim(),
        cvv: paymentDetails.creditCard.cvv.trim(),
      },
    };
  }

  return undefined;
}

function formatCheckoutPaymentMethod(paymentMethod: CheckoutPaymentMethod) {
  switch (paymentMethod) {
    case "upi":
      return "UPI";
    case "credit_card":
      return "Credit Card";
    case "cod":
      return "Cash on Delivery";
    default:
      return paymentMethod;
  }
}

function getPaymentAvailabilityKey(paymentMethod: CheckoutPaymentMethod) {
  return paymentMethod === "credit_card" ? "creditCard" : paymentMethod;
}

export function CheckoutPageScreen() {
  const router = useRouter();
  const setLoading = useLoadingStore((state) => state.setLoading);
  const { loading: loginLoading, trigger: triggerLoginNav } = useButtonLoading();
  const { loading: verifyLoading, trigger: triggerVerifyNav } = useButtonLoading();
  const { loading: profileNavLoading, trigger: triggerProfileNav } = useButtonLoading();
  const { status } = useSession();
  const items = useCartStore((state) => state.items);
  const coupon = useCartStore((state) => state.coupon);
  const clearCart = useCartStore((state) => state.clearCart);
  const removeItem = useCartStore((state) => state.removeItem);
  const updateQty = useCartStore((state) => state.updateQty);
  const updateItemData = useCartStore((state) => state.updateItemData);
  const setCoupon = useCartStore((state) => state.setCoupon);
  const [step, setStep] = useState(1);
  const [selectedAddressId, setSelectedAddressId] = useState("");
  const [paymentMethod, setPaymentMethod] = useState<CheckoutPaymentMethod>("upi");
  const [paymentDetails, setPaymentDetails] = useState<CheckoutPaymentDetails>({
    upi: {
      upiId: "",
    },
    creditCard: {
      cardholderName: "",
      cardNumber: "",
      expiryMonth: "",
      expiryYear: "",
      cvv: "",
    },
  });
  const [placing, setPlacing] = useState(false);
  const [validation, setValidation] = useState<CheckoutValidation | null>(null);
  const idempotencyKeyRef = useRef(
    typeof crypto !== "undefined" && "randomUUID" in crypto
      ? crypto.randomUUID()
      : `${Date.now()}-${Math.random().toString(36).slice(2)}`,
  );
  const [validationLoading, setValidationLoading] = useState(false);
  const [validationError, setValidationError] = useState("");
  const {
    data: profile,
    loading: profileLoading,
    error: profileError,
    refetch,
  } = useApi<Profile | null>(
    status === "authenticated" ? "/api/user/profile" : null,
    null,
  );
  const clientSubtotal = items.reduce((sum, item) => sum + item.discountPrice * item.qty, 0);
  const { data: shippingConfig } = useApi<{
    shippingFee: number;
    freeShippingThreshold: number;
    completedOrders: number;
    reason?: string;
  }>(
    `/api/store-config/shipping?subtotal=${clientSubtotal}`,
    {
      shippingFee: clientSubtotal >= 499 || clientSubtotal === 0 ? 0 : 49,
      freeShippingThreshold: 499,
      completedOrders: 0,
    },
  );

  const invalidItems = validation?.invalidItems ?? [];
  const verificationRequired = status === "authenticated" && profile?.isVerified === false;
  const invalidItemMap = useMemo(
    () =>
      new Map(
        invalidItems.map((item) => [
          cartKey(item.productId, item.size, item.color, item.variantId),
          item,
        ]),
      ),
    [invalidItems],
  );

  const subtotal = validation?.subtotal ?? clientSubtotal;
  const shipping = validation && !invalidItems.length ? validation.shippingFee : shippingConfig.shippingFee;
  const discount = coupon ? validation?.discount ?? coupon.discount : 0;
  const total = Math.max(0, subtotal + shipping - discount);
  const availablePayments = useMemo(
    () =>
      items.reduce(
        (acc, item) => ({
          upi: acc.upi && (item.acceptedPayments?.upi ?? true),
          creditCard: acc.creditCard && (item.acceptedPayments?.creditCard ?? true),
          cod: acc.cod && (item.acceptedPayments?.cod ?? true) && total <= 5000,
        }),
        { upi: true, creditCard: true, cod: true },
      ),
    [items, total],
  );
  const paymentDetailsError = useMemo(
    () => getPaymentDetailsError(paymentMethod, paymentDetails),
    [paymentDetails, paymentMethod],
  );

  const runCheckoutValidation = useCallback(
    async (options?: { silent?: boolean }) => {
      if (status !== "authenticated" || !items.length) {
        setValidation(null);
        setValidationError("");
        return null;
      }
      if (profile?.isVerified === false) {
        setValidation(null);
        setValidationError("Verify your email to continue with checkout.");
        return null;
      }

      setValidationLoading(true);

      try {
        const response = await fetch("/api/orders/validate", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            idempotencyKey: idempotencyKeyRef.current,
            items: items.map((item) => ({
              productId: item.productId,
              variantId: item.variantId,
              qty: item.qty,
              size: item.size,
              color: item.color?.name,
              clientPrice: item.price,
              clientDiscountPrice: item.discountPrice,
            })),
            shippingAddressId: selectedAddressId || undefined,
            paymentMethod,
            paymentDetails: buildPaymentDetailsPayload(paymentMethod, paymentDetails),
            couponCode: coupon?.code,
            couponId: coupon?.couponId,
          }),
        });
        const json = (await response.json()) as {
          success: boolean;
          message?: string;
          data?: CheckoutValidation;
        };

        if (!response.ok || !json.success || !json.data) {
          throw new Error(json.message || "Could not validate checkout");
        }

        setValidation(json.data);
        setValidationError("");

        json.data.validItems.forEach((validItem) => {
          const local = items.find(
            (item) =>
              cartKey(item.productId, item.size, item.color?.name, item.variantId) ===
              cartKey(validItem.productId, validItem.size, validItem.color, validItem.variantId),
          );

          if (
            local &&
            (local.price !== validItem.price ||
              local.discountPrice !== validItem.discountPrice ||
              local.maxQty !== validItem.maxQty ||
              JSON.stringify(local.acceptedPayments) !== JSON.stringify(validItem.acceptedPayments))
          ) {
            updateItemData(validItem.productId, validItem.size, validItem.color, {
              price: validItem.price,
              discountPrice: validItem.discountPrice,
              compareAtPrice: validItem.price,
              maxQty: validItem.maxQty,
              acceptedPayments: validItem.acceptedPayments,
              variantId: validItem.variantId,
            }, validItem.variantId);
          }
        });

        if (coupon) {
          if (json.data.couponError) {
            setCoupon(null);
          } else if (
            json.data.couponId &&
            (json.data.discount !== coupon.discount || json.data.couponId !== coupon.couponId)
          ) {
            setCoupon({
              code: coupon.code,
              discount: json.data.discount,
              couponId: json.data.couponId,
            });
          }
        }

        return json.data;
      } catch (error) {
        const message = error instanceof Error ? error.message : "Could not validate checkout";
        setValidationError(message);
        if (!options?.silent) {
          toast.error(message);
        }
        return null;
      } finally {
        setValidationLoading(false);
      }
    },
    [coupon, items, paymentDetails, paymentMethod, selectedAddressId, setCoupon, status, updateItemData],
  );

  useEffect(() => {
    if (status === "unauthenticated") {
      router.replace("/login?callbackUrl=%2Fcheckout");
    }
  }, [router, status]);

  useEffect(() => {
    if (profile?.addresses?.length && !selectedAddressId) {
      setSelectedAddressId(
        profile.addresses.find((address) => address.isDefault)?._id ||
          profile.addresses[0]._id,
      );
    }
  }, [profile?.addresses, selectedAddressId]);

  useEffect(() => {
    const available = (["upi", "credit_card", "cod"] as const).filter(
      (method) => availablePayments[getPaymentAvailabilityKey(method)],
    );
    if (available.length === 1) {
      setPaymentMethod(available[0]);
    } else if (!availablePayments[getPaymentAvailabilityKey(paymentMethod)] && available[0]) {
      setPaymentMethod(available[0]);
    }
  }, [availablePayments, paymentMethod]);

  useEffect(() => {
    void runCheckoutValidation({ silent: true });
  }, [runCheckoutValidation]);

  const saveAddress = async (values: AddressFormData) => {
    const response = await fetch("/api/user/address", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        fullName: values.fullName,
        phone: values.phone,
        street: values.street,
        pincode: values.pincode,
        locality: values.locality,
        city: values.city,
        state: values.state,
        country: values.country || "India",
        landmark: values.landmark || "",
        label: values.addressType || "Home",
        addressType: values.addressType || "Home",
        isDefault: values.isDefault || false,
      }),
    });
    const json = (await response.json()) as { success: boolean; message?: string };
    if (!response.ok || !json.success) {
      toast.error(json.message || "Failed to save address");
      return;
    }
    toast.success(json.message || "Address saved");
    await refetch();
    setStep(2);
  };

  const handleRemoveInvalidItem = (item: InvalidCheckoutItem) => {
    removeItem(item.productId, item.size, item.color, item.variantId);
  };

  const handleReduceQuantity = (item: InvalidCheckoutItem) => {
    if (!item.availableStock || item.availableStock < 1) return;
    updateQty(item.productId, item.size, item.color, item.availableStock, item.variantId);
  };

  const placeOrder = useDebounceCallback(async () => {
    if (!selectedAddressId) {
      toast.error("Select a delivery address first");
      return;
    }
    if (verificationRequired) {
      toast.error("Verify your email to continue with checkout");
      return;
    }
    if (paymentDetailsError) {
      toast.error(paymentDetailsError);
      return;
    }

    const latestValidation = await runCheckoutValidation({ silent: false });
    if (!latestValidation || !latestValidation.canPlaceOrder) {
      toast.error("Resolve unavailable items before placing your order");
      return;
    }

    setPlacing(true);

    try {
      const orderResponse = await fetch("/api/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          items: items.map((item) => ({
            productId: item.productId,
            variantId: item.variantId,
            qty: item.qty,
            size: item.size,
            color: item.color?.name,
            clientPrice: item.price,
            clientDiscountPrice: item.discountPrice,
          })),
          shippingAddressId: selectedAddressId,
          paymentMethod,
          paymentDetails: buildPaymentDetailsPayload(paymentMethod, paymentDetails),
          couponCode: coupon?.code,
          couponId: coupon?.couponId,
        }),
      });
      const orderJson = (await orderResponse.json()) as {
        success: boolean;
        data?: { _id?: string; id?: string; alreadyExisted?: boolean };
        message?: string;
        code?: string;
        invalidItems?: InvalidCheckoutItem[];
      };
      const orderId = orderJson.data?._id || orderJson.data?.id;

      if (!orderResponse.ok || !orderJson.success || !orderId) {
        if (orderJson.invalidItems?.length) {
          setValidation((current) => ({
            ...(current || {
              canPlaceOrder: false,
              invalidItems: [],
              validItems: [],
              subtotal,
              discount,
              shippingFee: shipping,
              total,
            }),
            canPlaceOrder: false,
            invalidItems: orderJson.invalidItems || [],
          }));
        }
        throw new Error(orderJson.message || "Failed to place order");
      }

      if (paymentMethod === "cod") {
        clearCart();
        router.push(`/orders/${orderId}?success=true`);
        return;
      }

      if (paymentMethod === "upi" || paymentMethod === "credit_card") {
        clearCart();
        toast.success("Order placed. Payment is pending manual review.");
        router.push(`/orders/${orderId}?success=true`);
        return;
      }
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to place order");
    } finally {
      setPlacing(false);
    }
  }, 2000);

  if (status === "loading" || (status === "authenticated" && profileLoading && !profile)) {
    return (
      <PageShell>
        <main className="mx-auto max-w-7xl space-y-8 px-4 py-12 sm:px-6 lg:px-8">
          <SectionHeading eyebrow="Checkout" title="Secure Checkout" />
          <div className="grid gap-8 lg:grid-cols-[1fr,380px]">
            <div className="space-y-6">
              <div className="h-14 animate-pulse rounded-full border border-[#1F1F1F] bg-[#111111]" />
              <div className="h-[420px] animate-pulse rounded-3xl border border-[#1F1F1F] bg-[#111111]" />
            </div>
            <aside className="h-[320px] animate-pulse rounded-3xl border border-[#1F1F1F] bg-[#111111]" />
          </div>
        </main>
      </PageShell>
    );
  }

  if (status === "unauthenticated") {
    return (
      <PageShell>
        <main className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
          <EmptyState
            title="Sign in required"
            action={
              <Button type="button" loading={loginLoading} loadingText="Loading..." onClick={() => void triggerLoginNav(async () => { setLoading(true); router.push("/login?callbackUrl=%2Fcheckout"); })}>
                Sign In
              </Button>
            }
          />
        </main>
      </PageShell>
    );
  }

  if (status === "authenticated" && profileError && !profile) {
    return (
      <PageShell>
        <main className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
          <EmptyState
            title="Checkout unavailable"
            description={profileError}
            action={
              <Button type="button" onClick={() => void refetch()}>
                Retry
              </Button>
            }
          />
        </main>
      </PageShell>
    );
  }

  return (
    <PageShell>
      <main className="mx-auto max-w-7xl space-y-8 px-4 py-12 sm:px-6 lg:px-8">
        <SectionHeading eyebrow="Checkout" title="Secure Checkout" />

        {verificationRequired ? (
          <div className="rounded-3xl border border-[#6366F1]/25 bg-[#4F46E5]/10 p-5">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="text-sm font-bold uppercase tracking-[0.18em] text-[#A5B4FC]">Verification required</p>
                <p className="mt-2 text-sm leading-6 text-[#E7E5E4]">
                  Verify your email before placing orders.
                </p>
              </div>
              <div className="flex flex-wrap gap-2">
                <Button type="button" loading={verifyLoading} loadingText="Loading..." onClick={() => void triggerVerifyNav(async () => { setLoading(true); router.push(`/verify-email?email=${encodeURIComponent(profile?.email || "")}`); })}>
                  Enter Code
                </Button>
                <Button type="button" variant="secondary" loading={profileNavLoading} loadingText="Loading..." onClick={() => void triggerProfileNav(async () => { setLoading(true); router.push("/profile?verification=required"); })}>
                  Open Profile
                </Button>
              </div>
            </div>
          </div>
        ) : null}

        {invalidItems.length ? (
          <div className="rounded-3xl border border-[#EF4444]/25 bg-[#EF4444]/8 p-5">
            <div className="flex items-start gap-3">
              <div className="mt-0.5 rounded-full bg-[#EF4444]/12 p-2 text-[#EF4444]">
                <AlertTriangle className="h-4 w-4" />
              </div>
              <div className="space-y-2">
                <p className="text-sm font-bold uppercase tracking-[0.18em] text-[#EF4444]">
                  Checkout needs attention
                </p>
                <p className="text-sm leading-6 text-[#E2D7D7]">
                  Some items in your cart are no longer valid. Review the highlighted lines below before placing your order.
                </p>
                <div className="flex flex-wrap gap-2">
                  {invalidItems.map((item) => (
                    <span
                      key={cartKey(item.productId, item.size, item.color, item.variantId)}
                      className="rounded-full border border-[#EF4444]/25 bg-black/20 px-3 py-1 text-xs text-[#F5C2C2]"
                    >
                      {item.productName}: {invalidReasonLabel(item)}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          </div>
        ) : null}

        {validationError ? (
          <div className="rounded-2xl border border-[#6366F1]/20 bg-[#4F46E5]/10 px-4 py-3 text-sm text-[#D6DCFF]">
            {validationError}
          </div>
        ) : null}

        <div className="grid gap-8 lg:grid-cols-[1fr,380px]">
          <div className="space-y-6">
            <div className="flex flex-wrap gap-3">
              {[1, 2, 3].map((value) => (
                <button
                  key={value}
                  type="button"
                  onClick={() => setStep(value)}
                  className={
                    step === value
                      ? "rounded-full bg-[#4F46E5]/14 px-4 py-2 text-sm font-semibold text-[#C7D2FE]"
                      : "rounded-full border border-[#1F1F1F] px-4 py-2 text-sm font-semibold text-[#888888]"
                  }
                >
                  {value === 1
                    ? "Delivery Address"
                    : value === 2
                      ? "Payment Method"
                      : "Review & Place Order"}
                </button>
              ))}
            </div>

            {step === 1 ? (
              <div className="space-y-6 rounded-3xl border border-[#1F1F1F] bg-[#111111] p-5">
                {profile?.addresses?.length ? (
                  <div className="grid gap-4 md:grid-cols-2">
                    {profile.addresses.map((address) => (
                      <button
                        key={address._id}
                        type="button"
                        onClick={() => setSelectedAddressId(address._id)}
                        className={
                          selectedAddressId === address._id
                            ? "rounded-2xl border border-[#6366F1] p-4 text-left"
                            : "rounded-2xl border border-[#1F1F1F] p-4 text-left"
                        }
                      >
                        <p className="font-semibold">{address.fullName || "Saved address"}</p>
                        <p className="mt-2 text-sm text-[#BDBDBD]">
                          {address.street}
                          <br />
                          {address.locality ? `${address.locality}, ` : ""}
                          {address.city}, {address.state} {address.pincode}
                        </p>
                      </button>
                    ))}
                  </div>
                ) : (
                  <EmptyState compact title="No saved addresses" />
                )}
                <Button type="button" onClick={() => setStep(2)} disabled={!selectedAddressId || verificationRequired}>
                  Continue to Payment
                </Button>
                <div className="border-t border-[#1F1F1F] pt-6">
                  <AddressForm onSubmit={saveAddress} submitLabel="Continue to Payment" />
                </div>
              </div>
            ) : null}

            {step === 2 ? (
              <div className="space-y-4 rounded-3xl border border-[#1F1F1F] bg-[#111111] p-5">
                {(["upi", "credit_card", "cod"] as const).map((method) => {
                  const enabled = availablePayments[getPaymentAvailabilityKey(method)];
                  return (
                    <label
                      key={method}
                      className={
                        enabled
                          ? paymentMethod === method
                            ? "flex items-start gap-4 rounded-2xl border border-[#6366F1] p-4"
                            : "flex items-start gap-4 rounded-2xl border border-[#1F1F1F] p-4"
                          : "flex items-start gap-4 rounded-2xl border border-[#1F1F1F] p-4 opacity-50"
                      }
                      title={enabled ? "" : "Not available for all items in cart"}
                    >
                      <input
                        type="radio"
                        checked={paymentMethod === method}
                        onChange={() => enabled && setPaymentMethod(method)}
                        disabled={!enabled}
                        className="mt-1 h-4 w-4 accent-[#6366F1]"
                      />
                      <div>
                        <p className="font-medium">
                          {method === "upi"
                            ? "UPI"
                            : method === "credit_card"
                              ? "Credit Card"
                              : "Cash on Delivery"}
                        </p>
                        <p className="text-sm text-[#888888]">
                          {method === "upi"
                            ? "Pay using your UPI ID"
                            : method === "credit_card"
                              ? "Enter card details for manual verification"
                              : "Pay when you receive"}
                        </p>
                        {method === "cod" && total > 5000 ? (
                          <p className="mt-2 text-xs text-amber-300">
                            COD available up to Rs 5000
                          </p>
                        ) : null}
                        {!enabled ? (
                          <p className="mt-2 text-xs text-[#888888]">
                            Not available for all items in cart
                          </p>
                        ) : null}
                      </div>
                    </label>
                  );
                })}
                {paymentMethod === "upi" ? (
                  <div className="rounded-2xl border border-[#1F1F1F] bg-black/20 p-4">
                    <label className="block">
                      <span className="mb-2 block text-sm font-medium text-white">UPI ID</span>
                      <input
                        type="text"
                        value={paymentDetails.upi.upiId}
                        onChange={(event) =>
                          setPaymentDetails((current) => ({
                            ...current,
                            upi: { upiId: event.target.value },
                          }))
                        }
                        placeholder="yourname@bank"
                        className="h-11 w-full rounded-xl border border-[#1F1F1F] bg-[#0A0A0A] px-4 text-sm text-white outline-none"
                      />
                    </label>
                  </div>
                ) : null}
                {paymentMethod === "credit_card" ? (
                  <div className="grid gap-4 rounded-2xl border border-[#1F1F1F] bg-black/20 p-4 md:grid-cols-2">
                    <label className="block md:col-span-2">
                      <span className="mb-2 block text-sm font-medium text-white">Cardholder Name</span>
                      <input
                        type="text"
                        value={paymentDetails.creditCard.cardholderName}
                        onChange={(event) =>
                          setPaymentDetails((current) => ({
                            ...current,
                            creditCard: {
                              ...current.creditCard,
                              cardholderName: event.target.value,
                            },
                          }))
                        }
                        placeholder="Name on card"
                        className="h-11 w-full rounded-xl border border-[#1F1F1F] bg-[#0A0A0A] px-4 text-sm text-white outline-none"
                      />
                    </label>
                    <label className="block md:col-span-2">
                      <span className="mb-2 block text-sm font-medium text-white">Card Number</span>
                      <input
                        type="text"
                        inputMode="numeric"
                        value={paymentDetails.creditCard.cardNumber}
                        onChange={(event) =>
                          setPaymentDetails((current) => ({
                            ...current,
                            creditCard: {
                              ...current.creditCard,
                              cardNumber: event.target.value,
                            },
                          }))
                        }
                        placeholder="1234 5678 9012 3456"
                        className="h-11 w-full rounded-xl border border-[#1F1F1F] bg-[#0A0A0A] px-4 text-sm text-white outline-none"
                      />
                    </label>
                    <label className="block">
                      <span className="mb-2 block text-sm font-medium text-white">Expiry Month</span>
                      <input
                        type="text"
                        inputMode="numeric"
                        value={paymentDetails.creditCard.expiryMonth}
                        onChange={(event) =>
                          setPaymentDetails((current) => ({
                            ...current,
                            creditCard: {
                              ...current.creditCard,
                              expiryMonth: event.target.value,
                            },
                          }))
                        }
                        placeholder="MM"
                        className="h-11 w-full rounded-xl border border-[#1F1F1F] bg-[#0A0A0A] px-4 text-sm text-white outline-none"
                      />
                    </label>
                    <label className="block">
                      <span className="mb-2 block text-sm font-medium text-white">Expiry Year</span>
                      <input
                        type="text"
                        inputMode="numeric"
                        value={paymentDetails.creditCard.expiryYear}
                        onChange={(event) =>
                          setPaymentDetails((current) => ({
                            ...current,
                            creditCard: {
                              ...current.creditCard,
                              expiryYear: event.target.value,
                            },
                          }))
                        }
                        placeholder="YY"
                        className="h-11 w-full rounded-xl border border-[#1F1F1F] bg-[#0A0A0A] px-4 text-sm text-white outline-none"
                      />
                    </label>
                    <label className="block md:col-span-2">
                      <span className="mb-2 block text-sm font-medium text-white">CVV</span>
                      <input
                        type="password"
                        inputMode="numeric"
                        value={paymentDetails.creditCard.cvv}
                        onChange={(event) =>
                          setPaymentDetails((current) => ({
                            ...current,
                            creditCard: {
                              ...current.creditCard,
                              cvv: event.target.value,
                            },
                          }))
                        }
                        placeholder="123"
                        className="h-11 w-full rounded-xl border border-[#1F1F1F] bg-[#0A0A0A] px-4 text-sm text-white outline-none"
                      />
                    </label>
                  </div>
                ) : null}
                {paymentDetailsError ? (
                  <p className="text-sm text-[#F5C2C2]">{paymentDetailsError}</p>
                ) : null}
                {Object.values(availablePayments).filter(Boolean).length === 1 ? (
                  <p className="text-sm text-[#A5B4FC]">
                    {formatCheckoutPaymentMethod(paymentMethod)} is the only available option for this order.
                  </p>
                ) : null}
                <Button type="button" onClick={() => setStep(3)} disabled={verificationRequired || Boolean(paymentDetailsError)}>
                  Continue to Review
                </Button>
              </div>
            ) : null}

            {step === 3 ? (
              <div className="space-y-5 rounded-3xl border border-[#1F1F1F] bg-[#111111] p-5">
                {items.map((item) => {
                  const invalidItem = invalidItemMap.get(
                    cartKey(item.productId, item.size, item.color?.name, item.variantId),
                  );

                  return (
                    <div
                      key={cartKey(item.productId, item.size, item.color?.name, item.variantId)}
                      className={
                        invalidItem
                          ? "space-y-3 rounded-2xl border border-[#EF4444]/25 bg-[#EF4444]/6 p-3"
                          : "rounded-2xl border border-[#1F1F1F] bg-black/20 p-3"
                      }
                    >
                      <div className="flex items-center justify-between gap-4">
                        <div className="flex items-center gap-3">
                          <div className="relative h-16 w-14 overflow-hidden rounded-xl">
                            {item.image.includes("image.pollinations.ai") ? (
                              <img
                                src={fallbackImage(item.image)}
                                alt={item.title}
                                className="h-full w-full object-cover"
                              />
                            ) : (
                              <Image
                                src={fallbackImage(item.image)}
                                alt={item.title}
                                fill
                                className="object-cover"
                              />
                            )}
                          </div>
                          <div>
                            <p className="font-medium">{item.title}</p>
                            <p className="text-xs text-[#888888]">
                              Qty {item.qty}
                              {item.size ? ` / ${item.size}` : ""}
                              {item.color ? ` / ${item.color.name}` : ""}
                            </p>
                            {invalidItem ? (
                              <p className="mt-2 text-sm text-[#F5C2C2]">
                                {invalidReasonLabel(invalidItem)}
                              </p>
                            ) : null}
                          </div>
                        </div>
                        <span className="font-semibold text-[#C7D2FE]">
                          {formatCurrency(item.discountPrice * item.qty)}
                        </span>
                      </div>

                      {invalidItem ? (
                        <div className="flex flex-wrap gap-2">
                          <button
                            type="button"
                            onClick={() => handleRemoveInvalidItem(invalidItem)}
                            className="inline-flex items-center gap-2 rounded-full border border-[#EF4444]/30 px-3 py-1.5 text-xs font-semibold text-[#EF9A9A]"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                            Remove item
                          </button>
                          {invalidItem.reason === "quantity_exceeds_stock" &&
                          (invalidItem.availableStock || 0) > 0 ? (
                            <button
                              type="button"
                              onClick={() => handleReduceQuantity(invalidItem)}
                              className="inline-flex items-center gap-2 rounded-full border border-[#6366F1]/25 px-3 py-1.5 text-xs font-semibold text-[#A5B4FC]"
                            >
                              <RefreshCcw className="h-3.5 w-3.5" />
                              Reduce to {invalidItem.availableStock}
                            </button>
                          ) : null}
                          <button
                            type="button"
                            onClick={() => router.push(`/products/${item.slug}`)}
                            className="inline-flex items-center gap-2 rounded-full border border-white/10 px-3 py-1.5 text-xs font-semibold text-[#DDD6C8]"
                          >
                            Update variant
                          </button>
                        </div>
                      ) : null}
                    </div>
                  );
                })}

                {coupon && validation?.couponMessage ? (
                  <div className="rounded-2xl border border-[#6366F1]/20 bg-[#4F46E5]/10 px-4 py-3 text-sm text-[#D6DCFF]">
                    {validation.couponMessage}
                  </div>
                ) : null}

                <Button
                  type="button"
                  loading={placing}
                  loadingText={
                    paymentMethod === "cod"
                      ? "Placing order..."
                      : "Saving payment details..."
                  }
                  onClick={() => void placeOrder()}
                  className="w-full"
                  disabled={
                    placing ||
                    validationLoading ||
                    invalidItems.length > 0 ||
                    verificationRequired ||
                    Boolean(paymentDetailsError)
                  }
                >
                  {invalidItems.length
                    ? "Resolve Cart Issues To Continue"
                    : validationLoading
                      ? "Validating Checkout"
                      : "Place Order"}
                </Button>
              </div>
            ) : null}
          </div>

          <aside className="h-fit rounded-3xl border border-[#1F1F1F] bg-[#111111] p-5">
            <h3 className="text-lg font-bold">Order Summary</h3>
            <div className="mt-4 space-y-3 text-sm text-[#BDBDBD]">
              <div className="flex justify-between">
                <span>Items</span>
                <span>{items.reduce((sum, item) => sum + item.qty, 0)}</span>
              </div>
              <div className="flex justify-between">
                <span>Subtotal</span>
                <span>{formatCurrency(subtotal)}</span>
              </div>
              {coupon ? (
                <div className="flex items-center justify-between">
                  <span className="flex items-center gap-1.5 text-[#22C55E]">
                    Coupon {coupon.code}
                  </span>
                  <span className="font-semibold text-[#22C55E]">
                    -{formatCurrency(discount)}
                  </span>
                </div>
              ) : null}
              <div className="flex justify-between">
                <span>Shipping</span>
                <span>{shipping ? formatCurrency(shipping) : "Free"}</span>
              </div>
              <p className="text-xs text-[#666666]">
                {validation?.shippingReason || shippingConfig.reason || ""}
              </p>
              {invalidItems.length ? (
                <div className="rounded-2xl border border-[#EF4444]/20 bg-[#EF4444]/8 px-4 py-3 text-sm text-[#F5C2C2]">
                  {invalidItems.length} item{invalidItems.length > 1 ? "s are" : " is"} blocking checkout.
                </div>
              ) : null}
              <div className="flex justify-between border-t border-[#1F1F1F] pt-3 text-lg font-bold text-white">
                <span>Total</span>
                <span>{formatCurrency(total)}</span>
              </div>
            </div>
          </aside>
        </div>
      </main>
    </PageShell>
  );
}

