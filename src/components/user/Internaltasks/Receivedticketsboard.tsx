"use client";

import { useEffect, useMemo, useState } from "react";
import {
    Inbox,
    LayoutGrid,
    Loader,
} from "lucide-react";
import { useCurrentEmployee } from "@/hooks/usecurrentemployee";
import { fetchInternalTasks } from "./Api";
import type {
    EmployeeListItem,
    InternalTask,
    InternalTaskStatus,
} from "./types";
import ReceivedTaskCard from "./Receivedtaskcard";
import api from "@/lib/axiosInstance";

function normalizeDateValue(
    value: unknown,
): string | null {
    if (!value) return null;

    if (typeof value === "string") {
        return value.trim() || null;
    }

    if (
        value instanceof Date &&
        !Number.isNaN(value.getTime())
    ) {
        return value.toISOString();
    }

    return null;
}

function normalizeTask(
    item: unknown,
): InternalTask | null {
    if (
        !item ||
        typeof item !== "object"
    ) {
        return null;
    }

    const task =
        item as Partial<InternalTask>;

    const id = Number(task.id);

    if (
        !Number.isFinite(id) ||
        id <= 0
    ) {
        return null;
    }

    const status: InternalTaskStatus =
        task.status === "in_progress" ||
        task.status === "completed" ||
        task.status === "cancelled"
            ? task.status
            : "in_progress";

    return {
        id,
        title:
            typeof task.title ===
            "string"
                ? task.title
                : "",
        description:
            typeof task.description ===
            "string"
                ? task.description
                : "",
        status,
        created_by:
            typeof task.created_by ===
            "string"
                ? task.created_by.trim()
                : "",
        created_at:
            typeof task.created_at ===
                "string" &&
            task.created_at.trim()
                ? task.created_at
                : new Date().toISOString(),
        updated_at:
            typeof task.updated_at ===
            "string"
                ? task.updated_at
                : new Date().toISOString(),
        started_at:
            normalizeDateValue(
                task.started_at,
            ),
        deadline:
            normalizeDateValue(
                task.deadline,
            ),
        completed_at:
            typeof task.completed_at ===
                "string" ||
            task.completed_at === null
                ? task.completed_at
                : null,
        assigned_to:
            Array.isArray(
                task.assigned_to,
            )
                ? task.assigned_to
                : [],
        attachments:
            Array.isArray(
                task.attachments,
            )
                ? task.attachments
                : [],
    };
}

function normalizeTasks(
    data: unknown,
): InternalTask[] {
    if (!Array.isArray(data)) {
        return [];
    }

    const map =
        new Map<
            number,
            InternalTask
        >();

    data.forEach((item) => {
        const task =
            normalizeTask(item);

        if (task) {
            map.set(task.id, task);
        }
    });

    return Array.from(
        map.values(),
    );
}

function getEmployeeId(
    employee: unknown,
) {
    if (
        !employee ||
        typeof employee !==
            "object"
    ) {
        return null;
    }

    const id = Number(
        (
            employee as {
                id?: unknown;
            }
        ).id,
    );

    return Number.isFinite(id) &&
        id > 0
        ? id
        : null;
}

