import { redisDelete, redisGetJson, redisGetString, redisIncrement, redisSetJson } from "@/lib/redis";

export const CACHE_TTLS = {
  homepageContent: 300,
  featuredProducts: 180,
  newArrivals: 180,
  categories: 600,
  publicProductList: 90,
  publicProductDetail: 90,
  publicReviews: 90,
  flashSale: 15,
  adminDashboard: 120,
  adminAnalytics: 120,
} as const;

export async function withCache<T>(key: string, ttlSeconds: number, fallback: () => Promise<T>) {
  const cached = await redisGetJson<T>(key);
  if (cached !== null) {
    return cached;
  }

  const fresh = await fallback();
  await redisSetJson(key, fresh, ttlSeconds);
  return fresh;
}

export async function invalidateCache(...keys: string[]) {
  await redisDelete(...keys);
}

export async function getCacheVersion(namespace: string) {
  return (await redisGetString(`cache-version:${namespace}`)) || "0";
}

export async function bumpCacheVersion(namespace: string) {
  return redisIncrement(`cache-version:${namespace}`);
}

export async function versionedCacheKey(namespace: string, key: string) {
  const version = await getCacheVersion(namespace);
  return `${namespace}:v${version}:${key}`;
}
