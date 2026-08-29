"use client";

import { AnimatePresence, motion } from "framer-motion";
import { Building2, Pencil, Trash2 } from "lucide-react";
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
                            backgroundColor: `${department.accent || "#6366f1"}18`,
                            border: `1px solid ${department.accent || "#6366f1"}30`,
                        }}
                    >
                        <Building2
                            size={16}
                            style={{
                                color: department.accent || "#6366f1",
                            }}
                        />
                    </div>

                    <div className="min-w-0">
                        <p className="truncate text-[13px] font-bold text-gray-900 dark:text-white">
                            {department.name}
                        </p>

                        <p className="text-[11px] text-gray-400">
                            {department.employees.length} عضو ·{" "}
                            {department.stages.length} فرآیند
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
        </motion.div>
    );
}