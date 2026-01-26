import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { DashboardShell } from "./DashboardShell";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  // Fetch user profile with credits, plan info, and onboarding status
  const { data: profile } = await supabase
    .from("profiles")
    .select("*, plan:plans(slug)")
    .eq("id", user.id)
    .single();

  // Check if user has enterprise plan
  const planSlug = (profile?.plan as { slug?: string } | null)?.slug;
  const isEnterprise = planSlug === "enterprise";

  // Show onboarding modal for users who haven't completed it
  const showOnboarding = profile?.onboarding_completed_at === null;

  return (
    <DashboardShell
      user={{
        id: user.id,
        email: user.email,
        full_name: profile?.full_name || undefined,
        plan: planSlug || undefined,
      }}
      credits={profile?.credits_remaining || 0}
      isEnterprise={isEnterprise}
      showOnboarding={showOnboarding}
    >
      {children}
    </DashboardShell>
  );
}
