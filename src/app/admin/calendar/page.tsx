"use client";

import {
    useEffect,
    useMemo,
    useState,
} from "react";

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
} from "./CalendarNoteModal";

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

const weekDays = [
    "شنبه",
    "یکشنبه",
    "دوشنبه",
    "سه‌شنبه",
    "چهارشنبه",
    "پنجشنبه",
    "جمعه",
];

const toISODate = (date: Date) =>
    `${date.getFullYear()}-${pad2(date.getMonth() + 1)}-${pad2(
        date.getDate()
    )}`;

const toJalaliParts = (date: Date) =>
    toJalali(
        date.getFullYear(),
        date.getMonth() + 1,
        date.getDate()
    );

const jalaliToDate = (
    jy: number,
    jm: number,
    jd: number
): Date => {
    const [gy, gm, gd] = toGregorian(jy, jm, jd);

    return new Date(gy, gm - 1, gd);
};

const getNoteDate = (note: CalendarNote) =>
    note.created_at
        ? note.created_at.slice(0, 10)
        : "";

const EVENT_TYPE_LABEL: Record<string, string> = {
    task: "تسک",
    internal_task: "تسک داخلی",
    note: "یادداشت",
    meeting: "جلسه",
    reminder: "یادآور",
    deadline: "مهلت",
};

const EVENT_TYPE_COLOR: Record<
    string,
    {
        bg: string;
        text: string;
        dot: string;
        border: string;
        soft: string;
    }
> = {
    task: {
        bg: "bg-indigo-50 dark:bg-indigo-500/10",
        text: "text-indigo-600 dark:text-indigo-300",
        dot: "bg-indigo-500",
        border: "border-indigo-100 dark:border-indigo-500/15",
        soft: "bg-indigo-500",
    },
    internal_task: {
        bg: "bg-amber-50 dark:bg-amber-500/10",
        text: "text-amber-600 dark:text-amber-300",
        dot: "bg-amber-500",
        border: "border-amber-100 dark:border-amber-500/15",
        soft: "bg-amber-500",
    },
    note: {
        bg: "bg-emerald-50 dark:bg-emerald-500/10",
        text: "text-emerald-600 dark:text-emerald-300",
        dot: "bg-emerald-500",
        border: "border-emerald-100 dark:border-emerald-500/15",
        soft: "bg-emerald-500",
    },
    meeting: {
        bg: "bg-violet-50 dark:bg-violet-500/10",
        text: "text-violet-600 dark:text-violet-300",
        dot: "bg-violet-500",
        border: "border-violet-100 dark:border-violet-500/15",
        soft: "bg-violet-500",
    },
    reminder: {
        bg: "bg-cyan-50 dark:bg-cyan-500/10",
        text: "text-cyan-600 dark:text-cyan-300",
        dot: "bg-cyan-500",
        border: "border-cyan-100 dark:border-cyan-500/15",
        soft: "bg-cyan-500",
    },
    deadline: {
        bg: "bg-rose-50 dark:bg-rose-500/10",
        text: "text-rose-600 dark:text-rose-300",
        dot: "bg-rose-500",
        border: "border-rose-100 dark:border-rose-500/15",
        soft: "bg-rose-500",
    },
    default: {
        bg: "bg-slate-50 dark:bg-white/[0.04]",
        text: "text-slate-500 dark:text-slate-400",
        dot: "bg-slate-400 dark:bg-slate-500",
        border: "border-slate-100 dark:border-white/[0.06]",
        soft: "bg-slate-400",
    },
};

