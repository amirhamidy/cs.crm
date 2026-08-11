"use client";

import { useState, useEffect, useCallback } from "react";
import { useTheme } from "next-themes";
import { Plus, RefreshCw, Loader, ClipboardList } from "lucide-react";
import { AnimatePresence } from "framer-motion";
import axiosInstance from "@/lib/axiosInstance";

import CreateTaskModal from "@/components/admin/tasks/CreateTaskModal";
import EditTaskModal from "@/components/admin/tasks/EditTaskModal";
import TaskCard from "@/components/admin/tasks/TaskCard";

interface Task {
    id: number;
    title: string;
    description: string;
    department: number;
    case: number;
}

export default function TasksPage() {
    const { resolvedTheme } = useTheme();
    const isDark = resolvedTheme === "dark";

    const [tasks, setTasks] = useState<Task[]>([]);
    const [loading, setLoading] = useState(true);
    const [modalOpen, setModalOpen] = useState(false);
    const [selectedTask, setSelectedTask] = useState<Task | null>(null);
    const [editModalOpen, setEditModalOpen] = useState(false);

    const fetchTasks = useCallback(async () => {
        setLoading(true);
        try {
            const { data } = await axiosInstance.get("/tasks/api/v1/tasks/");
            setTasks(data);
        } catch (error) {
            console.error("خطا در دریافت وظایف:", error);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchTasks();
    }, [fetchTasks]);

    const handleDeleteLocal = (id: number) => {
        setTasks((previousTasks) => previousTasks.filter((task) => task.id !== id));
    };

    const handleEditClick = (task: Task) => {
        setSelectedTask(task);
        setEditModalOpen(true);
    };

    const handleCloseEditModal = () => {
        setEditModalOpen(false);
        setSelectedTask(null);
    };

    return (
        <div className="flex flex-col gap-5 p-3 sm:p-4 md:p-6" dir="rtl">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex items-start gap-3">
                    <div
                        className="flex h-9 w-9 shrink-0 items-center justify-center rounded-2xl"
                        style={{
                            background: isDark ? "rgba(99,102,241,0.12)" : "rgba(99,102,241,0.08)",
                        }}
                    >
                        <ClipboardList size={16} className="text-indigo-500" />
                    </div>
                    <div className="min-w-0">
                        <h1 className="text-[14px] font-extrabold text-gray-900 dark:text-white">
                            مدیریت وظایف
                        </h1>
                        <p className="mt-0.5 text-[11.5px] text-gray-400 dark:text-gray-500">
                            {loading ? "در حال بارگذاری..." : `${tasks.length} تسک فعال در سیستم`}
                        </p>
                    </div>
                </div>

                <div className="flex items-center gap-2 sm:justify-end">
                    <button
                        onClick={fetchTasks}
                        disabled={loading}
                        className="flex h-9 w-9 items-center justify-center rounded-xl text-gray-400 transition-colors hover:text-gray-600 disabled:opacity-40 dark:hover:text-gray-300"
                        style={{
                            background: isDark ? "rgba(255,255,255,0.05)" : "rgba(0,0,0,0.04)",
                        }}
                        title="بارگذاری مجدد"
                        type="button"
                    >
                        <RefreshCw size={13} className={loading ? "animate-spin" : ""} />
                    </button>

                    <button
                        onClick={() => setModalOpen(true)}
                        className="flex h-9 flex-1 items-center justify-center gap-2 rounded-xl px-3.5 py-2 text-[12.5px] bg-blue-600 hover:bg-blue-100 hover:text-blue-500 transition-all duration-200  font-bold text-white hover:opacity-90 sm:flex-none"
                        type="button"
                    >
                        <Plus size={13} />
                        <span className="whitespace-nowrap">تسک جدید</span>
                    </button>
                </div>
            </div>

            {loading ? (
                <div className="flex flex-col items-center justify-center gap-3 py-16">
                    <Loader size={22} className="text-indigo-500 animate-spin" />
                    <p className="text-[12.5px] text-gray-400 dark:text-gray-500">
                        در حال دریافت لیست وظایف...
                    </p>
                </div>
            ) : tasks.length === 0 ? (
                <div className="flex flex-col items-center justify-center gap-2 py-16">
                    <ClipboardList size={28} className="text-gray-300 dark:text-gray-700" />
                    <p className="text-[12.5px] text-gray-400 dark:text-gray-500">
                        هنوز تسکی ثبت نشده است
                    </p>
                </div>
            ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
                    <AnimatePresence mode="popLayout">
                        {tasks.map((task, index) => (
                            <TaskCard
                                key={task.id}
                                task={task}
                                index={index}
                                onDelete={handleDeleteLocal}
                                onEdit={handleEditClick}
                            />
                        ))}
                    </AnimatePresence>
                </div>
            )}

            <CreateTaskModal
                isOpen={modalOpen}
                onClose={() => setModalOpen(false)}
                onSuccess={fetchTasks}
            />

            {selectedTask && (
                <EditTaskModal
                    isOpen={editModalOpen}
                    onClose={handleCloseEditModal}
                    task={selectedTask}
                    onSuccess={async () => {
                        await fetchTasks();
                        handleCloseEditModal();
                    }}
                />
            )}
        </div>
    );
}
