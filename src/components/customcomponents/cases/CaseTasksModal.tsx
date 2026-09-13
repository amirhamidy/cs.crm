"use client";

import { AnimatePresence, motion } from "framer-motion";
import { X } from "lucide-react";
import { useTheme } from "next-themes";
import CaseTaskViewCard from "@/components/customcomponents/tasks/CaseTaskViewCard";
import type { CaseItem } from "@/types/case";
import type { TaskItem } from "@/types/task";

interface CaseTasksModalProps {
    isOpen: boolean;
    onClose: () => void;
    caseItem: CaseItem | null;
    tasks: TaskItem[];
    onEditTask?: (task: TaskItem) => void;
    onDeleteTask?: (taskId: number) => Promise<void>;
    deletingTaskId?: number | null;
}

export default function CaseTasksModal({
    isOpen,
    onClose,
    caseItem,
    tasks,
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
                style={{
                    background: "rgba(0,0,0,0.4)",
                    backdropFilter: "blur(8px)",
                }}
                onClick={onClose}
            >
                <motion.div
                    initial={{ scale: 0.96, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    exit={{ scale: 0.96, opacity: 0 }}
                    transition={{
                        duration: 0.2,
                        ease: [0.32, 0.72, 0, 1],
                    }}
                    className="w-full max-w-[560px] overflow-hidden rounded-2xl"
                    style={{
                        background: isDark ? "#1c1c1e" : "#ffffff",
                        boxShadow: isDark
                            ? "0 20px 60px rgba(0,0,0,0.5)"
                            : "0 20px 60px rgba(0,0,0,0.15)",
                    }}
                    onClick={(event) => event.stopPropagation()}
                    dir="rtl"
                >
                    {/* Header */}
                    <div className="flex items-center justify-between px-6 py-5">
                        <div>
                            <h2 className="text-[17px] font-semibold text-gray-900 dark:text-white">
                                تسک‌های پرونده
                            </h2>
                            <p className="mt-1 text-[13px] text-gray-500 dark:text-gray-400">
                                {caseItem.title}
                            </p>
                        </div>

                        <button
                            type="button"
                            onClick={onClose}
                            className="flex h-8 w-8 items-center justify-center rounded-full transition-colors hover:bg-gray-100 dark:hover:bg-gray-800"
                        >
                            <X size={18} className="text-gray-500" />
                        </button>
                    </div>

                    {/* Content */}
                    <div className="max-h-[520px] overflow-y-auto px-4 pb-4">
                        {tasks.length === 0 ? (
                            <div className="flex flex-col items-center justify-center gap-3 py-20">
                                <div className="text-[13px] font-medium text-gray-400 dark:text-gray-600">
                                    تسکی برای این پرونده ثبت نشده
                                </div>
                            </div>
                        ) : (
                            <div className="flex flex-col gap-3">
                                {tasks.map((task, taskIndex) => (
                                    <CaseTaskViewCard
                                        key={task.id}
                                        task={task}
                                        index={taskIndex}
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