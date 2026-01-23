import Image from "next/image";
import { createClient } from "@/lib/supabase/server";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ImagePlus, Building2, Clock, TrendingUp, ArrowRight, AlertTriangle, CreditCard } from "lucide-react";
import Link from "next/link";
import { LOW_CREDITS_THRESHOLD, CREDITS_PER_STAGING } from "@/lib/constants";
import { cn } from "@/lib/utils";

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

  // Mix time-based and casual greetings
  const timeGreeting = hour < 12 ? greetings[0] : hour < 17 ? greetings[1] : greetings[2];
  const allGreetings = [timeGreeting, ...casualGreetings];

  // Use the day of month to pick a consistent greeting for the day
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
      color: "text-primary",
      bgColor: "bg-primary/10 dark:bg-primary/15",
    },
    {
      name: "Properties",
      value: totalProperties || 0,
      icon: Building2,
      color: "text-emerald-600 dark:text-emerald-400",
      bgColor: "bg-emerald-500/10 dark:bg-emerald-500/15",
    },
    {
      name: "Completed",
      value: completedJobs || 0,
      icon: TrendingUp,
      color: "text-violet-600 dark:text-violet-400",
      bgColor: "bg-violet-500/10 dark:bg-violet-500/15",
    },
  ];

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "completed":
        return <Badge variant="success">Completed</Badge>;
      case "processing":
        return <Badge variant="warning">Processing</Badge>;
      case "failed":
        return <Badge variant="destructive">Failed</Badge>;
      default:
        return <Badge variant="secondary">Pending</Badge>;
    }
  };

  return (
    <div className="space-y-8">
      {/* Welcome Section */}
      <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
        <h1 className="text-foreground">
          {greeting}
        </h1>
        <p className="text-muted-foreground mt-2 text-lg">
          Here&apos;s an overview of your staging activity
        </p>
      </div>

      {/* No Credits Warning */}
      {hasNoCredits && (
        <Card className={cn(
          "border-destructive/30 dark:border-destructive/50",
          "bg-destructive/5 dark:bg-destructive/10",
          "animate-in fade-in slide-in-from-bottom-4 duration-500"
        )}>
          <CardContent className="flex items-center gap-3 p-4">
            <CreditCard className="h-5 w-5 text-destructive shrink-0" />
            <div className="flex-1">
              <p className="font-medium text-destructive">
                No Credits Remaining
              </p>
              <p className="text-sm text-destructive/80">
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
        <Card className={cn(
          "border-amber-500/30 dark:border-amber-500/50",
          "bg-amber-500/5 dark:bg-amber-500/10",
          "animate-in fade-in slide-in-from-bottom-4 duration-500"
        )}>
          <CardContent className="flex items-center gap-3 p-4">
            <AlertTriangle className="h-5 w-5 text-amber-600 dark:text-amber-400 shrink-0" />
            <div className="flex-1">
              <p className="font-medium text-amber-700 dark:text-amber-300">
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
      <Card className={cn(
        "border-0 overflow-hidden",
        "bg-gradient-to-br from-primary via-primary to-violet-600",
        "shadow-xl shadow-primary/20",
        "animate-in fade-in slide-in-from-bottom-4 duration-500 delay-100"
      )}>
        <CardContent className="flex items-center justify-between p-6 relative">
          {/* Subtle gradient overlay */}
          <div className="absolute inset-0 bg-gradient-to-r from-white/0 via-white/5 to-white/10" />
          <div className="text-white relative">
            <h3 className="text-lg font-semibold">Ready to stage a new photo?</h3>
            <p className="text-white/80 text-sm mt-1">
              Transform empty rooms into beautifully furnished spaces in seconds
            </p>
          </div>
          <Button asChild variant="secondary" className="shrink-0 relative shadow-lg">
            <Link href="/stage">
              <ImagePlus className="mr-2 h-4 w-4" />
              Stage Photo
            </Link>
          </Button>
        </CardContent>
      </Card>

      {/* Stats Grid */}
      <div className="grid gap-4 md:grid-cols-3">
        {stats.map((stat, index) => (
          <Card
            key={stat.name}
            className={cn(
              "transition-all duration-200",
              "hover:-translate-y-0.5 hover:shadow-lg",
              "animate-in fade-in slide-in-from-bottom-4 duration-500",
              index === 0 && "delay-150",
              index === 1 && "delay-200",
              index === 2 && "delay-250"
            )}
          >
            <CardContent className="flex items-center gap-4 p-6">
              <div className={cn("p-3 rounded-xl transition-transform duration-200 group-hover:scale-110", stat.bgColor)}>
                <stat.icon className={cn("h-6 w-6", stat.color)} />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">
                  {stat.name}
                </p>
                <p className="text-2xl font-bold text-foreground">
                  {stat.value}
                </p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Recent Activity */}
      <Card className="animate-in fade-in slide-in-from-bottom-4 duration-500 delay-300">
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
            <div className="space-y-3">
              {recentJobs.map((job) => (
                <div
                  key={job.id}
                  className={cn(
                    "flex items-center justify-between p-4 rounded-xl",
                    "bg-muted/50 dark:bg-white/5",
                    "border border-border/50 dark:border-white/5",
                    "transition-all duration-200",
                    "hover:bg-muted/80 dark:hover:bg-white/8"
                  )}
                >
                  <div className="flex items-center gap-4">
                    {job.staged_image_url && job.status === "completed" ? (
                      <a
                        href={job.staged_image_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className={cn(
                          "relative h-12 w-12 rounded-lg overflow-hidden flex-shrink-0",
                          "bg-muted dark:bg-white/10",
                          "ring-1 ring-border/50 dark:ring-white/10",
                          "transition-all duration-200",
                          "hover:ring-2 hover:ring-primary hover:scale-105"
                        )}
                      >
                        <Image
                          src={job.staged_image_url}
                          alt={`${job.room_type} staged`}
                          fill
                          className="object-cover"
                          unoptimized
                        />
                      </a>
                    ) : (
                      <div className={cn(
                        "h-12 w-12 rounded-lg flex items-center justify-center flex-shrink-0",
                        "bg-muted dark:bg-white/10"
                      )}>
                        <ImagePlus className="h-6 w-6 text-muted-foreground" />
                      </div>
                    )}
                    <div>
                      <p className="font-medium text-foreground capitalize">
                        {job.room_type.replace("-", " ")}
                      </p>
                      <p className="text-sm text-muted-foreground capitalize">
                        {job.style} style
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    {getStatusBadge(job.status)}
                    <div className="text-right">
                      <p className="text-sm text-muted-foreground flex items-center gap-1">
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
              <ImagePlus className="h-12 w-12 text-muted-foreground/50 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-foreground mb-2">
                No staging jobs yet
              </h3>
              <p className="text-muted-foreground mb-4">
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
