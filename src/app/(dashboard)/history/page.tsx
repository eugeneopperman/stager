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
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 dark:text-white">
            Staging History
          </h1>
          <p className="text-slate-600 dark:text-slate-400 mt-1">
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
        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <div className="p-2 rounded-lg bg-green-100 dark:bg-green-950">
              <Sparkles className="h-5 w-5 text-green-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-slate-900 dark:text-white">
                {completedJobs.length}
              </p>
              <p className="text-sm text-slate-500">Completed</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <div className="p-2 rounded-lg bg-yellow-100 dark:bg-yellow-950">
              <Clock className="h-5 w-5 text-yellow-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-slate-900 dark:text-white">
                {pendingJobs.length}
              </p>
              <p className="text-sm text-slate-500">Processing</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <div className="p-2 rounded-lg bg-slate-100 dark:bg-slate-800">
              <Calendar className="h-5 w-5 text-slate-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-slate-900 dark:text-white">
                {jobs?.length || 0}
              </p>
              <p className="text-sm text-slate-500">Total</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Jobs List */}
      {jobs && jobs.length > 0 ? (
        <div className="space-y-4">
          <h2 className="text-lg font-semibold text-slate-900 dark:text-white">
            All Staging Jobs
          </h2>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {jobs.map((job) => (
              <HistoryJobCard key={job.id} job={job} properties={properties || []} />
            ))}
          </div>
        </div>
      ) : (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-16">
            <ImagePlus className="h-12 w-12 text-slate-300 mb-4" />
            <h3 className="text-lg font-medium text-slate-900 dark:text-white mb-2">
              No staging jobs yet
            </h3>
            <p className="text-slate-500 text-center mb-6 max-w-sm">
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
