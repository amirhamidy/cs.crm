"use client";

import { memo, useEffect, useState } from "react";
import AsyncSelect, { type AsyncOption } from "@/components/ui/AsyncSelect";
import { customersApi, issuesApi, salesApi } from "@/lib/api";
import type { Customer } from "@/types/customer";
import { usePermissions } from "@/hooks/usePermissions";
import { CalendarDays, CheckCircle2, Clock, Eye, TriangleAlert } from "lucide-react";
import Pagination from "@/components/ui/Pagination";
import { HumanResourceCardSkeleton } from "@/components/ui/skeletons";
import { usePaginatedList } from "@/hooks/usePaginatedList";
import { formatJalaliDate, formatMoney, formatNumber, formatWeight, toNumber } from "@/lib/crm/format";
import type { IssueStatus, IssueType, LoadIssue, Sale } from "@/types/crm";
import type { SearchParams } from "@/types/pagination";
import {
    CARD_HOVER,
    Chip,
    Divider,
    FilterChips,
    GRID,
    IconTile,
    MiniStat,
    PageToolbar,
    PillButton,
    SURFACE,
    StateCard,
    Stagger,
    type Tone,
} from "../shared/kit";
import { cn } from "@/lib/utils";
import SaleDetailsModal from "./SaleDetailsModal";

type Filter = IssueStatus | "all";
type IssueTypeFilter = IssueType | "all";
type IssueFilters = {
    filter: Filter;
    issueType: IssueTypeFilter;
    customer: number | undefined;
    sale: number | undefined;
};

const FILTERS: { value: Filter; label: string }[] = [
    { value: "open", label: "باز" },
    { value: "in_progress", label: "در حال پیگیری" },
    { value: "resolved", label: "حل‌شده" },
    { value: "all", label: "همه" },
];

const STATUS_TONE: Record<IssueStatus, Tone> = {
    open: "rose",
    in_progress: "amber",
    resolved: "emerald",
};

const STATUS_ICON = {
    open: TriangleAlert,
    in_progress: Clock,
    resolved: CheckCircle2,
};

async function fetchIssues(params: SearchParams & IssueFilters, signal: AbortSignal) {
    const { page, page_size, filter, issueType, customer, sale } = params;
    const common = {
        page,
        page_size,
        type: issueType === "all" ? undefined : issueType,
        customer,
        sale,
    };

    return issuesApi.page(
        { ...common, status: filter === "all" ? undefined : filter },
        signal,
    );
}

const IssueCard = memo(function IssueCard({
    issue,
    onOpen,
}: {
    issue: LoadIssue;
    onOpen: (issue: LoadIssue) => void;
}) {
    const tone = STATUS_TONE[issue.status];
    const Icon = STATUS_ICON[issue.status];

    return (
        <div className={cn(SURFACE, CARD_HOVER, "flex h-full min-w-0 flex-col p-3")}>
            <div className="flex items-start gap-3">
                <IconTile tone={tone}>
                    <Icon size={18} />
                </IconTile>
                <div className="min-w-0 flex-1">
                    <div className="flex items-start justify-between gap-2">
                        <h3 className="truncate text-[13px] font-extrabold text-gray-900 dark:text-white">
                            {issue.issue_type_display}
                        </h3>
                        <Chip tone={tone}>{issue.status_display}</Chip>
                    </div>
                    <div className="mt-1.5 flex items-center gap-1.5">
                        <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-md bg-gray-100 dark:bg-white/[0.06]">
                            <CalendarDays size={10} className="text-gray-400" />
                        </span>
                        <span className="truncate text-[10.5px] font-semibold text-gray-400">
                            {formatJalaliDate(issue.issue_date)}
                        </span>
                    </div>
                </div>
            </div>

            <div className="mt-3"><Divider /></div>

            <div className="mt-3 rounded-xl bg-gray-50 px-2.5 py-2 dark:bg-white/[0.035]">
                <p className="truncate text-[11px] font-extrabold text-gray-700 dark:text-gray-200">{issue.sale_label}</p>
                <p className="mt-0.5 truncate text-[10.5px] font-semibold text-gray-400">{issue.product_name}</p>
                {issue.description && (
                    <p className="mt-1 line-clamp-2 text-[10.5px] font-semibold leading-5 text-gray-400">{issue.description}</p>
                )}
            </div>

            <div className="mt-1.5 grid grid-cols-2 gap-1.5">
                <MiniStat label="مقدار" value={formatWeight(issue.quantity_kg)} />
                <MiniStat
                    label="زیان"
                    value={formatMoney(issue.loss_amount)}
                    tone={toNumber(issue.loss_amount) > 0 ? "rose" : "gray"}
                />
            </div>

            <div className="mt-auto pt-3">
                <PillButton variant="soft" className="w-full" icon={<Eye size={13} />} onClick={() => onOpen(issue)}>
                    مشاهده معامله
                </PillButton>
            </div>
        </div>
    );
});

