import { NextRequest, NextResponse } from "next/server";
import { headers } from "next/headers";
import { stripe, getPlanByPriceId, getTopupByPriceId, PLAN_CONFIG } from "@/lib/stripe";
import { createClient, SupabaseClient } from "@supabase/supabase-js";
import Stripe from "stripe";

// Use service role client for webhook operations - lazy initialized
let _supabaseAdmin: SupabaseClient | null = null;
const getSupabaseAdmin = () => {
  if (!_supabaseAdmin) {
    _supabaseAdmin = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );
  }
  return _supabaseAdmin;
};
const supabaseAdmin = new Proxy({} as SupabaseClient, {
  get(_, prop) {
    return (getSupabaseAdmin() as unknown as Record<string, unknown>)[prop as string];
  },
});

export async function POST(request: NextRequest) {
  const body = await request.text();
  const headersList = await headers();
  const signature = headersList.get("stripe-signature");

  if (!signature) {
    return NextResponse.json({ error: "Missing signature" }, { status: 400 });
  }

  let event: Stripe.Event;

  try {
    event = stripe.webhooks.constructEvent(
      body,
      signature,
      process.env.STRIPE_WEBHOOK_SECRET!
    );
  } catch (err) {
    console.error("Webhook signature verification failed:", err);
    return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
  }

  try {
    switch (event.type) {
      case "checkout.session.completed":
        await handleCheckoutCompleted(event.data.object as Stripe.Checkout.Session);
        break;

      case "invoice.paid":
        await handleInvoicePaid(event.data.object as Stripe.Invoice);
        break;

      case "invoice.payment_failed":
        await handlePaymentFailed(event.data.object as Stripe.Invoice);
        break;

      case "customer.subscription.updated":
        await handleSubscriptionUpdated(event.data.object as Stripe.Subscription);
        break;

      case "customer.subscription.deleted":
        await handleSubscriptionDeleted(event.data.object as Stripe.Subscription);
        break;

      case "payment_intent.succeeded":
        await handlePaymentIntentSucceeded(event.data.object as Stripe.PaymentIntent);
        break;

      default:
        console.log(`Unhandled event type: ${event.type}`);
    }

    return NextResponse.json({ received: true });
  } catch (err) {
    console.error(`Error processing webhook ${event.type}:`, err);
    return NextResponse.json(
      { error: "Webhook handler failed" },
      { status: 500 }
    );
  }
}

