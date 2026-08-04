"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Building2, ChevronLeft, Users, GitBranch, Calendar, Trash2 } from "lucide-react";
import { Department } from "./types";

interface Props {
    department: Department;
    index: number;
    isSelected: boolean;
    onSelect: () => void;
    onDelete: () => void;
}

export default function DepartmentCard({ department, index, isSelected, onSelect, onDelete }: Props) {
    const [hovered, setHovered] = useState(false);
    const accent = department.accent;
    const initials = department.name
        .split(" ")
        .slice(0, 2)
        .map((w) => w[0])
        .join("");

    return (
        <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            transition={{ duration: 0.4, delay: index * 0.04, ease: [0.23, 1, 0.32, 1] }}
            onMouseEnter={() => setHovered(true)}
            onMouseLeave={() => setHovered(false)}
            onClick={onSelect}
            className="relative rounded-2xl p-4 border backdrop-blur-xl transition-all duration-300 cursor-pointer"
            style={{
                borderColor: isSelected ? `${accent}44` : `${accent}22`,
                boxShadow: isSelected
                    ? `0 0 0 2px ${accent}33, 0 8px 32px ${accent}15`
                    : `0 0 0 1px ${accent}11, 0 4px 24px 0 ${accent}0a`,
                background: isSelected
                    ? `radial-gradient(ellipse at top right, ${accent}18 0%, transparent 70%)`
                    : `radial-gradient(ellipse at top right, ${accent}0a 0%, transparent 65%)`,
            }}
        >
            <div
                className="absolute top-0 right-0 w-32 h-32 rounded-full blur-3xl opacity-10 pointer-events-none"
                style={{ background: accent }}
            />

            <div className="relative z-10 flex items-start gap-3">
                <div
                    className="flex-shrink-0 flex items-center justify-center rounded-xl font-bold text-white text-sm"
                    style={{
                        background: `linear-gradient(135deg, ${accent}cc, ${accent}66)`,
                        boxShadow: `0 4px 16px ${accent}35`,
                        width: 42,
                        height: 42,
                    }}
                >
                    {initials}
                </div>
                <div className="flex-1 min-w-0">
                    <p className="font-semibold text-sm text-gray-900 dark:text-white leading-tight">
                        {department.name}
                    </p>
                    <p className="text-[11px] text-gray-500 dark:text-gray-400 mt-0.5 line-clamp-1">
                        {department.description}
                    </p>
                </div>
                <ChevronLeft
                    size={16}
                    className={`flex-shrink-0 transition-transform duration-300 ${isSelected ? "rotate-180" : ""
                        }`}
                    style={{ color: isSelected ? accent : "rgb(156 163 175 / 0.5)" }}
                />
            </div>

            <div className="relative z-10 mt-3 flex items-center gap-3 pt-3 border-t border-gray-100 dark:border-white/10">
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

            <AnimatePresence>
                {hovered && !isSelected && (
                    <motion.button
                        initial={{ opacity: 0, scale: 0.8 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.8 }}
                        onClick={(e) => {
                            e.stopPropagation();
                            onDelete();
                        }}
                        className="absolute top-3 left-3 z-20 p-1.5 rounded-lg bg-red-500/10 text-red-400 hover:bg-red-500/20 transition-colors"
                    >
                        <Trash2 size={14} />
                    </motion.button>
                )}
            </AnimatePresence>

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