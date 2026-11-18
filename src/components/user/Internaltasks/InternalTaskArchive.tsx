"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Pagination from "@/components/ui/Pagination";
import { usePaginatedList } from "@/hooks/usePaginatedList";
import { internalTasksApi } from "@/lib/api";
import { Archive, Loader, RotateCcw, Search, XCircle } from "lucide-react";
import { fetchInternalTaskRoutines } from "./Api";
import type {
    InternalTaskArchive as InternalTaskArchiveType,
    InternalTaskRoutine,
} from "./types";
import InternalTaskArchiveCard from "./InternalTaskArchiveCard";

const PAGE_SIZE = 12;

function toPersianDigits(value: string | number) {
    return String(value).replace(/\d/g, (digit) => "۰۱۲۳۴۵۶۷۸۹"[Number(digit)]);
}

export default function InternalTaskArchive() {
    const [routines, setRoutines] = useState<InternalTaskRoutine[]>([]);

    /* صفحه‌بندی و جستجو هر دو سمت سرور انجام می‌شوند */
    const list = usePaginatedList<InternalTaskArchiveType>(
        (params, signal) => internalTasksApi.archive(params, signal),
        { pageSize: PAGE_SIZE, scrollTop: true },
    );
    const tasks = list.data;
    const search = list.search;
    const setSearch = list.setSearch;
    const loading = list.loading && list.data.length === 0;
    const error = list.error ? "دریافت آرشیو تیکت‌ها با خطا مواجه شد." : null;

    const loadRoutines = useCallback(async () => {
        try {
            const response = await fetchInternalTaskRoutines();
            setRoutines(Array.isArray(response.data) ? response.data : []);
        } catch {
            setRoutines([]);
        }
    }, []);

    useEffect(() => {
        void loadRoutines();
    }, [loadRoutines]);

    const routineTaskIds = useMemo(
        () => new Set(routines.map((routine) => routine.task)),
        [routines],
    );

    const hasSearch = search.trim().length > 0;

    if (loading) {
        return (
            <div className="flex h-64 items-center justify-center">
                <Loader size={22} className="animate-spin text-indigo-500" />
            </div>
        );
    }

    return (
        <div dir="rtl" className="flex flex-col gap-5">
            <div className="flex items-center gap-2.5">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-indigo-500/10">
                    <Archive size={18} className="text-indigo-500" />
                </div>

                <div>
                    <h3 className="text-[15px] font-extrabold text-gray-900 dark:text-white">
                        بایگانی تیکت‌ها
                    </h3>

                    <p className="text-[11.5px] text-gray-500 dark:text-gray-400">
                        تیکت‌ها و روتین‌هایی که انجام یا لغو شده‌اند. مجموع: {toPersianDigits(list.count)} مورد
                    </p>
                </div>
            </div>

            {error && (
                <div className="flex items-center justify-between gap-3 rounded-2xl border border-red-500/20 bg-red-500/5 px-4 py-3">
                    <p className="text-[12px] font-semibold text-red-500">{error}</p>

                    <button
                        type="button"
                        onClick={() => void list.refetch()}
                        className="flex items-center gap-1.5 rounded-xl bg-red-500/10 px-3 py-2 text-[11px] font-bold text-red-600 hover:bg-red-500/15 dark:text-red-300"
                    >
                        <RotateCcw size={13} />
                        تلاش مجدد
                    </button>
                </div>
            )}

            {/* جستجو (سمت سرور) */}
            <div className="rounded-3xl border border-gray-200 bg-white p-3.5 shadow-sm dark:border-white/[0.06] dark:bg-white/[0.025]">
                <div className="relative">
                    <Search
                        size={16}
                        className="pointer-events-none absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400"
                    />

                    <input
                        type="text"
                        value={search}
                        onChange={(event) => setSearch(event.target.value)}
                        placeholder="جستجو بر اساس عنوان، شماره یا نام فرد"
                        className="h-12 w-full rounded-2xl border border-gray-200 bg-gray-50 pr-10 pl-4 text-[12.5px] font-medium text-gray-900 outline-none transition-all placeholder:text-gray-400 focus:border-indigo-500/40 focus:bg-white dark:border-white/[0.06] dark:bg-white/[0.03] dark:text-white dark:placeholder:text-gray-600 dark:focus:bg-white/[0.04]"
                    />

                    {hasSearch && (
                        <button
                            type="button"
                            onClick={() => setSearch("")}
                            className="absolute left-3 top-1/2 flex -translate-y-1/2 items-center justify-center rounded-lg p-1 text-gray-400 transition-colors hover:bg-gray-200 hover:text-gray-700 dark:hover:bg-white/[0.08] dark:hover:text-white"
                        >
                            <XCircle size={15} />
                        </button>
                    )}
                </div>
            </div>

            {/* خلاصه نتیجه */}
            <div className="flex flex-wrap items-center justify-between gap-2 px-1">
                <span className="text-[12px] font-bold text-gray-700 dark:text-gray-200">
                    {hasSearch
                        ? `نتیجه جستجو: ${toPersianDigits(list.count)} مورد`
                        : `نمایش صفحه ${toPersianDigits(list.page)} از ${toPersianDigits(list.totalPages)}`}
                </span>

                {hasSearch && (
                    <button
                        type="button"
                        onClick={() => setSearch("")}
                        className="flex items-center justify-center gap-1.5 rounded-xl bg-indigo-500/10 px-3 py-2 text-[11px] font-bold text-indigo-600 transition-colors hover:bg-indigo-500/15 dark:text-indigo-300"
                    >
                        <RotateCcw size={13} />
                        پاک کردن جستجو
                    </button>
                )}
            </div>

            {tasks.length === 0 ? (
                <div className="flex h-64 flex-col items-center justify-center gap-3 rounded-3xl border border-dashed border-gray-200 dark:border-white/[0.07]">
                    <Archive size={28} className="text-gray-300 dark:text-gray-700" />

                    <p className="text-[12.5px] font-bold text-gray-500 dark:text-gray-400">
                        {hasSearch
                            ? "موردی با این جستجو پیدا نشد."
                            : "هنوز موردی در بایگانی ثبت نشده است."}
                    </p>
                </div>
            ) : (
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-3">
                    {tasks.map((task, index) => (
                        <InternalTaskArchiveCard
                            key={task.id}
                            task={task}
                            index={index}
                            isRoutine={routineTaskIds.has(task.task_id)}
                        />
                    ))}
                </div>
            )}

            {list.totalPages > 1 && (
                <Pagination page={list.page} totalPages={list.totalPages} onChange={list.setPage} />
            )}
        </div>
    );
}
