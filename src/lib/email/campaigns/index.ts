import { SupabaseClient } from "@supabase/supabase-js";
import { sendEmail } from "../sender";
import { EMAIL_CONFIG } from "../client";
import { generateUnsubscribeUrl, generatePreferencesUrl } from "../preferences";
import { onboardingCampaign } from "./onboarding";
import { reengagementCampaigns } from "./reengagement";

export interface CampaignStep {
  templateId: string;
  subject: string;
  delayDays: number;
  createTemplate: (data: CampaignTemplateData) => React.ReactElement;
}

export interface CampaignDefinition {
  slug: string;
  name: string;
  steps: CampaignStep[];
  exitConditions?: (supabase: SupabaseClient, userId: string) => Promise<boolean>;
}

export interface CampaignTemplateData {
  firstName: string;
  email: string;
  credits: number;
  appUrl: string;
  unsubscribeUrl: string;
  preferencesUrl: string;
  [key: string]: unknown;
}

// Campaign registry
const campaigns: Record<string, CampaignDefinition> = {
  onboarding: onboardingCampaign,
  "reengagement-7d": reengagementCampaigns["reengagement-7d"],
  "reengagement-14d": reengagementCampaigns["reengagement-14d"],
  "reengagement-30d": reengagementCampaigns["reengagement-30d"],
};

/**
 * Enroll a user in a campaign
 */
export async function enrollInCampaign(
  supabase: SupabaseClient,
  userId: string,
  campaignSlug: string
): Promise<{ success: boolean; enrollmentId?: string; error?: string }> {
  // Get campaign from database
  const { data: campaign, error: campaignError } = await supabase
    .from("email_campaigns")
    .select("id, is_active")
    .eq("slug", campaignSlug)
    .single();

  if (campaignError || !campaign) {
    return { success: false, error: "Campaign not found" };
  }

  if (!campaign.is_active) {
    return { success: false, error: "Campaign is not active" };
  }

  // Check for existing enrollment
  const { data: existing } = await supabase
    .from("campaign_enrollments")
    .select("id, status")
    .eq("user_id", userId)
    .eq("campaign_id", campaign.id)
    .single();

  if (existing) {
    if (existing.status === "active") {
      return { success: false, error: "Already enrolled in campaign" };
    }
    // Re-enroll if previously cancelled or completed
  }

  // Calculate first send time
  const campaignDef = campaigns[campaignSlug];
  const firstStep = campaignDef?.steps[0];
  const nextSendAt = firstStep?.delayDays
    ? new Date(Date.now() + firstStep.delayDays * 24 * 60 * 60 * 1000)
    : new Date();

  // Create enrollment
  const { data: enrollment, error: enrollError } = await supabase
    .from("campaign_enrollments")
    .upsert({
      user_id: userId,
      campaign_id: campaign.id,
      status: "active",
      current_step: 0,
      next_send_at: nextSendAt.toISOString(),
      enrolled_at: new Date().toISOString(),
      completed_at: null,
      cancelled_at: null,
    })
    .select("id")
    .single();

  if (enrollError) {
    console.error("Error enrolling in campaign:", enrollError);
    return { success: false, error: enrollError.message };
  }

  // If first step has no delay, process immediately
  if (firstStep && firstStep.delayDays === 0) {
    await processCampaignStep(supabase, enrollment.id);
  }

  return { success: true, enrollmentId: enrollment.id };
}

/**
 * Process the next step in a campaign enrollment
 */
