import { createClient } from "@/lib/supabase/server";
import { ROOM_TYPES, FURNITURE_STYLES } from "@/lib/constants/ui";
import type {
  AnalyticsData,
  DailyActivity,
  RoomTypeBreakdown,
  StyleBreakdown,
  PeriodStats,
  PeriodComparison,
} from "./types";
import {
  getDateRange,
  getPreviousPeriodRange,
  generateDateRange,
  calculateTrend,
  formatDateKey,
} from "./utils";

/**
 * Fetch all analytics data for a user
 */
export async function fetchAnalyticsData(
  userId: string,
  periodDays: number
): Promise<AnalyticsData> {
  const supabase = await createClient();

  const { start: currentStart, end: currentEnd } = getDateRange(periodDays);
  const { start: previousStart, end: previousEnd } = getPreviousPeriodRange(periodDays);

  // Fetch jobs for current period
  const { data: currentJobs } = await supabase
    .from("staging_jobs")
    .select("id, room_type, style, status, credits_used, processing_time_ms, created_at")
    .eq("user_id", userId)
    .gte("created_at", currentStart.toISOString())
    .lte("created_at", currentEnd.toISOString())
    .order("created_at", { ascending: true });

  // Fetch jobs for previous period (for comparison)
  const { data: previousJobs } = await supabase
    .from("staging_jobs")
    .select("id, status, credits_used, processing_time_ms")
    .eq("user_id", userId)
    .gte("created_at", previousStart.toISOString())
    .lte("created_at", previousEnd.toISOString());

  const jobs = currentJobs || [];
  const prevJobs = previousJobs || [];

  // Build daily activity
  const dailyActivity = buildDailyActivity(jobs, periodDays);

  // Build room type breakdown
  const roomTypes = buildRoomTypeBreakdown(jobs);

  // Build style breakdown
  const styles = buildStyleBreakdown(jobs);

  // Build period comparison
  const periodComparison = buildPeriodComparison(jobs, prevJobs);

  return {
    periodDays,
    dailyActivity,
    roomTypes,
    styles,
    periodComparison,
  };
}

function buildDailyActivity(
  jobs: Array<{ created_at: string; credits_used: number }>,
  periodDays: number
): DailyActivity[] {
  const dateRange = generateDateRange(periodDays);
  const activityMap = new Map<string, { count: number; creditsUsed: number }>();

  // Initialize all dates with zero
  for (const date of dateRange) {
    activityMap.set(date, { count: 0, creditsUsed: 0 });
  }

  // Aggregate jobs by date
  for (const job of jobs) {
    const dateKey = formatDateKey(new Date(job.created_at));
    const existing = activityMap.get(dateKey);
    if (existing) {
      existing.count += 1;
      existing.creditsUsed += job.credits_used;
    }
  }

  return dateRange.map((date) => ({
    date,
    count: activityMap.get(date)?.count || 0,
    creditsUsed: activityMap.get(date)?.creditsUsed || 0,
  }));
}

function buildRoomTypeBreakdown(
  jobs: Array<{ room_type: string }>
): RoomTypeBreakdown[] {
  const counts = new Map<string, number>();
  const total = jobs.length;

  for (const job of jobs) {
    const current = counts.get(job.room_type) || 0;
    counts.set(job.room_type, current + 1);
  }

  // Sort by count descending
  const sorted = Array.from(counts.entries()).sort((a, b) => b[1] - a[1]);

  return sorted.map(([roomType, count]) => {
    const config = ROOM_TYPES.find((rt) => rt.id === roomType);
    return {
      roomType,
      label: config?.label || roomType,
      count,
      percentage: total > 0 ? Math.round((count / total) * 100) : 0,
    };
  });
}

function buildStyleBreakdown(jobs: Array<{ style: string }>): StyleBreakdown[] {
  const counts = new Map<string, number>();
  const total = jobs.length;

  for (const job of jobs) {
    const current = counts.get(job.style) || 0;
    counts.set(job.style, current + 1);
  }

  // Sort by count descending
  const sorted = Array.from(counts.entries()).sort((a, b) => b[1] - a[1]);

  return sorted.map(([style, count]) => {
    const config = FURNITURE_STYLES.find((fs) => fs.id === style);
    return {
      style,
      label: config?.label || style,
      count,
      percentage: total > 0 ? Math.round((count / total) * 100) : 0,
    };
  });
}

function buildPeriodComparison(
  currentJobs: Array<{ status: string; credits_used: number; processing_time_ms: number | null }>,
  previousJobs: Array<{ status: string; credits_used: number; processing_time_ms: number | null }>
): PeriodComparison {
  const currentStats = calculatePeriodStats(currentJobs);
  const previousStats = calculatePeriodStats(previousJobs);

  return {
    current: currentStats,
    previous: previousStats,
    stagingsTrend: calculateTrend(currentStats.totalStagings, previousStats.totalStagings),
    creditsTrend: calculateTrend(currentStats.totalCredits, previousStats.totalCredits),
  };
}

function calculatePeriodStats(
  jobs: Array<{ status: string; credits_used: number; processing_time_ms: number | null }>
): PeriodStats {
  const completedJobs = jobs.filter((j) => j.status === "completed");
  const failedJobs = jobs.filter((j) => j.status === "failed");

  const processingTimes = completedJobs
    .map((j) => j.processing_time_ms)
    .filter((t): t is number => t !== null);

  const avgProcessingTimeMs =
    processingTimes.length > 0
      ? Math.round(processingTimes.reduce((a, b) => a + b, 0) / processingTimes.length)
      : null;

  return {
    totalStagings: jobs.length,
    totalCredits: jobs.reduce((sum, j) => sum + j.credits_used, 0),
    avgProcessingTimeMs,
    completedCount: completedJobs.length,
    failedCount: failedJobs.length,
  };
}
