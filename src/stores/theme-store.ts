"use client";

import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";

export type ThemeName = "void" | "infrared" | "arctic";

type ClickOrigin = {
  x: number;
  y: number;
};

type ThemeState = {
  theme: ThemeName;
  isChanging: boolean;
  clickOrigin: ClickOrigin;
  setTheme: (theme: ThemeName, x: number, y: number) => void;
  initTheme: (userId?: string | null) => Promise<void>;
  persistTheme: (theme: ThemeName, userId?: string | null) => void;
};

const THEME_STORAGE_KEY = "stylehub-theme";
const THEME_DURATION_MS = 700;
const allowedThemes = new Set<ThemeName>(["void", "infrared", "arctic"]);

let persistTimeout: number | null = null;
let changeTimeout: number | null = null;

function applyTheme(theme: ThemeName) {
  if (typeof document === "undefined") {
    return;
  }

  document.documentElement.setAttribute("data-theme", theme);
}

function parseStoredTheme(value: string | null): ThemeName {
  if (!value) {
    return "void";
  }

  try {
    const parsed = JSON.parse(value) as { state?: { theme?: string } };
    const nestedTheme = parsed?.state?.theme;
    if (nestedTheme && allowedThemes.has(nestedTheme as ThemeName)) {
      return nestedTheme as ThemeName;
    }
  } catch {
    if (allowedThemes.has(value as ThemeName)) {
      return value as ThemeName;
    }
  }

  return "void";
}

export const useThemeStore = create<ThemeState>()(
  persist(
    (set, get) => ({
      theme: "void",
      isChanging: false,
      clickOrigin: { x: 0, y: 0 },
      setTheme: (theme, x, y) => {
        if (!allowedThemes.has(theme)) {
          return;
        }

        if (changeTimeout) {
          window.clearTimeout(changeTimeout);
        }

        applyTheme(theme);
        set({
          theme,
          clickOrigin: { x, y },
          isChanging: true,
        });

        changeTimeout = window.setTimeout(() => {
          set({ isChanging: false });
        }, THEME_DURATION_MS);
      },
      initTheme: async (userId) => {
        const storedTheme =
          typeof window !== "undefined"
            ? parseStoredTheme(window.localStorage.getItem(THEME_STORAGE_KEY))
            : "void";

        applyTheme(storedTheme);
        set({ theme: storedTheme, isChanging: false });

        if (!userId) {
          return;
        }

        try {
          const response = await fetch("/api/user/profile", {
            method: "GET",
            credentials: "include",
            cache: "no-store",
          });

          if (!response.ok) {
            return;
          }

          const json = (await response.json()) as {
            data?: { colorway?: string };
          };

          const profileTheme = json.data?.colorway;
          if (!profileTheme || !allowedThemes.has(profileTheme as ThemeName)) {
            return;
          }

          const normalizedTheme = profileTheme as ThemeName;
          applyTheme(normalizedTheme);
          set({ theme: normalizedTheme, isChanging: false });
        } catch {
          // Local storage remains the fallback source of truth when the profile fetch fails.
        }
      },
      persistTheme: (theme, userId) => {
        if (typeof window === "undefined" || !allowedThemes.has(theme)) {
          return;
        }

        if (persistTimeout) {
          window.clearTimeout(persistTimeout);
        }

        persistTimeout = window.setTimeout(() => {
          if (!userId) {
            return;
          }

          void fetch("/api/user/profile", {
            method: "PATCH",
            headers: {
              "Content-Type": "application/json",
            },
            credentials: "include",
            body: JSON.stringify({ colorway: theme }),
          }).catch(() => {
            // Local persistence is intentionally allowed to succeed silently if the network save fails.
          });
        }, 500);
      },
    }),
    {
      name: THEME_STORAGE_KEY,
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({ theme: state.theme }),
    },
  ),
);
