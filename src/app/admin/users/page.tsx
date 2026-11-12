"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { AnimatePresence } from "framer-motion";
import { Loader2, RefreshCw, UserPlus, Users } from "lucide-react";
import { useTheme } from "next-themes";
import dynamic from "next/dynamic";
import axiosInstance from "@/lib/axiosInstance";
import UserCard from "@/components/admin/users/UserCard";
import type { UserInfo } from "@/components/admin/users/UserCard";
import type { ApiEmployee, ApiUser } from "@/types/users";
import { accountsApi, departmentsApi, internalTasksApi, scoreApi, tasksApi } from "@/lib/api";
import { usePaginatedList } from "@/hooks/usePaginatedList";
import Pagination from "@/components/ui/Pagination";

const AddUserModal = dynamic(() => import("@/components/admin/users/AddUserPage"), {
    ssr: false,
    loading: () => null,
});

const PAGE_SIZE = 20;
const GRID_CLASS =
    "grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4 [&:has(.user-card:hover)_.user-card:not(:hover)]:[filter:opacity(0.3)]";
const EMPTY_TITLES: string[] = [];

const extractEmployeeIds = (value: unknown): number[] => {
    if (!value) return [];
    if (Array.isArray(value)) {
        return value
            .map((item) => (typeof item === "object" && item !== null ? Number((item as { id?: unknown }).id) : Number(item)))
            .filter((id) => !Number.isNaN(id));
    }
    if (typeof value === "object") {
        const id = Number((value as { id?: unknown }).id);
        return Number.isNaN(id) ? [] : [id];
    }
    const id = Number(value);
    return Number.isNaN(id) ? [] : [id];
};

const getErrorDetail = (err: unknown) =>
    (err as { response?: { data?: { detail?: string } } })?.response?.data?.detail ?? "خطا در دریافت لیست کاربران";

