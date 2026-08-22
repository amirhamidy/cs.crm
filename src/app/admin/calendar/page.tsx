"use client";

import { useEffect, useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
    ChevronRight,
    ChevronLeft,
    CalendarDays,
    CalendarClock,
    MessageSquareText,
    Layers3,
} from "lucide-react";
import api from "@/lib/axiosInstance";
import { toJalali, toPersianDigits, JALALI_MONTHS } from "@/lib/jalali";
import CalendarNoteModal, { CalendarNote } from "./CalendarNoteModal";

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

const weekDays = ["ش", "ی", "د", "س", "چ", "پ", "ج"];

const EVENT_TYPE_LABEL: Record<string, string> = {
    meeting: "جلسه",
    task: "وظیفه",
    reminder: "یادآور",
    deadline: "مهلت",
    note: "یادداشت",
};

const EVENT_TYPE_COLOR: Record<string, { bg: string; text: string; dot: string }> = {
    meeting: { bg: "bg-violet-500/10", text: "text-violet-400", dot: "bg-violet-400" },
    task: { bg: "bg-blue-500/10", text: "text-blue-400", dot: "bg-blue-200" },
    reminder: { bg: "bg-sky-500/10", text: "text-sky-400", dot: "bg-sky-400" },
    deadline: { bg: "bg-rose-500/10", text: "text-rose-400", dot: "bg-rose-400" },
    note: { bg: "bg-emerald-500/10", text: "text-emerald-400", dot: "bg-emerald-400" },
    default: { bg: "bg-gray-500/10", text: "text-gray-400", dot: "bg-gray-400" },
};

function getTypeStyle(type: string) {
    return EVENT_TYPE_COLOR[type] ?? EVENT_TYPE_COLOR.default;
}

const extractNoteInfo = (description: string, rawCreatedAt?: string) => {
    const match = description.match(/^\[DATE:(\d{4}-\d{2}-\d{2})\]\s*([\s\S]*)$/);
    if (match) return { cleanDescription: match[2], targetDate: match[1] };
    return { cleanDescription: description, targetDate: rawCreatedAt ? rawCreatedAt.split("T")[0] : "" };
};

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

function DayEventDots({ events }: { events: CalendarEvent[] }) {
    const grouped = useMemo(() => {
        const map = new Map<string, number>();
        events.forEach((e) => map.set(e.type, (map.get(e.type) || 0) + 1));
        return Array.from(map.entries()).slice(0, 4);
    }, [events]);

    return (
        <div className="flex flex-wrap gap-1 mt-auto">
            {grouped.map(([type, count]) => {
                const s = getTypeStyle(type);
                return (
                    <span key={type} className={`flex items-center gap-1 rounded-md px-1.5 py-0.5 text-[9px] font-bold ${s.bg} ${s.text}`}>
                        <span className={`h-1.5 w-1.5 rounded-full ${s.dot}`} />
                        {count}
                    </span>
                );
            })}
        </div>
    );
}

