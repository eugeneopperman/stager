import { Skeleton } from "@/components/ui/skeleton";
import { StatCardSkeleton, CardGridSkeleton } from "@/components/ui/skeletons";

export default function PropertiesLoading() {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 animate-in fade-in duration-500">
        <div>
          <Skeleton className="h-8 w-32" />
          <Skeleton className="h-4 w-64 mt-2" />
        </div>
        <Skeleton className="h-9 w-40 rounded-xl" />
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-4 animate-in fade-in duration-500 delay-100">
        <StatCardSkeleton />
        <StatCardSkeleton />
      </div>

      {/* Properties List */}
      <div className="space-y-4 animate-in fade-in duration-500 delay-200">
        {/* Filter controls */}
        <div className="flex flex-col sm:flex-row gap-3">
          <Skeleton className="h-9 flex-1 sm:max-w-sm rounded-xl" />
          <Skeleton className="h-9 w-24 rounded-xl" />
          <div className="flex-1" />
          <Skeleton className="h-9 w-20 rounded-lg" />
        </div>

        {/* Grid of property cards */}
        <CardGridSkeleton count={6} />
      </div>
    </div>
  );
}
