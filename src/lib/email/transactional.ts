import { SupabaseClient } from "@supabase/supabase-js";
import { sendEmail } from "./sender";
import { EMAIL_CONFIG } from "./client";
import { generateUnsubscribeUrl, generatePreferencesUrl } from "./preferences";
import {
  StagingCompleteEmail,
  StagingFailedEmail,
  CreditLowEmail,
  PaymentSuccessEmail,
  PaymentFailedEmail,
  TeamInvitationEmail,
  TeamWelcomeEmail,
  SubscriptionCancelledEmail,
} from "./templates/transactional";

const APP_URL = process.env.NEXT_PUBLIC_APP_URL || "https://stager.app";

/**
 * Send staging complete notification
 */
export async function sendStagingCompleteEmail(
  supabase: SupabaseClient,
  params: {
    userId: string;
    email: string;
    firstName: string;
    roomType: string;
    style: string;
    stagedImageUrl: string;
    jobId: string;
    propertyName?: string;
  }
) {
  const viewUrl = `${APP_URL}/history?job=${params.jobId}`;
  const unsubscribeUrl = generateUnsubscribeUrl(params.userId, "staging_notifications");

  return sendEmail(supabase, {
    to: params.email,
    subject: `Your staged ${params.roomType.toLowerCase()} is ready!`,
    template: StagingCompleteEmail({
      firstName: params.firstName,
      roomType: params.roomType,
      style: params.style,
      stagedImageUrl: params.stagedImageUrl,
      viewUrl,
      propertyName: params.propertyName,
      appUrl: APP_URL,
      unsubscribeUrl,
    }),
    templateId: EMAIL_CONFIG.templates.STAGING_COMPLETE,
    emailType: EMAIL_CONFIG.types.TRANSACTIONAL,
    userId: params.userId,
    metadata: {
      job_id: params.jobId,
      room_type: params.roomType,
      style: params.style,
    },
  });
}

/**
 * Send staging failed notification
 */
export async function sendStagingFailedEmail(
  supabase: SupabaseClient,
  params: {
    userId: string;
    email: string;
    firstName: string;
    roomType: string;
    errorMessage?: string;
    jobId: string;
  }
) {
  const retryUrl = `${APP_URL}/stage`;
  const supportUrl = `${APP_URL}/help`;
  const unsubscribeUrl = generateUnsubscribeUrl(params.userId, "staging_notifications");

  return sendEmail(supabase, {
    to: params.email,
    subject: "We hit a snag with your staging",
    template: StagingFailedEmail({
      firstName: params.firstName,
      roomType: params.roomType,
      errorMessage: params.errorMessage,
      retryUrl,
      supportUrl,
      appUrl: APP_URL,
      unsubscribeUrl,
    }),
    templateId: EMAIL_CONFIG.templates.STAGING_FAILED,
    emailType: EMAIL_CONFIG.types.TRANSACTIONAL,
    userId: params.userId,
    metadata: {
      job_id: params.jobId,
      error_message: params.errorMessage,
    },
  });
}

/**
 * Send credit low warning
 */
export async function sendCreditLowEmail(
  supabase: SupabaseClient,
  params: {
    userId: string;
    email: string;
    firstName: string;
    creditsRemaining: number;
  }
) {
  const billingUrl = `${APP_URL}/billing`;
  const unsubscribeUrl = generateUnsubscribeUrl(params.userId, "staging_notifications");

  return sendEmail(supabase, {
    to: params.email,
    subject: `You have ${params.creditsRemaining} staging credits remaining`,
    template: CreditLowEmail({
      firstName: params.firstName,
      creditsRemaining: params.creditsRemaining,
      billingUrl,
      appUrl: APP_URL,
      unsubscribeUrl,
    }),
    templateId: EMAIL_CONFIG.templates.CREDIT_LOW,
    emailType: EMAIL_CONFIG.types.TRANSACTIONAL,
    userId: params.userId,
    metadata: {
      credits_remaining: params.creditsRemaining,
    },
  });
}

/**
 * Send payment success notification
 */
export async function sendPaymentSuccessEmail(
  supabase: SupabaseClient,
  params: {
    userId: string;
    email: string;
    firstName: string;
    amount: string;
    creditsAdded: number;
    totalCredits: number;
    receiptUrl?: string;
  }
) {
  return sendEmail(supabase, {
    to: params.email,
    subject: `Payment received - ${params.creditsAdded} credits added`,
    template: PaymentSuccessEmail({
      firstName: params.firstName,
      amount: params.amount,
      creditsAdded: params.creditsAdded,
      totalCredits: params.totalCredits,
      receiptUrl: params.receiptUrl,
      appUrl: APP_URL,
    }),
    templateId: EMAIL_CONFIG.templates.PAYMENT_SUCCESS,
    emailType: EMAIL_CONFIG.types.TRANSACTIONAL,
    userId: params.userId,
    metadata: {
      amount: params.amount,
      credits_added: params.creditsAdded,
    },
  });
}

