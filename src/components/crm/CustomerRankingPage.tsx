"use client";

import { useMemo } from "react";
import { useRouter } from "next/navigation";
import { m } from "framer-motion";
import { Building2, MessageCircle, Phone, ShoppingBag, Star, Trophy } from "lucide-react";
import { Select } from "@/components/ui/Select";
import Pagination from "@/components/ui/Pagination";
import { EmptyState, ErrorState, PageHeader, SearchInput } from "@/components/ui/Feedback";
import { ListSkeleton } from "@/components/ui/skeletons";
import { usePaginatedList } from "@/hooks/usePaginatedList";
import { rankingApi } from "@/lib/api";
import { formatJalaliDate, formatMoney, formatNumber, toNumber } from "@/lib/crm/format";
import { cn } from "@/lib/utils";
import type { RankedCustomer, RankingOrdering } from "@/types/crm";
import StarRating from "./StarRating";
import { CARD } from "./ui";

interface Props {
  /** مسیر پایه‌ی نقش کاربر، مثل /admin یا /user */
  basePath: "/admin" | "/user";
}

type Filters = {
  ordering: RankingOrdering;
  status: number | undefined;
  min_score: number | undefined;
  rated: boolean | undefined;
};

const ORDERING_OPTIONS: { value: RankingOrdering; label: string }[] = [
  { value: "-avg_score", label: "بیشترین امتیاز" },
  { value: "avg_score", label: "کمترین امتیاز" },
  { value: "-scores_count", label: "بیشترین تعداد امتیاز" },
  { value: "-total_sales", label: "بیشترین فروش" },
  { value: "-comments_count", label: "بیشترین نظر" },
  { value: "-last_sale_date", label: "آخرین خرید" },
  { value: "full_name", label: "نام (الف تا ی)" },
];

const STATUS_OPTIONS = [
  { value: "", label: "همه مشتریان" },
  { value: "2", label: "مشتری بالفعل" },
  { value: "1", label: "مشتری بالقوه" },
];

const MIN_SCORE_OPTIONS = [
  { value: "", label: "هر امتیازی" },
  { value: "3", label: "۳ به بالا" },
  { value: "4", label: "۴ به بالا" },
  { value: "4.5", label: "۴٫۵ به بالا" },
];

const RATED_OPTIONS = [
  { value: "", label: "همه (حتی بدون امتیاز)" },
  { value: "true", label: "فقط دارای امتیاز" },
];

const MEDAL = [
  "bg-gradient-to-br from-amber-300 to-yellow-500 text-white",
  "bg-gradient-to-br from-slate-300 to-slate-400 text-white",
  "bg-gradient-to-br from-orange-300 to-amber-600 text-white",
];

function RankBadge({ rank, medal }: { rank: number; medal: boolean }) {
  const cls = medal && rank <= 3 ? MEDAL[rank - 1] : "bg-gray-100 text-gray-500 dark:bg-white/10 dark:text-gray-300";
  return (
    <span
      className={cn(
        "flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl text-[14px] font-black",
        cls,
      )}
    >
      {medal && rank === 1 ? <Trophy size={18} /> : rank.toLocaleString("fa-IR")}
    </span>
  );
}

function Metric({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value: React.ReactNode;
}) {
  return (
    <div className="flex min-w-0 items-center gap-2">
      <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-gray-100 text-gray-400 dark:bg-white/[0.06]">
        {icon}
      </span>
      <div className="min-w-0">
        <div className="text-[10px] font-bold text-gray-400">{label}</div>
        <div className="truncate text-[12px] font-extrabold text-gray-800 dark:text-gray-100">{value}</div>
      </div>
    </div>
  );
}

