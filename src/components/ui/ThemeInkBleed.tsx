"use client";

import { useEffect, useMemo, useState } from "react";
import { usePathname } from "next/navigation";
import { useThemeStore, type ThemeName } from "@/stores/theme-store";

const themeBackgrounds: Record<ThemeName, string> = {
  void: "#05050a",
  infrared: "#080305",
  arctic: "#f4f6f9",
};

export default function ThemeInkBleed() {
  const pathname = usePathname() || "/";
  const theme = useThemeStore((state) => state.theme);
  const isChanging = useThemeStore((state) => state.isChanging);
  const clickOrigin = useThemeStore((state) => state.clickOrigin);
  const [expanded, setExpanded] = useState(false);
  const [visible, setVisible] = useState(false);
  const [fading, setFading] = useState(false);

  const isBackoffice = pathname.startsWith("/admin") || pathname.startsWith("/seller");

  useEffect(() => {
    if (!isChanging || isBackoffice) {
      return;
    }

    setVisible(true);
    setExpanded(false);
    setFading(false);

    const frameId = window.requestAnimationFrame(() => {
      setExpanded(true);
    });

    const fadeStartTimeout = window.setTimeout(() => {
      setFading(true);
    }, 560);

    const fadeTimeout = window.setTimeout(() => {
      setVisible(false);
      setExpanded(false);
      setFading(false);
    }, 680);

    return () => {
      window.cancelAnimationFrame(frameId);
      window.clearTimeout(fadeStartTimeout);
      window.clearTimeout(fadeTimeout);
    };
  }, [isBackoffice, isChanging, theme]);

  const clipPath = useMemo(
    () =>
      expanded
        ? `circle(150% at ${clickOrigin.x}px ${clickOrigin.y}px)`
        : `circle(0% at ${clickOrigin.x}px ${clickOrigin.y}px)`,
    [clickOrigin.x, clickOrigin.y, expanded],
  );

  if (!visible || isBackoffice) {
    return null;
  }

  return (
    <div
      aria-hidden="true"
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 9998,
        pointerEvents: "none",
        background: themeBackgrounds[theme],
        clipPath,
        opacity: fading ? 0 : 1,
        transition:
          "clip-path 0.65s cubic-bezier(0.4, 0, 0.2, 1), opacity 0.1s ease-out 0.58s",
      }}
    />
  );
}
