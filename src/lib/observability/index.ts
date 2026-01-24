/**
 * Observability Utilities
 *
 * Custom instrumentation for tracking performance, errors, and business metrics.
 * Built on top of Sentry.
 */

import * as Sentry from "@sentry/nextjs";

// ============================================
// User Identification
// ============================================

/**
 * Identify the current user for better error context
 */
export function identifyUser(user: {
  id: string;
  email?: string;
  plan?: string;
  organizationId?: string;
}) {
  Sentry.setUser({
    id: user.id,
    email: user.email,
  });

  // Set custom tags for filtering
  if (user.plan) {
    Sentry.setTag("user.plan", user.plan);
  }
  if (user.organizationId) {
    Sentry.setTag("user.organization", user.organizationId);
  }
}

/**
 * Clear user identification (on logout)
 */
export function clearUser() {
  Sentry.setUser(null);
}

// ============================================
// Performance Tracking
// ============================================

/**
 * Track a custom operation with timing
 */
export async function trackOperation<T>(
  name: string,
  operation: () => Promise<T>,
  options?: {
    tags?: Record<string, string>;
    data?: Record<string, unknown>;
  }
): Promise<T> {
  return Sentry.startSpan(
    {
      name,
      op: "function",
      attributes: options?.tags,
    },
    async (span) => {
      try {
        const result = await operation();
        span.setStatus({ code: 1 }); // OK
        return result;
      } catch (error) {
        span.setStatus({ code: 2, message: String(error) }); // ERROR
        throw error;
      }
    }
  );
}

/**
 * Track staging operation performance
 */
export async function trackStagingOperation<T>(
  operation: () => Promise<T>,
  context: {
    jobId: string;
    provider: string;
    roomType: string;
    style: string;
  }
): Promise<T> {
  return trackOperation(`staging.${context.provider}`, operation, {
    tags: {
      "staging.job_id": context.jobId,
      "staging.provider": context.provider,
      "staging.room_type": context.roomType,
      "staging.style": context.style,
    },
  });
}

/**
 * Track billing operation performance
 */
export async function trackBillingOperation<T>(
  operationType: "checkout" | "subscription" | "topup" | "credit_deduction",
  operation: () => Promise<T>,
  context?: {
    userId?: string;
    plan?: string;
    amount?: number;
  }
): Promise<T> {
  return trackOperation(`billing.${operationType}`, operation, {
    tags: {
      "billing.operation": operationType,
      ...(context?.plan && { "billing.plan": context.plan }),
    },
    data: context,
  });
}

/**
 * Track API route performance
 */
export async function trackApiRoute<T>(
  route: string,
  method: string,
  handler: () => Promise<T>
): Promise<T> {
  return trackOperation(`api.${method.toLowerCase()}.${route}`, handler, {
    tags: {
      "http.route": route,
      "http.method": method,
    },
  });
}

// ============================================
// Business Metrics
// ============================================

/**
 * Track a business metric event
 */
export function trackMetric(
  name: string,
  value: number,
  unit: string,
  tags?: Record<string, string>
) {
  Sentry.setMeasurement(name, value, unit);

  // Also add as breadcrumb for context
  Sentry.addBreadcrumb({
    category: "metric",
    message: `${name}: ${value} ${unit}`,
    level: "info",
    data: { value, unit, ...tags },
  });
}

/**
 * Track staging completion metrics
 */
export function trackStagingMetrics(metrics: {
  processingTimeMs: number;
  provider: string;
  success: boolean;
  creditsUsed: number;
}) {
  trackMetric("staging.processing_time", metrics.processingTimeMs, "millisecond", {
    provider: metrics.provider,
    success: String(metrics.success),
  });

  trackMetric("staging.credits_used", metrics.creditsUsed, "none", {
    provider: metrics.provider,
  });

  // Track success/failure rate
  Sentry.setTag("staging.last_result", metrics.success ? "success" : "failure");
}

/**
 * Track credit usage
 */
