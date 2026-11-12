"use client";

import { AnimatePresence, motion } from "framer-motion";
import { Plus, Trash2, Users, X } from "lucide-react";
import { useState } from "react";
import { Department, Employee } from "./types";

interface Props {
    department: Department;
    onAddEmployee: () => void;
    onDeleteEmployee: (employee: Employee) => void;
    employeeHasTask?: (employeeId: string) => boolean;
}

export default function EmployeesPanel({
    department,
    onAddEmployee,
    onDeleteEmployee,
    employeeHasTask = () => false,
}: Props) {
    const accent = department.accent;
    const [tooltipVisible, setTooltipVisible] = useState<string | null>(null);

    return (
        <div
            className="overflow-hidden flex justify-between items-center pl-5 rounded-[1.5rem] border border-gray-200/60 bg-white/50 dark:border-white/[0.06] dark:bg-white/[0.015]"
            dir="rtl"
        >
            <div className="flex justify-start items-center">
                <div className="flex items-center justify-between gap-3 px-3.5 py-3">
                    <div className="flex min-w-0 items-center gap-2.5">
                        <div
                            className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl"
                            style={{
                                background: `${accent}14`,
                                border: `1px solid ${accent}20`,
                            }}
                        >
                            <Users size={14} style={{ color: accent }} />
                        </div>

                        <div className="min-w-0">
                            <div className="flex items-center gap-1.5">
                                <p className="text-[12px] font-extrabold text-gray-800 dark:text-gray-100">
                                    اعضای تیم
                                </p>

                                <span
                                    className="rounded-full px-1.5 py-0.5 text-[11px] font-extrabold"
                                    style={{
                                        background: `${accent}12`,
                                        color: accent,
                                    }}
                                >
                                    {department.employees.length}
                                </span>
                            </div>

                            <p className="mt-0.5 text-[11.5px] font-medium text-gray-400 dark:text-gray-500">
                                اعضای فعال دپارتمان
                            </p>
                        </div>
                    </div>
                </div>

                <div className="border-t border-gray-100/80 px-3.5 py-2.5 dark:border-white/[0.05] flex justify-center">
                    {department.employees.length === 0 ? (
                        <button
                            type="button"
                            onClick={onAddEmployee}
                            className="flex w-full items-center justify-center gap-1.5 py-1 text-[10.5px] font-semibold text-gray-400 transition hover:text-gray-600 dark:text-gray-500 dark:hover:text-gray-300"
                        >
                            <Plus size={11} />
                            اولین عضو را اضافه کنید
                        </button>
                    ) : (
                        <div className="min-w-0 items-center flex justify-center">
                            <div className="flex shrink-0 items-center">
                                {department.employees.slice(0, 6).map((employee, index) => {
                                    const hasTask = employeeHasTask(employee.id);

                                    return (
                                        <div
                                            key={employee.id}
                                            className={`group relative  ${index !== 0 ? "-mr-1.5" : ""}`}
                                            style={{ zIndex: 20 - index }}
                                        >
                                            <button
                                                type="button"
                                                onClick={() => {
                                                    if (!hasTask) {
                                                        onDeleteEmployee(employee);
                                                    }
                                                }}
                                                onMouseEnter={() =>
                                                    hasTask && setTooltipVisible(employee.id)
                                                }
                                                onMouseLeave={() => setTooltipVisible(null)}
                                                className="relative flex h-7 w-7 items-center justify-center rounded-full border-2 border-white text-[9px] font-extrabold transition-all hover:scale-105 dark:border-[#111827]"
                                                style={{
                                                    background: `${accent}20`,
                                                    color: accent,
                                                    cursor: hasTask ? "not-allowed" : "pointer",
                                                }}
                                            >
                                                {employee.name?.charAt(0) || "U"}

                                                {!hasTask && (
                                                    <span className="absolute inset-0 flex items-center justify-center rounded-full bg-red-500 text-white opacity-0 transition-opacity group-hover:opacity-100">
                                                        <X size={10} strokeWidth={2.5} />
                                                    </span>
                                                )}
                                            </button>

                                            <AnimatePresence>
                                                {tooltipVisible === employee.id && hasTask && (
                                                    <motion.div
                                                        initial={{
                                                            opacity: 0,
                                                            y: 4,
                                                            scale: 0.95,
                                                        }}
                                                        animate={{
                                                            opacity: 1,
                                                            y: 0,
                                                            scale: 1,
                                                        }}
                                                        exit={{
                                                            opacity: 0,
                                                            y: 4,
                                                            scale: 0.95,
                                                        }}
                                                        transition={{ duration: 0.15 }}
                                                        className="pointer-events-none absolute bottom-full left-1/2 z-50 mb-2 -translate-x-1/2 whitespace-nowrap"
                                                    >
                                                        <div className="rounded-xl border border-white/[0.08] bg-slate-800 px-2.5 py-1.5 text-center shadow-xl">
                                                            <p className="text-[11.5px] font-bold text-white">
                                                                این عضو وظیفه دارد
                                                            </p>
                                                            <p className="mt-0.5 text-[8.5px] text-slate-400">
                                                                ابتدا وظایفش را حذف کنید
                                                            </p>
                                                        </div>
                                                    </motion.div>
                                                )}
                                            </AnimatePresence>
                                        </div>
                                    );
                                })}
                            </div>

                            <div className="mr-2 min-w-0 ">
                                <div className="flex min-w-0 items-center gap-1">
                                    <p className="truncate text-[11.5px] font-extrabold text-gray-700 dark:text-gray-200">
                                        {department.employees
                                            .slice(0, 2)
                                            .map((employee) => employee.name)
                                            .join("، ")}
                                    </p>

                                    {department.employees.length > 2 && (
                                        <span
                                            className="shrink-0 text-[12.5px] font-bold"
                                            style={{ color: accent }}
                                        >
                                            +{department.employees.length - 2}
                                        </span>
                                    )}
                                </div>

                                <p className="mt-0.5 text-[11.5px] font-medium text-gray-400 dark:text-gray-500">
                                    برای حذف، روی عضو کلیک کنید
                                </p>
                            </div>
                        </div>
                    )}
                </div>
            </div>
            <button
                type="button"
                onClick={onAddEmployee}
                className="flex h-7 shrink-0 items-center gap-1.5 rounded-xl px-2.5 text-[10.5px] font-extrabold transition-all active:scale-95"
                style={{
                    background: `${accent}14`,
                    border: `1px solid ${accent}28`,
                    color: accent,
                }}
            >
                <Plus size={11} strokeWidth={2.7} />
                افزودن
            </button>
        </div>
    );
}