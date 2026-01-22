import { createClient } from "@/lib/supabase/server";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  CreditCard,
  Coins,
  TrendingDown,
  Calendar,
  Clock,
  Sparkles,
  AlertTriangle,
  CheckCircle,
} from "lucide-react";
import { LOW_CREDITS_THRESHOLD, CREDITS_PER_STAGING } from "@/lib/constants";
import { PricingTable } from "@/components/billing/PricingTable";
import { TopupPacks } from "@/components/billing/TopupPacks";
import { SubscriptionStatus } from "@/components/billing/SubscriptionStatus";
import { getUserSubscription, getPlans } from "@/lib/subscription";

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

  // Fetch all completed staging jobs for usage stats
  const { data: allJobs } = await supabase
    .from("staging_jobs")
    .select("id, created_at, credits_used, room_type, style, status, staged_image_url")
    .eq("user_id", user?.id)
    .order("created_at", { ascending: false });

  // Calculate usage stats
  const completedJobs = allJobs?.filter((job) => job.status === "completed") || [];
  const totalCreditsUsed = completedJobs.reduce((sum, job) => sum + (job.credits_used || CREDITS_PER_STAGING), 0);

  // Get this month's usage
  const now = new Date();
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  const thisMonthJobs = completedJobs.filter(
    (job) => new Date(job.created_at) >= startOfMonth
  );
  const creditsUsedThisMonth = thisMonthJobs.reduce(
    (sum, job) => sum + (job.credits_used || CREDITS_PER_STAGING),
    0
  );

  // Recent usage (last 10 transactions)
  const recentUsage = completedJobs.slice(0, 10);

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
      hour: "numeric",
      minute: "2-digit",
    });
  };

  const formatRoomType = (roomType: string) => {
    return roomType
      .split("-")
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(" ");
  };

  return (
    <div className="space-y-8 max-w-6xl mx-auto">
      {/* Success/Cancel Messages */}
      {params.success && (
        <Card className="border-green-200 bg-green-50 dark:bg-green-950/30 dark:border-green-900">
          <CardContent className="p-4 flex items-center gap-3">
            <CheckCircle className="h-5 w-5 text-green-600" />
            <div>
              <p className="font-medium text-green-800 dark:text-green-200">
                Subscription activated!
              </p>
              <p className="text-sm text-green-600 dark:text-green-400">
                Your {params.plan} plan is now active. Enjoy your credits!
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      {params.topup === "success" && (
        <Card className="border-green-200 bg-green-50 dark:bg-green-950/30 dark:border-green-900">
          <CardContent className="p-4 flex items-center gap-3">
            <CheckCircle className="h-5 w-5 text-green-600" />
            <div>
              <p className="font-medium text-green-800 dark:text-green-200">
                Credits added!
              </p>
              <p className="text-sm text-green-600 dark:text-green-400">
                {params.credits} credits have been added to your account.
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      {params.canceled && (
        <Card className="border-amber-200 bg-amber-50 dark:bg-amber-950/30 dark:border-amber-900">
          <CardContent className="p-4 flex items-center gap-3">
            <AlertTriangle className="h-5 w-5 text-amber-600" />
            <div>
              <p className="font-medium text-amber-800 dark:text-amber-200">
                Checkout canceled
              </p>
              <p className="text-sm text-amber-600 dark:text-amber-400">
                No changes were made to your account.
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Header */}
      <div>
        <h1 className="text-foreground">
          Billing & Credits
        </h1>
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
      <Card
        className={
          hasNoCredits
            ? "border-red-200 bg-red-50 dark:bg-red-950/30 dark:border-red-900"
            : isLowCredits
            ? "border-amber-200 bg-amber-50 dark:bg-amber-950/30 dark:border-amber-900"
            : "border-green-200 bg-green-50 dark:bg-green-950/30 dark:border-green-900"
        }
      >
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div
                className={`p-4 rounded-full ${
                  hasNoCredits
                    ? "bg-red-100 dark:bg-red-900"
                    : isLowCredits
                    ? "bg-amber-100 dark:bg-amber-900"
                    : "bg-green-100 dark:bg-green-900"
                }`}
              >
                <Coins
                  className={`h-8 w-8 ${
                    hasNoCredits
                      ? "text-red-600"
                      : isLowCredits
                      ? "text-amber-600"
                      : "text-green-600"
                  }`}
                />
              </div>
              <div>
                <p className="text-sm text-slate-600 dark:text-slate-400">
                  Available Credits
                </p>
                <p className="text-4xl font-bold text-slate-900 dark:text-white">
                  {credits}
                </p>
                {hasNoCredits && (
                  <p className="text-sm text-red-600 flex items-center gap-1 mt-1">
                    <AlertTriangle className="h-3 w-3" />
                    No credits remaining
                  </p>
                )}
                {isLowCredits && !hasNoCredits && (
                  <p className="text-sm text-amber-600 flex items-center gap-1 mt-1">
                    <AlertTriangle className="h-3 w-3" />
                    Running low on credits
                  </p>
                )}
              </div>
            </div>
            <div className="text-right">
              <Badge variant="outline" className="text-lg px-3 py-1">
                {currentPlanSlug.charAt(0).toUpperCase() + currentPlanSlug.slice(1)} Plan
              </Badge>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Usage Stats */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <div className="p-2 rounded-lg bg-blue-100 dark:bg-blue-950">
              <Calendar className="h-5 w-5 text-blue-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-slate-900 dark:text-white">
                {creditsUsedThisMonth}
              </p>
              <p className="text-sm text-slate-500">Credits this month</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <div className="p-2 rounded-lg bg-purple-100 dark:bg-purple-950">
              <TrendingDown className="h-5 w-5 text-purple-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-slate-900 dark:text-white">
                {totalCreditsUsed}
              </p>
              <p className="text-sm text-slate-500">Total credits used</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <div className="p-2 rounded-lg bg-green-100 dark:bg-green-950">
              <Sparkles className="h-5 w-5 text-green-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-slate-900 dark:text-white">
                {completedJobs.length}
              </p>
              <p className="text-sm text-slate-500">Stagings completed</p>
            </div>
          </CardContent>
        </Card>
      </div>

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
      <Card>
        <CardHeader>
          <CardTitle>Usage History</CardTitle>
          <CardDescription>
            Your recent credit usage from staging jobs
          </CardDescription>
        </CardHeader>
        <CardContent>
          {recentUsage.length > 0 ? (
            <div className="space-y-3">
              {recentUsage.map((job) => (
                <div
                  key={job.id}
                  className="flex items-center justify-between p-3 rounded-lg bg-slate-50 dark:bg-slate-900"
                >
                  <div className="flex items-center gap-3">
                    <div className="h-12 w-12 rounded-lg bg-slate-200 dark:bg-slate-800 overflow-hidden flex-shrink-0">
                      {job.staged_image_url ? (
                        <img
                          src={job.staged_image_url}
                          alt={`${formatRoomType(job.room_type)} staging`}
                          className="h-full w-full object-cover"
                        />
                      ) : (
                        <div className="h-full w-full flex items-center justify-center">
                          <Sparkles className="h-5 w-5 text-slate-400" />
                        </div>
                      )}
                    </div>
                    <div>
                      <p className="font-medium text-slate-900 dark:text-white">
                        {formatRoomType(job.room_type)} Staging
                      </p>
                      <p className="text-xs text-slate-500 flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        {formatDate(job.created_at)}
                      </p>
                    </div>
                  </div>
                  <Badge variant="outline" className="text-red-600 border-red-200">
                    -{job.credits_used || CREDITS_PER_STAGING} credit
                  </Badge>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <Sparkles className="h-12 w-12 text-slate-300 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-slate-900 dark:text-white mb-2">
                No usage history yet
              </h3>
              <p className="text-slate-500">
                Your credit usage will appear here when you start staging photos
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
