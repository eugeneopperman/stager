import { createClient } from "@/lib/supabase/server";
import { LOW_CREDITS_THRESHOLD, CREDITS_PER_STAGING } from "@/lib/constants";
import {
  WelcomeHeader,
  CreditAlerts,
  QuickActionsBanner,
  StatsOverview,
  RecentStagings,
} from "./_components";

function getGreeting(name: string): string {
  const hour = new Date().getHours();
  const greetings = [
    `Good morning, ${name}`,
    `Good afternoon, ${name}`,
    `Good evening, ${name}`,
  ];
  const casualGreetings = [
    `Welcome back, ${name}`,
    `Ready to stage, ${name}?`,
    `Hey ${name}, let's create something beautiful`,
    `Great to see you, ${name}`,
  ];

  const timeGreeting =
    hour < 12 ? greetings[0] : hour < 17 ? greetings[1] : greetings[2];
  const allGreetings = [timeGreeting, ...casualGreetings];
  const dayIndex = new Date().getDate() % allGreetings.length;
  return allGreetings[dayIndex];
}

export default async function DashboardPage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  // Fetch user profile for name
  const { data: userProfile } = await supabase
    .from("profiles")
    .select("full_name")
    .eq("id", user?.id)
    .single();

  const firstName = userProfile?.full_name?.split(" ")[0] || "there";
  const greeting = getGreeting(firstName);

  // Fetch recent staging jobs
  const { data: recentJobs } = await supabase
    .from("staging_jobs")
    .select("id, room_type, style, status, staged_image_url, created_at")
    .eq("user_id", user?.id)
    .order("created_at", { ascending: false })
    .limit(5);

  // Fetch stats
  const { count: totalJobs } = await supabase
    .from("staging_jobs")
    .select("*", { count: "exact", head: true })
    .eq("user_id", user?.id);

  const { count: totalProperties } = await supabase
    .from("properties")
    .select("*", { count: "exact", head: true })
    .eq("user_id", user?.id);

  const { count: completedJobs } = await supabase
    .from("staging_jobs")
    .select("*", { count: "exact", head: true })
    .eq("user_id", user?.id)
    .eq("status", "completed");

  // Fetch user credits
  const { data: profile } = await supabase
    .from("profiles")
    .select("credits_remaining")
    .eq("id", user?.id)
    .single();

  const credits = profile?.credits_remaining || 0;
  const isLowCredits = credits <= LOW_CREDITS_THRESHOLD;
  const hasNoCredits = credits < CREDITS_PER_STAGING;

  return (
    <div className="space-y-8">
      <WelcomeHeader greeting={greeting} />

      <CreditAlerts
        credits={credits}
        isLowCredits={isLowCredits}
        hasNoCredits={hasNoCredits}
      />

      <QuickActionsBanner />

      <StatsOverview
        totalJobs={totalJobs || 0}
        totalProperties={totalProperties || 0}
        completedJobs={completedJobs || 0}
      />

      <RecentStagings jobs={recentJobs} />
    </div>
  );
}
