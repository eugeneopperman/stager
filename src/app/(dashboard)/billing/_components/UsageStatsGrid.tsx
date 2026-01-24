import { Card, CardContent } from "@/components/ui/card";
import { Calendar, TrendingDown, Sparkles } from "lucide-react";

interface UsageStatsGridProps {
  creditsUsedThisMonth: number;
  totalCreditsUsed: number;
  totalStagings: number;
}

export function UsageStatsGrid({
  creditsUsedThisMonth,
  totalCreditsUsed,
  totalStagings,
}: UsageStatsGridProps) {
  return (
    <div className="grid gap-4 md:grid-cols-3">
      <Card>
        <CardContent className="p-4 flex items-center gap-3">
          <div className="p-2 rounded-lg bg-blue-100 dark:bg-blue-950">
            <Calendar className="h-5 w-5 text-blue-600" />
          </div>
          <div>
            <p className="text-2xl font-bold text-slate-900 dark:text-white">
              {creditsUsedThisMonth}
            </p>
            <p className="text-sm text-slate-500">Credits this month</p>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-4 flex items-center gap-3">
          <div className="p-2 rounded-lg bg-purple-100 dark:bg-purple-950">
            <TrendingDown className="h-5 w-5 text-purple-600" />
          </div>
          <div>
            <p className="text-2xl font-bold text-slate-900 dark:text-white">
              {totalCreditsUsed}
            </p>
            <p className="text-sm text-slate-500">Total credits used</p>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-4 flex items-center gap-3">
          <div className="p-2 rounded-lg bg-green-100 dark:bg-green-950">
            <Sparkles className="h-5 w-5 text-green-600" />
          </div>
          <div>
            <p className="text-2xl font-bold text-slate-900 dark:text-white">
              {totalStagings}
            </p>
            <p className="text-sm text-slate-500">Stagings completed</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
