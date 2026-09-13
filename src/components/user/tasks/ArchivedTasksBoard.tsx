"use client";

import { useEffect, useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
    Archive,
    Building2,
    CheckCircle2,
    Layers3,
    Loader,
    LayoutGrid,
    ShoppingBag,
    Ban,
} from "lucide-react";
import axiosInstance from "@/lib/axiosInstance";
import UserTaskCard from "./UserTaskCard";
import type { UserTask } from "./types";
import ArchivedTaskCard from "./ArchivedTaskCard";

interface ArchiveTask {
    id: number;
    task_id: number;
    title: string;
    status: "completed" | "cancelled" | "sold";
    case_id: number | null;
    case_title: string;
    customer_id: number | null;
    customer_full_name: string;
    department_id: number;
    department_name: string;
    created_by_id: number | null;
    created_by_username: string;
    created_by_full_name: string;
    final_action_by_id: number | null;
    final_action_by_username: string;
    final_action_by_full_name: string;
    task_created_at: string;
    completed_at: string | null;
    archived_at: string;
}

interface DepartmentGroup {
    id: number;
    name: string;
    tasks: ArchiveTask[];
}

type ArchiveStatusFilter = "all" | "completed" | "sold" | "cancelled";

const statusFilters: {
    id: ArchiveStatusFilter;
    label: string;
    icon: typeof Layers3;
    color: string;
    activeBg: string;
    activeBorder: string;
}[] = [
        {
            id: "all",
            label: "همه",
            icon: Layers3,
            color: "#818cf8",
            activeBg: "rgba(99,102,241,0.16)",
            activeBorder: "rgba(99,102,241,0.4)",
        },
        {
            id: "completed",
            label: "تکمیل شده",
            icon: CheckCircle2,
            color: "#34d399",
            activeBg: "rgba(16,185,129,0.14)",
            activeBorder: "rgba(16,185,129,0.4)",
        },
        {
            id: "sold",
            label: "فروش رفته",
            icon: ShoppingBag,
            color: "#fbbf24",
            activeBg: "rgba(245,158,11,0.14)",
            activeBorder: "rgba(245,158,11,0.4)",
        },
        {
            id: "cancelled",
            label: "لغو شده",
            icon: Ban,
            color: "#fb7185",
            activeBg: "rgba(239,68,68,0.14)",
            activeBorder: "rgba(239,68,68,0.4)",
        },
    ];

function archiveToUserTask(task: ArchiveTask): UserTask {
    return {
        id: task.task_id,
        title: task.title,
        description: "",
        case: task.case_id,
        department: task.department_id,
        department_name: task.department_name,
        current_step: 0,
        current_step_name: "",
        assigned_employee: [],
        status: task.status,
        created_at: task.task_created_at,
        completed_at: task.completed_at,
        updated_at: task.archived_at,
        attachments: [],
    } as UserTask;
}

