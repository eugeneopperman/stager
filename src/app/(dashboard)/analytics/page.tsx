import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { fetchAnalyticsData } from "@/lib/analytics/queries";
import { AnalyticsPageClient } from "./_components/AnalyticsPageClient";
import type { PeriodOption } from "@/lib/analytics/types";

interface AnalyticsPageProps {
  searchParams: Promise<{ period?: string }>;
}

export default async function AnalyticsPage({ searchParams }: AnalyticsPageProps) {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  // Parse period from URL, default to 7 days
  const params = await searchParams;
  const periodParam = params.period;
  const periodDays: PeriodOption =
    periodParam === "30" ? 30 : 7;

  // Fetch analytics data
  const analyticsData = await fetchAnalyticsData(user.id, periodDays);

  return <AnalyticsPageClient initialData={analyticsData} />;
}
