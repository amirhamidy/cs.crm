"use client";

import { useCallback, useEffect, useState } from "react";
import { Loader2, Package, AlertTriangle, SquarePen, Trash2, Plus } from "lucide-react";
import { AnimatePresence } from "framer-motion";
import { toPersianDigits } from "@/lib/jalali";
import { listAll } from "@/lib/api";
import axiosInstance from "@/lib/axiosInstance";
import {
    CatalogModal,
    ErrorBanner,
    StatusSwitch,
    Product,
    Discrepancy,
    parseBackendError,
} from "@/components/admin/production/shared";

type Item = Product | Discrepancy;

export default function CatalogPage({ kind }: { kind: "product" | "discrepancy" }) {
    const isProduct = kind === "product";
    const [items, setItems] = useState<Item[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [busyId, setBusyId] = useState<number | null>(null);
    const [modal, setModal] = useState<{ open: boolean; item: Item | null }>({ open: false, item: null });

    const load = useCallback(async () => {
        try {
            setItems(await listAll<Item>(`/production/api/v1/${kind}/`));
        } catch (e) {
            setError(parseBackendError(e, "دریافت اطلاعات انجام نشد"));
        } finally {
            setLoading(false);
        }
    }, [kind]);

    useEffect(() => {
        load();
    }, [load]);

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
                    {isProduct ? "محصولات" : "مغایرت‌ها"} ({toPersianDigits(items.length)})
                </h2>
                <button
                    type="button"
                    onClick={() => setModal({ open: true, item: null })}
                    className="flex h-9 items-center gap-1.5 rounded-full bg-blue-600 px-4 text-[12px] font-bold text-white hover:bg-blue-500"
                >
                    <Plus size={14} />
                    {isProduct ? "محصول جدید" : "مغایرت جدید"}
                </button>
            </div>

            <ErrorBanner message={error} onClose={() => setError("")} />

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
                                <th className="px-4 py-3 font-bold">{isProduct ? "کد" : "توضیحات"}</th>
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
                                            (it as Discrepancy).description || "—"
                                        )}
                                    </td>
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
