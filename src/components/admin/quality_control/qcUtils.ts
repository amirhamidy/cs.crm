import { JALALI_MONTHS, pad2, toJalali, toPersianDigits } from "@/lib/jalali";

const G = [
  "from-blue-500 to-indigo-500",
  "from-violet-500 to-fuchsia-500",
  "from-emerald-500 to-teal-500",
  "from-amber-500 to-orange-500",
  "from-rose-500 to-pink-500",
  "from-cyan-500 to-sky-500",
];

export const gradientOf = (n: number) => G[Math.abs(n) % G.length];
export const initialOf = (t: string, f = "؟") =>
  (t || "").trim().charAt(0) || f;

export function formatDate(value?: string | null, sep = " - ") {
  if (!value) return "—";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return "—";
  const [jy, jm, jd] = toJalali(
    d.getFullYear(),
    d.getMonth() + 1,
    d.getDate(),
  ) as [number, number, number];
  return `${toPersianDigits(jd)} ${JALALI_MONTHS[jm - 1]} ${toPersianDigits(
    jy,
  )}${sep}${toPersianDigits(pad2(d.getHours()))}:${toPersianDigits(
    pad2(d.getMinutes()),
  )}`;
}
