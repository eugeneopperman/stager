import { createClient } from "@/lib/supabase/server";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { CreditCard, Coins } from "lucide-react";
import { LOW_CREDITS_THRESHOLD, CREDITS_PER_STAGING } from "@/lib/constants";
import { PricingTable } from "@/components/billing/PricingTable";
import { TopupPacks } from "@/components/billing/TopupPacks";
import { SubscriptionStatus } from "@/components/billing/SubscriptionStatus";
import { getUserSubscription, getPlans } from "@/lib/billing/subscription";
import {
  BillingAlerts,
  CreditBalanceCard,
  UsageStatsGrid,
  UsageHistoryList,
} from "./_components";

interface PageProps {
  searchParams: Promise<{
    success?: string;
    canceled?: string;
    plan?: string;
    topup?: string;
    credits?: string;
  }>;
}

export default async function BillingPage({ searchParams }: PageProps) {
  const params = await searchParams;
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  // Fetch user profile with credits
  const { data: profile } = await supabase
    .from("profiles")
    .select("credits_remaining, created_at, stripe_customer_id, plan_id")
    .eq("id", user?.id)
    .single();

  const credits = profile?.credits_remaining || 0;
  const isLowCredits = credits <= LOW_CREDITS_THRESHOLD;
  const hasNoCredits = credits < CREDITS_PER_STAGING;

  // Fetch subscription and plans
  const [subscription, plans] = await Promise.all([
    user ? getUserSubscription(user.id) : null,
    getPlans(),
  ]);

  const currentPlanSlug = subscription?.plan?.slug || "free";

  // Fetch completed staging jobs for usage stats
  const { data: completedJobs } = await supabase
    .from("staging_jobs")
    .select("id, created_at, credits_used, room_type, style, staged_image_url")
    .eq("user_id", user?.id)
    .eq("status", "completed")
    .order("created_at", { ascending: false });

  // Calculate usage stats
  const jobs = completedJobs || [];
  const totalCreditsUsed = jobs.reduce(
    (sum, job) => sum + (job.credits_used || CREDITS_PER_STAGING),
    0
  );

  // Get this month's usage
  const now = new Date();
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  const thisMonthJobs = jobs.filter(
    (job) => new Date(job.created_at) >= startOfMonth
  );
  const creditsUsedThisMonth = thisMonthJobs.reduce(
    (sum, job) => sum + (job.credits_used || CREDITS_PER_STAGING),
    0
  );

  // Recent usage (last 10 transactions)
  const recentUsage = jobs.slice(0, 10);

  return (
    <div className="space-y-8 max-w-6xl mx-auto">
      {/* Success/Cancel Messages */}
      <BillingAlerts
        success={params.success}
        plan={params.plan}
        topupSuccess={params.topup === "success"}
        topupCredits={params.credits}
        canceled={params.canceled}
      />

      {/* Header */}
      <div>
        <h1 className="text-foreground">Billing & Credits</h1>
        <p className="text-muted-foreground mt-2">
          Manage your subscription, credits, and view usage history
        </p>
      </div>

      {/* Current Subscription */}
      <SubscriptionStatus
        subscription={subscription}
        hasStripeCustomer={!!profile?.stripe_customer_id}
      />

      {/* Credit Balance Card */}
      <CreditBalanceCard
        credits={credits}
        isLowCredits={isLowCredits}
        hasNoCredits={hasNoCredits}
        currentPlanSlug={currentPlanSlug}
      />

      {/* Usage Stats */}
      <UsageStatsGrid
        creditsUsedThisMonth={creditsUsedThisMonth}
        totalCreditsUsed={totalCreditsUsed}
        totalStagings={jobs.length}
      />

      {/* Credit Top-ups */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Coins className="h-5 w-5" />
            Need More Credits?
          </CardTitle>
          <CardDescription>
            Purchase additional credits instantly - no subscription change needed
          </CardDescription>
        </CardHeader>
        <CardContent>
          <TopupPacks />
        </CardContent>
      </Card>

      {/* Subscription Plans */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CreditCard className="h-5 w-5" />
            Subscription Plans
          </CardTitle>
          <CardDescription>
            Choose a plan that fits your needs. Upgrade or downgrade anytime.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <PricingTable plans={plans} currentPlanSlug={currentPlanSlug} />
        </CardContent>
      </Card>

      {/* Usage History */}
      <UsageHistoryList jobs={recentUsage} />
    </div>
  );
}
