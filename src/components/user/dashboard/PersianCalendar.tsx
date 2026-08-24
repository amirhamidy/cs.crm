"use client";

import { useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import {
    ChevronLeft,
    ChevronRight,
    CalendarDays,
    MessageSquareText,
    Layers3,
} from "lucide-react";
import axiosInstance from "@/lib/axiosInstance";
import CalendarNoteModal, { CalendarNote } from "./CalendarNoteModal";

interface CalendarEvent {
    id: number;
    title: string;
    start: string;
    end: string;
    type: string;
}

const weekDays = ["شنبه", "یکشنبه", "دوشنبه", "سه شنبه", "چهارشنبه", "پنجشنبه", "جمعه"];

const pad = (v: number) => String(v).padStart(2, "0");
const toDateKey = (d: Date) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;

const extractNoteInfo = (description: string, rawCreatedAt?: string) => {
    const match = description.match(/^\[DATE:(\d{4}-\d{2}-\d{2})\]\s*([\s\S]*)$/);
    if (match) return { cleanDescription: match[2], targetDate: match[1] };
    return { cleanDescription: description, targetDate: rawCreatedAt ? rawCreatedAt.split("T")[0] : "" };
};

const isToday = (d: Date) => {
    const t = new Date();
    return t.getFullYear() === d.getFullYear() && t.getMonth() === d.getMonth() && t.getDate() === d.getDate();
};

const getMonthRange = (base: Date) => ({
    start: new Date(base.getFullYear(), base.getMonth(), 1),
    end: new Date(base.getFullYear(), base.getMonth() + 1, 0),
});

const getDaysInMonth = (date: Date): (Date | null)[] => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const firstDay = new Date(year, month, 1).getDay();
    const offset = firstDay === 6 ? 0 : firstDay + 1;
    const daysCount = new Date(year, month + 1, 0).getDate();
    const cells: (Date | null)[] = Array(offset).fill(null);
    for (let d = 1; d <= daysCount; d++) cells.push(new Date(year, month, d));
    while (cells.length % 7 !== 0) cells.push(null);
    return cells;
};

const getPersianMonthLabel = (date: Date) => {
    const formatter = new Intl.DateTimeFormat("fa-IR-u-ca-persian", {
        year: "numeric",
        month: "long",
        day: "numeric",
    });
    const parts = formatter.formatToParts(date);
    const year = parts.find((p) => p.type === "year")?.value ?? "";
    const month = parts.find((p) => p.type === "month")?.value ?? "";
    const day = parts.find((p) => p.type === "day")?.value ?? "";
    return `${month} ${year}`;
};

const getPersianDayNumber = (d: Date) =>
    new Intl.DateTimeFormat("fa-IR-u-ca-persian", { day: "numeric" }).format(d);

const EVENT_TYPE_LABEL: Record<string, string> = {
    meeting: "جلسه",
    task: "وظیفه",
    reminder: "یادآور",
    deadline: "مهلت",
    note: "یادداشت",
};

const EVENT_TYPE_COLOR: Record<string, { bg: string; text: string; dot: string }> = {
    meeting: { bg: "bg-violet-500/10", text: "text-violet-400", dot: "bg-violet-400" },
    task: { bg: "bg-amber-500/10", text: "text-amber-400", dot: "bg-amber-400" },
    reminder: { bg: "bg-sky-500/10", text: "text-sky-400", dot: "bg-sky-400" },
    deadline: { bg: "bg-rose-500/10", text: "text-rose-400", dot: "bg-rose-400" },
    note: { bg: "bg-emerald-500/10", text: "text-emerald-400", dot: "bg-emerald-400" },
    default: { bg: "bg-gray-500/10", text: "text-gray-400", dot: "bg-gray-400" },
};

