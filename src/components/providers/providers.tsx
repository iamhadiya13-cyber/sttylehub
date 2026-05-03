"use client";

import type { Session } from "next-auth";
import { SessionProvider } from "next-auth/react";
import { Toaster } from "react-hot-toast";
import { NavigationLoadingProvider } from "@/components/providers/navigation-loading-provider";
import ThemeBootstrap from "@/components/providers/theme-bootstrap";
import WishlistUndoSync from "@/components/ui/WishlistUndoSync";

export function Providers({
  children,
  session,
}: {
  children: React.ReactNode;
  session: Session | null;
}) {
  return (
    <SessionProvider session={session} refetchOnWindowFocus={false} refetchWhenOffline={false}>
      <NavigationLoadingProvider>
        <ThemeBootstrap userId={session?.user.id ?? null} />
        {children}
        <WishlistUndoSync />
        <Toaster
          position="top-right"
          toastOptions={{
            className:
              "!rounded-2xl !border !bg-[var(--bg-elevated)] !text-[var(--text-primary)]",
            style: {
              borderColor: "var(--border-default)",
              boxShadow: "0 18px 40px rgba(var(--shadow-color-rgb), 0.28)",
            },
            duration: 3500,
          }}
        />
      </NavigationLoadingProvider>
    </SessionProvider>
  );
}
