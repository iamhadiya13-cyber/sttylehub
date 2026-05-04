/* eslint-disable react-hooks/set-state-in-effect */

"use client";

import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";

export default function TopLoadingBar() {
  const pathname = usePathname();
  const [loading, setLoading] = useState(false);
  const [progress, setProgress] = useState(0);

  // eslint-disable-next-line react-hooks/set-state-in-effect -- route transitions intentionally drive the loading bar state machine
  useEffect(() => {
    setLoading(true);
    setProgress(10);

    const t1 = window.setTimeout(() => setProgress(40), 100);
    const t2 = window.setTimeout(() => setProgress(70), 300);
    const t3 = window.setTimeout(() => setProgress(90), 600);
    const t4 = window.setTimeout(() => {
      setProgress(100);
      window.setTimeout(() => {
        setLoading(false);
        setProgress(0);
      }, 200);
    }, 800);

    return () => {
      window.clearTimeout(t1);
      window.clearTimeout(t2);
      window.clearTimeout(t3);
      window.clearTimeout(t4);
    };
  }, [pathname]);

  if (!loading && progress === 0) return null;

  return (
    <div
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        right: 0,
        height: 2,
        zIndex: 9999,
        background: "transparent",
      }}
    >
      <div
        style={{
          height: "100%",
          width: `${progress}%`,
          background: "linear-gradient(90deg, #6366F1 0%, #818CF8 100%)",
          transition: "width 0.3s ease",
          boxShadow: "0 0 10px rgba(129,140,248,0.55)",
        }}
      />
    </div>
  );
}
