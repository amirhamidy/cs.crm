"use client";

import { useEffect, useMemo, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import {
    Ban,
    CalendarClock,
    CheckCircle2,
    History,
    Inbox,
    Loader,
    Plus,
    RefreshCw,
    Repeat,
    RotateCcw,
    Timer,
    Users,
} from "lucide-react";
import { useAuthStore } from "@/store/authStore";
import {
    fetchEmployeeList,
    fetchInternalTaskRoutines,
    fetchInternalTasks,
} from "./Api";
import InternalTaskActionModal from "./Internaltaskactionmodal";
import EmployeeCreateTaskRoutineModal from "./EmployeeCreateTaskRoutineModal";
import type {
    EmployeeListItem,
    EmployeeRef,
    InternalTask,
    InternalTaskRoutine,
} from "./Types";

const NEVER_REPEAT_VALUE = 2147483647;

const AVATAR_GRADIENTS = [
    ["#6366f1", "#8b5cf6"],
    ["#3b82f6", "#6366f1"],
    ["#8b5cf6", "#ec4899"],
    ["#06b6d4", "#6366f1"],
    ["#f59e0b", "#ef4444"],
    ["#10b981", "#3b82f6"],
    ["#f472b6", "#ec4899"],
    ["#8b5cf6", "#f59e0b"],
];

function getGradient(id: number) {
    const safeId = Number.isFinite(id) ? Math.abs(id) : 0;
    return AVATAR_GRADIENTS[safeId % AVATAR_GRADIENTS.length];
}

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
    if (days >= NEVER_REPEAT_VALUE) {
        return "فقط یک‌بار اجرا می‌شود";
    }

    return `هر ${new Intl.NumberFormat("fa-IR").format(days)} روز`;
}

