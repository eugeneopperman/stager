import { SupabaseClient } from "@supabase/supabase-js";

export type EmailCategory =
  | "marketing_emails"
  | "product_updates"
  | "weekly_digest"
  | "staging_notifications"
  | "team_notifications";

export interface EmailPreferences {
  marketing_emails: boolean;
  product_updates: boolean;
  weekly_digest: boolean;
  staging_notifications: boolean;
  team_notifications: boolean;
  unsubscribed_at: string | null;
}

/**
 * Get email preferences for a user
 */
export async function getEmailPreferences(
  supabase: SupabaseClient,
  userId: string
): Promise<EmailPreferences | null> {
  const { data, error } = await supabase
    .from("email_preferences")
    .select("*")
    .eq("user_id", userId)
    .single();

  if (error) {
    // If no preferences exist, create default ones
    if (error.code === "PGRST116") {
      return await createDefaultPreferences(supabase, userId);
    }
    console.error("Error fetching email preferences:", error);
    return null;
  }

  return {
    marketing_emails: data.marketing_emails,
    product_updates: data.product_updates,
    weekly_digest: data.weekly_digest,
    staging_notifications: data.staging_notifications,
    team_notifications: data.team_notifications,
    unsubscribed_at: data.unsubscribed_at,
  };
}

/**
 * Create default email preferences for a user
 */
async function createDefaultPreferences(
  supabase: SupabaseClient,
  userId: string
): Promise<EmailPreferences | null> {
  const defaultPrefs = {
    marketing_emails: true,
    product_updates: true,
    weekly_digest: true,
    staging_notifications: true,
    team_notifications: true,
    unsubscribed_at: null,
  };

  const { error } = await supabase
    .from("email_preferences")
    .insert({
      user_id: userId,
      ...defaultPrefs,
    });

  if (error) {
    console.error("Error creating default preferences:", error);
    return null;
  }

  return defaultPrefs;
}

/**
 * Update email preferences for a user
 */
export async function updateEmailPreferences(
  supabase: SupabaseClient,
  userId: string,
  updates: Partial<Omit<EmailPreferences, "unsubscribed_at">>
): Promise<{ success: boolean; error?: string }> {
  const { error } = await supabase
    .from("email_preferences")
    .update({
      ...updates,
      updated_at: new Date().toISOString(),
    })
    .eq("user_id", userId);

  if (error) {
    console.error("Error updating email preferences:", error);
    return { success: false, error: error.message };
  }

  return { success: true };
}

/**
 * Check if a user has opted into a specific email category
 */
export async function checkEmailPreferences(
  supabase: SupabaseClient,
  userId: string,
  category: EmailCategory
): Promise<boolean> {
  const prefs = await getEmailPreferences(supabase, userId);

  // If no preferences, assume opted in
  if (!prefs) {
    return true;
  }

  // If globally unsubscribed, don't send any marketing emails
  if (prefs.unsubscribed_at) {
    // Still allow transactional emails
    if (category === "staging_notifications" || category === "team_notifications") {
      return prefs[category];
    }
    return false;
  }

  return prefs[category];
}

/**
 * Unsubscribe user from all marketing emails
 */
export async function unsubscribeAll(
  supabase: SupabaseClient,
  userId: string
): Promise<{ success: boolean; error?: string }> {
  const { error } = await supabase
    .from("email_preferences")
    .update({
      marketing_emails: false,
      product_updates: false,
      weekly_digest: false,
      unsubscribed_at: new Date().toISOString(),
    })
    .eq("user_id", userId);

  if (error) {
    console.error("Error unsubscribing user:", error);
    return { success: false, error: error.message };
  }

  return { success: true };
}

/**
 * Unsubscribe user from a specific category
 */
export async function unsubscribeCategory(
  supabase: SupabaseClient,
  userId: string,
  category: EmailCategory
): Promise<{ success: boolean; error?: string }> {
  const { error } = await supabase
    .from("email_preferences")
    .update({
      [category]: false,
      updated_at: new Date().toISOString(),
    })
    .eq("user_id", userId);

  if (error) {
    console.error("Error unsubscribing from category:", error);
    return { success: false, error: error.message };
  }

  return { success: true };
}

/**
 * Generate unsubscribe URL with signed token
 */
export function generateUnsubscribeUrl(
  userId: string,
  category?: EmailCategory
): string {
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || "https://stager.app";

  // In production, you'd want to sign this token
  const token = Buffer.from(
    JSON.stringify({ userId, category, timestamp: Date.now() })
  ).toString("base64url");

  const params = new URLSearchParams({ token });
  if (category) {
    params.set("category", category);
  }

  return `${appUrl}/api/email/unsubscribe?${params.toString()}`;
}

/**
 * Generate email preferences URL
 */
export function generatePreferencesUrl(userId?: string): string {
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || "https://stager.app";
  return `${appUrl}/settings?tab=notifications`;
}
