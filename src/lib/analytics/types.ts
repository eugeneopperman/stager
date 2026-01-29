// Analytics data types

export interface DailyActivity {
  date: string; // YYYY-MM-DD
  count: number;
  creditsUsed: number;
}

export interface RoomTypeBreakdown {
  roomType: string;
  label: string;
  count: number;
  percentage: number;
}

export interface StyleBreakdown {
  style: string;
  label: string;
  count: number;
  percentage: number;
}

export interface PeriodStats {
  totalStagings: number;
  totalCredits: number;
  avgProcessingTimeMs: number | null;
  completedCount: number;
  failedCount: number;
}

export interface PeriodComparison {
  current: PeriodStats;
  previous: PeriodStats;
  stagingsTrend: number; // percentage change
  creditsTrend: number;
}

export interface AnalyticsData {
  periodDays: number;
  dailyActivity: DailyActivity[];
  roomTypes: RoomTypeBreakdown[];
  styles: StyleBreakdown[];
  periodComparison: PeriodComparison;
}

export type PeriodOption = 7 | 30;
