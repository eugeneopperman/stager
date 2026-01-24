import { z } from "zod";

/**
 * Valid plan slugs
 */
export const planSlugSchema = z.enum([
  "free",
  "standard",
  "professional",
  "enterprise",
]);

export type PlanSlugSchema = z.infer<typeof planSlugSchema>;

/**
 * Valid top-up package IDs
 */
export const topupPackageIdSchema = z.enum([
  "topup_10",
  "topup_25",
  "topup_50",
]);

export type TopupPackageIdSchema = z.infer<typeof topupPackageIdSchema>;

/**
 * Checkout request schema
 * POST /api/billing/checkout
 */
export const checkoutRequestSchema = z
  .object({
    planSlug: planSlugSchema,
  })
  .refine((data) => data.planSlug !== "free", {
    message: "Cannot checkout for free plan",
    path: ["planSlug"],
  });

export type CheckoutRequest = z.infer<typeof checkoutRequestSchema>;

/**
 * Top-up request schema
 * POST /api/billing/topup
 */
export const topupRequestSchema = z.object({
  packageId: topupPackageIdSchema,
});

export type TopupRequest = z.infer<typeof topupRequestSchema>;

/**
 * Subscription action schema
 * PATCH /api/billing/subscription
 */
export const subscriptionActionSchema = z.object({
  action: z.enum(["cancel", "resume"]),
});

export type SubscriptionAction = z.infer<typeof subscriptionActionSchema>;
