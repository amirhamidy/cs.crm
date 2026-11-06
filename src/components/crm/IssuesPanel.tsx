"use client";

import { useState } from "react";
import { TriangleAlert } from "lucide-react";
import { EmptyState, ErrorState } from "@/components/ui/Feedback";
import Pagination from "@/components/ui/Pagination";
import { TableSkeleton } from "@/components/ui/skeletons";
import { usePaginatedList } from "@/hooks/usePaginatedList";
import { issuesApi } from "@/lib/api";
import { formatJalaliDate, formatMoney, formatNumber, formatWeight } from "@/lib/crm/format";
import { cn } from "@/lib/utils";
import type { IssueStatus, LoadIssue } from "@/types/crm";
import SaleDetailsModal from "./SaleDetailsModal";
import { Segmented } from "./Segmented";
import { Card, SectionTitle } from "./ui";

type Filter = "active" | IssueStatus | "all";

const FILTERS: { value: Filter; label: string }[] = [
  { value: "active", label: "نیازمند پیگیری" },
  { value: "resolved", label: "حل‌شده" },
  { value: "all", label: "همه" },
];

const STATUS_TONE: Record<IssueStatus, string> = {
  open: "bg-red-50 text-red-600 dark:bg-red-500/10 dark:text-red-400",
  in_progress: "bg-amber-50 text-amber-700 dark:bg-amber-500/10 dark:text-amber-400",
  resolved: "bg-emerald-50 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-400",
};


export default function IssuesPanel() {
  const [filter, setFilter] = useState<Filter>("active");
  const [open, setOpen] = useState<LoadIssue | null>(null);

  const list = usePaginatedList<LoadIssue, { filter: Filter }>(
    async (params, signal) => {
      if (params.filter === "active") {
        const [a, b] = await Promise.all([
          issuesApi.page({ page: params.page, page_size: params.page_size, status: "open" }, signal),
          issuesApi.page({ page: params.page, page_size: params.page_size, status: "in_progress" }, signal),
        ]);
        return {
          count: a.count + b.count,
          next: a.next ?? b.next,
          previous: a.previous ?? b.previous,
          results: [...a.results, ...b.results],
        };
      }
      return issuesApi.page(
        {
          page: params.page,
          page_size: params.page_size,
          status: params.filter === "all" ? undefined : params.filter,
        },
        signal,
      );
    },
    { pageSize: 15, filters: { filter: "active" } },
  );

  return (
    <Card>
      <SectionTitle
        icon={<TriangleAlert size={16} />}
        title={`پیگیری کسری، سرک و بار برگشتی${list.count ? ` (${formatNumber(list.count)})` : ""}`}
      />

      <div className="mb-3 max-w-md">
        <Segmented
          options={FILTERS}
          value={filter}
          onChange={(v) => {
            setFilter(v);
            list.setFilters({ filter: v });
          }}
        />
      </div>

      {list.loading ? (
        <TableSkeleton rows={5} cols={5} />
      ) : list.error ? (
        <ErrorState message="دریافت لیست ناموفق بود" onRetry={list.refetch} />
      ) : list.data.length === 0 ? (
        <EmptyState
          title="موردی برای پیگیری نیست"
          description="کسری، سرک و بار برگشتی را از دکمه‌ی گیره (📎) روی هر معامله ثبت کنید."
          icon={<TriangleAlert size={26} />}
        />
      ) : (
        <ul className="flex flex-col gap-2">
          {list.data.map((i) => (
            <li key={i.id}>
              <button
                type="button"
                onClick={() => setOpen(i)}
                className="flex w-full flex-wrap items-center justify-between gap-2 rounded-2xl border border-gray-100 bg-gray-50/60 p-3 text-right transition-colors hover:bg-gray-100/70 dark:border-white/[0.06] dark:bg-white/[0.03] dark:hover:bg-white/[0.06]"
              >
                <div className="min-w-0">
                  <div className="text-[13px] font-extrabold text-gray-900 dark:text-white">
                    {i.issue_type_display} · {formatWeight(i.quantity_kg)}
                  </div>
                  <div className="text-[11.5px] text-gray-500 dark:text-gray-400">
                    {i.sale_label} · {i.product_name} · {formatJalaliDate(i.issue_date)}
                  </div>
                  {i.description && (
                    <div className="mt-0.5 max-w-[420px] truncate text-[11px] text-gray-400">
                      {i.description}
                    </div>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-[11.5px] font-bold text-gray-600 dark:text-gray-300">
                    {formatMoney(i.loss_amount)}
                  </span>
                  <span
                    className={cn(
                      "rounded-lg px-2 py-0.5 text-[10.5px] font-extrabold",
                      STATUS_TONE[i.status],
                    )}
                  >
                    {i.status_display}
                  </span>
                </div>
              </button>
            </li>
          ))}
        </ul>
      )}

      {list.totalPages > 1 && filter !== "active" && (
        <div className="mt-3">
          <Pagination page={list.page} totalPages={list.totalPages} onChange={list.setPage} />
        </div>
      )}

      <SaleDetailsModal
        open={open != null}
        saleId={open?.sale ?? null}
        title={open ? `${open.sale_label} · ${open.product_name}` : ""}
        onClose={() => setOpen(null)}
        onChanged={list.refetch}
      />
    </Card>
  );
}
