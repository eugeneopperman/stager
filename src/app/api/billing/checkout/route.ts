import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createSubscriptionCheckout } from "@/lib/billing/stripe";
import { validateRequest, checkoutRequestSchema } from "@/lib/schemas";
import { rateLimiters, getRateLimitHeaders, getClientIdentifier } from "@/lib/rate-limit";
import { logBillingEvent, AuditEventType } from "@/lib/audit/audit-log.service";

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Rate limiting - sensitive financial operation
    const rateLimitResult = rateLimiters.sensitive(getClientIdentifier(request, user.id));
    if (!rateLimitResult.allowed) {
      return NextResponse.json(
        { error: "Too many checkout attempts. Please wait before trying again." },
        { status: 429, headers: getRateLimitHeaders(rateLimitResult) }
      );
    }

    // Validate request body
    const body = await request.json();
    const validation = validateRequest(checkoutRequestSchema, body);
    if (!validation.success) {
      return validation.response;
    }

    const { planSlug } = validation.data;

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

    // Audit log: checkout session created
    await logBillingEvent(supabase, {
      userId: user.id,
      eventType: AuditEventType.BILLING_CHECKOUT_CREATED,
      resourceId: session.id,
      action: "created",
      newValues: {
        planSlug,
        sessionId: session.id,
      },
      request,
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
