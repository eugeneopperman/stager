import { createClient } from "@/lib/supabase/server";
import type { Plan, Subscription, SubscriptionWithPlan, OrganizationMember } from "./database.types";

// Get user's current subscription with plan details
export async function getUserSubscription(userId: string): Promise<SubscriptionWithPlan | null> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("subscriptions")
    .select(`
      *,
      plan:plans(*)
    `)
    .eq("user_id", userId)
    .single();

  if (error || !data) {
    return null;
  }

  return data as SubscriptionWithPlan;
}

// Get user's current plan (from subscription or default free)
export async function getUserPlan(userId: string): Promise<Plan> {
  const supabase = await createClient();

  // First check for active subscription
  const subscription = await getUserSubscription(userId);
  if (subscription && subscription.status === "active") {
    return subscription.plan;
  }

  // Fall back to free plan
  const { data: freePlan } = await supabase
    .from("plans")
    .select("*")
    .eq("slug", "free")
    .single();

  return freePlan!;
}

// Get all available plans
export async function getPlans(): Promise<Plan[]> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("plans")
    .select("*")
    .eq("is_active", true)
    .order("sort_order", { ascending: true });

  if (error) {
    console.error("Error fetching plans:", error);
    return [];
  }

  return data || [];
}

// Get user's effective credits (personal or from organization allocation)
export async function getUserCredits(userId: string): Promise<{
  available: number;
  allocated: number;
  used: number;
  isTeamMember: boolean;
}> {
  const supabase = await createClient();

  // Check if user is part of an organization
  const { data: membership } = await supabase
    .from("organization_members")
    .select("*")
    .eq("user_id", userId)
    .single();

  if (membership) {
    const available = Math.max(0, membership.allocated_credits - membership.credits_used_this_period);
    return {
      available,
      allocated: membership.allocated_credits,
      used: membership.credits_used_this_period,
      isTeamMember: true,
    };
  }

  // Get personal credits
  const { data: profile } = await supabase
    .from("profiles")
    .select("credits_remaining")
    .eq("id", userId)
    .single();

  return {
    available: profile?.credits_remaining || 0,
    allocated: 0,
    used: 0,
    isTeamMember: false,
  };
}

// Deduct credits from user (handles both personal and org member)
export async function deductCredits(userId: string, amount: number): Promise<boolean> {
  const supabase = await createClient();

  // Check if user is part of an organization
  const { data: membership } = await supabase
    .from("organization_members")
    .select("*")
    .eq("user_id", userId)
    .single();

  if (membership) {
    const available = membership.allocated_credits - membership.credits_used_this_period;
    if (available < amount) {
      return false;
    }

    const { error } = await supabase
      .from("organization_members")
      .update({
        credits_used_this_period: membership.credits_used_this_period + amount,
      })
      .eq("id", membership.id);

    return !error;
  }

  // Deduct from personal credits
  const { data: profile } = await supabase
    .from("profiles")
    .select("credits_remaining")
    .eq("id", userId)
    .single();

  if (!profile || profile.credits_remaining < amount) {
    return false;
  }

  const { error } = await supabase
    .from("profiles")
    .update({
      credits_remaining: profile.credits_remaining - amount,
    })
    .eq("id", userId);

  return !error;
}

// Add credits to user
export async function addCredits(userId: string, amount: number): Promise<boolean> {
  const supabase = await createClient();

  const { data: profile } = await supabase
    .from("profiles")
    .select("credits_remaining")
    .eq("id", userId)
    .single();

  if (!profile) {
    return false;
  }

  const { error } = await supabase
    .from("profiles")
    .update({
      credits_remaining: profile.credits_remaining + amount,
    })
    .eq("id", userId);

  return !error;
}

// Reset credits for subscription renewal
export async function resetCreditsForRenewal(
  userId: string,
  creditsPerMonth: number
): Promise<boolean> {
  const supabase = await createClient();

  // Check if user is org owner
  const { data: org } = await supabase
    .from("organizations")
    .select("*")
    .eq("owner_id", userId)
    .single();

  if (org) {
    // Reset organization credits
    const { error } = await supabase
      .from("organizations")
      .update({
        total_credits: creditsPerMonth,
        unallocated_credits: creditsPerMonth,
      })
      .eq("id", org.id);

    // Reset all member usage
    if (!error) {
      await supabase
        .from("organization_members")
        .update({ credits_used_this_period: 0 })
        .eq("organization_id", org.id);
    }

    return !error;
  }

  // Reset personal credits
  const { error } = await supabase
    .from("profiles")
    .update({
      credits_remaining: creditsPerMonth,
      credits_reset_at: new Date().toISOString(),
    })
    .eq("id", userId);

  return !error;
}