export default function IssuesTab() {
    const [opened, setOpened] = useState<LoadIssue | null>(null);
    const [selectedCustomer, setSelectedCustomer] = useState<AsyncOption | null>(null);
    const [selectedSale, setSelectedSale] = useState<AsyncOption | null>(null);
    const { can } = usePermissions();
    const canViewCustomers = can("customers", "view");

    const list = usePaginatedList<LoadIssue, IssueFilters>(fetchIssues, {
        pageSize: 15,
        filters: { filter: "open", issueType: "all", customer: undefined, sale: undefined },
    });
    const { filter, issueType, customer, sale } = list.filters;

    useEffect(() => {
        if (!customer) setSelectedCustomer(null);
        if (!sale) setSelectedSale(null);
    }, [customer, sale]);

    const customerFetcher = (params: { page: number; page_size: number; search?: string }, signal: AbortSignal) =>
        customersApi.page(params, signal);
    const saleFetcher = (params: { page: number; page_size: number; search?: string }, signal: AbortSignal) =>
        salesApi.page(params, signal);

    const pageLoss = list.data.reduce((a, x) => a + toNumber(x.loss_amount), 0);
    const pageKg = list.data.reduce((a, x) => a + toNumber(x.quantity_kg), 0);
    const openCount = list.data.filter((x) => x.status !== "resolved").length;

    return (
        <>
            <PageToolbar
                icon={<TriangleAlert size={18} />}
                title="پیگیری بار"
                subtitle="کسری، سرک و بار برگشتی"
                count={list.count}
                stats={[
                    { label: "کل موارد", value: formatNumber(list.count) },
                    { label: "نیازمند پیگیری در صفحه", value: formatNumber(openCount), tone: "amber" },
                    { label: "وزن این صفحه", value: formatWeight(pageKg), tone: "indigo" },
                    { label: "زیان این صفحه", value: formatMoney(pageLoss), tone: "rose" },
                ]}
                footer={
                    <div className="flex flex-col gap-3">
                        <FilterChips
                            label="وضعیت پیگیری"
                            items={FILTERS}
                            value={filter}
                            onChange={(value) => list.setFilters({ filter: value })}
                        />
                        <FilterChips
                            label="نوع مورد"
                            items={[
                                { value: "all", label: "همه انواع" },
                                { value: "shortage", label: "کسری" },
                                { value: "spillage", label: "سرک" },
                                { value: "returned", label: "بار برگشتی" },
                            ]}
                            value={issueType}
                            onChange={(value) => list.setFilters({ issueType: value as IssueTypeFilter })}
                        />
                        <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                            {canViewCustomers && (
                                <div className="flex min-w-0 items-end gap-1.5">
                                    <div className="min-w-0 flex-1">
                                        <AsyncSelect<Customer>
                                            label="مشتری"
                                            placeholder="همه مشتری‌ها"
                                            emptyText="مشتری‌ای یافت نشد"
                                            value={customer ?? null}
                                            selected={selectedCustomer}
                                            fetcher={customerFetcher}
                                            toOption={(item) => ({ id: item.id, label: item.full_name, sub: item.company_name || undefined })}
                                            onChange={(option) => { setSelectedCustomer(option); list.setFilters({ customer: option.id }); }}
                                        />
                                    </div>
                                    {customer != null && <button type="button" onClick={() => { setSelectedCustomer(null); list.setFilters({ customer: undefined }); }} className="mb-0.5 h-9 shrink-0 rounded-lg px-2 text-[10px] font-bold text-gray-400 hover:bg-gray-100 dark:hover:bg-white/[0.06]">پاک کردن</button>}
                                </div>
                            )}
                            <div className="flex min-w-0 items-end gap-1.5">
                                <div className="min-w-0 flex-1">
                                    <AsyncSelect<Sale>
                                        label="معامله"
                                        placeholder="همه معامله‌ها"
                                        emptyText="معامله‌ای یافت نشد"
                                        value={sale ?? null}
                                        selected={selectedSale}
                                        fetcher={saleFetcher}
                                        toOption={(item) => ({ id: item.id, label: item.summary_label, sub: item.product_name })}
                                        onChange={(option) => { setSelectedSale(option); list.setFilters({ sale: option.id }); }}
                                    />
                                </div>
                                {sale != null && <button type="button" onClick={() => { setSelectedSale(null); list.setFilters({ sale: undefined }); }} className="mb-0.5 h-9 shrink-0 rounded-lg px-2 text-[10px] font-bold text-gray-400 hover:bg-gray-100 dark:hover:bg-white/[0.06]">پاک کردن</button>}
                            </div>
                        </div>
                    </div>
                }
            />

            {list.loading ? (
                <HumanResourceCardSkeleton count={6} className={GRID} />
            ) : list.error ? (
                <StateCard kind="error" title="دریافت لیست ناموفق بود" description="ارتباط با سرور برقرار نشد. لطفاً دوباره تلاش کنید." onRetry={list.refetch} />
            ) : list.data.length === 0 ? (
                <StateCard
                    icon={<TriangleAlert size={19} />}
                    title="موردی برای پیگیری نیست"
                    description="کسری، سرک و بار برگشتی را از دکمه‌ی «فایل‌ها و پیگیری بار» روی هر معامله ثبت کنید."
                />
            ) : (
                <div className={GRID}>
                    {list.data.map((issue, i) => (
                        <Stagger key={issue.id} index={i}>
                            <IssueCard issue={issue} onOpen={setOpened} />
                        </Stagger>
                    ))}
                </div>
            )}

            {list.totalPages > 1 && (
                <Pagination page={list.page} totalPages={list.totalPages} onChange={list.setPage} />
            )}

            <SaleDetailsModal
                open={opened != null}
                saleId={opened?.sale ?? null}
                title={opened ? `${opened.sale_label} · ${opened.product_name}` : ""}
                onClose={() => setOpened(null)}
                onChanged={list.refetch}
            />
        </>
    );
}
