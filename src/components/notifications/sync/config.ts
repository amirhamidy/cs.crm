export const SYNC_CONFIG = {
  // هر ۲۰ ثانیه یک‌بار (چه تب باز باشد چه در پس‌زمینه)
  visibleMs: 20_000,
  hiddenMs: 20_000,
  maxBackoffMs: 5 * 60_000,
  projectTasksMs: 60_000,
  namesTtlMs: 15 * 60_000,
  firstPollDelayMs: 3_000,
  employeeRetryMs: 2 * 60_000,
} as const;
