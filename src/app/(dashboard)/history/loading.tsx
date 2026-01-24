import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import {
  CardGridSkeleton,
  StatCardSkeleton,
} from "@/components/ui/skeletons";

export default function HistoryLoading() {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 animate-in fade-in duration-500">
        <div>
          <Skeleton className="h-8 w-48" />
          <Skeleton className="h-4 w-72 mt-2" />
        </div>
        <Skeleton className="h-9 w-36 rounded-xl" />
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4 animate-in fade-in duration-500 delay-100">
        <StatCardSkeleton />
        <StatCardSkeleton />
        <StatCardSkeleton />
      </div>

      {/* Jobs List Header */}
      <div className="space-y-4 animate-in fade-in duration-500 delay-200">
        <Skeleton className="h-6 w-40" />

        {/* Filter Bar */}
        <div className="flex flex-col sm:flex-row sm:flex-wrap sm:items-center gap-3">
          <Skeleton className="h-9 w-full sm:w-[180px] rounded-xl" />
          <Skeleton className="h-9 w-24 rounded-xl" />
          <div className="hidden sm:block sm:flex-1" />
          <div className="flex items-center gap-3">
            <Skeleton className="h-9 w-[165px] rounded-xl" />
            <Skeleton className="h-9 w-20 rounded-lg" />
          </div>
        </div>

        {/* Results count */}
        <Skeleton className="h-4 w-48" />

        {/* Grid of cards */}
        <CardGridSkeleton count={8} className="grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4" />
      </div>
    </div>
  );
}
