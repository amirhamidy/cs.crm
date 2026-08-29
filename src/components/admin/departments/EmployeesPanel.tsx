"use client";

import { AnimatePresence, motion } from "framer-motion";
import { Plus, Trash2, Users } from "lucide-react";
import { Department, Employee } from "./types";
import { useState } from "react";

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
        <div className="rounded-2xl border border-gray-100 dark:border-white/[0.06] overflow-hidden">
            <div
                className="px-5 py-4"
                style={{ background: `linear-gradient(135deg, ${accent}12, ${accent}06)` }}
            >
                <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2.5">
                        <div
                            className="w-8 h-8 rounded-xl flex items-center justify-center"
                            style={{ background: `${accent}20` }}
                        >
                            <Users size={15} style={{ color: accent }} />
                        </div>
                        <div>
                            <p className="text-[13px] font-bold text-gray-900 dark:text-white">اعضای تیم</p>
                            <p className="text-[11px] text-gray-400 dark:text-gray-500">
                                {department.employees.length} نفر عضو فعال
                            </p>
                        </div>
                    </div>
                    <button
                        onClick={onAddEmployee}
                        className="flex items-center gap-1.5 text-[12px] px-3 py-1.5 rounded-xl font-semibold active:scale-95 transition-all duration-150"
                        style={{ backgroundColor: `${accent}18`, color: accent, border: `1px solid ${accent}30` }}
                    >
                        <Plus size={13} strokeWidth={2.5} />
                        افزودن
                    </button>
                </div>

                {department.employees.length > 0 && (
                    <div className="flex flex-wrap gap-1.5">
                        <AnimatePresence>
                            {department.employees.map((emp) => {
                                const hasTask = employeeHasTask(emp.id);
                                return (
                                    <motion.div
                                        key={emp.id}
                                        initial={{ opacity: 0, scale: 0.85 }}
                                        animate={{ opacity: 1, scale: 1 }}
                                        exit={{ opacity: 0, scale: 0.85 }}
                                        transition={{ duration: 0.15 }}
                                        className="group relative flex items-center gap-1.5 px-2 py-1 rounded-lg"
                                        style={{ background: `${accent}15`, border: `1px solid ${accent}25` }}
                                    >
                                        <div
                                            className="w-5 h-5 rounded-md flex items-center justify-center text-[10px] font-bold shrink-0"
                                            style={{ background: `${accent}30`, color: accent }}
                                        >
                                            {emp.name.charAt(0)}
                                        </div>
                                        <span className="text-[11px] font-semibold" style={{ color: accent }}>
                                            {emp.name}
                                        </span>
                                        <div className="relative">
                                            <button
                                                onClick={() => {
                                                    if (hasTask) return;
                                                    onDeleteEmployee(emp);
                                                }}
                                                onMouseEnter={() => hasTask && setTooltipVisible(emp.id)}
                                                onMouseLeave={() => setTooltipVisible(null)}
                                                className="opacity-0 group-hover:opacity-100 transition-opacity duration-150 rounded p-0.5 hover:bg-red-500/15"
                                                style={{
                                                    color: hasTask ? "#9ca3af" : `${accent}80`,
                                                    cursor: hasTask ? "not-allowed" : "pointer",
                                                }}
                                            >
                                                <Trash2 size={10} />
                                            </button>

                                            <AnimatePresence>
                                                {tooltipVisible === emp.id && hasTask && (
                                                    <motion.div
                                                        initial={{ opacity: 0, y: 4, scale: 0.95 }}
                                                        animate={{ opacity: 1, y: 0, scale: 1 }}
                                                        exit={{ opacity: 0, y: 4, scale: 0.95 }}
                                                        transition={{ duration: 0.15, ease: "easeOut" }}
                                                        className="absolute bottom-full left-1/2 z-50 mb-2 -translate-x-1/2 whitespace-nowrap"
                                                        dir="rtl"
                                                    >
                                                        <div
                                                            className="flex flex-col items-center gap-1 rounded-2xl px-3 py-2 text-center shadow-xl"
                                                            style={{
                                                                background: "#1e293b",
                                                                border: "1px solid rgba(0,0,0,0.12)",
                                                            }}
                                                        >
                                                            <span className="text-[11px] font-bold text-white">
                                                                این عضو وظیفه دارد
                                                            </span>
                                                            <span className="text-[10px] text-slate-400">
                                                                برای حذف آن ابتدا وظایفش را حذف کنید
                                                            </span>
                                                        </div>
                                                    </motion.div>
                                                )}
                                            </AnimatePresence>
                                        </div>
                                    </motion.div>
                                );
                            })}
                        </AnimatePresence>
                    </div>
                )}
            </div>

            {department.employees.length === 0 && (
                <div className="flex flex-col items-center justify-center py-10 gap-2 bg-white dark:bg-white/[0.01]">
                    <div
                        className="w-12 h-12 rounded-2xl flex items-center justify-center mb-1"
                        style={{ background: `${accent}10` }}
                    >
                        <Users size={20} style={{ color: `${accent}60` }} />
                    </div>
                    <p className="text-[13px] font-medium text-gray-400 dark:text-gray-500">هنوز عضوی اضافه نشده</p>
                    <button
                        onClick={onAddEmployee}
                        className="text-[12px] font-semibold mt-1 transition-opacity hover:opacity-70"
                        style={{ color: accent }}
                    >
                        اولین عضو را اضافه کنید ←
                    </button>
                </div>
            )}
        </div>
    );
}