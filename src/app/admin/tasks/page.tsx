"use client";

import { useState, useEffect, useCallback } from "react";
import { Plus } from "lucide-react";
import { AnimatePresence } from "framer-motion";
import axiosInstance from "@/lib/axiosInstance";
import CreateTaskModal from "@/components/admin/tasks/CreateTaskModal";
import TaskCard from "@/components/admin/tasks/TaskCard";
// در صورت داشتن مدال ویرایش تسک، آن را اینجا ایمپورت کنید:
// import EditTaskModal from "@/components/admin/tasks/EditTaskModal";

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
    
    // استیت‌های مربوط به مدال ویرایش
    const [selectedTask, setSelectedTask] = useState<Task | null>(null);
    const [editModalOpen, setEditModalOpen] = useState(false);

    const fetchTasks = useCallback(async () => {
        setLoading(true);
        try {
            const { data } = await axiosInstance.get("/tasks/api/v1/tasks/");
            setTasks(data);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchTasks();
    }, [fetchTasks]);

    // هندلر حذف محلی تسک پس از موفقیت‌آمیز بودن ریکوئست حذف در کامپوننت کارت
    const handleDeleteLocal = (id: number) => {
        setTasks((prev) => prev.filter((t) => t.id !== id));
    };

    // باز کردن مدال ویرایش برای تسک انتخاب شده
    const handleEditClick = (task: Task) => {
        setSelectedTask(task);
        setEditModalOpen(true);
    };

    return (
        <div className="p-6 space-y-6">
            <div className="flex items-center justify-between">
                <h1 className="text-2xl font-bold text-zinc-900 dark:text-white">تسک‌ها</h1>
                <button
                    onClick={() => setModalOpen(true)}
                    className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-sm transition-colors"
                >
                    <Plus size={16} />
                    تسک جدید
                </button>
            </div>

            {loading ? (
                <div className="text-center py-16 text-zinc-400">در حال بارگذاری...</div>
            ) : tasks.length === 0 ? (
                <div className="text-center py-16 text-zinc-400">هیچ تسکی وجود ندارد</div>
            ) : (
                // استفاده از گرید با ۲ یا ۳ ستون بر اساس سایز نمایشگر برای زیبایی کارت‌ها
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

            {/* مدال ساخت تسک */}
            <CreateTaskModal
                isOpen={modalOpen}
                onClose={() => setModalOpen(false)}
                onSuccess={fetchTasks}
            />

            {/* مدال ویرایش تسک (در صورت نیاز آن را فعال کنید) */}
            {/* 
            {selectedTask && (
                <EditTaskModal
                    isOpen={editModalOpen}
                    onClose={() => {
                        setEditModalOpen(false);
                        setSelectedTask(null);
                    }}
                    task={selectedTask}
                    onSuccess={fetchTasks}
                />
            )} 
            */}
        </div>
    );
}
