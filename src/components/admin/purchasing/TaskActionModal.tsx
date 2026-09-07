"use client";

import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { ArrowLeftCircle, ArrowRightCircle, Loader, X } from "lucide-react";
import axiosInstance from "@/lib/axiosInstance";
import type { AxiosError } from "axios";
import type { ApiPurchasingEmployee, ApiPurchasingTask } from "@/types/purchasing";
import { FloatingSelect, FloatingTextarea } from "./FormControls";

type Mode = "advance" | "revert";

interface TaskActionModalProps {
    isOpen: boolean;
    onClose: () => void;
    mode: Mode;
    task: ApiPurchasingTask;
    employees: ApiPurchasingEmployee[];
    onCompleted: () => void;
}

function getErrorMessage(err: unknown, fallback: string) {
    const error = err as AxiosError<Record<string, unknown>>;
    const data = error.response?.data;
    if (!data) return fallback;
    const keys = ["detail", "created_by", "message", "error", "non_field_errors"];
    for (const key of keys) {
        const val = data[key];
        if (typeof val === "string") return val;
        if (Array.isArray(val) && typeof val[0] === "string") return val[0];
    }
    return fallback;
}

export default function TaskActionModal({
    isOpen,
    onClose,
    mode,
    task,
    employees,
    onCompleted,
}: TaskActionModalProps) {
    const [createdById, setCreatedById] = useState("");
    const [note, setNote] = useState("");
    const [file, setFile] = useState<File | null>(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");

    const isAdvance = mode === "advance";

    useEffect(() => {
        if (!isOpen) return;
        setCreatedById("");
        setNote("");
        setFile(null);
        setError("");
    }, [isOpen, mode]);

    function handleClose() {
        if (loading) return;
        onClose();
    }

    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault();
        if (!createdById) {
            setError("انتخاب کارمند الزامی است");
            return;
        }

        setLoading(true);
        setError("");

        try {
            const formData = new FormData();
            formData.append("created_by", createdById);
            if (note.trim()) formData.append("note", note.trim());
            if (file) formData.append("file", file);

            const endpoint = isAdvance
                ? `/purchasing/api/v1/tasks/${task.id}/advance/`
                : `/purchasing/api/v1/tasks/${task.id}/revert/`;

            await axiosInstance.post(endpoint, formData);
            onCompleted();
            onClose();
        } catch (err) {
            setError(
                getErrorMessage(err, isAdvance ? "خطا در انتقال به مرحله بعد" : "خطا در بازگشت به مرحله قبل")
            );
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
                    className="fixed inset-0 z-50 flex items-center justify-center px-4"
                    style={{ background: "rgba(0,0,0,0.45)", backdropFilter: "blur(3px)" }}
                    onClick={handleClose}
                >
                    <motion.div
                        initial={{ opacity: 0, y: 16 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: 16 }}
                        transition={{ duration: 0.35, ease: "easeOut" }}
                        className="w-full max-w-sm rounded-[2rem] border border-gray-100 bg-white p-8 shadow-sm dark:border-white/[0.06] dark:bg-[#0f172a]"
                        onClick={(e) => e.stopPropagation()}
                        dir="rtl"
                    >
                        <div className="mb-6 flex items-center justify-between">
                            <div className="flex items-center gap-2.5">
                                <div
                                    className={`flex h-8 w-8 items-center justify-center rounded-xl ${isAdvance
                                        ? "bg-emerald-50 dark:bg-emerald-500/10"
                                        : "bg-amber-50 dark:bg-amber-500/10"
                                        }`}
                                >
                                    {isAdvance ? (
                                        <ArrowLeftCircle size={15} className="text-emerald-500" />
                                    ) : (
                                        <ArrowRightCircle size={15} className="text-amber-500" />
                                    )}
                                </div>
                                <div>
                                    <h3 className="text-[14px] font-extrabold text-gray-900 dark:text-white">
                                        {isAdvance ? "انتقال به مرحله بعد" : "بازگشت به مرحله قبل"}
                                    </h3>
                                    <p className="mt-0.5 text-[11px] text-gray-400">
                                        {task.product_name}
                                    </p>
                                </div>
                            </div>
                            <button
                                type="button"
                                onClick={handleClose}
                                disabled={loading}
                                className="flex h-8 w-8 items-center justify-center rounded-xl bg-gray-100 text-gray-400 transition-colors hover:text-gray-600 disabled:opacity-40 dark:bg-white/[0.05] dark:hover:text-gray-300"
                            >
                                <X size={15} />
                            </button>
                        </div>

                        <form onSubmit={handleSubmit} className="flex flex-col gap-5">
                            <FloatingSelect
                                label="ثبت‌کننده"
                                id="task_action_created_by"
                                value={createdById}
                                onChange={(e) => {
                                    setCreatedById(e.target.value);
                                    setError("");
                                }}
                                dir="rtl"
                            >
                                <option value="" disabled>
                                    انتخاب کنید
                                </option>
                                {employees.map((emp) => (
                                    <option key={emp.id} value={emp.employee}>
                                        {emp.employee_name}
                                    </option>
                                ))}
                            </FloatingSelect>

                            <FloatingTextarea
                                label="توضیحات"
                                id="task_action_note"
                                value={note}
                                onChange={(e) => setNote(e.target.value)}
                                dir="rtl"
                            />

                            <div className="flex flex-col gap-1.5">
                                <span className="text-[11.5px] font-bold text-gray-500 dark:text-gray-400">
                                    فایل پیوست (اختیاری)
                                </span>
                                <input
                                    type="file"
                                    onChange={(e) => setFile(e.target.files?.[0] ?? null)}
                                    className="text-[11.5px] text-gray-500 file:ml-3 file:rounded-xl file:border-0 file:bg-gray-100 file:px-3 file:py-2 file:text-[11px] file:font-bold file:text-gray-600 dark:text-gray-400 dark:file:bg-white/[0.06] dark:file:text-gray-300"
                                />
                            </div>

                            {error && (
                                <p className="text-center text-[11.5px] font-semibold text-red-500 -mt-2">
                                    {error}
                                </p>
                            )}

                            <motion.button
                                type="submit"
                                disabled={loading}
                                whileTap={{ scale: 0.97 }}
                                className={`flex items-center justify-center rounded-full py-3 text-sm font-bold text-white transition-colors disabled:opacity-50 ${isAdvance
                                    ? "bg-emerald-600 hover:bg-emerald-500"
                                    : "bg-amber-600 hover:bg-amber-500"
                                    }`}
                            >
                                {loading ? (
                                    <Loader size={18} className="animate-spin" />
                                ) : isAdvance ? (
                                    "انتقال به مرحله بعد"
                                ) : (
                                    "بازگشت به مرحله قبل"
                                )}
                            </motion.button>
                        </form>
                    </motion.div>
                </motion.div>
            )}
        </AnimatePresence>
    );
}