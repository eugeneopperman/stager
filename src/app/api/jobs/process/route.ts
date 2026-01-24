/**
 * Job Processing Webhook
 *
 * Receives jobs from Upstash QStash and processes them.
 * POST /api/jobs/process
 */

import { NextRequest, NextResponse } from "next/server";
import { Receiver } from "@upstash/qstash";
import { processJob, type ProcessResult } from "@/lib/jobs/processor";
import type { JobPayload } from "@/lib/jobs/queue";

// Create QStash receiver for signature verification
const receiver = new Receiver({
  currentSigningKey: process.env.QSTASH_CURRENT_SIGNING_KEY || "",
  nextSigningKey: process.env.QSTASH_NEXT_SIGNING_KEY || "",
});

export async function POST(request: NextRequest): Promise<NextResponse> {
  // In development, skip signature verification
  const isDev = process.env.NODE_ENV === "development";

  if (!isDev) {
    // Verify the request is from QStash
    const signature = request.headers.get("upstash-signature");
    if (!signature) {
      return NextResponse.json(
        { error: "Missing signature" },
        { status: 401 }
      );
    }

    try {
      const body = await request.text();
      const isValid = await receiver.verify({
        signature,
        body,
      });

      if (!isValid) {
        return NextResponse.json(
          { error: "Invalid signature" },
          { status: 401 }
        );
      }

      // Parse the verified body
      const payload = JSON.parse(body) as JobPayload;
      const result = await processJob(payload);

      return createResponse(result);
    } catch (error) {
      console.error("[Jobs] Signature verification failed:", error);
      return NextResponse.json(
        { error: "Signature verification failed" },
        { status: 401 }
      );
    }
  }

  // Development mode: process without verification
  try {
    const payload = (await request.json()) as JobPayload;
    const result = await processJob(payload);

    return createResponse(result);
  } catch (error) {
    console.error("[Jobs] Failed to process job:", error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}

function createResponse(result: ProcessResult): NextResponse {
  if (result.success) {
    return NextResponse.json({
      success: true,
      duration: result.duration,
    });
  }

  // Return 500 to trigger QStash retry
  return NextResponse.json(
    {
      success: false,
      error: result.error,
      duration: result.duration,
    },
    { status: 500 }
  );
}

// Disable body parsing - we need raw body for signature verification
export const config = {
  api: {
    bodyParser: false,
  },
};
