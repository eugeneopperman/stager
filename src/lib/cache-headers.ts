/**
 * Cache header utilities for API responses
 */

import { NextResponse } from "next/server";

/**
 * Cache control directives
 */
export const CacheControl = {
  /** No caching - sensitive or real-time data */
  noStore: "no-store, no-cache, must-revalidate",

  /** Private cache only (browser) - user-specific data */
  private: (maxAge: number) => `private, max-age=${maxAge}`,

  /** Public cache (CDN + browser) - static or shared data */
  public: (maxAge: number, staleWhileRevalidate?: number) =>
    staleWhileRevalidate
      ? `public, max-age=${maxAge}, stale-while-revalidate=${staleWhileRevalidate}`
      : `public, max-age=${maxAge}`,

  /** Immutable content - never changes (e.g., versioned assets) */
  immutable: (maxAge: number) => `public, max-age=${maxAge}, immutable`,
} as const;

/**
 * Pre-configured cache settings for common use cases
 */
export const CachePresets = {
  /** No caching - mutations, sensitive data */
  none: CacheControl.noStore,

  /** Short cache - frequently changing data (5 seconds) */
  short: CacheControl.private(5),

  /** User data - private, moderate duration (1 minute) */
  userData: CacheControl.private(60),

  /** Shared data - public, moderate duration (5 minutes, 1 hour stale) */
  sharedData: CacheControl.public(300, 3600),

  /** Static data - public, long duration (1 hour, 24 hour stale) */
  staticData: CacheControl.public(3600, 86400),

  /** Plans/pricing - public, cached but revalidated (10 minutes) */
  pricing: CacheControl.public(600, 1800),

  /** Images - public, long cache (1 day) */
  images: CacheControl.public(86400, 604800),
} as const;

/**
 * Apply cache headers to a NextResponse
 */
export function withCacheHeaders(
  response: NextResponse,
  cacheControl: string
): NextResponse {
  response.headers.set("Cache-Control", cacheControl);
  return response;
}

/**
 * Create a JSON response with cache headers
 */
export function jsonWithCache<T>(
  data: T,
  cacheControl: string,
  init?: ResponseInit
): NextResponse<T> {
  const response = NextResponse.json(data, init);
  response.headers.set("Cache-Control", cacheControl);
  return response;
}

/**
 * Common response helpers with caching
 */
export const CachedResponse = {
  /** User-specific data (private cache, 1 minute) */
  userData: <T>(data: T) => jsonWithCache(data, CachePresets.userData),

  /** Shared/public data (public cache, 5 minutes) */
  sharedData: <T>(data: T) => jsonWithCache(data, CachePresets.sharedData),

  /** Static data (public cache, 1 hour) */
  staticData: <T>(data: T) => jsonWithCache(data, CachePresets.staticData),

  /** No cache (mutations, real-time) */
  noCache: <T>(data: T) => jsonWithCache(data, CachePresets.none),
};

/**
 * Vary header for proper cache keying
 */
export function addVaryHeader(
  response: NextResponse,
  fields: string[] = ["Accept-Encoding"]
): NextResponse {
  response.headers.set("Vary", fields.join(", "));
  return response;
}

/**
 * ETag helper for conditional requests
 */
export function generateETag(content: string): string {
  // Simple hash for ETag
  let hash = 0;
  for (let i = 0; i < content.length; i++) {
    const char = content.charCodeAt(i);
    hash = (hash << 5) - hash + char;
    hash = hash & hash; // Convert to 32bit integer
  }
  return `"${Math.abs(hash).toString(16)}"`;
}

/**
 * Check if client has valid cached version
 */
export function checkConditionalRequest(
  request: Request,
  etag: string
): boolean {
  const ifNoneMatch = request.headers.get("If-None-Match");
  return ifNoneMatch === etag;
}

/**
 * Return 304 Not Modified response
 */
export function notModifiedResponse(etag: string): NextResponse {
  return new NextResponse(null, {
    status: 304,
    headers: {
      ETag: etag,
      "Cache-Control": CachePresets.sharedData,
    },
  });
}
