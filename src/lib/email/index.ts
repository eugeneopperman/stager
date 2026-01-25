// Email automation system - main exports

// Client and configuration
export { getResendClient, EMAIL_CONFIG } from "./client";
export type { EmailType, TemplateId } from "./client";

// Sender utilities
export { sendEmail, sendBatchEmails } from "./sender";

// Preferences management
export {
  getEmailPreferences,
  updateEmailPreferences,
  checkEmailPreferences,
  unsubscribeAll,
  unsubscribeCategory,
  generateUnsubscribeUrl,
  generatePreferencesUrl,
} from "./preferences";
export type { EmailPreferences, EmailCategory } from "./preferences";

// Campaign management
export {
  enrollInCampaign,
  processCampaignStep,
  cancelCampaignEnrollment,
  getCampaignEnrollment,
  getActiveCampaignEnrollments,
} from "./campaigns";

// Transactional email helpers
export {
  sendStagingCompleteEmail,
  sendStagingFailedEmail,
  sendCreditLowEmail,
  sendPaymentSuccessEmail,
  sendPaymentFailedEmail,
  sendTeamInvitationEmailNew,
  sendTeamWelcomeEmail,
  sendSubscriptionCancelledEmail,
} from "./transactional";

// Digest helpers
export { sendWeeklyDigest, getUsersForDigest } from "./campaigns/digest";

// Template components (re-export for convenience)
export {
  Layout,
  Header,
  Footer,
  Button,
  Card,
  StatCard,
  ImagePreview,
  BeforeAfterPreview,
  styles,
} from "./templates/components";
