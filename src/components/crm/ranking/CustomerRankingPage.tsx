"use client";

import { useState } from "react";
import dynamic from "next/dynamic";
import { LayoutGrid, Star, Trophy, Users } from "lucide-react";
import { EmptyState, ErrorState } from "@/components/ui/Feedback";
import Pagination from "@/components/ui/Pagination";
import { ListSkeleton } from "@/components/ui/skeletons";
import { usePaginatedList } from "@/hooks/usePaginatedList";
import { rankingApi } from "@/lib/api";
import type { RankedCustomer } from "@/types/crm";
import { RankingCard, type RankingView } from "./RankingCard";
import { RankingFilterBar } from "./RankingFilterBar";
import { RANKING_DEFAULT_FILTERS, RANKING_PAGE_SIZE, type RankingFilters } from "./rankingOptions";

const RankingDetailModal = dynamic(() => import("./RankingDetailModal"), { ssr: false });

export default function CustomerRankingPage() {
    const [detail, setDetail] = useState<{ id: number; name: string; view: RankingView } | null>(null);

    const list = usePaginatedList<RankedCustomer, RankingFilters>(
        (params, signal) =>
            rankingApi.page(
                {
                    page: params.page,
                    page_size: params.page_size,
                    search: params.search,
                    ordering: params.ordering,
                    status: params.status,
                    min_score: params.min_score,
                    rated: params.rated,
                },
                signal,
            ),
        { pageSize: RANKING_PAGE_SIZE, filters: RANKING_DEFAULT_FILTERS, scrollTop: true },
    );

    const scores = list.data.map((c) => c.avg_score).filter((v): v is number => v != null);
    const topScore = scores.length ? Math.max(...scores) : null;
    const ratedCount = scores.length;

    const stats = [
        { label: "کل مشتریان", value: list.count.toLocaleString("fa-IR"), icon: Users, tone: "bg-emerald-400 dark:bg-emerald-600" },
        { label: "بالاترین امتیاز", value: topScore != null ? topScore.toLocaleString("fa-IR") : "—", icon: Trophy, tone: "bg-rose-400 dark:bg-rose-600" },
        { label: "دارای امتیاز", value: ratedCount.toLocaleString("fa-IR"), icon: Star, tone: "bg-amber-300 !text-gray-900 dark:bg-amber-500" },
        { label: "نمایش در این صفحه", value: list.data.length.toLocaleString("fa-IR"), icon: LayoutGrid, tone: "bg-indigo-500 dark:bg-indigo-600" },
    ];

    return (
        <div className="flex min-w-0 flex-col gap-4 sm:gap-5" dir="rtl">
            <div className="flex flex-col gap-3 md:flex-row md:items-stretch">
                <div className="grid min-w-0 flex-1 grid-cols-1 gap-2 rounded-3xl bg-gray-50 p-2 sm:grid-cols-2 dark:bg-gray-800/40">
                    {stats.map(({ label, value, icon: Icon, tone }) => (
                        <div
                            key={label}
                            className={`relative flex min-w-0 items-center justify-between gap-2 overflow-hidden rounded-2xl p-4 text-white ${tone}`}
                        >
                            <div className="min-w-0">
                                <div className="truncate text-[12px] opacity-90">{label}</div>
                                <div className="mt-1 text-2xl font-extrabold">{value}</div>
                            </div>
                            <Icon size={40} className="shrink-0 opacity-25" strokeWidth={1.5} />
                        </div>
                    ))}
                </div>
                <div className="min-w-0 flex-1 rounded-3xl bg-gray-50 p-2 dark:bg-gray-800/40">
                    <RankingFilterBar
                        search={list.search}
                        filters={list.filters}
                        onSearch={list.setSearch}
                        onFilters={list.setFilters}
                    />
                </div>
            </div>

                {list.loading ? (
                    <ListSkeleton rows={8} />
                ) : list.error ? (
                    <ErrorState message="دریافت لیست مشتریان ناموفق بود" onRetry={list.refetch} />
                ) : list.data.length === 0 ? (
                    <EmptyState
                        title="مشتری‌ای پیدا نشد"
                        description="فیلترها را تغییر دهید یا عبارت جستجو را عوض کنید."
                        icon={<Trophy size={26} />}
                    />
                ) : (
                    <>
                        <div className="grid md:grid-cols-3 grid-cols-1 gap-3">
                            {list.data.map((customer) => (
                                <RankingCard
                                    key={customer.id}
                                    customer={customer}
                                    highlight={topScore != null && customer.avg_score === topScore}
                                    onOpen={(id, view) =>
                                        setDetail({ id, name: customer.full_name, view })
                                    }
                                />
                            ))}
                        </div>
                        {list.totalPages > 1 && (
                            <Pagination
                                page={list.page}
                                totalPages={list.totalPages}
                                onChange={list.setPage}
                                summary={
                                    list.count > 0
                                        ? `${list.count.toLocaleString("fa-IR")} مشتری`
                                        : undefined
                                }
                            />
                        )}
                    </>
                )}

            {detail && (
                <RankingDetailModal
                    key={`${detail.id}-${detail.view}`}
                    customerId={detail.id}
                    customerName={detail.name}
                    view={detail.view}
                    onClose={() => setDetail(null)}
                />
            )}
        </div>
    );
}
