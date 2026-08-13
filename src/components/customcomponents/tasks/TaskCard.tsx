"use client";

import { useMemo, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import {
    Building2,
    CalendarDays,
    FolderKanban,
    Loader2,
    Paperclip,
    Pencil,
    Trash2,
    UserRound,
    X,
} from "lucide-react";
import { useTheme } from "next-themes";
import type { Task, TaskStatus } from "@/types/task";
import type { Employee } from "@/types/employee";
import {
    taskStatusColors,
    taskStatusLabels,
} from "@/components/customcomponents/shared/constants";
import { useEmployeeInfo } from "@/hooks/useEmployeeInfo";

const AVATAR_GRADIENTS = [
    ["#6366f1", "#8b5cf6"],
    ["#3b82f6", "#6366f1"],
    ["#8b5cf6", "#ec4899"],
    ["#06b6d4", "#6366f1"],
    ["#f59e0b", "#ef4444"],
    ["#10b981", "#3b82f6"],
    ["#f472b6", "#ec4899"],
    ["#8b5cf6", "#f59e0b"],
    ["#3b82f6", "#06b6d4"],
    ["#ef4444", "#f59e0b"],
];

type EmployeeLike = {
    id: number;
    full_name?: string | null;
    username?: string | null;
    position?: string | null;
};

interface TaskCardProps {
    task: Task;
    index?: number;
    employees?: Employee[];
    onEdit?: (task: Task) => void;
    onDelete?: (taskId: number) => Promise<void> | void;
}

function getDepartmentName(task: Task) {
    const department = task.department;
    if (department && typeof department === "object") return department.name || null;
    return null;
}

function formatDate(date?: string) {
    if (!date) return null;
    try {
        return new Date(date).toLocaleDateString("fa-IR", {
            year: "numeric",
            month: "short",
            day: "numeric",
        });
    } catch {
        return null;
    }
}

function getEmployeeGradient(id: number) {
    return AVATAR_GRADIENTS[Math.abs(id) % AVATAR_GRADIENTS.length];
}

function getLocalEmployee(taskEmployee: unknown, employees: Employee[] = []) {
    if (typeof taskEmployee !== "number") return null;
    return employees.find((emp) => emp.id === taskEmployee) ?? null;
}

function normalizeEmployee(emp: unknown): EmployeeLike | null {
    if (!emp) return null;

    if (typeof emp === "object" && emp !== null) {
        const e = emp as EmployeeLike;
        if (typeof e.id === "number") {
            return {
                id: e.id,
                full_name: e.full_name ?? null,
                username: e.username ?? null,
                position: e.position ?? null,
            };
        }
    }

    return null;
}

function Chip({
    isDark,
    children,
}: {
    isDark: boolean;
    children: React.ReactNode;
}) {
    return (
        <div
            className="flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[10.5px] font-bold"
            style={{
                border: isDark ? "1px solid rgba(255,255,255,0.06)" : "1px solid rgba(0,0,0,0.06)",
                background: isDark ? "rgba(255,255,255,0.04)" : "rgba(0,0,0,0.03)",
                color: isDark ? "#94a3b8" : "#64748b",
            }}
        >
            {children}
        </div>
    );
}

export default function TaskCard({
    task,
    index = 0,
    employees = [],
    onEdit,
    onDelete,
}: TaskCardProps) {
    const { resolvedTheme } = useTheme();
    const isDark = resolvedTheme === "dark";

    const [hovered, setHovered] = useState(false);
    const [showConfirm, setShowConfirm] = useState(false);
    const [isDeleting, setIsDeleting] = useState(false);
    const [deleteError, setDeleteError] = useState<string | null>(null);

    const assigned = task.assigned_employee;

    const firstAssignedId =
        typeof assigned === "number"
            ? assigned
            : Array.isArray(assigned)
                ? typeof assigned[0] === "number"
                    ? assigned[0]
                    : null
                : null;

    const localEmployee = useMemo(() => {
        if (typeof assigned === "number") {
            return getLocalEmployee(assigned, employees);
        }
        if (Array.isArray(assigned)) {
            const first = assigned[0];
            if (typeof first === "number") {
                return getLocalEmployee(first, employees);
            }
            return normalizeEmployee(first);
        }
        return normalizeEmployee(assigned);
    }, [assigned, employees]);

    const shouldFetchRemote = typeof firstAssignedId === "number" && !localEmployee;
    const { data: remoteEmployee } = useEmployeeInfo(shouldFetchRemote ? firstAssignedId : null);

    const employeeInfo = useMemo(() => {
        const candidates: EmployeeLike[] = [];

        if (localEmployee) candidates.push(localEmployee);
        if (remoteEmployee) candidates.push(remoteEmployee);

        if (Array.isArray(assigned)) {
            assigned.forEach((item) => {
                const normalized = normalizeEmployee(item);
                if (normalized) candidates.push(normalized);
                if (typeof item === "number") {
                    const found = employees.find((emp) => emp.id === item);
                    if (found) candidates.push(found);
                }
            });
        }

        if (typeof assigned === "object" && assigned !== null && !Array.isArray(assigned)) {
            const normalized = normalizeEmployee(assigned);
            if (normalized) candidates.push(normalized);
        }

        const unique = new Map<number, EmployeeLike>();
        candidates.forEach((emp) => {
            if (!emp || typeof emp.id !== "number") return;
            if (!unique.has(emp.id)) unique.set(emp.id, emp);
        });

        return Array.from(unique.values()).map((emp) => ({
            id: emp.id,
            name: emp.full_name || emp.username || `کارمند ${emp.id}`,
            position: emp.position || undefined,
        }));
    }, [assigned, employees, localEmployee, remoteEmployee]);

    const status = (task.status ?? "pending") as TaskStatus;
    const statusLabel = taskStatusLabels[status] ?? task.status ?? "نامشخص";
    const statusClass =
        taskStatusColors[status] ?? "border-slate-500/20 bg-slate-500/10 text-slate-400";

    const departmentName = getDepartmentName(task);
    const caseTitle = task.case && typeof task.case === "object" ? task.case.title : null;
    const fileCount = task.files?.length ?? 0;
    const date = formatDate(task.created_at);

    const handleDelete = async () => {
        if (!onDelete) return;
        setIsDeleting(true);
        setDeleteError(null);

        try {
            await onDelete(task.id);
            setShowConfirm(false);
        } catch {
            setDeleteError("خطا در حذف تسک. دوباره تلاش کن.");
        } finally {
            setIsDeleting(false);
        }
    };

    const handleClose = () => {
        if (isDeleting) return;
        setShowConfirm(false);
        setDeleteError(null);
    };

    return (
        <>
            <motion.div
                layout
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95 }}
                transition={{ duration: 0.2, delay: index * 0.05 }}
                onHoverStart={() => setHovered(true)}
                onHoverEnd={() => setHovered(false)}
                className="relative flex flex-col gap-3 overflow-hidden rounded-2xl p-4"
                style={{
                    border: isDark ? "1px solid rgba(255,255,255,0.06)" : "1px solid rgba(0,0,0,0.06)",
                    background: isDark ? "rgba(255,255,255,0.02)" : "#fafafa",
                    minHeight: "130px",
                    opacity: isDeleting ? 0.45 : 1,
                    pointerEvents: isDeleting ? "none" : undefined,
                    boxShadow: isDark ? "0 2px 24px rgba(0,0,0,0.2)" : "0 2px 16px rgba(0,0,0,0.04)",
                }}
            >
                <svg
                    className="pointer-events-none absolute inset-0 h-full w-full"
                    style={{ borderRadius: "1rem" }}
                >
                    <defs>
                        <linearGradient
                            id={`borderGrad-${task.id}`}
                            x1="100%"
                            y1="100%"
                            x2="0%"
                            y2="0%"
                        >
                            <stop offset="0%" stopColor="#6366f1" />
                            <stop offset="100%" stopColor="#8b5cf6" />
                        </linearGradient>
                    </defs>
                    <motion.rect
                        x="1"
                        y="1"
                        width="calc(100% - 2px)"
                        height="calc(100% - 2px)"
                        rx="15"
                        ry="15"
                        fill="none"
                        stroke={`url(#borderGrad-${task.id})`}
                        strokeWidth="1.5"
                        pathLength="1"
                        initial={{ pathLength: 0, opacity: 0 }}
                        animate={hovered ? { pathLength: 1, opacity: 1 } : { pathLength: 0, opacity: 0 }}
                        transition={{ duration: 0.55, ease: "easeInOut" }}
                    />
                </svg>

                <div className="flex items-start justify-between gap-3">
                    <span
                        className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-[10.5px] font-bold ${statusClass}`}
                    >
                        <span
                            className={`h-1.5 w-1.5 rounded-full bg-current ${status === "in_progress" ? "animate-pulse" : ""
                                }`}
                        />
                        {statusLabel}
                    </span>

                    <div className="flex items-center gap-1.5">
                        {onEdit && (
                            <button
                                type="button"
                                onClick={() => onEdit(task)}
                                className="flex h-7 w-7 items-center justify-center rounded-xl transition-colors"
                                style={{
                                    background: isDark ? "rgba(99,102,241,0.1)" : "rgba(99,102,241,0.07)",
                                    color: isDark ? "#a5b4fc" : "#6366f1",
                                }}
                                title="ویرایش تسک"
                            >
                                <Pencil size={11} />
                            </button>
                        )}
                        {onDelete && (
                            <button
                                type="button"
                                onClick={() => setShowConfirm(true)}
                                disabled={isDeleting}
                                className="flex h-7 w-7 items-center justify-center rounded-xl transition-colors disabled:opacity-40"
                                style={{
                                    background: isDark ? "rgba(239,68,68,0.1)" : "rgba(239,68,68,0.07)",
                                    color: "#ef4444",
                                }}
                                title="حذف تسک"
                            >
                                {isDeleting ? <Loader2 size={11} className="animate-spin" /> : <Trash2 size={11} />}
                            </button>
                        )}
                    </div>
                </div>

                <div className="flex flex-col gap-1">
                    <h3
                        className="text-[13.5px] font-extrabold leading-tight"
                        style={{ color: isDark ? "#f1f5f9" : "#1e293b" }}
                    >
                        {task.title}
                    </h3>
                    {task.description ? (
                        <p
                            className="line-clamp-2 text-[12px] leading-6"
                            style={{ color: isDark ? "#94a3b8" : "#64748b" }}
                        >
                            {task.description}
                        </p>
                    ) : null}
                </div>

                <div
                    className="mt-auto flex flex-wrap items-center gap-2 border-t pt-2.5"
                    style={{
                        borderColor: isDark ? "rgba(255,255,255,0.05)" : "rgba(0,0,0,0.05)",
                    }}
                >
                    {employeeInfo.length > 0 ? (
                        <div className="flex flex-wrap items-center gap-1.5">
                            {employeeInfo.map((emp, idx) => {
                                const gradient = getEmployeeGradient(emp.id);
                                return (
                                    <div
                                        key={emp.id}
                                        className="flex items-center gap-1.5 rounded-full py-0.5 pl-2 pr-0.5"
                                        style={{
                                            border: isDark
                                                ? "1px solid rgba(255,255,255,0.06)"
                                                : "1px solid rgba(0,0,0,0.06)",
                                            background: isDark ? "rgba(255,255,255,0.04)" : "rgba(0,0,0,0.03)",
                                        }}
                                    >
                                        <span
                                            className="flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-full text-[9px] font-extrabold text-white"
                                            style={{
                                                background: `linear-gradient(135deg, ${gradient[0]}, ${gradient[1]})`,
                                            }}
                                        >
                                            {emp.name.charAt(0)}
                                        </span>
                                        <span
                                            className="text-[10.5px] font-bold"
                                            style={{
                                                color: isDark ? "#cbd5e1" : "#475569",
                                            }}
                                        >
                                            {emp.name}
                                            {emp.position && (
                                                <span className="mr-0.5 text-[9px] font-normal text-gray-400">
                                                    ({emp.position})
                                                </span>
                                            )}
                                            {idx < employeeInfo.length - 1 && <span className="mx-0.5 text-gray-400">،</span>}
                                        </span>
                                    </div>
                                );
                            })}
                        </div>
                    ) : task.assigned_employee ? (
                        <Chip isDark={isDark}>
                            <UserRound size={11} />
                            بدون مسئول
                        </Chip>
                    ) : null}

                    {departmentName ? (
                        <Chip isDark={isDark}>
                            <Building2 size={11} />
                            {departmentName}
                        </Chip>
                    ) : null}

                    {caseTitle ? (
                        <Chip isDark={isDark}>
                            <FolderKanban size={11} />
                            {caseTitle}
                        </Chip>
                    ) : null}

                    {fileCount > 0 ? (
                        <Chip isDark={isDark}>
                            <Paperclip size={11} />
                            {fileCount}
                        </Chip>
                    ) : null}

                    {date ? (
                        <div
                            className="mr-auto flex items-center gap-1.5 text-[10.5px] font-medium"
                            style={{ color: isDark ? "#64748b" : "#94a3b8" }}
                        >
                            <CalendarDays size={11} />
                            {date}
                        </div>
                    ) : null}
                </div>
            </motion.div>

            <AnimatePresence>
                {showConfirm && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 z-50 flex items-center justify-center px-4"
                        style={{
                            background: "rgba(0,0,0,0.5)",
                            backdropFilter: "blur(4px)",
                        }}
                        onClick={handleClose}
                    >
                        <motion.div
                            initial={{ scale: 0.95, y: 16, opacity: 0 }}
                            animate={{ scale: 1, y: 0, opacity: 1 }}
                            exit={{ scale: 0.95, y: 16, opacity: 0 }}
                            transition={{ duration: 0.2, ease: "easeOut" }}
                            className="w-full max-w-[360px] overflow-hidden rounded-[2rem] border p-5"
                            style={{
                                background: isDark ? "#0f172a" : "#ffffff",
                                borderColor: isDark ? "rgba(255,255,255,0.07)" : "rgba(0,0,0,0.07)",
                                boxShadow: "0 24px 64px rgba(0,0,0,0.35)",
                            }}
                            onClick={(e) => e.stopPropagation()}
                            dir="rtl"
                        >
                            <div
                                className="flex items-center justify-between border-b px-2 py-2"
                                style={{
                                    borderColor: isDark ? "rgba(255,255,255,0.06)" : "rgba(0,0,0,0.06)",
                                }}
                            >
                                <div className="flex items-center gap-2.5">
                                    <div
                                        className="flex h-8 w-8 items-center justify-center rounded-xl"
                                        style={{
                                            background: isDark ? "rgba(239,68,68,0.12)" : "rgba(239,68,68,0.08)",
                                        }}
                                    >
                                        <Trash2 size={14} className="text-red-500" />
                                    </div>
                                    <h3
                                        className="text-[13.5px] font-extrabold"
                                        style={{ color: isDark ? "#ffffff" : "#0f172a" }}
                                    >
                                        حذف تسک
                                    </h3>
                                </div>
                                <button
                                    type="button"
                                    onClick={handleClose}
                                    disabled={isDeleting}
                                    className="flex h-7 w-7 items-center justify-center rounded-xl transition-colors disabled:opacity-40"
                                    style={{
                                        background: isDark ? "rgba(255,255,255,0.05)" : "rgba(0,0,0,0.04)",
                                        color: isDark ? "#94a3b8" : "#64748b",
                                    }}
                                >
                                    <X size={13} />
                                </button>
                            </div>

                            <div className="flex flex-col gap-4 px-2 py-4">
                                <p
                                    className="text-[12.5px] leading-relaxed"
                                    style={{ color: isDark ? "#94a3b8" : "#64748b" }}
                                >
                                    تسک{" "}
                                    <span
                                        className="font-extrabold"
                                        style={{ color: isDark ? "#e2e8f0" : "#1e293b" }}
                                    >
                                        {task.title}
                                    </span>{" "}
                                    حذف خواهد شد. این عملیات قابل بازگشت نیست.
                                </p>

                                {deleteError && (
                                    <p className="text-center text-[11.5px] font-semibold text-red-500">
                                        {deleteError}
                                    </p>
                                )}

                                <div className="flex gap-2">
                                    <button
                                        type="button"
                                        onClick={handleClose}
                                        disabled={isDeleting}
                                        className="flex-1 rounded-2xl py-2.5 text-[12.5px] font-bold transition-colors disabled:opacity-40"
                                        style={{
                                            background: isDark ? "rgba(255,255,255,0.05)" : "rgba(0,0,0,0.04)",
                                            color: isDark ? "#94a3b8" : "#64748b",
                                        }}
                                    >
                                        انصراف
                                    </button>
                                    <button
                                        type="button"
                                        onClick={handleDelete}
                                        disabled={isDeleting}
                                        className="flex flex-1 items-center justify-center rounded-2xl py-2.5 text-[12.5px] font-bold text-white transition-opacity disabled:cursor-not-allowed disabled:opacity-60"
                                        style={{
                                            background: "linear-gradient(135deg, #ef4444, #dc2626)",
                                            boxShadow: "0 4px 14px rgba(239,68,68,0.3)",
                                        }}
                                    >
                                        {isDeleting ? (
                                            <Loader2 size={15} className="animate-spin" />
                                        ) : (
                                            <>
                                                <Trash2 size={13} className="ml-1.5" />
                                                حذف کن
                                            </>
                                        )}
                                    </button>
                                </div>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </>
    );
}
