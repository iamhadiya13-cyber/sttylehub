"use client";

import type { ReactNode } from "react";

type BadgeVariant = "success" | "error" | "warning" | "info" | "yellow" | "default" | "purple";

interface BadgeProps {
  variant?: BadgeVariant;
  children: ReactNode;
  dot?: boolean;
  size?: "sm" | "md";
}

const colors = {
  success: { bg: "rgba(34,197,94,0.1)", color: "#22C55E", dot: "#22C55E" },
  error: { bg: "rgba(239,68,68,0.1)", color: "#EF4444", dot: "#EF4444" },
  warning: { bg: "rgba(245,158,11,0.1)", color: "#F59E0B", dot: "#F59E0B" },
  info: { bg: "rgba(79,70,229,0.14)", color: "#818CF8", dot: "#818CF8" },
  yellow: { bg: "rgba(79,70,229,0.14)", color: "#C7D2FE", dot: "#818CF8" },
  purple: { bg: "rgba(99,102,241,0.14)", color: "#A5B4FC", dot: "#818CF8" },
  default: { bg: "rgba(255,255,255,0.04)", color: "#9CA3AF", dot: "#9CA3AF" },
} as const;

export default function Badge({ variant = "default", children, dot = false, size = "md" }: BadgeProps) {
  const c = colors[variant];
  return (
    <span
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: 5,
        background: c.bg,
        color: c.color,
        fontSize: size === "sm" ? 10 : 11,
        fontWeight: 700,
        padding: size === "sm" ? "2px 8px" : "3px 10px",
        borderRadius: 99,
        letterSpacing: 0.5,
        textTransform: "uppercase",
        whiteSpace: "nowrap",
      }}
    >
      {dot ? (
        <span
          style={{
            width: 5,
            height: 5,
            borderRadius: "50%",
            background: c.dot,
            flexShrink: 0,
          }}
        />
      ) : null}
      {children}
    </span>
  );
}
