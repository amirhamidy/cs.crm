"use client";

import { useCallback, useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import {
    ClipboardList,
    ListOrdered,
    Plus,
    RefreshCw,
    Users,
} from "lucide-react";
import axiosInstance from "@/lib/axiosInstance";
import type {
    ApiPurchasingEmployee,
    ApiPurchasingStep,
    ApiPurchasingTask,
    ApiTaskAttachment,
} from "@/types/purchasing";
import PurchasingEmployeeCard from "./PurchasingEmployeeCard";
import PurchasingEmployeeModal from "./PurchasingEmployeeModal";
import StepCard from "./StepCard";
import StepModal from "./StepModal";
import TaskCard from "./TaskCard";
import PurchasingOverview from "./PurchasingOverview";

type Tab = "overview" | "tasks" | "steps" | "employees";

const normalizeList = <T,>(value: unknown): T[] => {
    if (Array.isArray(value)) {
        return value as T[];
    }

    if (
        value &&
        typeof value === "object" &&
        "results" in value &&
        Array.isArray((value as { results?: unknown }).results)
    ) {
        return (value as { results: T[] }).results;
    }

    return [];
};

export default function PurchasingPage() {
    const [employees, setEmployees] = useState<ApiPurchasingEmployee[]>([]);
    const [steps, setSteps] = useState<ApiPurchasingStep[]>([]);
    const [tasks, setTasks] = useState<ApiPurchasingTask[]>([]);
    const [attachments, setAttachments] = useState<ApiTaskAttachment[]>([]);

    const [activeTab, setActiveTab] = useState<Tab>("overview");
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);

    const [employeeModalOpen, setEmployeeModalOpen] = useState(false);
    const [stepModalOpen, setStepModalOpen] = useState(false);
    const [editingStep, setEditingStep] =
        useState<ApiPurchasingStep | null>(null);

    const loadAll = useCallback(async (silent = false) => {
        try {
            if (silent) {
                setRefreshing(true);
            } else {
                setLoading(true);
            }

            const [
                employeesResponse,
                stepsResponse,
                tasksResponse,
                attachmentsResponse,
            ] = await Promise.all([
                axiosInstance.get("/purchasing/api/v1/employees/"),
                axiosInstance.get("/purchasing/api/v1/steps/"),
                axiosInstance.get("/purchasing/api/v1/tasks/"),
                axiosInstance.get("/purchasing/api/v1/task-attachments/"),
            ]);

            setEmployees(
                normalizeList<ApiPurchasingEmployee>(employeesResponse.data)
            );

            setSteps(
                normalizeList<ApiPurchasingStep>(stepsResponse.data).sort(
                    (a, b) => a.order - b.order
                )
            );

            setTasks(normalizeList<ApiPurchasingTask>(tasksResponse.data));

            setAttachments(
                normalizeList<ApiTaskAttachment>(attachmentsResponse.data)
            );
        } catch (error) {
            console.error("Purchasing data loading failed:", error);
            setEmployees([]);
            setSteps([]);
            setTasks([]);
            setAttachments([]);
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    }, []);

    useEffect(() => {
        loadAll();
    }, [loadAll]);

    const handleStepEdit = (step: ApiPurchasingStep) => {
        setEditingStep(step);
        setStepModalOpen(true);
    };

    const handleStepModalClose = () => {
        setStepModalOpen(false);
        setEditingStep(null);
    };

    const tabs = [
        {
            id: "overview" as const,
            label: "نمای کلی",
            icon: ClipboardList,
        },
        {
            id: "tasks" as const,
            label: "تسک‌ها",
            icon: ClipboardList,
        },
        {
            id: "steps" as const,
            label: "مراحل",
            icon: ListOrdered,
        },
        {
            id: "employees" as const,
            label: "کارمندان",
            icon: Users,
        },
    ];

    const safeEmployees = employees ?? [];
    const safeSteps = steps ?? [];
    const safeTasks = tasks ?? [];
    const safeAttachments = attachments ?? [];

    return (
        <div
            dir="rtl"
            className="min-h-screen bg-[#f8fafc] text-slate-900 dark:bg-[#0b1120] dark:text-white"
        >
            <div className="mx-auto w-full max-w-[1500px] px-3 py-4 sm:px-5 lg:px-7">
                <motion.div
                    initial={{ opacity: 0, y: -8 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="mb-4 flex flex-col gap-3"
                >
                    <div className="flex items-center justify-between gap-3">
                        <div className="flex min-w-0 items-center gap-3">
                            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-indigo-500/10 text-indigo-500 dark:bg-indigo-500/15">
                                <ClipboardList size={20} />
                            </div>

                            <div className="min-w-0">
                                <h1 className="truncate text-[17px] font-black tracking-tight sm:text-[19px]">
                                    مدیریت خرید
                                </h1>

                                <p className="mt-0.5 text-[11px] font-medium text-slate-400 sm:text-[12px]">
                                    مدیریت مراحل، کارمندان و فرآیندهای خرید
                                </p>
                            </div>
                        </div>

                        <button
                            type="button"
                            onClick={() => loadAll(true)}
                            disabled={loading || refreshing}
                            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl border border-slate-200 bg-white text-slate-500 transition hover:border-indigo-200 hover:bg-indigo-50 hover:text-indigo-500 disabled:cursor-not-allowed disabled:opacity-50 dark:border-white/10 dark:bg-white/[0.03] dark:text-slate-400 dark:hover:border-indigo-500/30 dark:hover:bg-indigo-500/10 dark:hover:text-indigo-400"
                        >
                            <RefreshCw
                                size={16}
                                className={refreshing ? "animate-spin" : ""}
                            />
                        </button>
                    </div>

                    <div className="flex w-full overflow-x-auto rounded-2xl border border-slate-200 bg-white p-1 shadow-sm dark:border-white/[0.06] dark:bg-white/[0.025]">
                        {tabs.map((tab) => {
                            const Icon = tab.icon;
                            const active = activeTab === tab.id;

                            return (
                                <button
                                    key={tab.id}
                                    type="button"
                                    onClick={() => setActiveTab(tab.id)}
                                    className={`relative flex min-w-[105px] flex-1 items-center justify-center gap-1.5 rounded-xl px-3 py-2.5 text-[11px] font-bold transition sm:text-[12px] ${active
                                        ? "text-indigo-600 dark:text-indigo-400"
                                        : "text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                                        }`}
                                >
                                    {active && (
                                        <motion.div
                                            layoutId="purchasing-tab"
                                            className="absolute inset-0 rounded-xl bg-indigo-500/10 dark:bg-indigo-500/10"
                                            transition={{
                                                type: "spring",
                                                stiffness: 400,
                                                damping: 30,
                                            }}
                                        />
                                    )}

                                    <Icon size={15} className="relative z-10" />

                                    <span className="relative z-10 whitespace-nowrap">
                                        {tab.label}
                                    </span>
                                </button>
                            );
                        })}
                    </div>
                </motion.div>

                <AnimatePresence mode="wait">
                    {loading ? (
                        <motion.div
                            key="loading"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3"
                        >
                            {Array.from({ length: 6 }).map((_, index) => (
                                <div
                                    key={index}
                                    className="h-40 animate-pulse rounded-3xl border border-slate-200 bg-white dark:border-white/[0.06] dark:bg-white/[0.025]"
                                />
                            ))}
                        </motion.div>
                    ) : (
                        <motion.div
                            key={activeTab}
                            initial={{ opacity: 0, y: 8 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.2 }}
                        >
                            {activeTab === "overview" && (
                                <PurchasingOverview
                                    employees={safeEmployees}
                                    steps={safeSteps}
                                    tasks={safeTasks}
                                    attachments={safeAttachments}
                                />
                            )}

                            {activeTab === "tasks" && (
                                <div className="space-y-3">
                                    <div className="flex items-center justify-between rounded-3xl border border-slate-200 bg-white px-4 py-3 dark:border-white/[0.06] dark:bg-white/[0.025]">
                                        <div className="flex items-center gap-2">
                                            <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-indigo-500/10 text-indigo-500">
                                                <ClipboardList size={16} />
                                            </div>

                                            <div>
                                                <h2 className="text-[13px] font-black">
                                                    تسک‌های خرید
                                                </h2>

                                                <p className="text-[10px] font-medium text-slate-400">
                                                    {safeTasks.length} تسک
                                                </p>
                                            </div>
                                        </div>
                                    </div>

                                    {safeTasks.length === 0 ? (
                                        <div className="flex min-h-[260px] flex-col items-center justify-center rounded-3xl border border-dashed border-slate-200 bg-white dark:border-white/[0.08] dark:bg-white/[0.025]">
                                            <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-100 text-slate-400 dark:bg-white/[0.05]">
                                                <ClipboardList size={21} />
                                            </div>

                                            <span className="text-[13px] font-bold text-slate-500 dark:text-slate-300">
                                                تسکی وجود ندارد
                                            </span>

                                            <span className="mt-1 text-[10px] text-slate-400">
                                                در حال حاضر هیچ تسک خریدی ثبت نشده است
                                            </span>
                                        </div>
                                    ) : (
                                        <div className="grid grid-cols-1 gap-3 xl:grid-cols-2">
                                            {safeTasks.map((task, index) => (
                                                <TaskCard
                                                    key={task.id}
                                                    task={task}
                                                    index={index}
                                                    employees={safeEmployees}
                                                    steps={safeSteps}
                                                    attachments={safeAttachments.filter(
                                                        (attachment) =>
                                                            attachment.task ===
                                                            task.id
                                                    )}
                                                    onUpdated={() =>
                                                        loadAll(true)
                                                    }
                                                />
                                            ))}
                                        </div>
                                    )}
                                </div>
                            )}

                            {activeTab === "steps" && (
                                <div className="space-y-3">
                                    <div className="flex items-center justify-between rounded-3xl border border-slate-200 bg-white px-4 py-3 dark:border-white/[0.06] dark:bg-white/[0.025]">
                                        <div className="flex items-center gap-2">
                                            <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-indigo-500/10 text-indigo-500">
                                                <ListOrdered size={16} />
                                            </div>

                                            <div>
                                                <h2 className="text-[13px] font-black">
                                                    مراحل خرید
                                                </h2>

                                                <p className="text-[10px] font-medium text-slate-400">
                                                    {safeSteps.length} مرحله
                                                </p>
                                            </div>
                                        </div>

                                        <button
                                            type="button"
                                            onClick={() => {
                                                setEditingStep(null);
                                                setStepModalOpen(true);
                                            }}
                                            className="flex h-9 items-center gap-1.5 rounded-xl bg-indigo-500 px-3 text-[11px] font-bold text-white shadow-lg shadow-indigo-500/20 transition hover:bg-indigo-600"
                                        >
                                            <Plus size={15} />
                                            <span>مرحله جدید</span>
                                        </button>
                                    </div>

                                    {safeSteps.length === 0 ? (
                                        <div className="flex min-h-[260px] flex-col items-center justify-center rounded-3xl border border-dashed border-slate-200 bg-white dark:border-white/[0.08] dark:bg-white/[0.025]">
                                            <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-100 text-slate-400 dark:bg-white/[0.05]">
                                                <ListOrdered size={21} />
                                            </div>

                                            <span className="text-[13px] font-bold text-slate-500 dark:text-slate-300">
                                                مرحله‌ای وجود ندارد
                                            </span>

                                            <span className="mt-1 text-[10px] text-slate-400">
                                                اولین مرحله فرآیند خرید را ایجاد کنید
                                            </span>
                                        </div>
                                    ) : (
                                        <div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-3">
                                            {safeSteps.map((step, index) => (
                                                <StepCard
                                                    key={step.id}
                                                    step={step}
                                                    index={index}
                                                    onDeleted={() =>
                                                        loadAll(true)
                                                    }
                                                    onEdit={() =>
                                                        handleStepEdit(step)
                                                    }
                                                />
                                            ))}
                                        </div>
                                    )}
                                </div>
                            )}

                            {activeTab === "employees" && (
                                <div className="space-y-3">
                                    <div className="flex items-center justify-between rounded-3xl border border-slate-200 bg-white px-4 py-3 dark:border-white/[0.06] dark:bg-white/[0.025]">
                                        <div className="flex items-center gap-2">
                                            <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-indigo-500/10 text-indigo-500">
                                                <Users size={16} />
                                            </div>

                                            <div>
                                                <h2 className="text-[13px] font-black">
                                                    کارمندان خرید
                                                </h2>

                                                <p className="text-[10px] font-medium text-slate-400">
                                                    {safeEmployees.length} کارمند
                                                </p>
                                            </div>
                                        </div>

                                        <button
                                            type="button"
                                            onClick={() =>
                                                setEmployeeModalOpen(true)
                                            }
                                            className="flex h-9 items-center gap-1.5 rounded-xl bg-indigo-500 px-3 text-[11px] font-bold text-white shadow-lg shadow-indigo-500/20 transition hover:bg-indigo-600"
                                        >
                                            <Plus size={15} />
                                            <span>افزودن کارمند</span>
                                        </button>
                                    </div>

                                    {safeEmployees.length === 0 ? (
                                        <div className="flex min-h-[260px] flex-col items-center justify-center rounded-3xl border border-dashed border-slate-200 bg-white dark:border-white/[0.08] dark:bg-white/[0.025]">
                                            <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-100 text-slate-400 dark:bg-white/[0.05]">
                                                <Users size={21} />
                                            </div>

                                            <span className="text-[13px] font-bold text-slate-500 dark:text-slate-300">
                                                کارمندی اضافه نشده است
                                            </span>

                                            <span className="mt-1 text-[10px] text-slate-400">
                                                برای فرآیند خرید کارمند اضافه کنید
                                            </span>
                                        </div>
                                    ) : (
                                        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-3">
                                            {safeEmployees.map(
                                                (employee, index) => (
                                                    <PurchasingEmployeeCard
                                                        key={employee.id}
                                                        employee={employee}
                                                        index={index}
                                                        onUpdated={() =>
                                                            loadAll(true)
                                                        }
                                                        onDeleted={() =>
                                                            loadAll(true)
                                                        }
                                                    />
                                                )
                                            )}
                                        </div>
                                    )}
                                </div>
                            )}
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>

            <PurchasingEmployeeModal
                open={employeeModalOpen}
                onClose={() => setEmployeeModalOpen(false)}
                existingEmployees={safeEmployees}
                onSaved={() => {
                    setEmployeeModalOpen(false);
                    loadAll(true);
                }}
            />

            <StepModal
                open={stepModalOpen}
                onClose={handleStepModalClose}
                step={editingStep}
                employees={safeEmployees}
                onSaved={() => {
                    handleStepModalClose();
                    loadAll(true);
                }}
            />
        </div>
    );
}
