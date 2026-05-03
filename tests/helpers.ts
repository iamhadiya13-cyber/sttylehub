export function stubMethod(
  target: Record<string, any>,
  key: string,
  impl: any,
) {
  const original = target[key];
  Object.defineProperty(target, key, {
    value: impl,
    configurable: true,
    writable: true,
  });
  return () => {
    Object.defineProperty(target, key, {
      value: original,
      configurable: true,
      writable: true,
    });
  };
}

export function restoreAll(restorers: Array<() => void>) {
  while (restorers.length > 0) {
    const restore = restorers.pop();
    restore?.();
  }
}
