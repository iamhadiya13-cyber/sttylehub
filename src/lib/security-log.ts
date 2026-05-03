type SecurityLevel = "info" | "warn" | "error";

function sanitize(details: Record<string, unknown>) {
  return Object.fromEntries(
    Object.entries(details).filter(([, value]) => value !== undefined),
  );
}

export function logSecurityEvent(
  event: string,
  details: Record<string, unknown> = {},
  level: SecurityLevel = "warn",
) {
  const payload = {
    event,
    at: new Date().toISOString(),
    ...sanitize(details),
  };

  if (level === "error") {
    console.error("[security]", payload);
    return;
  }

  if (level === "info") {
    console.info("[security]", payload);
    return;
  }

  console.warn("[security]", payload);
}
