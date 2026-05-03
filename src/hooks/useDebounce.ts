"use client";

import { useCallback, useRef } from "react";

export function useDebounceCallback<T extends unknown[]>(
  callback: (...args: T) => void | Promise<void>,
  delay = 500,
) {
  const lastCall = useRef(0);
  const isLoading = useRef(false);

  return useCallback(
    async (...args: T) => {
      const now = Date.now();
      if (now - lastCall.current < delay) return;
      if (isLoading.current) return;
      lastCall.current = now;
      isLoading.current = true;
      try {
        await callback(...args);
      } finally {
        isLoading.current = false;
      }
    },
    [callback, delay],
  );
}
