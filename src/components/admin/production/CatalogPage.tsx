"use client";

import SearchInput from "@/components/admin/production/SearchInput";
import { useState } from "react";
import { Loader2, Package, AlertTriangle, SquarePen, Trash2, Plus } from "lucide-react";
import { AnimatePresence } from "framer-motion";
import { toPersianDigits } from "@/lib/jalali";
import { formatProductionInteger } from "@/lib/productionFormat";
import { fetchPage } from "@/lib/api/_core";
import { usePaginatedList } from "@/hooks/usePaginatedList";
import Pagination from "@/components/ui/Pagination";
import axiosInstance from "@/lib/axiosInstance";
import {
    CatalogModal,
    ErrorBanner,
    StatusSwitch,
    Product,
    Cause,
    CauseKind,
    parseBackendError,
} from "@/components/admin/production/shared";

type Item = Product | Cause;

type CatalogFilters = { kind?: string };

const PAGE_SIZE = 12;

export default function CatalogPage({ kind }: { kind: "product" | "cause" }) {
    const isProduct = kind === "product";
    const [causeFilter, setCauseFilter] = useState<"all" | CauseKind>("all");
    const [error, setError] = useState("");
    const [busyId, setBusyId] = useState<number | null>(null);
    const [modal, setModal] = useState<{ open: boolean; item: Item | null }>({ open: false, item: null });

    const list = usePaginatedList<Item, CatalogFilters>(
        (params, signal) => fetchPage<Item>(`/production/api/v1/${kind}/`, params, signal),
        { pageSize: PAGE_SIZE },
    );
    const { data: items, count, page, totalPages, search, loading, setSearch, setPage, refetch } = list;
    const load = refetch;

    function changeCauseFilter(v: "all" | CauseKind) {
        setCauseFilter(v);
        list.setFilters({ kind: v === "all" ? undefined : v });
    }

    async function toggle(it: Item) {
        setBusyId(it.id);
        try {
            await axiosInstance.patch(`/production/api/v1/${kind}/${it.id}/update/`, { is_active: !it.is_active });
            await load();
        } catch (e) {
            setError(parseBackendError(e, "تغییر وضعیت انجام نشد"));
        } finally {
            setBusyId(null);
        }
    }

    async function remove(it: Item) {
        if (!window.confirm(`«${it.name}» حذف شود؟`)) return;
        setBusyId(it.id);
        try {
            await axiosInstance.delete(`/production/api/v1/${kind}/${it.id}/delete/`);
            await load();
        } catch (e) {
            setError(parseBackendError(e, "حذف انجام نشد. در صورت استفاده در سوابق، آن را غیرفعال کنید."));
        } finally {
            setBusyId(null);
        }
    }

    const Icon = isProduct ? Package : AlertTriangle;

    return (
        <section className="space-y-4">
            <div className="flex items-center justify-between gap-3">
                <h2 className="flex items-center gap-2 text-[13px] font-extrabold text-gray-900 dark:text-white">
                    <Icon size={15} className="text-indigo-500" />
                    {isProduct ? "محصولات" : "علت‌ها"} ({toPersianDigits(count)})
                </h2>
                <SearchInput value={search} onChange={setSearch} placeholder={isProduct ? "جستجوی نام یا کد محصول..." : "جستجوی علت..."} />
                <button
                    type="button"
                    onClick={() => setModal({ open: true, item: null })}
                    className="flex h-9 items-center gap-1.5 rounded-full bg-blue-600 px-4 text-[12px] font-bold text-white hover:bg-blue-500"
                >
                    <Plus size={14} />
                    {isProduct ? "محصول جدید" : "علت جدید"}
                </button>
            </div>

            <ErrorBanner message={error || (list.error ? parseBackendError(list.error, "دریافت اطلاعات انجام نشد") : "")} onClose={() => setError("")} />

            {!isProduct && (
                <div className="flex flex-wrap gap-2">
                    {(
                        [
                            ["all", "همه"],
                            ["waste", "علت ضایعات"],
                            ["breakdown", "علت خرابی ماشین"],
                        ] as const
                    ).map(([v, label]) => (
                        <button
                            key={v}
                            type="button"
                            onClick={() => changeCauseFilter(v)}
                            className={`h-8 rounded-full px-3.5 text-[12px] font-bold transition-colors ${
                                causeFilter === v
                                    ? "bg-blue-600 text-white"
                                    : "bg-black/[0.04] text-gray-600 hover:bg-black/[0.07] dark:bg-white/[0.06] dark:text-gray-300"
                            }`}
                        >
                            {label}
                        </button>
                    ))}
                </div>
            )}

            <div className="overflow-hidden rounded-2xl border border-black/[0.06] bg-[#fafafa] dark:border-white/[0.06] dark:bg-white/[0.02]">
                {loading ? (
                    <div className="flex justify-center py-12">
                        <Loader2 className="animate-spin text-gray-400" />
                    </div>
                ) : items.length === 0 ? (
                    <p className="py-12 text-center text-[12px] text-gray-400">موردی ثبت نشده است</p>
                ) : (
                    <table className="w-full border-collapse text-right text-[12px]">
                        <thead>
                            <tr className="border-b border-black/5 text-[11px] text-gray-400 dark:border-white/5">
                                <th className="px-4 py-3 font-bold">نام</th>
                                <th className="px-4 py-3 font-bold">{isProduct ? "کد" : "نوع / توضیحات"}</th>
                                {isProduct && <th className="px-4 py-3 font-bold">تولید استاندارد/ساعت</th>}
                                {isProduct && <th className="px-4 py-3 font-bold">ضایعات استاندارد/ساعت</th>}
                                <th className="px-4 py-3 font-bold">وضعیت</th>
                                <th className="px-4 py-3" />
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-black/5 dark:divide-white/5">
                            {items.map((it) => (
                                <tr key={it.id} className="hover:bg-black/[0.02] dark:hover:bg-white/[0.02]">
                                    <td className="px-4 py-3 font-extrabold text-gray-800 dark:text-gray-100">{it.name}</td>
                                    <td className="px-4 py-3 text-gray-500 dark:text-gray-400">
                                        {isProduct ? (
                                            <span className="font-mono">{(it as Product).code}</span>
                                        ) : (
                                            <>
                                                <span className="ml-2 rounded-full bg-black/[0.05] px-2 py-0.5 text-[10px] font-bold dark:bg-white/[0.08]">
                                                    {(it as Cause).kind === "breakdown" ? "خرابی ماشین" : "ضایعات"}
                                                </span>
                                                {(it as Cause).description || "—"}
                                            </>
                                        )}
                                    </td>
                                    {isProduct && (
                                        <td className="px-4 py-3 font-bold text-gray-700 dark:text-gray-200">
                                            {formatProductionInteger((it as Product).std_production_per_hour)}
                                        </td>
                                    )}
                                    {isProduct && (
                                        <td className="px-4 py-3 font-bold text-red-500">
                                            {formatProductionInteger((it as Product).std_waste_per_hour)}
                                        </td>
                                    )}
                                    <td className="px-4 py-3">
                                        <StatusSwitch isActive={it.is_active} onToggle={() => toggle(it)} />
                                    </td>
                                    <td className="px-4 py-3">
                                        <div className="flex items-center justify-end gap-2">
                                            {busyId === it.id && <Loader2 size={14} className="animate-spin text-gray-400" />}
                                            <button
                                                type="button"
                                                onClick={() => setModal({ open: true, item: it })}
                                                className="text-gray-400 hover:text-blue-500"
                                            >
                                                <SquarePen size={14} />
                                            </button>
                                            <button type="button" onClick={() => remove(it)} className="text-gray-400 hover:text-red-500">
                                                <Trash2 size={14} />
                                            </button>
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
                    <CatalogModal
                        key="catalog-modal"
                        kind={kind}
                        item={modal.item}
                        onClose={() => setModal({ open: false, item: null })}
                        onSaved={() => {
                            setModal({ open: false, item: null });
                            load();
                        }}
                    />
                )}
            </AnimatePresence>
        </section>
    );
}
