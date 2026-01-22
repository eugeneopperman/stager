import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getUserSubscription, getUserPlan, getUserCredits } from "@/lib/subscription";

export async function GET(request: NextRequest) {
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
