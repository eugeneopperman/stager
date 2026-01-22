"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { PlanCard } from "./PlanCard";
import type { Plan } from "@/lib/database.types";

interface PricingTableProps {
  plans: Plan[];
  currentPlanSlug?: string;
}

export function PricingTable({ plans, currentPlanSlug }: PricingTableProps) {
  const router = useRouter();
  const [loadingPlan, setLoadingPlan] = useState<string | null>(null);

  const handleSelectPlan = async (plan: Plan) => {
    if (plan.slug === "free") {
      // Can't downgrade to free through checkout
      return;
    }

    setLoadingPlan(plan.slug);

    try {
      const response = await fetch("/api/billing/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ planSlug: plan.slug }),
      });

      const data = await response.json();

      if (data.url) {
        window.location.href = data.url;
      } else {
        console.error("No checkout URL returned");
        setLoadingPlan(null);
      }
    } catch (error) {
      console.error("Error creating checkout:", error);
      setLoadingPlan(null);
    }
  };

  return (
    <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4 items-start">
      {plans.map((plan) => (
        <PlanCard
          key={plan.id}
          plan={plan}
          currentPlanSlug={currentPlanSlug}
          isLoading={loadingPlan === plan.slug}
          onSelect={handleSelectPlan}
        />
      ))}
    </div>
  );
}
