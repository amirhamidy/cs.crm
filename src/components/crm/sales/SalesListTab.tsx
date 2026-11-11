"use client";

import { useCallback, useState } from "react";
import { Plus, ShoppingBag } from "lucide-react";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import Pagination from "@/components/ui/Pagination";
import { HumanResourceCardSkeleton } from "@/components/ui/skeletons";
import { toast } from "@/components/notifications/toast";
import { usePaginatedList } from "@/hooks/usePaginatedList";
import { usePermissions } from "@/hooks/usePermissions";
import { salesApi } from "@/lib/api";
import { apiMessage } from "@/lib/apiMessage";
import { formatMoney, formatNumber, formatWeight, toNumber } from "@/lib/crm/format";
import { useAuthStore } from "@/store/authStore";
import type { Sale } from "@/types/crm";
import { FilterToggle, GRID, PillButton, PageToolbar, SearchPill, StateCard } from "../shared/kit";
import { useAllProducts } from "../shared/useAllProducts";
import SaleDetailsModal from "./SaleDetailsModal";
import SaleFormModal from "./SaleFormModal";
import { SALE_FILTER_DEFAULTS, type SaleFilters } from "./saleFilters";
import { SalesFilterBar } from "./SalesFilterBar";
import SalesTable from "./SalesTable";

