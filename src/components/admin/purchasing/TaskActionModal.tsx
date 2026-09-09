"use client";

import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import {
    ArrowLeft,
    ArrowRight,
    FileUp,
    Loader2,
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
    OPTION_CLASS,
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
                    className="fixed inset-0 z-[100] flex items-center justify-center bg-[#050B18]/55 p-4 backdrop-blur-sm"
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
                        className="w-full max-w-[430px] overflow-hidden rounded-[2rem] border border-[#DCEAFB] bg-white shadow-2xl dark:border-[rgba(96,165,250,0.14)] dark:bg-[#0A1930]"
                    >
                        <div className="flex items-center justify-between border-b border-[#DCEAFB] px-5 py-4 dark:border-[rgba(96,165,250,0.12)]">
                            <div className="flex items-center gap-3">
                                <div
                                    className={`flex h-9 w-9 items-center justify-center rounded-xl ${mode === "advance"
                                        ? "bg-[#2563EB]/10 text-[#2563EB] dark:text-[#38BDF8]"
                                        : "bg-[#F43F5E]/10 text-[#F43F5E]"
                                        }`}
                                >
                                    {mode === "advance" ? (
                                        <ArrowLeft size={15} />
                                    ) : (
                                        <ArrowRight size={15} />
                                    )}
                                </div>

                                <div>
                                    <h3 className="text-[13px] font-extrabold text-[#0F2647] dark:text-white">
                                        {mode === "advance"
                                            ? "انتقال به مرحله بعد"
                                            : "بازگشت به مرحله قبل"}
                                    </h3>

                                    <p className="mt-0.5 max-w-[230px] truncate text-[9.5px] text-[#5D7595] dark:text-[#8FAAD1]">
                                        {task.product_name}
                                    </p>
                                </div>
                            </div>

                            <button
                                type="button"
                                onClick={onClose}
                                disabled={loading}
                                className="flex h-8 w-8 items-center justify-center rounded-xl bg-[#F3F8FF] text-[#5D7595] dark:bg-[rgba(96,165,250,0.08)] dark:text-[#8FAAD1]"
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
                                    <option value="" className={OPTION_CLASS}>
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
                                                className={OPTION_CLASS}
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

                                <label className="group flex cursor-pointer flex-col items-center justify-center rounded-[1.5rem] border border-dashed border-[#BFD9FA] bg-[#F3F8FF] px-4 py-6 transition hover:border-[#2563EB]/50 hover:bg-[#EAF3FF] dark:border-[rgba(96,165,250,0.22)] dark:bg-[rgba(96,165,250,0.04)] dark:hover:bg-[rgba(96,165,250,0.08)]">
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
                                                className="text-[#2563EB] dark:text-[#38BDF8]"
                                            />

                                            <span className="mt-2 max-w-full truncate text-[10px] font-bold text-[#3D5B82] dark:text-[#C7D9F2]">
                                                {file.name}
                                            </span>
                                        </>
                                    ) : (
                                        <>
                                            <Upload
                                                size={19}
                                                className="text-[#5D7595] group-hover:text-[#2563EB] dark:text-[#8FAAD1] dark:group-hover:text-[#38BDF8]"
                                            />

                                            <span className="mt-2 text-[10px] font-bold text-[#5D7595] dark:text-[#8FAAD1]">
                                                افزودن فایل
                                            </span>

                                            <span className="mt-1 text-[8.5px] text-[#5D7595] dark:text-[#7C93B8]">
                                                اختیاری
                                            </span>
                                        </>
                                    )}
                                </label>

                                {error && (
                                    <div className="rounded-2xl bg-rose-500/10 px-3 py-2.5 text-[10px] font-semibold text-rose-500">
                                        {error}
                                    </div>
                                )}

                                <div className="flex gap-2">
                                    <button
                                        type="button"
                                        onClick={onClose}
                                        disabled={loading}
                                        className="flex-1 rounded-2xl bg-[#F3F8FF] py-3 text-[10.5px] font-bold text-[#3D5B82] dark:bg-[rgba(96,165,250,0.08)] dark:text-[#8FAAD1]"
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
                                        className={`flex flex-1 items-center justify-center gap-2 rounded-2xl py-3 text-[10.5px] font-bold text-white shadow-lg disabled:opacity-50 disabled:shadow-none ${mode === "advance"
                                            ? "bg-gradient-to-r from-[#2563EB] to-[#0EA5E9] shadow-[#2563EB]/25 hover:brightness-110"
                                            : "bg-[#F43F5E] shadow-[#F43F5E]/25 hover:bg-rose-600"
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