import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

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

    const body = await request.json();
    const { email, initialCredits = 0 } = body as { email: string; initialCredits?: number };

    if (!email || !email.includes("@")) {
      return NextResponse.json(
        { error: "Valid email is required" },
        { status: 400 }
      );
    }

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
    const planData = subscription?.plan as unknown as { max_team_members: number } | null;
    const maxMembers = planData?.max_team_members || 10;
    const currentMembers = ((org.members as unknown as { count: number }[])?.[0]?.count) || 0;

    if (currentMembers >= maxMembers) {
      return NextResponse.json(
        { error: `Maximum team size reached (${maxMembers} members)` },
        { status: 400 }
      );
    }

    // Check if invited email is already a member
    const { data: existingByEmail } = await supabase
      .from("organization_members")
      .select("id, user:profiles!inner(id)")
      .eq("organization_id", org.id);

    // Find user by email
    const { data: invitedUser } = await supabase
      .from("profiles")
      .select("id")
      .eq("id", (
        await supabase.rpc("get_user_id_by_email", { email_input: email })
      ).data)
      .single();

    // Alternative: check auth.users table (requires service role)
    // For now, we'll create a pending invitation that gets accepted when user signs up

    // Check available credits
    if (initialCredits > org.unallocated_credits) {
      return NextResponse.json(
        { error: `Not enough unallocated credits. Available: ${org.unallocated_credits}` },
        { status: 400 }
      );
    }

    // If user exists, add them directly
    if (invitedUser) {
      // Check if already a member
      const { data: existingMember } = await supabase
        .from("organization_members")
        .select("id")
        .eq("organization_id", org.id)
        .eq("user_id", invitedUser.id)
        .single();

      if (existingMember) {
        return NextResponse.json(
          { error: "User is already a member of this organization" },
          { status: 400 }
        );
      }

      // Add member
      const { data: member, error: memberError } = await supabase
        .from("organization_members")
        .insert({
          organization_id: org.id,
          user_id: invitedUser.id,
          role: "member",
          allocated_credits: initialCredits,
          joined_at: new Date().toISOString(),
        })
        .select()
        .single();

      if (memberError) {
        console.error("Error adding member:", memberError);
        return NextResponse.json(
          { error: "Failed to add member" },
          { status: 500 }
        );
      }

      // Update organization credits
      await supabase
        .from("organizations")
        .update({
          unallocated_credits: org.unallocated_credits - initialCredits,
        })
        .eq("id", org.id);

      // Update member's profile
      await supabase
        .from("profiles")
        .update({ organization_id: org.id })
        .eq("id", invitedUser.id);

      return NextResponse.json({
        message: "Member added successfully",
        member,
      });
    }

    // User doesn't exist - create pending invitation
    // For now, return an error asking them to have the user sign up first
    return NextResponse.json(
      { error: "User not found. Please have them create an account first, then try again." },
      { status: 404 }
    );
  } catch (error) {
    console.error("Error inviting member:", error);
    return NextResponse.json(
      { error: "Failed to invite member" },
      { status: 500 }
    );
  }
}
