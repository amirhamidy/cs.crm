"use client";

import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Loader2, Power, Trash2, User, X } from "lucide-react";
import axiosInstance from "@/lib/axiosInstance";
import type { AxiosError } from "axios";
import type { ApiPurchasingEmployee } from "@/types/purchasing";

interface PurchasingEmployeeCardProps {
    employee: ApiPurchasingEmployee;
    index: number;
    onUpdated: (employee: ApiPurchasingEmployee) => void;
    onDeleted: (id: number) => void;
}

function getErrorMessage(err: unknown, fallback: string) {
    const error = err as AxiosError<Record<string, unknown>>;
    const data = error.response?.data;
    if (!data) return fallback;
    const keys = ["detail", "message", "error"];
    for (const key of keys) {
        const val = data[key];
        if (typeof val === "string") return val;
    }
    return fallback;
}

export default function PurchasingEmployeeCard({
    employee,
    index,
    onUpdated,
    onDeleted,
}: PurchasingEmployeeCardProps) {
    const [showConfirm, setShowConfirm] = useState(false);
    const [deleting, setDeleting] = useState(false);
    const [toggling, setToggling] = useState(false);
    const [error, setError] = useState("");

    async function handleToggle() {
        setToggling(true);
        setError("");
        try {
            const { data } = await axiosInstance.patch<ApiPurchasingEmployee>(
                `/purchasing/api/v1/employees/${employee.id}/patch/`,
                { is_active: !employee.is_active }
            );
            onUpdated(data);
        } catch (err) {
            setError(getErrorMessage(err, "خطا در تغییر وضعیت"));
        } finally {
            setToggling(false);
        }
    }

    async function handleDelete() {
        setDeleting(true);
        setError("");
        try {
            await axiosInstance.delete(`/purchasing/api/v1/employees/${employee.id}/delete/`);
            onDeleted(employee.id);
            setShowConfirm(false);
        } catch (err) {
            setError(getErrorMessage(err, "خطا در حذف کارمند"));
        } finally {
            setDeleting(false);
        }
    }

    return (
        <>
            <motion.div
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.2, delay: index * 0.04 }}
                className="flex items-center justify-between gap-3 rounded-3xl border border-gray-100 bg-white p-4 dark:border-white/[0.06] dark:bg-white/[0.02]"
            >
                <div className="flex min-w-0 items-center gap-3">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-blue-50 dark:bg-blue-500/10">
                        <User size={16} className="text-blue-500" />
                    </div>
                    <div className="min-w-0">
                        <h3 className="truncate text-[13px] font-extrabold text-gray-900 dark:text-white">
                            {employee.employee_name}
                        </h3>
                        <span
                            className={`mt-0.5 inline-flex items-center rounded-lg px-2 py-0.5 text-[10px] font-bold ${employee.is_active
                                ? "bg-emerald-500/10 text-emerald-500"
                                : "bg-gray-200 text-gray-500 dark:bg-white/[0.06] dark:text-gray-400"
                                }`}
                        >
                            {employee.is_active ? "فعال" : "غیرفعال"}
                        </span>
                    </div>
                </div>

                <div className="flex shrink-0 items-center gap-1.5">
                    <button
                        type="button"
                        onClick={handleToggle}
                        disabled={toggling}
                        className="flex h-8 w-8 items-center justify-center rounded-xl bg-amber-50 text-amber-500 disabled:opacity-50 dark:bg-amber-500/10"
                        title="تغییر وضعیت"
                    >
                        {toggling ? <Loader2 size={13} className="animate-spin" /> : <Power size={13} />}
                    </button>
                    <button
                        type="button"
                        onClick={() => setShowConfirm(true)}
                        className="flex h-8 w-8 items-center justify-center rounded-xl bg-red-50 text-red-500 dark:bg-red-500/10"
                        title="حذف"
                    >
                        <Trash2 size={13} />
                    </button>
                </div>
            </motion.div>

            {error && (
                <p className="mt-1 text-center text-[11px] font-semibold text-red-500">{error}</p>
            )}

            <AnimatePresence>
                {showConfirm && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={() => !deleting && setShowConfirm(false)}
                        className="fixed inset-0 z-50 flex items-center justify-center px-4"
                        style={{ background: "rgba(0,0,0,0.5)", backdropFilter: "blur(4px)" }}
                    >
                        <motion.div
                            initial={{ opacity: 0, scale: 0.96, y: 16 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.96, y: 16 }}
                            onClick={(e) => e.stopPropagation()}
                            className="w-full max-w-[340px] rounded-[2rem] bg-white p-5 dark:bg-[#0f172a]"
                            dir="rtl"
                        >
                            <div className="mb-4 flex items-center justify-between">
                                <h3 className="text-[13.5px] font-extrabold text-gray-900 dark:text-white">
                                    حذف کارمند خرید
                                </h3>
                                <button
                                    type="button"
                                    onClick={() => setShowConfirm(false)}
                                    disabled={deleting}
                                    className="flex h-8 w-8 items-center justify-center rounded-xl bg-gray-100 text-gray-400 dark:bg-white/[0.05]"
                                >
                                    <X size={14} />
                                </button>
                            </div>

                            <p className="text-[12.5px] leading-6 text-gray-600 dark:text-gray-400">
                                <span className="font-extrabold text-gray-900 dark:text-white">
                                    {employee.employee_name}
                                </span>{" "}
                                از لیست کارمندان خرید حذف خواهد شد.
                            </p>

                            <div className="mt-5 flex gap-2">
                                <button
                                    type="button"
                                    onClick={() => setShowConfirm(false)}
                                    disabled={deleting}
                                    className="flex-1 rounded-2xl bg-gray-100 py-2.5 text-[12.5px] font-bold text-gray-600 dark:bg-white/[0.05] dark:text-gray-300"
                                >
                                    انصراف
                                </button>
                                <button
                                    type="button"
                                    onClick={handleDelete}
                                    disabled={deleting}
                                    className="flex flex-1 items-center justify-center gap-1.5 rounded-2xl bg-red-600 py-2.5 text-[12.5px] font-bold text-white disabled:opacity-60"
                                >
                                    {deleting ? <Loader2 size={14} className="animate-spin" /> : "حذف کن"}
                                </button>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </>
    );
}