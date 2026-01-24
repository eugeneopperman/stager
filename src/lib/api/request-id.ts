/**
 * Request ID utilities for request tracing
 */

import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";

/** Header name for request ID */
export const REQUEST_ID_HEADER = "x-request-id";

/**
 * Generate a unique request ID
 */
export function generateRequestId(): string {
  return crypto.randomUUID();
}

/**
 * Get or create request ID from request headers
 */
export function getRequestId(request: NextRequest): string {
  return request.headers.get(REQUEST_ID_HEADER) || generateRequestId();
}

/**
 * Add request ID header to response
 */
export function withRequestId<T extends NextResponse>(
  response: T,
  requestId: string
): T {
  response.headers.set(REQUEST_ID_HEADER, requestId);
  return response;
}

/**
 * Create a JSON response with request ID header
 */
export function jsonWithRequestId(
  data: unknown,
  requestId: string,
  init?: ResponseInit
): NextResponse {
  const response = NextResponse.json(data, init);
  response.headers.set(REQUEST_ID_HEADER, requestId);
  return response;
}

/**
 * Logging context with request ID
 */
export function logContext(requestId: string, ...args: unknown[]): void {
  console.log(`[${requestId}]`, ...args);
}

/**
 * Error logging context with request ID
 */
export function errorContext(requestId: string, ...args: unknown[]): void {
  console.error(`[${requestId}]`, ...args);
}
