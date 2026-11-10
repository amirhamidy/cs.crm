"use client";

import { useState } from "react";
import { CalendarRange, X } from "lucide-react";
import TimeRangeModal from "../../tasks/TimeRangeModal";
import { formatJalaliDate } from "@/lib/crm/format";

interface Props {
    from: string | undefined;
    to: string | undefined;
    onChange: (from: string | undefined, to: string | undefined) => void;
    label?: string;
}

const pad = (n: number) => String(n).padStart(2, "0");
const toDay = (iso: string) => {
    const d = new Date(iso);
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
};
const toIso = (day: string | undefined, end: boolean) => {
    if (!day) return undefined;
    const [y, m, d] = day.split("-").map(Number);
    return (end ? new Date(y, m - 1, d, 23, 59, 0) : new Date(y, m - 1, d, 0, 0, 0)).toISOString();
};

export function DateRangeField({ from, to, onChange, label = "بازه تاریخ" }: Props) {
    const [open, setOpen] = useState(false);
    const has = Boolean(from || to);

    return (
        <>
            <div>
                <label className="mb-1.5 block text-[10.5px] font-bold text-gray-400">{label}</label>
                <div className="flex h-10 items-center gap-2 rounded-2xl border border-gray-100 bg-gray-50 px-3 transition-all hover:border-gray-200 dark:border-white/[0.06] dark:bg-white/[0.03] dark:hover:border-white/[0.12]">
                    <button
                        type="button"
                        onClick={() => setOpen(true)}
                        className="flex min-w-0 flex-1 items-center gap-2 text-right text-[12.5px] font-bold text-gray-900 dark:text-white"
                    >
                        <CalendarRange size={14} className="shrink-0 text-indigo-500" />
                        <span className={`truncate ${has ? "" : "text-gray-400"}`}>
                            {has
                                ? `${from ? formatJalaliDate(from) : "…"} تا ${to ? formatJalaliDate(to) : "…"}`
                                : "انتخاب بازه"}
                        </span>
                    </button>
                    {has && (
                        <button
                            type="button"
                            aria-label="پاک کردن"
                            onClick={() => onChange(undefined, undefined)}
                            className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-gray-100 text-gray-400 dark:bg-white/10"
                        >
                            <X size={12} />
                        </button>
                    )}
                </div>
            </div>
            <TimeRangeModal
                open={open}
                title="بازه تاریخ"
                dateOnly
                subtitle="از تاریخ و تا تاریخ"
                initialStartedAt={toIso(from, false)}
                initialDeadline={toIso(to, true) ?? toIso(from, true)}
                onClose={() => setOpen(false)}
                onSubmit={async (s, d) => {
                    onChange(toDay(s), toDay(d));
                    setOpen(false);
                }}
            />
        </>
    );
}
