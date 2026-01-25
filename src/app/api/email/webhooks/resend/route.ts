import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import crypto from "crypto";

// Resend webhook events
type ResendWebhookEvent =
  | "email.sent"
  | "email.delivered"
  | "email.delivery_delayed"
  | "email.complained"
  | "email.bounced"
  | "email.opened"
  | "email.clicked";

interface ResendWebhookPayload {
  type: ResendWebhookEvent;
  created_at: string;
  data: {
    email_id: string;
    from: string;
    to: string[];
    subject: string;
    created_at: string;
    // For clicks
    click?: {
      link: string;
      timestamp: string;
    };
    // For bounces
    bounce?: {
      message: string;
    };
  };
}

// Create admin client for webhook processing
function getAdminClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !supabaseServiceKey) {
    throw new Error("Supabase configuration missing");
  }

  return createClient(supabaseUrl, supabaseServiceKey);
}

// Verify Resend webhook signature
function verifyResendSignature(
  payload: string,
  signature: string,
  secret: string
): boolean {
  try {
    const [timestampPart, signaturePart] = signature.split(",");
    const timestamp = timestampPart.replace("t=", "");
    const sig = signaturePart.replace("v1=", "");

    const signedPayload = `${timestamp}.${payload}`;
    const expectedSignature = crypto
      .createHmac("sha256", secret)
      .update(signedPayload)
      .digest("hex");

    return crypto.timingSafeEqual(
      Buffer.from(sig),
      Buffer.from(expectedSignature)
    );
  } catch {
    return false;
  }
}

// POST /api/email/webhooks/resend - Handle Resend delivery webhooks
export async function POST(request: NextRequest) {
  try {
    const body = await request.text();
    const signature = request.headers.get("resend-signature");
    const webhookSecret = process.env.RESEND_WEBHOOK_SECRET;

    // Verify signature if secret is configured
    if (webhookSecret && signature) {
      const isValid = verifyResendSignature(body, signature, webhookSecret);
      if (!isValid) {
        console.error("Invalid Resend webhook signature");
        return NextResponse.json(
          { error: "Invalid signature" },
          { status: 401 }
        );
      }
    }

    const payload: ResendWebhookPayload = JSON.parse(body);
    const { type, data } = payload;

    // Map Resend event types to our status values
    const statusMap: Record<ResendWebhookEvent, string> = {
      "email.sent": "sent",
      "email.delivered": "delivered",
      "email.delivery_delayed": "sent", // Keep as sent
      "email.complained": "complained",
      "email.bounced": "bounced",
      "email.opened": "opened",
      "email.clicked": "clicked",
    };

    const newStatus = statusMap[type];
    if (!newStatus) {
      console.log(`Unhandled Resend event type: ${type}`);
      return NextResponse.json({ received: true });
    }

    const supabase = getAdminClient();

    // Find the email send record by Resend ID
    const { data: emailSend, error: findError } = await supabase
      .from("email_sends")
      .select("id, status")
      .eq("resend_id", data.email_id)
      .single();

    if (findError || !emailSend) {
      // Email not found in our records - might be from a different system
      console.log(`Email send not found for Resend ID: ${data.email_id}`);
      return NextResponse.json({ received: true });
    }

    // Build update object based on event type
    const updates: Record<string, string> = { status: newStatus };

    switch (type) {
      case "email.delivered":
        updates.delivered_at = new Date().toISOString();
        break;
      case "email.opened":
        updates.opened_at = new Date().toISOString();
        break;
      case "email.clicked":
        updates.clicked_at = new Date().toISOString();
        break;
      case "email.bounced":
        updates.bounced_at = new Date().toISOString();
        break;
    }

    // Only update if the new status is "higher" than current
    // Status progression: pending -> sent -> delivered -> opened -> clicked
    const statusOrder = ["pending", "sent", "delivered", "opened", "clicked", "bounced", "complained"];
    const currentIndex = statusOrder.indexOf(emailSend.status);
    const newIndex = statusOrder.indexOf(newStatus);

    // Special handling: bounced/complained should always update
    const shouldUpdate =
      newStatus === "bounced" ||
      newStatus === "complained" ||
      newIndex > currentIndex;

    if (shouldUpdate) {
      const { error: updateError } = await supabase
        .from("email_sends")
        .update(updates)
        .eq("id", emailSend.id);

      if (updateError) {
        console.error("Error updating email send:", updateError);
      }
    }

    // Handle bounces - mark user preferences to prevent future sends
    if (type === "email.bounced") {
      const toEmail = data.to[0];
      if (toEmail) {
        // Find user by email and disable notifications
        const { data: profile } = await supabase
          .from("profiles")
          .select("id")
          .eq("email", toEmail)
          .single();

        if (profile) {
          console.log(`Email bounced for user ${profile.id}, disabling notifications`);
          // You might want to disable notifications or flag the account
        }
      }
    }

    // Handle complaints (spam reports) - unsubscribe the user
    if (type === "email.complained") {
      const toEmail = data.to[0];
      if (toEmail) {
        const { data: profile } = await supabase
          .from("profiles")
          .select("id")
          .eq("email", toEmail)
          .single();

        if (profile) {
          console.log(`Spam complaint from user ${profile.id}, unsubscribing`);
          await supabase
            .from("email_preferences")
            .update({
              marketing_emails: false,
              product_updates: false,
              weekly_digest: false,
              unsubscribed_at: new Date().toISOString(),
            })
            .eq("user_id", profile.id);
        }
      }
    }

    return NextResponse.json({ received: true });
  } catch (error) {
    console.error("Error processing Resend webhook:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
