"use client";

import { useEffect } from "react";
import { AnimatePresence, motion } from "framer-motion";
import LoadingButton from "@/components/ui/LoadingButton";

export type ConfirmModalVariant = "danger" | "warning" | "default" | "info";

export type ConfirmModalProps = {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  variant?: ConfirmModalVariant;
  loading?: boolean;
  confirmLabel?: string;
  cancelLabel?: string;
  loadingLabel?: string;
};

const confirmStyles: Record<ConfirmModalVariant, string> = {
  danger:
    "border border-red-500/30 bg-red-500/12 text-red-100 hover:bg-red-500/18",
  warning:
    "border border-amber-400/30 bg-amber-400/12 text-amber-50 hover:bg-amber-400/18",
  default:
    "border border-[#7F77DD]/30 bg-[#7F77DD] text-white hover:bg-[#736AD3]",
  info: "border border-[#7F77DD]/30 bg-[#7F77DD] text-white hover:bg-[#736AD3]",
};

export default function ConfirmModal({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  confirmText,
  cancelText,
  variant = "default",
  loading = false,
  confirmLabel,
  cancelLabel,
  loadingLabel,
}: ConfirmModalProps) {
  useEffect(() => {
    if (!isOpen) {
      return;
    }

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape" && !loading) {
        onClose();
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, loading, onClose]);

  const resolvedConfirmText = confirmText ?? confirmLabel ?? "Confirm";
  const resolvedCancelText = cancelText ?? cancelLabel ?? "Cancel";
  const resolvedLoadingText = loadingLabel ?? resolvedConfirmText;

  return (
    <AnimatePresence>
      {isOpen ? (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.18, ease: "easeOut" }}
          className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 px-4 backdrop-blur-[4px]"
          onClick={() => {
            if (!loading) {
              onClose();
            }
          }}
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            transition={{ duration: 0.18, ease: "easeOut" }}
            className="w-full max-w-[400px] rounded-[20px] border border-white/[0.08] bg-[#111111] p-5 shadow-[0_24px_60px_rgba(0,0,0,0.35)]"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="space-y-2">
              <h2 className="text-base font-semibold text-white">{title}</h2>
              <p className="text-sm leading-6 text-[#A3A3A3]">{message}</p>
            </div>
            <div className="mt-5 grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={onClose}
                disabled={loading}
                className="inline-flex h-11 items-center justify-center rounded-xl border border-white/10 bg-transparent px-4 text-sm font-medium text-[#A3A3A3] transition hover:border-white/15 hover:text-white disabled:cursor-not-allowed disabled:opacity-60"
              >
                {resolvedCancelText}
              </button>
              <LoadingButton
                type="button"
                loading={loading}
                loadingText={resolvedLoadingText}
                onClick={onConfirm}
                className={`inline-flex h-11 items-center justify-center rounded-xl px-4 text-sm font-semibold transition ${confirmStyles[variant]}`}
              >
                {resolvedConfirmText}
              </LoadingButton>
            </div>
          </motion.div>
        </motion.div>
      ) : null}
    </AnimatePresence>
  );
}
