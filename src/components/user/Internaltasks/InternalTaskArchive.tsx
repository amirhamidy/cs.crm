"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import {
    Archive,
    CalendarDays,
    CheckCircle2,
    Layers,
    LayoutGrid,
    Loader,
    RotateCcw,
    Search,
    Ticket,
    XCircle,
} from "lucide-react";
import { fetchInternalTaskArchive, fetchInternalTaskRoutines } from "./Api";
import type {
    InternalTaskArchive as InternalTaskArchiveType,
    InternalTaskRoutine,
} from "./types";
import InternalTaskArchiveCard from "./InternalTaskArchiveCard";

type ArchiveTypeFilter = "all" | "routine" | "ticket";
type DateFilter = "all" | "today" | "week" | "month" | "three_months";
type StatusFilter = "all" | "completed" | "cancelled";

const TYPE_LABELS: Record<ArchiveTypeFilter, string> = {
    all: "همه انواع",
    routine: "روتین",
    ticket: "تیکت",
};

const DATE_LABELS: Record<DateFilter, string> = {
    all: "همه زمان‌ها",
    today: "امروز",
    week: "۷ روز اخیر",
    month: "۳۰ روز اخیر",
    three_months: "۳ ماه اخیر",
};

const STATUS_LABELS: Record<StatusFilter, string> = {
    all: "همه وضعیت‌ها",
    completed: "انجام شده",
    cancelled: "لغو شده",
};

function toPersianDigits(value: string | number) {
    return String(value).replace(/\d/g, (digit) => "۰۱۲۳۴۵۶۷۸۹"[Number(digit)]);
}

/* ───────── کاشی وضعیت: عدد واقعی + فیلتر ───────── */
const TILE_TONES = {
    all: {
        idle: "border-gray-200 bg-white text-gray-800 hover:border-gray-300 dark:border-white/[0.06] dark:bg-white/[0.03] dark:text-gray-100 dark:hover:border-white/[0.12]",
        active: "border-gray-900 bg-gray-900 text-white dark:border-white dark:bg-white dark:text-gray-900",
        iconIdle: "bg-gray-100 text-gray-500 dark:bg-white/[0.06] dark:text-gray-400",
        iconActive: "bg-white/15 text-white dark:bg-gray-900/10 dark:text-gray-900",
    },
    completed: {
        idle: "border-emerald-500/25 bg-emerald-500/[0.06] text-emerald-700 hover:border-emerald-500/45 dark:text-emerald-300",
        active: "border-emerald-600 bg-emerald-600 text-white",
        iconIdle: "bg-emerald-500/15 text-emerald-600 dark:text-emerald-300",
        iconActive: "bg-white/20 text-white",
    },
    cancelled: {
        idle: "border-red-500/25 bg-red-500/[0.06] text-red-700 hover:border-red-500/45 dark:text-red-300",
        active: "border-red-600 bg-red-600 text-white",
        iconIdle: "bg-red-500/15 text-red-600 dark:text-red-300",
        iconActive: "bg-white/20 text-white",
    },
} as const;

