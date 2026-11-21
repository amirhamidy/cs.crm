import { toJalali, toPersianDigits, JALALI_MONTHS, pad2 } from "@/lib/jalali";

/** واحد پول در کل پنل؛ همه مبالغ عدد صحیح «ریال» هستند. */
export const CURRENCY_LABEL = "ریال";

/** re-export از jalali برای راحتی استفاده */
export { toPersianDigits };

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

/** مبلغ ریال با جداکننده سه‌رقمی و بدون اعشار: 420000000 → "420,000,000" */
export const formatRial = (n: number | null | undefined) =>
  n == null ? "—" : Math.round(n).toLocaleString("en-US");

/** ورودی مبلغ ریالی؛ فقط عدد صحیح و جداکننده‌های سه‌رقمی پذیرفته می‌شوند. */
export function parseRial(raw: string | null | undefined): number | null {
  if (raw == null) return null;
  const normalized = raw
    .replace(/[۰-۹]/g, (d) => String("۰۱۲۳۴۵۶۷۸۹".indexOf(d)))
    .replace(/[٠-٩]/g, (d) => String("٠١٢٣٤٥٦٧٨٩".indexOf(d)))
    .replace(/[,٬،\s]/g, "");

  if (normalized === "") return null;
  if (!/^\d+(?:\.0+)?$/.test(normalized)) return null;

  const value = Number(normalized);
  return Number.isSafeInteger(value) ? value : null;
}

/** مقدار ورودی را هنگام تایپ با جداکننده سه‌رقمی نشان می‌دهد؛ اعشار غیرصفر و منفی پذیرفته نمی‌شود. */
export const formatRialInput = (raw: string) => {
  const value = parseRial(raw);
  return value == null ? "" : value.toLocaleString("en-US");
};

export const formatMoney = (v: number | null | undefined) =>
  v == null ? "—" : `${formatRial(v)} ${CURRENCY_LABEL}`;

/** مقدار به کیلوگرم؛ از ۱۰۰۰ به بالا به «تن» نمایش داده می‌شود. */
export function formatWeight(kg: string | number | null | undefined) {
  const n = toNumber(kg);
  return splitTonKg(n);
}

/** ۱۴۳۰۰ → «۱۴ تن و ۳۰۰ کیلوگرم»؛ بخش صفر حذف می‌شود. */
function splitTonKg(n: number) {
  if (!Number.isFinite(n)) return "—";
  const sign = n < 0 ? "−" : "";
  // گرد کردن به ۳ رقم اعشار (گرم) برای جلوگیری از خطای ممیز شناور
  const abs = Math.round(Math.abs(n) * 1000) / 1000;
  const tons = Math.floor(abs / 1000);
  const kg = Math.round((abs - tons * 1000) * 1000) / 1000;
  if (tons === 0) return `${sign}${nf3.format(kg)} کیلوگرم`;
  if (kg === 0) return `${sign}${nf3.format(tons)} تن`;
  return `${sign}${nf3.format(tons)} تن و ${nf3.format(kg)} کیلوگرم`;
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

/** زمان UTC تاریخچه فروش را به ساعت رسمی تهران و تقویم شمسی تبدیل می‌کند. */
export function formatTehranDateTime(value: string | null | undefined) {
  if (!value) return "—";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "—";

  const tehran = new Date(date.getTime() + 210 * 60 * 1000);
  const dateOnly = `${tehran.getUTCFullYear()}-${pad2(tehran.getUTCMonth() + 1)}-${pad2(tehran.getUTCDate())}`;
  const time = `${pad2(tehran.getUTCHours())}:${pad2(tehran.getUTCMinutes())}`;
  return `${formatJalaliDate(dateOnly)} — ${toPersianDigits(time)}`;
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

/** کیلوگرم → تن (عدد) */
export const kgToTon = (kg: string | number | null | undefined) => toNumber(kg) / 1000;

/** تن → کیلوگرم، رشتهٔ حداکثر ۳ رقم اعشار برای ارسال به API */
export const tonToKg = (ton: string | number): string => {
  const n = typeof ton === "number" ? ton : Number(cleanDecimal(ton));
  if (!Number.isFinite(n)) return "";
  return String(Math.round(n * 1000 * 1000) / 1000);
};

/** نمایش وزن به تن با حداکثر ۳ رقم اعشار */
export const formatTon = (kg: string | number | null | undefined) =>
  splitTonKg(toNumber(kg));

/** «HH:mm» یا «HH:mm:ss» → «HH:mm» با ارقام فارسی */
export const formatTime = (value: string | null | undefined) =>
  value ? toPersianDigits(value.slice(0, 5)) : "—";

/** ساعت محلی فعلی به شکل HH:mm */
export const nowTime = () => {
  const d = new Date();
  return `${pad2(d.getHours())}:${pad2(d.getMinutes())}`;
};

/** آیا عدد خام حداکثر n رقم اعشار دارد؟ */
export const hasAtMostDecimals = (raw: string, n: number) => {
  const c = cleanDecimal(raw);
  const i = c.indexOf(".");
  return i < 0 || c.length - i - 1 <= n;
};
