import { JALALI_MONTHS, toJalali, toPersianDigits } from "@/lib/jalali";
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
