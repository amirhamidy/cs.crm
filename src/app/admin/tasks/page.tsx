"use client";

import { useCallback, useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Archive, Check, ClipboardList, Eye, Loader, Plus, RefreshCw } from "lucide-react";
import { useSearchParams, useRouter } from "next/navigation";
import { useTheme } from "next-themes";
import axiosInstance from "@/lib/axiosInstance";
import { apiRoutes } from "@/lib/apiRoutes";
import { Task, TaskStatus } from "@/types/task";
import { Department } from "@/types/department";
import TaskCard from "@/components/customcomponents/tasks/TaskCard";
import CreateTaskModal from "@/components/customcomponents/tasks/CreateTaskModal";
import EditTaskModal from "@/components/customcomponents/tasks/EditTaskModal";
import type { Customer } from "@/types/customer";
import type { Employee } from "@/types/employee";

type ListResponse<T> = T[] | { results?: T[]; data?: T[] };

const ACTIVE_STATUS = "in_progress" as TaskStatus;

function extractList<T>(data: ListResponse<T>): T[] {
    if (Array.isArray(data)) return data;
    if (data && typeof data === "object") {
        if (Array.isArray((data as any).results)) return (data as any).results;
        if (Array.isArray((data as any).data)) return (data as any).data;
    }
    return [];
}

