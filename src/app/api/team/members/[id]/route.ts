import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

interface RouteParams {
  params: Promise<{ id: string }>;
}

// DELETE - Remove member from organization
export async function DELETE(request: NextRequest, { params }: RouteParams) {
  try {
    const { id: memberId } = await params;
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
      .select("*")
      .eq("owner_id", user.id)
      .single();

    if (orgError || !org) {
      return NextResponse.json(
        { error: "You must be an organization owner to remove members" },
        { status: 403 }
      );
    }

    // Get the member
    const { data: member, error: memberError } = await supabase
      .from("organization_members")
      .select("*")
      .eq("id", memberId)
      .eq("organization_id", org.id)
      .single();

    if (memberError || !member) {
      return NextResponse.json(
        { error: "Member not found" },
        { status: 404 }
      );
    }

    // Cannot remove owner
    if (member.role === "owner") {
      return NextResponse.json(
        { error: "Cannot remove organization owner" },
        { status: 400 }
      );
    }

    // Return unused allocated credits to unallocated pool
    const unusedCredits = member.allocated_credits - member.credits_used_this_period;

    // Remove member
    const { error: deleteError } = await supabase
      .from("organization_members")
      .delete()
      .eq("id", memberId);

    if (deleteError) {
      console.error("Error removing member:", deleteError);
      return NextResponse.json(
        { error: "Failed to remove member" },
        { status: 500 }
      );
    }

    // Update organization credits
    if (unusedCredits > 0) {
      await supabase
        .from("organizations")
        .update({
          unallocated_credits: org.unallocated_credits + unusedCredits,
        })
        .eq("id", org.id);
    }

    // Clear member's organization reference
    await supabase
      .from("profiles")
      .update({ organization_id: null })
      .eq("id", member.user_id);

    return NextResponse.json({ message: "Member removed successfully" });
  } catch (error) {
    console.error("Error removing member:", error);
    return NextResponse.json(
      { error: "Failed to remove member" },
      { status: 500 }
    );
  }
}
