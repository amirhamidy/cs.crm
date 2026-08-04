"use client";

import { useState } from "react";
import { motion, AnimatePresence, Reorder } from "framer-motion";
import { Plus, GripVertical, Trash2, GitBranch, CheckCircle2 } from "lucide-react";
import { Stage, Department } from "./types";

interface Props {
    department: Department;
    onAddStage: () => void;
    onDeleteStage: (stage: Stage) => void;
    onReorder: (stages: Stage[]) => void;
}

export default function StagesPanel({ department, onAddStage, onDeleteStage, onReorder }: Props) {
    const [hoveredId, setHoveredId] = useState<string | null>(null);
    const accent = department.accent;

    return (
        <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="rounded-2xl border border-gray-200 dark:border-white/10 bg-white/50 dark:bg-white/[0.02] backdrop-blur-xl p-5"
            style={{
                borderColor: `${accent}22`,
                boxShadow: `0 0 0 1px ${accent}11`,
            }}
        >
            <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                    <GitBranch size={16} style={{ color: accent }} />
                    <h3 className="text-sm font-semibold text-gray-900 dark:text-white">مراحل</h3>
                    <span
                        className="text-[10px] font-medium px-2 py-0.5 rounded-full"
                        style={{
                            backgroundColor: `${accent}18`,
                            color: accent,
                            border: `1px solid ${accent}35`,
                        }}
                    >
                        {department.stages.length}
                    </span>
                </div>
                <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={onAddStage}
                    className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-xl transition-all font-medium"
                    style={{
                        backgroundColor: `${accent}18`,
                        color: accent,
                        border: `1px solid ${accent}30`,
                    }}
                >
                    <Plus size={13} />
                    افزودن مرحله
                </motion.button>
            </div>

            {department.stages.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-8 text-gray-400">
                    <GitBranch size={32} className="mb-2 opacity-30" />
                    <p className="text-sm">هنوز مرحله‌ای تعریف نشده</p>
                </div>
            ) : (
                <Reorder.Group axis="y" values={department.stages} onReorder={onReorder} className="space-y-2">
                    <AnimatePresence>
                        {department.stages.map((stage, index) => (
                            <Reorder.Item key={stage.id} value={stage}>
                                <motion.div
                                    initial={{ opacity: 0, x: -10 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    exit={{ opacity: 0, x: 10 }}
                                    onHoverStart={() => setHoveredId(stage.id)}
                                    onHoverEnd={() => setHoveredId(null)}
                                    className="flex items-center gap-3 p-3 rounded-xl border border-gray-200 dark:border-white/10 bg-gray-50/50 dark:bg-white/[0.02] hover:bg-gray-100/50 dark:hover:bg-white/[0.05] transition-colors group cursor-grab active:cursor-grabbing"
                                    style={{
                                        borderColor: hoveredId === stage.id ? `${stage.color}40` : undefined,
                                    }}
                                >
                                    <GripVertical size={16} className="text-gray-300 dark:text-gray-600 group-hover:text-gray-400 dark:group-hover:text-gray-500 transition-colors shrink-0" />
                                    <div
                                        className="w-6 h-6 rounded-lg flex items-center justify-center text-[10px] font-bold shrink-0 text-white"
                                        style={{ backgroundColor: stage.color }}
                                    >
                                        {index + 1}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <p className="text-sm text-gray-800 dark:text-white font-medium truncate">
                                            {stage.name}
                                        </p>
                                    </div>
                                    <div
                                        className="w-2 h-2 rounded-full shrink-0"
                                        style={{ backgroundColor: stage.color }}
                                    />
                                    <AnimatePresence>
                                        {hoveredId === stage.id && (
                                            <motion.button
                                                initial={{ opacity: 0, scale: 0.8 }}
                                                animate={{ opacity: 1, scale: 1 }}
                                                exit={{ opacity: 0, scale: 0.8 }}
                                                onClick={() => onDeleteStage(stage)}
                                                className="p-1.5 rounded-lg bg-red-500/10 text-red-400 hover:bg-red-500/20 transition-colors shrink-0"
                                            >
                                                <Trash2 size={14} />
                                            </motion.button>
                                        )}
                                    </AnimatePresence>
                                </motion.div>
                            </Reorder.Item>
                        ))}
                    </AnimatePresence>
                </Reorder.Group>
            )}
        </motion.div>
    );
}