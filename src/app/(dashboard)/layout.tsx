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

  // Fetch user profile with credits and plan info
  const { data: profile } = await supabase
    .from("profiles")
    .select("*, plan:plans(slug)")
    .eq("id", user.id)
    .single();

  // Check if user has enterprise plan
  const planSlug = (profile?.plan as { slug?: string } | null)?.slug;
  const isEnterprise = planSlug === "enterprise";

  return (
    <DashboardShell
      user={{
        email: user.email,
        full_name: profile?.full_name || undefined,
      }}
      credits={profile?.credits_remaining || 0}
      isEnterprise={isEnterprise}
    >
      {children}
    </DashboardShell>
  );
}
