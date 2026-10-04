"use client";

import { useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import { Boxes, Loader2, Pencil, Plus, Trash2, X } from "lucide-react";
import { useTheme } from "next-themes";

import useWarehouses from "@/hooks/useWarehouses";
import useWarehouseAccess from "@/hooks/useWarehouseAccess";
import { apiErrorMessage, createWarehouse } from "@/lib/warehouseApi";
import { cardBg, cardBorder, cardShadow, muted } from "@/components/admin/warehouse/WarehouseCards";
import { DeleteWarehouseModal, EditWarehouseModal } from "@/components/admin/warehouse/WarehouseFormModals";
import type { ApiWarehouse } from "@/types/warehouse";

const inputClass =
    "h-11 w-full rounded-2xl border border-gray-200 bg-white px-3 text-[13px] font-bold text-gray-900 outline-none transition-colors focus:border-indigo-500 dark:border-white/10 dark:bg-white/5 dark:text-white";

function CreateWarehouseModal({
    isOpen,
    onClose,
    onCreated,
}: {
    isOpen: boolean;
    onClose: () => void;
    onCreated: (warehouse: ApiWarehouse) => void;
}) {
    const [name, setName] = useState("");
    const [code, setCode] = useState("");
    const [isActive, setIsActive] = useState(true);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");

    async function handleSubmit(event: React.FormEvent) {
        event.preventDefault();

        if (!name.trim()) return setError("نام انبار را وارد کنید");
        if (!code.trim()) return setError("کد انبار را وارد کنید");

        setLoading(true);
        setError("");

        try {
            const created = await createWarehouse({
                name: name.trim(),
                code: code.trim(),
                is_active: isActive,
            });
            setName("");
            setCode("");
            setIsActive(true);
            onCreated(created);
        } catch (err) {
            setError(apiErrorMessage(err, "خطا در ایجاد انبار"));
        } finally {
            setLoading(false);
        }
    }

    return (
        <AnimatePresence>
            {isOpen && (
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm"
                    onClick={() => !loading && onClose()}
                    dir="rtl"
                >
                    <motion.form
                        initial={{ opacity: 0, scale: 0.95, y: 10 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.95, y: 10 }}
                        onClick={(e) => e.stopPropagation()}
                        onSubmit={handleSubmit}
                        className="w-full max-w-sm rounded-3xl bg-white p-5 shadow-2xl dark:bg-slate-900"
                    >
                        <div className="flex items-center justify-between">
                            <h3 className="text-[14px] font-extrabold text-gray-900 dark:text-white">
                                ایجاد انبار جدید
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
                                <input
                                    value={name}
                                    onChange={(e) => setName(e.target.value)}
                                    placeholder="مثلاً انبار 1"
                                    className={inputClass}
                                />
                            </label>

                            <label className="block">
                                <span className="mb-1.5 block text-[11px] font-bold text-gray-500 dark:text-gray-400">
                                    کد انبار
                                </span>
                                <input
                                    value={code}
                                    onChange={(e) => setCode(e.target.value)}
                                    placeholder="مثلاً 1"
                                    className={inputClass}
                                />
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
                            ایجاد انبار
                        </button>
                    </motion.form>
                </motion.div>
            )}
        </AnimatePresence>
    );
}

export default function WarehouseSelector() {
    const { resolvedTheme } = useTheme();
    const isDark = resolvedTheme === "dark";
    const router = useRouter();
    const pathname = usePathname();

    const basePath = `/${pathname.split("/").filter(Boolean)[0] ?? "admin"}/warehouse`;

    const { isAdmin } = useWarehouseAccess();
    const { warehouses, loading, error, reload } = useWarehouses();
    const [showCreate, setShowCreate] = useState(false);
    const [editing, setEditing] = useState<ApiWarehouse | null>(null);
    const [deleting, setDeleting] = useState<ApiWarehouse | null>(null);

    const open = (id: number) => router.push(`${basePath}/overview?warehouse=${id}`);

    return (
        <div dir="rtl" className="flex min-h-screen flex-col gap-6 p-6">
            <div className="flex flex-wrap items-center justify-between gap-3">
                <div className="flex items-start gap-3">
                    <div
                        className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl"
                        style={{
                            background: isDark ? "rgba(99,102,241,0.14)" : "rgba(99,102,241,0.08)",
                        }}
                    >
                        <Boxes size={18} className="text-indigo-500" />
                    </div>

                    <div>
                        <h1 className="text-[15px] font-extrabold text-gray-900 dark:text-white">
                            انبارها
                        </h1>
                        <p className="mt-0.5 text-[11.5px] text-gray-500 dark:text-gray-400">
                            انبار مورد نظر را انتخاب کنید
                        </p>
                    </div>
                </div>

                {isAdmin && (
                    <motion.button
                        type="button"
                        whileTap={{ scale: 0.97 }}
                        onClick={() => setShowCreate(true)}
                        className="flex h-11 items-center justify-center gap-2 rounded-full bg-indigo-600 px-5 text-[13px] font-bold text-white transition-colors hover:bg-indigo-500"
                    >
                        <Plus size={15} />
                        ایجاد انبار
                    </motion.button>
                )}
            </div>

            {error && (
                <div className="rounded-2xl border border-red-500/15 bg-red-500/5 px-4 py-3 text-[12px] font-bold text-red-500">
                    {error}
                </div>
            )}

            {loading ? (
                <div className="flex items-center justify-center py-20">
                    <Loader2 size={22} className="animate-spin text-indigo-500" />
                </div>
            ) : (
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                    {warehouses.length ? (
                        warehouses.map((warehouse, index) => (
                            <motion.div
                                key={warehouse.id}
                                role="button"
                                tabIndex={0}
                                initial={{ opacity: 0, y: 12 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ duration: 0.2, delay: index * 0.04 }}
                                whileHover={{ y: -2 }}
                                onClick={() => open(warehouse.id)}
                                onKeyDown={(e) => {
                                    if (e.key === "Enter") open(warehouse.id);
                                }}
                                className="flex cursor-pointer flex-col gap-3 rounded-3xl p-4 text-right"
                                style={{
                                    background: cardBg(isDark),
                                    border: cardBorder(isDark),
                                    boxShadow: cardShadow(isDark),
                                }}
                            >
                                <div className="flex items-center justify-between gap-2">
                                    <div className="flex min-w-0 items-center gap-2.5">
                                        <div
                                            className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl text-white shadow-lg"
                                            style={{
                                                background: "linear-gradient(135deg,#6366f1,#8b5cf6)",
                                            }}
                                        >
                                            <Boxes size={18} />
                                        </div>
                                        <h3 className="truncate text-[13px] font-extrabold text-gray-900 dark:text-white">
                                            {warehouse.name}
                                        </h3>
                                    </div>

                                    <span
                                        className="shrink-0 rounded-xl px-2 py-1 text-[10.5px] font-extrabold"
                                        style={{
                                            background: warehouse.is_active
                                                ? "rgba(16,185,129,.12)"
                                                : "rgba(239,68,68,.12)",
                                            color: warehouse.is_active ? "#10b981" : "#ef4444",
                                        }}
                                    >
                                        {warehouse.is_active ? "فعال" : "غیرفعال"}
                                    </span>
                                </div>

                                <div className="flex items-center justify-between gap-2">
                                    <p className="text-[11px] font-semibold" style={{ color: muted(isDark) }}>
                                        کد انبار: {warehouse.code}
                                    </p>

                                    {isAdmin && (
                                        <div className="flex items-center gap-1">
                                            <button
                                                type="button"
                                                aria-label="ویرایش انبار"
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    setEditing(warehouse);
                                                }}
                                                className="flex h-8 w-8 items-center justify-center rounded-xl text-indigo-500 transition-colors hover:bg-indigo-500/10"
                                            >
                                                <Pencil size={14} />
                                            </button>
                                            <button
                                                type="button"
                                                aria-label="حذف انبار"
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    setDeleting(warehouse);
                                                }}
                                                className="flex h-8 w-8 items-center justify-center rounded-xl text-red-500 transition-colors hover:bg-red-500/10"
                                            >
                                                <Trash2 size={14} />
                                            </button>
                                        </div>
                                    )}
                                </div>
                            </motion.div>
                        ))
                    ) : (
                        <p
                            className="col-span-full py-16 text-center text-[12.5px]"
                            style={{ color: muted(isDark) }}
                        >
                            هنوز انباری ثبت نشده است
                        </p>
                    )}
                </div>
            )}

            <EditWarehouseModal
                warehouse={editing}
                onClose={() => setEditing(null)}
                onSaved={() => {
                    setEditing(null);
                    void reload();
                }}
            />

            <DeleteWarehouseModal
                warehouse={deleting}
                onClose={() => setDeleting(null)}
                onDeleted={() => {
                    setDeleting(null);
                    void reload();
                }}
            />

            <CreateWarehouseModal
                isOpen={showCreate}
                onClose={() => setShowCreate(false)}
                onCreated={() => {
                    setShowCreate(false);
                    void reload();
                }}
            />
        </div>
    );
}
