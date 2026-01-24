// This file configures the initialization of Sentry on the server.
// The config you add here will be used whenever the server handles a request.
// https://docs.sentry.io/platforms/javascript/guides/nextjs/

import * as Sentry from "@sentry/nextjs";

Sentry.init({
  dsn: process.env.SENTRY_DSN || process.env.NEXT_PUBLIC_SENTRY_DSN,

  // Only enable in production
  enabled: process.env.NODE_ENV === "production",

  // Performance Monitoring
  tracesSampleRate: 0.1, // 10% of transactions

  // Debug mode
  debug: false,

  // Environment
  environment: process.env.NODE_ENV,

  // Spotlight for development
  spotlight: process.env.NODE_ENV === "development",

  // Filter errors
  ignoreErrors: [
    // Expected auth errors
    "Invalid login credentials",
    "Email not confirmed",
    // Rate limiting (expected behavior)
    "Too many requests",
  ],

  // Capture unhandled promise rejections
  integrations: [
    Sentry.captureConsoleIntegration({
      levels: ["error"],
    }),
  ],

  // Before sending, add context and filter sensitive data
  beforeSend(event) {
    // Remove sensitive headers
    if (event.request?.headers) {
      delete event.request.headers["authorization"];
      delete event.request.headers["cookie"];
      delete event.request.headers["x-api-key"];
    }

    // Remove sensitive data from body
    if (event.request?.data) {
      try {
        const data =
          typeof event.request.data === "string"
            ? JSON.parse(event.request.data)
            : event.request.data;
        delete data.password;
        delete data.token;
        delete data.apiKey;
        event.request.data = JSON.stringify(data);
      } catch {
        // Not JSON, leave as is
      }
    }

    return event;
  },
});
