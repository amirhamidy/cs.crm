"use client";

import { useState } from "react";
import dynamic from "next/dynamic";
import { Trophy } from "lucide-react";
import { EmptyState, ErrorState, PageHeader } from "@/components/ui/Feedback";
import Pagination from "@/components/ui/Pagination";
import { ListSkeleton } from "@/components/ui/skeletons";
import { usePaginatedList } from "@/hooks/usePaginatedList";
import { rankingApi } from "@/lib/api";
import type { RankedCustomer } from "@/types/crm";
import { RankingCard } from "./RankingCard";
import { RankingFilterBar } from "./RankingFilterBar";
import { RANKING_DEFAULT_FILTERS, RANKING_PAGE_SIZE, type RankingFilters } from "./rankingOptions";

// فقط وقتی کاربر روی یک مشتری کلیک کند دانلود می‌شود
const CustomerProfileModal = dynamic(() => import("../profile/CustomerProfileModal"), {
    ssr: false,
});

export default function CustomerRankingPage() {
    const [customerId, setCustomerId] = useState<number | null>(null);

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

    // مدال طلا/نقره/برنز فقط وقتی معنی دارد که بر اساس بیشترین امتیاز و در صفحه‌ی اول باشیم
    const showMedals = list.filters.ordering === "-avg_score" && list.page === 1;

    return (
        <div
            className="flex min-w-0 flex-col gap-4 sm:gap-5 [&_h1]:text-[13px] [&_h1]:font-bold [&_h1+p]:text-[13px]"
            dir="rtl"
        >
            <PageHeader
                icon={<Trophy size={20} />}
                title="رتبه‌بندی مشتریان"
                subtitle="بر اساس میانگین امتیازی که کارکنان به مشتریان داده‌اند"
            />

            <RankingFilterBar
                search={list.search}
                filters={list.filters}
                onSearch={list.setSearch}
                onFilters={list.setFilters}
            />

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
                    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                        {list.data.map((customer, index) => (
                            <RankingCard
                                key={customer.id}
                                customer={customer}
                                index={index}
                                medal={showMedals}
                                onOpen={setCustomerId}
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

            {customerId !== null && (
                <CustomerProfileModal
                    key={customerId}
                    customerId={customerId}
                    onClose={() => setCustomerId(null)}
                />
            )}
        </div>
    );
}
