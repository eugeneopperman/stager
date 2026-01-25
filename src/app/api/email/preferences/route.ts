import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import {
  getEmailPreferences,
  updateEmailPreferences,
} from "@/lib/email/preferences";

// GET /api/email/preferences - Get user's email preferences
export async function GET() {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const preferences = await getEmailPreferences(supabase, user.id);

    if (!preferences) {
      return NextResponse.json(
        { error: "Failed to fetch preferences" },
        { status: 500 }
      );
    }

    return NextResponse.json({ preferences });
  } catch (error) {
    console.error("Error fetching email preferences:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// PATCH /api/email/preferences - Update user's email preferences
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
    const {
      marketing_emails,
      product_updates,
      weekly_digest,
      staging_notifications,
      team_notifications,
    } = body;

    // Validate input - all fields are optional booleans
    const updates: Record<string, boolean> = {};
    if (typeof marketing_emails === "boolean") {
      updates.marketing_emails = marketing_emails;
    }
    if (typeof product_updates === "boolean") {
      updates.product_updates = product_updates;
    }
    if (typeof weekly_digest === "boolean") {
      updates.weekly_digest = weekly_digest;
    }
    if (typeof staging_notifications === "boolean") {
      updates.staging_notifications = staging_notifications;
    }
    if (typeof team_notifications === "boolean") {
      updates.team_notifications = team_notifications;
    }

    if (Object.keys(updates).length === 0) {
      return NextResponse.json(
        { error: "No valid preferences provided" },
        { status: 400 }
      );
    }

    const result = await updateEmailPreferences(supabase, user.id, updates);

    if (!result.success) {
      return NextResponse.json(
        { error: result.error || "Failed to update preferences" },
        { status: 500 }
      );
    }

    // Return updated preferences
    const preferences = await getEmailPreferences(supabase, user.id);

    return NextResponse.json({
      message: "Preferences updated successfully",
      preferences,
    });
  } catch (error) {
    console.error("Error updating email preferences:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
