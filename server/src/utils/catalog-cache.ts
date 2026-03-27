import { getRedis } from "../config/redis";

const LIST_TTL_SEC = 60;
const PRODUCT_TTL_SEC = 120;
export const CATEGORIES_CACHE_KEY = "catalog:categories";
const CATEGORIES_TTL_SEC = 300;

export async function getCatalogEpoch(): Promise<string> {
  const r = getRedis();
  if (!r) return "0";
  try {
    const v = await r.get("catalog:epoch");
    return v ?? "0";
  } catch {
    return "0";
  }
}

// Bump epoch so list/product cache keys rotate; old keys expire via TTL.
export async function bumpCatalogCache(): Promise<void> {
  const r = getRedis();
  if (!r) return;
  try {
    await r.incr("catalog:epoch");
  } catch {
    // ignore
  }
}

export function listCacheKey(
  epoch: string,
  page: number,
  limit: number,
  categoryId?: number,
  search?: string,
): string {
  return `catalog:list:${epoch}:${page}:${limit}:${categoryId ?? 0}:${encodeURIComponent(search ?? "")}`;
}

export function productCacheKey(epoch: string, id: number): string {
  return `catalog:product:${epoch}:${id}`;
}

export async function cacheGetJson<T>(key: string): Promise<T | null> {
  const r = getRedis();
  if (!r) return null;
  try {
    const raw = await r.get(key);
    if (raw == null) return null;
    return JSON.parse(raw) as T;
  } catch {
    return null;
  }
}

export async function cacheSetJson(key: string, value: unknown, ttlSeconds: number): Promise<void> {
  const r = getRedis();
  if (!r) return;
  try {
    await r.set(key, JSON.stringify(value), "EX", ttlSeconds);
  } catch {
    // ignore
  }
}

export { LIST_TTL_SEC, PRODUCT_TTL_SEC, CATEGORIES_TTL_SEC };
