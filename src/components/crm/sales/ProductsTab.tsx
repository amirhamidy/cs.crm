"use client";

import { useState } from "react";
import { Check, Package, Pencil, Plus, Trash2, X } from "lucide-react";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import Pagination from "@/components/ui/Pagination";
import { HumanResourceCardSkeleton } from "@/components/ui/skeletons";
import { Switch } from "@/components/ui/Switch";
import { toast } from "@/components/notifications/toast";
import { usePaginatedList } from "@/hooks/usePaginatedList";
import { usePermissions } from "@/hooks/usePermissions";
import { productsApi } from "@/lib/api";
import { apiMessage } from "@/lib/apiMessage";
import { formatNumber } from "@/lib/crm/format";
import type { FeedProduct } from "@/types/crm";
import {
    CARD_HOVER,
    Chip,
    Divider,
    GRID,
    IconAction,
    IconTile,
    PageToolbar,
    PillButton,
    SURFACE,
    StateCard,
    Stagger,
    gradientOf,
    initialOf,
} from "../shared/kit";
import { cn } from "@/lib/utils";

function ProductCard({
    product,
    onChanged,
    onDelete,
    canEdit,
    canDelete,
}: {
    product: FeedProduct;
    onChanged: () => void;
    onDelete: (p: FeedProduct) => void;
    canEdit: boolean;
    canDelete: boolean;
}) {
    const [editing, setEditing] = useState(false);
    const [name, setName] = useState(product.name);
    const [busy, setBusy] = useState(false);

    async function patch(payload: Partial<Pick<FeedProduct, "name" | "is_active">>) {
        setBusy(true);
        try {
            await productsApi.update(product.id, payload);
            onChanged();
            return true;
        } catch (e) {
            toast.error(apiMessage(e, "ذخیره‌ی تغییرات ناموفق بود"));
            return false;
        } finally {
            setBusy(false);
        }
    }

    async function save() {
        if (!name.trim()) return;
        if (await patch({ name: name.trim() })) setEditing(false);
    }

    function cancel() {
        setEditing(false);
        setName(product.name);
    }

    return (
        <div className={cn(SURFACE, CARD_HOVER, "flex h-full min-w-0 flex-col p-3")}>
            <div className="flex items-start gap-3">
                <IconTile gradient={gradientOf(product.id)}>{initialOf(product.name, "ک")}</IconTile>

                <div className="min-w-0 flex-1">
                    <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0 flex-1">
                            {editing ? (
                                <input
                                    autoFocus
                                    value={name}
                                    onChange={(e) => setName(e.target.value)}
                                    onKeyDown={(e) => {
                                        if (e.key === "Enter") void save();
                                        if (e.key === "Escape") cancel();
                                    }}
                                    className="h-8 w-full rounded-lg border border-gray-200 bg-white px-2.5 text-[12px] font-extrabold text-gray-900 outline-none focus:border-indigo-400 dark:border-white/10 dark:bg-white/5 dark:text-white"
                                />
                            ) : (
                                <h3
                                    className={cn(
                                        "break-words text-[13px] font-extrabold",
                                        product.is_active ? "text-gray-900 dark:text-white" : "text-gray-400 line-through",
                                    )}
                                >
                                    {product.name}
                                </h3>
                            )}
                            {!editing && (
                                <div className="mt-1.5">
                                    <Chip tone={product.is_active ? "emerald" : "gray"}>
                                        {product.is_active ? "فعال" : "غیرفعال"}
                                    </Chip>
                                </div>
                            )}
                        </div>

                        <div className="flex shrink-0 items-center gap-1">
                            {editing ? (
                                <>
                                    <IconAction label="ذخیره" tone="indigo" disabled={busy || !name.trim()} onClick={() => void save()}>
                                        <Check size={13} />
                                    </IconAction>
                                    <IconAction label="انصراف" onClick={cancel}>
                                        <X size={13} />
                                    </IconAction>
                                </>
                            ) : (
                                <>
                                    {canEdit && (
                                        <IconAction label="تغییر نام" tone="sky" onClick={() => setEditing(true)}>
                                            <Pencil size={13} />
                                        </IconAction>
                                    )}
                                    {canDelete && (
                                        <IconAction label="حذف" tone="rose" onClick={() => onDelete(product)}>
                                            <Trash2 size={13} />
                                        </IconAction>
                                    )}
                                </>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            {canEdit && (
                <>
                    <div className="mt-3"><Divider /></div>
                    <div className="mt-3 flex items-center justify-between gap-2 rounded-xl bg-gray-50 px-2.5 py-2 dark:bg-white/[0.035]">
                        <span className="text-[10.5px] font-bold text-gray-500 dark:text-gray-300">قابل فروش</span>
                        <Switch
                            checked={product.is_active}
                            disabled={busy}
                            aria-label="فعال بودن کالا"
                            onChange={(v) => void patch({ is_active: v })}
                        />
                    </div>
                </>
            )}
        </div>
    );
}

function ProductsPanel() {
    const { can } = usePermissions();
    const canCreate = can("products", "create");
    const canEdit = can("products", "edit");
    const canDelete = can("products", "delete");
    const list = usePaginatedList<FeedProduct>(
        (params, signal) => productsApi.page(params, signal),
        { pageSize: 20 },
    );

    const [name, setName] = useState("");
    const [adding, setAdding] = useState(false);
    const [toDelete, setToDelete] = useState<FeedProduct | null>(null);
    const [deleting, setDeleting] = useState(false);
    const [deleteError, setDeleteError] = useState<string | null>(null);

    async function add() {
        const value = name.trim();
        if (!value) return;
        setAdding(true);
        try {
            await productsApi.create(value);
            setName("");
            list.refetch();
            toast.success("کالا اضافه شد");
        } catch (e) {
            toast.error(apiMessage(e, "افزودن کالا ناموفق بود"));
        } finally {
            setAdding(false);
        }
    }

    async function confirmDelete() {
        if (!toDelete) return;
        setDeleting(true);
        setDeleteError(null);
        try {
            await productsApi.remove(toDelete.id);
            setToDelete(null);
            list.refetch();
            toast.success("کالا حذف شد");
        } catch (e) {
            setDeleteError(apiMessage(e, "حذف کالا ناموفق بود"));
        } finally {
            setDeleting(false);
        }
    }

    const activeCount = list.data.filter((p) => p.is_active).length;

    return (
        <>
            <PageToolbar
                icon={<Package size={18} />}
                title="کالاها"
                subtitle="نهاده‌هایی که می‌شود فروخت"
                count={list.count}
                actions={
                    canCreate ? (
                        <form
                            onSubmit={(e) => {
                                e.preventDefault();
                                void add();
                            }}
                            className="flex w-full items-center gap-2"
                        >
                            <input
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                                placeholder="نام کالا، مثلاً ذرت دامی"
                                maxLength={255}
                                className="h-9 min-w-0 flex-1 rounded-full border border-gray-100 bg-gray-50 px-4 text-[11px] font-semibold text-gray-800 outline-none transition placeholder:text-gray-400 focus:border-indigo-400 sm:w-56 sm:flex-none dark:border-white/[0.06] dark:bg-white/[0.03] dark:text-white"
                            />
                            <PillButton type="submit" icon={<Plus size={13} />} disabled={adding || !name.trim()}>
                                افزودن
                            </PillButton>
                        </form>
                    ) : undefined
                }
                stats={[
                    { label: "کل کالاها", value: formatNumber(list.count) },
                    { label: "فعال در این صفحه", value: formatNumber(activeCount), tone: "emerald" },
                    { label: "غیرفعال در این صفحه", value: formatNumber(list.data.length - activeCount), tone: "amber" },
                ]}
            />

            {list.loading ? (
                <HumanResourceCardSkeleton count={8} className={GRID} />
            ) : list.error ? (
                <StateCard kind="error" title="دریافت کالاها ناموفق بود" description="ارتباط با سرور برقرار نشد. لطفاً دوباره تلاش کنید." onRetry={list.refetch} />
            ) : list.data.length === 0 ? (
                <StateCard
                    icon={<Package size={19} />}
                    title="هنوز کالایی تعریف نشده است"
                    description="اولین کالا (مثلاً ذرت، جو یا کنجاله سویا) را اضافه کنید تا بتوان فروش ثبت کرد."
                />
            ) : (
                <div className={GRID}>
                    {list.data.map((p, i) => (
                        <Stagger key={p.id} index={i}>
                            <ProductCard
                                product={p}
                                onChanged={list.refetch}
                                canEdit={canEdit}
                                canDelete={canDelete}
                                onDelete={(item) => {
                                    setDeleteError(null);
                                    setToDelete(item);
                                }}
                            />
                        </Stagger>
                    ))}
                </div>
            )}

            {list.totalPages > 1 && (
                <Pagination page={list.page} totalPages={list.totalPages} onChange={list.setPage} />
            )}

            <p className="px-1 text-[10.5px] font-semibold leading-5 text-gray-400">
                کالایی که در فروش‌ها استفاده شده قابل حذف نیست؛ آن را غیرفعال کنید تا در فروش‌های جدید نمایش داده نشود.
            </p>

            <ConfirmDialog
                open={toDelete != null}
                title="حذف کالا"
                message={toDelete ? `«${toDelete.name}» حذف شود؟` : undefined}
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

export default function ProductsTab() {
    const { can, loaded } = usePermissions();

    if (!loaded) return <HumanResourceCardSkeleton count={4} className={GRID} />;

    if (!can("products", "view")) {
        return (
            <StateCard
                icon={<Package size={19} />}
                title="به این بخش دسترسی ندارید"
                description="برای دیدن کالاها باید مدیر سیستم دسترسی لازم را به حساب شما بدهد."
            />
        );
    }

    return <ProductsPanel />;
}
