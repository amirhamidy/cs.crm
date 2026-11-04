import { toJalali, toPersianDigits, pad2 } from "@/lib/jalali";

/** Display-only money/number formatting. Never use for calculations. */
export function formatNumber(value: string | number | null | undefined): string {
  if (value === null || value === undefined || value === "") return "—";
  const n = Number(value);
  if (!Number.isFinite(n)) return "—";
  return toPersianDigits(n.toLocaleString("en-US", { maximumFractionDigits: 2 }));
}

/** "YYYY-MM-DD" or ISO timestamp -> "1405/01/02" (Jalali). */
export function formatJalaliDate(value: string | null | undefined): string {
  if (!value) return "—";
  const d = new Date(value.length === 10 ? `${value}T12:00:00` : value);
  if (Number.isNaN(d.getTime())) return "—";
  const [jy, jm, jd] = toJalali(d.getFullYear(), d.getMonth() + 1, d.getDate());
  return toPersianDigits(`${jy}/${pad2(jm)}/${pad2(jd)}`);
}

export function formatJalaliDateTime(value: string | null | undefined): string {
  if (!value) return "—";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return "—";
  const time = `${pad2(d.getHours())}:${pad2(d.getMinutes())}`;
  return `${formatJalaliDate(value)} ${toPersianDigits(time)}`;
}
