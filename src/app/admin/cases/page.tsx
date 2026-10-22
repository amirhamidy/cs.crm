"use client";

import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { ClipboardList, Loader, Plus, RefreshCw } from "lucide-react";
import { useTheme } from "next-themes";
import axiosInstance from "@/lib/axiosInstance";
import { apiRoutes } from "@/lib/apiRoutes";
import { casesApi, customersApi } from "@/lib/api";
import { extractCaseId, fetchAllTasks } from "@/lib/fetchAllTasks";
import type { Department } from "@/types/department";
import type { Employee } from "@/types/employee";
import type { TaskItem } from "@/types/task";
import type { CaseItem } from "@/types/case";
import type { Customer } from "@/types/customer";
import CreateCaseModal from "@/components/user/cases/CreateCaseModal";
import EditCaseModal from "@/components/user/cases/EditCaseModal";
import CaseCard from "@/components/user/cases/CaseCard";
import EditTaskModal from "@/components/customcomponents/tasks/EditTaskModal";
import CaseTasksModal from "@/components/customcomponents/cases/CaseTasksModal";
import Pagination from "@/components/ui/Pagination";

type ListResponse<T> = T[] | { results?: T[]; data?: T[] };

function extractList<T>(data: ListResponse<T> | undefined | null): T[] {
    if (Array.isArray(data)) return data;
    if (data && typeof data === "object") {
        if (Array.isArray(data.results)) return data.results;
        if (Array.isArray(data.data)) return data.data;
    }
    return [];
}

const PAGE_SIZE = 12;

