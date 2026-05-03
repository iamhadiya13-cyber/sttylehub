"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";
import { useThemeStore } from "@/stores/theme-store";

type ThemeBootstrapProps = {
  userId?: string | null;
};

export default function ThemeBootstrap({ userId }: ThemeBootstrapProps) {
  const pathname = usePathname() || "/";
  const initTheme = useThemeStore((state) => state.initTheme);

  useEffect(() => {
    const isBackoffice = pathname.startsWith("/admin") || pathname.startsWith("/seller");

    if (isBackoffice) {
      document.documentElement.setAttribute("data-theme", "void");
      return;
    }

    void initTheme(userId);
  }, [initTheme, pathname, userId]);

  return null;
}
