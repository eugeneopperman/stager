import { Redis } from "@upstash/redis";

/**
 * Redis client for distributed caching and rate limiting
 *
 * Requires environment variables:
 * - UPSTASH_REDIS_REST_URL
 * - UPSTASH_REDIS_REST_TOKEN
 *
 * Falls back to null if not configured (rate limiter will use in-memory)
 */
let redisClient: Redis | null = null;

export function getRedisClient(): Redis | null {
  // Return cached client if already initialized
  if (redisClient) {
    return redisClient;
  }

  // Check for required environment variables
  const url = process.env.UPSTASH_REDIS_REST_URL;
  const token = process.env.UPSTASH_REDIS_REST_TOKEN;

  if (!url || !token) {
    // Log warning in development only
    if (process.env.NODE_ENV === "development") {
      console.warn(
        "⚠️  Redis not configured. Set UPSTASH_REDIS_REST_URL and UPSTASH_REDIS_REST_TOKEN for distributed rate limiting."
      );
    }
    return null;
  }

  try {
    redisClient = new Redis({
      url,
      token,
    });
    return redisClient;
  } catch (error) {
    console.error("Failed to initialize Redis client:", error);
    return null;
  }
}

/**
 * Check if Redis is available
 */
export function isRedisConfigured(): boolean {
  return !!(process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN);
}

/**
 * Reset Redis client (useful for testing)
 */
export function resetRedisClient(): void {
  redisClient = null;
}
