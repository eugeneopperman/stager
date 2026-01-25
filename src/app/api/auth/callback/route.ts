import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";
import { queueCampaignEnrollment, isQueueConfigured } from "@/lib/jobs/queue";

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const next = searchParams.get("next") ?? "/dashboard";

  if (code) {
    const supabase = await createClient();
    const { error, data } = await supabase.auth.exchangeCodeForSession(code);

    if (!error && data.user) {
      // Check if this is a new user and trigger onboarding
      const { data: profile } = await supabase
        .from("profiles")
        .select("created_at")
        .eq("id", data.user.id)
        .single();

      if (profile) {
        const profileAge = Date.now() - new Date(profile.created_at).getTime();
        const fiveMinutes = 5 * 60 * 1000;

        // Only enroll new users in onboarding campaign
        if (profileAge < fiveMinutes) {
          try {
            if (isQueueConfigured()) {
              await queueCampaignEnrollment(data.user.id, "onboarding");
            } else {
              // Direct enrollment if queue not configured
              const { enrollInCampaign } = await import("@/lib/email/campaigns");
              await enrollInCampaign(supabase, data.user.id, "onboarding");
            }
            console.log(`[AuthCallback] Enrolled new user ${data.user.id} in onboarding campaign`);
          } catch (err) {
            // Don't block auth flow for campaign enrollment errors
            console.error("Error enrolling in onboarding campaign:", err);
          }
        }
      }

      return NextResponse.redirect(`${origin}${next}`);
    }
  }

  // Return the user to an error page with instructions
  return NextResponse.redirect(`${origin}/login?error=auth_callback_error`);
}
