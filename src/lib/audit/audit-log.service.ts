/**
 * Audit logging service for tracking sensitive operations
 */

import { SupabaseClient } from "@supabase/supabase-js";

/**
 * Audit event types organized by category
 */
export const AuditEventType = {
  // Team operations
  TEAM_INVITATION_CREATED: "team.invitation.created",
  TEAM_INVITATION_ACCEPTED: "team.invitation.accepted",
  TEAM_INVITATION_REVOKED: "team.invitation.revoked",
  TEAM_INVITATION_RESENT: "team.invitation.resent",
  TEAM_MEMBER_REMOVED: "team.member.removed",
  TEAM_CREDITS_ALLOCATED: "team.credits.allocated",

  // Billing operations
  BILLING_CHECKOUT_CREATED: "billing.checkout.created",
  BILLING_TOPUP_INITIATED: "billing.topup.initiated",
  BILLING_SUBSCRIPTION_CREATED: "billing.subscription.created",
  BILLING_SUBSCRIPTION_CANCELED: "billing.subscription.canceled",
  BILLING_SUBSCRIPTION_RESUMED: "billing.subscription.resumed",
  BILLING_SUBSCRIPTION_RENEWED: "billing.subscription.renewed",
  BILLING_PAYMENT_FAILED: "billing.payment.failed",
  BILLING_CREDITS_PURCHASED: "billing.credits.purchased",

  // Account operations
  ACCOUNT_DELETED: "account.deleted",
  ACCOUNT_PASSWORD_CHANGED: "account.password.changed",
  ACCOUNT_PROFILE_UPDATED: "account.profile.updated",

  // Staging operations
  STAGING_JOB_CREATED: "staging.job.created",
  STAGING_CREDITS_DEDUCTED: "staging.credits.deducted",
  STAGING_REMIX_CREATED: "staging.remix.created",
  STAGING_VERSION_PRIMARY_CHANGED: "staging.version.primary_changed",

  // Property operations
  PROPERTY_CREATED: "property.created",
  PROPERTY_UPDATED: "property.updated",
  PROPERTY_DELETED: "property.deleted",
  PROPERTY_VISIBILITY_CHANGED: "property.visibility.changed",

  // Organization operations
  ORGANIZATION_CREATED: "organization.created",
  ORGANIZATION_UPDATED: "organization.updated",
} as const;

export type AuditEventTypeValue =
  (typeof AuditEventType)[keyof typeof AuditEventType];

/**
 * Resource types for categorization
 */
export type AuditResourceType =
  | "team_invitation"
  | "team_member"
  | "subscription"
  | "credits"
  | "account"
  | "staging_job"
  | "property"
  | "organization";

/**
 * Action types
 */
export type AuditAction =
  | "created"
  | "updated"
  | "deleted"
  | "invoked";

/**
 * Audit log entry structure
 */
export interface AuditLogEntry {
  userId?: string;
  organizationId?: string;
  eventType: AuditEventTypeValue;
  resourceType: AuditResourceType;
  resourceId?: string;
  action: AuditAction;
  previousValues?: Record<string, unknown>;
  newValues?: Record<string, unknown>;
  metadata?: Record<string, unknown>;
  ipAddress?: string;
  userAgent?: string;
  requestId?: string;
}

/**
 * Result of audit log creation
 */
export interface AuditLogResult {
  success: boolean;
  logId?: string;
  error?: string;
}

/**
 * Create an audit log entry
 *
 * @param supabase - Supabase client (should be service role for writes)
 * @param entry - Audit log entry data
 * @returns Result with success status and log ID
 */
