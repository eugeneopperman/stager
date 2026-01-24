/**
 * Centralized error handling with actionable messages
 */

import { NextResponse } from "next/server";

/**
 * Standard error codes used across the application
 */
export const ErrorCode = {
  // Authentication
  UNAUTHORIZED: "UNAUTHORIZED",
  SESSION_EXPIRED: "SESSION_EXPIRED",
  INVALID_CREDENTIALS: "INVALID_CREDENTIALS",

  // Authorization
  FORBIDDEN: "FORBIDDEN",
  NOT_OWNER: "NOT_OWNER",
  INSUFFICIENT_PERMISSIONS: "INSUFFICIENT_PERMISSIONS",

  // Billing
  INSUFFICIENT_CREDITS: "INSUFFICIENT_CREDITS",
  PAYMENT_REQUIRED: "PAYMENT_REQUIRED",
  SUBSCRIPTION_INACTIVE: "SUBSCRIPTION_INACTIVE",

  // Rate Limiting
  RATE_LIMITED: "RATE_LIMITED",

  // Validation
  VALIDATION_ERROR: "VALIDATION_ERROR",
  INVALID_INPUT: "INVALID_INPUT",
  MISSING_REQUIRED_FIELD: "MISSING_REQUIRED_FIELD",

  // Resources
  NOT_FOUND: "NOT_FOUND",
  ALREADY_EXISTS: "ALREADY_EXISTS",
  CONFLICT: "CONFLICT",

  // External Services
  PROVIDER_ERROR: "PROVIDER_ERROR",
  STORAGE_ERROR: "STORAGE_ERROR",
  EMAIL_ERROR: "EMAIL_ERROR",

  // General
  INTERNAL_ERROR: "INTERNAL_ERROR",
  SERVICE_UNAVAILABLE: "SERVICE_UNAVAILABLE",
} as const;

export type ErrorCodeType = (typeof ErrorCode)[keyof typeof ErrorCode];

/**
 * Error response with actionable suggestions
 */
interface ActionableError {
  code: ErrorCodeType;
  message: string;
  suggestion?: string;
  action?: {
    label: string;
    href: string;
  };
  details?: Record<string, unknown>;
}

/**
 * Create a standardized error response
 */
export function createErrorResponse(
  error: ActionableError,
  status: number
): NextResponse {
  return NextResponse.json(
    {
      error: error.message,
      code: error.code,
      suggestion: error.suggestion,
      action: error.action,
      details: error.details,
    },
    { status }
  );
}

/**
 * Pre-defined actionable errors for common scenarios
 */
