"use client";

import { useState } from "react";
import Link from "next/link";
import { Layers, ListChecks, Pencil, Plus, Sprout, Trash2, Users, FileText } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { EmptyState, ErrorState, SearchInput } from "@/components/ui/Feedback";
import Pagination from "@/components/ui/Pagination";
import { TableSkeleton } from "@/components/ui/skeletons";
import { toast } from "@/components/notifications/toast";
import { usePaginatedList } from "@/hooks/usePaginatedList";
import { usePermissions } from "@/hooks/usePermissions";
import { seasonalApi } from "@/lib/api";
import { apiMessage } from "@/lib/apiMessage";
import { formatNumber, formatWeight } from "@/lib/crm/format";
import type { SeasonalSupply } from "@/types/crm";
import type { BasePath } from "../shared/types";
import { Card, SectionTitle } from "../shared/ui";
import { ColorStatsPanel } from "../shared/ColorStats";
import { monthRange } from "./months";
import SupplyFormModal from "./SupplyFormModal";

const ROW_ACTION_CLASS =
    "flex h-9 w-9 items-center justify-center rounded-xl text-gray-400 transition-colors dark:hover:bg-white/10";

interface RowProps {
    supply: SeasonalSupply;
    basePath: BasePath;
    canEdit: boolean;
    canDelete: boolean;
    onEdit: (supply: SeasonalSupply) => void;
    onDelete: (supply: SeasonalSupply) => void;
}

function SupplyRow({ supply, basePath, canEdit, canDelete, onEdit, onDelete }: RowProps) {
    return (
        <li className="flex flex-col gap-2 rounded-3xl bg-white p-3.5 shadow-sm transition-shadow hover:shadow-md dark:bg-white/[0.05]">
            <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-x-1.5 gap-y-0.5 text-[13px] font-extrabold text-gray-900 dark:text-white">
                    <Link
                        href={`${basePath}/customer/${supply.customer}/`}
                        className="hover:text-brand"
                    >
                        {supply.customer_name}
                    </Link>
                    <span className="mx-1.5 text-gray-300">·</span>
                    {supply.product_name}
                </div>
                <div className="mt-1 break-words text-[11.5px] leading-5 text-gray-500 dark:text-gray-400">
                    {monthRange(supply.start_month, supply.end_month)}
                    {supply.expected_quantity_kg
                        ? ` · حدود ${formatWeight(supply.expected_quantity_kg)}`
                        : ""}
                    {supply.notes ? ` · ${supply.notes}` : ""}
                </div>
            </div>
            <div className="flex shrink-0 items-center gap-1 self-end sm:self-auto">
                {canEdit && (
                    <button
                        type="button"
                        aria-label="ویرایش"
                        onClick={() => onEdit(supply)}
                        className={`${ROW_ACTION_CLASS} hover:bg-gray-100 hover:text-gray-700`}
                    >
                        <Pencil size={14} />
                    </button>
                )}
                {canDelete && (
                    <button
                        type="button"
                        aria-label="حذف"
                        onClick={() => onDelete(supply)}
                        className={`${ROW_ACTION_CLASS} hover:bg-red-50 hover:text-red-500 dark:hover:bg-red-500/10`}
                    >
                        <Trash2 size={14} />
                    </button>
                )}
            </div>
        </li>
    );
}

/** تب «فهرست فصلی»: مدیریت اینکه هر مشتری چه کالایی را در چه ماه‌هایی دارد. */
export default function SupplyListTab({ basePath }: { basePath: BasePath }) {
    const { can } = usePermissions();
    const list = usePaginatedList<SeasonalSupply>(
        (params, signal) => seasonalApi.page(params, signal),
        {
            pageSize: 15,
        },
    );

    const [formOpen, setFormOpen] = useState(false);
    const [editing, setEditing] = useState<SeasonalSupply | null>(null);
    const [toDelete, setToDelete] = useState<SeasonalSupply | null>(null);
    const [deleting, setDeleting] = useState(false);

    const openForm = (supply: SeasonalSupply | null) => {
        setEditing(supply);
        setFormOpen(true);
    };

    async function confirmDelete() {
        if (!toDelete) return;
        setDeleting(true);
        try {
            await seasonalApi.remove(toDelete.id);
            setToDelete(null);
            list.refetch();
            toast.success("حذف شد");
        } catch (e) {
            toast.error(apiMessage(e, "حذف ناموفق بود"));
        } finally {
            setDeleting(false);
        }
    }

    const customersShown = new Set(list.data.map((x) => x.customer)).size;
    const productsShown = new Set(list.data.map((x) => x.product_name)).size;

    return (
        <div className="flex flex-col gap-4">
        <ColorStatsPanel
            stats={[
                { label: "کل موارد", value: formatNumber(list.count), icon: ListChecks },
                { label: "مشتریان این صفحه", value: formatNumber(customersShown), icon: Users },
                { label: "کالاهای این صفحه", value: formatNumber(productsShown), icon: Layers },
                { label: "صفحه", value: `${formatNumber(list.page)} از ${formatNumber(list.totalPages || 1)}`, icon: FileText },
            ]}
        >
            <SearchInput
                value={list.search}
                onChange={list.setSearch}
                placeholder="مشتری یا کالا..."
                className="[&_input]:h-12 [&_input]:rounded-[2rem] [&_input]:px-5 [&_input]:text-[13px]"
                hideIcon
            />
        </ColorStatsPanel>
        <Card>
            <SectionTitle
                icon={<ListChecks size={16} />}
                title={`فهرست مشتریان فصلی${list.count ? ` (${formatNumber(list.count)})` : ""}`}
                actions={
                    can("seasonal", "create") ? (
                        <Button size="sm" icon={<Plus size={14} />} onClick={() => openForm(null)}>
                            افزودن
                        </Button>
                    ) : undefined
                }
            />
            {list.loading ? (
                <TableSkeleton rows={6} cols={4} />
            ) : list.error ? (
                <ErrorState message="دریافت فهرست ناموفق بود" onRetry={list.refetch} />
            ) : list.data.length === 0 ? (
                <EmptyState
                    title="هنوز موردی ثبت نشده است"
                    description="مثلاً: آقای الف، جو، از خرداد تا تیر."
                    icon={<Sprout size={26} />}
                />
            ) : (
                <ul className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-3">
                    {list.data.map((supply) => (
                        <SupplyRow
                            key={supply.id}
                            supply={supply}
                            basePath={basePath}
                            canEdit={can("seasonal", "edit")}
                            canDelete={can("seasonal", "delete")}
                            onEdit={openForm}
                            onDelete={setToDelete}
                        />
                    ))}
                </ul>
            )}

            {list.totalPages > 1 && (
                <div className="mt-3">
                    <Pagination
                        page={list.page}
                        totalPages={list.totalPages}
                        onChange={list.setPage}
                    />
                </div>
            )}

            <SupplyFormModal
                open={formOpen}
                entry={editing}
                onClose={() => setFormOpen(false)}
                onSaved={() => {
                    list.refetch();
                    toast.success("ذخیره شد");
                }}
            />

            <ConfirmDialog
                open={toDelete != null}
                title="حذف مشتری فصلی"
                message="این مورد از فهرست و پیشنهادها حذف می‌شود. ادامه می‌دهید؟"
                confirmLabel="حذف"
                danger
                loading={deleting}
                onConfirm={confirmDelete}
                onCancel={() => setToDelete(null)}
            />
        </Card>
        </div>
    );
}