export async function createAuditLog(
  supabase: SupabaseClient,
  entry: AuditLogEntry
): Promise<AuditLogResult> {
  try {
    const { data, error } = await supabase
      .from("audit_logs")
      .insert({
        user_id: entry.userId,
        organization_id: entry.organizationId,
        event_type: entry.eventType,
        resource_type: entry.resourceType,
        resource_id: entry.resourceId,
        action: entry.action,
        previous_values: entry.previousValues,
        new_values: entry.newValues,
        metadata: entry.metadata || {},
        ip_address: entry.ipAddress,
        user_agent: entry.userAgent,
        request_id: entry.requestId,
      })
      .select("id")
      .single();

    if (error) {
      console.error("[AuditLog] Failed to create log:", error);
      return { success: false, error: error.message };
    }

    return { success: true, logId: data.id };
  } catch (error) {
    console.error("[AuditLog] Unexpected error:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}

/**
 * Helper to extract request context from NextRequest
 */
export function getRequestContext(request: Request): {
  ipAddress?: string;
  userAgent?: string;
  requestId?: string;
} {
  return {
    ipAddress:
      request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
      request.headers.get("x-real-ip") ||
      undefined,
    userAgent: request.headers.get("user-agent") || undefined,
    requestId: request.headers.get("x-request-id") || undefined,
  };
}

/**
 * Convenience function for logging team events
 */
export async function logTeamEvent(
  supabase: SupabaseClient,
  event: {
    userId: string;
    organizationId: string;
    eventType: AuditEventTypeValue;
    resourceId?: string;
    action: AuditAction;
    details?: Record<string, unknown>;
    request?: Request;
  }
): Promise<AuditLogResult> {
  const context = event.request ? getRequestContext(event.request) : {};

  return createAuditLog(supabase, {
    userId: event.userId,
    organizationId: event.organizationId,
    eventType: event.eventType,
    resourceType: "team_member",
    resourceId: event.resourceId,
    action: event.action,
    newValues: event.details,
    ...context,
  });
}

/**
 * Convenience function for logging billing events
 */
export async function logBillingEvent(
  supabase: SupabaseClient,
  event: {
    userId: string;
    organizationId?: string;
    eventType: AuditEventTypeValue;
    resourceId?: string;
    action: AuditAction;
    previousValues?: Record<string, unknown>;
    newValues?: Record<string, unknown>;
    metadata?: Record<string, unknown>;
    request?: Request;
  }
): Promise<AuditLogResult> {
  const context = event.request ? getRequestContext(event.request) : {};

  return createAuditLog(supabase, {
    userId: event.userId,
    organizationId: event.organizationId,
    eventType: event.eventType,
    resourceType: "subscription",
    resourceId: event.resourceId,
    action: event.action,
    previousValues: event.previousValues,
    newValues: event.newValues,
    metadata: event.metadata,
    ...context,
  });
}

/**
 * Convenience function for logging credit events
 */
export async function logCreditEvent(
  supabase: SupabaseClient,
  event: {
    userId: string;
    organizationId?: string;
    eventType: AuditEventTypeValue;
    action: AuditAction;
    previousBalance: number;
    newBalance: number;
    amount: number;
    reason: string;
    request?: Request;
  }
): Promise<AuditLogResult> {
  const context = event.request ? getRequestContext(event.request) : {};

  return createAuditLog(supabase, {
    userId: event.userId,
    organizationId: event.organizationId,
    eventType: event.eventType,
    resourceType: "credits",
    action: event.action,
    previousValues: { balance: event.previousBalance },
    newValues: { balance: event.newBalance, amount: event.amount },
    metadata: { reason: event.reason },
    ...context,
  });
}

/**
 * Convenience function for logging account events
 */
export async function logAccountEvent(
  supabase: SupabaseClient,
  event: {
    userId: string;
    eventType: AuditEventTypeValue;
    action: AuditAction;
    details?: Record<string, unknown>;
    request?: Request;
  }
): Promise<AuditLogResult> {
  const context = event.request ? getRequestContext(event.request) : {};

  return createAuditLog(supabase, {
    userId: event.userId,
    eventType: event.eventType,
    resourceType: "account",
    resourceId: event.userId,
    action: event.action,
    newValues: event.details,
    ...context,
  });
}
