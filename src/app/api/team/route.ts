import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { isEnterprisePlan, getUserOrganization } from "@/lib/billing/subscription";

// GET - Get current user's organization
export async function GET(_request: NextRequest) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const orgData = await getUserOrganization(user.id);

    if (!orgData) {
      return NextResponse.json({ organization: null, role: null });
    }

    return NextResponse.json(orgData);
  } catch (error) {
    console.error("Error fetching organization:", error);
    return NextResponse.json(
      { error: "Failed to fetch organization" },
      { status: 500 }
    );
  }
}

// POST - Create organization (Enterprise users only)
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Check if user has enterprise plan
    const isEnterprise = await isEnterprisePlan(user.id);
    if (!isEnterprise) {
      return NextResponse.json(
        { error: "Enterprise plan required" },
        { status: 403 }
      );
    }

    // Check if user already has an organization
    const existing = await getUserOrganization(user.id);
    if (existing) {
      return NextResponse.json(
        { error: "Organization already exists" },
        { status: 400 }
      );
    }

    const body = await request.json();
    const { name } = body as { name: string };

    if (!name || name.trim().length < 2) {
      return NextResponse.json(
        { error: "Organization name is required" },
        { status: 400 }
      );
    }

    // Get user's subscription for credits
    const { data: subscription } = await supabase
      .from("subscriptions")
      .select("id, plan:plans(credits_per_month)")
      .eq("user_id", user.id)
      .single();

    const planData = subscription?.plan as unknown as { credits_per_month: number } | null;
    const creditsPerMonth = planData?.credits_per_month || 500;

    // Create organization
    const { data: org, error: orgError } = await supabase
      .from("organizations")
      .insert({
        name: name.trim(),
        owner_id: user.id,
        subscription_id: subscription?.id,
        total_credits: creditsPerMonth,
        unallocated_credits: creditsPerMonth,
      })
      .select()
      .single();

    if (orgError) {
      console.error("Error creating organization:", orgError);
      return NextResponse.json(
        { error: "Failed to create organization" },
        { status: 500 }
      );
    }

    // Add owner as member
    await supabase.from("organization_members").insert({
      organization_id: org.id,
      user_id: user.id,
      role: "owner",
      allocated_credits: creditsPerMonth,
      joined_at: new Date().toISOString(),
    });

    // Update profile with organization
    await supabase
      .from("profiles")
      .update({ organization_id: org.id })
      .eq("id", user.id);

    return NextResponse.json({ organization: org });
  } catch (error) {
    console.error("Error creating organization:", error);
    return NextResponse.json(
      { error: "Failed to create organization" },
      { status: 500 }
    );
  }
}

// PATCH - Update organization name
export async function PATCH(request: NextRequest) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { name } = body as { name: string };

    if (!name || name.trim().length < 2) {
      return NextResponse.json(
        { error: "Organization name is required" },
        { status: 400 }
      );
    }

    // Check if user is owner
    const { data: org, error: orgError } = await supabase
      .from("organizations")
      .select("*")
      .eq("owner_id", user.id)
      .single();

    if (orgError || !org) {
      return NextResponse.json(
        { error: "Organization not found or you are not the owner" },
        { status: 403 }
      );
    }

    const { data: updated, error: updateError } = await supabase
      .from("organizations")
      .update({ name: name.trim() })
      .eq("id", org.id)
      .select()
      .single();

    if (updateError) {
      return NextResponse.json(
        { error: "Failed to update organization" },
        { status: 500 }
      );
    }

    return NextResponse.json({ organization: updated });
  } catch (error) {
    console.error("Error updating organization:", error);
    return NextResponse.json(
      { error: "Failed to update organization" },
      { status: 500 }
    );
  }
}
