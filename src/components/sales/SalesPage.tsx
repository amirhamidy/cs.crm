"use client";

import { useCallback, useEffect, useState } from "react";
import { Pencil, Plus, ShoppingBag, Trash2 } from "lucide-react";
import { usePaginatedList } from "@/hooks/usePaginatedList";
import { salesApi } from "@/lib/api/sales";
import { customersApi } from "@/lib/api/customers";
import type { SearchParams } from "@/types/pagination";
import type { Product, Sale, SalePayload } from "@/types/sales";
import type { Customer } from "@/types/customer";
import { extractFieldErrors } from "@/lib/parseApiErrors";
import { formatJalaliDate, formatNumber } from "@/lib/format";
import { Button } from "@/components/ui/Button";
import { Modal } from "@/components/ui/Modal";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import Pagination from "@/components/ui/Pagination";
import AsyncSelect, { type AsyncOption } from "@/components/customcomponents/shared/AsyncSelect";
import type { InfiniteFetcher } from "@/hooks/useInfiniteOptions";
import { EmptyState, ErrorState, PageHeader, SearchInput } from "@/components/ui/Feedback";
import { TableSkeleton } from "@/components/ui/skeletons";
import { toast } from "@/components/notifications/toast";

type Filters = { product: string; date_from: string; date_to: string };

const fieldCls =
    "h-10 rounded-xl border border-gray-200 bg-white px-3 text-[13px] text-gray-800 outline-none focus:border-blue-500 dark:border-white/10 dark:bg-white/5 dark:text-gray-100";

const FORM_FIELDS = ["customer", "product", "quantity_kg", "unit_price", "sale_date", "description"] as const;

const customerFetcher: InfiniteFetcher<Customer> = (p) =>
    customersApi.list({ page: p.page, page_size: p.page_size, search: p.search });
const customerOption = (c: Customer): AsyncOption => ({ id: c.id, label: c.full_name, sub: c.company_name || undefined });

