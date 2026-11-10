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
import { SalesSelect } from "./SalesSelect";

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
    const [parts, setParts] = useState<[number, number, number]>(() => parse(value) ?? [0, 0, 0]);

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
                    <span className="text-[10.5px] font-bold text-gray-400">
                        {label}
                    </span>
                    {clearable && value && (
                        <button
                            type="button"
                            onClick={() => commit(0, 0, 0)}
                            className="text-[10px] font-bold text-gray-400 hover:text-red-500"
                        >
                            پاک کردن
                        </button>
                    )}
                </div>
            )}
            <div className="grid grid-cols-[1fr_1.6fr_1.2fr] gap-2" dir="rtl">
                <SalesSelect
                    compact
                    searchable={false}
                    disabled={disabled}
                    placeholder="روز"
                    value={jd || null}
                    onChange={(v) => commit(jy, jm, v)}
                    options={[
                        { id: 0, label: "روز" },
                        ...Array.from({ length: dayCount }, (_, i) => ({
                            id: i + 1,
                            label: toPersianDigits(i + 1),
                        })),
                    ]}
                />
                <SalesSelect
                    compact
                    searchable={false}
                    disabled={disabled}
                    placeholder="ماه"
                    value={jm || null}
                    onChange={(v) => commit(jy, v, jd)}
                    options={[
                        { id: 0, label: "ماه" },
                        ...JALALI_MONTHS.map((name, i) => ({ id: i + 1, label: name })),
                    ]}
                />
                <SalesSelect
                    compact
                    searchable={false}
                    disabled={disabled}
                    placeholder="سال"
                    value={jy || null}
                    onChange={(v) => commit(v, jm, jd)}
                    options={[
                        { id: 0, label: "سال" },
                        ...years.map((y) => ({ id: y, label: toPersianDigits(y) })),
                    ]}
                />
            </div>
        </div>
    );
}
