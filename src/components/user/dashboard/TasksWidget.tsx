"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
    CheckCircle2,
    Circle,
    Clock,
    ListTodo,
    Calendar,
    Tag,
    ChevronDown,
} from "lucide-react";

type TaskStatus = "done" | "pending_approval" | "not_done";

interface Task {
    id: string;
    title: string;
    description?: string;
    dueDate?: string;
    tags?: string[];
    status: TaskStatus;
}

interface TasksWidgetProps {
    tasks?: Task[];
    onStatusChange?: (taskId: string, status: TaskStatus) => void;
}

const statusConfig: Record<
    TaskStatus,
    {
        label: string;
        icon: React.ReactNode;
        darkClass: string;
        lightClass: string;
    }
> = {
    done: {
        label: "انجام شده",
        icon: <CheckCircle2 className="w-4 h-4" />,
        darkClass: "text-emerald-400 bg-emerald-500/10 border-emerald-500/20",
        lightClass: "text-emerald-700 bg-emerald-50 border-emerald-200",
    },
    pending_approval: {
        label: "منتظر تایید کارفرما",
        icon: <Clock className="w-4 h-4" />,
        darkClass: "text-amber-400 bg-amber-500/10 border-amber-500/20",
        lightClass: "text-amber-700 bg-amber-50 border-amber-200",
    },
    not_done: {
        label: "انجام نشده",
        icon: <Circle className="w-4 h-4" />,
        darkClass: "text-gray-400 bg-white/5 border-white/10",
        lightClass: "text-gray-500 bg-gray-100 border-gray-200",
    },
};

