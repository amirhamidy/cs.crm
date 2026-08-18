"use client";

import { motion } from "framer-motion";
import { Calendar, Users, MoreHorizontal, MessageSquareText } from "lucide-react";
import { useState } from "react";
import TaskNotesModal from "./TaskNotesModal";

export interface Task {
    id: number;
    title: string;
    description?: string;
    case?: number;
    case_name?: string;
    department?: number;
    department_name?: string;
    current_step?: number;
    current_step_name?: string;
    assigned_employee?: number[];
    assigned_employee_names?: string[];
    status: "pending" | "in_progress" | "completed" | "sold" | "cancelled";
    created_at?: string;
    completed_at?: string;
    updated_at?: string;
}

interface Props {
    task: Task;
    accent?: string;
    hideActions?: boolean;
}

function formatFaDate(date?: string) {
    if (!date) return "نامشخص";
    return new Date(date).toLocaleDateString("fa-IR", {
        year: "numeric",
        month: "2-digit",
        day: "2-digit",
    });
}

function getStatusMeta(status: string) {
    switch (status) {
        case "completed":
            return { label: "تکمیل شده", color: "text-emerald-500", bg: "bg-emerald-500/10" };
        case "sold":
            return { label: "فروش رفته", color: "text-amber-500", bg: "bg-amber-500/10" };
        case "cancelled":
            return { label: "لغو شده", color: "text-red-500", bg: "bg-red-500/10" };
        default:
            return { label: "در حال انجام", color: "text-indigo-500", bg: "bg-indigo-500/10" };
    }
}

export default function TaskCard({ task, accent = "#6366f1", hideActions = false }: Props) {
    const [notesOpen, setNotesOpen] = useState(false);
    const meta = getStatusMeta(task.status);

    return (
        <>
            <motion.div
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                className="group relative flex flex-col gap-2.5 rounded-2xl p-3.5 transition-all duration-200 hover:shadow-md"
                style={{
                    background: "rgba(255,255,255,0.04)",
                    border: "1px solid rgba(255,255,255,0.06)",
                }}
            >
                <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2 mb-1.5 flex-wrap">
                            <span className={`text-[10px] font-bold px-2 py-0.5 rounded-lg ${meta.bg} ${meta.color}`}>
                                {meta.label}
                            </span>
                            <span className="text-[10px] font-bold text-gray-500 dark:text-gray-500">
                                #{task.id}
                            </span>
                            {task.current_step_name && (
                                <span className="text-[10px] font-bold px-2 py-0.5 rounded-lg bg-white/5 text-gray-400">
                                    {task.current_step_name}
                                </span>
                            )}
                        </div>
                        <h4 className="text-[13px] font-bold text-gray-900 dark:text-white truncate">
                            {task.title}
                        </h4>
                        {task.description && (
                            <p className="text-[11px] text-gray-400 dark:text-gray-500 line-clamp-1 mt-0.5">
                                {task.description}
                            </p>
                        )}
                    </div>
                    <button
                        type="button"
                        onClick={() => setNotesOpen(true)}
                        className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-indigo-500/10 text-indigo-400 transition-colors hover:bg-indigo-500/20"
                    >
                        <MessageSquareText size={14} />
                    </button>
                </div>

                <div className="flex items-center justify-between gap-2 pt-1 border-t border-white/5">
                    <div className="flex items-center gap-2 text-[10.5px] text-gray-400 dark:text-gray-500">
                        <Calendar size={11} />
                        <span>{formatFaDate(task.created_at)}</span>
                    </div>

                    {task.assigned_employee_names && task.assigned_employee_names.length > 0 && (
                        <div className="flex items-center gap-1.5 text-[10.5px] text-gray-400">
                            <Users size={11} />
                            <span className="truncate max-w-[120px]">
                                {task.assigned_employee_names.join("، ")}
                            </span>
                        </div>
                    )}
                </div>
            </motion.div>

            <TaskNotesModal
                isOpen={notesOpen}
                onClose={() => setNotesOpen(false)}
                taskId={task.id}
                taskTitle={task.title}
            />
        </>
    );
}