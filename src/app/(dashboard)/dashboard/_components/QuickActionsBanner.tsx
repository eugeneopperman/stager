"use client";

import { memo } from "react";
import Link from "next/link";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ImagePlus } from "lucide-react";
import { cn } from "@/lib/utils";

export const QuickActionsBanner = memo(function QuickActionsBanner() {
  return (
    <Card
      className={cn(
        "border-0 overflow-hidden",
        "bg-gradient-to-br from-primary via-primary to-violet-600",
        "shadow-xl shadow-primary/20",
        "animate-in fade-in slide-in-from-bottom-4 duration-500 delay-100"
      )}
    >
      <CardContent className="flex items-center justify-between p-6 relative">
        <div className="absolute inset-0 bg-gradient-to-r from-white/0 via-white/5 to-white/10" />
        <div className="text-white relative">
          <h3 className="text-lg font-semibold">Ready to stage a new photo?</h3>
          <p className="text-white/80 text-sm mt-1">
            Transform empty rooms into beautifully furnished spaces in seconds
          </p>
        </div>
        <Button
          asChild
          variant="secondary"
          className="shrink-0 relative shadow-lg"
          data-tour="dashboard-stage-cta"
        >
          <Link href="/stage">
            <ImagePlus className="mr-2 h-4 w-4" />
            Stage Photo
          </Link>
        </Button>
      </CardContent>
    </Card>
  );
});
