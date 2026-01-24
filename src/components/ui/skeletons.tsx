"use client";

import { Skeleton } from "./skeleton";
import { cn } from "@/lib/utils";

/**
 * Skeleton for a card in grid view (properties, history)
 */
export function CardSkeleton({ className }: { className?: string }) {
  return (
    <div
      className={cn(
        "relative aspect-[4/3] rounded-2xl overflow-hidden",
        className
      )}
    >
      <Skeleton className="absolute inset-0" />
      {/* Badge placeholder */}
      <div className="absolute top-3 left-3">
        <Skeleton className="h-6 w-20 rounded-full" />
      </div>
      {/* Bottom info area */}
      <div className="absolute inset-x-0 bottom-0 p-4 space-y-2">
        <Skeleton className="h-4 w-3/4" />
        <Skeleton className="h-3 w-1/2" />
      </div>
    </div>
  );
}

/**
 * Skeleton for a list item view
 */
export function ListItemSkeleton({ className }: { className?: string }) {
  return (
    <div
      className={cn(
        "flex items-center gap-4 p-3 rounded-xl border bg-card/60",
        className
      )}
    >
      {/* Thumbnail */}
      <Skeleton className="h-16 w-24 rounded-lg flex-shrink-0" />
      {/* Content */}
      <div className="flex-1 min-w-0 space-y-2">
        <Skeleton className="h-4 w-3/4" />
        <Skeleton className="h-3 w-1/2" />
      </div>
      {/* Actions */}
      <div className="flex items-center gap-2 flex-shrink-0">
        <Skeleton className="h-8 w-8 rounded-lg" />
        <Skeleton className="h-8 w-8 rounded-lg" />
      </div>
    </div>
  );
}

/**
 * Skeleton for a stats card
 */
export function StatCardSkeleton({ className }: { className?: string }) {
  return (
    <div
      className={cn(
        "rounded-2xl border bg-card p-4 flex items-center gap-3",
        className
      )}
    >
      <Skeleton className="h-10 w-10 rounded-xl" />
      <div className="space-y-2">
        <Skeleton className="h-6 w-12" />
        <Skeleton className="h-3 w-24" />
      </div>
    </div>
  );
}

/**
 * Skeleton for staging result image
 */
export function StagingResultSkeleton({ className }: { className?: string }) {
  return (
    <div className={cn("space-y-4", className)}>
      {/* Main image */}
      <Skeleton className="aspect-video w-full rounded-xl" />
      {/* Thumbnail strip */}
      <div className="flex gap-2 justify-center">
        {[1, 2, 3].map((i) => (
          <Skeleton key={i} className="h-16 w-20 rounded-lg" />
        ))}
      </div>
      {/* Action buttons */}
      <div className="flex gap-2 justify-center">
        <Skeleton className="h-9 w-28 rounded-xl" />
        <Skeleton className="h-9 w-28 rounded-xl" />
      </div>
    </div>
  );
}

/**
 * Skeleton for property detail page
 */
export function PropertyDetailSkeleton({ className }: { className?: string }) {
  return (
    <div className={cn("space-y-6", className)}>
      {/* Header */}
      <div className="flex items-start justify-between">
        <div className="space-y-2">
          <Skeleton className="h-8 w-64" />
          <Skeleton className="h-4 w-48" />
        </div>
        <div className="flex gap-2">
          <Skeleton className="h-9 w-24 rounded-xl" />
          <Skeleton className="h-9 w-24 rounded-xl" />
        </div>
      </div>
      {/* Image grid */}
      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
        {[1, 2, 3, 4, 5, 6].map((i) => (
          <CardSkeleton key={i} />
        ))}
      </div>
    </div>
  );
}

/**
 * Skeleton for a grid of cards
 */
export function CardGridSkeleton({
  count = 6,
  className,
}: {
  count?: number;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4",
        className
      )}
    >
      {Array.from({ length: count }).map((_, i) => (
        <CardSkeleton key={i} />
      ))}
    </div>
  );
}

/**
 * Skeleton for a list of items
 */
export function ListSkeleton({
  count = 5,
  className,
}: {
  count?: number;
  className?: string;
}) {
  return (
    <div className={cn("space-y-2", className)}>
      {Array.from({ length: count }).map((_, i) => (
        <ListItemSkeleton key={i} />
      ))}
    </div>
  );
}

/**
 * Skeleton for dashboard stats row
 */
export function DashboardStatsSkeleton({ className }: { className?: string }) {
  return (
    <div className={cn("grid grid-cols-2 md:grid-cols-4 gap-4", className)}>
      {[1, 2, 3, 4].map((i) => (
        <StatCardSkeleton key={i} />
      ))}
    </div>
  );
}

/**
 * Skeleton for table rows
 */
export function TableRowSkeleton({
  columns = 4,
  className,
}: {
  columns?: number;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "flex items-center gap-4 p-3 border-b last:border-b-0",
        className
      )}
    >
      {Array.from({ length: columns }).map((_, i) => (
        <Skeleton
          key={i}
          className={cn(
            "h-4",
            i === 0 ? "w-8" : i === columns - 1 ? "w-20" : "flex-1"
          )}
        />
      ))}
    </div>
  );
}

/**
 * Skeleton for a table
 */
export function TableSkeleton({
  rows = 5,
  columns = 4,
  className,
}: {
  rows?: number;
  columns?: number;
  className?: string;
}) {
  return (
    <div className={cn("rounded-xl border divide-y", className)}>
      {/* Header */}
      <div className="flex items-center gap-4 p-3 bg-muted/50">
        {Array.from({ length: columns }).map((_, i) => (
          <Skeleton
            key={i}
            className={cn(
              "h-3",
              i === 0 ? "w-8" : i === columns - 1 ? "w-20" : "flex-1"
            )}
          />
        ))}
      </div>
      {/* Rows */}
      {Array.from({ length: rows }).map((_, i) => (
        <TableRowSkeleton key={i} columns={columns} />
      ))}
    </div>
  );
}

/**
 * Skeleton for billing/subscription card
 */
export function SubscriptionCardSkeleton({ className }: { className?: string }) {
  return (
    <div className={cn("rounded-2xl border bg-card p-6 space-y-4", className)}>
      <div className="flex items-center justify-between">
        <Skeleton className="h-6 w-32" />
        <Skeleton className="h-6 w-20 rounded-full" />
      </div>
      <div className="space-y-2">
        <Skeleton className="h-4 w-48" />
        <Skeleton className="h-4 w-36" />
      </div>
      <div className="flex gap-2 pt-2">
        <Skeleton className="h-9 w-full rounded-xl" />
      </div>
    </div>
  );
}

/**
 * Skeleton for form fields
 */
export function FormFieldSkeleton({ className }: { className?: string }) {
  return (
    <div className={cn("space-y-2", className)}>
      <Skeleton className="h-4 w-24" />
      <Skeleton className="h-10 w-full rounded-xl" />
    </div>
  );
}

/**
 * Skeleton for form with multiple fields
 */
export function FormSkeleton({
  fields = 4,
  className,
}: {
  fields?: number;
  className?: string;
}) {
  return (
    <div className={cn("space-y-4", className)}>
      {Array.from({ length: fields }).map((_, i) => (
        <FormFieldSkeleton key={i} />
      ))}
      <Skeleton className="h-10 w-32 rounded-xl mt-6" />
    </div>
  );
}