function getTypeStyle(type: string) {
    return (
        EVENT_TYPE_COLOR[type] ??
        EVENT_TYPE_COLOR.default
    );
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

function getEventType(type: string) {
    if (
        type === "internal_task" ||
        type === "internal-task"
    ) {
        return "internal_task";
    }

    if (type === "task" || type === "tasks") {
        return "task";
    }

    if (type === "note" || type === "notes") {
        return "note";
    }

    return type;
}

function isEventOnDate(
    event: CalendarEvent,
    dateISO: string
) {
    if (!event.start) return false;

    const eventStart = event.start.slice(0, 10);

    const eventEnd = event.end
        ? event.end.slice(0, 10)
        : eventStart;

    return (
        eventStart <= dateISO &&
        eventEnd >= dateISO
    );
}

function DayEventDots({
    events,
}: {
    events: CalendarEvent[];
}) {
    const grouped = useMemo(() => {
        const map = new Map<string, number>();

        events.forEach((event) => {
            const type = getEventType(event.type);

            map.set(
                type,
                (map.get(type) || 0) + 1
            );
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
                        className={`flex items-center gap-1 rounded-lg border px-1.5 py-0.5 text-[9px] font-bold ${style.bg} ${style.text} ${style.border}`}
                    >
                        <span
                            className={`h-1.5 w-1.5 rounded-full ${style.dot}`}
                        />

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
    eventsByDay: Map<
        string,
        CalendarEvent[]
    >;
    noteCountByDay: Map<string, number>;
    todayISO: string;
    onSelectDate: (date: Date) => void;
}) {
    return (
        <section className="overflow-hidden rounded-[1.5rem] border border-slate-200/80 bg-white shadow-[0_4px_24px_-12px_rgba(15,23,42,0.16)] dark:border-white/[0.07] dark:bg-[#111827] dark:shadow-none">
            <div className="flex items-center justify-between border-b border-slate-100 bg-gradient-to-l from-indigo-50/70 via-white to-white px-5 py-3.5 dark:border-white/[0.06] dark:from-indigo-500/[0.07] dark:via-[#111827] dark:to-[#111827]">
                <div className="flex items-center gap-2.5">
                    <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-indigo-100 text-indigo-600 dark:bg-indigo-500/15 dark:text-indigo-300">
                        <CalendarDays size={14} />
                    </div>

                    <div className="flex flex-col gap-0.5">
                        <h3 className="text-[13px] font-extrabold text-slate-800 dark:text-white">
                            {JALALI_MONTHS[
                                month.jm - 1
                            ]}
                        </h3>

                        <span className="text-[10px] font-medium text-slate-400 dark:text-slate-500">
                            تقویم ماهانه
                        </span>
                    </div>
                </div>

                <span className="rounded-lg bg-slate-100 px-2 py-1 text-[10px] font-bold text-slate-500 dark:bg-white/[0.05] dark:text-slate-400">
                    {toPersianDigits(month.jy)}
                </span>
            </div>

            <div className="grid grid-cols-7 border-b border-slate-100 bg-slate-50/70 dark:border-white/[0.05] dark:bg-white/[0.02]">
                {weekDays.map((day, index) => (
                    <div
                        key={day}
                        className={`py-2.5 text-center text-[9px] font-bold ${index === 6
                                ? "text-rose-400 dark:text-rose-300"
                                : "text-slate-400 dark:text-slate-500"
                            }`}
                    >
                        {day}
                    </div>
                ))}
            </div>

            <div className="grid grid-cols-7 gap-px bg-slate-100 dark:bg-white/[0.045]">
                {month.monthCells.map(
                    (date, index) => {
                        if (!date) {
                            return (
                                <div
                                    key={`empty-${month.jy}-${month.jm}-${index}`}
                                    className="min-h-[92px] bg-slate-50/70 dark:bg-[#0f172a]/80"
                                />
                            );
                        }

                        const iso =
                            toISODate(date);

                        const dayEvents =
                            eventsByDay.get(
                                iso
                            ) ?? [];

                        const noteCount =
                            noteCountByDay.get(
                                iso
                            ) ?? 0;

                        const isToday =
                            iso === todayISO;

                        const [, , jd] =
                            toJalaliParts(
                                date
                            );

                        const dayOfWeek =
                            date.getDay();

                        return (
                            <motion.button
                                key={iso}
                                type="button"
                                whileTap={{
                                    scale: 0.975,
                                }}
                                onClick={() =>
                                    onSelectDate(
                                        date
                                    )
                                }
                                className={`group relative flex min-h-[92px] flex-col gap-1.5 p-2.5 text-right transition-all ${isToday
                                        ? "bg-indigo-50/80 dark:bg-indigo-500/[0.09]"
                                        : "bg-white hover:bg-slate-50 dark:bg-[#111827] dark:hover:bg-white/[0.025]"
                                    }`}
                            >
                                <div className="flex items-start justify-between gap-1">
                                    <span
                                        className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-[10px] text-[11px] font-extrabold transition-all ${isToday
                                                ? "bg-indigo-600 text-white shadow-[0_4px_10px_-4px_rgba(79,70,229,0.6)] dark:bg-indigo-500"
                                                : dayOfWeek ===
                                                    5
                                                    ? "bg-rose-50 text-rose-500 dark:bg-rose-500/10 dark:text-rose-300"
                                                    : "bg-slate-50 text-slate-600 group-hover:bg-white dark:bg-white/[0.045] dark:text-slate-300 dark:group-hover:bg-white/[0.07]"
                                            }`}
                                    >
                                        {toPersianDigits(
                                            jd
                                        )}
                                    </span>

                                    {noteCount >
                                        0 && (
                                            <span className="flex items-center gap-1 rounded-lg bg-emerald-50 px-1.5 py-1 text-[8.5px] font-bold text-emerald-600 dark:bg-emerald-500/10 dark:text-emerald-300">
                                                <MessageSquareText
                                                    size={
                                                        9
                                                    }
                                                />

                                                {toPersianDigits(
                                                    noteCount
                                                )}
                                            </span>
                                        )}
                                </div>

                                {dayEvents.length >
                                    0 && (
                                        <DayEventDots
                                            events={
                                                dayEvents
                                            }
                                        />
                                    )}

                                {isToday && (
                                    <span className="absolute bottom-1.5 left-1/2 h-1 w-1 -translate-x-1/2 rounded-full bg-indigo-500" />
                                )}
                            </motion.button>
                        );
                    }
                )}
            </div>
        </section>
    );
}

export default function PersianCalendar() {
    const router = useRouter();
    const pathname = usePathname();
    const searchParams = useSearchParams();

    const [currentMonthDate, setCurrentMonthDate] =
        useState(() => {
            const [jy, jm] =
                toJalaliParts(new Date());

            return jalaliToDate(
                jy,
                jm,
                1
            );
        });

    const [view, setView] =
        useState<CalendarView>("month");

    const [
        calendarEvents,
        setCalendarEvents,
    ] = useState<CalendarEvent[]>([]);

    const [notes, setNotes] =
        useState<CalendarNote[]>([]);

    const [loading, setLoading] =
        useState(true);

    const [selectedDate, setSelectedDate] =
        useState<Date | null>(null);

    const [isModalOpen, setIsModalOpen] =
        useState(false);

    const [pickerOpen, setPickerOpen] =
        useState(false);

    const [pickerYear, setPickerYear] =
        useState<number | null>(null);

    const [currentJy, currentJm] =
        useMemo(
            () =>
                toJalaliParts(
                    currentMonthDate
                ),
            [currentMonthDate]
        );

    const [realTodayJy, realTodayJm] =
        useMemo(
            () =>
                toJalaliParts(
                    new Date()
                ),
            []
        );

    const quickMonths = useMemo(() => {
        const list: {
            jy: number;
            jm: number;
        }[] = [];

        let jy = realTodayJy;
        let jm = realTodayJm;

        for (let i = 0; i < 12; i++) {
            list.push({
                jy,
                jm,
            });

            jm++;

            if (jm > 12) {
                jm = 1;
                jy++;
            }
        }

        return list;
    }, [realTodayJy, realTodayJm]);

    const visibleMonths =
        useMemo<MonthData[]>(() => {
            const seasonStart =
                getSeasonStartMonth(
                    currentJm
                );

            const months =
                view === "month"
                    ? [
                        {
                            jy: currentJy,
                            jm: currentJm,
                        },
                    ]
                    : [
                        {
                            jy: currentJy,
                            jm: seasonStart,
                        },
                        {
                            jy: currentJy,
                            jm:
                                seasonStart +
                                1,
                        },
                        {
                            jy: currentJy,
                            jm:
                                seasonStart +
                                2,
                        },
                    ];

            return months.map(
                ({ jy, jm }) => {
                    const monthLength =
                        jalaliMonthLength(
                            jy,
                            jm
                        );

                    const firstDayWeekIndex =
                        jalaliWeekday(
                            jy,
                            jm,
                            1
                        );

                    const monthCells:
                        (Date | null)[] =
                        Array(
                            firstDayWeekIndex
                        ).fill(null);

                    for (
                        let day = 1;
                        day <= monthLength;
                        day++
                    ) {
                        monthCells.push(
                            jalaliToDate(
                                jy,
                                jm,
                                day
                            )
                        );
                    }

                    while (
                        monthCells.length %
                        7 !==
                        0
                    ) {
                        monthCells.push(null);
                    }

                    return {
                        jy,
                        jm,
                        monthCells,
                        startISO:
                            toISODate(
                                jalaliToDate(
                                    jy,
                                    jm,
                                    1
                                )
                            ),
                        endISO:
                            toISODate(
                                jalaliToDate(
                                    jy,
                                    jm,
                                    monthLength
                                )
                            ),
                    };
                }
            );
        }, [currentJy, currentJm, view]);

    const startISO =
        visibleMonths[0].startISO;

    const endISO =
        visibleMonths[
            visibleMonths.length - 1
        ].endISO;

    useEffect(() => {
        const fetchCalendarData =
            async () => {
                setLoading(true);

                try {
                    const [
                        calendarRes,
                        notesRes,
                    ] = await Promise.all([
                        api.get(
                            `/appraisal/api/v1/calendar/?start=${startISO}&end=${endISO}`
                        ),
                        api.get(
                            "/note/api/v1/"
                        ),
                    ]);

                    setCalendarEvents(
                        Array.isArray(
                            calendarRes
                                .data?.events
                        )
                            ? calendarRes
                                .data
                                .events
                            : []
                    );

                    setNotes(
                        Array.isArray(
                            notesRes.data
                        )
                            ? notesRes.data
                            : []
                    );
                } catch {
                    setCalendarEvents(
                        []
                    );

                    setNotes([]);
                } finally {
                    setLoading(false);
                }
            };

        fetchCalendarData();
    }, [startISO, endISO]);

    useEffect(() => {
        if (loading) return;

        const eventParam =
            searchParams.get("event");

        const noteParam =
            searchParams.get("note");

        if (noteParam) {
            const noteId =
                Number(noteParam);

            if (
                !Number.isFinite(noteId)
            ) {
                return;
            }

            const note =
                notes.find(
                    (item) =>
                        Number(
                            item.id
                        ) === noteId
                );

            if (!note?.created_at) {
                return;
            }

            const date = new Date(
                note.created_at
            );

            if (
                Number.isNaN(
                    date.getTime()
                )
            ) {
                return;
            }

            const [
                jy,
                jm,
            ] = toJalaliParts(date);

            setView("month");
            setCurrentMonthDate(
                jalaliToDate(
                    jy,
                    jm,
                    1
                )
            );
            setSelectedDate(date);
            setIsModalOpen(true);

            router.replace(
                pathname,
                {
                    scroll: false,
                }
            );

            return;
        }

        if (eventParam) {
            const eventId =
                Number(eventParam);

            if (
                !Number.isFinite(eventId)
            ) {
                return;
            }

            const event =
                calendarEvents.find(
                    (item) =>
                        Number(
                            item.id
                        ) === eventId
                );

            if (!event?.start) {
                return;
            }

            const date = new Date(
                event.start
            );

            if (
                Number.isNaN(
                    date.getTime()
                )
            ) {
                return;
            }

            const [
                jy,
                jm,
            ] = toJalaliParts(date);

            setView("month");
            setCurrentMonthDate(
                jalaliToDate(
                    jy,
                    jm,
                    1
                )
            );
            setSelectedDate(date);
            setIsModalOpen(true);

            router.replace(
                pathname,
                {
                    scroll: false,
                }
            );
        }
    }, [
        loading,
        notes,
        calendarEvents,
        searchParams,
        router,
        pathname,
    ]);

    const eventsByDay = useMemo(() => {
        const map = new Map<
            string,
            CalendarEvent[]
        >();

        const allDates =
            visibleMonths.flatMap(
                (month) =>
                    month.monthCells.filter(
                        (
                            date
                        ): date is Date =>
                            Boolean(date)
                    )
            );

        calendarEvents.forEach(
            (event) => {
                if (!event.start)
                    return;

                allDates.forEach(
                    (date) => {
                        const dateISO =
                            toISODate(
                                date
                            );

                        if (
                            !isEventOnDate(
                                event,
                                dateISO
                            )
                        ) {
                            return;
                        }

                        if (
                            !map.has(
                                dateISO
                            )
                        ) {
                            map.set(
                                dateISO,
                                []
                            );
                        }

                        map.get(
                            dateISO
                        )!.push(event);
                    }
                );
            }
        );

        return map;
    }, [
        calendarEvents,
        visibleMonths,
    ]);

    const noteCountByDay =
        useMemo(() => {
            const map = new Map<
                string,
                number
            >();

            notes.forEach((note) => {
                const targetDate =
                    getNoteDate(note);

                if (!targetDate)
                    return;

                map.set(
                    targetDate,
                    (map.get(
                        targetDate
                    ) || 0) + 1
                );
            });

            return map;
        }, [notes]);

    const changeDate = (
        delta: 1 | -1
    ) => {
        if (view === "month") {
            let nextMonth =
                currentJm + delta;

            let nextYear =
                currentJy;

            if (
                nextMonth > 12
            ) {
                nextMonth = 1;
                nextYear++;
            }

            if (
                nextMonth < 1
            ) {
                nextMonth = 12;
                nextYear--;
            }

            setCurrentMonthDate(
                jalaliToDate(
                    nextYear,
                    nextMonth,
                    1
                )
            );

            return;
        }

        let nextSeasonMonth =
            getSeasonStartMonth(
                currentJm
            ) +
            delta * 3;

        let nextYear =
            currentJy;

        if (
            nextSeasonMonth > 12
        ) {
            nextSeasonMonth = 1;
            nextYear++;
        }

        if (
            nextSeasonMonth < 1
        ) {
            nextSeasonMonth = 10;
            nextYear--;
        }

        setCurrentMonthDate(
            jalaliToDate(
                nextYear,
                nextSeasonMonth,
                1
            )
        );
    };

    const goToMonth = (
        jy: number,
        jm: number
    ) => {
        setView("month");

        setCurrentMonthDate(
            jalaliToDate(
                jy,
                jm,
                1
            )
        );
    };

    const openPicker = () => {
        setPickerYear(currentJy);
        setPickerOpen(true);
    };

    const handleSelectDate = (
        date: Date
    ) => {
        setSelectedDate(date);
        setIsModalOpen(true);
    };

    const gotoToday = () => {
        const now = new Date();

        const [
            nowYear,
            nowMonth,
        ] = toJalaliParts(now);

        setCurrentMonthDate(
            jalaliToDate(
                nowYear,
                nowMonth,
                1
            )
        );

        setSelectedDate(now);
        setIsModalOpen(true);
    };

    const todayISO =
        toISODate(new Date());

    const [
        todayJy,
        todayJm,
        todayJd,
    ] = toJalaliParts(new Date());

    const todayPersian = `${toPersianDigits(
        todayJd
    )} ${JALALI_MONTHS[
        todayJm - 1
        ]
        }`;

    const headerTitle =
        view === "month"
            ? `${JALALI_MONTHS[
            currentJm - 1
            ]
            } ${toPersianDigits(
                currentJy
            )}`
            : `${getSeasonName(
                currentJm
            )
            } ${toPersianDigits(
                currentJy
            )}`;

    const taskCount =
        calendarEvents.filter(
            (event) =>
                getEventType(
                    event.type
                ) === "task"
        ).length;

    const internalTaskCount =
        calendarEvents.filter(
            (event) =>
                getEventType(
                    event.type
                ) ===
                "internal_task"
        ).length;

    return (
        <>
            <div
                dir="rtl"
                className="mx-auto w-full max-w-6xl overflow-hidden rounded-[2rem] border border-slate-200/80 bg-white shadow-[0_12px_40px_-24px_rgba(15,23,42,0.25)] dark:border-white/[0.07] dark:bg-[#0f172a] dark:shadow-none"
            >
                <div className="relative flex items-center justify-between border-b border-slate-100 px-5 py-4 sm:px-6 dark:border-white/[0.06]">
                    <button
                        type="button"
                        onClick={() =>
                            changeDate(1)
                        }
                        className="flex h-9 w-9 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-400 shadow-sm transition-all hover:border-indigo-200 hover:bg-indigo-50 hover:text-indigo-600 dark:border-white/[0.07] dark:bg-white/[0.04] dark:hover:border-indigo-500/20 dark:hover:bg-indigo-500/10 dark:hover:text-indigo-300"
                    >
                        <ChevronRight
                            size={14}
                        />
                    </button>

                    <div className="flex items-center gap-2.5 sm:gap-3">
                        <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600 dark:bg-indigo-500/10 dark:text-indigo-300">
                            <CalendarDays
                                size={15}
                            />
                        </div>

                        <button
                            type="button"
                            onClick={
                                openPicker
                            }
                            className="flex flex-col items-center rounded-xl px-2 py-1 transition-colors hover:bg-slate-50 dark:hover:bg-white/[0.035]"
                        >
                            <span className="flex items-center gap-1">
                                <h2 className="text-[14px] font-extrabold tracking-tight text-slate-900 dark:text-white">
                                    {
                                        headerTitle
                                    }
                                </h2>

                                <ChevronDown
                                    size={
                                        13
                                    }
                                    className="text-slate-400"
                                />
                            </span>

                            <span className="mt-0.5 text-[10px] font-semibold text-indigo-500 dark:text-indigo-400">
                                امروز:{" "}
                                {
                                    todayPersian
                                }
                            </span>
                        </button>
                    </div>

                    <button
                        type="button"
                        onClick={() =>
                            changeDate(
                                -1
                            )
                        }
                        className="flex h-9 w-9 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-400 shadow-sm transition-all hover:border-indigo-200 hover:bg-indigo-50 hover:text-indigo-600 dark:border-white/[0.07] dark:bg-white/[0.04] dark:hover:border-indigo-500/20 dark:hover:bg-indigo-500/10 dark:hover:text-indigo-300"
                    >
                        <ChevronLeft
                            size={14}
                        />
                    </button>

                    {pickerOpen &&
                        pickerYear !==
                        null && (
                            <>
                                <div
                                    className="fixed inset-0 z-20"
                                    onClick={() =>
                                        setPickerOpen(
                                            false
                                        )
                                    }
                                />

                                <motion.div
                                    initial={{
                                        opacity: 0,
                                        y: -8,
                                        scale: 0.97,
                                    }}
                                    animate={{
                                        opacity: 1,
                                        y: 0,
                                        scale: 1,
                                    }}
                                    transition={{
                                        duration: 0.15,
                                    }}
                                    className="absolute right-1/2 top-[calc(100%+8px)] z-30 w-[min(18rem,calc(100vw-2rem))] translate-x-1/2 overflow-hidden rounded-[1.5rem] border border-slate-200 bg-white p-4 shadow-[0_20px_50px_-20px_rgba(0,0,0,0.25)] dark:border-white/[0.08] dark:bg-[#111827]"
                                >
                                    <div className="mb-3 flex items-center justify-between">
                                        <button
                                            type="button"
                                            onClick={() =>
                                                setPickerYear(
                                                    (
                                                        y
                                                    ) =>
                                                        (y ??
                                                            currentJy) +
                                                        1
                                                )
                                            }
                                            className="flex h-8 w-8 items-center justify-center rounded-xl bg-slate-100 text-slate-400 transition-colors hover:bg-indigo-50 hover:text-indigo-600 dark:bg-white/[0.05] dark:hover:bg-indigo-500/10 dark:hover:text-indigo-300"
                                        >
                                            <ChevronRight
                                                size={
                                                    13
                                                }
                                            />
                                        </button>

                                        <span className="rounded-lg bg-indigo-50 px-3 py-1 text-[12.5px] font-extrabold text-indigo-600 dark:bg-indigo-500/10 dark:text-indigo-300">
                                            {toPersianDigits(
                                                pickerYear
                                            )}
                                        </span>

                                        <button
                                            type="button"
                                            onClick={() =>
                                                setPickerYear(
                                                    (
                                                        y
                                                    ) =>
                                                        (y ??
                                                            currentJy) -
                                                        1
                                                )
                                            }
                                            className="flex h-8 w-8 items-center justify-center rounded-xl bg-slate-100 text-slate-400 transition-colors hover:bg-indigo-50 hover:text-indigo-600 dark:bg-white/[0.05] dark:hover:bg-indigo-500/10 dark:hover:text-indigo-300"
                                        >
                                            <ChevronLeft
                                                size={
                                                    13
                                                }
                                            />
                                        </button>
                                    </div>

                                    <div className="grid grid-cols-3 gap-1.5">
                                        {JALALI_MONTHS.map(
                                            (
                                                label,
                                                index
                                            ) => {
                                                const monthNumber =
                                                    index +
                                                    1;

                                                const isActive =
                                                    pickerYear ===
                                                    currentJy &&
                                                    monthNumber ===
                                                    currentJm;

                                                return (
                                                    <button
                                                        key={
                                                            label
                                                        }
                                                        type="button"
                                                        onClick={() => {
                                                            goToMonth(
                                                                pickerYear,
                                                                monthNumber
                                                            );

                                                            setPickerOpen(
                                                                false
                                                            );
                                                        }}
                                                        className={`rounded-xl px-2 py-2.5 text-[11px] font-bold transition-all ${isActive
                                                                ? "bg-indigo-600 text-white shadow-sm shadow-indigo-500/20 dark:bg-indigo-500"
                                                                : "bg-slate-50 text-slate-500 hover:bg-indigo-50 hover:text-indigo-600 dark:bg-white/[0.035] dark:text-slate-400 dark:hover:bg-indigo-500/10 dark:hover:text-indigo-300"
                                                            }`}
                                                    >
                                                        {
                                                            label
                                                        }
                                                    </button>
                                                );
                                            }
                                        )}
                                    </div>
                                </motion.div>
                            </>
                        )}
                </div>

                <div className="flex flex-wrap items-center gap-2 border-b border-slate-100 px-5 py-3 sm:px-6 dark:border-white/[0.06]">
                    <div className="flex rounded-xl border border-slate-200 bg-slate-50 p-1 dark:border-white/[0.06] dark:bg-white/[0.035]">
                        <button
                            type="button"
                            onClick={() =>
                                setView(
                                    "month"
                                )
                            }
                            className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-[10.5px] font-bold transition-all ${view ===
                                    "month"
                                    ? "bg-white text-indigo-600 shadow-sm dark:bg-[#1e293b] dark:text-indigo-300"
                                    : "text-slate-400 hover:text-slate-600 dark:hover:text-slate-300"
                                }`}
                        >
                            <CalendarDays
                                size={12}
                            />
                            ماهانه
                        </button>

                        <button
                            type="button"
                            onClick={() =>
                                setView(
                                    "season"
                                )
                            }
                            className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-[10.5px] font-bold transition-all ${view ===
                                    "season"
                                    ? "bg-white text-indigo-600 shadow-sm dark:bg-[#1e293b] dark:text-indigo-300"
                                    : "text-slate-400 hover:text-slate-600 dark:hover:text-slate-300"
                                }`}
                        >
                            <CalendarRange
                                size={12}
                            />
                            فصل
                        </button>
                    </div>

                    <button
                        type="button"
                        onClick={
                            gotoToday
                        }
                        className="flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3 py-1.5 text-[11px] font-bold text-slate-500 shadow-sm transition-all hover:border-indigo-200 hover:bg-indigo-50 hover:text-indigo-600 dark:border-white/[0.06] dark:bg-white/[0.035] dark:text-slate-400 dark:hover:bg-indigo-500/10 dark:hover:text-indigo-300"
                    >
                        <CalendarClock
                            size={12}
                        />
                        امروز
                    </button>

                    {!loading && (
                        <div className="mr-auto flex flex-wrap items-center gap-2">
                            <span className="flex items-center gap-1.5 rounded-lg bg-indigo-50 px-2 py-1 text-[10px] font-bold text-indigo-600 dark:bg-indigo-500/10 dark:text-indigo-300">
                                <ClipboardCheck
                                    size={11}
                                />
                                {
                                    toPersianDigits(
                                        taskCount
                                    )
                                }{" "}
                                تسک
                            </span>

                            <span className="flex items-center gap-1.5 rounded-lg bg-amber-50 px-2 py-1 text-[10px] font-bold text-amber-600 dark:bg-amber-500/10 dark:text-amber-300">
                                <Layers3
                                    size={11}
                                />
                                {
                                    toPersianDigits(
                                        internalTaskCount
                                    )}{" "}
                                داخلی
                            </span>

                            <span className="flex items-center gap-1.5 rounded-lg bg-emerald-50 px-2 py-1 text-[10px] font-bold text-emerald-600 dark:bg-emerald-500/10 dark:text-emerald-300">
                                <FileText
                                    size={11}
                                />
                                {
                                    toPersianDigits(
                                        notes.length
                                    )}{" "}
                                یادداشت
                            </span>
                        </div>
                    )}
                </div>

                <div className="flex items-center gap-2 overflow-x-auto border-b border-slate-100 px-5 py-3 sm:px-6 dark:border-white/[0.06]">
                    {quickMonths.map(
                        ({
                            jy,
                            jm,
                        }) => {
                            const isSelected =
                                jy ===
                                currentJy &&
                                jm ===
                                currentJm;

                            const isRealToday =
                                jy ===
                                realTodayJy &&
                                jm ===
                                realTodayJm;

                            return (
                                <button
                                    key={`${jy}-${jm}`}
                                    type="button"
                                    onClick={() =>
                                        goToMonth(
                                            jy,
                                            jm
                                        )
                                    }
                                    className={`flex shrink-0 items-center gap-1.5 whitespace-nowrap rounded-full border px-3.5 py-1.5 text-[11px] font-bold transition-all ${isSelected
                                            ? "border-indigo-600 bg-indigo-600 text-white shadow-sm shadow-indigo-500/20 dark:border-indigo-500 dark:bg-indigo-500"
                                            : "border-slate-200 bg-white text-slate-500 hover:border-indigo-200 hover:bg-indigo-50 hover:text-indigo-600 dark:border-white/[0.06] dark:bg-white/[0.025] dark:text-slate-400 dark:hover:border-indigo-500/20 dark:hover:bg-indigo-500/10 dark:hover:text-indigo-300"
                                        }`}
                                >
                                    {isRealToday && (
                                        <span
                                            className={`h-1.5 w-1.5 rounded-full ${isSelected
                                                    ? "bg-white"
                                                    : "bg-indigo-500"
                                                }`}
                                        />
                                    )}

                                    {jy ===
                                        realTodayJy
                                        ? JALALI_MONTHS[
                                        jm -
                                        1
                                        ]
                                        : `${JALALI_MONTHS[
                                        jm -
                                        1
                                        ]
                                        } ${toPersianDigits(
                                            jy
                                        )}`}
                                </button>
                            );
                        }
                    )}
                </div>

                {!loading && (
                    <div className="flex flex-wrap items-center gap-x-5 gap-y-2 border-b border-slate-100 px-5 py-3 sm:px-6 dark:border-white/[0.06]">
                        {[
                            "task",
                            "internal_task",
                            "note",
                        ].map(
                            (type) => {
                                const style =
                                    EVENT_TYPE_COLOR[
                                    type
                                    ];

                                return (
                                    <span
                                        key={
                                            type
                                        }
                                        className={`flex items-center gap-1.5 text-[9.5px] font-bold ${style.text}`}
                                    >
                                        <span
                                            className={`h-1.5 w-1.5 rounded-full ${style.dot}`}
                                        />

                                        {
                                            EVENT_TYPE_LABEL[
                                            type
                                            ]
                                        }
                                    </span>
                                );
                            }
                        )}
                    </div>
                )}

                {loading ? (
                    <div className="flex flex-col items-center justify-center gap-3 py-24">
                        <motion.div
                            animate={{
                                rotate: 360,
                            }}
                            transition={{
                                duration: 1,
                                repeat: Infinity,
                                ease: "linear",
                            }}
                            className="h-5 w-5 rounded-full border-2 border-indigo-500/15 border-t-indigo-500"
                        />

                        <p className="text-[11px] font-semibold text-slate-400">
                            در حال دریافت
                            تقویم...
                        </p>
                    </div>
                ) : (
                    <div
                        className={`p-4 sm:p-6 ${view ===
                                "season"
                                ? "grid grid-cols-1 gap-5 xl:grid-cols-3"
                                : "mx-auto max-w-5xl"
                            }`}
                    >
                        {visibleMonths.map(
                            (month) => (
                                <CalendarMonthGrid
                                    key={`${month.jy}-${month.jm}`}
                                    month={
                                        month
                                    }
                                    eventsByDay={
                                        eventsByDay
                                    }
                                    noteCountByDay={
                                        noteCountByDay
                                    }
                                    todayISO={
                                        todayISO
                                    }
                                    onSelectDate={
                                        handleSelectDate
                                    }
                                />
                            )
                        )}
                    </div>
                )}
            </div>

            <CalendarNoteModal
                isOpen={
                    isModalOpen
                }
                onClose={() =>
                    setIsModalOpen(
                        false
                    )
                }
                selectedDate={
                    selectedDate
                }
                notes={notes}
                events={
                    calendarEvents
                }
                onCreated={(
                    note
                ) =>
                    setNotes(
                        (prev) => [
                            note,
                            ...prev,
                        ]
                    )
                }
                onDeleted={(id) =>
                    setNotes(
                        (prev) =>
                            prev.filter(
                                (
                                    note
                                ) =>
                                    note.id !==
                                    id
                            )
                    )
                }
            />
        </>
    );
}