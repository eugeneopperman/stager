"use client";

import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { Sparkles, CreditCard, Clock, TrendingUp } from "lucide-react";
import { TrendIndicator } from "./TrendIndicator";
import { formatProcessingTime } from "@/lib/analytics/utils";
import type { PeriodComparison } from "@/lib/analytics/types";

interface AnalyticsStatsRowProps {
  comparison: PeriodComparison;
}

export function AnalyticsStatsRow({ comparison }: AnalyticsStatsRowProps) {
  const { current, stagingsTrend } = comparison;

  const stats = [
    {
      label: "Stagings",
      value: current.totalStagings,
      icon: Sparkles,
      color: "emerald",
      delay: "delay-100",
    },
    {
      label: "Credits Used",
      value: current.totalCredits,
      icon: CreditCard,
      color: "blue",
      delay: "delay-150",
    },
    {
      label: "Avg Time",
      value: formatProcessingTime(current.avgProcessingTimeMs),
      icon: Clock,
      color: "amber",
      delay: "delay-200",
    },
    {
      label: "Trend",
      value: stagingsTrend,
      icon: TrendingUp,
      color: stagingsTrend >= 0 ? "emerald" : "red",
      isTrend: true,
      delay: "delay-250",
    },
  ];

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4" data-tour="analytics-stats">
      {stats.map((stat) => (
        <Card
          key={stat.label}
          className={cn(
            "animate-in fade-in slide-in-from-bottom-4 duration-500",
            stat.delay
          )}
        >
          <CardContent className="p-4 flex items-center gap-3">
            <div
              className={cn(
                "p-2.5 rounded-xl",
                stat.color === "emerald" && "bg-emerald-500/10 dark:bg-emerald-500/15",
                stat.color === "blue" && "bg-blue-500/10 dark:bg-blue-500/15",
                stat.color === "amber" && "bg-amber-500/10 dark:bg-amber-500/15",
                stat.color === "red" && "bg-red-500/10 dark:bg-red-500/15"
              )}
            >
              <stat.icon
                className={cn(
                  "h-5 w-5",
                  stat.color === "emerald" && "text-emerald-600 dark:text-emerald-400",
                  stat.color === "blue" && "text-blue-600 dark:text-blue-400",
                  stat.color === "amber" && "text-amber-600 dark:text-amber-400",
                  stat.color === "red" && "text-red-600 dark:text-red-400"
                )}
              />
            </div>
            <div>
              {stat.isTrend ? (
                <TrendIndicator value={stat.value as number} className="text-2xl font-bold" />
              ) : (
                <p className="text-2xl font-bold text-foreground">{stat.value}</p>
              )}
              <p className="text-sm text-muted-foreground">{stat.label}</p>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