// Log credit transaction
export async function logCreditTransaction(params: {
  userId?: string;
  organizationId?: string;
  type: "subscription_renewal" | "topup_purchase" | "staging_deduction" | "allocation_to_member" | "allocation_from_owner" | "refund" | "adjustment";
  amount: number;
  balanceAfter: number;
  referenceId?: string;
  description?: string;
}): Promise<void> {
  const supabase = await createClient();

  await supabase.from("credit_transactions").insert({
    user_id: params.userId,
    organization_id: params.organizationId,
    transaction_type: params.type,
    amount: params.amount,
    balance_after: params.balanceAfter,
    reference_id: params.referenceId,
    description: params.description,
  });
}

// Create or update subscription
export async function upsertSubscription(params: {
  userId: string;
  planId: string;
  stripeSubscriptionId: string;
  stripeCustomerId: string;
  status: "active" | "canceled" | "past_due" | "trialing" | "paused";
  currentPeriodStart?: Date;
  currentPeriodEnd?: Date;
  cancelAtPeriodEnd?: boolean;
}): Promise<Subscription | null> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("subscriptions")
    .upsert(
      {
        user_id: params.userId,
        plan_id: params.planId,
        stripe_subscription_id: params.stripeSubscriptionId,
        stripe_customer_id: params.stripeCustomerId,
        status: params.status,
        current_period_start: params.currentPeriodStart?.toISOString(),
        current_period_end: params.currentPeriodEnd?.toISOString(),
        cancel_at_period_end: params.cancelAtPeriodEnd ?? false,
      },
      {
        onConflict: "user_id",
      }
    )
    .select()
    .single();

  if (error) {
    console.error("Error upserting subscription:", error);
    return null;
  }

  return data;
}

// Get plan by slug
export async function getPlanBySlug(slug: string): Promise<Plan | null> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("plans")
    .select("*")
    .eq("slug", slug)
    .single();

  if (error) {
    return null;
  }

  return data;
}

// Check if user has enterprise plan
export async function isEnterprisePlan(userId: string): Promise<boolean> {
  const plan = await getUserPlan(userId);
  return plan.slug === "enterprise";
}

// Get user's organization membership
export async function getUserOrganization(userId: string) {
  const supabase = await createClient();

  // First, check if user is owner of an organization (simple query)
  const { data: ownedOrg, error: ownedError } = await supabase
    .from("organizations")
    .select("*")
    .eq("owner_id", userId)
    .single();

  if (ownedError && ownedError.code !== "PGRST116") {
    // Non-"not found" error occurred
  }

  if (ownedOrg) {
    // Fetch members separately
    const { data: members, error: membersError } = await supabase
      .from("organization_members")
      .select(`
        *,
        profile:profiles(id, full_name, company_name)
      `)
      .eq("organization_id", ownedOrg.id);

    if (membersError) {
      // Members query failed
    }

    return {
      organization: { ...ownedOrg, members: members || [] },
      role: "owner" as const,
    };
  }

  // Check if user is a member of an organization
  const { data: membership, error: memberError } = await supabase
    .from("organization_members")
    .select("*")
    .eq("user_id", userId)
    .single();

  if (memberError && memberError.code !== "PGRST116") {
    // Non-"not found" error occurred
  }

  if (membership) {
    // Fetch the organization
    const { data: org } = await supabase
      .from("organizations")
      .select("*")
      .eq("id", membership.organization_id)
      .single();

    if (org) {
      // Fetch all members
      const { data: members } = await supabase
        .from("organization_members")
        .select(`
          *,
          profile:profiles(id, full_name, company_name)
        `)
        .eq("organization_id", org.id);

      return {
        organization: { ...org, members: members || [] },
        role: membership.role,
      };
    }
  }

  return null;
}
