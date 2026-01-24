import { createClient } from "@/lib/supabase/server";
import { Card, CardContent } from "@/components/ui/card";
import { Building2, ImageIcon } from "lucide-react";
import { CreatePropertyButton } from "./_components/CreatePropertyButton";
import { PropertiesListClient } from "./_components/PropertiesListClient";
import { GalleryErrorBoundary } from "@/components/error-boundary";
import { cn } from "@/lib/utils";

export default async function PropertiesPage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  // Fetch all properties with their completed staging jobs in a single query
  // This avoids N+1 queries by fetching all related data at once
  const { data: properties } = await supabase
    .from("properties")
    .select(`
      *,
      staging_jobs!left(
        id,
        status,
        staged_image_url,
        created_at
      )
    `)
    .eq("user_id", user?.id)
    .order("created_at", { ascending: false });

  // Aggregate counts and get preview images in JS (still better than N+1)
  const propertiesWithCounts = (properties || []).map((property) => {
    const completedJobs = (property.staging_jobs || []).filter(
      (j: { status: string }) => j.status === "completed"
    );
    // Sort by created_at descending to get most recent first
    completedJobs.sort((a: { created_at: string }, b: { created_at: string }) =>
      new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    );

    return {
      ...property,
      stagingCount: completedJobs.length,
      previewImageUrl: completedJobs[0]?.staged_image_url || null,
      // Remove staging_jobs from the spread to avoid passing large arrays to client
      staging_jobs: undefined,
    };
  });

  // Calculate total stagings
  const totalStagings = propertiesWithCounts.reduce((sum, p) => sum + p.stagingCount, 0);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 animate-in fade-in slide-in-from-bottom-4 duration-500">
        <div>
          <h1 className="text-foreground">
            Properties
          </h1>
          <p className="text-muted-foreground mt-2">
            Manage your real estate listings and staged photos
          </p>
        </div>
        <CreatePropertyButton />
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-4">
        <Card className={cn(
          "transition-all duration-200 hover:-translate-y-0.5 hover:shadow-lg",
          "animate-in fade-in slide-in-from-bottom-4 duration-500 delay-100"
        )}>
          <CardContent className="p-4 flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-primary/10 dark:bg-primary/15">
              <Building2 className="h-5 w-5 text-primary" />
            </div>
            <div>
              <p className="text-2xl font-bold text-foreground">
                {properties?.length || 0}
              </p>
              <p className="text-sm text-muted-foreground">Total Properties</p>
            </div>
          </CardContent>
        </Card>
        <Card className={cn(
          "transition-all duration-200 hover:-translate-y-0.5 hover:shadow-lg",
          "animate-in fade-in slide-in-from-bottom-4 duration-500 delay-150"
        )}>
          <CardContent className="p-4 flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-emerald-500/10 dark:bg-emerald-500/15">
              <ImageIcon className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
            </div>
            <div>
              <p className="text-2xl font-bold text-foreground">
                {totalStagings}
              </p>
              <p className="text-sm text-muted-foreground">Total Stagings</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Properties List with Search & Filter */}
      <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 delay-200">
        <GalleryErrorBoundary>
          <PropertiesListClient properties={propertiesWithCounts} />
        </GalleryErrorBoundary>
      </div>
    </div>
  );
}
