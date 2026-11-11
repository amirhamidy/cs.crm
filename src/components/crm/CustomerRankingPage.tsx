"use client";

import SearchField from "@/components/ui/SearchField";
import { useMemo, useState } from "react";
import dynamic from "next/dynamic";
import { m } from "framer-motion";
import { Building2, MessageCircle, Phone, ShoppingBag, Star, Trophy } from "lucide-react";
import { NiceSelect } from "@/components/ui/NiceSelect";
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

const CustomerProfileModal = dynamic(() => import("./CustomerProfileModal"), { ssr: false });

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
  "bg-amber-500/15 text-amber-600 dark:text-amber-300",
  "bg-slate-500/15 text-slate-600 dark:text-slate-300",
  "bg-orange-500/15 text-orange-600 dark:text-orange-300",
];

function RankBadge({ rank, medal }: { rank: number; medal: boolean }) {
  const cls = medal && rank <= 3 ? MEDAL[rank - 1] : "border border-gray-200 text-gray-500 dark:border-white/10 dark:text-gray-300";
  return (
    <span
      className={cn(
        "flex h-9 w-9 shrink-0 items-center justify-center rounded-2xl text-[13px] font-bold",
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
    <div className="flex min-w-0 items-center justify-between gap-2">
      <span className="flex shrink-0 items-center gap-1 text-[13px] text-gray-400">
        {icon}
        {label}
      </span>
      <span className="truncate text-[13px] font-normal text-gray-800 dark:text-gray-100">{value}</span>
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
  const important = customer.rank <= 3 && customer.avg_score != null;
  return (
    <m.button
      type="button"
      onClick={onOpen}
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.18, delay: Math.min(index, 10) * 0.025 }}
      className={cn(
        CARD,
        "flex w-full flex-col justify-around overflow-hidden p-3.5 text-right text-[13px] transition-shadow hover:shadow-md",
      )}
    >
      <div className="flex justify-around items-center w-full">
        <div className="flex justify-between items-center w-full">
          <RankBadge rank={customer.rank} medal={medal && customer.avg_score != null} />
          <span
            className={cn(
              "shrink-0 rounded-full p-2 text-[13px]",
              customer.status === 2
                ? "bg-emerald-50 text-emerald-600 dark:bg-emerald-500/15 dark:text-emerald-300"
                : "bg-amber-50 text-amber-600 dark:bg-amber-500/15 dark:text-amber-300",
            )}
          >
            {customer.status_display}
          </span>
        </div>
      </div>
      <div className="min-w-0 w-full flex justify-between items-center my-2">
        <div
          className={cn(
            "truncate text-[13px] text-gray-900 group-hover:text-brand dark:text-white",
            important ? "font-bold" : "font-normal",
          )}
        >
          {customer.full_name}
        </div>
        <div className="mt-0.5 flex flex-col gap-2 text-[13px] text-gray-500 dark:text-gray-400">
          <span className="flex items-center gap-1 truncate">
            <Building2 size={12} className="shrink-0" />
            <span className="truncate">
              {customer.company_name ? customer.company_name : "شرکت ندارد"}
            </span>
          </span>

          {customer.phone_number && (
            <span className="flex items-center gap-1" dir="ltr">
              <Phone size={12} className="shrink-0" /> {customer.phone_number}
            </span>
          )}
        </div>
      </div>
      <div className="[&_*]:text-[13px] min-w-0 w-full flex justify-between my-2">
        <span>
          امتیاز  :
        </span>

        <StarRating value={customer.avg_score} count={customer.scores_count || undefined} />
      </div>
      <div className="flex w-full flex-col gap-3  border-t border-gray-100  dark:border-white/[0.06] my-2">
        <Metric
          icon={<ShoppingBag size={13} />}
          label="مجموع فروش"
          value={customer.total_sales ? formatMoney(customer.total_sales) : "داده‌ای نیست"}
        />
        <Metric
          icon={<Star size={13} />}
          label="آخرین خرید"
          value={customer.last_sale_date ? formatJalaliDate(customer.last_sale_date) : "داده‌ای نیست"}
        />
        <Metric
          icon={<MessageCircle size={13} />}
          label="نظرات"
          value={customer.comments_count ? formatNumber(customer.comments_count) : "داده‌ای نیست"}
        />
      </div>
    </m.button>
  );
}

export default function CustomerRankingPage({ basePath: _basePath }: Props) {
  const [customerId, setCustomerId] = useState<number | null>(null);

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
    <div className="flex flex-col gap-5 [&_h1]:text-[13px] [&_h1]:font-bold [&_h1+p]:text-[13px]" dir="rtl">
      <PageHeader
        icon={<Trophy size={20} />}
        title="رتبه‌بندی مشتریان"
        subtitle="بر اساس میانگین امتیازی که کارکنان به مشتریان داده‌اند"
        actions={<SearchField value={list.search} onChange={list.setSearch} placeholder="نام، شرکت یا موبایل..." />}
      />

      <div
        className={cn(
          CARD,
          "flex flex-wrap items-end justify-center gap-1 p-4 [&>div]:min-w-0 [&>div]:flex-[1_1_200px] [&_label]:text-center [&_label]:text-[13px] [&_label]:font-bold [&_input]:h-12 [&_input]:text-[13px] [&>div>button]:h-12 [&>div>button]:py-0 [&>div>button]:text-center [&>div>button>span:first-child]:text-center [&>div>button>span:first-child]:text-[13px] [&>div>button>span:first-child]:font-bold [&>div>div_button>div>span:first-child]:text-[13px] [&>div>div_button>div>span:first-child]:font-bold [&>div>div_button>span]:text-[13px]",
        )}
      >
        <NiceSelect
          label="مرتب‌سازی"
          options={ORDERING_OPTIONS.map((option, id) => ({ id, label: option.label }))}
          value={ORDERING_OPTIONS.findIndex((option) => option.value === filters.ordering)}
          onChange={(id) => list.setFilters({ ordering: ORDERING_OPTIONS[id].value })}
        />
        <NiceSelect
          label="حداقل امتیاز"
          options={MIN_SCORE_OPTIONS.map((option) => ({ id: Number(option.value), label: option.label }))}
          value={filters.min_score ?? 0}
          onChange={(id) => list.setFilters({ min_score: id || undefined })}
        />
        
        <NiceSelect
          label="وضعیت مشتری"
          options={STATUS_OPTIONS.map((option) => ({ id: Number(option.value), label: option.label }))}
          value={filters.status ?? 0}
          onChange={(id) => list.setFilters({ status: id || undefined })}
        />
        <NiceSelect
          label="فقط دارای امتیاز"
          options={RATED_OPTIONS.map((option, id) => ({ id, label: option.label }))}
          value={filters.rated ? 1 : 0}
          onChange={(id) => list.setFilters({ rated: id === 1 ? true : undefined })}
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
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {list.data.map((customer, i) => (
              <Row
                key={customer.id}
                customer={customer}
                index={i}
                medal={medal}
                onOpen={() => setCustomerId(customer.id)}
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
      {customerId !== null &&
        <CustomerProfileModal
          key={customerId}
          customerId={customerId}
          onClose={() => setCustomerId(null)} />}
    </div>
  );
}
