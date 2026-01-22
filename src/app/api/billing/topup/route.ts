import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createTopupCheckout, TopupPackageId, TOPUP_PACKAGES } from "@/lib/stripe";

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
    const { packageId } = body as { packageId: TopupPackageId };

    const pkg = TOPUP_PACKAGES.find((p) => p.id === packageId);
    if (!pkg) {
      return NextResponse.json({ error: "Invalid package" }, { status: 400 });
    }

    // Get user profile for Stripe customer ID and organization
    const { data: profile } = await supabase
      .from("profiles")
      .select("stripe_customer_id, organization_id")
      .eq("id", user.id)
      .single();

    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";

    const session = await createTopupCheckout({
      userId: user.id,
      userEmail: user.email!,
      packageId,
      customerId: profile?.stripe_customer_id || undefined,
      organizationId: profile?.organization_id || undefined,
      successUrl: `${baseUrl}/billing?topup=success&credits=${pkg.credits}`,
      cancelUrl: `${baseUrl}/billing?topup=canceled`,
    });

    return NextResponse.json({ url: session.url });
  } catch (error) {
    console.error("Topup checkout error:", error);
    return NextResponse.json(
      { error: "Failed to create checkout session" },
      { status: 500 }
    );
  }
}
