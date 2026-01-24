/**
 * Redis Caching Layer
 *
 * Provides caching for frequently accessed data like user credits,
 * subscription status, and team information.
 */

import { getRedisClient, isRedisConfigured } from "@/lib/redis";

// Cache key prefixes
const CACHE_PREFIX = {
  USER_CREDITS: "cache:user:credits:",
  USER_SUBSCRIPTION: "cache:user:subscription:",
  USER_PLAN: "cache:user:plan:",
  TEAM_MEMBERS: "cache:team:members:",
  ORG_INFO: "cache:org:info:",
  STAGING_JOB: "cache:staging:job:",
} as const;

// Default TTLs (in seconds)
const DEFAULT_TTL = {
  USER_CREDITS: 60, // 1 minute - changes frequently
  USER_SUBSCRIPTION: 300, // 5 minutes
  USER_PLAN: 600, // 10 minutes - rarely changes
  TEAM_MEMBERS: 120, // 2 minutes
  ORG_INFO: 300, // 5 minutes
  STAGING_JOB: 30, // 30 seconds - for polling
} as const;

// In-memory fallback cache
const memoryCache = new Map<string, { value: unknown; expiresAt: number }>();

/**
 * Generic cache get with automatic JSON parsing
 */
async function cacheGet<T>(key: string): Promise<T | null> {
  const redis = getRedisClient();

  if (redis) {
    try {
      const value = await redis.get<T>(key);
      return value;
    } catch (error) {
      console.error(`Cache get error for ${key}:`, error);
      return null;
    }
  }

  // Fallback to memory cache
  const cached = memoryCache.get(key);
  if (cached && cached.expiresAt > Date.now()) {
    return cached.value as T;
  }
  memoryCache.delete(key);
  return null;
}

/**
 * Generic cache set with TTL
 */
async function cacheSet<T>(key: string, value: T, ttlSeconds: number): Promise<void> {
  const redis = getRedisClient();

  if (redis) {
    try {
      await redis.set(key, value, { ex: ttlSeconds });
    } catch (error) {
      console.error(`Cache set error for ${key}:`, error);
    }
    return;
  }

  // Fallback to memory cache
  memoryCache.set(key, {
    value,
    expiresAt: Date.now() + ttlSeconds * 1000,
  });
}

/**
 * Delete a cache key
 */
async function cacheDelete(key: string): Promise<void> {
  const redis = getRedisClient();

  if (redis) {
    try {
      await redis.del(key);
    } catch (error) {
      console.error(`Cache delete error for ${key}:`, error);
    }
    return;
  }

  memoryCache.delete(key);
}

/**
 * Delete multiple cache keys by pattern
 */
async function cacheDeletePattern(pattern: string): Promise<void> {
  const redis = getRedisClient();

  if (redis) {
    try {
      // Upstash doesn't support KEYS in REST API, so we track keys separately
      // For now, we'll just delete known keys
      console.warn(`Pattern delete not fully supported in Upstash REST: ${pattern}`);
    } catch (error) {
      console.error(`Cache pattern delete error for ${pattern}:`, error);
    }
    return;
  }

  // Memory cache: delete matching keys
  for (const key of memoryCache.keys()) {
    if (key.includes(pattern.replace("*", ""))) {
      memoryCache.delete(key);
    }
  }
}

// ============================================
// User Credits Cache
// ============================================

export interface CachedUserCredits {
  available: number;
  allocated: number;
  used: number;
  cachedAt: number;
}

export async function getCachedUserCredits(userId: string): Promise<CachedUserCredits | null> {
  return cacheGet<CachedUserCredits>(`${CACHE_PREFIX.USER_CREDITS}${userId}`);
}

export async function setCachedUserCredits(
  userId: string,
  credits: Omit<CachedUserCredits, "cachedAt">
): Promise<void> {
  await cacheSet(
    `${CACHE_PREFIX.USER_CREDITS}${userId}`,
    { ...credits, cachedAt: Date.now() },
    DEFAULT_TTL.USER_CREDITS
  );
}

export async function invalidateUserCredits(userId: string): Promise<void> {
  await cacheDelete(`${CACHE_PREFIX.USER_CREDITS}${userId}`);
}

// ============================================
// User Subscription Cache
// ============================================

export interface CachedSubscription {
  id: string | null;
  status: string | null;
  planSlug: string | null;
  currentPeriodEnd: string | null;
  cancelAtPeriodEnd: boolean;
  cachedAt: number;
}

export async function getCachedUserSubscription(
  userId: string
): Promise<CachedSubscription | null> {
  return cacheGet<CachedSubscription>(`${CACHE_PREFIX.USER_SUBSCRIPTION}${userId}`);
}

export async function setCachedUserSubscription(
  userId: string,
  subscription: Omit<CachedSubscription, "cachedAt">
): Promise<void> {
  await cacheSet(
    `${CACHE_PREFIX.USER_SUBSCRIPTION}${userId}`,
    { ...subscription, cachedAt: Date.now() },
    DEFAULT_TTL.USER_SUBSCRIPTION
  );
}

export async function invalidateUserSubscription(userId: string): Promise<void> {
  await cacheDelete(`${CACHE_PREFIX.USER_SUBSCRIPTION}${userId}`);
}

