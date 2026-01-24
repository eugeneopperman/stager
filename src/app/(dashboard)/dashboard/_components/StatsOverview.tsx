"use client";

import { memo } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { ImagePlus, Building2, TrendingUp, LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

interface Stat {
  name: string;
  value: number;
  icon: LucideIcon;
  color: string;
  bgColor: string;
}

interface StatsOverviewProps {
  totalJobs: number;
  totalProperties: number;
  completedJobs: number;
}

export const StatsOverview = memo(function StatsOverview({
  totalJobs,
  totalProperties,
  completedJobs,
}: StatsOverviewProps) {
  const stats: Stat[] = [
    {
      name: "Total Stagings",
      value: totalJobs,
      icon: ImagePlus,
      color: "text-primary",
      bgColor: "bg-primary/10 dark:bg-primary/15",
    },
    {
      name: "Properties",
      value: totalProperties,
      icon: Building2,
      color: "text-emerald-600 dark:text-emerald-400",
      bgColor: "bg-emerald-500/10 dark:bg-emerald-500/15",
    },
    {
      name: "Completed",
      value: completedJobs,
      icon: TrendingUp,
      color: "text-violet-600 dark:text-violet-400",
      bgColor: "bg-violet-500/10 dark:bg-violet-500/15",
    },
  ];

  return (
    <div className="grid gap-4 md:grid-cols-3">
      {stats.map((stat, index) => (
        <Card
          key={stat.name}
          className={cn(
            "transition-all duration-200",
            "hover:-translate-y-0.5 hover:shadow-lg",
            "animate-in fade-in slide-in-from-bottom-4 duration-500",
            index === 0 && "delay-150",
            index === 1 && "delay-200",
            index === 2 && "delay-250"
          )}
        >
          <CardContent className="flex items-center gap-4 p-6">
            <div
              className={cn(
                "p-3 rounded-xl transition-transform duration-200 group-hover:scale-110",
                stat.bgColor
              )}
            >
              <stat.icon className={cn("h-6 w-6", stat.color)} />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">{stat.name}</p>
              <p className="text-2xl font-bold text-foreground">{stat.value}</p>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
});
