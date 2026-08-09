"use client";

import { useState, useEffect, useCallback } from "react";
import { Plus } from "lucide-react";
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
    const [tasks, setTasks] = useState<Task[]>([]);
    const [loading, setLoading] = useState(true);

    const [modalOpen, setModalOpen] = useState(false);

    const [selectedTask, setSelectedTask] = useState<Task | null>(null);
    const [editModalOpen, setEditModalOpen] = useState(false);

    const fetchTasks = useCallback(async () => {
        setLoading(true);

        try {
            const { data } = await axiosInstance.get(
                "/tasks/api/v1/tasks/"
            );

            setTasks(data);
        } catch (error) {
            console.error("خطا در دریافت تسک‌ها:", error);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchTasks();
    }, [fetchTasks]);

    const handleDeleteLocal = (id: number) => {
        setTasks((previousTasks) =>
            previousTasks.filter((task) => task.id !== id)
        );
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
        <div className="space-y-6 p-6" dir="rtl">
            <div className="flex items-center justify-between">
                <h1 className="text-2xl font-bold text-zinc-900 dark:text-white">
                    تسک‌ها
                </h1>

                <button
                    type="button"
                    onClick={() => setModalOpen(true)}
                    className="flex items-center gap-2 rounded-xl bg-blue-600 px-4 py-2 text-sm text-white transition-colors hover:bg-blue-700"
                >
                    <Plus size={16} />
                    تسک جدید
                </button>
            </div>

            {loading ? (
                <div className="py-16 text-center text-zinc-400">
                    در حال بارگذاری...
                </div>
            ) : tasks.length === 0 ? (
                <div className="py-16 text-center text-zinc-400">
                    هیچ تسکی وجود ندارد
                </div>
            ) : (
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
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
