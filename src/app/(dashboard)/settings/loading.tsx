import { Skeleton } from "@/components/ui/skeleton";
import { FormSkeleton } from "@/components/ui/skeletons";

export default function SettingsLoading() {
  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="animate-in fade-in duration-500">
        <Skeleton className="h-8 w-24" />
        <Skeleton className="h-4 w-64 mt-2" />
      </div>

      {/* Profile Section */}
      <div className="space-y-4 animate-in fade-in duration-500 delay-100">
        <Skeleton className="h-6 w-24" />
        <div className="rounded-2xl border bg-card p-6">
          <FormSkeleton fields={3} />
        </div>
      </div>

      {/* Password Section */}
      <div className="space-y-4 animate-in fade-in duration-500 delay-150">
        <Skeleton className="h-6 w-32" />
        <div className="rounded-2xl border bg-card p-6">
          <FormSkeleton fields={3} />
        </div>
      </div>

      {/* Appearance Section */}
      <div className="space-y-4 animate-in fade-in duration-500 delay-200">
        <Skeleton className="h-6 w-28" />
        <div className="rounded-2xl border bg-card p-6 space-y-4">
          <Skeleton className="h-4 w-20" />
          <div className="flex gap-3">
            {[1, 2, 3].map((i) => (
              <Skeleton key={i} className="h-24 w-24 rounded-xl" />
            ))}
          </div>
        </div>
      </div>

      {/* Sidebar Section */}
      <div className="space-y-4 animate-in fade-in duration-500 delay-250">
        <Skeleton className="h-6 w-36" />
        <div className="rounded-2xl border bg-card p-6 space-y-4">
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <Skeleton className="h-4 w-32" />
              <Skeleton className="h-3 w-48" />
            </div>
            <Skeleton className="h-6 w-11 rounded-full" />
          </div>
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <Skeleton className="h-4 w-40" />
              <Skeleton className="h-3 w-56" />
            </div>
            <Skeleton className="h-6 w-11 rounded-full" />
          </div>
        </div>
      </div>

      {/* Danger Zone */}
      <div className="space-y-4 animate-in fade-in duration-500 delay-300">
        <Skeleton className="h-6 w-28" />
        <div className="rounded-2xl border border-destructive/20 bg-card p-6">
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <Skeleton className="h-5 w-32" />
              <Skeleton className="h-4 w-64" />
            </div>
            <Skeleton className="h-9 w-32 rounded-xl" />
          </div>
        </div>
      </div>
    </div>
  );
}
