"use client";

import { useCallback, useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import {
    X,
    History,
    Loader2,
    AlertCircle,
    ClipboardList,
    ArrowLeftCircle,
    ArrowRightCircle,
    ShoppingBag,
    XCircle,
    Ban,
    RotateCcw,
    CheckCircle2,
    Paperclip,
    UserRound,
    MessageSquareText,
    RefreshCw,
} from "lucide-react";
import { useTheme } from "next-themes";
import axiosInstance from "@/lib/axiosInstance";
import { toJalali, toPersianDigits, JALALI_MONTHS, pad2 } from "@/lib/jalali";
import { useEmployeeInfo } from "@/hooks/useEmployeeInfo";

interface TaskLogAttachment {
    id: number;
    file: string;
    original_file_name: string;
    uploaded_by: number;
    uploaded_by_username: string;
    created_at: string;
}

interface TaskLog {
    id: number;
    step: number;
    step_name: string;
    employee: number[];
    action: string;
    note: string;
    created_at: string;
    attachments: TaskLogAttachment[];
}

interface Props {
    isOpen: boolean;
    onClose: () => void;
    taskId: number;
    taskTitle: string;
}

const MEDIA_BASE = "https://api.radcosys.ir";

function resolveFileUrl(url: string) {
    if (!url) return "";
    return url.startsWith("http") ? url : `${MEDIA_BASE}${url}`;
}

function formatJalaliDate(iso?: string | null) {
    if (!iso) return "";
    const d = new Date(iso);
    const [jy, jm, jd] = toJalali(d.getFullYear(), d.getMonth() + 1, d.getDate());
    return `${toPersianDigits(jd)} ${JALALI_MONTHS[jm - 1]} ${toPersianDigits(jy)} ساعت ${toPersianDigits(
        pad2(d.getHours())
    )}:${toPersianDigits(pad2(d.getMinutes()))}`;
}

const ACTION_META: Record<string, { label: string; color: string; bg: string; icon: React.ElementType }> = {
    advanced: { label: "انتقال به مرحله بعد", color: "#6366f1", bg: "rgba(99,102,241,0.12)", icon: ArrowLeftCircle },
    reverted: { label: "بازگشت به مرحله قبل", color: "#ec4899", bg: "rgba(236,72,153,0.12)", icon: ArrowRightCircle },
    sold: { label: "فروش ثبت شد", color: "#f59e0b", bg: "rgba(245,158,11,0.12)", icon: ShoppingBag },
    unsold: { label: "فروش لغو شد", color: "#64748b", bg: "rgba(100,116,139,0.12)", icon: XCircle },
    cancelled: { label: "تسک لغو شد", color: "#ef4444", bg: "rgba(239,68,68,0.12)", icon: Ban },
    uncancelled: { label: "بازگشت از لغو", color: "#f87171", bg: "rgba(248,113,113,0.12)", icon: RotateCcw },
    completed: { label: "تسک تکمیل شد", color: "#10b981", bg: "rgba(16,185,129,0.12)", icon: CheckCircle2 },
    uncompleted: { label: "بازگشت از تکمیل", color: "#34d399", bg: "rgba(52,211,153,0.12)", icon: RotateCcw },
    created: { label: "ایجاد تسک", color: "#8b5cf6", bg: "rgba(139,92,246,0.12)", icon: ClipboardList },
};

function metaOf(action: string) {
    return (
        ACTION_META[action] ?? {
            label: action,
            color: "#94a3b8",
            bg: "rgba(148,163,184,0.12)",
            icon: History,
        }
    );
}

function EmployeeTag({ id, isDark }: { id: number; isDark: boolean }) {
    const { data, loading } = useEmployeeInfo(id);
    const name = loading ? "..." : data?.full_name ?? data?.username ?? `کارمند ${id}`;
    return (
        <span
            className="inline-flex items-center gap-1 rounded-full py-0.5 pl-2 pr-0.5"
            style={{
                background: isDark ? "rgba(255,255,255,0.05)" : "rgba(0,0,0,0.04)",
                border: isDark ? "1px solid rgba(255,255,255,0.06)" : "1px solid rgba(0,0,0,0.06)",
            }}
        >
            <span
                className="flex h-4 w-4 items-center justify-center rounded-full text-white"
                style={{ background: "linear-gradient(135deg, #6366f1, #8b5cf6)" }}
            >
                <UserRound size={9} />
            </span>
            <span className="text-[10.5px] font-bold" style={{ color: isDark ? "#cbd5e1" : "#475569" }}>
                {name}
            </span>
        </span>
    );
}

function LogItem({ log, isLast, isDark }: { log: TaskLog; isLast: boolean; isDark: boolean }) {
    const meta = metaOf(log.action);
    const Icon = meta.icon;

    return (
        <div className="relative flex gap-3 pb-5 last:pb-0">
            {!isLast && (
                <span
                    className="absolute right-[15px] top-8 bottom-0 w-px"
                    style={{ background: isDark ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.08)" }}
                />
            )}
            <div
                className="relative z-10 flex h-8 w-8 shrink-0 items-center justify-center rounded-full"
                style={{ background: meta.bg, color: meta.color, border: `1px solid ${meta.color}33` }}
            >
                <Icon size={14} />
            </div>

            <div
                className="min-w-0 flex-1 rounded-2xl p-3.5"
                style={{
                    background: isDark ? "rgba(255,255,255,0.03)" : "rgba(0,0,0,0.02)",
                    border: isDark ? "1px solid rgba(255,255,255,0.05)" : "1px solid rgba(0,0,0,0.05)",
                }}
            >
                <div className="flex flex-wrap items-center justify-between gap-2">
                    <span
                        className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[10.5px] font-bold"
                        style={{ background: meta.bg, color: meta.color }}
                    >
                        {meta.label}
                    </span>
                    <span className="text-[10.5px] font-semibold" style={{ color: isDark ? "#64748b" : "#94a3b8" }}>
                        {formatJalaliDate(log.created_at)}
                    </span>
                </div>

                <div className="mt-2.5 flex flex-wrap items-center gap-1.5">
                    <span className="text-[10.5px] font-bold" style={{ color: isDark ? "#64748b" : "#94a3b8" }}>
                        مرحله:
                    </span>
                    <span
                        className="rounded-lg px-2 py-0.5 text-[10.5px] font-bold"
                        style={{
                            background: isDark ? "rgba(255,255,255,0.05)" : "rgba(0,0,0,0.04)",
                            color: isDark ? "#cbd5e1" : "#475569",
                        }}
                    >
                        {log.step_name}
                    </span>
                </div>

                {log.employee?.length > 0 && (
                    <div className="mt-2.5 flex flex-wrap items-center gap-1.5">
                        <span className="text-[10.5px] font-bold" style={{ color: isDark ? "#64748b" : "#94a3b8" }}>
                            توسط:
                        </span>
                        {log.employee.map((id) => (
                            <EmployeeTag key={id} id={id} isDark={isDark} />
                        ))}
                    </div>
                )}

                {log.note && (
                    <div
                        className="mt-2.5 flex items-start gap-2 rounded-xl px-3 py-2.5"
                        style={{ background: isDark ? "rgba(255,255,255,0.04)" : "rgba(0,0,0,0.03)" }}
                    >
                        <MessageSquareText size={13} className="mt-0.5 shrink-0" style={{ color: meta.color }} />
                        <p
                            className="text-[11.5px] font-semibold leading-6"
                            style={{ color: isDark ? "#e2e8f0" : "#334155" }}
                        >
                            {log.note}
                        </p>
                    </div>
                )}

                {log.attachments?.length > 0 && (
                    <div className="mt-2.5 flex flex-wrap gap-1.5">
                        {log.attachments.map((a) => (
                            <a
                                key={a.id}
                                href={resolveFileUrl(a.file)}
                                target="_blank"
                                rel="noreferrer"
                                className="flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-[10.5px] font-bold transition-colors"
                                style={{
                                    background: isDark ? "rgba(255,255,255,0.05)" : "rgba(0,0,0,0.04)",
                                    color: isDark ? "#a5b4fc" : "#6366f1",
                                }}
                            >
                                <Paperclip size={11} />
                                <span className="max-w-[140px] truncate">{a.original_file_name}</span>
                            </a>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}

export default function TaskLogsModal({ isOpen, onClose, taskId, taskTitle }: Props) {
    const { resolvedTheme } = useTheme();
    const isDark = resolvedTheme === "dark";

    const [logs, setLogs] = useState<TaskLog[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const fetchLogs = useCallback(() => {
        setLoading(true);
        setError(null);
        axiosInstance
            .get<TaskLog[]>(`/tasks/api/v1/tasks/${taskId}/logs/`)
            .then((res) => setLogs(res.data ?? []))
            .catch(() => setError("خطا در دریافت تاریخچه"))
            .finally(() => setLoading(false));
    }, [taskId]);

    useEffect(() => {
        if (isOpen) fetchLogs();
    }, [isOpen, fetchLogs]);

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
                    className="flex max-h-[85vh] w-full max-w-[460px] flex-col overflow-hidden rounded-3xl border"
                    style={{
                        background: isDark ? "#0f172a" : "#ffffff",
                        borderColor: isDark ? "rgba(255,255,255,0.07)" : "rgba(0,0,0,0.06)",
                        boxShadow: "0 24px 64px rgba(0,0,0,0.28)",
                    }}
                    onClick={(e) => e.stopPropagation()}
                    dir="rtl"
                >
                    <div
                        className="flex shrink-0 items-center justify-between border-b px-5 py-4"
                        style={{ borderColor: isDark ? "rgba(255,255,255,0.06)" : "rgba(0,0,0,0.06)" }}
                    >
                        <div className="flex min-w-0 items-center gap-3">
                            <div
                                className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl"
                                style={{ background: isDark ? "rgba(99,102,241,0.12)" : "rgba(99,102,241,0.08)" }}
                            >
                                <History size={15} className="text-indigo-500" />
                            </div>
                            <div className="min-w-0">
                                <h3 className="text-[14px] font-extrabold text-gray-900 dark:text-white">
                                    تاریخچه تسک
                                </h3>
                                <p className="mt-0.5 truncate text-[11px] text-gray-400 dark:text-gray-500">
                                    {taskTitle}
                                </p>
                            </div>
                        </div>
                        <div className="flex shrink-0 items-center gap-1.5">
                            <button
                                type="button"
                                onClick={fetchLogs}
                                disabled={loading}
                                className="flex h-8 w-8 items-center justify-center rounded-xl text-gray-400 transition-colors hover:text-gray-600 disabled:opacity-40 dark:hover:text-gray-300"
                                style={{ background: isDark ? "rgba(255,255,255,0.05)" : "rgba(0,0,0,0.04)" }}
                                title="بروزرسانی"
                            >
                                <RefreshCw size={13} className={loading ? "animate-spin" : ""} />
                            </button>
                            <button
                                type="button"
                                onClick={onClose}
                                className="flex h-8 w-8 items-center justify-center rounded-xl text-gray-400 transition-colors hover:text-gray-600 dark:hover:text-gray-300"
                                style={{ background: isDark ? "rgba(255,255,255,0.05)" : "rgba(0,0,0,0.04)" }}
                            >
                                <X size={15} />
                            </button>
                        </div>
                    </div>

                    <div className="flex-1 overflow-y-auto px-5 py-5">
                        {loading ? (
                            <div className="flex flex-col items-center justify-center gap-3 py-16">
                                <Loader2 size={22} className="animate-spin text-indigo-500" />
                                <p className="text-[12px] font-semibold text-gray-400 dark:text-gray-500">
                                    در حال دریافت تاریخچه...
                                </p>
                            </div>
                        ) : error ? (
                            <div className="flex flex-col items-center justify-center gap-3 py-16">
                                <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-red-50 dark:bg-red-500/10">
                                    <AlertCircle size={18} className="text-red-500" />
                                </div>
                                <p className="text-[12px] font-semibold text-red-500 dark:text-red-400">{error}</p>
                                <button
                                    type="button"
                                    onClick={fetchLogs}
                                    className="rounded-full bg-gray-100 px-4 py-2 text-[11.5px] font-bold text-gray-600 transition-colors hover:bg-gray-200 dark:bg-white/[0.06] dark:text-gray-300 dark:hover:bg-white/[0.1]"
                                >
                                    تلاش دوباره
                                </button>
                            </div>
                        ) : logs.length === 0 ? (
                            <div className="flex flex-col items-center justify-center gap-3 py-16">
                                <ClipboardList size={26} className="text-gray-300 dark:text-gray-700" />
                                <p className="text-[12px] text-gray-400 dark:text-gray-600">
                                    هنوز اقدامی برای این تسک ثبت نشده
                                </p>
                            </div>
                        ) : (
                            <div className="flex flex-col">
                                {logs.map((log, i) => (
                                    <LogItem key={log.id} log={log} isLast={i === logs.length - 1} isDark={isDark} />
                                ))}
                            </div>
                        )}
                    </div>
                </motion.div>
            </motion.div>
        </AnimatePresence>
    );
}
