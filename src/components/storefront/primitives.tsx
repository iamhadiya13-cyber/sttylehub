"use client";

import { forwardRef, useId, type ComponentProps, type ReactNode, type TextareaHTMLAttributes } from "react";
import { motion } from "framer-motion";
import { Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";
import UIButton from "@/components/ui/Button";
import UIInput from "@/components/ui/Input";
import { browseGridClassName } from "@/components/storefront/browse-grid";

export function SectionHeading({
  eyebrow,
  title,
  description,
  action,
}: {
  eyebrow?: string;
  title: string;
  description?: string;
  action?: ReactNode;
}) {
  return (
    <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
      <div className="space-y-1">
        {eyebrow ? <p className="app-section-heading">{eyebrow}</p> : null}
        <h2 className="text-[32px] font-bold text-[#F4F1EA]">{title}</h2>
        {description ? (
          <p className="max-w-2xl text-sm leading-6 text-[#9CA3AF]">
            {description}
          </p>
        ) : null}
      </div>
      {action}
    </div>
  );
}

export type TextInputProps = ComponentProps<typeof UIInput> & {
  leftPad?: boolean;
};

export const TextInput = forwardRef<HTMLInputElement, TextInputProps>(
  function TextInput({ className, leftPad = true, ...props }, ref) {
    return (
      <UIInput
        ref={ref}
        {...props}
        className={cn(
          "app-input h-[44px]",
          leftPad ? "pl-11 pr-4" : "px-4",
          className,
        )}
      />
    );
  },
);

TextInput.displayName = "TextInput";

export function TextArea({
  className,
  label,
  hint,
  error,
  required,
  id,
  ...props
}: TextareaHTMLAttributes<HTMLTextAreaElement> & {
  label?: string;
  hint?: string;
  error?: string;
}) {
  const generatedId = useId();
  const textareaId = id || generatedId;
  const descriptionId = error ? `${textareaId}-error` : undefined;
  return (
    <div>
      {label ? (
        <label htmlFor={textareaId} className="mb-1.5 block text-xs font-semibold tracking-[0.02em] text-[#AEB6C7]">
          <span>{label}</span>
        </label>
      ) : null}
      <textarea
        {...props}
        id={textareaId}
        aria-invalid={Boolean(error)}
        aria-describedby={descriptionId}
        className={cn(
          "app-input min-h-[120px] resize-none",
          error ? "border-[#EF4444] focus:border-[#EF4444]" : "",
          className,
        )}
      />
      {error ? <p id={`${textareaId}-error`} className="mt-1 text-xs text-[#EF4444]">Error: {error}</p> : null}
    </div>
  );
}

export function Field({
  label,
  error,
  icon,
  right,
  children,
}: {
  label: string;
  error?: string;
  icon?: ReactNode;
  right?: ReactNode;
  children: ReactNode;
}) {
  return (
    <label className="block space-y-2">
      <span className="app-label flex items-center justify-between">
        <span>{label}</span>
        {right}
      </span>
      <div className="relative">
        {icon ? (
          <span className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-[#666666]">
            {icon}
          </span>
        ) : null}
        {children}
      </div>
      {error ? <p className="text-xs text-[#EF4444]">{error}</p> : null}
    </label>
  );
}

export function Button({
  children,
  loading,
  loadingText,
  variant = "primary",
  className,
  ...props
}: {
  children: ReactNode;
  loading?: boolean;
  loadingText?: string;
  variant?: "primary" | "secondary" | "ghost" | "danger";
  className?: string;
} & React.ButtonHTMLAttributes<HTMLButtonElement>) {
  const variants = {
    primary: "border-none bg-[linear-gradient(135deg,#4F46E5_0%,#4338CA_100%)] text-[#F8FAFC] hover:brightness-110",
    secondary:
      "border border-white/10 bg-white/[0.03] text-[#F4F1EA] hover:bg-white/[0.06] hover:border-white/20",
    danger:
      "border border-[#EF4444]/30 bg-[#EF4444]/8 text-[#FCA5A5] hover:bg-[#EF4444]/12",
    ghost: "border-none bg-transparent px-2 text-[#9CA3AF] hover:text-white",
  } as const;

  return (
    <motion.div whileTap={{ scale: 0.97 }} className="inline-flex">
      <UIButton
        {...props}
        size="md"
        disabled={loading || props.disabled}
        loading={loading}
        loadingText={loadingText}
        variant={variant}
        className={cn(
          "inline-flex h-[44px] items-center justify-center gap-2 rounded-[12px] px-6 text-sm font-semibold tracking-[0.2px] transition disabled:cursor-not-allowed disabled:bg-[#2A2A2A] disabled:text-[#555555] disabled:opacity-100",
          variants[variant],
          className,
        )}
      >
        {children}
      </UIButton>
    </motion.div>
  );
}

export function LoadingGrid({
  count = 4,
  className,
}: {
  count?: number;
  className?: string;
}) {
  return (
    <div className={cn(browseGridClassName, className)}>
      {Array.from({ length: count }).map((_, index) => (
        <div
          key={index}
          className="h-[420px] animate-pulse rounded-3xl border border-white/8 bg-[#0F1220]"
        />
      ))}
    </div>
  );
}

export function EmptyState({
  title,
  description,
  action,
  compact = false,
}: {
  title: string;
  description?: string;
  action?: ReactNode;
  compact?: boolean;
}) {
  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center rounded-[18px] border border-dashed border-white/10 bg-[#0F1220] text-center",
        compact ? "p-6" : "p-10",
      )}
    >
      <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-[#4F46E5]/14 text-[#A5B4FC]">
        <Sparkles className="h-8 w-8" />
      </div>
      <h3 className="text-xl font-semibold">{title}</h3>
      {description ? (
        <p className="mt-2 max-w-md text-sm leading-6 text-[#9CA3AF]">
          {description}
        </p>
      ) : null}
      {action ? <div className="mt-5">{action}</div> : null}
    </div>
  );
}

export function GenderBadge({
  gender,
  small = false,
}: {
  gender?: "men" | "women" | "unisex";
  small?: boolean;
}) {
  if (!gender) return null;
  const tone =
    gender === "men"
      ? "bg-[#1D4ED8] text-white"
      : gender === "women"
        ? "bg-[#BE185D] text-white"
        : "bg-[#4F46E5]/15 text-[#C7D2FE] border border-[#6366F1]/30";
  return (
    <span
      className={cn(
        "inline-flex rounded-full font-semibold uppercase tracking-[1px]",
        small ? "px-2 py-1 text-[10px]" : "px-3 py-1 text-[11px]",
        tone,
      )}
    >
      {gender}
    </span>
  );
}
