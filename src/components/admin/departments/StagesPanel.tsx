"use client";

import { useState } from "react";
import { motion, AnimatePresence, Reorder } from "framer-motion";
import { Plus, GripVertical, Trash2, GitBranch } from "lucide-react";
import { Stage, Department } from "./types";

interface Props {
    department: Department;
    onAddStage: () => void;
    onDeleteStage: (stageId: string) => void;
    onReorder: (stages: Stage[]) => void;
}

export default function StagesPanel({ department, onAddStage, onDeleteStage, onReorder }: Props) {
    const [hoveredId, setHoveredId] = useState<string | null>(null);

    return (
        <div className="rounded-2xl border border-white/10 bg-white/5 p-5">
            <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                    <GitBranch className="w-4 h-4" style={{ color: department.accent }} />
                    <h3 className="text-sm font-semibold text-white">مراحل</h3>
                    <span
                        className="text-xs px-2 py-0.5 rounded-full"
                        style={{ backgroundColor: `${department.accent}20`, color: department.accent }}
                    >
                        {department.stages.length}
                    </span>
                </div>
                <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={onAddStage}
                    className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-xl transition-colors"
                    style={{ backgroundColor: `${department.accent}20`, color: department.accent }}
                >
                    <Plus className="w-3.5 h-3.5" />
                    افزودن مرحله
                </motion.button>
            </div>

            {department.stages.length === 0 ? (
                <div className="text-center py-8 text-white/30">
                    <GitBranch className="w-8 h-8 mx-auto mb-2 opacity-50" />
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
                                    className="flex items-center gap-3 p-3 rounded-xl border border-white/10 bg-white/5 hover:bg-white/8 transition-colors group cursor-grab active:cursor-grabbing"
                                >
                                    <GripVertical className="w-4 h-4 text-white/20 group-hover:text-white/40 transition-colors shrink-0" />
                                    <div
                                        className="w-6 h-6 rounded-lg flex items-center justify-center text-xs font-bold shrink-0"
                                        style={{ backgroundColor: `${department.accent}20`, color: department.accent }}
                                    >
                                        {index + 1}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <p className="text-sm text-white font-medium truncate">{stage.title}</p>
                                        {stage.description && (
                                            <p className="text-xs text-white/40 truncate mt-0.5">{stage.description}</p>
                                        )}
                                    </div>
                                    <AnimatePresence>
                                        {hoveredId === stage.id && (
                                            <motion.button
                                                initial={{ opacity: 0, scale: 0.8 }}
                                                animate={{ opacity: 1, scale: 1 }}
                                                exit={{ opacity: 0, scale: 0.8 }}
                                                onClick={() => onDeleteStage(stage.id)}
                                                className="p-1.5 rounded-lg bg-red-500/10 text-red-400 hover:bg-red-500/20 transition-colors shrink-0"
                                            >
                                                <Trash2 className="w-3.5 h-3.5" />
                                            </motion.button>
                                        )}
                                    </AnimatePresence>
                                </motion.div>
                            </Reorder.Item>
                        ))}
                    </AnimatePresence>
                </Reorder.Group>
            )}
        </div>
    );
}
