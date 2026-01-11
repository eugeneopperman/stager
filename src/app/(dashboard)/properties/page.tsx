import { createClient } from "@/lib/supabase/server";
import { Card, CardContent } from "@/components/ui/card";
import { Building2, ImageIcon } from "lucide-react";
import { CreatePropertyButton } from "./CreatePropertyButton";
import { PropertiesListClient } from "./PropertiesListClient";

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

  // Get staging counts for each property
  const propertiesWithCounts = await Promise.all(
    (properties || []).map(async (property) => {
      const { count } = await supabase
        .from("staging_jobs")
        .select("*", { count: "exact", head: true })
        .eq("property_id", property.id)
        .eq("status", "completed");

      return {
        ...property,
        stagingCount: count || 0,
      };
    })
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 dark:text-white">
            Properties
          </h1>
          <p className="text-slate-600 dark:text-slate-400 mt-1">
            Manage your real estate listings and staged photos
          </p>
        </div>
        <CreatePropertyButton />
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-4">
        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <div className="p-2 rounded-lg bg-blue-100 dark:bg-blue-950">
              <Building2 className="h-5 w-5 text-blue-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-slate-900 dark:text-white">
                {properties?.length || 0}
              </p>
              <p className="text-sm text-slate-500">Total Properties</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <div className="p-2 rounded-lg bg-green-100 dark:bg-green-950">
              <ImageIcon className="h-5 w-5 text-green-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-slate-900 dark:text-white">
                {propertiesWithCounts.reduce((sum, p) => sum + p.stagingCount, 0)}
              </p>
              <p className="text-sm text-slate-500">Total Stagings</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Properties List with Search & Filter */}
      <PropertiesListClient properties={propertiesWithCounts} />
    </div>
  );
}
