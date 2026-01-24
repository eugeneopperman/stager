/**
 * Rate Limiting Module
 *
 * Supports both Redis-backed (distributed) and in-memory (single instance) rate limiting.
 * Automatically uses Redis when configured, falls back to in-memory otherwise.
 *
 * For production with multiple instances, configure Redis:
 * - UPSTASH_REDIS_REST_URL
 * - UPSTASH_REDIS_REST_TOKEN
 */

import { Ratelimit } from "@upstash/ratelimit";
import { getRedisClient, isRedisConfigured } from "./redis";

interface RateLimitConfig {
  /** Maximum number of requests allowed in the interval */
  limit: number;
  /** Time window in milliseconds */
  interval: number;
}

interface RateLimitResult {
  allowed: boolean;
  remaining: number;
  resetTime: number;
  limit: number;
}

interface RateLimitEntry {
  count: number;
  resetTime: number;
}

// In-memory store for fallback rate limiting
const rateLimitStore = new Map<string, RateLimitEntry>();

// Cleanup old entries periodically
const CLEANUP_INTERVAL = 60 * 1000; // 1 minute
let lastCleanup = Date.now();

function cleanupExpiredEntries() {
  const now = Date.now();
  if (now - lastCleanup < CLEANUP_INTERVAL) return;

  lastCleanup = now;
  for (const [key, entry] of rateLimitStore.entries()) {
    if (entry.resetTime < now) {
      rateLimitStore.delete(key);
    }
  }
}

/**
 * In-memory rate limiter (fallback when Redis not configured)
 */
function inMemoryRateLimit(identifier: string, config: RateLimitConfig): RateLimitResult {
  cleanupExpiredEntries();

  const now = Date.now();
  const key = identifier;
  const entry = rateLimitStore.get(key);

  // If no entry exists or it has expired, create a new one
  if (!entry || entry.resetTime < now) {
    const newEntry: RateLimitEntry = {
      count: 1,
      resetTime: now + config.interval,
    };
    rateLimitStore.set(key, newEntry);
    return {
      allowed: true,
      remaining: config.limit - 1,
      resetTime: newEntry.resetTime,
      limit: config.limit,
    };
  }

  // Check if limit exceeded
  if (entry.count >= config.limit) {
    return {
      allowed: false,
      remaining: 0,
      resetTime: entry.resetTime,
      limit: config.limit,
    };
  }

  // Increment count
  entry.count++;
  return {
    allowed: true,
    remaining: config.limit - entry.count,
    resetTime: entry.resetTime,
    limit: config.limit,
  };
}

// Cache for Upstash rate limiters (keyed by config)
const upstashLimiters = new Map<string, Ratelimit>();

/**
 * Get or create an Upstash rate limiter for a specific configuration
 */
function getUpstashLimiter(config: RateLimitConfig): Ratelimit | null {
  const redis = getRedisClient();
  if (!redis) return null;

  const cacheKey = `${config.limit}:${config.interval}`;

  if (!upstashLimiters.has(cacheKey)) {
    // Convert interval to duration string for Upstash
    const durationMs = config.interval;
    let duration: `${number} ms` | `${number} s` | `${number} m` | `${number} h` | `${number} d`;

    if (durationMs >= 24 * 60 * 60 * 1000) {
      duration = `${Math.floor(durationMs / (24 * 60 * 60 * 1000))} d`;
    } else if (durationMs >= 60 * 60 * 1000) {
      duration = `${Math.floor(durationMs / (60 * 60 * 1000))} h`;
    } else if (durationMs >= 60 * 1000) {
      duration = `${Math.floor(durationMs / (60 * 1000))} m`;
    } else if (durationMs >= 1000) {
      duration = `${Math.floor(durationMs / 1000)} s`;
    } else {
      duration = `${durationMs} ms`;
    }

    const limiter = new Ratelimit({
      redis,
      limiter: Ratelimit.slidingWindow(config.limit, duration),
      analytics: true,
      prefix: "stager:ratelimit",
    });

    upstashLimiters.set(cacheKey, limiter);
  }

  return upstashLimiters.get(cacheKey)!;
}

