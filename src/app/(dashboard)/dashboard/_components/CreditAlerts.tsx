"use client";

import { memo } from "react";
import Link from "next/link";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { AlertTriangle, CreditCard } from "lucide-react";
import { cn } from "@/lib/utils";

interface CreditAlertsProps {
  credits: number;
  isLowCredits: boolean;
  hasNoCredits: boolean;
}

export const CreditAlerts = memo(function CreditAlerts({
  credits,
  isLowCredits,
  hasNoCredits,
}: CreditAlertsProps) {
  if (hasNoCredits) {
    return (
      <Card
        className={cn(
          "border-destructive/30 dark:border-destructive/50",
          "bg-destructive/5 dark:bg-destructive/10",
          "animate-in fade-in slide-in-from-bottom-4 duration-500"
        )}
        data-tour="dashboard-credits"
      >
        <CardContent className="flex items-center gap-3 p-4">
          <CreditCard className="h-5 w-5 text-destructive shrink-0" />
          <div className="flex-1">
            <p className="font-medium text-destructive">No Credits Remaining</p>
            <p className="text-sm text-destructive/80">
              You&apos;ve run out of staging credits. Purchase more to continue
              staging photos.
            </p>
          </div>
          <Button asChild size="sm">
            <Link href="/billing">
              <CreditCard className="mr-2 h-4 w-4" />
              Buy Credits
            </Link>
          </Button>
        </CardContent>
      </Card>
    );
  }

  if (isLowCredits) {
    return (
      <Card
        className={cn(
          "border-amber-500/30 dark:border-amber-500/50",
          "bg-amber-500/5 dark:bg-amber-500/10",
          "animate-in fade-in slide-in-from-bottom-4 duration-500"
        )}
        data-tour="dashboard-credits"
      >
        <CardContent className="flex items-center gap-3 p-4">
          <AlertTriangle className="h-5 w-5 text-amber-600 dark:text-amber-400 shrink-0" />
          <div className="flex-1">
            <p className="font-medium text-amber-700 dark:text-amber-300">
              Running Low on Credits
            </p>
            <p className="text-sm text-amber-600 dark:text-amber-400">
              You have {credits} credit{credits !== 1 ? "s" : ""} remaining.
              Consider purchasing more to avoid interruptions.
            </p>
          </div>
          <Button asChild variant="outline" size="sm">
            <Link href="/billing">Get More Credits</Link>
          </Button>
        </CardContent>
      </Card>
    );
  }

  return null;
});
