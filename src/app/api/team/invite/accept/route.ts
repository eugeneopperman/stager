import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createClient as createServiceClient } from "@supabase/supabase-js";
import { logTeamEvent, AuditEventType } from "@/lib/audit/audit-log.service";

// POST - Accept an invitation
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    const body = await request.json();
    const { token } = body as { token: string };

    if (!token) {
      return NextResponse.json(
        { error: "Invitation token is required" },
        { status: 400 }
      );
    }

    // Use service role client for operations that need elevated permissions
    const serviceClient = createServiceClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    // Find the invitation by token
    const { data: invitation, error: inviteError } = await serviceClient
      .from("team_invitations")
      .select(
        `
        *,
        organization:organizations(id, name, unallocated_credits)
      `
      )
      .eq("invitation_token", token)
      .single();

    if (inviteError || !invitation) {
      return NextResponse.json(
        { error: "Invalid invitation link" },
        { status: 404 }
      );
    }

    // Check if invitation is expired
    if (new Date(invitation.expires_at) < new Date()) {
      // Update status to expired
      await serviceClient
        .from("team_invitations")
        .update({ status: "expired" })
        .eq("id", invitation.id);

      return NextResponse.json(
        { error: "This invitation has expired. Please ask for a new one." },
        { status: 400 }
      );
    }

    // Check invitation status
    if (invitation.status === "revoked") {
      return NextResponse.json(
        { error: "This invitation has been revoked." },
        { status: 400 }
      );
    }

    if (invitation.status === "accepted") {
      return NextResponse.json(
        { error: "This invitation has already been accepted." },
        { status: 400 }
      );
    }

    if (invitation.status !== "pending") {
      return NextResponse.json(
        { error: "This invitation is no longer valid." },
        { status: 400 }
      );
    }

    // Handle organization from join - may be array or single object
    const orgData = invitation.organization;
    const orgRecord = Array.isArray(orgData) ? orgData[0] : orgData;

    // If user is not logged in, return info for redirect to signup/login
    if (!user) {
      return NextResponse.json({
        requiresAuth: true,
        invitation: {
          id: invitation.id,
          email: invitation.email,
          organizationName: (orgRecord as { name?: string })?.name || "Team",
          initialCredits: invitation.initial_credits,
        },
      });
    }

    // Verify the logged-in user's email matches the invitation
    if (user.email?.toLowerCase() !== invitation.email.toLowerCase()) {
      return NextResponse.json(
        {
          error: `This invitation was sent to ${invitation.email}. Please log in with that email address.`,
        },
        { status: 403 }
      );
    }

    const org = orgRecord as {
      id: string;
      name: string;
      unallocated_credits: number;
    } | null;

    if (!org) {
      return NextResponse.json(
        { error: "Organization not found" },
        { status: 404 }
      );
    }

    // Check if user is already a member
    const { data: existingMember } = await serviceClient
      .from("organization_members")
      .select("id")
      .eq("organization_id", org.id)
      .eq("user_id", user.id)
      .single();

    if (existingMember) {
      // Mark invitation as accepted since user is already a member
      await serviceClient
        .from("team_invitations")
        .update({
          status: "accepted",
          accepted_at: new Date().toISOString(),
        })
        .eq("id", invitation.id);

      return NextResponse.json({
        message: "You are already a member of this organization",
        alreadyMember: true,
        organizationId: org.id,
      });
    }

    // Add user to organization
    const { error: memberError } = await serviceClient
      .from("organization_members")
      .insert({
        organization_id: org.id,
        user_id: user.id,
        role: "member",
        allocated_credits: invitation.initial_credits,
        joined_at: new Date().toISOString(),
      });

    if (memberError) {
      console.error("Error adding member:", memberError);
      return NextResponse.json(
        { error: "Failed to join organization" },
        { status: 500 }
      );
    }

    // Update organization credits
    const newUnallocated = org.unallocated_credits - invitation.initial_credits;
    await serviceClient
      .from("organizations")
      .update({
        unallocated_credits: Math.max(0, newUnallocated),
      })
      .eq("id", org.id);

    // Update user's profile with organization_id
    await serviceClient
      .from("profiles")
      .update({ organization_id: org.id })
      .eq("id", user.id);

    // Mark invitation as accepted
    await serviceClient
      .from("team_invitations")
      .update({
        status: "accepted",
        accepted_at: new Date().toISOString(),
      })
      .eq("id", invitation.id);

    // Audit log: invitation accepted
    await logTeamEvent(serviceClient, {
      userId: user.id,
      organizationId: org.id,
      eventType: AuditEventType.TEAM_INVITATION_ACCEPTED,
      resourceId: invitation.id,
      action: "updated",
      details: {
        inviteeEmail: invitation.email,
        allocatedCredits: invitation.initial_credits,
      },
      request,
    });

    return NextResponse.json({
      message: "Successfully joined the organization!",
      organizationId: org.id,
      organizationName: org.name,
      allocatedCredits: invitation.initial_credits,
    });
  } catch (error) {
    console.error("Error accepting invitation:", error);
    return NextResponse.json(
      { error: "Failed to accept invitation" },
      { status: 500 }
    );
  }
}

// GET - Validate an invitation token (for the accept page)
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const token = searchParams.get("token");

    if (!token) {
      return NextResponse.json(
        { error: "Invitation token is required" },
        { status: 400 }
      );
    }

    // Use service role client
    const serviceClient = createServiceClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    // Find the invitation by token
    const { data: invitation, error: inviteError } = await serviceClient
      .from("team_invitations")
      .select(
        `
        id,
        email,
        initial_credits,
        status,
        expires_at,
        organization:organizations(id, name)
      `
      )
      .eq("invitation_token", token)
      .single();

    if (inviteError || !invitation) {
      return NextResponse.json(
        { error: "Invalid invitation link", valid: false },
        { status: 404 }
      );
    }

    // Check if expired
    const isExpired = new Date(invitation.expires_at) < new Date();

    // Check status
    if (invitation.status === "revoked") {
      return NextResponse.json({
        valid: false,
        error: "This invitation has been revoked.",
      });
    }

    if (invitation.status === "accepted") {
      return NextResponse.json({
        valid: false,
        error: "This invitation has already been accepted.",
      });
    }

    if (isExpired || invitation.status === "expired") {
      // Update status if not already
      if (invitation.status !== "expired") {
        await serviceClient
          .from("team_invitations")
          .update({ status: "expired" })
          .eq("id", invitation.id);
      }

      return NextResponse.json({
        valid: false,
        error: "This invitation has expired. Please ask for a new one.",
      });
    }

    // Handle organization from join - may be array or single object
    const orgDataGet = invitation.organization;
    const orgGet = (Array.isArray(orgDataGet) ? orgDataGet[0] : orgDataGet) as { id: string; name: string } | null;

    return NextResponse.json({
      valid: true,
      invitation: {
        id: invitation.id,
        email: invitation.email,
        initialCredits: invitation.initial_credits,
        organizationName: orgGet?.name || "Team",
        expiresAt: invitation.expires_at,
      },
    });
  } catch (error) {
    console.error("Error validating invitation:", error);
    return NextResponse.json(
      { error: "Failed to validate invitation", valid: false },
      { status: 500 }
    );
  }
}
