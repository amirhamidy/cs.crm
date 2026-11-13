"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { CalendarClock, Clock, Loader2, Ticket as TicketIcon, UserRound } from "lucide-react";
import { useTheme } from "next-themes";
import api from "@/lib/axiosInstance";
import { fetchAllPages, fetchPage } from "@/lib/api/_core";
import { toJalali, toPersianDigits, JALALI_MONTHS, pad2 } from "@/lib/jalali";

interface Task {
    id: number;
    title: string;
    current_step: number | null;
    current_step_name?: string | null;
    assigned_employee?: number[];
    status: string;
}

interface Employee {
    id: number;
    username?: string;
    full_name?: string;
}

interface ExpiredTask extends Task {
    deadline: string;
    started_at: string | null;
    kind: "task" | "ticket";
    assigneeNames?: string[];
}

interface RawTicket {
    id: number;
    title?: string | null;
    status?: string | null;
    active?: boolean;
    started_at?: string | null;
    deadline?: string | { deadline?: string | null; started_at?: string | null } | null;
    assigned_to?: Array<{ id: number; full_name?: string; username?: string } | number> | null;
}

function ticketDeadline(ticket: RawTicket): { deadline: string | null; started_at: string | null } {
    const value = ticket.deadline;

    if (value && typeof value === "object") {
        return {
            deadline: value.deadline ?? null,
            started_at: value.started_at ?? ticket.started_at ?? null,
        };
    }

    return { deadline: value || null, started_at: ticket.started_at ?? null };
}


async function mapLimit<T, R>(
    items: T[],
    limit: number,
    mapper: (item: T) => Promise<R>,
): Promise<R[]> {
    const results = new Array<R>(items.length);
    let cursor = 0;

    const worker = async () => {
        while (cursor < items.length) {
            const index = cursor++;
            results[index] = await mapper(items[index]);
        }
    };

    await Promise.all(
        Array.from({ length: Math.min(limit, items.length) }, worker),
    );

    return results;
}

async function fetchAll<T>(url: string, signal: AbortSignal): Promise<T[]> {
    return fetchAllPages<T>((params) =>
        fetchPage<T>(url, { ...params, page_size: 100 }, signal, "low"),
    );
}

function formatDate(value: string) {
    const date = new Date(value);
    const [jy, jm, jd] = toJalali(date.getFullYear(), date.getMonth() + 1, date.getDate());
    return `${toPersianDigits(jd)} ${JALALI_MONTHS[jm - 1]} ${toPersianDigits(jy)} ساعت ${toPersianDigits(pad2(date.getHours()))}:${toPersianDigits(pad2(date.getMinutes()))}`;
}

function getEmployeeName(id: number, employees: Employee[]) {
    const employee = employees.find((item) => item.id === id);
    return employee?.full_name || employee?.username || `کارمند ${id}`;
}

