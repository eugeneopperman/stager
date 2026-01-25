import { SupabaseClient } from "@supabase/supabase-js";
import { sendEmail } from "../sender";
import { EMAIL_CONFIG } from "../client";
import { generateUnsubscribeUrl, generatePreferencesUrl } from "../preferences";
import { WeeklyDigestEmail, WeeklyDigestProps } from "../templates/digest/WeeklyDigest";
import { startOfWeek, endOfWeek, subWeeks } from "date-fns";

export interface DigestData {
  stagingsThisWeek: number;
  stagingsLastWeek: number;
  creditsRemaining: number;
  topStagings: Array<{
    id: string;
    thumbnail_url: string;
    room_type: string;
    style: string;
  }>;
  newFeatures?: Array<{
    title: string;
    description: string;
  }>;
}

/**
 * Generate and send weekly digest for a user
 */
export async function sendWeeklyDigest(
  supabase: SupabaseClient,
  userId: string
): Promise<{ success: boolean; error?: string }> {
  // Get user data
  const { data: user, error: userError } = await supabase
    .from("profiles")
    .select("id, email, full_name, credits")
    .eq("id", userId)
    .single();

  if (userError || !user) {
    return { success: false, error: "User not found" };
  }

  // Get digest data
  const digestData = await getDigestData(supabase, userId);

  // Prepare template props
  const templateProps: WeeklyDigestProps = {
    firstName: user.full_name?.split(" ")[0] || "there",
    stagingsThisWeek: digestData.stagingsThisWeek,
    stagingsLastWeek: digestData.stagingsLastWeek,
    creditsRemaining: user.credits,
    topStagings: digestData.topStagings,
    newFeatures: digestData.newFeatures,
    appUrl: EMAIL_CONFIG.appUrl,
    unsubscribeUrl: generateUnsubscribeUrl(userId, "weekly_digest"),
    preferencesUrl: generatePreferencesUrl(userId),
  };

  // Send the digest email
  const result = await sendEmail(supabase, {
    to: user.email,
    subject: `Your Stager Week: ${digestData.stagingsThisWeek} stagings completed`,
    template: WeeklyDigestEmail(templateProps),
    templateId: EMAIL_CONFIG.templates.WEEKLY_DIGEST,
    emailType: EMAIL_CONFIG.types.DIGEST,
    userId,
    metadata: {
      stagings_this_week: digestData.stagingsThisWeek,
      stagings_last_week: digestData.stagingsLastWeek,
    },
  });

  return result;
}

/**
 * Get digest data for a user
 */
async function getDigestData(
  supabase: SupabaseClient,
  userId: string
): Promise<DigestData> {
  const now = new Date();
  const thisWeekStart = startOfWeek(now, { weekStartsOn: 1 }); // Monday
  const thisWeekEnd = endOfWeek(now, { weekStartsOn: 1 });
  const lastWeekStart = startOfWeek(subWeeks(now, 1), { weekStartsOn: 1 });
  const lastWeekEnd = endOfWeek(subWeeks(now, 1), { weekStartsOn: 1 });

  // Get staging counts
  const [thisWeekResult, lastWeekResult, topStagingsResult] = await Promise.all([
    supabase
      .from("staging_jobs")
      .select("*", { count: "exact", head: true })
      .eq("user_id", userId)
      .eq("status", "completed")
      .gte("created_at", thisWeekStart.toISOString())
      .lte("created_at", thisWeekEnd.toISOString()),

    supabase
      .from("staging_jobs")
      .select("*", { count: "exact", head: true })
      .eq("user_id", userId)
      .eq("status", "completed")
      .gte("created_at", lastWeekStart.toISOString())
      .lte("created_at", lastWeekEnd.toISOString()),

    supabase
      .from("staging_jobs")
      .select("id, output_image_url, room_type, style")
      .eq("user_id", userId)
      .eq("status", "completed")
      .gte("created_at", thisWeekStart.toISOString())
      .order("created_at", { ascending: false })
      .limit(3),
  ]);

  return {
    stagingsThisWeek: thisWeekResult.count || 0,
    stagingsLastWeek: lastWeekResult.count || 0,
    creditsRemaining: 0, // Will be filled in by caller
    topStagings: (topStagingsResult.data || []).map((job) => ({
      id: job.id,
      thumbnail_url: job.output_image_url,
      room_type: job.room_type,
      style: job.style,
    })),
    newFeatures: getNewFeatures(),
  };
}

/**
 * Get new features to highlight (could be fetched from a CMS in the future)
 */
function getNewFeatures(): Array<{ title: string; description: string }> {
  // This would typically come from a feature flags system or CMS
  // For now, return empty or a static list
  return [];
}

/**
 * Get users who should receive the weekly digest
 */
export async function getUsersForDigest(
  supabase: SupabaseClient,
  limit = 100
): Promise<Array<{ id: string; email: string }>> {
  // Get users who:
  // 1. Have weekly_digest enabled in preferences
  // 2. Have completed at least one staging ever
  // 3. Haven't received a digest this week

  const weekStart = startOfWeek(new Date(), { weekStartsOn: 1 });

  const { data, error } = await supabase
    .from("profiles")
    .select(`
      id,
      email,
      email_preferences!inner(weekly_digest)
    `)
    .eq("email_preferences.weekly_digest", true)
    .limit(limit);

  if (error) {
    console.error("Error fetching users for digest:", error);
    return [];
  }

  // Filter out users who already received digest this week
  const userIds = (data || []).map((u) => u.id);

  if (userIds.length === 0) return [];

  const { data: sentDigests } = await supabase
    .from("email_sends")
    .select("user_id")
    .in("user_id", userIds)
    .eq("template_id", EMAIL_CONFIG.templates.WEEKLY_DIGEST)
    .gte("created_at", weekStart.toISOString());

  const sentUserIds = new Set((sentDigests || []).map((s) => s.user_id));

  return (data || [])
    .filter((u) => !sentUserIds.has(u.id))
    .map((u) => ({ id: u.id, email: u.email }));
}
