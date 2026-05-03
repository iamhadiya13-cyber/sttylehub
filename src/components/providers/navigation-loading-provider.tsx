"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { flushSync } from "react-dom";
import { usePathname, useSearchParams } from "next/navigation";

type NavigationLoadingContextValue = {
  beginNavigation: (href: string) => boolean;
  clearNavigation: () => void;
  isNavigating: boolean;
  pendingHref: string | null;
  isPendingHref: (href: string) => boolean;
};

const NavigationLoadingContext = createContext<NavigationLoadingContextValue | null>(null);

function normalizeHref(href: string) {
  return href.trim();
}

export function NavigationLoadingProvider({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [pendingHref, setPendingHref] = useState<string | null>(null);
  const [isNavigating, setIsNavigating] = useState(false);
  const startedAtRef = useRef<number | null>(null);

  const currentRoute = useMemo(() => {
    const params = searchParams?.toString();
    return params ? `${pathname}?${params}` : pathname;
  }, [pathname, searchParams]);

  const clearNavigation = useCallback(() => {
    setIsNavigating(false);
    setPendingHref(null);
    startedAtRef.current = null;
  }, []);

  const beginNavigation = useCallback(
    (href: string) => {
      const nextHref = normalizeHref(href);

      if (!nextHref || nextHref === currentRoute || isNavigating) {
        return false;
      }

      flushSync(() => {
        setPendingHref(nextHref);
        setIsNavigating(true);
      });
      startedAtRef.current = typeof performance !== "undefined" ? performance.now() : Date.now();
      return true;
    },
    [currentRoute, isNavigating],
  );

  const isPendingHref = useCallback(
    (href: string) => {
      if (!pendingHref) {
        return false;
      }

      return pendingHref === normalizeHref(href);
    },
    [pendingHref],
  );

  useEffect(() => {
    if (!isNavigating) {
      return;
    }

    const startedAt = startedAtRef.current ?? 0;
    const now = typeof performance !== "undefined" ? performance.now() : Date.now();
    const minimumVisibleMs = 260;
    const remaining = Math.max(0, minimumVisibleMs - (now - startedAt));
    const timeoutId = window.setTimeout(() => {
      clearNavigation();
    }, remaining);

    return () => window.clearTimeout(timeoutId);
  }, [clearNavigation, currentRoute, isNavigating]);

  useEffect(() => {
    if (!isNavigating) {
      return;
    }

    const timeoutId = window.setTimeout(() => {
      clearNavigation();
    }, 12000);

    return () => window.clearTimeout(timeoutId);
  }, [clearNavigation, isNavigating]);

  const value = useMemo<NavigationLoadingContextValue>(
    () => ({
      beginNavigation,
      clearNavigation,
      isNavigating,
      pendingHref,
      isPendingHref,
    }),
    [beginNavigation, clearNavigation, isNavigating, pendingHref, isPendingHref],
  );

  return (
    <NavigationLoadingContext.Provider value={value}>
      {children}
    </NavigationLoadingContext.Provider>
  );
}

export function useNavigationLoading() {
  const context = useContext(NavigationLoadingContext);

  if (!context) {
    throw new Error("useNavigationLoading must be used within NavigationLoadingProvider");
  }

  return context;
}
