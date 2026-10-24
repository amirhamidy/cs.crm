"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Archive, CheckCircle2, Loader2, Search, X, XCircle } from "lucide-react";
import { purchasingApi, type PurchasingArchiveStatus } from "@/lib/api";
import { usePaginatedList } from "@/hooks/usePaginatedList";
import Pagination from "@/components/ui/Pagination";
import { toPersianDigits } from "@/lib/jalali";
import type { ApiPurchasingStep, ApiPurchasingTask, ApiTaskAttachment } from "@/types/purchasing";
import PurchasingTaskCard from "./PurchasingTaskCard";

interface Props {
    steps: ApiPurchasingStep[];
    attachments: ApiTaskAttachment[];
    /** با هر بار تازه‌سازی صفحهٔ اصلی عوض می‌شود تا بایگانی هم دوباره خوانده شود. */
    refreshKey?: number;
}

const PAGE_SIZE = 8;

const TABS: { key: PurchasingArchiveStatus; label: string; icon: typeof CheckCircle2; tone: string }[] = [
    { key: "completed", label: "تکمیل‌شده", icon: CheckCircle2, tone: "text-emerald-500" },
    { key: "cancelled", label: "لغوشده", icon: XCircle, tone: "text-red-500" },
];

export default function PurchasingArchive({ steps, attachments, refreshKey = 0 }: Props) {
    const [tab, setTab] = useState<PurchasingArchiveStatus>("completed");

    const fetcher = useCallback(
        // «tab» فقط برای ریست صفحه در hook است و به سرور فرستاده نمی‌شود.
        ({ tab: _tab, ...params }: { tab?: string; page?: number; page_size?: number; search?: string }, signal: AbortSignal) =>
            purchasingApi.archivePage(tab, params, signal),
        [tab],
    );

    const list = usePaginatedList<ApiPurchasingTask>(fetcher, {
        pageSize: PAGE_SIZE,
        filters: { tab },
    });

    // با عوض شدن تب، فیلتر عوض می‌شود و صفحه به ۱ برمی‌گردد.
    useEffect(() => {
        list.setFilters({ tab });
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [tab]);

    // تازه‌سازی همراه صفحهٔ اصلی (بعد از تغییر وضعیت تسک‌ها)
    const lastRefresh = useRef(refreshKey);
    useEffect(() => {
        if (lastRefresh.current === refreshKey) return; // اولین رندر: خود hook داده را می‌گیرد
        lastRefresh.current = refreshKey;
        list.refetch();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [refreshKey]);

    const byTask = useMemo(() => {
        const map = new Map<number, ApiTaskAttachment[]>();
        attachments.forEach((a) => {
            const arr = map.get(a.task);
            if (arr) arr.push(a);
            else map.set(a.task, [a]);
        });
        return map;
    }, [attachments]);

    const empty = !list.loading && list.data.length === 0;

    return (
        <section className="flex flex-col gap-3" dir="rtl">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex items-center gap-2.5">
                    <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-gray-100 dark:bg-white/[0.05]">
                        <Archive size={15} className="text-gray-500 dark:text-gray-400" />
                    </span>
                    <div>
                        <div className="flex items-center gap-2">
                            <h2 className="text-[13px] font-extrabold text-gray-900 dark:text-white">بایگانی تسک‌ها</h2>
                            <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-gray-100 px-1.5 text-[9.5px] font-extrabold text-gray-500 dark:bg-white/[0.06] dark:text-gray-400">
                                {toPersianDigits(list.count)}
                            </span>
                        </div>
                        <p className="mt-0.5 text-[10.5px] font-semibold text-gray-400">تسک‌های تکمیل یا لغو شده</p>
                    </div>
                </div>

                <div className="flex items-center gap-2">
                    <div className="flex rounded-full bg-gray-100 p-0.5 dark:bg-white/[0.05]">
                        {TABS.map(({ key, label, icon: Icon, tone }) => (
                            <button
                                key={key}
                                type="button"
                                onClick={() => setTab(key)}
                                className={`flex h-8 items-center gap-1.5 rounded-full px-3 text-[10.5px] font-extrabold transition ${tab === key ? `bg-white shadow-sm dark:bg-white/10 ${tone}` : "text-gray-400"}`}
                            >
                                <Icon size={12} />
                                {label}
                            </button>
                        ))}
                    </div>

                    <div className="relative min-w-0 flex-1 sm:w-56 sm:flex-none">
                        <Search size={13} className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-gray-400" />
                        <input
                            value={list.search}
                            onChange={(e) => list.setSearch(e.target.value)}
                            placeholder="جستجو در بایگانی..."
                            className="h-9 w-full rounded-full border border-gray-100 bg-gray-50 pl-8 pr-8 text-[11px] font-semibold text-gray-800 outline-none transition focus:border-indigo-400 dark:border-white/[0.06] dark:bg-white/[0.03] dark:text-white"
                        />
                        {list.search && (
                            <button type="button" onClick={() => list.setSearch("")} className="absolute left-2.5 top-1/2 flex h-5 w-5 -translate-y-1/2 items-center justify-center rounded-full text-gray-400 hover:text-gray-600">
                                <X size={11} />
                            </button>
                        )}
                    </div>
                </div>
            </div>

            {list.loading && list.data.length === 0 ? (
                <div className="flex min-h-[130px] items-center justify-center">
                    <Loader2 size={18} className="animate-spin text-indigo-500" />
                </div>
            ) : empty ? (
                <div className="flex min-h-[130px] flex-col items-center justify-center gap-2 rounded-[1.45rem] border border-dashed border-gray-200 text-center dark:border-white/[0.07]">
                    <Archive size={22} className="text-gray-300 dark:text-gray-700" />
                    <p className="text-[11px] font-semibold text-gray-400">
                        {list.search ? "نتیجه‌ای برای این جستجو پیدا نشد" : "موردی در این بخش نیست"}
                    </p>
                </div>
            ) : (
                <div className={`grid grid-cols-1 gap-3 transition-opacity xl:grid-cols-2 ${list.loading ? "opacity-60" : ""}`}>
                    {list.data.map((task, index) => (
                        <PurchasingTaskCard
                            key={task.id}
                            task={task}
                            index={index}
                            steps={steps}
                            attachments={byTask.get(task.id) ?? []}
                            onUpdated={() => undefined}
                        />
                    ))}
                </div>
            )}

            {list.totalPages > 1 && (
                <Pagination page={list.page} totalPages={list.totalPages} onChange={list.setPage} />
            )}
        </section>
    );
}
