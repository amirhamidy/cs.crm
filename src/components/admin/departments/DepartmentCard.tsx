"use client";

import { AnimatePresence, motion } from "framer-motion";
import { Building2, Pencil, Trash2, UserRound } from "lucide-react";
import { useRouter } from "next/navigation";
import { Department } from "./types";
import { useState } from "react";

interface Props {
    department: Department;
    index: number;
    isSelected: boolean;
    onDelete: () => void;
    onEdit: () => void;
    hasDependencies?: boolean;
    dependencyMessage?: string;
}

const AVATAR_GRADIENTS = [
    ["#6366f1", "#8b5cf6"],
    ["#3b82f6", "#6366f1"],
    ["#8b5cf6", "#ec4899"],
    ["#06b6d4", "#6366f1"],
    ["#f59e0b", "#ef4444"],
    ["#10b981", "#3b82f6"],
    ["#f472b6", "#ec4899"],
    ["#8b5cf6", "#f59e0b"],
];

function gradientFor(id: number) {
    return AVATAR_GRADIENTS[Math.abs(id) % AVATAR_GRADIENTS.length];
}

export default function DepartmentCard({
    department,
    index,
    isSelected,
    onDelete,
    onEdit,
    hasDependencies = false,
    dependencyMessage = "این دپارتمان وابستگی دارد",
}: Props) {
    const router = useRouter();
    const [tooltipVisible, setTooltipVisible] = useState(false);

    const accent = department.accent || "#6366f1";
    const stages = [...(department.stages || [])].sort(
        (a: any, b: any) => (a.order ?? 0) - (b.order ?? 0)
    );
    const employees = department.employees || [];

    return (
        <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.05 }}
            onClick={() =>
                router.push(`/admin/departments/${department.id}`)
            }
            className={`relative cursor-pointer rounded-2xl border p-4 transition-all duration-200 ${isSelected
                ? "border-indigo-200 bg-indigo-50/60 dark:border-indigo-500/30 dark:bg-indigo-500/10"
                : "border-gray-100 bg-white hover:border-gray-200 hover:bg-gray-50/60 dark:border-white/[0.06] dark:bg-white/[0.02] dark:hover:bg-white/[0.04]"
                }`}
        >
            <div className="flex items-center justify-between gap-3">
                <div className="flex min-w-0 items-center gap-3">
                    <div
                        className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl"
                        style={{
                            backgroundColor: `${accent}18`,
                            border: `1px solid ${accent}30`,
                        }}
                    >
                        <Building2 size={16} style={{ color: accent }} />
                    </div>

                    <div className="min-w-0">
                        <p className="truncate text-[13px] font-bold text-gray-900 dark:text-white">
                            {department.name}
                        </p>

                        <p className="text-[11px] text-gray-400">
                            {employees.length} عضو · {stages.length} فرآیند
                        </p>
                    </div>
                </div>

                <div className="flex shrink-0 items-center gap-1">
                    <button
                        type="button"
                        onClick={(e) => {
                            e.stopPropagation();
                            onEdit();
                        }}
                        className="flex h-7 w-7 items-center justify-center rounded-lg text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-600 dark:hover:bg-white/[0.06] dark:hover:text-gray-300"
                    >
                        <Pencil size={13} />
                    </button>

                    <div className="relative">
                        <button
                            type="button"
                            onClick={(e) => {
                                e.stopPropagation();

                                if (hasDependencies) {
                                    return;
                                }

                                onDelete();
                            }}
                            onMouseEnter={() =>
                                hasDependencies && setTooltipVisible(true)
                            }
                            onMouseLeave={() => setTooltipVisible(false)}
                            className="flex h-7 w-7 items-center justify-center rounded-lg transition-colors"
                            style={{
                                background: hasDependencies
                                    ? "rgba(0,0,0,0.04)"
                                    : undefined,
                                color: hasDependencies
                                    ? "#9ca3af"
                                    : undefined,
                                cursor: hasDependencies
                                    ? "not-allowed"
                                    : "pointer",
                            }}
                        >
                            <Trash2 size={13} />
                        </button>

                        <AnimatePresence>
                            {tooltipVisible && (
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
                                            {dependencyMessage}
                                        </span>

                                        <span className="text-[10px] text-slate-400">
                                            برای حذف آن ابتدا وابستگی‌های این دپارتمان را حذف کنید
                                        </span>
                                    </div>
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </div>
                </div>
            </div>

            {stages.length > 0 && (
                <div className="mt-4 grid grid-cols-2 gap-x-3 gap-y-2.5">
                    {stages.map((stage: any, i: number) => (
                        <div
                            key={stage.id}
                            className="flex items-center gap-2.5 rounded-xl border border-gray-100 bg-gray-50/60 px-3 py-2.5 dark:border-white/[0.06] dark:bg-white/[0.02]"
                        >
                            <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full border border-gray-300 bg-white text-[10px] font-extrabold text-gray-500 dark:border-white/15 dark:bg-[#0f172a] dark:text-gray-400">
                                {i + 1}
                            </span>

                            <p className="min-w-0 flex-1 truncate text-[11.5px] font-bold leading-5 text-gray-600 dark:text-gray-300">
                                {stage.name}
                            </p>
                        </div>
                    ))}
                </div>
            )}

            {employees.length > 0 && (
                <div className="mt-4 flex flex-wrap items-center gap-2 border-t border-gray-100 pt-3 dark:border-white/[0.05]">
                    {employees.map((emp: any) => {
                        const empId = emp.id ?? emp.employee ?? 0;
                        const gradient = gradientFor(empId);
                        const name = emp.employee_name || emp.name;

                        return (
                            <div
                                key={emp.id}
                                className="flex items-center gap-1.5 rounded-full border border-gray-100 bg-gray-50 py-0.5 pl-2 pr-0.5 dark:border-white/[0.06] dark:bg-white/[0.04]"
                            >
                                <span
                                    className="flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-full text-[9px] font-extrabold text-white"
                                    style={{
                                        background: `linear-gradient(135deg, ${gradient[0]}, ${gradient[1]})`,
                                    }}
                                >
                                    <UserRound size={11} />
                                </span>
                                <span className="text-[10.5px] font-bold text-gray-600 dark:text-gray-300">
                                    {name}
                                </span>
                            </div>
                        );
                    })}
                </div>
            )}
        </motion.div>
    );
}