import { createClient } from "@/lib/supabase/server";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ImagePlus, Building2, Clock, TrendingUp, ArrowRight, AlertTriangle, CreditCard } from "lucide-react";
import Link from "next/link";
import { LOW_CREDITS_THRESHOLD, CREDITS_PER_STAGING } from "@/lib/constants";

export default async function DashboardPage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  // Fetch recent staging jobs
  const { data: recentJobs } = await supabase
    .from("staging_jobs")
    .select("*")
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

  const stats = [
    {
      name: "Total Stagings",
      value: totalJobs || 0,
      icon: ImagePlus,
      color: "text-blue-600",
      bgColor: "bg-blue-100 dark:bg-blue-950",
    },
    {
      name: "Properties",
      value: totalProperties || 0,
      icon: Building2,
      color: "text-green-600",
      bgColor: "bg-green-100 dark:bg-green-950",
    },
    {
      name: "Completed",
      value: completedJobs || 0,
      icon: TrendingUp,
      color: "text-purple-600",
      bgColor: "bg-purple-100 dark:bg-purple-950",
    },
  ];

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "completed":
        return <Badge className="bg-green-100 text-green-700 dark:bg-green-950 dark:text-green-400">Completed</Badge>;
      case "processing":
        return <Badge className="bg-yellow-100 text-yellow-700 dark:bg-yellow-950 dark:text-yellow-400">Processing</Badge>;
      case "failed":
        return <Badge className="bg-red-100 text-red-700 dark:bg-red-950 dark:text-red-400">Failed</Badge>;
      default:
        return <Badge className="bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-400">Pending</Badge>;
    }
  };

  return (
    <div className="space-y-8">
      {/* Welcome Section */}
      <div>
        <h1 className="text-3xl font-bold text-slate-900 dark:text-white">
          Welcome back!
        </h1>
        <p className="text-slate-600 dark:text-slate-400 mt-1">
          Here&apos;s an overview of your staging activity
        </p>
      </div>

      {/* No Credits Warning */}
      {hasNoCredits && (
        <Card className="border-red-200 bg-red-50 dark:bg-red-950/50 dark:border-red-900">
          <CardContent className="flex items-center gap-3 p-4">
            <CreditCard className="h-5 w-5 text-red-600 shrink-0" />
            <div className="flex-1">
              <p className="font-medium text-red-800 dark:text-red-200">
                No Credits Remaining
              </p>
              <p className="text-sm text-red-600 dark:text-red-400">
                You&apos;ve run out of staging credits. Purchase more to continue staging photos.
              </p>
            </div>
            <Button asChild size="sm">
              <Link href="/billing">
                <CreditCard className="mr-2 h-4 w-4" />
                Buy Credits
              </Link>
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Low Credits Warning */}
      {isLowCredits && !hasNoCredits && (
        <Card className="border-amber-200 bg-amber-50 dark:bg-amber-950/50 dark:border-amber-900">
          <CardContent className="flex items-center gap-3 p-4">
            <AlertTriangle className="h-5 w-5 text-amber-600 shrink-0" />
            <div className="flex-1">
              <p className="font-medium text-amber-800 dark:text-amber-200">
                Running Low on Credits
              </p>
              <p className="text-sm text-amber-600 dark:text-amber-400">
                You have {credits} credit{credits !== 1 ? "s" : ""} remaining. Consider purchasing more to avoid interruptions.
              </p>
            </div>
            <Button asChild variant="outline" size="sm">
              <Link href="/billing">
                Get More Credits
              </Link>
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Quick Actions */}
      <Card className="bg-gradient-to-r from-blue-600 to-blue-700 border-0">
        <CardContent className="flex items-center justify-between p-6">
          <div className="text-white">
            <h3 className="text-lg font-semibold">Ready to stage a new photo?</h3>
            <p className="text-blue-100 text-sm mt-1">
              Transform empty rooms into beautifully furnished spaces in seconds
            </p>
          </div>
          <Button asChild variant="secondary" className="shrink-0">
            <Link href="/stage">
              <ImagePlus className="mr-2 h-4 w-4" />
              Stage Photo
            </Link>
          </Button>
        </CardContent>
      </Card>

      {/* Stats Grid */}
      <div className="grid gap-4 md:grid-cols-3">
        {stats.map((stat) => (
          <Card key={stat.name}>
            <CardContent className="flex items-center gap-4 p-6">
              <div className={`p-3 rounded-lg ${stat.bgColor}`}>
                <stat.icon className={`h-6 w-6 ${stat.color}`} />
              </div>
              <div>
                <p className="text-sm text-slate-600 dark:text-slate-400">
                  {stat.name}
                </p>
                <p className="text-2xl font-bold text-slate-900 dark:text-white">
                  {stat.value}
                </p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Recent Activity */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle>Recent Stagings</CardTitle>
            <CardDescription>Your latest virtual staging jobs</CardDescription>
          </div>
          <Button variant="ghost" asChild>
            <Link href="/history">
              View all
              <ArrowRight className="ml-2 h-4 w-4" />
            </Link>
          </Button>
        </CardHeader>
        <CardContent>
          {recentJobs && recentJobs.length > 0 ? (
            <div className="space-y-4">
              {recentJobs.map((job) => (
                <div
                  key={job.id}
                  className="flex items-center justify-between p-4 rounded-lg bg-slate-50 dark:bg-slate-900"
                >
                  <div className="flex items-center gap-4">
                    <div className="h-12 w-12 rounded-lg bg-slate-200 dark:bg-slate-800 flex items-center justify-center">
                      <ImagePlus className="h-6 w-6 text-slate-400" />
                    </div>
                    <div>
                      <p className="font-medium text-slate-900 dark:text-white capitalize">
                        {job.room_type.replace("-", " ")}
                      </p>
                      <p className="text-sm text-slate-500 capitalize">
                        {job.style} style
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    {getStatusBadge(job.status)}
                    <div className="text-right">
                      <p className="text-sm text-slate-500 flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        {new Date(job.created_at).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <ImagePlus className="h-12 w-12 text-slate-300 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-slate-900 dark:text-white mb-2">
                No staging jobs yet
              </h3>
              <p className="text-slate-500 mb-4">
                Stage your first photo to see it here
              </p>
              <Button asChild>
                <Link href="/stage">
                  <ImagePlus className="mr-2 h-4 w-4" />
                  Stage Your First Photo
                </Link>
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
