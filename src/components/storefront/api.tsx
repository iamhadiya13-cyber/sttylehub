"use client";

import { useCallback, useEffect, useRef, useState } from "react";

const clientCache = new Map<string, { expiresAt: number; value: unknown }>();
const inflightRequests = new Map<string, Promise<unknown>>();

function getFreshClientCache<T>(cacheKey: string) {
  const cached = clientCache.get(cacheKey);
  if (!cached || cached.expiresAt <= Date.now()) {
    if (cached) {
      clientCache.delete(cacheKey);
    }
    return null;
  }
  return cached.value as { success: boolean; data?: T; message?: string };
}

export type ApiState<T> = {
  data: T;
  loading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
};

type FetchJsonOptions = {
  cacheTtlMs?: number;
  cacheKey?: string;
};

type UseApiOptions = {
  enabled?: boolean;
  cacheTtlMs?: number;
  keepPreviousData?: boolean;
};

export async function fetchJson<T>(
  input: string,
  init?: RequestInit,
  options?: FetchJsonOptions,
): Promise<{ success: boolean; data?: T; message?: string }> {
  const method = init?.method || "GET";
  const cacheKey = options?.cacheKey || `${method}:${input}`;
  const cacheTtlMs = method === "GET" ? options?.cacheTtlMs || 0 : 0;

  if (cacheTtlMs > 0) {
    const cached = getFreshClientCache<T>(cacheKey);
    if (cached) {
      return cached;
    }
    const existingRequest = inflightRequests.get(cacheKey);
    if (existingRequest) {
      return existingRequest as Promise<{ success: boolean; data?: T; message?: string }>;
    }
  }

  const requestPromise = (async () => {
    const response = await fetch(input, {
      ...init,
      headers: {
        "Content-Type": "application/json",
        ...(init?.headers ?? {}),
      },
      cache: "no-store",
    });

    const json = (await response
      .json()
      .catch(() => ({ success: false, message: "Unexpected response" }))) as {
      success: boolean;
      data?: T;
      message?: string;
    };

    if (!response.ok || !json.success) {
      throw new Error(json.message || "Request failed");
    }

    if (cacheTtlMs > 0) {
      clientCache.set(cacheKey, {
        expiresAt: Date.now() + cacheTtlMs,
        value: json,
      });
    }

    return json;
  })();

  if (cacheTtlMs > 0) {
    inflightRequests.set(cacheKey, requestPromise);
  }

  try {
    return await requestPromise;
  } finally {
    inflightRequests.delete(cacheKey);
  }
}

export function useApi<T>(url: string | null, initial: T, options?: UseApiOptions): ApiState<T> {
  const initialRef = useRef(initial);
  const keepPreviousData = options?.keepPreviousData ?? false;
  const enabled = options?.enabled ?? true;
  const [data, setData] = useState<T>(initial);
  const [loading, setLoading] = useState(Boolean(url && enabled));
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!url || !enabled) {
      setLoading(false);
      setError(null);
      if (!keepPreviousData) {
        setData(initialRef.current);
      }
      return;
    }

    const cacheKey = `GET:${url}`;
    const cached = options?.cacheTtlMs ? getFreshClientCache<T>(cacheKey) : null;
    if (cached) {
      setData((cached.data as T) ?? initialRef.current);
      setLoading(false);
      setError(null);
      return;
    }

    setLoading(true);
    setError(null);
    if (!keepPreviousData) {
      setData(initialRef.current);
    }
  }, [enabled, keepPreviousData, options?.cacheTtlMs, url]);

  const refetch = useCallback(async () => {
    if (!url || !enabled) {
      setLoading(false);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const json = await fetchJson<T>(url, { method: "GET" }, { cacheTtlMs: options?.cacheTtlMs });
      setData((json.data as T) ?? initialRef.current);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load data");
      if (!keepPreviousData) {
        setData(initialRef.current);
      }
    } finally {
      setLoading(false);
    }
  }, [enabled, keepPreviousData, options?.cacheTtlMs, url]);

  useEffect(() => {
    void refetch();
  }, [refetch]);

  return { data, loading, error, refetch };
}

export function useDebouncedValue<T>(value: T, delay = 300) {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const timeout = window.setTimeout(() => setDebounced(value), delay);
    return () => window.clearTimeout(timeout);
  }, [value, delay]);
  return debounced;
}
