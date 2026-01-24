/**
 * Team Services
 * Modular services for team management operations
 */

// Organization queries
export {
  getOwnedOrganization,
  getUserPlanLimits,
  getPendingInvitationsCount,
  getUserProfile,
  type OrganizationWithMembers,
} from "./organization.service";

// Validation
export {
  getOrganizationContext,
  validateTeamCapacity,
  validateCreditAllocation,
  type ValidationResult,
  type OrganizationContext,
} from "./validation.service";

// Invitation management
export {
  checkExistingInvitation,
  createInvitation,
  sendInvitationEmail,
  deleteInvitation,
  resendInvitation,
  type TeamInvitation,
  type CreateInvitationParams,
} from "./invitation.service";
