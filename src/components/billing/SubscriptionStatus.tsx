"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { CreditCard, Calendar, ExternalLink, Loader2, AlertTriangle } from "lucide-react";
import type { SubscriptionWithPlan } from "@/lib/database.types";

interface SubscriptionStatusProps {
  subscription: SubscriptionWithPlan | null;
  hasStripeCustomer: boolean;
}

export function SubscriptionStatus({ subscription, hasStripeCustomer }: SubscriptionStatusProps) {
  const router = useRouter();
  const [isLoadingPortal, setIsLoadingPortal] = useState(false);
  const [isLoadingCancel, setIsLoadingCancel] = useState(false);

  const handleManageBilling = async () => {
    setIsLoadingPortal(true);

    try {
      const response = await fetch("/api/billing/portal", {
        method: "POST",
      });

      const data = await response.json();

      if (data.url) {
        window.location.href = data.url;
      } else {
        console.error("No portal URL returned");
        setIsLoadingPortal(false);
      }
    } catch (error) {
      console.error("Error creating portal session:", error);
      setIsLoadingPortal(false);
    }
  };

  const handleCancelSubscription = async () => {
    setIsLoadingCancel(true);

    try {
      const response = await fetch("/api/billing/subscription/cancel", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ cancel: !subscription?.cancel_at_period_end }),
      });

      if (response.ok) {
        router.refresh();
      }
    } catch (error) {
      console.error("Error updating subscription:", error);
    } finally {
      setIsLoadingCancel(false);
    }
  };

  const formatDate = (dateString: string | null) => {
    if (!dateString) return "N/A";
    return new Date(dateString).toLocaleDateString("en-US", {
      month: "long",
      day: "numeric",
      year: "numeric",
    });
  };

  if (!subscription || subscription.plan.slug === "free") {
    return null;
  }

  const isPastDue = subscription.status === "past_due";
  const isCanceling = subscription.cancel_at_period_end;

  return (
    <Card className={isPastDue ? "border-red-500" : isCanceling ? "border-amber-500" : ""}>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <CreditCard className="h-5 w-5" />
              {subscription.plan.name} Plan
            </CardTitle>
            <CardDescription>
              Your current subscription details
            </CardDescription>
          </div>
          <Badge
            variant={isPastDue ? "destructive" : isCanceling ? "outline" : "default"}
            className={isCanceling && !isPastDue ? "border-amber-500 text-amber-600" : ""}
          >
            {isPastDue ? "Past Due" : isCanceling ? "Canceling" : "Active"}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {isPastDue && (
          <div className="flex items-center gap-2 p-3 bg-red-50 dark:bg-red-950/30 rounded-lg text-red-600">
            <AlertTriangle className="h-5 w-5" />
            <span className="text-sm">Payment failed. Please update your payment method.</span>
          </div>
        )}

        {isCanceling && !isPastDue && (
          <div className="flex items-center gap-2 p-3 bg-amber-50 dark:bg-amber-950/30 rounded-lg text-amber-600">
            <AlertTriangle className="h-5 w-5" />
            <span className="text-sm">
              Your subscription will end on {formatDate(subscription.current_period_end)}.
              You can resume anytime before then.
            </span>
          </div>
        )}

        <div className="grid gap-4 md:grid-cols-2">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-blue-100 dark:bg-blue-950">
              <Calendar className="h-4 w-4 text-blue-600" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Current Period</p>
              <p className="font-medium">
                {formatDate(subscription.current_period_start)} - {formatDate(subscription.current_period_end)}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-green-100 dark:bg-green-950">
              <CreditCard className="h-4 w-4 text-green-600" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Monthly Price</p>
              <p className="font-medium">${(subscription.plan.price_cents / 100).toFixed(2)}/month</p>
            </div>
          </div>
        </div>

        <div className="flex gap-3 pt-2">
          {hasStripeCustomer && (
            <Button
              variant="outline"
              onClick={handleManageBilling}
              disabled={isLoadingPortal}
            >
              {isLoadingPortal ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <ExternalLink className="mr-2 h-4 w-4" />
              )}
              Manage Billing
            </Button>
          )}

          {isCanceling ? (
            <Button
              variant="default"
              onClick={handleCancelSubscription}
              disabled={isLoadingCancel}
            >
              {isLoadingCancel ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                "Resume Subscription"
              )}
            </Button>
          ) : (
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button variant="outline" className="text-red-600 hover:text-red-700">
                  Cancel Subscription
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Cancel Subscription?</AlertDialogTitle>
                  <AlertDialogDescription>
                    Your subscription will remain active until {formatDate(subscription.current_period_end)}.
                    After that, you'll be downgraded to the Free plan with 5 credits per month.
                    You can resume your subscription anytime before the period ends.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Keep Subscription</AlertDialogCancel>
                  <AlertDialogAction
                    onClick={handleCancelSubscription}
                    className="bg-red-600 hover:bg-red-700"
                  >
                    {isLoadingCancel ? (
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    ) : null}
                    Cancel Subscription
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
