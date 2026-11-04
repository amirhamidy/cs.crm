"use client";

import { useCallback } from "react";
import { m } from "framer-motion";
import { Star, Trophy, MessageCircle } from "lucide-react";
import { usePaginatedList } from "@/hooks/usePaginatedList";
import { rankingApi } from "@/lib/api/ranking";
import type { SearchParams } from "@/types/pagination";
import type { RankedCustomer, RankingOrdering, RankingParams } from "@/types/ranking";
import { formatJalaliDate, formatNumber } from "@/lib/format";
import { toPersianDigits } from "@/lib/jalali";
import Pagination from "@/components/ui/Pagination";
import { EmptyState, ErrorState, PageHeader, SearchInput } from "@/components/ui/Feedback";
import { TableSkeleton } from "@/components/ui/skeletons";

type Filters = {
    ordering: RankingOrdering;
    status: string;
    rated: string;
    min_score: string;
    max_score: string;
};

const DEFAULT_ORDERING: RankingOrdering = "-avg_score";
const INITIAL: Filters = { ordering: DEFAULT_ORDERING, status: "", rated: "", min_score: "", max_score: "" };

const ORDERING_OPTIONS: { value: RankingOrdering; label: string }[] = [
    { value: "-avg_score", label: "بیشترین امتیاز" },
    { value: "avg_score", label: "کمترین امتیاز" },
    { value: "-scores_count", label: "بیشترین تعداد امتیاز" },
    { value: "-comments_count", label: "بیشترین نظر" },
    { value: "-total_sales", label: "بیشترین خرید" },
    { value: "total_sales", label: "کمترین خرید" },
    { value: "-last_sale_date", label: "جدیدترین خرید" },
    { value: "last_sale_date", label: "قدیمی‌ترین خرید" },
    { value: "full_name", label: "نام (الف تا ی)" },
    { value: "-full_name", label: "نام (ی تا الف)" },
    { value: "-created_at", label: "جدیدترین مشتری" },
    { value: "created_at", label: "قدیمی‌ترین مشتری" },
];

const fieldCls =
    "h-10 rounded-xl border border-gray-200 bg-white px-3 text-[13px] text-gray-800 outline-none focus:border-brand dark:border-white/10 dark:bg-white/5 dark:text-gray-100";

const scoreOrUndef = (v: string) => {
    if (v === "") return undefined;
    const n = Number(v);
    return Number.isFinite(n) ? Math.min(5, Math.max(0, n)) : undefined;
};

const rankColor = (rank: number) =>
    rank === 1 ? "bg-amber-100 text-amber-600 dark:bg-amber-500/15 dark:text-amber-300"
    : rank === 2 ? "bg-slate-200 text-slate-600 dark:bg-slate-500/20 dark:text-slate-300"
    : rank === 3 ? "bg-orange-100 text-orange-600 dark:bg-orange-500/15 dark:text-orange-300"
    : "bg-gray-100 text-gray-600 dark:bg-white/5 dark:text-gray-300";

