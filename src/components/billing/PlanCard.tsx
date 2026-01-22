"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Check, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import type { Plan } from "@/lib/database.types";

interface PlanCardProps {
  plan: Plan;
  currentPlanSlug?: string;
  isLoading?: boolean;
  onSelect: (plan: Plan) => void;
}

export function PlanCard({ plan, currentPlanSlug, isLoading, onSelect }: PlanCardProps) {
  const isCurrentPlan = currentPlanSlug === plan.slug;
  const isPopular = plan.slug === "professional";
  const isEnterprise = plan.slug === "enterprise";

  const formatPrice = (cents: number) => {
    if (cents === 0) return "Free";
    return `$${(cents / 100).toFixed(0)}`;
  };

  const features = Array.isArray(plan.features) ? plan.features : [];

  return (
    <Card
      className={cn(
        "relative flex flex-col transition-all",
        isPopular && "border-blue-500 shadow-lg scale-105 z-10",
        isEnterprise && "border-purple-500",
        isCurrentPlan && "ring-2 ring-green-500"
      )}
    >
      {isPopular && (
        <Badge className="absolute -top-3 left-1/2 -translate-x-1/2 bg-blue-500">
          Most Popular
        </Badge>
      )}
      {isEnterprise && (
        <Badge className="absolute -top-3 left-1/2 -translate-x-1/2 bg-purple-500">
          For Teams
        </Badge>
      )}
      {isCurrentPlan && (
        <Badge className="absolute -top-3 right-4 bg-green-500">
          Current Plan
        </Badge>
      )}

      <CardHeader className="text-center pb-4">
        <CardTitle className="text-xl">{plan.name}</CardTitle>
        <CardDescription className="min-h-[2.5rem]">{plan.description}</CardDescription>
      </CardHeader>

      <CardContent className="flex flex-col flex-1">
        <div className="text-center mb-6">
          <span className="text-4xl font-bold">{formatPrice(plan.price_cents)}</span>
          {plan.price_cents > 0 && (
            <span className="text-muted-foreground ml-1">/month</span>
          )}
        </div>

        <div className="text-center mb-6">
          <span className="text-2xl font-semibold text-blue-600 dark:text-blue-400">
            {plan.credits_per_month}
          </span>
          <span className="text-muted-foreground ml-2">credits/month</span>
        </div>

        <ul className="space-y-3 mb-6 flex-1">
          {features.map((feature, index) => (
            <li key={index} className="flex items-start gap-2">
              <Check className="h-5 w-5 text-green-500 flex-shrink-0 mt-0.5" />
              <span className="text-sm">{feature}</span>
            </li>
          ))}
        </ul>

        <Button
          className={cn(
            "w-full",
            isPopular && "bg-blue-500 hover:bg-blue-600",
            isEnterprise && "bg-purple-500 hover:bg-purple-600"
          )}
          variant={isCurrentPlan ? "outline" : "default"}
          disabled={isCurrentPlan || isLoading}
          onClick={() => onSelect(plan)}
        >
          {isLoading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Loading...
            </>
          ) : isCurrentPlan ? (
            "Current Plan"
          ) : plan.price_cents === 0 ? (
            "Get Started"
          ) : (
            "Subscribe"
          )}
        </Button>
      </CardContent>
    </Card>
  );
}