export default function MyTaskDeadlines() {
    const { resolvedTheme } = useTheme();
    const isDark = resolvedTheme === "dark";
    const [tasks, setTasks] = useState<ExpiredTask[]>([]);
    const [employees, setEmployees] = useState<Employee[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const controller = new AbortController();
        const { signal } = controller;
        let cancelled = false;

        async function load() {
            try {
                const [source, employeeSource, ticketSource] = await Promise.all([
                    fetchAll<Task>("/tasks/api/v1/tasks/", signal),
                    fetchAll<Employee>("/accounts/api/v1/employee/list/", signal),
                    fetchAll<RawTicket>("/tasks/api/v1/internal_task/", signal).catch((error) => {
                        if (signal.aborted) throw error;
                        return [] as RawTicket[];
                    }),
                ]);

                const activeTasks = source.filter((task) => task.current_step);
                const results = await mapLimit<Task, ExpiredTask | null>(activeTasks, 4, async (task): Promise<ExpiredTask | null> => {
                    try {
                        const { data } = await api.get(
                            `/tasks/api/v1/tasks/${task.id}/steps/${task.current_step}/deadline/`,
                            { signal, priority: "low" },
                        );

                        if (!data?.deadline || new Date(data.deadline).getTime() >= Date.now()) {
                            return null;
                        }

                        return {
                            ...task,
                            deadline: data.deadline,
                            started_at: data.started_at ?? null,
                            kind: "task",
                        };
                    } catch (error) {
                        if (signal.aborted) throw error;
                        return null;
                    }
                });

                const expiredTickets: ExpiredTask[] = [];

                for (const ticket of ticketSource) {
                    if (ticket.status === "completed" || ticket.status === "cancelled") continue;
                    if (ticket.active === false) continue;

                    const { deadline, started_at } = ticketDeadline(ticket);

                    if (!deadline || new Date(deadline).getTime() >= Date.now()) continue;

                    const assignees = Array.isArray(ticket.assigned_to) ? ticket.assigned_to : [];

                    expiredTickets.push({
                        id: ticket.id,
                        title: ticket.title ?? "",
                        current_step: null,
                        status: ticket.status ?? "",
                        assigned_employee: assignees.map((a) => (typeof a === "object" ? a.id : a)),
                        assigneeNames: assignees.map((a) =>
                            typeof a === "object" ? a.full_name || a.username || `کاربر ${a.id}` : `کاربر ${a}`,
                        ),
                        deadline,
                        started_at,
                        kind: "ticket",
                    });
                }

                if (!cancelled) {
                    setTasks(
                        [
                            ...results.filter((task): task is ExpiredTask => task !== null),
                            ...expiredTickets,
                        ]
                            .sort((a, b) => new Date(a.deadline).getTime() - new Date(b.deadline).getTime())
                    );
                    setEmployees(employeeSource);
                }
            } catch {
                if (!cancelled) {
                    setTasks([]);
                    setEmployees([]);
                }
            } finally {
                if (!cancelled) setLoading(false);
            }
        }

        void load();

        return () => {
            cancelled = true;
            controller.abort();
        };
    }, []);

    return (
        <motion.section
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="rounded-[1.5rem] border p-4 sm:p-5"
            style={{
                borderColor: isDark ? "rgba(255,255,255,.06)" : "rgba(0,0,0,.06)",
                background: isDark ? "rgba(255,255,255,.02)" : "#fff",
            }}
            dir="rtl"
        >
            <div className="mb-4 flex items-center justify-between gap-3">
                <div className="flex items-center gap-2.5">
                    <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-red-500/10 text-red-400">
                        <CalendarClock size={17} />
                    </div>
                    <div>
                        <h2 className="text-[13px] font-extrabold text-gray-900 dark:text-white">
                            تسک‌ها و تیکت‌های دارای Deadline گذشته
                        </h2>
                        <p className="mt-0.5 text-[10.5px] text-gray-400">
                            وظایفی که مهلت انجام آن‌ها به پایان رسیده است
                        </p>
                    </div>
                </div>

                <span className="rounded-xl bg-red-500/10 px-2.5 py-1 text-[10px] font-bold text-red-400">
                    {tasks.length.toLocaleString("fa-IR")} مورد
                </span>
            </div>

            {loading ? (
                <div className="flex min-h-32 items-center justify-center gap-2 text-[11px] font-semibold text-gray-400">
                    <Loader2 size={16} className="animate-spin" />
                    در حال بررسی Deadlineها...
                </div>
            ) : !tasks.length ? (
                <div className="flex min-h-32 items-center justify-center rounded-2xl border border-dashed border-gray-200 text-[11px] font-semibold text-gray-400 dark:border-white/[0.06]">
                    هیچ تسک یا تیکتی با Deadline گذشته وجود ندارد.
                </div>
            ) : (
                <div className="grid gap-2.5">
                    {tasks.map((task, index) => (
                        <motion.div
                            key={`${task.kind}-${task.id}`}
                            initial={{ opacity: 0, y: 6 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: index * 0.025 }}
                            className="rounded-2xl border border-red-500/15 bg-red-500/[0.035] p-3.5"
                        >
                            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                                <div className="min-w-0">
                                    <div className="flex flex-wrap items-center gap-2">
                                        {task.kind === "ticket" && (
                                            <span
                                                title="تیکت"
                                                className="flex h-5 w-5 shrink-0 items-center justify-center rounded-md bg-indigo-500/10 text-indigo-400"
                                            >
                                                <TicketIcon size={12} />
                                            </span>
                                        )}
                                        <h3 className="truncate text-[12px] font-extrabold text-gray-900 dark:text-white">
                                            {task.title}
                                        </h3>
                                        <span className="rounded-full border border-red-500/20 bg-red-500/10 px-2 py-0.5 text-[9px] font-bold text-red-400">
                                            منقضی شده
                                        </span>
                                    </div>

                                    <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1.5">
                                        {task.assigned_employee?.map((id, i) => (
                                            <span
                                                key={id}
                                                className="flex items-center gap-1.5 text-[10px] font-bold text-gray-500 dark:text-gray-400"
                                            >
                                                <UserRound size={11} className="text-indigo-400" />
                                                {task.kind === "ticket"
                                                    ? task.assigneeNames?.[i] ?? `کاربر ${id}`
                                                    : getEmployeeName(id, employees)}
                                            </span>
                                        ))}

                                        {task.current_step_name && (
                                            <span className="text-[10px] font-semibold text-gray-400">
                                                مرحله: {task.current_step_name}
                                            </span>
                                        )}
                                    </div>
                                </div>

                                <div className="shrink-0 text-[10px] font-bold sm:text-left">
                                    {task.started_at && (
                                        <div className="mb-1 text-gray-400">
                                            شروع: {formatDate(task.started_at)}
                                        </div>
                                    )}
                                    <div className="text-red-400">
                                        <Clock size={11} className="mr-1 inline" />
                                        مهلت: {formatDate(task.deadline)}
                                    </div>
                                </div>
                            </div>
                        </motion.div>
                    ))}
                </div>
            )}
        </motion.section>
    );
}