export function trackCreditUsage(context: {
  userId: string;
  creditsUsed: number;
  creditsRemaining: number;
  operation: string;
}) {
  trackMetric("credits.used", context.creditsUsed, "none", {
    operation: context.operation,
  });

  trackMetric("credits.remaining", context.creditsRemaining, "none");

  // Alert if credits are low
  if (context.creditsRemaining <= 3) {
    Sentry.addBreadcrumb({
      category: "billing",
      message: `Low credits warning: ${context.creditsRemaining} remaining`,
      level: "warning",
    });
  }
}

// ============================================
// Error Tracking
// ============================================

/**
 * Capture an error with additional context
 */
export function captureError(
  error: Error,
  context?: {
    tags?: Record<string, string>;
    extra?: Record<string, unknown>;
    level?: "fatal" | "error" | "warning" | "info";
  }
) {
  Sentry.withScope((scope) => {
    if (context?.tags) {
      Object.entries(context.tags).forEach(([key, value]) => {
        scope.setTag(key, value);
      });
    }

    if (context?.extra) {
      scope.setExtras(context.extra);
    }

    if (context?.level) {
      scope.setLevel(context.level);
    }

    Sentry.captureException(error);
  });
}

/**
 * Capture a provider error with context
 */
export function captureProviderError(
  error: Error,
  provider: string,
  context?: Record<string, unknown>
) {
  captureError(error, {
    tags: {
      "provider.name": provider,
      "error.type": "provider_error",
    },
    extra: {
      provider,
      ...context,
    },
  });
}

/**
 * Capture a billing error
 */
export function captureBillingError(
  error: Error,
  operation: string,
  context?: Record<string, unknown>
) {
  captureError(error, {
    tags: {
      "billing.operation": operation,
      "error.type": "billing_error",
    },
    extra: {
      operation,
      ...context,
    },
    level: "error",
  });
}

// ============================================
// Breadcrumbs
// ============================================

/**
 * Add a navigation breadcrumb
 */
export function trackNavigation(from: string, to: string) {
  Sentry.addBreadcrumb({
    category: "navigation",
    message: `Navigated from ${from} to ${to}`,
    level: "info",
    data: { from, to },
  });
}

/**
 * Add a user action breadcrumb
 */
export function trackUserAction(action: string, data?: Record<string, unknown>) {
  Sentry.addBreadcrumb({
    category: "user",
    message: action,
    level: "info",
    data,
  });
}

/**
 * Add an API call breadcrumb
 */
export function trackApiCall(
  method: string,
  url: string,
  status: number,
  durationMs?: number
) {
  Sentry.addBreadcrumb({
    category: "http",
    message: `${method} ${url}`,
    level: status >= 400 ? "error" : "info",
    data: {
      method,
      url,
      status_code: status,
      ...(durationMs && { duration_ms: durationMs }),
    },
  });
}

// ============================================
// Feature Flags (prep for future)
// ============================================

/**
 * Track feature flag evaluation
 */
export function trackFeatureFlag(flag: string, value: boolean, userId?: string) {
  Sentry.addBreadcrumb({
    category: "feature_flag",
    message: `${flag}: ${value}`,
    level: "info",
    data: { flag, value, userId },
  });

  Sentry.setTag(`feature.${flag}`, String(value));
}

// ============================================
// Web Vitals
// ============================================

/**
 * Report Web Vitals to Sentry
 * Call this from _app.tsx or layout.tsx
 */
export function reportWebVitals(metric: {
  id: string;
  name: string;
  value: number;
  label: "web-vital" | "custom";
}) {
  // Sentry automatically captures Web Vitals, but you can add custom handling
  if (metric.label === "web-vital") {
    Sentry.addBreadcrumb({
      category: "web-vital",
      message: `${metric.name}: ${metric.value}`,
      level: "info",
      data: {
        name: metric.name,
        value: metric.value,
        id: metric.id,
      },
    });
  }
}
