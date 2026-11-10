import { toJalali, toPersianDigits, JALALI_MONTHS, pad2 } from "@/lib/jalali";

/** واحد پول در کل پنل؛ اگر شرکت با «تومان» کار می‌کند فقط همین را عوض کنید. */
export const CURRENCY_LABEL = "ریال";

const nf = new Intl.NumberFormat("fa-IR", { maximumFractionDigits: 0 });
const nf2 = new Intl.NumberFormat("fa-IR", { maximumFractionDigits: 2 });
const nf3 = new Intl.NumberFormat("fa-IR", { maximumFractionDigits: 3 });

export const toNumber = (v: string | number | null | undefined): number => {
  const n = Number(v ?? 0);
  return Number.isFinite(n) ? n : 0;
};

export const formatNumber = (v: string | number | null | undefined) =>
  nf.format(toNumber(v));

export const formatScore = (v: number | null | undefined) =>
  v == null ? "—" : nf2.format(v);

export const formatMoney = (v: string | number | null | undefined) =>
  `${nf.format(toNumber(v))} ${CURRENCY_LABEL}`;

/** مقدار به کیلوگرم؛ از ۱۰۰۰ به بالا به «تن» نمایش داده می‌شود. */
export function formatWeight(kg: string | number | null | undefined) {
  const n = toNumber(kg);
  if (Math.abs(n) >= 1000) return `${nf2.format(n / 1000)} تن`;
  return `${nf3.format(n)} کیلوگرم`;
}

/** YYYY-MM-DD (میلادی) → «۱۴ آبان ۱۴۰۵» بدون جابه‌جایی منطقه زمانی */
export function formatJalaliDate(value: string | null | undefined) {
  if (!value) return "—";
  const m = /^(\d{4})-(\d{2})-(\d{2})/.exec(value);
  if (!m) return "—";
  let gy = Number(m[1]);
  let gm = Number(m[2]);
  let gd = Number(m[3]);
  // اگر ISO کامل با زمان باشد، تاریخ محلی کاربر را بگیر
  if (value.length > 10) {
    const d = new Date(value);
    if (!Number.isNaN(d.getTime())) {
      gy = d.getFullYear();
      gm = d.getMonth() + 1;
      gd = d.getDate();
    }
  }
  const [jy, jm, jd] = toJalali(gy, gm, gd);
  return `${toPersianDigits(jd)} ${JALALI_MONTHS[jm - 1]} ${toPersianDigits(jy)}`;
}

export function formatJalaliDateTime(value: string | null | undefined) {
  if (!value) return "—";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return "—";
  return `${formatJalaliDate(value)} — ${toPersianDigits(pad2(d.getHours()))}:${toPersianDigits(pad2(d.getMinutes()))}`;
}

/** تبدیل مقدار تایپ‌شده (با ارقام فارسی و ویرگول) به رشته‌ی عددی انگلیسی */
export function cleanDecimal(raw: string): string {
  return raw
    .replace(/[۰-۹]/g, (d) => String("۰۱۲۳۴۵۶۷۸۹".indexOf(d)))
    .replace(/[٠-٩]/g, (d) => String("٠١٢٣٤٥٦٧٨٩".indexOf(d)))
    .replace(/[,٬،\s]/g, "")
    .replace(/٫/g, ".");
}

export const isPositiveNumber = (raw: string) => {
  const n = Number(cleanDecimal(raw));
  return Number.isFinite(n) && n > 0;
};

export const todayIso = () => {
  const d = new Date();
  return `${d.getFullYear()}-${pad2(d.getMonth() + 1)}-${pad2(d.getDate())}`;
};
