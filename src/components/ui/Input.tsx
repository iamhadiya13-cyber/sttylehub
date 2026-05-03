"use client";

import { forwardRef, useId, type InputHTMLAttributes, type ReactNode } from "react";
import { cn } from "@/lib/utils";

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  hint?: string;
  prefix?: string;
  suffix?: ReactNode;
}

const Input = forwardRef<HTMLInputElement, InputProps>(function Input(
  { label, error, hint, prefix, suffix, ...props },
  ref,
) {
  const generatedId = useId();
  const inputId = props.id || generatedId;
  const descriptionId = error ? `${inputId}-error` : undefined;

  return (
    <div>
      {label ? (
        <label
          htmlFor={inputId}
          style={{
            fontSize: 12,
            color: "#AEB6C7",
            marginBottom: 6,
            display: "block",
            fontWeight: 600,
            letterSpacing: 0.3,
          }}
        >
          <span>{label}</span>
        </label>
      ) : null}
      <div style={{ position: "relative" }}>
        {prefix ? (
          <span
            style={{
              position: "absolute",
              left: 14,
              top: "50%",
              transform: "translateY(-50%)",
              color: "#9CA3AF",
              fontSize: 14,
              pointerEvents: "none",
            }}
          >
            {prefix}
          </span>
        ) : null}
        <input
          ref={ref}
          {...props}
          id={inputId}
          aria-invalid={Boolean(error)}
          aria-describedby={descriptionId}
          className={cn(props.className)}
          style={{
            width: "100%",
            padding: prefix ? "11px 14px 11px 44px" : "11px 14px",
            paddingRight: suffix ? "40px" : "14px",
            background: "#090B14",
            border: `1px solid ${error ? "#EF4444" : "rgba(255,255,255,0.1)"}`,
            borderRadius: 12,
            color: "#F4F1EA",
            fontSize: 14,
            outline: "none",
            boxSizing: "border-box",
            fontFamily: "inherit",
            transition: "border-color 0.15s",
            ...(props.style || {}),
          }}
          onFocus={(event) => {
            event.currentTarget.style.borderColor = error ? "#EF4444" : "#6366F1";
            event.currentTarget.style.boxShadow = error
              ? "0 0 0 2px rgba(239,68,68,0.08)"
              : "0 0 0 3px rgba(99,102,241,0.16)";
            props.onFocus?.(event);
          }}
          onBlur={(event) => {
            event.currentTarget.style.borderColor = error ? "#EF4444" : "rgba(255,255,255,0.1)";
            event.currentTarget.style.boxShadow = "none";
            props.onBlur?.(event);
          }}
        />
        {suffix ? (
          <div
            style={{
              position: "absolute",
              right: 12,
              top: "50%",
              transform: "translateY(-50%)",
            }}
          >
            {suffix}
          </div>
        ) : null}
      </div>
      {error ? (
        <p
          id={`${inputId}-error`}
          style={{
            fontSize: 11,
            color: "#EF4444",
            marginTop: 4,
            display: "flex",
            alignItems: "center",
            gap: 4,
          }}
        >
          Error: {error}
        </p>
      ) : null}
    </div>
  );
});

Input.displayName = "Input";

export default Input;
