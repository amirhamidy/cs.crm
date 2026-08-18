"use client";

import { useCallback, useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import {
    X, Loader2, AlertCircle, ClipboardList, Paperclip,
    MessageSquareText, RefreshCw, FileText, ArrowLeftCircle,
    ArrowRightCircle, User, Calendar, Clock3, History,
    CheckCircle2, ShoppingBag, Ban, RotateCcw, Layers3, Hash,
} from "lucide-react";
import { useTheme } from "next-themes";
import axiosInstance from "@/lib/axiosInstance";
import { toJalali, toPersianDigits, JALALI_MONTHS, pad2 } from "@/lib/jalali";
import { useEmployeeInfo } from "@/hooks/useEmployeeInfo";

interface Attachment {
    id: number;
    file: string;
    original_file_name: string;
    uploaded_by?: number;
    uploaded_by_username?: string;
    created_at?: string;
}

interface TaskLog {
    id: number;
    step?: number;
    step_name?: string;
    employee?: number[];
    action?: string;
    note?: string;
    created_at: string;
    attachments?: Attachment[];
}

interface Props {
    isOpen: boolean;
    onClose: () => void;
    taskId: number;
    taskTitle: string;
}

const MEDIA_BASE = "https://api.radcosys.ir";

const ACTION_META: Record<string, { label: string; color: string; bg: string; icon: typeof History }> = {
    advanced: { label: "انتقال به مرحله بعد", color: "#6366f1", bg: "rgba(99,102,241,0.14)", icon: ArrowLeftCircle },
    reverted: { label: "بازگشت به مرحله قبل", color: "#ec4899", bg: "rgba(236,72,153,0.14)", icon: ArrowRightCircle },
    sold: { label: "فروش ثبت شد", color: "#f59e0b", bg: "rgba(245,158,11,0.14)", icon: ShoppingBag },
    unsold: { label: "فروش لغو شد", color: "#64748b", bg: "rgba(100,116,139,0.14)", icon: RotateCcw },
    cancelled: { label: "تسک لغو شد", color: "#ef4444", bg: "rgba(239,68,68,0.14)", icon: Ban },
    uncancelled: { label: "بازگشت از لغو", color: "#f87171", bg: "rgba(248,113,113,0.14)", icon: RotateCcw },
    completed: { label: "تسک تکمیل شد", color: "#10b981", bg: "rgba(16,185,129,0.14)", icon: CheckCircle2 },
    uncompleted: { label: "بازگشت از تکمیل", color: "#34d399", bg: "rgba(52,211,153,0.14)", icon: RotateCcw },
    created: { label: "ایجاد تسک", color: "#8b5cf6", bg: "rgba(139,92,246,0.14)", icon: ClipboardList },
};

function resolveFileUrl(url: string) {
    return url.startsWith("http") ? url : `${MEDIA_BASE}${url}`;
}

function formatJalali(iso: string) {
    const date = new Date(iso);
    const [jy, jm, jd] = toJalali(date.getFullYear(), date.getMonth() + 1, date.getDate());
    return {
        date: `${toPersianDigits(jd)} ${JALALI_MONTHS[jm - 1]} ${toPersianDigits(jy)}`,
        time: `${toPersianDigits(pad2(date.getHours()))}:${toPersianDigits(pad2(date.getMinutes()))}`,
    };
}

function getActionMeta(action?: string) {
    return ACTION_META[action ?? ""] ?? { label: action || "ثبت رویداد", color: "#94a3b8", bg: "rgba(148,163,184,0.14)", icon: History };
}

function LogAuthor({ employeeId }: { employeeId?: number }) {
    const { data, loading } = useEmployeeInfo(employeeId ?? 0);
    if (!employeeId) return (
        <div className="flex items-center gap-1.5 rounded-xl px-2.5 py-1.5 text-[10px] font-bold bg-white/[0.04] text-gray-500">
            <User size={10} />ثبت‌کننده نامشخص
        </div>
    );
    const name = loading ? "در حال دریافت..." : data?.full_name ?? data?.username ?? `کارمند ${toPersianDigits(employeeId)}`;
    return (
        <div className="flex items-center gap-1.5 rounded-xl px-2.5 py-1.5 text-[10px] font-bold bg-indigo-500/10 text-indigo-400">
            <User size={10} />
            <span>ثبت‌کننده:</span>
            <span className="text-black dark:text-white">{name}</span>
        </div>
    );
}

function AttachmentUploader({ employeeId, username }: { employeeId?: number; username?: string }) {
    const { data, loading } = useEmployeeInfo(employeeId ?? 0);
    if (!employeeId && !username) return null;
    const name = username || (loading ? "در حال دریافت..." : data?.full_name ?? data?.username ?? `کارمند ${toPersianDigits(employeeId ?? 0)}`);
    return <span className="text-[9.5px] font-semibold text-gray-500">آپلودکننده: {name}</span>;
}

export default function AdminTaskNotesModal({ isOpen, onClose, taskId, taskTitle }: Props) {
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
            .catch(() => setError("خطا در دریافت یادداشت‌ها"))
            .finally(() => setLoading(false));
    }, [taskId]);

    useEffect(() => { if (isOpen) fetchLogs(); }, [isOpen, fetchLogs]);

    if (!isOpen) return null;

    const totalNotes = logs.filter((l) => l.note?.trim()).length;
    const totalFiles = logs.reduce((t, l) => t + (l.attachments?.length ?? 0), 0);
    const totalActions = logs.length;

    const surface = isDark ? "#0c1220" : "#ffffff";
    const border = isDark ? "rgba(255,255,255,0.07)" : "rgba(0,0,0,0.06)";
    const divider = isDark ? "rgba(255,255,255,0.06)" : "rgba(0,0,0,0.05)";
    const card = isDark ? "rgba(255,255,255,0.025)" : "rgba(0,0,0,0.02)";
    const cardBorder = isDark ? "rgba(255,255,255,0.05)" : "rgba(0,0,0,0.05)";
    const buttonBg = isDark ? "rgba(255,255,255,0.05)" : "rgba(0,0,0,0.04)";
    const bodyText = isDark ? "#e2e8f0" : "#334155";

    return (
        <AnimatePresence>
            <motion.div
                initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                className="fixed inset-0 z-50 flex items-center justify-center px-4"
                style={{ background: "rgba(0,0,0,0.55)", backdropFilter: "blur(4px)" }}
                onClick={onClose}
            >
                <motion.div
                    initial={{ scale: 0.94, y: 20 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.94, y: 20 }}
                    transition={{ duration: 0.22, ease: "easeOut" }}
                    className="flex max-h-[85vh] w-full max-w-[560px] flex-col overflow-hidden rounded-3xl border"
                    style={{ background: surface, borderColor: border, boxShadow: "0 28px 72px rgba(0,0,0,0.32)" }}
                    onClick={(e) => e.stopPropagation()}
                    dir="rtl"
                >
                    <div className="flex shrink-0 items-center justify-between border-b px-5 py-4" style={{ borderColor: divider }}>
                        <div className="flex min-w-0 items-center gap-3">
                            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-indigo-500/10">
                                <MessageSquareText size={15} className="text-indigo-500" />
                            </div>
                            <div className="min-w-0">
                                <h3 className="text-[13.5px] font-extrabold text-gray-900 dark:text-white">یادداشت‌ها و روند تسک</h3>
                                <p className="mt-0.5 truncate text-[11px] text-gray-400 dark:text-gray-500">{taskTitle}</p>
                            </div>
                        </div>

                        <div className="flex shrink-0 items-center gap-1.5">
                            {!loading && logs.length > 0 && (
                                <div className="flex items-center gap-1 ml-1">
                                    <span className="inline-flex items-center gap-1 rounded-lg px-2 py-1 text-[10px] font-bold bg-indigo-500/10 text-indigo-400">
                                        <MessageSquareText size={9} />{toPersianDigits(totalNotes)}
                                    </span>
                                    <span className="inline-flex items-center gap-1 rounded-lg px-2 py-1 text-[10px] font-bold bg-violet-500/10 text-violet-400">
                                        <Paperclip size={9} />{toPersianDigits(totalFiles)}
                                    </span>
                                    <span className="inline-flex items-center gap-1 rounded-lg px-2 py-1 text-[10px] font-bold bg-amber-500/10 text-amber-400">
                                        <History size={9} />{toPersianDigits(totalActions)}
                                    </span>
                                </div>
                            )}
                            <button type="button" onClick={fetchLogs} disabled={loading}
                                className="flex h-8 w-8 items-center justify-center rounded-xl text-gray-400 hover:text-gray-300 disabled:opacity-40 transition-colors"
                                style={{ background: buttonBg }}>
                                <RefreshCw size={13} className={loading ? "animate-spin" : ""} />
                            </button>
                            <button type="button" onClick={onClose}
                                className="flex h-8 w-8 items-center justify-center rounded-xl text-gray-400 hover:text-gray-300 transition-colors"
                                style={{ background: buttonBg }}>
                                <X size={15} />
                            </button>
                        </div>
                    </div>

                    <div className="flex-1 overflow-y-auto px-5 py-4">
                        {loading ? (
                            <div className="flex flex-col items-center justify-center gap-3 py-16">
                                <Loader2 size={22} className="animate-spin text-indigo-500" />
                                <p className="text-[12px] font-semibold text-gray-500">در حال دریافت اطلاعات تسک...</p>
                            </div>
                        ) : error ? (
                            <div className="flex flex-col items-center justify-center gap-3 py-16">
                                <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-red-500/10">
                                    <AlertCircle size={18} className="text-red-500" />
                                </div>
                                <p className="text-[12px] font-semibold text-red-400">{error}</p>
                                <button type="button" onClick={fetchLogs}
                                    className="rounded-full px-4 py-2 text-[11.5px] font-bold text-gray-300 bg-white/[0.06] hover:bg-white/[0.1] transition-colors">
                                    تلاش دوباره
                                </button>
                            </div>
                        ) : logs.length === 0 ? (
                            <div className="flex flex-col items-center justify-center gap-3 py-16">
                                <ClipboardList size={26} className="text-gray-700" />
                                <p className="text-[12px] text-gray-600">هنوز هیچ رویداد، یادداشت یا فایلی ثبت نشده</p>
                            </div>
                        ) : (
                            <div className="flex flex-col gap-3">
                                {logs.map((log) => {
                                    const { date, time } = formatJalali(log.created_at);
                                    const actionMeta = getActionMeta(log.action);
                                    const ActionIcon = actionMeta.icon;
                                    const employeeId = log.employee?.[0];
                                    return (
                                        <div key={log.id} className="relative rounded-2xl p-3.5 flex flex-col gap-3 overflow-hidden"
                                            style={{ background: card, border: `1px solid ${cardBorder}` }}>
                                            <div className="absolute top-0 right-0 h-full w-1"
                                                style={{ background: `linear-gradient(180deg, ${actionMeta.color}, ${actionMeta.color}40)` }} />

                                            <div className="flex items-start justify-between gap-3 flex-wrap">
                                                <div className="flex flex-col gap-2">
                                                    <div className="flex items-center gap-1.5 rounded-xl px-2.5 py-1.5 text-[10.5px] font-bold w-fit"
                                                        style={{ background: actionMeta.bg, color: actionMeta.color }}>
                                                        <ActionIcon size={11} /><span>{actionMeta.label}</span>
                                                    </div>
                                                    <div className="flex flex-wrap items-center gap-1.5">
                                                        <LogAuthor employeeId={employeeId} />
                                                        {log.step_name && (
                                                            <div className="flex items-center gap-1.5 rounded-xl px-2.5 py-1.5 text-[10px] font-bold bg-white/[0.04] text-gray-500 dark:text-gray-400">
                                                                <Layers3 size={10} /><span>مرحله:</span>
                                                                <span className="text-black dark:text-white">{log.step_name}</span>
                                                            </div>
                                                        )}
                                                        <div className="flex items-center gap-1.5 rounded-xl px-2.5 py-1.5 text-[10px] font-bold bg-white/[0.04] text-gray-500 dark:text-gray-400">
                                                            <Hash size={10} /><span>رویداد {toPersianDigits(log.id)}</span>
                                                        </div>
                                                    </div>
                                                </div>
                                                <div className="flex items-center gap-1.5 text-[10px] font-semibold text-gray-500 whitespace-nowrap">
                                                    <Calendar size={10} /><span>{date}</span>
                                                    <span className="opacity-40">·</span>
                                                    <Clock3 size={10} /><span>{time}</span>
                                                </div>
                                            </div>

                                            {log.note?.trim() && (
                                                <div className="flex items-start gap-2 rounded-xl px-3 py-2.5"
                                                    style={{ background: `${actionMeta.color}0d`, border: `1px solid ${actionMeta.color}22` }}>
                                                    <MessageSquareText size={12} className="mt-0.5 shrink-0" style={{ color: actionMeta.color }} />
                                                    <p className="text-[11.5px] font-semibold leading-6 whitespace-pre-wrap" style={{ color: bodyText }}>
                                                        {log.note}
                                                    </p>
                                                </div>
                                            )}

                                            {log.attachments && log.attachments.length > 0 && (
                                                <div className="flex flex-col gap-2">
                                                    <div className="flex items-center gap-1.5 text-[10px] font-bold text-gray-500">
                                                        <Paperclip size={11} />فایل‌های پیوست
                                                    </div>
                                                    <div className="flex flex-wrap gap-1.5">
                                                        {log.attachments.map((attachment) => (
                                                            <a key={attachment.id} href={resolveFileUrl(attachment.file)}
                                                                target="_blank" rel="noreferrer"
                                                                className="flex flex-col gap-1.5 rounded-xl px-2.5 py-2 text-[10.5px] font-bold transition-colors hover:opacity-80"
                                                                style={{ background: isDark ? "rgba(255,255,255,0.05)" : "rgba(0,0,0,0.04)", color: isDark ? "#a5b4fc" : "#6366f1" }}>
                                                                <div className="flex items-center gap-1.5">
                                                                    <FileText size={11} />
                                                                    <span className="max-w-[210px] truncate">{attachment.original_file_name}</span>
                                                                </div>
                                                                <AttachmentUploader employeeId={attachment.uploaded_by} username={attachment.uploaded_by_username} />
                                                            </a>
                                                        ))}
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    );
                                })}
                            </div>
                        )}
                    </div>
                </motion.div>
            </motion.div>
        </AnimatePresence>
    );
}
