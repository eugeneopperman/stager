/**
 * Test Email Endpoint
 *
 * Send test emails to verify templates work correctly.
 * Only available in development or for admin users.
 */

import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getResendClient, EMAIL_CONFIG } from "@/lib/email/client";

// Import templates
import { WelcomeEmail } from "@/lib/email/templates/onboarding/Welcome";
import { StagingCompleteEmail } from "@/lib/email/templates/transactional/StagingComplete";
import { WeeklyDigestEmail } from "@/lib/email/templates/digest/WeeklyDigest";

const TEST_TEMPLATES = {
  welcome: {
    component: WelcomeEmail,
    props: {
      firstName: "Test User",
      credits: 10,
    },
    subject: "Welcome to Stager!",
  },
  "staging-complete": {
    component: StagingCompleteEmail,
    props: {
      firstName: "Test User",
      roomType: "Living Room",
      style: "Modern",
      stagedImageUrl: "https://placehold.co/600x400/7c3aed/white?text=Staged+Photo",
      jobId: "test-job-123",
    },
    subject: "Your staged photo is ready!",
  },
  "weekly-digest": {
    component: WeeklyDigestEmail,
    props: {
      firstName: "Test User",
      stagingsThisWeek: 5,
      stagingsLastWeek: 3,
      creditsRemaining: 15,
      topStyles: ["Modern", "Scandinavian", "Minimalist"],
      newFeature: {
        title: "Batch Staging",
        description: "Stage up to 10 photos at once!",
      },
    },
    subject: "Your weekly staging digest",
  },
} as const;

type TestTemplate = keyof typeof TEST_TEMPLATES;

export async function POST(request: NextRequest) {
  // Check if in development or user is authenticated
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (process.env.NODE_ENV !== "development" && !user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const resend = getResendClient();
  if (!resend) {
    return NextResponse.json(
      { error: "Email service not configured" },
      { status: 500 }
    );
  }

  try {
    const body = await request.json();
    const { template, to } = body as { template: TestTemplate; to: string };

    if (!template || !to) {
      return NextResponse.json(
        { error: "Missing template or to address" },
        { status: 400 }
      );
    }

    const templateConfig = TEST_TEMPLATES[template];
    if (!templateConfig) {
      return NextResponse.json(
        {
          error: `Unknown template: ${template}`,
          available: Object.keys(TEST_TEMPLATES),
        },
        { status: 400 }
      );
    }

    const Component = templateConfig.component;

    const { data, error } = await resend.emails.send({
      from: EMAIL_CONFIG.fromEmail,
      to,
      subject: `[TEST] ${templateConfig.subject}`,
      react: Component(templateConfig.props as never),
    });

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      messageId: data?.id,
      template,
      to,
    });
  } catch (error) {
    console.error("[Email Test] Error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 }
    );
  }
}

export async function GET() {
  return NextResponse.json({
    available: Object.keys(TEST_TEMPLATES),
    usage: "POST with { template: 'welcome', to: 'your@email.com' }",
  });
}
