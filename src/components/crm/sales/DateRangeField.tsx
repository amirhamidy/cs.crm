"use client";

import { useState } from "react";
import { CalendarRange, X } from "lucide-react";
import TimeRangeModal from "../../tasks/TimeRangeModal";
import { formatJalaliDate } from "@/lib/crm/format";

interface Props {
    from: string | undefined;
    to: string | undefined;
    onChange: (from: string | undefined, to: string | undefined) => void;
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

export function DateRangeField({ from, to, onChange }: Props) {
    const [open, setOpen] = useState(false);
    const has = Boolean(from || to);

    return (
        <>
            <div className="flex h-12 items-center gap-2 rounded-[2rem] border border-gray-100 bg-white px-4 dark:border-white/[0.06] dark:bg-white/[0.03]">
                <button
                    type="button"
                    onClick={() => setOpen(true)}
                    className="flex min-w-0 flex-1 items-center gap-2 text-right text-[13px] font-bold text-gray-700 dark:text-gray-200"
                >
                    <CalendarRange size={16} className="shrink-0 text-indigo-500" />
                    <span className="truncate">
                        {has
                            ? `${from ? formatJalaliDate(from) : "…"} تا ${to ? formatJalaliDate(to) : "…"}`
                            : "بازه تاریخ"}
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
