import { z } from "zod";

/**
 * Email validation with RFC 5322 compliance (basic)
 */
export const emailSchema = z
  .string()
  .email("Invalid email format")
  .min(5, "Email must be at least 5 characters")
  .max(254, "Email must not exceed 254 characters")
  .transform((email) => email.toLowerCase().trim());

/**
 * Team invitation request schema
 * POST /api/team/invite
 */
export const teamInviteRequestSchema = z.object({
  email: emailSchema,
  initialCredits: z
    .number()
    .int("Credits must be a whole number")
    .min(0, "Credits cannot be negative")
    .default(0),
});

export type TeamInviteRequest = z.infer<typeof teamInviteRequestSchema>;

/**
 * Organization name schema
 * Used for creating/updating organizations
 */
export const organizationNameSchema = z.object({
  name: z
    .string()
    .min(2, "Organization name must be at least 2 characters")
    .max(100, "Organization name must not exceed 100 characters")
    .trim(),
});

export type OrganizationName = z.infer<typeof organizationNameSchema>;

/**
 * Member credits allocation schema
 * PATCH /api/team/members/[id]/credits
 */
export const memberCreditsSchema = z.object({
  credits: z
    .number()
    .int("Credits must be a whole number")
    .min(0, "Credits cannot be negative"),
});

export type MemberCredits = z.infer<typeof memberCreditsSchema>;

/**
 * Team member role schema
 */
export const teamRoleSchema = z.enum(["admin", "member"]);

export type TeamRole = z.infer<typeof teamRoleSchema>;
