/**
 * Universal in-memory rate limiter with sliding window expiration.
 * Supports both option object and positional (key, limit, windowSeconds) signatures.
 */
export interface RateLimitOptions {
  limit: number;
  windowMs: number;
}

interface RateLimitRecord {
  count: number;
  resetAt: number;
}

const rateLimitStore = new Map<string, RateLimitRecord>();

// Clean up expired records every 5 minutes to prevent memory leaks
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

export function checkRateLimit(
  key: string,
  limitOrOptions: number | RateLimitOptions,
  windowSeconds?: number
): { success: boolean; allowed: boolean; remaining: number; resetAt: number } {
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

  if (!record || record.resetAt <= now) {
    rateLimitStore.set(key, { count: 1, resetAt: now + windowMs });
    return {
      success: true,
      allowed: true,
      remaining: limit - 1,
      resetAt: now + windowMs,
    };
  }

  if (record.count >= limit) {
    return {
      success: false,
      allowed: false,
      remaining: 0,
      resetAt: record.resetAt,
    };
  }

  record.count += 1;
  return {
    success: true,
    allowed: true,
    remaining: limit - record.count,
    resetAt: record.resetAt,
  };
}

export function resetRateLimit(key: string): void {
  rateLimitStore.delete(key);
}
