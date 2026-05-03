import { Redis } from "@upstash/redis";

type MemoryEntry = {
  value: string;
  expiresAt: number | null;
};

const memoryStore = new Map<string, MemoryEntry>();

let redisClient: Redis | null | undefined;
let redisWarningShown = false;

function getMemoryEntry(key: string) {
  const current = memoryStore.get(key);
  if (!current) {
    return null;
  }

  if (current.expiresAt && current.expiresAt <= Date.now()) {
    memoryStore.delete(key);
    return null;
  }

  return current;
}

function warnRedisFailure(error: unknown) {
  if (redisWarningShown) {
    return;
  }

  redisWarningShown = true;
  console.warn("[redis] Falling back to in-memory mode.", error);
}

export function hasRedisConfig() {
  return Boolean(process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN);
}

export function getRedisClient() {
  if (redisClient !== undefined) {
    return redisClient;
  }

  if (!hasRedisConfig()) {
    redisClient = null;
    return redisClient;
  }

  redisClient = new Redis({
    url: process.env.UPSTASH_REDIS_REST_URL!,
    token: process.env.UPSTASH_REDIS_REST_TOKEN!,
  });

  return redisClient;
}

export async function redisGetString(key: string) {
  const client = getRedisClient();
  if (!client) {
    return getMemoryEntry(key)?.value ?? null;
  }

  try {
    return await client.get<string>(key);
  } catch (error) {
    warnRedisFailure(error);
    return getMemoryEntry(key)?.value ?? null;
  }
}

export async function redisGetJson<T>(key: string) {
  const value = await redisGetString(key);
  if (!value) {
    return null;
  }

  try {
    return JSON.parse(value) as T;
  } catch {
    return null;
  }
}

export async function redisSetString(key: string, value: string, ttlSeconds?: number) {
  const client = getRedisClient();
  if (!client) {
    memoryStore.set(key, {
      value,
      expiresAt: ttlSeconds ? Date.now() + ttlSeconds * 1000 : null,
    });
    return;
  }

  try {
    if (ttlSeconds) {
      await client.set(key, value, { ex: ttlSeconds });
      return;
    }

    await client.set(key, value);
  } catch (error) {
    warnRedisFailure(error);
    memoryStore.set(key, {
      value,
      expiresAt: ttlSeconds ? Date.now() + ttlSeconds * 1000 : null,
    });
  }
}

export async function redisSetJson(key: string, value: unknown, ttlSeconds?: number) {
  await redisSetString(key, JSON.stringify(value), ttlSeconds);
}

export async function redisDelete(...keys: string[]) {
  if (!keys.length) {
    return;
  }

  const client = getRedisClient();
  if (!client) {
    keys.forEach((key) => memoryStore.delete(key));
    return;
  }

  try {
    await client.del(...keys);
  } catch (error) {
    warnRedisFailure(error);
    keys.forEach((key) => memoryStore.delete(key));
  }
}

export async function redisIncrement(key: string, ttlSeconds?: number) {
  const client = getRedisClient();
  if (!client) {
    const current = getMemoryEntry(key);
    const nextValue = Number(current?.value || "0") + 1;
    memoryStore.set(key, {
      value: String(nextValue),
      expiresAt: ttlSeconds ? Date.now() + ttlSeconds * 1000 : current?.expiresAt ?? null,
    });
    return nextValue;
  }

  try {
    const nextValue = await client.incr(key);
    if (ttlSeconds && nextValue === 1) {
      await client.expire(key, ttlSeconds);
    }
    return nextValue;
  } catch (error) {
    warnRedisFailure(error);
    const current = getMemoryEntry(key);
    const nextValue = Number(current?.value || "0") + 1;
    memoryStore.set(key, {
      value: String(nextValue),
      expiresAt: ttlSeconds ? Date.now() + ttlSeconds * 1000 : current?.expiresAt ?? null,
    });
    return nextValue;
  }
}
