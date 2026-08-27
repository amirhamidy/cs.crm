"use client";

import { useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import {
    ChevronLeft,
    ChevronRight,
    ChevronDown,
    CalendarDays,
    CalendarClock,
    MessageSquareText,
    Layers3,
    CalendarRange,
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

type CalendarView = "month" | "season";

interface MonthData {
    jy: number;
    jm: number;
    monthCells: (Date | null)[];
    startISO: string;
    endISO: string;
}

const weekDays = ["شنبه", "یکشنبه", "دوشنبه", "سه شنبه", "چهارشنبه", "پنجشنبه", "جمعه"];

const QUICK_RANGE_DAYS = 200;

const toISODate = (date: Date) =>
    `${date.getFullYear()}-${pad2(date.getMonth() + 1)}-${pad2(date.getDate())}`;

const toJalaliParts = (date: Date) =>
    toJalali(date.getFullYear(), date.getMonth() + 1, date.getDate());

const jalaliToDate = (jy: number, jm: number, jd: number): Date => {
    const [gy, gm, gd] = toGregorian(jy, jm, jd);
    return new Date(gy, gm - 1, gd);
};

const extractNoteInfo = (description: string, rawCreatedAt?: string) => {
    const match = description.match(/^\[DATE:(\d{4}-\d{2}-\d{2})\]\s*([\s\S]*)$/);

    if (match) {
        return {
            cleanDescription: match[2],
            targetDate: match[1],
        };
    }

    return {
        cleanDescription: description,
        targetDate: rawCreatedAt ? rawCreatedAt.split("T")[0] : "",
    };
};

const EVENT_TYPE_LABEL: Record<string, string> = {
    meeting: "جلسه",
    task: "وظیفه",
    reminder: "یادآور",
    deadline: "مهلت",
    note: "یادداشت",
};

const EVENT_TYPE_COLOR: Record<string, { bg: string; text: string; dot: string }> = {
    meeting: {
        bg: "bg-[#5B5FA6]/10 dark:bg-[#9694E0]/15",
        text: "text-[#5B5FA6] dark:text-[#B7B5EE]",
        dot: "bg-[#6C6FC0] dark:bg-[#9694E0]",
    },
    task: {
        bg: "bg-[#A9823D]/10 dark:bg-[#D9AE6C]/15",
        text: "text-[#A9823D] dark:text-[#E4C48D]",
        dot: "bg-[#BA9450] dark:bg-[#D9AE6C]",
    },
    reminder: {
        bg: "bg-[#3F8E93]/10 dark:bg-[#7EC3C7]/15",
        text: "text-[#3F8E93] dark:text-[#9ED7DA]",
        dot: "bg-[#4B9EA3] dark:bg-[#7EC3C7]",
    },
    deadline: {
        bg: "bg-[#B15667]/10 dark:bg-[#DE93A2]/15",
        text: "text-[#B15667] dark:text-[#EAADB9]",
        dot: "bg-[#BF6576] dark:bg-[#DE93A2]",
    },
    note: {
        bg: "bg-[#4E8B6C]/10 dark:bg-[#8ECBA9]/15",
        text: "text-[#4E8B6C] dark:text-[#A9DABE]",
        dot: "bg-[#5B9C7A] dark:bg-[#8ECBA9]",
    },
    default: {
        bg: "bg-gray-500/[0.06] dark:bg-gray-400/10",
        text: "text-gray-500 dark:text-gray-400",
        dot: "bg-gray-400 dark:bg-gray-500",
    },
};

function getTypeStyle(type: string) {
    return EVENT_TYPE_COLOR[type] ?? EVENT_TYPE_COLOR.default;
}

function getSeasonName(month: number) {
    if (month >= 1 && month <= 3) return "بهار";
    if (month >= 4 && month <= 6) return "تابستان";
    if (month >= 7 && month <= 9) return "پاییز";
    return "زمستان";
}

function getSeasonStartMonth(month: number) {
    return Math.floor((month - 1) / 3) * 3 + 1;
}

function DayEventDots({ events }: { events: CalendarEvent[] }) {
    const grouped = useMemo(() => {
        const map = new Map<string, number>();

        events.forEach((event) => {
            map.set(event.type, (map.get(event.type) || 0) + 1);
        });

        return Array.from(map.entries()).slice(0, 4);
    }, [events]);

    return (
        <div className="mt-auto flex flex-wrap gap-1">
            {grouped.map(([type, count]) => {
                const style = getTypeStyle(type);

                return (
                    <span
                        key={type}
                        className={`flex items-center gap-1 rounded-md px-1.5 py-0.5 text-[9px] font-bold ${style.bg} ${style.text}`}
                    >
                        <span className={`h-1.5 w-1.5 rounded-full ${style.dot}`} />
                        {toPersianDigits(count)}
                    </span>
                );
            })}
        </div>
    );
}

function CalendarMonthGrid({
    month,
    eventsByDay,
    noteCountByDay,
    todayISO,
    onSelectDate,
}: {
    month: MonthData;
    eventsByDay: Map<string, CalendarEvent[]>;
    noteCountByDay: Map<string, number>;
    todayISO: string;
    onSelectDate: (date: Date) => void;
}) {
    return (
        <section className="overflow-hidden rounded-[1.5rem] border border-gray-100 bg-white dark:border-white/[0.06] dark:bg-[#0f172a]">
            <div className="flex items-center justify-between border-b border-gray-100 bg-gray-50/80 px-5 py-3 dark:border-white/[0.06] dark:bg-white/[0.02]">
                <div className="flex items-center gap-2">
                    <div className="flex h-7 w-7 items-center justify-center rounded-xl bg-indigo-50 dark:bg-indigo-500/10">
                        <CalendarDays size={13} className="text-indigo-500" />
                    </div>
                    <h3 className="text-[13px] font-extrabold text-gray-800 dark:text-white">
                        {JALALI_MONTHS[month.jm - 1]}
                    </h3>
                </div>

                <span className="text-[11px] font-bold text-gray-400">
                    {toPersianDigits(month.jy)}
                </span>
            </div>

            <div className="grid grid-cols-7 gap-px bg-gray-100 dark:bg-white/[0.04]">
                {weekDays.map((day) => (
                    <div
                        key={day}
                        className="bg-gray-50 py-2 text-center text-[9px] font-bold text-gray-400 dark:bg-[#0f172a]"
                    >
                        {day}
                    </div>
                ))}

                {month.monthCells.map((date, index) => {
                    if (!date) {
                        return (
                            <div
                                key={`empty-${month.jy}-${month.jm}-${index}`}
                                className="min-h-[92px] bg-gray-50/40 dark:bg-white/[0.008]"
                            />
                        );
                    }

                    const iso = toISODate(date);
                    const dayEvents = eventsByDay.get(iso) ?? [];
                    const noteCount = noteCountByDay.get(iso) ?? 0;
                    const isToday = iso === todayISO;
                    const [, , jd] = toJalaliParts(date);

                    return (
                        <motion.button
                            key={iso}
                            type="button"
                            whileTap={{ scale: 0.97 }}
                            onClick={() => onSelectDate(date)}
                            className={`relative flex min-h-[92px] flex-col gap-1.5 p-2.5 text-right transition-colors ${isToday
                                    ? "bg-indigo-50 ring-2 ring-indigo-500/25 dark:bg-indigo-500/10 dark:ring-indigo-400/25"
                                    : "bg-white hover:bg-gray-50 dark:bg-[#0f172a] dark:hover:bg-white/[0.03]"
                                }`}
                        >
                            <div className="flex items-start justify-between gap-1">
                                <span
                                    className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-lg text-[11px] font-extrabold ${isToday
                                            ? "bg-indigo-600 text-white shadow-sm shadow-indigo-500/30 dark:bg-indigo-500"
                                            : "bg-gray-50 text-gray-600 dark:bg-white/[0.04] dark:text-gray-300"
                                        }`}
                                >
                                    {toPersianDigits(jd)}
                                </span>

                                {noteCount > 0 && (
                                    <span className="flex items-center gap-0.5 text-[8.5px] font-bold text-[#4E8B6C] dark:text-[#8ECBA9]">
                                        <MessageSquareText size={8} />
                                        {toPersianDigits(noteCount)}
                                    </span>
                                )}
                            </div>

                            {dayEvents.length > 0 && <DayEventDots events={dayEvents} />}
                        </motion.button>
                    );
                })}
            </div>
        </section>
    );
}

export default function PersianCalendar() {
    const [currentMonthDate, setCurrentMonthDate] = useState(() => {
        const [jy, jm] = toJalaliParts(new Date());
        return jalaliToDate(jy, jm, 1);
    });

    const [view, setView] = useState<CalendarView>("month");
    const [calendarEvents, setCalendarEvents] = useState<CalendarEvent[]>([]);
    const [notes, setNotes] = useState<CalendarNote[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedDate, setSelectedDate] = useState<Date | null>(null);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [pickerOpen, setPickerOpen] = useState(false);
    const [pickerYear, setPickerYear] = useState<number | null>(null);

    const [currentJy, currentJm] = useMemo(
        () => toJalaliParts(currentMonthDate),
        [currentMonthDate]
    );

    const [realTodayJy, realTodayJm] = useMemo(() => toJalaliParts(new Date()), []);

    const quickMonths = useMemo(() => {
        const now = new Date();
        const maxDate = new Date(now.getTime() + QUICK_RANGE_DAYS * 24 * 60 * 60 * 1000);
        const [maxJy, maxJm] = toJalaliParts(maxDate);

        const list: { jy: number; jm: number }[] = [];
        let jy = realTodayJy;
        let jm = realTodayJm - 1;

        if (jm < 1) {
            jm = 12;
            jy -= 1;
        }

        while (jy < maxJy || (jy === maxJy && jm <= maxJm)) {
            list.push({ jy, jm });
            jm += 1;
            if (jm > 12) {
                jm = 1;
                jy += 1;
            }
        }

        return list;
    }, [realTodayJy, realTodayJm]);

    const visibleMonths = useMemo<MonthData[]>(() => {
        const seasonStart = getSeasonStartMonth(currentJm);

        const months =
            view === "month"
                ? [{ jy: currentJy, jm: currentJm }]
                : [
                    { jy: currentJy, jm: seasonStart },
                    { jy: currentJy, jm: seasonStart + 1 },
                    { jy: currentJy, jm: seasonStart + 2 },
                ];

        return months.map(({ jy, jm }) => {
            const monthLength = jalaliMonthLength(jy, jm);
            const firstDayWeekIndex = jalaliWeekday(jy, jm, 1);
            const monthCells: (Date | null)[] = Array(firstDayWeekIndex).fill(null);

            for (let day = 1; day <= monthLength; day++) {
                monthCells.push(jalaliToDate(jy, jm, day));
            }

            while (monthCells.length % 7 !== 0) {
                monthCells.push(null);
            }

            return {
                jy,
                jm,
                monthCells,
                startISO: toISODate(jalaliToDate(jy, jm, 1)),
                endISO: toISODate(jalaliToDate(jy, jm, monthLength)),
            };
        });
    }, [currentJy, currentJm, view]);

    const startISO = visibleMonths[0].startISO;
    const endISO = visibleMonths[visibleMonths.length - 1].endISO;

    useEffect(() => {
        const fetchCalendarData = async () => {
            setLoading(true);

            try {
                const [calendarRes, notesRes] = await Promise.all([
                    axiosInstance.get(
                        `/appraisal/api/v1/calendar/?start=${startISO}&end=${endISO}`
                    ),
                    axiosInstance.get("/note/api/v1/"),
                ]);

                setCalendarEvents(
                    Array.isArray(calendarRes.data?.events) ? calendarRes.data.events : []
                );
                setNotes(Array.isArray(notesRes.data) ? notesRes.data : []);
            } catch {
                setCalendarEvents([]);
                setNotes([]);
            } finally {
                setLoading(false);
            }
        };

        fetchCalendarData();
    }, [startISO, endISO]);

    const eventsByDay = useMemo(() => {
        const map = new Map<string, CalendarEvent[]>();

        const allDates = visibleMonths.flatMap((month) =>
            month.monthCells.filter((date): date is Date => Boolean(date))
        );

        calendarEvents.forEach((event) => {
            if (!event.start) return;

            const eventStart = event.start.slice(0, 10);
            const eventEnd = event.end ? event.end.slice(0, 10) : eventStart;

            allDates.forEach((date) => {
                const dateISO = toISODate(date);

                if (eventStart <= dateISO && eventEnd >= dateISO) {
                    if (!map.has(dateISO)) {
                        map.set(dateISO, []);
                    }

                    map.get(dateISO)!.push(event);
                }
            });
        });

        return map;
    }, [calendarEvents, visibleMonths]);

    const noteCountByDay = useMemo(() => {
        const map = new Map<string, number>();

        notes.forEach((note) => {
            const { targetDate } = extractNoteInfo(note.description, note.created_at);

            if (!targetDate) return;

            map.set(targetDate, (map.get(targetDate) || 0) + 1);
        });

        return map;
    }, [notes]);

    const changeDate = (delta: 1 | -1) => {
        if (view === "month") {
            let nextMonth = currentJm + delta;
            let nextYear = currentJy;

            if (nextMonth > 12) {
                nextMonth = 1;
                nextYear += 1;
            }

            if (nextMonth < 1) {
                nextMonth = 12;
                nextYear -= 1;
            }

            setCurrentMonthDate(jalaliToDate(nextYear, nextMonth, 1));
            return;
        }

        let nextSeasonMonth = getSeasonStartMonth(currentJm) + delta * 3;
        let nextYear = currentJy;

        if (nextSeasonMonth > 12) {
            nextSeasonMonth = 1;
            nextYear += 1;
        }

        if (nextSeasonMonth < 1) {
            nextSeasonMonth = 10;
            nextYear -= 1;
        }

        setCurrentMonthDate(jalaliToDate(nextYear, nextSeasonMonth, 1));
    };

    const goToMonth = (jy: number, jm: number) => {
        setView("month");
        setCurrentMonthDate(jalaliToDate(jy, jm, 1));
    };

    const openPicker = () => {
        setPickerYear(currentJy);
        setPickerOpen(true);
    };

    const handleSelectDate = (date: Date) => {
        setSelectedDate(date);
        setIsModalOpen(true);
    };

    const gotoToday = () => {
        const now = new Date();
        const [nowYear, nowMonth] = toJalaliParts(now);

        setCurrentMonthDate(jalaliToDate(nowYear, nowMonth, 1));
        setSelectedDate(now);
        setIsModalOpen(true);
    };

    const todayISO = toISODate(new Date());
    const [todayJy, todayJm, todayJd] = toJalaliParts(new Date());
    const todayPersian = `${toPersianDigits(todayJd)} ${JALALI_MONTHS[todayJm - 1]}`;

    const headerTitle =
        view === "month"
            ? `${JALALI_MONTHS[currentJm - 1]} ${toPersianDigits(currentJy)}`
            : `${getSeasonName(currentJm)} ${toPersianDigits(currentJy)}`;

    return (
        <>
            <div
                dir="rtl"
                className="mx-auto w-full max-w-6xl overflow-hidden rounded-[2rem] border border-gray-100 bg-white shadow-sm dark:border-white/[0.06] dark:bg-[#0f172a]"
            >
                <div className="relative flex items-center justify-between border-b border-gray-100 px-6 py-4 dark:border-white/[0.06]">
                    <button
                        type="button"
                        onClick={() => changeDate(1)}
                        className="flex h-8 w-8 items-center justify-center rounded-xl bg-gray-100 text-gray-400 transition-colors hover:text-gray-700 dark:bg-white/[0.05] dark:hover:text-gray-200"
                    >
                        <ChevronRight size={14} />
                    </button>

                    <div className="flex items-center gap-3">
                        <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-indigo-50 dark:bg-indigo-500/10">
                            <CalendarDays size={14} className="text-indigo-500" />
                        </div>

                        <button
                            type="button"
                            onClick={openPicker}
                            className="flex flex-col items-center rounded-xl px-2 py-1 transition-colors hover:bg-gray-50 dark:hover:bg-white/[0.04]"
                        >
                            <span className="flex items-center gap-1">
                                <h2 className="text-[14px] font-extrabold tracking-tight text-gray-900 dark:text-white">
                                    {headerTitle}
                                </h2>
                                <ChevronDown size={13} className="text-gray-400" />
                            </span>

                            <span className="mt-0.5 text-[10px] font-semibold text-indigo-500 dark:text-indigo-400">
                                امروز: {todayPersian}
                            </span>
                        </button>
                    </div>

                    <button
                        type="button"
                        onClick={() => changeDate(-1)}
                        className="flex h-8 w-8 items-center justify-center rounded-xl bg-gray-100 text-gray-400 transition-colors hover:text-gray-700 dark:bg-white/[0.05] dark:hover:text-gray-200"
                    >
                        <ChevronLeft size={14} />
                    </button>

                    {pickerOpen && pickerYear !== null && (
                        <>
                            <div
                                className="fixed inset-0 z-20"
                                onClick={() => setPickerOpen(false)}
                            />
                            <motion.div
                                initial={{ opacity: 0, y: -8, scale: 0.97 }}
                                animate={{ opacity: 1, y: 0, scale: 1 }}
                                exit={{ opacity: 0, y: -8, scale: 0.97 }}
                                transition={{ duration: 0.15 }}
                                className="absolute right-1/2 top-[calc(100%+8px)] z-30 w-72 translate-x-1/2 overflow-hidden rounded-[1.5rem] border border-gray-100 bg-white p-4 shadow-[0_20px_50px_-20px_rgba(0,0,0,0.35)] dark:border-white/[0.08] dark:bg-[#111827]"
                            >
                                <div className="mb-3 flex items-center justify-between">
                                    <button
                                        type="button"
                                        onClick={() => setPickerYear((y) => (y ?? currentJy) + 1)}
                                        className="flex h-7 w-7 items-center justify-center rounded-lg bg-gray-100 text-gray-400 transition-colors hover:text-gray-700 dark:bg-white/[0.05] dark:hover:text-gray-200"
                                    >
                                        <ChevronRight size={13} />
                                    </button>

                                    <span className="text-[12.5px] font-extrabold text-gray-800 dark:text-white">
                                        {toPersianDigits(pickerYear)}
                                    </span>

                                    <button
                                        type="button"
                                        onClick={() => setPickerYear((y) => (y ?? currentJy) - 1)}
                                        className="flex h-7 w-7 items-center justify-center rounded-lg bg-gray-100 text-gray-400 transition-colors hover:text-gray-700 dark:bg-white/[0.05] dark:hover:text-gray-200"
                                    >
                                        <ChevronLeft size={13} />
                                    </button>
                                </div>

                                <div className="grid grid-cols-3 gap-1.5">
                                    {JALALI_MONTHS.map((label, index) => {
                                        const monthNumber = index + 1;
                                        const isActive =
                                            pickerYear === currentJy && monthNumber === currentJm;

                                        return (
                                            <button
                                                key={label}
                                                type="button"
                                                onClick={() => {
                                                    goToMonth(pickerYear, monthNumber);
                                                    setPickerOpen(false);
                                                }}
                                                className={`rounded-xl px-2 py-2 text-[11px] font-bold transition-colors ${isActive
                                                        ? "bg-indigo-600 text-white dark:bg-indigo-500"
                                                        : "bg-gray-50 text-gray-500 hover:bg-gray-100 dark:bg-white/[0.03] dark:text-gray-400 dark:hover:bg-white/[0.07]"
                                                    }`}
                                            >
                                                {label}
                                            </button>
                                        );
                                    })}
                                </div>
                            </motion.div>
                        </>
                    )}
                </div>

                <div className="flex flex-wrap items-center gap-3 border-b border-gray-100 px-6 py-3 dark:border-white/[0.06]">
                    <div className="flex rounded-xl bg-gray-100 p-1 dark:bg-white/[0.05]">
                        <button
                            type="button"
                            onClick={() => setView("month")}
                            className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-[10.5px] font-bold transition-all ${view === "month"
                                    ? "bg-white text-indigo-600 shadow-sm dark:bg-[#1e293b] dark:text-indigo-400"
                                    : "text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                                }`}
                        >
                            <CalendarDays size={12} />
                            ماه
                        </button>

                        <button
                            type="button"
                            onClick={() => setView("season")}
                            className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-[10.5px] font-bold transition-all ${view === "season"
                                    ? "bg-white text-indigo-600 shadow-sm dark:bg-[#1e293b] dark:text-indigo-400"
                                    : "text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                                }`}
                        >
                            <CalendarRange size={12} />
                            فصل
                        </button>
                    </div>

                    <button
                        type="button"
                        onClick={gotoToday}
                        className="flex items-center gap-1.5 rounded-xl bg-gray-100 px-3 py-1.5 text-[11px] font-bold text-gray-500 transition-colors hover:bg-gray-200 dark:bg-white/[0.05] dark:text-gray-400 dark:hover:bg-white/[0.08]"
                    >
                        <CalendarClock size={12} />
                        امروز
                    </button>

                    {!loading && (
                        <div className="mr-auto flex items-center gap-4">
                            <span className="flex items-center gap-1.5 text-[10.5px] font-semibold text-[#A9823D] dark:text-[#D9AE6C]">
                                <Layers3 size={11} />
                                {toPersianDigits(calendarEvents.length)} رویداد
                            </span>

                            <span className="h-3 w-px bg-gray-200 dark:bg-white/10" />

                            <span className="flex items-center gap-1.5 text-[10.5px] font-semibold text-[#4E8B6C] dark:text-[#8ECBA9]">
                                <MessageSquareText size={11} />
                                {toPersianDigits(notes.length)} یادداشت
                            </span>
                        </div>
                    )}
                </div>

                <div className="flex items-center gap-2 overflow-x-auto border-b border-gray-100 px-6 py-3 dark:border-white/[0.06]">
                    {quickMonths.map(({ jy, jm }) => {
                        const isSelected = jy === currentJy && jm === currentJm;
                        const isRealToday = jy === realTodayJy && jm === realTodayJm;
                        const label =
                            jy === realTodayJy
                                ? JALALI_MONTHS[jm - 1]
                                : `${JALALI_MONTHS[jm - 1]} ${toPersianDigits(jy)}`;

                        return (
                            <button
                                key={`${jy}-${jm}`}
                                type="button"
                                onClick={() => goToMonth(jy, jm)}
                                className={`flex shrink-0 items-center gap-1.5 whitespace-nowrap rounded-full border px-3.5 py-1.5 text-[11px] font-bold transition-colors ${isSelected
                                        ? "border-indigo-600 bg-indigo-600 text-white dark:border-indigo-500 dark:bg-indigo-500"
                                        : "border-gray-100 bg-gray-50 text-gray-500 hover:bg-gray-100 dark:border-white/[0.06] dark:bg-white/[0.03] dark:text-gray-400 dark:hover:bg-white/[0.07]"
                                    }`}
                            >
                                {isRealToday && (
                                    <span
                                        className={`h-1.5 w-1.5 rounded-full ${isSelected ? "bg-white" : "bg-indigo-500"
                                            }`}
                                    />
                                )}
                                {label}
                            </button>
                        );
                    })}
                </div>

                {!loading && (
                    <div className="flex flex-wrap items-center gap-x-3 gap-y-1 border-b border-gray-100 px-6 py-2.5 dark:border-white/[0.06]">
                        {Object.entries(EVENT_TYPE_COLOR)
                            .filter(([type]) => type !== "default")
                            .map(([type, style]) => (
                                <span
                                    key={type}
                                    className={`flex items-center gap-1 text-[9.5px] font-bold ${style.text}`}
                                >
                                    <span className={`h-1.5 w-1.5 rounded-full ${style.dot}`} />
                                    {EVENT_TYPE_LABEL[type] ?? type}
                                </span>
                            ))}
                    </div>
                )}

                {loading ? (
                    <div className="flex flex-col items-center justify-center gap-3 py-24">
                        <motion.div
                            animate={{ rotate: 360 }}
                            transition={{
                                duration: 1,
                                repeat: Infinity,
                                ease: "linear",
                            }}
                            className="h-5 w-5 rounded-full border-2 border-indigo-500/20 border-t-indigo-500"
                        />

                        <p className="text-[11px] font-semibold text-gray-400">
                            در حال دریافت تقویم...
                        </p>
                    </div>
                ) : (
                    <div
                        className={`p-4 sm:p-6 ${view === "season"
                                ? "grid grid-cols-1 gap-5 xl:grid-cols-3"
                                : "mx-auto max-w-5xl"
                            }`}
                    >
                        {visibleMonths.map((month) => (
                            <CalendarMonthGrid
                                key={`${month.jy}-${month.jm}`}
                                month={month}
                                eventsByDay={eventsByDay}
                                noteCountByDay={noteCountByDay}
                                todayISO={todayISO}
                                onSelectDate={handleSelectDate}
                            />
                        ))}
                    </div>
                )}
            </div>

            <CalendarNoteModal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                selectedDate={selectedDate}
                notes={notes}
                events={calendarEvents}
                onCreated={(note) => setNotes((prev) => [note, ...prev])}
                onDeleted={(id) => setNotes((prev) => prev.filter((note) => note.id !== id))}
            />
        </>
    );
}