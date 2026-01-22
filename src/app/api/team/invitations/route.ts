import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

// GET - List pending invitations for the organization
export async function GET(request: NextRequest) {
  try {
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
        { error: "You must be an organization owner to view invitations" },
        { status: 403 }
      );
    }

    // Get all invitations (primarily pending, but include all for history)
    const { data: invitations, error: invitationsError } = await supabase
      .from("team_invitations")
      .select(
        `
        id,
        email,
        initial_credits,
        status,
        created_at,
        expires_at,
        accepted_at,
        invited_by,
        inviter:profiles!invited_by(full_name)
      `
      )
      .eq("organization_id", org.id)
      .order("created_at", { ascending: false });

    if (invitationsError) {
      console.error("Error fetching invitations:", invitationsError);
      return NextResponse.json(
        { error: "Failed to fetch invitations" },
        { status: 500 }
      );
    }

    // Mark expired invitations
    const now = new Date();
    const processedInvitations = invitations.map((inv) => {
      if (inv.status === "pending" && new Date(inv.expires_at) < now) {
        return { ...inv, status: "expired" };
      }
      return inv;
    });

    return NextResponse.json({
      invitations: processedInvitations,
    });
  } catch (error) {
    console.error("Error fetching invitations:", error);
    return NextResponse.json(
      { error: "Failed to fetch invitations" },
      { status: 500 }
    );
  }
}
