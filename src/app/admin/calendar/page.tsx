"use client";

import { useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronRight, ChevronLeft, CalendarDays, Loader2, CalendarClock } from "lucide-react";
import api from "@/lib/axiosInstance";
import { toJalali, toPersianDigits, JALALI_MONTHS } from "@/lib/jalali";

interface CalendarEvent {
    id: number;
    title: string;
    start: string;
    end: string;
    type: string;
}

type RangeType = "week" | "month" | "season" | "year";

const RANGE_LABELS: Record<RangeType, string> = {
    week: "هفته",
    month: "ماه",
    season: "فصل",
    year: "سال",
};

const PERSIAN_DAYS = ["شنبه", "یک‌شنبه", "دوشنبه", "سه‌شنبه", "چهارشنبه", "پنج‌شنبه", "جمعه"];

function toISODate(d: Date) {
    return d.toISOString().slice(0, 10);
}

function dayIndex(d: Date) {
    return (d.getDay() + 1) % 7;
}

function getRangeDates(anchor: Date, range: RangeType): { start: Date; end: Date; days: Date[] } {
    const s = new Date(anchor);
    const e = new Date(anchor);

    if (range === "week") {
        s.setDate(anchor.getDate() - dayIndex(anchor));
        e.setDate(s.getDate() + 6);
    } else if (range === "month") {
        s.setDate(1);
        e.setMonth(s.getMonth() + 1);
        e.setDate(0);
    } else if (range === "season") {
        const seasonStart = Math.floor(s.getMonth() / 3) * 3;
        s.setMonth(seasonStart, 1);
        e.setMonth(seasonStart + 3, 0);
    } else {
        s.setMonth(0, 1);
        e.setMonth(12, 0);
    }

    const days: Date[] = [];
    const cur = new Date(s);
    while (cur <= e) {
        days.push(new Date(cur));
        cur.setDate(cur.getDate() + 1);
    }

    return { start: s, end: e, days };
}

function toJalaliParts(d: Date) {
    return toJalali(d.getFullYear(), d.getMonth() + 1, d.getDate());
}

function jalaliLabel(d: Date) {
    const [jy, jm, jd] = toJalaliParts(d);
    return `${toPersianDigits(jd)} ${JALALI_MONTHS[jm - 1]} ${toPersianDigits(jy)}`;
}

function advance(anchor: Date, range: RangeType, dir: 1 | -1): Date {
    const d = new Date(anchor);
    if (range === "week") d.setDate(d.getDate() + dir * 7);
    else if (range === "month") d.setMonth(d.getMonth() + dir);
    else if (range === "season") d.setMonth(d.getMonth() + dir * 3);
    else d.setFullYear(d.getFullYear() + dir);
    return d;
}

const TYPE_DOT: Record<string, string> = {
    task: "bg-blue-500",
};

const TYPE_TEXT: Record<string, string> = {
    task: "text-blue-700 dark:text-blue-300",
};

function eventDot(type: string) {
    return TYPE_DOT[type] ?? "bg-gray-400 dark:bg-white/30";
}

function eventText(type: string) {
    return TYPE_TEXT[type] ?? "text-gray-600 dark:text-white/60";
}