function getTypeStyle(type: string) {
    return EVENT_TYPE_COLOR[type] ?? EVENT_TYPE_COLOR.default;
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

export default function PersianCalendar() {
    const [currentMonth, setCurrentMonth] = useState(new Date());
    const [calendarEvents, setCalendarEvents] = useState<CalendarEvent[]>([]);
    const [notes, setNotes] = useState<CalendarNote[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedDate, setSelectedDate] = useState<Date | null>(null);
    const [isModalOpen, setIsModalOpen] = useState(false);

    const monthDays = useMemo(() => getDaysInMonth(currentMonth), [currentMonth]);

    const fetchMonthData = async () => {
        setLoading(true);
        try {
            const { start, end } = getMonthRange(currentMonth);
            const [calendarRes, notesRes] = await Promise.all([
                axiosInstance.get(`/appraisal/api/v1/calendar/?start=${toDateKey(start)}&end=${toDateKey(end)}`),
                axiosInstance.get("/note/api/v1/"),
            ]);
            setCalendarEvents(Array.isArray(calendarRes.data?.events) ? calendarRes.data.events : []);
            setNotes(Array.isArray(notesRes.data) ? notesRes.data : []);
        } catch {
            setCalendarEvents([]);
            setNotes([]);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { fetchMonthData(); }, [currentMonth]);

    const eventsByDay = useMemo(() => {
        const map = new Map<string, CalendarEvent[]>();
        calendarEvents.forEach((ev) => {
            if (!ev.start) return;
            const key = ev.start.split("T")[0];
            if (!map.has(key)) map.set(key, []);
            map.get(key)!.push(ev);
        });
        return map;
    }, [calendarEvents]);

    const noteCountByDay = useMemo(() => {
        const map = new Map<string, number>();
        notes.forEach((n) => {
            const { targetDate } = extractNoteInfo(n.description, n.created_at);
            if (!targetDate) return;
            map.set(targetDate, (map.get(targetDate) || 0) + 1);
        });
        return map;
    }, [notes]);

    const totalEventCount = calendarEvents.length;
    const totalNoteCount = notes.length;

    const handleSelectDate = (date: Date) => {
        setSelectedDate(date);
        setIsModalOpen(true);
    };

    const today = new Date();
    const todayPersian = getPersianDayNumber(today);

    return (
        <>
            <div dir="rtl" className="w-full max-w-5xl mx-auto rounded-[2rem] border border-gray-100 dark:border-white/[0.06] bg-white dark:bg-[#0f172a] shadow-sm overflow-hidden">

                <div className="flex items-center justify-between border-b border-gray-100 dark:border-white/[0.06] px-6 py-4">
                    <button type="button" onClick={() => setCurrentMonth((p) => new Date(p.getFullYear(), p.getMonth() + 1, 1))}
                        className="flex h-8 w-8 items-center justify-center rounded-xl bg-gray-100 dark:bg-white/[0.05] text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 transition-colors">
                        <ChevronRight size={14} />
                    </button>

                    <div className="flex items-center gap-3">
                        <div className="flex h-7 w-7 items-center justify-center rounded-xl bg-blue-50 dark:bg-blue-500/10">
                            <CalendarDays size={13} className="text-blue-500" />
                        </div>
                        <h2 className="text-[13.5px] font-extrabold text-gray-900 dark:text-white tracking-tight">
                            {getPersianMonthLabel(currentMonth)}
                            <span className="mr-2 text-[11px] font-semibold text-blue-500 dark:text-blue-400">
                                (امروز: {todayPersian})
                            </span>
                        </h2>
                    </div>

                    <button type="button" onClick={() => setCurrentMonth((p) => new Date(p.getFullYear(), p.getMonth() - 1, 1))}
                        className="flex h-8 w-8 items-center justify-center rounded-xl bg-gray-100 dark:bg-white/[0.05] text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 transition-colors">
                        <ChevronLeft size={14} />
                    </button>
                </div>

                {!loading && (
                    <div className="flex items-center gap-4 border-b border-gray-100 dark:border-white/[0.06] px-6 py-2.5">
                        <span className="flex items-center gap-1.5 text-[10.5px] font-semibold text-amber-500">
                            <Layers3 size={11} />
                            {totalEventCount} رویداد
                        </span>
                        <span className="h-3 w-px bg-gray-200 dark:bg-white/10" />
                        <span className="flex items-center gap-1.5 text-[10.5px] font-semibold text-emerald-500">
                            <MessageSquareText size={11} />
                            {totalNoteCount} یادداشت
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
                        monthDays.map((date, index) => {
                            if (!date) return (
                                <div key={`empty-${index}`} className="min-h-[96px] bg-gray-50/40 dark:bg-white/[0.008]" />
                            );

                            const key = toDateKey(date);
                            const dayEvents = eventsByDay.get(key) ?? [];
                            const noteCount = noteCountByDay.get(key) ?? 0;
                            const today = isToday(date);
                            const dayNumber = getPersianDayNumber(date);

                            return (
                                <motion.button
                                    key={key}
                                    type="button"
                                    whileTap={{ scale: 0.97 }}
                                    onClick={() => handleSelectDate(date)}
                                    className={`relative flex min-h-[96px] flex-col gap-1.5 p-2.5 text-right transition-colors ${today
                                            ? "bg-blue-50 dark:bg-blue-500/10 ring-2 ring-blue-500/30 dark:ring-blue-400/30"
                                            : "bg-white dark:bg-[#0f172a] hover:bg-gray-50 dark:hover:bg-white/[0.03]"
                                        }`}
                                >
                                    <div className="flex items-start justify-between gap-1">
                                        <span className={`flex h-6 w-6 items-center justify-center rounded-lg text-[11px] font-extrabold flex-shrink-0 ${today
                                                ? "bg-gradient-to-br from-blue-500 to-indigo-500 text-white shadow-sm shadow-blue-500/30"
                                                : "bg-gray-50 dark:bg-white/[0.04] text-gray-600 dark:text-gray-300"
                                            }`}>
                                            {dayNumber}
                                        </span>

                                        <div className="flex flex-col items-end gap-0.5">
                                            {noteCount > 0 && (
                                                <span className="flex items-center gap-0.5 text-[8.5px] font-bold text-emerald-500">
                                                    <MessageSquareText size={8} />
                                                    {noteCount}
                                                </span>
                                            )}
                                        </div>
                                    </div>

                                    {dayEvents.length > 0 && <DayEventDots events={dayEvents} />}
                                </motion.button>
                            );
                        })
                    )}
                </div>
            </div>

            <CalendarNoteModal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                selectedDate={selectedDate}
                notes={notes}
                events={calendarEvents}
                onCreated={(note) => setNotes((prev) => [note, ...prev])}
                onDeleted={(id) => setNotes((prev) => prev.filter((n) => n.id !== id))}
            />
        </>
    );
}