"use client";

import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Coins, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { TOPUP_PACKAGES } from "@/lib/billing/stripe";

type TopupPackage = (typeof TOPUP_PACKAGES)[number] & { badge?: string };

interface TopupPacksProps {
  className?: string;
}

export function TopupPacks({ className }: TopupPacksProps) {
  const [loadingPackage, setLoadingPackage] = useState<string | null>(null);

  const handlePurchase = async (packageId: string) => {
    setLoadingPackage(packageId);

    try {
      const response = await fetch("/api/billing/topup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ packageId }),
      });

      const data = await response.json();

      if (data.url) {
        window.location.assign(data.url);
      } else {
        console.error("No checkout URL returned");
        setLoadingPackage(null);
      }
    } catch (error) {
      console.error("Error creating topup checkout:", error);
      setLoadingPackage(null);
    }
  };

  return (
    <div className={cn("grid gap-4 md:grid-cols-3", className)}>
      {(TOPUP_PACKAGES as readonly TopupPackage[]).map((pkg) => (
        <Card
          key={pkg.id}
          className={cn(
            "relative transition-all hover:shadow-md",
            pkg.badge === "Best Value" && "border-green-500",
            pkg.badge === "Popular" && "border-blue-500"
          )}
        >
          {pkg.badge && (
            <Badge
              className={cn(
                "absolute -top-2 left-1/2 -translate-x-1/2",
                pkg.badge === "Best Value" && "bg-green-500",
                pkg.badge === "Popular" && "bg-blue-500"
              )}
            >
              {pkg.badge}
            </Badge>
          )}
          <CardContent className="p-4 pt-6">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <Coins className="h-5 w-5 text-yellow-500" />
                <span className="text-xl font-bold">{pkg.credits}</span>
                <span className="text-muted-foreground">credits</span>
              </div>
              <span className="text-lg font-semibold">{pkg.description}</span>
            </div>

            <Button
              className="w-full"
              variant={pkg.badge ? "default" : "outline"}
              disabled={loadingPackage === pkg.id}
              onClick={() => handlePurchase(pkg.id)}
            >
              {loadingPackage === pkg.id ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Processing...
                </>
              ) : (
                "Buy Now"
              )}
            </Button>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
