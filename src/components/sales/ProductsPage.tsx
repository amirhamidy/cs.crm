"use client";

import { useCallback, useState } from "react";
import { Package, Pencil, Plus, Trash2 } from "lucide-react";
import { usePaginatedList } from "@/hooks/usePaginatedList";
import { salesApi } from "@/lib/api/sales";
import type { SearchParams } from "@/types/pagination";
import type { Product } from "@/types/sales";
import { extractFieldErrors } from "@/lib/parseApiErrors";
import { formatJalaliDate } from "@/lib/format";
import { Button } from "@/components/ui/Button";
import { Modal } from "@/components/ui/Modal";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { Switch } from "@/components/ui/Switch";
import Pagination from "@/components/ui/Pagination";
import { EmptyState, ErrorState, PageHeader, SearchInput } from "@/components/ui/Feedback";
import { TableSkeleton } from "@/components/ui/skeletons";
import { toast } from "@/components/notifications/toast";

type Filters = { active: string };

const fieldCls =
    "h-10 rounded-xl border border-gray-200 bg-white px-3 text-[13px] text-gray-800 outline-none focus:border-blue-500 dark:border-white/10 dark:bg-white/5 dark:text-gray-100";

export default function ProductsPage() {
    const fetcher = useCallback(
        (p: SearchParams & Filters) =>
            salesApi.products.list({
                page: p.page,
                page_size: p.page_size,
                search: p.search || undefined,
                active: p.active === "" ? undefined : p.active === "true",
            }),
        [],
    );
    const list = usePaginatedList<Product, Filters>(fetcher, { filters: { active: "" }, pageSize: 20 });

    const [editing, setEditing] = useState<Product | null>(null);
    const [creating, setCreating] = useState(false);
    const [name, setName] = useState("");
    const [errors, setErrors] = useState<Record<string, string>>({});
    const [saving, setSaving] = useState(false);

    const [deleting, setDeleting] = useState<Product | null>(null);
    const [delBusy, setDelBusy] = useState(false);
    const [delError, setDelError] = useState<string | undefined>();
    const [suggestDeactivate, setSuggestDeactivate] = useState(false);
    const [togglingId, setTogglingId] = useState<number | null>(null);

    const formOpen = creating || editing !== null;
    const closeForm = () => { if (saving) return; setCreating(false); setEditing(null); setErrors({}); };
    const openCreate = () => { setName(""); setErrors({}); setCreating(true); };
    const openEdit = (p: Product) => { setName(p.name); setErrors({}); setEditing(p); };

    const save = async () => {
        if (!name.trim()) { setErrors({ name: "نام محصول الزامی است" }); return; }
        setSaving(true);
        setErrors({});
        try {
            if (editing) await salesApi.products.update(editing.id, { name: name.trim() });
            else await salesApi.products.create({ name: name.trim() });
            toast.success(editing ? "محصول ویرایش شد" : "محصول ایجاد شد");
            setCreating(false);
            setEditing(null);
            list.refetch();
        } catch (e) {
            setErrors(extractFieldErrors(e, ["name", "is_active"]));
        } finally {
            setSaving(false);
        }
    };

    const toggle = async (p: Product, next: boolean) => {
        setTogglingId(p.id);
        try {
            await salesApi.products.update(p.id, { is_active: next });
            list.refetch();
        } catch (e) {
            toast.error(extractFieldErrors(e, []).general ?? "تغییر وضعیت انجام نشد");
        } finally {
            setTogglingId(null);
        }
    };

    const askDelete = (p: Product) => { setDeleting(p); setDelError(undefined); setSuggestDeactivate(false); };
    const confirmDelete = async () => {
        if (!deleting) return;
        setDelBusy(true);
        setDelError(undefined);
        try {
            await salesApi.products.remove(deleting.id);
            toast.success("محصول حذف شد");
            setDeleting(null);
            list.refetch();
        } catch (e) {
            const status = (e as { response?: { status?: number } })?.response?.status;
            setDelError(extractFieldErrors(e, []).general ?? "حذف انجام نشد");
            setSuggestDeactivate(status === 400);
        } finally {
            setDelBusy(false);
        }
    };
    const deactivateInstead = async () => {
        if (!deleting) return;
        setDelBusy(true);
        try {
            await salesApi.products.update(deleting.id, { is_active: false });
            toast.success("محصول غیرفعال شد");
            setDeleting(null);
            list.refetch();
        } catch (e) {
            setDelError(extractFieldErrors(e, []).general ?? "غیرفعال‌سازی انجام نشد");
        } finally {
            setDelBusy(false);
        }
    };

    return (
        <div className="space-y-4">
            <PageHeader title="محصولات" subtitle="مدیریت محصولات قابل فروش" icon={<Package size={20} />} />
            <div className="flex flex-wrap items-center gap-2">
                <SearchInput value={list.search} onChange={list.setSearch} placeholder="جستجوی محصول" className="min-w-56 flex-1" />
                <select aria-label="وضعیت" className={fieldCls} value={list.filters.active}
                    onChange={(e) => list.setFilters({ active: e.target.value })}>
                    <option value="">همه</option>
                    <option value="true">فعال</option>
                    <option value="false">غیرفعال</option>
                </select>
                <Button icon={<Plus size={16} />} onClick={openCreate}>محصول جدید</Button>
            </div>

            {list.loading && !list.data.length ? (
                <TableSkeleton />
            ) : list.error ? (
                <ErrorState message={typeof list.error === "string" ? list.error : "دریافت محصولات با خطا مواجه شد"} onRetry={list.refetch} />
            ) : !list.data.length ? (
                <EmptyState title="محصولی یافت نشد" icon={<Package size={28} />}
                    action={<Button onClick={openCreate}>افزودن محصول</Button>} />
            ) : (
                <div className={`overflow-x-auto rounded-2xl border border-gray-200 dark:border-white/10 ${list.loading ? "opacity-60" : ""}`}>
                    <table className="w-full min-w-[520px] text-right text-[13px]">
                        <thead className="bg-gray-50 text-gray-500 dark:bg-white/5 dark:text-gray-400">
                            <tr>{["نام", "فعال", "تاریخ ایجاد", ""].map((h) => <th key={h} className="px-3 py-3 font-bold">{h}</th>)}</tr>
                        </thead>
                        <tbody>
                            {list.data.map((p) => (
                                <tr key={p.id} className="border-t border-gray-100 dark:border-white/5">
                                    <td className="px-3 py-3 font-bold text-gray-900 dark:text-white">{p.name}</td>
                                    <td className="px-3 py-3">
                                        <Switch checked={p.is_active} disabled={togglingId === p.id}
                                            onChange={(v) => toggle(p, v)} aria-label={`فعال بودن ${p.name}`} />
                                    </td>
                                    <td className="px-3 py-3 text-gray-500">{formatJalaliDate(p.created_at)}</td>
                                    <td className="px-3 py-3">
                                        <div className="flex gap-1">
                                            <Button size="sm" variant="soft" icon={<Pencil size={14} />} onClick={() => openEdit(p)}>ویرایش</Button>
                                            <Button size="sm" variant="danger" icon={<Trash2 size={14} />} onClick={() => askDelete(p)}>حذف</Button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}

            <Pagination page={list.page} totalPages={list.totalPages} onChange={list.setPage} />

            <Modal open={formOpen} onClose={closeForm} busy={saving} title={editing ? "ویرایش محصول" : "محصول جدید"} maxWidth="max-w-md"
                footer={
                    <div className="flex gap-2">
                        <Button loading={saving} onClick={save}>ذخیره</Button>
                        <Button variant="ghost" onClick={closeForm} disabled={saving}>انصراف</Button>
                    </div>
                }>
                <div className="space-y-2">
                    <label htmlFor="product-name" className="text-[12px] font-bold text-gray-600 dark:text-gray-300">نام محصول</label>
                    <input id="product-name" className={`${fieldCls} w-full`} value={name} maxLength={150}
                        onChange={(e) => setName(e.target.value)} />
                    {errors.name && <p className="text-[12px] text-red-500">{errors.name}</p>}
                    {errors.general && <p className="text-[12px] text-red-500">{errors.general}</p>}
                </div>
            </Modal>

            <ConfirmDialog
                open={deleting !== null}
                title="حذف محصول"
                message={deleting ? `محصول «${deleting.name}» حذف شود؟` : undefined}
                confirmLabel={suggestDeactivate ? "غیرفعال‌سازی" : "حذف"}
                danger
                loading={delBusy}
                error={delError ? (suggestDeactivate ? `${delError} — به‌جای حذف می‌توانید محصول را غیرفعال کنید.` : delError) : undefined}
                onConfirm={suggestDeactivate ? deactivateInstead : confirmDelete}
                onCancel={() => { if (!delBusy) setDeleting(null); }}
            />
        </div>
    );
}
