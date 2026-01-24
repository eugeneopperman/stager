/**
 * Team Validation Service
 * Handles validation for team operations
 */

import {
  getOwnedOrganization,
  getUserPlanLimits,
  getPendingInvitationsCount,
  type OrganizationWithMembers,
} from "./organization.service";

/**
 * Validation result
 */
export interface ValidationResult {
  valid: boolean;
  error?: string;
  errorCode?: string;
}

/**
 * Organization context for invitation validation
 */
export interface OrganizationContext {
  organization: OrganizationWithMembers;
  currentMembers: number;
  maxMembers: number;
  pendingInvitations: number;
}

/**
 * Get organization context for validation
 */
export async function getOrganizationContext(
  userId: string
): Promise<OrganizationContext | null> {
  const organization = await getOwnedOrganization(userId);
  if (!organization) {
    return null;
  }

  const { maxTeamMembers } = await getUserPlanLimits(userId);
  const pendingInvitations = await getPendingInvitationsCount(organization.id);
  const currentMembers =
    (organization.members as unknown as { count: number }[])?.[0]?.count || 0;

  return {
    organization,
    currentMembers,
    maxMembers: maxTeamMembers,
    pendingInvitations,
  };
}

/**
 * Validate team has capacity for new invite
 */
export function validateTeamCapacity(
  context: OrganizationContext
): ValidationResult {
  const totalPendingAndCurrent = context.currentMembers + context.pendingInvitations;

  if (totalPendingAndCurrent >= context.maxMembers) {
    return {
      valid: false,
      error: `Your team has reached its maximum size of ${context.maxMembers} members.`,
      errorCode: "TEAM_FULL",
    };
  }

  return { valid: true };
}

/**
 * Validate credit allocation for invite
 */
export function validateCreditAllocation(
  organization: OrganizationWithMembers,
  requestedCredits: number
): ValidationResult {
  if (requestedCredits > organization.unallocated_credits) {
    return {
      valid: false,
      error: `Not enough unallocated credits. Available: ${organization.unallocated_credits}`,
      errorCode: "INSUFFICIENT_CREDITS",
    };
  }

  return { valid: true };
}
