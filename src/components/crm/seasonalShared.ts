export const JALALI_MONTHS = [
  "فروردین", "اردیبهشت", "خرداد", "تیر", "مرداد", "شهریور",
  "مهر", "آبان", "آذر", "دی", "بهمن", "اسفند",
];

export const monthName = (m: number) => JALALI_MONTHS[m - 1] ?? "";

export const monthRange = (from: number, to: number) =>
  from === to ? monthName(from) : `${monthName(from)} تا ${monthName(to)}`;

export const MONTH_OPTIONS = JALALI_MONTHS.map((label, i) => ({ id: i + 1, label }));
