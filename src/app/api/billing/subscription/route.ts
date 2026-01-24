import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getUserSubscription, getUserPlan, getUserCredits } from "@/lib/billing/subscription";
import { cancelSubscriptionAtPeriodEnd, resumeSubscription } from "@/lib/billing/stripe";
import { validateRequest, subscriptionActionSchema } from "@/lib/schemas";

/**
 * GET /api/billing/subscription
 *
 * Get the current user's subscription status, plan, and credits.
 */
export async function GET(_request: NextRequest) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const [subscription, plan, credits] = await Promise.all([
      getUserSubscription(user.id),
      getUserPlan(user.id),
      getUserCredits(user.id),
    ]);

    return NextResponse.json({
      subscription,
      plan,
      credits,
    });
  } catch (error) {
    console.error("Subscription fetch error:", error);
    return NextResponse.json(
      { error: "Failed to fetch subscription" },
      { status: 500 }
    );
  }
}

/**
 * PATCH /api/billing/subscription
 *
 * Update subscription status (cancel at period end or resume).
 * Body: { action: "cancel" | "resume" }
 */
export async function PATCH(request: NextRequest) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Validate request body
    const body = await request.json();
    const validation = validateRequest(subscriptionActionSchema, body);
    if (!validation.success) {
      return validation.response;
    }

    const { action } = validation.data;

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

    if (action === "cancel") {
      // Cancel at period end
      await cancelSubscriptionAtPeriodEnd(subscription.stripe_subscription_id);

      await supabase
        .from("subscriptions")
        .update({
          cancel_at_period_end: true,
          canceled_at: new Date().toISOString(),
        })
        .eq("user_id", user.id);

      return NextResponse.json({
        success: true,
        message: "Subscription will cancel at period end",
      });
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

      return NextResponse.json({
        success: true,
        message: "Subscription resumed",
      });
    }
  } catch (error) {
    console.error("Subscription update error:", error);
    return NextResponse.json(
      { error: "Failed to update subscription" },
      { status: 500 }
    );
  }
}
