"use client";

import { useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import {
    Archive,
    Ban,
    Building2,
    CalendarDays,
    CheckCircle2,
    Clock3,
    FileText,
    Loader2,
    MessageSquareText,
    RotateCcw,
    ShoppingBag,
    User,
} from "lucide-react";
import axiosInstance from "@/lib/axiosInstance";
import { departmentsApi } from "@/lib/api";
import { useCurrentEmployee } from "@/hooks/usecurrentemployee";
import AdminTaskNotesModal from "@/components/customcomponents/tasks/AdminTaskNotesModal";

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

interface DepartmentStep {
    id: number;
    department: number;
    name: string;
    order: number;
}

interface DepartmentEmployee {
    employee: number;
    employee_name: string;
    department: number;
    is_manager: boolean;
}

interface Props {
    task: ArchiveTask;
    onReopened: (taskId: number) => void;
}

function formatDate(value?: string | null) {
    if (!value) return "نامشخص";
    return new Date(value).toLocaleDateString("fa-IR", {
        year: "numeric",
        month: "long",
        day: "numeric",
    });
}

function formatDateTime(value?: string | null) {
    if (!value) return "نامشخص";
    const date = new Date(value);
    return `${date.toLocaleDateString("fa-IR", {
        year: "numeric",
        month: "long",
        day: "numeric",
    })} · ${date.toLocaleTimeString("fa-IR", {
        hour: "2-digit",
        minute: "2-digit",
    })}`;
}

function statusInfo(status: ArchiveTask["status"]) {
    if (status === "sold") {
        return {
            label: "فروش",
            icon: ShoppingBag,
            className:
                "bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-500/10 dark:text-emerald-300 dark:border-emerald-500/20",
        };
    }
    if (status === "cancelled") {
        return {
            label: "لغو شده",
            icon: Ban,
            className:
                "bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-500/10 dark:text-rose-300 dark:border-rose-500/20",
        };
    }
    return {
        label: "انجام شده",
        icon: CheckCircle2,
        className:
            "bg-sky-50 text-sky-700 border-sky-200 dark:bg-sky-500/10 dark:text-sky-300 dark:border-sky-500/20",
    };
}

function parseError(error: unknown) {
    const data = (error as { response?: { data?: unknown } })?.response?.data;
    if (!data) return "بازگردانی تسک با خطا مواجه شد";
    if (typeof data === "string") return data;
    const first = Object.values(data as Record<string, unknown>)[0];
    return Array.isArray(first)
        ? String(first[0])
        : String(first ?? "بازگردانی تسک با خطا مواجه شد");
}

export default function ArchivedTaskCard({ task, onReopened }: Props) {
    const {
        departments,
        loading: employeeLoading,
        error: employeeError,
    } = useCurrentEmployee();

    const [confirmOpen, setConfirmOpen] = useState(false);
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [notesOpen, setNotesOpen] = useState(false);
    const [departmentEmployees, setDepartmentEmployees] = useState<DepartmentEmployee[]>([]);
    const [steps, setSteps] = useState<DepartmentStep[]>([]);
    const [selectedEmployee, setSelectedEmployee] = useState("");
    const [selectedStep, setSelectedStep] = useState("");
    const [optionsLoading, setOptionsLoading] = useState(false);

    // Only managers of THIS task's own department can reopen it
    const isManagerOfTaskDepartment = useMemo(
        () =>
            departments.some(
                (d) =>
                    d.isManager === true &&
                    Number(d.id) === Number(task.department_id),
            ),
        [departments, task.department_id],
    );

    const canReopen = isManagerOfTaskDepartment;

    // Employees belong to the task's department
    const availableEmployees = useMemo(
        () =>
            departmentEmployees.filter(
                (emp) => Number(emp.department) === Number(task.department_id),
            ),
        [departmentEmployees, task.department_id],
    );

    // Steps belong to the task's department, sorted by order
    const availableSteps = useMemo(
        () =>
            steps
                .filter((s) => Number(s.department) === Number(task.department_id))
                .sort((a, b) => a.order - b.order),
        [steps, task.department_id],
    );

    const status = statusInfo(task.status);
    const StatusIcon = status.icon;

    useEffect(() => {
        if (!confirmOpen) {
            setSelectedEmployee("");
            setSelectedStep("");
            setDepartmentEmployees([]);
            setSteps([]);
            setError(null);
            setOptionsLoading(false);
            return;
        }

        if (employeeLoading || employeeError || !isManagerOfTaskDepartment) return;

        let cancelled = false;
        setOptionsLoading(true);

        Promise.all([
            departmentsApi.employees(),
            departmentsApi.steps(),
        ])
            .then(([employeeResponse, stepResponse]) => {
                if (cancelled) return;

                const employeeData = employeeResponse as unknown as DepartmentEmployee[];
                const stepData = stepResponse as unknown as DepartmentStep[];

                // Only load employees from the task's own department
                setDepartmentEmployees(
                    employeeData.filter(
                        (item: DepartmentEmployee) =>
                            Number(item.department) === Number(task.department_id) &&
                            Number(item.employee) > 0,
                    ),
                );

                setSteps(stepData);
                setError(null);
            })
            .catch((err: unknown) => {
                if (!cancelled) setError(parseError(err));
            })
            .finally(() => {
                if (!cancelled) setOptionsLoading(false);
            });

        return () => {
            cancelled = true;
        };
    }, [confirmOpen, employeeLoading, employeeError, isManagerOfTaskDepartment, task.department_id]);

    async function reopenTask() {
        if (!canReopen) {
            setError("فقط مدیر دپارتمان مجاز به بازگردانی این تسک است");
            return;
        }

        if (!selectedEmployee || !selectedStep) {
            setError("لطفاً کارمند و مرحله را انتخاب کنید");
            return;
        }

        const employeeId = Number(selectedEmployee);
        // step.id is exactly what the API expects for current_step
        const step = availableSteps.find((s) => Number(s.id) === Number(selectedStep));

        if (
            !availableEmployees.some((emp) => Number(emp.employee) === employeeId) ||
            !step
        ) {
            setError("انتخاب‌های انجام‌شده معتبر نیستند");
            return;
        }

        setSubmitting(true);
        setError(null);

        try {
            await axiosInstance.post(`/tasks/api/v1/tasks/${task.task_id}/reopen/`, {
                current_step: step.id,          // ← fix: id نه order
                assigned_employee: [employeeId],
            });

            setConfirmOpen(false);
            onReopened(task.task_id);
        } catch (err) {
            setError(parseError(err));
        } finally {
            setSubmitting(false);
        }
    }

    return (
        <>
            <motion.article
                className="group relative overflow-hidden rounded-[1.8rem] border border-gray-100 bg-white p-4 shadow-[0_8px_28px_rgba(15,23,42,0.035)] transition-all duration-300 hover:-translate-y-0.5 hover:shadow-[0_16px_36px_rgba(15,23,42,0.08)] dark:border-white/[0.07] dark:bg-[#111a2d] dark:shadow-none"
            >
                <div className="absolute inset-y-0 right-0 w-1 bg-gradient-to-b from-slate-400 to-slate-400/20" />

                <div className="mb-3 flex items-start justify-between gap-3 pl-1">
                    <span
                        className={`flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[10px] font-extrabold ${status.className}`}
                    >
                        <StatusIcon size={10} />
                        {status.label}
                    </span>
                    <span className="flex shrink-0 items-center gap-1 rounded-xl bg-gray-50 px-2.5 py-1.5 text-[9px] font-bold text-gray-400 dark:bg-white/[0.05] dark:text-white/40">
                        <Archive size={10} />
                        آرشیو
                    </span>
                </div>

                <h3 className="text-[14px] font-extrabold leading-6 text-gray-900 dark:text-white">
                    {task.title || "تسک بدون عنوان"}
                </h3>

                {task.case_title && (
                    <div className="mt-2 flex items-center gap-1.5 rounded-xl bg-violet-50 px-2.5 py-1.5 text-[10px] font-bold text-violet-600 dark:bg-violet-500/10 dark:text-violet-300">
                        <FileText size={11} />
                        <span className="truncate">{task.case_title}</span>
                    </div>
                )}

                <div className="mt-4 flex flex-wrap items-center gap-1.5">
                    {task.department_name && (
                        <div className="flex items-center gap-1.5 rounded-xl bg-gray-50 px-2.5 py-1.5 text-[10px] font-bold text-gray-500 dark:bg-white/[0.04] dark:text-white/45">
                            <Building2 size={11} />
                            <span className="max-w-[130px] truncate">{task.department_name}</span>
                        </div>
                    )}
                    {task.customer_full_name && (
                        <div className="flex items-center gap-1.5 rounded-xl bg-sky-50 px-2.5 py-1.5 text-[10px] font-bold text-sky-600 dark:bg-sky-500/10 dark:text-sky-300">
                            <User size={11} />
                            <span className="max-w-[130px] truncate">{task.customer_full_name}</span>
                        </div>
                    )}
                </div>

                <div className="mt-3 flex flex-col gap-2.5 rounded-2xl bg-gray-50 px-3 py-3 dark:bg-white/[0.035]">
                    <div className="flex items-center justify-between gap-3">
                        <div className="flex min-w-0 items-center gap-2 text-gray-500 dark:text-white/45">
                            <CalendarDays size={13} />
                            <div className="min-w-0">
                                <p className="text-[9.5px] font-bold">تاریخ ایجاد</p>
                                <p className="mt-0.5 truncate text-[10.5px] font-extrabold text-gray-700 dark:text-white/75">
                                    {formatDate(task.task_created_at)}
                                </p>
                            </div>
                        </div>
                        <div className="border-r border-gray-200 pr-3 dark:border-white/[0.08]">
                            <p className="text-[9px] font-bold text-gray-400">آرشیو</p>
                            <p className="mt-0.5 text-[10px] font-bold text-gray-500 dark:text-white/50">
                                {formatDate(task.archived_at)}
                            </p>
                        </div>
                    </div>

                    {task.completed_at && (
                        <div className="flex items-center gap-2 border-t border-gray-200 pt-2.5 dark:border-white/[0.07]">
                            <Clock3 size={12} className="shrink-0 text-gray-400" />
                            <div>
                                <p className="text-[9px] font-bold text-gray-400">زمان تکمیل</p>
                                <p className="mt-0.5 text-[10px] font-extrabold text-gray-600 dark:text-white/60">
                                    {formatDateTime(task.completed_at)}
                                </p>
                            </div>
                        </div>
                    )}
                </div>

                <div className="mt-3 rounded-2xl bg-indigo-500/[.035] px-3 py-2.5 dark:bg-indigo-500/[.04]">
                    <div className="text-[9.5px] font-bold text-gray-400 dark:text-white/35">
                        آخرین اقدام توسط
                    </div>
                    <div className="mt-1 text-[10.5px] font-extrabold text-gray-700 dark:text-gray-200">
                        {task.final_action_by_full_name ||
                            task.final_action_by_username ||
                            "نامشخص"}
                    </div>
                </div>

                {error && !confirmOpen && (
                    <div className="mt-2 rounded-xl bg-red-500/10 px-3 py-2 text-center text-[9.5px] font-bold text-red-500">
                        {error}
                    </div>
                )}

                <div className="mt-3 flex items-center gap-2 border-t border-gray-100 pt-3.5 dark:border-white/[0.06]">
                    <button
                        type="button"
                        onClick={() => setNotesOpen(true)}
                        className="flex h-9 flex-1 items-center justify-center gap-1.5 rounded-xl bg-indigo-50 text-[10.5px] font-extrabold text-indigo-600 transition-colors hover:bg-indigo-100 dark:bg-indigo-500/10 dark:text-indigo-300 dark:hover:bg-indigo-500/20"
                    >
                        <MessageSquareText size={13} />
                        یادداشت‌ها
                    </button>

                    {canReopen && (
                        <button
                            type="button"
                            onClick={() => {
                                setError(null);
                                setConfirmOpen(true);
                            }}
                            className="flex h-9 flex-1 items-center justify-center gap-1.5 rounded-xl bg-gray-50 text-[10.5px] font-extrabold text-gray-600 transition-colors hover:bg-gray-100 hover:text-indigo-600 dark:bg-white/[0.05] dark:text-white/50 dark:hover:bg-white/[0.1] dark:hover:text-indigo-300"
                        >
                            <RotateCcw size={13} />
                            بازگشت
                        </button>
                    )}
                </div>
            </motion.article>

            <AdminTaskNotesModal
                isOpen={notesOpen}
                onClose={() => setNotesOpen(false)}
                taskId={task.task_id}
                taskTitle={task.title}
            />

            {confirmOpen && (
                <div
                    className="fixed inset-0 z-[9999] flex items-center justify-center bg-slate-950/50 px-4 backdrop-blur-sm"
                    dir="rtl"
                    onClick={() => !submitting && setConfirmOpen(false)}
                >
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        onClick={(e) => e.stopPropagation()}
                        className="w-full max-w-sm rounded-[2rem] border border-gray-100 bg-white p-6 text-right shadow-2xl dark:border-white/[0.08] dark:bg-[#111a2d]"
                    >
                        <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-indigo-50 text-indigo-500 dark:bg-indigo-500/10 dark:text-indigo-300">
                            <RotateCcw size={19} />
                        </div>

                        <h4 className="mt-4 text-[14px] font-extrabold text-gray-900 dark:text-white">
                            بازگردانی تسک
                        </h4>
                        <p className="mt-2 text-[11.5px] font-medium leading-6 text-gray-400 dark:text-white/40">
                            کارمند مسئول و مرحله شروع مجدد تسک را انتخاب کنید.
                        </p>

                        {/* Department is fixed — show as read-only badge */}
                        <div className="mt-3 flex items-center gap-2 rounded-xl bg-gray-50 px-3 py-2.5 dark:bg-white/[0.035]">
                            <Building2 size={13} className="shrink-0 text-gray-400" />
                            <div>
                                <p className="text-[9px] font-bold text-gray-400">دپارتمان</p>
                                <p className="mt-0.5 text-[10.5px] font-extrabold text-gray-700 dark:text-gray-200">
                                    {task.department_name}
                                </p>
                            </div>
                        </div>

                        <div className="mt-3 rounded-2xl bg-gray-50 px-3 py-2.5 dark:bg-white/[0.035]">
                            <p className="line-clamp-2 text-[10.5px] font-bold leading-5 text-gray-600 dark:text-gray-300">
                                {task.title}
                            </p>
                        </div>

                        {optionsLoading || employeeLoading ? (
                            <div className="mt-4 flex items-center justify-center gap-2 rounded-xl bg-gray-50 py-5 text-[11px] text-gray-400 dark:bg-white/[0.035]">
                                <Loader2 size={15} className="animate-spin" />
                                در حال دریافت اطلاعات...
                            </div>
                        ) : employeeError ? (
                            <p className="mt-4 rounded-xl bg-red-500/10 px-3 py-2 text-[10.5px] font-bold text-red-500">
                                {employeeError}
                            </p>
                        ) : (
                            <div className="mt-4 space-y-3">
                                <div>
                                    <label className="mb-1.5 block text-[10.5px] font-bold text-gray-500 dark:text-gray-400">
                                        کارمند مسئول
                                    </label>
                                    <select
                                        value={selectedEmployee}
                                        onChange={(e) => setSelectedEmployee(e.target.value)}
                                        disabled={submitting}
                                        className="h-10 w-full rounded-xl border border-gray-200 bg-white px-3 text-[11px] font-bold text-gray-700 outline-none focus:border-indigo-400 disabled:opacity-50 dark:border-white/[0.08] dark:bg-[#111a2d] dark:text-white"
                                    >
                                        <option value="">انتخاب کارمند</option>
                                        {availableEmployees.map((emp) => (
                                            <option
                                                key={`${emp.department}-${emp.employee}`}
                                                value={emp.employee}
                                            >
                                                {emp.employee_name}
                                            </option>
                                        ))}
                                    </select>
                                </div>

                                <div>
                                    <label className="mb-1.5 block text-[10.5px] font-bold text-gray-500 dark:text-gray-400">
                                        مرحله شروع
                                    </label>
                                    <select
                                        value={selectedStep}
                                        onChange={(e) => setSelectedStep(e.target.value)}
                                        disabled={submitting}
                                        className="h-10 w-full rounded-xl border border-gray-200 bg-white px-3 text-[11px] font-bold text-gray-700 outline-none focus:border-indigo-400 disabled:opacity-50 dark:border-white/[0.08] dark:bg-[#111a2d] dark:text-white"
                                    >
                                        <option value="">انتخاب مرحله</option>
                                        {availableSteps.map((step) => (
                                            <option key={step.id} value={step.id}>
                                                {step.name}
                                            </option>
                                        ))}
                                    </select>
                                </div>
                            </div>
                        )}

                        {error && (
                            <p className="mt-3 rounded-xl bg-red-500/10 px-3 py-2 text-center text-[10.5px] font-bold text-red-500">
                                {error}
                            </p>
                        )}

                        <div className="mt-5 flex gap-2">
                            <button
                                type="button"
                                onClick={() => setConfirmOpen(false)}
                                disabled={submitting}
                                className="flex h-10 flex-1 items-center justify-center rounded-full bg-gray-100 text-[11px] font-extrabold text-gray-500 transition hover:bg-gray-200 dark:bg-white/[0.06] dark:text-white/50 dark:hover:bg-white/[0.1]"
                            >
                                انصراف
                            </button>
                            <button
                                type="button"
                                onClick={reopenTask}
                                disabled={
                                    submitting ||
                                    optionsLoading ||
                                    employeeLoading ||
                                    !selectedEmployee ||
                                    !selectedStep
                                }
                                className="flex h-10 flex-1 items-center justify-center gap-2 rounded-full bg-indigo-500 text-[11px] font-extrabold text-white transition hover:bg-indigo-600 disabled:cursor-not-allowed disabled:opacity-60"
                            >
                                {submitting ? (
                                    <Loader2 size={14} className="animate-spin" />
                                ) : (
                                    <RotateCcw size={14} />
                                )}
                                {submitting ? "در حال بازگردانی..." : "بازگرداندن"}
                            </button>
                        </div>
                    </motion.div>
                </div>
            )}
        </>
    );
}
