/**
 * Cached Query Wrappers
 *
 * These functions wrap database queries with caching for better performance.
 * Use these instead of direct database calls for frequently accessed data.
 */

import { createClient } from "@/lib/supabase/server";
import {
  getCachedUserCredits,
  setCachedUserCredits,
  invalidateUserCredits,
  getCachedUserSubscription,
  setCachedUserSubscription,
  invalidateUserSubscription,
  getCachedUserPlan,
  setCachedUserPlan,
  invalidateUserPlan,
  getCachedTeamMembers,
  setCachedTeamMembers,
  invalidateTeamMembers,
  getCachedStagingJob,
  setCachedStagingJob,
  invalidateAllUserCaches,
  type CachedUserCredits,
  type CachedSubscription,
  type CachedPlan,
  type CachedTeamMember,
  type CachedStagingJob,
} from "./index";

// ============================================
// User Credits
// ============================================

export interface UserCreditsResult {
  available: number;
  allocated: number;
  used: number;
  isTeamMember: boolean;
  fromCache: boolean;
}

/**
 * Get user credits with caching
 */
export async function getUserCreditsWithCache(userId: string): Promise<UserCreditsResult> {
  // Check cache first
  const cached = await getCachedUserCredits(userId);
  if (cached) {
    return {
      ...cached,
      isTeamMember: cached.allocated > 0,
      fromCache: true,
    };
  }

  // Fetch from database
  const supabase = await createClient();

  // Check if user is part of an organization
  const { data: membership } = await supabase
    .from("organization_members")
    .select("allocated_credits, credits_used_this_period")
    .eq("user_id", userId)
    .single();

  let credits: Omit<CachedUserCredits, "cachedAt">;

  if (membership) {
    const available = Math.max(
      0,
      membership.allocated_credits - membership.credits_used_this_period
    );
    credits = {
      available,
      allocated: membership.allocated_credits,
      used: membership.credits_used_this_period,
    };
  } else {
    // Get personal credits
    const { data: profile } = await supabase
      .from("profiles")
      .select("credits_remaining")
      .eq("id", userId)
      .single();

    credits = {
      available: profile?.credits_remaining || 0,
      allocated: 0,
      used: 0,
    };
  }

  // Cache the result
  await setCachedUserCredits(userId, credits);

  return {
    ...credits,
    isTeamMember: credits.allocated > 0,
    fromCache: false,
  };
}

// ============================================
// User Subscription
// ============================================

export interface SubscriptionResult extends Omit<CachedSubscription, "cachedAt"> {
  fromCache: boolean;
}

/**
 * Get user subscription with caching
 */
export async function getUserSubscriptionWithCache(
  userId: string
): Promise<SubscriptionResult | null> {
  // Check cache first
  const cached = await getCachedUserSubscription(userId);
  if (cached) {
    const { cachedAt: _, ...rest } = cached;
    return { ...rest, fromCache: true };
  }

  // Fetch from database
  const supabase = await createClient();

  const { data } = await supabase
    .from("subscriptions")
    .select("id, status, cancel_at_period_end, current_period_end, plan:plans(slug)")
    .eq("user_id", userId)
    .single();

  if (!data) {
    // Cache the null result to avoid repeated lookups
    await setCachedUserSubscription(userId, {
      id: null,
      status: null,
      planSlug: null,
      currentPeriodEnd: null,
      cancelAtPeriodEnd: false,
    });
    return null;
  }

  const planSlug = (data.plan as { slug: string } | null)?.slug || null;

  const subscription: Omit<CachedSubscription, "cachedAt"> = {
    id: data.id,
    status: data.status,
    planSlug,
    currentPeriodEnd: data.current_period_end,
    cancelAtPeriodEnd: data.cancel_at_period_end || false,
  };

  // Cache the result
  await setCachedUserSubscription(userId, subscription);

  return { ...subscription, fromCache: false };
}

// ============================================
// User Plan
// ============================================

export interface PlanResult extends Omit<CachedPlan, "cachedAt"> {
  fromCache: boolean;
}

/**
 * Get user's plan with caching
 */
