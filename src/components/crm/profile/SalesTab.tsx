"use client";

import { useState } from "react";
import { Plus, ShoppingBag } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { EmptyState, ErrorState } from "@/components/ui/Feedback";
import Pagination from "@/components/ui/Pagination";
import { TableSkeleton } from "@/components/ui/skeletons";
import { toast } from "@/components/notifications/toast";
import { usePaginatedList } from "@/hooks/usePaginatedList";
import { salesApi } from "@/lib/api";
import { apiMessage } from "@/lib/apiMessage";
import { useAuthStore } from "@/store/authStore";
import { usePermissions } from "@/hooks/usePermissions";
import type { Sale } from "@/types/crm";
import SaleFormModal from "../sales/SaleFormModal";
import SalesTable from "../sales/SalesTable";
import SaleDetailsModal from "../sales/SaleDetailsModal";
import { Card, SectionTitle } from "../shared/ui";

interface Props {
    customerId: number;
    customerName: string;
    onChanged?: () => void;
}

export default function SalesTab({ customerId, customerName, onChanged }: Props) {
    const userId = useAuthStore((s) => s.userId);
    const userType = useAuthStore((s) => s.userType);
    const { can } = usePermissions();
    const canViewSales = can("sales", "view");

    const list = usePaginatedList<Sale>(
        (params, signal) => salesApi.page({ ...params, customer: customerId }, signal),
        { pageSize: 10, enabled: canViewSales },
    );

    const [formOpen, setFormOpen] = useState(false);
    const [editing, setEditing] = useState<Sale | null>(null);
    const [details, setDetails] = useState<Sale | null>(null);
    const [toDelete, setToDelete] = useState<Sale | null>(null);
    const [deleting, setDeleting] = useState(false);
    const [deleteError, setDeleteError] = useState<string | null>(null);
    const [returnTarget, setReturnTarget] = useState<{ sale: Sale; undo: boolean } | null>(null);
    const [returning, setReturning] = useState(false);
    const [returnError, setReturnError] = useState<string | null>(null);

    const canModify = (s: Sale) => userType === 1 || (userId != null && (s.created_by === userId || s.trader === userId));

    async function confirmDelete() {
        if (!toDelete) return;
        setDeleting(true);
        setDeleteError(null);
        try {
            await salesApi.remove(toDelete.id);
            setToDelete(null);
            list.refetch();
            onChanged?.();
            toast.success("فروش حذف شد");
        } catch (e) {
            setDeleteError(apiMessage(e, "حذف فروش ناموفق بود"));
        } finally {
            setDeleting(false);
        }
    }

    async function confirmReturn() {
        if (!returnTarget) return;
        setReturning(true);
        setReturnError(null);
        try {
            if (returnTarget.undo) await salesApi.undoReturn(returnTarget.sale.id);
            else await salesApi.markReturned(returnTarget.sale.id);
            setReturnTarget(null);
            list.refetch();
            onChanged?.();
            toast.success(returnTarget.undo ? "برگشت معامله لغو شد" : "معامله برگشت خورد");
        } catch (error) {
            setReturnError(apiMessage(error, "عملیات ناموفق بود"));
        } finally {
            setReturning(false);
        }
    }

    if (!canViewSales) return null;

    return (
        <Card>
            <SectionTitle
                icon={<ShoppingBag size={16} />}
                title="خرید و فروش‌های ثبت‌شده"
                actions={
                    can("sales", "create") && can("products", "view") && can("customers", "view") ? (
                        <Button
                            size="sm"
                            icon={<Plus size={14} />}
                            onClick={() => {
                                setEditing(null);
                                setFormOpen(true);
                            }}
                        >
                            ثبت معامله
                        </Button>
                    ) : null
                }
            />

            {list.loading ? (
                <TableSkeleton rows={5} cols={5} />
            ) : list.error ? (
                <ErrorState message="دریافت فروش‌ها ناموفق بود" onRetry={list.refetch} />
            ) : list.data.length === 0 ? (
                <EmptyState
                    title="فروشی ثبت نشده است"
                    description="با دکمه‌ی «ثبت فروش» اولین فروش این مشتری را اضافه کنید."
                    icon={<ShoppingBag size={26} />}
                />
            ) : (
                <>
                    <SalesTable
                        compact
                        sales={list.data}
                        canModify={canModify}
                        onDetails={setDetails}
                        onEdit={(s) => {
                            setEditing(s);
                            setFormOpen(true);
                        }}
                        onDelete={(s) => {
                            setDeleteError(null);
                            setToDelete(s);
                        }}
                        onReturn={(sale) => {
                            setReturnError(null);
                            setReturnTarget({ sale, undo: false });
                        }}
                        onUndoReturn={(sale) => {
                            setReturnError(null);
                            setReturnTarget({ sale, undo: true });
                        }}
                    />
                    {list.totalPages > 1 && (
                        <div className="mt-3">
                            <Pagination
                                page={list.page}
                                totalPages={list.totalPages}
                                onChange={list.setPage}
                                compact
                            />
                        </div>
                    )}
                </>
            )}

            <SaleFormModal
                open={formOpen}
                onClose={() => setFormOpen(false)}
                sale={editing}
                fixedCustomer={{ id: customerId, name: customerName }}
                onSaved={() => {
                    list.refetch();
                    onChanged?.();
                    toast.success(editing ? "فروش ویرایش شد" : "فروش ثبت شد");
                }}
            />

            <SaleDetailsModal
                open={details != null}
                saleId={details?.id ?? null}
                title={details ? `${details.summary_label} · ${details.product_name}` : ""}
                onClose={() => setDetails(null)}
                onChanged={() => {
                    list.refetch();
                    onChanged?.();
                }}
            />

            <ConfirmDialog
                open={returnTarget != null}
                title={returnTarget?.undo ? "لغو برگشت معامله" : "برگشت معامله"}
                message={returnTarget?.undo ? "معامله دوباره در محاسبات فعال می‌شود. ادامه می‌دهید؟" : "این معامله برگشت‌خورده علامت‌گذاری می‌شود و از گزارش‌ها کنار می‌رود. ادامه می‌دهید؟"}
                confirmLabel="تأیید"
                loading={returning}
                error={returnError}
                onConfirm={confirmReturn}
                onCancel={() => setReturnTarget(null)}
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
        </Card>
    );
}
