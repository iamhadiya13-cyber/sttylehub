"use client";

import Link from "next/link";
import { AnimatePresence, motion } from "framer-motion";
import { LoaderCircle, MailCheck, ShieldAlert, X } from "lucide-react";
import { useEffect, useState } from "react";
import toast from "react-hot-toast";
import { useVerifiedSessionState } from "@/hooks/useVerifiedSessionState";

type VerificationRequiredModalProps = {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  description?: string;
  initialCooldown?: number;
};

export default function VerificationRequiredModal({
  isOpen,
  onClose,
  title = "Email verification required",
  description = "Verify your email to continue with this action.",
  initialCooldown = 0,
}: VerificationRequiredModalProps) {
  const { data: session, resolvedIsVerified, isVerificationSyncing, update } = useVerifiedSessionState();
  const [loading, setLoading] = useState(false);
  const [cooldown, setCooldown] = useState(initialCooldown);

  useEffect(() => {
    setCooldown(initialCooldown);
  }, [initialCooldown, isOpen]);

  useEffect(() => {
    if (!cooldown) return;
    const timer = window.setTimeout(() => setCooldown((current) => Math.max(0, current - 1)), 1000);
    return () => window.clearTimeout(timer);
  }, [cooldown]);

  useEffect(() => {
    if (isOpen && resolvedIsVerified) {
      onClose();
    }
  }, [isOpen, onClose, resolvedIsVerified]);

  const resend = async () => {
    if (loading || cooldown || !session?.user?.email || resolvedIsVerified || isVerificationSyncing) {
      return;
    }

    setLoading(true);
    try {
      const response = await fetch("/api/auth/resend-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: session.user.email }),
      });
      const json = (await response.json()) as {
        success: boolean;
        message?: string;
        data?: { cooldownSeconds?: number };
        retryAfterSeconds?: number;
      };
      if (!response.ok || !json.success) {
        if (json.message === "Email already verified") {
          await update({ isVerified: true });
          onClose();
          return;
        }
        if (response.status === 429) {
          setCooldown(json.retryAfterSeconds || 60);
        }
        throw new Error(json.message || "Could not resend code");
      }
      setCooldown(json.data?.cooldownSeconds || 60);
      toast.success(json.message || "Verification code sent");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Could not resend code");
    } finally {
      setLoading(false);
    }
  };

  return (
    <AnimatePresence>
      {isOpen ? (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[220] flex items-center justify-center bg-black/70 px-4 backdrop-blur-sm"
          onClick={onClose}
        >
          <motion.div
            initial={{ opacity: 0, y: 18, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 12, scale: 0.98 }}
            transition={{ duration: 0.24, ease: "easeOut" }}
            onClick={(event) => event.stopPropagation()}
            className="relative w-full max-w-md overflow-hidden rounded-[28px] border border-white/10 bg-[linear-gradient(180deg,#101523_0%,#0A0E17_100%)] p-6 shadow-[0_40px_120px_rgba(2,6,23,0.5)]"
          >
            <button
              type="button"
              onClick={onClose}
              className="absolute right-4 top-4 flex h-9 w-9 items-center justify-center rounded-full border border-white/10 bg-white/[0.04] text-[#B8C0D9] transition hover:border-white/20 hover:text-white"
            >
              <X className="h-4 w-4" />
            </button>

            <div className="inline-flex rounded-2xl border border-[#6366F1]/20 bg-[#4F46E5]/14 p-3 text-[#C7D2FE]">
              <ShieldAlert className="h-5 w-5" />
            </div>
            <h3 className="mt-5 text-2xl font-bold text-[#F4F1EA]">{title}</h3>
            <p className="mt-3 text-sm leading-7 text-[#B8B6B0]">{description}</p>
            {session?.user?.email ? (
              <p className="mt-3 text-sm text-[#A5B4FC]">{session.user.email}</p>
            ) : null}

            <div className="mt-6 grid gap-3">
              <button
                type="button"
                onClick={() => void resend()}
                disabled={loading || cooldown > 0 || !session?.user?.email || resolvedIsVerified || isVerificationSyncing}
                className="inline-flex h-11 items-center justify-center gap-2 rounded-full border border-[#6366F1] bg-[linear-gradient(135deg,#4F46E5_0%,#4338CA_100%)] px-5 text-[12px] font-semibold uppercase tracking-[0.16em] text-[#F8FAFC] transition duration-300 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {loading || isVerificationSyncing ? <LoaderCircle className="h-4 w-4 animate-spin" /> : <MailCheck className="h-4 w-4" />}
                {loading ? "Sending" : isVerificationSyncing ? "Checking" : cooldown > 0 ? `Resend in ${cooldown}s` : "Resend Code"}
              </button>
              <Link
                href={`/profile${session?.user?.email ? "?verification=required" : ""}`}
                className="inline-flex h-11 items-center justify-center rounded-full border border-white/12 bg-white/[0.04] px-5 text-[12px] font-semibold uppercase tracking-[0.16em] text-[#E7E5E4] transition duration-300 hover:border-white/20 hover:bg-white/[0.06]"
              >
                Go To Profile
              </Link>
              <button
                type="button"
                onClick={onClose}
                className="inline-flex h-11 items-center justify-center rounded-full border border-transparent px-5 text-[12px] font-semibold uppercase tracking-[0.16em] text-[#9CA3AF] transition hover:text-white"
              >
                Close
              </button>
            </div>
          </motion.div>
        </motion.div>
      ) : null}
    </AnimatePresence>
  );
}
