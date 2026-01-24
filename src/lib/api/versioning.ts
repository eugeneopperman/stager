/**
 * API Versioning Configuration
 *
 * This module provides centralized API version management.
 *
 * Versioning Strategy:
 * - All API routes are accessible via /api/* (current default)
 * - Versioned access via /api/v1/* rewrites to /api/*
 * - Response headers include X-API-Version for client awareness
 *
 * When introducing breaking changes:
 * 1. Create new route files in /api/v2/ folder
 * 2. Update rewrites in next.config.ts
 * 3. Set X-API-Deprecated header on v1 routes
 * 4. Document migration path in API docs
 */

export const API_VERSION = {
  current: "1",
  supported: ["1"] as readonly string[],
  deprecated: [] as readonly string[],
};

/**
 * API base URLs for different versions
 */
export const API_BASE_URL = {
  v1: "/api/v1",
  latest: "/api/v1",
  // For backwards compatibility, /api also works
  default: "/api",
} as const;

/**
 * Build a versioned API URL
 *
 * @example
 * buildApiUrl('/staging') // '/api/v1/staging'
 * buildApiUrl('/staging', '1') // '/api/v1/staging'
 */
export function buildApiUrl(path: string, version: string = API_VERSION.current): string {
  const cleanPath = path.startsWith("/") ? path : `/${path}`;
  return `/api/v${version}${cleanPath}`;
}

/**
 * Check if an API version is supported
 */
export function isVersionSupported(version: string): boolean {
  return API_VERSION.supported.includes(version);
}

/**
 * Check if an API version is deprecated
 */
export function isVersionDeprecated(version: string): boolean {
  return API_VERSION.deprecated.includes(version);
}

/**
 * API response helper - adds version headers
 */
export function withVersionHeaders(headers: Headers, version: string = API_VERSION.current): Headers {
  headers.set("X-API-Version", version);
  headers.set("X-API-Deprecated", isVersionDeprecated(version) ? "true" : "false");
  return headers;
}

/**
 * Deprecation notice for sunset APIs
 */
export interface DeprecationInfo {
  version: string;
  sunsetDate: string;
  migrationGuide: string;
}

export const DEPRECATION_NOTICES: DeprecationInfo[] = [
  // Example for future use:
  // {
  //   version: "1",
  //   sunsetDate: "2025-12-31",
  //   migrationGuide: "https://docs.stager.app/api/migration/v1-to-v2",
  // },
];
