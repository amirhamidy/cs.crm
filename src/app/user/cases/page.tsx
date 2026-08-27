"use client";

import React, { useCallback, useEffect, useMemo, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { ClipboardList, Loader, Plus, RefreshCw } from "lucide-react";
import axiosInstance from "@/lib/axiosInstance";
import { apiRoutes } from "@/lib/apiRoutes";
import type { Department } from "@/types/department";
import type { Employee } from "@/types/employee";
import type { TaskItem } from "@/types/task";
import CreateCaseModal from "@/components/user/cases/CreateCaseModal";
import type { CaseItem } from "@/types/case";
import type { Customer } from "@/types/customer";
import EditCaseModal from "@/components/user/cases/EditCaseModal";
import CaseCard from "@/components/user/cases/CaseCard";
import TaskCard from "@/components/customcomponents/tasks/TaskCard";
import EditTaskModal from "@/components/customcomponents/tasks/EditTaskModal";

type ListResponse<T> = T[] | { results?: T[]; data?: T[] };

function extractList<T>(data: ListResponse<T> | undefined | null): T[] {
    if (Array.isArray(data)) return data;
    if (data && typeof data === "object") {
        if (Array.isArray(data.results)) return data.results;
        if (Array.isArray(data.data)) return data.data;
    }
    return [];
}

function extractCaseId(task: TaskItem): string | null {
    const raw =
        (task as any).case ??
        (task as any).case_id ??
        (task as any).caseId ??
        null;

    if (raw === null || raw === undefined) return null;

    if (typeof raw === "object") {
        const id = raw.id ?? raw.pk ?? null;
        return id !== null && id !== undefined ? String(id) : null;
    }

    return String(raw);
}

export default function UserCasesPage() {
    const [cases, setCases] = useState<CaseItem[]>([]);
    const [customers, setCustomers] = useState<Customer[]>([]);
    const [departments, setDepartments] = useState<Department[]>([]);
    const [employees, setEmployees] = useState<Employee[]>([]);
    const [tasks, setTasks] = useState<TaskItem[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [query, setQuery] = useState("");
    const [caseModalOpen, setCaseModalOpen] = useState(false);
    const [editingCase, setEditingCase] = useState<CaseItem | null>(null);
    const [editCaseModalOpen, setEditCaseModalOpen] = useState(false);
    const [deletingId, setDeletingId] = useState<number | null>(null);
    const [editingTask, setEditingTask] = useState<TaskItem | null>(null);
    const [editModalOpen, setEditModalOpen] = useState(false);
    const [deletingTaskId, setDeletingTaskId] = useState<number | null>(null);

    const fetchData = useCallback(async () => {
        try {
            setLoading(true);
            setError("");
            const [casesRes, customersRes, departmentsRes, employeesRes, tasksRes] = await Promise.all([
                axiosInstance.get<ListResponse<CaseItem>>(apiRoutes.cases),
                axiosInstance.get<ListResponse<Customer>>(apiRoutes.customers),
                axiosInstance.get<ListResponse<Department>>(apiRoutes.departments),
                axiosInstance.get<ListResponse<Employee>>("/accounts/api/v1/employee/list/"),
                axiosInstance.get<ListResponse<TaskItem>>(apiRoutes.tasks),
            ]);

            const caseList = extractList<CaseItem>(casesRes.data);

            const detailedCases = await Promise.all(
                caseList.map(async (item) => {
                    try {
                        const detailRes = await axiosInstance.get<CaseItem>(
                            `/tasks/api/v1/cases/${item.id}/`
                        );
                        return { ...item, ...detailRes.data };
                    } catch {
                        return item;
                    }
                })
            );

            const taskList = extractList(tasksRes.data);

            setCases(detailedCases);
            setCustomers(extractList(customersRes.data));
            setDepartments(extractList(departmentsRes.data));
            setEmployees(extractList(employeesRes.data));
            setTasks(taskList);
        } catch {
            setError("دریافت اطلاعات با خطا مواجه شد");
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchData();
    }, [fetchData]);

    const tasksByCase = useMemo(() => {
        const map = new Map<string, TaskItem[]>();
        tasks.forEach((task) => {
            const caseId = extractCaseId(task);
            if (caseId) {
                if (!map.has(caseId)) map.set(caseId, []);
                map.get(caseId)!.push(task);
            }
        });
        return map;
    }, [tasks]);

    const handleDeleteCase = useCallback(
        async (item: CaseItem) => {
            const id = Number(item.id);
            if (!id) return;

            const caseTasks = tasksByCase.get(String(item.id)) || [];
            if (caseTasks.length > 0) return;

            try {
                setDeletingId(id);
                await axiosInstance.delete(`/tasks/api/v1/cases/${id}/delete/`);
                setCases((prev) => prev.filter((c) => Number(c.id) !== id));
            } catch {
                await fetchData();
                throw new Error("خطا در حذف پرونده");
            } finally {
                setDeletingId(null);
            }
        },
        [fetchData, tasksByCase]
    );

    const handleEditCase = useCallback((item: CaseItem) => {
        setEditingCase(item);
        setEditCaseModalOpen(true);
    }, []);

    const handleCaseUpdate = useCallback(() => {
        fetchData();
        setEditCaseModalOpen(false);
        setEditingCase(null);
    }, [fetchData]);

    const handleDeleteTask = useCallback(
        async (taskId: number) => {
            try {
                setDeletingTaskId(taskId);
                await axiosInstance.delete(`/tasks/api/v1/tasks/${taskId}/delete/`);
                setTasks((prev) => prev.filter((t) => t.id !== taskId));
                return Promise.resolve();
            } catch {
                throw new Error("خطا در حذف وظیفه");
            } finally {
                setDeletingTaskId(null);
            }
        },
        []
    );

    const handleEditTask = useCallback((task: TaskItem) => {
        setEditingTask(task);
        setEditModalOpen(true);
    }, []);

    const handleTaskUpdate = useCallback(() => {
        fetchData();
        setEditModalOpen(false);
        setEditingTask(null);
    }, [fetchData]);

    const filteredCases = useMemo(() => {
        const q = query.trim().toLowerCase();
        if (!q) return cases;
        return cases.filter((item) => {
            const customer = customers.find((c) => Number(c.id) === Number(item.customer));
            const customerName = [
                customer?.first_name,
                customer?.last_name,
                (customer as unknown as { full_name?: string })?.full_name,
                (customer as unknown as { company_name?: string })?.company_name,
            ]
                .filter(Boolean)
                .join(" ")
                .toLowerCase();

            return (
                String(item.title ?? "").toLowerCase().includes(q) ||
                String(item.description ?? "").toLowerCase().includes(q) ||
                String(item.id ?? "").includes(q) ||
                customerName.includes(q)
            );
        });
    }, [cases, customers, query]);

    return (
        <div className="flex flex-col gap-6 p-4 md:p-6" dir="rtl">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex items-start gap-3">
                    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-2xl bg-indigo-50 dark:bg-indigo-500/10">
                        <ClipboardList size={16} className="text-indigo-500 dark:text-indigo-400" />
                    </div>
                    <div className="min-w-0">
                        <h1 className="text-[14px] font-extrabold text-gray-900 dark:text-white">
                            پرونده‌ها
                        </h1>
                        <p className="mt-0.5 text-[11.5px] text-gray-400 dark:text-gray-500">
                            {loading
                                ? "در حال بارگذاری..."
                                : `${cases.length} پرونده و ${tasks.length} وظیفه`}
                        </p>
                    </div>
                </div>

                <div className="flex items-center gap-2 sm:justify-end">
                    <button
                        onClick={fetchData}
                        disabled={loading}
                        type="button"
                        title="بارگذاری مجدد"
                        className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-600 disabled:opacity-40 dark:text-gray-500 dark:hover:bg-white/5 dark:hover:text-gray-300"
                    >
                        <RefreshCw size={13} className={loading ? "animate-spin" : ""} />
                    </button>

                    <button
                        onClick={() => setCaseModalOpen(true)}
                        type="button"
                        className="flex h-9 flex-1 items-center justify-center gap-2 rounded-xl bg-indigo-600 px-3.5 text-[12.5px] font-bold text-white transition-all duration-200 hover:bg-indigo-500 active:scale-[0.98] dark:bg-indigo-500 dark:hover:bg-indigo-400 sm:flex-none"
                    >
                        <Plus size={13} strokeWidth={2.5} />
                        <span className="whitespace-nowrap">پرونده جدید</span>
                    </button>
                </div>
            </div>

            {error && !loading && (
                <div className="flex flex-col items-start gap-3 rounded-2xl border border-rose-200 bg-rose-50 p-4 text-[12.5px] text-rose-600 dark:border-rose-500/20 dark:bg-rose-500/10 dark:text-rose-300 sm:flex-row sm:items-center sm:justify-between">
                    <span>{error}</span>
                    <button
                        onClick={fetchData}
                        type="button"
                        className="rounded-xl bg-rose-600 px-3 py-1.5 text-[11.5px] font-bold text-white transition-colors hover:bg-rose-500"
                    >
                        تلاش مجدد
                    </button>
                </div>
            )}

            {loading ? (
                <div className="flex flex-col items-center justify-center gap-3 py-16">
                    <Loader size={22} className="animate-spin text-indigo-500" />
                    <p className="text-[12.5px] text-gray-400 dark:text-gray-500">
                        در حال دریافت لیست پرونده‌ها...
                    </p>
                </div>
            ) : cases.length === 0 ? (
                <div className="flex flex-col items-center justify-center gap-3 py-20">
                    <div className="flex h-14 w-14 items-center justify-center rounded-3xl bg-gray-100 dark:bg-white/5">
                        <ClipboardList size={20} className="text-gray-400 dark:text-gray-500" />
                    </div>
                    <p className="text-[13px] text-gray-400 dark:text-gray-500">
                        پرونده‌ای ثبت نشده است
                    </p>
                    <button
                        onClick={() => setCaseModalOpen(true)}
                        type="button"
                        className="rounded-xl bg-indigo-600 px-4 py-2.5 text-[12.5px] font-bold text-white transition-colors hover:bg-indigo-500 dark:bg-indigo-500 dark:hover:bg-indigo-400"
                    >
                        ایجاد اولین پرونده
                    </button>
                </div>
            ) : filteredCases.length === 0 ? (
                <div className="flex flex-col items-center justify-center gap-2 py-20">
                    <p className="text-[13px] text-gray-400 dark:text-gray-500">
                        نتیجه‌ای برای «{query}» پیدا نشد
                    </p>
                    <button
                        onClick={() => setQuery("")}
                        type="button"
                        className="text-[12px] font-bold text-indigo-500 transition-colors hover:text-indigo-400"
                    >
                        پاک کردن جستجو
                    </button>
                </div>
            ) : (
                <motion.div layout className="grid grid-cols-1 gap-3 lg:grid-cols-2 xl:grid-cols-3">
                    <AnimatePresence mode="popLayout">
                        {filteredCases.map((item, i) => {
                            const caseTasks = tasksByCase.get(String(item.id)) || [];
                            return (
                                <div key={item.id} className="relative flex flex-col gap-2 border-2 border-[#eeeeee] p-3 rounded-4xl dark:border-white/[0.06]">
                                    <CaseCard
                                        item={item}
                                        index={i}
                                        customers={customers}
                                        departments={departments}
                                        hasActiveTasks={caseTasks.length > 0}
                                        users={employees}
                                        isDeleting={deletingId === Number(item.id)}
                                        onEdit={handleEditCase}
                                        onDelete={handleDeleteCase}
                                    />
                                    {caseTasks.length > 0 && (
                                        <div className="pr-4 space-y-2">
                                            {caseTasks.map((task, taskIndex) => (
                                                <TaskCard
                                                    key={task.id}
                                                    task={task}
                                                    index={taskIndex}
                                                    onEdit={handleEditTask}
                                                    onDelete={handleDeleteTask}
                                                    deleting={deletingTaskId === task.id}
                                                />
                                            ))}
                                        </div>
                                    )}
                                </div>
                            );
                        })}
                    </AnimatePresence>
                </motion.div>
            )}

            <CreateCaseModal
                open={caseModalOpen}
                onClose={() => setCaseModalOpen(false)}
                onCreated={fetchData}
                customers={customers}
            />

            {editCaseModalOpen && editingCase && (
                <EditCaseModal
                    isOpen={editCaseModalOpen}
                    caseItem={editingCase}
                    customers={customers}
                    departments={departments}
                    users={employees}
                    onClose={() => {
                        setEditCaseModalOpen(false);
                        setEditingCase(null);
                    }}
                    onSuccess={handleCaseUpdate}
                />
            )}

            {editModalOpen && editingTask && (
                <EditTaskModal
                    task={editingTask}
                    customers={customers}
                    departments={departments}
                    onClose={() => {
                        setEditModalOpen(false);
                        setEditingTask(null);
                    }}
                    onSuccess={handleTaskUpdate}
                />
            )}
        </div>
    );
}