export default function UserCasesPage() {
    const { resolvedTheme } = useTheme();
    const isDark = resolvedTheme === "dark";

    const [cases, setCases] = useState<CaseItem[]>([]);
    const [totalCount, setTotalCount] = useState(0);
    const [page, setPage] = useState(1);
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
    const [tasksRefreshKey, setTasksRefreshKey] = useState(0);

    const requestId = useRef(0);
    const totalPages = Math.max(1, Math.ceil(totalCount / PAGE_SIZE));

    /* ───────── data ───────── */

    const fetchCases = useCallback(
        async (opts: { silent?: boolean } = {}) => {
            const id = ++requestId.current;
            if (!opts.silent) setLoading(true);
            setError("");

            try {
                const data = await casesApi.list({
                    page,
                    page_size: PAGE_SIZE,
                });
                const caseList = data.results;

                const customerIds = [...new Set(caseList.map((c) => Number(c.customer)))];

                const [detailed, pageCustomers] = await Promise.all([
                    Promise.all(
                        caseList.map(async (item) => {
                            try {
                                const detail = await casesApi.get(Number(item.id));
                                return { ...item, ...detail };
                            } catch {
                                return item;
                            }
                        })
                    ),
                    customersApi.getMany(customerIds),
                ]);

                if (id !== requestId.current) return;

                setCases(detailed);
                setCustomers(pageCustomers);
                setTotalCount(data.count);
            } catch {
                if (id !== requestId.current) return;
                setError("دریافت اطلاعات با خطا مواجه شد");
            } finally {
                if (id === requestId.current) setLoading(false);
            }
        },
        [page]
    );

    const fetchTasks = useCallback(async () => {
        try {
            setTasks(await fetchAllTasks());
        } catch {
            /* وظایف مکمل‌اند */
        }
    }, []);

    const fetchMeta = useCallback(async () => {
        try {
            const [departmentsRes, employeesRes] = await Promise.all([
                axiosInstance.get<ListResponse<Department>>(apiRoutes.departments),
                axiosInstance.get<ListResponse<Employee>>(
                    "/accounts/api/v1/employee/list/"
                ),
            ]);
            setDepartments(extractList(departmentsRes.data));
            setEmployees(extractList(employeesRes.data));
        } catch {
            /* مکمل */
        }
    }, []);

    useEffect(() => {
        fetchCases();
    }, [fetchCases]);

    useEffect(() => {
        fetchMeta();
        fetchTasks();
    }, [fetchMeta, fetchTasks]);

    const refreshAll = useCallback(() => {
        fetchCases();
        fetchTasks();
    }, [fetchCases, fetchTasks]);

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

    const syncCaseTasks = useCallback((caseId: string, fresh: TaskItem[]) => {
        setTasks((prev) => [
            ...prev.filter((t) => extractCaseId(t) !== caseId),
            ...fresh,
        ]);
    }, []);

    /* ───────── handlers ───────── */

    const handleDeleteCase = useCallback(
        async (item: CaseItem) => {
            const id = Number(item.id);
            if (!id) return;

            const freshTasks = await fetchAllTasks({ caseId: item.id });
            if (freshTasks.length > 0) {
                syncCaseTasks(String(item.id), freshTasks);
                throw new Error("این پرونده هنوز وظیفه دارد");
            }

            try {
                setDeletingId(id);
                await casesApi.remove(id);

                // آخرین آیتم صفحه حذف شد → یه صفحه برگرد
                if (cases.length === 1 && page > 1) {
                    setPage((p) => p - 1);
                } else {
                    fetchCases({ silent: true });
                }
            } catch {
                await fetchCases({ silent: true });
                throw new Error("خطا در حذف پرونده");
            } finally {
                setDeletingId(null);
            }
        },
        [cases.length, page, fetchCases, syncCaseTasks]
    );

    const handleEditCase = useCallback((item: CaseItem) => {
        setEditingCase(item);
        setEditCaseModalOpen(true);
    }, []);

    const handleCaseUpdate = useCallback(() => {
        fetchCases({ silent: true });
        setEditCaseModalOpen(false);
        setEditingCase(null);
    }, [fetchCases]);

    const handleCaseCreated = useCallback(() => {
        // پرونده جدید بالای لیسته، پس برو صفحه اول
        if (page !== 1) setPage(1);
        else fetchCases({ silent: true });
    }, [page, fetchCases]);

    const handleDeleteTask = useCallback(async (taskId: number) => {
        try {
            setDeletingTaskId(taskId);
            await axiosInstance.delete(`/tasks/api/v1/tasks/${taskId}/delete/`);
            setTasks((prev) => prev.filter((t) => t.id !== taskId));
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
        fetchCases({ silent: true });
        fetchTasks();
        setTasksRefreshKey((k) => k + 1);
        setEditTaskModalOpen(false);
        setEditingTask(null);
    }, [fetchCases, fetchTasks]);

    const handleOpenTasksModal = useCallback((item: CaseItem) => {
        setSelectedCaseForTasks(item);
        setTasksModalOpen(true);
    }, []);

    const goToPage = (p: number) => {
        if (p < 1 || p > totalPages || p === page) return;
        setPage(p);
        window.scrollTo({ top: 0, behavior: "smooth" });
    };

    /* ───────── render ───────── */

    return (
        <div className="flex flex-col gap-5 p-3 sm:p-4 md:p-6" dir="rtl">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex items-start gap-3">
                    <div className="min-w-0">
                        <h1 className="text-[15px] font-extrabold text-gray-900 dark:text-white">
                            پرونده‌ها
                        </h1>
                        <p className="mt-0.5 text-[11.5px] text-gray-500 dark:text-gray-400">
                            {loading
                                ? "در حال بارگذاری..."
                                : `${totalCount} پرونده و ${tasks.length} وظیفه`}
                        </p>
                    </div>
                </div>

                <div className="flex items-center gap-2">
                    <button
                        onClick={refreshAll}
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
                        onClick={() => fetchCases()}
                        type="button"
                        className="rounded-xl bg-rose-600 px-3 py-1.5 text-[11.5px] font-bold text-white transition-colors hover:bg-rose-500"
                    >
                        تلاش مجدد
                    </button>
                </div>
            )}

            {loading && (
                <div className="flex flex-col items-center justify-center gap-3 py-16">
                    <Loader size={24} className="animate-spin text-indigo-500" />
                    <p className="text-[12.5px] text-gray-500 dark:text-gray-400">
                        در حال دریافت لیست پرونده‌ها...
                    </p>
                </div>
            )}

            {!loading && !error && cases.length === 0 && (
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
                    key={`grid-${page}`}
                    className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-3"
                >
                    <AnimatePresence mode="popLayout">
                        {cases.map((item, i) => {
                            const caseTasks =
                                tasksByCase.get(String(item.id)) ?? [];
                            return (
                                <CaseCard
                                    key={item.id}
                                    item={item}
                                    index={i}
                                    customers={customers}
                                    departments={departments}
                                    users={employees}
                                    isDeleting={deletingId === Number(item.id)}
                                    hasActiveTasks={caseTasks.length > 0}
                                    caseTasks={caseTasks}
                                    onEdit={handleEditCase}
                                    onDelete={() => handleDeleteCase(item)}
                                    onClick={() => handleOpenTasksModal(item)}
                                />
                            );
                        })}
                    </AnimatePresence>
                </motion.div>
            )}

            {!loading && totalPages > 1 && (
                <Pagination
                    page={page}
                    totalPages={totalPages}
                    onChange={goToPage}
                />
            )}

            {/* دیگه prop مشتری‌ها به CreateCaseModal داده نمیشه */}
            <CreateCaseModal
                open={caseModalOpen}
                onClose={() => setCaseModalOpen(false)}
                onCreated={handleCaseCreated}
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

            <CaseTasksModal
                isOpen={tasksModalOpen}
                onClose={() => {
                    setTasksModalOpen(false);
                    setSelectedCaseForTasks(null);
                }}
                caseItem={selectedCaseForTasks}
                employees={employees}
                refreshKey={tasksRefreshKey}
                onEditTask={handleEditTask}
                onDeleteTask={handleDeleteTask}
                deletingTaskId={deletingTaskId}
                onTasksLoaded={syncCaseTasks}
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
        </div>
    );
}