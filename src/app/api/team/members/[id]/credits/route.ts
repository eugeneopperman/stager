import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { validateRequest, memberCreditsSchema } from "@/lib/schemas";
import { logTeamEvent, AuditEventType } from "@/lib/audit/audit-log.service";

interface RouteParams {
  params: Promise<{ id: string }>;
}

// PATCH - Update member's allocated credits
export async function PATCH(request: NextRequest, { params }: RouteParams) {
  try {
    const { id: memberId } = await params;
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Validate request body
    const body = await request.json();
    const validation = validateRequest(memberCreditsSchema, body);
    if (!validation.success) {
      return validation.response;
    }

    const { credits } = validation.data;

    // Check if user owns an organization
    const { data: org, error: orgError } = await supabase
      .from("organizations")
      .select("*")
      .eq("owner_id", user.id)
      .single();

    if (orgError || !org) {
      return NextResponse.json(
        { error: "You must be an organization owner to allocate credits" },
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

    // Calculate the change in allocation
    const currentAllocation = member.allocated_credits;
    const creditsDifference = credits - currentAllocation;

    // If increasing allocation, check if we have enough unallocated
    if (creditsDifference > 0 && creditsDifference > org.unallocated_credits) {
      return NextResponse.json(
        { error: `Not enough unallocated credits. Available: ${org.unallocated_credits}` },
        { status: 400 }
      );
    }

    // Cannot reduce allocation below already used credits
    if (credits < member.credits_used_this_period) {
      return NextResponse.json(
        { error: `Cannot allocate less than already used (${member.credits_used_this_period} credits used)` },
        { status: 400 }
      );
    }

    // Update member allocation
    const { data: updatedMember, error: updateError } = await supabase
      .from("organization_members")
      .update({ allocated_credits: credits })
      .eq("id", memberId)
      .select()
      .single();

    if (updateError) {
      console.error("Error updating member credits:", updateError);
      return NextResponse.json(
        { error: "Failed to update credits" },
        { status: 500 }
      );
    }

    // Update organization unallocated credits
    await supabase
      .from("organizations")
      .update({
        unallocated_credits: org.unallocated_credits - creditsDifference,
      })
      .eq("id", org.id);

    // Log transaction
    await supabase.from("credit_transactions").insert({
      user_id: member.user_id,
      organization_id: org.id,
      transaction_type: creditsDifference > 0 ? "allocation_from_owner" : "allocation_to_member",
      amount: Math.abs(creditsDifference),
      balance_after: credits - member.credits_used_this_period,
      description: creditsDifference > 0
        ? `Allocated ${creditsDifference} credits`
        : `Returned ${Math.abs(creditsDifference)} credits to pool`,
    });

    // Audit log: credits allocated
    await logTeamEvent(supabase, {
      userId: user.id,
      organizationId: org.id,
      eventType: AuditEventType.TEAM_CREDITS_ALLOCATED,
      resourceId: memberId,
      action: "updated",
      details: {
        targetUserId: member.user_id,
        previousAllocation: currentAllocation,
        newAllocation: credits,
        creditsDifference,
      },
      request,
    });

    return NextResponse.json({
      message: "Credits updated successfully",
      member: updatedMember,
    });
  } catch (error) {
    console.error("Error updating member credits:", error);
    return NextResponse.json(
      { error: "Failed to update credits" },
      { status: 500 }
    );
  }
}
