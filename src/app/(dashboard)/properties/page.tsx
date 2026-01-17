import { createClient } from "@/lib/supabase/server";
import { Card, CardContent } from "@/components/ui/card";
import { Building2, ImageIcon } from "lucide-react";
import { CreatePropertyButton } from "./CreatePropertyButton";
import { PropertiesListClient } from "./PropertiesListClient";
import { cn } from "@/lib/utils";

export default async function PropertiesPage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  // Fetch all properties with their staging job counts
  const { data: properties } = await supabase
    .from("properties")
    .select(`
      *,
      staging_jobs(count)
    `)
    .eq("user_id", user?.id)
    .order("created_at", { ascending: false });

  // Get staging counts and preview images for each property
  const propertiesWithCounts = await Promise.all(
    (properties || []).map(async (property) => {
      // Get count of completed stagings
      const { count } = await supabase
        .from("staging_jobs")
        .select("*", { count: "exact", head: true })
        .eq("property_id", property.id)
        .eq("status", "completed");

      // Get the most recent staged image as preview
      const { data: previewJob } = await supabase
        .from("staging_jobs")
        .select("staged_image_url")
        .eq("property_id", property.id)
        .eq("status", "completed")
        .order("created_at", { ascending: false })
        .limit(1)
        .single();

      return {
        ...property,
        stagingCount: count || 0,
        previewImageUrl: previewJob?.staged_image_url || null,
      };
    })
  );

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
                {propertiesWithCounts.reduce((sum, p) => sum + p.stagingCount, 0)}
              </p>
              <p className="text-sm text-muted-foreground">Total Stagings</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Properties List with Search & Filter */}
      <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 delay-200">
        <PropertiesListClient properties={propertiesWithCounts} />
      </div>
    </div>
  );
}
