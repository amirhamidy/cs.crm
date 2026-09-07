"use client";

import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import {
    ArrowLeft,
    ArrowRight,
    FileUp,
    Loader2,
    MessageSquare,
    Upload,
    X,
} from "lucide-react";
import axiosInstance from "@/lib/axiosInstance";
import type {
    ApiPurchasingEmployee,
    ApiPurchasingTask,
} from "@/types/purchasing";
import {
    FloatingSelect,
    FloatingTextarea,
} from "./FormControls";

interface Props {
    isOpen: boolean;
    onClose: () => void;
    mode: "advance" | "revert";
    task: ApiPurchasingTask;
    employees: ApiPurchasingEmployee[];
    onCompleted: () => void;
}

export default function TaskActionModal({
    isOpen,
    onClose,
    mode,
    task,
    employees,
    onCompleted,
}: Props) {
    const [createdById, setCreatedById] = useState("");
    const [note, setNote] = useState("");
    const [file, setFile] = useState<File | null>(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");

    useEffect(() => {
        if (!isOpen) return;

        setCreatedById("");
        setNote("");
        setFile(null);
        setError("");
        setLoading(false);
    }, [isOpen]);

    const submit = async () => {
        if (!createdById) {
            setError(
                "لطفاً کارمند انجام‌دهنده را انتخاب کنید."
            );
            return;
        }

        try {
            setLoading(true);
            setError("");

            const formData = new FormData();

            formData.append("created_by", createdById);

            if (note.trim()) {
                formData.append("note", note.trim());
            }

            if (file) {
                formData.append("file", file);
            }

            const endpoint =
                mode === "advance"
                    ? `/purchasing/api/v1/tasks/${task.id}/advance/`
                    : `/purchasing/api/v1/tasks/${task.id}/revert/`;

            await axiosInstance.post(endpoint, formData);

            onCompleted();
        } catch (err: any) {
            setError(
                err?.response?.data?.detail ||
                err?.response?.data?.message ||
                err?.response?.data?.error ||
                "عملیات انجام نشد."
            );
        } finally {
            setLoading(false);
        }
    };

    return (
        <AnimatePresence>
            {isOpen && (
                <div
                    className="fixed inset-0 z-[100] flex items-center justify-center bg-black/45 p-4 backdrop-blur-sm"
                    dir="rtl"
                >
                    <motion.div
                        initial={{
                            opacity: 0,
                            scale: 0.96,
                            y: 12,
                        }}
                        animate={{
                            opacity: 1,
                            scale: 1,
                            y: 0,
                        }}
                        exit={{
                            opacity: 0,
                            scale: 0.96,
                            y: 12,
                        }}
                        className="w-full max-w-[430px] overflow-hidden rounded-[2rem] border border-gray-100 bg-white shadow-2xl dark:border-white/[0.07] dark:bg-[#0f172a]"
                    >
                        <div className="flex items-center justify-between border-b border-gray-100 px-5 py-4 dark:border-white/[0.06]">
                            <div className="flex items-center gap-3">
                                <div
                                    className={`flex h-9 w-9 items-center justify-center rounded-xl ${mode === "advance"
                                            ? "bg-indigo-500/10 text-indigo-500"
                                            : "bg-pink-500/10 text-pink-500"
                                        }`}
                                >
                                    {mode === "advance" ? (
                                        <ArrowLeft size={15} />
                                    ) : (
                                        <ArrowRight size={15} />
                                    )}
                                </div>

                                <div>
                                    <h3 className="text-[13px] font-extrabold text-gray-900 dark:text-white">
                                        {mode === "advance"
                                            ? "انتقال به مرحله بعد"
                                            : "بازگشت به مرحله قبل"}
                                    </h3>

                                    <p className="mt-0.5 max-w-[230px] truncate text-[9.5px] text-gray-400">
                                        {task.product_name}
                                    </p>
                                </div>
                            </div>

                            <button
                                type="button"
                                onClick={onClose}
                                disabled={loading}
                                className="flex h-8 w-8 items-center justify-center rounded-xl bg-gray-100 text-gray-400 dark:bg-white/[0.05]"
                            >
                                <X size={14} />
                            </button>
                        </div>

                        <div className="p-5">
                            <div className="flex flex-col gap-4">
                                <FloatingSelect
                                    label="کارمند انجام‌دهنده"
                                    value={createdById}
                                    onChange={(e) =>
                                        setCreatedById(
                                            e.target.value
                                        )
                                    }
                                >
                                    <option value="">
                                        انتخاب کارمند
                                    </option>

                                    {employees.map(
                                        (employee) => (
                                            <option
                                                key={
                                                    employee.id
                                                }
                                                value={
                                                    employee.employee
                                                }
                                            >
                                                {
                                                    employee.employee_name
                                                }
                                            </option>
                                        )
                                    )}
                                </FloatingSelect>

                                <FloatingTextarea
                                    label={
                                        mode === "advance"
                                            ? "یادداشت انتقال"
                                            : "دلیل بازگشت"
                                    }
                                    value={note}
                                    onChange={(e) =>
                                        setNote(e.target.value)
                                    }
                                    placeholder=" "
                                    rows={4}
                                />

                                <label className="group flex cursor-pointer flex-col items-center justify-center rounded-[1.5rem] border border-dashed border-gray-200 bg-gray-50 px-4 py-6 transition hover:border-indigo-300 hover:bg-indigo-50/50 dark:border-white/[0.08] dark:bg-white/[0.025]">
                                    <input
                                        type="file"
                                        className="hidden"
                                        onChange={(e) =>
                                            setFile(
                                                e.target
                                                    .files?.[0] ??
                                                null
                                            )
                                        }
                                    />

                                    {file ? (
                                        <>
                                            <FileUp
                                                size={19}
                                                className="text-indigo-500"
                                            />

                                            <span className="mt-2 max-w-full truncate text-[10px] font-bold text-gray-600 dark:text-white/70">
                                                {file.name}
                                            </span>
                                        </>
                                    ) : (
                                        <>
                                            <Upload
                                                size={19}
                                                className="text-gray-400 group-hover:text-indigo-500"
                                            />

                                            <span className="mt-2 text-[10px] font-bold text-gray-500 dark:text-white/50">
                                                افزودن فایل
                                            </span>

                                            <span className="mt-1 text-[8.5px] text-gray-400">
                                                اختیاری
                                            </span>
                                        </>
                                    )}
                                </label>

                                {error && (
                                    <div className="rounded-2xl bg-red-500/10 px-3 py-2.5 text-[10px] font-semibold text-red-500">
                                        {error}
                                    </div>
                                )}

                                <div className="flex gap-2">
                                    <button
                                        type="button"
                                        onClick={onClose}
                                        disabled={loading}
                                        className="flex-1 rounded-2xl bg-gray-100 py-3 text-[10.5px] font-bold text-gray-600 dark:bg-white/[0.06] dark:text-white/70"
                                    >
                                        انصراف
                                    </button>

                                    <button
                                        type="button"
                                        onClick={submit}
                                        disabled={
                                            loading ||
                                            !employees.length
                                        }
                                        className={`flex flex-1 items-center justify-center gap-2 rounded-2xl py-3 text-[10.5px] font-bold text-white disabled:opacity-50 ${mode === "advance"
                                                ? "bg-indigo-600"
                                                : "bg-pink-500"
                                            }`}
                                    >
                                        {loading ? (
                                            <Loader2
                                                size={14}
                                                className="animate-spin"
                                            />
                                        ) : mode ===
                                            "advance" ? (
                                            <>
                                                انتقال
                                                <ArrowLeft
                                                    size={13}
                                                />
                                            </>
                                        ) : (
                                            <>
                                                بازگشت
                                                <ArrowRight
                                                    size={13}
                                                />
                                            </>
                                        )}
                                    </button>
                                </div>
                            </div>
                        </div>
                    </motion.div>
                </div>
            )}
        </AnimatePresence>
    );
}