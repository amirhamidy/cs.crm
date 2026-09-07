"use client";

import { AnimatePresence, motion } from "framer-motion";
import {
    Check,
    Power,
    Trash2,
    UserRound,
    X,
} from "lucide-react";
import { useState } from "react";
import axiosInstance from "@/lib/axiosInstance";
import type { ApiPurchasingEmployee } from "@/types/purchasing";

interface Props {
    employee: ApiPurchasingEmployee;
    index: number;
    onUpdated: () => void;
    onDeleted: () => void;
}

export default function PurchasingEmployeeCard({
    employee,
    index,
    onUpdated,
    onDeleted,
}: Props) {
    const [confirmDelete, setConfirmDelete] = useState(false);
    const [loading, setLoading] = useState(false);

    const toggle = async () => {
        try {
            setLoading(true);

            await axiosInstance.patch(
                `/purchasing/api/v1/employees/${employee.id}/patch/`,
                {
                    is_active: !employee.is_active,
                }
            );

            onUpdated();
        } finally {
            setLoading(false);
        }
    };

    const remove = async () => {
        try {
            setLoading(true);

            await axiosInstance.delete(
                `/purchasing/api/v1/employees/${employee.id}/delete/`
            );

            setConfirmDelete(false);
            onDeleted();
        } finally {
            setLoading(false);
        }
    };

    return (
        <>
            <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{
                    duration: 0.2,
                    delay: index * 0.03,
                }}
                className="group relative overflow-hidden rounded-[1.8rem] border border-gray-100 bg-white p-4 shadow-[0_8px_28px_rgba(15,23,42,0.035)] transition-all hover:shadow-[0_12px_36px_rgba(15,23,42,0.08)] dark:border-white/[0.07] dark:bg-[#111a2d]"
            >
                <div
                    className={`absolute right-0 top-0 h-full w-1 ${employee.is_active
                        ? "bg-gradient-to-b from-indigo-500 to-violet-500"
                        : "bg-gradient-to-b from-gray-300 to-gray-400 dark:from-white/10 dark:to-white/5"
                        }`}
                />

                <div className="flex items-start justify-between gap-3">
                    <div className="flex min-w-0 items-center gap-3">
                        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-indigo-500/10 text-indigo-500">
                            <UserRound size={18} />
                        </div>

                        <div className="min-w-0">
                            <h3 className="truncate text-[12.5px] font-extrabold text-gray-900 dark:text-white">
                                {employee.employee_name}
                            </h3>

                            <div className="mt-1 flex items-center gap-1.5">
                                <span
                                    className={`rounded-lg px-2 py-1 text-[8.5px] font-bold ${employee.is_active
                                        ? "bg-emerald-500/10 text-emerald-500"
                                        : "bg-gray-500/10 text-gray-400"
                                        }`}
                                >
                                    {employee.is_active
                                        ? "فعال"
                                        : "غیرفعال"}
                                </span>
                            </div>
                        </div>
                    </div>

                    <button
                        type="button"
                        onClick={() => setConfirmDelete(true)}
                        disabled={loading}
                        className="flex h-7 w-7 shrink-0 items-center justify-center rounded-xl bg-red-500/10 text-red-500 opacity-0 transition-all group-hover:opacity-100 disabled:opacity-40"
                    >
                        <Trash2 size={12} />
                    </button>
                </div>

                <div className="mt-3 grid grid-cols-2 gap-2">
                    <div className="rounded-2xl bg-gray-50 px-3 py-2 dark:bg-white/[0.035]">
                        <p className="text-[8.5px] font-semibold text-gray-400">
                            وضعیت
                        </p>

                        <p className="mt-1 text-[10px] font-extrabold text-gray-700 dark:text-white/75">
                            {employee.is_active
                                ? "در دسترس"
                                : "غیرفعال"}
                        </p>
                    </div>

                    <div className="rounded-2xl bg-gray-50 px-3 py-2 dark:bg-white/[0.035]">
                        <p className="text-[8.5px] font-semibold text-gray-400">
                            شناسه
                        </p>

                        <p className="mt-1 text-[10px] font-extrabold text-gray-700 dark:text-white/75">
                            #{employee.employee}
                        </p>
                    </div>
                </div>

                <button
                    type="button"
                    onClick={toggle}
                    disabled={loading}
                    className={`mt-3 flex w-full items-center justify-between rounded-2xl px-3 py-2 transition-all disabled:opacity-50 ${employee.is_active
                        ? "bg-emerald-500/10"
                        : "bg-gray-500/10"
                        }`}
                >
                    <span
                        className={`text-[9.5px] font-bold ${employee.is_active
                            ? "text-emerald-500"
                            : "text-gray-400"
                            }`}
                    >
                        {employee.is_active
                            ? "دسترسی فعال"
                            : "دسترسی غیرفعال"}
                    </span>

                    <span
                        className={`relative flex h-6 w-10 items-center rounded-full transition-all ${employee.is_active
                            ? "bg-emerald-500"
                            : "bg-gray-300 dark:bg-white/10"
                            }`}
                    >
                        <span
                            className={`absolute flex h-5 w-5 items-center justify-center rounded-full bg-white shadow-sm transition-all ${employee.is_active
                                ? "right-0.5"
                                : "right-[1.1rem]"
                                }`}
                        >
                            {employee.is_active ? (
                                <Check
                                    size={10}
                                    className="text-emerald-500"
                                />
                            ) : (
                                <Power
                                    size={10}
                                    className="text-gray-400"
                                />
                            )}
                        </span>
                    </span>
                </button>
            </motion.div>

            <AnimatePresence>
                {confirmDelete && (
                    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/40 p-4 backdrop-blur-sm">
                        <motion.div
                            initial={{
                                opacity: 0,
                                scale: 0.95,
                            }}
                            animate={{
                                opacity: 1,
                                scale: 1,
                            }}
                            exit={{
                                opacity: 0,
                                scale: 0.95,
                            }}
                            className="w-full max-w-[360px] rounded-[2rem] border border-gray-100 bg-white p-5 shadow-2xl dark:border-white/[0.07] dark:bg-[#111827]"
                            dir="rtl"
                        >
                            <div className="flex items-center justify-between">
                                <div>
                                    <h3 className="text-[13px] font-extrabold text-gray-900 dark:text-white">
                                        حذف کارمند
                                    </h3>

                                    <p className="mt-1 text-[10px] text-gray-400">
                                        این عملیات قابل بازگشت نیست.
                                    </p>
                                </div>

                                <button
                                    type="button"
                                    onClick={() =>
                                        setConfirmDelete(false)
                                    }
                                    className="flex h-8 w-8 items-center justify-center rounded-xl bg-gray-100 text-gray-400 dark:bg-white/[0.05]"
                                >
                                    <X size={14} />
                                </button>
                            </div>

                            <div className="mt-4 rounded-2xl bg-red-500/10 px-3 py-3 text-[11px] font-semibold leading-6 text-red-500">
                                آیا از حذف{" "}
                                <span className="font-extrabold">
                                    {employee.employee_name}
                                </span>{" "}
                                مطمئن هستید؟
                            </div>

                            <div className="mt-4 flex gap-2">
                                <button
                                    type="button"
                                    onClick={() =>
                                        setConfirmDelete(false)
                                    }
                                    className="flex-1 rounded-2xl bg-gray-100 py-2.5 text-[10.5px] font-bold text-gray-600 dark:bg-white/[0.06] dark:text-white/70"
                                >
                                    انصراف
                                </button>

                                <button
                                    type="button"
                                    onClick={remove}
                                    disabled={loading}
                                    className="flex-1 rounded-2xl bg-red-500 py-2.5 text-[10.5px] font-bold text-white disabled:opacity-50"
                                >
                                    حذف
                                </button>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </>
    );
}