"use client";
import { memo, useCallback, useEffect, useMemo, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { AnimatePresence, MotionConfig, motion } from "framer-motion";
import {
    CalendarCheck,
    CalendarClock,
    CalendarDays,
    CalendarRange,
    Check,
    ChevronDown,
    ChevronLeft,
    ChevronRight,
    ListFilter,
    Plus,
    StickyNote,
} from "lucide-react";
import api from "@/lib/axiosInstance";
import {
    toJalali,
    toGregorian,
    jalaliMonthLength,
    jalaliWeekday,
    toPersianDigits,
    JALALI_MONTHS,
    pad2,
} from "@/lib/jalali";
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
interface DayInfo {
    date: Date;
    iso: string;
    jd: number;
    holiday: boolean;
    friday: boolean;
}
interface MonthData {
    jy: number;
    jm: number;
    cells: (DayInfo | null)[];
    startISO: string;
    endISO: string;
}
interface UpcomingItem {
    key: string;
    event: CalendarEvent;
    date: Date;
    jm: number;
    jd: number;
    ongoing: boolean;
    sort: string;
    rel: string;
    time: string | null;
}
const UPCOMING_DAYS = 60;
const UPCOMING_LIMIT = 6;
const weekDays = ["شنبه", "یکشنبه", "دوشنبه", "سه‌شنبه", "چهارشنبه", "پنجشنبه", "جمعه"];
const PANEL =
    "rounded-2xl border border-slate-300/55 bg-white/70 backdrop-blur-md dark:border-white/[0.08] dark:bg-slate-900/55";
const CELL_GLOW =
    "hover:z-10 hover:-translate-y-0.5 hover:border-indigo-400/50 hover:bg-indigo-500/[0.06] dark:hover:bg-indigo-400/[0.08]";
const FOCUS = "focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-400/60";
const ICON_BTN =
    "flex h-10 w-10 shrink-0 items-center justify-center rounded-full border-[1.5px] border-black/[0.14] bg-[#e2e2e2] text-gray-700 transition-[background-color,color,transform] duration-200 hover:bg-indigo-500 hover:text-white active:scale-90 dark:border-white/[0.13] dark:bg-[#1e1e1e] dark:text-gray-200 dark:hover:bg-indigo-500";
const GRADIENT = "bg-gradient-to-br from-indigo-500 to-violet-600";
const CELL_FULL = "min-h-[64px] sm:min-h-[86px]";
const CELL_COMPACT = "min-h-[44px] sm:min-h-[48px]";
const EMPTY_EVENTS: CalendarEvent[] = [];
const CSS = `
@keyframes cal-rise{from{opacity:0;transform:translateY(8px) scale(.97)}to{opacity:1;transform:none}}
@keyframes cal-fade{from{opacity:0;transform:translateY(3px)}to{opacity:1;transform:none}}
@keyframes cal-next{from{opacity:0;transform:translateX(-26px)}to{opacity:1;transform:none}}
@keyframes cal-prev{from{opacity:0;transform:translateX(26px)}to{opacity:1;transform:none}}
@keyframes cal-pulse{0%{transform:scale(1);opacity:.55}100%{transform:scale(1.8);opacity:0}}
@keyframes cal-bar{0%{transform:translateX(-100%)}100%{transform:translateX(300%)}}
.cal-rise{animation:cal-rise .38s cubic-bezier(.22,1,.36,1) both}
.cal-fade{animation:cal-fade .3s ease-out both}
.cal-next{animation:cal-next .32s cubic-bezier(.22,1,.36,1) both}
.cal-prev{animation:cal-prev .32s cubic-bezier(.22,1,.36,1) both}
.cal-pulse{animation:cal-pulse 2s ease-out infinite}
.cal-bar{animation:cal-bar 1s ease-in-out infinite}
@media (prefers-reduced-motion:reduce){
.cal-rise,.cal-fade,.cal-next,.cal-prev,.cal-pulse,.cal-bar{animation:none}
}
`;
const timeFmt = new Intl.DateTimeFormat("fa-IR", { hour: "2-digit", minute: "2-digit" });
const toISODate = (d: Date) =>
    `${d.getFullYear()}-${pad2(d.getMonth() + 1)}-${pad2(d.getDate())}`;
const isoToDate = (iso: string) => {
    const [y, m, d] = iso.split("-").map(Number);
    return new Date(y, m - 1, d);
};
const toJalaliParts = (d: Date) => toJalali(d.getFullYear(), d.getMonth() + 1, d.getDate());
const jalaliToDate = (jy: number, jm: number, jd: number) => {
    const [gy, gm, gd] = toGregorian(jy, jm, jd);
    return new Date(gy, gm - 1, gd);
};
const persianWeekdayName = (date: Date) => weekDays[(date.getDay() + 1) % 7];
const getSeasonName = (month: number) =>
    month <= 3 ? "بهار" : month <= 6 ? "تابستان" : month <= 9 ? "پاییز" : "زمستان";
const getSeasonStartMonth = (month: number) => Math.floor((month - 1) / 3) * 3 + 1;
const dayDiff = (iso: string, baseISO: string) =>
    Math.round((isoToDate(iso).getTime() - isoToDate(baseISO).getTime()) / 86400000);
function buildMonth(jy: number, jm: number): MonthData {
    const length = jalaliMonthLength(jy, jm);
    const cells: (DayInfo | null)[] = Array(jalaliWeekday(jy, jm, 1)).fill(null);
    for (let jd = 1; jd <= length; jd++) {
        const date = jalaliToDate(jy, jm, jd);
        const friday = isFriday(date);
        const holiday = friday || (jy === 1405 && IRAN_HOLIDAYS_1405.has(`${jm}-${jd}`));
        cells.push({ date, iso: toISODate(date), jd, holiday, friday });
    }
    while (cells.length % 7) cells.push(null);
    return {
        jy,
        jm,
        cells,
        startISO: toISODate(jalaliToDate(jy, jm, 1)),
        endISO: toISODate(jalaliToDate(jy, jm, length)),
    };
}
function extractArray<T>(data: unknown): T[] {
    if (Array.isArray(data)) return data as T[];
    if (data && typeof data === "object") {
        const record = data as Record<string, unknown>;
        if (Array.isArray(record.results)) return record.results as T[];
        if (Array.isArray(record.data)) return record.data as T[];
    }
    return [];
}
const DayCell = memo(function DayCell({
    day,
    events,
    noteCount,
    isToday,
    compact,
    index,
    onSelect,
}: {
    day: DayInfo;
    events: CalendarEvent[];
    noteCount: number;
    isToday: boolean;
    compact: boolean;
    index: number;
    onSelect: (date: Date) => void;
}) {
    const delay = { animationDelay: `${Math.min(index, 41) * 9}ms` };
    const holidayTitle = day.holiday ? (day.friday ? "جمعه" : "تعطیل رسمی") : undefined;
    const surface = isToday
        ? "border-indigo-500/45 bg-indigo-500/[0.08] dark:bg-indigo-400/[0.12]"
        : day.holiday
            ? "border-rose-500/20 bg-rose-500/[0.06] dark:border-rose-300/15 dark:bg-rose-400/[0.07]"
            : "border-slate-300/55 bg-white/65 dark:border-white/[0.08] dark:bg-slate-900/45";
    const numberTone = isToday
        ? `${GRADIENT} text-white ring-2 ring-indigo-300/35`
        : day.holiday
            ? "text-rose-500 dark:text-rose-300"
            : "text-gray-700 dark:text-gray-200";
    if (compact) {
        return (
            <button
                type="button"
                onClick={() => onSelect(day.date)}
                title={holidayTitle}
                style={delay}
                className={`cal-rise relative flex items-center justify-center rounded-xl border p-1 transition-[transform,background-color,border-color] duration-150 ${CELL_GLOW} ${FOCUS} ${CELL_COMPACT} ${surface}`}
            >
                <span className="relative flex h-7 w-7 items-center justify-center">
                    {isToday && <span aria-hidden className="cal-pulse absolute -inset-1 rounded-full border border-indigo-400/50 bg-indigo-400/10" />}
                    <span className={`relative flex h-7 w-7 items-center justify-center rounded-full text-[11px] font-extrabold ${numberTone}`}>
                        {toPersianDigits(day.jd)}
                    </span>
                </span>
            </button>
        );
    }
    return (
        <button
            type="button"
            onClick={() => onSelect(day.date)}
            title={holidayTitle}
            style={delay}
            className={`cal-rise relative flex flex-col gap-1.5 rounded-2xl border p-1.5 text-right transition-[transform,background-color,border-color] duration-150 sm:p-2 ${CELL_GLOW} ${FOCUS} ${CELL_FULL} ${surface}`}
        >
            <div className="flex items-center justify-between gap-1">
                <span className="relative flex h-7 w-7 items-center justify-center">
                    {isToday && (
                        <span aria-hidden className="cal-pulse absolute inset-0 rounded-full bg-indigo-500/40" />
                    )}
                    <span
                        className={`relative flex h-7 w-7 items-center justify-center rounded-full text-[11.5px] font-extrabold ${numberTone}`}
                    >
                        {toPersianDigits(day.jd)}
                    </span>
                </span>
                {noteCount > 0 && (
                    <span className="flex items-center gap-0.5 rounded-full border border-amber-500/30 bg-amber-500/10 px-1.5 py-0.5 text-[8.5px] font-black text-amber-600 dark:border-amber-500/25 dark:bg-amber-500/[0.14] dark:text-amber-400">
                        <StickyNote size={8} />
                        {toPersianDigits(noteCount)}
                    </span>
                )}
            </div>
            {events.length > 0 && (
                <span className="mt-auto self-start px-1 text-[10px] font-medium tabular-nums text-slate-500 dark:text-slate-400">
                    {toPersianDigits(events.length)}
                </span>
            )}
            {day.holiday && (
                <span className="mt-auto hidden text-[8.5px] font-bold text-rose-400 sm:block">
                    {day.friday ? "جمعه" : "تعطیل"}
                </span>
            )}
        </button>
    );
});
const CalendarMonthGrid = memo(function CalendarMonthGrid({
    month,
    eventsByDay,
    noteCountByDay,
    todayISO,
    compact,
    onSelectDate,
}: {
    month: MonthData;
    eventsByDay: Map<string, CalendarEvent[]>;
    noteCountByDay: Map<string, number>;
    todayISO: string;
    compact: boolean;
    onSelectDate: (date: Date) => void;
}) {
    const eventCount = useMemo(() => {
        const ids = new Set<string>();
        month.cells.forEach((day) => {
            if (!day) return;
            (eventsByDay.get(day.iso) ?? []).forEach((e) => ids.add(`${e.type}-${e.id}`));
        });
        return ids.size;
    }, [month, eventsByDay]);
    return (
        <section className={`${PANEL} p-3 sm:p-4`}>
            <div className="mb-3 flex items-center justify-between px-1">
                <div className="flex items-baseline gap-2">
                    <h3 className="text-[15px] font-black text-gray-800 dark:text-gray-100">
                        {JALALI_MONTHS[month.jm - 1]}
                    </h3>
                    <span className="text-[11px] font-bold text-gray-400 dark:text-gray-500">
                        {toPersianDigits(month.jy)}
                    </span>
                </div>
                <span className="rounded-lg border border-indigo-500/25 bg-gradient-to-br from-indigo-500/[0.18] to-violet-500/[0.18] px-2 py-0.5 text-[10.5px] font-bold text-indigo-500 dark:text-indigo-300">
                    {toPersianDigits(eventCount)} رویداد
                </span>
            </div>
            <div className="mb-1.5 grid grid-cols-7 gap-1 sm:gap-1.5">
                {weekDays.map((day, index) => (
                    <div
                        key={day}
                        className={`py-1.5 text-center text-[9.5px] font-bold ${index === 6 ? "text-rose-400" : "text-gray-400 dark:text-gray-500"
                            }`}
                    >
                        {compact ? day.charAt(0) : day}
                    </div>
                ))}
            </div>
            <div className="grid grid-cols-7 gap-1 sm:gap-1.5">
                {month.cells.map((day, index) =>
                    day ? (
                        <DayCell
                            key={day.iso}
                            day={day}
                            events={eventsByDay.get(day.iso) ?? EMPTY_EVENTS}
                            noteCount={noteCountByDay.get(day.iso) ?? 0}
                            isToday={day.iso === todayISO}
                            compact={compact}
                            index={index}
                            onSelect={onSelectDate}
                        />
                    ) : (
                        <div
                            key={`empty-${month.jy}-${month.jm}-${index}`}
                            className={compact ? CELL_COMPACT : CELL_FULL}
                        />
                    )
                )}
            </div>
        </section>
    );
});
export default function PersianCalendar() {
    const router = useRouter();
    const pathname = usePathname();
    const searchParams = useSearchParams();
    const [today] = useState(() => new Date());
    const todayISO = useMemo(() => toISODate(today), [today]);
    const [realTodayJy, realTodayJm, todayJd] = useMemo(() => toJalaliParts(today), [today]);
    const [currentMonthDate, setCurrentMonthDate] = useState(() =>
        jalaliToDate(realTodayJy, realTodayJm, 1)
    );
    const [view, setView] = useState<CalendarView>("month");
    const [dir, setDir] = useState<1 | -1>(1);
    const [calendarEvents, setCalendarEvents] = useState<CalendarEvent[]>([]);
    const [calendarRange, setCalendarRange] = useState<CalendarResponse | null>(null);
    const [loading, setLoading] = useState(true);
    const [upcomingRaw, setUpcomingRaw] = useState<CalendarEvent[]>([]);
    const [upcomingLoading, setUpcomingLoading] = useState(true);
    const [notes, setNotes] = useState<CalendarNote[]>([]);
    const [hiddenTypes, setHiddenTypes] = useState<Set<string>>(() => new Set());
    const [selectedDate, setSelectedDate] = useState<Date | null>(null);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [pickerOpen, setPickerOpen] = useState(false);
    const [pickerYear, setPickerYear] = useState<number | null>(null);
    const [currentJy, currentJm] = useMemo(
        () => toJalaliParts(currentMonthDate),
        [currentMonthDate]
    );
    const quickMonths = useMemo(() => {
        const list: { jy: number; jm: number }[] = [];
        let jy = realTodayJy;
        let jm = realTodayJm;
        for (let i = 0; i < 12; i++) {
            list.push({ jy, jm });
            if (++jm > 12) {
                jm = 1;
                jy++;
            }
        }
        return list;
    }, [realTodayJy, realTodayJm]);
    const visibleMonths = useMemo<MonthData[]>(() => {
        if (view === "month") return [buildMonth(currentJy, currentJm)];
        const seasonStart = getSeasonStartMonth(currentJm);
        return [0, 1, 2].map((i) => {
            let jm = seasonStart + i;
            let jy = currentJy;
            if (jm > 12) {
                jm -= 12;
                jy++;
            }
            return buildMonth(jy, jm);
        });
    }, [currentJy, currentJm, view]);
    const startISO = visibleMonths[0]?.startISO ?? "";
    const endISO = visibleMonths[visibleMonths.length - 1]?.endISO ?? "";
    useEffect(() => {
        let cancelled = false;
        api
            .get("/note/api/v1/")
            .then((res) => {
                if (!cancelled) setNotes(extractArray<CalendarNote>(res.data));
            })
            .catch((error) => console.error("Notes fetch error:", error));
        return () => {
            cancelled = true;
        };
    }, []);
    useEffect(() => {
        if (!startISO || !endISO) return;
        let cancelled = false;
        setLoading(true);
        api
            .get<CalendarResponse>(`/appraisal/api/v1/calendar/?start=${startISO}&end=${endISO}`)
            .then((res) => {
                if (cancelled) return;
                const data = res.data;
                const events = Array.isArray(data?.events) ? data.events : [];
                setCalendarRange({ start: data?.start ?? startISO, end: data?.end ?? endISO, events });
                setCalendarEvents(events);
            })
            .catch((error) => {
                if (cancelled) return;
                console.error("Calendar fetch error:", error);
                setCalendarRange(null);
                setCalendarEvents([]);
            })
            .finally(() => {
                if (!cancelled) setLoading(false);
            });
        return () => {
            cancelled = true;
        };
    }, [startISO, endISO]);
    useEffect(() => {
        let cancelled = false;
        const end = new Date(today);
        end.setDate(end.getDate() + UPCOMING_DAYS);
        api
            .get<CalendarResponse>(
                `/appraisal/api/v1/calendar/?start=${todayISO}&end=${toISODate(end)}`
            )
            .then((res) => {
                if (cancelled) return;
                setUpcomingRaw(Array.isArray(res.data?.events) ? res.data.events : []);
            })
            .catch((error) => {
                if (!cancelled) console.error("Upcoming fetch error:", error);
            })
            .finally(() => {
                if (!cancelled) setUpcomingLoading(false);
            });
        return () => {
            cancelled = true;
        };
    }, [today, todayISO]);
    const mergedEvents = useMemo(() => {
        const map = new Map<string, CalendarEvent>();
        calendarEvents.forEach((e) => map.set(`${e.type}-${e.id}`, e));
        upcomingRaw.forEach((e) => {
            const key = `${e.type}-${e.id}`;
            if (!map.has(key)) map.set(key, e);
        });
        return Array.from(map.values());
    }, [calendarEvents, upcomingRaw]);
    useEffect(() => {
        if (loading) return;
        const eventParam = searchParams.get("event");
        const noteParam = searchParams.get("note");
        if (!eventParam && !noteParam) return;
        let source: string | undefined;
        if (noteParam) {
            source = notes.find((item) => Number(item.id) === Number(noteParam))?.created_at;
        } else if (eventParam) {
            source = mergedEvents.find((item) => Number(item.id) === Number(eventParam))?.start;
        }
        if (!source) return;
        const date = new Date(source);
        if (Number.isNaN(date.getTime())) return;
        const [jy, jm] = toJalaliParts(date);
        setView("month");
        setCurrentMonthDate(jalaliToDate(jy, jm, 1));
        setSelectedDate(date);
        setIsModalOpen(true);
        router.replace(pathname, { scroll: false });
    }, [loading, notes, mergedEvents, searchParams, router, pathname]);
    useEffect(() => {
        if (!pickerOpen) return;
        const onKey = (e: KeyboardEvent) => {
            if (e.key === "Escape") setPickerOpen(false);
        };
        document.addEventListener("keydown", onKey);
        return () => document.removeEventListener("keydown", onKey);
    }, [pickerOpen]);
    const filteredEvents = useMemo(
        () =>
            hiddenTypes.size === 0
                ? calendarEvents
                : calendarEvents.filter((e) => !hiddenTypes.has(getEventType(e.type))),
        [calendarEvents, hiddenTypes]
    );
    const eventsByDay = useMemo(() => {
        const map = new Map<string, CalendarEvent[]>();
        if (!startISO || !endISO) return map;
        for (const event of filteredEvents) {
            if (!event.start) continue;
            const s = event.start.slice(0, 10);
            const rawEnd = (event.end || event.start).slice(0, 10);
            const e = rawEnd < s ? s : rawEnd;
            const from = s > startISO ? s : startISO;
            const to = e < endISO ? e : endISO;
            if (from > to) continue;
            const cursor = isoToDate(from);
            let iso = from;
            let guard = 0;
            while (iso <= to && guard++ < 93) {
                const list = map.get(iso);
                if (list) list.push(event);
                else map.set(iso, [event]);
                cursor.setDate(cursor.getDate() + 1);
                iso = toISODate(cursor);
            }
        }
        return map;
    }, [filteredEvents, startISO, endISO]);
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
    const maxTypeCount = Math.max(1, ...eventTypeCount.map(([, c]) => c));
    const upcoming = useMemo<UpcomingItem[]>(() => {
        const seen = new Set<string>();
        const items: UpcomingItem[] = [];
        for (const event of upcomingRaw) {
            if (!event.start) continue;
            if (hiddenTypes.has(getEventType(event.type))) continue;
            const startDay = event.start.slice(0, 10);
            const endDay = (event.end || event.start).slice(0, 10);
            if (endDay < todayISO) continue;
            const key = `${event.type}-${event.id}`;
            if (seen.has(key)) continue;
            seen.add(key);
            const ongoing = startDay < todayISO;
            const effISO = ongoing ? todayISO : startDay;
            const date = isoToDate(effISO);
            const [, jm, jd] = toJalaliParts(date);
            const diff = dayDiff(effISO, todayISO);
            const startDate = new Date(event.start);
            const hasTime = !ongoing && !Number.isNaN(startDate.getTime());
            items.push({
                key,
                event,
                date,
                jm,
                jd,
                ongoing,
                sort: ongoing ? `${todayISO}T00:00:00` : event.start,
                rel: ongoing
                    ? "در جریان"
                    : diff === 0
                        ? "امروز"
                        : diff === 1
                            ? "فردا"
                            : `${toPersianDigits(diff)} روز دیگر`,
                time: hasTime ? timeFmt.format(startDate) : null,
            });
        }
        items.sort((a, b) => a.sort.localeCompare(b.sort));
        return items.slice(0, UPCOMING_LIMIT);
    }, [upcomingRaw, todayISO, hiddenTypes]);
    const todayEventCount = useMemo(
        () => upcomingRaw.filter((e) => isEventOnDate(e, todayISO)).length,
        [upcomingRaw, todayISO]
    );
    const todayNoteCount = noteCountByDay.get(todayISO) ?? 0;
    const toggleType = useCallback((type: string) => {
        setHiddenTypes((prev) => {
            const next = new Set(prev);
            if (next.has(type)) next.delete(type);
            else next.add(type);
            return next;
        });
    }, []);
    const openDate = useCallback((date: Date) => {
        setSelectedDate(date);
        setIsModalOpen(true);
    }, []);
    const openDateInMonth = useCallback(
        (date: Date) => {
            const [jy, jm] = toJalaliParts(date);
            if (jy !== currentJy || jm !== currentJm || view !== "month") {
                setDir(jy * 12 + jm >= currentJy * 12 + currentJm ? 1 : -1);
                setView("month");
                setCurrentMonthDate(jalaliToDate(jy, jm, 1));
            }
            openDate(date);
        },
        [currentJy, currentJm, view, openDate]
    );
    const changeDate = (delta: 1 | -1) => {
        let nextMonth = view === "month" ? currentJm + delta : getSeasonStartMonth(currentJm) + delta * 3;
        let nextYear = currentJy;
        while (nextMonth > 12) {
            nextMonth -= 12;
            nextYear++;
        }
        while (nextMonth < 1) {
            nextMonth += 12;
            nextYear--;
        }
        setDir(delta);
        setCurrentMonthDate(jalaliToDate(nextYear, nextMonth, 1));
    };
    const goToMonth = (jy: number, jm: number) => {
        setDir(jy * 12 + jm >= currentJy * 12 + currentJm ? 1 : -1);
        setView("month");
        setCurrentMonthDate(jalaliToDate(jy, jm, 1));
    };
    const gotoToday = () => openDateInMonth(new Date());
    const todayHoliday =
        isFriday(today) || (realTodayJy === 1405 && IRAN_HOLIDAYS_1405.has(`${realTodayJm}-${todayJd}`));
    const headerTitle =
        view === "month"
            ? `${JALALI_MONTHS[currentJm - 1]} ${toPersianDigits(currentJy)}`
            : `${getSeasonName(currentJm)} ${toPersianDigits(currentJy)}`;
    return (
        <MotionConfig reducedMotion="user">
            <style>{CSS}</style>
            <div dir="rtl" className="mx-auto w-full max-w-[1400px] rounded-[2rem] border border-slate-300/50 bg-[#e8eff6] p-3 text-slate-800 sm:p-5 dark:border-slate-700/70 dark:bg-[#111c2b] dark:text-slate-100">
                <div className="grid gap-4 lg:grid-cols-[300px_minmax(0,1fr)]">
                    { }
                    <aside className="flex flex-col gap-4">
                        { }
                        <div
                            className={`relative overflow-hidden ${GRADIENT} rounded-2xl border border-white/20 p-5 text-white shadow-none`}
                        >
                            <span
                                aria-hidden
                                className="pointer-events-none absolute -left-3 -top-5 select-none text-[120px] font-black leading-none text-white/10"
                            >
                                {toPersianDigits(realTodayJy)}
                            </span>
                            <span
                                aria-hidden
                                className="pointer-events-none absolute -bottom-12 -right-10 h-40 w-40 rounded-full bg-white/10"
                            />
                            <span
                                aria-hidden
                                className="pointer-events-none absolute -bottom-4 right-16 h-16 w-16 rounded-full bg-white/10"
                            />
                            <div className="relative">
                                <p className="text-[11px] font-bold text-white/80">امروز</p>
                                <div className="mt-2 flex items-end gap-3">
                                    <span className="text-[60px] font-black leading-[0.85] tracking-tight">
                                        {toPersianDigits(todayJd)}
                                    </span>
                                    <div className="pb-1">
                                        <p className="text-[15px] font-extrabold">{persianWeekdayName(today)}</p>
                                        <p className="text-[12px] font-semibold text-white/85">
                                            {JALALI_MONTHS[realTodayJm - 1]}
                                        </p>
                                    </div>
                                </div>
                                <div className="mt-3 flex flex-wrap gap-1.5">
                                    {todayHoliday && (
                                        <span className="rounded-lg bg-rose-500/90 px-2 py-0.5 text-[10.5px] font-bold">
                                            امروز تعطیل است
                                        </span>
                                    )}
                                    {!upcomingLoading && (
                                        <>
                                            <span className="rounded-lg bg-white/15 px-2 py-0.5 text-[10.5px] font-bold">
                                                {toPersianDigits(todayEventCount)} رویداد
                                            </span>
                                            <span className="rounded-lg bg-white/15 px-2 py-0.5 text-[10.5px] font-bold">
                                                {toPersianDigits(todayNoteCount)} یادداشت
                                            </span>
                                        </>
                                    )}
                                </div>
                                <button
                                    type="button"
                                    onClick={gotoToday}
                                    className={`mt-4 flex w-full items-center justify-center gap-1.5 rounded-2xl bg-white/20 py-2.5 text-[12px] font-bold transition-[background-color,transform] hover:bg-white/30 active:scale-[0.98] ${FOCUS}`}
                                >
                                    <Plus size={13} />
                                    یادداشت و برنامه امروز
                                </button>
                            </div>
                        </div>
                        { }
                        <div className={`${PANEL} p-4`}>
                            <h4 className="mb-3 flex items-center gap-2 text-[12.5px] font-extrabold text-gray-800 dark:text-gray-100">
                                <span className="flex h-7 w-7 items-center justify-center rounded-xl bg-indigo-500/10 text-indigo-500 dark:text-indigo-300">
                                    <CalendarCheck size={14} />
                                </span>
                                رویدادهای پیش رو
                            </h4>
                            {upcomingLoading ? (
                                <div className="animate-pulse space-y-2">
                                    {[0, 1, 2].map((i) => (
                                        <div key={i} className="h-12 rounded-2xl bg-black/[0.04] dark:bg-white/[0.04]" />
                                    ))}
                                </div>
                            ) : upcoming.length === 0 ? (
                                <p className="py-4 text-center text-[11px] font-semibold text-gray-400 dark:text-gray-500">
                                    رویداد پیش رویی ثبت نشده
                                </p>
                            ) : (
                                <ul className="space-y-1.5">
                                    {upcoming.map((item, i) => {
                                        const style = getTypeStyle(item.event.type);
                                        return (
                                            <motion.li
                                                key={item.key}
                                                initial={{ opacity: 0, x: 14 }}
                                                animate={{ opacity: 1, x: 0 }}
                                                transition={{ delay: i * 0.05, duration: 0.25, ease: "easeOut" }}
                                            >
                                                <button
                                                    type="button"
                                                    onClick={() => openDateInMonth(item.date)}
                                                    className={`flex w-full items-center gap-3 rounded-2xl border border-transparent p-2 text-right transition-[background-color,border-color,transform] hover:-translate-x-0.5 hover:border-black/[0.06] hover:bg-white dark:hover:border-white/[0.06] dark:hover:bg-white/[0.05] ${FOCUS}`}
                                                >
                                                    <span
                                                        className={`flex h-11 w-11 shrink-0 flex-col items-center justify-center rounded-2xl ${style.bg} ${style.text}`}
                                                    >
                                                        <span className="text-[14px] font-black leading-none">
                                                            {toPersianDigits(item.jd)}
                                                        </span>
                                                        <span className="mt-0.5 text-[8px] font-bold">
                                                            {JALALI_MONTHS[item.jm - 1]}
                                                        </span>
                                                    </span>
                                                    <span className="min-w-0 flex-1">
                                                        <span className="block truncate text-[12px] font-extrabold text-gray-800 dark:text-gray-100">
                                                            {item.event.title}
                                                        </span>
                                                        <span className="mt-0.5 flex items-center gap-1.5 text-[10px] font-semibold text-gray-400 dark:text-gray-500">
                                                            <span className={`h-1.5 w-1.5 shrink-0 rounded-full ${style.dot}`} />
                                                            <span className="truncate">{getTypeLabel(item.event.type)}</span>
                                                            {item.time && <span>· {item.time}</span>}
                                                        </span>
                                                    </span>
                                                    <span
                                                        className={`shrink-0 rounded-lg border px-1.5 py-0.5 text-[9.5px] font-bold ${item.rel === "امروز" || item.ongoing
                                                            ? "border-amber-500/30 bg-amber-500/10 text-amber-600 dark:text-amber-400"
                                                            : "border-indigo-500/25 bg-indigo-500/10 text-indigo-500 dark:text-indigo-300"
                                                            }`}
                                                    >
                                                        {item.rel}
                                                    </span>
                                                </button>
                                            </motion.li>
                                        );
                                    })}
                                </ul>
                            )}
                        </div>
                        { }
                        {eventTypeCount.length > 0 && (
                            <div className={`${PANEL} p-4`}>
                                <div className="mb-3 flex items-center justify-between">
                                    <h4 className="flex items-center gap-2 text-[12.5px] font-extrabold text-gray-800 dark:text-gray-100">
                                        <span className="flex h-7 w-7 items-center justify-center rounded-xl bg-violet-500/10 text-violet-500 dark:text-violet-300">
                                            <ListFilter size={14} />
                                        </span>
                                        فیلتر رویدادها
                                    </h4>
                                    {hiddenTypes.size > 0 && (
                                        <button
                                            type="button"
                                            onClick={() => setHiddenTypes(new Set())}
                                            className={`rounded-lg px-2 py-0.5 text-[10px] font-bold text-indigo-500 transition-colors hover:bg-indigo-500/10 dark:text-indigo-300 ${FOCUS}`}
                                        >
                                            نمایش همه
                                        </button>
                                    )}
                                </div>
                                <div className="space-y-1">
                                    {eventTypeCount.map(([type, count]) => {
                                        const style = getTypeStyle(type);
                                        const active = !hiddenTypes.has(type);
                                        return (
                                            <button
                                                key={type}
                                                type="button"
                                                aria-pressed={active}
                                                onClick={() => toggleType(type)}
                                                className={`block w-full rounded-xl p-2 text-right transition-[background-color,opacity] hover:bg-black/[0.04] dark:hover:bg-white/[0.04] ${FOCUS} ${active ? "opacity-100" : "opacity-45"
                                                    }`}
                                            >
                                                <span className="mb-1.5 flex items-center justify-between text-[10.5px] font-bold">
                                                    <span className={`flex items-center gap-2 ${style.text}`}>
                                                        <span
                                                            className={`flex h-4 w-4 items-center justify-center rounded-md border transition-colors ${active
                                                                ? `${style.bar} border-transparent text-white`
                                                                : "border-black/20 text-transparent dark:border-white/20"
                                                                }`}
                                                        >
                                                            <Check size={10} strokeWidth={3.4} />
                                                        </span>
                                                        {getTypeLabel(type)}
                                                    </span>
                                                    <span className="text-gray-400">{toPersianDigits(count)}</span>
                                                </span>
                                                <span className="block h-1.5 overflow-hidden rounded-full bg-black/[0.06] dark:bg-white/[0.06]">
                                                    <span
                                                        className={`block h-full rounded-full ${style.bar} transition-[width] duration-500`}
                                                        style={{ width: `${(count / maxTypeCount) * 100}%` }}
                                                    />
                                                </span>
                                            </button>
                                        );
                                    })}
                                </div>
                            </div>
                        )}
                    </aside>
                    { }
                    <main className="min-w-0 space-y-4">
                        { }
                        <div className={`${PANEL} relative z-20 flex flex-wrap items-center justify-between gap-3 px-4 py-3`}>
                            <div className="flex items-center gap-2">
                                <button
                                    type="button"
                                    aria-label="قبلی"
                                    onClick={() => changeDate(-1)}
                                    className={`${ICON_BTN} ${FOCUS}`}
                                >
                                    <ChevronRight size={16} />
                                </button>
                                <div className="relative">
                                    <button
                                        type="button"
                                        onClick={() => {
                                            setPickerYear(currentJy);
                                            setPickerOpen((v) => !v);
                                        }}
                                        aria-expanded={pickerOpen}
                                        className={`flex items-center gap-1.5 rounded-2xl px-3 py-1.5 transition-colors hover:bg-black/[0.04] dark:hover:bg-white/[0.05] ${FOCUS}`}
                                    >
                                        <h2 className="text-[18px] font-black tracking-tight text-gray-900 dark:text-white">
                                            {headerTitle}
                                        </h2>
                                        <ChevronDown
                                            size={15}
                                            className={`text-gray-400 transition-transform duration-200 ${pickerOpen ? "rotate-180" : ""
                                                }`}
                                        />
                                    </button>
                                    <AnimatePresence>
                                        {pickerOpen && pickerYear !== null && (
                                            <>
                                                <div className="fixed inset-0 z-20" onClick={() => setPickerOpen(false)} />
                                                <motion.div
                                                    key="picker"
                                                    initial={{ opacity: 0, y: -8, scale: 0.96 }}
                                                    animate={{ opacity: 1, y: 0, scale: 1 }}
                                                    exit={{ opacity: 0, y: -6, scale: 0.97 }}
                                                    transition={{ duration: 0.16, ease: "easeOut" }}
                                                    style={{ transformOrigin: "top right" }}
                                                    className="absolute right-0 top-[calc(100%+10px)] z-30 w-[min(19rem,calc(100vw-3rem))] rounded-2xl border border-slate-900/[0.08] bg-white p-4 shadow-2xl dark:border-white/[0.08] dark:bg-slate-900"
                                                >
                                                    <div className="mb-3 flex items-center justify-between">
                                                        <button
                                                            type="button"
                                                            aria-label="سال قبل"
                                                            onClick={() => setPickerYear((y) => (y ?? currentJy) - 1)}
                                                            className="flex h-8 w-8 items-center justify-center rounded-full bg-black/5 text-gray-600 transition-colors hover:bg-indigo-500 hover:text-white dark:bg-white/10 dark:text-gray-300"
                                                        >
                                                            <ChevronRight size={13} />
                                                        </button>
                                                        <span className="text-[14px] font-black text-gray-800 dark:text-white">
                                                            {toPersianDigits(pickerYear)}
                                                        </span>
                                                        <button
                                                            type="button"
                                                            aria-label="سال بعد"
                                                            onClick={() => setPickerYear((y) => (y ?? currentJy) + 1)}
                                                            className="flex h-8 w-8 items-center justify-center rounded-full bg-black/5 text-gray-600 transition-colors hover:bg-indigo-500 hover:text-white dark:bg-white/10 dark:text-gray-300"
                                                        >
                                                            <ChevronLeft size={13} />
                                                        </button>
                                                    </div>
                                                    <div className="grid grid-cols-3 gap-1.5">
                                                        {JALALI_MONTHS.map((label, index) => {
                                                            const m = index + 1;
                                                            const active = pickerYear === currentJy && m === currentJm;
                                                            return (
                                                                <button
                                                                    key={label}
                                                                    type="button"
                                                                    onClick={() => {
                                                                        goToMonth(pickerYear, m);
                                                                        setPickerOpen(false);
                                                                    }}
                                                                    className={`rounded-xl px-2 py-2.5 text-[11px] font-bold transition-[background-color,transform] active:scale-95 ${active
                                                                        ? `${GRADIENT} text-white`
                                                                        : "bg-black/[0.04] text-gray-600 hover:bg-indigo-500/15 dark:bg-white/[0.05] dark:text-gray-300"
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
                                    </AnimatePresence>
                                </div>
                                <button
                                    type="button"
                                    aria-label="بعدی"
                                    onClick={() => changeDate(1)}
                                    className={`${ICON_BTN} ${FOCUS}`}
                                >
                                    <ChevronLeft size={16} />
                                </button>
                            </div>
                            <div className="flex items-center gap-2">
                                <div className="flex rounded-full border border-black/[0.06] bg-black/[0.03] p-1 dark:border-white/[0.06] dark:bg-white/[0.03]">
                                    {([["month", CalendarDays, "ماهانه"], ["season", CalendarRange, "فصلی"]] as const).map(
                                        ([value, Icon, label]) => (
                                            <button
                                                key={value}
                                                type="button"
                                                onClick={() => setView(value)}
                                                className={`relative flex items-center gap-1.5 rounded-full px-3.5 py-1.5 text-[11px] font-bold transition-colors ${view === value
                                                    ? "text-white"
                                                    : "text-gray-500 hover:text-indigo-500 dark:text-gray-400"
                                                    }`}
                                            >
                                                {view === value && (
                                                    <motion.span
                                                        layoutId="view-pill"
                                                        transition={{ type: "spring", stiffness: 500, damping: 36 }}
                                                        className={`absolute inset-0 rounded-full ${GRADIENT}`}
                                                    />
                                                )}
                                                <span className="relative flex items-center gap-1.5">
                                                    <Icon size={12} />
                                                    {label}
                                                </span>
                                            </button>
                                        )
                                    )}
                                </div>
                                <button
                                    type="button"
                                    onClick={gotoToday}
                                    className={`flex items-center gap-1.5 rounded-full border-[1.5px] border-black/[0.14] bg-[#e2e2e2] px-3.5 py-2 text-[11px] font-bold text-gray-700 transition-[background-color,color,transform] hover:bg-indigo-500 hover:text-white active:scale-95 dark:border-white/[0.13] dark:bg-[#1e1e1e] dark:text-gray-200 dark:hover:bg-indigo-500 ${FOCUS}`}
                                >
                                    <CalendarClock size={12} />
                                    امروز
                                </button>
                            </div>
                        </div>
                        { }
                        <div className="flex items-center gap-2 overflow-x-auto pb-1">
                            {quickMonths.map(({ jy, jm }) => {
                                const selected = jy === currentJy && jm === currentJm;
                                const realToday = jy === realTodayJy && jm === realTodayJm;
                                return (
                                    <button
                                        key={`${jy}-${jm}`}
                                        type="button"
                                        onClick={() => goToMonth(jy, jm)}
                                        className={`relative flex shrink-0 items-center gap-1.5 whitespace-nowrap rounded-full border px-3.5 py-1.5 text-[11px] font-bold transition-colors ${FOCUS} ${selected
                                            ? "border-transparent text-white"
                                            : "border-slate-300/60 bg-white/65 text-gray-600 hover:text-indigo-600 dark:border-white/[0.08] dark:bg-slate-900/45 dark:text-gray-300"
                                            }`}
                                    >
                                        {selected && (
                                            <motion.span
                                                layoutId="qm-pill"
                                                transition={{ type: "spring", stiffness: 500, damping: 38 }}
                                                className={`absolute inset-0 rounded-full ${GRADIENT}`}
                                            />
                                        )}
                                        <span className="relative flex items-center gap-1.5">
                                            {realToday && (
                                                <span
                                                    className={`h-1.5 w-1.5 rounded-full ${selected ? "bg-white" : "bg-indigo-500"
                                                        }`}
                                                />
                                            )}
                                            {jy === realTodayJy
                                                ? JALALI_MONTHS[jm - 1]
                                                : `${JALALI_MONTHS[jm - 1]} ${toPersianDigits(jy)}`}
                                        </span>
                                    </button>
                                );
                            })}
                        </div>
                        { }
                        <div className="relative h-[3px] overflow-hidden rounded-full bg-indigo-500/10">
                            {loading && (
                                <span className="cal-bar absolute inset-y-0 left-0 w-1/3 rounded-full bg-gradient-to-l from-indigo-500 to-violet-500" />
                            )}
                        </div>
                        { }
                        <div
                            key={`${startISO}|${view}`}
                            className={`${dir === 1 ? "cal-next" : "cal-prev"} ${view === "season" ? "grid grid-cols-1 gap-4 xl:grid-cols-3" : ""
                                }`}
                        >
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
                        {!loading && calendarRange && (
                            <div className="flex items-center justify-between gap-3 px-2 text-[9.5px] font-semibold text-gray-400 dark:text-gray-500">
                                <span>بازه دریافت‌شده از تقویم</span>
                                <span dir="ltr">
                                    {calendarRange.start} تا {calendarRange.end}
                                </span>
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
                events={mergedEvents}
                onCreated={(note) => setNotes((prev) => [note, ...prev])}
                onDeleted={(id) => setNotes((prev) => prev.filter((note) => note.id !== id))}
            />
        </MotionConfig>
    );
}
