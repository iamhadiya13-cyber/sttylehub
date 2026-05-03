"use client";

import { useEffect, useMemo } from "react";
import { usePathname, useSearchParams } from "next/navigation";
import { useLoadingStore } from "@/stores/loading-store";

export default function PageLoadingOverlay() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const loading = useLoadingStore((state) => state.loading);
  const setLoading = useLoadingStore((state) => state.setLoading);

  const searchKey = useMemo(() => searchParams?.toString() ?? "", [searchParams]);

  useEffect(() => {
    setLoading(false);
  }, [pathname, searchKey, setLoading]);

  if (!loading) {
    return null;
  }

  return (
    <>
      <style>{`
        @keyframes pageLoadingFadeIn {
          from {
            opacity: 0;
          }
          to {
            opacity: 1;
          }
        }

        @keyframes swingTag {
          0% {
            transform: rotate(-12deg);
          }
          50% {
            transform: rotate(12deg);
          }
          100% {
            transform: rotate(-12deg);
          }
        }
      `}</style>
      <div
        style={{
          position: "fixed",
          inset: 0,
          zIndex: 9999,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          background: "rgba(0, 0, 0, 0.45)",
          backdropFilter: "blur(7px)",
          WebkitBackdropFilter: "blur(7px)",
          animation: "pageLoadingFadeIn 0.2s ease-out",
          pointerEvents: "auto",
        }}
        aria-live="polite"
        aria-busy="true"
      >
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <div
            style={{
              position: "relative",
              width: "52px",
              height: "96px",
              transformOrigin: "50% 0%",
              animation: "swingTag 1.4s ease-in-out infinite",
            }}
          >
            <div
              style={{
                position: "absolute",
                top: 0,
                left: "50%",
                width: "1px",
                height: "18px",
                background: "#555",
                transform: "translateX(-50%)",
              }}
            />
            <div
              style={{
                position: "absolute",
                top: "14px",
                left: "50%",
                width: "10px",
                height: "10px",
                border: "1.5px solid #7F77DD",
                borderRadius: "999px",
                background: "transparent",
                transform: "translateX(-50%)",
                boxSizing: "border-box",
              }}
            />
            <div
              style={{
                position: "absolute",
                top: "18px",
                left: "50%",
                width: "52px",
                height: "68px",
                border: "1.5px solid #7F77DD",
                borderRadius: "3px",
                background: "transparent",
                transform: "translateX(-50%)",
                boxSizing: "border-box",
              }}
            >
              <div
                style={{
                  display: "flex",
                  height: "100%",
                  flexDirection: "column",
                  alignItems: "center",
                  justifyContent: "flex-start",
                  paddingTop: "38px",
                  boxSizing: "border-box",
                }}
              >
                <div
                  style={{
                    width: "32px",
                    height: "1.5px",
                    borderRadius: "1px",
                    background: "#7F77DD",
                  }}
                />
                <div
                  style={{
                    width: "32px",
                    height: "1.5px",
                    marginTop: "6px",
                    borderRadius: "1px",
                    background: "#7F77DD",
                  }}
                />
                <div
                  style={{
                    width: "22px",
                    height: "1px",
                    marginTop: "8px",
                    borderRadius: "1px",
                    background: "rgba(175, 169, 236, 0.6)",
                  }}
                />
              </div>
            </div>
          </div>
          <div
            style={{
              marginTop: "20px",
              color: "rgba(255, 255, 255, 0.6)",
              fontSize: "12px",
              letterSpacing: "0.12em",
              textTransform: "uppercase",
              textAlign: "center",
            }}
          >
            Loading...
          </div>
        </div>
      </div>
    </>
  );
}
