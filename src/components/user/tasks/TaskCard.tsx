"use client";

import { useMemo, useState } from "react";
import { motion } from "framer-motion";
import {
    ArrowLeftCircle,
    ArrowRightCircle,
    Clock3,
    Layers3,
    BadgeInfo,
    ShoppingBag,
} from "lucide-react";
import { useTheme } from "next-themes";
import axiosInstance from "@/lib/axiosInstance";
import TaskActionModal from "./TaskActionModal";

export interface ApiTask {
    id: number;
    title: string;
    description?: string;
    case: number;
    department: number;
    department_name?: string;
    current_step: number;
    current_step_name?: string;
    assigned_employee: number[];
    status: "in_progress" | "completed" | "sold" | string;
    created_at?: string;
    completed_at?: string;
    updated_at?: string;
    attachments?: unknown[];
}

interface TaskCardProps {
    task: ApiTask;
    index: number;
    onUpdated: (task: ApiTask) => void;
    onRemoved?: (id: number) => void;
}

function formatFaDate(date?: string) {
    if (!date) return "نامشخص";
    return new Date(date).toLocaleDateString("fa-IR", {
        year: "numeric",
        month: "2-digit",
        day: "2-digit",
    });
}

function getStatusMeta(status: string) {
    if (status === "completed")
        return { label: "تکمیل شده", color: "bg-emerald-500/10 text-emerald-500", dot: "bg-emerald-500" };
    if (status === "sold")
        return { label: "فروش رفته", color: "bg-amber-500/10 text-amber-500", dot: "bg-amber-500" };
    return { label: "در حال انجام", color: "bg-indigo-500/10 text-indigo-500", dot: "bg-indigo-500" };
}

