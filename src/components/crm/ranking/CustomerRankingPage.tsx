"use client";

import { useState } from "react";
import dynamic from "next/dynamic";
import { Trophy } from "lucide-react";
import Pagination from "@/components/ui/Pagination";
import { HumanResourceCardSkeleton } from "@/components/ui/skeletons";
import { usePaginatedList } from "@/hooks/usePaginatedList";
import { rankingApi } from "@/lib/api";
import type { RankedCustomer } from "@/types/crm";
import { FilterToggle, GRID, PAGE_WRAP, PageToolbar, SearchPill, StateCard, Stagger } from "../shared/kit";
import { RankingCard, type RankingView } from "./RankingCard";
import { RankingFilterPanel, RankingStatusChips } from "./RankingFilterBar";
import { RANKING_DEFAULT_FILTERS, RANKING_PAGE_SIZE, type RankingFilters } from "./rankingOptions";

const RankingDetailModal = dynamic(() => import("./RankingDetailModal"), { ssr: false });

export default function CustomerRankingPage() {
    const [detail, setDetail] = useState<{ id: number; name: string; view: RankingView } | null>(null);
    const [panelOpen, setPanelOpen] = useState(false);

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

    const activeFilters =
        (list.filters.ordering !== RANKING_DEFAULT_FILTERS.ordering ? 1 : 0) +
        (list.filters.min_score ? 1 : 0) +
        (list.filters.rated ? 1 : 0);

    return (
        <div className={PAGE_WRAP} dir="rtl">
            <PageToolbar
                icon={<Trophy size={18} />}
                title="رتبه‌بندی مشتریان"
                subtitle="مشتریان بر اساس امتیاز، فروش و نظرات"
                count={list.count}
                search={<SearchPill value={list.search} onChange={list.setSearch} placeholder="نام، شرکت یا موبایل..." />}
                actions={<FilterToggle open={panelOpen} onToggle={() => setPanelOpen((v) => !v)} activeCount={activeFilters} />}
                stats={[
                    { label: "کل مشتریان", value: list.count.toLocaleString("fa-IR") },
                    { label: "بالاترین امتیاز", value: topScore != null ? topScore.toLocaleString("fa-IR") : "—", tone: "amber" },
                    { label: "دارای امتیاز", value: scores.length.toLocaleString("fa-IR"), tone: "indigo" },
                    { label: "نمایش در این صفحه", value: list.data.length.toLocaleString("fa-IR"), tone: "emerald" },
                ]}
                footer={
                    <>
                        <RankingStatusChips filters={list.filters} onFilters={list.setFilters} />
                        <RankingFilterPanel open={panelOpen} filters={list.filters} onFilters={list.setFilters} />
                    </>
                }
            />

            {list.loading ? (
                <HumanResourceCardSkeleton count={8} className={GRID} />
            ) : list.error ? (
                <StateCard kind="error" title="دریافت لیست مشتریان ناموفق بود" description="ارتباط با سرور برقرار نشد. لطفاً دوباره تلاش کنید." onRetry={list.refetch} />
            ) : list.data.length === 0 ? (
                <StateCard
                    icon={<Trophy size={19} />}
                    title="مشتری‌ای پیدا نشد"
                    description="فیلترها را تغییر دهید یا عبارت جستجو را عوض کنید."
                />
            ) : (
                <>
                    <div className={GRID}>
                        {list.data.map((customer, i) => (
                            <Stagger key={customer.id} index={i}>
                                <RankingCard
                                    customer={customer}
                                    highlight={topScore != null && customer.avg_score === topScore && customer.rank === 1}
                                    onOpen={(id, view) => setDetail({ id, name: customer.full_name, view })}
                                />
                            </Stagger>
                        ))}
                    </div>
                    {list.totalPages > 1 && (
                        <Pagination
                            page={list.page}
                            totalPages={list.totalPages}
                            onChange={list.setPage}
                            summary={`${list.count.toLocaleString("fa-IR")} مشتری`}
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
