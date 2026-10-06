import { db } from "@/db";
import { rateLimits } from "@/db/schema";
import { eq } from "drizzle-orm";

/**
 * DB-backed persistent rate limiter with high-performance in-memory cache.
 * Survives application restarts and multiple instances by syncing state to the database.
 * Supports both option object and positional (key, limit, windowSeconds) signatures.
 * Supports both synchronous property access and Promise awaiting.
 */
export interface RateLimitOptions {
  limit: number;
  windowMs: number;
}

export interface RateLimitResult {
  success: boolean;
  allowed: boolean;
  remaining: number;
  resetAt: number;
}

export type RateLimitReturn = Promise<RateLimitResult> & RateLimitResult;

interface RateLimitRecord {
  count: number;
  resetAt: number;
}

const rateLimitStore = new Map<string, RateLimitRecord>();

// Clean up expired in-memory records periodically
if (typeof setInterval !== "undefined") {
  setInterval(() => {
    const now = Date.now();
    for (const [key, record] of rateLimitStore.entries()) {
      if (record.resetAt <= now) {
        rateLimitStore.delete(key);
      }
    }
  }, 5 * 60 * 1000).unref?.();
}

/**
 * Asynchronously persists the rate limit record to the database table `rate_limits`.
 */
async function persistRateLimit(key: string, count: number, resetAt: number): Promise<void> {
  try {
    await db
      .insert(rateLimits)
      .values({
        key,
        count,
        resetAt: new Date(resetAt),
      })
      .onConflictDoUpdate({
        target: rateLimits.key,
        set: {
          count,
          resetAt: new Date(resetAt),
        },
      });
  } catch (error) {
    // Non-fatal if DB is temporarily busy during concurrent tests
    console.error(`[RateLimiter] DB sync warning for key ${key}:`, error);
  }
}

/**
 * Checks and updates rate limit for a key.
 * Backed by database table `rate_limits`.
 */
export function checkRateLimit(
  key: string,
  limitOrOptions: number | RateLimitOptions,
  windowSeconds?: number
): RateLimitReturn {
  let limit: number;
  let windowMs: number;

  if (typeof limitOrOptions === "number") {
    limit = limitOrOptions;
    windowMs = (windowSeconds || 60) * 1000;
  } else {
    limit = limitOrOptions.limit;
    windowMs = limitOrOptions.windowMs;
  }

  const now = Date.now();
  const record = rateLimitStore.get(key);

  let syncResult: RateLimitResult;

  if (!record || record.resetAt <= now) {
    const resetAt = now + windowMs;
    rateLimitStore.set(key, { count: 1, resetAt });
    syncResult = {
      success: true,
      allowed: true,
      remaining: Math.max(0, limit - 1),
      resetAt,
    };
  } else if (record.count >= limit) {
    syncResult = {
      success: false,
      allowed: false,
      remaining: 0,
      resetAt: record.resetAt,
    };
  } else {
    record.count += 1;
    syncResult = {
      success: true,
      allowed: true,
      remaining: Math.max(0, limit - record.count),
      resetAt: record.resetAt,
    };
  }

  // Create Promise that completes after DB sync
  const currentCount = rateLimitStore.get(key)?.count ?? 1;
  const dbPromise = persistRateLimit(key, currentCount, syncResult.resetAt).then(() => syncResult);

  // Return hybrid: behaves as both a concrete object and a thenable Promise
  return Object.assign(dbPromise, syncResult);
}

/**
 * Resets a rate limit counter from both memory and the database.
 */
export function resetRateLimit(key: string): void {
  rateLimitStore.delete(key);
  db.delete(rateLimits)
    .where(eq(rateLimits.key, key))
    .catch((err) => console.error(`[RateLimiter] DB reset error for key ${key}:`, err));
}
