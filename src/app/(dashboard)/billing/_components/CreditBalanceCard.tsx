import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Coins, AlertTriangle } from "lucide-react";
import { cn } from "@/lib/utils";

interface CreditBalanceCardProps {
  credits: number;
  isLowCredits: boolean;
  hasNoCredits: boolean;
  currentPlanSlug: string;
}

export function CreditBalanceCard({
  credits,
  isLowCredits,
  hasNoCredits,
  currentPlanSlug,
}: CreditBalanceCardProps) {
  return (
    <Card
      className={cn(
        hasNoCredits
          ? "border-red-200 bg-red-50 dark:bg-red-950/30 dark:border-red-900"
          : isLowCredits
          ? "border-amber-200 bg-amber-50 dark:bg-amber-950/30 dark:border-amber-900"
          : "border-green-200 bg-green-50 dark:bg-green-950/30 dark:border-green-900"
      )}
    >
      <CardContent className="p-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div
              className={cn(
                "p-4 rounded-full",
                hasNoCredits
                  ? "bg-red-100 dark:bg-red-900"
                  : isLowCredits
                  ? "bg-amber-100 dark:bg-amber-900"
                  : "bg-green-100 dark:bg-green-900"
              )}
            >
              <Coins
                className={cn(
                  "h-8 w-8",
                  hasNoCredits
                    ? "text-red-600"
                    : isLowCredits
                    ? "text-amber-600"
                    : "text-green-600"
                )}
              />
            </div>
            <div>
              <p className="text-sm text-slate-600 dark:text-slate-400">
                Available Credits
              </p>
              <p className="text-4xl font-bold text-slate-900 dark:text-white">
                {credits}
              </p>
              {hasNoCredits && (
                <p className="text-sm text-red-600 flex items-center gap-1 mt-1">
                  <AlertTriangle className="h-3 w-3" />
                  No credits remaining
                </p>
              )}
              {isLowCredits && !hasNoCredits && (
                <p className="text-sm text-amber-600 flex items-center gap-1 mt-1">
                  <AlertTriangle className="h-3 w-3" />
                  Running low on credits
                </p>
              )}
            </div>
          </div>
          <div className="text-right">
            <Badge variant="outline" className="text-lg px-3 py-1">
              {currentPlanSlug.charAt(0).toUpperCase() + currentPlanSlug.slice(1)} Plan
            </Badge>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
