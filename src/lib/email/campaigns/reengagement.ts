import { CampaignDefinition, CampaignTemplateData } from "./index";
import { EMAIL_CONFIG } from "../client";
import { MissYouEmail } from "../templates/reengagement/MissYou";
import { NewFeaturesEmail } from "../templates/reengagement/NewFeatures";
import { SpecialOfferEmail } from "../templates/reengagement/SpecialOffer";

export const reengagementCampaigns: Record<string, CampaignDefinition> = {
  "reengagement-7d": {
    slug: "reengagement-7d",
    name: "Re-engagement 7 Days",
    steps: [
      {
        templateId: EMAIL_CONFIG.templates.MISS_YOU,
        subject: "We miss you! Your credits are waiting",
        delayDays: 0, // Send immediately when enrolled
        createTemplate: (data: CampaignTemplateData) =>
          MissYouEmail({
            firstName: data.firstName,
            credits: data.credits,
            appUrl: data.appUrl,
            unsubscribeUrl: data.unsubscribeUrl,
          }),
      },
    ],
  },
  "reengagement-14d": {
    slug: "reengagement-14d",
    name: "Re-engagement 14 Days",
    steps: [
      {
        templateId: EMAIL_CONFIG.templates.NEW_FEATURES,
        subject: "See what's new in Stager",
        delayDays: 0,
        createTemplate: (data: CampaignTemplateData) =>
          NewFeaturesEmail({
            firstName: data.firstName,
            appUrl: data.appUrl,
            unsubscribeUrl: data.unsubscribeUrl,
          }),
      },
    ],
  },
  "reengagement-30d": {
    slug: "reengagement-30d",
    name: "Re-engagement 30 Days",
    steps: [
      {
        templateId: EMAIL_CONFIG.templates.SPECIAL_OFFER,
        subject: "Come back - here's something special for you",
        delayDays: 0,
        createTemplate: (data: CampaignTemplateData) =>
          SpecialOfferEmail({
            firstName: data.firstName,
            credits: data.credits,
            appUrl: data.appUrl,
            unsubscribeUrl: data.unsubscribeUrl,
          }),
      },
    ],
  },
};
