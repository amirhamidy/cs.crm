"use client";

import { useCallback, useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { AnimatePresence, motion } from "framer-motion";
import {
    X,
    Loader2,
    AlertCircle,
    History,
    ArrowLeftCircle,
    ArrowRightCircle,
    ClipboardList,
    MessageSquareText,
    Paperclip,
    RefreshCw,
    UserRound,
    Layers3,
} from "lucide-react";
import axiosInstance from "@/lib/axiosInstance";
import type { ApiTaskAttachment } from "@/types/purchasing";

interface Props {
    isOpen: boolean;
    onClose: () => void;
    taskId: number;
    taskTitle: string;
}

function formatDateTime(value: string) {
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return "—";
    return date.toLocaleString("fa-IR", {
        year: "numeric",
        month: "2-digit",
        day: "2-digit",
        hour: "2-digit",
        minute: "2-digit",
    });
}

function metaOf(type: string) {
    if (type === "advance")
        return { label: "انتقال به مرحله بعد", color: "#6366f1", bg: "rgba(99,102,241,0.14)", icon: ArrowLeftCircle };
    if (type === "revert")
        return { label: "بازگشت به مرحله قبل", color: "#f43f5e", bg: "rgba(244,63,94,0.14)", icon: ArrowRightCircle };
    if (type === "note")
        return { label: "یادداشت", color: "#0891b2", bg: "rgba(8,145,178,0.14)", icon: MessageSquareText };
    return { label: "رویداد", color: "#94a3b8", bg: "rgba(148,163,184,0.14)", icon: History };
}

export default function PurchasingTaskLogsModal({ isOpen, onClose, taskId, taskTitle }: Props) {
    const [logs, setLogs] = useState<ApiTaskAttachment[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const fetchLogs = useCallback(() => {
        setLoading(true);
        setError(null);
        axiosInstance
            .get<ApiTaskAttachment[]>("/purchasing/api/v1/task-attachments/")
            .then((res) => {
                const list = Array.isArray(res.data)
                    ? res.data
                    : (res.data as unknown as { results?: ApiTaskAttachment[] })?.results ?? [];
                setLogs(
                    list
                        .filter((item) => item.task === taskId)
                        .sort(
                            (a, b) =>
                                new Date(b.created_at).getTime() -
                                new Date(a.created_at).getTime()
                        )
                );
            })
            .catch(() => setError("خطا در دریافت تاریخچه"))
            .finally(() => setLoading(false));
    }, [taskId]);

    useEffect(() => {
        if (isOpen) fetchLogs();
    }, [isOpen, fetchLogs]);

    if (!isOpen) return null;
    if (typeof document === "undefined") return null;

    return createPortal(
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
                    className="flex max-h-[85vh] w-full max-w-[460px] flex-col overflow-hidden rounded-3xl border border-gray-100 bg-white shadow-2xl dark:border-white/[0.07] dark:bg-[#0f172a]"
                    onClick={(e) => e.stopPropagation()}
                    dir="rtl"
                >
                    <div className="flex shrink-0 items-center justify-between border-b border-gray-100 px-5 py-4 dark:border-white/[0.06]">
                        <div className="flex min-w-0 items-center gap-3">
                            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-indigo-500/10">
                                <History size={15} className="text-indigo-500" />
                            </div>
                            <div className="min-w-0">
                                <h3 className="text-[14px] font-extrabold text-gray-900 dark:text-white">
                                    تاریخچه تسک خرید
                                </h3>
                                <p className="mt-0.5 truncate text-[11px] text-gray-400">{taskTitle}</p>
                            </div>
                        </div>
                        <div className="flex shrink-0 items-center gap-1.5">
                            <button
                                type="button"
                                onClick={fetchLogs}
                                disabled={loading}
                                className="flex h-8 w-8 items-center justify-center rounded-xl bg-gray-100 text-gray-400 disabled:opacity-40 dark:bg-white/[0.05]"
                            >
                                <RefreshCw size={13} className={loading ? "animate-spin" : ""} />
                            </button>
                            <button
                                type="button"
                                onClick={onClose}
                                className="flex h-8 w-8 items-center justify-center rounded-xl bg-gray-100 text-gray-400 dark:bg-white/[0.05]"
                            >
                                <X size={15} />
                            </button>
                        </div>
                    </div>

                    <div className="flex-1 overflow-y-auto px-5 py-4">
                        {loading ? (
                            <div className="flex flex-col items-center justify-center gap-3 py-16">
                                <Loader2 size={22} className="animate-spin text-indigo-500" />
                                <p className="text-[12px] font-semibold text-gray-400">
                                    در حال دریافت تاریخچه...
                                </p>
                            </div>
                        ) : error ? (
                            <div className="flex flex-col items-center justify-center gap-3 py-16">
                                <AlertCircle size={18} className="text-red-500" />
                                <p className="text-[12px] font-semibold text-red-400">{error}</p>
                                <button
                                    type="button"
                                    onClick={fetchLogs}
                                    className="rounded-full bg-gray-100 px-4 py-2 text-[11.5px] font-bold text-gray-600 dark:bg-white/[0.06] dark:text-gray-300"
                                >
                                    تلاش دوباره
                                </button>
                            </div>
                        ) : logs.length === 0 ? (
                            <div className="flex flex-col items-center justify-center gap-3 py-16">
                                <ClipboardList size={26} className="text-gray-300 dark:text-gray-700" />
                                <p className="text-[12px] text-gray-400">
                                    هنوز رویدادی ثبت نشده است
                                </p>
                            </div>
                        ) : (
                            <div className="flex flex-col gap-2.5">
                                {logs.map((item) => {
                                    const meta = metaOf(item.type);
                                    const Icon = meta.icon;
                                    return (
                                        <div
                                            key={item.id}
                                            className="relative overflow-hidden rounded-2xl border border-gray-100 bg-gray-50/50 p-3.5 dark:border-white/[0.05] dark:bg-white/[0.025]"
                                        >
                                            <div
                                                className="absolute inset-y-0 right-0 w-1"
                                                style={{
                                                    background: `linear-gradient(180deg, ${meta.color}, ${meta.color}40)`,
                                                }}
                                            />
                                            <div className="flex items-start justify-between gap-2">
                                                <div className="flex items-center gap-2">
                                                    <span
                                                        className="flex h-7 w-7 items-center justify-center rounded-xl"
                                                        style={{ background: meta.bg, color: meta.color }}
                                                    >
                                                        <Icon size={13} />
                                                    </span>
                                                    <div>
                                                        <p className="text-[11px] font-extrabold" style={{ color: meta.color }}>
                                                            {item.type_display || meta.label}
                                                        </p>
                                                        <p className="mt-0.5 text-[10px] font-bold text-gray-400">
                                                            {item.created_by_name}
                                                        </p>
                                                    </div>
                                                </div>
                                                <span className="text-[9.5px] font-semibold text-gray-400">
                                                    {formatDateTime(item.created_at)}
                                                </span>
                                            </div>

                                            {item.process_step_order != null && (
                                                <div className="mt-2 flex items-center gap-1.5 rounded-lg bg-white px-2 py-1 text-[9.5px] font-bold text-gray-500 dark:bg-white/[0.05]">
                                                    <Layers3 size={10} />
                                                    مرحله {item.process_step_order}
                                                </div>
                                            )}

                                            {item.note && (
                                                <div className="mt-2 flex items-start gap-2 rounded-xl bg-white px-3 py-2 dark:bg-white/[0.05]">
                                                    <MessageSquareText size={12} className="mt-0.5 shrink-0" style={{ color: meta.color }} />
                                                    <p className="text-[10.5px] font-semibold leading-5 text-gray-600 dark:text-gray-300">
                                                        {item.note}
                                                    </p>
                                                </div>
                                            )}

                                            {item.file_url && (
                                                <a
                                                    href={item.file_url}
                                                    target="_blank"
                                                    rel="noreferrer"
                                                    className="mt-2 inline-flex items-center gap-1.5 rounded-lg bg-indigo-500/10 px-2.5 py-1.5 text-[10px] font-bold text-indigo-600 dark:text-indigo-300"
                                                >
                                                    <Paperclip size={11} />
                                                    مشاهده فایل
                                                </a>
                                            )}
                                        </div>
                                    );
                                })}
                            </div>
                        )}
                    </div>
                </motion.div>
            </motion.div>
        </AnimatePresence>,
        document.body
    );
}