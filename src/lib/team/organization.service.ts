/**
 * Organization Service
 * Handles organization-related queries
 */

import { createClient } from "@/lib/supabase/server";

/**
 * Organization with member count
 */
export interface OrganizationWithMembers {
  id: string;
  name: string;
  owner_id: string;
  unallocated_credits: number;
  members: Array<{ count: number }>;
}

/**
 * Get organization owned by user
 */
export async function getOwnedOrganization(
  userId: string
): Promise<OrganizationWithMembers | null> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("organizations")
    .select("*, members:organization_members(count)")
    .eq("owner_id", userId)
    .single();

  if (error || !data) {
    return null;
  }

  return data as OrganizationWithMembers;
}

/**
 * Get plan limits for a user's subscription
 */
export async function getUserPlanLimits(userId: string): Promise<{
  maxTeamMembers: number;
}> {
  const supabase = await createClient();

  const { data: subscription } = await supabase
    .from("subscriptions")
    .select("plan:plans(max_team_members)")
    .eq("user_id", userId)
    .single();

  // Extract max_team_members from the nested plan object
  const planData = subscription?.plan as unknown as {
    max_team_members: number;
  } | null;

  return {
    maxTeamMembers: planData?.max_team_members || 10,
  };
}

/**
 * Get count of pending invitations for an organization
 */
export async function getPendingInvitationsCount(
  organizationId: string
): Promise<number> {
  const supabase = await createClient();

  const { count } = await supabase
    .from("team_invitations")
    .select("*", { count: "exact", head: true })
    .eq("organization_id", organizationId)
    .eq("status", "pending");

  return count || 0;
}

/**
 * Get user profile
 */
export async function getUserProfile(userId: string): Promise<{
  fullName: string | null;
} | null> {
  const supabase = await createClient();

  const { data } = await supabase
    .from("profiles")
    .select("full_name")
    .eq("id", userId)
    .single();

  if (!data) {
    return null;
  }

  return { fullName: data.full_name };
}