export default function ReceivedTicketsBoard() {
    const {
        employee,
        loading: employeeLoading,
    } = useCurrentEmployee();

    const [tasks, setTasks] =
        useState<InternalTask[]>(
            [],
        );

    const [employees, setEmployees] =
        useState<
            EmployeeListItem[]
        >([]);

    const [loading, setLoading] =
        useState(true);

    const [error, setError] =
        useState<string | null>(
            null,
        );

    const currentEmployeeId =
        getEmployeeId(employee);

    const loadTasks = async () => {
        try {
            setLoading(true);
            setError(null);

            const [
                tasksResponse,
                employeesResponse,
            ] = await Promise.all([
                fetchInternalTasks(),
                api.get(
                    "/accounts/api/v1/employee/list/",
                ),
            ]);

            setTasks(
                normalizeTasks(
                    tasksResponse.data,
                ),
            );

            const employeeData =
                employeesResponse.data?.data ??
                employeesResponse.data;

            setEmployees(
                Array.isArray(
                    employeeData,
                )
                    ? employeeData.filter(
                          (
                              item,
                          ): item is EmployeeListItem =>
                              Boolean(
                                  item &&
                                  typeof item.id ===
                                      "number" &&
                                  typeof item.username ===
                                      "string" &&
                                  typeof item.full_name ===
                                      "string" &&
                                  item.full_name.trim(),
                              ),
                      )
                    : [],
            );
        } catch {
            setTasks([]);
            setEmployees([]);
            setError(
                "دریافت تیکت‌ها با خطا مواجه شد.",
            );
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        void loadTasks();
    }, []);

    const employeeByUsername =
        useMemo(
            () =>
                new Map(
                    employees.map(
                        (employee) => [
                            employee.username.trim(),
                            employee.full_name.trim(),
                        ],
                    ),
                ),
            [employees],
        );

    const employeeById =
        useMemo(
            () =>
                new Map(
                    employees.map(
                        (employee) => [
                            Number(
                                employee.id,
                            ),
                            employee.full_name.trim(),
                        ],
                    ),
                ),
            [employees],
        );

    const receivedTasks =
        useMemo(() => {
            if (
                !currentEmployeeId
            ) {
                return [];
            }

            return tasks
                .filter(
                    (task) =>
                        Array.isArray(
                            task.assigned_to,
                        ) &&
                        task.assigned_to.some(
                            (
                                assignedUser,
                            ) =>
                                Number(
                                    assignedUser?.id,
                                ) ===
                                currentEmployeeId,
                        ),
                )
                .map(
                    (task) => ({
                        ...task,
                        created_by:
                            employeeByUsername.get(
                                task.created_by.trim(),
                            ) || "",
                        assigned_to:
                            task.assigned_to
                                .map(
                                    (
                                        assignedUser,
                                    ) => {
                                        const fullName =
                                            employeeById.get(
                                                Number(
                                                    assignedUser.id,
                                                ),
                                            );

                                        if (
                                            !fullName
                                        ) {
                                            return null;
                                        }

                                        return {
                                            id: Number(
                                                assignedUser.id,
                                            ),
                                            full_name:
                                                fullName,
                                        };
                                    },
                                )
                                .filter(
                                    (
                                        item,
                                    ): item is {
                                        id: number;
                                        full_name: string;
                                    } =>
                                        item !==
                                        null,
                                ),
                    }),
                );
        }, [
            tasks,
            currentEmployeeId,
            employeeByUsername,
            employeeById,
        ]);

    const handleUpdated = (
        updatedTask: InternalTask,
    ) => {
        const normalized =
            normalizeTask(
                updatedTask,
            );

        if (!normalized) return;

        setTasks(
            (previous) =>
                previous.map(
                    (task) =>
                        task.id ===
                        normalized.id
                            ? {
                                  ...task,
                                  ...normalized,
                                  created_at:
                                      task.created_at,
                              }
                            : task,
                ),
        );
    };

    if (
        loading ||
        employeeLoading
    ) {
        return (
            <div className="flex h-64 items-center justify-center">
                <Loader
                    size={22}
                    className="animate-spin text-indigo-500"
                />
            </div>
        );
    }

    return (
        <div
            dir="rtl"
            className="flex flex-col gap-5"
        >
            <div className="flex items-center gap-2.5">
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-2xl bg-indigo-500/10">
                    <Inbox
                        size={17}
                        className="text-indigo-500"
                    />
                </div>

                <div>
                    <h3 className="text-[14px] font-extrabold text-gray-900 dark:text-white">
                        تیکت‌های دریافت شده
                    </h3>

                    <p className="text-[11px] text-gray-400 dark:text-gray-600">
                        {
                            receivedTasks.length
                        }{" "}
                        تیکت
                    </p>
                </div>
            </div>

            {error && (
                <div className="flex items-center justify-between gap-3 rounded-2xl border border-red-500/20 bg-red-500/5 px-4 py-3">
                    <p className="text-[12px] font-semibold text-red-500">
                        {error}
                    </p>

                    <button
                        type="button"
                        onClick={() =>
                            void loadTasks()
                        }
                        className="rounded-xl bg-red-500/10 px-3 py-1.5 text-[11px] font-bold text-red-500 transition-colors hover:bg-red-500/20"
                    >
                        تلاش مجدد
                    </button>
                </div>
            )}

            {receivedTasks.length ===
            0 ? (
                <div className="flex h-64 flex-col items-center justify-center gap-3 rounded-3xl border border-dashed border-gray-200 dark:border-white/[0.07]">
                    <LayoutGrid
                        size={28}
                        className="text-gray-300 dark:text-gray-700"
                    />

                    <p className="text-[12px] text-gray-400">
                        تیکتی به شما ارجاع نشده است.
                    </p>
                </div>
            ) : (
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-3">
                    {receivedTasks.map(
                        (task) => (
                            <ReceivedTaskCard
                                key={
                                    task.id
                                }
                                task={
                                    task
                                }
                                onUpdated={
                                    handleUpdated
                                }
                            />
                        ),
                    )}
                </div>
            )}
        </div>
    );
}