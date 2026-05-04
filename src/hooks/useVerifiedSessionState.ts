/* eslint-disable react-hooks/set-state-in-effect */

"use client";

import { useEffect, useMemo, useState } from "react";
import { useSession } from "next-auth/react";

type VerificationSnapshot = {
  isVerified: boolean;
  fetchedAt: number;
};

const VERIFICATION_CACHE_TTL_MS = 15_000;
const verificationCache = new Map<string, VerificationSnapshot>();
const verificationRequests = new Map<string, Promise<boolean>>();
const verificationUpdateTriggered = new Set<string>();

function getFreshVerification(userId: string) {
  const snapshot = verificationCache.get(userId);
  if (!snapshot) return null;
  if (Date.now() - snapshot.fetchedAt > VERIFICATION_CACHE_TTL_MS) {
    verificationCache.delete(userId);
    return null;
  }
  return snapshot.isVerified;
}

async function fetchVerificationState(userId: string) {
  const cached = getFreshVerification(userId);
  if (cached !== null) {
    return cached;
  }

  const existing = verificationRequests.get(userId);
  if (existing) {
    return existing;
  }

  const request = fetch("/api/user/profile", {
    method: "GET",
    cache: "no-store",
    headers: { "Content-Type": "application/json" },
  })
    .then(async (response) => {
      const json = (await response.json().catch(() => null)) as
        | { success?: boolean; data?: { isVerified?: boolean } }
        | null;
      const isVerified = Boolean(response.ok && json?.success && json?.data?.isVerified);
      verificationCache.set(userId, {
        isVerified,
        fetchedAt: Date.now(),
      });
      return isVerified;
    })
    .finally(() => {
      verificationRequests.delete(userId);
    });

  verificationRequests.set(userId, request);
  return request;
}

export function useVerifiedSessionState() {
  const sessionState = useSession();
  const { data: session, status, update } = sessionState;
  const userId = session?.user?.id;
  const sessionVerified = session?.user?.isVerified;
  const cachedVerification =
    userId && status === "authenticated" ? getFreshVerification(userId) : null;
  const [resolvedFromDb, setResolvedFromDb] = useState<boolean | null>(cachedVerification);
  const [isVerificationSyncing, setIsVerificationSyncing] = useState(false);

  // eslint-disable-next-line react-hooks/set-state-in-effect -- this hook mirrors session and profile verification state into local sync flags
  useEffect(() => {
    if (!userId || status !== "authenticated") {
      setResolvedFromDb(null);
      setIsVerificationSyncing(false);
      return;
    }

    if (sessionVerified === true) {
      verificationCache.set(userId, { isVerified: true, fetchedAt: Date.now() });
      setResolvedFromDb(true);
      setIsVerificationSyncing(false);
      return;
    }

    if (sessionVerified !== false) {
      setIsVerificationSyncing(false);
      return;
    }

    const cached = getFreshVerification(userId);
    if (cached !== null) {
      setResolvedFromDb(cached);
      setIsVerificationSyncing(false);
      return;
    }

    let cancelled = false;
    setIsVerificationSyncing(true);

    void fetchVerificationState(userId).then((isVerified) => {
      if (cancelled) return;
      setResolvedFromDb(isVerified);
      setIsVerificationSyncing(false);

      if (isVerified && !verificationUpdateTriggered.has(userId)) {
        verificationUpdateTriggered.add(userId);
        void update({ isVerified: true });
      }
    });

    return () => {
      cancelled = true;
    };
  }, [sessionVerified, status, update, userId]);

  const resolvedIsVerified = useMemo(() => {
    if (status !== "authenticated") return false;
    return Boolean(sessionVerified || resolvedFromDb);
  }, [resolvedFromDb, sessionVerified, status]);

  return {
    ...sessionState,
    resolvedIsVerified,
    isVerificationSyncing,
  };
}
