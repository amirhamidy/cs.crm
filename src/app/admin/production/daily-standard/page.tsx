"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { Pencil, Plus, Trash2, X, Loader2 } from "lucide-react";
import axiosInstance from "@/lib/axiosInstance";
import { fetchPage, listAll } from "@/lib/api";
import Pagination from "@/components/ui/Pagination";
import SearchInput from "@/components/admin/production/SearchInput";
import { useDebounced } from "@/components/admin/production/useServerSearch";
import { useProductionData } from "@/components/admin/production/ProductionContext";
import { toPersianDigits } from "@/lib/jalali";
import {
    ErrorBanner,
    isoToJalaliString,
    JalaliDatePicker,
    NiceSelect,
    NumberField,
    Option,
    Product,
} from "@/components/admin/production/shared";

interface DailyStandard {
    id: number;
    date: string;
    product: number;
    product_name: string;
    product_code: string;
    machine: number | null;
    machine_name: string | null;
    std_production_per_hour: string | number;
    std_waste_per_hour: string | number;
    reason: string;
    logs_count: number;
}

const BASE = "/production/api/v1/daily-standard/";
const PAGE_SIZE = 20;
const today = () => new Date().toISOString().slice(0, 10);

function errMsg(e: unknown): string {
    const data = (e as { response?: { data?: unknown } })?.response?.data;
    if (!data) return "خطا در ارتباط با سرور";
    if (typeof data === "string") return data;
    const d = data as Record<string, unknown>;
    const parts: string[] = [];
    for (const v of Object.values(d)) parts.push(Array.isArray(v) ? v.join(" ") : String(v));
    return parts.join(" | ") || "خطا در ذخیره";
}

