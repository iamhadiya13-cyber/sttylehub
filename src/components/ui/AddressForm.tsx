"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import LoadingButton from "@/components/ui/LoadingButton";

const addressSchema = z.object({
  fullName: z.string().min(2, "Name required"),
  phone: z.string().length(10, "Enter 10 digit number"),
  street: z.string().min(5, "Street address required"),
  pincode: z.string().length(6, "Enter 6 digit pincode"),
  locality: z.string().min(1, "Select your area"),
  city: z.string().min(1, "City required"),
  state: z.string().min(1, "State required"),
  country: z.string().default("India"),
  landmark: z.string().optional(),
  addressType: z.enum(["Home", "Work", "Other"]).default("Home"),
  isDefault: z.boolean().default(false),
});

export type AddressFormData = z.infer<typeof addressSchema>;
type AddressFormInput = z.input<typeof addressSchema>;

type AddressFormProps = {
  onSubmit: (data: AddressFormData) => Promise<void>;
  defaultValues?: Partial<AddressFormData>;
  submitLabel?: string;
  onCancel?: () => void;
};

export default function AddressForm({ onSubmit, defaultValues, submitLabel = "Save Address", onCancel }: AddressFormProps) {
  const [pincodeStatus, setPincodeStatus] = useState<"idle" | "loading" | "success" | "error">("idle");
  const [pincodeMessage, setPincodeMessage] = useState("");
  const [localities, setLocalities] = useState<string[]>(defaultValues?.locality ? [defaultValues.locality] : []);
  const [cityLocked, setCityLocked] = useState(false);
  const [stateLocked, setStateLocked] = useState(false);

  const { register, handleSubmit, setValue, watch, formState: { errors, isSubmitting } } = useForm<AddressFormInput, undefined, AddressFormData>({
    resolver: zodResolver(addressSchema),
    defaultValues: {
      country: "India",
      addressType: "Home",
      isDefault: false,
      ...defaultValues,
    },
  });

  const watchedPincode = watch("pincode");
  const watchedType = watch("addressType");

  const handlePincodeChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const value = event.target.value.replace(/\D/g, "").slice(0, 6);
    setValue("pincode", value, { shouldValidate: true });

    if (value.length < 6) {
      setPincodeStatus("idle");
      setPincodeMessage("");
      setLocalities([]);
      setCityLocked(false);
      setStateLocked(false);
      return;
    }

    setPincodeStatus("loading");
    setPincodeMessage("Fetching location...");
    setLocalities([]);

    try {
      const response = await fetch(`https://api.postalpincode.in/pincode/${value}`);
      const data = await response.json();
      if (data?.[0]?.Status === "Success" && data[0].PostOffice?.length > 0) {
        const postOffices = data[0].PostOffice as Array<{ Name: string; District: string; State: string }>;
        const first = postOffices[0];
        setValue("city", first.District, { shouldValidate: true });
        setValue("state", first.State, { shouldValidate: true });
        setValue("country", "India", { shouldValidate: true });
        setValue("locality", postOffices[0].Name, { shouldValidate: true });
        setLocalities([...new Set(postOffices.map((office) => office.Name))]);
        setCityLocked(true);
        setStateLocked(true);
        setPincodeStatus("success");
        setPincodeMessage(`${first.District}, ${first.State}`);
      } else {
        throw new Error("Pincode not found");
      }
    } catch {
      setPincodeStatus("error");
      setPincodeMessage("Could not fetch pincode data");
      setValue("city", "", { shouldValidate: true });
      setValue("state", "", { shouldValidate: true });
      setLocalities([]);
      setCityLocked(false);
      setStateLocked(false);
    }
  };

  const inputStyle = {
    width: "100%",
    padding: "11px 14px",
    background: "#0A0A0A",
    border: "1px solid #2A2A2A",
    borderRadius: "8px",
    color: "#fff",
    fontSize: "14px",
    outline: "none",
    boxSizing: "border-box" as const,
  };

  const lockedInputStyle = {
    ...inputStyle,
    border: "1px solid #22C55E",
    color: "#22C55E",
  };

  const labelStyle = {
    fontSize: "12px",
    color: "#666",
    marginBottom: "6px",
    display: "block",
  };

  const errorStyle = {
    fontSize: "11px",
    color: "#EF4444",
    marginTop: "4px",
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)}>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "14px" }}>
        <div>
          <label style={labelStyle}>Full Name *</label>
          <input {...register("fullName")} placeholder="Enter full name" style={inputStyle} />
          {errors.fullName ? <p style={errorStyle}>{errors.fullName.message}</p> : null}
        </div>

        <div>
          <label style={labelStyle}>Phone Number *</label>
          <div style={{ position: "relative" }}>
            <span style={{ position: "absolute", left: "12px", top: "50%", transform: "translateY(-50%)", color: "#888", fontSize: "14px" }}>+91</span>
            <input {...register("phone")} placeholder="10 digit number" maxLength={10} style={{ ...inputStyle, paddingLeft: "40px" }} />
          </div>
          {errors.phone ? <p style={errorStyle}>{errors.phone.message}</p> : null}
        </div>

        <div style={{ gridColumn: "1 / -1" }}>
          <label style={labelStyle}>Street Address *</label>
          <textarea {...register("street")} placeholder="House no, building, street name" rows={2} style={{ ...inputStyle, resize: "none", lineHeight: "1.5" }} />
          {errors.street ? <p style={errorStyle}>{errors.street.message}</p> : null}
        </div>

        <div>
          <label style={labelStyle}>Pincode *</label>
          <input value={watchedPincode || ""} onChange={handlePincodeChange} placeholder="6 digit pincode" maxLength={6} inputMode="numeric" style={inputStyle} />
          {pincodeStatus !== "idle" ? <div style={{ marginTop: "4px", fontSize: "12px", color: pincodeStatus === "loading" ? "#888" : pincodeStatus === "success" ? "#22C55E" : "#EF4444" }}>{pincodeMessage}</div> : null}
          {errors.pincode ? <p style={errorStyle}>{errors.pincode.message}</p> : null}
        </div>

        <div>
          <label style={labelStyle}>Area / Locality *</label>
          <select {...register("locality")} disabled={localities.length === 0} style={{ ...inputStyle, opacity: localities.length === 0 ? 0.4 : 1 }}>
            <option value="">{localities.length === 0 ? "Enter pincode first" : "Select your area"}</option>
            {localities.map((locality) => <option key={locality} value={locality}>{locality}</option>)}
          </select>
          {errors.locality ? <p style={errorStyle}>{errors.locality.message}</p> : null}
        </div>

        <div>
          <label style={labelStyle}>City *</label>
          <input {...register("city")} readOnly={cityLocked} placeholder="City" style={cityLocked ? lockedInputStyle : inputStyle} />
          {cityLocked ? <button type="button" onClick={() => setCityLocked(false)} style={{ marginTop: "4px", background: "none", border: "none", color: "#A5B4FC", fontSize: "10px", cursor: "pointer" }}>Edit</button> : null}
          {errors.city ? <p style={errorStyle}>{errors.city.message}</p> : null}
        </div>

        <div>
          <label style={labelStyle}>State *</label>
          <input {...register("state")} readOnly={stateLocked} placeholder="State" style={stateLocked ? lockedInputStyle : inputStyle} />
          {stateLocked ? <button type="button" onClick={() => setStateLocked(false)} style={{ marginTop: "4px", background: "none", border: "none", color: "#A5B4FC", fontSize: "10px", cursor: "pointer" }}>Edit</button> : null}
          {errors.state ? <p style={errorStyle}>{errors.state.message}</p> : null}
        </div>

        <div style={{ gridColumn: "1 / -1" }}>
          <label style={labelStyle}>Landmark (optional)</label>
          <input {...register("landmark")} placeholder="Near school, opposite park..." style={inputStyle} />
        </div>

        <div style={{ gridColumn: "1 / -1" }}>
          <label style={labelStyle}>Address Type</label>
          <div style={{ display: "flex", gap: "10px" }}>
            {(["Home", "Work", "Other"] as const).map((type) => (
              <button
                key={type}
                type="button"
                onClick={() => setValue("addressType", type)}
                style={{
                  padding: "8px 20px",
                  borderRadius: "99px",
                  border: "1px solid",
                  borderColor: watchedType === type ? "#6366F1" : "#2A2A2A",
                  background: watchedType === type ? "rgba(79,70,229,0.14)" : "transparent",
                  color: watchedType === type ? "#C7D2FE" : "#888",
                  fontWeight: 600,
                  fontSize: "13px",
                  cursor: "pointer",
                }}
              >
                {type}
              </button>
            ))}
          </div>
        </div>

        <div style={{ gridColumn: "1 / -1", display: "flex", alignItems: "center", gap: "10px" }}>
          <input {...register("isDefault")} type="checkbox" id="isDefault" style={{ width: "18px", height: "18px", accentColor: "#6366F1" }} />
          <label htmlFor="isDefault" style={{ fontSize: "14px", color: "#888" }}>Set as default address</label>
        </div>
      </div>

      <div style={{ display: "flex", gap: "12px", marginTop: "24px" }}>
        {onCancel ? <button type="button" onClick={onCancel} style={{ flex: 1, height: "46px", background: "transparent", border: "1px solid #2A2A2A", borderRadius: "8px", color: "#888", fontSize: "14px", fontWeight: 600, cursor: "pointer" }}>Cancel</button> : null}
        <LoadingButton type="submit" loading={isSubmitting} loadingText="Saving..." style={{ flex: 2, height: "46px", background: isSubmitting ? "#2A2A2A" : "linear-gradient(135deg,#4F46E5 0%,#4338CA 100%)", border: "none", borderRadius: "8px", color: isSubmitting ? "#666" : "#F8FAFC", fontSize: "14px", fontWeight: 700, cursor: isSubmitting ? "not-allowed" : "pointer", display: "inline-flex", alignItems: "center", justifyContent: "center", gap: 8 }}>{submitLabel}</LoadingButton>
      </div>
    </form>
  );
}