export async function getUserPlanWithCache(userId: string): Promise<PlanResult> {
  // Check cache first
  const cached = await getCachedUserPlan(userId);
  if (cached) {
    const { cachedAt: _, ...rest } = cached;
    return { ...rest, fromCache: true };
  }

  // Fetch subscription to get plan
  const subscription = await getUserSubscriptionWithCache(userId);
  const supabase = await createClient();

  let plan: Omit<CachedPlan, "cachedAt">;

  if (subscription?.planSlug && subscription.status === "active") {
    const { data } = await supabase
      .from("plans")
      .select("slug, name, credits_per_month, max_team_members")
      .eq("slug", subscription.planSlug)
      .single();

    if (data) {
      plan = {
        slug: data.slug,
        name: data.name,
        creditsPerMonth: data.credits_per_month,
        maxTeamMembers: data.max_team_members || 1,
      };
    } else {
      // Fallback to free plan
      plan = {
        slug: "free",
        name: "Free",
        creditsPerMonth: 5,
        maxTeamMembers: 1,
      };
    }
  } else {
    // Free plan
    const { data } = await supabase
      .from("plans")
      .select("slug, name, credits_per_month, max_team_members")
      .eq("slug", "free")
      .single();

    plan = data
      ? {
          slug: data.slug,
          name: data.name,
          creditsPerMonth: data.credits_per_month,
          maxTeamMembers: data.max_team_members || 1,
        }
      : {
          slug: "free",
          name: "Free",
          creditsPerMonth: 5,
          maxTeamMembers: 1,
        };
  }

  // Cache the result
  await setCachedUserPlan(userId, plan);

  return { ...plan, fromCache: false };
}

// ============================================
// Team Members
// ============================================

export interface TeamMembersResult {
  members: CachedTeamMember[];
  fromCache: boolean;
}

/**
 * Get team members with caching
 */
export async function getTeamMembersWithCache(
  organizationId: string
): Promise<TeamMembersResult> {
  // Check cache first
  const cached = await getCachedTeamMembers(organizationId);
  if (cached) {
    return { members: cached.members, fromCache: true };
  }

  // Fetch from database
  const supabase = await createClient();

  const { data } = await supabase
    .from("organization_members")
    .select(
      `
      id,
      user_id,
      role,
      allocated_credits,
      profile:profiles(email, full_name)
    `
    )
    .eq("organization_id", organizationId);

  const members: CachedTeamMember[] = (data || []).map((m) => ({
    id: m.id,
    userId: m.user_id,
    email: (m.profile as { email: string } | null)?.email || "",
    fullName: (m.profile as { full_name: string | null } | null)?.full_name || null,
    role: m.role,
    credits: m.allocated_credits,
  }));

  // Cache the result
  await setCachedTeamMembers(organizationId, members);

  return { members, fromCache: false };
}

// ============================================
// Staging Job
// ============================================

export interface StagingJobResult extends Omit<CachedStagingJob, "cachedAt"> {
  fromCache: boolean;
}

/**
 * Get staging job status with caching (for polling optimization)
 */
export async function getStagingJobWithCache(
  jobId: string
): Promise<StagingJobResult | null> {
  // Check cache first
  const cached = await getCachedStagingJob(jobId);
  if (cached) {
    // Don't return from cache if job is still processing (needs fresh data)
    if (cached.status === "completed" || cached.status === "failed") {
      const { cachedAt: _, ...rest } = cached;
      return { ...rest, fromCache: true };
    }
  }

  // Fetch from database
  const supabase = await createClient();

  const { data } = await supabase
    .from("staging_jobs")
    .select("id, status, staged_image_url, error_message")
    .eq("id", jobId)
    .single();

  if (!data) {
    return null;
  }

  const job: Omit<CachedStagingJob, "cachedAt"> = {
    id: data.id,
    status: data.status,
    stagedImageUrl: data.staged_image_url,
    errorMessage: data.error_message,
  };

  // Cache the result
  await setCachedStagingJob(jobId, job);

  return { ...job, fromCache: false };
}

// ============================================
// Cache Invalidation Helpers
// ============================================

/**
 * Invalidate user credits cache (call after credit changes)
 */
export { invalidateUserCredits };

/**
 * Invalidate subscription cache (call after subscription changes)
 */
export { invalidateUserSubscription };

/**
 * Invalidate plan cache
 */
export { invalidateUserPlan };

/**
 * Invalidate team members cache
 */
export { invalidateTeamMembers };

/**
 * Invalidate all caches for a user
 */
export { invalidateAllUserCaches };

/**
 * Invalidate caches after billing change
 */
export async function invalidateBillingCaches(userId: string): Promise<void> {
  await Promise.all([
    invalidateUserCredits(userId),
    invalidateUserSubscription(userId),
    invalidateUserPlan(userId),
  ]);
}
