import type { SWRConfiguration } from "swr";

/**
 * Default SWR configuration for most use cases
 */
export const defaultConfig: SWRConfiguration = {
  revalidateOnFocus: true,
  revalidateOnReconnect: true,
  dedupingInterval: 2000, // Dedupe requests within 2 seconds
  errorRetryCount: 3,
  shouldRetryOnError: true,
};

/**
 * Configuration for polling endpoints (e.g., job status)
 */
export const pollingConfig = (intervalMs: number): SWRConfiguration => ({
  ...defaultConfig,
  refreshInterval: intervalMs,
  revalidateOnFocus: false, // Don't add extra revalidations when polling
});

/**
 * Configuration for static/rarely-changing data
 */
export const staticConfig: SWRConfiguration = {
  ...defaultConfig,
  revalidateOnFocus: false,
  revalidateOnReconnect: false,
  dedupingInterval: 60000, // Dedupe for 1 minute
};

/**
 * Configuration for data that should refresh in background
 * Uses stale-while-revalidate pattern aggressively
 */
export const backgroundRefreshConfig: SWRConfiguration = {
  ...defaultConfig,
  revalidateIfStale: true,
  revalidateOnMount: true,
};

/**
 * Configuration for notifications with 30-second polling
 */
export const notificationPollingConfig: SWRConfiguration = {
  ...pollingConfig(30000),
  dedupingInterval: 5000,
};

/**
 * Configuration for staging job status with 2-second polling
 */
export const stagingJobPollingConfig: SWRConfiguration = {
  ...pollingConfig(2000),
  dedupingInterval: 1000,
};
