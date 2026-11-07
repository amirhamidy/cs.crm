"use client";

import { memo, useState } from "react";
import { TriangleAlert } from "lucide-react";
import { EmptyState, ErrorState } from "@/components/ui/Feedback";
import Pagination from "@/components/ui/Pagination";
import { TableSkeleton } from "@/components/ui/skeletons";
import { usePaginatedList } from "@/hooks/usePaginatedList";
import { issuesApi } from "@/lib/api";
import { formatJalaliDate, formatMoney, formatNumber, formatWeight } from "@/lib/crm/format";
import { cn } from "@/lib/utils";
import type { IssueStatus, LoadIssue } from "@/types/crm";
import type { SearchParams } from "@/types/pagination";
import { Segmented } from "../shared/Segmented";
import { Card, SectionTitle } from "../shared/ui";
import SaleDetailsModal from "./SaleDetailsModal";

type Filter = "active" | IssueStatus | "all";

const FILTERS: { value: Filter; label: string }[] = [
    { value: "active", label: "نیازمند پیگیری" },
    { value: "resolved", label: "حل‌شده" },
    { value: "all", label: "همه" },
];

const ISSUE_STATUS_TONE: Record<IssueStatus, string> = {
    open: "bg-red-50 text-red-600 dark:bg-red-500/10 dark:text-red-400",
    in_progress: "bg-amber-50 text-amber-700 dark:bg-amber-500/10 dark:text-amber-400",
    resolved: "bg-emerald-50 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-400",
};

/** «نیازمند پیگیری» یعنی باز + در حال پیگیری؛ بک‌اند این دو را با هم نمی‌دهد، پس دو درخواست موازی می‌زنیم. */
async function fetchIssues(params: SearchParams & { filter: Filter }, signal: AbortSignal) {
    const { page, page_size, filter } = params;

    if (filter === "active") {
        const [open, inProgress] = await Promise.all([
            issuesApi.page({ page, page_size, status: "open" }, signal),
            issuesApi.page({ page, page_size, status: "in_progress" }, signal),
        ]);
        return {
            count: open.count + inProgress.count,
            next: open.next ?? inProgress.next,
            previous: open.previous ?? inProgress.previous,
            results: [...open.results, ...inProgress.results],
        };
    }

    return issuesApi.page(
        { page, page_size, status: filter === "all" ? undefined : filter },
        signal,
    );
}

const IssueRow = memo(function IssueRow({
    issue,
    onOpen,
}: {
    issue: LoadIssue;
    onOpen: (issue: LoadIssue) => void;
}) {
    return (
        <li>
            <button
                type="button"
                onClick={() => onOpen(issue)}
                className="flex w-full flex-wrap items-center justify-between gap-2 rounded-2xl border border-gray-100 bg-white p-3.5 text-right shadow-sm transition-colors hover:bg-gray-50 dark:border-white/[0.06] dark:bg-white/[0.03] dark:hover:bg-white/[0.06]"
            >
                <div className="min-w-0 max-w-full">
                    <div className="text-[13px] font-extrabold text-gray-900 dark:text-white">
                        {issue.issue_type_display} · {formatWeight(issue.quantity_kg)}
                    </div>
                    <div className="text-[11.5px] text-gray-500 dark:text-gray-400">
                        {issue.sale_label} · {issue.product_name} ·{" "}
                        {formatJalaliDate(issue.issue_date)}
                    </div>
                    {issue.description && (
                        <div className="mt-0.5 max-w-full truncate sm:max-w-[420px] text-[11px] text-gray-400">
                            {issue.description}
                        </div>
                    )}
                </div>
                <div className="flex items-center gap-2">
                    <span className="text-[11.5px] font-bold text-gray-600 dark:text-gray-300">
                        {formatMoney(issue.loss_amount)}
                    </span>
                    <span
                        className={cn(
                            "rounded-lg px-2 py-0.5 text-[10.5px] font-extrabold",
                            ISSUE_STATUS_TONE[issue.status],
                        )}
                    >
                        {issue.status_display}
                    </span>
                </div>
            </button>
        </li>
    );
});

/** تب «پیگیری بار»: کسری، سرک و بار برگشتی. */
export default function IssuesTab() {
    const [opened, setOpened] = useState<LoadIssue | null>(null);

    const list = usePaginatedList<LoadIssue, { filter: Filter }>(fetchIssues, {
        pageSize: 15,
        filters: { filter: "active" },
    });
    const { filter } = list.filters;

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
                    onChange={(value) => list.setFilters({ filter: value })}
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
                    {list.data.map((issue) => (
                        <IssueRow key={issue.id} issue={issue} onOpen={setOpened} />
                    ))}
                </ul>
            )}

            {list.totalPages > 1 && filter !== "active" && (
                <div className="mt-3">
                    <Pagination
                        page={list.page}
                        totalPages={list.totalPages}
                        onChange={list.setPage}
                    />
                </div>
            )}

            <SaleDetailsModal
                open={opened != null}
                saleId={opened?.sale ?? null}
                title={opened ? `${opened.sale_label} · ${opened.product_name}` : ""}
                onClose={() => setOpened(null)}
                onChanged={list.refetch}
            />
        </Card>
    );
}