export default function CalendarPage() {
    const [range, setRange] = useState<RangeType>("week");
    const [anchor, setAnchor] = useState(() => new Date());
    const [events, setEvents] = useState<CalendarEvent[]>([]);
    const [loading, setLoading] = useState(false);
    const [dir, setDir] = useState<1 | -1>(1);

    const { start, end, days } = getRangeDates(anchor, range);
    const startISO = toISODate(start);
    const endISO = toISODate(end);

    useEffect(() => {
        setLoading(true);
        api
            .get(`/appraisal/api/v1/calendar/?start=${startISO}&end=${endISO}`)
            .then((r) => setEvents(r.data.events ?? []))
            .catch(() => setEvents([]))
            .finally(() => setLoading(false));
    }, [startISO, endISO]);

    function eventsForDay(d: Date) {
        const iso = toISODate(d);
        return events.filter((e) => e.start.slice(0, 10) <= iso && e.end.slice(0, 10) >= iso);
    }

    function goto(delta: 1 | -1) {
        setDir(delta);
        setAnchor((a) => advance(a, range, delta));
    }

    function gotoToday() {
        setDir(1);
        setAnchor(new Date());
    }

    const today = toISODate(new Date());

    const weeks: (Date | null)[][] = [];
    if (range === "week") {
        weeks.push(days);
    } else {
        let current: (Date | null)[] = Array(dayIndex(days[0])).fill(null);
        for (const d of days) {
            if (current.length === 7) {
                weeks.push(current);
                current = [];
            }
            current.push(d);
        }
        while (current.length < 7) current.push(null);
        weeks.push(current);
    }

    return (
        <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white dark:from-[#0b1220] dark:to-[#0f172a] p-4 md:p-8" dir="rtl">
            <div className="mx-auto max-w-6xl">
                <div className="mb-5 flex flex-wrap items-center justify-between gap-3 rounded-4xl border border-gray-100 dark:border-white/[0.06] bg-white/70 dark:bg-white/[0.03] backdrop-blur-xl p-3 px-5">
                    <div className="flex items-center gap-3">
                        <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-gradient-to-br from-blue-500 to-indigo-600 shadow-lg shadow-blue-500/20">
                            <CalendarDays size={18} className="text-white" />
                        </div>
                        <div className="flex flex-col">
                            <h1 className="text-[15px] font-extrabold text-gray-900 dark:text-white">تقویم</h1>
                            <AnimatePresence mode="wait">
                                <motion.span
                                    key={startISO + endISO}
                                    initial={{ opacity: 0, y: 6 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    exit={{ opacity: 0, y: -6 }}
                                    transition={{ duration: 0.2 }}
                                    className="text-[11px] font-bold text-gray-400 dark:text-white/35"
                                >
                                    {jalaliLabel(start)} تا {jalaliLabel(end)}
                                </motion.span>
                            </AnimatePresence>
                        </div>
                    </div>

                    <div className="flex items-center gap-2">
                        <button
                            onClick={gotoToday}
                            className="flex items-center gap-1.5 rounded-2xl bg-gray-100 dark:bg-white/[0.05] px-3 py-1.5 text-[12px] font-bold text-gray-600 dark:text-white/50 hover:bg-gray-200 dark:hover:bg-white/[0.08] transition-colors"
                        >
                            <CalendarClock size={13} />
                            امروز
                        </button>

                        <div className="relative flex rounded-2xl border border-gray-100 dark:border-white/[0.06] bg-gray-50 dark:bg-white/[0.02] p-1">
                            {(Object.keys(RANGE_LABELS) as RangeType[]).map((r) => (
                                <button
                                    key={r}
                                    onClick={() => {
                                        setRange(r);
                                        setAnchor(new Date());
                                    }}
                                    className={`relative z-10 px-3 py-1.5 text-[12px] font-bold transition-colors ${range === r ? "text-white" : "text-gray-400 dark:text-white/30 hover:text-gray-600 dark:hover:text-white/50"
                                        }`}
                                >
                                    {range === r && (
                                        <motion.div
                                            layoutId="range-pill"
                                            transition={{ type: "spring", stiffness: 400, damping: 30 }}
                                            className="absolute inset-0 -z-10 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 shadow-md shadow-blue-500/20"
                                        />
                                    )}
                                    {RANGE_LABELS[r]}
                                </button>
                            ))}
                        </div>

                        <div className="flex items-center gap-1">
                            <motion.button
                                whileTap={{ scale: 0.85 }}
                                onClick={() => goto(1)}
                                className="flex h-8 w-8 items-center justify-center rounded-xl bg-gray-100 dark:bg-white/[0.05] text-gray-500 dark:text-white/40 hover:text-gray-700 dark:hover:text-white/70 transition-colors"
                            >
                                <ChevronRight size={16} />
                            </motion.button>
                            <motion.button
                                whileTap={{ scale: 0.85 }}
                                onClick={() => goto(-1)}
                                className="flex h-8 w-8 items-center justify-center rounded-xl bg-gray-100 dark:bg-white/[0.05] text-gray-500 dark:text-white/40 hover:text-gray-700 dark:hover:text-white/70 transition-colors"
                            >
                                <ChevronLeft size={16} />
                            </motion.button>
                        </div>
                    </div>
                </div>

                <div className="relative overflow-hidden rounded-4xl border border-gray-100 dark:border-white/[0.06] bg-white dark:bg-white/[0.02]">
                    {loading && (
                        <div className="absolute left-4 top-4 z-20">
                            <Loader2 size={16} className="animate-spin text-blue-500" />
                        </div>
                    )}

                    <div className="grid grid-cols-7 border-b border-gray-100 dark:border-white/[0.06]">
                        {PERSIAN_DAYS.map((name) => (
                            <div
                                key={name}
                                className="py-2.5 text-center text-[11px] font-semibold text-gray-400 dark:text-white/25 border-r border-gray-50 dark:border-white/[0.04] first:border-r-0"
                            >
                                {name}
                            </div>
                        ))}
                    </div>

                    <AnimatePresence mode="wait" custom={dir}>
                        <motion.div
                            key={startISO + range}
                            custom={dir}
                            initial={{ opacity: 0, x: dir * 24 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: dir * -24 }}
                            transition={{ duration: 0.25, ease: "easeOut" }}
                        >
                            {weeks.map((week, wi) => (
                                <div
                                    key={wi}
                                    className="grid grid-cols-7 border-b border-gray-50 dark:border-white/[0.04] last:border-b-0"
                                    style={{ minHeight: range === "week" ? 320 : 110 }}
                                >
                                    {week.map((d, di) => {
                                        if (!d)
                                            return (
                                                <div
                                                    key={`empty-${di}`}
                                                    className="border-r border-gray-50 dark:border-white/[0.04] first:border-r-0 bg-gray-50/60 dark:bg-black/10"
                                                />
                                            );
                                        const iso = toISODate(d);
                                        const isToday = iso === today;
                                        const dayEvs = eventsForDay(d);
                                        const visible = dayEvs.slice(0, range === "week" ? 6 : 2);
                                        const rest = dayEvs.length - visible.length;
                                        const [, , jd] = toJalaliParts(d);

                                        return (
                                            <motion.div
                                                key={iso}
                                                initial={{ opacity: 0, scale: 0.96 }}
                                                animate={{ opacity: 1, scale: 1 }}
                                                transition={{ duration: 0.2, delay: (wi * 7 + di) * 0.01 }}
                                                className={`group flex flex-col gap-1 p-1.5 border-r border-gray-50 dark:border-white/[0.04] first:border-r-0 transition-colors ${isToday ? "bg-blue-50/50 dark:bg-blue-500/[0.06]" : "hover:bg-gray-50/60 dark:hover:bg-white/[0.015]"
                                                    }`}
                                            >
                                                <div className="flex items-center justify-center">
                                                    <span
                                                        className={`flex h-6 w-6 items-center justify-center rounded-full text-[11px] font-extrabold transition-all ${isToday
                                                                ? "bg-gradient-to-br from-blue-500 to-indigo-600 text-white shadow-md shadow-blue-500/30"
                                                                : "text-gray-500 dark:text-white/40 group-hover:text-gray-700 dark:group-hover:text-white/60"
                                                            }`}
                                                    >
                                                        {toPersianDigits(jd)}
                                                    </span>
                                                </div>

                                                <div className="flex flex-col gap-1">
                                                    {visible.map((ev) => (
                                                        <div
                                                            key={ev.id}
                                                            title={ev.title}
                                                            className="flex items-center gap-1.5 rounded-lg bg-gray-50 dark:bg-white/[0.04] px-1.5 py-1"
                                                        >
                                                            <span className={`h-1.5 w-1.5 shrink-0 rounded-full ${eventDot(ev.type)}`} />
                                                            <span className={`line-clamp-1 text-[10px] font-bold leading-snug ${eventText(ev.type)}`}>
                                                                {ev.title}
                                                            </span>
                                                        </div>
                                                    ))}
                                                    {rest > 0 && (
                                                        <span className="px-1.5 text-[10px] font-bold text-gray-400 dark:text-white/30">
                                                            + {toPersianDigits(rest)} مورد دیگر
                                                        </span>
                                                    )}
                                                </div>
                                            </motion.div>
                                        );
                                    })}
                                </div>
                            ))}
                        </motion.div>
                    </AnimatePresence>
                </div>
            </div>
        </div>
    );
}
