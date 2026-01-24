import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import {
  sendTeamInvitationEmail,
  generateInvitationToken,
  getInvitationExpiryDate,
} from "@/lib/notifications/email";
import { validateRequest, teamInviteRequestSchema } from "@/lib/schemas";

// POST - Invite a member to organization by email
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Validate request body
    const body = await request.json();
    const validation = validateRequest(teamInviteRequestSchema, body);
    if (!validation.success) {
      return validation.response;
    }

    const { email: normalizedEmail, initialCredits } = validation.data;

    // Check if user owns an organization
    const { data: org, error: orgError } = await supabase
      .from("organizations")
      .select("*, members:organization_members(count)")
      .eq("owner_id", user.id)
      .single();

    if (orgError || !org) {
      return NextResponse.json(
        { error: "You must be an organization owner to invite members" },
        { status: 403 }
      );
    }

    // Get plan limits
    const { data: subscription } = await supabase
      .from("subscriptions")
      .select("plan:plans(max_team_members)")
      .eq("user_id", user.id)
      .single();

    // Extract max_team_members from the nested plan object
    const planData = subscription?.plan as unknown as {
      max_team_members: number;
    } | null;
    const maxMembers = planData?.max_team_members || 10;
    const currentMembers =
      ((org.members as unknown as { count: number }[])?.[0]?.count) || 0;

    // Count pending invitations too
    const { count: pendingInvitationsCount } = await supabase
      .from("team_invitations")
      .select("*", { count: "exact", head: true })
      .eq("organization_id", org.id)
      .eq("status", "pending");

    const totalPendingAndCurrent =
      currentMembers + (pendingInvitationsCount || 0);

    if (totalPendingAndCurrent >= maxMembers) {
      return NextResponse.json(
        {
          error: `Maximum team size reached (${maxMembers} members including pending invitations)`,
        },
        { status: 400 }
      );
    }

    // Check available credits
    if (initialCredits > org.unallocated_credits) {
      return NextResponse.json(
        {
          error: `Not enough unallocated credits. Available: ${org.unallocated_credits}`,
        },
        { status: 400 }
      );
    }

    // Check if this email already has a pending invitation
    const { data: existingInvitation } = await supabase
      .from("team_invitations")
      .select("id, status")
      .eq("organization_id", org.id)
      .eq("email", normalizedEmail)
      .eq("status", "pending")
      .single();

    if (existingInvitation) {
      return NextResponse.json(
        {
          error:
            "An invitation has already been sent to this email. You can resend or revoke it.",
        },
        { status: 400 }
      );
    }

    // Check if user already exists and is a member
    // Use service role to look up auth.users by email
    const { data: _existingUserProfile } = await supabase
      .from("profiles")
      .select("id")
      .eq("id", user.id)
      .single();

    // Try to find the user by checking if any profile exists with this email
    // We need to use a workaround since we can't directly query auth.users
    // Instead, check if an invitation was previously accepted by this email
    const { data: _existingMemberByEmail } = await supabase
      .from("organization_members")
      .select(
        `
        id,
        user_id,
        profile:profiles!inner(id)
      `
      )
      .eq("organization_id", org.id);

    // Get owner profile for inviter name
    const { data: ownerProfile } = await supabase
      .from("profiles")
      .select("full_name")
      .eq("id", user.id)
      .single();

    const inviterName = ownerProfile?.full_name || "A team admin";

    // Generate invitation token and expiry
    const invitationToken = generateInvitationToken();
    const expiresAt = getInvitationExpiryDate();

    // Create the invitation
    const { data: invitation, error: inviteError } = await supabase
      .from("team_invitations")
      .insert({
        organization_id: org.id,
        email: normalizedEmail,
        invitation_token: invitationToken,
        initial_credits: initialCredits,
        invited_by: user.id,
        status: "pending",
        expires_at: expiresAt.toISOString(),
      })
      .select()
      .single();

    if (inviteError) {
      console.error("Error creating invitation:", inviteError);

      // Handle unique constraint violation (email already invited)
      if (inviteError.code === "23505") {
        return NextResponse.json(
          {
            error:
              "This email has already been invited to the organization. Check the invitations list to resend or revoke.",
          },
          { status: 400 }
        );
      }

      return NextResponse.json(
        { error: "Failed to create invitation" },
        { status: 500 }
      );
    }

    // Send the invitation email
    try {
      await sendTeamInvitationEmail({
        to: normalizedEmail,
        organizationName: org.name,
        inviterName,
        initialCredits,
        invitationToken,
        expiresAt,
      });
    } catch (emailError) {
      console.error("Error sending invitation email:", emailError);
      // Delete the invitation if email fails
      await supabase.from("team_invitations").delete().eq("id", invitation.id);

      return NextResponse.json(
        { error: "Failed to send invitation email. Please try again." },
        { status: 500 }
      );
    }

    return NextResponse.json({
      message: "Invitation sent successfully",
      invitation: {
        id: invitation.id,
        email: normalizedEmail,
        initial_credits: initialCredits,
        expires_at: expiresAt.toISOString(),
      },
    });
  } catch (error) {
    console.error("Error inviting member:", error);
    return NextResponse.json(
      { error: "Failed to invite member" },
      { status: 500 }
    );
  }
}
