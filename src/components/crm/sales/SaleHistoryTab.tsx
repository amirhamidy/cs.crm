"use client";

import { memo, useEffect, useState } from "react";
import AsyncSelect, { type AsyncOption } from "@/components/ui/AsyncSelect";
import { accountsApi, salesApi } from "@/lib/api";
import { usePermissions } from "@/hooks/usePermissions";
import { Eye, History, User } from "lucide-react";
import Pagination from "@/components/ui/Pagination";
import { HumanResourceCardSkeleton } from "@/components/ui/skeletons";
import { usePaginatedList } from "@/hooks/usePaginatedList";
import { formatRial, formatTehranDateTime, formatNumber, toPersianDigits } from "@/lib/crm/format";
import type { Sale, SaleHistoryEntry } from "@/types/crm";
import type { ApiUser } from "@/types/users";
import type { SearchParams } from "@/types/pagination";
import {
    CARD_HOVER,
    Chip,
    FilterChips,
    GRID,
    IconTile,
    PageToolbar,
    SURFACE,
    StateCard,
    Stagger,
} from "../shared/kit";
import { cn } from "@/lib/utils";
import { DateRangeField } from "./DateRangeField";
import SaleDetailsModal from "./SaleDetailsModal";

type ActionFilter = "created" | "updated" | "returned" | "return_undone" | "deleted" | "issue_added" | "issue_updated" | "issue_deleted" | "file_added" | "file_deleted" | "all";
type HistoryFilters = {
    action: ActionFilter;
    user: number | undefined;
    sale: number | undefined;
    dateFrom: string | undefined;
    dateTo: string | undefined;
};

const ACTIONS: { value: ActionFilter; label: string }[] = [
    { value: "all", label: "همه" },
    { value: "created", label: "ثبت" },
    { value: "updated", label: "ویرایش" },
    { value: "deleted", label: "حذف" },
    { value: "returned", label: "برگشت" },
    { value: "return_undone", label: "لغو برگشت" },
    { value: "issue_added", label: "ثبت کسری/سرک" },
    { value: "issue_updated", label: "ویرایش کسری/سرک" },
    { value: "issue_deleted", label: "حذف کسری/سرک" },
    { value: "file_added", label: "افزودن فایل" },
    { value: "file_deleted", label: "حذف فایل" },
];

async function fetchHistory(params: SearchParams & HistoryFilters, signal: AbortSignal) {
    const { page, page_size, search, action, user, sale, dateFrom, dateTo } = params;
    return salesApi.historyPage(
        {
            page,
            page_size,
            search,
            action: action === "all" ? undefined : action,
            user,
            sale,
            date_from: dateFrom,
            date_to: dateTo,
        },
        signal,
    );
}

const MONEY_FIELDS = new Set([
    "buy_price",
    "sell_price",
    "total_buy_amount",
    "total_sell_amount",
    "loading_cost",
    "weighbridge_cost",
    "freight_cost",
]);

function formatChangeValue(field: string, value: string | null) {
    if (value == null || value === "") return "—";
    if (!MONEY_FIELDS.has(field)) return value;
    const amount = Number(value);
    return Number.isFinite(amount) ? formatRial(amount) : value;
}