export default function DailyStandardPage() {
    const { machineOptions } = useProductionData(["machines"]);
    const [products, setProducts] = useState<Product[]>([]);
    const [rows, setRows] = useState<DailyStandard[]>([]);
    const [count, setCount] = useState(0);
    const [page, setPage] = useState(1);
    const [search, setSearch] = useState("");
    const dSearch = useDebounced(search, 400);
    const [dateFrom, setDateFrom] = useState("");
    const [dateTo, setDateTo] = useState("");
    const [productId, setProductId] = useState<number | null>(null);
    const [machineId, setMachineId] = useState<number | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [notice, setNotice] = useState("");
    const [editing, setEditing] = useState<DailyStandard | "new" | null>(null);
    const [deleting, setDeleting] = useState<DailyStandard | null>(null);

    useEffect(() => {
        const q = new URLSearchParams(window.location.search);
        const pr = q.get("product"), d = q.get("date");
        if (pr) setProductId(Number(pr));
        if (d) { setDateFrom(d); setDateTo(d); }
    }, []);

    useEffect(() => {
        listAll<Product>("/production/api/v1/product/").then(setProducts).catch(() => {});
    }, []);

    const productOptions = useMemo<Option[]>(
        () => products.map((p) => ({ id: p.id, label: p.name, sub: `کد: ${p.code}${p.is_active ? "" : " (غیرفعال)"}` })),
        [products]
    );

    const load = useCallback(() => {
        setLoading(true);
        fetchPage<DailyStandard>(BASE, {
            page,
            page_size: PAGE_SIZE,
            search: dSearch.trim() || undefined,
            date_from: dateFrom || undefined,
            date_to: dateTo || undefined,
            product_id: productId ?? undefined,
            machine_id: machineId ?? undefined,
        })
            .then((r) => {
                setRows(r.results);
                setCount(r.count);
                setError("");
            })
            .catch((e) => setError(errMsg(e)))
            .finally(() => setLoading(false));
    }, [page, dSearch, dateFrom, dateTo, productId, machineId]);

    useEffect(load, [load]);
    useEffect(() => setPage(1), [dSearch, dateFrom, dateTo, productId, machineId]);

    const remove = async () => {
        if (!deleting) return;
        try {
            await axiosInstance.delete(`${BASE}${deleting.id}/delete/`);
            setDeleting(null);
            setNotice("استاندارد روزانه حذف شد");
            load();
        } catch (e) {
            setError(errMsg(e));
            setDeleting(null);
        }
    };

    return (
        <div className="space-y-4">
            <div className="flex flex-wrap items-end gap-3">
                <SearchInput value={search} onChange={setSearch} placeholder="جستجوی محصول، دستگاه، دلیل..." />
                <div className="w-44"><JalaliDatePicker label="از تاریخ" value={dateFrom} onChange={setDateFrom} /></div>
                <div className="w-44"><JalaliDatePicker label="تا تاریخ" value={dateTo} onChange={setDateTo} /></div>
                <div className="w-52">
                    <NiceSelect label="محصول" options={[{ id: null as unknown as number, label: "همه", sub: "" }, ...productOptions]} value={productId} onChange={setProductId} placeholder="همه" emptyText="موردی نیست" />
                </div>
                <div className="w-52">
                    <NiceSelect label="ماشین" options={[{ id: null as unknown as number, label: "همه", sub: "" }, ...machineOptions]} value={machineId} onChange={setMachineId} placeholder="همه" emptyText="موردی نیست" />
                </div>
                <button onClick={() => setEditing("new")} className="mr-auto flex h-9 items-center gap-1.5 rounded-full bg-blue-600 px-4 text-[12px] font-bold text-white">
                    <Plus size={14} /> استاندارد روزانه جدید
                </button>
            </div>

            <ErrorBanner message={error} onClose={() => setError("")} />
            {notice && (
                <p className="rounded-xl bg-emerald-500/10 px-3 py-2 text-[11px] font-bold text-emerald-600" onClick={() => setNotice("")}>
                    {notice}
                </p>
            )}

            <div className="overflow-hidden rounded-2xl border border-black/[0.06] bg-[#fafafa] dark:border-white/[0.06] dark:bg-white/[0.02]">
                <div className="overflow-x-auto">
                    <table className="w-full min-w-[900px] border-collapse text-right text-[12px]">
                        <thead>
                            <tr className="border-b border-black/5 text-[11px] text-gray-400 dark:border-white/5">
                                {["تاریخ", "محصول", "ماشین", "استاندارد تولید/ساعت", "استاندارد ضایعات/ساعت", "دلیل", "سوابق متاثر", ""].map((h, i) => (
                                    <th key={i} className="whitespace-nowrap px-4 py-3 font-bold">{h}</th>
                                ))}
                            </tr>
                        </thead>
                        <tbody>
                            {loading ? (
                                <tr><td colSpan={8} className="py-10 text-center text-gray-400"><Loader2 className="mx-auto animate-spin" size={16} /></td></tr>
                            ) : rows.length === 0 ? (
                                <tr><td colSpan={8} className="py-10 text-center text-gray-400">موردی یافت نشد</td></tr>
                            ) : (
                                rows.map((r) => (
                                    <tr key={r.id} className="border-b border-black/5 last:border-0 dark:border-white/5">
                                        <td className="px-4 py-3 font-mono">{toPersianDigits(isoToJalaliString(r.date))}</td>
                                        <td className="px-4 py-3 font-bold">{r.product_name} <span className="font-mono text-[10px] text-gray-400">({r.product_code})</span></td>
                                        <td className="px-4 py-3">{r.machine_name ?? <span className="text-gray-400">همه ماشین‌ها</span>}</td>
                                        <td className="px-4 py-3 font-bold">{toPersianDigits(Number(r.std_production_per_hour))}</td>
                                        <td className="px-4 py-3 font-bold">{toPersianDigits(Number(r.std_waste_per_hour))}</td>
                                        <td className="max-w-[220px] truncate px-4 py-3 text-gray-500" title={r.reason}>{r.reason || "—"}</td>
                                        <td className="px-4 py-3">{toPersianDigits(r.logs_count)}</td>
                                        <td className="px-4 py-3">
                                            <div className="flex gap-1">
                                                <button onClick={() => setEditing(r)} className="rounded-lg p-1.5 text-blue-600 hover:bg-blue-500/10"><Pencil size={14} /></button>
                                                <button onClick={() => setDeleting(r)} className="rounded-lg p-1.5 text-red-500 hover:bg-red-500/10"><Trash2 size={14} /></button>
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
            {count > PAGE_SIZE && <Pagination page={page} totalPages={Math.ceil(count / PAGE_SIZE)} onChange={setPage} />}

            {editing && (
                <StandardModal
                    item={editing === "new" ? null : editing}
                    productOptions={productOptions}
                    products={products}
                    machineOptions={machineOptions}
                    onClose={() => setEditing(null)}
                    onSaved={(saved) => {
                        setEditing(null);
                        setNotice(`ذخیره شد؛ ${toPersianDigits(saved.logs_count)} سابقه تولید با این استاندارد محاسبه می‌شود`);
                        load();
                    }}
                />
            )}

            {deleting && (
                <Overlay onClose={() => setDeleting(null)}>
                    <h3 className="mb-2 text-sm font-black">حذف استاندارد روزانه</h3>
                    <p className="mb-4 text-[12px] text-gray-500">
                        {toPersianDigits(deleting.logs_count)} سابقه به استاندارد عادی محصول برمی‌گردد. ادامه می‌دهید؟
                    </p>
                    <div className="flex justify-end gap-2">
                        <button onClick={() => setDeleting(null)} className="rounded-xl px-4 py-2 text-[12px] font-bold text-gray-500">انصراف</button>
                        <button onClick={remove} className="rounded-xl bg-red-600 px-4 py-2 text-[12px] font-bold text-white">حذف</button>
                    </div>
                </Overlay>
            )}
        </div>
    );
}

function Overlay({ children, onClose }: { children: React.ReactNode; onClose: () => void }) {
    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4" onClick={onClose}>
            <div className="relative w-full max-w-md space-y-3 rounded-3xl bg-white p-5 dark:bg-[#0f172a]" onClick={(e) => e.stopPropagation()}>
                <button onClick={onClose} className="absolute left-4 top-4 text-gray-400"><X size={16} /></button>
                {children}
            </div>
        </div>
    );
}

function StandardModal({
    item, productOptions, products, machineOptions, onClose, onSaved,
}: {
    item: DailyStandard | null;
    productOptions: Option[];
    products: Product[];
    machineOptions: Option[];
    onClose: () => void;
    onSaved: (r: DailyStandard) => void;
}) {
    const [date, setDate] = useState(item?.date.slice(0, 10) ?? today());
    const [product, setProduct] = useState<number | null>(item?.product ?? null);
    const [machine, setMachine] = useState<number | null>(item?.machine ?? null);
    const [prod, setProd] = useState(item ? String(Number(item.std_production_per_hour)) : "");
    const [waste, setWaste] = useState(item ? String(Number(item.std_waste_per_hour)) : "");
    const [reason, setReason] = useState(item?.reason ?? "");
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState("");

    const selected = products.find((p) => p.id === product);

    const submit = async () => {
        if (!date) return setError("تاریخ الزامی است");
        if (!product) return setError("محصول الزامی است");
        if ((prod !== "" && Number(prod) < 0) || (waste !== "" && Number(waste) < 0)) return setError("مقادیر نمی‌توانند منفی باشند");
        const payload: Record<string, unknown> = { date, product, machine, reason };
        if (prod !== "") payload.std_production_per_hour = prod;
        if (waste !== "") payload.std_waste_per_hour = waste;
        setSaving(true);
        try {
            const res = item
                ? await axiosInstance.put(`${BASE}${item.id}/update/`, payload)
                : await axiosInstance.post(`${BASE}create/`, payload);
            onSaved(res.data as DailyStandard);
        } catch (e) {
            setError(errMsg(e));
        } finally {
            setSaving(false);
        }
    };

    return (
        <Overlay onClose={onClose}>
            <h3 className="text-sm font-black">{item ? "ویرایش استاندارد روزانه" : "استاندارد روزانه جدید"}</h3>
            <JalaliDatePicker label="تاریخ" value={date} onChange={setDate} required />
            <NiceSelect label="محصول" options={productOptions} value={product} onChange={setProduct} placeholder="انتخاب محصول" emptyText="محصولی نیست" />
            <NiceSelect
                label="ماشین (اختیاری؛ خالی = همه ماشین‌ها)"
                options={[{ id: null as unknown as number, label: "همه ماشین‌ها", sub: "" }, ...machineOptions]}
                value={machine}
                onChange={setMachine}
                placeholder="همه ماشین‌ها"
                emptyText="ماشینی نیست"
            />
            {selected && !item && (
                <p className="text-[10px] text-gray-400">
                    خالی بگذارید تا از استاندارد فعلی محصول پر شود ({toPersianDigits(Number(selected.std_production_per_hour))} تولید / {toPersianDigits(Number(selected.std_waste_per_hour))} ضایعات)
                </p>
            )}
            <NumberField label="استاندارد تولید در ساعت" value={prod} onChange={setProd} min="0" />
            <NumberField label="استاندارد ضایعات در ساعت" value={waste} onChange={setWaste} min="0" />
            <label className="block text-[11px] font-bold text-gray-500">
                دلیل
                <textarea value={reason} onChange={(e) => setReason(e.target.value)} rows={2} className="mt-1 w-full rounded-xl border border-gray-100 bg-gray-50 p-2 text-[12px] outline-none dark:border-white/[0.06] dark:bg-white/[0.03]" />
            </label>
            <ErrorBanner message={error} onClose={() => setError("")} />
            <div className="flex justify-end gap-2">
                <button onClick={onClose} className="rounded-xl px-4 py-2 text-[12px] font-bold text-gray-500">انصراف</button>
                <button disabled={saving} onClick={submit} className="rounded-xl bg-blue-600 px-4 py-2 text-[12px] font-bold text-white disabled:opacity-50">
                    {saving ? "در حال ذخیره..." : "ذخیره"}
                </button>
            </div>
        </Overlay>
    );
}
