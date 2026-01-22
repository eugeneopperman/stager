import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import {
  sendTeamInvitationEmail,
  generateInvitationToken,
  getInvitationExpiryDate,
} from "@/lib/email";

// POST - Resend an invitation email
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Check if user owns an organization
    const { data: org, error: orgError } = await supabase
      .from("organizations")
      .select("id, name")
      .eq("owner_id", user.id)
      .single();

    if (orgError || !org) {
      return NextResponse.json(
        { error: "You must be an organization owner to resend invitations" },
        { status: 403 }
      );
    }

    // Get the invitation
    const { data: invitation, error: inviteError } = await supabase
      .from("team_invitations")
      .select("*")
      .eq("id", id)
      .eq("organization_id", org.id)
      .single();

    if (inviteError || !invitation) {
      return NextResponse.json(
        { error: "Invitation not found" },
        { status: 404 }
      );
    }

    if (invitation.status !== "pending" && invitation.status !== "expired") {
      return NextResponse.json(
        { error: "Only pending or expired invitations can be resent" },
        { status: 400 }
      );
    }

    // Get owner profile for inviter name
    const { data: ownerProfile } = await supabase
      .from("profiles")
      .select("full_name")
      .eq("id", user.id)
      .single();

    const inviterName = ownerProfile?.full_name || "A team admin";

    // Generate new token and expiry
    const newToken = generateInvitationToken();
    const newExpiresAt = getInvitationExpiryDate();

    // Update the invitation with new token and expiry
    const { error: updateError } = await supabase
      .from("team_invitations")
      .update({
        invitation_token: newToken,
        expires_at: newExpiresAt.toISOString(),
        status: "pending",
      })
      .eq("id", id);

    if (updateError) {
      console.error("Error updating invitation:", updateError);
      return NextResponse.json(
        { error: "Failed to update invitation" },
        { status: 500 }
      );
    }

    // Send the new invitation email
    try {
      await sendTeamInvitationEmail({
        to: invitation.email,
        organizationName: org.name,
        inviterName,
        initialCredits: invitation.initial_credits,
        invitationToken: newToken,
        expiresAt: newExpiresAt,
      });
    } catch (emailError) {
      console.error("Error sending invitation email:", emailError);
      return NextResponse.json(
        { error: "Failed to send invitation email. Please try again." },
        { status: 500 }
      );
    }

    return NextResponse.json({
      message: "Invitation resent successfully",
      invitation: {
        id: invitation.id,
        email: invitation.email,
        expires_at: newExpiresAt.toISOString(),
      },
    });
  } catch (error) {
    console.error("Error resending invitation:", error);
    return NextResponse.json(
      { error: "Failed to resend invitation" },
      { status: 500 }
    );
  }
}