export default function TasksWidget({ tasks = [], onStatusChange }: TasksWidgetProps) {
    const [menuOpen, setMenuOpen] = useState(false);

    const task = tasks[0] ?? null;
    const s = task ? statusConfig[task.status] : null;

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, ease: "easeOut" }}
            className="rounded-2xl border  dark:border-white/[0.07] dark:bg-[#111118] border-gray-100 bg-white shadow-sm"
        >
            <div className="flex items-center gap-3 px-5 py-4 border-b dark:border-white/[0.06] border-gray-100">
                <div className="p-2 rounded-xl dark:bg-violet-500/10 dark:border-violet-500/20 bg-violet-50 border-violet-200 border">
                    <ListTodo className="w-4 h-4 dark:text-violet-400 text-violet-500" />
                </div>
                <div>
                    <h2 className="text-sm font-semibold dark:text-white text-gray-900">
                        وظیفه من
                    </h2>
                    <p className="text-xs dark:text-gray-500 text-gray-400 mt-0.5">
                        دستور ارسال‌شده توسط کارفرما
                    </p>
                </div>
            </div>

            <div className="p-5">
                <AnimatePresence mode="wait">
                    {!task ? (
                        <motion.div
                            key="empty"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="flex flex-col items-center justify-center py-10 text-center"
                        >
                            <div className="w-12 h-12 rounded-2xl flex items-center justify-center mb-3 dark:bg-white/5 bg-gray-50 border dark:border-white/10 border-gray-200">
                                <ListTodo className="w-5 h-5 dark:text-gray-600 text-gray-300" />
                            </div>
                            <p className="text-sm dark:text-gray-500 text-gray-400">
                                وظیفه‌ای ثبت نشده
                            </p>
                            <p className="text-xs mt-1 dark:text-gray-600 text-gray-300">
                                وظایف از طرف کارفرما اضافه می‌شوند
                            </p>
                        </motion.div>
                    ) : (
                        <motion.div
                            key={task.id}
                            initial={{ opacity: 0, y: 8 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0 }}
                            transition={{ duration: 0.3 }}
                        >
                            <p className="text-base font-bold leading-relaxed dark:text-white text-gray-900">
                                {task.title}
                            </p>

                            {task.description && (
                                <p className="mt-2 text-sm leading-relaxed dark:text-gray-400 text-gray-500">
                                    {task.description}
                                </p>
                            )}

                            {(task.dueDate || (task.tags && task.tags.length > 0)) && (
                                <div className="flex flex-wrap items-center gap-2 mt-4">
                                    {task.dueDate && (
                                        <span className="flex items-center gap-1.5 text-xs dark:text-gray-500 text-gray-400">
                                            <Calendar className="w-3.5 h-3.5" />
                                            {task.dueDate}
                                        </span>
                                    )}
                                    {task.tags?.map((tag) => (
                                        <span
                                            key={tag}
                                            className="flex items-center gap-1 text-xs px-2 py-0.5 rounded-full border dark:text-gray-400 dark:bg-white/5 dark:border-white/10 text-gray-500 bg-gray-100 border-gray-200"
                                        >
                                            <Tag className="w-3 h-3" />
                                            {tag}
                                        </span>
                                    ))}
                                </div>
                            )}

                            <div className="mt-5 pt-4 border-t dark:border-white/[0.06] border-gray-100 flex items-center justify-between gap-3">
                                <span className="text-xs dark:text-gray-500 text-gray-400">
                                    وضعیت
                                </span>

                                <div className="relative">
                                    <button
                                        onClick={() => setMenuOpen((p) => !p)}
                                        className={`inline-flex items-center gap-2 text-sm font-semibold px-3.5 py-2 rounded-xl border transition-all ${typeof window !== "undefined" &&
                                                document.documentElement.classList.contains("dark")
                                                ? s!.darkClass
                                                : s!.lightClass
                                            }`}
                                    >
                                        {s!.icon}
                                        {s!.label}
                                        <ChevronDown
                                            className={`w-3.5 h-3.5 transition-transform ${menuOpen ? "rotate-180" : ""
                                                }`}
                                        />
                                    </button>

                                    <AnimatePresence>
                                        {menuOpen && (
                                            <>
                                                <div
                                                    className="fixed inset-0 z-10"
                                                    onClick={() => setMenuOpen(false)}
                                                />
                                                <motion.div
                                                    initial={{ opacity: 0, scale: 0.95, y: -4 }}
                                                    animate={{ opacity: 1, scale: 1, y: 0 }}
                                                    exit={{ opacity: 0, scale: 0.95, y: -4 }}
                                                    transition={{ duration: 0.15 }}
                                                    className="absolute left-0 top-12 z-20 min-w-[220px] rounded-2xl border shadow-xl overflow-hidden dark:border-white/10 dark:bg-[#18181f] border-gray-100 bg-white shadow-gray-200/80"
                                                >
                                                    <p className="px-4 pt-3 pb-2 text-[10px] uppercase tracking-widest dark:text-gray-600 text-gray-400">
                                                        انتخاب وضعیت
                                                    </p>
                                                    {(
                                                        Object.entries(statusConfig) as [
                                                            TaskStatus,
                                                            (typeof statusConfig)[TaskStatus]
                                                        ][]
                                                    ).map(([key, cfg]) => (
                                                        <button
                                                            key={key}
                                                            onClick={() => {
                                                                onStatusChange?.(task.id, key);
                                                                setMenuOpen(false);
                                                            }}
                                                            className={`w-full flex items-center gap-2.5 px-4 py-3 text-sm transition-colors ${task.status === key
                                                                    ? "font-semibold dark:text-white text-gray-900 dark:bg-white/5 bg-gray-50"
                                                                    : "dark:text-gray-400 dark:hover:bg-white/5 text-gray-500 hover:bg-gray-50"
                                                                }`}
                                                        >
                                                            {cfg.icon}
                                                            {cfg.label}
                                                            {task.status === key && (
                                                                <CheckCircle2 className="w-3.5 h-3.5 mr-auto" />
                                                            )}
                                                        </button>
                                                    ))}
                                                </motion.div>
                                            </>
                                        )}
                                    </AnimatePresence>
                                </div>
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>
        </motion.div>
    );
}