export default function ArchivedTasksBoard() {
    const [tasks, setTasks] = useState<ArchiveTask[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [activeDeptId, setActiveDeptId] = useState<number | null>(null);
    const [statusFilter, setStatusFilter] =
        useState<ArchiveStatusFilter>("all");

    useEffect(() => {
        let cancelled = false;

        setLoading(true);
        setError(null);

        axiosInstance
            .get<ArchiveTask[]>("/tasks/api/v1/task_archive/")
            .then((res) => {
                if (cancelled) return;

                const data = Array.isArray(res.data) ? res.data : [];
                setTasks(data);
            })
            .catch(() => {
                if (!cancelled) {
                    setError("دریافت آرشیو تسک‌ها با خطا مواجه شد");
                }
            })
            .finally(() => {
                if (!cancelled) {
                    setLoading(false);
                }
            });

        return () => {
            cancelled = true;
        };
    }, []);

    const departmentGroups = useMemo<DepartmentGroup[]>(() => {
        const map = new Map<number, DepartmentGroup>();

        tasks.forEach((task) => {
            const id = Number(task.department_id);
            const name =
                task.department_name?.trim() || "بدون دپارتمان";

            if (!map.has(id)) {
                map.set(id, {
                    id,
                    name,
                    tasks: [],
                });
            }

            map.get(id)!.tasks.push(task);
        });

        return Array.from(map.values());
    }, [tasks]);

    useEffect(() => {
        if (!departmentGroups.length) {
            setActiveDeptId(null);
            return;
        }

        if (
            activeDeptId === null ||
            !departmentGroups.some((group) => group.id === activeDeptId)
        ) {
            setActiveDeptId(departmentGroups[0].id);
        }
    }, [departmentGroups, activeDeptId]);

    const activeGroup =
        departmentGroups.find((group) => group.id === activeDeptId) ?? null;

    const filteredTasks = useMemo(() => {
        const activeTasks = activeGroup?.tasks ?? [];

        if (statusFilter === "all") {
            return activeTasks;
        }

        return activeTasks.filter(
            (task) => task.status === statusFilter
        );
    }, [activeGroup, statusFilter]);

    const getStatusCount = (status: ArchiveStatusFilter) => {
        const activeTasks = activeGroup?.tasks ?? [];

        if (status === "all") {
            return activeTasks.length;
        }

        return activeTasks.filter(
            (task) => task.status === status
        ).length;
    };

    const handleReopen = async (task: ArchiveTask) => {
        try {
            const res = await axiosInstance.post<UserTask>(
                `/tasks/api/v1/tasks/${task.task_id}/reopen/`
            );

            setTasks((prev) =>
                prev.filter(
                    (item) => item.task_id !== task.task_id
                )
            );

            return res.data;
        } catch {
            throw new Error("بازگردانی تسک با خطا مواجه شد");
        }
    };

    const handleUpdated = async (updated: UserTask) => {
        if (updated.status === "in_progress") {
            setTasks((prev) =>
                prev.filter(
                    (task) => task.task_id !== updated.id
                )
            );
            return;
        }

        setTasks((prev) =>
            prev.map((task) =>
                task.task_id === updated.id
                    ? {
                        ...task,
                        status: updated.status as ArchiveTask["status"],
                        title: updated.title,
                    }
                    : task
            )
        );
    };

    if (loading) {
        return (
            <div className="flex h-64 items-center justify-center">
                <Loader
                    size={22}
                    className="animate-spin text-indigo-500"
                />
            </div>
        );
    }

    if (error) {
        return (
            <div className="flex h-64 flex-col items-center justify-center gap-3 rounded-3xl border border-red-500/20 bg-red-500/5">
                <p className="text-sm font-semibold text-red-500">
                    {error}
                </p>
            </div>
        );
    }

    if (!tasks.length) {
        return (
            <div className="flex h-64 flex-col items-center justify-center gap-3 rounded-3xl border border-dashed border-gray-200 dark:border-white/[0.07]">
                <Archive
                    size={28}
                    className="text-gray-300 dark:text-gray-700"
                />
                <p className="text-[12px] text-gray-400">
                    تسک بایگانی‌شده‌ای وجود ندارد
                </p>
            </div>
        );
    }

    return (
        <div className="flex flex-col gap-5" dir="rtl">
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                    <div className="flex h-9 w-9 items-center justify-center rounded-2xl bg-indigo-500/10">
                        <Archive
                            size={17}
                            className="text-indigo-500"
                        />
                    </div>

                    <div>
                        <h3 className="text-[14px] font-extrabold text-gray-900 dark:text-white">
                            بایگانی تسک‌ها
                        </h3>

                        <p className="text-[11px] text-gray-400 dark:text-gray-600">
                            {departmentGroups.length} دپارتمان
                        </p>
                    </div>
                </div>

                <span className="rounded-2xl bg-gray-100 px-3 py-1.5 text-[11px] font-bold text-gray-600 dark:bg-white/[0.06] dark:text-gray-400">
                    {filteredTasks.length} تسک
                </span>
            </div>

            <div className="flex gap-2 overflow-x-auto pb-1">
                {departmentGroups.map((group) => {
                    const isActive =
                        group.id === activeDeptId;

                    return (
                        <button
                            key={group.id}
                            type="button"
                            onClick={() =>
                                setActiveDeptId(group.id)
                            }
                            className={`flex shrink-0 items-center gap-2 rounded-2xl px-3.5 py-2 text-[11.5px] font-bold transition-colors ${isActive
                                ? "bg-indigo-600 text-white"
                                : "bg-gray-100 text-gray-500 hover:bg-gray-200 dark:bg-white/[0.05] dark:text-gray-400 dark:hover:bg-white/[0.08]"
                                }`}
                        >
                            <Building2 size={12} />

                            {group.name}

                            <span
                                className={`rounded-full px-1.5 py-0.5 text-[10px] font-extrabold ${isActive
                                    ? "bg-white/20"
                                    : "bg-black/5 dark:bg-white/10"
                                    }`}
                            >
                                {group.tasks.length}
                            </span>
                        </button>
                    );
                })}
            </div>

            <div className="flex gap-2 overflow-x-auto pb-1">
                {statusFilters.map((filter) => {
                    const isActive =
                        statusFilter === filter.id;
                    const Icon = filter.icon;
                    const count =
                        getStatusCount(filter.id);

                    return (
                        <button
                            key={filter.id}
                            type="button"
                            onClick={() =>
                                setStatusFilter(filter.id)
                            }
                            className="flex shrink-0 items-center gap-2 rounded-2xl border px-3.5 py-2 text-[11px] font-bold transition-all duration-200"
                            style={{
                                color: isActive
                                    ? filter.color
                                    : undefined,
                                backgroundColor: isActive
                                    ? filter.activeBg
                                    : "rgba(255,255,255,0.025)",
                                borderColor: isActive
                                    ? filter.activeBorder
                                    : "rgba(255,255,255,0.07)",
                                boxShadow: isActive
                                    ? `0 5px 18px ${filter.color}14`
                                    : "none",
                            }}
                        >
                            <Icon
                                size={13}
                                style={{
                                    color: isActive
                                        ? filter.color
                                        : "rgb(148 163 184)",
                                }}
                            />

                            <span
                                className={
                                    isActive
                                        ? ""
                                        : "text-gray-500 dark:text-gray-400"
                                }
                            >
                                {filter.label}
                            </span>

                            <span
                                className="rounded-full px-1.5 py-0.5 text-[9.5px] font-extrabold tabular-nums"
                                style={{
                                    color: filter.color,
                                    backgroundColor: `${filter.color}18`,
                                }}
                            >
                                {count}
                            </span>
                        </button>
                    );
                })}
            </div>

            {filteredTasks.length === 0 ? (
                <div className="flex h-64 flex-col items-center justify-center gap-3 rounded-3xl border border-dashed border-gray-200 dark:border-white/[0.07]">
                    <LayoutGrid
                        size={28}
                        className="text-gray-300 dark:text-gray-700"
                    />

                    <p className="text-[12px] text-gray-400">
                        تسکی در این وضعیت وجود ندارد
                    </p>
                </div>
            ) : (
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-3">
                    <AnimatePresence>
                        {filteredTasks.map((task) => (
                            <motion.div
                                key={task.id}
                                layout
                                initial={{
                                    opacity: 0,
                                    y: 10,
                                }}
                                animate={{
                                    opacity: 1,
                                    y: 0,
                                }}
                                exit={{
                                    opacity: 0,
                                    y: -8,
                                }}
                                transition={{
                                    duration: 0.2,
                                }}
                            >
                                <ArchivedTaskCard
                                    task={task}
                                    onReopened={(taskId) => {
                                        setTasks((prev) =>
                                            prev.filter((item) => item.task_id !== taskId)
                                        );
                                    }}
                                />
                            </motion.div>
                        ))}
                    </AnimatePresence>
                </div>
            )}
        </div>
    );
}
