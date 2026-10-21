import { tooMany } from "./errors.ts";

const buckets = new Map<string, number[]>();

/** Sliding-window limiter. Throws 429 once `limit` hits occur within `windowMs`. */
export function rateLimit(key: string, limit: number, windowMs: number) {
  const t = Date.now();
  const hits = (buckets.get(key) ?? []).filter((h) => t - h < windowMs);
  if (hits.length >= limit) {
    buckets.set(key, hits);
    throw tooMany();
  }
  hits.push(t);
  buckets.set(key, hits);
}

export function resetRateLimits() {
  buckets.clear();
}

setInterval(() => {
  const t = Date.now();
  for (const [key, hits] of buckets) {
    if (hits.every((h) => t - h > 3_600_000)) buckets.delete(key);
  }
}, 600_000).unref();