const HistoryCard = memo(({
    entry,
    onOpenSale,
}: {
    entry: SaleHistoryEntry;
    onOpenSale: (id: number, title: string) => void;
}) => {
    return (
        <div className={cn(SURFACE, CARD_HOVER, "flex flex-col gap-3 p-4")}>
            <div className="flex items-start gap-2.5">
                <IconTile tone="indigo" size="sm"><History size={15} /></IconTile>
                <div className="min-w-0 flex-1">
                    <div className="truncate text-[13px] font-bold text-gray-800 dark:text-gray-100">
                        {entry.sale_label}
                        {entry.sale_deleted && (
                            <span className="mr-1.5 text-[11px] text-rose-500">(حذف‌شده)</span>
                        )}
                    </div>
                    <div className="mt-0.5 text-[11px] text-gray-500 dark:text-gray-400">
                        شماره: {toPersianDigits(entry.sale_ref)} · {entry.action_display}
                    </div>
                    {!entry.sale_deleted && entry.sale != null && (
                        <button
                            type="button"
                            onClick={() => onOpenSale(entry.sale as number, entry.sale_label)}
                            className="mt-1.5 inline-flex items-center gap-1 text-[10.5px] font-bold text-indigo-600 hover:text-indigo-700 dark:text-indigo-400"
                        >
                            <Eye size={12} /> مشاهده معامله
                        </button>
                    )}
                </div>
                <Chip tone="indigo" className="shrink-0 text-[10px]">
                    {entry.action_display}
                </Chip>
            </div>

            {entry.changes.length > 0 && (
                <div className="space-y-1.5 rounded-xl bg-gray-50 px-3 py-2.5 dark:bg-white/[0.035]">
                    {entry.changes.map((ch, idx) => (
                        <div key={idx} className="text-[11.5px]">
                            <span className="font-bold text-gray-700 dark:text-gray-200">{ch.label}:</span>{" "}
                            <span className="text-gray-500 line-through dark:text-gray-400">
                                {formatChangeValue(ch.field, ch.old)}
                            </span>{" "}
                            →{" "}
                            <span className="font-semibold text-emerald-600 dark:text-emerald-400">
                                {formatChangeValue(ch.field, ch.new)}
                            </span>
                        </div>
                    ))}
                </div>
            )}

            {entry.note && (
                <div className="rounded-lg bg-amber-50 px-2.5 py-2 text-[11px] text-amber-800 dark:bg-amber-500/10 dark:text-amber-300">
                    {entry.note}
                </div>
            )}

            <div className="flex items-center justify-between border-t border-gray-200 pt-2.5 dark:border-white/10">
                <div className="flex items-center gap-1.5 text-[10.5px] text-gray-500 dark:text-gray-400">
                    <User size={12} />
                    <span>{entry.user_name || "—"}</span>
                </div>
                <div className="text-[10.5px] text-gray-400 dark:text-gray-500">
                    {formatTehranDateTime(entry.created_at)}
                </div>
            </div>
        </div>
    );
});

HistoryCard.displayName = "HistoryCard";

