import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

interface RouteParams {
  params: Promise<{ id: string }>;
}

// PATCH - Toggle property visibility (private/team)
export async function PATCH(request: NextRequest, { params }: RouteParams) {
  try {
    const { id: propertyId } = await params;
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { visibility } = body as { visibility: "private" | "team" };

    if (!visibility || !["private", "team"].includes(visibility)) {
      return NextResponse.json(
        { error: "Valid visibility required (private or team)" },
        { status: 400 }
      );
    }

    // Get the property
    const { data: property, error: propertyError } = await supabase
      .from("properties")
      .select("*")
      .eq("id", propertyId)
      .eq("user_id", user.id)
      .single();

    if (propertyError || !property) {
      return NextResponse.json(
        { error: "Property not found or you don't own it" },
        { status: 404 }
      );
    }

    // Get user's organization
    const { data: profile } = await supabase
      .from("profiles")
      .select("organization_id")
      .eq("id", user.id)
      .single();

    if (!profile?.organization_id && visibility === "team") {
      return NextResponse.json(
        { error: "You must be part of a team to share properties" },
        { status: 400 }
      );
    }

    // Update property visibility
    const updateData: { visibility: string; organization_id?: string | null } = { visibility };

    // If making visible to team, set organization_id
    if (visibility === "team") {
      updateData.organization_id = profile!.organization_id;
    } else {
      updateData.organization_id = null;
    }

    const { data: updated, error: updateError } = await supabase
      .from("properties")
      .update(updateData)
      .eq("id", propertyId)
      .select()
      .single();

    if (updateError) {
      console.error("Error updating property visibility:", updateError);
      return NextResponse.json(
        { error: "Failed to update property" },
        { status: 500 }
      );
    }

    return NextResponse.json({
      message: `Property is now ${visibility === "team" ? "shared with your team" : "private"}`,
      property: updated,
    });
  } catch (error) {
    console.error("Error updating property visibility:", error);
    return NextResponse.json(
      { error: "Failed to update property" },
      { status: 500 }
    );
  }
}
