"use client";

import { useCallback, useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { AnimatePresence, m } from "framer-motion";
import { AlertTriangle, CalendarClock, CalendarDays, Clock, Loader2, RefreshCw, X } from "lucide-react";
import { useTheme } from "next-themes";
import api from "@/lib/axiosInstance";
import { toJalali, toPersianDigits, JALALI_MONTHS, pad2 } from "@/lib/jalali";

export interface InternalDeadline {
    started_at: string | null;
    deadline: string | null;
}


export async function fetchInternalDeadline(
    taskId: number,
    signal?: AbortSignal
): Promise<InternalDeadline | null> {
    try {
        const { data } = await api.get(`/tasks/api/v1/internal_task/${taskId}/deadline/`, { signal });
        const value = data?.data ?? data;
        return {
            started_at: value?.started_at ?? null,
            deadline: value?.deadline ?? null,
        };
    } catch (err) {
        if ((err as { response?: { status?: number } })?.response?.status === 404) return null;
        throw err;
    }
}

function formatJalali(iso?: string | null) {
    if (!iso) return null;
    const d = new Date(iso);
    if (Number.isNaN(d.getTime())) return null;
    const [jy, jm, jd] = toJalali(d.getFullYear(), d.getMonth() + 1, d.getDate());
    return {
        date: `${toPersianDigits(jd)} ${JALALI_MONTHS[jm - 1]} ${toPersianDigits(jy)}`,
        time: `${toPersianDigits(pad2(d.getHours()))}:${toPersianDigits(pad2(d.getMinutes()))}`,
    };
}

function describeRemaining(deadline?: string | null) {
    if (!deadline) return null;
    const target = new Date(deadline).getTime();
    if (Number.isNaN(target)) return null;

    const diff = target - Date.now();
    const abs = Math.abs(diff);
    const minutes = Math.floor(abs / 60000);
    const days = Math.floor(minutes / 1440);
    const hours = Math.floor((minutes % 1440) / 60);
    const mins = minutes % 60;

    const parts: string[] = [];
    if (days) parts.push(`${toPersianDigits(days)} روز`);
    if (hours) parts.push(`${toPersianDigits(hours)} ساعت`);
    if (!days && mins) parts.push(`${toPersianDigits(mins)} دقیقه`);
    const text = parts.join(" و ") || "کمتر از یک دقیقه";

    if (diff < 0) return { text: `${text} از مهلت گذشته`, color: "#ef4444", label: "منقضی شده" };
    if (diff / 3600000 <= 6) return { text: `${text} مانده`, color: "#f97316", label: "فوری" };
    if (diff / 3600000 <= 24) return { text: `${text} مانده`, color: "#eab308", label: "امروز" };
    return { text: `${text} مانده`, color: "#10b981", label: "در مهلت" };
}

interface InternalTaskDeadlineModalProps {
    open: boolean;
    onClose: () => void;
    taskId: number;
    taskTitle?: string;
    
    onLoaded?: (deadline: InternalDeadline) => void;
}

export default function InternalTaskDeadlineModal({
    open,
    onClose,
    taskId,
    taskTitle,
    onLoaded,
}: InternalTaskDeadlineModalProps) {
    const { resolvedTheme } = useTheme();
    const isDark = resolvedTheme === "dark";

    const [data, setData] = useState<InternalDeadline | null>(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [tick, setTick] = useState(0);

    
    useEffect(() => {
        if (!open) return;

        const controller = new AbortController();
        setLoading(true);
        setError(null);

        fetchInternalDeadline(taskId, controller.signal)
            .then((res) => {
                if (controller.signal.aborted) return;
                setData(res); 
                if (res) onLoaded?.(res);
            })
            .catch((err) => {
                if (controller.signal.aborted || err?.code === "ERR_CANCELED") return;
                setData(null);
                setError("دریافت زمان‌بندی با خطا مواجه شد");
            })
            .finally(() => {
                if (!controller.signal.aborted) setLoading(false);
            });

        return () => controller.abort();
        
    }, [open, taskId, tick]);

    useEffect(() => {
        if (!open) {
            setData(null);
            setError(null);
        }
    }, [open]);

    useEffect(() => {
        if (!open) return;
        const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
        window.addEventListener("keydown", onKey);
        return () => window.removeEventListener("keydown", onKey);
    }, [open, onClose]);

    const retry = useCallback(() => setTick((t) => t + 1), []);

    const started = formatJalali(data?.started_at);
    const deadline = formatJalali(data?.deadline);
    const remaining = describeRemaining(data?.deadline);
    const hasAny = Boolean(started || deadline);

    if (typeof document === "undefined") return null;

    const muted = isDark ? "#9ca3af" : "#6b7280";
    const border = isDark ? "rgba(255,255,255,0.06)" : "rgba(15,23,42,0.06)";

    return createPortal(
        <AnimatePresence>
            {open && (
                <m.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.15 }}
                    className="fixed inset-0 z-[2147483647] flex items-center justify-center px-4"
                    style={{ background: isDark ? "rgba(0,0,0,0.62)" : "rgba(15,23,42,0.38)", backdropFilter: "blur(6px)" }}
                    onClick={onClose}
                >
                    <m.div
                        initial={{ opacity: 0, y: 14, scale: 0.98 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 14, scale: 0.98 }}
                        transition={{ duration: 0.2, ease: "easeOut" }}
                        onClick={(e) => e.stopPropagation()}
                        dir="rtl"
                        role="dialog"
                        aria-modal="true"
                        className="w-full max-w-md overflow-hidden rounded-[2rem] border shadow-2xl"
                        style={{ background: isDark ? "#0b1220" : "#ffffff", borderColor: border }}
                    >
                        <div className="flex items-center justify-between gap-3 border-b px-6 py-5" style={{ borderColor: border }}>
                            <div className="flex min-w-0 items-center gap-3">
                                <div
                                    className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl"
                                    style={{
                                        background: isDark ? "rgba(99,102,241,0.14)" : "rgba(99,102,241,0.08)",
                                        color: isDark ? "#a5b4fc" : "#6366f1",
                                    }}
                                >
                                    <CalendarClock size={18} />
                                </div>
                                <div className="min-w-0">
                                    <h3 className="text-[14.5px] font-extrabold text-gray-900 dark:text-white">زمان‌بندی تسک اینترنال</h3>
                                    {taskTitle && <p className="mt-0.5 truncate text-[11px] text-gray-400">{taskTitle}</p>}
                                </div>
                            </div>

                            <button
                                type="button"
                                onClick={onClose}
                                className="flex h-9 w-9 shrink-0 items-center justify-center rounded-2xl transition-colors"
                                style={{ background: isDark ? "rgba(255,255,255,0.05)" : "rgba(15,23,42,0.05)", color: muted }}
                                aria-label="بستن"
                            >
                                <X size={16} />
                            </button>
                        </div>

                        <div className="flex flex-col gap-3 p-6">
                            {loading ? (
                                <div className="flex flex-col items-center justify-center gap-2 py-8" style={{ color: muted }}>
                                    <Loader2 size={22} className="animate-spin text-indigo-500" />
                                    <p className="text-[12px] font-semibold">در حال دریافت زمان‌بندی...</p>
                                </div>
                            ) : error ? (
                                <div className="flex flex-col items-center gap-3 py-6">
                                    <div className="flex items-center gap-2 text-[12.5px] font-bold text-red-500">
                                        <AlertTriangle size={15} />
                                        {error}
                                    </div>
                                    <button
                                        type="button"
                                        onClick={retry}
                                        className="flex h-9 items-center gap-2 rounded-xl bg-indigo-600 px-4 text-[12px] font-bold text-white transition-colors hover:bg-indigo-500"
                                    >
                                        <RefreshCw size={13} />
                                        تلاش مجدد
                                    </button>
                                </div>
                            ) : !hasAny ? (
                                <div className="flex flex-col items-center gap-2 py-8" style={{ color: muted }}>
                                    <Clock size={22} />
                                    <p className="text-[12.5px] font-semibold">ددلاین ندارد</p>
                                </div>
                            ) : (
                                <>
                                    {started && (
                                        <div
                                            className="flex items-center justify-between gap-3 rounded-2xl px-4 py-3"
                                            style={{ background: isDark ? "rgba(99,102,241,0.07)" : "rgba(99,102,241,0.05)", border: `1px solid ${isDark ? "rgba(99,102,241,0.14)" : "rgba(99,102,241,0.1)"}` }}
                                        >
                                            <span className="flex items-center gap-2 text-[11.5px] font-bold text-indigo-500 dark:text-indigo-300">
                                                <CalendarDays size={14} />
                                                شروع
                                            </span>
                                            <span className="text-[12px] font-extrabold text-gray-800 dark:text-gray-100">
                                                {started.date} · {started.time}
                                            </span>
                                        </div>
                                    )}

                                    {deadline && (
                                        <div
                                            className="flex items-center justify-between gap-3 rounded-2xl px-4 py-3"
                                            style={{
                                                background: `color-mix(in srgb, ${remaining?.color ?? "#ef4444"} 8%, transparent)`,
                                                border: `1px solid color-mix(in srgb, ${remaining?.color ?? "#ef4444"} 25%, transparent)`,
                                            }}
                                        >
                                            <span className="flex items-center gap-2 text-[11.5px] font-bold" style={{ color: remaining?.color ?? "#ef4444" }}>
                                                <Clock size={14} />
                                                مهلت (ددلاین)
                                            </span>
                                            <span className="text-[12px] font-extrabold text-gray-800 dark:text-gray-100">
                                                {deadline.date} · {deadline.time}
                                            </span>
                                        </div>
                                    )}

                                    {remaining && (
                                        <div
                                            className="flex items-center justify-center gap-2 rounded-2xl px-4 py-2.5 text-[12px] font-extrabold"
                                            style={{
                                                color: remaining.color,
                                                background: `color-mix(in srgb, ${remaining.color} 12%, transparent)`,
                                            }}
                                        >
                                            <span className="h-1.5 w-1.5 rounded-full" style={{ background: remaining.color }} />
                                            {remaining.label} · {remaining.text}
                                        </div>
                                    )}
                                </>
                            )}
                        </div>
                    </m.div>
                </m.div>
            )}
        </AnimatePresence>,
        document.body
    );
}
