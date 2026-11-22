"use client";

import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { CalendarClock, Check, Loader2, Plus, SquarePen, Trash2 } from "lucide-react";
import SearchInput from "@/components/admin/production/SearchInput";
import Pagination from "@/components/ui/Pagination";
import axiosInstance from "@/lib/axiosInstance";
import { fetchPage, listAll } from "@/lib/api/_core";
import { usePaginatedList } from "@/hooks/usePaginatedList";
import { toPersianDigits } from "@/lib/jalali";
import { formatProductionInteger } from "@/lib/productionFormat";
import {
    ErrorBanner,
    JalaliDatePicker,
    FloatingInput,
    ModalShell,
    NiceSelect,
    NumberField,
    SOFT_BUTTON,
    isoToJalaliString,
    parseBackendError,
    todayGregorian,
    type Machine,
    type Product,
} from "@/components/admin/production/shared";

interface DailyStandard {
    id: number;
    date: string;
    product: number;
    product_name: string;
    product_code: string;
    machine: number | null;
    machine_name: string | null;
    std_production_per_hour: string | number | null;
    std_waste_per_hour: string | number | null;
    reason: string;
    logs_count: number;
}

type Filters = { date?: string; date_from?: string; date_to?: string; product_id?: number; machine_id?: number };

const BASE = "/production/api/v1/daily-standard/";

function Modal({ item, products, machines, onClose, onSaved }: {
    item: DailyStandard | null;
    products: Product[];
    machines: Machine[];
    onClose: () => void;
    onSaved: () => void;
}) {
    const [date, setDate] = useState(item?.date ?? todayGregorian());
    const [product, setProduct] = useState<number | null>(item?.product ?? null);
    const [machine, setMachine] = useState<number | null>(item?.machine ?? null);
    const [prod, setProd] = useState(item?.std_production_per_hour != null ? String(item.std_production_per_hour) : "");
    const [waste, setWaste] = useState(item?.std_waste_per_hour != null ? String(item.std_waste_per_hour) : "");
    const [reason, setReason] = useState(item?.reason ?? "");
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState("");

    const canSubmit = !!date && product !== null && !saving;

    async function save() {
        if (!canSubmit) return;
        setSaving(true);
        setError("");
        const payload: Record<string, unknown> = { date, product, machine, reason: reason.trim() };
        if (prod !== "") payload.std_production_per_hour = prod;
        if (waste !== "") payload.std_waste_per_hour = waste;
        try {
            if (item) await axiosInstance.patch(`${BASE}${item.id}/update/`, payload);
            else await axiosInstance.post(`${BASE}create/`, payload);
            onSaved();
        } catch (e) {
            const err = e as { response?: { data?: { non_field_errors?: string[] } } };
            setError(err.response?.data?.non_field_errors?.[0] ?? parseBackendError(e, "ذخیره استاندارد روزانه انجام نشد"));
        } finally {
            setSaving(false);
        }
    }

    return (
        <ModalShell
            icon={<CalendarClock size={15} className="text-blue-500" />}
            title={item ? "ویرایش استاندارد روزانه" : "استاندارد روزانه جدید"}
            subtitle="تغییر استاندارد یک محصول در یک روز خاص"
            locked={saving}
            onClose={onClose}
            footer={
                <>
                    <motion.button
                        type="button"
                        whileTap={{ scale: 0.97 }}
                        onClick={save}
                        disabled={!canSubmit}
                        className="flex h-11 flex-1 items-center justify-center gap-2 rounded-full bg-blue-600 text-[13px] font-bold text-white hover:bg-blue-500 disabled:opacity-40"
                    >
                        {saving ? <Loader2 size={15} className="animate-spin" /> : (<><Check size={14} strokeWidth={3} />ذخیره</>)}
                    </motion.button>
                    <button type="button" onClick={onClose} disabled={saving} className={`h-11 px-6 ${SOFT_BUTTON}`}>انصراف</button>
                </>
            }
        >
            <ErrorBanner message={error} onClose={() => setError("")} />
            <JalaliDatePicker label="تاریخ" value={date} onChange={setDate} required />
            <NiceSelect
                label="محصول"
                placeholder="انتخاب محصول"
                emptyText="محصولی یافت نشد"
                options={products.filter((p) => p.is_active || p.id === item?.product).map((p) => ({ id: p.id, label: p.name, sub: p.code }))}
                value={product}
                onChange={setProduct}
            />
            <NiceSelect
                label="دستگاه (خالی = همه دستگاه‌ها)"
                placeholder="همه دستگاه‌ها"
                emptyText="دستگاهی یافت نشد"
                options={machines.map((m) => ({ id: m.id, label: m.name, sub: m.code }))}
                value={machine}
                onChange={setMachine}
            />
            {machine !== null && (
                <button type="button" onClick={() => setMachine(null)} className="text-[11px] font-bold text-blue-500">
                    پاک کردن دستگاه (همه دستگاه‌ها)
                </button>
            )}
            <div className="grid grid-cols-2 gap-3">
                <NumberField
                    label="تولید استاندارد در ساعت"
                    value={prod}
                    displayValue={prod !== "" && Number.isFinite(Number(prod)) ? String(Math.round(Number(prod))) : ""}
                    onChange={setProd}
                    step="1"
                    min="0"
                />
                <NumberField
                    label="ضایعات استاندارد در ساعت"
                    value={waste}
                    displayValue={waste !== "" && Number.isFinite(Number(waste)) ? String(Math.round(Number(waste))) : ""}
                    onChange={setWaste}
                    step="1"
                    min="0"
                />
            </div>
            <p className="text-[10.5px] text-gray-400">اگر خالی بگذارید هنگام ایجاد، از استاندارد فعلی محصول پر می‌شود.</p>
            <FloatingInput id="ds_reason" label="دلیل تغییر (اختیاری)" value={reason} onChange={setReason} />
        </ModalShell>
    );
}