function todayIso() {
    const d = new Date();
    const pad = (n: number) => String(n).padStart(2, "0");
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

/** Normalizes Persian digits / separators to a plain decimal string (not a calculation). */
const normalizeNumber = (v: string) =>
    v.replace(/[۰-۹]/g, (d) => String("۰۱۲۳۴۵۶۷۸۹".indexOf(d))).replace(/[,٬\s]/g, "").replace("٫", ".");

function useProducts() {
    const [products, setProducts] = useState<Product[]>([]);
    useEffect(() => {
        let alive = true;
        salesApi.products.list({ page_size: 100 }).then((r) => { if (alive) setProducts(r.results); }).catch(() => {});
        return () => { alive = false; };
    }, []);
    return products;
}

interface FormState {
    customer: AsyncOption | null;
    product: string;
    quantity_kg: string;
    unit_price: string;
    sale_date: string;
    description: string;
}

function SaleFormModal({ open, sale, products, onClose, onSaved }: {
    open: boolean; sale: Sale | null; products: Product[]; onClose: () => void; onSaved: () => void;
}) {
    const [form, setForm] = useState<FormState>({ customer: null, product: "", quantity_kg: "", unit_price: "", sale_date: todayIso(), description: "" });
    const [errors, setErrors] = useState<Record<string, string>>({});
    const [saving, setSaving] = useState(false);

    useEffect(() => {
        if (!open) return;
        setErrors({});
        setForm(sale
            ? { customer: { id: sale.customer, label: sale.customer_name, sub: sale.company_name || undefined }, product: String(sale.product),
                quantity_kg: sale.quantity_kg, unit_price: sale.unit_price, sale_date: sale.sale_date, description: sale.description }
            : { customer: null, product: "", quantity_kg: "", unit_price: "", sale_date: todayIso(), description: "" });
    }, [open, sale]);

    const set = (patch: Partial<FormState>) => setForm((f) => ({ ...f, ...patch }));
    const selectable = products.filter((p) => p.is_active || String(p.id) === form.product);

    const submit = async () => {
        const e: Record<string, string> = {};
        if (!form.customer) e.customer = "مشتری را انتخاب کنید";
        if (!form.product) e.product = "محصول را انتخاب کنید";
        if (!normalizeNumber(form.quantity_kg)) e.quantity_kg = "مقدار را وارد کنید";
        if (!normalizeNumber(form.unit_price)) e.unit_price = "قیمت واحد را وارد کنید";
        if (Object.keys(e).length) { setErrors(e); return; }
        const payload: SalePayload = {
            customer: form.customer!.id,
            product: Number(form.product),
            quantity_kg: normalizeNumber(form.quantity_kg),
            unit_price: normalizeNumber(form.unit_price),
            sale_date: form.sale_date || undefined,
            description: form.description,
        };
        setSaving(true);
        setErrors({});
        try {
            if (sale) await salesApi.update(sale.id, payload);
            else await salesApi.create(payload);
            toast.success(sale ? "فروش ویرایش شد" : "فروش ثبت شد");
            onSaved();
        } catch (err) {
            setErrors(extractFieldErrors(err, FORM_FIELDS));
        } finally {
            setSaving(false);
        }
    };

    const err = (k: string) => errors[k] && <p className="mt-1 text-[12px] text-red-500">{errors[k]}</p>;
    const label = "mb-1 block text-[12px] font-bold text-gray-600 dark:text-gray-300";

    return (
        <Modal open={open} onClose={() => { if (!saving) onClose(); }} busy={saving} title={sale ? "ویرایش فروش" : "ثبت فروش"} maxWidth="max-w-lg"
            footer={<div className="flex gap-2"><Button loading={saving} onClick={submit}>ذخیره</Button><Button variant="ghost" disabled={saving} onClick={onClose}>انصراف</Button></div>}>
            <div className="space-y-3">
                <div>
                    <AsyncSelect<Customer> label="مشتری" placeholder="انتخاب مشتری" emptyText="مشتری‌ای یافت نشد"
                        value={form.customer?.id ?? null} selected={form.customer} fetcher={customerFetcher}
                        toOption={customerOption} onChange={(o) => set({ customer: o })} />
                    {err("customer")}
                </div>
                <div>
                    <label htmlFor="sale-product" className={label}>محصول</label>
                    <select id="sale-product" className={`${fieldCls} w-full`} value={form.product} onChange={(e) => set({ product: e.target.value })}>
                        <option value="">انتخاب محصول</option>
                        {selectable.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
                    </select>
                    {err("product")}
                </div>
                <div className="grid grid-cols-2 gap-3">
                    <div>
                        <label htmlFor="sale-qty" className={label}>مقدار (کیلوگرم)</label>
                        <input id="sale-qty" inputMode="decimal" className={`${fieldCls} w-full`} value={form.quantity_kg} onChange={(e) => set({ quantity_kg: e.target.value })} />
                        {err("quantity_kg")}
                    </div>
                    <div>
                        <label htmlFor="sale-price" className={label}>قیمت واحد</label>
                        <input id="sale-price" inputMode="decimal" className={`${fieldCls} w-full`} value={form.unit_price} onChange={(e) => set({ unit_price: e.target.value })} />
                        {err("unit_price")}
                    </div>
                </div>
                <div>
                    <label htmlFor="sale-date" className={label}>تاریخ فروش</label>
                    <input id="sale-date" type="date" className={`${fieldCls} w-full`} value={form.sale_date} onChange={(e) => set({ sale_date: e.target.value })} />
                    {form.sale_date && <p className="mt-1 text-[11px] text-gray-500">{formatJalaliDate(form.sale_date)}</p>}
                    {err("sale_date")}
                </div>
                <div>
                    <label htmlFor="sale-desc" className={label}>توضیحات</label>
                    <textarea id="sale-desc" rows={3} className="w-full resize-none rounded-xl border border-gray-200 bg-white p-3 text-[13px] outline-none focus:border-blue-500 dark:border-white/10 dark:bg-white/5 dark:text-gray-100"
                        value={form.description} onChange={(e) => set({ description: e.target.value })} />
                    {err("description")}
                </div>
                {errors.general && <p className="text-[12px] text-red-500">{errors.general}</p>}
            </div>
        </Modal>
    );
}

export default function SalesPage() {
    const products = useProducts();

    const fetcher = useCallback(
        (p: SearchParams & Filters, signal: AbortSignal) =>
            salesApi.list({
                page: p.page,
                page_size: p.page_size,
                search: p.search || undefined,
                product: p.product ? Number(p.product) : undefined,
                date_from: p.date_from || undefined,
                date_to: p.date_to || undefined,
            }, signal),
        [],
    );
    const list = usePaginatedList<Sale, Filters>(fetcher, { filters: { product: "", date_from: "", date_to: "" }, pageSize: 20 });

    const [formOpen, setFormOpen] = useState(false);
    const [editing, setEditing] = useState<Sale | null>(null);
    const [deleting, setDeleting] = useState<Sale | null>(null);
    const [delBusy, setDelBusy] = useState(false);
    const [delError, setDelError] = useState<string | undefined>();

    const confirmDelete = async () => {
        if (!deleting) return;
        setDelBusy(true);
        setDelError(undefined);
        try {
            await salesApi.remove(deleting.id);
            toast.success("فروش حذف شد");
            setDeleting(null);
            list.refetch();
        } catch (e) {
            setDelError(extractFieldErrors(e, []).general ?? "حذف انجام نشد");
        } finally {
            setDelBusy(false);
        }
    };

    return (
        <div className="space-y-4">
            <PageHeader title="فروش‌ها" subtitle="فهرست و مدیریت فروش‌ها" icon={<ShoppingBag size={20} />} />
            <div className="flex flex-wrap items-center gap-2">
                <SearchInput value={list.search} onChange={list.setSearch} placeholder="جستجو مشتری، شرکت یا محصول" className="min-w-56 flex-1" />
                <select aria-label="محصول" className={fieldCls} value={list.filters.product} onChange={(e) => list.setFilters({ product: e.target.value })}>
                    <option value="">همه محصولات</option>
                    {products.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
                </select>
                <input type="date" aria-label="از تاریخ" className={fieldCls} value={list.filters.date_from} onChange={(e) => list.setFilters({ date_from: e.target.value })} />
                <input type="date" aria-label="تا تاریخ" className={fieldCls} value={list.filters.date_to} onChange={(e) => list.setFilters({ date_to: e.target.value })} />
                <Button icon={<Plus size={16} />} onClick={() => { setEditing(null); setFormOpen(true); }}>ثبت فروش</Button>
            </div>

            {list.loading && !list.data.length ? (
                <TableSkeleton />
            ) : list.error ? (
                <ErrorState message={typeof list.error === "string" ? list.error : "دریافت فروش‌ها با خطا مواجه شد"} onRetry={list.refetch} />
            ) : !list.data.length ? (
                <EmptyState title="فروشی یافت نشد" description="فیلترها را تغییر دهید یا فروش جدید ثبت کنید." icon={<ShoppingBag size={28} />} />
            ) : (
                <div className={`overflow-x-auto rounded-2xl border border-gray-200 dark:border-white/10 ${list.loading ? "opacity-60" : ""}`}>
                    <table className="w-full min-w-[820px] text-right text-[13px]">
                        <thead className="bg-gray-50 text-gray-500 dark:bg-white/5 dark:text-gray-400">
                            <tr>{["تاریخ", "مشتری", "محصول", "مقدار (کیلوگرم)", "قیمت واحد", "مبلغ کل", "ثبت‌کننده", ""].map((h) => <th key={h} className="px-3 py-3 font-bold">{h}</th>)}</tr>
                        </thead>
                        <tbody>
                            {list.data.map((s) => (
                                <tr key={s.id} className="border-t border-gray-100 dark:border-white/5">
                                    <td className="px-3 py-3">{formatJalaliDate(s.sale_date)}</td>
                                    <td className="px-3 py-3">
                                        <div className="font-bold text-gray-900 dark:text-white">{s.customer_name}</div>
                                        {s.company_name && <div className="text-[11px] text-gray-500">{s.company_name}</div>}
                                    </td>
                                    <td className="px-3 py-3">{s.product_name}</td>
                                    <td className="px-3 py-3">{formatNumber(s.quantity_kg)}</td>
                                    <td className="px-3 py-3">{formatNumber(s.unit_price)}</td>
                                    <td className="px-3 py-3 font-bold">{formatNumber(s.total_amount)}</td>
                                    <td className="px-3 py-3 text-gray-500">{s.created_by_username}</td>
                                    <td className="px-3 py-3">
                                        <div className="flex gap-1">
                                            <Button size="sm" variant="soft" icon={<Pencil size={14} />} onClick={() => { setEditing(s); setFormOpen(true); }}>ویرایش</Button>
                                            <Button size="sm" variant="danger" icon={<Trash2 size={14} />} onClick={() => { setDeleting(s); setDelError(undefined); }}>حذف</Button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}

            <Pagination page={list.page} totalPages={list.totalPages} onChange={list.setPage} />

            <SaleFormModal open={formOpen} sale={editing} products={products}
                onClose={() => setFormOpen(false)} onSaved={() => { setFormOpen(false); list.refetch(); }} />

            <ConfirmDialog open={deleting !== null} title="حذف فروش" message="این فروش حذف شود؟" confirmLabel="حذف" danger
                loading={delBusy} error={delError} onConfirm={confirmDelete} onCancel={() => { if (!delBusy) setDeleting(null); }} />
        </div>
    );
}
