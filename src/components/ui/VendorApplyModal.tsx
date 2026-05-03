"use client";

import { useEffect, useState, type CSSProperties } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";
import LoadingButton from "@/components/ui/LoadingButton";
import VerificationRequiredModal from "@/components/ui/VerificationRequiredModal";
import { useVerifiedSessionState } from "@/hooks/useVerifiedSessionState";

interface VendorApplyModalProps {
  isOpen: boolean;
  onClose: () => void;
}

type VendorStep = 1 | 2 | 3 | "success";

const inputStyle: CSSProperties = {
  width: "100%",
  padding: "11px 14px",
  background: "#0A0A0A",
  border: "1px solid #2A2A2A",
  borderRadius: "8px",
  color: "#fff",
  fontSize: "14px",
  outline: "none",
  boxSizing: "border-box",
  fontFamily: "inherit",
};

const labelStyle: CSSProperties = {
  fontSize: "12px",
  color: "#666",
  marginBottom: "6px",
  display: "block",
  fontWeight: 500,
};

const errorStyle: CSSProperties = {
  fontSize: "11px",
  color: "#EF4444",
  marginTop: "4px",
};

export default function VendorApplyModal({
  isOpen,
  onClose,
}: VendorApplyModalProps) {
  const { data: session, resolvedIsVerified, isVerificationSyncing } = useVerifiedSessionState();
  const router = useRouter();
  const [step, setStep] = useState<VendorStep>(1);
  const [loading, setLoading] = useState(false);
  const [ifscBank, setIfscBank] = useState("");
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [verificationOpen, setVerificationOpen] = useState(false);
  const [form, setForm] = useState({
    shopName: "",
    description: "",
    shopCategory: "",
    phone: "",
    gstNumber: "",
    businessType: "individual",
    panNumber: "",
    accountName: "",
    bankName: "",
    accountNumber: "",
    confirmAccountNumber: "",
    ifscCode: "",
    agreed: false,
  });

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }

    return () => {
      document.body.style.overflow = "";
    };
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen) {
      setStep(1);
      setLoading(false);
      setIfscBank("");
      setErrors({});
    }
  }, [isOpen]);

  const setField = (key: keyof typeof form, value: string | boolean) => {
    setForm((prev) => ({ ...prev, [key]: value }));
    setErrors((prev) => ({ ...prev, [key]: "" }));
  };

  const handleIfscChange = async (value: string) => {
    const upper = value.toUpperCase().slice(0, 11);
    setField("ifscCode", upper);

    if (upper.length !== 11) {
      setIfscBank("");
      setField("bankName", "");
      return;
    }

    try {
      const res = await fetch(`https://ifsc.razorpay.com/${upper}`);
      if (!res.ok) {
        setIfscBank("");
        setField("bankName", "");
        return;
      }

      const data = (await res.json()) as { BANK?: string; BRANCH?: string };
      setField("bankName", data.BANK || "");
      setIfscBank(
        data.BANK ? `${data.BANK}${data.BRANCH ? `, ${data.BRANCH}` : ""}` : "",
      );
    } catch {
      setIfscBank("");
      setField("bankName", "");
    }
  };

  const validateStep = (value: VendorStep) => {
    const nextErrors: Record<string, string> = {};

    if (value === 1) {
      if (!form.shopName.trim()) nextErrors.shopName = "Shop name is required";
      if (form.shopName.trim().length > 50) {
        nextErrors.shopName = "Max 50 characters";
      }
      if (!form.description.trim()) {
        nextErrors.description = "Description is required";
      }
      if (form.description.trim().length < 30) {
        nextErrors.description = "Min 30 characters";
      }
      if (!form.shopCategory) {
        nextErrors.shopCategory = "Select a category";
      }
      if (!/^\d{10}$/.test(form.phone)) {
        nextErrors.phone = "Enter valid 10 digit number";
      }
    }

    if (value === 2) {
      if (!form.businessType) {
        nextErrors.businessType = "Select business type";
      }
      if (
        form.gstNumber &&
        !/^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z][1-9A-Z]Z[0-9A-Z]$/.test(form.gstNumber)
      ) {
        nextErrors.gstNumber = "Invalid GST format";
      }
    }

    if (value === 3) {
      if (!form.accountName.trim()) {
        nextErrors.accountName = "Account holder name required";
      }
      if (!form.accountNumber.trim()) {
        nextErrors.accountNumber = "Account number required";
      }
      if (form.accountNumber !== form.confirmAccountNumber) {
        nextErrors.confirmAccountNumber = "Account numbers do not match";
      }
      if (!form.ifscCode || form.ifscCode.length !== 11) {
        nextErrors.ifscCode = "Enter valid 11 character IFSC";
      }
      if (!form.bankName) nextErrors.ifscCode = "Invalid IFSC code";
      if (!form.agreed) nextErrors.agreed = "You must agree to continue";
    }

    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  };

  const nextStep = () => {
    if (step !== "success" && validateStep(step)) {
      setStep((current) =>
        typeof current === "number" ? ((current + 1) as VendorStep) : current,
      );
    }
  };

  const handleSubmit = async () => {
    if (!validateStep(3)) return;

    if (!session) {
      onClose();
      router.push("/login?callbackUrl=/?vendor=1");
      toast.error("Please login first to apply");
      return;
    }
    if (isVerificationSyncing) {
      return;
    }
    if (!resolvedIsVerified) {
      setVerificationOpen(true);
      return;
    }

    setLoading(true);
    try {
      const res = await fetch("/api/seller/apply", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          shopName: form.shopName.trim(),
          description: form.description.trim(),
          shopCategory: form.shopCategory,
          phone: form.phone,
          gstNumber: form.gstNumber.trim(),
          businessType: form.businessType,
          panNumber: form.panNumber.trim(),
          bankDetails: {
            accountName: form.accountName.trim(),
            bankName: form.bankName.trim(),
            accountNumber: form.accountNumber.trim(),
            ifscCode: form.ifscCode.trim(),
          },
        }),
      });

      const data = (await res.json()) as { success: boolean; message?: string };
      if (!res.ok || !data.success) {
        throw new Error(data.message || "Application failed");
      }

      setStep("success");
      toast.success("Application submitted successfully!");
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Something went wrong",
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <AnimatePresence>
      {isOpen ? (
        <>
        <motion.div
          className="modal-center"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(0,0,0,0.75)",
            backdropFilter: "blur(4px)",
            zIndex: 200,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: "16px",
          }}
        >
          <motion.div
            className="modal-box"
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            transition={{ type: "spring", stiffness: 300, damping: 30 }}
            onClick={(event) => event.stopPropagation()}
            style={{
              width: "100%",
              maxWidth: 520,
              maxHeight: "90vh",
              background: "#111",
              border: "1px solid #1F1F1F",
              borderRadius: 16,
              display: "flex",
              flexDirection: "column",
              zIndex: 201,
              position: "relative",
            }}
          >
            <div
              style={{
                display: "flex",
                justifyContent: "center",
                padding: "12px 0 0",
                flexShrink: 0,
              }}
            >
              <div
                style={{
                  width: 36,
                  height: 4,
                  borderRadius: 99,
                  background: "#2A2A2A",
                }}
              />
            </div>

            <div
              style={{
                padding: "14px 20px",
                borderBottom: "1px solid #1F1F1F",
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                flexShrink: 0,
              }}
            >
              <div>
                <h2
                  style={{
                    color: "#fff",
                    fontSize: 18,
                    fontWeight: 700,
                    margin: "0 0 2px",
                  }}
                >
                  {step === "success"
                    ? "Application Submitted! 🎉"
                    : "Become a Vendor"}
                </h2>
                {step !== "success" ? (
                  <p style={{ color: "#888", fontSize: 12, margin: 0 }}>
                    Step {step} of 3 —{" "}
                    {step === 1
                      ? "Shop Details"
                      : step === 2
                        ? "Legal Info"
                        : "Bank Details"}
                  </p>
                ) : null}
              </div>
              <button
                onClick={onClose}
                style={{
                  width: 32,
                  height: 32,
                  borderRadius: 8,
                  background: "#1A1A1A",
                  border: "1px solid #2A2A2A",
                  color: "#888",
                  cursor: "pointer",
                  fontSize: 18,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  flexShrink: 0,
                }}
              >
                ×
              </button>
            </div>

            {step !== "success" ? (
              <div
                style={{
                  height: 2,
                  background: "#1A1A1A",
                  flexShrink: 0,
                }}
              >
                <motion.div
                  style={{ height: "100%", background: "linear-gradient(90deg, #4F46E5 0%, #6366F1 100%)" }}
                  initial={{ width: "33%" }}
                  animate={{
                    width: step === 1 ? "33%" : step === 2 ? "66%" : "100%",
                  }}
                  transition={{ duration: 0.3 }}
                />
              </div>
            ) : null}

            <div
              style={{
                flex: 1,
                overflowY: "auto",
                padding: "20px",
                scrollbarWidth: "none",
                msOverflowStyle: "none",
              }}
            >
              {step === "success" ? (
                <div style={{ textAlign: "center", padding: "20px 0" }}>
                  <div style={{ fontSize: 64, marginBottom: 16 }}>✅</div>
                  <h3
                    style={{
                      color: "#fff",
                      fontSize: 20,
                      fontWeight: 700,
                      marginBottom: 10,
                    }}
                  >
                    We received your application!
                  </h3>
                  <p
                    style={{
                      color: "#888",
                      fontSize: 14,
                      lineHeight: 1.7,
                      marginBottom: 24,
                    }}
                  >
                    Our team will review your details and respond within{" "}
                    <strong style={{ color: "#fff" }}>24-48 hours</strong>.
                    You&apos;ll receive an email with the decision at{" "}
                    <strong style={{ color: "#C7D2FE" }}>
                      {session?.user?.email}
                    </strong>
                    .
                  </p>
                  <button
                    onClick={onClose}
                    style={{
                      width: "100%",
                      height: 46,
                      background: "linear-gradient(135deg, #4F46E5 0%, #6366F1 100%)",
                      color: "#F8FAFC",
                      border: "none",
                      borderRadius: 8,
                      fontWeight: 700,
                      fontSize: 14,
                      cursor: "pointer",
                    }}
                  >
                    Got it, close
                  </button>
                </div>
              ) : null}

              {step === 1 ? (
                <div style={{ display: "grid", gap: 20 }}>
                  <div>
                    <label style={labelStyle}>Shop / Brand Name *</label>
                    <input
                      value={form.shopName}
                      onChange={(e) => setField("shopName", e.target.value)}
                      maxLength={50}
                      placeholder="e.g. Urban Threads"
                      style={{
                        ...inputStyle,
                        borderColor: errors.shopName ? "#EF4444" : "#2A2A2A",
                      }}
                    />
                    {errors.shopName ? (
                      <p style={errorStyle}>{errors.shopName}</p>
                    ) : null}
                  </div>
                  <div>
                    <label style={labelStyle}>Shop Category *</label>
                    <select
                      value={form.shopCategory}
                      onChange={(e) => setField("shopCategory", e.target.value)}
                      style={{
                        ...inputStyle,
                        cursor: "pointer",
                        borderColor: errors.shopCategory
                          ? "#EF4444"
                          : "#2A2A2A",
                      }}
                    >
                      <option value="">Select category</option>
                      <option value="fashion">Fashion & Clothing</option>
                      <option value="streetwear">Streetwear</option>
                      <option value="accessories">Accessories</option>
                      <option value="footwear">Footwear</option>
                      <option value="activewear">Activewear</option>
                      <option value="mixed">Mixed / General</option>
                    </select>
                    {errors.shopCategory ? (
                      <p style={errorStyle}>{errors.shopCategory}</p>
                    ) : null}
                  </div>
                  <div>
                    <label style={labelStyle}>Shop Description *</label>
                    <textarea
                      value={form.description}
                      onChange={(e) => setField("description", e.target.value)}
                      rows={4}
                      placeholder="Tell us about your brand, what you sell, your story..."
                      style={{
                        ...inputStyle,
                        resize: "none",
                        lineHeight: "1.5",
                        borderColor: errors.description
                          ? "#EF4444"
                          : "#2A2A2A",
                      }}
                    />
                    {errors.description ? (
                      <p style={errorStyle}>{errors.description}</p>
                    ) : null}
                  </div>
                  <div>
                    <label style={labelStyle}>Business Phone *</label>
                    <div style={{ position: "relative" }}>
                      <span
                        style={{
                          position: "absolute",
                          left: 14,
                          top: "50%",
                          transform: "translateY(-50%)",
                          color: "#888",
                          fontSize: 14,
                        }}
                      >
                        +91
                      </span>
                      <input
                        value={form.phone}
                        onChange={(e) =>
                          setField(
                            "phone",
                            e.target.value.replace(/\D/g, "").slice(0, 10),
                          )
                        }
                        placeholder="10 digit number"
                        inputMode="numeric"
                        maxLength={10}
                        style={{
                          ...inputStyle,
                          paddingLeft: 44,
                          borderColor: errors.phone ? "#EF4444" : "#2A2A2A",
                        }}
                      />
                    </div>
                    {errors.phone ? <p style={errorStyle}>{errors.phone}</p> : null}
                  </div>
                </div>
              ) : null}

              {step === 2 ? (
                <div style={{ display: "grid", gap: 20 }}>
                  <div>
                    <label style={labelStyle}>Business Type *</label>
                    <div
                      style={{
                        display: "grid",
                        gridTemplateColumns: "repeat(2, minmax(0, 1fr))",
                        gap: 8,
                      }}
                    >
                      {[
                        ["individual", "Individual"],
                        ["sole_prop", "Sole Proprietor"],
                        ["private_ltd", "Private Limited"],
                        ["partnership", "Partnership"],
                      ].map(([value, label]) => (
                        <button
                          key={value}
                          type="button"
                          onClick={() => setField("businessType", value)}
                          style={{
                            padding: "10px 12px",
                            borderRadius: 8,
                            border: "1px solid",
                            borderColor:
                              form.businessType === value
                                ? "#6366F1"
                                : "#2A2A2A",
                            background:
                              form.businessType === value
                                ? "rgba(99,102,241,0.08)"
                                : "#0A0A0A",
                            color:
                              form.businessType === value ? "#C7D2FE" : "#888",
                            fontSize: 13,
                            fontWeight: form.businessType === value ? 700 : 400,
                            cursor: "pointer",
                          }}
                        >
                          {label}
                        </button>
                      ))}
                    </div>
                  </div>
                  <div>
                    <label style={labelStyle}>GST Number</label>
                    <input
                      value={form.gstNumber}
                      onChange={(e) =>
                        setField("gstNumber", e.target.value.toUpperCase())
                      }
                      placeholder="22AAAAA0000A1Z5"
                      maxLength={15}
                      style={{
                        ...inputStyle,
                        letterSpacing: 1,
                        borderColor: errors.gstNumber ? "#EF4444" : "#2A2A2A",
                      }}
                    />
                    {errors.gstNumber ? (
                      <p style={errorStyle}>{errors.gstNumber}</p>
                    ) : null}
                  </div>
                  <div>
                    <label style={labelStyle}>PAN Number</label>
                    <input
                      value={form.panNumber}
                      onChange={(e) =>
                        setField("panNumber", e.target.value.toUpperCase())
                      }
                      placeholder="ABCDE1234F"
                      maxLength={10}
                      style={{ ...inputStyle, letterSpacing: 1 }}
                    />
                  </div>
                </div>
              ) : null}

              {step === 3 ? (
                <div style={{ display: "grid", gap: 20 }}>
                  <div>
                    <label style={labelStyle}>Account Holder Name *</label>
                    <input
                      value={form.accountName}
                      onChange={(e) => setField("accountName", e.target.value)}
                      placeholder="As printed on bank passbook"
                      style={{
                        ...inputStyle,
                        borderColor: errors.accountName ? "#EF4444" : "#2A2A2A",
                      }}
                    />
                    {errors.accountName ? (
                      <p style={errorStyle}>{errors.accountName}</p>
                    ) : null}
                  </div>
                  <div>
                    <label style={labelStyle}>IFSC Code *</label>
                    <input
                      value={form.ifscCode}
                      onChange={(e) => void handleIfscChange(e.target.value)}
                      placeholder="e.g. HDFC0001234"
                      maxLength={11}
                      style={{
                        ...inputStyle,
                        letterSpacing: 1,
                        textTransform: "uppercase",
                        borderColor: errors.ifscCode
                          ? "#EF4444"
                          : ifscBank
                            ? "#22C55E"
                            : "#2A2A2A",
                      }}
                    />
                    {ifscBank ? (
                      <p style={{ ...errorStyle, color: "#22C55E" }}>
                        ✓ {ifscBank}
                      </p>
                    ) : errors.ifscCode ? (
                      <p style={errorStyle}>{errors.ifscCode}</p>
                    ) : null}
                  </div>
                  <div>
                    <label style={labelStyle}>Account Number *</label>
                    <input
                      value={form.accountNumber}
                      onChange={(e) =>
                        setField("accountNumber", e.target.value.replace(/\D/g, ""))
                      }
                      placeholder="Enter account number"
                      inputMode="numeric"
                      style={{
                        ...inputStyle,
                        letterSpacing: 2,
                        borderColor: errors.accountNumber
                          ? "#EF4444"
                          : "#2A2A2A",
                      }}
                    />
                    {errors.accountNumber ? (
                      <p style={errorStyle}>{errors.accountNumber}</p>
                    ) : null}
                  </div>
                  <div>
                    <label style={labelStyle}>Confirm Account Number *</label>
                    <input
                      value={form.confirmAccountNumber}
                      onChange={(e) =>
                        setField(
                          "confirmAccountNumber",
                          e.target.value.replace(/\D/g, ""),
                        )
                      }
                      placeholder="Re-enter account number"
                      inputMode="numeric"
                      style={{
                        ...inputStyle,
                        letterSpacing: 2,
                        borderColor: errors.confirmAccountNumber
                          ? "#EF4444"
                          : form.confirmAccountNumber &&
                              form.accountNumber === form.confirmAccountNumber
                            ? "#22C55E"
                            : "#2A2A2A",
                      }}
                    />
                    {form.confirmAccountNumber &&
                    form.accountNumber === form.confirmAccountNumber ? (
                      <p style={{ ...errorStyle, color: "#22C55E" }}>
                        ✓ Account numbers match
                      </p>
                    ) : errors.confirmAccountNumber ? (
                      <p style={errorStyle}>{errors.confirmAccountNumber}</p>
                    ) : null}
                  </div>
                  <div
                    onClick={() => setField("agreed", !form.agreed)}
                    style={{
                      display: "flex",
                      gap: 12,
                      padding: 14,
                      background: "#0A0A0A",
                      border: "1px solid",
                      borderColor: errors.agreed
                        ? "#EF4444"
                        : form.agreed
                          ? "#6366F1"
                          : "#2A2A2A",
                      borderRadius: 8,
                      cursor: "pointer",
                    }}
                  >
                    <div
                      style={{
                        width: 20,
                        height: 20,
                        borderRadius: 4,
                        border: "2px solid",
                        borderColor: form.agreed ? "#6366F1" : "#2A2A2A",
                        background: form.agreed ? "#6366F1" : "transparent",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        flexShrink: 0,
                      }}
                    >
                      {form.agreed ? (
                        <span style={{ color: "#F8FAFC", fontSize: 12 }}>✓</span>
                      ) : null}
                    </div>
                    <div>
                      <p
                        style={{
                          margin: "0 0 4px",
                          fontSize: 13,
                          fontWeight: 500,
                          color: "#fff",
                        }}
                      >
                        I agree to StyleHub Seller Terms
                      </p>
                      <p style={{ margin: 0, fontSize: 11, color: "#555" }}>
                        I confirm all information is accurate and I will maintain
                        quality standards on StyleHub.
                      </p>
                    </div>
                  </div>
                  {errors.agreed ? <p style={errorStyle}>{errors.agreed}</p> : null}
                </div>
              ) : null}
            </div>

            {step !== "success" ? (
              <div
                style={{
                  padding: "14px 20px",
                  borderTop: "1px solid #1F1F1F",
                  display: "flex",
                  gap: 10,
                  flexShrink: 0,
                  background: "#111",
                }}
              >
                {step > 1 ? (
                  <button
                    onClick={() =>
                      setStep((current) =>
                        typeof current === "number"
                          ? ((current - 1) as VendorStep)
                          : current,
                      )
                    }
                    style={{
                      width: 90,
                      height: 44,
                      background: "transparent",
                      border: "1px solid #2A2A2A",
                      borderRadius: 8,
                      color: "#888",
                      fontSize: 14,
                      fontWeight: 600,
                      cursor: "pointer",
                    }}
                  >
                    ← Back
                  </button>
                ) : null}
                <LoadingButton
                  onClick={step < 3 ? nextStep : handleSubmit}
                  loading={loading}
                  loadingText="Submitting application..."
                  style={{
                    flex: 1,
                    height: 44,
                    background: loading ? "#2A2A2A" : "linear-gradient(135deg, #4F46E5 0%, #6366F1 100%)",
                    border: "none",
                    borderRadius: 8,
                    color: loading ? "#555" : "#F8FAFC",
                    fontSize: 14,
                    fontWeight: 700,
                    cursor: loading ? "not-allowed" : "pointer",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: 8,
                  }}
                >
                  {step < 3 ? "Continue →" : "Submit Application"}
                </LoadingButton>
              </div>
            ) : null}
          </motion.div>
        </motion.div>
        <VerificationRequiredModal
          isOpen={verificationOpen}
          onClose={() => setVerificationOpen(false)}
          description="Verify your email to submit a seller application."
        />
        </>
      ) : null}
    </AnimatePresence>
  );
}