function StatusTile({
    tone,
    active,
    icon,
    label,
    count,
    onClick,
}: {
    tone: keyof typeof TILE_TONES;
    active: boolean;
    icon: React.ReactNode;
    label: string;
    count: number;
    onClick: () => void;
}) {
    const t = TILE_TONES[tone];
    return (
        <button
            type="button"
            onClick={onClick}
            aria-pressed={active}
            className={`flex items-center gap-3 rounded-2xl border p-3.5 text-right transition-colors duration-150 ${active ? t.active : t.idle}`}
        >
            <span className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${active ? t.iconActive : t.iconIdle}`}>
                {icon}
            </span>
            <span className="min-w-0 flex-1 text-[13px] font-bold">{label}</span>
            <span className="text-[22px] font-black leading-none">{toPersianDigits(count)}</span>
        </button>
    );
}

/* ───────── کنترل انتخاب گروهی ───────── */
function Segmented<T extends string>({
    icon,
    label,
    value,
    options,
    onChange,
    activeClass,
}: {
    icon: React.ReactNode;
    label: string;
    value: T;
    options: { value: T; label: string; count?: number }[];
    onChange: (value: T) => void;
    activeClass: string;
}) {
    return (
        <div className="flex flex-col gap-1.5">
            <div className="flex items-center gap-1.5 px-1 text-[11.5px] font-bold text-gray-600 dark:text-gray-300">
                {icon}
                {label}
            </div>
            <div className="flex flex-wrap gap-1 rounded-2xl bg-gray-100 p-1 dark:bg-white/[0.04]">
                {options.map((option) => {
                    const active = value === option.value;
                    return (
                        <button
                            key={option.value}
                            type="button"
                            onClick={() => onChange(option.value)}
                            aria-pressed={active}
                            className={`flex items-center gap-1.5 rounded-xl px-3.5 py-2 text-[11.5px] font-bold transition-colors ${active
                                ? activeClass
                                : "text-gray-500 hover:bg-white/70 dark:text-gray-400 dark:hover:bg-white/[0.06]"
                                }`}
                        >
                            {option.label}
                            {typeof option.count === "number" && (
                                <span className={`text-[10px] ${active ? "opacity-80" : "opacity-50"}`}>
                                    {toPersianDigits(option.count)}
                                </span>
                            )}
                        </button>
                    );
                })}
            </div>
        </div>
    );
}

export default function InternalTaskArchive() {
    const [tasks, setTasks] = useState<InternalTaskArchiveType[]>([]);
    const [routines, setRoutines] = useState<InternalTaskRoutine[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const [search, setSearch] = useState("");
    const [typeFilter, setTypeFilter] =
        useState<ArchiveTypeFilter>("all");
    const [dateFilter, setDateFilter] =
        useState<DateFilter>("all");
    const [statusFilter, setStatusFilter] =
        useState<StatusFilter>("all");

    const loadArchive = useCallback(async () => {
        try {
            setLoading(true);
            setError(null);

            const [archiveResponse, routineResponse] =
                await Promise.all([
                    fetchInternalTaskArchive(),
                    fetchInternalTaskRoutines(),
                ]);

            setTasks(
                Array.isArray(archiveResponse.data)
                    ? archiveResponse.data
                    : [],
            );

            setRoutines(
                Array.isArray(routineResponse.data)
                    ? routineResponse.data
                    : [],
            );
        } catch {
            setTasks([]);
            setRoutines([]);
            setError("دریافت آرشیو تیکت‌ها با خطا مواجه شد.");
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        void loadArchive();
    }, [loadArchive]);

    const routineTaskIds = useMemo(() => {
        return new Set(routines.map((routine) => routine.task));
    }, [routines]);

    const filteredTasks = useMemo(() => {
        const normalizedSearch = search.trim().toLowerCase();

        const now = new Date();
        const todayStart = new Date(now);
        todayStart.setHours(0, 0, 0, 0);

        const weekStart = new Date(now);
        weekStart.setDate(weekStart.getDate() - 7);

        const monthStart = new Date(now);
        monthStart.setDate(monthStart.getDate() - 30);

        const threeMonthsStart = new Date(now);
        threeMonthsStart.setMonth(threeMonthsStart.getMonth() - 3);

        return [...tasks]
            .sort(
                (a, b) =>
                    new Date(b.archived_at).getTime() -
                    new Date(a.archived_at).getTime(),
            )
            .filter((task) => {
                const isRoutine = routineTaskIds.has(task.task_id);

                if (
                    typeFilter === "routine" &&
                    !isRoutine
                ) {
                    return false;
                }

                if (
                    typeFilter === "ticket" &&
                    isRoutine
                ) {
                    return false;
                }

                if (
                    statusFilter !== "all" &&
                    task.status !== statusFilter
                ) {
                    return false;
                }

                const archivedAt = new Date(task.archived_at);

                if (dateFilter === "today") {
                    if (archivedAt < todayStart) {
                        return false;
                    }
                }

                if (dateFilter === "week") {
                    if (archivedAt < weekStart) {
                        return false;
                    }
                }

                if (dateFilter === "month") {
                    if (archivedAt < monthStart) {
                        return false;
                    }
                }

                if (dateFilter === "three_months") {
                    if (archivedAt < threeMonthsStart) {
                        return false;
                    }
                }

                if (!normalizedSearch) {
                    return true;
                }

                const searchableText = [
                    task.title,
                    task.id,
                    task.task_id,
                    task.created_by_username,
                    task.created_by_full_name,
                    task.final_action_by_username,
                    task.final_action_by_full_name,
                ]
                    .join(" ")
                    .toLowerCase();

                return searchableText.includes(normalizedSearch);
            });
    }, [
        tasks,
        routines,
        routineTaskIds,
        search,
        typeFilter,
        dateFilter,
        statusFilter,
    ]);

    const routineCount = useMemo(
        () =>
            tasks.filter((task) =>
                routineTaskIds.has(task.task_id),
            ).length,
        [tasks, routineTaskIds],
    );

    const ticketCount = tasks.length - routineCount;

    const completedCount = useMemo(
        () => tasks.filter((task) => task.status === "completed").length,
        [tasks],
    );

    const cancelledCount = useMemo(
        () => tasks.filter((task) => task.status === "cancelled").length,
        [tasks],
    );

    const clearFilters = () => {
        setSearch("");
        setTypeFilter("all");
        setDateFilter("all");
        setStatusFilter("all");
    };

    const hasFilters =
        search.trim() ||
        typeFilter !== "all" ||
        dateFilter !== "all" ||
        statusFilter !== "all";

    /* توضیح دقیق فیلترهای فعال، به صورت متن ساده */
    const activeFilterLabels = [
        search.trim() ? `جستجو: «${search.trim()}»` : null,
        statusFilter !== "all" ? `وضعیت: ${STATUS_LABELS[statusFilter]}` : null,
        typeFilter !== "all" ? `نوع: ${TYPE_LABELS[typeFilter]}` : null,
        dateFilter !== "all" ? `زمان: ${DATE_LABELS[dateFilter]}` : null,
    ].filter(Boolean) as string[];

    if (loading) {
        return (
            <div className="flex h-64 items-center justify-center">
                <Loader
                    size={22}
                    className="animate-spin text-indigo-500"
                />
            </div>
        );
    }

    return (
        <div dir="rtl" className="flex flex-col gap-5">
            <div className="flex items-center gap-2.5">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-indigo-500/10">
                    <Archive
                        size={18}
                        className="text-indigo-500"
                    />
                </div>

                <div>
                    <h3 className="text-[15px] font-extrabold text-gray-900 dark:text-white">
                        بایگانی تیکت‌ها
                    </h3>

                    <p className="text-[11.5px] text-gray-500 dark:text-gray-400">
                        تیکت‌ها و روتین‌هایی که انجام یا لغو شده‌اند. مجموع: {toPersianDigits(tasks.length)} مورد
                    </p>
                </div>
            </div>

            {error && (
                <div className="flex items-center justify-between gap-3 rounded-2xl border border-red-500/20 bg-red-500/5 px-4 py-3">
                    <p className="text-[12px] font-semibold text-red-500">
                        {error}
                    </p>

                    <button
                        type="button"
                        onClick={() => void loadArchive()}
                        className="rounded-xl bg-red-500/10 px-3 py-1.5 text-[11px] font-bold text-red-500 transition-colors hover:bg-red-500/20"
                    >
                        تلاش مجدد
                    </button>
                </div>
            )}

            {/* تعداد به تفکیک وضعیت (قابل کلیک برای فیلتر) */}
            <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-3">
                <StatusTile
                    tone="all"
                    active={statusFilter === "all"}
                    icon={<Layers size={19} />}
                    label="همه"
                    count={tasks.length}
                    onClick={() => setStatusFilter("all")}
                />
                <StatusTile
                    tone="completed"
                    active={statusFilter === "completed"}
                    icon={<CheckCircle2 size={19} />}
                    label="انجام شده"
                    count={completedCount}
                    onClick={() => setStatusFilter(statusFilter === "completed" ? "all" : "completed")}
                />
                <StatusTile
                    tone="cancelled"
                    active={statusFilter === "cancelled"}
                    icon={<XCircle size={19} />}
                    label="لغو شده"
                    count={cancelledCount}
                    onClick={() => setStatusFilter(statusFilter === "cancelled" ? "all" : "cancelled")}
                />
            </div>

            {/* جستجو و فیلترها */}
            <div className="rounded-3xl border border-gray-200 bg-white p-3.5 shadow-sm dark:border-white/[0.06] dark:bg-white/[0.025]">
                <div className="flex flex-col gap-4">
                    <div className="relative">
                        <Search
                            size={16}
                            className="pointer-events-none absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400"
                        />

                        <input
                            type="text"
                            value={search}
                            onChange={(event) =>
                                setSearch(event.target.value)
                            }
                            placeholder="جستجو بر اساس عنوان، شماره یا نام فرد"
                            className="h-12 w-full rounded-2xl border border-gray-200 bg-gray-50 pr-10 pl-4 text-[12.5px] font-medium text-gray-900 outline-none transition-all placeholder:text-gray-400 focus:border-indigo-500/40 focus:bg-white dark:border-white/[0.06] dark:bg-white/[0.03] dark:text-white dark:placeholder:text-gray-600 dark:focus:bg-white/[0.04]"
                        />

                        {search && (
                            <button
                                type="button"
                                onClick={() => setSearch("")}
                                className="absolute left-3 top-1/2 flex -translate-y-1/2 items-center justify-center rounded-lg p-1 text-gray-400 transition-colors hover:bg-gray-200 hover:text-gray-700 dark:hover:bg-white/[0.08] dark:hover:text-white"
                            >
                                <XCircle size={15} />
                            </button>
                        )}
                    </div>

                    <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
                        <Segmented<ArchiveTypeFilter>
                            icon={<Ticket size={13} className="text-indigo-500" />}
                            label="نوع"
                            value={typeFilter}
                            onChange={setTypeFilter}
                            activeClass="bg-indigo-600 text-white"
                            options={[
                                { value: "all", label: "همه", count: tasks.length },
                                { value: "routine", label: "روتین", count: routineCount },
                                { value: "ticket", label: "تیکت", count: ticketCount },
                            ]}
                        />

                        <Segmented<DateFilter>
                            icon={<CalendarDays size={13} className="text-violet-500" />}
                            label="زمان بایگانی"
                            value={dateFilter}
                            onChange={setDateFilter}
                            activeClass="bg-violet-600 text-white"
                            options={[
                                { value: "all", label: "همه" },
                                { value: "today", label: "امروز" },
                                { value: "week", label: "۷ روز اخیر" },
                                { value: "month", label: "۳۰ روز اخیر" },
                                { value: "three_months", label: "۳ ماه اخیر" },
                            ]}
                        />
                    </div>
                </div>
            </div>

            {/* خلاصه نتیجه: دقیقا چه چیزی نمایش داده می‌شود */}
            <div className="flex flex-wrap items-center justify-between gap-2 px-1">
                <div className="flex flex-wrap items-center gap-2">
                    <LayoutGrid
                        size={15}
                        className="text-gray-400"
                    />

                    <span className="text-[12px] font-bold text-gray-700 dark:text-gray-200">
                        نمایش {toPersianDigits(filteredTasks.length)} مورد از {toPersianDigits(tasks.length)} مورد
                    </span>

                    {activeFilterLabels.map((text) => (
                        <span
                            key={text}
                            className="rounded-lg bg-gray-100 px-2.5 py-1 text-[10.5px] font-semibold text-gray-600 dark:bg-white/[0.06] dark:text-gray-300"
                        >
                            {text}
                        </span>
                    ))}
                </div>

                {hasFilters && (
                    <button
                        type="button"
                        onClick={clearFilters}
                        className="flex items-center justify-center gap-1.5 rounded-xl bg-indigo-500/10 px-3 py-2 text-[11px] font-bold text-indigo-600 transition-colors hover:bg-indigo-500/15 dark:text-indigo-300"
                    >
                        <RotateCcw size={13} />
                        پاک کردن فیلترها
                    </button>
                )}
            </div>

            {filteredTasks.length === 0 ? (
                <div className="flex h-64 flex-col items-center justify-center gap-3 rounded-3xl border border-dashed border-gray-200 dark:border-white/[0.07]">
                    <Archive
                        size={28}
                        className="text-gray-300 dark:text-gray-700"
                    />

                    <div className="text-center">
                        <p className="text-[12.5px] font-bold text-gray-500 dark:text-gray-400">
                            {tasks.length === 0
                                ? "هنوز موردی در بایگانی ثبت نشده است."
                                : "موردی با این فیلترها پیدا نشد."}
                        </p>

                        {tasks.length > 0 && (
                            <button
                                type="button"
                                onClick={clearFilters}
                                className="mt-2 text-[11px] font-bold text-indigo-500 hover:text-indigo-600"
                            >
                                حذف فیلترها
                            </button>
                        )}
                    </div>
                </div>
            ) : (
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-3">
                    {filteredTasks.map((task, index) => (
                        <InternalTaskArchiveCard
                            key={task.id}
                            task={task}
                            index={index}
                            isRoutine={routineTaskIds.has(
                                task.task_id,
                            )}
                        />
                    ))}
                </div>
            )}
        </div>
    );
}