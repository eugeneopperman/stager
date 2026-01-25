import { Resend } from "resend";

// Lazy-initialize Resend client to avoid build-time errors
let resendClient: Resend | null = null;

/**
 * Get the Resend client instance (singleton pattern)
 */
export function getResendClient(): Resend {
  if (!resendClient) {
    const apiKey = process.env.RESEND_API_KEY;
    if (!apiKey) {
      throw new Error("RESEND_API_KEY environment variable is not set");
    }
    resendClient = new Resend(apiKey);
  }
  return resendClient;
}

/**
 * Configuration constants
 */
export const EMAIL_CONFIG = {
  appUrl: process.env.NEXT_PUBLIC_APP_URL || "https://stager.app",
  fromEmail: process.env.RESEND_FROM_EMAIL || "Stager <noreply@stager.app>",
  replyTo: process.env.RESEND_REPLY_TO || "support@stager.app",

  // Email types for categorization
  types: {
    TRANSACTIONAL: "transactional",
    CAMPAIGN: "campaign",
    DIGEST: "digest",
  } as const,

  // Templates organized by category
  templates: {
    // Onboarding
    WELCOME: "onboarding/welcome",
    FIRST_STAGING: "onboarding/first-staging",
    TIPS: "onboarding/tips",
    CHECK_IN: "onboarding/check-in",

    // Transactional
    STAGING_COMPLETE: "transactional/staging-complete",
    STAGING_FAILED: "transactional/staging-failed",
    CREDIT_LOW: "transactional/credit-low",
    PAYMENT_SUCCESS: "transactional/payment-success",
    PAYMENT_FAILED: "transactional/payment-failed",
    TEAM_INVITATION: "transactional/team-invitation",
    TEAM_WELCOME: "transactional/team-welcome",
    SUBSCRIPTION_CANCELLED: "transactional/subscription-cancelled",

    // Re-engagement
    MISS_YOU: "reengagement/miss-you",
    NEW_FEATURES: "reengagement/new-features",
    SPECIAL_OFFER: "reengagement/special-offer",

    // Digest
    WEEKLY_DIGEST: "digest/weekly-digest",
  } as const,
};

export type EmailType = (typeof EMAIL_CONFIG.types)[keyof typeof EMAIL_CONFIG.types];
export type TemplateId = (typeof EMAIL_CONFIG.templates)[keyof typeof EMAIL_CONFIG.templates];
