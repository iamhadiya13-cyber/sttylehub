"use client";

import { useCallback, useState } from "react";

type AsyncOrSync<T> = Promise<T> | T;

export function useButtonLoading() {
  const [loading, setLoading] = useState(false);

  const trigger = useCallback(async <T,>(task: () => AsyncOrSync<T>): Promise<T> => {
    setLoading(true);
    try {
      return await task();
    } finally {
      setLoading(false);
    }
  }, []);

  return { loading, trigger };
}
