"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Loader2, RefreshCw, Search, UserPlus, Users } from "lucide-react";
import { useTheme } from "next-themes";
import type { AxiosError } from "axios";

import axiosInstance from "@/lib/axiosInstance";
import UserCard from "@/components/admin/users/UserCard";
import AddUserModal from "@/components/admin/users/AddUserPage";
import type { ApiEmployee } from "@/types/users";

interface TaskItem {
    id: number;
    assigned_employee?:
        | number
        | string
        | { id: number | string }
        | Array<number | string | { id: number | string }>
        | null;
}

interface InternalTaskItem {
    id: number;
    assigned_to?:
        | number
        | string
        | { id: number | string }
        | Array<number | string | { id: number | string }>
        | null;
    created_by?: string | null;
}

type TasksResponse = TaskItem[] | { results?: TaskItem[] };
type InternalTasksResponse = InternalTaskItem[] | { results?: InternalTaskItem[] };

const extractEmployeeIds = (
    value:
        | number
        | string
        | { id: number | string }
        | Array<number | string | { id: number | string }>
        | null
        | undefined,
): number[] => {
    if (!value) return [];

    if (Array.isArray(value)) {
        return value
            .map((item) => {
                if (typeof item === "object" && item !== null) {
                    return Number(item.id);
                }
                return Number(item);
            })
            .filter((id) => !Number.isNaN(id));
    }

    if (typeof value === "object") {
        const id = Number(value.id);
        return Number.isNaN(id) ? [] : [id];
    }

    const id = Number(value);
    return Number.isNaN(id) ? [] : [id];
};

