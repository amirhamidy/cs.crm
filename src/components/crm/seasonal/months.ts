import { JALALI_MONTHS } from "@/lib/jalali";

export const monthName = (month: number) => JALALI_MONTHS[month - 1] ?? "";

export const monthRange = (from: number, to: number) =>
    from === to ? monthName(from) : `${monthName(from)} تا ${monthName(to)}`;

export const MONTH_OPTIONS = JALALI_MONTHS.map((label, i) => ({ id: i + 1, label }));
