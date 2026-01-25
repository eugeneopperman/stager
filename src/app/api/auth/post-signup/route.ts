import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { queueCampaignEnrollment } from "@/lib/jobs/queue";

/**
 * POST /api/auth/post-signup
 *
 * Called after a user successfully signs up to trigger:
 * - Onboarding campaign enrollment
 * - Welcome email (part of onboarding campaign)
 * - Any other post-signup tasks
 */
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Check if this is a new user (profile created recently)
    const { data: profile } = await supabase
      .from("profiles")
      .select("created_at")
      .eq("id", user.id)
      .single();

    if (!profile) {
      return NextResponse.json(
        { error: "Profile not found" },
        { status: 404 }
      );
    }

    // Only enroll if profile was created in the last 5 minutes
    const profileAge = Date.now() - new Date(profile.created_at).getTime();
    const fiveMinutes = 5 * 60 * 1000;

    if (profileAge > fiveMinutes) {
      return NextResponse.json({
        message: "Post-signup tasks skipped (not a new signup)",
        enrolled: false,
      });
    }

    // Queue enrollment in onboarding campaign
    const result = await queueCampaignEnrollment(user.id, "onboarding");

    if (result) {
      console.log(
        `[PostSignup] Queued onboarding campaign for user ${user.id}`
      );
    } else {
      // Queue not configured, enroll directly
      const { enrollInCampaign } = await import("@/lib/email/campaigns");
      await enrollInCampaign(supabase, user.id, "onboarding");
      console.log(
        `[PostSignup] Directly enrolled user ${user.id} in onboarding campaign`
      );
    }

    return NextResponse.json({
      message: "Post-signup tasks completed",
      enrolled: true,
    });
  } catch (error) {
    console.error("Error in post-signup:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