export default function AdminTasksPage() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const { resolvedTheme } = useTheme();
    const isDark = resolvedTheme === "dark";

    const [tasks, setTasks] = useState<Task[]>([]);
    const [customers, setCustomers] = useState<Customer[]>([]);
    const [departments, setDepartments] = useState<Department[]>([]);
    const [employees, setEmployees] = useState<Employee[]>([]);
    const [loading, setLoading] = useState(true);
    const [showCreate, setShowCreate] = useState(false);
    const [editingTask, setEditingTask] = useState<Task | null>(null);
    const [highlightedTaskId, setHighlightedTaskId] = useState<number | null>(null);
    const [viewedTaskId, setViewedTaskId] = useState<number | null>(null);

    const fetchAll = useCallback(async () => {
        try {
            setLoading(true);

            const [tasksRes, customersRes, departmentsRes, employeesRes] = await Promise.all([
                axiosInstance.get<ListResponse<Task>>(apiRoutes.tasks),
                axiosInstance.get<ListResponse<Customer>>(apiRoutes.customers),
                axiosInstance.get<ListResponse<Department>>(apiRoutes.departments),
                axiosInstance.get<ListResponse<Employee>>(apiRoutes.employees),
            ]);

            setTasks(extractList(tasksRes.data).filter((task) => task.status === ACTIVE_STATUS));
            setCustomers(extractList(customersRes.data));
            setDepartments(extractList(departmentsRes.data));
            setEmployees(extractList(employeesRes.data));
        } catch {
            setTasks([]);
            setCustomers([]);
            setDepartments([]);
            setEmployees([]);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchAll();
    }, [fetchAll]);

    useEffect(() => {
        const taskParam = searchParams.get("task");
        if (!taskParam || loading || !tasks.length) return;

        const targetId = Number(taskParam);
        if (!Number.isFinite(targetId)) return;

        const targetTask = tasks.find((task) => task.id === targetId);
        if (!targetTask) return;

        setViewedTaskId(null);
        setHighlightedTaskId(targetTask.id);
    }, [searchParams, loading, tasks]);

    const handleDelete = useCallback(
        async (taskId: number): Promise<boolean> => {
            try {
                await axiosInstance.delete(apiRoutes.deleteTask(taskId));
                setTasks((prev) => prev.filter((t) => t.id !== taskId));
                return true;
            } catch {
                await fetchAll();
                throw new Error("delete failed");
            }
        },
        [fetchAll]
    );

    const handleCreateSuccess = useCallback(() => {
        setShowCreate(false);
        fetchAll();
    }, [fetchAll]);

    const handleEditSuccess = useCallback(() => {
        setEditingTask(null);
        fetchAll();
    }, [fetchAll]);

    const handleTaskUpdated = useCallback((updated: Task) => {
        setTasks((prev) =>
            updated.status !== ACTIVE_STATUS ? prev.filter((t) => t.id !== updated.id) : prev.map((t) => (t.id === updated.id ? updated : t))
        );
    }, []);

    const handleTaskViewed = useCallback(
        (taskId: number) => {
            setHighlightedTaskId(null);
            setViewedTaskId(taskId);

            setTimeout(() => {
                setViewedTaskId(null);
                const params = new URLSearchParams(searchParams.toString());
                params.delete("task");
                router.replace(params.toString() ? `?${params.toString()}` : window.location.pathname, { scroll: false });
            }, 1000);
        },
        [router, searchParams]
    );

    return (
        <div className="flex flex-col gap-5 p-3 sm:p-4 md:p-6" dir="rtl">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex items-start gap-3">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl" style={{ background: isDark ? "rgba(99,102,241,0.14)" : "rgba(99,102,241,0.08)" }}>
                        <ClipboardList size={18} className="text-indigo-500" />
                    </div>

                    <div className="min-w-0">
                        <h1 className="text-[15px] font-extrabold text-gray-900 dark:text-white">وظایف در حال انجام</h1>
                        <p className="mt-0.5 text-[11.5px] text-gray-500 dark:text-gray-400">{loading ? "در حال بارگذاری..." : `${tasks.length} وظیفه`}</p>
                    </div>
                </div>

                <div className="flex items-center gap-2">
                    <button
                        type="button"
                        onClick={() => router.push("/admin/archive")}
                        className="flex h-10 items-center gap-2 rounded-2xl px-3.5 text-[12px] font-bold transition-colors"
                        style={{ background: isDark ? "rgba(255,255,255,0.05)" : "rgba(15,23,42,0.05)", color: isDark ? "#cbd5e1" : "#475569" }}
                    >
                        <Archive size={15} />
                        بایگانی
                    </button>

                    <button
                        type="button"
                        onClick={fetchAll}
                        disabled={loading}
                        className="flex h-10 w-10 items-center justify-center rounded-2xl transition-colors disabled:opacity-50"
                        style={{ background: isDark ? "rgba(255,255,255,0.05)" : "rgba(15,23,42,0.05)", color: isDark ? "#cbd5e1" : "#475569" }}
                        title="بارگذاری مجدد"
                    >
                        <RefreshCw size={15} className={loading ? "animate-spin" : ""} />
                    </button>

                    <button
                        type="button"
                        onClick={() => setShowCreate(true)}
                        className="flex h-10 items-center justify-center gap-2 rounded-2xl bg-indigo-600 px-4 text-[12.5px] font-bold text-white transition-colors hover:bg-indigo-700"
                    >
                        <Plus size={15} />
                        افزودن وظیفه
                    </button>
                </div>
            </div>

            {loading && (
                <div className="flex flex-col items-center justify-center gap-3 py-16">
                    <Loader size={24} className="animate-spin text-indigo-500" />
                    <p className="text-[12.5px] text-gray-500 dark:text-gray-400">در حال دریافت لیست وظایف...</p>
                </div>
            )}

            {!loading && tasks.length === 0 && (
                <div className="flex flex-col items-center justify-center gap-2 py-16">
                    <ClipboardList size={28} className="text-gray-300 dark:text-gray-700" />
                    <p className="text-[12.5px] text-gray-500 dark:text-gray-400">تسک در حال انجامی وجود ندارد</p>
                </div>
            )}

            {!loading && tasks.length > 0 && (
                <motion.div layout className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-3">
                    <AnimatePresence mode="popLayout">
                        {tasks.map((task, index) => {
                            const isHighlighted = highlightedTaskId === task.id;
                            const isViewed = viewedTaskId === task.id;

                            return (
                                <motion.div
                                    key={task.id}
                                    layout
                                    className="relative"
                                    animate={{ scale: isHighlighted ? [1, 1.012, 1] : 1 }}
                                    transition={isHighlighted ? { duration: 1.4, repeat: Infinity, ease: "easeInOut" } : { duration: 0.2 }}
                                >
                                    {isHighlighted && (
                                        <>
                                            <motion.div
                                                className="pointer-events-none absolute -inset-1 z-0 rounded-[26px] bg-red-500/20 blur-xl"
                                                animate={{ opacity: [0.35, 0.7, 0.35], scale: [0.98, 1.03, 0.98] }}
                                                transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut" }}
                                            />
                                            <motion.div
                                                className="pointer-events-none absolute inset-0 z-10 rounded-[24px]"
                                                animate={{
                                                    boxShadow: [
                                                        "0 0 0 1px rgba(239,68,68,0.5), 0 0 15px rgba(239,68,68,0.15)",
                                                        "0 0 0 2px rgba(239,68,68,0.9), 0 0 30px rgba(239,68,68,0.35)",
                                                        "0 0 0 1px rgba(239,68,68,0.5), 0 0 15px rgba(239,68,68,0.15)",
                                                    ],
                                                }}
                                                transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut" }}
                                            />
                                        </>
                                    )}

                                    <div className={`relative z-20 ${isHighlighted ? "pointer-events-none [&_*:hover]:!border-transparent [&_*:hover]:!ring-0 [&_*:hover]:!shadow-none" : ""}`}>
                                        <TaskCard task={task} index={index} employees={employees} onEdit={(t) => setEditingTask(t)} onDelete={handleDelete} onUpdated={handleTaskUpdated} />
                                    </div>

                                    <AnimatePresence>
                                        {isHighlighted && (
                                            <motion.button
                                                type="button"
                                                onClick={() => handleTaskViewed(task.id)}
                                                className="absolute bottom-3 left-3 z-40 flex items-center gap-2 overflow-hidden rounded-xl px-3 py-2 text-[11px] font-extrabold text-white"
                                                style={{ background: "linear-gradient(135deg,#ef4444,#b91c1c)", boxShadow: "0 8px 22px rgba(185,28,28,.35)" }}
                                                initial={{ opacity: 0, scale: 0.7, y: 8 }}
                                                animate={{ opacity: 1, scale: 1, y: 0 }}
                                                exit={{ opacity: 0, scale: 0.7, y: 8 }}
                                                whileTap={{ scale: 0.94 }}
                                            >
                                                <motion.span className="h-1.5 w-1.5 rounded-full bg-white" animate={{ opacity: [0.4, 1, 0.4], scale: [0.8, 1.2, 0.8] }} transition={{ duration: 0.8, repeat: Infinity }} />
                                                <Eye size={13} />
                                                مشاهده شد
                                            </motion.button>
                                        )}
                                    </AnimatePresence>

                                    <AnimatePresence>
                                        {isViewed && (
                                            <motion.div className="pointer-events-none absolute inset-0 z-50 flex items-center justify-center" initial={{ opacity: 0, scale: 0.5 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.05 }} transition={{ duration: 0.35 }}>
                                                <motion.div className="flex h-11 w-11 items-center justify-center rounded-full bg-emerald-500 text-white shadow-lg shadow-emerald-500/30" initial={{ scale: 0.7 }} animate={{ scale: 1 }} exit={{ scale: 0.05 }} transition={{ duration: 0.45, ease: "easeInOut" }}>
                                                    <Check size={21} strokeWidth={3} />
                                                </motion.div>
                                            </motion.div>
                                        )}
                                    </AnimatePresence>
                                </motion.div>
                            );
                        })}
                    </AnimatePresence>
                </motion.div>
            )}

            <AnimatePresence>
                {showCreate && <CreateTaskModal isOpen={showCreate} onClose={() => setShowCreate(false)} onSuccess={handleCreateSuccess} />}
            </AnimatePresence>

            <AnimatePresence>
                {editingTask && (
                    <EditTaskModal task={editingTask} customers={customers} departments={departments} onClose={() => setEditingTask(null)} onSuccess={handleEditSuccess} />
                )}
            </AnimatePresence>
        </div>
    );
}