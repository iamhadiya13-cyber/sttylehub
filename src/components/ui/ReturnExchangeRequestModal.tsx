"use client";

import { useEffect, useMemo, useState } from "react";
import Image from "next/image";
import { X } from "lucide-react";
import { toast } from "react-hot-toast";
import { Button, TextInput, fallbackImage, type Order } from "@/components/screens/shared";

type RequestType = "return" | "exchange";

type Props = {
  isOpen: boolean;
  type: RequestType;
  order: Order;
  onClose: () => void;
  onSubmitted: () => Promise<void> | void;
};

const REASONS = [
  "Wrong size",
  "Damaged or defective",
  "Not as described",
  "Changed my mind",
  "Wrong item received",
  "Other",
] as const;

type RefundMethod = "bank" | "upi";

export default function ReturnExchangeRequestModal({ isOpen, type, order, onClose, onSubmitted }: Props) {
  const eligibleItems = useMemo(
    () =>
      order.items.filter((item) =>
        type === "return" ? item.product?.returnAllowed : item.product?.exchangeAllowed,
      ),
    [order.items, type],
  );
  const multiSelect = type === "return" && eligibleItems.length > 1;
  const [currentStep, setCurrentStep] = useState(0);
  const [selectedProductIds, setSelectedProductIds] = useState<string[]>([]);
  const [reason, setReason] = useState<(typeof REASONS)[number]>("Wrong size");
  const [customReason, setCustomReason] = useState("");
  const [evidenceImages, setEvidenceImages] = useState<string[]>([]);
  const [uploading, setUploading] = useState(false);
  const [refundMethod, setRefundMethod] = useState<RefundMethod>("bank");
  const [bankDetails, setBankDetails] = useState({
    accountHolderName: "",
    bankName: "",
    accountNumber: "",
    ifscCode: "",
    upiId: "",
  });
  const [exchangeVariantId, setExchangeVariantId] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const selectedItems = useMemo(
    () =>
      eligibleItems.filter((item) => {
        const productId = item.product?._id || "";
        return selectedProductIds.includes(productId);
      }),
    [eligibleItems, selectedProductIds],
  );

  const selectedExchangeItem = selectedItems[0];
  const exchangeVariants = selectedExchangeItem?.product?.variants || [];

  const steps = useMemo(() => {
    if (type === "return") {
      return [
        ...(multiSelect ? ["Select items"] : []),
        "Reason",
        "Photos",
        "Refund",
        "Confirm",
      ];
    }
    return [
      ...(eligibleItems.length > 1 ? ["Select item"] : []),
      "Reason",
      "Variant",
      "Photos",
      "Confirm",
    ];
  }, [eligibleItems.length, multiSelect, type]);

  useEffect(() => {
    if (!isOpen) {
      setCurrentStep(0);
      setSelectedProductIds([]);
      setReason("Wrong size");
      setCustomReason("");
      setEvidenceImages([]);
      setRefundMethod("bank");
      setBankDetails({
        accountHolderName: "",
        bankName: "",
        accountNumber: "",
        ifscCode: "",
        upiId: "",
      });
      setExchangeVariantId("");
      return;
    }

    setSelectedProductIds(eligibleItems[0]?.product?._id ? [eligibleItems[0].product._id] : []);

    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        onClose();
      }
    };

    window.addEventListener("keydown", handleEscape);
    return () => window.removeEventListener("keydown", handleEscape);
  }, [eligibleItems, isOpen, onClose]);

  const uploadEvidence = async (files: FileList | null) => {
    if (!files?.length) {
      return;
    }

    const remainingSlots = 3 - evidenceImages.length;
    if (remainingSlots <= 0) {
      toast.error("You can upload up to 3 images.");
      return;
    }

    setUploading(true);
    const uploaded: string[] = [];
    for (const file of Array.from(files).slice(0, remainingSlots)) {
      const formData = new FormData();
      formData.append("file", file);
      try {
        const response = await fetch("/api/upload/image", { method: "POST", body: formData });
        const json = (await response.json()) as { success?: boolean; data?: { url?: string }; message?: string };
        if (!response.ok || !json.success || !json.data?.url) {
          throw new Error(json.message || "Upload failed");
        }
        uploaded.push(json.data.url);
      } catch (error) {
        toast.error(error instanceof Error ? error.message : "Upload failed");
      }
    }

    if (uploaded.length) {
      setEvidenceImages((current) => [...current, ...uploaded].slice(0, 3));
    }
    setUploading(false);
  };

  const next = () => {
    if (type === "return" && multiSelect && currentStep === 0 && !selectedItems.length) {
      toast.error("Select at least one item.");
      return;
    }
    if (type === "exchange" && eligibleItems.length > 1 && currentStep === 0 && !selectedItems.length) {
      toast.error("Select an item.");
      return;
    }
    if ((multiSelect ? currentStep === 1 : currentStep === 0) && reason === "Other" && !customReason.trim()) {
      toast.error("Add your reason.");
      return;
    }
    if (type === "exchange" && currentStep === steps.indexOf("Variant") && !exchangeVariantId) {
      toast.error("Select a replacement variant.");
      return;
    }
    if (type === "return" && currentStep === steps.indexOf("Refund")) {
      if (refundMethod === "bank") {
        if (!bankDetails.accountHolderName || !bankDetails.bankName || !bankDetails.accountNumber || !bankDetails.ifscCode) {
          toast.error("Enter complete bank details.");
          return;
        }
      } else if (!bankDetails.upiId) {
        toast.error("Enter your UPI ID.");
        return;
      }
    }
    setCurrentStep((value) => Math.min(value + 1, steps.length - 1));
  };

  const submit = async () => {
    try {
      setSubmitting(true);
      const response = await fetch(`/api/orders/${order._id}/return-request`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type,
          items: selectedItems.map((item) => ({
            productId: item.product?._id,
            variantId: item.variantId || "",
          })),
          reason,
          customReason,
          evidenceImages,
          refundMethod:
            type === "return"
              ? {
                  type: refundMethod,
                  details:
                    refundMethod === "bank"
                      ? {
                          accountHolderName: bankDetails.accountHolderName,
                          bankName: bankDetails.bankName,
                          accountNumber: bankDetails.accountNumber,
                          ifscCode: bankDetails.ifscCode,
                        }
                      : { upiId: bankDetails.upiId },
                }
              : undefined,
          exchangeVariantId: type === "exchange" ? exchangeVariantId : undefined,
        }),
      });
      const json = (await response.json()) as { success?: boolean; message?: string };
      if (!response.ok || !json.success) {
        throw new Error(json.message || "Failed to submit request");
      }
      toast.success(json.message || "Request submitted");
      await onSubmitted();
      onClose();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to submit request");
    } finally {
      setSubmitting(false);
    }
  };

  if (!isOpen) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-[150] flex items-end justify-center bg-black/70 backdrop-blur-[4px] sm:items-center" onClick={onClose}>
      <div
        className="flex h-[92vh] w-full max-w-3xl flex-col overflow-hidden rounded-t-[28px] border border-white/10 bg-[#0D0D0F] text-white sm:h-auto sm:max-h-[88vh] sm:rounded-[28px]"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="flex items-center justify-between border-b border-white/10 px-5 py-4">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-[#A5B4FC]">
              {type === "return" ? "Return Request" : "Exchange Request"}
            </p>
            <p className="mt-1 text-sm text-white/60">Step {currentStep + 1} of {steps.length}: {steps[currentStep]}</p>
          </div>
          <button type="button" onClick={onClose} className="rounded-full border border-white/10 p-2 text-white/70">
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-5 py-5">
          {steps[currentStep] === "Select items" || steps[currentStep] === "Select item" ? (
            <div className="space-y-3">
              {eligibleItems.map((item) => {
                const productId = item.product?._id || "";
                const active = selectedProductIds.includes(productId);
                return (
                  <button
                    key={`${productId}-${item.variantId || item.title}`}
                    type="button"
                    onClick={() =>
                      setSelectedProductIds((current) =>
                        type === "return"
                          ? active
                            ? current.filter((value) => value !== productId)
                            : [...current, productId]
                          : [productId],
                      )
                    }
                    className={`flex w-full items-center gap-3 rounded-2xl border p-3 text-left ${
                      active ? "border-[#6366F1] bg-[#4F46E5]/10" : "border-white/10 bg-black/20"
                    }`}
                  >
                    <div className="relative h-16 w-14 overflow-hidden rounded-xl">
                      <Image src={fallbackImage(item.image || item.product?.images?.[0])} alt={item.title} fill className="object-cover" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="font-semibold text-white">{item.title}</p>
                      <p className="text-sm text-white/55">Qty {item.qty}{item.size ? ` · ${item.size}` : ""}{item.color ? ` · ${item.color}` : ""}</p>
                    </div>
                  </button>
                );
              })}
            </div>
          ) : null}

          {steps[currentStep] === "Reason" ? (
            <div className="space-y-3">
              {REASONS.map((item) => (
                <button
                  key={item}
                  type="button"
                  onClick={() => setReason(item)}
                  className={`block w-full rounded-2xl border px-4 py-3 text-left text-sm ${
                    reason === item ? "border-[#6366F1] bg-[#4F46E5]/10 text-white" : "border-white/10 bg-black/20 text-white/70"
                  }`}
                >
                  {item}
                </button>
              ))}
              {reason === "Other" ? (
                <TextInput
                  label="Custom reason"
                  leftPad={false}
                  placeholder="Tell us what happened"
                  value={customReason}
                  onChange={(event) => setCustomReason(event.target.value)}
                />
              ) : null}
            </div>
          ) : null}

          {steps[currentStep] === "Variant" ? (
            <div className="space-y-3">
              {exchangeVariants.length ? exchangeVariants.map((variant) => {
                const active = String(variant._id) === exchangeVariantId;
                const disabled = Number(variant.stock || 0) <= 0 || variant.isActive === false;
                return (
                  <button
                    key={String(variant._id)}
                    type="button"
                    disabled={disabled}
                    onClick={() => setExchangeVariantId(String(variant._id))}
                    className={`flex w-full items-center justify-between rounded-2xl border px-4 py-3 text-left ${
                      active ? "border-[#6366F1] bg-[#4F46E5]/10 text-white" : "border-white/10 bg-black/20 text-white/70"
                    } disabled:cursor-not-allowed disabled:opacity-45`}
                  >
                    <span>{variant.size}{variant.color?.name ? ` · ${variant.color.name}` : ""}</span>
                    <span className={disabled ? "text-red-300" : "text-emerald-300"}>{disabled ? "Out of stock" : `${variant.stock} available`}</span>
                  </button>
                );
              }) : <p className="text-sm text-white/55">No exchange variants available.</p>}
            </div>
          ) : null}

          {steps[currentStep] === "Photos" ? (
            <div className="space-y-4">
              <p className="text-sm text-white/60">Upload up to 3 photos. This is optional.</p>
              <div className="flex flex-wrap gap-3">
                {evidenceImages.map((image, index) => (
                  <div key={`${image}-${index}`} className="relative h-24 w-20 overflow-hidden rounded-xl border border-white/10">
                    <Image src={fallbackImage(image)} alt="Evidence" fill className="object-cover" />
                  </div>
                ))}
                {evidenceImages.length < 3 ? (
                  <label className="flex h-24 w-20 cursor-pointer items-center justify-center rounded-xl border border-dashed border-white/15 text-xs text-white/55">
                    {uploading ? "Uploading..." : "Add photo"}
                    <input type="file" accept="image/*" multiple className="hidden" onChange={(event) => void uploadEvidence(event.target.files)} />
                  </label>
                ) : null}
              </div>
            </div>
          ) : null}

          {steps[currentStep] === "Refund" ? (
            <div className="space-y-4">
              <p className="text-sm text-white/60">Your details are used only for this refund and are not stored permanently.</p>
              <div className="grid gap-2 sm:grid-cols-2">
                {(["bank", "upi"] as const).map((method) => (
                  <button
                    key={method}
                    type="button"
                    onClick={() => setRefundMethod(method)}
                    className={`rounded-2xl border px-4 py-3 text-left text-sm ${
                      refundMethod === method ? "border-[#6366F1] bg-[#4F46E5]/10 text-white" : "border-white/10 bg-black/20 text-white/70"
                    }`}
                  >
                    {method === "bank" ? "Bank Transfer" : "UPI"}
                  </button>
                ))}
              </div>
              {refundMethod === "bank" ? (
                <div className="grid gap-4 sm:grid-cols-2">
                  <TextInput label="Account Holder Name" leftPad={false} value={bankDetails.accountHolderName} onChange={(event) => setBankDetails((current) => ({ ...current, accountHolderName: event.target.value }))} />
                  <TextInput label="Bank Name" leftPad={false} value={bankDetails.bankName} onChange={(event) => setBankDetails((current) => ({ ...current, bankName: event.target.value }))} />
                  <TextInput label="Account Number" leftPad={false} value={bankDetails.accountNumber} onChange={(event) => setBankDetails((current) => ({ ...current, accountNumber: event.target.value }))} />
                  <TextInput label="IFSC Code" leftPad={false} value={bankDetails.ifscCode} onChange={(event) => setBankDetails((current) => ({ ...current, ifscCode: event.target.value.toUpperCase() }))} />
                </div>
              ) : (
                <TextInput label="UPI ID" leftPad={false} value={bankDetails.upiId} onChange={(event) => setBankDetails((current) => ({ ...current, upiId: event.target.value }))} />
              )}
            </div>
          ) : null}

          {steps[currentStep] === "Confirm" ? (
            <div className="space-y-4 rounded-2xl border border-white/10 bg-black/20 p-4 text-sm text-white/70">
              <div>
                <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-[#A5B4FC]">Items</p>
                <p className="mt-2">{selectedItems.map((item) => item.title).join(", ")}</p>
              </div>
              <div>
                <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-[#A5B4FC]">Reason</p>
                <p className="mt-2">{reason === "Other" ? customReason : reason}</p>
              </div>
              {type === "return" ? (
                <div>
                  <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-[#A5B4FC]">Refund Method</p>
                  <p className="mt-2">{refundMethod === "bank" ? "Bank Transfer" : `UPI · ${bankDetails.upiId}`}</p>
                </div>
              ) : (
                <div>
                  <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-[#A5B4FC]">Replacement Variant</p>
                  <p className="mt-2">
                    {exchangeVariants.find((variant) => String(variant._id) === exchangeVariantId)?.size || ""}
                    {exchangeVariants.find((variant) => String(variant._id) === exchangeVariantId)?.color?.name
                      ? ` · ${exchangeVariants.find((variant) => String(variant._id) === exchangeVariantId)?.color?.name}`
                      : ""}
                  </p>
                </div>
              )}
            </div>
          ) : null}
        </div>

        <div className="flex items-center justify-between border-t border-white/10 px-5 py-4">
          <Button type="button" variant="secondary" onClick={currentStep === 0 ? onClose : () => setCurrentStep((value) => Math.max(value - 1, 0))}>
            {currentStep === 0 ? "Cancel" : "Back"}
          </Button>
          {currentStep === steps.length - 1 ? (
            <Button type="button" loading={submitting} loadingText="Submitting request..." onClick={() => void submit()}>
              {type === "return" ? "Submit Return Request" : "Submit Exchange Request"}
            </Button>
          ) : (
            <Button type="button" onClick={next}>
              Continue
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
