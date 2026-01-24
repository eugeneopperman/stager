// This file configures the initialization of Sentry on the client.
// The config you add here will be used whenever a user loads a page in their browser.
// https://docs.sentry.io/platforms/javascript/guides/nextjs/

import * as Sentry from "@sentry/nextjs";

Sentry.init({
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,

  // Only enable in production
  enabled: process.env.NODE_ENV === "production",

  // Performance Monitoring
  tracesSampleRate: 0.1, // 10% of transactions for performance monitoring

  // Session Replay
  replaysSessionSampleRate: 0.1, // 10% of sessions
  replaysOnErrorSampleRate: 1.0, // 100% of sessions with errors

  // Debug mode (only in development)
  debug: false,

  // Environment
  environment: process.env.NODE_ENV,

  // Filter out noisy errors
  ignoreErrors: [
    // Browser extensions
    /^chrome-extension:\/\//,
    /^moz-extension:\/\//,
    // Network errors that are typically user-side
    "Network request failed",
    "Failed to fetch",
    "Load failed",
    // ResizeObserver loop errors (harmless)
    "ResizeObserver loop limit exceeded",
    "ResizeObserver loop completed with undelivered notifications",
  ],

  // Before sending, filter sensitive data
  beforeSend(event) {
    // Remove sensitive query parameters
    if (event.request?.query_string) {
      const params = new URLSearchParams(event.request.query_string);
      params.delete("token");
      params.delete("code");
      event.request.query_string = params.toString();
    }
    return event;
  },
});
