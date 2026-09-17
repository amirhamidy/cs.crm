"use client";

import { useEffect, useMemo, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Archive, CheckCircle2, Filter, Loader2, PackageCheck, XCircle } from "lucide-react";
import axiosInstance from "@/lib/axiosInstance";
import { useCurrentEmployee } from "@/hooks/usecurrentemployee";
import ArchivedTaskCard from "./ArchivedTaskCard";

interface ArchiveTask {
    id: number;
    task_id: number;
    title: string;
    status: "completed" | "cancelled" | "sold";
    case_id: number | null;
    case_title: string;
    customer_id: number | null;
    customer_full_name: string;
    department_id: number;
    department_name: string;
    created_by_id: number | null;
    created_by_username: string;
    created_by_full_name: string;
    final_action_by_id: number | null;
    final_action_by_username: string;
    final_action_by_full_name: string;
    task_created_at: string;
    completed_at: string | null;
    archived_at: string;
}

type StatusFilter = "all" | ArchiveTask["status"];
type DepartmentFilter = "all" | number;

const STATUS_FILTERS = [
    { key: "all" as StatusFilter, label: "همه", icon: Archive },
    { key: "completed" as StatusFilter, label: "تکمیل شده", icon: CheckCircle2 },
    { key: "sold" as StatusFilter, label: "فروش رفته", icon: PackageCheck },
    { key: "cancelled" as StatusFilter, label: "لغو شده", icon: XCircle },
];

