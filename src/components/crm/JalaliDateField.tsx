"use client";

import { useEffect, useMemo, useState } from "react";
import {
  JALALI_MONTHS,
  jalaliMonthLength,
  pad2,
  toGregorian,
  toJalali,
  toPersianDigits,
} from "@/lib/jalali";

interface Props {
  /** تاریخ میلادی به شکل YYYY-MM-DD یا رشته‌ی خالی */
  value: string;
  onChange: (iso: string) => void;
  label?: string;
  /** اگر true باشد کاربر می‌تواند تاریخ را خالی کند (برای فیلترها) */
  clearable?: boolean;
  disabled?: boolean;
  className?: string;
}

const selectCls =
  "h-11 w-full rounded-2xl border border-gray-200 bg-white px-2 text-[12.5px] font-semibold text-gray-900 outline-none transition-colors focus:border-brand disabled:opacity-50 dark:border-white/10 dark:bg-white/5 dark:text-white";

function parse(value: string): [number, number, number] | null {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value);
  if (!m) return null;
  return toJalali(Number(m[1]), Number(m[2]), Number(m[3]));
}

/** انتخاب تاریخ شمسی با سه لیست (روز، ماه، سال)؛ خروجی میلادی است. */
export default function JalaliDateField({
  value,
  onChange,
  label,
  clearable = false,
  disabled,
  className,
}: Props) {
  const [parts, setParts] = useState<[number, number, number]>(
    () => parse(value) ?? [0, 0, 0],
  );

  useEffect(() => {
    const next = parse(value);
    if (next) setParts(next);
    else if (!value) setParts([0, 0, 0]);
  }, [value]);

  const [jy, jm, jd] = parts;

  const years = useMemo(() => {
    const now = new Date();
    const [cy] = toJalali(now.getFullYear(), now.getMonth() + 1, now.getDate());
    const list: number[] = [];
    for (let y = cy + 1; y >= cy - 6; y -= 1) list.push(y);
    if (jy && !list.includes(jy)) list.push(jy);
    return list.sort((a, b) => b - a);
  }, [jy]);

  const dayCount = jy && jm ? jalaliMonthLength(jy, jm) : 31;

  const commit = (y: number, m: number, d: number) => {
    const day = y && m ? Math.min(d, jalaliMonthLength(y, m)) : d;
    setParts([y, m, day]);
    if (y && m && day) {
      const [gy, gm, gd] = toGregorian(y, m, day);
      onChange(`${gy}-${pad2(gm)}-${pad2(gd)}`);
    } else if (clearable && !y && !m && !day) {
      onChange("");
    }
  };

  return (
    <div className={className}>
      {label && (
        <div className="mb-1.5 flex items-center justify-between">
          <span className="text-[11.5px] font-bold text-gray-500 dark:text-gray-400">
            {label}
          </span>
          {clearable && value && (
            <button
              type="button"
              onClick={() => commit(0, 0, 0)}
              className="text-[11px] font-bold text-gray-400 hover:text-red-500"
            >
              پاک کردن
            </button>
          )}
        </div>
      )}
      <div className="grid grid-cols-[1fr_1.6fr_1.2fr] gap-2" dir="rtl">
        <select
          aria-label="روز"
          disabled={disabled}
          value={jd || ""}
          onChange={(e) => commit(jy, jm, Number(e.target.value))}
          className={selectCls}
        >
          <option value="">روز</option>
          {Array.from({ length: dayCount }, (_, i) => i + 1).map((d) => (
            <option key={d} value={d}>
              {toPersianDigits(d)}
            </option>
          ))}
        </select>
        <select
          aria-label="ماه"
          disabled={disabled}
          value={jm || ""}
          onChange={(e) => commit(jy, Number(e.target.value), jd)}
          className={selectCls}
        >
          <option value="">ماه</option>
          {JALALI_MONTHS.map((name, i) => (
            <option key={name} value={i + 1}>
              {name}
            </option>
          ))}
        </select>
        <select
          aria-label="سال"
          disabled={disabled}
          value={jy || ""}
          onChange={(e) => commit(Number(e.target.value), jm, jd)}
          className={selectCls}
        >
          <option value="">سال</option>
          {years.map((y) => (
            <option key={y} value={y}>
              {toPersianDigits(y)}
            </option>
          ))}
        </select>
      </div>
    </div>
  );
}
