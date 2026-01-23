import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createSubscriptionCheckout, PlanSlug, PLAN_CONFIG } from "@/lib/billing/stripe";

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
    const { planSlug } = body as { planSlug: PlanSlug };

    if (!planSlug || !PLAN_CONFIG[planSlug]) {
      return NextResponse.json({ error: "Invalid plan" }, { status: 400 });
    }

    if (planSlug === "free") {
      return NextResponse.json(
        { error: "Cannot checkout for free plan" },
        { status: 400 }
      );
    }

    // Get user profile for Stripe customer ID
    const { data: profile } = await supabase
      .from("profiles")
      .select("stripe_customer_id")
      .eq("id", user.id)
      .single();

    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";

    const session = await createSubscriptionCheckout({
      userId: user.id,
      userEmail: user.email!,
      planSlug,
      customerId: profile?.stripe_customer_id || undefined,
      successUrl: `${baseUrl}/billing?success=true&plan=${planSlug}`,
      cancelUrl: `${baseUrl}/billing?canceled=true`,
    });

    return NextResponse.json({ url: session.url });
  } catch (error) {
    console.error("Checkout error:", error);
    return NextResponse.json(
      { error: "Failed to create checkout session" },
      { status: 500 }
    );
  }
}
