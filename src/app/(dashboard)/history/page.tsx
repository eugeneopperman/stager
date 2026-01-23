import { createClient } from "@/lib/supabase/server";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ImagePlus } from "lucide-react";
import Link from "next/link";
import { HistoryPageClient } from "./_components/HistoryPageClient";

export default async function HistoryPage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  // Fetch all staging jobs for the user
  const { data: jobs } = await supabase
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

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 animate-in fade-in slide-in-from-bottom-4 duration-500">
        <div>
          <h1 className="text-foreground">
            Staging History
          </h1>
          <p className="text-muted-foreground mt-2">
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

      {/* Stats + Jobs List */}
      {jobs && jobs.length > 0 ? (
        <HistoryPageClient jobs={jobs} properties={properties || []} />
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
