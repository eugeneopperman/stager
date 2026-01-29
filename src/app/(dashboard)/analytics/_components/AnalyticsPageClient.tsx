"use client";

import { useEffect, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import dynamic from "next/dynamic";
import { AnalyticsHeader } from "./AnalyticsHeader";
import { AnalyticsStatsRow } from "./AnalyticsStatsRow";
import { PeriodComparison } from "./PeriodComparison";
import type { AnalyticsData, PeriodOption } from "@/lib/analytics/types";

// Dynamically import chart components with SSR disabled (Recharts uses browser APIs)
const ActivityChart = dynamic(() => import("./ActivityChart").then((mod) => mod.ActivityChart), {
  ssr: false,
  loading: () => <ChartSkeleton />,
});
const RoomTypeChart = dynamic(() => import("./RoomTypeChart").then((mod) => mod.RoomTypeChart), {
  ssr: false,
  loading: () => <ChartSkeleton />,
});
const StyleChart = dynamic(() => import("./StyleChart").then((mod) => mod.StyleChart), {
  ssr: false,
  loading: () => <ChartSkeleton />,
});

function ChartSkeleton() {
  return (
    <div className="h-[300px] rounded-lg bg-card/60 animate-pulse" />
  );
}

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

  // Update data when initialData changes (from server)
  useEffect(() => {
    if (initialData.periodDays !== data.periodDays) {
      setData(initialData);
    }
  }, [initialData, data.periodDays]);

  const handlePeriodChange = (period: PeriodOption) => {
    setSelectedPeriod(period);
    startTransition(() => {
      router.push(`/analytics?period=${period}`);
    });
  };

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