// Handle checkout.session.completed - new subscription or top-up
async function handleCheckoutCompleted(session: Stripe.Checkout.Session) {
  const userId = session.metadata?.user_id;
  const customerId = session.customer as string;

  if (!userId) {
    console.error("No user_id in checkout session metadata");
    return;
  }

  // Update profile with Stripe customer ID
  await supabaseAdmin
    .from("profiles")
    .update({ stripe_customer_id: customerId })
    .eq("id", userId);

  // Handle subscription checkout
  if (session.mode === "subscription" && session.subscription) {
    const planSlug = session.metadata?.plan_slug;
    if (!planSlug) {
      console.error("No plan_slug in checkout session metadata");
      return;
    }

    // Get plan from database
    const { data: plan } = await supabaseAdmin
      .from("plans")
      .select("*")
      .eq("slug", planSlug)
      .single();

    if (!plan) {
      console.error(`Plan not found: ${planSlug}`);
      return;
    }

    // Get subscription details from Stripe
    const subscription: Stripe.Subscription = await stripe.subscriptions.retrieve(
      session.subscription as string
    );

    // Get period dates from first subscription item
    const firstItem = subscription.items.data[0];
    const periodStart = firstItem?.current_period_start;
    const periodEnd = firstItem?.current_period_end;

    // Create subscription record
    await supabaseAdmin.from("subscriptions").upsert(
      {
        user_id: userId,
        plan_id: plan.id,
        stripe_subscription_id: subscription.id,
        stripe_customer_id: customerId,
        status: "active",
        current_period_start: periodStart
          ? new Date(periodStart * 1000).toISOString()
          : new Date().toISOString(),
        current_period_end: periodEnd
          ? new Date(periodEnd * 1000).toISOString()
          : null,
        cancel_at_period_end: false,
      },
      { onConflict: "user_id" }
    );

    // Update profile with plan
    await supabaseAdmin
      .from("profiles")
      .update({ plan_id: plan.id })
      .eq("id", userId);

    // Allocate credits
    await supabaseAdmin
      .from("profiles")
      .update({
        credits_remaining: plan.credits_per_month,
        credits_reset_at: new Date().toISOString(),
      })
      .eq("id", userId);

    // Log transaction
    await supabaseAdmin.from("credit_transactions").insert({
      user_id: userId,
      transaction_type: "subscription_renewal",
      amount: plan.credits_per_month,
      balance_after: plan.credits_per_month,
      description: `${plan.name} plan subscription started`,
    });

    // Create organization for enterprise plan
    if (planSlug === "enterprise") {
      const { data: profile } = await supabaseAdmin
        .from("profiles")
        .select("full_name, company_name")
        .eq("id", userId)
        .single();

      const orgName = profile?.company_name || `${profile?.full_name || "User"}'s Team`;

      const { data: org } = await supabaseAdmin
        .from("organizations")
        .insert({
          name: orgName,
          owner_id: userId,
          total_credits: plan.credits_per_month,
          unallocated_credits: plan.credits_per_month,
        })
        .select()
        .single();

      if (org) {
        // Add owner as member
        await supabaseAdmin.from("organization_members").insert({
          organization_id: org.id,
          user_id: userId,
          role: "owner",
          allocated_credits: plan.credits_per_month,
          joined_at: new Date().toISOString(),
        });

        // Update subscription with org reference
        await supabaseAdmin
          .from("subscriptions")
          .update({ id: org.id })
          .eq("user_id", userId);

        // Update profile with org
        await supabaseAdmin
          .from("profiles")
          .update({ organization_id: org.id })
          .eq("id", userId);
      }
    }

    console.log(`Subscription created for user ${userId}, plan ${planSlug}`);
  }

  // Handle one-time payment (top-up)
  if (session.mode === "payment") {
    const packageId = session.metadata?.package_id;
    const credits = parseInt(session.metadata?.credits || "0", 10);

    if (!packageId || !credits) {
      console.error("Missing top-up metadata");
      return;
    }

    // Get current credits
    const { data: profile } = await supabaseAdmin
      .from("profiles")
      .select("credits_remaining")
      .eq("id", userId)
      .single();

    const currentCredits = profile?.credits_remaining || 0;
    const newBalance = currentCredits + credits;

    // Add credits to profile
    await supabaseAdmin
      .from("profiles")
      .update({ credits_remaining: newBalance })
      .eq("id", userId);

    // Create top-up record
    await supabaseAdmin.from("credit_topups").insert({
      user_id: userId,
      stripe_checkout_session_id: session.id,
      credits_purchased: credits,
      amount_cents: session.amount_total || 0,
      status: "completed",
      completed_at: new Date().toISOString(),
    });

    // Log transaction
    await supabaseAdmin.from("credit_transactions").insert({
      user_id: userId,
      transaction_type: "topup_purchase",
      amount: credits,
      balance_after: newBalance,
      description: `Purchased ${credits} credits`,
    });

    console.log(`Top-up completed for user ${userId}, ${credits} credits`);
  }
}

// Handle invoice.paid - subscription renewal
async function handleInvoicePaid(invoice: Stripe.Invoice) {
  // Skip if this is the first invoice (handled by checkout.session.completed)
  if (invoice.billing_reason === "subscription_create") {
    return;
  }

  // Get subscription ID from invoice's parent details
  const subscriptionId =
    (invoice.parent?.subscription_details?.subscription as string) ||
    ((invoice as unknown as { subscription?: string }).subscription as string);
  if (!subscriptionId) return;

  // Get subscription from Stripe
  const subscription = await stripe.subscriptions.retrieve(subscriptionId);
  const userId = subscription.metadata?.user_id;

  if (!userId) {
    console.error("No user_id in subscription metadata");
    return;
  }

  // Get plan from price ID
  const priceId = subscription.items.data[0]?.price?.id;
  const planSlug = priceId ? getPlanByPriceId(priceId) : null;

  if (!planSlug) {
    console.error("Could not determine plan from subscription");
    return;
  }

  const planConfig = PLAN_CONFIG[planSlug];

  // Get period dates from first subscription item
  const firstItem = subscription.items.data[0];
  const periodStart = firstItem?.current_period_start;
  const periodEnd = firstItem?.current_period_end;

  // Update subscription period
  await supabaseAdmin
    .from("subscriptions")
    .update({
      status: "active",
      current_period_start: periodStart
        ? new Date(periodStart * 1000).toISOString()
        : new Date().toISOString(),
      current_period_end: periodEnd
        ? new Date(periodEnd * 1000).toISOString()
        : null,
    })
    .eq("stripe_subscription_id", subscriptionId);

  // Check if user has organization (enterprise)
  const { data: org } = await supabaseAdmin
    .from("organizations")
    .select("*")
    .eq("owner_id", userId)
    .single();

  if (org) {
    // Reset organization credits
    await supabaseAdmin
      .from("organizations")
      .update({
        total_credits: planConfig.credits,
        unallocated_credits: planConfig.credits,
      })
      .eq("id", org.id);

    // Reset member usage
    await supabaseAdmin
      .from("organization_members")
      .update({ credits_used_this_period: 0 })
      .eq("organization_id", org.id);
  } else {
    // Reset personal credits
    await supabaseAdmin
      .from("profiles")
      .update({
        credits_remaining: planConfig.credits,
        credits_reset_at: new Date().toISOString(),
      })
      .eq("id", userId);
  }

  // Log transaction
  await supabaseAdmin.from("credit_transactions").insert({
    user_id: userId,
    organization_id: org?.id,
    transaction_type: "subscription_renewal",
    amount: planConfig.credits,
    balance_after: planConfig.credits,
    description: `Monthly credit reset - ${planSlug} plan`,
  });

  console.log(`Credits reset for user ${userId}, ${planConfig.credits} credits`);
}

