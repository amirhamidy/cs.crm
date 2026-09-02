"use client";

import React, { useCallback, useEffect, useMemo, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { useTheme } from "next-themes";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import {
    ClipboardList,
    Layers,
    Loader,
    Pencil,
    Plus,
    RefreshCw,
} from "lucide-react";
import axiosInstance from "@/lib/axiosInstance";
import { apiRoutes } from "@/lib/apiRoutes";
import { Case, Department } from "@/types/case";
import type { CaseItem } from "@/types/case";
import type { Customer } from "@/types/customer";
import type { Employee } from "@/types/employee";

import CaseCard from "@/components/customcomponents/cases/CaseCard";
import CreateCaseModal from "@/components/customcomponents/cases/CreateCaseModal";
import EditCaseModal from "@/components/customcomponents/cases/EditCaseModal";
import CaseTasksModal from "@/components/customcomponents/cases/CaseTasksModal";
import EditTaskModal from "@/components/customcomponents/tasks/EditTaskModal";
import type { TaskItem } from "@/types/task";

type ListResponse<T> = T[] | { results?: T[]; data?: T[] };

function extractList<T>(data: ListResponse<T> | undefined | null): T[] {
    if (Array.isArray(data)) return data;

    if (data && typeof data === "object") {
        if (Array.isArray(data.results)) return data.results;
        if (Array.isArray(data.data)) return data.data;
    }

    return [];
}

export default function AdminCasesPage() {
    const { resolvedTheme } = useTheme();
    const isDark = resolvedTheme === "dark";

    const router = useRouter();
    const pathname = usePathname();
    const searchParams = useSearchParams();

    const [cases, setCases] = useState<Case[]>([]);
    const [customers, setCustomers] = useState<Customer[]>([]);
    const [departments, setDepartments] = useState<Department[]>([]);
    const [employees, setEmployees] = useState<Employee[]>([]);
    const [tasks, setTasks] = useState<TaskItem[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [caseModalOpen, setCaseModalOpen] = useState(false);
    const [deletingId, setDeletingId] = useState<number | null>(null);
    const [editingCase, setEditingCase] = useState<CaseItem | null>(null);
    const [editCaseModalOpen, setEditCaseModalOpen] = useState(false);
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

            const [
                casesRes,
                customersRes,
                departmentsRes,
                employeesRes,
                tasksRes,
            ] = await Promise.all([
                axiosInstance.get<ListResponse<Case>>(apiRoutes.cases),
                axiosInstance.get<ListResponse<Customer>>(apiRoutes.customers),
                axiosInstance.get<ListResponse<Department>>(
                    apiRoutes.departments
                ),
                axiosInstance.get<ListResponse<Employee>>(
                    apiRoutes.departmentEmployees
                ),
                axiosInstance.get<ListResponse<TaskItem>>(apiRoutes.tasks),
            ]);

            const caseList = extractList<Case>(casesRes.data);

            const detailedCases = await Promise.all(
                caseList.map(async (item) => {
                    try {
                        const detailRes = await axiosInstance.get<Case>(
                            `/tasks/api/v1/cases/${item.id}/`
                        );

                        return { ...item, ...detailRes.data };
                    } catch {
                        return item;
                    }
                })
            );

            setCases(detailedCases);
            setCustomers(extractList(customersRes.data));
            setDepartments(extractList(departmentsRes.data));
            setEmployees(extractList(employeesRes.data));
            setTasks(extractList(tasksRes.data));
        } catch (err) {
            console.error(err);
            setError("دریافت اطلاعات با خطا مواجه شد");
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchData();
    }, [fetchData]);

    useEffect(() => {
        const caseIdParam = searchParams.get("case");

        if (!caseIdParam || loading || cases.length === 0) {
            return;
        }

        const caseId = Number(caseIdParam);

        if (!Number.isFinite(caseId)) {
            return;
        }

        const foundCase = cases.find(
            (item) => Number(item.id) === caseId
        );

        if (!foundCase) {
            return;
        }

        setEditingCase(foundCase as unknown as CaseItem);
        setEditCaseModalOpen(true);
    }, [searchParams, loading, cases]);

    const clearCaseSearchParam = useCallback(() => {
        const params = new URLSearchParams(searchParams.toString());

        params.delete("case");

        const queryString = params.toString();

        router.replace(
            queryString
                ? `${pathname}?${queryString}`
                : pathname,
            { scroll: false }
        );
    }, [pathname, router, searchParams]);

    const handleDeleteCase = useCallback(
        async (item: Case) => {
            const id = Number(item.id);

            if (!id) return;

            try {
                setDeletingId(id);

                await axiosInstance.delete(
                    `/tasks/api/v1/cases/${id}/delete/`
                );

                setCases((prev) =>
                    prev.filter((c) => Number(c.id) !== id)
                );
            } catch (err) {
                console.error(err);
                await fetchData();
            } finally {
                setDeletingId(null);
            }
        },
        [fetchData]
    );

    const handleEditCase = useCallback((item: Case) => {
        setEditingCase(item as unknown as CaseItem);
        setEditCaseModalOpen(true);
    }, []);

    const handleCaseUpdate = useCallback(() => {
        fetchData();
        setEditCaseModalOpen(false);
        setEditingCase(null);
        clearCaseSearchParam();
    }, [fetchData, clearCaseSearchParam]);

    const handleCloseEditCaseModal = useCallback(() => {
        setEditCaseModalOpen(false);
        setEditingCase(null);
        clearCaseSearchParam();
    }, [clearCaseSearchParam]);

    const handleDeleteTask = useCallback(async (taskId: number) => {
        try {
            setDeletingTaskId(taskId);

            await axiosInstance.delete(
                `/tasks/api/v1/tasks/${taskId}/delete/`
            );

            setTasks((prev) =>
                prev.filter((t) => t.id !== taskId)
            );

            return Promise.resolve();
        } catch (err) {
            console.error(err);
            throw err;
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

    const tasksByCase = useMemo(() => {
        const map = new Map<number, TaskItem[]>();

        tasks.forEach((task) => {
            const caseId =
                task.case && typeof task.case === "object"
                    ? task.case.id
                    : task.case;

            if (caseId) {
                const id = Number(caseId);

                if (!map.has(id)) {
                    map.set(id, []);
                }

                map.get(id)!.push(task);
            }
        });

        return map;
    }, [tasks]);

    const selectedCaseTasks = useMemo(() => {
        if (!selectedCaseForTasks) return [];

        return (
            tasksByCase.get(Number(selectedCaseForTasks.id)) || []
        );
    }, [selectedCaseForTasks, tasksByCase]);

    return (
        <div
            className="flex flex-col gap-5 p-3 sm:p-4 md:p-6"
            dir="rtl"
        >
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex items-start gap-3">
                    <div
                        className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl"
                        style={{
                            background: isDark
                                ? "rgba(99,102,241,0.14)"
                                : "rgba(99,102,241,0.08)",
                        }}
                    >
                        <ClipboardList
                            size={18}
                            className="text-indigo-500"
                        />
                    </div>

                    <div className="min-w-0">
                        <h1 className="text-[15px] font-extrabold text-gray-900 dark:text-white">
                            پرونده‌ها
                        </h1>

                        <p className="mt-0.5 text-[11.5px] text-gray-500 dark:text-gray-400">
                            {loading
                                ? "در حال بارگذاری..."
                                : `${cases.length} پرونده و ${tasks.length} وظیفه در سیستم`}
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

            {loading && (
                <div className="flex flex-col items-center justify-center gap-3 py-16">
                    <Loader
                        size={24}
                        className="animate-spin text-indigo-500"
                    />

                    <p className="text-[12.5px] text-gray-500 dark:text-gray-400">
                        در حال دریافت لیست پرونده‌ها...
                    </p>
                </div>
            )}

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

            {!loading && cases.length > 0 && (
                <motion.div
                    layout
                    className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-3"
                >
                    <AnimatePresence mode="popLayout">
                        {cases.map((item, i) => {
                            const caseTasks =
                                tasksByCase.get(Number(item.id)) || [];

                            return (
                                <div
                                    key={item.id}
                                    className="relative flex flex-col gap-2 rounded-4xl border-2 border-[#eeeeee] p-3 dark:border-white/[0.06]"
                                >
                                    <div className="relative">
                                        <CaseCard
                                            item={
                                                item as unknown as CaseItem
                                            }
                                            index={i}
                                            customers={customers}
                                            departments={departments}
                                            users={employees}
                                            isDeleting={
                                                deletingId ===
                                                Number(item.id)
                                            }
                                            hasActiveTasks={
                                                caseTasks.length > 0
                                            }
                                            onDelete={() =>
                                                handleDeleteCase(item)
                                            }
                                        />

                                        <button
                                            type="button"
                                            onClick={() =>
                                                handleEditCase(item)
                                            }
                                            className="absolute left-3 top-3 flex h-7 w-7 items-center justify-center rounded-xl transition-colors"
                                            title="ویرایش پرونده"
                                            style={{
                                                background:
                                                    "rgba(99, 102, 241, 0.07)",
                                                color: "rgb(99, 102, 241)",
                                            }}
                                        >
                                            <Pencil
                                                size={11}
                                                strokeWidth={2}
                                            />
                                        </button>
                                    </div>

                                    <button
                                        type="button"
                                        onClick={() =>
                                            handleOpenTasksModal(
                                                item as unknown as CaseItem
                                            )
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

            <CreateCaseModal
                open={caseModalOpen}
                onClose={() => setCaseModalOpen(false)}
                onCreated={fetchData}
                customers={customers}
            />

            <EditCaseModal
                isOpen={editCaseModalOpen}
                caseItem={editingCase}
                onClose={handleCloseEditCaseModal}
                onSuccess={handleCaseUpdate}
            />

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
