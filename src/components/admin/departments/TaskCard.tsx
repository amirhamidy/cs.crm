"use client";

import { motion } from "framer-motion";
import { CalendarDays, UserRound } from "lucide-react";
import TaskAssignees from "./TaskAssignees";
import type { Task } from "./types";

const statusMap: Record<string, { label: string; cls: string }> = {
    in_progress: {
        label: "در حال انجام",
        cls: "bg-blue-50 text-blue-600 dark:bg-blue-500/10 dark:text-blue-400",
    },
    cancelled: {
        label: "لغو شده",
        cls: "bg-gray-100 text-gray-500 dark:bg-white/[0.06] dark:text-gray-400",
    },
    completed: {
        label: "انجام شده",
        cls: "bg-green-50 text-green-600 dark:bg-green-500/10 dark:text-green-400",
    },
    sold: {
        label: "فروخته شده",
        cls: "bg-green-50 text-green-600 dark:bg-green-500/10 dark:text-green-400",
    },
};

export default function TaskCard({
    task,
    accent = "#6366f1",
}: {
    task: Task;
    accent?: string;
}) {
    const status = statusMap[task.status ?? ""] ?? statusMap.todo;

    const currentStepLabel = String(task.current_step_name ?? "") || "—";

    return (
        <motion.div
            whileHover={{ y: -2 }}
            transition={{ type: "spring", stiffness: 400, damping: 26 }}
            className="flex cursor-pointer flex-col gap-3 rounded-[1.4rem] border border-gray-200/70 bg-white p-3.5 shadow-sm hover:border-gray-300 dark:border-white/[0.07] dark:bg-white/[0.03] dark:hover:border-white/[0.12]"
        >
            <div className="flex items-center justify-between gap-2">
                <span
                    className={`rounded-full px-2.5 py-1 text-[10px] font-bold ${status.cls}`}
                >
                    {status.label}
                </span>
                <span
                    className="flex h-6 w-6 items-center justify-center rounded-lg"
                    style={{ backgroundColor: `${accent}14`, color: accent }}
                >
                    <UserRound size={12} />
                </span>
            </div>

            <h4 className="line-clamp-2 text-[12.5px] font-bold leading-6 text-gray-800 dark:text-gray-100">
                {task.title}
            </h4>

            <div className="mt-auto flex items-center justify-between border-t border-gray-100 pt-3 dark:border-white/[0.05]">
                <div className="flex items-center gap-1.5">
                    <CalendarDays size={12} className="text-gray-300 dark:text-gray-600" />
                    <span className="text-[10.5px] text-gray-400">
                        {currentStepLabel}
                    </span>
                </div>

                <TaskAssignees
                    ids={Array.isArray(task.assigned_employee) ? task.assigned_employee : []}
                />
            </div>
        </motion.div>
    );
}