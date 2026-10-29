/** Daily update at 6:00, server-local time. */
export const UPDATE_CRON = "0 6 * * *";
export const UPDATE_HOUR = 6;

/** The most recent 6:00 (local time) at or before `now`. */
export function lastScheduledRun(now: Date): Date {
  const run = new Date(now);
  run.setHours(UPDATE_HOUR, 0, 0, 0);
  if (run > now) run.setDate(run.getDate() - 1);
  return run;
}

/** True when the saved table predates the most recent 6:00 run, so startup should catch up. */
export function missedScheduledRun(updatedAt: string, now: Date): boolean {
  const saved = Date.parse(updatedAt);
  return !Number.isFinite(saved) || saved < lastScheduledRun(now).getTime();
}
