"use client";

import { useEffect, useMemo, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import {
    AlertTriangle,
    Ban,
    CalendarClock,
    CheckCircle2,
    History,
    Loader,
    Loader2,
    Plus,
    RefreshCw,
    Repeat,
    RotateCcw,
    Timer,
    Trash2,
} from "lucide-react";
import { useTheme } from "next-themes";
import { useAuthStore } from "@/store/authStore";
import {
    deleteInternalTaskRoutine,
    fetchInternalTaskRoutines,
    fetchInternalTasks,
} from "./Api";
import CreateTaskRoutineModal from "./Createtaskroutinemodal";
import InternalTaskActionModal from "./Internaltaskactionmodal";
import type { InternalTask, InternalTaskRoutine } from "./Types";

const NEVER_REPEAT_VALUE = 2147483647;

function formatDate(value?: string | null) {
    if (!value) return "—";
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return "—";
    return new Intl.DateTimeFormat("fa-IR", {
        day: "numeric",
        month: "long",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
    }).format(date);
}

function intervalLabel(days: number) {
    if (days >= NEVER_REPEAT_VALUE) return "فقط یک‌بار اجرا می‌شود";
    return `هر ${new Intl.NumberFormat("fa-IR").format(days)} روز`;
}

function getStatusBadge(status: InternalTask["status"] | undefined) {
    if (status === "completed") {
        return {
            label: "انجام شده",
            dot: "bg-emerald-500",
            badge: "bg-emerald-500/10 text-emerald-500",
        };
    }

    if (status === "cancelled") {
        return {
            label: "لغو شده",
            dot: "bg-red-500",
            badge: "bg-red-500/10 text-red-500",
        };
    }

    if (status === "waiting") {
        return {
            label: "در انتظار اجرا",
            dot: "bg-amber-500",
            badge: "bg-amber-500/10 text-amber-500",
        };
    }

    return {
        label: "در حال انجام",
        dot: "bg-indigo-500",
        badge: "bg-indigo-500/10 text-indigo-500",
    };
}

function RoutineCountdown({
    nextRunAt,
    onReady,
}: {
    nextRunAt?: string | null;
    onReady: () => void;
}) {
    const [remaining, setRemaining] = useState(() => {
        if (!nextRunAt) return 0;

        return Math.max(
            0,
            new Date(nextRunAt).getTime() - Date.now(),
        );
    });

    useEffect(() => {
        if (!nextRunAt) {
            setRemaining(0);
            onReady();
            return;
        }

        const update = () => {
            const target = new Date(nextRunAt).getTime();
            const nextRemaining = Math.max(0, target - Date.now());

            setRemaining(nextRemaining);

            if (nextRemaining <= 0) {
                onReady();
            }
        };

        update();

        const timer = window.setInterval(update, 1000);

        return () => window.clearInterval(timer);
    }, [nextRunAt, onReady]);

    if (remaining <= 0) return null;

    const totalSeconds = Math.floor(remaining / 1000);
    const days = Math.floor(totalSeconds / 86400);
    const hours = Math.floor((totalSeconds % 86400) / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;

    const number = (value: number) =>
        new Intl.NumberFormat("fa-IR", {
            minimumIntegerDigits: 2,
            useGrouping: false,
        }).format(value);

    const time = `${number(hours)}:${number(minutes)}:${number(seconds)}`;
    const dayText = new Intl.NumberFormat("fa-IR").format(days);

    return (
        <div className="rounded-2xl border border-amber-500/15 bg-amber-500/[0.06] p-3">
            <div className="mb-2 flex items-center gap-2">
                <div className="flex h-7 w-7 items-center justify-center rounded-xl bg-amber-500/10">
                    <Timer size={14} className="text-amber-500" />
                </div>

                <span className="text-[10.5px] font-extrabold text-amber-600 dark:text-amber-400">
                    دوره بعدی انجام
                </span>
            </div>

            <div className="flex items-center justify-center gap-1.5 text-[17px] font-black tracking-wide text-gray-800 dark:text-white">
                <span dir="ltr">{time}</span>

                {days > 0 && (
                    <>
                        <span dir="rtl" className="text-[13px]">
                            و
                        </span>

                        <span dir="rtl" className="text-[13px]">
                            {dayText} روز
                        </span>
                    </>
                )}
            </div>

            <div className="mt-2 text-center text-[10px] font-semibold text-gray-400">
                اجرای بعدی: {formatDate(nextRunAt)}
            </div>
        </div>
    );
}

function RoutineCard({
    routine,
    task,
    index,
    isMine,
    onTaskUpdated,
    onDelete,
    isDeleting,
}: {
    routine: InternalTaskRoutine;
    task: InternalTask | undefined;
    index: number;
    isMine: boolean;
    onTaskUpdated: (task: InternalTask) => void;
    onDelete: (routine: InternalTaskRoutine) => void;
    isDeleting: boolean;
}) {
    const { resolvedTheme } = useTheme();
    const isDark = resolvedTheme === "dark";
    const [showConfirm, setShowConfirm] = useState(false);
    const [actionModal, setActionModal] = useState<
        "complete" | "cancel" | null
    >(null);
    const [isReady, setIsReady] = useState(false);

    useEffect(() => {
        if (task?.status !== "waiting") {
            setIsReady(true);
            return;
        }

        if (!routine.next_run_at) {
            setIsReady(true);
            return;
        }

        const target = new Date(routine.next_run_at).getTime();
        const check = () => setIsReady(target <= Date.now());

        check();

        const timer = window.setInterval(check, 1000);

        return () => window.clearInterval(timer);
    }, [task?.status, routine.next_run_at]);

    const statusBadge = getStatusBadge(task?.status);

    const isWaiting = task?.status === "waiting";
    const isCompleted = task?.status === "completed";
    const isCancelled = task?.status === "cancelled";

    const canTakeAction =
        !!task &&
        isMine &&
        !isCompleted &&
        !isCancelled &&
        (!isWaiting || isReady);

    return (
        <>
            <motion.div
                layout
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95 }}
                transition={{ duration: 0.22, delay: index * 0.04 }}
                className="relative flex flex-col gap-3 overflow-hidden rounded-[2rem] p-4"
                style={{
                    border: isDark
                        ? "1px solid rgba(255,255,255,0.06)"
                        : "1px solid rgba(0,0,0,0.06)",
                    background: isDark ? "rgba(255,255,255,0.02)" : "#fafafa",
                    boxShadow: isDark
                        ? "0 2px 24px rgba(0,0,0,0.2)"
                        : "0 2px 16px rgba(0,0,0,0.04)",
                }}
            >
                <div className="flex items-start justify-between gap-3">
                    <div className="flex flex-wrap items-center gap-1.5">
                        <span
                            className={`inline-flex shrink-0 items-center gap-1.5 rounded-full border px-3 py-1 text-[10.5px] font-bold ${routine.is_active
                                ? "border-emerald-500/20 bg-emerald-500/10 text-emerald-500"
                                : "border-gray-400/20 bg-gray-400/10 text-gray-400"
                                }`}
                        >
                            <span
                                className={`h-1.5 w-1.5 rounded-full bg-current ${routine.is_active ? "animate-pulse" : ""
                                    }`}
                            />
                            {routine.is_active ? "فعال" : "متوقف‌شده"}
                        </span>

                        {task && (
                            <span
                                className={`inline-flex shrink-0 items-center gap-1.5 rounded-full px-2.5 py-1 text-[10px] font-extrabold ${statusBadge.badge}`}
                            >
                                <span
                                    className={`h-1.5 w-1.5 rounded-full ${statusBadge.dot}`}
                                />
                                {statusBadge.label}
                            </span>
                        )}
                    </div>

                    <div className="flex shrink-0 items-center gap-1.5">
                        <button
                            type="button"
                            onClick={() => setShowConfirm(true)}
                            disabled={isDeleting}
                            className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-red-500/[0.08] text-red-500 transition-all hover:bg-red-500/[0.14] disabled:opacity-40"
                            title="حذف تسک روتین"
                        >
                            {isDeleting ? (
                                <Loader2 size={13} className="animate-spin" />
                            ) : (
                                <Trash2 size={13} />
                            )}
                        </button>
                    </div>
                </div>

                <div className="flex flex-col gap-1">
                    <h3
                        className="line-clamp-1 text-[13.5px] font-extrabold"
                        style={{ color: isDark ? "#f1f5f9" : "#1e293b" }}
                    >
                        {task?.title || `تسک #${routine.task}`}
                    </h3>
                    <p
                        className="line-clamp-2 text-[11.5px] leading-6"
                        style={{ color: isDark ? "#94a3b8" : "#64748b" }}
                    >
                        {task?.description || "بدون توضیحات"}
                    </p>
                </div>

                <div
                    className="flex flex-col gap-2 border-t pt-3"
                    style={{
                        borderColor: isDark
                            ? "rgba(255,255,255,0.05)"
                            : "rgba(0,0,0,0.05)",
                    }}
                >
                    <div className="flex items-center gap-2">
                        <Repeat size={12} className="shrink-0 text-indigo-500" />
                        <span className="text-[10.5px] font-bold text-black/55 dark:text-white/50">
                            {intervalLabel(routine.interval_days)}
                        </span>
                    </div>

                    <div className="flex items-center gap-2">
                        <CalendarClock size={12} className="shrink-0 text-indigo-500" />
                        <span className="text-[10.5px] font-bold text-black/55 dark:text-white/50">
                            اجرای بعدی: {formatDate(routine.next_run_at)}
                        </span>
                    </div>

                    <div className="flex items-center gap-2">
                        <History size={12} className="shrink-0 text-black/30 dark:text-white/25" />
                        <span className="text-[10px] text-black/40 dark:text-white/35">
                            آخرین اجرا: {formatDate(routine.last_run_at)}
                        </span>
                    </div>
                </div>

                {isWaiting && !isReady && (
                    <div
                        className="border-t pt-3"
                        style={{
                            borderColor: isDark
                                ? "rgba(255,255,255,0.05)"
                                : "rgba(0,0,0,0.05)",
                        }}
                    >
                        <RoutineCountdown
                            nextRunAt={routine.next_run_at}
                            onReady={() => setIsReady(true)}
                        />
                    </div>
                )}

                {canTakeAction && (
                    <div
                        className="flex flex-col gap-2 border-t pt-3"
                        style={{
                            borderColor: isDark
                                ? "rgba(255,255,255,0.05)"
                                : "rgba(0,0,0,0.05)",
                        }}
                    >
                        <div className="flex gap-2">
                            <button
                                type="button"
                                onClick={() => setActionModal("complete")}
                                className="flex h-9 flex-1 items-center justify-center gap-1.5 rounded-xl bg-emerald-500 text-[10.5px] font-extrabold text-white transition-opacity hover:opacity-90"
                            >
                                <CheckCircle2 size={13} />
                                انجام شد
                            </button>

                            <button
                                type="button"
                                onClick={() => setActionModal("cancel")}
                                className="flex h-9 flex-1 items-center justify-center gap-1.5 rounded-xl bg-red-500 text-[10.5px] font-extrabold text-white transition-opacity hover:opacity-90"
                            >
                                <Ban size={13} />
                                لغو تسک
                            </button>
                        </div>
                    </div>
                )}

                {task && (isCompleted || isCancelled) && (
                    <div className="flex items-center justify-center gap-1.5 rounded-xl bg-gray-50 py-2 text-[10.5px] font-bold text-gray-400 dark:bg-white/[0.04]">
                        <RotateCcw size={12} />
                        این نوبت بسته شده است
                    </div>
                )}

                <AnimatePresence>
                    {showConfirm && (
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="absolute inset-0 z-10 flex flex-col items-center justify-center gap-3 rounded-[2rem] p-5 text-center"
                            style={{
                                background: isDark
                                    ? "rgba(15,23,42,0.96)"
                                    : "rgba(255,255,255,0.97)",
                                backdropFilter: "blur(4px)",
                            }}
                        >
                            <AlertTriangle size={22} className="text-red-500" />
                            <p className="text-[12px] font-bold text-slate-700 dark:text-slate-200">
                                این تسک روتین حذف شود؟
                            </p>
                            <div className="flex w-full items-center gap-2">
                                <button
                                    type="button"
                                    onClick={() => setShowConfirm(false)}
                                    className="flex-1 rounded-xl bg-gray-100 py-2 text-[11.5px] font-bold text-gray-600 dark:bg-white/[0.06] dark:text-gray-300"
                                >
                                    انصراف
                                </button>
                                <button
                                    type="button"
                                    onClick={() => {
                                        setShowConfirm(false);
                                        onDelete(routine);
                                    }}
                                    className="flex-1 rounded-xl bg-red-500 py-2 text-[11.5px] font-bold text-white"
                                >
                                    حذف شود
                                </button>
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </motion.div>

            {task && actionModal && canTakeAction && (
                <InternalTaskActionModal
                    isOpen={true}
                    action={actionModal}
                    task={task}
                    onClose={() => setActionModal(null)}
                    onDone={(updatedTask) => {
                        onTaskUpdated(updatedTask);
                        setActionModal(null);
                    }}
                />
            )}
        </>
    );
}

export default function AdminTaskRoutineBoard() {
    const { userId } = useAuthStore();

    const [routines, setRoutines] = useState<InternalTaskRoutine[]>([]);
    const [tasks, setTasks] = useState<InternalTask[]>([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [createOpen, setCreateOpen] = useState(false);
    const [deletingId, setDeletingId] = useState<number | null>(null);

    async function loadData(initial = false) {
        if (initial) setLoading(true);
        else setRefreshing(true);
        setError(null);
        try {
            const [routinesResponse, tasksResponse] = await Promise.all([
                fetchInternalTaskRoutines(),
                fetchInternalTasks(),
            ]);
            setRoutines(
                Array.isArray(routinesResponse.data) ? routinesResponse.data : [],
            );
            setTasks(Array.isArray(tasksResponse.data) ? tasksResponse.data : []);
        } catch {
            setError("دریافت تسک‌های روتین با خطا مواجه شد.");
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    }

    async function silentLoad() {
        try {
            const [routinesResponse, tasksResponse] = await Promise.all([
                fetchInternalTaskRoutines(),
                fetchInternalTasks(),
            ]);
            setRoutines(
                Array.isArray(routinesResponse.data) ? routinesResponse.data : [],
            );
            setTasks(Array.isArray(tasksResponse.data) ? tasksResponse.data : []);
        } catch {
        }
    }

    useEffect(() => {
        void loadData(true);
    }, []);

    useEffect(() => {
        const interval = window.setInterval(() => {
            void silentLoad();
        }, 20000);

        return () => window.clearInterval(interval);
    }, []);

    const tasksById = useMemo(() => {
        const map = new Map<number, InternalTask>();
        tasks.forEach((task) => map.set(task.id, task));
        return map;
    }, [tasks]);

    const sortedRoutines = useMemo(() => {
        return [...routines].sort((a, b) => {
            const aDate = new Date(a.next_run_at || a.created_at || 0).getTime();
            const bDate = new Date(b.next_run_at || b.created_at || 0).getTime();
            return aDate - bDate;
        });
    }, [routines]);

    const availableTasks = useMemo(() => {
        const routinedTaskIds = new Set(routines.map((routine) => routine.task));
        return tasks.filter((task) => !routinedTaskIds.has(task.id));
    }, [tasks, routines]);

    const isTaskMine = (task: InternalTask | undefined) => {
        if (!task || !userId) return false;
        if (!Array.isArray(task.assigned_to)) return false;
        return task.assigned_to.some(
            (assigned) => Number(assigned.id) === Number(userId),
        );
    };

    async function handleCreated(routine: InternalTaskRoutine) {
        setRoutines((previous) => [
            routine,
            ...previous.filter((item) => item.id !== routine.id),
        ]);

        try {
            const [routinesResponse, tasksResponse] = await Promise.all([
                fetchInternalTaskRoutines(),
                fetchInternalTasks(),
            ]);

            if (Array.isArray(routinesResponse.data)) {
                setRoutines(routinesResponse.data);
            }

            if (Array.isArray(tasksResponse.data)) {
                setTasks(tasksResponse.data);
            }
        } catch {
        }
    }

    async function handleTaskUpdated(updatedTask: InternalTask) {
        try {
            const [routinesResponse, tasksResponse] = await Promise.all([
                fetchInternalTaskRoutines(),
                fetchInternalTasks(),
            ]);

            if (Array.isArray(tasksResponse.data)) {
                setTasks(tasksResponse.data);
            }

            if (Array.isArray(routinesResponse.data)) {
                setRoutines(routinesResponse.data);
            }
        } catch {
            setTasks((previous) =>
                previous.map((task) =>
                    task.id === updatedTask.id
                        ? { ...task, ...updatedTask }
                        : task,
                ),
            );
        }
    }

    async function handleDelete(routine: InternalTaskRoutine) {
        setDeletingId(routine.id);
        try {
            await deleteInternalTaskRoutine(routine.id);
            setRoutines((previous) =>
                previous.filter((item) => item.id !== routine.id),
            );
        } catch {
            setError("حذف تسک روتین با خطا مواجه شد.");
            try {
                const { data } = await fetchInternalTaskRoutines();
                if (Array.isArray(data)) {
                    setRoutines(data);
                }
            } catch {
            }
        } finally {
            setDeletingId(null);
        }
    }

    if (loading) {
        return (
            <div dir="rtl" className="flex h-64 items-center justify-center">
                <Loader size={22} className="animate-spin text-indigo-500" />
            </div>
        );
    }

    return (
        <div dir="rtl" className="flex flex-col gap-5">
            <div className="flex items-center justify-between gap-4">
                <div className="flex items-center gap-2.5">
                    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-2xl bg-indigo-500/10">
                        <Repeat size={17} className="text-indigo-500" />
                    </div>
                    <div>
                        <h3 className="text-[14px] font-extrabold text-gray-900 dark:text-white">
                            تسک‌های روتین
                        </h3>
                        <p className="text-[11px] text-gray-400 dark:text-gray-600">
                            مدیریت تسک‌های درون‌سازمانی تکرارشونده
                        </p>
                    </div>
                </div>

                <div className="flex shrink-0 items-center gap-2">
                    <button
                        type="button"
                        onClick={() => setCreateOpen(true)}
                        className="flex items-center gap-1.5 rounded-2xl bg-indigo-600 px-3.5 py-2 text-[11.5px] font-bold text-white transition-colors hover:bg-indigo-500"
                    >
                        <Plus size={13} />
                        روتین جدید
                    </button>

                    <button
                        type="button"
                        onClick={() => void loadData()}
                        disabled={refreshing}
                        className="flex h-9 w-9 items-center justify-center rounded-2xl bg-gray-100 text-gray-500 transition-colors hover:bg-gray-200 disabled:opacity-40 dark:bg-white/[0.05] dark:text-gray-400 dark:hover:bg-white/[0.08]"
                        title="به‌روزرسانی"
                    >
                        <RefreshCw
                            size={14}
                            className={refreshing ? "animate-spin" : ""}
                        />
                    </button>
                </div>
            </div>

            {error ? (
                <div className="flex items-center justify-between gap-3 rounded-2xl border border-red-500/20 bg-red-500/5 px-4 py-3">
                    <p className="text-[12px] font-semibold text-red-500">{error}</p>
                    <button
                        type="button"
                        onClick={() => void loadData()}
                        className="rounded-xl bg-red-500/10 px-3 py-1.5 text-[11px] font-bold text-red-500"
                    >
                        تلاش مجدد
                    </button>
                </div>
            ) : null}

            <div className="flex items-center gap-2">
                <div className="flex items-center gap-2 rounded-2xl bg-indigo-500/[0.07] px-3 py-2">
                    <Repeat size={13} className="text-indigo-500" />
                    <span className="text-[11px] font-bold text-indigo-500">
                        {routines.length} تسک روتین
                    </span>
                </div>
                <div className="flex items-center gap-2 rounded-2xl bg-gray-100 px-3 py-2 dark:bg-white/[0.05]">
                    <CalendarClock size={13} className="text-gray-400" />
                    <span className="text-[11px] font-bold text-gray-400">
                        {routines.filter((routine) => routine.is_active).length} فعال
                    </span>
                </div>
            </div>

            {sortedRoutines.length === 0 ? (
                <div className="flex h-64 flex-col items-center justify-center gap-3 rounded-3xl border border-dashed border-gray-200 dark:border-white/[0.07]">
                    <Repeat size={28} className="text-gray-300 dark:text-gray-700" />
                    <p className="text-[12px] text-gray-400">
                        هنوز هیچ تسک روتینی ثبت نشده است.
                    </p>
                </div>
            ) : (
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-3">
                    {sortedRoutines.map((routine, index) => {
                        const task = tasksById.get(routine.task);

                        return (
                            <RoutineCard
                                key={`routine-${routine.id}`}
                                routine={routine}
                                task={task}
                                index={index}
                                isMine={isTaskMine(task)}
                                onTaskUpdated={handleTaskUpdated}
                                onDelete={handleDelete}
                                isDeleting={deletingId === routine.id}
                            />
                        );
                    })}
                </div>
            )}

            <CreateTaskRoutineModal
                isOpen={createOpen}
                onClose={() => setCreateOpen(false)}
                tasks={availableTasks}
                onCreated={handleCreated}
            />
        </div>
    );
}