"use client";

import { useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import {
    ChevronLeft,
    ChevronRight,
    CalendarDays,
    CalendarClock,
    MessageSquareText,
    Layers3,
} from "lucide-react";
import axiosInstance from "@/lib/axiosInstance";
import {
    toJalali,
    toGregorian,
    jalaliMonthLength,
    jalaliWeekday,
    toPersianDigits,
    JALALI_MONTHS,
    pad2,
} from "@/lib/jalali";
import CalendarNoteModal, { CalendarNote } from "./CalendarNoteModal";

interface CalendarEvent {
    id: number;
    title: string;
    start: string;
    end: string;
    type: string;
}

const weekDays = ["شنبه", "یکشنبه", "دوشنبه", "سه شنبه", "چهارشنبه", "پنجشنبه", "جمعه"];

const toISODate = (d: Date) => `${d.getFullYear()}-${pad2(d.getMonth() + 1)}-${pad2(d.getDate())}`;
const toJalaliParts = (d: Date) => toJalali(d.getFullYear(), d.getMonth() + 1, d.getDate());

const jalaliToDate = (jy: number, jm: number, jd: number): Date => {
    const [gy, gm, gd] = toGregorian(jy, jm, jd);
    return new Date(gy, gm - 1, gd);
};

const extractNoteInfo = (description: string, rawCreatedAt?: string) => {
    const match = description.match(/^\[DATE:(\d{4}-\d{2}-\d{2})\]\s*([\s\S]*)$/);
    if (match) return { cleanDescription: match[2], targetDate: match[1] };
    return { cleanDescription: description, targetDate: rawCreatedAt ? rawCreatedAt.split("T")[0] : "" };
};

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
    const [currentMonthDate, setCurrentMonthDate] = useState(() => {
        const [jy, jm] = toJalaliParts(new Date());
        return jalaliToDate(jy, jm, 1);
    });

    const [calendarEvents, setCalendarEvents] = useState<CalendarEvent[]>([]);
    const [notes, setNotes] = useState<CalendarNote[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedDate, setSelectedDate] = useState<Date | null>(null);
    const [isModalOpen, setIsModalOpen] = useState(false);

    const [jy, jm] = useMemo(() => toJalaliParts(currentMonthDate), [currentMonthDate]);

    const { monthCells, startISO, endISO } = useMemo(() => {
        const mLen = jalaliMonthLength(jy, jm);
        const firstDayWeekIndex = jalaliWeekday(jy, jm, 1);
        const cells: (Date | null)[] = Array(firstDayWeekIndex).fill(null);

        for (let d = 1; d <= mLen; d++) {
            cells.push(jalaliToDate(jy, jm, d));
        }

        while (cells.length % 7 !== 0) {
            cells.push(null);
        }

        const start = jalaliToDate(jy, jm, 1);
        const end = jalaliToDate(jy, jm, mLen);

        return {
            monthCells: cells,
            startISO: toISODate(start),
            endISO: toISODate(end),
        };
    }, [jy, jm]);

    useEffect(() => {
        const fetchMonthData = async () => {
            setLoading(true);
            try {
                const [calendarRes, notesRes] = await Promise.all([
                    axiosInstance.get(`/appraisal/api/v1/calendar/?start=${startISO}&end=${endISO}`),
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
        fetchMonthData();
    }, [startISO, endISO]);

    const eventsByDay = useMemo(() => {
        const map = new Map<string, CalendarEvent[]>();
        calendarEvents.forEach((ev) => {
            if (!ev.start) return;
            const sKey = ev.start.slice(0, 10);
            const eKey = ev.end ? ev.end.slice(0, 10) : sKey;
            
            monthCells.forEach((d) => {
                if (!d) return;
                const dKey = toISODate(d);
                if (sKey <= dKey && eKey >= dKey) {
                    if (!map.has(dKey)) map.set(dKey, []);
                    map.get(dKey)!.push(ev);
                }
            });
        });
        return map;
    }, [calendarEvents, monthCells]);

    const noteCountByDay = useMemo(() => {
        const map = new Map<string, number>();
        notes.forEach((n) => {
            const { targetDate } = extractNoteInfo(n.description, n.created_at);
            if (!targetDate) return;
            map.set(targetDate, (map.get(targetDate) || 0) + 1);
        });
        return map;
    }, [notes]);

    const changeMonth = (delta: 1 | -1) => {
        let nextM = jm + delta;
        let nextY = jy;
        if (nextM > 12) {
            nextM = 1;
            nextY += 1;
        } else if (nextM < 1) {
            nextM = 12;
            nextY -= 1;
        }
        setCurrentMonthDate(jalaliToDate(nextY, nextM, 1));
    };

    const handleSelectDate = (date: Date) => {
        setSelectedDate(date);
        setIsModalOpen(true);
    };

    const gotoToday = () => {
        const now = new Date();
        const [nowY, nowM] = toJalaliParts(now);
        setCurrentMonthDate(jalaliToDate(nowY, nowM, 1));
        setSelectedDate(now);
        setIsModalOpen(true);
    };

    const todayISO = toISODate(new Date());
    const [nowJy, nowJm, nowJd] = toJalaliParts(new Date());
    const todayPersian = `${toPersianDigits(nowJd)} ${JALALI_MONTHS[nowJm - 1]}`;

    return (
        <>
            <div dir="rtl" className="w-full max-w-5xl mx-auto rounded-[2rem] border border-gray-100 dark:border-white/[0.06] bg-white dark:bg-[#0f172a] shadow-sm overflow-hidden">

                <div className="flex items-center justify-between border-b border-gray-100 dark:border-white/[0.06] px-6 py-4">
                    <button
                        type="button"
                        onClick={() => changeMonth(1)}
                        className="flex h-8 w-8 items-center justify-center rounded-xl bg-gray-100 dark:bg-white/[0.05] text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 transition-colors"
                    >
                        <ChevronRight size={14} />
                    </button>

                    <div className="flex items-center gap-3">
                        <div className="flex h-7 w-7 items-center justify-center rounded-xl bg-blue-50 dark:bg-blue-500/10">
                            <CalendarDays size={13} className="text-blue-500" />
                        </div>
                        <h2 className="text-[13.5px] font-extrabold text-gray-900 dark:text-white tracking-tight">
                            {JALALI_MONTHS[jm - 1]} {toPersianDigits(jy)}
                            <span className="mr-2 text-[11px] font-semibold text-blue-500 dark:text-blue-400">
                                (امروز: {todayPersian})
                            </span>
                        </h2>
                    </div>

                    <button
                        type="button"
                        onClick={() => changeMonth(-1)}
                        className="flex h-8 w-8 items-center justify-center rounded-xl bg-gray-100 dark:bg-white/[0.05] text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 transition-colors"
                    >
                        <ChevronLeft size={14} />
                    </button>
                </div>

                {!loading && (
                    <div className="flex items-center gap-4 border-b border-gray-100 dark:border-white/[0.06] px-6 py-2.5">
                        <span className="flex items-center gap-1.5 text-[10.5px] font-semibold text-amber-500">
                            <Layers3 size={11} />
                            {toPersianDigits(calendarEvents.length)} رویداد
                        </span>
                        <span className="h-3 w-px bg-gray-200 dark:bg-white/10" />
                        <span className="flex items-center gap-1.5 text-[10.5px] font-semibold text-emerald-500">
                            <MessageSquareText size={11} />
                            {toPersianDigits(notes.length)} یادداشت
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

                <div className="flex items-center border-b border-gray-100 dark:border-white/[0.06] px-6 py-2">
                    <button
                        onClick={gotoToday}
                        className="flex items-center gap-1.5 rounded-xl bg-gray-100 dark:bg-white/[0.05] px-3 py-1.5 text-[11px] font-bold text-gray-500 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-white/[0.08] transition-colors"
                    >
                        <CalendarClock size={12} />
                        امروز
                    </button>
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
                        monthCells.map((date, index) => {
                            if (!date) {
                                return <div key={`empty-${index}`} className="min-h-[96px] bg-gray-50/40 dark:bg-white/[0.008]" />;
                            }

                            const iso = toISODate(date);
                            const dayEvents = eventsByDay.get(iso) ?? [];
                            const noteCount = noteCountByDay.get(iso) ?? 0;
                            const isCurrentDayToday = iso === todayISO;
                            const [, , jd] = toJalaliParts(date);

                            return (
                                <motion.button
                                    key={iso}
                                    type="button"
                                    whileTap={{ scale: 0.97 }}
                                    onClick={() => handleSelectDate(date)}
                                    className={`relative flex min-h-[96px] flex-col gap-1.5 p-2.5 text-right transition-colors ${
                                        isCurrentDayToday
                                            ? "bg-blue-50 dark:bg-blue-500/10 ring-2 ring-blue-500/30 dark:ring-blue-400/30"
                                            : "bg-white dark:bg-[#0f172a] hover:bg-gray-50 dark:hover:bg-white/[0.03]"
                                    }`}
                                >
                                    <div className="flex items-start justify-between gap-1">
                                        <span
                                            className={`flex h-6 w-6 items-center justify-center rounded-lg text-[11px] font-extrabold flex-shrink-0 ${
                                                isCurrentDayToday
                                                    ? "bg-gradient-to-br from-blue-500 to-indigo-500 text-white shadow-sm shadow-blue-500/30"
                                                    : "bg-gray-50 dark:bg-white/[0.04] text-gray-600 dark:text-gray-300"
                                            }`}
                                        >
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
