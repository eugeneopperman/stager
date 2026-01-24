/**
 * Webhook signature validation utilities
 */

import crypto from "crypto";

/**
 * Validate Replicate webhook signature
 *
 * Replicate signs webhooks using HMAC-SHA256 with the webhook secret.
 * The signature is sent in the `webhook-signature` header.
 *
 * @see https://replicate.com/docs/webhooks#verifying-webhooks
 */
export function validateReplicateWebhook(
  payload: string,
  signature: string | null,
  secret: string | undefined
): { valid: boolean; error?: string } {
  // If no secret configured, skip validation (development mode)
  if (!secret) {
    console.warn("[Webhook] No REPLICATE_WEBHOOK_SECRET configured, skipping validation");
    return { valid: true };
  }

  if (!signature) {
    return { valid: false, error: "Missing webhook-signature header" };
  }

  try {
    // Replicate uses format: t=timestamp,v1=signature
    const parts = signature.split(",");
    const timestampPart = parts.find((p) => p.startsWith("t="));
    const signaturePart = parts.find((p) => p.startsWith("v1="));

    if (!timestampPart || !signaturePart) {
      return { valid: false, error: "Invalid signature format" };
    }

    const timestamp = timestampPart.slice(2);
    const expectedSignature = signaturePart.slice(3);

    // Check timestamp to prevent replay attacks (5 minute tolerance)
    const timestampMs = parseInt(timestamp, 10) * 1000;
    const now = Date.now();
    const tolerance = 5 * 60 * 1000; // 5 minutes

    if (Math.abs(now - timestampMs) > tolerance) {
      return { valid: false, error: "Webhook timestamp too old" };
    }

    // Compute expected signature
    const signedPayload = `${timestamp}.${payload}`;
    const computedSignature = crypto
      .createHmac("sha256", secret)
      .update(signedPayload)
      .digest("hex");

    // Constant-time comparison to prevent timing attacks
    const isValid = crypto.timingSafeEqual(
      Buffer.from(expectedSignature),
      Buffer.from(computedSignature)
    );

    if (!isValid) {
      return { valid: false, error: "Invalid signature" };
    }

    return { valid: true };
  } catch (error) {
    return {
      valid: false,
      error: error instanceof Error ? error.message : "Signature validation failed",
    };
  }
}

/**
 * Validate Stripe webhook signature
 *
 * Uses the official Stripe SDK for validation.
 * This is a wrapper for consistency with other webhook validators.
 *
 * @see https://stripe.com/docs/webhooks/signatures
 */
export async function validateStripeWebhook(
  payload: string | Buffer,
  signature: string | null,
  secret: string | undefined
): Promise<{ valid: boolean; event?: unknown; error?: string }> {
  if (!secret) {
    console.warn("[Webhook] No STRIPE_WEBHOOK_SECRET configured, skipping validation");
    return { valid: true };
  }

  if (!signature) {
    return { valid: false, error: "Missing stripe-signature header" };
  }

  try {
    // Dynamic import to avoid loading Stripe if not used
    const stripe = await import("stripe");
    const stripeClient = new stripe.default(process.env.STRIPE_SECRET_KEY!, {
      apiVersion: "2025-12-15.clover",
    });

    const event = stripeClient.webhooks.constructEvent(
      payload,
      signature,
      secret
    );

    return { valid: true, event };
  } catch (error) {
    return {
      valid: false,
      error: error instanceof Error ? error.message : "Stripe signature validation failed",
    };
  }
}
