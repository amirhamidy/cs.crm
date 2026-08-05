"use client";

import { AnimatePresence, motion } from "framer-motion";
import { Plus, Trash2, Users, User } from "lucide-react";
import { Department, Employee } from "./types";

interface Props {
    department: Department;
    onAddEmployee: () => void;
    onDeleteEmployee: (employee: Employee) => void;
}

export default function EmployeesPanel({ department, onAddEmployee, onDeleteEmployee }: Props) {
    const accent = department.accent;

    return (
        <div
            className="rounded-2xl border p-5 bg-white/50 dark:bg-white/[0.02]"
            style={{
                borderColor: `${accent}22`,
                boxShadow: `0 0 0 1px ${accent}11`,
            }}
        >
            <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                    <Users size={16} style={{ color: accent }} />
                    <h3 className="text-sm font-semibold text-gray-900 dark:text-white">اعضا</h3>
                    <span
                        className="text-[10px] font-medium px-2 py-0.5 rounded-full"
                        style={{
                            backgroundColor: `${accent}18`,
                            color: accent,
                            border: `1px solid ${accent}35`,
                        }}
                    >
                        {department.employees.length}
                    </span>
                </div>
                <button
                    onClick={onAddEmployee}
                    className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-xl font-medium
                        active:scale-95 transition-all duration-150"
                    style={{
                        backgroundColor: `${accent}18`,
                        color: accent,
                        border: `1px solid ${accent}30`,
                    }}
                >
                    <Plus size={13} />
                    افزودن عضو
                </button>
            </div>

            {department.employees.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-8 text-gray-400">
                    <Users size={32} className="mb-2 opacity-30" />
                    <p className="text-sm">هنوز عضوی اضافه نشده</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    <AnimatePresence>
                        {department.employees.map((emp) => (
                            <motion.div
                                key={emp.id}
                                initial={{ opacity: 0, scale: 0.95 }}
                                animate={{ opacity: 1, scale: 1 }}
                                exit={{ opacity: 0, scale: 0.9 }}
                                transition={{ duration: 0.2 }}
                                className="group flex items-center gap-3 p-3 rounded-xl border
                                    border-gray-200 dark:border-white/10
                                    bg-gray-50/50 dark:bg-white/[0.02]
                                    hover:bg-gray-100/50 dark:hover:bg-white/[0.05]
                                    transition-colors duration-200"
                            >
                                <div
                                    className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0"
                                    style={{
                                        background: `linear-gradient(135deg, ${accent}30, ${accent}15)`,
                                    }}
                                >
                                    <User size={16} style={{ color: accent }} />
                                </div>
                                <div className="flex-1 min-w-0">
                                    <p className="text-sm text-gray-800 dark:text-white font-medium truncate">
                                        {emp.name}
                                    </p>
                                    <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
                                        {emp.role}
                                    </p>
                                </div>
                                <button
                                    onClick={() => onDeleteEmployee(emp)}
                                    className="p-1.5 rounded-lg bg-red-500/10 text-red-400
                                        hover:bg-red-500/20 transition-colors shrink-0
                                        opacity-0 group-hover:opacity-100
                                        scale-90 group-hover:scale-100
                                        transition-all duration-200"
                                >
                                    <Trash2 size={14} />
                                </button>
                            </motion.div>
                        ))}
                    </AnimatePresence>
                </div>
            )}
        </div>
    );
}
