import { render } from "@react-email/components";
import { SupabaseClient } from "@supabase/supabase-js";
import { getResendClient, EMAIL_CONFIG, EmailType, TemplateId } from "./client";
import { checkEmailPreferences, EmailCategory } from "./preferences";

interface SendEmailParams {
  to: string;
  subject: string;
  template: React.ReactElement;
  templateId: TemplateId;
  emailType: EmailType;
  userId?: string;
  enrollmentId?: string;
  metadata?: Record<string, unknown>;
  tags?: { name: string; value: string }[];
}

interface SendEmailResult {
  success: boolean;
  resendId?: string;
  emailSendId?: string;
  error?: string;
}

/**
 * Send an email using React Email templates
 */
export async function sendEmail(
  supabase: SupabaseClient,
  params: SendEmailParams
): Promise<SendEmailResult> {
  const {
    to,
    subject,
    template,
    templateId,
    emailType,
    userId,
    enrollmentId,
    metadata = {},
    tags = [],
  } = params;

  // Check email preferences if user ID is provided
  if (userId) {
    const category = getEmailCategory(templateId);
    if (category) {
      const canSend = await checkEmailPreferences(supabase, userId, category);
      if (!canSend) {
        return {
          success: false,
          error: `User has opted out of ${category} emails`,
        };
      }
    }
  }

  // Create email send record
  let emailSendId: string | undefined;
  if (userId) {
    const { data: emailSend, error: insertError } = await supabase
      .from("email_sends")
      .insert({
        user_id: userId,
        enrollment_id: enrollmentId,
        email_type: emailType,
        template_id: templateId,
        subject,
        to_email: to,
        status: "pending",
        metadata,
      })
      .select("id")
      .single();

    if (insertError) {
      console.error("Error creating email send record:", insertError);
    } else {
      emailSendId = emailSend?.id;
    }
  }

  try {
    // Render the template to HTML
    const html = await render(template);
    const text = await render(template, { plainText: true });

    // Send via Resend
    const resend = getResendClient();
    const { data, error } = await resend.emails.send({
      from: EMAIL_CONFIG.fromEmail,
      to,
      subject,
      html,
      text,
      replyTo: EMAIL_CONFIG.replyTo,
      tags: [
        { name: "template", value: templateId },
        { name: "type", value: emailType },
        ...tags,
      ],
    });

    if (error) {
      // Update email send record with failure
      if (emailSendId) {
        await supabase
          .from("email_sends")
          .update({
            status: "failed",
            metadata: { ...metadata, error: error.message },
          })
          .eq("id", emailSendId);
      }

      console.error("Error sending email:", error);
      return {
        success: false,
        emailSendId,
        error: error.message,
      };
    }

    // Update email send record with success
    if (emailSendId) {
      await supabase
        .from("email_sends")
        .update({
          resend_id: data?.id,
          status: "sent",
          sent_at: new Date().toISOString(),
        })
        .eq("id", emailSendId);
    }

    return {
      success: true,
      resendId: data?.id,
      emailSendId,
    };
  } catch (err) {
    const errorMessage = err instanceof Error ? err.message : "Unknown error";

    // Update email send record with failure
    if (emailSendId) {
      await supabase
        .from("email_sends")
        .update({
          status: "failed",
          metadata: { ...metadata, error: errorMessage },
        })
        .eq("id", emailSendId);
    }

    console.error("Error rendering/sending email:", err);
    return {
      success: false,
      emailSendId,
      error: errorMessage,
    };
  }
}

/**
 * Map template IDs to email preference categories
 */
function getEmailCategory(templateId: TemplateId): EmailCategory | null {
  const { templates } = EMAIL_CONFIG;
  const id = templateId as string;

  // Transactional emails - always sent (except staging notifications)
  const alwaysSend: string[] = [
    templates.PAYMENT_SUCCESS,
    templates.PAYMENT_FAILED,
    templates.TEAM_INVITATION,
    templates.TEAM_WELCOME,
    templates.SUBSCRIPTION_CANCELLED,
  ];
  if (alwaysSend.includes(id)) {
    return null; // No preference check needed
  }

  // Staging notifications
  const stagingTemplates: string[] = [
    templates.STAGING_COMPLETE,
    templates.STAGING_FAILED,
    templates.CREDIT_LOW,
  ];
  if (stagingTemplates.includes(id)) {
    return "staging_notifications";
  }

  // Team notifications (already covered in alwaysSend, but keeping for clarity)
  const teamTemplates: string[] = [templates.TEAM_INVITATION, templates.TEAM_WELCOME];
  if (teamTemplates.includes(id)) {
    return "team_notifications";
  }

  // Onboarding (marketing)
  const onboardingTemplates: string[] = [
    templates.WELCOME,
    templates.FIRST_STAGING,
    templates.TIPS,
    templates.CHECK_IN,
  ];
  if (onboardingTemplates.includes(id)) {
    return "marketing_emails";
  }

  // Re-engagement (marketing)
  const reengagementTemplates: string[] = [
    templates.MISS_YOU,
    templates.NEW_FEATURES,
    templates.SPECIAL_OFFER,
  ];
  if (reengagementTemplates.includes(id)) {
    return "marketing_emails";
  }

  // Weekly digest
  if (id === templates.WEEKLY_DIGEST) {
    return "weekly_digest";
  }

  return null;
}

/**
 * Batch send emails to multiple users
 */
export async function sendBatchEmails(
  supabase: SupabaseClient,
  recipients: Array<{
    userId: string;
    email: string;
    data: Record<string, unknown>;
  }>,
  createTemplate: (data: Record<string, unknown>) => React.ReactElement,
  templateId: TemplateId,
  emailType: EmailType,
  subject: string | ((data: Record<string, unknown>) => string)
): Promise<{ sent: number; failed: number; skipped: number }> {
  let sent = 0;
  let failed = 0;
  let skipped = 0;

  for (const recipient of recipients) {
    const emailSubject =
      typeof subject === "function" ? subject(recipient.data) : subject;

    const result = await sendEmail(supabase, {
      to: recipient.email,
      subject: emailSubject,
      template: createTemplate(recipient.data),
      templateId,
      emailType,
      userId: recipient.userId,
      metadata: recipient.data,
    });

    if (result.success) {
      sent++;
    } else if (result.error?.includes("opted out")) {
      skipped++;
    } else {
      failed++;
    }
  }

  return { sent, failed, skipped };
}