export default function UsersPage() {
    const { resolvedTheme } = useTheme();
    const isDark = resolvedTheme === "dark";

    const [employees, setEmployees] = useState<ApiEmployee[]>([]);
    const [employeesWithTasks, setEmployeesWithTasks] = useState<Set<number>>(new Set());
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [search, setSearch] = useState("");
    const [showAddModal, setShowAddModal] = useState(false);

    const fetchData = useCallback(async () => {
        setLoading(true);
        setError("");

        try {
            const [employeesRes, tasksRes, internalTasksRes] = await Promise.all([
                axiosInstance.get<ApiEmployee[]>("/accounts/api/v1/employee/list/"),
                axiosInstance
                    .get<TasksResponse>("/tasks/api/v1/tasks/")
                    .catch(() => ({ data: [] as TaskItem[] })),
                axiosInstance
                    .get<InternalTasksResponse>("/tasks/api/v1/internal-tasks/")
                    .catch(() => ({ data: [] as InternalTaskItem[] })),
            ]);

            const employeeList = Array.isArray(employeesRes.data) ? employeesRes.data : [];
            setEmployees(employeeList);

            const usernameToId = new Map<string, number>();
            for (const emp of employeeList) {
                if (emp.username) {
                    usernameToId.set(emp.username.trim().toLowerCase(), emp.id);
                }
            }

            const tasksData = tasksRes.data;
            const tasks = Array.isArray(tasksData) ? tasksData : tasksData?.results ?? [];

            const internalTasksData = internalTasksRes.data;
            const internalTasks = Array.isArray(internalTasksData)
                ? internalTasksData
                : internalTasksData?.results ?? [];

            const taskOwnerIds = new Set<number>();

            for (const task of tasks) {
                const ids = extractEmployeeIds(task.assigned_employee);
                for (const id of ids) {
                    taskOwnerIds.add(id);
                }
            }

            for (const task of internalTasks) {
                const ids = extractEmployeeIds(task.assigned_to);
                for (const id of ids) {
                    taskOwnerIds.add(id);
                }

                const createdByUsername = task.created_by?.trim().toLowerCase();
                if (createdByUsername) {
                    const creatorId = usernameToId.get(createdByUsername);
                    if (creatorId !== undefined) {
                        taskOwnerIds.add(creatorId);
                    }
                }
            }

            setEmployeesWithTasks(taskOwnerIds);
        } catch (err) {
            const error = err as AxiosError<{ detail?: string }>;
            setError(error.response?.data?.detail ?? "خطا در دریافت لیست کاربران");
            setEmployees([]);
            setEmployeesWithTasks(new Set());
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchData();
    }, [fetchData]);

    const filteredEmployees = useMemo(() => {
        const keyword = search.trim().toLowerCase();
        if (!keyword) return employees;

        return employees.filter((employee) => {
            const fullName = employee.full_name?.toLowerCase() ?? "";
            const username = employee.username?.toLowerCase() ?? "";
            return fullName.includes(keyword) || username.includes(keyword);
        });
    }, [employees, search]);

    return (
        <div className="flex flex-col gap-5 p-3 sm:p-4 md:p-6" dir="rtl">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex items-start gap-3">
                    <div
                        className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl"
                        style={{
                            background: isDark ? "rgba(99,102,241,0.14)" : "rgba(99,102,241,0.08)",
                        }}
                    >
                        <Users size={18} className="text-indigo-500" />
                    </div>

                    <div className="min-w-0">
                        <h1 className="text-[15px] font-extrabold text-gray-900 dark:text-white">
                            مدیریت کاربران
                        </h1>
                        <p className="mt-0.5 text-[11.5px] text-gray-500 dark:text-gray-400">
                            {loading ? "در حال بارگذاری..." : `${employees.length} کاربر ثبت شده`}
                        </p>
                    </div>
                </div>

                <div className="flex items-center gap-2">
                    <button
                        type="button"
                        onClick={fetchData}
                        disabled={loading}
                        className="flex h-10 w-10 items-center justify-center rounded-2xl transition-colors disabled:opacity-50"
                        style={{
                            background: isDark ? "rgba(255,255,255,0.05)" : "rgba(15,23,42,0.05)",
                            color: isDark ? "#cbd5e1" : "#475569",
                        }}
                        title="بارگذاری مجدد"
                    >
                        <RefreshCw size={15} className={loading ? "animate-spin" : ""} />
                    </button>

                    <button
                        type="button"
                        onClick={() => setShowAddModal(true)}
                        className="flex h-10 items-center justify-center gap-2 rounded-2xl bg-indigo-600 px-4 text-[12.5px] font-bold text-white transition-colors hover:bg-indigo-700"
                    >
                        <UserPlus size={15} />
                        افزودن کاربر
                    </button>
                </div>
            </div>

            <div
                className="flex h-11 items-center gap-2 rounded-2xl px-3"
                style={{
                    background: isDark ? "rgba(255,255,255,0.04)" : "rgba(15,23,42,0.04)",
                    border: isDark ? "1px solid rgba(255,255,255,0.06)" : "1px solid rgba(15,23,42,0.06)",
                }}
            >
                <Search size={15} className="text-gray-400" />
                <input
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    placeholder="جستجو بر اساس نام یا نام کاربری"
                    className="h-full w-full bg-transparent text-[12.5px] text-gray-800 outline-none placeholder:text-gray-400 dark:text-gray-100"
                />
            </div>

            {loading && (
                <div className="flex flex-col items-center justify-center gap-3 py-16">
                    <Loader2 size={24} className="animate-spin text-indigo-500" />
                    <p className="text-[12.5px] text-gray-500 dark:text-gray-400">
                        در حال دریافت اطلاعات کاربران...
                    </p>
                </div>
            )}

            {!loading && error && (
                <div
                    className="flex flex-col items-center gap-3 rounded-3xl border py-12"
                    style={{
                        background: isDark ? "rgba(239,68,68,0.05)" : "rgba(239,68,68,0.03)",
                        borderColor: isDark ? "rgba(239,68,68,0.14)" : "rgba(239,68,68,0.1)",
                    }}
                >
                    <p className="text-[12.5px] font-semibold text-red-500">{error}</p>
                    <button
                        type="button"
                        onClick={fetchData}
                        className="text-[12px] font-bold text-indigo-500 hover:underline"
                    >
                        تلاش مجدد
                    </button>
                </div>
            )}

            {!loading && !error && filteredEmployees.length === 0 && (
                <div className="flex flex-col items-center justify-center gap-2 py-16">
                    <Users size={28} className="text-gray-300 dark:text-gray-700" />
                    <p className="text-[12.5px] text-gray-500 dark:text-gray-400">
                        {search ? "کاربری پیدا نشد" : "هنوز کاربری ثبت نشده"}
                    </p>
                </div>
            )}

            {!loading && !error && filteredEmployees.length > 0 && (
                <motion.div
                    layout
                    className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4"
                >
                    <AnimatePresence mode="popLayout">
                        {filteredEmployees.map((employee, index) => (
                            <UserCard
                                key={employee.id}
                                employee={employee}
                                index={index}
                                hasActiveTasks={employeesWithTasks.has(employee.id)}
                                onDelete={(id) => {
                                    setEmployees((prev) => prev.filter((item) => item.id !== id));
                                    setEmployeesWithTasks((prev) => {
                                        const next = new Set(prev);
                                        next.delete(id);
                                        return next;
                                    });
                                }}
                                onUpdated={(updatedEmployee) => {
                                    setEmployees((prev) =>
                                        prev.map((item) => (item.id === updatedEmployee.id ? updatedEmployee : item)),
                                    );
                                }}
                            />
                        ))}
                    </AnimatePresence>
                </motion.div>
            )}

            <AnimatePresence>
                {showAddModal && (
                    <AddUserModal
                        onClose={() => setShowAddModal(false)}
                        onSuccess={() => {
                            setShowAddModal(false);
                            fetchData();
                        }}
                    />
                )}
            </AnimatePresence>
        </div>
    );
}