// ============================================
// User Plan Cache
// ============================================

export interface CachedPlan {
  slug: string;
  name: string;
  creditsPerMonth: number;
  maxTeamMembers: number;
  cachedAt: number;
}

export async function getCachedUserPlan(userId: string): Promise<CachedPlan | null> {
  return cacheGet<CachedPlan>(`${CACHE_PREFIX.USER_PLAN}${userId}`);
}

export async function setCachedUserPlan(
  userId: string,
  plan: Omit<CachedPlan, "cachedAt">
): Promise<void> {
  await cacheSet(
    `${CACHE_PREFIX.USER_PLAN}${userId}`,
    { ...plan, cachedAt: Date.now() },
    DEFAULT_TTL.USER_PLAN
  );
}

export async function invalidateUserPlan(userId: string): Promise<void> {
  await cacheDelete(`${CACHE_PREFIX.USER_PLAN}${userId}`);
}

// ============================================
// Team Members Cache
// ============================================

export interface CachedTeamMember {
  id: string;
  userId: string;
  email: string;
  fullName: string | null;
  role: string;
  credits: number;
}

export interface CachedTeamMembers {
  members: CachedTeamMember[];
  cachedAt: number;
}

export async function getCachedTeamMembers(
  organizationId: string
): Promise<CachedTeamMembers | null> {
  return cacheGet<CachedTeamMembers>(`${CACHE_PREFIX.TEAM_MEMBERS}${organizationId}`);
}

export async function setCachedTeamMembers(
  organizationId: string,
  members: CachedTeamMember[]
): Promise<void> {
  await cacheSet(
    `${CACHE_PREFIX.TEAM_MEMBERS}${organizationId}`,
    { members, cachedAt: Date.now() },
    DEFAULT_TTL.TEAM_MEMBERS
  );
}

export async function invalidateTeamMembers(organizationId: string): Promise<void> {
  await cacheDelete(`${CACHE_PREFIX.TEAM_MEMBERS}${organizationId}`);
}

// ============================================
// Organization Info Cache
// ============================================

export interface CachedOrgInfo {
  id: string;
  name: string;
  ownerId: string;
  credits: number;
  unallocatedCredits: number;
  cachedAt: number;
}

export async function getCachedOrgInfo(organizationId: string): Promise<CachedOrgInfo | null> {
  return cacheGet<CachedOrgInfo>(`${CACHE_PREFIX.ORG_INFO}${organizationId}`);
}

export async function setCachedOrgInfo(
  organizationId: string,
  org: Omit<CachedOrgInfo, "cachedAt">
): Promise<void> {
  await cacheSet(
    `${CACHE_PREFIX.ORG_INFO}${organizationId}`,
    { ...org, cachedAt: Date.now() },
    DEFAULT_TTL.ORG_INFO
  );
}

export async function invalidateOrgInfo(organizationId: string): Promise<void> {
  await cacheDelete(`${CACHE_PREFIX.ORG_INFO}${organizationId}`);
}

// ============================================
// Staging Job Cache (for polling)
// ============================================

export interface CachedStagingJob {
  id: string;
  status: string;
  stagedImageUrl: string | null;
  errorMessage: string | null;
  cachedAt: number;
}

export async function getCachedStagingJob(jobId: string): Promise<CachedStagingJob | null> {
  return cacheGet<CachedStagingJob>(`${CACHE_PREFIX.STAGING_JOB}${jobId}`);
}

export async function setCachedStagingJob(
  jobId: string,
  job: Omit<CachedStagingJob, "cachedAt">
): Promise<void> {
  await cacheSet(
    `${CACHE_PREFIX.STAGING_JOB}${jobId}`,
    { ...job, cachedAt: Date.now() },
    DEFAULT_TTL.STAGING_JOB
  );
}

export async function invalidateStagingJob(jobId: string): Promise<void> {
  await cacheDelete(`${CACHE_PREFIX.STAGING_JOB}${jobId}`);
}

// ============================================
// Cache-through helpers
// ============================================

/**
 * Get data from cache or fetch from source
 */
export async function cacheThrough<T>(
  key: string,
  fetchFn: () => Promise<T>,
  ttlSeconds: number
): Promise<T> {
  // Try cache first
  const cached = await cacheGet<T>(key);
  if (cached !== null) {
    return cached;
  }

  // Fetch from source
  const data = await fetchFn();

  // Cache the result
  await cacheSet(key, data, ttlSeconds);

  return data;
}

/**
 * Invalidate all caches for a user
 */
export async function invalidateAllUserCaches(userId: string): Promise<void> {
  await Promise.all([
    invalidateUserCredits(userId),
    invalidateUserSubscription(userId),
    invalidateUserPlan(userId),
  ]);
}

// ============================================
// Cache stats (for monitoring)
// ============================================

export function getCacheStats(): {
  isRedisConfigured: boolean;
  memoryCacheSize: number;
} {
  return {
    isRedisConfigured: isRedisConfigured(),
    memoryCacheSize: memoryCache.size,
  };
}

/**
 * Clear memory cache (for testing)
 */
export function clearMemoryCache(): void {
  memoryCache.clear();
}
