"use client";

import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Loader2, Power, PowerOff, X } from "lucide-react";
import { apiErrorMessage, patchWarehouse, setWarehouseActive } from "@/lib/warehouseApi";
import type { ApiWarehouse } from "@/types/warehouse";

const inputClass =
    "h-11 w-full rounded-2xl border border-gray-200 bg-white px-3 text-[13px] font-bold text-gray-900 outline-none transition-colors focus:border-indigo-500 dark:border-white/10 dark:bg-white/5 dark:text-white";

function Shell({
    open,
    busy,
    onClose,
    children,
}: {
    open: boolean;
    busy: boolean;
    onClose: () => void;
    children: React.ReactNode;
}) {
    return (
        <AnimatePresence>
            {open && (
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm"
                    onClick={() => !busy && onClose()}
                    dir="rtl"
                >
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95, y: 10 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.95, y: 10 }}
                        onClick={(e) => e.stopPropagation()}
                        className="w-full max-w-sm rounded-3xl bg-white p-5 shadow-2xl dark:bg-slate-900"
                    >
                        {children}
                    </motion.div>
                </motion.div>
            )}
        </AnimatePresence>
    );
}

export function EditWarehouseModal({
    warehouse,
    onClose,
    onSaved,
}: {
    warehouse: ApiWarehouse | null;
    onClose: () => void;
    onSaved: () => void;
}) {
    const [name, setName] = useState("");
    const [code, setCode] = useState("");
    const [isActive, setIsActive] = useState(true);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");

    useEffect(() => {
        if (!warehouse) return;
        setName(warehouse.name);
        setCode(warehouse.code);
        setIsActive(warehouse.is_active);
        setError("");
    }, [warehouse]);

    async function submit(event: React.FormEvent) {
        event.preventDefault();
        if (!warehouse) return;
        if (!name.trim()) return setError("نام انبار را وارد کنید");
        if (!code.trim()) return setError("کد انبار را وارد کنید");

        setLoading(true);
        setError("");

        try {
            await patchWarehouse(warehouse.id, {
                name: name.trim(),
                code: code.trim(),
                is_active: isActive,
            });
            onSaved();
        } catch (err) {
            setError(apiErrorMessage(err, "خطا در ویرایش انبار"));
        } finally {
            setLoading(false);
        }
    }

    return (
        <Shell open={!!warehouse} busy={loading} onClose={onClose}>
            <form onSubmit={submit}>
                <div className="flex items-center justify-between">
                    <h3 className="text-[14px] font-extrabold text-gray-900 dark:text-white">
                        ویرایش انبار
                    </h3>
                    <button
                        type="button"
                        onClick={onClose}
                        disabled={loading}
                        className="flex h-8 w-8 items-center justify-center rounded-xl text-gray-400 hover:bg-gray-100 dark:hover:bg-white/10"
                    >
                        <X size={16} />
                    </button>
                </div>

                <div className="mt-5 space-y-3">
                    <label className="block">
                        <span className="mb-1.5 block text-[11px] font-bold text-gray-500 dark:text-gray-400">
                            نام انبار
                        </span>
                        <input value={name} onChange={(e) => setName(e.target.value)} className={inputClass} />
                    </label>

                    <label className="block">
                        <span className="mb-1.5 block text-[11px] font-bold text-gray-500 dark:text-gray-400">
                            کد انبار
                        </span>
                        <input value={code} onChange={(e) => setCode(e.target.value)} className={inputClass} />
                    </label>

                    <label className="flex cursor-pointer items-center gap-2 pt-1">
                        <input
                            type="checkbox"
                            checked={isActive}
                            onChange={(e) => setIsActive(e.target.checked)}
                            className="h-4 w-4 accent-indigo-600"
                        />
                        <span className="text-[12px] font-bold text-gray-700 dark:text-gray-300">
                            انبار فعال باشد
                        </span>
                    </label>
                </div>

                {error && (
                    <p className="mt-3 rounded-xl bg-red-500/10 px-3 py-2 text-[11.5px] font-bold text-red-500">
                        {error}
                    </p>
                )}

                <button
                    type="submit"
                    disabled={loading}
                    className="mt-5 flex h-11 w-full items-center justify-center gap-2 rounded-2xl bg-indigo-600 text-[13px] font-bold text-white transition-colors hover:bg-indigo-500 disabled:opacity-50"
                >
                    {loading && <Loader2 size={15} className="animate-spin" />}
                    ذخیره تغییرات
                </button>
            </form>
        </Shell>
    );
}

