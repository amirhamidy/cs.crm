"use client";

import React, { useCallback, useEffect, useMemo, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import {
    ClipboardList,
    Layers,
    Loader,
    Pencil,
    Plus,
    RefreshCw,
} from "lucide-react";
import { useTheme } from "next-themes";
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
import EditTaskModal from "@/components/customcomponents/tasks/EditTaskModal";
import CaseTasksModal from "@/components/customcomponents/cases/CaseTasksModal";

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
    const { resolvedTheme } = useTheme();
    const isDark = resolvedTheme === "dark";

    const [cases, setCases] = useState<CaseItem[]>([]);
    const [customers, setCustomers] = useState<Customer[]>([]);
    const [departments, setDepartments] = useState<Department[]>([]);
    const [employees, setEmployees] = useState<Employee[]>([]);
    const [tasks, setTasks] = useState<TaskItem[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [caseModalOpen, setCaseModalOpen] = useState(false);
    const [editingCase, setEditingCase] = useState<CaseItem | null>(null);
    const [editCaseModalOpen, setEditCaseModalOpen] = useState(false);
    const [deletingId, setDeletingId] = useState<number | null>(null);
    const [editingTask, setEditingTask] = useState<TaskItem | null>(null);
    const [editTaskModalOpen, setEditTaskModalOpen] = useState(false);
    const [deletingTaskId, setDeletingTaskId] = useState<number | null>(null);
    const [tasksModalOpen, setTasksModalOpen] = useState(false);
    const [selectedCaseForTasks, setSelectedCaseForTasks] =
        useState<CaseItem | null>(null);

    const fetchData = useCallback(async () => {
        try {
            setLoading(true);
            setError("");
            const [casesRes, customersRes, departmentsRes, employeesRes, tasksRes] =
                await Promise.all([
                    axiosInstance.get<ListResponse<CaseItem>>(apiRoutes.cases),
                    axiosInstance.get<ListResponse<Customer>>(apiRoutes.customers),
                    axiosInstance.get<ListResponse<Department>>(apiRoutes.departments),
                    axiosInstance.get<ListResponse<Employee>>(
                        "/accounts/api/v1/employee/list/"
                    ),
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

    const selectedCaseTasks = useMemo(() => {
        if (!selectedCaseForTasks) return [];
        return tasksByCase.get(String(selectedCaseForTasks.id)) || [];
    }, [selectedCaseForTasks, tasksByCase]);

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

    const handleDeleteTask = useCallback(async (taskId: number) => {
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
    }, []);

    const handleEditTask = useCallback((task: TaskItem) => {
        setEditingTask(task);
        setEditTaskModalOpen(true);
    }, []);

    const handleTaskUpdate = useCallback(() => {
        fetchData();
        setEditTaskModalOpen(false);
        setEditingTask(null);
    }, [fetchData]);

    const handleOpenTasksModal = useCallback((item: CaseItem) => {
        setSelectedCaseForTasks(item);
        setTasksModalOpen(true);
    }, []);

    return (
        <div className="flex flex-col gap-5 p-3 sm:p-4 md:p-6" dir="rtl">
            {/* Header */}
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex items-start gap-3">
                   

                    <div className="min-w-0">
                        <h1 className="text-[15px] font-extrabold text-gray-900 dark:text-white">
                            پرونده‌ها
                        </h1>

                        <p className="mt-0.5 text-[11.5px] text-gray-500 dark:text-gray-400">
                            {loading
                                ? "در حال بارگذاری..."
                                : `${cases.length} پرونده و ${tasks.length} وظیفه`}
                        </p>
                    </div>
                </div>

                <div className="flex items-center gap-2">
                    <button
                        onClick={fetchData}
                        disabled={loading}
                        type="button"
                        title="بارگذاری مجدد"
                        className="flex h-10 w-10 items-center justify-center rounded-2xl transition-colors disabled:opacity-50"
                        style={{
                            background: isDark
                                ? "rgba(255,255,255,0.05)"
                                : "rgba(15,23,42,0.05)",
                            color: isDark ? "#cbd5e1" : "#475569",
                        }}
                    >
                        <RefreshCw
                            size={15}
                            className={loading ? "animate-spin" : ""}
                        />
                    </button>

                    <button
                        onClick={() => setCaseModalOpen(true)}
                        type="button"
                        className="flex h-10 items-center justify-center gap-2 rounded-2xl bg-indigo-600 px-4 text-[12.5px] font-bold text-white transition-colors hover:bg-indigo-700"
                    >
                        <Plus size={15} />
                        <span>پرونده جدید</span>
                    </button>
                </div>
            </div>

            {/* Error */}
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

            {/* Loading */}
            {loading && (
                <div className="flex flex-col items-center justify-center gap-3 py-16">
                    <Loader size={24} className="animate-spin text-indigo-500" />

                    <p className="text-[12.5px] text-gray-500 dark:text-gray-400">
                        در حال دریافت لیست پرونده‌ها...
                    </p>
                </div>
            )}

            {/* Empty State */}
            {!loading && cases.length === 0 && (
                <div className="flex flex-col items-center justify-center gap-2 py-16">
                    <ClipboardList
                        size={28}
                        className="text-gray-300 dark:text-gray-700"
                    />

                    <p className="text-[12.5px] text-gray-500 dark:text-gray-400">
                        هنوز پرونده‌ای ثبت نشده
                    </p>
                </div>
            )}

            {/* Cases Grid */}
            {!loading && cases.length > 0 && (
                <motion.div
                    layout
                    className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-3"
                >
                    <AnimatePresence mode="popLayout">
                        {cases.map((item, i) => {
                            const caseTasks =
                                tasksByCase.get(String(item.id)) || [];

                            return (
                                <div
                                    key={item.id}
                                    className="relative flex flex-col gap-2 rounded-4xl border-2 border-[#eeeeee] p-3 dark:border-white/[0.06]"
                                >
                                    <div className="relative">
                                        <CaseCard
                                            item={item}
                                            index={i}
                                            customers={customers}
                                            departments={departments}
                                            users={employees}
                                            isDeleting={
                                                deletingId === Number(item.id)
                                            }
                                            hasActiveTasks={
                                                caseTasks.length > 0
                                            }
                                            onEdit={handleEditCase}
                                            onDelete={() =>
                                                handleDeleteCase(item)
                                            }
                                        />

                                        <button
                                            type="button"
                                            onClick={() => handleEditCase(item)}
                                            className="absolute left-3 top-3 flex h-7 w-7 items-center justify-center rounded-xl transition-colors"
                                            title="ویرایش پرونده"
                                            style={{
                                                background:
                                                    "rgba(99, 102, 241, 0.07)",
                                                color: "rgb(99, 102, 241)",
                                            }}
                                        >
                                            <Pencil size={11} strokeWidth={2} />
                                        </button>
                                    </div>

                                    <button
                                        type="button"
                                        onClick={() =>
                                            handleOpenTasksModal(item)
                                        }
                                        className="flex items-center justify-between gap-2 rounded-2xl px-3.5 py-2.5 text-[12px] font-bold transition-colors"
                                        style={{
                                            background:
                                                "rgba(99, 102, 241, 0.06)",
                                            color: "rgb(99, 102, 241)",
                                        }}
                                    >
                                        <span className="flex items-center gap-2">
                                            <Layers size={13} />
                                            دیدن وظیفه های این پرونده
                                        </span>

                                        <span
                                            className="rounded-full px-2 py-0.5 text-[10.5px] font-extrabold"
                                            style={{
                                                background:
                                                    "rgba(99,102,241,0.14)",
                                            }}
                                        >
                                            {caseTasks.length}
                                        </span>
                                    </button>
                                </div>
                            );
                        })}
                    </AnimatePresence>
                </motion.div>
            )}

            {/* Modals */}
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

            {editTaskModalOpen && editingTask && (
                <EditTaskModal
                    task={editingTask}
                    customers={customers}
                    departments={departments}
                    onClose={() => {
                        setEditTaskModalOpen(false);
                        setEditingTask(null);
                    }}
                    onSuccess={handleTaskUpdate}
                />
            )}

            <CaseTasksModal
                isOpen={tasksModalOpen}
                onClose={() => {
                    setTasksModalOpen(false);
                    setSelectedCaseForTasks(null);
                }}
                caseItem={selectedCaseForTasks}
                tasks={selectedCaseTasks}
                onEditTask={handleEditTask}
                onDeleteTask={handleDeleteTask}
                deletingTaskId={deletingTaskId}
            />
        </div>
    );
}