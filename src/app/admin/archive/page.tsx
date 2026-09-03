"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Archive, ArrowRight, Ban, CheckCircle2, ClipboardList, Layers3, Loader, RefreshCw, ShoppingBag } from "lucide-react";
import { useRouter } from "next/navigation";
import { useTheme } from "next-themes";
import axiosInstance from "@/lib/axiosInstance";
import { apiRoutes } from "@/lib/apiRoutes";
import { Task, TaskStatus } from "@/types/task";
import { Department } from "@/types/department";
import TaskCard from "@/components/customcomponents/tasks/TaskCard";
import EditTaskModal from "@/components/customcomponents/tasks/EditTaskModal";
import type { Customer } from "@/types/customer";
import type { Employee } from "@/types/employee";

type ListResponse<T> = T[] | { results?: T[]; data?: T[] };

const ACTIVE_STATUS = "in_progress" as TaskStatus;

type ArchiveFilter = "all" | "completed" | "sold" | "cancelled";

const archiveFilters: { id: ArchiveFilter; label: string; icon: typeof Layers3; color: string }[] = [
    { id: "all", label: "همه", icon: Layers3, color: "#818cf8" },
    { id: "completed", label: "تکمیل شده", icon: CheckCircle2, color: "#34d399" },
    { id: "sold", label: "فروش رفته", icon: ShoppingBag, color: "#fbbf24" },
    { id: "cancelled", label: "لغو شده", icon: Ban, color: "#fb7185" },
];

function extractList<T>(data: ListResponse<T>): T[] {
    if (Array.isArray(data)) return data;
    if (data && typeof data === "object") {
        if (Array.isArray((data as any).results)) return (data as any).results;
        if (Array.isArray((data as any).data)) return (data as any).data;
    }
    return [];
}

export default function AdminArchivedTasksPage() {
    const router = useRouter();
    const { resolvedTheme } = useTheme();
    const isDark = resolvedTheme === "dark";

    const [tasks, setTasks] = useState<Task[]>([]);
    const [customers, setCustomers] = useState<Customer[]>([]);
    const [departments, setDepartments] = useState<Department[]>([]);
    const [employees, setEmployees] = useState<Employee[]>([]);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState<ArchiveFilter>("all");
    const [editingTask, setEditingTask] = useState<Task | null>(null);

    const fetchAll = useCallback(async () => {
        try {
            setLoading(true);

            const [tasksRes, customersRes, departmentsRes, employeesRes] = await Promise.all([
                axiosInstance.get<ListResponse<Task>>(apiRoutes.tasks),
                axiosInstance.get<ListResponse<Customer>>(apiRoutes.customers),
                axiosInstance.get<ListResponse<Department>>(apiRoutes.departments),
                axiosInstance.get<ListResponse<Employee>>(apiRoutes.employees),
            ]);

            setTasks(extractList(tasksRes.data).filter((task) => task.status !== ACTIVE_STATUS));
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

    const filteredTasks = useMemo(() => (filter === "all" ? tasks : tasks.filter((task) => task.status === filter)), [tasks, filter]);

    const getCount = (id: ArchiveFilter) => (id === "all" ? tasks.length : tasks.filter((task) => task.status === id).length);

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

    const handleEditSuccess = useCallback(() => {
        setEditingTask(null);
        fetchAll();
    }, [fetchAll]);

    const handleTaskUpdated = useCallback((updated: Task) => {
        setTasks((prev) =>
            updated.status === ACTIVE_STATUS ? prev.filter((t) => t.id !== updated.id) : prev.map((t) => (t.id === updated.id ? updated : t))
        );
    }, []);

    return (
        <div className="flex flex-col gap-5 p-3 sm:p-4 md:p-6" dir="rtl">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex items-start gap-3">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl" style={{ background: isDark ? "rgba(99,102,241,0.14)" : "rgba(99,102,241,0.08)" }}>
                        <Archive size={18} className="text-indigo-500" />
                    </div>

                    <div className="min-w-0">
                        <h1 className="text-[15px] font-extrabold text-gray-900 dark:text-white">بایگانی تسک‌ها</h1>
                        <p className="mt-0.5 text-[11.5px] text-gray-500 dark:text-gray-400">{loading ? "در حال بارگذاری..." : `${filteredTasks.length} تسک`}</p>
                    </div>
                </div>

                <div className="flex items-center gap-2">
                    <button
                        type="button"
                        onClick={() => router.push("/admin/tasks")}
                        className="flex h-10 items-center gap-2 rounded-2xl px-3.5 text-[12px] font-bold transition-colors"
                        style={{ background: isDark ? "rgba(255,255,255,0.05)" : "rgba(15,23,42,0.05)", color: isDark ? "#cbd5e1" : "#475569" }}
                    >
                        <ArrowRight size={15} />
                        بازگشت به وظایف
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
                </div>
            </div>

            <div className="flex flex-wrap items-center gap-2">
                {archiveFilters.map(({ id, label, icon: Icon, color }) => {
                    const isActive = filter === id;
                    const count = getCount(id);

                    return (
                        <button
                            key={id}
                            type="button"
                            onClick={() => setFilter(id)}
                            className="flex items-center gap-2 rounded-2xl border px-3.5 py-2 text-[11.5px] font-bold transition-all duration-200"
                            style={{
                                color: isActive ? color : undefined,
                                backgroundColor: isActive ? `${color}18` : isDark ? "rgba(255,255,255,0.03)" : "rgba(15,23,42,0.03)",
                                borderColor: isActive ? `${color}45` : isDark ? "rgba(255,255,255,0.07)" : "rgba(15,23,42,0.07)",
                            }}
                        >
                            <Icon size={13} style={{ color: isActive ? color : "rgb(148 163 184)" }} />
                            <span className={isActive ? "" : "text-gray-500 dark:text-gray-400"}>{label}</span>
                            <span className="rounded-full px-1.5 py-0.5 text-[9.5px] font-extrabold tabular-nums" style={{ color, backgroundColor: `${color}18` }}>
                                {count}
                            </span>
                        </button>
                    );
                })}
            </div>

            {loading && (
                <div className="flex flex-col items-center justify-center gap-3 py-16">
                    <Loader size={24} className="animate-spin text-indigo-500" />
                    <p className="text-[12.5px] text-gray-500 dark:text-gray-400">در حال دریافت بایگانی...</p>
                </div>
            )}

            {!loading && filteredTasks.length === 0 && (
                <div className="flex flex-col items-center justify-center gap-2 py-16">
                    <ClipboardList size={28} className="text-gray-300 dark:text-gray-700" />
                    <p className="text-[12.5px] text-gray-500 dark:text-gray-400">تسکی در این وضعیت یافت نشد</p>
                </div>
            )}

            {!loading && filteredTasks.length > 0 && (
                <motion.div layout className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-3">
                    <AnimatePresence mode="popLayout">
                        {filteredTasks.map((task, index) => (
                            <motion.div key={task.id} layout initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }}>
                                <TaskCard task={task} index={index} employees={employees} onEdit={(t) => setEditingTask(t)} onDelete={handleDelete} onUpdated={handleTaskUpdated} />
                            </motion.div>
                        ))}
                    </AnimatePresence>
                </motion.div>
            )}

            <AnimatePresence>
                {editingTask && (
                    <EditTaskModal task={editingTask} customers={customers} departments={departments} onClose={() => setEditingTask(null)} onSuccess={handleEditSuccess} />
                )}
            </AnimatePresence>
        </div>
    );
}