// Handle invoice.payment_failed
async function handlePaymentFailed(invoice: Stripe.Invoice) {
  const subscriptionId =
    (invoice.parent?.subscription_details?.subscription as string) ||
    ((invoice as unknown as { subscription?: string }).subscription as string);
  if (!subscriptionId) return;

  await supabaseAdmin
    .from("subscriptions")
    .update({ status: "past_due" })
    .eq("stripe_subscription_id", subscriptionId);

  console.log(`Subscription ${subscriptionId} marked as past_due`);
}

// Handle customer.subscription.updated
async function handleSubscriptionUpdated(subscription: Stripe.Subscription) {
  const userId = subscription.metadata?.user_id;
  if (!userId) return;

  // Get new plan from price ID
  const priceId = subscription.items.data[0]?.price?.id;
  const newPlanSlug = priceId ? getPlanByPriceId(priceId) : null;

  // Get plan from database
  const { data: plan } = await supabaseAdmin
    .from("plans")
    .select("*")
    .eq("slug", newPlanSlug)
    .single();

  // Get period dates from first subscription item
  const firstItem = subscription.items.data[0];
  const periodStart = firstItem?.current_period_start;
  const periodEnd = firstItem?.current_period_end;

  // Update subscription
  await supabaseAdmin
    .from("subscriptions")
    .update({
      plan_id: plan?.id,
      status: subscription.cancel_at_period_end ? "canceled" : "active",
      cancel_at_period_end: subscription.cancel_at_period_end,
      canceled_at: subscription.canceled_at
        ? new Date(subscription.canceled_at * 1000).toISOString()
        : null,
      current_period_start: periodStart
        ? new Date(periodStart * 1000).toISOString()
        : new Date().toISOString(),
      current_period_end: periodEnd
        ? new Date(periodEnd * 1000).toISOString()
        : null,
    })
    .eq("stripe_subscription_id", subscription.id);

  // Update profile plan
  if (plan) {
    await supabaseAdmin
      .from("profiles")
      .update({ plan_id: plan.id })
      .eq("id", userId);
  }

  console.log(`Subscription ${subscription.id} updated`);
}

// Handle customer.subscription.deleted - downgrade to free
async function handleSubscriptionDeleted(subscription: Stripe.Subscription) {
  const userId = subscription.metadata?.user_id;
  if (!userId) return;

  // Get free plan
  const { data: freePlan } = await supabaseAdmin
    .from("plans")
    .select("*")
    .eq("slug", "free")
    .single();

  // Update subscription status
  await supabaseAdmin
    .from("subscriptions")
    .update({ status: "canceled" })
    .eq("stripe_subscription_id", subscription.id);

  // Downgrade to free plan
  if (freePlan) {
    await supabaseAdmin
      .from("profiles")
      .update({
        plan_id: freePlan.id,
        credits_remaining: freePlan.credits_per_month,
      })
      .eq("id", userId);
  }

  // Remove organization if enterprise
  const { data: org } = await supabaseAdmin
    .from("organizations")
    .select("*")
    .eq("owner_id", userId)
    .single();

  if (org) {
    // Note: We keep the org but clear credits
    await supabaseAdmin
      .from("organizations")
      .update({ total_credits: 0, unallocated_credits: 0 })
      .eq("id", org.id);
  }

  console.log(`Subscription ${subscription.id} deleted, user ${userId} downgraded to free`);
}

// Handle payment_intent.succeeded - for top-ups processed differently
async function handlePaymentIntentSucceeded(paymentIntent: Stripe.PaymentIntent) {
  // Top-ups are typically handled via checkout.session.completed
  // This is here for any direct payment intents
  console.log(`Payment intent ${paymentIntent.id} succeeded`);
}