export default function ArchivedTasksBoard() {
    const { departments, departmentIds, loading: employeeLoading, error: employeeError } = useCurrentEmployee();
    const [tasks, setTasks] = useState<ArchiveTask[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
    const [departmentFilter, setDepartmentFilter] = useState<DepartmentFilter>("all");

    useEffect(() => {
        if (employeeLoading) return;

        if (employeeError) {
            setTasks([]);
            setLoading(false);
            setError(employeeError);
            return;
        }

        if (!departmentIds.length) {
            setTasks([]);
            setLoading(false);
            setError(null);
            return;
        }

        let mounted = true;
        setLoading(true);
        setError(null);

        axiosInstance
            .get<ArchiveTask[]>("/tasks/api/v1/task_archive/")
            .then(({ data }) => {
                if (!mounted) return;
                setTasks(
                    (Array.isArray(data) ? data : []).filter((task) =>
                        departmentIds.includes(Number(task.department_id))
                    )
                );
            })
            .catch(() => {
                if (!mounted) return;
                setTasks([]);
                setError("دریافت تسک‌های آرشیو شده انجام نشد");
            })
            .finally(() => {
                if (mounted) setLoading(false);
            });

        return () => {
            mounted = false;
        };
    }, [employeeLoading, employeeError, departmentIds]);

    const filteredTasks = useMemo(
        () =>
            tasks.filter(
                (task) =>
                    (departmentFilter === "all" ||
                        Number(task.department_id) === departmentFilter) &&
                    (statusFilter === "all" || task.status === statusFilter)
            ),
        [tasks, departmentFilter, statusFilter]
    );

    const groupedTasks = useMemo(
        () =>
            Object.values(
                filteredTasks.reduce<
                    Record<
                        string,
                        {
                            departmentId: number;
                            departmentName: string;
                            tasks: ArchiveTask[];
                        }
                    >
                >((groups, task) => {
                    const id = Number(task.department_id);
                    groups[id] ??= {
                        departmentId: id,
                        departmentName: task.department_name || "بدون دپارتمان",
                        tasks: [],
                    };
                    groups[id].tasks.push(task);
                    return groups;
                }, {})
            ),
        [filteredTasks]
    );

    const handleReopened = (taskId: number) =>
        setTasks((items) => items.filter((task) => task.task_id !== taskId));

    if (employeeLoading || loading) {
        return (
            <div className="flex min-h-[320px] items-center justify-center" dir="rtl">
                <div className="flex flex-col items-center gap-3">
                    <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-indigo-500/10">
                        <Loader2 size={22} className="animate-spin text-indigo-500" />
                    </div>
                    <span className="text-[11px] font-bold text-gray-400">
                        در حال دریافت آرشیو...
                    </span>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="flex min-h-[320px] items-center justify-center" dir="rtl">
                <div className="w-full max-w-md rounded-[1.5rem] border border-red-500/10 bg-red-500/[.04] p-6 text-center">
                    <XCircle size={22} className="mx-auto text-red-500" />
                    <p className="mt-3 text-[11px] font-bold leading-6 text-red-500">{error}</p>
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-5" dir="rtl">
            <div className="flex flex-col gap-4">
                <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
                    <div className="flex items-center gap-2">
                        <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-indigo-500/10">
                            <Archive size={18} className="text-indigo-500" />
                        </div>
                        <div>
                            <h2 className="text-[15px] font-black text-gray-900 dark:text-white">
                                آرشیو تسک‌ها
                            </h2>
                            <p className="mt-1 text-[10px] font-medium text-gray-400">
                                آرشیو دپارتمان‌هایی که شما عضو آن‌ها هستید
                            </p>
                        </div>
                    </div>

                    <div className="flex items-center gap-2">
                        <div className="flex h-9 items-center gap-1.5 rounded-xl bg-indigo-500/10 px-3 text-[10px] font-black text-indigo-500">
                            <Archive size={12} />
                            {filteredTasks.length} تسک
                        </div>
                        {departments.length > 1 && (
                            <div className="rounded-xl bg-gray-100 px-3 py-2 text-[10px] font-bold text-gray-500 dark:bg-white/[.04] dark:text-gray-400">
                                {departments.length} دپارتمان
                            </div>
                        )}
                    </div>
                </div>

                <div className="rounded-[1.4rem] border border-gray-200/70 bg-white/80 p-3 shadow-sm dark:border-white/[.06] dark:bg-white/[.02]">
                    <div className="mb-3 flex items-center gap-2 text-[10px] font-black text-gray-500 dark:text-gray-400">
                        <Filter size={13} />
                        فیلتر آرشیو
                    </div>

                    <div className="flex flex-wrap gap-2">
                        <button
                            type="button"
                            onClick={() => setDepartmentFilter("all")}
                            className={`rounded-xl px-3 py-2 text-[9.5px] font-extrabold transition ${departmentFilter === "all"
                                    ? "bg-indigo-500 text-white shadow-lg shadow-indigo-500/20"
                                    : "bg-gray-100 text-gray-500 hover:bg-gray-200 dark:bg-white/[.04] dark:text-gray-400 dark:hover:bg-white/[.07]"
                                }`}
                        >
                            همه دپارتمان‌ها
                        </button>

                        {departments.map((department) => (
                            <button
                                key={department.id}
                                type="button"
                                onClick={() => setDepartmentFilter(department.id)}
                                className={`rounded-xl px-3 py-2 text-[9.5px] font-extrabold transition ${departmentFilter === department.id
                                        ? "bg-indigo-500 text-white shadow-lg shadow-indigo-500/20"
                                        : "bg-gray-100 text-gray-500 hover:bg-gray-200 dark:bg-white/[.04] dark:text-gray-400 dark:hover:bg-white/[.07]"
                                    }`}
                            >
                                {department.name}
                            </button>
                        ))}
                    </div>

                    <div className="mt-3 flex flex-wrap gap-2 border-t border-gray-100 pt-3 dark:border-white/[.05]">
                        {STATUS_FILTERS.map(({ key, label, icon: Icon }) => {
                            const active = statusFilter === key;
                            return (
                                <button
                                    key={key}
                                    type="button"
                                    onClick={() => setStatusFilter(key)}
                                    className={`flex items-center gap-1.5 rounded-xl px-3 py-2 text-[9.5px] font-extrabold transition ${active
                                            ? "bg-gray-900 text-white dark:bg-white dark:text-gray-900"
                                            : "bg-gray-100 text-gray-500 hover:bg-gray-200 dark:bg-white/[.04] dark:text-gray-400 dark:hover:bg-white/[.07]"
                                        }`}
                                >
                                    <Icon size={11} />
                                    {label}
                                </button>
                            );
                        })}
                    </div>
                </div>
            </div>

            {!filteredTasks.length ? (
                <motion.div
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="flex min-h-[280px] flex-col items-center justify-center rounded-[1.7rem] border border-dashed border-gray-200 bg-white/60 px-5 dark:border-white/[.07] dark:bg-white/[.02]"
                >
                    <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-gray-100 dark:bg-white/[.04]">
                        <Archive size={23} className="text-gray-400" />
                    </div>
                    <h3 className="mt-4 text-[12px] font-extrabold text-gray-600 dark:text-gray-300">
                        موردی در آرشیو پیدا نشد
                    </h3>
                    <p className="mt-1.5 text-center text-[10px] font-medium text-gray-400">
                        برای دپارتمان یا وضعیت انتخاب‌شده تسکی وجود ندارد.
                    </p>
                </motion.div>
            ) : (
                <div className="space-y-7">
                    {groupedTasks.map((department) => (
                        <motion.section
                            key={department.departmentId}
                            layout
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="space-y-3"
                        >
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                    <div className="h-7 w-1 rounded-full bg-indigo-500" />
                                    <div>
                                        <h3 className="text-[12px] font-black text-gray-800 dark:text-white">
                                            {department.departmentName}
                                        </h3>
                                        <p className="mt-0.5 text-[9px] font-bold text-gray-400">
                                            {department.tasks.length} تسک
                                        </p>
                                    </div>
                                </div>
                                <span className="rounded-xl bg-gray-100 px-2.5 py-1 text-[9px] font-extrabold text-gray-400 dark:bg-white/[.04]">
                                    آرشیو
                                </span>
                            </div>

                            <AnimatePresence mode="popLayout">
                                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4">
                                    {department.tasks.map((task) => (
                                        <ArchivedTaskCard
                                            key={task.id}
                                            task={task}
                                            onReopened={handleReopened}
                                        />
                                    ))}
                                </div>
                            </AnimatePresence>
                        </motion.section>
                    ))}
                </div>
            )}
        </div>
    );
}