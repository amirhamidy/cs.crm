"use client";

import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import {
    ArrowLeftCircle,
    ArrowRightCircle,
    CheckCircle2,
    History,
    Loader2,
    Paperclip,
    ShoppingCart,
} from "lucide-react";
import axiosInstance from "@/lib/axiosInstance";
import type { AxiosError } from "axios";
import {
    ApiPurchasingEmployee,
    ApiPurchasingTask,
    ApiTaskAttachment,
    PURCHASING_TASK_STATUS_META,
} from "@/types/purchasing";
import TaskActionModal from "./TaskActionModal";

interface TaskCardProps {
    task: ApiPurchasingTask;
    index: number;
    employees: ApiPurchasingEmployee[];
    onUpdated: () => void;
}

function getErrorMessage(err: unknown, fallback: string) {
    const error = err as AxiosError<Record<string, unknown>>;
    const data = error.response?.data;
    if (!data) return fallback;
    const keys = ["detail", "status", "message", "error"];
    for (const key of keys) {
        const val = data[key];
        if (typeof val === "string") return val;
    }
    return fallback;
}

export default function TaskCard({ task, index, employees, onUpdated }: TaskCardProps) {
    const [modalMode, setModalMode] = useState<"advance" | "revert" | null>(null);
    const [completing, setCompleting] = useState(false);
    const [error, setError] = useState("");

    const [showHistory, setShowHistory] = useState(false);
    const [history, setHistory] = useState<ApiTaskAttachment[]>([]);
    const [loadingHistory, setLoadingHistory] = useState(false);

    const meta = PURCHASING_TASK_STATUS_META[task.status];
    const isCompleted = task.status === "completed";

    async function handleComplete() {
        setCompleting(true);
        setError("");
        try {
            await axiosInstance.patch(`/purchasing/api/v1/tasks/${task.id}/status/`, {
                status: "completed",
            });
            onUpdated();
        } catch (err) {
            setError(getErrorMessage(err, "خطا در تکمیل وظیفه"));
        } finally {
            setCompleting(false);
        }
    }

    async function toggleHistory() {
        if (showHistory) {
            setShowHistory(false);
            return;
        }
        setShowHistory(true);
        setLoadingHistory(true);
        try {
            const { data } = await axiosInstance.get<ApiTaskAttachment[]>(
                `/purchasing/api/v1/tasks/${task.id}/history/`
            );
            setHistory(Array.isArray(data) ? data : []);
        } catch {
            setHistory([]);
        } finally {
            setLoadingHistory(false);
        }
    }

    return (
        <>
            <motion.div
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.2, delay: index * 0.04 }}
                className="flex flex-col gap-3 rounded-3xl border border-gray-100 bg-white p-4 dark:border-white/[0.06] dark:bg-white/[0.02]"
            >
                <div className="flex items-center justify-between">
                    <span
                        className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[10px] font-extrabold"
                        style={{ background: meta.bg, color: meta.color }}
                    >
                        {meta.label}
                    </span>
                    <span className="text-[10px] font-semibold text-gray-400">
                        وظیفه خرید #{task.id}
                    </span>
                </div>

                <div className="flex items-center gap-3">
                    <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-blue-50 dark:bg-blue-500/10">
                        <ShoppingCart size={18} className="text-blue-500" />
                    </div>
                    <div className="min-w-0">
                        <h3 className="truncate text-[13px] font-extrabold text-gray-900 dark:text-white">
                            {task.product_name}
                        </h3>
                        <p className="mt-0.5 text-[11px] text-gray-400 dark:text-gray-500">
                            مرحله فعلی: {task.process_step_title} (#{task.process_step_order})
                        </p>
                    </div>
                </div>

                <div className="flex flex-col gap-1.5 rounded-2xl bg-gray-50 px-3 py-2.5 dark:bg-white/[0.035]">
                    <div className="flex items-center justify-between text-[11px]">
                        <span className="font-semibold text-gray-400 dark:text-white/35">مقدار قابل خرید</span>
                        <span className="font-extrabold text-gray-700 dark:text-white/80">
                            {task.purchase_quantity}
                        </span>
                    </div>
                    <div className="flex items-center justify-between text-[11px]">
                        <span className="font-semibold text-gray-400 dark:text-white/35">موجودی فعلی انبار</span>
                        <span className="font-extrabold text-gray-700 dark:text-white/80">
                            {task.quantity_after}
                        </span>
                    </div>
                    <div className="flex items-center justify-between text-[11px]">
                        <span className="font-semibold text-gray-400 dark:text-white/35">بازه مجاز موجودی</span>
                        <span className="font-extrabold text-gray-700 dark:text-white/80">
                            {task.minimum_stock} تا {task.maximum_stock}
                        </span>
                    </div>
                </div>

                {!isCompleted && (
                    <div className="flex flex-wrap gap-2">
                        <button
                            type="button"
                            onClick={() => setModalMode("advance")}
                            className="flex flex-1 items-center justify-center gap-1.5 rounded-2xl bg-emerald-600 py-2.5 text-[12px] font-bold text-white transition-colors hover:bg-emerald-500"
                        >
                            <ArrowLeftCircle size={14} />
                            مرحله بعد
                        </button>
                        <button
                            type="button"
                            onClick={() => setModalMode("revert")}
                            className="flex flex-1 items-center justify-center gap-1.5 rounded-2xl bg-amber-500 py-2.5 text-[12px] font-bold text-white transition-colors hover:bg-amber-400"
                        >
                            <ArrowRightCircle size={14} />
                            مرحله قبل
                        </button>
                        <button
                            type="button"
                            onClick={handleComplete}
                            disabled={completing}
                            className="flex flex-1 items-center justify-center gap-1.5 rounded-2xl bg-indigo-600 py-2.5 text-[12px] font-bold text-white transition-colors hover:bg-indigo-500 disabled:opacity-60"
                        >
                            {completing ? (
                                <Loader2 size={14} className="animate-spin" />
                            ) : (
                                <>
                                    <CheckCircle2 size={14} />
                                    ارسال به کنترل کیفی
                                </>
                            )}
                        </button>
                    </div>
                )}

                {error && (
                    <p className="text-center text-[11px] font-semibold text-red-500">{error}</p>
                )}

                <button
                    type="button"
                    onClick={toggleHistory}
                    className="flex items-center justify-center gap-1.5 rounded-2xl bg-gray-100 py-2 text-[11.5px] font-bold text-gray-600 transition-colors dark:bg-white/[0.05] dark:text-gray-300"
                >
                    <History size={13} />
                    {showHistory ? "بستن تاریخچه" : "نمایش تاریخچه"}
                </button>

                <AnimatePresence>
                    {showHistory && (
                        <motion.div
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: "auto" }}
                            exit={{ opacity: 0, height: 0 }}
                            className="overflow-hidden"
                        >
                            {loadingHistory ? (
                                <div className="flex items-center justify-center py-4 text-gray-400">
                                    <Loader2 size={16} className="animate-spin" />
                                </div>
                            ) : history.length === 0 ? (
                                <p className="py-3 text-center text-[11px] text-gray-400">
                                    تاریخچه‌ای ثبت نشده است
                                </p>
                            ) : (
                                <div className="flex flex-col gap-2 pt-1">
                                    {history.map((item) => (
                                        <div
                                            key={item.id}
                                            className="flex items-start gap-2 rounded-2xl bg-gray-50 px-3 py-2 dark:bg-white/[0.035]"
                                        >
                                            <div className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-lg bg-gray-200 dark:bg-white/[0.08]">
                                                <Paperclip size={11} className="text-gray-500" />
                                            </div>
                                            <div className="min-w-0 flex-1">
                                                <p className="text-[11px] font-bold text-gray-700 dark:text-gray-200">
                                                    {item.type_display} · {item.created_by_name}
                                                </p>
                                                {item.note && (
                                                    <p className="mt-0.5 text-[10.5px] text-gray-500 dark:text-gray-400">
                                                        {item.note}
                                                    </p>
                                                )}
                                                {item.file_url && (
                                                    <a
                                                        href={item.file_url}
                                                        target="_blank"
                                                        rel="noreferrer"
                                                        className="mt-1 inline-block text-[10.5px] font-bold text-indigo-500"
                                                    >
                                                        مشاهده پیوست
                                                    </a>
                                                )}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </motion.div>
                    )}
                </AnimatePresence>
            </motion.div>

            {modalMode && (
                <TaskActionModal
                    isOpen={Boolean(modalMode)}
                    onClose={() => setModalMode(null)}
                    mode={modalMode}
                    task={task}
                    employees={employees}
                    onCompleted={onUpdated}
                />
            )}
        </>
    );
}