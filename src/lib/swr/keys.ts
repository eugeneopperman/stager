/**
 * Centralized cache keys for SWR invalidation
 */

export const swrKeys = {
  // Staging jobs
  stagingJob: (jobId: string) => `/api/staging/${jobId}` as const,
  stagingVersions: (jobId: string) => `/api/staging/versions?jobId=${jobId}` as const,

  // Notifications
  notifications: (userId: string) => `/api/notifications?userId=${userId}` as const,
  unreadCount: (userId: string) => `/api/notifications/count?userId=${userId}` as const,

  // Team
  teamInvitations: () => "/api/team/invitations" as const,
  teamMembers: () => "/api/team/members" as const,

  // Properties
  properties: () => "/api/properties" as const,
  property: (id: string) => `/api/properties/${id}` as const,

  // Billing
  subscription: () => "/api/billing/subscription" as const,
  usage: () => "/api/billing/usage" as const,
} as const;

/**
 * Key prefixes for pattern-based invalidation
 */
export const swrKeyPatterns = {
  staging: /^\/api\/staging/,
  notifications: /^\/api\/notifications/,
  team: /^\/api\/team/,
  properties: /^\/api\/properties/,
  billing: /^\/api\/billing/,
} as const;
