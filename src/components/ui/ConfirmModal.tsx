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
    "text-[var(--text-on-accent)] hover:opacity-95",
  info: "text-[var(--text-on-accent)] hover:opacity-95",
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
            className="w-full max-w-[400px] rounded-[20px] p-5"
            style={{
              border: "1px solid var(--border-default)",
              background: "var(--bg-elevated)",
              boxShadow: "0 24px 60px rgba(var(--shadow-color-rgb), 0.35)",
            }}
            onClick={(event) => event.stopPropagation()}
          >
            <div className="space-y-2">
              <h2 className="text-base font-semibold" style={{ color: "var(--text-primary)" }}>{title}</h2>
              <p className="text-sm leading-6" style={{ color: "var(--text-secondary)" }}>{message}</p>
            </div>
            <div className="mt-5 grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={onClose}
                disabled={loading}
                className="inline-flex h-11 items-center justify-center rounded-xl bg-transparent px-4 text-sm font-medium transition disabled:cursor-not-allowed disabled:opacity-60"
                style={{
                  border: "1px solid var(--border-default)",
                  color: "var(--text-secondary)",
                }}
              >
                {resolvedCancelText}
              </button>
              <LoadingButton
                type="button"
                loading={loading}
                loadingText={resolvedLoadingText}
                onClick={onConfirm}
                className={`inline-flex h-11 items-center justify-center rounded-xl px-4 text-sm font-semibold transition ${confirmStyles[variant]}`}
                style={
                  variant === "default" || variant === "info"
                    ? {
                        background: "var(--accent-primary)",
                        border: "1px solid rgba(var(--accent-primary-rgb), 0.28)",
                      }
                    : undefined
                }
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