export function WarehouseStatusModal({
    warehouse,
    onClose,
    onChanged,
}: {
    warehouse: ApiWarehouse | null;
    onClose: () => void;
    onChanged: () => void;
}) {
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");

    useEffect(() => {
        setError("");
    }, [warehouse]);

    const deactivating = warehouse?.is_active ?? true;

    async function confirm() {
        if (!warehouse) return;
        setLoading(true);
        setError("");

        try {
            await setWarehouseActive(warehouse.id, !warehouse.is_active);
            onChanged();
        } catch (err) {
            setError(
                apiErrorMessage(
                    err,
                    deactivating ? "غیرفعال‌سازی انبار انجام نشد" : "فعال‌سازی انبار انجام نشد",
                ),
            );
        } finally {
            setLoading(false);
        }
    }

    return (
        <Shell open={!!warehouse} busy={loading} onClose={onClose}>
            <div className="flex flex-col items-center text-center">
                <div
                    className={`flex h-14 w-14 items-center justify-center rounded-2xl ${deactivating
                            ? "bg-amber-500/10 text-amber-500"
                            : "bg-emerald-500/10 text-emerald-500"
                        }`}
                >
                    {deactivating ? <PowerOff size={24} /> : <Power size={24} />}
                </div>

                <h3 className="mt-4 text-[15px] font-extrabold text-gray-900 dark:text-white">
                    {deactivating ? "غیرفعال‌سازی انبار" : "فعال‌سازی انبار"}
                </h3>

                <p className="mt-2 text-[12px] font-bold text-indigo-500">
                    {warehouse?.name}
                </p>

                <p className="mt-3 text-[12px] leading-7 text-gray-500 dark:text-gray-400">
                    {deactivating
                        ? "با غیرفعال شدن، این انبار برای انباردارها از دسترس خارج می‌شود. اطلاعات و موجودی‌ها حفظ می‌شوند و هر زمان بخواهید می‌توانید انبار را دوباره فعال کنید."
                        : "با فعال شدن، این انبار دوباره در اختیار انباردارها قرار می‌گیرد و امکان ثبت عملیات روی آن فراهم می‌شود."}
                </p>
            </div>

            {error && (
                <p className="mt-4 rounded-xl bg-red-500/10 px-3 py-2 text-[11.5px] font-bold text-red-500">
                    {error}
                </p>
            )}

            <div className="mt-6 grid grid-cols-2 gap-2">
                <button
                    type="button"
                    onClick={onClose}
                    disabled={loading}
                    className="h-11 rounded-2xl bg-gray-100 text-[13px] font-bold text-gray-700 transition-colors hover:bg-gray-200 disabled:opacity-50 dark:bg-white/10 dark:text-gray-200 dark:hover:bg-white/15"
                >
                    انصراف
                </button>
                <button
                    type="button"
                    onClick={confirm}
                    disabled={loading}
                    className={`flex h-11 items-center justify-center gap-2 rounded-2xl text-[13px] font-bold text-white transition-colors disabled:opacity-50 ${deactivating
                            ? "bg-amber-500 hover:bg-amber-400"
                            : "bg-emerald-600 hover:bg-emerald-500"
                        }`}
                >
                    {loading && <Loader2 size={15} className="animate-spin" />}
                    {deactivating ? "غیرفعال کن" : "فعال کن"}
                </button>
            </div>
        </Shell>
    );
}