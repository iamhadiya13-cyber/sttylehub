"use client";

import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";

export const SPLASH_DURATION_MS = 2300;

export default function BrandSplash() {
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    const timeout = window.setTimeout(() => {
      setVisible(false);
    }, SPLASH_DURATION_MS);

    return () => window.clearTimeout(timeout);
  }, []);

  return (
    <AnimatePresence>
      {visible ? (
        <motion.div
          initial={{ opacity: 1 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0, transition: { duration: 0.01, ease: "linear" } }}
          style={{
            pointerEvents: "none",
            position: "fixed",
            inset: 0,
            zIndex: 9999,
            overflow: "hidden",
            background: "#000000",
            animation: "brandSplashFadeOut 0.4s ease-out 1.9s forwards",
          }}
        >
          <style>{`
            @keyframes brandSplashCurtainLeft {
              0% {
                transform: translateX(0) scaleX(1);
              }
              100% {
                transform: translateX(-108%) scaleX(1.04);
              }
            }

            @keyframes brandSplashCurtainRight {
              0% {
                transform: translateX(0) scaleX(1);
              }
              100% {
                transform: translateX(108%) scaleX(1.04);
              }
            }

            @keyframes brandSplashReveal {
              0% {
                opacity: 0;
                transform: translate(-50%, -50%) scale(0.92);
              }
              100% {
                opacity: 1;
                transform: translate(-50%, -50%) scale(1);
              }
            }

            @keyframes brandSplashFadeOut {
              0% {
                opacity: 1;
              }
              100% {
                opacity: 0;
              }
            }
          `}</style>
          <div
            style={{
              position: "absolute",
              inset: 0,
              background: "#000000",
            }}
          />
          <div
            style={{
              position: "absolute",
              top: 0,
              left: 0,
              width: "50vw",
              height: "100vh",
              background: "#0d0d0d",
              borderRight: "1px solid #1a1a1a",
              transformOrigin: "left center",
              animation: "brandSplashCurtainLeft 1s cubic-bezier(0.76, 0, 0.24, 1) 0.3s forwards",
            }}
          />
          <div
            style={{
              position: "absolute",
              top: 0,
              right: 0,
              width: "50vw",
              height: "100vh",
              background: "#0d0d0d",
              borderLeft: "1px solid #1a1a1a",
              transformOrigin: "right center",
              animation: "brandSplashCurtainRight 1s cubic-bezier(0.76, 0, 0.24, 1) 0.3s forwards",
            }}
          />
          <div
            style={{
              position: "absolute",
              top: "50%",
              left: "50%",
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
              opacity: 0,
              transform: "translate(-50%, -50%) scale(0.92)",
              animation: "brandSplashReveal 0.8s ease-out 0.3s forwards",
              width: "min(90vw, 420px)",
              textAlign: "center",
            }}
          >
            <div
              style={{
                width: "72px",
                height: "72px",
                borderRadius: "999px",
                background: "#7F77DD",
                color: "#FFFFFF",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: "28px",
                fontWeight: 700,
                lineHeight: 1,
              }}
            >
              S
            </div>
            <div
              style={{
                marginTop: "16px",
                color: "#FFFFFF",
                fontWeight: 900,
                fontSize: "28px",
                letterSpacing: "0.3em",
                textTransform: "uppercase",
                paddingLeft: "0.3em",
                lineHeight: 1.1,
              }}
            >
              STYLEHUB
            </div>
            <div
              style={{
                marginTop: "6px",
                width: "70px",
                height: "1px",
                background: "#7F77DD",
              }}
            />
            <div
              style={{
                marginTop: "6px",
                color: "#7F77DD",
                fontSize: "9px",
                letterSpacing: "0.45em",
                textTransform: "uppercase",
                paddingLeft: "0.45em",
                lineHeight: 1.2,
              }}
            >
              PREMIUM STREETWEAR
            </div>
          </div>
        </motion.div>
      ) : null}
    </AnimatePresence>
  );
}
