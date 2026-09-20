"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { useTheme } from "next-themes";
import {
    CalendarDays,
    Layers,
    Loader2,
    Pencil,
    RefreshCw,
    Trash2,
    User,
    X,
} from "lucide-react";
import type { CaseItem } from "@/types/case";
import type { TaskItem } from "@/types/task";
import { fetchAllTasks } from "@/lib/fetchAllTasks";

interface CaseTasksModalProps {
    isOpen: boolean;
    onClose: () => void;
    caseItem: CaseItem | null;
    employees?: any[];
    /** با تغییر این عدد، مودال دوباره از API می‌خونه (مثلاً بعد از ویرایش وظیفه) */
    refreshKey?: number;
    onEditTask: (task: TaskItem) => void;
    onDeleteTask: (taskId: number) => Promise<void>;
    deletingTaskId?: number | null;
    /** بعد از هر بار دریافت از API، وظیفه‌های تازه‌ی این پرونده به والد داده می‌شه */
    onTasksLoaded?: (caseId: string, tasks: TaskItem[]) => void;
}

const STATUS_META: Record<string, { label: string; color: string }> = {
    sold: { label: "فروش", color: "#10b981" },
    completed: { label: "انجام شده", color: "#0ea5e9" },
    in_progress: { label: "در حال انجام", color: "#f59e0b" },
    pending: { label: "در انتظار", color: "#8b5cf6" },
    cancelled: { label: "لغو شده", color: "#ef4444" },
};

const getStatusMeta = (status?: string | null) =>
    STATUS_META[status ?? ""] ?? {
        label: status || "نامشخص",
        color: "#64748b",
    };

const formatNumber = (n: number) => n.toLocaleString("fa-IR");

const formatDate = (value?: string | null) => {
    if (!value) return "";
    const d = new Date(value);
    if (Number.isNaN(d.getTime())) return "";
    return new Intl.DateTimeFormat("fa-IR", {
        year: "numeric",
        month: "short",
        day: "numeric",
    }).format(d);
};

const employeeName = (emp: any): string => {
    if (!emp || typeof emp !== "object") return "";
    const full = emp.full_name ?? emp.name ?? "";
    if (typeof full === "string" && full.trim()) return full.trim();
    const composed = `${emp.first_name ?? ""} ${emp.last_name ?? ""}`.trim();
    if (composed) return composed;
    return typeof emp.username === "string" ? emp.username : "";
};