export default function SalesListTab() {
    const userId = useAuthStore((s) => s.userId);
    const userType = useAuthStore((s) => s.userType);
    const { can } = usePermissions();
    const products = useAllProducts(can("products", "view"));

    const list = usePaginatedList<Sale, SaleFilters>(
        (params, signal) =>
            salesApi.page(
                {
                    page: params.page,
                    page_size: params.page_size,
                    search: params.search,
                    trade_type: params.trade_type,
                    has_open_issues: params.has_open_issues,
                    product: params.product,
                    customer: params.customer,
                    seller: params.seller,
                    buyer: params.buyer,
                    case: params.case,
                    status: params.status,
                    trader: params.trader,
                    deal_type: params.deal_type,
                    load_type: params.load_type,
                    date_from: params.date_from,
                    date_to: params.date_to,
                },
                signal,
            ),
        { pageSize: 16, filters: SALE_FILTER_DEFAULTS },
    );
    const { refetch } = list;

    const [panelOpen, setPanelOpen] = useState(false);
    const [formOpen, setFormOpen] = useState(false);
    const [editing, setEditing] = useState<Sale | null>(null);
    const [details, setDetails] = useState<Sale | null>(null);
    const [toDelete, setToDelete] = useState<Sale | null>(null);
    const [deleting, setDeleting] = useState(false);
    const [deleteError, setDeleteError] = useState<string | null>(null);
    const [retTarget, setRetTarget] = useState<{ sale: Sale; undo: boolean } | null>(null);
    const [retBusy, setRetBusy] = useState(false);
    const [retError, setRetError] = useState<string | null>(null);

    async function confirmReturn() {
        if (!retTarget) return;
        setRetBusy(true);
        setRetError(null);
        try {
            if (retTarget.undo) await salesApi.undoReturn(retTarget.sale.id);
            else await salesApi.markReturned(retTarget.sale.id, "");
            setRetTarget(null);
            refetch();
            toast.success(retTarget.undo ? "برگشت لغو شد" : "معامله برگشت خورد");
        } catch (e) {
            setRetError(apiMessage(e, "عملیات ناموفق بود"));
        } finally {
            setRetBusy(false);
        }
    }

    const canModify = useCallback(
        (s: Sale) => userType === 1 || (userId != null && (s.created_by === userId || s.trader === userId)),
        [userType, userId],
    );

    const openForm = useCallback((sale: Sale | null) => {
        setEditing(sale);
        setFormOpen(true);
    }, []);

    const askDelete = useCallback((sale: Sale) => {
        setDeleteError(null);
        setToDelete(sale);
    }, []);

    async function confirmDelete() {
        if (!toDelete) return;
        setDeleting(true);
        setDeleteError(null);
        try {
            await salesApi.remove(toDelete.id);
            setToDelete(null);
            refetch();
            toast.success("فروش حذف شد");
        } catch (e) {
            setDeleteError(apiMessage(e, "حذف فروش ناموفق بود"));
        } finally {
            setDeleting(false);
        }
    }

    const pageTotal = list.data.reduce((a, x) => a + toNumber(x.profit ?? x.total_sell_amount ?? x.total_buy_amount), 0);
    const pageKg = list.data.reduce((a, x) => a + toNumber(x.quantity_kg), 0);
    const pageIssues = list.data.reduce((a, x) => a + x.open_issues_count, 0);

    const activeFilters =
        (list.filters.trade_type ? 1 : 0) +
        (list.filters.has_open_issues ? 1 : 0) +
        (list.filters.product ? 1 : 0) +
        (list.filters.customer ? 1 : 0) +
        (list.filters.seller ? 1 : 0) +
        (list.filters.buyer ? 1 : 0) +
        (list.filters.case ? 1 : 0) +
        (list.filters.status ? 1 : 0) +
        (list.filters.trader ? 1 : 0) +
        (list.filters.deal_type ? 1 : 0) +
        (list.filters.load_type ? 1 : 0) +
        (list.filters.date_from || list.filters.date_to ? 1 : 0);

    return (
        <>
            <PageToolbar
                icon={<ShoppingBag size={18} />}
                title="خرید و فروش"
                subtitle="معامله‌ها، مبلغ و پیگیری بار"
                count={list.count}
                search={<SearchPill value={list.search} onChange={list.setSearch} placeholder="فروشنده، خریدار، کالا..." />}
                actions={
                    <>
                        <FilterToggle open={panelOpen} onToggle={() => setPanelOpen((v) => !v)} activeCount={activeFilters} />
                        {can("sales", "create") && can("products", "view") && can("customers", "view") && (
                            <PillButton icon={<Plus size={13} />} onClick={() => openForm(null)}>
                                ثبت معامله
                            </PillButton>
                        )}
                    </>
                }
                stats={[
                    { label: "معامله‌ها", value: formatNumber(list.count) },
                    { label: "جمع سود/مبلغ این صفحه", value: formatMoney(pageTotal), tone: "emerald" },
                    { label: "جمع وزن این صفحه", value: formatWeight(pageKg), tone: "indigo" },
                    { label: "پیگیری باز", value: formatNumber(pageIssues), tone: "amber" },
                ]}
                footer={
                    <SalesFilterBar
                        open={panelOpen}
                        filters={list.filters}
                        products={products}
                        onFilters={list.setFilters}
                    />
                }
            />

            {list.loading ? (
                <HumanResourceCardSkeleton count={8} className={GRID} />
            ) : list.error ? (
                <StateCard kind="error" title="دریافت فروش‌ها ناموفق بود" description="ارتباط با سرور برقرار نشد. لطفاً دوباره تلاش کنید." onRetry={refetch} />
            ) : list.data.length === 0 ? (
                <StateCard
                    icon={<ShoppingBag size={19} />}
                    title="فروشی پیدا نشد"
                    description="فیلترها را تغییر دهید یا معامله جدید ثبت کنید."
                />
            ) : (
                <>
                    <SalesTable
                        sales={list.data}
                        canModify={canModify}
                        onDetails={setDetails}
                        onEdit={openForm}
                        onDelete={askDelete}
                        onReturn={(sale) => { setRetError(null); setRetTarget({ sale, undo: false }); }}
                        onUndoReturn={(sale) => { setRetError(null); setRetTarget({ sale, undo: true }); }}
                    />
                    {list.totalPages > 1 && (
                        <Pagination
                            page={list.page}
                            totalPages={list.totalPages}
                            onChange={list.setPage}
                            summary={`${formatNumber(list.count)} فروش`}
                        />
                    )}
                </>
            )}

            <SaleDetailsModal
                open={details != null}
                saleId={details?.id ?? null}
                title={details?.summary_label ?? ""}
                onClose={() => setDetails(null)}
                onChanged={refetch}
            />

            <SaleFormModal
                open={formOpen}
                onClose={() => setFormOpen(false)}
                sale={editing}
                onSaved={() => {
                    refetch();
                    toast.success(editing ? "فروش ویرایش شد" : "فروش ثبت شد");
                }}
            />

            <ConfirmDialog
                open={retTarget != null}
                title={retTarget?.undo ? "لغو برگشت معامله" : "برگشت معامله"}
                message={retTarget?.undo ? "معامله دوباره فعال می‌شود. ادامه می‌دهید؟" : "معامله از محاسبات حذف و برگشتی علامت‌گذاری می‌شود. ادامه می‌دهید؟"}
                confirmLabel="تأیید"
                loading={retBusy}
                error={retError}
                onConfirm={confirmReturn}
                onCancel={() => setRetTarget(null)}
            />

            <ConfirmDialog
                open={toDelete != null}
                title="حذف فروش"
                message="این فروش از گزارش‌ها و جمع فروش مشتری حذف می‌شود. ادامه می‌دهید؟"
                confirmLabel="حذف"
                danger
                loading={deleting}
                error={deleteError}
                onConfirm={confirmDelete}
                onCancel={() => setToDelete(null)}
            />
        </>
    );
}
