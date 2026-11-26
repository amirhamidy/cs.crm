import { JALALI_MONTHS, toJalali, toPersianDigits, todayJalali } from "@/lib/jalali";
import type { WorkHoursStatus } from "./hrApi";

export const WH_LABEL: Record<WorkHoursStatus, string> = { pending: "در انتظار تأیید", approved: "تأییدشده", rejected: "ردشده" };
export const WH_CLS: Record<WorkHoursStatus, string> = {
  pending: "bg-amber-50 text-amber-600", approved: "bg-emerald-50 text-emerald-600", rejected: "bg-rose-50 text-rose-600",
};

/** month is the Gregorian date of the Jalali month start */
export function monthLabel(iso: string) {
  const [y, m, d] = iso.split("-").map(Number);
  const [jy, jm] = toJalali(y, m, d);
  return toPersianDigits(`${JALALI_MONTHS[jm - 1]} ${jy}`);
}

/**
 * Approval gate: a month's work hours can be decided only from day 1 of the
 * following Jalali month (e.g. Aban -> from 1 Azar). `month` is the Gregorian
 * date of the Jalali month start.
 */
export function monthDecisionOpensAt(month: string): [number, number] | null {
  const m = month?.match(/(\d{4})-(\d{2})-(\d{2})/);
  if (!m) return null;
  const [jy, jm] = toJalali(+m[1], +m[2], +m[3]);
  return jm === 12 ? [jy + 1, 1] : [jy, jm + 1];
}
export function canDecideMonth(month: string): boolean {
  const open = monthDecisionOpensAt(month);
  if (!open) return true;
  const [ty, tm] = todayJalali();
  return ty * 12 + tm >= open[0] * 12 + open[1];
}
export function decisionLockMessage(month: string): string {
  const open = monthDecisionOpensAt(month);
  const names = ["", "فروردین", "اردیبهشت", "خرداد", "تیر", "مرداد", "شهریور", "مهر", "آبان", "آذر", "دی", "بهمن", "اسفند"];
  return open ? `تصمیم‌گیری این ماه از ۱ ${names[open[1]]} ${toPersianDigits(String(open[0]))} امکان‌پذیر است.` : "";
}
