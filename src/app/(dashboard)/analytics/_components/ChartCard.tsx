"use client";

import { cn } from "@/lib/utils";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface ChartCardProps {
  title: string;
  children: React.ReactNode;
  className?: string;
  tourId?: string;
}

export function ChartCard({ title, children, className, tourId }: ChartCardProps) {
  return (
    <Card
      className={cn(
        "glass-heavy border-border/50 dark:border-white/[0.08]",
        "animate-in fade-in slide-in-from-bottom-4 duration-500",
        className
      )}
      data-tour={tourId}
    >
      <CardHeader className="pb-2">
        <CardTitle className="text-base font-medium text-foreground">{title}</CardTitle>
      </CardHeader>
      <CardContent>{children}</CardContent>
    </Card>
  );
}
