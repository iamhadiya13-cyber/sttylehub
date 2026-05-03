"use client";

import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";

const TIMELINE_STEPS = [
  { status: "pending", icon: "📋", label: "Order Placed" },
  { status: "confirmed", icon: "✅", label: "Order Confirmed" },
  { status: "processing", icon: "⚙️", label: "Processing" },
  { status: "shipped", icon: "🚚", label: "Shipped" },
  { status: "delivered", icon: "📦", label: "Delivered" },
] as const;

const STATUS_ORDER = ["pending", "confirmed", "processing", "shipped", "delivered"];

interface TimelineProps {
  currentStatus: string;
  trackingNumber?: string | null;
  carrier?: string | null;
  statusHistory?: {
    status: string;
    timestamp: Date | string;
    note?: string;
  }[];
}

export default function OrderTimeline({
  currentStatus,
  trackingNumber,
  carrier,
  statusHistory = [],
}: TimelineProps) {
  const [expanded, setExpanded] = useState<string | null>(null);
  const currentIndex = STATUS_ORDER.indexOf(currentStatus);

  if (currentStatus === "cancelled") {
    return (
      <div
        style={{
          padding: "16px 20px",
          background: "rgba(239,68,68,0.06)",
          border: "1px solid rgba(239,68,68,0.15)",
          borderRadius: 12,
          display: "flex",
          alignItems: "center",
          gap: 14,
        }}
      >
        <span style={{ fontSize: 28 }}>❌</span>
        <div>
          <p style={{ color: "#EF4444", fontWeight: 700, fontSize: 15, margin: 0 }}>
            Order Cancelled
          </p>
        </div>
      </div>
    );
  }

  return (
    <div style={{ position: "relative" }}>
      {TIMELINE_STEPS.map((step, index) => {
        const isDone = currentIndex >= 0 && index < currentIndex;
        const isActive = index === currentIndex;
        const isPending = currentIndex < 0 || index > currentIndex;
        const historyItem = statusHistory.find((item) => item.status === step.status);

        return (
          <div key={step.status} style={{ position: "relative" }}>
            {index < TIMELINE_STEPS.length - 1 ? (
              <div
                style={{
                  position: "absolute",
                  left: 19,
                  top: 40,
                  width: 2,
                  height: "calc(100% - 8px)",
                  background: isDone ? "#22C55E" : "#1F1F1F",
                  zIndex: 0,
                }}
              />
            ) : null}
            <div
              onClick={() => {
                if (isDone || isActive) {
                  setExpanded(expanded === step.status ? null : step.status);
                }
              }}
              style={{
                display: "flex",
                alignItems: "flex-start",
                gap: 14,
                padding: "12px 0",
                cursor: isDone || isActive ? "pointer" : "default",
                position: "relative",
                zIndex: 1,
              }}
            >
              <div
                style={{
                  width: 40,
                  height: 40,
                  borderRadius: "50%",
                  background: isDone ? "#22C55E" : isActive ? "#6366F1" : "#1A1A1A",
                  border: "2px solid",
                  borderColor: isDone ? "#22C55E" : isActive ? "#6366F1" : "#2A2A2A",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: isPending ? 16 : 18,
                  flexShrink: 0,
                  filter: isPending ? "grayscale(1) opacity(0.4)" : "none",
                }}
              >
                {isDone ? "✓" : step.icon}
              </div>
              <div style={{ flex: 1 }}>
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    gap: 8,
                  }}
                >
                  <p
                    style={{
                      fontSize: 14,
                      fontWeight: isActive ? 700 : 500,
                      color: isPending ? "#555" : isActive ? "#A5B4FC" : isDone ? "#fff" : "#888",
                      margin: 0,
                    }}
                  >
                    {step.label}
                    {isActive ? (
                      <span
                        style={{
                          marginLeft: 8,
                          fontSize: 10,
                          background: "rgba(79,70,229,0.14)",
                          color: "#C7D2FE",
                          padding: "2px 8px",
                          borderRadius: 99,
                          fontWeight: 700,
                          letterSpacing: 1,
                          verticalAlign: "middle",
                        }}
                      >
                        CURRENT
                      </span>
                    ) : null}
                  </p>
                  <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    {historyItem?.timestamp ? (
                      <span style={{ fontSize: 11, color: "#555" }}>
                        {new Date(historyItem.timestamp).toLocaleDateString("en-IN", {
                          day: "numeric",
                          month: "short",
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </span>
                    ) : null}
                    {isDone || isActive ? (
                      <span
                        style={{
                          color: "#555",
                          fontSize: 12,
                          transform: expanded === step.status ? "rotate(180deg)" : "none",
                          transition: "transform 0.2s",
                          display: "inline-block",
                        }}
                      >
                        ▾
                      </span>
                    ) : null}
                  </div>
                </div>
                <AnimatePresence>
                  {expanded === step.status ? (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: "auto", opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      style={{ overflow: "hidden" }}
                    >
                      <div
                        style={{
                          marginTop: 10,
                          padding: "10px 14px",
                          background: "#0A0A0A",
                          borderRadius: 8,
                          border: "1px solid #1F1F1F",
                        }}
                      >
                        {step.status === "shipped" && trackingNumber ? (
                          <div>
                            <p style={{ fontSize: 12, color: "#888", margin: "0 0 4px" }}>
                              {carrier || "Courier"}
                            </p>
                            <p
                              style={{
                                fontSize: 14,
                                color: "#A5B4FC",
                                fontWeight: 700,
                                fontFamily: "monospace",
                                margin: 0,
                                letterSpacing: 1,
                              }}
                            >
                              {trackingNumber}
                            </p>
                          </div>
                        ) : historyItem?.note ? (
                          <p style={{ fontSize: 13, color: "#888", margin: 0 }}>
                            {historyItem.note}
                          </p>
                        ) : null}
                      </div>
                    </motion.div>
                  ) : null}
                </AnimatePresence>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
