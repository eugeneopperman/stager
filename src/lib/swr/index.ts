/**
 * SWR utilities barrel export
 */

export { fetcher, postFetcher, patchFetcher, deleteFetcher } from "./fetcher";
export { swrKeys, swrKeyPatterns } from "./keys";
export {
  defaultConfig,
  pollingConfig,
  staticConfig,
  backgroundRefreshConfig,
  notificationPollingConfig,
  stagingJobPollingConfig,
} from "./config";