/**
 * Send payment failed notification
 */
export async function sendPaymentFailedEmail(
  supabase: SupabaseClient,
  params: {
    userId: string;
    email: string;
    firstName: string;
    amount: string;
    errorMessage?: string;
  }
) {
  const updatePaymentUrl = `${APP_URL}/billing`;
  const supportUrl = `${APP_URL}/help`;

  return sendEmail(supabase, {
    to: params.email,
    subject: "Payment issue - please update your payment method",
    template: PaymentFailedEmail({
      firstName: params.firstName,
      amount: params.amount,
      errorMessage: params.errorMessage,
      updatePaymentUrl,
      supportUrl,
      appUrl: APP_URL,
    }),
    templateId: EMAIL_CONFIG.templates.PAYMENT_FAILED,
    emailType: EMAIL_CONFIG.types.TRANSACTIONAL,
    userId: params.userId,
    metadata: {
      amount: params.amount,
      error_message: params.errorMessage,
    },
  });
}

/**
 * Send team invitation email (using React Email)
 */
export async function sendTeamInvitationEmailNew(
  supabase: SupabaseClient,
  params: {
    email: string;
    inviterName: string;
    organizationName: string;
    initialCredits: number;
    invitationToken: string;
    expiresInDays: number;
  }
) {
  const acceptUrl = `${APP_URL}/invite/accept?token=${params.invitationToken}`;

  return sendEmail(supabase, {
    to: params.email,
    subject: `You've been invited to join ${params.organizationName} on Stager`,
    template: TeamInvitationEmail({
      inviterName: params.inviterName,
      organizationName: params.organizationName,
      initialCredits: params.initialCredits,
      acceptUrl,
      expiresInDays: params.expiresInDays,
      appUrl: APP_URL,
    }),
    templateId: EMAIL_CONFIG.templates.TEAM_INVITATION,
    emailType: EMAIL_CONFIG.types.TRANSACTIONAL,
    metadata: {
      organization_name: params.organizationName,
      initial_credits: params.initialCredits,
    },
  });
}

/**
 * Send team welcome email
 */
export async function sendTeamWelcomeEmail(
  supabase: SupabaseClient,
  params: {
    userId: string;
    email: string;
    firstName: string;
    organizationName: string;
    credits: number;
  }
) {
  const dashboardUrl = `${APP_URL}/dashboard`;
  const stageUrl = `${APP_URL}/stage`;

  return sendEmail(supabase, {
    to: params.email,
    subject: `Welcome to ${params.organizationName} on Stager!`,
    template: TeamWelcomeEmail({
      firstName: params.firstName,
      organizationName: params.organizationName,
      credits: params.credits,
      dashboardUrl,
      stageUrl,
      appUrl: APP_URL,
    }),
    templateId: EMAIL_CONFIG.templates.TEAM_WELCOME,
    emailType: EMAIL_CONFIG.types.TRANSACTIONAL,
    userId: params.userId,
    metadata: {
      organization_name: params.organizationName,
    },
  });
}

/**
 * Send subscription cancelled email
 */
export async function sendSubscriptionCancelledEmail(
  supabase: SupabaseClient,
  params: {
    userId: string;
    email: string;
    firstName: string;
    planName: string;
    creditsRemaining: number;
    expiresAt: string;
  }
) {
  const reactivateUrl = `${APP_URL}/billing`;
  const feedbackUrl = `${APP_URL}/feedback`;

  return sendEmail(supabase, {
    to: params.email,
    subject: "We're sorry to see you go",
    template: SubscriptionCancelledEmail({
      firstName: params.firstName,
      planName: params.planName,
      creditsRemaining: params.creditsRemaining,
      expiresAt: params.expiresAt,
      reactivateUrl,
      feedbackUrl,
      appUrl: APP_URL,
    }),
    templateId: EMAIL_CONFIG.templates.SUBSCRIPTION_CANCELLED,
    emailType: EMAIL_CONFIG.types.TRANSACTIONAL,
    userId: params.userId,
    metadata: {
      plan_name: params.planName,
      credits_remaining: params.creditsRemaining,
    },
  });
}
