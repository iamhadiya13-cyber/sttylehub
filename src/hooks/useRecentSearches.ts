"use client";

import { useCallback, useEffect, useMemo, useState } from "react";

const RECENT_SEARCHES_STORAGE_KEY = "stylehub:recent-searches";
const RECENT_SEARCHES_LIMIT = 10;
const RECENT_SEARCHES_TTL_MS = 30 * 24 * 60 * 60 * 1000;

export type RecentSearchEntry = {
  q: string;
  ts: number;
};

function sanitizeRecentSearches(entries: RecentSearchEntry[]) {
  const now = Date.now();
  const deduped = new Map<string, RecentSearchEntry>();

  entries
    .filter((entry) => entry.q && now - entry.ts < RECENT_SEARCHES_TTL_MS)
    .sort((a, b) => b.ts - a.ts)
    .forEach((entry) => {
      const key = entry.q.trim().toLowerCase();
      if (!key || deduped.has(key)) return;
      deduped.set(key, { q: entry.q.trim(), ts: entry.ts });
    });

  return Array.from(deduped.values()).slice(0, RECENT_SEARCHES_LIMIT);
}

function readRecentSearches() {
  if (typeof window === "undefined") return [] as RecentSearchEntry[];

  try {
    const raw = window.localStorage.getItem(RECENT_SEARCHES_STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as RecentSearchEntry[];
    const cleaned = sanitizeRecentSearches(Array.isArray(parsed) ? parsed : []);
    if (cleaned.length !== parsed.length) {
      window.localStorage.setItem(RECENT_SEARCHES_STORAGE_KEY, JSON.stringify(cleaned));
    }
    return cleaned;
  } catch {
    return [];
  }
}

function writeRecentSearches(entries: RecentSearchEntry[]) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(
    RECENT_SEARCHES_STORAGE_KEY,
    JSON.stringify(sanitizeRecentSearches(entries)),
  );
}

export function useRecentSearches() {
  const [items, setItems] = useState<RecentSearchEntry[]>([]);

  useEffect(() => {
    setItems(readRecentSearches());
  }, []);

  const addSearch = useCallback((query: string) => {
    const trimmed = query.trim();
    if (!trimmed) return;

    setItems((current) => {
      const next = sanitizeRecentSearches([{ q: trimmed, ts: Date.now() }, ...current]);
      writeRecentSearches(next);
      return next;
    });
  }, []);

  const removeSearch = useCallback((query: string) => {
    const key = query.trim().toLowerCase();
    setItems((current) => {
      const next = current.filter((entry) => entry.q.trim().toLowerCase() !== key);
      writeRecentSearches(next);
      return next;
    });
  }, []);

  const clearSearches = useCallback(() => {
    setItems([]);
    if (typeof window !== "undefined") {
      window.localStorage.removeItem(RECENT_SEARCHES_STORAGE_KEY);
    }
  }, []);

  return useMemo(
    () => ({
      items,
      addSearch,
      removeSearch,
      clearSearches,
      limit: RECENT_SEARCHES_LIMIT,
      ttlMs: RECENT_SEARCHES_TTL_MS,
    }),
    [addSearch, clearSearches, items, removeSearch],
  );
}
