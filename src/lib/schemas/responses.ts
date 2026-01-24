import { z } from "zod";

/**
 * API Response Schemas
 *
 * These schemas define the contract for API responses.
 * Used for contract testing and type generation.
 */

// ============================================
// Common Response Types
// ============================================

/**
 * Standard error response
 */
export const errorResponseSchema = z.object({
  error: z.string(),
  code: z.string().optional(),
  fields: z
    .array(
      z.object({
        field: z.string(),
        message: z.string(),
      })
    )
    .optional(),
  action: z
    .object({
      label: z.string(),
      href: z.string().optional(),
      onClick: z.string().optional(),
    })
    .optional(),
});

export type ErrorResponse = z.infer<typeof errorResponseSchema>;

// ============================================
// Staging API Responses
// ============================================

/**
 * POST /api/staging - Success response
 */
export const stagingResponseSchema = z.object({
  id: z.string().uuid(),
  status: z.enum(["pending", "processing", "completed", "failed"]),
  stagedImageUrl: z.string().url().nullable(),
  thumbnailUrl: z.string().url().nullable().optional(),
  roomType: z.string(),
  style: z.string(),
  propertyId: z.string().uuid().nullable(),
  creditsUsed: z.number(),
  provider: z.string().optional(),
  processingTime: z.number().optional(),
});

export type StagingResponse = z.infer<typeof stagingResponseSchema>;

/**
 * GET /api/staging/[jobId] - Job details
 */
export const stagingJobResponseSchema = z.object({
  id: z.string().uuid(),
  status: z.enum(["pending", "processing", "completed", "failed"]),
  roomType: z.string(),
  style: z.string(),
  originalImageUrl: z.string().url(),
  stagedImageUrl: z.string().url().nullable(),
  thumbnailUrl: z.string().url().nullable().optional(),
  propertyId: z.string().uuid().nullable(),
  createdAt: z.string(),
  completedAt: z.string().nullable(),
  errorMessage: z.string().nullable().optional(),
  isPrimary: z.boolean().optional(),
  versionGroupId: z.string().uuid().nullable().optional(),
});

export type StagingJobResponse = z.infer<typeof stagingJobResponseSchema>;

// ============================================
// Billing API Responses
// ============================================

/**
 * GET /api/billing/subscription - Subscription info
 */
export const subscriptionResponseSchema = z.object({
  plan: z.string().nullable(),
  status: z.enum(["active", "canceled", "past_due", "none"]).nullable(),
  currentPeriodEnd: z.string().nullable(),
  cancelAtPeriodEnd: z.boolean(),
  credits: z.number(),
  monthlyCredits: z.number(),
});

export type SubscriptionResponse = z.infer<typeof subscriptionResponseSchema>;

/**
 * POST /api/billing/checkout - Checkout URL
 */
export const checkoutResponseSchema = z.object({
  url: z.string().url(),
  sessionId: z.string().optional(),
});

export type CheckoutResponse = z.infer<typeof checkoutResponseSchema>;

// ============================================
// Team API Responses
// ============================================

/**
 * GET /api/team - Team info
 */
export const teamResponseSchema = z.object({
  organization: z
    .object({
      id: z.string().uuid(),
      name: z.string(),
      credits: z.number(),
      ownerId: z.string().uuid(),
    })
    .nullable(),
  members: z.array(
    z.object({
      id: z.string().uuid(),
      userId: z.string().uuid(),
      email: z.string().email(),
      fullName: z.string().nullable(),
      role: z.enum(["owner", "admin", "member"]),
      credits: z.number(),
      joinedAt: z.string(),
    })
  ),
  isOwner: z.boolean(),
});

export type TeamResponse = z.infer<typeof teamResponseSchema>;

/**
 * POST /api/team/invite - Invite response
 */
export const inviteResponseSchema = z.object({
  success: z.literal(true),
  invitationId: z.string().uuid(),
  email: z.string().email(),
  expiresAt: z.string(),
});

export type InviteResponse = z.infer<typeof inviteResponseSchema>;

// ============================================
// Properties API Responses
// ============================================

/**
 * Property object
 */
export const propertySchema = z.object({
  id: z.string().uuid(),
  address: z.string(),
  description: z.string().nullable(),
  createdAt: z.string(),
  updatedAt: z.string(),
  stagingCount: z.number().optional(),
});

export type Property = z.infer<typeof propertySchema>;

/**
 * GET /api/properties - List of properties
 */
export const propertiesListResponseSchema = z.object({
  properties: z.array(propertySchema),
  total: z.number(),
});

export type PropertiesListResponse = z.infer<typeof propertiesListResponseSchema>;

// ============================================
// Search API Responses
// ============================================

/**
 * GET /api/search - Search results
 */
export const searchResponseSchema = z.object({
  properties: z.array(
    z.object({
      id: z.string().uuid(),
      address: z.string(),
      description: z.string().nullable(),
    })
  ),
  stagingJobs: z.array(
    z.object({
      id: z.string().uuid(),
      roomType: z.string(),
      style: z.string(),
      stagedImageUrl: z.string().url().nullable(),
      property: z
        .object({
          id: z.string().uuid(),
          address: z.string(),
        })
        .nullable(),
    })
  ),
});

export type SearchResponse = z.infer<typeof searchResponseSchema>;

// ============================================
// User/Account Responses
// ============================================

/**
 * User profile
 */
export const userProfileSchema = z.object({
  id: z.string().uuid(),
  email: z.string().email(),
  fullName: z.string().nullable(),
  credits: z.number(),
  createdAt: z.string(),
});

export type UserProfile = z.infer<typeof userProfileSchema>;
