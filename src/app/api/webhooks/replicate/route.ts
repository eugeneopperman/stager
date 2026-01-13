import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import crypto from "crypto";
import { CREDITS_PER_STAGING } from "@/lib/constants";

/**
 * Replicate webhook payload structure
 */
interface ReplicateWebhookPayload {
  id: string;
  status: "starting" | "processing" | "succeeded" | "failed" | "canceled";
  output?: string[] | null;
  error?: string | null;
  metrics?: {
    predict_time?: number;
  };
}

/**
 * Verify Replicate webhook signature
 * https://replicate.com/docs/webhooks#verifying-webhooks
 */
function verifyWebhookSignature(
  payload: string,
  signature: string | null,
  webhookSecret: string
): boolean {
  if (!signature || !webhookSecret) {
    // If no secret configured, skip verification (development mode)
    console.warn("Webhook signature verification skipped - no secret configured");
    return true;
  }

  const expectedSignature = crypto
    .createHmac("sha256", webhookSecret)
    .update(payload)
    .digest("hex");

  return crypto.timingSafeEqual(
    Buffer.from(signature),
    Buffer.from(`sha256=${expectedSignature}`)
  );
}

/**
 * POST /api/webhooks/replicate
 *
 * Receives completion callbacks from Replicate API.
 * Updates staging job status and downloads generated image.
 */
export async function POST(request: NextRequest) {
  const startTime = Date.now();

  // Get raw body for signature verification
  const rawBody = await request.text();
  const signature = request.headers.get("webhook-signature");
  const webhookSecret = process.env.REPLICATE_WEBHOOK_SECRET || "";

  // Verify signature
  if (!verifyWebhookSignature(rawBody, signature, webhookSecret)) {
    console.error("Invalid webhook signature");
    return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
  }

  // Parse payload
  let payload: ReplicateWebhookPayload;
  try {
    payload = JSON.parse(rawBody);
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  console.log(`Replicate webhook received: ${payload.id} - ${payload.status}`);

  // Use service role client for webhook processing
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !supabaseServiceKey) {
    console.error("Missing Supabase configuration");
    return NextResponse.json({ error: "Server configuration error" }, { status: 500 });
  }

  const supabase = createClient(supabaseUrl, supabaseServiceKey);

  // Find the staging job by prediction ID
  const { data: job, error: findError } = await supabase
    .from("staging_jobs")
    .select("*")
    .eq("replicate_prediction_id", payload.id)
    .single();

  if (findError || !job) {
    console.error(`Job not found for prediction ${payload.id}:`, findError);
    // Return 200 to prevent retries for unknown predictions
    return NextResponse.json({ message: "Job not found, ignoring" }, { status: 200 });
  }

  // Handle different statuses
  if (payload.status === "succeeded" && payload.output && payload.output.length > 0) {
    // Success - download and store the generated image
    try {
      const outputUrl = payload.output[0];
      const processingTimeMs = payload.metrics?.predict_time
        ? Math.round(payload.metrics.predict_time * 1000)
        : Date.now() - new Date(job.created_at).getTime();

      // Download the generated image
      const imageResponse = await fetch(outputUrl);
      if (!imageResponse.ok) {
        throw new Error(`Failed to download image: ${imageResponse.status}`);
      }

      const imageBuffer = await imageResponse.arrayBuffer();
      const mimeType = imageResponse.headers.get("content-type") || "image/png";
      const ext = mimeType.split("/")[1] || "png";

      // Upload to Supabase Storage
      const stagedFileName = `${job.user_id}/${job.id}-staged.${ext}`;
      const { error: uploadError } = await supabase.storage
        .from("staging-images")
        .upload(stagedFileName, imageBuffer, {
          contentType: mimeType,
          upsert: true,
        });

      if (uploadError) {
        console.error("Failed to upload staged image:", uploadError);
        throw uploadError;
      }

      // Get public URL
      const { data: publicUrlData } = supabase.storage
        .from("staging-images")
        .getPublicUrl(stagedFileName);

      // Update job as completed
      await supabase
        .from("staging_jobs")
        .update({
          status: "completed",
          staged_image_url: publicUrlData.publicUrl,
          completed_at: new Date().toISOString(),
          processing_time_ms: processingTimeMs,
        })
        .eq("id", job.id);

      // Deduct credits
      await supabase.rpc("deduct_credits", {
        user_id: job.user_id,
        amount: CREDITS_PER_STAGING,
      });

      // Fallback if RPC doesn't exist - direct update
      const { data: profile } = await supabase
        .from("profiles")
        .select("credits_remaining")
        .eq("id", job.user_id)
        .single();

      if (profile) {
        await supabase
          .from("profiles")
          .update({
            credits_remaining: Math.max(0, profile.credits_remaining - CREDITS_PER_STAGING),
          })
          .eq("id", job.user_id);
      }

      console.log(`Job ${job.id} completed successfully in ${processingTimeMs}ms`);
    } catch (error) {
      console.error(`Failed to process successful prediction ${payload.id}:`, error);

      // Mark as failed
      await supabase
        .from("staging_jobs")
        .update({
          status: "failed",
          error_message: error instanceof Error ? error.message : "Failed to process result",
          completed_at: new Date().toISOString(),
          processing_time_ms: Date.now() - startTime,
        })
        .eq("id", job.id);
    }
  } else if (payload.status === "failed" || payload.status === "canceled") {
    // Failed - update job status
    await supabase
      .from("staging_jobs")
      .update({
        status: "failed",
        error_message: payload.error || `Prediction ${payload.status}`,
        completed_at: new Date().toISOString(),
        processing_time_ms: Date.now() - new Date(job.created_at).getTime(),
      })
      .eq("id", job.id);

    console.log(`Job ${job.id} failed: ${payload.error || payload.status}`);
  }
  // Ignore "starting" and "processing" statuses - they're intermediate

  return NextResponse.json({ success: true });
}
