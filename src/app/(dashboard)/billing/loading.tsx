import { Skeleton } from "@/components/ui/skeleton";
import { SubscriptionCardSkeleton } from "@/components/ui/skeletons";

export default function BillingLoading() {
  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="animate-in fade-in duration-500">
        <Skeleton className="h-8 w-40" />
        <Skeleton className="h-4 w-64 mt-2" />
      </div>

      {/* Current Plan */}
      <div className="space-y-4 animate-in fade-in duration-500 delay-100">
        <Skeleton className="h-6 w-32" />
        <SubscriptionCardSkeleton />
      </div>

      {/* Credit Balance */}
      <div className="space-y-4 animate-in fade-in duration-500 delay-150">
        <Skeleton className="h-6 w-28" />
        <div className="rounded-2xl border bg-card p-6 space-y-4">
          <div className="flex items-center justify-between">
            <Skeleton className="h-8 w-24" />
            <Skeleton className="h-8 w-32" />
          </div>
          <Skeleton className="h-3 w-full rounded-full" />
          <Skeleton className="h-4 w-48" />
        </div>
      </div>

      {/* Top-up Packages */}
      <div className="space-y-4 animate-in fade-in duration-500 delay-200">
        <Skeleton className="h-6 w-40" />
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="rounded-2xl border bg-card p-6 space-y-3">
              <div className="flex items-center justify-between">
                <Skeleton className="h-6 w-20" />
                <Skeleton className="h-5 w-16 rounded-full" />
              </div>
              <Skeleton className="h-8 w-16" />
              <Skeleton className="h-9 w-full rounded-xl" />
            </div>
          ))}
        </div>
      </div>

      {/* Upgrade Plans */}
      <div className="space-y-4 animate-in fade-in duration-500 delay-250">
        <Skeleton className="h-6 w-36" />
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="rounded-2xl border bg-card p-6 space-y-4">
              <Skeleton className="h-6 w-24" />
              <Skeleton className="h-10 w-20" />
              <div className="space-y-2">
                {[1, 2, 3, 4].map((j) => (
                  <div key={j} className="flex items-center gap-2">
                    <Skeleton className="h-4 w-4 rounded-full" />
                    <Skeleton className="h-4 flex-1" />
                  </div>
                ))}
              </div>
              <Skeleton className="h-10 w-full rounded-xl" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