export default function CalendarPage() {
    const [range, setRange] = useState<RangeType>("week");
    const [anchor, setAnchor] = useState(() => new Date());
    const [events, setEvents] = useState<CalendarEvent[]>([]);
    const [notes, setNotes] = useState<CalendarNote[]>([]);
    const [loading, setLoading] = useState(true);
    const [dir, setDir] = useState<1 | -1>(1);
    const [selectedDate, setSelectedDate] = useState<Date | null>(null);
    const [isModalOpen, setIsModalOpen] = useState(false);

    const { start, end, days } = getRangeDates(anchor, range);
    const startISO = toISODate(start);
    const endISO = toISODate(end);

    useEffect(() => {
        const fetchRangeData = async () => {
            setLoading(true);
            try {
                const [calendarRes, notesRes] = await Promise.all([
                    api.get(`/appraisal/api/v1/calendar/?start=${startISO}&end=${endISO}`),
                    api.get("/note/api/v1/"),
                ]);
                setEvents(Array.isArray(calendarRes.data?.events) ? calendarRes.data.events : []);
                setNotes(Array.isArray(notesRes.data) ? notesRes.data : []);
            } catch {
                setEvents([]);
                setNotes([]);
            } finally {
                setLoading(false);
            }
        };
        fetchRangeData();
    }, [startISO, endISO]);

    function eventsForDay(d: Date) {
        const iso = toISODate(d);
        return events.filter((e) => e.start.slice(0, 10) <= iso && e.end.slice(0, 10) >= iso);
    }

    const noteCountByDay = useMemo(() => {
        const map = new Map<string, number>();
        notes.forEach((n) => {
            const { targetDate } = extractNoteInfo(n.description, n.created_at);
            if (!targetDate) return;
            map.set(targetDate, (map.get(targetDate) || 0) + 1);
        });
        return map;
    }, [notes]);

    function goto(delta: 1 | -1) {
        setDir(delta);
        setAnchor((a) => advance(a, range, delta));
    }

    function gotoToday() {
        setDir(1);
        setAnchor(new Date());
    }

    function handleSelectDate(date: Date) {
        setSelectedDate(date);
        setIsModalOpen(true);
    }

    const today = toISODate(new Date());
    const totalEventCount = events.length;
    const totalNoteCount = notes.length;

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

    const flatCells = weeks.flat();

    return (
        <>
            <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white dark:from-[#0b1220] dark:to-[#0f172a] p-4 md:p-8" dir="rtl">
                <div className="mx-auto max-w-5xl rounded-[2rem] border border-gray-100 dark:border-white/[0.06] bg-white dark:bg-[#0f172a] shadow-sm overflow-hidden">

                    <div className="flex items-center justify-between border-b border-gray-100 dark:border-white/[0.06] px-6 py-4">
                        <button
                            type="button"
                            onClick={() => goto(1)}
                            className="flex h-8 w-8 items-center justify-center rounded-xl bg-gray-100 dark:bg-white/[0.05] text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 transition-colors"
                        >
                            <ChevronRight size={14} />
                        </button>

                        <div className="flex items-center gap-3">
                            <div className="flex h-7 w-7 items-center justify-center rounded-xl bg-blue-50 dark:bg-blue-500/10">
                                <CalendarDays size={13} className="text-blue-500" />
                            </div>
                            <div className="flex flex-col items-center">
                                <h2 className="text-[13.5px] font-extrabold text-gray-900 dark:text-white tracking-tight">تقویم</h2>
                                <AnimatePresence mode="wait">
                                    <motion.span
                                        key={startISO + endISO}
                                        initial={{ opacity: 0, y: 6 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        exit={{ opacity: 0, y: -6 }}
                                        transition={{ duration: 0.2 }}
                                        className="text-[10px] font-bold text-gray-400 dark:text-white/35"
                                    >
                                        {jalaliLabel(start)} تا {jalaliLabel(end)}
                                    </motion.span>
                                </AnimatePresence>
                            </div>
                        </div>

                        <button
                            type="button"
                            onClick={() => goto(-1)}
                            className="flex h-8 w-8 items-center justify-center rounded-xl bg-gray-100 dark:bg-white/[0.05] text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 transition-colors"
                        >
                            <ChevronLeft size={14} />
                        </button>
                    </div>

                    {!loading && (
                        <div className="flex items-center gap-4 border-b border-gray-100 dark:border-white/[0.06] px-6 py-2.5">
                            <span className="flex items-center gap-1.5 text-[10.5px] font-semibold text-amber-500">
                                <Layers3 size={11} />
                                {toPersianDigits(totalEventCount)} رویداد
                            </span>
                            <span className="h-3 w-px bg-gray-200 dark:bg-white/10" />
                            <span className="flex items-center gap-1.5 text-[10.5px] font-semibold text-emerald-500">
                                <MessageSquareText size={11} />
                                {toPersianDigits(totalNoteCount)} یادداشت
                            </span>
                            <span className="mr-auto flex flex-wrap gap-2">
                                {Object.entries(EVENT_TYPE_COLOR)
                                    .filter(([k]) => k !== "default")
                                    .map(([type, s]) => (
                                        <span key={type} className={`flex items-center gap-1 text-[9.5px] font-bold ${s.text}`}>
                                            <span className={`h-1.5 w-1.5 rounded-full ${s.dot}`} />
                                            {EVENT_TYPE_LABEL[type] ?? type}
                                        </span>
                                    ))}
                            </span>
                        </div>
                    )}

                    <div className="flex flex-wrap items-center gap-2 border-b border-gray-100 dark:border-white/[0.06] px-6 py-2.5">
                        <button
                            onClick={gotoToday}
                            className="flex items-center gap-1.5 rounded-xl bg-gray-100 dark:bg-white/[0.05] px-3 py-1.5 text-[11px] font-bold text-gray-500 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-white/[0.08] transition-colors"
                        >
                            <CalendarClock size={12} />
                            امروز
                        </button>

                        <div className="relative flex rounded-xl border border-gray-100 dark:border-white/[0.06] bg-gray-50 dark:bg-white/[0.02] p-1">
                            {(Object.keys(RANGE_LABELS) as RangeType[]).map((r) => (
                                <button
                                    key={r}
                                    onClick={() => {
                                        setRange(r);
                                        setAnchor(new Date());
                                    }}
                                    className={`relative z-10 px-3 py-1.5 text-[11px] font-bold transition-colors ${range === r ? "text-white" : "text-gray-400 dark:text-white/30 hover:text-gray-600 dark:hover:text-white/50"
                                        }`}
                                >
                                    {range === r && (
                                        <motion.div
                                            layoutId="range-pill"
                                            transition={{ type: "spring", stiffness: 400, damping: 30 }}
                                            className="absolute inset-0 -z-10 rounded-lg bg-gradient-to-br from-blue-500 to-indigo-500 shadow-sm shadow-blue-500/30"
                                        />
                                    )}
                                    {RANGE_LABELS[r]}
                                </button>
                            ))}
                        </div>
                    </div>

                    <div className="grid grid-cols-7 gap-px bg-gray-100 dark:bg-white/[0.04]">
                        {weekDays.map((d) => (
                            <div key={d} className="bg-gray-50 dark:bg-[#0f172a] py-2.5 text-center text-[10px] font-bold text-gray-400 tracking-wide">
                                {d}
                            </div>
                        ))}

                        {loading ? (
                            <div className="col-span-7 flex flex-col items-center justify-center gap-2.5 bg-white dark:bg-[#0f172a] py-20">
                                <motion.div
                                    animate={{ rotate: 360 }}
                                    transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                                    className="h-5 w-5 rounded-full border-2 border-blue-500/20 border-t-blue-500"
                                />
                                <p className="text-[11px] font-semibold text-gray-400">در حال دریافت تقویم...</p>
                            </div>
                        ) : (
                            <AnimatePresence mode="wait" custom={dir}>
                                <motion.div
                                    key={startISO + range}
                                    custom={dir}
                                    initial={{ opacity: 0, x: dir * 24 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    exit={{ opacity: 0, x: dir * -24 }}
                                    transition={{ duration: 0.25, ease: "easeOut" }}
                                    className="col-span-7 grid grid-cols-7 gap-px bg-gray-100 dark:bg-white/[0.04]"
                                >
                                    {flatCells.map((date, index) => {
                                        if (!date) return (
                                            <div key={`empty-${index}`} className="min-h-[96px] bg-gray-50/40 dark:bg-white/[0.008]" />
                                        );

                                        const iso = toISODate(date);
                                        const dayEvents = eventsForDay(date);
                                        const noteCount = noteCountByDay.get(iso) ?? 0;
                                        const isToday = iso === today;
                                        const [, , jd] = toJalaliParts(date);

                                        return (
                                            <motion.button
                                                key={iso}
                                                type="button"
                                                whileTap={{ scale: 0.97 }}
                                                onClick={() => handleSelectDate(date)}
                                                className="relative flex min-h-[96px] flex-col gap-1.5 p-2.5 text-right bg-white dark:bg-[#0f172a] hover:bg-gray-50 dark:hover:bg-white/[0.03] transition-colors"
                                            >
                                                <div className="flex items-start justify-between gap-1">
                                                    <span className={`flex h-6 w-6 items-center justify-center rounded-lg text-[11px] font-extrabold flex-shrink-0 ${isToday
                                                        ? "bg-gradient-to-br from-blue-500 to-indigo-500 text-white shadow-sm shadow-blue-500/30"
                                                        : "bg-gray-50 dark:bg-white/[0.04] text-gray-600 dark:text-gray-300"
                                                        }`}>
                                                        {toPersianDigits(jd)}
                                                    </span>

                                                    <div className="flex flex-col items-end gap-0.5">
                                                        {noteCount > 0 && (
                                                            <span className="flex items-center gap-0.5 text-[8.5px] font-bold text-emerald-500">
                                                                <MessageSquareText size={8} />
                                                                {toPersianDigits(noteCount)}
                                                            </span>
                                                        )}
                                                    </div>
                                                </div>

                                                {dayEvents.length > 0 && <DayEventDots events={dayEvents} />}
                                            </motion.button>
                                        );
                                    })}
                                </motion.div>
                            </AnimatePresence>
                        )}
                    </div>
                </div>
            </div>

            <CalendarNoteModal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                selectedDate={selectedDate}
                notes={notes}
                events={events}
                onCreated={(note) => setNotes((prev) => [note, ...prev])}
                onDeleted={(id) => setNotes((prev) => prev.filter((n) => n.id !== id))}
            />
        </>
    );
}