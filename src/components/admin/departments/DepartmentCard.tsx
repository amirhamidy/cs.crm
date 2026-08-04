"use client";

import { motion } from "framer-motion";
import { Users, GitBranch, ChevronLeft } from "lucide-react";
import { Department } from "./types";

interface Props {
    department: Department;
    isSelected: boolean;
    onClick: () => void;
}

export default function DepartmentCard({ department, isSelected, onClick }: Props) {
    return (
        <motion.button
            layout
            onClick={onClick}
            whileHover={{ scale: 1.01 }}
            whileTap={{ scale: 0.99 }}
            className={`w-full text-right p-4 rounded-2xl border transition-all duration-300 cursor-pointer ${isSelected
                    ? "bg-white/10 dark:bg-white/10 border-white/30 shadow-lg"
                    : "bg-white/5 dark:bg-white/5 border-white/10 hover:bg-white/8 hover:border-white/20"
                }`}
            style={isSelected ? { borderColor: `${department.accent}60`, boxShadow: `0 0 20px ${department.accent}20` } : {}}
        >
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-3 flex-1 min-w-0">
                    <div
                        className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
                        style={{ backgroundColor: `${department.accent}20` }}
                    >
                        <div className="w-3 h-3 rounded-full" style={{ backgroundColor: department.accent }} />
                    </div>
                    <div className="flex-1 min-w-0 text-right">
                        <p className="font-semibold text-sm text-white truncate">{department.name}</p>
                        <p className="text-xs text-white/50 truncate mt-0.5">{department.description}</p>
                    </div>
                </div>
                <ChevronLeft
                    className={`w-4 h-4 shrink-0 mr-2 transition-transform duration-300 ${isSelected ? "rotate-180" : ""}`}
                    style={{ color: isSelected ? department.accent : "rgb(255 255 255 / 0.3)" }}
                />
            </div>

            <div className="flex items-center gap-4 mt-3 pt-3 border-t border-white/10">
                <div className="flex items-center gap-1.5">
                    <GitBranch className="w-3.5 h-3.5 text-white/40" />
                    <span className="text-xs text-white/50">{department.stages.length} مرحله</span>
                </div>
                <div className="flex items-center gap-1.5">
                    <Users className="w-3.5 h-3.5 text-white/40" />
                    <span className="text-xs text-white/50">{department.employees.length} نفر</span>
                </div>
            </div>
        </motion.button>
    );
}
