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
            className="min-h-screen bg-[#F3F8FF] text-[#0F2647] dark:bg-[#050B18] dark:text-[#EAF2FF]"
        >
            <div className="mx-auto w-full max-w-[1500px] px-3 py-4 sm:px-5 lg:px-7">
                <motion.div
                    initial={{ opacity: 0, y: -8 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="relative mb-4 flex flex-col gap-3 overflow-hidden rounded-[2rem] border border-[#DCEAFB] bg-white p-4 dark:border-[rgba(96,165,250,0.14)] dark:bg-[#0A1930]"
                >
                    <div
                        className="pointer-events-none absolute -left-16 -top-24 h-56 w-56 rounded-full opacity-70 blur-3xl"
                        style={{
                            background:
                                "radial-gradient(circle, rgba(14,165,233,0.35), transparent 70%)",
                        }}
                    />

                    <div className="relative flex items-center justify-between gap-3">
                        <div className="flex min-w-0 items-center gap-3">
                            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-[#2563EB] to-[#06B6D4] text-white shadow-lg shadow-[#2563EB]/25">
                                <ClipboardList size={20} />
                            </div>

                            <div className="min-w-0">
                                <h1 className="truncate text-[17px] font-black tracking-tight sm:text-[19px]">
                                    مدیریت خرید
                                </h1>

                                <p className="mt-0.5 text-[11px] font-medium text-[#5D7595] dark:text-[#8FAAD1] sm:text-[12px]">
                                    مدیریت مراحل، کارمندان و فرآیندهای خرید
                                </p>
                            </div>
                        </div>

                        <button
                            type="button"
                            onClick={() => loadAll(true)}
                            disabled={loading || refreshing}
                            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl border border-[#DCEAFB] bg-white text-[#2563EB] transition hover:border-[#2563EB]/40 hover:bg-[#EEF5FF] disabled:cursor-not-allowed disabled:opacity-50 dark:border-[rgba(96,165,250,0.16)] dark:bg-[rgba(96,165,250,0.06)] dark:text-[#38BDF8] dark:hover:border-[#38BDF8]/40 dark:hover:bg-[rgba(96,165,250,0.12)]"
                        >
                            <RefreshCw
                                size={16}
                                className={refreshing ? "animate-spin" : ""}
                            />
                        </button>
                    </div>

                    <div className="relative flex w-full overflow-x-auto rounded-2xl border border-[#DCEAFB] bg-[#F3F8FF] p-1 dark:border-[rgba(96,165,250,0.14)] dark:bg-[rgba(96,165,250,0.05)]">
                        {tabs.map((tab) => {
                            const Icon = tab.icon;
                            const active = activeTab === tab.id;

                            return (
                                <button
                                    key={tab.id}
                                    type="button"
                                    onClick={() => setActiveTab(tab.id)}
                                    className={`relative flex min-w-[105px] flex-1 items-center justify-center gap-1.5 rounded-xl px-3 py-2.5 text-[11px] font-bold transition sm:text-[12px] ${active
                                        ? "text-white"
                                        : "text-[#5D7595] hover:text-[#2563EB] dark:text-[#8FAAD1] dark:hover:text-[#38BDF8]"
                                        }`}
                                >
                                    {active && (
                                        <motion.div
                                            layoutId="purchasing-tab"
                                            className="absolute inset-0 rounded-xl bg-gradient-to-r from-[#2563EB] to-[#0EA5E9] shadow-md shadow-[#2563EB]/25"
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
                                    className="h-40 animate-pulse rounded-3xl border border-[#DCEAFB] bg-white dark:border-[rgba(96,165,250,0.1)] dark:bg-[rgba(96,165,250,0.04)]"
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
                                    <div className="flex items-center justify-between rounded-3xl border border-[#DCEAFB] bg-white px-4 py-3 dark:border-[rgba(96,165,250,0.14)] dark:bg-[#0A1930]">
                                        <div className="flex items-center gap-2">
                                            <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-[#2563EB]/10 text-[#2563EB] dark:text-[#38BDF8]">
                                                <ClipboardList size={16} />
                                            </div>

                                            <div>
                                                <h2 className="text-[13px] font-black">
                                                    تسک‌های خرید
                                                </h2>

                                                <p className="text-[10px] font-medium text-[#5D7595] dark:text-[#8FAAD1]">
                                                    {safeTasks.length} تسک
                                                </p>
                                            </div>
                                        </div>
                                    </div>

                                    {safeTasks.length === 0 ? (
                                        <div className="flex min-h-[260px] flex-col items-center justify-center rounded-3xl border border-dashed border-[#BFD9FA] bg-white dark:border-[rgba(96,165,250,0.2)] dark:bg-[rgba(96,165,250,0.03)]">
                                            <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-2xl bg-[#EEF5FF] text-[#2563EB] dark:bg-[rgba(96,165,250,0.08)] dark:text-[#38BDF8]">
                                                <ClipboardList size={21} />
                                            </div>

                                            <span className="text-[13px] font-bold text-[#3D5B82] dark:text-[#C7D9F2]">
                                                تسکی وجود ندارد
                                            </span>

                                            <span className="mt-1 text-[10px] text-[#5D7595] dark:text-[#8FAAD1]">
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
                                    <div className="flex items-center justify-between rounded-3xl border border-[#DCEAFB] bg-white px-4 py-3 dark:border-[rgba(96,165,250,0.14)] dark:bg-[#0A1930]">
                                        <div className="flex items-center gap-2">
                                            <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-[#2563EB]/10 text-[#2563EB] dark:text-[#38BDF8]">
                                                <ListOrdered size={16} />
                                            </div>

                                            <div>
                                                <h2 className="text-[13px] font-black">
                                                    مراحل خرید
                                                </h2>

                                                <p className="text-[10px] font-medium text-[#5D7595] dark:text-[#8FAAD1]">
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
                                            className="flex h-9 items-center gap-1.5 rounded-xl bg-gradient-to-r from-[#2563EB] to-[#0EA5E9] px-3 text-[11px] font-bold text-white shadow-lg shadow-[#2563EB]/25 transition hover:brightness-110"
                                        >
                                            <Plus size={15} />
                                            <span>مرحله جدید</span>
                                        </button>
                                    </div>

                                    {safeSteps.length === 0 ? (
                                        <div className="flex min-h-[260px] flex-col items-center justify-center rounded-3xl border border-dashed border-[#BFD9FA] bg-white dark:border-[rgba(96,165,250,0.2)] dark:bg-[rgba(96,165,250,0.03)]">
                                            <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-2xl bg-[#EEF5FF] text-[#2563EB] dark:bg-[rgba(96,165,250,0.08)] dark:text-[#38BDF8]">
                                                <ListOrdered size={21} />
                                            </div>

                                            <span className="text-[13px] font-bold text-[#3D5B82] dark:text-[#C7D9F2]">
                                                مرحله‌ای وجود ندارد
                                            </span>

                                            <span className="mt-1 text-[10px] text-[#5D7595] dark:text-[#8FAAD1]">
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
                                    <div className="flex items-center justify-between rounded-3xl border border-[#DCEAFB] bg-white px-4 py-3 dark:border-[rgba(96,165,250,0.14)] dark:bg-[#0A1930]">
                                        <div className="flex items-center gap-2">
                                            <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-[#2563EB]/10 text-[#2563EB] dark:text-[#38BDF8]">
                                                <Users size={16} />
                                            </div>

                                            <div>
                                                <h2 className="text-[13px] font-black">
                                                    کارمندان خرید
                                                </h2>

                                                <p className="text-[10px] font-medium text-[#5D7595] dark:text-[#8FAAD1]">
                                                    {safeEmployees.length} کارمند
                                                </p>
                                            </div>
                                        </div>

                                        <button
                                            type="button"
                                            onClick={() =>
                                                setEmployeeModalOpen(true)
                                            }
                                            className="flex h-9 items-center gap-1.5 rounded-xl bg-gradient-to-r from-[#2563EB] to-[#0EA5E9] px-3 text-[11px] font-bold text-white shadow-lg shadow-[#2563EB]/25 transition hover:brightness-110"
                                        >
                                            <Plus size={15} />
                                            <span>افزودن کارمند</span>
                                        </button>
                                    </div>

                                    {safeEmployees.length === 0 ? (
                                        <div className="flex min-h-[260px] flex-col items-center justify-center rounded-3xl border border-dashed border-[#BFD9FA] bg-white dark:border-[rgba(96,165,250,0.2)] dark:bg-[rgba(96,165,250,0.03)]">
                                            <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-2xl bg-[#EEF5FF] text-[#2563EB] dark:bg-[rgba(96,165,250,0.08)] dark:text-[#38BDF8]">
                                                <Users size={21} />
                                            </div>

                                            <span className="text-[13px] font-bold text-[#3D5B82] dark:text-[#C7D9F2]">
                                                کارمندی اضافه نشده است
                                            </span>

                                            <span className="mt-1 text-[10px] text-[#5D7595] dark:text-[#8FAAD1]">
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
                steps={safeSteps}
                employees={safeEmployees}
                onSaved={() => {
                    handleStepModalClose();
                    loadAll(true);
                }}
            />
        </div>
    );
}