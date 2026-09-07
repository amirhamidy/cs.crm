"use client";

import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Loader2, ListOrdered, Pencil, Trash2, X } from "lucide-react";
import axiosInstance from "@/lib/axiosInstance";
import type { AxiosError } from "axios";
import type { ApiPurchasingEmployee, ApiPurchasingStep } from "@/types/purchasing";
import StepModal from "./StepModal";

interface StepCardProps {
    step: ApiPurchasingStep;
    index: number;
    employees: ApiPurchasingEmployee[];
    onUpdated: (step: ApiPurchasingStep) => void;
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

export default function StepCard({ step, index, employees, onUpdated, onDeleted }: StepCardProps) {
    const [showEdit, setShowEdit] = useState(false);
    const [showConfirm, setShowConfirm] = useState(false);
    const [deleting, setDeleting] = useState(false);
    const [error, setError] = useState("");

    async function handleDelete() {
        setDeleting(true);
        setError("");
        try {
            await axiosInstance.delete(`/purchasing/api/v1/steps/${step.id}/delete/`);
            onDeleted(step.id);
            setShowConfirm(false);
        } catch (err) {
            setError(getErrorMessage(err, "خطا در حذف مرحله"));
        } finally {
            setDeleting(false);
        }
    }

    return (
        <>
            <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.2, delay: index * 0.03 }}
                className="flex flex-col gap-3 rounded-2xl border border-gray-100 bg-white p-4 dark:border-white/[0.06] dark:bg-white/[0.02]"
            >
                <div className="flex items-center justify-between gap-3">
                    <div className="flex min-w-0 items-center gap-3">
                        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-indigo-50 dark:bg-indigo-500/10">
                            <ListOrdered size={15} className="text-indigo-500" />
                        </div>
                        <div className="min-w-0">
                            <span className="truncate text-[13px] font-extrabold text-gray-900 dark:text-white">
                                {step.title}
                            </span>
                            <p className="text-[10.5px] font-semibold text-gray-400">
                                ترتیب: {step.order}
                            </p>
                        </div>
                    </div>

                    <div className="flex shrink-0 items-center gap-1.5">
                        <button
                            type="button"
                            onClick={() => setShowEdit(true)}
                            className="flex h-8 w-8 items-center justify-center rounded-xl bg-indigo-50 text-indigo-500 dark:bg-indigo-500/10"
                            title="ویرایش"
                        >
                            <Pencil size={13} />
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
                </div>

                {step.description && (
                    <p className="text-[11.5px] leading-6 text-gray-500 dark:text-gray-400">
                        {step.description}
                    </p>
                )}

                {step.employees_detail.length > 0 && (
                    <div className="flex flex-wrap gap-1.5">
                        {step.employees_detail.map((emp) => (
                            <span
                                key={emp.id}
                                className="rounded-lg bg-gray-100 px-2 py-1 text-[10.5px] font-bold text-gray-600 dark:bg-white/[0.06] dark:text-gray-300"
                            >
                                {emp.full_name}
                            </span>
                        ))}
                    </div>
                )}
            </motion.div>

            <StepModal
                isOpen={showEdit}
                onClose={() => setShowEdit(false)}
                step={step}
                employees={employees}
                onSaved={(updated) => {
                    onUpdated(updated);
                    setShowEdit(false);
                }}
            />

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
                                    حذف مرحله
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
                                مرحله{" "}
                                <span className="font-extrabold text-gray-900 dark:text-white">
                                    {step.title}
                                </span>{" "}
                                حذف خواهد شد.
                            </p>

                            {error && (
                                <p className="mt-3 text-[11.5px] font-semibold text-red-500">{error}</p>
                            )}

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