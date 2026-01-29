"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  AnalyticsHeader,
  AnalyticsStatsRow,
  ActivityChart,
  RoomTypeChart,
  StyleChart,
  PeriodComparison,
} from ".";
import type { AnalyticsData, PeriodOption } from "@/lib/analytics/types";

interface AnalyticsPageClientProps {
  initialData: AnalyticsData;
}

export function AnalyticsPageClient({ initialData }: AnalyticsPageClientProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [selectedPeriod, setSelectedPeriod] = useState<PeriodOption>(
    initialData.periodDays as PeriodOption
  );
  const [data, setData] = useState<AnalyticsData>(initialData);

  const handlePeriodChange = (period: PeriodOption) => {
    setSelectedPeriod(period);
    startTransition(() => {
      router.push(`/analytics?period=${period}`);
    });
  };

  // Update data when initialData changes (from server)
  if (initialData.periodDays !== data.periodDays) {
    setData(initialData);
  }

  return (
    <div className={`space-y-6 ${isPending ? "opacity-70 transition-opacity" : ""}`}>
      {/* Header with period selector */}
      <AnalyticsHeader
        selectedPeriod={selectedPeriod}
        onPeriodChange={handlePeriodChange}
      />

      {/* Stats row */}
      <AnalyticsStatsRow comparison={data.periodComparison} />

      {/* Charts grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 lg:gap-6">
        {/* Activity Chart - full width on mobile, half on desktop */}
        <ActivityChart data={data.dailyActivity} />

        {/* Room Types Donut */}
        <RoomTypeChart data={data.roomTypes} />

        {/* Style Bar Chart */}
        <StyleChart data={data.styles} />

        {/* Period Comparison */}
        <PeriodComparison
          comparison={data.periodComparison}
          periodDays={selectedPeriod}
        />
      </div>
    </div>
  );
}
