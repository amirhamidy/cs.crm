"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { CalendarClock, Clock, Loader2, UserRound, AlertTriangle, CheckCircle2 } from "lucide-react";
import { useTheme } from "next-themes";
import api from "@/lib/axiosInstance";
import { fetchPage } from "@/lib/api/_core";
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

interface DeadlineInfo {
    deadline: string | null;
    started_at: string | null;
    loading?: boolean;
    error?: boolean;
}

const PAGE = 10;

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
    const [tasks, setTasks] = useState<Task[]>([]);
    const [info, setInfo] = useState<Record<number, DeadlineInfo>>({});
    const [employees, setEmployees] = useState<Employee[]>([]);
    const [loading, setLoading] = useState(true);
    const [page, setPage] = useState(1);
    const [hasNext, setHasNext] = useState(false);
    const [total, setTotal] = useState(0);

    useEffect(() => {
        let cancelled = false;
        setLoading(true);
        fetchPage<Task>("/tasks/api/v1/tasks/", { page, page_size: PAGE })
            .then((res) => {
                if (cancelled) return;
                setTasks((prev) => (page === 1 ? res.results : [...prev, ...res.results]));
                setHasNext(Boolean(res.next));
                setTotal(res.count);
            })
            .catch(() => undefined)
            .finally(() => !cancelled && setLoading(false));
        return () => {
            cancelled = true;
        };
    }, [page]);

    // اسامی کارمندان فقط یک‌بار و کش‌شده
    useEffect(() => {
        let cancelled = false;
        fetchPage<Employee>("/accounts/api/v1/employee/list/", { page_size: 100 })
            .then((r) => !cancelled && setEmployees(r.results))
            .catch(() => undefined);
        return () => {
            cancelled = true;
        };
    }, []);

    async function loadDeadline(task: Task) {
        if (!task.current_step || info[task.id]?.loading) return;
        setInfo((p) => ({ ...p, [task.id]: { deadline: null, started_at: null, loading: true } }));
        try {
            const { data } = await api.get(
                `/tasks/api/v1/tasks/${task.id}/steps/${task.current_step}/deadline/`
            );
            setInfo((p) => ({
                ...p,
                [task.id]: { deadline: data?.deadline ?? null, started_at: data?.started_at ?? null },
            }));
        } catch {
            setInfo((p) => ({ ...p, [task.id]: { deadline: null, started_at: null, error: true } }));
        }
    }

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
                            ددلاین تسک‌ها
                        </h2>
                        <p className="mt-0.5 text-[10.5px] text-gray-400">
                            برای دیدن مهلت هر تسک روی «مشاهده ددلاین» بزنید
                        </p>
                    </div>
                </div>

                <span className="rounded-xl bg-red-500/10 px-2.5 py-1 text-[10px] font-bold text-red-400">
                    {total.toLocaleString("fa-IR")} تسک
                </span>
            </div>

            {loading && !tasks.length ? (
                <div className="flex min-h-32 items-center justify-center gap-2 text-[11px] font-semibold text-gray-400">
                    <Loader2 size={16} className="animate-spin" />
                    در حال دریافت تسک‌ها...
                </div>
            ) : !tasks.length ? (
                <div className="flex min-h-32 items-center justify-center rounded-2xl border border-dashed border-gray-200 text-[11px] font-semibold text-gray-400 dark:border-white/[0.06]">
                    تسکی وجود ندارد.
                </div>
            ) : (
                <div className="grid gap-2.5">
                    {tasks.map((task, index) => (
                        <motion.div
                            key={task.id}
                            initial={{ opacity: 0, y: 6 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: index * 0.025 }}
                            className="rounded-2xl border border-gray-200 dark:border-white/[0.06] p-3.5"
                        >
                            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                                <div className="min-w-0">
                                    <div className="flex flex-wrap items-center gap-2">
                                        <h3 className="truncate text-[12px] font-extrabold text-gray-900 dark:text-white">
                                            {task.title}
                                        </h3>
                                        {(() => {
                                            const d = info[task.id]?.deadline;
                                            if (!d) return null;
                                            const expired = new Date(d).getTime() < Date.now();
                                            return expired ? (
                                                <span className="flex items-center gap-1 rounded-full border border-red-500/20 bg-red-500/10 px-2 py-0.5 text-[9px] font-bold text-red-400">
                                                    <AlertTriangle size={10} /> منقضی شده
                                                </span>
                                            ) : (
                                                <span className="flex items-center gap-1 rounded-full border border-emerald-500/20 bg-emerald-500/10 px-2 py-0.5 text-[9px] font-bold text-emerald-400">
                                                    <CheckCircle2 size={10} /> در مهلت
                                                </span>
                                            );
                                        })()}
                                    </div>

                                    <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1.5">
                                        {task.assigned_employee?.map((id) => (
                                            <span
                                                key={id}
                                                className="flex items-center gap-1.5 text-[10px] font-bold text-gray-500 dark:text-gray-400"
                                            >
                                                <UserRound size={11} className="text-indigo-400" />
                                                {getEmployeeName(id, employees)}
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
                                    {(() => {
                                        const i = info[task.id];
                                        if (!task.current_step)
                                            return <span className="text-gray-400">بدون مرحله</span>;
                                        if (i?.loading)
                                            return <Loader2 size={14} className="animate-spin text-gray-400" />;
                                        if (i?.deadline)
                                            return (
                                                <>
                                                    {i.started_at && (
                                                        <div className="mb-1 text-gray-400">
                                                            شروع: {formatDate(i.started_at)}
                                                        </div>
                                                    )}
                                                    <div className="text-indigo-400">
                                                        <Clock size={11} className="mr-1 inline" />
                                                        مهلت: {formatDate(i.deadline)}
                                                    </div>
                                                </>
                                            );
                                        if (i && !i.error)
                                            return <span className="text-gray-400">ددلاین تعیین نشده</span>;
                                        return (
                                            <button
                                                type="button"
                                                onClick={() => loadDeadline(task)}
                                                className="flex items-center gap-1 rounded-xl bg-indigo-500/10 px-2.5 py-1.5 text-indigo-400"
                                            >
                                                <Clock size={12} />
                                                {i?.error ? "تلاش مجدد" : "مشاهده ددلاین"}
                                            </button>
                                        );
                                    })()}
                                </div>
                            </div>
                        </motion.div>
                    ))}
                </div>
            )}
            {hasNext && (
                <button
                    type="button"
                    disabled={loading}
                    onClick={() => setPage((p) => p + 1)}
                    className="mx-auto mt-3 flex items-center gap-1.5 rounded-xl bg-indigo-500/10 px-4 py-2 text-[11px] font-bold text-indigo-400"
                >
                    {loading && <Loader2 size={12} className="animate-spin" />}
                    نمایش بیشتر
                </button>
            )}
        </motion.section>
    );
}