export default function Page() {
    const [products, setProducts] = useState<Product[]>([]);
    const [machines, setMachines] = useState<Machine[]>([]);
    const [error, setError] = useState("");
    const [busyId, setBusyId] = useState<number | null>(null);
    const [modal, setModal] = useState<{ open: boolean; item: DailyStandard | null }>({ open: false, item: null });

    useEffect(() => {
        listAll<Product>("/production/api/v1/product/").then(setProducts).catch(() => {});
        listAll<Machine>("/production/api/v1/machine/").then(setMachines).catch(() => {});
    }, []);

    const list = usePaginatedList<DailyStandard, Filters>(
        (params, signal) => fetchPage<DailyStandard>(BASE, params, signal),
        { pageSize: 12 },
    );
    const { data: items, count, page, totalPages, search, loading, setSearch, setPage, refetch, filters, setFilters } = list;

    async function remove(it: DailyStandard) {
        if (!window.confirm("این استاندارد روزانه حذف شود؟ ثبت‌های آن روز به استاندارد فعلی محصول برمی‌گردند.")) return;
        setBusyId(it.id);
        try {
            await axiosInstance.delete(`${BASE}${it.id}/delete/`);
            await refetch();
        } catch (e) {
            setError(parseBackendError(e, "حذف انجام نشد"));
        } finally {
            setBusyId(null);
        }
    }

    return (
        <section className="space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-3">
                <h2 className="flex items-center gap-2 text-[13px] font-extrabold text-gray-900 dark:text-white">
                    <CalendarClock size={15} className="text-indigo-500" />
                    استاندارد روزانه ({toPersianDigits(count)})
                </h2>
                <SearchInput value={search} onChange={setSearch} placeholder="جستجوی محصول، دستگاه یا دلیل..." />
                <button
                    type="button"
                    onClick={() => setModal({ open: true, item: null })}
                    className="flex h-9 items-center gap-1.5 rounded-full bg-blue-600 px-4 text-[12px] font-bold text-white hover:bg-blue-500"
                >
                    <Plus size={14} /> استاندارد جدید
                </button>
            </div>

            <div className="grid grid-cols-1 gap-3 sm:grid-cols-4">
                <JalaliDatePicker label="تاریخ دقیق" value={filters.date ?? ""} onChange={(v) => setFilters({ ...filters, date: v || undefined })} />
                <JalaliDatePicker label="از تاریخ" value={filters.date_from ?? ""} onChange={(v) => setFilters({ ...filters, date_from: v || undefined })} />
                <JalaliDatePicker label="تا تاریخ" value={filters.date_to ?? ""} onChange={(v) => setFilters({ ...filters, date_to: v || undefined })} />
                <NiceSelect
                    label="محصول"
                    placeholder="همه محصولات"
                    emptyText="—"
                    options={products.map((p) => ({ id: p.id, label: p.name, sub: p.code }))}
                    value={filters.product_id ?? null}
                    onChange={(v) => setFilters({ ...filters, product_id: v ?? undefined })}
                />
                <NiceSelect
                    label="دستگاه"
                    placeholder="همه دستگاه‌ها"
                    emptyText="—"
                    options={machines.map((m) => ({ id: m.id, label: m.name, sub: m.code }))}
                    value={filters.machine_id ?? null}
                    onChange={(v) => setFilters({ ...filters, machine_id: v ?? undefined })}
                />
            </div>

            <ErrorBanner message={error || (list.error ? parseBackendError(list.error, "دریافت اطلاعات انجام نشد") : "")} onClose={() => setError("")} />

            <div className="overflow-x-auto rounded-2xl border border-black/5 bg-white dark:border-white/5 dark:bg-white/[0.02]">
                {loading ? (
                    <div className="flex justify-center py-12"><Loader2 className="animate-spin text-gray-400" /></div>
                ) : items.length === 0 ? (
                    <p className="py-12 text-center text-[12px] text-gray-400">استاندارد روزانه‌ای ثبت نشده است</p>
                ) : (
                    <table className="w-full text-right text-[12px]">
                        <thead className="text-[11px] text-gray-400">
                            <tr>
                                {["تاریخ", "محصول", "دستگاه", "تولید/ساعت", "ضایعات/ساعت", "دلیل", "ثبت‌های اثرپذیر", ""].map((h, i) => (
                                    <th key={i} className="px-4 py-3 font-bold">{h}</th>
                                ))}
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-black/5 dark:divide-white/5">
                            {items.map((it) => (
                                <tr key={it.id}>
                                    <td className="px-4 py-3 font-bold">{toPersianDigits(isoToJalaliString(it.date))}</td>
                                    <td className="px-4 py-3">{it.product_name} <span className="font-mono text-gray-400">{it.product_code}</span></td>
                                    <td className="px-4 py-3">{it.machine_name ?? "همه دستگاه‌ها"}</td>
                                    <td className="px-4 py-3 font-bold">{formatProductionInteger(Number(it.std_production_per_hour ?? 0))}</td>
                                    <td className="px-4 py-3 font-bold text-red-500">{formatProductionInteger(Number(it.std_waste_per_hour ?? 0))}</td>
                                    <td className="px-4 py-3 text-gray-500">{it.reason || "—"}</td>
                                    <td className="px-4 py-3">{toPersianDigits(it.logs_count)}</td>
                                    <td className="px-4 py-3">
                                        <div className="flex items-center justify-end gap-2">
                                            {busyId === it.id && <Loader2 size={14} className="animate-spin text-gray-400" />}
                                            <button type="button" onClick={() => setModal({ open: true, item: it })} className="text-gray-400 hover:text-blue-500"><SquarePen size={14} /></button>
                                            <button type="button" onClick={() => remove(it)} className="text-gray-400 hover:text-red-500"><Trash2 size={14} /></button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                )}
            </div>

            {totalPages > 1 && <Pagination page={page} totalPages={totalPages} onChange={setPage} />}

            <AnimatePresence>
                {modal.open && (
                    <Modal
                        key="ds-modal"
                        item={modal.item}
                        products={products}
                        machines={machines}
                        onClose={() => setModal({ open: false, item: null })}
                        onSaved={() => { setModal({ open: false, item: null }); refetch(); }}
                    />
                )}
            </AnimatePresence>
        </section>
    );
}