export async function processCampaignStep(
  supabase: SupabaseClient,
  enrollmentId: string
): Promise<{ success: boolean; completed?: boolean; error?: string }> {
  // Get enrollment with campaign and user data
  const { data: enrollment, error: enrollmentError } = await supabase
    .from("campaign_enrollments")
    .select(`
      *,
      campaign:email_campaigns(slug, name),
      user:profiles(id, email, full_name, credits)
    `)
    .eq("id", enrollmentId)
    .single();

  if (enrollmentError || !enrollment) {
    return { success: false, error: "Enrollment not found" };
  }

  if (enrollment.status !== "active") {
    return { success: false, error: "Enrollment is not active" };
  }

  const campaignSlug = (enrollment.campaign as { slug: string }).slug;
  const campaignDef = campaigns[campaignSlug];

  if (!campaignDef) {
    return { success: false, error: "Campaign definition not found" };
  }

  const user = enrollment.user as {
    id: string;
    email: string;
    full_name: string;
    credits: number;
  };

  // Check exit conditions
  if (campaignDef.exitConditions) {
    const shouldExit = await campaignDef.exitConditions(supabase, user.id);
    if (shouldExit) {
      await completeCampaign(supabase, enrollmentId, "exit_condition");
      return { success: true, completed: true };
    }
  }

  // Get current step
  const currentStep = enrollment.current_step;
  const step = campaignDef.steps[currentStep];

  if (!step) {
    // No more steps, complete campaign
    await completeCampaign(supabase, enrollmentId, "all_steps");
    return { success: true, completed: true };
  }

  // Prepare template data
  const templateData: CampaignTemplateData = {
    firstName: user.full_name?.split(" ")[0] || "there",
    email: user.email,
    credits: user.credits,
    appUrl: EMAIL_CONFIG.appUrl,
    unsubscribeUrl: generateUnsubscribeUrl(user.id, "marketing_emails"),
    preferencesUrl: generatePreferencesUrl(user.id),
  };

  // Send email
  const result = await sendEmail(supabase, {
    to: user.email,
    subject: step.subject,
    template: step.createTemplate(templateData),
    templateId: step.templateId as typeof EMAIL_CONFIG.templates[keyof typeof EMAIL_CONFIG.templates],
    emailType: EMAIL_CONFIG.types.CAMPAIGN,
    userId: user.id,
    enrollmentId,
  });

  if (!result.success) {
    // Don't fail the campaign step, just log and continue
    console.error(`Campaign email failed for ${enrollmentId}:`, result.error);
  }

  // Move to next step
  const nextStep = currentStep + 1;
  const nextStepDef = campaignDef.steps[nextStep];

  if (!nextStepDef) {
    // No more steps
    await completeCampaign(supabase, enrollmentId, "all_steps");
    return { success: true, completed: true };
  }

  // Calculate next send time
  const nextSendAt = new Date(
    Date.now() + nextStepDef.delayDays * 24 * 60 * 60 * 1000
  );

  // Update enrollment
  await supabase
    .from("campaign_enrollments")
    .update({
      current_step: nextStep,
      next_send_at: nextSendAt.toISOString(),
    })
    .eq("id", enrollmentId);

  return { success: true, completed: false };
}

/**
 * Mark a campaign as completed
 */
async function completeCampaign(
  supabase: SupabaseClient,
  enrollmentId: string,
  reason: string
): Promise<void> {
  await supabase
    .from("campaign_enrollments")
    .update({
      status: "completed",
      completed_at: new Date().toISOString(),
      metadata: { completion_reason: reason },
    })
    .eq("id", enrollmentId);
}

/**
 * Cancel a campaign enrollment
 */
export async function cancelCampaignEnrollment(
  supabase: SupabaseClient,
  enrollmentId: string,
  reason?: string
): Promise<{ success: boolean; error?: string }> {
  const { error } = await supabase
    .from("campaign_enrollments")
    .update({
      status: "cancelled",
      cancelled_at: new Date().toISOString(),
      metadata: reason ? { cancellation_reason: reason } : {},
    })
    .eq("id", enrollmentId);

  if (error) {
    return { success: false, error: error.message };
  }

  return { success: true };
}

/**
 * Get campaign enrollment status
 */
export async function getCampaignEnrollment(
  supabase: SupabaseClient,
  userId: string,
  campaignSlug: string
) {
  const { data, error } = await supabase
    .from("campaign_enrollments")
    .select(`
      *,
      campaign:email_campaigns(slug, name)
    `)
    .eq("user_id", userId)
    .eq("campaign:email_campaigns.slug", campaignSlug)
    .single();

  if (error) {
    return null;
  }

  return data;
}

/**
 * Get all active campaign enrollments that are due for processing
 */
export async function getActiveCampaignEnrollments(
  supabase: SupabaseClient,
  limit = 100
) {
  const { data, error } = await supabase
    .from("campaign_enrollments")
    .select(`
      id,
      user_id,
      current_step,
      next_send_at,
      campaign:email_campaigns(slug, name)
    `)
    .eq("status", "active")
    .lte("next_send_at", new Date().toISOString())
    .order("next_send_at", { ascending: true })
    .limit(limit);

  if (error) {
    console.error("Error fetching active enrollments:", error);
    return [];
  }

  return data || [];
}

/**
 * Get users who should receive re-engagement emails
 */
export async function getInactiveUsers(
  supabase: SupabaseClient,
  inactiveDays: number,
  limit = 100
): Promise<
  Array<{
    id: string;
    email: string;
    full_name: string;
    credits: number;
    last_staging_at: string | null;
  }>
> {
  const cutoffDate = new Date();
  cutoffDate.setDate(cutoffDate.getDate() - inactiveDays);

  // Get users who haven't staged in X days and aren't in a re-engagement campaign
  const { data, error } = await supabase
    .from("profiles")
    .select(`
      id,
      email,
      full_name,
      credits,
      last_staging_at
    `)
    .lt("last_staging_at", cutoffDate.toISOString())
    .gt("credits", 0) // Only users with credits
    .limit(limit);

  if (error) {
    console.error("Error fetching inactive users:", error);
    return [];
  }

  return data || [];
}
