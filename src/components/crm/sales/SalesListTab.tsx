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
import { useActiveProducts } from "../shared/useActiveProducts";
import SaleDetailsModal from "./SaleDetailsModal";
import SaleFormModal from "./SaleFormModal";
import { SALE_FILTER_DEFAULTS, type SaleFilters } from "./saleFilters";
import { SalesFilterBar } from "./SalesFilterBar";
import SalesTable from "./SalesTable";

export default function SalesListTab() {
    const userId = useAuthStore((s) => s.userId);
    const userType = useAuthStore((s) => s.userType);
    const { can } = usePermissions();
    const products = useActiveProducts();

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

    const canModify = useCallback(
        (s: Sale) => userType === 1 || s.created_by === userId,
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

    const pageTotal = list.data.reduce((a, x) => a + toNumber(x.total_amount), 0);
    const pageKg = list.data.reduce((a, x) => a + toNumber(x.quantity_kg), 0);
    const pageIssues = list.data.reduce((a, x) => a + x.open_issues_count, 0);

    const activeFilters =
        (list.filters.product ? 1 : 0) + (list.filters.date_from || list.filters.date_to ? 1 : 0);

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
                        {can("sales", "create") && (
                            <PillButton icon={<Plus size={13} />} onClick={() => openForm(null)}>
                                ثبت معامله
                            </PillButton>
                        )}
                    </>
                }
                stats={[
                    { label: "معامله‌ها", value: formatNumber(list.count) },
                    { label: "جمع مبلغ این صفحه", value: formatMoney(pageTotal), tone: "emerald" },
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
