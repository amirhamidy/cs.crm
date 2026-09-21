"use client";

import { useEffect, useMemo, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { motion } from "framer-motion";
import {
    ChevronRight,
    ChevronLeft,
    CalendarDays,
    CalendarClock,
    MessageSquareText,
    Layers3,
    FileText,
    ClipboardCheck,
    CalendarRange,
    ChevronDown,
} from "lucide-react";
import api from "@/lib/axiosInstance";
import { toJalali, toGregorian, jalaliMonthLength, jalaliWeekday, toPersianDigits, JALALI_MONTHS, pad2 } from "@/lib/jalali";
import CalendarNoteModal, { CalendarNote, CalendarEvent } from "./CalendarNoteModal";

interface CalendarResponse {
    start: string;
    end: string;
    events: CalendarEvent[];
}

type CalendarView = "month" | "season";
type ViewOption = [CalendarView, typeof CalendarDays, string];

interface MonthData {
    jy: number;
    jm: number;
    monthCells: (Date | null)[];
    startISO: string;
    endISO: string;
}

const weekDays = ["شنبه", "یکشنبه", "دوشنبه", "سه‌شنبه", "چهارشنبه", "پنجشنبه", "جمعه"];
const toISODate = (d: Date) => `${d.getFullYear()}-${pad2(d.getMonth() + 1)}-${pad2(d.getDate())}`;
const toJalaliParts = (d: Date) => toJalali(d.getFullYear(), d.getMonth() + 1, d.getDate());
const jalaliToDate = (jy: number, jm: number, jd: number) => {
    const [gy, gm, gd] = toGregorian(jy, jm, jd);
    return new Date(gy, gm - 1, gd);
};
const getNoteDate = (n: CalendarNote) => n.created_at?.slice(0, 10) ?? "";
const isFriday = (date: Date) => date.getDay() === 5;

const IRAN_HOLIDAYS_1405 = new Set([
    "1-1", "1-2", "1-3", "1-4", "1-12", "1-13", "1-25",
    "3-3", "3-6", "3-14", "3-15",
    "4-3", "4-4",
    "5-13", "5-21", "5-22", "5-30",
    "6-8",
    "8-22",
    "10-2", "10-16",
    "11-4", "11-22",
    "12-9", "12-19", "12-20", "12-29",
]);

const isIranHoliday = (date: Date) => {
    const [year, month, day] = toJalaliParts(date);
    return year === 1405 && IRAN_HOLIDAYS_1405.has(`${month}-${day}`);
};

const isHolidayDate = (date: Date) => isFriday(date) || isIranHoliday(date);

const EVENT_TYPE_LABEL: Record<string, string> = {
    task: "وظیفه",
    tasks: "وظیفه",
    internal_task: "وظیفه درون سازمانی",
    "internal-task": "وظیفه درون سازمانی",
    internal_task_routine: "وظیفه درون سازمانی",
    note: "یادداشت",
    notes: "یادداشت",
    meeting: "جلسه",
    reminder: "یادآور",
    deadline: "مهلت",
};

const EVENT_TYPE_COLOR: Record<string, { bg: string; text: string; dot: string; border: string; soft: string }> = {
    task: { bg: "bg-indigo-50 dark:bg-indigo-500/10", text: "text-indigo-600 dark:text-indigo-300", dot: "bg-indigo-500", border: "border-indigo-100 dark:border-indigo-500/15", soft: "bg-indigo-500" },
    internal_task: { bg: "bg-amber-50 dark:bg-amber-500/10", text: "text-amber-600 dark:text-amber-300", dot: "bg-amber-500", border: "border-amber-100 dark:border-amber-500/15", soft: "bg-amber-500" },
    note: { bg: "bg-emerald-50 dark:bg-emerald-500/10", text: "text-emerald-600 dark:text-emerald-300", dot: "bg-emerald-500", border: "border-emerald-100 dark:border-emerald-500/15", soft: "bg-emerald-500" },
    meeting: { bg: "bg-violet-50 dark:bg-violet-500/10", text: "text-violet-600 dark:text-violet-300", dot: "bg-violet-500", border: "border-violet-100 dark:border-violet-500/15", soft: "bg-violet-500" },
    reminder: { bg: "bg-cyan-50 dark:bg-cyan-500/10", text: "text-cyan-600 dark:text-cyan-300", dot: "bg-cyan-500", border: "border-cyan-100 dark:border-cyan-500/15", soft: "bg-cyan-500" },
    deadline: { bg: "bg-rose-50 dark:bg-rose-500/10", text: "text-rose-600 dark:text-rose-300", dot: "bg-rose-500", border: "border-rose-100 dark:border-rose-500/15", soft: "bg-rose-500" },
    default: { bg: "bg-slate-50 dark:bg-white/[0.04]", text: "text-slate-500 dark:text-slate-400", dot: "bg-slate-400 dark:bg-slate-500", border: "border-slate-100 dark:border-white/[0.06]", soft: "bg-slate-400" },
};

const getEventType = (type: string) => {
    const value = String(type || "").toLowerCase();
    if (["internal_task", "internal-task", "internal_task_routine"].includes(value)) return "internal_task";
    if (["task", "tasks"].includes(value)) return "task";
    if (["note", "notes"].includes(value)) return "note";
    return value;
};

const getTypeStyle = (type: string) => EVENT_TYPE_COLOR[getEventType(type)] ?? EVENT_TYPE_COLOR.default;
const getTypeLabel = (type: string) => EVENT_TYPE_LABEL[getEventType(type)] ?? (type || "رویداد");
const getSeasonName = (month: number) => month <= 3 ? "بهار" : month <= 6 ? "تابستان" : month <= 9 ? "پاییز" : "زمستان";
const getSeasonStartMonth = (month: number) => Math.floor((month - 1) / 3) * 3 + 1;

const isEventOnDate = (event: CalendarEvent, dateISO: string) => {
    if (!event.start) return false;
    const start = event.start.slice(0, 10);
    const end = event.end?.slice(0, 10) ?? start;
    return start <= dateISO && end >= dateISO;
};

function DayEventDots({ events }: { events: CalendarEvent[] }) {
    const grouped = useMemo(() => {
        const map = new Map<string, number>();
        events.forEach((event) => {
            const type = getEventType(event.type);
            map.set(type, (map.get(type) || 0) + 1);
        });
        return [...map.entries()].slice(0, 4);
    }, [events]);

    return (
        <div className="mt-auto flex flex-wrap gap-1">
            {grouped.map(([type, count]) => {
                const style = getTypeStyle(type);
                return <span key={type} title={getTypeLabel(type)} className={`flex items-center gap-1 rounded-lg border px-1.5 py-0.5 text-[9px] font-bold ${style.bg} ${style.text} ${style.border}`}><span className={`h-1.5 w-1.5 rounded-full ${style.dot}`} />{toPersianDigits(count)}</span>;
            })}
        </div>
    );
}

function CalendarMonthGrid({ month, eventsByDay, noteCountByDay, todayISO, onSelectDate }: {
    month: MonthData;
    eventsByDay: Map<string, CalendarEvent[]>;
    noteCountByDay: Map<string, number>;
    todayISO: string;
    onSelectDate: (date: Date) => void;
}) {
    return (
        <section className="overflow-hidden rounded-[1.5rem] border border-slate-200/80 bg-white shadow-[0_4px_24px_-12px_rgba(15,23,42,0.16)] dark:border-white/[0.07] dark:bg-[#111827] dark:shadow-none">
            <div className="flex items-center justify-between border-b border-slate-100 bg-gradient-to-l from-indigo-50/70 via-white to-white px-5 py-3.5 dark:border-white/[0.06] dark:from-indigo-500/[0.07] dark:via-[#111827] dark:to-[#111827]">
                <div className="flex items-center gap-2.5">
                    <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-indigo-100 text-indigo-600 dark:bg-indigo-500/15 dark:text-indigo-300"><CalendarDays size={14} /></div>
                    <div className="flex flex-col gap-0.5">
                        <h3 className="text-[13px] font-extrabold text-slate-800 dark:text-white">{JALALI_MONTHS[month.jm - 1]}</h3>
                        <span className="text-[10px] font-medium text-slate-400 dark:text-slate-500">تقویم ماهانه</span>
                    </div>
                </div>
                <span className="rounded-lg bg-slate-100 px-2 py-1 text-[10px] font-bold text-slate-500 dark:bg-white/[0.05] dark:text-slate-400">{toPersianDigits(month.jy)}</span>
            </div>

            <div className="grid grid-cols-7 border-b border-slate-100 bg-slate-50/70 dark:border-white/[0.05] dark:bg-white/[0.02]">
                {weekDays.map((day, index) => <div key={day} className={`py-2.5 text-center text-[9px] font-bold ${index === 6 ? "text-rose-400 dark:text-rose-300" : "text-slate-400 dark:text-slate-500"}`}>{day}</div>)}
            </div>

            <div className="grid grid-cols-7 gap-px bg-slate-100 dark:bg-white/[0.045]">
                {month.monthCells.map((date, index) => {
                    if (!date) return <div key={`empty-${month.jy}-${month.jm}-${index}`} className="min-h-[92px] bg-slate-50/70 dark:bg-[#0f172a]/80" />;

                    const iso = toISODate(date);
                    const dayEvents = eventsByDay.get(iso) ?? [];
                    const noteCount = noteCountByDay.get(iso) ?? 0;
                    const isToday = iso === todayISO;
                    const [, , jd] = toJalaliParts(date);
                    const holiday = isHolidayDate(date);
                    const friday = isFriday(date);

                    return (
                        <motion.button
                            key={iso}
                            type="button"
                            whileTap={{ scale: 0.975 }}
                            onClick={() => onSelectDate(date)}
                            title={holiday ? friday ? "جمعه" : "تعطیل رسمی" : undefined}
                            className={`group relative flex min-h-[92px] flex-col gap-1.5 p-2.5 text-right transition-all ${isToday ? "bg-indigo-50/80 dark:bg-indigo-500/[0.09]" : holiday ? "bg-rose-50/35 dark:bg-rose-500/[0.025]" : "bg-white hover:bg-slate-50 dark:bg-[#111827] dark:hover:bg-white/[0.025]"}`}
                        >
                            <div className="flex items-start justify-between gap-1">
                                <span className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-[10px] text-[11px] font-extrabold transition-all ${isToday ? "bg-indigo-600 text-white shadow-[0_4px_10px_-4px_rgba(79,70,229,0.6)] dark:bg-indigo-500" : holiday ? "bg-rose-50 text-rose-500 dark:bg-rose-500/10 dark:text-rose-300" : "bg-slate-50 text-slate-600 group-hover:bg-white dark:bg-white/[0.045] dark:text-slate-300 dark:group-hover:bg-white/[0.07]"}`}>{toPersianDigits(jd)}</span>
                                {noteCount > 0 && <span className="flex items-center gap-1 rounded-lg bg-emerald-50 px-1.5 py-1 text-[8.5px] font-bold text-emerald-600 dark:bg-emerald-500/10 dark:text-emerald-300"><MessageSquareText size={9} />{toPersianDigits(noteCount)}</span>}
                            </div>

                            {holiday && <span className="w-fit rounded-md bg-rose-500/10 px-1.5 py-0.5 text-[8px] font-bold text-rose-500 dark:text-rose-300">{friday ? "جمعه" : "تعطیل"}</span>}
                            {dayEvents.length > 0 && <DayEventDots events={dayEvents} />}
                            {isToday && <span className="absolute bottom-1.5 left-1/2 h-1 w-1 -translate-x-1/2 rounded-full bg-indigo-500" />}
                        </motion.button>
                    );
                })}
            </div>
        </section>
    );
}

export default function PersianCalendar() {
    const router = useRouter();
    const pathname = usePathname();
    const searchParams = useSearchParams();

    const [currentMonthDate, setCurrentMonthDate] = useState(() => {
        const [jy, jm] = toJalaliParts(new Date());
        return jalaliToDate(jy, jm, 1);
    });
    const [view, setView] = useState<CalendarView>("month");
    const [calendarEvents, setCalendarEvents] = useState<CalendarEvent[]>([]);
    const [calendarRange, setCalendarRange] = useState<CalendarResponse | null>(null);
    const [notes, setNotes] = useState<CalendarNote[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedDate, setSelectedDate] = useState<Date | null>(null);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [pickerOpen, setPickerOpen] = useState(false);
    const [pickerYear, setPickerYear] = useState<number | null>(null);

    const [currentJy, currentJm] = useMemo(() => toJalaliParts(currentMonthDate), [currentMonthDate]);
    const [realTodayJy, realTodayJm] = useMemo(() => toJalaliParts(new Date()), []);

    const quickMonths = useMemo(() => {
        const list: { jy: number; jm: number }[] = [];
        let jy = realTodayJy, jm = realTodayJm;
        for (let i = 0; i < 12; i++) {
            list.push({ jy, jm });
            if (++jm > 12) { jm = 1; jy++; }
        }
        return list;
    }, [realTodayJy, realTodayJm]);

    const visibleMonths = useMemo<MonthData[]>(() => {
        const seasonStart = getSeasonStartMonth(currentJm);
        const months = view === "month" ? [{ jy: currentJy, jm: currentJm }] : [0, 1, 2].map((i) => {
            let jm = seasonStart + i, jy = currentJy;
            if (jm > 12) { jm -= 12; jy++; }
            return { jy, jm };
        });

        return months.map(({ jy, jm }) => {
            const monthLength = jalaliMonthLength(jy, jm);
            const cells: (Date | null)[] = Array(jalaliWeekday(jy, jm, 1)).fill(null);
            for (let day = 1; day <= monthLength; day++) cells.push(jalaliToDate(jy, jm, day));
            while (cells.length % 7) cells.push(null);
            return {
                jy,
                jm,
                monthCells: cells,
                startISO: toISODate(jalaliToDate(jy, jm, 1)),
                endISO: toISODate(jalaliToDate(jy, jm, monthLength)),
            };
        });
    }, [currentJy, currentJm, view]);

    const startISO = visibleMonths[0]?.startISO ?? "";
    const endISO = visibleMonths.at(-1)?.endISO ?? "";

    useEffect(() => {
        if (!startISO || !endISO) return;
        let cancelled = false;

        const fetchData = async () => {
            setLoading(true);
            try {
                const [calendarRes, notesRes] = await Promise.all([
                    api.get<CalendarResponse>(`/appraisal/api/v1/calendar/?start=${startISO}&end=${endISO}`),
                    api.get("/note/api/v1/"),
                ]);
                if (cancelled) return;
                const data = calendarRes.data;
                const events = Array.isArray(data?.events) ? data.events : [];
                setCalendarRange({ start: data?.start ?? startISO, end: data?.end ?? endISO, events });
                setCalendarEvents(events);
                setNotes(Array.isArray(notesRes.data) ? notesRes.data : []);
            } catch (error) {
                if (!cancelled) {
                    console.error("Calendar fetch error:", error);
                    setCalendarRange(null);
                    setCalendarEvents([]);
                    setNotes([]);
                }
            } finally {
                if (!cancelled) setLoading(false);
            }
        };

        fetchData();
        return () => { cancelled = true; };
    }, [startISO, endISO]);

    useEffect(() => {
        if (loading) return;
        const eventParam = searchParams.get("event");
        const noteParam = searchParams.get("note");

        if (noteParam) {
            const note = notes.find((item) => Number(item.id) === Number(noteParam));
            if (!note?.created_at) return;
            const date = new Date(note.created_at);
            if (Number.isNaN(date.getTime())) return;
            const [jy, jm] = toJalaliParts(date);
            setView("month");
            setCurrentMonthDate(jalaliToDate(jy, jm, 1));
            setSelectedDate(date);
            setIsModalOpen(true);
            router.replace(pathname, { scroll: false });
            return;
        }

        if (eventParam) {
            const event = calendarEvents.find((item) => Number(item.id) === Number(eventParam));
            if (!event?.start) return;
            const date = new Date(event.start);
            if (Number.isNaN(date.getTime())) return;
            const [jy, jm] = toJalaliParts(date);
            setView("month");
            setCurrentMonthDate(jalaliToDate(jy, jm, 1));
            setSelectedDate(date);
            setIsModalOpen(true);
            router.replace(pathname, { scroll: false });
        }
    }, [loading, notes, calendarEvents, searchParams, router, pathname]);

    const eventsByDay = useMemo(() => {
        const map = new Map<string, CalendarEvent[]>();
        const dates = visibleMonths.flatMap((month) => month.monthCells.filter((d): d is Date => !!d));
        calendarEvents.forEach((event) => dates.forEach((date) => {
            const iso = toISODate(date);
            if (!isEventOnDate(event, iso)) return;
            if (!map.has(iso)) map.set(iso, []);
            map.get(iso)!.push(event);
        }));
        return map;
    }, [calendarEvents, visibleMonths]);

    const noteCountByDay = useMemo(() => {
        const map = new Map<string, number>();
        notes.forEach((note) => {
            const date = getNoteDate(note);
            if (date) map.set(date, (map.get(date) || 0) + 1);
        });
        return map;
    }, [notes]);

    const changeDate = (delta: 1 | -1) => {
        let nextMonth = view === "month" ? currentJm + delta : getSeasonStartMonth(currentJm) + delta * 3;
        let nextYear = currentJy;
        while (nextMonth > 12) { nextMonth -= 12; nextYear++; }
        while (nextMonth < 1) { nextMonth += 12; nextYear--; }
        setCurrentMonthDate(jalaliToDate(nextYear, nextMonth, 1));
    };

    const goToMonth = (jy: number, jm: number) => {
        setView("month");
        setCurrentMonthDate(jalaliToDate(jy, jm, 1));
    };

    const gotoToday = () => {
        const now = new Date();
        const [jy, jm] = toJalaliParts(now);
        setCurrentMonthDate(jalaliToDate(jy, jm, 1));
        setSelectedDate(now);
        setIsModalOpen(true);
    };

    const today = new Date();
    const todayISO = toISODate(today);
    const [, todayJm, todayJd] = toJalaliParts(today);
    const todayHoliday = isHolidayDate(today);
    const todayPersian = `${toPersianDigits(todayJd)} ${JALALI_MONTHS[todayJm - 1]}`;
    const headerTitle = view === "month" ? `${JALALI_MONTHS[currentJm - 1]} ${toPersianDigits(currentJy)}` : `${getSeasonName(currentJm)} ${toPersianDigits(currentJy)}`;

    const taskCount = calendarEvents.filter((e) => getEventType(e.type) === "task").length;
    const internalTaskCount = calendarEvents.filter((e) => getEventType(e.type) === "internal_task").length;
    const calendarNoteCount = calendarEvents.filter((e) => getEventType(e.type) === "note").length;

    const eventTypeCount = useMemo(() => {
        const map = new Map<string, number>();
        calendarEvents.forEach((event) => {
            const type = getEventType(event.type);
            map.set(type, (map.get(type) || 0) + 1);
        });
        return [...map.entries()];
    }, [calendarEvents]);

    return (
        <>
            <div dir="rtl" className="mx-auto w-full max-w-6xl overflow-hidden rounded-[2rem] border border-slate-200/80 bg-white shadow-[0_12px_40px_-24px_rgba(15,23,42,0.25)] dark:border-white/[0.07] dark:bg-[#0f172a] dark:shadow-none">
                <div className="relative flex items-center justify-between border-b border-slate-100 px-5 py-4 sm:px-6 dark:border-white/[0.06]">
                    <button type="button" onClick={() => changeDate(1)} className="flex h-9 w-9 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-400 shadow-sm transition-all hover:border-indigo-200 hover:bg-indigo-50 hover:text-indigo-600 dark:border-white/[0.07] dark:bg-white/[0.04] dark:hover:border-indigo-500/20 dark:hover:bg-indigo-500/10 dark:hover:text-indigo-300"><ChevronRight size={14} /></button>

                    <div className="flex items-center gap-2.5 sm:gap-3">
                        <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600 dark:bg-indigo-500/10 dark:text-indigo-300"><CalendarDays size={15} /></div>
                        <button type="button" onClick={() => { setPickerYear(currentJy); setPickerOpen(true); }} className="flex flex-col items-center rounded-xl px-2 py-1 transition-colors hover:bg-slate-50 dark:hover:bg-white/[0.035]">
                            <span className="flex items-center gap-1"><h2 className="text-[14px] font-extrabold tracking-tight text-slate-900 dark:text-white">{headerTitle}</h2><ChevronDown size={13} className="text-slate-400" /></span>
                            <span className="mt-0.5 text-[10px] font-semibold text-indigo-500 dark:text-indigo-400">امروز: {todayPersian}</span>
                            {todayHoliday && <span className="mt-1 rounded-md bg-rose-500/10 px-1.5 py-0.5 text-[8px] font-bold text-rose-500 dark:text-rose-300">امروز تعطیل است</span>}
                        </button>
                    </div>

                    <button type="button" onClick={() => changeDate(-1)} className="flex h-9 w-9 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-400 shadow-sm transition-all hover:border-indigo-200 hover:bg-indigo-50 hover:text-indigo-600 dark:border-white/[0.07] dark:bg-white/[0.04] dark:hover:border-indigo-500/20 dark:hover:bg-indigo-500/10 dark:hover:text-indigo-300"><ChevronLeft size={14} /></button>

                    {pickerOpen && pickerYear !== null && (
                        <>
                            <div className="fixed inset-0 z-20" onClick={() => setPickerOpen(false)} />
                            <motion.div initial={{ opacity: 0, y: -8, scale: 0.97 }} animate={{ opacity: 1, y: 0, scale: 1 }} transition={{ duration: 0.15 }} className="absolute right-1/2 top-[calc(100%+8px)] z-30 w-[min(18rem,calc(100vw-2rem))] translate-x-1/2 overflow-hidden rounded-[1.5rem] border border-slate-200 bg-white p-4 shadow-[0_20px_50px_-20px_rgba(0,0,0,0.25)] dark:border-white/[0.08] dark:bg-[#111827]">
                                <div className="mb-3 flex items-center justify-between">
                                    <button type="button" onClick={() => setPickerYear((y) => (y ?? currentJy) + 1)} className="flex h-8 w-8 items-center justify-center rounded-xl bg-slate-100 text-slate-400 transition-colors hover:bg-indigo-50 hover:text-indigo-600 dark:bg-white/[0.05] dark:hover:bg-indigo-500/10 dark:hover:text-indigo-300"><ChevronRight size={13} /></button>
                                    <span className="rounded-lg bg-indigo-50 px-3 py-1 text-[12.5px] font-extrabold text-indigo-600 dark:bg-indigo-500/10 dark:text-indigo-300">{toPersianDigits(pickerYear)}</span>
                                    <button type="button" onClick={() => setPickerYear((y) => (y ?? currentJy) - 1)} className="flex h-8 w-8 items-center justify-center rounded-xl bg-slate-100 text-slate-400 transition-colors hover:bg-indigo-50 hover:text-indigo-600 dark:bg-white/[0.05] dark:hover:bg-indigo-500/10 dark:hover:text-indigo-300"><ChevronLeft size={13} /></button>
                                </div>
                                <div className="grid grid-cols-3 gap-1.5">
                                    {JALALI_MONTHS.map((label, index) => {
                                        const month = index + 1;
                                        const active = pickerYear === currentJy && month === currentJm;
                                        return <button key={label} type="button" onClick={() => { goToMonth(pickerYear, month); setPickerOpen(false); }} className={`rounded-xl px-2 py-2.5 text-[11px] font-bold transition-all ${active ? "bg-indigo-600 text-white shadow-sm shadow-indigo-500/20 dark:bg-indigo-500" : "bg-slate-50 text-slate-500 hover:bg-indigo-50 hover:text-indigo-600 dark:bg-white/[0.035] dark:text-slate-400 dark:hover:bg-indigo-500/10 dark:hover:text-indigo-300"}`}>{label}</button>;
                                    })}
                                </div>
                            </motion.div>
                        </>
                    )}
                </div>

                <div className="flex flex-wrap items-center gap-2 border-b border-slate-100 px-5 py-3 sm:px-6 dark:border-white/[0.06]">
                    <div className="flex rounded-xl border border-slate-200 bg-slate-50 p-1 dark:border-white/[0.06] dark:bg-white/[0.035]">
                        {([
                            ["month", CalendarDays, "ماهانه"],
                            ["season", CalendarRange, "فصل"],
                        ] as ViewOption[]).map(([value, Icon, label]) => (
                            <button key={value} type="button" onClick={() => setView(value)} className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-[10.5px] font-bold transition-all ${view === value ? "bg-white text-indigo-600 shadow-sm dark:bg-[#1e293b] dark:text-indigo-300" : "text-slate-400 hover:text-slate-600 dark:hover:text-slate-300"}`}>
                                <Icon size={12} />{label}
                            </button>
                        ))}
                    </div>

                    <button type="button" onClick={gotoToday} className="flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3 py-1.5 text-[11px] font-bold text-slate-500 shadow-sm transition-all hover:border-indigo-200 hover:bg-indigo-50 hover:text-indigo-600 dark:border-white/[0.06] dark:bg-white/[0.035] dark:text-slate-400 dark:hover:bg-indigo-500/10 dark:hover:text-indigo-300"><CalendarClock size={12} />امروز</button>

                    {!loading && <div className="mr-auto flex flex-wrap items-center gap-2">
                        <span className="flex items-center gap-1.5 rounded-lg bg-indigo-50 px-2 py-1 text-[10px] font-bold text-indigo-600 dark:bg-indigo-500/10 dark:text-indigo-300"><ClipboardCheck size={11} />{toPersianDigits(taskCount)} وظیفه</span>
                        <span className="flex items-center gap-1.5 rounded-lg bg-amber-50 px-2 py-1 text-[10px] font-bold text-amber-600 dark:bg-amber-500/10 dark:text-amber-300"><Layers3 size={11} />{toPersianDigits(internalTaskCount)} وظیفه درون سازمانی</span>
                        <span className="flex items-center gap-1.5 rounded-lg bg-emerald-50 px-2 py-1 text-[10px] font-bold text-emerald-600 dark:bg-emerald-500/10 dark:text-emerald-300"><FileText size={11} />{toPersianDigits(calendarNoteCount)} یادداشت</span>
                    </div>}
                </div>

                <div className="flex items-center gap-2 overflow-x-auto border-b border-slate-100 px-5 py-3 sm:px-6 dark:border-white/[0.06]">
                    {quickMonths.map(({ jy, jm }) => {
                        const selected = jy === currentJy && jm === currentJm;
                        const realToday = jy === realTodayJy && jm === realTodayJm;
                        return <button key={`${jy}-${jm}`} type="button" onClick={() => goToMonth(jy, jm)} className={`flex shrink-0 items-center gap-1.5 whitespace-nowrap rounded-full border px-3.5 py-1.5 text-[11px] font-bold transition-all ${selected ? "border-indigo-600 bg-indigo-600 text-white shadow-sm shadow-indigo-500/20 dark:border-indigo-500 dark:bg-indigo-500" : "border-slate-200 bg-white text-slate-500 hover:border-indigo-200 hover:bg-indigo-50 hover:text-indigo-600 dark:border-white/[0.06] dark:bg-white/[0.025] dark:text-slate-400 dark:hover:border-indigo-500/20 dark:hover:bg-indigo-500/10 dark:hover:text-indigo-300"}`}>
                            {realToday && <span className={`h-1.5 w-1.5 rounded-full ${selected ? "bg-white" : "bg-indigo-500"}`} />}
                            {jy === realTodayJy ? JALALI_MONTHS[jm - 1] : `${JALALI_MONTHS[jm - 1]} ${toPersianDigits(jy)}`}
                        </button>;
                    })}
                </div>

                {!loading && <div className="flex flex-wrap items-center gap-x-5 gap-y-2 border-b border-slate-100 px-5 py-3 sm:px-6 dark:border-white/[0.06]">
                    {eventTypeCount.map(([type, count]) => {
                        const style = getTypeStyle(type);
                        return <span key={type} className={`flex items-center gap-1.5 text-[9.5px] font-bold ${style.text}`}><span className={`h-1.5 w-1.5 rounded-full ${style.dot}`} />{getTypeLabel(type)}<span className="opacity-60">({toPersianDigits(count)})</span></span>;
                    })}
                </div>}

                {loading ? (
                    <div className="flex flex-col items-center justify-center gap-3 py-24">
                        <motion.div animate={{ rotate: 360 }} transition={{ duration: 1, repeat: Infinity, ease: "linear" }} className="h-5 w-5 rounded-full border-2 border-indigo-500/15 border-t-indigo-500" />
                        <p className="text-[11px] font-semibold text-slate-400">در حال دریافت تقویم...</p>
                    </div>
                ) : (
                    <div className={`p-4 sm:p-6 ${view === "season" ? "grid grid-cols-1 gap-5 xl:grid-cols-3" : "mx-auto max-w-5xl"}`}>
                        {visibleMonths.map((month) => <CalendarMonthGrid key={`${month.jy}-${month.jm}`} month={month} eventsByDay={eventsByDay} noteCountByDay={noteCountByDay} todayISO={todayISO} onSelectDate={(date) => { setSelectedDate(date); setIsModalOpen(true); }} />)}
                    </div>
                )}

                {!loading && calendarRange && <div className="border-t border-slate-100 px-5 py-2.5 dark:border-white/[0.06]">
                    <div className="flex items-center justify-between gap-3 text-[9px] font-semibold text-slate-400"><span>بازه دریافت‌شده از تقویم</span><span dir="ltr">{calendarRange.start} تا {calendarRange.end}</span></div>
                </div>}
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