"use client";

import { AnimatePresence, motion } from "framer-motion";
import {
    Edit3,
    Layers3,
    Trash2,
    UserRound,
    Users,
    X,
} from "lucide-react";
import { useState } from "react";
import axiosInstance from "@/lib/axiosInstance";
import type { ApiPurchasingStep } from "@/types/purchasing";

interface Props {
    step: ApiPurchasingStep;
    index: number;
    onEdit: () => void;
    onDeleted: () => void;
}

export default function StepCard({
    step,
    index,
    onEdit,
    onDeleted,
}: Props) {
    const [confirmDelete, setConfirmDelete] = useState(false);
    const [loading, setLoading] = useState(false);

    const remove = async () => {
        try {
            setLoading(true);

            await axiosInstance.delete(
                `/purchasing/api/v1/steps/${step.id}/delete/`
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
                className="group relative h-full overflow-hidden rounded-[1.8rem] border border-[#DCEAFB] bg-white p-4 shadow-[0_8px_28px_rgba(37,99,235,0.06)] transition-all hover:-translate-y-0.5 hover:shadow-[0_16px_40px_rgba(37,99,235,0.14)] dark:border-[rgba(96,165,250,0.14)] dark:bg-[#0E1F38]"
            >
                <div className="absolute right-0 top-0 h-full w-1 bg-gradient-to-b from-[#2563EB] to-[#06B6D4]" />

                <div className="flex items-start justify-between gap-3">
                    <div className="flex min-w-0 items-center gap-3">
                        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-[#2563EB]/12 to-[#06B6D4]/12 text-[#2563EB] dark:text-[#38BDF8]">
                            <Layers3 size={17} />
                        </div>

                        <div className="min-w-0">
                            <div className="flex items-center gap-1.5">
                                <span className="rounded-lg bg-[#2563EB]/10 px-2 py-1 text-[8px] font-extrabold text-[#2563EB] dark:text-[#38BDF8]">
                                    {step.order}
                                </span>

                                <h3 className="truncate text-[12px] font-extrabold text-[#0F2647] dark:text-white">
                                    {step.title}
                                </h3>
                            </div>

                            <p className="mt-1 truncate text-[9.5px] text-[#5D7595] dark:text-[#8FAAD1]">
                                {step.description ||
                                    "بدون توضیحات"}
                            </p>
                        </div>
                    </div>

                    <div className="flex items-center gap-1 opacity-0 transition-opacity group-hover:opacity-100">
                        <button
                            type="button"
                            onClick={onEdit}
                            className="flex h-7 w-7 items-center justify-center rounded-xl bg-[#2563EB]/10 text-[#2563EB] dark:text-[#38BDF8]"
                        >
                            <Edit3 size={11} />
                        </button>

                        <button
                            type="button"
                            onClick={() =>
                                setConfirmDelete(true)
                            }
                            className="flex h-7 w-7 items-center justify-center rounded-xl bg-rose-500/10 text-rose-500"
                        >
                            <Trash2 size={11} />
                        </button>
                    </div>
                </div>

                <div className="mt-4 rounded-2xl bg-[#F3F8FF] p-3 dark:bg-[rgba(96,165,250,0.06)]">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-1.5 text-[9.5px] font-bold text-[#5D7595] dark:text-[#8FAAD1]">
                            <Users size={11} />
                            مسئولان مرحله
                        </div>

                        <span className="rounded-lg bg-[#2563EB]/10 px-2 py-1 text-[8px] font-extrabold text-[#2563EB] dark:text-[#38BDF8]">
                            {step.employees_detail.length}
                        </span>
                    </div>

                    <div className="mt-2 flex flex-wrap gap-1.5">
                        {step.employees_detail.length ? (
                            step.employees_detail.map(
                                (employee) => (
                                    <span
                                        key={employee.id}
                                        className="inline-flex items-center gap-1 rounded-xl bg-white px-2 py-1.5 text-[9px] font-bold text-[#3D5B82] shadow-sm dark:bg-[rgba(96,165,250,0.1)] dark:text-[#C7D9F2]"
                                    >
                                        <UserRound
                                            size={9}
                                        />
                                        {
                                            employee.full_name
                                        }
                                    </span>
                                )
                            )
                        ) : (
                            <span className="text-[9px] text-[#5D7595] dark:text-[#8FAAD1]">
                                مسئول تعیین نشده
                            </span>
                        )}
                    </div>
                </div>
            </motion.div>

            <AnimatePresence>
                {confirmDelete && (
                    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-[#050B18]/50 p-4 backdrop-blur-sm">
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
                            className="w-full max-w-[360px] rounded-[2rem] bg-white p-5 shadow-2xl dark:bg-[#0E1F38]"
                            dir="rtl"
                        >
                            <div className="flex items-center justify-between">
                                <div>
                                    <h3 className="text-[13px] font-extrabold text-[#0F2647] dark:text-white">
                                        حذف مرحله
                                    </h3>

                                    <p className="mt-1 text-[10px] text-[#5D7595] dark:text-[#8FAAD1]">
                                        این عملیات قابل بازگشت نیست.
                                    </p>
                                </div>

                                <button
                                    type="button"
                                    onClick={() =>
                                        setConfirmDelete(false)
                                    }
                                    className="flex h-8 w-8 items-center justify-center rounded-xl bg-[#F3F8FF] text-[#5D7595] dark:bg-[rgba(96,165,250,0.08)] dark:text-[#8FAAD1]"
                                >
                                    <X size={14} />
                                </button>
                            </div>

                            <div className="mt-4 rounded-2xl bg-rose-500/10 px-3 py-3 text-[10.5px] font-semibold leading-6 text-rose-500">
                                آیا از حذف مرحله{" "}
                                <span className="font-extrabold">
                                    {step.title}
                                </span>{" "}
                                مطمئن هستید؟
                            </div>

                            <div className="mt-4 flex gap-2">
                                <button
                                    type="button"
                                    onClick={() =>
                                        setConfirmDelete(false)
                                    }
                                    className="flex-1 rounded-2xl bg-[#F3F8FF] py-2.5 text-[10.5px] font-bold text-[#3D5B82] dark:bg-[rgba(96,165,250,0.08)] dark:text-[#8FAAD1]"
                                >
                                    انصراف
                                </button>

                                <button
                                    type="button"
                                    onClick={remove}
                                    disabled={loading}
                                    className="flex-1 rounded-2xl bg-rose-500 py-2.5 text-[10.5px] font-bold text-white transition hover:bg-rose-600 disabled:opacity-50"
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