"use client";

import { useSession } from "next-auth/react";
import { Palette } from "lucide-react";
import { cn } from "@/lib/utils";
import { useThemeStore, type ThemeName } from "@/stores/theme-store";

const themes: Array<{ name: ThemeName; label: string; accent: string }> = [
  { name: "void", label: "VOID", accent: "#7F77DD" },
  { name: "infrared", label: "INFRARED", accent: "#FF4D1C" },
  { name: "arctic", label: "ARCTIC", accent: "#2563EB" },
];

export default function ThemeSwitcherPill() {
  const { data: session } = useSession();
  const theme = useThemeStore((state) => state.theme);
  const setTheme = useThemeStore((state) => state.setTheme);
  const persistTheme = useThemeStore((state) => state.persistTheme);

  return (
    <div className="fixed right-4 top-1/2 z-[100] hidden -translate-y-1/2 lg:block">
      <div
        className="group w-[36px] overflow-hidden rounded-[22px] border transition-[width] duration-250 ease-out hover:w-[120px]"
        style={{
          background: "rgba(var(--bg-elevated-rgb), 0.88)",
          borderColor: "var(--border-default)",
          boxShadow: "0 18px 40px rgba(var(--shadow-color-rgb), 0.24)",
        }}
      >
        <div
          className="relative flex h-[132px] w-[36px] flex-col items-center justify-start gap-3 px-1.5 py-3 transition-[width] duration-250 ease-out group-hover:w-[120px] group-hover:items-start group-hover:px-3"
          style={{
            borderLeft: "2px solid var(--accent-primary)",
            background: "rgba(var(--bg-elevated-rgb), 0.88)",
          }}
        >
          <div className="flex w-full items-center justify-center group-hover:justify-start">
            <Palette className="h-4 w-4" style={{ color: "var(--text-secondary)" }} />
          </div>
          <div className="flex w-full flex-col gap-2">
            {themes.map((entry) => {
              const active = entry.name === theme;
              return (
                <button
                  key={entry.name}
                  type="button"
                  onClick={(event) => {
                    setTheme(entry.name, event.clientX, event.clientY);
                    persistTheme(entry.name, session?.user.id);
                  }}
                  className="flex items-center gap-2 rounded-full"
                  title={entry.label}
                >
                  <span
                    className={cn(
                      "inline-flex h-7 w-7 shrink-0 rounded-full border-2 transition",
                      active ? "scale-100" : "scale-95",
                    )}
                    style={{
                      background: entry.accent,
                      borderColor: active ? "white" : "transparent",
                      boxShadow: active ? "0 0 0 1px rgba(var(--shadow-color-rgb), 0.1)" : "none",
                    }}
                  />
                  <span
                    className="max-w-0 overflow-hidden text-[10px] font-bold uppercase tracking-[0.18em] opacity-0 transition-all duration-200 group-hover:max-w-[70px] group-hover:opacity-100"
                    style={{ color: "var(--text-secondary)" }}
                  >
                    {entry.label}
                  </span>
                </button>
              );
            })}
          </div>
          <div
            className="mt-auto hidden w-full text-left text-[10px] font-bold uppercase tracking-[0.22em] group-hover:block"
            style={{ color: "var(--accent-primary)" }}
          >
            {theme}
          </div>
        </div>
      </div>
    </div>
  );
}
