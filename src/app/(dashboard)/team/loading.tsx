import { Skeleton } from "@/components/ui/skeleton";
import { StatCardSkeleton, TableSkeleton } from "@/components/ui/skeletons";

export default function TeamLoading() {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 animate-in fade-in duration-500">
        <div>
          <Skeleton className="h-8 w-40" />
          <Skeleton className="h-4 w-72 mt-2" />
        </div>
        <Skeleton className="h-9 w-36 rounded-xl" />
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 animate-in fade-in duration-500 delay-100">
        <StatCardSkeleton />
        <StatCardSkeleton />
        <StatCardSkeleton />
      </div>

      {/* Team Members */}
      <div className="space-y-4 animate-in fade-in duration-500 delay-150">
        <Skeleton className="h-6 w-32" />
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="rounded-2xl border bg-card p-4 space-y-3">
              <div className="flex items-center gap-3">
                <Skeleton className="h-10 w-10 rounded-full" />
                <div className="space-y-1 flex-1">
                  <Skeleton className="h-4 w-32" />
                  <Skeleton className="h-3 w-40" />
                </div>
              </div>
              <div className="flex items-center justify-between pt-2 border-t">
                <Skeleton className="h-4 w-20" />
                <Skeleton className="h-4 w-16" />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Pending Invitations */}
      <div className="space-y-4 animate-in fade-in duration-500 delay-200">
        <Skeleton className="h-6 w-40" />
        <TableSkeleton rows={3} columns={4} />
      </div>
    </div>
  );
}