/**
 * Redis-backed rate limiter
 */
async function redisRateLimit(identifier: string, config: RateLimitConfig): Promise<RateLimitResult> {
  const limiter = getUpstashLimiter(config);

  if (!limiter) {
    // Fallback to in-memory if Redis not available
    return inMemoryRateLimit(identifier, config);
  }

  try {
    const result = await limiter.limit(identifier);

    return {
      allowed: result.success,
      remaining: result.remaining,
      resetTime: result.reset,
      limit: config.limit,
    };
  } catch (error) {
    console.error("Redis rate limit error, falling back to in-memory:", error);
    return inMemoryRateLimit(identifier, config);
  }
}

/**
 * Check if a request should be rate limited
 *
 * Uses Redis when configured, falls back to in-memory otherwise.
 *
 * @param identifier - Unique identifier (e.g., IP address, user ID)
 * @param config - Rate limit configuration
 * @returns Object with allowed status and rate limit info
 */
export async function rateLimit(
  identifier: string,
  config: RateLimitConfig
): Promise<RateLimitResult> {
  if (isRedisConfigured()) {
    return redisRateLimit(identifier, config);
  }
  return inMemoryRateLimit(identifier, config);
}

/**
 * Synchronous rate limit check (in-memory only, for backwards compatibility)
 *
 * @deprecated Use the async rateLimit() function instead
 */
export function rateLimitSync(identifier: string, config: RateLimitConfig): RateLimitResult {
  return inMemoryRateLimit(identifier, config);
}

/**
 * Pre-configured rate limiters for common use cases
 */
export const rateLimiters = {
  /** Standard API rate limit: 100 requests per minute */
  standard: (identifier: string) =>
    rateLimit(identifier, { limit: 100, interval: 60 * 1000 }),

  /** Staging API rate limit: 20 requests per minute (resource-intensive) */
  staging: (identifier: string) =>
    rateLimit(identifier, { limit: 20, interval: 60 * 1000 }),

  /** Auth rate limit: 10 attempts per 15 minutes */
  auth: (identifier: string) =>
    rateLimit(identifier, { limit: 10, interval: 15 * 60 * 1000 }),

  /** Sensitive operations: 5 per hour */
  sensitive: (identifier: string) =>
    rateLimit(identifier, { limit: 5, interval: 60 * 60 * 1000 }),

  /** Email sending: 3 per 5 minutes */
  email: (identifier: string) =>
    rateLimit(identifier, { limit: 3, interval: 5 * 60 * 1000 }),
};

/**
 * Get rate limit headers for response
 */
export function getRateLimitHeaders(result: RateLimitResult): Record<string, string> {
  return {
    "X-RateLimit-Limit": result.limit.toString(),
    "X-RateLimit-Remaining": result.remaining.toString(),
    "X-RateLimit-Reset": Math.ceil(result.resetTime / 1000).toString(),
  };
}

/**
 * Helper to get client identifier from request
 * Uses X-Forwarded-For header (set by proxies like Vercel) or falls back to a default
 */
export function getClientIdentifier(request: Request, userId?: string): string {
  // Prefer user ID if authenticated
  if (userId) {
    return `user:${userId}`;
  }

  // Try to get IP from headers (Vercel sets these)
  const forwardedFor = request.headers.get("x-forwarded-for");
  if (forwardedFor) {
    // x-forwarded-for can contain multiple IPs, take the first one
    return `ip:${forwardedFor.split(",")[0].trim()}`;
  }

  const realIp = request.headers.get("x-real-ip");
  if (realIp) {
    return `ip:${realIp}`;
  }

  // Fallback - shouldn't happen in production with proper proxy setup
  return "ip:unknown";
}

/**
 * Check which rate limiting backend is active
 */
export function getRateLimitBackend(): "redis" | "memory" {
  return isRedisConfigured() ? "redis" : "memory";
}
