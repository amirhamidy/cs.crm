"use client";

import { AnimatePresence, motion } from "framer-motion";
import { ChevronLeft, Pencil, Trash2, UserRound, Users, X } from "lucide-react";
import { useState } from "react";
import axiosInstance from "@/lib/axiosInstance";
import type { ApiPurchasingStep } from "@/types/purchasing";

const STEP_COLORS = ["#6366f1", "#8b5cf6", "#ec4899", "#f59e0b", "#10b981", "#3b82f6", "#ef4444", "#14b8a6"];

interface Props {
    step: ApiPurchasingStep;
    index: number;
    onEdit: () => void;
    onDeleted: () => void;
    isLast?: boolean;
}

export default function StepCard({ step, index, onEdit, onDeleted, isLast = true }: Props) {
    const [confirmOpen, setConfirmOpen] = useState(false);
    const [removing, setRemoving] = useState(false);

    const accent = STEP_COLORS[index % STEP_COLORS.length];
    const members = step.employees_detail ?? [];

    const handleRemove = async () => {
        setRemoving(true);
        try {
            await axiosInstance.delete(`/purchasing/api/v1/steps/${step.id}/delete/`);
            setConfirmOpen(false);
            onDeleted();
        } finally {
            setRemoving(false);
        }
    };

    return (
        <>
            <motion.div
                layout
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.2, delay: Math.min(index, 6) * 0.03 }}
                className="relative flex min-w-0 flex-col rounded-[1.45rem] border shadow-[0_6px_22px_rgba(15,23,42,0.025)] dark:bg-white/[0.025] dark:shadow-none"
                style={{ borderColor: `${accent}25` }}
            >
                {!isLast && (
                    <div
                        className="pointer-events-none absolute top-[28px] z-20 flex h-5 w-5 items-center justify-center rounded-full border bg-white shadow-sm dark:bg-[#0f172a]"
                        style={{ insetInlineEnd: "-10px", borderColor: `${accent}35`, color: accent }}
                    >
                        <ChevronLeft size={10} strokeWidth={2.5} />
                    </div>
                )}

                <div className="relative px-3.5 py-3">
                    <div className="flex items-center justify-between gap-2.5">
                        <div className="flex min-w-0 items-center gap-2">
                            <span
                                className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg text-[11px] font-extrabold text-white shadow-sm"
                                style={{ backgroundColor: accent }}
                            >
                                {step.order}
                            </span>

                            <div className="min-w-0">
                                <h4 className="truncate text-[12.5px] font-extrabold text-gray-800 dark:text-gray-100">{step.title}</h4>
                                <p className="mt-0.5 line-clamp-1 text-[10.5px] font-medium text-gray-400 dark:text-gray-500">
                                    {step.description || "بدون توضیحات"}
                                </p>
                            </div>
                        </div>

                        <div className="flex shrink-0 items-center gap-1">
                            <button
                                type="button"
                                onClick={onEdit}
                                className="flex h-7 w-7 items-center justify-center rounded-lg transition"
                                style={{ color: accent, backgroundColor: `${accent}12` }}
                            >
                                <Pencil size={12} />
                            </button>

                            <button
                                type="button"
                                onClick={() => setConfirmOpen(true)}
                                className="flex h-7 w-7 items-center justify-center rounded-lg bg-rose-500/10 text-rose-500 transition"
                            >
                                <Trash2 size={12} />
                            </button>
                        </div>
                    </div>
                </div>

                <div className="h-px" style={{ background: `${accent}14` }} />

                <div className="flex flex-col gap-2 p-3.5">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-1.5 text-[10px] font-bold text-gray-400 dark:text-gray-500">
                            <Users size={11} />
                            مسئولان مرحله
                        </div>
                        <span
                            className="rounded-full px-2 py-0.5 text-[9.5px] font-extrabold"
                            style={{ background: `${accent}14`, color: accent }}
                        >
                            {members.length}
                        </span>
                    </div>

                    <div className="flex flex-wrap gap-1.5">
                        {members.length ? (
                            members.map((employee) => (
                                <span
                                    key={employee.id}
                                    className="inline-flex items-center gap-1 rounded-xl bg-gray-50 px-2 py-1.5 text-[9.5px] font-bold text-gray-600 dark:bg-white/[0.05] dark:text-gray-300"
                                >
                                    <UserRound size={10} style={{ color: accent }} />
                                    {employee.full_name}
                                </span>
                            ))
                        ) : (
                            <span className="text-[10px] font-medium text-gray-400 dark:text-gray-500">مسئولی تعیین نشده است</span>
                        )}
                    </div>
                </div>
            </motion.div>

            {typeof document !== "undefined" &&
                confirmOpen &&
                (() => {
                    return (
                        <AnimatePresence>
                            <motion.div
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                exit={{ opacity: 0 }}
                                className="fixed inset-0 z-[999] flex items-center justify-center bg-slate-950/50 px-4 backdrop-blur-sm"
                                onClick={() => !removing && setConfirmOpen(false)}
                            >
                                <motion.div
                                    initial={{ scale: 0.95, opacity: 0 }}
                                    animate={{ scale: 1, opacity: 1 }}
                                    exit={{ scale: 0.95, opacity: 0 }}
                                    onClick={(event) => event.stopPropagation()}
                                    dir="rtl"
                                    className="w-full max-w-sm rounded-[2rem] border border-gray-100 bg-white p-6 text-right shadow-2xl dark:border-white/[0.08] dark:bg-[#111a2d]"
                                >
                                    <div className="flex items-start justify-between">
                                        <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-red-50 text-red-500 dark:bg-red-500/10">
                                            <Trash2 size={19} />
                                        </div>
                                        <button
                                            type="button"
                                            onClick={() => setConfirmOpen(false)}
                                            disabled={removing}
                                            className="flex h-8 w-8 items-center justify-center rounded-xl bg-gray-100 text-gray-400 transition-colors hover:text-gray-600 disabled:opacity-40 dark:bg-white/[0.05] dark:hover:text-gray-300"
                                        >
                                            <X size={15} />
                                        </button>
                                    </div>

                                    <h4 className="mt-4 text-[14px] font-extrabold text-gray-900 dark:text-white">حذف مرحله</h4>
                                    <p className="mt-2 text-[11.5px] font-medium leading-6 text-gray-400 dark:text-white/40">
                                        آیا از حذف مرحله «{step.title}» مطمئن هستید؟ این عملیات قابل بازگشت نیست.
                                    </p>

                                    <div className="mt-5 flex gap-2">
                                        <button
                                            type="button"
                                            disabled={removing}
                                            onClick={() => setConfirmOpen(false)}
                                            className="flex h-10 flex-1 items-center justify-center rounded-full bg-gray-100 text-[11.5px] font-extrabold text-gray-500 transition-colors hover:bg-gray-200 dark:bg-white/[0.06] dark:text-white/50 dark:hover:bg-white/[0.1]"
                                        >
                                            انصراف
                                        </button>
                                        <button
                                            type="button"
                                            disabled={removing}
                                            onClick={handleRemove}
                                            className="flex h-10 flex-1 items-center justify-center gap-2 rounded-full bg-red-500 text-[11.5px] font-extrabold text-white transition-colors hover:bg-red-600 disabled:opacity-50"
                                        >
                                            <Trash2 size={14} />
                                            حذف
                                        </button>
                                    </div>
                                </motion.div>
                            </motion.div>
                        </AnimatePresence>
                    );
                })()}
        </>
    );
}