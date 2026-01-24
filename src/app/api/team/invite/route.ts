import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import {
  sendTeamInvitationEmail,
  generateInvitationToken,
  getInvitationExpiryDate,
} from "@/lib/notifications/email";
import { validateRequest, teamInviteRequestSchema } from "@/lib/schemas";
import { rateLimiters, getRateLimitHeaders, getClientIdentifier } from "@/lib/rate-limit";
import { ActionableErrors, respondWithError } from "@/lib/errors";
import { logTeamEvent, AuditEventType, getRequestContext } from "@/lib/audit/audit-log.service";

// POST - Invite a member to organization by email
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return respondWithError(ActionableErrors.unauthorized());
    }

    // Rate limiting - prevent email abuse
    const rateLimitResult = await rateLimiters.email(getClientIdentifier(request, user.id));
    if (!rateLimitResult.allowed) {
      const resetInSeconds = Math.ceil((rateLimitResult.resetTime - Date.now()) / 1000);
      const response = respondWithError(ActionableErrors.rateLimited(resetInSeconds));
      Object.entries(getRateLimitHeaders(rateLimitResult)).forEach(([key, value]) => {
        response.headers.set(key, value);
      });
      return response;
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
      return respondWithError(ActionableErrors.teamMemberOnly());
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
      return respondWithError(ActionableErrors.teamFull(maxMembers));
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
      return respondWithError(ActionableErrors.invitationExists(normalizedEmail));
    }

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

      return respondWithError(ActionableErrors.emailFailed());
    }

    // Audit log: team invitation created
    await logTeamEvent(supabase, {
      userId: user.id,
      organizationId: org.id,
      eventType: AuditEventType.TEAM_INVITATION_CREATED,
      resourceId: invitation.id,
      action: "created",
      details: {
        inviteeEmail: normalizedEmail,
        initialCredits,
        expiresAt: expiresAt.toISOString(),
      },
      request,
    });

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
