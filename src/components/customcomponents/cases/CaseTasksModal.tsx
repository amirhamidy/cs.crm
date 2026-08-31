"use client";

import { AnimatePresence, motion } from "framer-motion";
import { ClipboardList, X } from "lucide-react";
import { useTheme } from "next-themes";
import TaskCard from "@/components/customcomponents/tasks/TaskCard";
import type { CaseItem } from "@/types/case";
import type { TaskItem } from "@/types/task";

interface CaseTasksModalProps {
    isOpen: boolean;
    onClose: () => void;
    caseItem: CaseItem | null;
    tasks: TaskItem[];
    onEditTask: (task: TaskItem) => void;
    onDeleteTask: (taskId: number) => Promise<void>;
    deletingTaskId: number | null;
}

export default function CaseTasksModal({
    isOpen,
    onClose,
    caseItem,
    tasks,
    onEditTask,
    onDeleteTask,
    deletingTaskId,
}: CaseTasksModalProps) {
    const { resolvedTheme } = useTheme();
    const isDark = resolvedTheme === "dark";

    if (!isOpen || !caseItem) return null;

    return (
        <AnimatePresence>
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 z-50 flex items-center justify-center px-4"
                style={{ background: "rgba(0,0,0,0.5)", backdropFilter: "blur(3px)" }}
                onClick={onClose}
            >
                <motion.div
                    initial={{ scale: 0.94, y: 18 }}
                    animate={{ scale: 1, y: 0 }}
                    exit={{ scale: 0.94, y: 18 }}
                    transition={{ duration: 0.22, ease: "easeOut" }}
                    className="w-full max-w-[520px] overflow-hidden rounded-3xl border"
                    style={{
                        background: isDark ? "#0f172a" : "#ffffff",
                        borderColor: isDark ? "rgba(255,255,255,0.07)" : "rgba(0,0,0,0.06)",
                        boxShadow: "0 24px 64px rgba(0,0,0,0.28)",
                    }}
                    onClick={(e) => e.stopPropagation()}
                    dir="rtl"
                >
                    <div
                        className="flex items-center justify-between border-b px-5 py-4"
                        style={{ borderColor: isDark ? "rgba(255,255,255,0.06)" : "rgba(0,0,0,0.06)" }}
                    >
                        <div className="flex items-center gap-3">
                            <div
                                className="flex h-9 w-9 items-center justify-center rounded-xl"
                                style={{ background: "rgba(99,102,241,0.10)" }}
                            >
                                <ClipboardList size={15} className="text-indigo-500" />
                            </div>
                            <div>
                                <h3 className="text-[14px] font-extrabold text-gray-900 dark:text-white">
                                    تسک‌های پرونده
                                </h3>
                                <p className="mt-0.5 text-[11px] text-gray-400 dark:text-gray-500">
                                    {caseItem.title}
                                </p>
                            </div>
                        </div>
                        <button
                            type="button"
                            onClick={onClose}
                            className="flex h-8 w-8 items-center justify-center rounded-xl text-gray-400 transition-colors hover:text-gray-600 dark:hover:text-gray-300"
                            style={{ background: isDark ? "rgba(255,255,255,0.05)" : "rgba(0,0,0,0.04)" }}
                        >
                            <X size={15} />
                        </button>
                    </div>

                    <div className="max-h-[480px] overflow-y-auto p-4">
                        {tasks.length === 0 ? (
                            <div className="flex flex-col items-center justify-center gap-2 py-14">
                                <ClipboardList size={20} className="text-gray-300 dark:text-gray-700" />
                                <p className="text-[12px] font-semibold text-gray-400 dark:text-gray-600">
                                    تسکی برای این پرونده ثبت نشده
                                </p>
                            </div>
                        ) : (
                            <div className="flex flex-col gap-2">
                                {tasks.map((task, taskIndex) => (
                                    <TaskCard
                                        key={task.id}
                                        task={task}
                                        index={taskIndex}
                                        onEdit={onEditTask}
                                        onDelete={onDeleteTask}
                                        deleting={deletingTaskId === task.id}
                                    />
                                ))}
                            </div>
                        )}
                    </div>
                </motion.div>
            </motion.div>
        </AnimatePresence>
    );
}