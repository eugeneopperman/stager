import { Skeleton } from "@/components/ui/skeleton";
import { StatCardSkeleton, CardSkeleton } from "@/components/ui/skeletons";

export default function DashboardLoading() {
  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="animate-in fade-in duration-500">
        <Skeleton className="h-9 w-48" />
        <Skeleton className="h-4 w-64 mt-2" />
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 animate-in fade-in duration-500 delay-100">
        <StatCardSkeleton />
        <StatCardSkeleton />
        <StatCardSkeleton />
        <StatCardSkeleton />
      </div>

      {/* Quick Actions */}
      <div className="space-y-4 animate-in fade-in duration-500 delay-200">
        <Skeleton className="h-6 w-32" />
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="rounded-2xl border bg-card p-6 space-y-3">
              <Skeleton className="h-10 w-10 rounded-xl" />
              <Skeleton className="h-5 w-32" />
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-3/4" />
            </div>
          ))}
        </div>
      </div>

      {/* Recent Activity */}
      <div className="space-y-4 animate-in fade-in duration-500 delay-300">
        <div className="flex items-center justify-between">
          <Skeleton className="h-6 w-40" />
          <Skeleton className="h-8 w-20 rounded-lg" />
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <CardSkeleton key={i} />
          ))}
        </div>
      </div>
    </div>
  );
}