export default function SaleHistoryTab() {
    const [selectedSale, setSelectedSale] = useState<AsyncOption | null>(null);
    const [selectedUser, setSelectedUser] = useState<AsyncOption | null>(null);
    const [openedSale, setOpenedSale] = useState<{ id: number; title: string } | null>(null);
    const { isManager } = usePermissions();

    const list = usePaginatedList<SaleHistoryEntry, HistoryFilters>(fetchHistory, {
        pageSize: 20,
        enabled: isManager,
        filters: { action: "all", user: undefined, sale: undefined, dateFrom: undefined, dateTo: undefined },
    });
    const { action, sale, user, dateFrom, dateTo } = list.filters;

    useEffect(() => {
        if (!sale) setSelectedSale(null);
        if (!user) setSelectedUser(null);
    }, [sale, user]);

    const saleFetcher = (params: { page: number; page_size: number; search?: string }, signal: AbortSignal) =>
        salesApi.page(params, signal);
    const userFetcher = (params: { page: number; page_size: number; search?: string }, signal: AbortSignal) =>
        accountsApi.users.list(params, signal);

    if (!isManager) {
        return (
            <StateCard
                kind="error"
                title="دسترسی محدود"
                description="تاریخچه تغییرات فقط برای مدیران قابل مشاهده است."
            />
        );
    }

    return (
        <>
            <PageToolbar
                icon={<History size={18} />}
                title="تاریخچه تغییرات"
                subtitle="تمام تغییرات ثبت، ویرایش و حذف معاملات"
                count={list.count}
                stats={[
                    { label: "کل رکوردها", value: formatNumber(list.count) },
                    { label: "این صفحه", value: formatNumber(list.data.length), tone: "indigo" },
                ]}
                search={
                    <input
                        type="search"
                        value={list.search}
                        onChange={(event) => list.setSearch(event.target.value)}
                        placeholder="جستجو در معامله، کاربر و توضیحات"
                        aria-label="جستجو در تاریخچه فروش"
                        autoComplete="off"
                        className="h-10 w-full min-w-0 rounded-xl border border-gray-200 bg-gray-50 px-3 text-[12px] outline-none transition focus:border-indigo-400 dark:border-white/10 dark:bg-white/[0.04] sm:w-64"
                    />
                }
                footer={
                    <div className="flex flex-col gap-3">
                        <FilterChips
                            label="نوع عملیات"
                            items={ACTIONS}
                            value={action}
                            onChange={(value) => list.setFilters({ action: value })}
                        />
                        <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                            <div className="flex min-w-0 items-end gap-1.5">
                                <div className="min-w-0 flex-1">
                                    <AsyncSelect<Sale>
                                        label="معامله"
                                        placeholder="همه معامله‌ها"
                                        emptyText="معامله‌ای یافت نشد"
                                        value={sale ?? null}
                                        selected={selectedSale}
                                        fetcher={saleFetcher}
                                        toOption={(item) => ({
                                            id: item.id,
                                            label: item.summary_label,
                                            sub: item.product_name,
                                        })}
                                        onChange={(option) => {
                                            setSelectedSale(option);
                                            list.setFilters({ sale: option.id });
                                        }}
                                    />
                                </div>
                                {sale != null && (
                                    <button
                                        type="button"
                                        onClick={() => {
                                            setSelectedSale(null);
                                            list.setFilters({ sale: undefined });
                                        }}
                                        className="mb-0.5 h-9 shrink-0 rounded-lg px-2 text-[10px] font-bold text-gray-400 hover:bg-gray-100 dark:hover:bg-white/[0.06]"
                                    >
                                        پاک کردن
                                    </button>
                                )}
                            </div>
                        </div>
                        <div className="flex min-w-0 items-end gap-1.5">
                            <div className="min-w-0 flex-1">
                                <AsyncSelect<ApiUser>
                                    label="کاربر انجام‌دهنده"
                                    placeholder="همه کاربران"
                                    emptyText="کاربری یافت نشد"
                                    value={user ?? null}
                                    selected={selectedUser}
                                    fetcher={userFetcher}
                                    toOption={(item) => ({
                                        id: item.id,
                                        label: item.username,
                                    })}
                                    onChange={(option) => {
                                        setSelectedUser(option);
                                        list.setFilters({ user: option.id });
                                    }}
                                />
                            </div>
                            {user != null && (
                                <button
                                    type="button"
                                    onClick={() => {
                                        setSelectedUser(null);
                                        list.setFilters({ user: undefined });
                                    }}
                                    className="mb-0.5 h-9 shrink-0 rounded-lg px-2 text-[10px] font-bold text-gray-400 hover:bg-gray-100 dark:hover:bg-white/[0.06]"
                                >
                                    پاک کردن
                                </button>
                            )}
                        </div>
                        <DateRangeField
                            from={dateFrom}
                            to={dateTo}
                            onChange={(from, to) => list.setFilters({ dateFrom: from, dateTo: to })}
                        />
                    </div>
                }
            />

            {list.loading ? (
                <HumanResourceCardSkeleton count={8} className={GRID} />
            ) : list.error ? (
                <StateCard
                    kind="error"
                    title="دریافت تاریخچه ناموفق بود"
                    description="ارتباط با سرور برقرار نشد. لطفاً دوباره تلاش کنید."
                    onRetry={list.refetch}
                />
            ) : list.data.length === 0 ? (
                <StateCard
                    icon={<History size={19} />}
                    title="تغییری ثبت نشده"
                    description="تاریخچه‌ای برای معاملات ثبت نشده است."
                />
            ) : (
                <div className={GRID}>
                    {list.data.map((entry, i) => (
                        <Stagger key={entry.id} index={i}>
                            <HistoryCard
                                entry={entry}
                                onOpenSale={(id, title) => setOpenedSale({ id, title })}
                            />
                        </Stagger>
                    ))}
                </div>
            )}

            {list.totalPages > 1 && (
                <Pagination page={list.page} totalPages={list.totalPages} onChange={list.setPage} />
            )}

            <SaleDetailsModal
                open={openedSale != null}
                saleId={openedSale?.id ?? null}
                title={openedSale?.title ?? ""}
                onClose={() => setOpenedSale(null)}
            />
        </>
    );
}
