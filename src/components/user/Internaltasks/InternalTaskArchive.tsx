"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import {
    Archive,
    CalendarDays,
    CheckCircle2,
    Filter,
    LayoutGrid,
    Loader,
    RotateCcw,
    Search,
    Ticket,
    TimerReset,
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

function toPersianDigits(value: string | number) {
    return String(value).replace(/\d/g, (digit) => "۰۱۲۳۴۵۶۷۸۹"[Number(digit)]);
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
            <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                <div className="flex items-center gap-2.5">
                    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-2xl bg-indigo-500/10">
                        <Archive
                            size={17}
                            className="text-indigo-500"
                        />
                    </div>

                    <div>
                        <h3 className="text-[14px] font-extrabold text-gray-900 dark:text-white">
                            بایگانی تیکت‌ها
                        </h3>

                        <p className="text-[11px] text-gray-400 dark:text-gray-600">
                            {toPersianDigits(tasks.length)} مورد
                            بایگانی شده
                        </p>
                    </div>
                </div>

                <div className="flex flex-wrap items-center gap-2">
                    <div className="flex items-center gap-1.5 rounded-2xl border border-gray-200 bg-gray-50 px-3 py-2 dark:border-white/[0.06] dark:bg-white/[0.03]">
                        <TimerReset
                            size={14}
                            className="text-indigo-500"
                        />

                        <span className="text-[10px] font-bold text-gray-500 dark:text-gray-400">
                            روتین
                        </span>

                        <span className="text-[11px] font-extrabold text-gray-900 dark:text-white">
                            {toPersianDigits(routineCount)}
                        </span>
                    </div>

                    <div className="flex items-center gap-1.5 rounded-2xl border border-gray-200 bg-gray-50 px-3 py-2 dark:border-white/[0.06] dark:bg-white/[0.03]">
                        <Ticket
                            size={14}
                            className="text-violet-500"
                        />

                        <span className="text-[10px] font-bold text-gray-500 dark:text-gray-400">
                            تیکت
                        </span>

                        <span className="text-[11px] font-extrabold text-gray-900 dark:text-white">
                            {toPersianDigits(ticketCount)}
                        </span>
                    </div>
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

            <div className="rounded-3xl border border-gray-200 bg-white p-3 shadow-sm dark:border-white/[0.06] dark:bg-white/[0.025]">
                <div className="flex flex-col gap-3">
                    <div className="relative">
                        <Search
                            size={16}
                            className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-gray-400"
                        />

                        <input
                            type="text"
                            value={search}
                            onChange={(event) =>
                                setSearch(event.target.value)
                            }
                            placeholder="جستجو در عنوان، شناسه یا کاربر..."
                            className="h-11 w-full rounded-2xl border border-gray-200 bg-gray-50 pr-10 pl-4 text-[12px] font-medium text-gray-900 outline-none transition-all placeholder:text-gray-400 focus:border-indigo-500/40 focus:bg-white dark:border-white/[0.06] dark:bg-white/[0.03] dark:text-white dark:placeholder:text-gray-600 dark:focus:bg-white/[0.04]"
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

                    <div className="flex flex-col gap-2.5 xl:flex-row xl:items-center xl:justify-between">
                        <div className="flex flex-wrap items-center gap-2">
                            <div className="flex items-center gap-1.5 text-gray-400">
                                <Filter size={14} />
                                <span className="text-[10px] font-bold">
                                    نوع
                                </span>
                            </div>

                            {[
                                {
                                    value: "all" as const,
                                    label: "همه",
                                },
                                {
                                    value: "routine" as const,
                                    label: "روتین",
                                },
                                {
                                    value: "ticket" as const,
                                    label: "تیکت",
                                },
                            ].map((item) => (
                                <button
                                    key={item.value}
                                    type="button"
                                    onClick={() =>
                                        setTypeFilter(item.value)
                                    }
                                    className={`rounded-xl px-3 py-2 text-[10px] font-bold transition-all ${typeFilter === item.value
                                            ? "bg-indigo-500 text-white shadow-sm shadow-indigo-500/20"
                                            : "bg-gray-100 text-gray-500 hover:bg-gray-200 dark:bg-white/[0.04] dark:text-gray-400 dark:hover:bg-white/[0.07]"
                                        }`}
                                >
                                    {item.label}
                                </button>
                            ))}
                        </div>

                        <div className="flex flex-wrap items-center gap-2">
                            <div className="flex items-center gap-1.5 text-gray-400">
                                <CalendarDays size={14} />
                                <span className="text-[10px] font-bold">
                                    بازه
                                </span>
                            </div>

                            {[
                                {
                                    value: "all" as const,
                                    label: "همه",
                                },
                                {
                                    value: "today" as const,
                                    label: "امروز",
                                },
                                {
                                    value: "week" as const,
                                    label: "۷ روز",
                                },
                                {
                                    value: "month" as const,
                                    label: "۳۰ روز",
                                },
                                {
                                    value: "three_months" as const,
                                    label: "۳ ماه",
                                },
                            ].map((item) => (
                                <button
                                    key={item.value}
                                    type="button"
                                    onClick={() =>
                                        setDateFilter(item.value)
                                    }
                                    className={`rounded-xl px-3 py-2 text-[10px] font-bold transition-all ${dateFilter === item.value
                                            ? "bg-violet-500 text-white shadow-sm shadow-violet-500/20"
                                            : "bg-gray-100 text-gray-500 hover:bg-gray-200 dark:bg-white/[0.04] dark:text-gray-400 dark:hover:bg-white/[0.07]"
                                        }`}
                                >
                                    {item.label}
                                </button>
                            ))}
                        </div>

                        <div className="flex flex-wrap items-center gap-2">
                            <div className="flex items-center gap-1.5 text-gray-400">
                                <CheckCircle2 size={14} />
                                <span className="text-[10px] font-bold">
                                    وضعیت
                                </span>
                            </div>

                            <button
                                type="button"
                                onClick={() =>
                                    setStatusFilter("all")
                                }
                                className={`rounded-xl px-3 py-2 text-[10px] font-bold transition-all ${statusFilter === "all"
                                        ? "bg-gray-900 text-white dark:bg-white dark:text-gray-900"
                                        : "bg-gray-100 text-gray-500 hover:bg-gray-200 dark:bg-white/[0.04] dark:text-gray-400 dark:hover:bg-white/[0.07]"
                                    }`}
                            >
                                همه
                            </button>

                            <button
                                type="button"
                                onClick={() =>
                                    setStatusFilter("completed")
                                }
                                className={`flex items-center gap-1.5 rounded-xl px-3 py-2 text-[10px] font-bold transition-all ${statusFilter === "completed"
                                        ? "bg-emerald-500 text-white"
                                        : "bg-gray-100 text-gray-500 hover:bg-gray-200 dark:bg-white/[0.04] dark:text-gray-400 dark:hover:bg-white/[0.07]"
                                    }`}
                            >
                                <CheckCircle2 size={12} />
                                انجام شده
                            </button>

                            <button
                                type="button"
                                onClick={() =>
                                    setStatusFilter("cancelled")
                                }
                                className={`flex items-center gap-1.5 rounded-xl px-3 py-2 text-[10px] font-bold transition-all ${statusFilter === "cancelled"
                                        ? "bg-red-500 text-white"
                                        : "bg-gray-100 text-gray-500 hover:bg-gray-200 dark:bg-white/[0.04] dark:text-gray-400 dark:hover:bg-white/[0.07]"
                                    }`}
                            >
                                <XCircle size={12} />
                                لغو شده
                            </button>
                        </div>

                        {hasFilters && (
                            <button
                                type="button"
                                onClick={clearFilters}
                                className="flex items-center justify-center gap-1.5 rounded-xl bg-indigo-500/10 px-3 py-2 text-[10px] font-bold text-indigo-500 transition-colors hover:bg-indigo-500/15"
                            >
                                <RotateCcw size={13} />
                                پاک کردن فیلترها
                            </button>
                        )}
                    </div>
                </div>
            </div>

            <div className="flex items-center justify-between px-1">
                <div className="flex items-center gap-2">
                    <LayoutGrid
                        size={15}
                        className="text-gray-400"
                    />

                    <span className="text-[11px] font-bold text-gray-500 dark:text-gray-400">
                        {toPersianDigits(filteredTasks.length)} نتیجه
                    </span>
                </div>

                {hasFilters && (
                    <span className="text-[10px] font-medium text-indigo-500">
                        فیلتر فعال است
                    </span>
                )}
            </div>

            {filteredTasks.length === 0 ? (
                <div className="flex h-64 flex-col items-center justify-center gap-3 rounded-3xl border border-dashed border-gray-200 dark:border-white/[0.07]">
                    <Archive
                        size={28}
                        className="text-gray-300 dark:text-gray-700"
                    />

                    <div className="text-center">
                        <p className="text-[12px] font-bold text-gray-500 dark:text-gray-400">
                            {tasks.length === 0
                                ? "تیکتی در بایگانی وجود ندارد."
                                : "موردی با این فیلترها پیدا نشد."}
                        </p>

                        {tasks.length > 0 && (
                            <button
                                type="button"
                                onClick={clearFilters}
                                className="mt-2 text-[10px] font-bold text-indigo-500 hover:text-indigo-600"
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