"use client";

import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { X, FileText, Loader2, AlertCircle } from "lucide-react";
import { useTheme } from "next-themes";
import axiosInstance from "@/lib/axiosInstance";

interface TaskCaseDescriptionModalProps {
    isOpen: boolean;
    onClose: () => void;
    caseId?: number | null;
    taskTitle?: string;
}

interface CaseDetail {
    id: number;
    customer: number;
    title: string;
    description: string;
    resources: string[];
    created_at: string;
    updated_at: string;
}

export default function TaskCaseDescriptionModal({
    isOpen,
    onClose,
    caseId,
    taskTitle,
}: TaskCaseDescriptionModalProps) {
    const { resolvedTheme } = useTheme();
    const isDark = resolvedTheme === "dark";

    const [caseData, setCaseData] = useState<CaseDetail | null>(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");

    useEffect(() => {
        if (!isOpen || !caseId) {
            return;
        }

        setLoading(true);
        setError("");
        setCaseData(null);

        axiosInstance
            .get<CaseDetail>(`/tasks/api/v1/cases/${caseId}/`)
            .then((res) => {
                setCaseData(res.data);
            })
            .catch(() => {
                setError("دریافت توضیحات پرونده با خطا مواجه شد");
            })
            .finally(() => {
                setLoading(false);
            });
    }, [isOpen, caseId]);

    if (!isOpen) return null;

    return (
        <AnimatePresence>
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 z-50 flex items-center justify-center px-4"
                style={{ background: "rgba(0,0,0,0.5)", backdropFilter: "blur(3px)" }}
                onClick={onClose}
            >
                <motion.div
                    initial={{ scale: 0.94, y: 18 }}
                    animate={{ scale: 1, y: 0 }}
                    exit={{ scale: 0.94, y: 18 }}
                    transition={{ duration: 0.22, ease: "easeOut" }}
                    className="w-full max-w-[430px] overflow-hidden rounded-3xl border"
                    style={{
                        background: isDark ? "#0f172a" : "#ffffff",
                        borderColor: isDark ? "rgba(255,255,255,0.07)" : "rgba(0,0,0,0.06)",
                        boxShadow: "0 24px 64px rgba(0,0,0,0.28)",
                    }}
                    onClick={(e) => e.stopPropagation()}
                    dir="rtl"
                >
                    <div
                        className="flex items-center justify-between border-b px-5 py-4"
                        style={{ borderColor: isDark ? "rgba(255,255,255,0.06)" : "rgba(0,0,0,0.06)" }}
                    >
                        <div className="flex items-center gap-3">
                            <div
                                className="flex h-9 w-9 items-center justify-center rounded-xl"
                                style={{ background: "rgba(99,102,241,0.10)" }}
                            >
                                <FileText size={15} className="text-indigo-500" />
                            </div>
                            <div>
                                <h3 className="text-[14px] font-extrabold text-gray-900 dark:text-white">
                                    توضیحات پرونده
                                </h3>
                                {taskTitle && (
                                    <p className="mt-0.5 text-[11px] text-gray-400 dark:text-gray-500">
                                        {taskTitle}
                                    </p>
                                )}
                            </div>
                        </div>
                        <button
                            type="button"
                            onClick={onClose}
                            className="flex h-8 w-8 items-center justify-center rounded-xl text-gray-400 transition-colors hover:text-gray-600 dark:hover:text-gray-300"
                            style={{ background: isDark ? "rgba(255,255,255,0.05)" : "rgba(0,0,0,0.04)" }}
                        >
                            <X size={15} />
                        </button>
                    </div>

                    <div className="max-h-[420px] overflow-y-auto p-5">
                        {loading ? (
                            <div className="flex flex-col items-center justify-center gap-2 py-10 text-gray-400">
                                <Loader2 size={20} className="animate-spin" />
                                <p className="text-[12px] font-semibold">در حال دریافت اطلاعات...</p>
                            </div>
                        ) : error ? (
                            <div className="flex flex-col items-center justify-center gap-2 py-10 text-red-500">
                                <AlertCircle size={20} />
                                <p className="text-[12px] font-semibold">{error}</p>
                            </div>
                        ) : caseData ? (
                            <div className="flex flex-col gap-4">
                                <div>
                                    <p className="text-[11px] font-bold text-gray-400 dark:text-gray-500">
                                        عنوان پرونده
                                    </p>
                                    <p className="mt-1 text-[13.5px] font-extrabold text-gray-900 dark:text-white">
                                        {caseData.title}
                                    </p>
                                </div>

                                <div>
                                    <p className="text-[11px] font-bold text-gray-400 dark:text-gray-500">
                                        توضیحات
                                    </p>
                                    <p
                                        className="mt-1.5 whitespace-pre-wrap rounded-2xl px-4 py-3 text-[12.5px] font-medium leading-6 text-gray-700 dark:text-gray-200"
                                        style={{
                                            background: isDark ? "rgba(255,255,255,0.04)" : "rgba(0,0,0,0.03)",
                                        }}
                                    >
                                        {caseData.description?.trim()
                                            ? caseData.description
                                            : "توضیحاتی برای این پرونده ثبت نشده"}
                                    </p>
                                </div>
                            </div>
                        ) : (
                            <div className="flex flex-col items-center justify-center gap-2 py-10 text-gray-400">
                                <FileText size={20} />
                                <p className="text-[12px] font-semibold">پرونده‌ای ثبت نشده</p>
                            </div>
                        )}
                    </div>
                </motion.div>
            </motion.div>
        </AnimatePresence>
    );
}