"use client";
import { ListSkeleton } from "@/components/ui/skeletons";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import PageHeader from "@/components/ui/PageHeader";
import { Archive, CheckCircle2, XCircle } from "lucide-react";
import { purchasingApi, type PurchasingArchiveStatus } from "@/lib/api";
import { usePaginatedList } from "@/hooks/usePaginatedList";
import Pagination from "@/components/ui/Pagination";
import { toPersianDigits } from "@/lib/jalali";
import type { ApiPurchasingStep, ApiPurchasingTask, ApiTaskAttachment } from "@/types/purchasing";
import PurchasingTaskCard from "./PurchasingTaskCard";

interface Props {
    steps: ApiPurchasingStep[];
    attachments: ApiTaskAttachment[];
    
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
        
        ({ tab: _tab, ...params }: { tab?: string; page?: number; page_size?: number; search?: string }, signal: AbortSignal) =>
            purchasingApi.archivePage(tab, params, signal),
        [tab],
    );

    const list = usePaginatedList<ApiPurchasingTask>(fetcher, {
        pageSize: PAGE_SIZE,
        filters: { tab },
    });

    
    useEffect(() => {
        list.setFilters({ tab });
        
    }, [tab]);

    
    const lastRefresh = useRef(refreshKey);
    useEffect(() => {
        if (lastRefresh.current === refreshKey) return; 
        lastRefresh.current = refreshKey;
        list.refetch();
        
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
            <PageHeader
                icon={Archive}
                title="بایگانی تسک‌ها"
                subtitle={`تسک‌های تکمیل یا لغو شده · ${toPersianDigits(list.count)} مورد`}
                search={{ value: list.search, onChange: list.setSearch, placeholder: "جستجو در بایگانی..." }}
                leading={
                    <div className="flex h-10 shrink-0 rounded-2xl bg-gray-100 p-0.5 dark:bg-white/[0.05]">
                        {TABS.map(({ key, label, icon: Icon, tone }) => (
                            <button
                                key={key}
                                type="button"
                                onClick={() => setTab(key)}
                                className={`flex items-center gap-1.5 rounded-[14px] px-3 text-[11px] font-extrabold transition ${tab === key ? `bg-white shadow-sm dark:bg-white/10 ${tone}` : "text-gray-400"}`}
                            >
                                <Icon size={12} />
                                {label}
                            </button>
                        ))}
                    </div>
                }
            />

            {list.loading && list.data.length === 0 ? (
                <ListSkeleton rows={3} />
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
