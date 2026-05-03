import { Ratelimit } from "@upstash/ratelimit";
import { NextResponse } from "next/server";
import { getRedisClient } from "@/lib/redis";
import { logSecurityEvent } from "@/lib/security-log";

type RateLimitConfig = {
  request: Request;
  prefix: string;
  limit: number;
  windowMs: number;
  identifier?: string;
  message?: string;
};

type MemoryWindow = {
  hits: number[];
};

const memoryLimits = new Map<string, MemoryWindow>();
const limiters = new Map<string, Ratelimit>();

function formatWindow(windowMs: number) {
  const seconds = Math.max(1, Math.ceil(windowMs / 1000));
  return `${seconds} s` as const;
}

function getLimiter(limit: number, windowMs: number) {
  const key = `${limit}:${windowMs}`;
  const existing = limiters.get(key);
  if (existing) {
    return existing;
  }

  const redis = getRedisClient();
  if (!redis) {
    return null;
  }

  const next = new Ratelimit({
    redis,
    limiter: Ratelimit.slidingWindow(limit, formatWindow(windowMs)),
    analytics: false,
    prefix: "stylehub:ratelimit",
  });

  limiters.set(key, next);
  return next;
}

export function getRequestIdentifier(request: Request) {
  const forwarded = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim();
  const realIp = request.headers.get("x-real-ip")?.trim();
  const cfIp = request.headers.get("cf-connecting-ip")?.trim();

  return forwarded || realIp || cfIp || "anonymous";
}

export async function enforceRateLimit({
  request,
  prefix,
  limit,
  windowMs,
  identifier,
  message = "Too many requests. Please try again shortly.",
}: RateLimitConfig) {
  const target = `${prefix}:${identifier || getRequestIdentifier(request)}`;
  const redisLimiter = getLimiter(limit, windowMs);

  if (redisLimiter) {
    try {
      const result = await redisLimiter.limit(target);
      if (!result.success) {
        const retryAfterSeconds = Math.max(1, Math.ceil((result.reset - Date.now()) / 1000));
        logSecurityEvent("rate_limit.blocked", { prefix, target, retryAfterSeconds });
        return NextResponse.json({ success: false, message, retryAfterSeconds }, { status: 429 });
      }

      return null;
    } catch {
      // Fall through to in-memory path.
    }
  }

  const now = Date.now();
  const current = memoryLimits.get(target) || { hits: [] };
  current.hits = current.hits.filter((value) => now - value < windowMs);

  if (current.hits.length >= limit) {
    memoryLimits.set(target, current);
    const retryAfterSeconds = Math.max(1, Math.ceil((current.hits[0] + windowMs - now) / 1000));
    logSecurityEvent("rate_limit.blocked", { prefix, target, retryAfterSeconds });
    return NextResponse.json({ success: false, message, retryAfterSeconds }, { status: 429 });
  }

  current.hits.push(now);
  memoryLimits.set(target, current);
  return null;
}
