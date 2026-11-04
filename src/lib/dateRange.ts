/** Both dates are Gregorian YYYY-MM-DD; lexicographic compare is valid. */
export function dateRangeError(from: string, to: string): string | null {
  if (from && to && from > to) return "تاریخ شروع نباید بعد از تاریخ پایان باشد";
  return null;
}
