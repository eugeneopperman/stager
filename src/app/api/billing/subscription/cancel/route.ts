import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { cancelSubscriptionAtPeriodEnd, resumeSubscription } from "@/lib/stripe";

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { cancel } = body as { cancel: boolean };

    // Get user's subscription
    const { data: subscription, error } = await supabase
      .from("subscriptions")
      .select("stripe_subscription_id, cancel_at_period_end")
      .eq("user_id", user.id)
      .single();

    if (error || !subscription?.stripe_subscription_id) {
      return NextResponse.json(
        { error: "No active subscription found" },
        { status: 400 }
      );
    }

    if (cancel) {
      // Cancel at period end
      await cancelSubscriptionAtPeriodEnd(subscription.stripe_subscription_id);

      await supabase
        .from("subscriptions")
        .update({
          cancel_at_period_end: true,
          canceled_at: new Date().toISOString(),
        })
        .eq("user_id", user.id);

      return NextResponse.json({ message: "Subscription will cancel at period end" });
    } else {
      // Resume subscription
      await resumeSubscription(subscription.stripe_subscription_id);

      await supabase
        .from("subscriptions")
        .update({
          cancel_at_period_end: false,
          canceled_at: null,
        })
        .eq("user_id", user.id);

      return NextResponse.json({ message: "Subscription resumed" });
    }
  } catch (error) {
    console.error("Subscription cancel error:", error);
    return NextResponse.json(
      { error: "Failed to update subscription" },
      { status: 500 }
    );
  }
}
