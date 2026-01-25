import { SupabaseClient } from "@supabase/supabase-js";
import { CampaignDefinition, CampaignTemplateData } from "./index";
import { EMAIL_CONFIG } from "../client";
import { WelcomeEmail } from "../templates/onboarding/Welcome";
import { FirstStagingEmail } from "../templates/onboarding/FirstStaging";
import { TipsEmail } from "../templates/onboarding/Tips";
import { CheckInEmail } from "../templates/onboarding/CheckIn";

export const onboardingCampaign: CampaignDefinition = {
  slug: "onboarding",
  name: "Onboarding Drip",
  steps: [
    {
      templateId: EMAIL_CONFIG.templates.WELCOME,
      subject: "Welcome to Stager! Let's stage your first property",
      delayDays: 0, // Immediate
      createTemplate: (data: CampaignTemplateData) =>
        WelcomeEmail({
          firstName: data.firstName,
          credits: data.credits,
          appUrl: data.appUrl,
          unsubscribeUrl: data.unsubscribeUrl,
        }),
    },
    {
      templateId: EMAIL_CONFIG.templates.FIRST_STAGING,
      subject: "Ready to stage your first photo?",
      delayDays: 1, // 1 day after signup
      createTemplate: (data: CampaignTemplateData) =>
        FirstStagingEmail({
          firstName: data.firstName,
          appUrl: data.appUrl,
          unsubscribeUrl: data.unsubscribeUrl,
        }),
    },
    {
      templateId: EMAIL_CONFIG.templates.TIPS,
      subject: "5 pro tips for stunning virtual staging",
      delayDays: 3, // 3 days after signup
      createTemplate: (data: CampaignTemplateData) =>
        TipsEmail({
          firstName: data.firstName,
          appUrl: data.appUrl,
          unsubscribeUrl: data.unsubscribeUrl,
        }),
    },
    {
      templateId: EMAIL_CONFIG.templates.CHECK_IN,
      subject: "How's it going? We're here to help",
      delayDays: 7, // 7 days after signup
      createTemplate: (data: CampaignTemplateData) =>
        CheckInEmail({
          firstName: data.firstName,
          appUrl: data.appUrl,
          unsubscribeUrl: data.unsubscribeUrl,
        }),
    },
  ],
  exitConditions: async (supabase: SupabaseClient, userId: string) => {
    // Exit campaign early if user has completed their first staging
    const { count } = await supabase
      .from("staging_jobs")
      .select("*", { count: "exact", head: true })
      .eq("user_id", userId)
      .eq("status", "completed");

    return (count || 0) > 0;
  },
};
