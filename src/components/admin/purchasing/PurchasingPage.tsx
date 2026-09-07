"use client";

import { useCallback, useEffect, useState } from "react";
import { motion } from "framer-motion";
import { ClipboardList, LayoutGrid, ListOrdered, Loader2, Plus, UserCog } from "lucide-react";
import axiosInstance from "@/lib/axiosInstance";
import { ApiPurchasingEmployee, ApiPurchasingStep, ApiPurchasingTask, ApiTaskAttachment } from "@/types/purchasing";
import PurchasingEmployeeModal from "@/components/admin/purchasing/PurchasingEmployeeModal";
import PurchasingEmployeeCard from "@/components/admin/purchasing/PurchasingEmployeeCard";
import StepModal from "@/components/admin/purchasing/StepModal";
import StepCard from "@/components/admin/purchasing/StepCard";
import TaskCard from "@/components/admin/purchasing/TaskCard";
import PurchasingOverview from "@/components/admin/purchasing/PurchasingOverview";

type Tab = "overview" | "tasks" | "steps" | "employees";

const TABS: { id: Tab; label: string; icon: typeof LayoutGrid }[] = [
    { id: "overview", label: "نمای کلی", icon: LayoutGrid },
    { id: "tasks", label: "وظایف خرید", icon: ClipboardList },
    { id: "steps", label: "مراحل فرآیند", icon: ListOrdered },
    { id: "employees", label: "کارمندان خرید", icon: UserCog },
];

function extractList<T>(data: unknown): T[] {
    if (Array.isArray(data)) return data as T[];
    if (data && typeof data === "object") {
        const record = data as Record<string, unknown>;
        if (Array.isArray(record.results)) return record.results as T[];
        if (Array.isArray(record.data)) return record.data as T[];
    }
    return [];
}

