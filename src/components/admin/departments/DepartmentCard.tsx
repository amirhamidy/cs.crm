"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronLeft, Users, GitBranch, Calendar, Trash2, Pencil } from "lucide-react";
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
    const accent = department.accent;

    const initials = department.name
        .split(" ")
        .slice(0, 2)
        .map((w) => w[0])
        .join("");

    const showActions = hovered;


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
                background: isSelected
                    ? `radial-gradient(ellipse at top right, ${accent}18 0%, transparent 70%)`
                    : "transparent",
                border: isSelected
                    ? `1px solid ${accent}44`
                    : isDark
                        ? "1px solid rgba(255,255,255,0.06)"
                        : "1px solid rgba(0,0,0,0.06)",
                boxShadow: isSelected
                    ? `0 0 0 2px ${accent}33, 0 8px 32px ${accent}15`
                    : "none",
                minHeight: "130px",
            }}
        >
            {/* Animated border on hover */}
            <svg
                className="absolute inset-0 w-full h-full pointer-events-none"
                style={{ borderRadius: "1rem" }}
            >
                <defs>
                    <linearGradient
                        id={`deptBorder-${department.id}`}
                        x1="100%" y1="100%" x2="0%" y2="0%"
                    >
                        <stop offset="0%" stopColor={accent} />
                        <stop offset="100%" stopColor={accent} stopOpacity="0.4" />
                    </linearGradient>
                </defs>
                <motion.rect
                    x="1" y="1"
                    width="calc(100% - 2px)"
                    height="calc(100% - 2px)"
                    rx="15" ry="15"
                    fill="none"
                    stroke={`url(#deptBorder-${department.id})`}
                    strokeWidth="1.5"
                    pathLength="1"
                    initial={{ pathLength: 0, opacity: 0 }}
                    animate={
                        hovered && !isSelected
                            ? { pathLength: 1, opacity: 1 }
                            : { pathLength: 0, opacity: 0 }
                    }
                    transition={{ duration: 0.55, ease: "easeInOut" }}
                />
            </svg>

            {/* Accent glow */}
            <div
                className="absolute top-0 right-0 w-32 h-32 rounded-full blur-3xl opacity-10 pointer-events-none"
                style={{ background: accent }}
            />

            {/* Top row */}
            <div className="relative z-10 flex items-center gap-3">
                <div
                    className="w-11 h-11 rounded-2xl flex items-center justify-center text-white text-[15px] font-extrabold flex-shrink-0"
                    style={{
                        background: `linear-gradient(135deg, ${accent}cc, ${accent}66)`,
                        boxShadow: `0 4px 16px ${accent}35`,
                    }}
                >
                    {initials}
                </div>
                <div className="flex-1 min-w-0">
                    <p className="text-[13.5px] font-extrabold text-gray-800 dark:text-gray-100 leading-tight">
                        {department.name}
                    </p>
                    <p className="text-[11px] text-gray-500 dark:text-gray-400 mt-0.5 line-clamp-1">
                        {department.description}
                    </p>
                </div>
                <ChevronLeft
                    size={16}
                    className={`flex-shrink-0 transition-transform duration-300 ${isSelected ? "rotate-180" : ""}`}
                    style={{ color: isSelected ? accent : "rgb(156 163 175 / 0.5)" }}
                />
            </div>

            {/* Stats row */}
            <div className="relative z-10 flex items-center gap-3 pt-2 border-t border-gray-100 dark:border-white/[0.05]">
                <div className="flex items-center gap-1.5 text-gray-500 dark:text-gray-400">
                    <Users size={12} />
                    <span className="text-[11px]">{department.employees.length}</span>
                </div>
                <div className="flex items-center gap-1.5 text-gray-500 dark:text-gray-400">
                    <GitBranch size={12} />
                    <span className="text-[11px]">{department.stages.length}</span>
                </div>
                <div className="flex items-center gap-1.5 text-gray-400 mr-auto">
                    <Calendar size={11} />
                    <span className="text-[10px]">{department.createdAt}</span>
                </div>
            </div>

            {/* Hover actions */}
            <AnimatePresence>
                {showActions && (
                    <motion.div
                        initial={{ opacity: 0, y: 6 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: 6 }}
                        transition={{ duration: 0.15 }}
                        className="absolute bottom-2 left-1/2 -translate-x-1/2 flex items-center gap-1.5"
                    >
                        <button
                            onClick={(e) => {
                                e.stopPropagation();
                                onEdit();
                            }}
                            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-[11.5px] font-bold transition-colors"
                            style={{
                                background: isDark ? `${accent}25` : `${accent}15`,
                                color: isDark ? `${accent}dd` : accent,
                            }}
                        >
                            <Pencil size={11} />
                            ویرایش
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
                        >
                            <Trash2 size={12} />
                        </button>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Selected inner glow */}
            {isSelected && (
                <div
                    className="absolute inset-0 rounded-2xl pointer-events-none"
                    style={{
                        boxShadow: `inset 0 0 40px ${accent}08`,
                        border: `2px solid ${accent}30`,
                    }}
                />
            )}
        </motion.div>
    );
}
