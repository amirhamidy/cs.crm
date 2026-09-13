"use client";

import { useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import { useTheme } from "next-themes";
import {
    AlertTriangle,
    Calendar,
    Loader,
} from "lucide-react";
import axiosInstance from "@/lib/axiosInstance";
import type { TaskItem } from "@/types/task";

interface EmployeeItem {
    id?: number;
    user?: number | string | null;
    username?: string | null;
    full_name?: string | null;
    name?: string | null;
    first_name?: string | null;
    last_name?: string | null;
}

interface StepData {
    id?: number;
    title?: string;
    deadline?: string | null;
    due_date?: string | null;
}

interface CaseTaskViewCardProps {
    task: TaskItem;
    index?: number;
}

const STATUS_CONFIG: Record<
    string,
    {
        label: string;
        color: string;
        background: string;
    }
> = {
    pending: {
        label: "در انتظار",
        color: "#f59e0b",
        background: "rgba(245,158,11,0.12)",
    },
    in_progress: {
        label: "در حال انجام",
        color: "#3b82f6",
        background: "rgba(59,130,246,0.12)",
    },
    completed: {
        label: "تکمیل شده",
        color: "#22c55e",
        background: "rgba(34,197,94,0.12)",
    },
    cancelled: {
        label: "لغو شده",
        color: "#ef4444",
        background: "rgba(239,68,68,0.12)",
    },
    rejected: {
        label: "رد شده",
        color: "#ef4444",
        background: "rgba(239,68,68,0.12)",
    },
};

function extractId(value: unknown): number | null {
    if (typeof value === "number" && Number.isFinite(value)) {
        return value;
    }

    if (typeof value === "string" && value.trim()) {
        const parsed = Number(value);
        return Number.isFinite(parsed) ? parsed : null;
    }

    if (value && typeof value === "object") {
        const objectValue = value as Record<string, unknown>;
        const id =
            objectValue.id ??
            objectValue.employee_id ??
            objectValue.user_id ??
            objectValue.user;

        if (typeof id === "number" && Number.isFinite(id)) {
            return id;
        }

        if (typeof id === "string" && id.trim()) {
            const parsed = Number(id);
            return Number.isFinite(parsed) ? parsed : null;
        }
    }

    return null;
}

function extractEmployeeIds(value: unknown): number[] {
    if (Array.isArray(value)) {
        return value
            .map((item) => extractId(item))
            .filter((id): id is number => id !== null);
    }

    const id = extractId(value);
    return id === null ? [] : [id];
}

function extractEmployeeName(value: unknown): string {
    if (!value || typeof value !== "object") {
        return "";
    }

    const item = value as Record<string, unknown>;

    const directName =
        item.full_name ??
        item.name ??
        item.display_name ??
        item.username;

    if (typeof directName === "string" && directName.trim()) {
        return directName.trim();
    }

    const firstName =
        typeof item.first_name === "string" ? item.first_name.trim() : "";
    const lastName =
        typeof item.last_name === "string" ? item.last_name.trim() : "";

    return `${firstName} ${lastName}`.trim();
}

function extractStep(task: TaskItem): StepData | null {
    const taskValue = task as unknown as Record<string, unknown>;

    const currentStep =
        taskValue.current_step ??
        taskValue.step ??
        taskValue.currentStep;

    if (!currentStep) {
        return null;
    }

    if (typeof currentStep === "number") {
        return { id: currentStep };
    }

    if (typeof currentStep === "string") {
        const id = Number(currentStep);
        return Number.isFinite(id) ? { id } : null;
    }

    if (typeof currentStep === "object") {
        const value = currentStep as Record<string, unknown>;
        const id = extractId(value);

        return {
            id: id ?? undefined,
            title:
                typeof value.title === "string"
                    ? value.title
                    : typeof value.name === "string"
                        ? value.name
                        : undefined,
            deadline:
                typeof value.deadline === "string" ? value.deadline : null,
            due_date:
                typeof value.due_date === "string" ? value.due_date : null,
        };
    }

    return null;
}

function getTaskDeadline(task: TaskItem): string | null {
    const taskValue = task as unknown as Record<string, unknown>;

    const candidates = [
        taskValue.deadline,
        taskValue.due_date,
        taskValue.deadline_date,
        taskValue.dueDate,
        taskValue.end_date,
        taskValue.endDate,
    ];

    for (const value of candidates) {
        if (typeof value === "string" && value.trim()) {
            return value;
        }
    }

    const step = extractStep(task);

    if (step?.deadline) {
        return step.deadline;
    }

    if (step?.due_date) {
        return step.due_date;
    }

    return null;
}

function formatJalaliDate(value?: string | null): string {
    if (!value) {
        return "بدون مهلت";
    }

    const date = new Date(value);

    if (Number.isNaN(date.getTime())) {
        return value;
    }

    return new Intl.DateTimeFormat("fa-IR", {
        year: "numeric",
        month: "long",
        day: "numeric",
    }).format(date);
}

function getDeadlineUrgency(value?: string | null) {
    if (!value) {
        return {
            label: "بدون مهلت",
            color: "#9ca3af",
            background: "rgba(156,163,175,0.12)",
        };
    }

    const deadline = new Date(value).getTime();

    if (!Number.isFinite(deadline)) {
        return {
            label: "نامعتبر",
            color: "#9ca3af",
            background: "rgba(156,163,175,0.12)",
        };
    }

    const diff = deadline - Date.now();
    const day = 24 * 60 * 60 * 1000;

    if (diff < 0) {
        return {
            label: "منقضی شده",
            color: "#ef4444",
            background: "rgba(239,68,68,0.12)",
        };
    }

    if (diff <= day) {
        return {
            label: "کمتر از یک روز",
            color: "#f97316",
            background: "rgba(249,115,22,0.12)",
        };
    }

    if (diff <= day * 3) {
        return {
            label: "نزدیک به مهلت",
            color: "#f59e0b",
            background: "rgba(245,158,11,0.12)",
        };
    }

    return {
        label: "در زمان مقرر",
        color: "#22c55e",
        background: "rgba(34,197,94,0.12)",
    };
}

export default function CaseTaskViewCard({
    task,
    index = 0,
}: CaseTaskViewCardProps) {
    const { resolvedTheme } = useTheme();
    const isDark = resolvedTheme === "dark";

    const [employeesList, setEmployeesList] = useState<EmployeeItem[]>([]);
    const [loadingEmployees, setLoadingEmployees] = useState(false);
    const [stepDeadline, setStepDeadline] = useState<string | null>(null);
    const [loadingDeadline, setLoadingDeadline] = useState(false);

    const taskValue = task as unknown as Record<string, unknown>;

    const step = useMemo(() => extractStep(task), [task]);

    const status = String(
        task.status ?? taskValue.task_status ?? "pending"
    );

    const statusConfig = STATUS_CONFIG[status] ?? STATUS_CONFIG.pending;

    const directDeadline = useMemo(() => getTaskDeadline(task), [task]);

    const deadline = stepDeadline ?? directDeadline;

    const urgency = useMemo(() => getDeadlineUrgency(deadline), [deadline]);

    const rawAssignedEmployee =
        taskValue.assigned_employee ??
        taskValue.assigned_to ??
        taskValue.assigned_employees ??
        null;

    const assignedEmployeeIds = useMemo(
        () => extractEmployeeIds(rawAssignedEmployee),
        [rawAssignedEmployee]
    );

    const employees = useMemo(() => {
        if (Array.isArray(rawAssignedEmployee)) {
            return rawAssignedEmployee.map((item) => {
                const id = extractId(item);

                if (id === null) {
                    return item;
                }

                const found = employeesList.find(
                    (employee) =>
                        extractId(employee) === id ||
                        extractId(employee.user) === id
                );

                return found ?? item;
            });
        }

        if (rawAssignedEmployee) {
            const id = extractId(rawAssignedEmployee);

            if (id !== null) {
                const found = employeesList.find(
                    (employee) =>
                        extractId(employee) === id ||
                        extractId(employee.user) === id
                );

                return [found ?? rawAssignedEmployee];
            }

            return [rawAssignedEmployee];
        }

        return [];
    }, [rawAssignedEmployee, employeesList]);

    const description =
        typeof task.description === "string"
            ? task.description
            : typeof taskValue.details === "string"
                ? taskValue.details
                : "";

    useEffect(() => {
        let active = true;

        async function fetchEmployees() {
            if (assignedEmployeeIds.length === 0) {
                setEmployeesList([]);
                return;
            }

            try {
                setLoadingEmployees(true);

                const response = await axiosInstance.get(
                    "/accounts/api/v1/employee/list/"
                );

                if (!active) {
                    return;
                }

                const data = response.data;

                const list = Array.isArray(data)
                    ? data
                    : Array.isArray(data?.results)
                        ? data.results
                        : Array.isArray(data?.data)
                            ? data.data
                            : [];

                setEmployeesList(
                    list.filter(
                        (employee: unknown): employee is EmployeeItem =>
                            Boolean(employee && typeof employee === "object")
                    )
                );
            } catch {
                if (active) {
                    setEmployeesList([]);
                }
            } finally {
                if (active) {
                    setLoadingEmployees(false);
                }
            }
        }

        fetchEmployees();

        return () => {
            active = false;
        };
    }, [assignedEmployeeIds.join(",")]);

    useEffect(() => {
        let active = true;

        async function fetchStepDeadline() {
            if (directDeadline || !step?.id || !task.id) {
                setStepDeadline(null);
                return;
            }

            try {
                setLoadingDeadline(true);

                const response = await axiosInstance.get(
                    `/tasks/api/v1/tasks/${task.id}/steps/${step.id}/deadline/`
                );

                if (!active) {
                    return;
                }

                const data = response.data;

                const value =
                    data?.deadline ??
                    data?.due_date ??
                    data?.date ??
                    data?.deadline_date ??
                    data?.end_date ??
                    null;

                if (typeof value === "string" && value.trim()) {
                    setStepDeadline(value);
                } else {
                    setStepDeadline(null);
                }
            } catch {
                if (active) {
                    setStepDeadline(null);
                }
            } finally {
                if (active) {
                    setLoadingDeadline(false);
                }
            }
        }

        fetchStepDeadline();

        return () => {
            active = false;
        };
    }, [task.id, step?.id, directDeadline]);

    return (
        <motion.div
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{
                duration: 0.2,
                delay: index * 0.03,
                ease: [0.32, 0.72, 0, 1],
            }}
            className="rounded-xl p-4"
            style={{
                background: isDark ? "#2c2c2e" : "#f9fafb",
            }}
        >
            {/* Header */}
            <div className="flex items-start justify-between gap-3">
                <div className="min-w-0 flex-1">
                    <div className="mb-1.5 flex items-center gap-2">
                        <span
                            className="rounded-md px-1.5 py-0.5 text-[10px] font-medium"
                            style={{
                                background: statusConfig.background,
                                color: statusConfig.color,
                            }}
                        >
                            {statusConfig.label}
                        </span>

                        {task.id && (
                            <span className="text-[10px] font-medium text-gray-400 dark:text-gray-500">
                                #{task.id}
                            </span>
                        )}
                    </div>

                    <h3 className="text-[13px] font-semibold leading-snug text-gray-900 dark:text-white">
                        {task.title || "بدون عنوان"}
                    </h3>

                    {description && (
                        <p className="mt-1.5 line-clamp-2 text-[11px] leading-relaxed text-gray-500 dark:text-gray-400">
                            {description}
                        </p>
                    )}
                </div>
            </div>

            {/* Footer */}
            <div className="mt-3 flex items-center justify-between gap-3">
                {/* Employees */}
                {employees.length > 0 ? (
                    <div className="flex flex-wrap gap-2">
                        {employees.map((employee, idx) => {
                            const name =
                                extractEmployeeName(employee) ||
                                (typeof employee === "number"
                                    ? `کاربر ${employee}`
                                    : typeof employee === "string"
                                        ? employee
                                        : "کاربر");

                            return (
                                <div
                                    key={`${extractId(employee) ?? idx}-${idx}`}
                                    className="flex items-center gap-1.5"
                                >
                                    <div
                                        className="flex h-5 w-5 items-center justify-center rounded-full text-[9px] font-semibold text-white"
                                        style={{
                                            background: `hsl(${(idx * 60) % 360}, 70%, 60%)`,
                                        }}
                                    >
                                        {name.charAt(0)}
                                    </div>
                                    <span className="text-[10px] font-medium text-gray-600 dark:text-gray-300">
                                        {name}
                                    </span>
                                </div>
                            );
                        })}
                    </div>
                ) : loadingEmployees ? (
                    <div className="flex items-center gap-1.5 text-[10px] text-gray-400 dark:text-gray-500">
                        <Loader size={11} className="animate-spin" />
                        <span>در حال بارگذاری...</span>
                    </div>
                ) : (
                    <div className="text-[10px] text-gray-400 dark:text-gray-500">
                        بدون مسئول
                    </div>
                )}

                {/* Deadline */}
                <div
                    className="flex items-center gap-1 rounded-md px-2 py-1"
                    style={{
                        background: urgency.background,
                    }}
                >
                    {loadingDeadline ? (
                        <Loader
                            size={11}
                            className="animate-spin"
                            style={{ color: urgency.color }}
                        />
                    ) : urgency.label === "منقضی شده" ? (
                        <AlertTriangle
                            size={11}
                            style={{ color: urgency.color }}
                        />
                    ) : (
                        <Calendar size={11} style={{ color: urgency.color }} />
                    )}

                    <span
                        className="text-[10px] font-medium"
                        style={{ color: urgency.color }}
                    >
                        {formatJalaliDate(deadline)}
                    </span>
                </div>
            </div>
        </motion.div>
    );
}