function resolveAssignedTo(
    rawAssignedTo: unknown,
    employees: EmployeeListItem[],
): EmployeeRef[] {
    if (!Array.isArray(rawAssignedTo)) return [];

    const employeeById = new Map(
        employees
            .map(
                (employee) =>
                    [
                        Number(employee.id),
                        employee.full_name || employee.username,
                    ] as const,
            )
            .filter(([id]) => Number.isFinite(id)),
    );

    return rawAssignedTo
        .map((item): EmployeeRef | null => {
            const id =
                typeof item === "number"
                    ? item
                    : Number((item as { id?: unknown } | null)?.id);

            if (!Number.isFinite(id)) return null;

            const providedName =
                typeof item === "object" &&
                    item !== null &&
                    typeof (item as { full_name?: unknown }).full_name === "string"
                    ? (item as { full_name: string }).full_name
                    : "";

            const full_name =
                providedName.trim() ||
                employeeById.get(id) ||
                `کارمند ${id}`;

            return { id, full_name };
        })
        .filter((item): item is EmployeeRef => item !== null);
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

function formatRemaining(milliseconds: number) {
    if (milliseconds <= 0) return "۰۰:۰۰:۰۰";

    const totalSeconds = Math.floor(milliseconds / 1000);
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

    if (days > 0) {
        return `${time} و ${new Intl.NumberFormat("fa-IR").format(days)} روز`;
    }

    return time;
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
    employees,
    index,
    onTaskUpdated,
}: {
    routine: InternalTaskRoutine;
    task: InternalTask | undefined;
    employees: EmployeeListItem[];
    index: number;
    onTaskUpdated: (task: InternalTask) => void;
}) {
    const [actionModal, setActionModal] = useState<
        "complete" | "cancel" | null
    >(null);

    const [isReady, setIsReady] = useState(() => {
        if (task?.status !== "waiting") return true;

        if (!routine.next_run_at) return true;

        return new Date(routine.next_run_at).getTime() <= Date.now();
    });

    const assignedEmployees = resolveAssignedTo(
        task?.assigned_to ?? [],
        employees,
    );

    const statusBadge = getStatusBadge(task?.status);

    const isWaiting = task?.status === "waiting";
    const isCompleted = task?.status === "completed";
    const isCancelled = task?.status === "cancelled";

    const canTakeAction =
        !!task &&
        !isCompleted &&
        !isCancelled &&
        (!isWaiting || isReady);

    return (
        <>
            <motion.div
                layout
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{
                    duration: 0.22,
                    delay: index * 0.04,
                }}
                className="flex flex-col gap-3 rounded-[2rem] border border-gray-100 bg-white p-4 shadow-[0_8px_28px_rgba(15,23,42,0.035)] dark:border-white/[0.07] dark:bg-[#111a2d]"
            >
                <div className="flex items-start justify-between gap-3">
                    <span
                        className={`inline-flex shrink-0 items-center gap-1.5 rounded-full px-2.5 py-1 text-[10px] font-extrabold ${statusBadge.badge}`}
                    >
                        <span
                            className={`h-1.5 w-1.5 rounded-full ${statusBadge.dot}`}
                        />

                        {statusBadge.label}
                    </span>

                    <div className="flex items-center gap-1.5 rounded-full bg-indigo-500/[0.08] px-2.5 py-1 text-[10px] font-bold text-indigo-500">
                        <Repeat size={11} />
                        {intervalLabel(routine.interval_days)}
                    </div>
                </div>

                <div className="flex flex-col gap-1">
                    <h3 className="line-clamp-1 text-[13.5px] font-extrabold text-gray-900 dark:text-white">
                        {task?.title || `تسک #${routine.task}`}
                    </h3>

                    <p className="line-clamp-2 text-[11.5px] leading-6 text-gray-500 dark:text-white/40">
                        {task?.description || "بدون توضیحات"}
                    </p>
                </div>

                <div className="flex items-center gap-2 border-t border-black/5 pt-3 dark:border-white/[0.05]">
                    <Users
                        size={12}
                        className="shrink-0 text-indigo-500"
                    />

                    <div className="flex min-w-0 flex-wrap gap-1.5">
                        {assignedEmployees.length > 0 ? (
                            assignedEmployees.map((employee) => {
                                const gradient = getGradient(
                                    Number(employee.id),
                                );

                                return (
                                    <span
                                        key={employee.id}
                                        className="flex items-center gap-1.5 rounded-full border border-black/[0.06] bg-black/[0.025] py-0.5 pl-2 pr-0.5 dark:border-white/[0.06] dark:bg-white/[0.035]"
                                    >
                                        <span
                                            className="flex h-5 w-5 items-center justify-center rounded-full text-[8px] font-extrabold text-white"
                                            style={{
                                                background: `linear-gradient(135deg, ${gradient[0]}, ${gradient[1]})`,
                                            }}
                                        >
                                            {employee.full_name?.slice(0, 1) ||
                                                "ک"}
                                        </span>

                                        <span className="max-w-[120px] truncate text-[9.5px] font-bold text-gray-600 dark:text-gray-300">
                                            {employee.full_name}
                                        </span>
                                    </span>
                                );
                            })
                        ) : (
                            <span className="text-[10px] text-gray-400">
                                بدون مسئول
                            </span>
                        )}
                    </div>
                </div>

                <div className="flex flex-col gap-2 border-t border-black/5 pt-3 dark:border-white/[0.05]">
                    <div className="flex items-center gap-2">
                        <CalendarClock
                            size={12}
                            className="shrink-0 text-indigo-500"
                        />

                        <span className="text-[10.5px] font-bold text-black/55 dark:text-white/50">
                            اجرای بعدی: {formatDate(routine.next_run_at)}
                        </span>
                    </div>

                    <div className="flex items-center gap-2">
                        <History
                            size={12}
                            className="shrink-0 text-black/30 dark:text-white/25"
                        />

                        <span className="text-[10px] text-black/40 dark:text-white/35">
                            آخرین اجرا: {formatDate(routine.last_run_at)}
                        </span>
                    </div>
                </div>

                {isWaiting && !isReady && (
                    <div className="border-t border-black/5 pt-3 dark:border-white/[0.05]">
                        <RoutineCountdown
                            nextRunAt={routine.next_run_at}
                            onReady={() => setIsReady(true)}
                        />
                    </div>
                )}

                {task && canTakeAction && (
                    <div className="flex flex-col gap-2 border-t border-black/5 pt-3 dark:border-white/[0.05]">
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

export default function EmployeeTaskRoutineBoard() {
    const { userId } = useAuthStore();

    const [routines, setRoutines] = useState<InternalTaskRoutine[]>([]);
    const [tasks, setTasks] = useState<InternalTask[]>([]);
    const [employees, setEmployees] = useState<EmployeeListItem[]>([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [createOpen, setCreateOpen] = useState(false);

    async function loadData(initial = false) {
        if (initial) setLoading(true);
        else setRefreshing(true);

        setError(null);

        try {
            const [
                routinesResponse,
                tasksResponse,
                employeesResponse,
            ] = await Promise.all([
                fetchInternalTaskRoutines(),
                fetchInternalTasks(),
                fetchEmployeeList(),
            ]);

            setRoutines(
                Array.isArray(routinesResponse.data)
                    ? routinesResponse.data
                    : [],
            );

            setTasks(
                Array.isArray(tasksResponse.data)
                    ? tasksResponse.data
                    : [],
            );

            setEmployees(
                Array.isArray(employeesResponse.data)
                    ? employeesResponse.data
                    : [],
            );
        } catch {
            setError("دریافت تسک‌های روتین با خطا مواجه شد.");
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    }

    useEffect(() => {
        void loadData(true);
    }, []);

    const tasksById = useMemo(() => {
        const map = new Map<number, InternalTask>();

        tasks.forEach((task) => map.set(task.id, task));

        return map;
    }, [tasks]);

    const myTasks = useMemo(() => {
        if (!userId) return [];

        return tasks.filter((task) =>
            Array.isArray(task.assigned_to)
                ? task.assigned_to.some(
                    (assigned) => Number(assigned.id) === Number(userId),
                )
                : false,
        );
    }, [tasks, userId]);

    const myRoutines = useMemo(() => {
        if (!userId) return [];

        return routines
            .filter((routine) => {
                const task = tasksById.get(routine.task);

                if (!task || !Array.isArray(task.assigned_to)) {
                    return false;
                }

                return task.assigned_to.some(
                    (assigned) =>
                        Number(assigned.id) === Number(userId),
                );
            })
            .sort((a, b) => {
                const aDate = new Date(
                    a.next_run_at || a.created_at || 0,
                ).getTime();

                const bDate = new Date(
                    b.next_run_at || b.created_at || 0,
                ).getTime();

                return aDate - bDate;
            });
    }, [routines, tasksById, userId]);

    const availableMyTasks = useMemo(() => {
        const routinedTaskIds = new Set(
            myRoutines.map((routine) => routine.task),
        );

        return myTasks.filter((task) => !routinedTaskIds.has(task.id));
    }, [myTasks, myRoutines]);

    function handleCreated(routine: InternalTaskRoutine) {
        setRoutines((previous) => [
            routine,
            ...previous.filter((item) => item.id !== routine.id),
        ]);
    }

    function handleTaskUpdated(updatedTask: InternalTask) {
        setTasks((previous) =>
            previous.map((task) =>
                task.id === updatedTask.id
                    ? { ...task, ...updatedTask }
                    : task,
            ),
        );
    }

    if (loading) {
        return (
            <div
                dir="rtl"
                className="flex h-64 items-center justify-center"
            >
                <Loader
                    size={22}
                    className="animate-spin text-indigo-500"
                />
            </div>
        );
    }

    return (
        <div dir="rtl" className="flex flex-col gap-5">
            <div className="flex items-center justify-between gap-4">
                <div className="flex items-center gap-2.5">
                    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-2xl bg-indigo-500/10">
                        <Repeat
                            size={17}
                            className="text-indigo-500"
                        />
                    </div>

                    <div>
                        <h3 className="text-[14px] font-extrabold text-gray-900 dark:text-white">
                            تسک‌های روتین من
                        </h3>

                        <p className="text-[11px] text-gray-400 dark:text-gray-600">
                            {myRoutines.length} تسک روتین
                        </p>
                    </div>
                </div>

                <div className="flex shrink-0 items-center gap-2">
                    <button
                        type="button"
                        onClick={() => setCreateOpen(true)}
                        disabled={myTasks.length === 0}
                        className="flex items-center gap-1.5 rounded-2xl bg-indigo-600 px-3.5 py-2 text-[11.5px] font-bold text-white transition-colors hover:bg-indigo-500 disabled:opacity-40"
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

            {error && (
                <div className="flex items-center justify-between gap-3 rounded-2xl border border-red-500/20 bg-red-500/5 px-4 py-3">
                    <p className="text-[12px] font-semibold text-red-500">
                        {error}
                    </p>

                    <button
                        type="button"
                        onClick={() => void loadData()}
                        className="rounded-xl bg-red-500/10 px-3 py-1.5 text-[11px] font-bold text-red-500 transition-colors hover:bg-red-500/20"
                    >
                        تلاش مجدد
                    </button>
                </div>
            )}

            {myRoutines.length === 0 ? (
                <div className="flex h-64 flex-col items-center justify-center gap-3 rounded-3xl border border-dashed border-gray-200 dark:border-white/[0.07]">
                    <Inbox
                        size={28}
                        className="text-gray-300 dark:text-gray-700"
                    />

                    <p className="text-[12px] text-gray-400">
                        تسک روتینی به شما ارجاع نشده است.
                    </p>
                </div>
            ) : (
                <AnimatePresence mode="popLayout">
                    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-3">
                        {myRoutines.map((routine, index) => (
                            <RoutineCard
                                key={routine.id}
                                routine={routine}
                                task={tasksById.get(routine.task)}
                                employees={employees}
                                index={index}
                                onTaskUpdated={handleTaskUpdated}
                            />
                        ))}
                    </div>
                </AnimatePresence>
            )}

            <EmployeeCreateTaskRoutineModal
                isOpen={createOpen}
                onClose={() => setCreateOpen(false)}
                tasks={availableMyTasks}
                onCreated={handleCreated}
            />
        </div>
    );
}