"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Trash2, Pencil, Users, GitBranch, Calendar, ChevronLeft } from "lucide-react";
import { useTheme } from "next-themes";
import { Department } from "./types";

interface Props {
    department: Department;
    index: number;
    isSelected: boolean;
    onClick: () => void;
    onDelete: () => void;
    onEdit: () => void;
}

export default function DepartmentCard({
    department,
    index,
    isSelected,
    onClick,
    onDelete,
    onEdit,
}: Props) {
    const { resolvedTheme } = useTheme();
    const isDark = resolvedTheme === "dark";
    const [hovered, setHovered] = useState(false);

    const accent = department.accent || "#6366f1";
    const initials = department.name.charAt(0);

    return (
        <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.2, delay: index * 0.05 }}
            onHoverStart={() => setHovered(true)}
            onHoverEnd={() => setHovered(false)}
            onClick={onClick}
            className="relative rounded-2xl p-4 flex flex-col gap-3 overflow-hidden cursor-pointer"
            style={{
                border: isSelected
                    ? `1px solid ${accent}44`
                    : isDark
                        ? "1px solid rgba(255,255,255,0.06)"
                        : "1px solid rgba(0,0,0,0.06)",
                minHeight: "130px",
                background: isSelected
                    ? `radial-gradient(circle at top right, ${accent}12 0%, transparent 70%)`
                    : isDark
                        ? "rgba(255,255,255,0.02)"
                        : "#fafafa",
                boxShadow: isSelected ? `0 0 0 2px ${accent}22` : "none",
            }}
        >
            <svg
                className="absolute inset-0 w-full h-full pointer-events-none"
                style={{ borderRadius: "1rem" }}
            >
                <defs>
                    <linearGradient
                        id={`borderGrad-${department.id}`}
                        x1="100%"
                        y1="100%"
                        x2="0%"
                        y2="0%"
                    >
                        <stop offset="0%" stopColor={accent} />
                        <stop offset="100%" stopColor={accent} stopOpacity="0.5" />
                    </linearGradient>
                </defs>
                <motion.rect
                    x="1"
                    y="1"
                    width="calc(100% - 2px)"
                    height="calc(100% - 2px)"
                    rx="15"
                    ry="15"
                    fill="none"
                    stroke={`url(#borderGrad-${department.id})`}
                    strokeWidth="1.5"
                    pathLength="1"
                    initial={{ pathLength: 0, opacity: 0 }}
                    animate={
                        hovered || isSelected
                            ? { pathLength: 1, opacity: 1 }
                            : { pathLength: 0, opacity: 0 }
                    }
                    transition={{ duration: 0.55, ease: "easeInOut" }}
                />
            </svg>

            <div className="absolute top-3 left-3 flex items-center gap-1.5 z-10">
                <button
                    onClick={(e) => {
                        e.stopPropagation();
                        onEdit();
                    }}
                    className="w-7 h-7 rounded-xl flex items-center justify-center transition-colors"
                    style={{
                        background: isDark
                            ? "rgba(99,102,241,0.1)"
                            : "rgba(99,102,241,0.07)",
                        color: isDark ? "#a5b4fc" : "#6366f1",
                    }}
                    type="button"
                >
                    <Pencil size={11} />
                </button>
                <button
                    onClick={(e) => {
                        e.stopPropagation();
                        onDelete();
                    }}
                    className="w-7 h-7 rounded-xl flex items-center justify-center transition-colors"
                    style={{
                        background: isDark
                            ? "rgba(239,68,68,0.1)"
                            : "rgba(239,68,68,0.07)",
                        color: "#ef4444",
                    }}
                    type="button"
                >
                    <Trash2 size={11} />
                </button>
            </div>

            <div className="flex items-center gap-3 pt-1">
                <div
                    className="w-11 h-11 rounded-2xl flex items-center justify-center text-white text-[15px] font-extrabold flex-shrink-0"
                    style={{
                        background: `linear-gradient(135deg, ${accent}, ${accent}dd)`,
                        boxShadow: `0 8px 16px ${accent}33`,
                    }}
                >
                    {initials}
                </div>
                <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                        <p className="text-[13.5px] font-extrabold text-gray-800 dark:text-gray-100 leading-tight truncate">
                            {department.name}
                        </p>
                        <ChevronLeft
                            size={14}
                            className={`shrink-0 transition-transform duration-300 ${isSelected ? "rotate-180" : ""}`}
                            style={{ color: isSelected ? accent : "rgba(156, 163, 175, 0.4)" }}
                        />
                    </div>
                    <p className="text-[11.5px] text-gray-400 dark:text-gray-500 truncate mt-0.5">
                        {department.description || "بدون توضیحات"}
                    </p>
                </div>
            </div>

            <div
                className="pt-2.5 border-t mt-auto"
                style={{
                    borderColor: isDark
                        ? "rgba(255,255,255,0.05)"
                        : "rgba(0,0,0,0.05)",
                }}
            >
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="flex items-center gap-1 text-[11px] text-gray-400">
                            <Users size={12} />
                            {department.employees.length}
                        </div>
                        <div className="flex items-center gap-1 text-[11px] text-gray-400">
                            <GitBranch size={12} />
                            {department.stages.length}
                        </div>
                    </div>
                    <div className="flex items-center gap-1 text-[10px] text-gray-400">
                        <Calendar size={11} />
                        {department.createdAt}
                    </div>
                </div>
            </div>

            {isSelected && (
                <div
                    className="absolute inset-0 rounded-2xl pointer-events-none"
                    style={{
                        boxShadow: `inset 0 0 30px ${accent}08`,
                    }}
                />
            )}
        </motion.div>
    );
}
