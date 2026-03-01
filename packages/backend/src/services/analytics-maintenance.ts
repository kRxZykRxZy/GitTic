import {
  ensureAnalyticsTables,
  purgeExpiredAnalyticsEvents,
  rollupDailyAnalytics,
} from "../db/repositories/analytics-repo.js";

const ROLLUP_INTERVAL_MS = 60 * 60 * 1000;
const RETENTION_INTERVAL_MS = 6 * 60 * 60 * 1000;
const RETENTION_DAYS = 180;

export function startAnalyticsMaintenance(): () => void {
  if (!ensureAnalyticsTables()) {
    console.warn("[analytics] Analytics tables unavailable; maintenance tasks will be skipped until schema is created.");
    return () => {};
  }

  const runRollup = () => {
    try {
      const changes = rollupDailyAnalytics(3);
      if (changes > 0) {
        console.log(`[analytics] Daily rollups refreshed (${changes} row changes)`);
      }
    } catch (error) {
      console.error("[analytics] Rollup job failed:", error);
    }
  };

  const runRetention = () => {
    try {
      const purged = purgeExpiredAnalyticsEvents(RETENTION_DAYS);
      if (purged > 0) {
        console.log(`[analytics] Purged ${purged} expired analytics events`);
      }
    } catch (error) {
      console.error("[analytics] Retention job failed:", error);
    }
  };

  runRollup();
  runRetention();

  const rollupInterval = setInterval(runRollup, ROLLUP_INTERVAL_MS);
  const retentionInterval = setInterval(runRetention, RETENTION_INTERVAL_MS);

  return () => {
    clearInterval(rollupInterval);
    clearInterval(retentionInterval);
  };
}