export default function PurchasingPage() {
    const [tab, setTab] = useState<Tab>("overview");

    const [employees, setEmployees] = useState<ApiPurchasingEmployee[]>([]);
    const [steps, setSteps] = useState<ApiPurchasingStep[]>([]);
    const [tasks, setTasks] = useState<ApiPurchasingTask[]>([]);
    const [attachments, setAttachments] = useState<ApiTaskAttachment[]>([]);

    const [loading, setLoading] = useState(true);

    const [showEmployeeModal, setShowEmployeeModal] = useState(false);
    const [showStepModal, setShowStepModal] = useState(false);

    const loadAll = useCallback(async () => {
        setLoading(true);
        try {
            const [employeesRes, stepsRes, tasksRes, attachmentsRes] = await Promise.all([
                axiosInstance.get("/purchasing/api/v1/employees/").catch(() => null),
                axiosInstance.get("/purchasing/api/v1/steps/").catch(() => null),
                axiosInstance.get("/purchasing/api/v1/tasks/").catch(() => null),
                axiosInstance.get("/purchasing/api/v1/task-attachments/").catch(() => null),
            ]);

            setEmployees(employeesRes ? extractList<ApiPurchasingEmployee>(employeesRes.data) : []);
            setSteps(stepsRes ? extractList<ApiPurchasingStep>(stepsRes.data) : []);
            setTasks(tasksRes ? extractList<ApiPurchasingTask>(tasksRes.data) : []);
            setAttachments(attachmentsRes ? extractList<ApiTaskAttachment>(attachmentsRes.data) : []);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        loadAll();
    }, [loadAll]);

    const pendingTasksCount = tasks.filter((t) => t.status !== "completed").length;

    function handleAddClick() {
        if (tab === "employees") setShowEmployeeModal(true);
        else if (tab === "steps") setShowStepModal(true);
    }

    return (
        <div dir="rtl" className="flex flex-col gap-6 p-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-[18px] font-extrabold text-gray-900 dark:text-white">خرید</h1>
                    <p className="mt-1 text-[12px] text-gray-400">
                        مدیریت فرآیند خرید، مراحل و کارمندان
                    </p>
                </div>

                {(tab === "employees" || tab === "steps") && (
                    <motion.button
                        type="button"
                        whileTap={{ scale: 0.96 }}
                        onClick={handleAddClick}
                        className="flex items-center gap-1.5 rounded-2xl bg-blue-600 px-4 py-2.5 text-[12.5px] font-bold text-white transition-colors hover:bg-blue-500"
                    >
                        <Plus size={15} />
                        {tab === "employees" && "افزودن کارمند"}
                        {tab === "steps" && "مرحله جدید"}
                    </motion.button>
                )}
            </div>

            <div className="flex flex-wrap gap-2 rounded-2xl bg-gray-100 p-1.5 dark:bg-white/[0.05]">
                {TABS.map((t) => (
                    <button
                        key={t.id}
                        type="button"
                        onClick={() => setTab(t.id)}
                        className={`relative flex items-center gap-1.5 rounded-xl px-4 py-2 text-[12px] font-extrabold transition-colors ${tab === t.id
                            ? "bg-white text-blue-600 shadow-sm dark:bg-[#1e293b]"
                            : "text-gray-400 dark:text-gray-500"
                            }`}
                    >
                        <t.icon size={14} />
                        {t.label}
                        {t.id === "tasks" && pendingTasksCount > 0 && (
                            <span className="flex h-4 min-w-4 items-center justify-center rounded-full bg-red-500 px-1 text-[9px] font-extrabold text-white">
                                {pendingTasksCount}
                            </span>
                        )}
                    </button>
                ))}
            </div>

            {loading ? (
                <div className="flex items-center justify-center py-20 text-gray-400">
                    <Loader2 size={22} className="animate-spin" />
                </div>
            ) : (
                <>
                    {tab === "overview" && (
                        <PurchasingOverview
                            employees={employees}
                            steps={steps}
                            tasks={tasks}
                            attachments={attachments}
                        />
                    )}

                    {tab === "tasks" && (
                        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                            {tasks.length === 0 ? (
                                <p className="col-span-full py-16 text-center text-[12.5px] text-gray-400">
                                    وظیفه خریدی ثبت نشده است
                                </p>
                            ) : (
                                tasks.map((task, index) => (
                                    <TaskCard
                                        key={task.id}
                                        task={task}
                                        index={index}
                                        employees={employees}
                                        onUpdated={() => loadAll()}
                                    />
                                ))
                            )}
                        </div>
                    )}

                    {tab === "steps" && (
                        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
                            {steps.length === 0 ? (
                                <p className="col-span-full py-16 text-center text-[12.5px] text-gray-400">
                                    هنوز مرحله‌ای تعریف نشده است
                                </p>
                            ) : (
                                [...steps]
                                    .sort((a, b) => a.order - b.order)
                                    .map((step, index) => (
                                        <StepCard
                                            key={step.id}
                                            step={step}
                                            index={index}
                                            employees={employees}
                                            onUpdated={(updated) =>
                                                setSteps((prev) =>
                                                    prev.map((s) => (s.id === updated.id ? updated : s))
                                                )
                                            }
                                            onDeleted={(id) =>
                                                setSteps((prev) => prev.filter((s) => s.id !== id))
                                            }
                                        />
                                    ))
                            )}
                        </div>
                    )}

                    {tab === "employees" && (
                        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
                            {employees.length === 0 ? (
                                <p className="col-span-full py-16 text-center text-[12.5px] text-gray-400">
                                    هنوز کارمندی به تیم خرید اضافه نشده است
                                </p>
                            ) : (
                                employees.map((emp, index) => (
                                    <PurchasingEmployeeCard
                                        key={emp.id}
                                        employee={emp}
                                        index={index}
                                        onUpdated={(updated) =>
                                            setEmployees((prev) =>
                                                prev.map((e) => (e.id === updated.id ? updated : e))
                                            )
                                        }
                                        onDeleted={(id) =>
                                            setEmployees((prev) => prev.filter((e) => e.id !== id))
                                        }
                                    />
                                ))
                            )}
                        </div>
                    )}
                </>
            )}

            <PurchasingEmployeeModal
                isOpen={showEmployeeModal}
                onClose={() => setShowEmployeeModal(false)}
                existingEmployees={employees}
                onCreated={(emp) => setEmployees((prev) => [...prev, emp])}
            />

            <StepModal
                isOpen={showStepModal}
                onClose={() => setShowStepModal(false)}
                employees={employees}
                onSaved={(step) => setSteps((prev) => [...prev, step])}
            />
        </div>
    );
}