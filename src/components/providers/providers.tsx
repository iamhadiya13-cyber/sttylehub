"use client";

import type { Session } from "next-auth";
import { SessionProvider } from "next-auth/react";
import { Toaster } from "react-hot-toast";
import { NavigationLoadingProvider } from "@/components/providers/navigation-loading-provider";
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
        {children}
        <WishlistUndoSync />
        <Toaster
          position="top-right"
          toastOptions={{
            className: "!rounded-2xl !border !border-white/10 !bg-black/85 !text-white",
            duration: 3500,
          }}
        />
      </NavigationLoadingProvider>
    </SessionProvider>
  );
}
