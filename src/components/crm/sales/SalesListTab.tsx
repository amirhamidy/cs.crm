"use client";

import { useCallback, useState } from "react";
import { Plus, ShoppingBag } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { EmptyState, ErrorState } from "@/components/ui/Feedback";
import Pagination from "@/components/ui/Pagination";
import { TableSkeleton } from "@/components/ui/skeletons";
import { toast } from "@/components/notifications/toast";
import { usePaginatedList } from "@/hooks/usePaginatedList";
import { usePermissions } from "@/hooks/usePermissions";
import { salesApi } from "@/lib/api";
import { apiMessage } from "@/lib/apiMessage";
import { formatNumber } from "@/lib/crm/format";
import { useAuthStore } from "@/store/authStore";
import type { Sale } from "@/types/crm";
import { useActiveProducts } from "../shared/useActiveProducts";
import { Card, SectionTitle } from "../shared/ui";
import SaleDetailsModal from "./SaleDetailsModal";
import SaleFormModal from "./SaleFormModal";
import { SALE_FILTER_DEFAULTS, type SaleFilters } from "./saleFilters";
import { SalesFilterBar } from "./SalesFilterBar";
import SalesTable from "./SalesTable";

/** تب «خرید و فروش»: فهرست معامله‌ها با فیلتر، ثبت، ویرایش و حذف. */
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
        { pageSize: 15, filters: SALE_FILTER_DEFAULTS },
    );
    const { refetch } = list;

    const [formOpen, setFormOpen] = useState(false);
    const [editing, setEditing] = useState<Sale | null>(null);
    const [details, setDetails] = useState<Sale | null>(null);
    const [toDelete, setToDelete] = useState<Sale | null>(null);
    const [deleting, setDeleting] = useState(false);
    const [deleteError, setDeleteError] = useState<string | null>(null);

    // کال‌بک‌ها پایدارند تا SalesTable با هر کلید جستجو دوباره رندر نشود
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

    return (
        <div className="flex flex-col gap-4">
            <SalesFilterBar
                search={list.search}
                filters={list.filters}
                products={products}
                onSearch={list.setSearch}
                onFilters={list.setFilters}
            />

            <Card>
                <SectionTitle
                    icon={<ShoppingBag size={16} />}
                    title={`معامله‌ها${list.count ? ` (${formatNumber(list.count)})` : ""}`}
                    actions={
                        can("sales", "create") ? (
                            <Button
                                size="sm"
                                icon={<Plus size={14} />}
                                onClick={() => openForm(null)}
                            >
                                ثبت معامله
                            </Button>
                        ) : undefined
                    }
                />

                {list.loading ? (
                    <TableSkeleton rows={8} cols={6} />
                ) : list.error ? (
                    <ErrorState message="دریافت فروش‌ها ناموفق بود" onRetry={refetch} />
                ) : list.data.length === 0 ? (
                    <EmptyState
                        title="فروشی پیدا نشد"
                        description="فیلترها را تغییر دهید یا فروش جدید ثبت کنید."
                        icon={<ShoppingBag size={26} />}
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
                            <div className="mt-3">
                                <Pagination
                                    page={list.page}
                                    totalPages={list.totalPages}
                                    onChange={list.setPage}
                                    summary={`${formatNumber(list.count)} فروش`}
                                />
                            </div>
                        )}
                    </>
                )}
            </Card>

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
        </div>
    );
}
