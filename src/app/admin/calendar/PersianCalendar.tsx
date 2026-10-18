"use client";

import { useEffect, useMemo, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { motion } from "framer-motion";
import {
    ChevronRight,
    ChevronLeft,
    CalendarDays,
    CalendarClock,
    CalendarRange,
    ChevronDown,
    ClipboardCheck,
    Layers3,
    FileText,
    MessageSquareText,
    Plus,
} from "lucide-react";
import api from "@/lib/axiosInstance";
import { toJalali, toGregorian, jalaliMonthLength, jalaliWeekday, toPersianDigits, JALALI_MONTHS, pad2 } from "@/lib/jalali";
import CalendarNoteModal, {
    CalendarNote,
    CalendarEvent,
    CalendarResponse,
    IRAN_HOLIDAYS_1405,
    getEventType,
    getNoteDate,
    getTypeLabel,
    getTypeStyle,
    isEventOnDate,
    isFriday,
} from "./CalendarNoteModal";

type CalendarView = "month" | "season";

interface MonthData {
    jy: number;
    jm: number;
    monthCells: (Date | null)[];
    startISO: string;
    endISO: string;
}

/* ───────────────────────── Helpers ───────────────────────── */

const weekDays = ["شنبه", "یکشنبه", "دوشنبه", "سه‌شنبه", "چهارشنبه", "پنجشنبه", "جمعه"];
const toISODate = (d: Date) => `${d.getFullYear()}-${pad2(d.getMonth() + 1)}-${pad2(d.getDate())}`;
const toJalaliParts = (d: Date) => toJalali(d.getFullYear(), d.getMonth() + 1, d.getDate());
const jalaliToDate = (jy: number, jm: number, jd: number) => {
    const [gy, gm, gd] = toGregorian(jy, jm, jd);
    return new Date(gy, gm - 1, gd);
};
const isIranHoliday = (date: Date) => {
    const [year, month, day] = toJalaliParts(date);
    return year === 1405 && IRAN_HOLIDAYS_1405.has(`${month}-${day}`);
};
const isHolidayDate = (date: Date) => isFriday(date) || isIranHoliday(date);
const persianWeekdayName = (date: Date) => weekDays[(date.getDay() + 1) % 7];
const getSeasonName = (month: number) => (month <= 3 ? "بهار" : month <= 6 ? "تابستان" : month <= 9 ? "پاییز" : "زمستان");
const getSeasonStartMonth = (month: number) => Math.floor((month - 1) / 3) * 3 + 1;
const timeFmt = new Intl.DateTimeFormat("fa-IR", { hour: "2-digit", minute: "2-digit" });

/** Frosted-blue surface used by every panel */
const glass =
    "border border-white/70 bg-white/55 backdrop-blur-xl shadow-[0_10px_40px_-18px_rgba(37,99,235,0.35)] dark:border-white/[0.08] dark:bg-white/[0.04] dark:shadow-none";

const focusRing = "focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-500";

/* ───────────────────────── Day cell ───────────────────────── */

function DayCell({ date, events, noteCount, isToday, compact, onSelect }: {
    date: Date;
    events: CalendarEvent[];
    noteCount: number;
    isToday: boolean;
    compact: boolean;
    onSelect: (date: Date) => void;
}) {
    const [, , jd] = toJalaliParts(date);
    const holiday = isHolidayDate(date);
    const friday = isFriday(date);
    const visible = events.slice(0, 2);
    const extra = events.length - visible.length;
    const types = Array.from(new Set(events.map((e) => getEventType(e.type)))).slice(0, 4);

    return (
        <motion.button
            type="button"
            whileTap={{ scale: 0.97 }}
            onClick={() => onSelect(date)}
            title={holiday ? (friday ? "جمعه" : "تعطیل رسمی") : undefined}
            className={`group relative flex flex-col gap-1.5 rounded-2xl border p-1.5 text-right transition-all sm:p-2 ${focusRing} ${compact ? "min-h-[62px]" : "min-h-[76px] sm:min-h-[116px]"} ${isToday
                    ? "border-blue-500/60 bg-blue-500/10 ring-2 ring-blue-500/30 dark:bg-blue-500/15"
                    : holiday
                        ? "border-rose-200/50 bg-rose-500/[0.06] hover:bg-rose-500/10 dark:border-rose-400/10"
                        : "border-white/70 bg-white/60 hover:-translate-y-0.5 hover:bg-white hover:shadow-[0_10px_24px_-14px_rgba(37,99,235,0.5)] dark:border-white/[0.05] dark:bg-white/[0.03] dark:hover:bg-white/[0.08]"
                }`}
        >
            <div className="flex items-center justify-between gap-1">
                <span className={`flex h-7 min-w-7 items-center justify-center rounded-full px-1 text-[11.5px] font-extrabold ${isToday
                        ? "bg-gradient-to-br from-blue-600 to-cyan-400 text-white shadow-[0_6px_16px_-6px_rgba(37,99,235,0.85)]"
                        : holiday
                            ? "text-rose-500 dark:text-rose-300"
                            : "text-slate-700 dark:text-slate-200"
                    }`}>{toPersianDigits(jd)}</span>
                {noteCount > 0 && (
                    <span className="flex items-center gap-0.5 rounded-full bg-emerald-500/15 px-1.5 py-0.5 text-[8.5px] font-bold text-emerald-600 dark:text-emerald-300">
                        <MessageSquareText size={8} />{toPersianDigits(noteCount)}
                    </span>
                )}
            </div>

            {/* Event titles (roomy screens, month view) */}
            {!compact && visible.length > 0 && (
                <div className="hidden flex-col gap-1 sm:flex">
                    {visible.map((event) => {
                        const style = getTypeStyle(event.type);
                        return (
                            <span key={`${event.type}-${event.id}`} className={`flex items-center gap-1 overflow-hidden rounded-md px-1.5 py-[3px] text-[9.5px] font-bold ${style.bg} ${style.text}`}>
                                <span className={`h-3 w-[3px] shrink-0 rounded-full ${style.bar}`} />
                                <span className="truncate">{event.title}</span>
                            </span>
                        );
                    })}
                    {extra > 0 && <span className="px-1 text-[9px] font-bold text-slate-400">+{toPersianDigits(extra)} مورد دیگر</span>}
                </div>
            )}

            {/* Dots (mobile / season view) */}
            {types.length > 0 && (
                <div className={`mt-auto flex-wrap items-center gap-1 ${compact ? "flex" : "flex sm:hidden"}`}>
                    {types.map((type) => <span key={type} className={`h-1.5 w-1.5 rounded-full ${getTypeStyle(type).dot}`} />)}
                    {events.length > 1 && <span className="text-[8.5px] font-bold text-slate-400">{toPersianDigits(events.length)}</span>}
                </div>
            )}

            {holiday && !compact && <span className="mt-auto hidden text-[8.5px] font-bold text-rose-400 sm:block">{friday ? "جمعه" : "تعطیل"}</span>}
        </motion.button>
    );
}

/* ───────────────────────── Month grid ───────────────────────── */

function CalendarMonthGrid({ month, eventsByDay, noteCountByDay, todayISO, compact, onSelectDate }: {
    month: MonthData;
    eventsByDay: Map<string, CalendarEvent[]>;
    noteCountByDay: Map<string, number>;
    todayISO: string;
    compact: boolean;
    onSelectDate: (date: Date) => void;
}) {
    const eventCount = useMemo(() => {
        const ids = new Set<string>();
        month.monthCells.forEach((d) => d && (eventsByDay.get(toISODate(d)) ?? []).forEach((e) => ids.add(`${e.type}-${e.id}`)));
        return ids.size;
    }, [month, eventsByDay]);

    return (
        <section className={`${glass} rounded-[1.75rem] p-3 sm:p-4`}>
            <div className="mb-3 flex items-center justify-between px-1">
                <div className="flex items-baseline gap-2">
                    <h3 className="text-[15px] font-black text-slate-800 dark:text-white">{JALALI_MONTHS[month.jm - 1]}</h3>
                    <span className="text-[11px] font-bold text-slate-400">{toPersianDigits(month.jy)}</span>
                </div>
                <span className="rounded-full bg-blue-500/10 px-2.5 py-1 text-[10px] font-bold text-blue-600 dark:text-blue-300">{toPersianDigits(eventCount)} رویداد</span>
            </div>

            <div className="mb-1.5 grid grid-cols-7 gap-1 sm:gap-1.5">
                {weekDays.map((day, index) => (
                    <div key={day} className={`py-1.5 text-center text-[9.5px] font-bold ${index === 6 ? "text-rose-400" : "text-slate-400 dark:text-slate-500"}`}>
                        {compact ? day.charAt(0) : day}
                    </div>
                ))}
            </div>

            <div className="grid grid-cols-7 gap-1 sm:gap-1.5">
                {month.monthCells.map((date, index) => {
                    if (!date) return <div key={`empty-${month.jy}-${month.jm}-${index}`} className={compact ? "min-h-[62px]" : "min-h-[76px] sm:min-h-[116px]"} />;
                    const iso = toISODate(date);
                    return (
                        <DayCell
                            key={iso}
                            date={date}
                            events={eventsByDay.get(iso) ?? []}
                            noteCount={noteCountByDay.get(iso) ?? 0}
                            isToday={iso === todayISO}
                            compact={compact}
                            onSelect={onSelectDate}
                        />
                    );
                })}
            </div>
        </section>
    );
}

/* ───────────────────────── Page ───────────────────────── */

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

    const today = new Date();
    const todayISO = toISODate(today);

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

    // Deep links: ?note=ID or ?event=ID open the matching day
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

    const eventTypeCount = useMemo(() => {
        const map = new Map<string, number>();
        calendarEvents.forEach((event) => {
            const type = getEventType(event.type);
            map.set(type, (map.get(type) || 0) + 1);
        });
        return [...map.entries()].sort((a, b) => b[1] - a[1]);
    }, [calendarEvents]);

    const upcoming = useMemo(
        () => calendarEvents
            .filter((e) => e.start && (e.end ?? e.start).slice(0, 10) >= todayISO)
            .sort((a, b) => a.start.localeCompare(b.start))
            .slice(0, 5),
        [calendarEvents, todayISO],
    );

    const openDate = (date: Date) => {
        setSelectedDate(date);
        setIsModalOpen(true);
    };

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
        openDate(now);
    };

    const [, todayJm, todayJd] = toJalaliParts(today);
    const todayHoliday = isHolidayDate(today);
    const headerTitle = view === "month" ? `${JALALI_MONTHS[currentJm - 1]} ${toPersianDigits(currentJy)}` : `${getSeasonName(currentJm)} ${toPersianDigits(currentJy)}`;

    const taskCount = calendarEvents.filter((e) => getEventType(e.type) === "task").length;
    const internalTaskCount = calendarEvents.filter((e) => getEventType(e.type) === "internal_task").length;
    const calendarNoteCount = calendarEvents.filter((e) => getEventType(e.type) === "note").length;
    const maxTypeCount = Math.max(1, ...eventTypeCount.map(([, c]) => c));

    const stats = [
        { label: "وظیفه", value: taskCount, Icon: ClipboardCheck, tone: "text-blue-600 bg-blue-500/10 dark:text-blue-300" },
        { label: "درون‌سازمانی", value: internalTaskCount, Icon: Layers3, tone: "text-amber-600 bg-amber-500/10 dark:text-amber-300" },
        { label: "یادداشت", value: calendarNoteCount, Icon: FileText, tone: "text-emerald-600 bg-emerald-500/10 dark:text-emerald-300" },
    ];

    return (
        <>
            <div dir="rtl" className="relative mx-auto w-full max-w-[1400px] overflow-hidden rounded-[2rem] border border-white/70 bg-gradient-to-br from-sky-50 via-blue-50 to-indigo-100 p-3 sm:p-5 dark:border-white/[0.07] dark:from-[#060d24] dark:via-[#0a1740] dark:to-[#0b1d4f]">
                {/* ambient glow */}
                <div className="pointer-events-none absolute -right-24 -top-24 h-80 w-80 rounded-full bg-blue-500/25 blur-3xl dark:bg-blue-500/20" />
                <div className="pointer-events-none absolute -bottom-32 left-1/4 h-96 w-96 rounded-full bg-cyan-400/20 blur-3xl dark:bg-cyan-500/10" />
                <div className="pointer-events-none absolute left-0 top-1/3 h-72 w-72 rounded-full bg-indigo-500/15 blur-3xl" />

                <div className="relative grid gap-4 lg:grid-cols-[300px_minmax(0,1fr)]">
                    {/* ───── Sidebar ───── */}
                    <aside className="flex flex-col gap-4">
                        {/* Today hero */}
                        <div className="relative overflow-hidden rounded-[1.75rem] bg-gradient-to-br from-blue-600 via-blue-500 to-cyan-400 p-5 text-white shadow-[0_24px_50px_-20px_rgba(37,99,235,0.8)]">
                            <div className="pointer-events-none absolute -left-8 -top-10 h-36 w-36 rounded-full bg-white/25 blur-2xl" />
                            <div className="pointer-events-none absolute -bottom-14 right-4 h-36 w-36 rounded-full bg-indigo-500/40 blur-3xl" />
                            <p className="relative text-[11px] font-bold text-white/80">امروز</p>
                            <div className="relative mt-2 flex items-end gap-3">
                                <span className="text-[64px] font-black leading-[0.85] tracking-tight">{toPersianDigits(todayJd)}</span>
                                <div className="pb-1">
                                    <p className="text-[15px] font-extrabold">{persianWeekdayName(today)}</p>
                                    <p className="text-[12px] font-semibold text-white/85">{JALALI_MONTHS[todayJm - 1]}</p>
                                </div>
                            </div>
                            {todayHoliday && <span className="relative mt-3 inline-block rounded-full bg-rose-500/90 px-2.5 py-1 text-[10px] font-bold">امروز تعطیل است</span>}
                            <button type="button" onClick={gotoToday} className={`relative mt-4 flex w-full items-center justify-center gap-1.5 rounded-xl bg-white/20 py-2.5 text-[11.5px] font-bold backdrop-blur-md transition hover:bg-white/30 ${focusRing}`}>
                                <Plus size={13} />یادداشت و برنامه امروز
                            </button>
                        </div>

                        {/* Stats */}
                        {!loading && (
                            <div className="grid grid-cols-3 gap-2">
                                {stats.map(({ label, value, Icon, tone }) => (
                                    <div key={label} className={`${glass} flex flex-col items-center gap-1.5 rounded-2xl px-2 py-3`}>
                                        <span className={`flex h-8 w-8 items-center justify-center rounded-xl ${tone}`}><Icon size={14} /></span>
                                        <span className="text-[17px] font-black leading-none text-slate-800 dark:text-white">{toPersianDigits(value)}</span>
                                        <span className="text-[9px] font-bold text-slate-400">{label}</span>
                                    </div>
                                ))}
                            </div>
                        )}

                        {/* Upcoming */}
                        <div className={`${glass} rounded-[1.5rem] p-4`}>
                            <h4 className="mb-3 text-[12.5px] font-extrabold text-slate-700 dark:text-slate-200">رویدادهای پیش رو</h4>
                            {loading ? (
                                <div className="space-y-2">{[0, 1, 2].map((i) => <div key={i} className="h-11 animate-pulse rounded-xl bg-white/60 dark:bg-white/[0.05]" />)}</div>
                            ) : upcoming.length === 0 ? (
                                <p className="py-4 text-center text-[11px] font-semibold text-slate-400">رویداد پیش رویی در این بازه نیست</p>
                            ) : (
                                <ul className="space-y-1.5">
                                    {upcoming.map((event) => {
                                        const style = getTypeStyle(event.type);
                                        const start = new Date(event.start);
                                        const valid = !Number.isNaN(start.getTime());
                                        const [, jm, jd] = valid ? toJalaliParts(start) : [0, 1, 0];
                                        return (
                                            <li key={`${event.type}-${event.id}`}>
                                                <button type="button" disabled={!valid} onClick={() => valid && openDate(start)} className={`flex w-full items-center gap-3 rounded-xl p-2 text-right transition hover:bg-white/70 dark:hover:bg-white/[0.06] ${focusRing}`}>
                                                    <span className={`flex h-10 w-10 shrink-0 flex-col items-center justify-center rounded-xl ${style.bg} ${style.text}`}>
                                                        <span className="text-[13px] font-black leading-none">{valid ? toPersianDigits(jd) : "—"}</span>
                                                        <span className="mt-0.5 text-[7.5px] font-bold">{JALALI_MONTHS[jm - 1]}</span>
                                                    </span>
                                                    <span className="min-w-0 flex-1">
                                                        <span className="block truncate text-[11.5px] font-bold text-slate-700 dark:text-slate-200">{event.title}</span>
                                                        <span className="mt-0.5 flex items-center gap-1.5 text-[9.5px] font-semibold text-slate-400">
                                                            <span className={`h-1.5 w-1.5 rounded-full ${style.dot}`} />{getTypeLabel(event.type)}
                                                            {valid && <span>· {timeFmt.format(start)}</span>}
                                                        </span>
                                                    </span>
                                                </button>
                                            </li>
                                        );
                                    })}
                                </ul>
                            )}
                        </div>

                        {/* Breakdown */}
                        {!loading && eventTypeCount.length > 0 && (
                            <div className={`${glass} rounded-[1.5rem] p-4`}>
                                <h4 className="mb-3 text-[12.5px] font-extrabold text-slate-700 dark:text-slate-200">توزیع رویدادها</h4>
                                <div className="space-y-3">
                                    {eventTypeCount.map(([type, count]) => {
                                        const style = getTypeStyle(type);
                                        return (
                                            <div key={type}>
                                                <div className="mb-1 flex items-center justify-between text-[10.5px] font-bold">
                                                    <span className={`flex items-center gap-1.5 ${style.text}`}><span className={`h-2 w-2 rounded-full ${style.dot}`} />{getTypeLabel(type)}</span>
                                                    <span className="text-slate-400">{toPersianDigits(count)}</span>
                                                </div>
                                                <div className="h-1.5 overflow-hidden rounded-full bg-slate-500/10">
                                                    <motion.div initial={{ width: 0 }} animate={{ width: `${(count / maxTypeCount) * 100}%` }} transition={{ duration: 0.5, ease: "easeOut" }} className={`h-full rounded-full ${style.bar}`} />
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>
                        )}
                    </aside>

                    {/* ───── Main ───── */}
                    <main className="min-w-0 space-y-4">
                        {/* Toolbar */}
                        <div className={`${glass} relative z-20 flex flex-wrap items-center justify-between gap-3 rounded-[1.75rem] px-4 py-3`}>
                            <div className="flex items-center gap-2">
                                <button type="button" aria-label="قبلی" onClick={() => changeDate(1)} className={`flex h-10 w-10 items-center justify-center rounded-full border border-white/80 bg-white/70 text-slate-500 transition hover:bg-blue-500 hover:text-white dark:border-white/[0.08] dark:bg-white/[0.05] dark:text-slate-300 dark:hover:bg-blue-500 ${focusRing}`}><ChevronRight size={16} /></button>

                                <div className="relative">
                                    <button type="button" onClick={() => { setPickerYear(currentJy); setPickerOpen((v) => !v); }} className={`flex items-center gap-1.5 rounded-xl px-3 py-1.5 transition hover:bg-white/60 dark:hover:bg-white/[0.05] ${focusRing}`}>
                                        <h2 className="text-[19px] font-black tracking-tight text-slate-900 dark:text-white">{headerTitle}</h2>
                                        <ChevronDown size={15} className={`text-slate-400 transition-transform ${pickerOpen ? "rotate-180" : ""}`} />
                                    </button>

                                    {pickerOpen && pickerYear !== null && (
                                        <>
                                            <div className="fixed inset-0 z-20" onClick={() => setPickerOpen(false)} />
                                            <motion.div
                                                initial={{ opacity: 0, y: -8, scale: 0.97 }}
                                                animate={{ opacity: 1, y: 0, scale: 1 }}
                                                transition={{ duration: 0.15 }}
                                                className="absolute right-0 top-[calc(100%+10px)] z-30 w-[min(19rem,calc(100vw-3rem))] rounded-[1.5rem] border border-white/80 bg-white/90 p-4 shadow-[0_30px_60px_-20px_rgba(30,64,175,0.45)] backdrop-blur-2xl dark:border-white/[0.1] dark:bg-[#0c1a42]/95"
                                            >
                                                <div className="mb-3 flex items-center justify-between">
                                                    <button type="button" aria-label="سال بعد" onClick={() => setPickerYear((y) => (y ?? currentJy) + 1)} className="flex h-8 w-8 items-center justify-center rounded-full bg-blue-500/10 text-blue-600 transition hover:bg-blue-500 hover:text-white dark:text-blue-300"><ChevronRight size={13} /></button>
                                                    <span className="text-[14px] font-black text-slate-800 dark:text-white">{toPersianDigits(pickerYear)}</span>
                                                    <button type="button" aria-label="سال قبل" onClick={() => setPickerYear((y) => (y ?? currentJy) - 1)} className="flex h-8 w-8 items-center justify-center rounded-full bg-blue-500/10 text-blue-600 transition hover:bg-blue-500 hover:text-white dark:text-blue-300"><ChevronLeft size={13} /></button>
                                                </div>
                                                <div className="grid grid-cols-3 gap-1.5">
                                                    {JALALI_MONTHS.map((label, index) => {
                                                        const m = index + 1;
                                                        const active = pickerYear === currentJy && m === currentJm;
                                                        return (
                                                            <button key={label} type="button" onClick={() => { goToMonth(pickerYear, m); setPickerOpen(false); }} className={`rounded-xl px-2 py-2.5 text-[11px] font-bold transition ${active ? "bg-gradient-to-br from-blue-600 to-cyan-400 text-white shadow-md shadow-blue-500/30" : "bg-blue-500/[0.07] text-slate-600 hover:bg-blue-500/15 dark:text-slate-300"}`}>{label}</button>
                                                        );
                                                    })}
                                                </div>
                                            </motion.div>
                                        </>
                                    )}
                                </div>

                                <button type="button" aria-label="بعدی" onClick={() => changeDate(-1)} className={`flex h-10 w-10 items-center justify-center rounded-full border border-white/80 bg-white/70 text-slate-500 transition hover:bg-blue-500 hover:text-white dark:border-white/[0.08] dark:bg-white/[0.05] dark:text-slate-300 dark:hover:bg-blue-500 ${focusRing}`}><ChevronLeft size={16} /></button>
                            </div>

                            <div className="flex items-center gap-2">
                                <div className="flex rounded-full border border-white/80 bg-white/60 p-1 dark:border-white/[0.08] dark:bg-white/[0.04]">
                                    {([["month", CalendarDays, "ماهانه"], ["season", CalendarRange, "فصلی"]] as const).map(([value, Icon, label]) => (
                                        <button key={value} type="button" onClick={() => setView(value)} className={`flex items-center gap-1.5 rounded-full px-3.5 py-1.5 text-[11px] font-bold transition ${view === value ? "bg-gradient-to-br from-blue-600 to-blue-500 text-white shadow-[0_6px_16px_-6px_rgba(37,99,235,0.8)]" : "text-slate-500 hover:text-blue-600 dark:text-slate-400"}`}>
                                            <Icon size={12} />{label}
                                        </button>
                                    ))}
                                </div>
                                <button type="button" onClick={gotoToday} className={`flex items-center gap-1.5 rounded-full border border-white/80 bg-white/70 px-3.5 py-2 text-[11px] font-bold text-slate-600 transition hover:bg-blue-500 hover:text-white dark:border-white/[0.08] dark:bg-white/[0.05] dark:text-slate-300 dark:hover:bg-blue-500 ${focusRing}`}><CalendarClock size={12} />امروز</button>
                            </div>
                        </div>

                        {/* Quick months */}
                        <div className="flex items-center gap-2 overflow-x-auto pb-1">
                            {quickMonths.map(({ jy, jm }) => {
                                const selected = jy === currentJy && jm === currentJm;
                                const realToday = jy === realTodayJy && jm === realTodayJm;
                                return (
                                    <button key={`${jy}-${jm}`} type="button" onClick={() => goToMonth(jy, jm)} className={`flex shrink-0 items-center gap-1.5 whitespace-nowrap rounded-full border px-3.5 py-1.5 text-[11px] font-bold transition ${focusRing} ${selected ? "border-transparent bg-gradient-to-br from-blue-600 to-cyan-400 text-white shadow-[0_8px_20px_-8px_rgba(37,99,235,0.9)]" : "border-white/80 bg-white/55 text-slate-500 backdrop-blur-md hover:bg-white hover:text-blue-600 dark:border-white/[0.07] dark:bg-white/[0.04] dark:text-slate-400 dark:hover:bg-white/[0.08]"}`}>
                                        {realToday && <span className={`h-1.5 w-1.5 rounded-full ${selected ? "bg-white" : "bg-blue-500"}`} />}
                                        {jy === realTodayJy ? JALALI_MONTHS[jm - 1] : `${JALALI_MONTHS[jm - 1]} ${toPersianDigits(jy)}`}
                                    </button>
                                );
                            })}
                        </div>

                        {/* Grid(s) */}
                        {loading ? (
                            <div className={`${glass} rounded-[1.75rem] p-4`}>
                                <div className="grid grid-cols-7 gap-1.5">
                                    {Array.from({ length: 35 }).map((_, i) => <div key={i} className="h-[76px] animate-pulse rounded-2xl bg-white/60 sm:h-[116px] dark:bg-white/[0.04]" />)}
                                </div>
                            </div>
                        ) : (
                            <div className={view === "season" ? "grid grid-cols-1 gap-4 xl:grid-cols-3" : ""}>
                                {visibleMonths.map((month) => (
                                    <CalendarMonthGrid
                                        key={`${month.jy}-${month.jm}`}
                                        month={month}
                                        eventsByDay={eventsByDay}
                                        noteCountByDay={noteCountByDay}
                                        todayISO={todayISO}
                                        compact={view === "season"}
                                        onSelectDate={openDate}
                                    />
                                ))}
                            </div>
                        )}

                        {!loading && calendarRange && (
                            <div className="flex items-center justify-between gap-3 px-2 text-[9.5px] font-semibold text-slate-400">
                                <span>بازه دریافت‌شده از تقویم</span>
                                <span dir="ltr">{calendarRange.start} تا {calendarRange.end}</span>
                            </div>
                        )}
                    </main>
                </div>
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