import { createClient } from "@/lib/supabase/server";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  CreditCard,
  Coins,
  TrendingDown,
  Calendar,
  Clock,
  Sparkles,
  AlertTriangle,
} from "lucide-react";
import { LOW_CREDITS_THRESHOLD, CREDITS_PER_STAGING } from "@/lib/constants";

export default async function BillingPage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  // Fetch user profile with credits
  const { data: profile } = await supabase
    .from("profiles")
    .select("credits_remaining, created_at")
    .eq("id", user?.id)
    .single();

  const credits = profile?.credits_remaining || 0;
  const isLowCredits = credits <= LOW_CREDITS_THRESHOLD;
  const hasNoCredits = credits < CREDITS_PER_STAGING;

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
    <div className="space-y-6 max-w-4xl mx-auto">
      {/* Header */}
      <div>
        <h1 className="text-foreground">
          Billing & Credits
        </h1>
        <p className="text-muted-foreground mt-2">
          Manage your credits and view usage history
        </p>
      </div>

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
              <Button disabled className="mb-2">
                <CreditCard className="mr-2 h-4 w-4" />
                Buy Credits
              </Button>
              <p className="text-xs text-slate-500">Coming soon</p>
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

      {/* Pricing Info (Placeholder) */}
      <Card>
        <CardHeader>
          <CardTitle>Credit Packages</CardTitle>
          <CardDescription>
            Purchase additional credits to continue staging
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-3">
            <div className="p-4 rounded-lg border-2 border-slate-200 dark:border-slate-800">
              <p className="font-semibold text-slate-900 dark:text-white">
                Starter Pack
              </p>
              <p className="text-3xl font-bold text-slate-900 dark:text-white mt-2">
                $9
              </p>
              <p className="text-sm text-slate-500">10 credits</p>
              <Button disabled className="w-full mt-4" variant="outline">
                Coming Soon
              </Button>
            </div>
            <div className="p-4 rounded-lg border-2 border-blue-500 relative">
              <Badge className="absolute -top-2 left-1/2 -translate-x-1/2 bg-blue-500">
                Popular
              </Badge>
              <p className="font-semibold text-slate-900 dark:text-white">
                Pro Pack
              </p>
              <p className="text-3xl font-bold text-slate-900 dark:text-white mt-2">
                $29
              </p>
              <p className="text-sm text-slate-500">50 credits</p>
              <Button disabled className="w-full mt-4">
                Coming Soon
              </Button>
            </div>
            <div className="p-4 rounded-lg border-2 border-slate-200 dark:border-slate-800">
              <p className="font-semibold text-slate-900 dark:text-white">
                Agency Pack
              </p>
              <p className="text-3xl font-bold text-slate-900 dark:text-white mt-2">
                $79
              </p>
              <p className="text-sm text-slate-500">150 credits</p>
              <Button disabled className="w-full mt-4" variant="outline">
                Coming Soon
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
