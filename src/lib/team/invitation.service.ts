/**
 * Team Invitation Service
 * Handles invitation CRUD and email operations
 */

import { createClient } from "@/lib/supabase/server";
import {
  sendTeamInvitationEmail,
  generateInvitationToken,
  getInvitationExpiryDate,
} from "@/lib/notifications/email";

/**
 * Team invitation data
 */
export interface TeamInvitation {
  id: string;
  organization_id: string;
  email: string;
  invitation_token: string;
  initial_credits: number;
  invited_by: string;
  status: string;
  expires_at: string;
}

/**
 * Parameters for creating an invitation
 */
export interface CreateInvitationParams {
  organizationId: string;
  email: string;
  initialCredits: number;
  invitedBy: string;
}

/**
 * Check if an invitation already exists for this email in the organization
 */
export async function checkExistingInvitation(
  organizationId: string,
  email: string
): Promise<boolean> {
  const supabase = await createClient();

  const { data: existingInvitation } = await supabase
    .from("team_invitations")
    .select("id, status")
    .eq("organization_id", organizationId)
    .eq("email", email)
    .eq("status", "pending")
    .single();

  return !!existingInvitation;
}

/**
 * Create a new team invitation
 */
export async function createInvitation(
  params: CreateInvitationParams
): Promise<TeamInvitation | null> {
  const supabase = await createClient();

  const invitationToken = generateInvitationToken();
  const expiresAt = getInvitationExpiryDate();

  const { data: invitation, error } = await supabase
    .from("team_invitations")
    .insert({
      organization_id: params.organizationId,
      email: params.email,
      invitation_token: invitationToken,
      initial_credits: params.initialCredits,
      invited_by: params.invitedBy,
      status: "pending",
      expires_at: expiresAt.toISOString(),
    })
    .select()
    .single();

  if (error) {
    // Handle unique constraint violation
    if (error.code === "23505") {
      return null;
    }
    console.error("[Invitation Service] Error creating invitation:", error);
    return null;
  }

  return invitation as TeamInvitation;
}

/**
 * Send invitation email
 */
export async function sendInvitationEmail(
  invitation: TeamInvitation,
  organizationName: string,
  inviterName: string
): Promise<boolean> {
  try {
    await sendTeamInvitationEmail({
      to: invitation.email,
      organizationName,
      inviterName,
      initialCredits: invitation.initial_credits,
      invitationToken: invitation.invitation_token,
      expiresAt: new Date(invitation.expires_at),
    });
    return true;
  } catch (error) {
    console.error("[Invitation Service] Error sending email:", error);
    return false;
  }
}

/**
 * Delete an invitation (cleanup on failure)
 */
export async function deleteInvitation(invitationId: string): Promise<boolean> {
  const supabase = await createClient();

  const { error } = await supabase
    .from("team_invitations")
    .delete()
    .eq("id", invitationId);

  if (error) {
    console.error("[Invitation Service] Error deleting invitation:", error);
    return false;
  }

  return true;
}

/**
 * Resend an invitation
 */
export async function resendInvitation(
  invitationId: string,
  organizationName: string,
  inviterName: string
): Promise<boolean> {
  const supabase = await createClient();

  // Generate new token and expiry
  const invitationToken = generateInvitationToken();
  const expiresAt = getInvitationExpiryDate();

  // Update the invitation
  const { data: invitation, error } = await supabase
    .from("team_invitations")
    .update({
      invitation_token: invitationToken,
      expires_at: expiresAt.toISOString(),
    })
    .eq("id", invitationId)
    .select()
    .single();

  if (error || !invitation) {
    console.error("[Invitation Service] Error updating invitation:", error);
    return false;
  }

  // Send the email
  return sendInvitationEmail(
    invitation as TeamInvitation,
    organizationName,
    inviterName
  );
}
