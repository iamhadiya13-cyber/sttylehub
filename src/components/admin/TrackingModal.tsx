"use client";

import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";

interface TrackingModalProps {
  isOpen: boolean;
  orderId: string;
  orderNumber: string;
  onConfirm: (trackingNumber: string, carrier: string) => void;
  onClose: () => void;
  loading?: boolean;
}

export default function TrackingModal({
  isOpen,
  orderId: _orderId,
  orderNumber,
  onConfirm,
  onClose,
  loading = false,
}: TrackingModalProps) {
  const [tracking, setTracking] = useState("");
  const [carrier, setCarrier] = useState("Delhivery");
  const [error, setError] = useState("");

  useEffect(() => {
    document.body.style.overflow = isOpen ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen) {
      setTracking("");
      setCarrier("Delhivery");
      setError("");
    }
  }, [isOpen]);

  return (
    <AnimatePresence>
      {isOpen ? (
        <motion.div
          className="modal-center"
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(0,0,0,0.75)",
            backdropFilter: "blur(4px)",
            zIndex: 200,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: 16,
          }}
          onClick={onClose}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          <motion.div
            className="modal-box"
            onClick={(event) => event.stopPropagation()}
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.95, opacity: 0 }}
            style={{
              width: "100%",
              maxWidth: 420,
              background: "#111",
              border: "1px solid #1F1F1F",
              borderRadius: 16,
              padding: 28,
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 20 }}>
              <span style={{ fontSize: 28 }}>🚚</span>
              <div>
                <h3 style={{ color: "#fff", fontSize: 16, fontWeight: 700, margin: 0 }}>Add Tracking Info</h3>
                <p style={{ color: "#888", fontSize: 12, margin: 0 }}>Order #{orderNumber}</p>
              </div>
            </div>

            <div style={{ marginBottom: 16 }}>
              <label style={{ fontSize: 12, color: "#666", display: "block", marginBottom: 6 }}>Shipping Carrier</label>
              <select
                value={carrier}
                onChange={(event) => setCarrier(event.target.value)}
                style={{
                  width: "100%",
                  padding: "10px 14px",
                  background: "#0A0A0A",
                  border: "1px solid #2A2A2A",
                  borderRadius: 8,
                  color: "#fff",
                  fontSize: 14,
                  outline: "none",
                  boxSizing: "border-box",
                }}
              >
                <option>Delhivery</option>
                <option>Blue Dart</option>
                <option>DTDC</option>
                <option>Shiprocket</option>
                <option>India Post</option>
                <option>Ekart</option>
                <option>Other</option>
              </select>
            </div>

            <div style={{ marginBottom: 20 }}>
              <label style={{ fontSize: 12, color: "#666", display: "block", marginBottom: 6 }}>Tracking Number *</label>
              <input
                value={tracking}
                onChange={(event) => {
                  setTracking(event.target.value);
                  setError("");
                }}
                placeholder="e.g. 1234567890"
                style={{
                  width: "100%",
                  padding: "10px 14px",
                  background: "#0A0A0A",
                  border: `1px solid ${error ? "#EF4444" : "#2A2A2A"}`,
                  borderRadius: 8,
                  color: "#fff",
                  fontSize: 14,
                  outline: "none",
                  boxSizing: "border-box",
                  letterSpacing: 1,
                }}
              />
              {error ? <p style={{ fontSize: 11, color: "#EF4444", marginTop: 4 }}>{error}</p> : null}
            </div>

            <div style={{ display: "flex", gap: 10 }}>
              <button
                onClick={onClose}
                style={{
                  flex: 1,
                  height: 44,
                  background: "transparent",
                  border: "1px solid #2A2A2A",
                  borderRadius: 8,
                  color: "#888",
                  cursor: "pointer",
                  fontWeight: 600,
                }}
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  if (!tracking.trim()) {
                    setError("Tracking number is required");
                    return;
                  }
                  onConfirm(tracking.trim(), carrier);
                }}
                disabled={loading}
                style={{
                  flex: 2,
                  height: 44,
                  background: loading ? "#1A1A1A" : "linear-gradient(135deg, #4F46E5 0%, #6366F1 100%)",
                  border: "none",
                  borderRadius: 8,
                  color: loading ? "#555" : "#F8FAFC",
                  fontWeight: 700,
                  cursor: loading ? "not-allowed" : "pointer",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: 8,
                }}
              >
                {loading ? "Updating..." : "Mark as Shipped"}
              </button>
            </div>
          </motion.div>
        </motion.div>
      ) : null}
    </AnimatePresence>
  );
}
