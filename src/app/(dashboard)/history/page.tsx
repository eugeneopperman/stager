import { createClient } from "@/lib/supabase/server";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  ImagePlus,
  Clock,
  Download,
  Eye,
  Calendar,
  Sparkles
} from "lucide-react";
import Link from "next/link";
import { HistoryJobCard } from "./HistoryJobCard";
import { cn } from "@/lib/utils";

export default async function HistoryPage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  // Fetch all staging jobs for the user
  const { data: jobs, error } = await supabase
    .from("staging_jobs")
    .select("*")
    .eq("user_id", user?.id)
    .order("created_at", { ascending: false });

  // Fetch all properties for the user (for "Add to Property" feature)
  const { data: properties } = await supabase
    .from("properties")
    .select("id, address")
    .eq("user_id", user?.id)
    .order("address", { ascending: true });

  const completedJobs = jobs?.filter((job) => job.status === "completed") || [];
  const pendingJobs = jobs?.filter((job) => job.status === "processing" || job.status === "pending") || [];
  const failedJobs = jobs?.filter((job) => job.status === "failed") || [];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 animate-in fade-in slide-in-from-bottom-4 duration-500">
        <div>
          <h1 className="text-3xl font-bold text-foreground">
            Staging History
          </h1>
          <p className="text-muted-foreground mt-1">
            View and download your past staging jobs
          </p>
        </div>
        <Button asChild>
          <Link href="/stage">
            <ImagePlus className="mr-2 h-4 w-4" />
            Stage New Photo
          </Link>
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4">
        <Card className={cn(
          "transition-all duration-200 hover:-translate-y-0.5 hover:shadow-lg",
          "animate-in fade-in slide-in-from-bottom-4 duration-500 delay-100"
        )}>
          <CardContent className="p-4 flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-emerald-500/10 dark:bg-emerald-500/15">
              <Sparkles className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
            </div>
            <div>
              <p className="text-2xl font-bold text-foreground">
                {completedJobs.length}
              </p>
              <p className="text-sm text-muted-foreground">Completed</p>
            </div>
          </CardContent>
        </Card>
        <Card className={cn(
          "transition-all duration-200 hover:-translate-y-0.5 hover:shadow-lg",
          "animate-in fade-in slide-in-from-bottom-4 duration-500 delay-150"
        )}>
          <CardContent className="p-4 flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-amber-500/10 dark:bg-amber-500/15">
              <Clock className="h-5 w-5 text-amber-600 dark:text-amber-400" />
            </div>
            <div>
              <p className="text-2xl font-bold text-foreground">
                {pendingJobs.length}
              </p>
              <p className="text-sm text-muted-foreground">Processing</p>
            </div>
          </CardContent>
        </Card>
        <Card className={cn(
          "transition-all duration-200 hover:-translate-y-0.5 hover:shadow-lg",
          "animate-in fade-in slide-in-from-bottom-4 duration-500 delay-200"
        )}>
          <CardContent className="p-4 flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-muted/80 dark:bg-white/10">
              <Calendar className="h-5 w-5 text-muted-foreground" />
            </div>
            <div>
              <p className="text-2xl font-bold text-foreground">
                {jobs?.length || 0}
              </p>
              <p className="text-sm text-muted-foreground">Total</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Jobs List */}
      {jobs && jobs.length > 0 ? (
        <div className="space-y-4 animate-in fade-in slide-in-from-bottom-4 duration-500 delay-250">
          <h2 className="text-lg font-semibold text-foreground">
            All Staging Jobs
          </h2>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {jobs.map((job) => (
              <HistoryJobCard key={job.id} job={job} properties={properties || []} />
            ))}
          </div>
        </div>
      ) : (
        <Card className="animate-in fade-in slide-in-from-bottom-4 duration-500 delay-250">
          <CardContent className="flex flex-col items-center justify-center py-16">
            <ImagePlus className="h-12 w-12 text-muted-foreground/50 mb-4" />
            <h3 className="text-lg font-medium text-foreground mb-2">
              No staging jobs yet
            </h3>
            <p className="text-muted-foreground text-center mb-6 max-w-sm">
              Your staging history will appear here once you start staging photos
            </p>
            <Button asChild>
              <Link href="/stage">
                <ImagePlus className="mr-2 h-4 w-4" />
                Stage Your First Photo
              </Link>
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
