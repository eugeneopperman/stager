"use client";

import { ChartCard } from "./ChartCard";
import { TrendIndicator } from "./TrendIndicator";
import type { PeriodComparison as PeriodComparisonType, PeriodOption } from "@/lib/analytics/types";

interface PeriodComparisonProps {
  comparison: PeriodComparisonType;
  periodDays: PeriodOption;
}

export function PeriodComparison({ comparison, periodDays }: PeriodComparisonProps) {
  const { current, previous, stagingsTrend, creditsTrend } = comparison;
  const periodLabel = periodDays === 7 ? "week" : "month";

  const metrics = [
    {
      label: "Stagings",
      current: current.totalStagings,
      previous: previous.totalStagings,
      trend: stagingsTrend,
    },
    {
      label: "Credits",
      current: current.totalCredits,
      previous: previous.totalCredits,
      trend: creditsTrend,
    },
    {
      label: "Completed",
      current: current.completedCount,
      previous: previous.completedCount,
      trend:
        previous.completedCount === 0
          ? current.completedCount > 0
            ? 100
            : 0
          : Math.round(
              ((current.completedCount - previous.completedCount) / previous.completedCount) * 100
            ),
    },
  ];

  return (
    <ChartCard title="Period Comparison" tourId="analytics-comparison">
      <div className="space-y-4">
        <div className="flex items-center justify-between text-xs text-muted-foreground pb-2 border-b border-border/50">
          <span>This {periodLabel}</span>
          <span>Last {periodLabel}</span>
          <span>Change</span>
        </div>
        {metrics.map((metric) => (
          <div key={metric.label} className="flex items-center justify-between">
            <div className="flex-1">
              <p className="text-xs text-muted-foreground mb-1">{metric.label}</p>
              <p className="text-lg font-semibold text-foreground">{metric.current}</p>
            </div>
            <div className="flex-1 text-center">
              <p className="text-xs text-muted-foreground mb-1">&nbsp;</p>
              <p className="text-lg font-semibold text-muted-foreground">{metric.previous}</p>
            </div>
            <div className="flex-1 text-right">
              <p className="text-xs text-muted-foreground mb-1">&nbsp;</p>
              <TrendIndicator value={metric.trend} className="text-base justify-end" />
            </div>
          </div>
        ))}
        {current.totalStagings === 0 && previous.totalStagings === 0 && (
          <p className="text-sm text-muted-foreground text-center pt-2">
            No staging history to compare
          </p>
        )}
      </div>
    </ChartCard>
  );
}