export const ActionableErrors = {
  // Authentication Errors
  unauthorized: (): ActionableError => ({
    code: ErrorCode.UNAUTHORIZED,
    message: "You must be logged in to perform this action.",
    suggestion: "Please log in or create an account to continue.",
    action: { label: "Log In", href: "/login" },
  }),

  sessionExpired: (): ActionableError => ({
    code: ErrorCode.SESSION_EXPIRED,
    message: "Your session has expired.",
    suggestion: "Please log in again to continue.",
    action: { label: "Log In", href: "/login" },
  }),

  // Billing Errors
  insufficientCredits: (
    required: number,
    available: number
  ): ActionableError => ({
    code: ErrorCode.INSUFFICIENT_CREDITS,
    message: `You need ${required} credits but only have ${available} available.`,
    suggestion: "Purchase more credits or upgrade your plan to continue staging.",
    action: { label: "Get Credits", href: "/billing" },
    details: { required, available },
  }),

  paymentRequired: (): ActionableError => ({
    code: ErrorCode.PAYMENT_REQUIRED,
    message: "A paid subscription is required for this feature.",
    suggestion: "Upgrade to a paid plan to unlock this feature.",
    action: { label: "View Plans", href: "/billing" },
  }),

  subscriptionInactive: (): ActionableError => ({
    code: ErrorCode.SUBSCRIPTION_INACTIVE,
    message: "Your subscription is no longer active.",
    suggestion: "Renew your subscription to continue using premium features.",
    action: { label: "Manage Subscription", href: "/billing" },
  }),

  // Rate Limiting Errors
  rateLimited: (resetInSeconds: number): ActionableError => ({
    code: ErrorCode.RATE_LIMITED,
    message: "Too many requests. Please slow down.",
    suggestion: `Try again in ${Math.ceil(resetInSeconds / 60)} minute${resetInSeconds > 60 ? "s" : ""}.`,
    details: { resetInSeconds },
  }),

  stagingRateLimited: (): ActionableError => ({
    code: ErrorCode.RATE_LIMITED,
    message: "You've reached the staging limit for now.",
    suggestion:
      "Staging uses significant computing resources. Please wait a minute before staging more images.",
  }),

  // Permission Errors
  notOwner: (resource: string): ActionableError => ({
    code: ErrorCode.NOT_OWNER,
    message: `You don't have permission to modify this ${resource}.`,
    suggestion: `Only the owner of this ${resource} can make changes.`,
  }),

  teamMemberOnly: (): ActionableError => ({
    code: ErrorCode.INSUFFICIENT_PERMISSIONS,
    message: "This action is restricted to organization owners.",
    suggestion: "Contact your organization owner for assistance.",
    action: { label: "Go to Team", href: "/team" },
  }),

  // Resource Errors
  notFound: (resource: string): ActionableError => ({
    code: ErrorCode.NOT_FOUND,
    message: `The requested ${resource} could not be found.`,
    suggestion: `The ${resource} may have been deleted or you may not have access to it.`,
  }),

  propertyNotFound: (): ActionableError => ({
    code: ErrorCode.NOT_FOUND,
    message: "Property not found.",
    suggestion: "The property may have been deleted. Return to your properties list.",
    action: { label: "View Properties", href: "/properties" },
  }),

  jobNotFound: (): ActionableError => ({
    code: ErrorCode.NOT_FOUND,
    message: "Staging job not found.",
    suggestion: "The job may have been deleted. Check your staging history.",
    action: { label: "View History", href: "/history" },
  }),

  alreadyExists: (resource: string): ActionableError => ({
    code: ErrorCode.ALREADY_EXISTS,
    message: `This ${resource} already exists.`,
    suggestion: `Try using a different name or check your existing ${resource}s.`,
  }),

  // Validation Errors
  validationError: (
    fields: Array<{ field: string; message: string }>
  ): ActionableError => ({
    code: ErrorCode.VALIDATION_ERROR,
    message: "Please fix the errors in your submission.",
    suggestion: "Review the highlighted fields and correct any issues.",
    details: { fields },
  }),

  invalidImageFormat: (): ActionableError => ({
    code: ErrorCode.INVALID_INPUT,
    message: "Invalid image format.",
    suggestion:
      "Please upload a JPEG, PNG, or WebP image. Make sure the file isn't corrupted.",
  }),

  imageTooLarge: (maxSizeMB: number): ActionableError => ({
    code: ErrorCode.INVALID_INPUT,
    message: `Image is too large (max ${maxSizeMB}MB).`,
    suggestion:
      "Try compressing your image or using a lower resolution version.",
    details: { maxSizeMB },
  }),

  // External Service Errors
  providerError: (provider: string): ActionableError => ({
    code: ErrorCode.PROVIDER_ERROR,
    message: `The ${provider} service encountered an error.`,
    suggestion:
      "This is usually temporary. Please try again in a few moments.",
  }),

  stagingFailed: (): ActionableError => ({
    code: ErrorCode.PROVIDER_ERROR,
    message: "Failed to stage the image.",
    suggestion:
      "Try a different image or style. If the problem persists, contact support.",
    action: { label: "Try Again", href: "/stage" },
  }),

  emailFailed: (): ActionableError => ({
    code: ErrorCode.EMAIL_ERROR,
    message: "Failed to send the email.",
    suggestion:
      "Please verify the email address and try again. Check your spam folder if expected.",
  }),

  // Team Errors
  teamFull: (maxMembers: number): ActionableError => ({
    code: ErrorCode.CONFLICT,
    message: `Your team has reached its maximum size of ${maxMembers} members.`,
    suggestion: "Upgrade your plan to add more team members.",
    action: { label: "Upgrade Plan", href: "/billing" },
    details: { maxMembers },
  }),

  invitationExists: (email: string): ActionableError => ({
    code: ErrorCode.ALREADY_EXISTS,
    message: `An invitation has already been sent to ${email}.`,
    suggestion: "You can resend or revoke the existing invitation.",
    action: { label: "Manage Invitations", href: "/team" },
  }),

  // General Errors
  internalError: (): ActionableError => ({
    code: ErrorCode.INTERNAL_ERROR,
    message: "An unexpected error occurred.",
    suggestion:
      "Please try again. If the problem persists, contact support.",
  }),

  serviceUnavailable: (): ActionableError => ({
    code: ErrorCode.SERVICE_UNAVAILABLE,
    message: "The service is temporarily unavailable.",
    suggestion: "Please try again in a few minutes.",
  }),
};

/**
 * Helper to get HTTP status code from error code
 */
export function getStatusFromErrorCode(code: ErrorCodeType): number {
  switch (code) {
    case ErrorCode.UNAUTHORIZED:
    case ErrorCode.SESSION_EXPIRED:
    case ErrorCode.INVALID_CREDENTIALS:
      return 401;

    case ErrorCode.FORBIDDEN:
    case ErrorCode.NOT_OWNER:
    case ErrorCode.INSUFFICIENT_PERMISSIONS:
      return 403;

    case ErrorCode.NOT_FOUND:
      return 404;

    case ErrorCode.ALREADY_EXISTS:
    case ErrorCode.CONFLICT:
      return 409;

    case ErrorCode.VALIDATION_ERROR:
    case ErrorCode.INVALID_INPUT:
    case ErrorCode.MISSING_REQUIRED_FIELD:
      return 400;

    case ErrorCode.INSUFFICIENT_CREDITS:
    case ErrorCode.PAYMENT_REQUIRED:
    case ErrorCode.SUBSCRIPTION_INACTIVE:
      return 402;

    case ErrorCode.RATE_LIMITED:
      return 429;

    case ErrorCode.SERVICE_UNAVAILABLE:
      return 503;

    case ErrorCode.PROVIDER_ERROR:
    case ErrorCode.STORAGE_ERROR:
    case ErrorCode.EMAIL_ERROR:
    case ErrorCode.INTERNAL_ERROR:
    default:
      return 500;
  }
}

/**
 * Convenience function to return an actionable error response
 */
export function respondWithError(error: ActionableError): NextResponse {
  return createErrorResponse(error, getStatusFromErrorCode(error.code));
}
