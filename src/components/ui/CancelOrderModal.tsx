/* eslint-disable react-hooks/set-state-in-effect */

"use client";

import { useEffect, useMemo, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import LoadingButton from "@/components/ui/LoadingButton";
import { TextInput } from "@/components/screens/shared";

interface CancelOrderModalProps {
  isOpen: boolean;
  orderId: string;
  orderNumber: string;
  onConfirm: (payload: { reason: string; customReason?: string }) => void;
  onClose: () => void;
  loading?: boolean;
}

const CANCEL_REASONS = [
  "Ordered by mistake",
  "Found a better price",
  "Delivery time too long",
  "Want to change size or color",
  "Other",
] as const;

export default function CancelOrderModal({
  isOpen,
  orderId: _orderId,
  orderNumber,
  onConfirm,
  onClose,
  loading = false,
}: CancelOrderModalProps) {
  const [reason, setReason] = useState<(typeof CANCEL_REASONS)[number]>("Ordered by mistake");
  const [customReason, setCustomReason] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    document.body.style.overflow = isOpen ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [isOpen]);

  // eslint-disable-next-line react-hooks/set-state-in-effect -- closing the modal should reset its local form state immediately
  useEffect(() => {
    if (!isOpen) {
      setReason("Ordered by mistake");
      setCustomReason("");
      setError("");
    }
  }, [isOpen]);

  const canSubmit = useMemo(
    () => reason !== "Other" || customReason.trim().length >= 3,
    [customReason, reason],
  );

  return (
    <AnimatePresence>
      {isOpen ? (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="fixed inset-0 z-[200] flex items-center justify-center bg-black/75 p-4 backdrop-blur-[4px]"
        >
          <motion.div
            initial={{ scale: 0.96, opacity: 0, y: 20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.96, opacity: 0, y: 20 }}
            onClick={(event) => event.stopPropagation()}
            className="w-full max-w-[520px] rounded-[20px] border border-[#1F1F1F] bg-[#111111] p-6"
          >
            <p className="text-[11px] font-bold uppercase tracking-[0.22em] text-[#A5B4FC]">Order #{orderNumber}</p>
            <h3 className="mt-2 text-[22px] font-bold text-white">Cancel Order</h3>
            <div className="mt-4 rounded-2xl border border-red-500/20 bg-red-500/8 p-4 text-sm leading-6 text-[#D1D5DB]">
              Are you sure you want to cancel this order? This action cannot be undone.
            </div>

            <div className="mt-5 space-y-3">
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#888888]">Cancellation Reason</p>
              <div className="grid gap-2">
                {CANCEL_REASONS.map((item) => (
                  <button
                    key={item}
                    type="button"
                    onClick={() => {
                      setReason(item);
                      setError("");
                    }}
                    className={
                      reason === item
                        ? "rounded-xl border border-red-400/50 bg-red-500/10 px-4 py-3 text-left text-sm font-semibold text-red-200"
                        : "rounded-xl border border-[#2A2A2A] bg-transparent px-4 py-3 text-left text-sm font-semibold text-[#B9B9C7]"
                    }
                  >
                    {item}
                  </button>
                ))}
              </div>
              {reason === "Other" ? (
                <TextInput
                  label="Tell us more"
                  leftPad={false}
                  value={customReason}
                  onChange={(event) => {
                    setCustomReason(event.target.value);
                    setError("");
                  }}
                  placeholder="Enter cancellation reason"
                />
              ) : null}
              {error ? <p className="text-xs text-red-400">{error}</p> : null}
            </div>

            <div className="mt-6 flex gap-3">
              <button
                type="button"
                onClick={onClose}
                className="flex-1 rounded-xl border border-[#2A2A2A] px-4 py-3 text-sm font-semibold text-[#A7A7B2]"
              >
                Keep Order
              </button>
              <LoadingButton
                type="button"
                loading={loading}
                loadingText="Cancelling..."
                onClick={() => {
                  if (!canSubmit) {
                    setError("Please provide your cancellation reason.");
                    return;
                  }
                  onConfirm({
                    reason,
                    customReason: reason === "Other" ? customReason.trim() : "",
                  });
                }}
                className="flex-1 rounded-xl border border-red-500/35 bg-red-500/10 px-4 py-3 text-sm font-semibold text-red-200"
              >
                Yes Cancel Order
              </LoadingButton>
            </div>
          </motion.div>
        </motion.div>
      ) : null}
    </AnimatePresence>
  );
}