export default function TaskCard({ task, index, onUpdated }: TaskCardProps) {
    const { resolvedTheme } = useTheme();
    const isDark = resolvedTheme === "dark";

    const [hovered, setHovered] = useState(false);
    const [openModal, setOpenModal] = useState<null | "next" | "prev" | "sold">(null);
    const [submitting, setSubmitting] = useState(false);

    const meta = useMemo(() => getStatusMeta(task.status), [task.status]);

    const isFinished = task.status === "completed" || task.status === "sold";

    async function submitAction(
        direction: "next" | "prev" | "sold",
        data: { note: string; files: File[] }
    ) {
        setSubmitting(true);
        try {
            const endpointMap = { next: "advance", prev: "revert", sold: "mark-as-sold" };
            const formData = new FormData();
            if (data.note.trim()) formData.append("note", data.note.trim());
            data.files.forEach((f) => formData.append("files", f));

            const res = await axiosInstance.post<ApiTask>(
                `/tasks/api/v1/tasks/${task.id}/${endpointMap[direction]}/`,
                formData,
                { headers: { "Content-Type": "multipart/form-data" } }
            );
            onUpdated(res.data);
            setOpenModal(null);
        } finally {
            setSubmitting(false);
        }
    }

    return (
        <>
            <motion.div
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.97 }}
                transition={{ duration: 0.22, delay: index * 0.04 }}
                onHoverStart={() => setHovered(true)}
                onHoverEnd={() => setHovered(false)}
                className="relative rounded-3xl p-4 flex flex-col gap-4 overflow-hidden"
                style={{
                    border: isDark ? "1px solid rgba(255,255,255,0.06)" : "1px solid rgba(0,0,0,0.06)",
                    background: isDark ? "rgba(255,255,255,0.02)" : "#fafafa",
                    minHeight: 160,
                }}
            >
                <svg className="absolute inset-0 w-full h-full pointer-events-none">
                    <defs>
                        <linearGradient id={`taskBorder-${task.id}`} x1="100%" y1="100%" x2="0%" y2="0%">
                            <stop offset="0%" stopColor="#6366f1" />
                            <stop offset="100%" stopColor="#8b5cf6" />
                        </linearGradient>
                    </defs>
                    <motion.rect
                        x="1" y="1"
                        width="calc(100% - 2px)" height="calc(100% - 2px)"
                        rx="20" ry="20" fill="none"
                        stroke={`url(#taskBorder-${task.id})`}
                        strokeWidth="1.4" pathLength="1"
                        initial={{ pathLength: 0, opacity: 0 }}
                        animate={hovered ? { pathLength: 1, opacity: 1 } : { pathLength: 0, opacity: 0 }}
                        transition={{ duration: 0.55, ease: "easeInOut" }}
                    />
                </svg>

                <div className="flex items-start justify-between gap-3 z-10">
                    <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2 mb-2">
                            <span className={`text-[11px] font-bold px-2.5 py-1 rounded-lg ${meta.color}`}>
                                <span className={`inline-block w-1.5 h-1.5 rounded-full ${meta.dot} ml-1`} />
                                {meta.label}
                            </span>
                            <span className="text-[11px] font-bold px-2.5 py-1 rounded-lg bg-gray-100 text-gray-500 dark:bg-white/5 dark:text-gray-400">
                                #{task.id}
                            </span>
                        </div>
                        <h3 className="text-[14px] font-extrabold text-gray-900 dark:text-white leading-tight truncate">
                            {task.title}
                        </h3>
                        <p className="text-[11.5px] text-gray-400 dark:text-gray-500 mt-1">
                            {task.department_name ?? "بدون دپارتمان"}
                        </p>
                    </div>
                    <div className="w-10 h-10 rounded-2xl flex items-center justify-center flex-shrink-0 bg-indigo-500/10 dark:bg-indigo-500/15">
                        <Layers3 size={18} className="text-indigo-500" />
                    </div>
                </div>

                <div className="grid grid-cols-2 gap-2 pt-1">
                    <div
                        className="rounded-2xl p-3 border"
                        style={{
                            borderColor: isDark ? "rgba(255,255,255,0.05)" : "rgba(0,0,0,0.05)",
                            background: isDark ? "rgba(255,255,255,0.02)" : "#fff",
                        }}
                    >
                        <div className="flex items-center gap-2 text-gray-400 dark:text-gray-500 text-[11px]">
                            <BadgeInfo size={12} />
                            دپارتمان
                        </div>
                        <p className="mt-1 text-[12.5px] font-bold text-gray-800 dark:text-gray-100 truncate">
                            {task.department_name || "نامشخص"}
                        </p>
                    </div>
                    <div
                        className="rounded-2xl p-3 border"
                        style={{
                            borderColor: isDark ? "rgba(255,255,255,0.05)" : "rgba(0,0,0,0.05)",
                            background: isDark ? "rgba(255,255,255,0.02)" : "#fff",
                        }}
                    >
                        <div className="flex items-center gap-2 text-gray-400 dark:text-gray-500 text-[11px]">
                            <Clock3 size={12} />
                            مرحله
                        </div>
                        <p className="mt-1 text-[12.5px] font-bold text-gray-800 dark:text-gray-100 truncate">
                            {task.current_step_name || "نامشخص"}
                        </p>
                    </div>
                </div>

                <div
                    className="pt-3 border-t flex items-center justify-between gap-2"
                    style={{ borderColor: isDark ? "rgba(255,255,255,0.05)" : "rgba(0,0,0,0.05)" }}
                >
                    <p className="text-[11.5px] text-gray-400 dark:text-gray-500">
                        {formatFaDate(task.created_at)}
                    </p>

                    {isFinished ? (
                        <span className={`text-[11px] font-bold px-3 py-1.5 rounded-xl ${meta.color}`}>
                            {meta.label}
                        </span>
                    ) : (
                        <div className="flex items-center gap-2">
                            <button
                                type="button"
                                onClick={() => setOpenModal("prev")}
                                disabled={submitting}
                                className="h-9 px-3 rounded-xl flex items-center gap-2 text-[12px] font-bold transition-colors disabled:opacity-40"
                                style={{
                                    background: isDark ? "rgba(236,72,153,0.10)" : "rgba(236,72,153,0.07)",
                                    color: isDark ? "#f9a8d4" : "#db2777",
                                }}
                            >
                                <ArrowRightCircle size={14} />
                                قبل
                            </button>

                            <button
                                type="button"
                                onClick={() => setOpenModal("sold")}
                                disabled={submitting}
                                className="h-9 px-3 rounded-xl flex items-center gap-2 text-[12px] font-bold transition-colors disabled:opacity-40"
                                style={{
                                    background: isDark ? "rgba(245,158,11,0.10)" : "rgba(245,158,11,0.07)",
                                    color: isDark ? "#fcd34d" : "#d97706",
                                }}
                            >
                                <ShoppingBag size={14} />
                                فروش
                            </button>

                            <button
                                type="button"
                                onClick={() => setOpenModal("next")}
                                disabled={submitting}
                                className="h-9 px-3 rounded-xl flex items-center gap-2 text-[12px] font-bold text-white disabled:opacity-40"
                                style={{
                                    background: "linear-gradient(135deg, #6366f1, #8b5cf6)",
                                    boxShadow: "0 4px 14px rgba(99,102,241,0.28)",
                                }}
                            >
                                <ArrowLeftCircle size={14} />
                                بعد
                            </button>
                        </div>
                    )}
                </div>

                <div className="absolute top-3 left-3 w-2 h-2 rounded-full bg-indigo-500/60" />
            </motion.div>

            <TaskActionModal
                isOpen={openModal === "next"}
                onClose={() => setOpenModal(null)}
                direction="next"
                title="ارسال به مرحله بعد"
                description="تسک را به مرحله بعدی منتقل کن"
                onSubmit={(data) => submitAction("next", data)}
            />
            <TaskActionModal
                isOpen={openModal === "prev"}
                onClose={() => setOpenModal(null)}
                direction="prev"
                title="برگرداندن به مرحله قبل"
                description="تسک را به مرحله قبلی برگردان"
                onSubmit={(data) => submitAction("prev", data)}
            />
            <TaskActionModal
                isOpen={openModal === "sold"}
                onClose={() => setOpenModal(null)}
                direction="sold"
                title="ثبت فروش"
                description="این تسک را به عنوان فروش رفته ثبت کن"
                onSubmit={(data) => submitAction("sold", data)}
            />
        </>
    );
}