export default function UsersPage() {
    const { resolvedTheme } = useTheme();
    const isDark = resolvedTheme === "dark";

    const list = usePaginatedList<ApiEmployee>(
        (params, signal) => accountsApi.employees.list(params, signal),
        { pageSize: PAGE_SIZE },
    );

    const [overrides, setOverrides] = useState<Map<number, ApiEmployee>>(new Map());
    const [adminUsers, setAdminUsers] = useState<ApiUser[]>([]);
    const [userInfoMap, setUserInfoMap] = useState<Map<string, UserInfo>>(new Map());
    const [scoreMap, setScoreMap] = useState<Map<number, number>>(new Map());
    const [departmentNames, setDepartmentNames] = useState<Map<number, string>>(new Map());
    const [employeesWithTasks, setEmployeesWithTasks] = useState<Set<number>>(new Set());
    const [activeTasks, setActiveTasks] = useState<Map<number, string[]>>(new Map());
    const [metaLoading, setMetaLoading] = useState(true);
    const [metaError, setMetaError] = useState("");
    const [showAddModal, setShowAddModal] = useState(false);

    const adminUsernames = useMemo(
        () => new Set(adminUsers.map((user) => user.username.trim().toLowerCase())),
        [adminUsers],
    );

    const employees = useMemo(
        () =>
            list.data
                .filter((employee) => !adminUsernames.has(employee.username.trim().toLowerCase()))
                .map((employee) => overrides.get(employee.id) ?? employee),
        [list.data, adminUsernames, overrides],
    );

    const loadMeta = useCallback(async () => {
        setMetaLoading(true);
        setMetaError("");

        try {
            const [userList, departmentEmployeeList, tasks, internalTasks] = await Promise.all([
                accountsApi.users.all(),
                departmentsApi.employees().catch(() => []),
                tasksApi.listAll().catch(() => []),
                internalTasksApi.all().catch(() => []),
            ]);

            const adminList = userList.filter((user) => Number(user.type) === 1);
            const infoMap = new Map<string, UserInfo>();

            for (const user of userList) {
                if (!user.username) continue;
                infoMap.set(user.username.trim().toLowerCase(), {
                    id: user.id,
                    phone: user.phone_number || null,
                    isActive: typeof user.is_active === "boolean" ? user.is_active : null,
                });
            }

            const departmentMap = new Map<number, string>();
            for (const item of departmentEmployeeList) {
                if (item.employee && item.department_name?.trim()) {
                    departmentMap.set(Number(item.employee), item.department_name.trim());
                }
            }

            const taskOwnerIds = new Set<number>();
            const creators = new Set<string>();
            const activeTaskMap = new Map<number, string[]>();

            for (const task of tasks) {
                const ids = extractEmployeeIds(task.assigned_employee);
                for (const id of ids) {
                    taskOwnerIds.add(id);
                    if (task.status === "in_progress") {
                        const titles = activeTaskMap.get(id) ?? [];
                        titles.push(task.title?.trim() || "بدون عنوان");
                        activeTaskMap.set(id, titles);
                    }
                }
            }

            for (const task of internalTasks) {
                for (const id of extractEmployeeIds(task.assigned_to)) taskOwnerIds.add(id);
                const username = task.created_by?.trim().toLowerCase();
                if (username) creators.add(username);
            }

            setAdminUsers(adminList);
            setUserInfoMap(infoMap);
            setDepartmentNames(departmentMap);
            setEmployeesWithTasks(taskOwnerIds);
            setActiveTasks(activeTaskMap);
        } catch (err) {
            setMetaError(getErrorDetail(err));
            setAdminUsers([]);
            setUserInfoMap(new Map());
            setDepartmentNames(new Map());
            setEmployeesWithTasks(new Set());
            setActiveTasks(new Map());
        } finally {
            setMetaLoading(false);
        }
    }, []);

    useEffect(() => {
        void loadMeta();
    }, [loadMeta]);

    useEffect(() => {
        setOverrides(new Map());
    }, [list.data]);

    useEffect(() => {
        let alive = true;
        const targets = employees.filter((employee) => employee.id && employee.type !== 1);

        Promise.allSettled(targets.map((employee) => scoreApi.employee(employee.id))).then((results) => {
            if (!alive) return;
            const next = new Map<number, number>();
            results.forEach((result, index) => {
                if (result.status !== "fulfilled") return;
                const data = result.value;
                const value =
                    typeof data?.score === "number"
                        ? data.score
                        : typeof data?.total_score === "number"
                            ? data.total_score
                            : null;
                if (value !== null) next.set(targets[index].id, value);
            });
            setScoreMap(next);
        });

        return () => {
            alive = false;
        };
    }, [employees]);

    const handleRefresh = useCallback(() => {
        accountsApi.invalidate();
        departmentsApi.invalidate();
        internalTasksApi.invalidate();
        tasksApi.invalidate();
        scoreApi.invalidate();
        list.refetch();
        void loadMeta();
    }, [list.refetch, loadMeta]);

    const handleDelete = useCallback((id: number) => {
        setDepartmentNames((prev) => {
            const next = new Map(prev);
            next.delete(id);
            return next;
        });
        setActiveTasks((prev) => {
            const next = new Map(prev);
            next.delete(id);
            return next;
        });
        setEmployeesWithTasks((prev) => {
            const next = new Set(prev);
            next.delete(id);
            return next;
        });
        list.refetch();
    }, [list.refetch]);

    const handleUpdated = useCallback((updatedEmployee: ApiEmployee) => {
        setOverrides((prev) => new Map(prev).set(updatedEmployee.id, updatedEmployee));
    }, []);

    const handleNoop = useCallback(() => undefined, []);

    const searchTerm = list.search.trim().toLowerCase();

    const visibleAdmins = useMemo(() => {
        if (list.page !== list.totalPages) return [];
        return adminUsers.filter((user) => !searchTerm || user.username.toLowerCase().includes(searchTerm));
    }, [adminUsers, list.page, list.totalPages, searchTerm]);

    const adminEmployees = useMemo<ApiEmployee[]>(
        () =>
            visibleAdmins.map((user) => ({
                id: -user.id,
                full_name: user.username,
                username: user.username,
                type: 1,
                user: user.id,
                user_id: user.id,
                created_at: user.created_at,
                updated_at: user.updated_at,
                avatar: user.avatar,
            })) as ApiEmployee[],
        [visibleAdmins],
    );

    const loading = metaLoading || (list.loading && list.data.length === 0 && !list.error);
    const error = metaError || (list.error ? getErrorDetail(list.error) : "");

    return (
        <div className="flex flex-col gap-5 p-3 sm:p-4 md:p-6" dir="rtl">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex items-start gap-3">
                    <div
                        className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl"
                        style={{ background: isDark ? "rgba(99,102,241,0.14)" : "rgba(99,102,241,0.08)" }}
                    >
                        <Users size={18} className="text-indigo-500" />
                    </div>
                    <div className="min-w-0">
                        <h1 className="text-[15px] font-extrabold text-gray-900 dark:text-white">مدیریت کاربران</h1>
                        <p className="mt-0.5 text-[11.5px] text-gray-500 dark:text-gray-400">
                            {loading ? "در حال بارگذاری..." : `${list.count + adminUsers.length} کاربر ثبت شده`}
                        </p>
                    </div>
                </div>

                <div className="flex items-center gap-2">
                    <button
                        type="button"
                        onClick={handleRefresh}
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

            <input
                value={list.search}
                onChange={(event) => list.setSearch(event.target.value)}
                placeholder="جستجوی نام کاربری یا کارمند..."
                className="w-full rounded-xl border border-gray-200 bg-white px-3.5 py-2.5 text-[12px] text-gray-700 outline-none transition-colors focus:border-indigo-400 dark:border-white/10 dark:bg-white/[0.03] dark:text-gray-200"
            />

            {loading && (
                <div className="flex flex-col items-center justify-center gap-3 py-16">
                    <Loader2 size={24} className="animate-spin text-indigo-500" />
                    <p className="text-[12.5px] text-gray-500 dark:text-gray-400">در حال دریافت اطلاعات کاربران...</p>
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
                    <button type="button" onClick={handleRefresh} className="text-[12px] font-bold text-indigo-500 hover:underline">
                        تلاش مجدد
                    </button>
                </div>
            )}

            {!loading && !error && employees.length === 0 && adminUsers.length === 0 && (
                <div className="flex flex-col items-center justify-center gap-2 py-16">
                    <Users size={28} className="text-gray-300 dark:text-gray-700" />
                    <p className="text-[12.5px] text-gray-500 dark:text-gray-400">هنوز کاربری ثبت نشده</p>
                </div>
            )}

            {!loading && !error && (employees.length > 0 || adminUsers.length > 0) && (
                <div className={GRID_CLASS}>
                    <AnimatePresence>
                        {employees.map((employee, index) => (
                            <UserCard
                                key={employee.id}
                                employee={employee}
                                departmentName={departmentNames.get(employee.id) ?? null}
                                activeTaskTitles={activeTasks.get(employee.id) ?? EMPTY_TITLES}
                                index={adminUsers.length + index}
                                hasActiveTasks={employeesWithTasks.has(employee.id)}
                                userInfo={userInfoMap.get(employee.username.trim().toLowerCase()) ?? null}
                                score={scoreMap.get(employee.id) ?? null}
                                onDelete={handleDelete}
                                onUpdated={handleUpdated}
                            />
                        ))}
                        {adminEmployees.map((adminEmployee, index) => (
                            <UserCard
                                key={`admin-${adminEmployee.id}`}
                                employee={adminEmployee}
                                departmentName="مدیریت سیستم"
                                activeTaskTitles={EMPTY_TITLES}
                                index={employees.length + index}
                                hasActiveTasks={false}
                                userInfo={userInfoMap.get(adminEmployee.username.trim().toLowerCase()) ?? null}
                                score={null}
                                onDelete={handleNoop}
                                onUpdated={handleNoop}
                            />
                        ))}
                    </AnimatePresence>
                </div>
            )}

            {list.totalPages > 1 && (
                <Pagination
                    page={list.page}
                    totalPages={list.totalPages}
                    onChange={list.setPage}
                />
            )}

            <AnimatePresence>
                {showAddModal && (
                    <AddUserModal
                        onClose={() => setShowAddModal(false)}
                        onSuccess={() => {
                            setShowAddModal(false);
                            handleRefresh();
                        }}
                    />
                )}
            </AnimatePresence>
        </div>
    );
}