export default function CaseTasksModal({
    isOpen,
    onClose,
    caseItem,
    employees = [],
    refreshKey = 0,
    onEditTask,
    onDeleteTask,
    deletingTaskId = null,
    onTasksLoaded,
}: CaseTasksModalProps) {
    const { resolvedTheme } = useTheme();
    const isDark = resolvedTheme === "dark";

    const [tasks, setTasks] = useState<TaskItem[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");
    const [reloadTick, setReloadTick] = useState(0);
    const [statusFilter, setStatusFilter] = useState<string>("all");
    const [confirmId, setConfirmId] = useState<number | null>(null);
    const [deleteError, setDeleteError] = useState("");

    // callback والد رو توی ref نگه می‌داریم تا effect بی‌دلیل دوباره اجرا نشه
    const onTasksLoadedRef = useRef(onTasksLoaded);
    useEffect(() => {
        onTasksLoadedRef.current = onTasksLoaded;
    }, [onTasksLoaded]);

    const caseId = caseItem?.id !== undefined ? String(caseItem.id) : null;

    // هر بار باز شدن مودال / عوض شدن پرونده / refresh: مستقیم از API
    useEffect(() => {
        if (!isOpen || !caseId) return;

        const controller = new AbortController();
        let active = true;

        setLoading(true);
        setError("");

        fetchAllTasks({ caseId, signal: controller.signal })
            .then((list) => {
                if (!active) return;
                setTasks(list);
                onTasksLoadedRef.current?.(caseId, list);
            })
            .catch((err: any) => {
                if (!active) return;
                if (err?.code === "ERR_CANCELED" || err?.name === "CanceledError") {
                    return;
                }
                setError("دریافت وظیفه‌ها از سرور با خطا مواجه شد");
            })
            .finally(() => {
                if (active) setLoading(false);
            });

        return () => {
            active = false;
            controller.abort();
        };
    }, [isOpen, caseId, refreshKey, reloadTick]);

    // موقع بسته شدن هیچ داده‌ای نگه نمی‌داریم
    useEffect(() => {
        if (!isOpen) {
            setTasks([]);
            setError("");
            setStatusFilter("all");
            setConfirmId(null);
            setDeleteError("");
        }
    }, [isOpen]);

    const stats = useMemo(() => {
        const byStatus = new Map<string, number>();
        tasks.forEach((t) => {
            const s = String((t as any).status ?? "unknown");
            byStatus.set(s, (byStatus.get(s) ?? 0) + 1);
        });
        return { total: tasks.length, byStatus };
    }, [tasks]);

    const visibleTasks = useMemo(() => {
        if (statusFilter === "all") return tasks;
        return tasks.filter(
            (t) => String((t as any).status ?? "unknown") === statusFilter
        );
    }, [tasks, statusFilter]);

    const assigneeNames = useCallback(
        (task: TaskItem): string => {
            const raw = (task as any).assigned_employee;
            const ids: any[] = Array.isArray(raw) ? raw : raw != null ? [raw] : [];
            const names = ids
                .map((entry) => {
                    if (entry && typeof entry === "object") {
                        return employeeName(entry);
                    }
                    const found = employees.find(
                        (e: any) => e && String(e.id) === String(entry)
                    );
                    return employeeName(found);
                })
                .filter(Boolean);
            return names.join("، ");
        },
        [employees]
    );

    const handleDelete = async (taskId: number) => {
        setDeleteError("");
        try {
            await onDeleteTask(taskId);
            setConfirmId(null);
            // بعد از حذف دوباره از خود API می‌خونیم
            setReloadTick((n) => n + 1);
        } catch (e) {
            setDeleteError(e instanceof Error ? e.message : "خطا در حذف وظیفه");
        }
    };

    const border = isDark ? "rgba(255,255,255,0.07)" : "rgba(0,0,0,0.07)";
    const softBg = isDark ? "rgba(255,255,255,0.04)" : "rgba(0,0,0,0.03)";
    const textMain = isDark ? "#f1f5f9" : "#1e293b";
    const textMuted = isDark ? "#94a3b8" : "#64748b";

    return (
        <AnimatePresence>
            {isOpen && caseItem && (
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="fixed inset-0 z-50 flex items-center justify-center px-4"
                    style={{
                        background: "rgba(0,0,0,0.5)",
                        backdropFilter: "blur(4px)",
                    }}
                    onClick={onClose}
                >
                    <motion.div
                        initial={{ scale: 0.95, y: 16, opacity: 0 }}
                        animate={{ scale: 1, y: 0, opacity: 1 }}
                        exit={{ scale: 0.95, y: 16, opacity: 0 }}
                        transition={{ duration: 0.2, ease: "easeOut" }}
                        className="flex max-h-[85vh] w-full max-w-[560px] flex-col overflow-hidden rounded-[2rem] border"
                        style={{
                            background: isDark ? "#0f172a" : "#ffffff",
                            borderColor: border,
                            boxShadow: "0 24px 64px rgba(0,0,0,0.35)",
                        }}
                        onClick={(e) => e.stopPropagation()}
                        dir="rtl"
                    >
                        {/* Header */}
                        <div
                            className="flex items-center justify-between gap-3 border-b px-5 py-4"
                            style={{ borderColor: border }}
                        >
                            <div className="flex min-w-0 items-center gap-2.5">
                                <div
                                    className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl"
                                    style={{
                                        background: "rgba(99,102,241,0.1)",
                                        color: isDark ? "#a5b4fc" : "#6366f1",
                                    }}
                                >
                                    <Layers size={16} />
                                </div>
                                <div className="min-w-0">
                                    <h3
                                        className="truncate text-[13.5px] font-extrabold"
                                        style={{ color: textMain }}
                                    >
                                        وظیفه‌های پرونده
                                    </h3>
                                    <p
                                        className="truncate text-[11.5px]"
                                        style={{ color: textMuted }}
                                    >
                                        {caseItem.title}
                                    </p>
                                </div>
                            </div>

                            <div className="flex items-center gap-1.5">
                                <button
                                    type="button"
                                    title="بارگذاری مجدد"
                                    onClick={() => setReloadTick((n) => n + 1)}
                                    disabled={loading}
                                    className="flex h-8 w-8 items-center justify-center rounded-xl transition-colors disabled:opacity-40"
                                    style={{ background: softBg, color: textMuted }}
                                >
                                    <RefreshCw
                                        size={13}
                                        className={loading ? "animate-spin" : ""}
                                    />
                                </button>
                                <button
                                    type="button"
                                    onClick={onClose}
                                    className="flex h-8 w-8 items-center justify-center rounded-xl transition-colors"
                                    style={{ background: softBg, color: textMuted }}
                                >
                                    <X size={14} />
                                </button>
                            </div>
                        </div>

                        {/* Stats / filters */}
                        {!loading && !error && stats.total > 0 && (
                            <div
                                className="flex flex-wrap items-center gap-2 border-b px-5 py-3"
                                style={{ borderColor: border }}
                            >
                                <button
                                    type="button"
                                    onClick={() => setStatusFilter("all")}
                                    className="flex items-center gap-1.5 rounded-full px-3 py-1 text-[11px] font-bold transition-colors"
                                    style={{
                                        background:
                                            statusFilter === "all"
                                                ? "rgba(99,102,241,0.15)"
                                                : softBg,
                                        color:
                                            statusFilter === "all"
                                                ? isDark
                                                    ? "#a5b4fc"
                                                    : "#4f46e5"
                                                : textMuted,
                                    }}
                                >
                                    همه
                                    <span className="font-extrabold">
                                        {formatNumber(stats.total)}
                                    </span>
                                </button>

                                {Array.from(stats.byStatus.entries()).map(
                                    ([status, count]) => {
                                        const meta = getStatusMeta(status);
                                        const active = statusFilter === status;
                                        return (
                                            <button
                                                key={status}
                                                type="button"
                                                onClick={() =>
                                                    setStatusFilter(active ? "all" : status)
                                                }
                                                className="flex items-center gap-1.5 rounded-full px-3 py-1 text-[11px] font-bold transition-colors"
                                                style={{
                                                    background: active
                                                        ? `${meta.color}33`
                                                        : `${meta.color}1a`,
                                                    color: meta.color,
                                                    outline: active
                                                        ? `1.5px solid ${meta.color}`
                                                        : "none",
                                                }}
                                            >
                                                {meta.label}
                                                <span className="font-extrabold">
                                                    {formatNumber(count)}
                                                </span>
                                            </button>
                                        );
                                    }
                                )}
                            </div>
                        )}

                        {/* Body */}
                        <div className="flex-1 overflow-y-auto px-5 py-4">
                            {loading && (
                                <div className="flex flex-col items-center justify-center gap-3 py-14">
                                    <Loader2
                                        size={24}
                                        className="animate-spin text-indigo-500"
                                    />
                                    <p className="text-[12.5px]" style={{ color: textMuted }}>
                                        در حال دریافت وظیفه‌ها از سرور...
                                    </p>
                                </div>
                            )}

                            {!loading && error && (
                                <div className="flex flex-col items-center gap-3 rounded-2xl border border-rose-200 bg-rose-50 p-4 text-[12.5px] text-rose-600 dark:border-rose-500/20 dark:bg-rose-500/10 dark:text-rose-300">
                                    <span>{error}</span>
                                    <button
                                        type="button"
                                        onClick={() => setReloadTick((n) => n + 1)}
                                        className="rounded-xl bg-rose-600 px-3 py-1.5 text-[11.5px] font-bold text-white transition-colors hover:bg-rose-500"
                                    >
                                        تلاش مجدد
                                    </button>
                                </div>
                            )}

                            {!loading && !error && stats.total === 0 && (
                                <div className="flex flex-col items-center justify-center gap-2 py-14">
                                    <Layers
                                        size={28}
                                        className="text-gray-300 dark:text-gray-700"
                                    />
                                    <p className="text-[12.5px]" style={{ color: textMuted }}>
                                        این پرونده هنوز وظیفه‌ای ندارد
                                    </p>
                                </div>
                            )}

                            {!loading && !error && visibleTasks.length > 0 && (
                                <div className="flex flex-col gap-2.5">
                                    {deleteError && (
                                        <p className="text-center text-[11.5px] font-semibold text-red-500">
                                            {deleteError}
                                        </p>
                                    )}

                                    {visibleTasks.map((task) => {
                                        const t = task as any;
                                        const meta = getStatusMeta(t.status);
                                        const assignees = assigneeNames(task);
                                        const created = formatDate(t.created_at);
                                        const isDeleting = deletingTaskId === t.id;
                                        const isConfirming = confirmId === t.id;

                                        return (
                                            <div
                                                key={t.id}
                                                className="rounded-2xl border p-3.5"
                                                style={{
                                                    borderColor: border,
                                                    background: softBg,
                                                    opacity: isDeleting ? 0.5 : 1,
                                                    pointerEvents: isDeleting ? "none" : undefined,
                                                }}
                                            >
                                                <div className="flex items-start justify-between gap-3">
                                                    <div className="min-w-0 flex-1">
                                                        <h4
                                                            className="truncate text-[13px] font-extrabold"
                                                            style={{ color: textMain }}
                                                        >
                                                            {t.title}
                                                        </h4>
                                                        <p
                                                            className="mt-0.5 text-[11px]"
                                                            style={{ color: textMuted }}
                                                        >
                                                            {[t.department_name, t.current_step_name]
                                                                .filter(Boolean)
                                                                .join(" • ")}
                                                        </p>
                                                    </div>

                                                    <span
                                                        className="shrink-0 rounded-full px-2.5 py-0.5 text-[10.5px] font-bold"
                                                        style={{
                                                            background: `${meta.color}1a`,
                                                            color: meta.color,
                                                        }}
                                                    >
                                                        {meta.label}
                                                    </span>
                                                </div>

                                                <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1.5">
                                                    {assignees && (
                                                        <span
                                                            className="flex items-center gap-1.5 text-[10.5px] font-medium"
                                                            style={{ color: textMuted }}
                                                        >
                                                            <User size={11} />
                                                            {assignees}
                                                        </span>
                                                    )}
                                                    {created && (
                                                        <span
                                                            className="flex items-center gap-1.5 text-[10.5px] font-medium"
                                                            style={{ color: textMuted }}
                                                        >
                                                            <CalendarDays size={11} />
                                                            {created}
                                                        </span>
                                                    )}

                                                    <div className="mr-auto flex items-center gap-1.5">
                                                        {isConfirming ? (
                                                            <>
                                                                <button
                                                                    type="button"
                                                                    onClick={() => handleDelete(t.id)}
                                                                    className="rounded-xl bg-red-500 px-2.5 py-1 text-[10.5px] font-bold text-white transition-colors hover:bg-red-600"
                                                                >
                                                                    تأیید حذف
                                                                </button>
                                                                <button
                                                                    type="button"
                                                                    onClick={() => setConfirmId(null)}
                                                                    className="rounded-xl px-2.5 py-1 text-[10.5px] font-bold"
                                                                    style={{
                                                                        background: softBg,
                                                                        color: textMuted,
                                                                    }}
                                                                >
                                                                    انصراف
                                                                </button>
                                                            </>
                                                        ) : (
                                                            <>
                                                                <button
                                                                    type="button"
                                                                    title="ویرایش وظیفه"
                                                                    onClick={() => onEditTask(task)}
                                                                    className="flex h-7 w-7 items-center justify-center rounded-xl transition-colors"
                                                                    style={{
                                                                        background: "rgba(99,102,241,0.08)",
                                                                        color: isDark ? "#a5b4fc" : "#6366f1",
                                                                    }}
                                                                >
                                                                    <Pencil size={11} />
                                                                </button>
                                                                <button
                                                                    type="button"
                                                                    title="حذف وظیفه"
                                                                    onClick={() => {
                                                                        setDeleteError("");
                                                                        setConfirmId(t.id);
                                                                    }}
                                                                    className="flex h-7 w-7 items-center justify-center rounded-xl transition-colors"
                                                                    style={{
                                                                        background: "rgba(239,68,68,0.08)",
                                                                        color: "#ef4444",
                                                                    }}
                                                                >
                                                                    {isDeleting ? (
                                                                        <Loader2
                                                                            size={11}
                                                                            className="animate-spin"
                                                                        />
                                                                    ) : (
                                                                        <Trash2 size={11} />
                                                                    )}
                                                                </button>
                                                            </>
                                                        )}
                                                    </div>
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            )}
                        </div>
                    </motion.div>
                </motion.div>
            )}
        </AnimatePresence>
    );
}