export default function CustomerRankingPage() {

    const fetcher = useCallback(
        (params: SearchParams & Filters, signal: AbortSignal) => {
            const q: RankingParams = {
                page: params.page,
                page_size: params.page_size,
                search: params.search || undefined,
                ordering: params.ordering || undefined,
                status: params.status ? (Number(params.status) as 1 | 2) : undefined,
                rated: params.rated === "true" ? true : undefined,
                min_score: scoreOrUndef(params.min_score),
                max_score: scoreOrUndef(params.max_score),
            };
            return rankingApi.list(q, signal);
        },
        [],
    );

    const list = usePaginatedList<RankedCustomer, Filters>(fetcher, { filters: INITIAL, pageSize: 20 });

    const filters = list.filters;
    const setFilter = (patch: Partial<Filters>) => list.setFilters(patch);

    const rankMeaningful = filters.ordering === DEFAULT_ORDERING;

    return (
        <div className="space-y-4">
            <PageHeader title="رتبه‌بندی مشتریان" subtitle="بر اساس امتیاز، نظرات و خرید" icon={<Trophy size={20} />} />

            <div className="flex flex-wrap items-center gap-2">
                <SearchInput
                    value={list.search}
                    onChange={list.setSearch}
                    placeholder="جستجو نام، موبایل یا شرکت"
                    className="min-w-56 flex-1"
                />
                <select
                    aria-label="مرتب‌سازی"
                    className={fieldCls}
                    value={filters.ordering}
                    onChange={(e) => setFilter({ ordering: e.target.value as RankingOrdering })}
                >
                    {ORDERING_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
                </select>
                <select aria-label="وضعیت" className={fieldCls} value={filters.status}
                    onChange={(e) => setFilter({ status: e.target.value })}>
                    <option value="">همه وضعیت‌ها</option>
                    <option value="1">بالقوه</option>
                    <option value="2">فعال</option>
                </select>
                <label className="flex h-10 items-center gap-2 rounded-xl border border-gray-200 px-3 text-[13px] text-gray-700 dark:border-white/10 dark:text-gray-200">
                    <input type="checkbox" checked={filters.rated === "true"}
                        onChange={(e) => setFilter({ rated: e.target.checked ? "true" : "" })} />
                    فقط دارای امتیاز
                </label>
                <input type="number" min={0} max={5} step="0.1" inputMode="decimal" aria-label="حداقل امتیاز"
                    placeholder="حداقل امتیاز" className={`${fieldCls} w-28`} value={filters.min_score}
                    onChange={(e) => setFilter({ min_score: e.target.value })} />
                <input type="number" min={0} max={5} step="0.1" inputMode="decimal" aria-label="حداکثر امتیاز"
                    placeholder="حداکثر امتیاز" className={`${fieldCls} w-28`} value={filters.max_score}
                    onChange={(e) => setFilter({ max_score: e.target.value })} />
            </div>

            {list.loading && !list.data.length ? (
                <TableSkeleton />
            ) : list.error ? (
                <ErrorState message={typeof list.error === "string" ? list.error : "دریافت رتبه‌بندی با خطا مواجه شد"} onRetry={list.refetch} />
            ) : !list.data.length ? (
                <EmptyState title="مشتری‌ای یافت نشد" description="فیلترها را تغییر دهید." icon={<Trophy size={28} />} />
            ) : (
                <div className={`overflow-x-auto rounded-2xl border border-gray-200 dark:border-white/10 ${list.loading ? "opacity-60" : ""}`}>
                    <table className="w-full min-w-[760px] text-right text-[13px]">
                        <thead className="bg-gray-50 text-gray-500 dark:bg-white/5 dark:text-gray-400">
                            <tr>
                                {["رتبه", "مشتری", "وضعیت", "امتیاز", "نظرات", "مجموع خرید", "آخرین خرید"].map((h) => (
                                    <th key={h} className="px-3 py-3 font-bold">{h}</th>
                                ))}
                            </tr>
                        </thead>
                        <tbody>
                            {list.data.map((r) => (
                                <m.tr key={r.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                                    className="border-t border-gray-100 dark:border-white/5">
                                    <td className="px-3 py-3">
                                        {rankMeaningful ? (
                                            <span className={`inline-flex h-8 min-w-8 items-center justify-center rounded-lg px-2 font-black ${rankColor(r.rank)}`}>
                                                {toPersianDigits(r.rank)}
                                            </span>
                                        ) : "—"}
                                    </td>
                                    <td className="px-3 py-3">
                                        <p className="font-black text-gray-900 dark:text-white">{r.full_name}</p>
                                        <p className="text-[11px] text-gray-500 dark:text-gray-400">
                                            {r.company_name || "—"} · <span dir="ltr">{r.phone_number}</span>
                                        </p>
                                    </td>
                                    <td className="px-3 py-3 text-gray-700 dark:text-gray-200">{r.status_display}</td>
                                    <td className="px-3 py-3">
                                        {r.avg_score === null || r.avg_score === undefined ? (
                                            <span className="text-gray-400">بدون امتیاز</span>
                                        ) : (
                                            <span className="inline-flex items-center gap-1 font-bold text-amber-600 dark:text-amber-300">
                                                <Star size={14} className="fill-current" />
                                                {formatNumber(r.avg_score)}
                                                <span className="text-[11px] font-normal text-gray-500">({toPersianDigits(r.scores_count)})</span>
                                            </span>
                                        )}
                                    </td>
                                    <td className="px-3 py-3">
                                        <span className="inline-flex items-center gap-1 text-gray-700 dark:text-gray-200">
                                            <MessageCircle size={14} />{toPersianDigits(r.comments_count)}
                                        </span>
                                    </td>
                                    <td className="px-3 py-3 text-gray-800 dark:text-gray-100">{formatNumber(r.total_sales)}</td>
                                    <td className="px-3 py-3 text-gray-700 dark:text-gray-200">{formatJalaliDate(r.last_sale_date)}</td>
                                </m.tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}

            {list.totalPages > 1 && (
                <Pagination page={list.page} totalPages={list.totalPages} onChange={list.setPage}
                    summary={`${toPersianDigits(list.count)} مشتری`} />
            )}
        </div>
    );
}