function Row({
  customer,
  index,
  medal,
  onOpen,
}: {
  customer: RankedCustomer;
  index: number;
  medal: boolean;
  onOpen: () => void;
}) {
  const hasSales = toNumber(customer.total_sales) > 0;
  return (
    <m.button
      type="button"
      onClick={onOpen}
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.18, delay: Math.min(index, 10) * 0.025 }}
      className={cn(
        CARD,
        "group flex w-full flex-col gap-3 p-3.5 text-right transition-shadow hover:shadow-md md:flex-row md:items-center md:gap-4",
      )}
    >
      <div className="flex min-w-0 flex-1 items-center gap-3">
        <RankBadge rank={customer.rank} medal={medal && customer.avg_score != null} />
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <span className="truncate text-[14px] font-extrabold text-gray-900 group-hover:text-brand dark:text-white">
              {customer.full_name}
            </span>
            <span
              className={cn(
                "shrink-0 rounded-full px-2 py-0.5 text-[9.5px] font-extrabold",
                customer.status === 2
                  ? "bg-emerald-50 text-emerald-600 dark:bg-emerald-500/15 dark:text-emerald-300"
                  : "bg-amber-50 text-amber-600 dark:bg-amber-500/15 dark:text-amber-300",
              )}
            >
              {customer.status_display}
            </span>
          </div>
          <div className="mt-0.5 flex flex-wrap items-center gap-x-3 gap-y-0.5 text-[11px] text-gray-500 dark:text-gray-400">
            {customer.company_name && (
              <span className="flex items-center gap-1">
                <Building2 size={11} /> {customer.company_name}
              </span>
            )}
            {customer.phone_number && (
              <span className="flex items-center gap-1" dir="ltr">
                <Phone size={11} /> {customer.phone_number}
              </span>
            )}
          </div>
        </div>
      </div>

      <div className="flex items-center justify-between gap-4 md:w-[230px] md:shrink-0 md:flex-col md:items-start md:gap-1">
        <StarRating value={customer.avg_score} count={customer.scores_count || undefined} />
      </div>

      <div className="grid grid-cols-3 gap-3 md:w-[400px] md:shrink-0">
        <Metric
          icon={<ShoppingBag size={13} />}
          label="مجموع فروش"
          value={hasSales ? formatMoney(customer.total_sales) : "—"}
        />
        <Metric
          icon={<Star size={13} />}
          label="آخرین خرید"
          value={formatJalaliDate(customer.last_sale_date)}
        />
        <Metric
          icon={<MessageCircle size={13} />}
          label="نظرات"
          value={formatNumber(customer.comments_count)}
        />
      </div>
    </m.button>
  );
}

export default function CustomerRankingPage({ basePath }: Props) {
  const router = useRouter();

  const list = usePaginatedList<RankedCustomer, Filters>(
    (params, signal) =>
      rankingApi.page(
        {
          page: params.page,
          page_size: params.page_size,
          search: params.search,
          ordering: params.ordering,
          status: params.status as 1 | 2 | undefined,
          min_score: params.min_score,
          rated: params.rated,
        },
        signal,
      ),
    {
      pageSize: 20,
      filters: { ordering: "-avg_score", status: undefined, min_score: undefined, rated: undefined },
      scrollTop: true,
    },
  );

  const { filters } = list;
  const medal = filters.ordering === "-avg_score" && list.page === 1;

  const summary = useMemo(
    () =>
      list.count > 0
        ? `${list.count.toLocaleString("fa-IR")} مشتری`
        : undefined,
    [list.count],
  );

  return (
    <div className="flex flex-col gap-5" dir="rtl">
      <PageHeader
        icon={<Trophy size={20} />}
        title="رتبه‌بندی مشتریان"
        subtitle="بر اساس میانگین امتیازی که کارکنان به مشتریان داده‌اند"
      />

      <div className={cn(CARD, "grid grid-cols-1 gap-3 p-4 md:grid-cols-2 xl:grid-cols-5")}>
        <SearchInput
          value={list.search}
          onChange={list.setSearch}
          placeholder="نام، شرکت یا موبایل..."
          className="xl:col-span-2"
        />
        <Select
          aria-label="مرتب‌سازی"
          options={ORDERING_OPTIONS}
          value={filters.ordering}
          onChange={(v) => list.setFilters({ ordering: v as RankingOrdering })}
        />
        <Select
          aria-label="حداقل امتیاز"
          options={MIN_SCORE_OPTIONS}
          value={filters.min_score != null ? String(filters.min_score) : ""}
          onChange={(v) => list.setFilters({ min_score: v ? Number(v) : undefined })}
        />
        <Select
          aria-label="وضعیت مشتری"
          options={STATUS_OPTIONS}
          value={filters.status != null ? String(filters.status) : ""}
          onChange={(v) => list.setFilters({ status: v ? Number(v) : undefined })}
        />
        <Select
          aria-label="فقط دارای امتیاز"
          options={RATED_OPTIONS}
          value={filters.rated ? "true" : ""}
          onChange={(v) => list.setFilters({ rated: v === "true" ? true : undefined })}
          className="md:col-span-2 xl:col-span-1"
        />
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
          <div className="flex flex-col gap-2.5">
            {list.data.map((customer, i) => (
              <Row
                key={customer.id}
                customer={customer}
                index={i}
                medal={medal}
                onOpen={() => router.push(`${basePath}/customer/${customer.id}/`)}
              />
            ))}
          </div>
          {list.totalPages > 1 && (
            <Pagination
              page={list.page}
              totalPages={list.totalPages}
              onChange={list.setPage}
              summary={summary}
            />
          )}
        </>
      )}
    </div>
  );
}
