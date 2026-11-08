"use client";

import { useState } from "react";
import Link from "next/link";
import { ListChecks, Package, Pencil, Phone, Plus, Sprout, Trash2 } from "lucide-react";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import Pagination from "@/components/ui/Pagination";
import { HumanResourceCardSkeleton } from "@/components/ui/skeletons";
import { toast } from "@/components/notifications/toast";
import { usePaginatedList } from "@/hooks/usePaginatedList";
import { usePermissions } from "@/hooks/usePermissions";
import { seasonalApi } from "@/lib/api";
import { apiMessage } from "@/lib/apiMessage";
import { formatNumber, formatWeight } from "@/lib/crm/format";
import { cn } from "@/lib/utils";
import type { SeasonalSupply } from "@/types/crm";
import {
    CARD_HOVER,
    Chip,
    Divider,
    GRID,
    IconAction,
    IconTile,
    INSET,
    PageToolbar,
    PillButton,
    SURFACE,
    SearchPill,
    StateCard,
    Stagger,
    gradientOf,
    initialOf,
} from "../shared/kit";
import type { BasePath } from "../shared/types";
import { MONTH_OPTIONS, monthRange } from "./months";
import SupplyFormModal from "./SupplyFormModal";

const isActiveMonth = (month: number, from: number, to: number) =>
    from <= to ? month >= from && month <= to : month >= from || month <= to;

function SeasonBar({ from, to }: { from: number; to: number }) {
    return (
        <div>
            <div className="flex gap-[3px]" dir="rtl" aria-hidden="true">
                {MONTH_OPTIONS.map((m) => (
                    <span
                        key={m.id}
                        title={m.label}
                        className={cn(
                            "h-1.5 flex-1 rounded-full",
                            isActiveMonth(m.id, from, to) ? "bg-emerald-500" : "bg-gray-100 dark:bg-white/[0.06]",
                        )}
                    />
                ))}
            </div>
            <p className="mt-2 text-[10.5px] font-extrabold text-emerald-600 dark:text-emerald-400">{monthRange(from, to)}</p>
        </div>
    );
}

interface CardProps {
    supply: SeasonalSupply;
    basePath: BasePath;
    canEdit: boolean;
    canDelete: boolean;
    onEdit: (supply: SeasonalSupply) => void;
    onDelete: (supply: SeasonalSupply) => void;
}

function SupplyCard({ supply, basePath, canEdit, canDelete, onEdit, onDelete }: CardProps) {
    return (
        <div className={cn(SURFACE, CARD_HOVER, "flex h-full min-w-0 flex-col p-3")}>
            <div className="flex items-start gap-3">
                <IconTile gradient={gradientOf(supply.customer)}>{initialOf(supply.customer_name)}</IconTile>

                <div className="min-w-0 flex-1">
                    <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0">
                            <Link
                                href={`${basePath}/customer/${supply.customer}/`}
                                className="block truncate text-[13px] font-extrabold text-gray-900 transition hover:text-indigo-500 dark:text-white"
                            >
                                {supply.customer_name}
                            </Link>
                            <div className="mt-1.5 flex items-center gap-1.5">
                                <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-md bg-gray-100 dark:bg-white/[0.06]">
                                    <Package size={10} className="text-gray-400" />
                                </span>
                                <span className="truncate text-[10.5px] font-semibold text-gray-400">{supply.product_name}</span>
                            </div>
                        </div>

                        {(canEdit || canDelete) && (
                            <div className="flex shrink-0 items-center gap-1">
                                {canEdit && (
                                    <IconAction label="ویرایش" tone="sky" onClick={() => onEdit(supply)}>
                                        <Pencil size={13} />
                                    </IconAction>
                                )}
                                {canDelete && (
                                    <IconAction label="حذف" tone="rose" onClick={() => onDelete(supply)}>
                                        <Trash2 size={13} />
                                    </IconAction>
                                )}
                            </div>
                        )}
                    </div>
                </div>
            </div>

            <div className="mt-3"><Divider /></div>

            <div className={cn(INSET, "mt-3")}>
                <SeasonBar from={supply.start_month} to={supply.end_month} />
            </div>

            {(supply.expected_quantity_kg || supply.phone_number) && (
                <div className="mt-1.5 flex flex-wrap items-center gap-1.5">
                    {supply.expected_quantity_kg && (
                        <Chip tone="indigo">حدود {formatWeight(supply.expected_quantity_kg)}</Chip>
                    )}
                    {supply.phone_number && (
                        <a href={`tel:${supply.phone_number}`} dir="ltr">
                            <Chip tone="gray" icon={<Phone size={9} />}>{supply.phone_number}</Chip>
                        </a>
                    )}
                </div>
            )}

            {supply.notes && (
                <p className="mt-2 line-clamp-2 break-words text-[10.5px] font-semibold leading-5 text-gray-400">{supply.notes}</p>
            )}
        </div>
    );
}

export default function SupplyListTab({ basePath }: { basePath: BasePath }) {
    const { can } = usePermissions();
    const list = usePaginatedList<SeasonalSupply>(
        (params, signal) => seasonalApi.page(params, signal),
        { pageSize: 16 },
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
    const canEdit = can("seasonal", "edit");
    const canDelete = can("seasonal", "delete");

    return (
        <>
            <PageToolbar
                icon={<ListChecks size={18} />}
                title="فهرست فصلی"
                subtitle="هر مشتری چه کالایی را در چه ماه‌هایی دارد"
                count={list.count}
                search={<SearchPill value={list.search} onChange={list.setSearch} placeholder="مشتری یا کالا..." />}
                actions={
                    can("seasonal", "create") ? (
                        <PillButton icon={<Plus size={13} />} onClick={() => openForm(null)}>
                            افزودن
                        </PillButton>
                    ) : undefined
                }
                stats={[
                    { label: "کل موارد", value: formatNumber(list.count) },
                    { label: "مشتریان این صفحه", value: formatNumber(customersShown), tone: "indigo" },
                    { label: "کالاهای این صفحه", value: formatNumber(productsShown), tone: "emerald" },
                    { label: "صفحه", value: `${formatNumber(list.page)} از ${formatNumber(list.totalPages || 1)}`, tone: "amber" },
                ]}
            />

            {list.loading ? (
                <HumanResourceCardSkeleton count={8} className={GRID} />
            ) : list.error ? (
                <StateCard kind="error" title="دریافت فهرست ناموفق بود" description="ارتباط با سرور برقرار نشد. لطفاً دوباره تلاش کنید." onRetry={list.refetch} />
            ) : list.data.length === 0 ? (
                <StateCard
                    icon={<Sprout size={19} />}
                    title="هنوز موردی ثبت نشده است"
                    description="مثلاً: آقای الف، جو، از خرداد تا تیر."
                />
            ) : (
                <div className={GRID}>
                    {list.data.map((supply, i) => (
                        <Stagger key={supply.id} index={i}>
                            <SupplyCard
                                supply={supply}
                                basePath={basePath}
                                canEdit={canEdit}
                                canDelete={canDelete}
                                onEdit={openForm}
                                onDelete={setToDelete}
                            />
                        </Stagger>
                    ))}
                </div>
            )}

            {list.totalPages > 1 && (
                <Pagination page={list.page} totalPages={list.totalPages} onChange={list.setPage} />
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
        </>
    );
}
