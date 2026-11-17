/**
 * Helpers for production log start/end times (HH:MM, 24h).
 * If end <= start the shift is treated as crossing midnight (+24h).
 */
export function timeToMinutes(t: string): number | null {
  const m = /^(\d{1,2}):(\d{2})$/.exec(t.trim());
  if (!m) return null;
  const h = Number(m[1]);
  const min = Number(m[2]);
  if (h > 23 || min > 59) return null;
  return h * 60 + min;
}

export function isValidTimeRange(start: string, end: string): boolean {
  const startMinutes = timeToMinutes(start);
  const endMinutes = timeToMinutes(end);
  return startMinutes !== null && endMinutes !== null && startMinutes !== endMinutes;
}

export function formatHoursWorked(start: string, end: string): string {
  const startMinutes = timeToMinutes(start);
  const endMinutes = timeToMinutes(end);
  if (startMinutes === null || endMinutes === null) return "";
  const duration = endMinutes > startMinutes ? endMinutes - startMinutes : endMinutes + 1440 - startMinutes;
  const hours = Math.floor(duration / 60);
  const minutes = duration % 60;
  if (!hours) return `${minutes} دقیقه`;
  if (!minutes) return `${hours} ساعت`;
  return `${hours} ساعت و ${minutes} دقیقه`;
}

/** Normalises API value ("08:30:00", "08:30:00.000Z", "08:30") to "HH:MM". */
export function toHHMM(value: string | null | undefined): string {
  if (!value) return "";
  const m = /^(\d{1,2}):(\d{2})/.exec(value);
  return m ? `${m[1].padStart(2, "0")}:${m[2]}` : "";
}
