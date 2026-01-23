import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { Card, CardContent } from "@/components/ui/card";
import { Users } from "lucide-react";
import { getUserOrganization, isEnterprisePlan } from "@/lib/billing/subscription";
import { TeamPageClient } from "./_components/TeamPageClient";

export default async function TeamPage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  // Check if user has enterprise plan
  const hasEnterprise = await isEnterprisePlan(user.id);

  if (!hasEnterprise) {
    return (
      <div className="max-w-4xl mx-auto">
        <div className="mb-6">
          <h1 className="text-foreground">Team Management</h1>
          <p className="text-muted-foreground mt-2">
            Manage your team members and credit allocations
          </p>
        </div>

        <Card className="border-amber-200 bg-amber-50 dark:bg-amber-950/30 dark:border-amber-900">
          <CardContent className="p-8 text-center">
            <div className="mx-auto w-16 h-16 rounded-full bg-amber-100 dark:bg-amber-900 flex items-center justify-center mb-4">
              <Users className="h-8 w-8 text-amber-600" />
            </div>
            <h2 className="text-xl font-semibold mb-2">Enterprise Plan Required</h2>
            <p className="text-muted-foreground mb-6 max-w-md mx-auto">
              Team management is available exclusively for Enterprise plan subscribers.
              Upgrade to add up to 10 team members and share credits.
            </p>
            <a
              href="/billing"
              className="inline-flex items-center justify-center rounded-md text-sm font-medium bg-purple-600 text-white hover:bg-purple-700 h-10 px-4 py-2"
            >
              Upgrade to Enterprise
            </a>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Get organization data
  const orgData = await getUserOrganization(user.id);

  return (
    <div className="max-w-4xl mx-auto">
      <div className="mb-6">
        <h1 className="text-foreground">Team Management</h1>
        <p className="text-muted-foreground mt-2">
          Manage your team members and credit allocations
        </p>
      </div>

      <TeamPageClient
        userId={user.id}
        initialOrganization={orgData?.organization || null}
        initialRole={orgData?.role || null}
      />
    </div>
  );
}
