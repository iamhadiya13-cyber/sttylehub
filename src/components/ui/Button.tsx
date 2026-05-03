"use client";

import type { ButtonHTMLAttributes, ReactNode } from "react";
import { cn } from "@/lib/utils";
import LoadingButton from "@/components/ui/LoadingButton";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "danger" | "ghost";
  size?: "sm" | "md" | "lg";
  loading?: boolean;
  loadingText?: string;
  icon?: ReactNode;
}

export default function Button({
  variant = "primary",
  size = "md",
  loading = false,
  loadingText,
  icon,
  children,
  disabled,
  ...props
}: ButtonProps) {
  const styles = {
    primary: {
      background: "linear-gradient(135deg, #4F46E5 0%, #4338CA 100%)",
      color: "#F8FAFC",
      border: "none",
    },
    secondary: {
      background: "rgba(255,255,255,0.02)",
      color: "#F4F1EA",
      border: "1px solid rgba(255,255,255,0.09)",
    },
    danger: {
      background: "rgba(239,68,68,0.08)",
      color: "#FCA5A5",
      border: "1px solid rgba(239,68,68,0.28)",
    },
    ghost: {
      background: "transparent",
      color: "#9CA3AF",
      border: "none",
    },
  } as const;

  const sizes = {
    sm: { height: 34, padding: "0 14px", fontSize: 12 },
    md: { height: 42, padding: "0 20px", fontSize: 14 },
    lg: { height: 50, padding: "0 28px", fontSize: 15 },
  } as const;

  return (
    <LoadingButton
      {...props}
      loading={loading}
      loadingText={loadingText}
      disabled={disabled}
      icon={!loading ? icon : null}
      className={cn("inline-flex items-center justify-center", props.className)}
      style={{
        ...styles[variant],
        ...sizes[size],
        borderRadius: 12,
        fontWeight: 600,
        cursor: disabled || loading ? "not-allowed" : "pointer",
        opacity: disabled ? 0.5 : undefined,
        display: "inline-flex",
        alignItems: "center",
        justifyContent: "center",
        gap: 8,
        transition: "all 0.18s ease",
        fontFamily: "inherit",
        boxShadow: variant === "primary" && !disabled ? "0 10px 24px rgba(79,70,229,0.18)" : "none",
        ...(props.style || {}),
      }}
    >
      {children}
    </LoadingButton>
  );
}
