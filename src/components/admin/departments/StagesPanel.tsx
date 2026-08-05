"use client";

import { useState } from "react";
import { Reorder } from "framer-motion";
import { Plus, GripVertical, Trash2, GitBranch, Pencil } from "lucide-react";
import { Stage, Department } from "./types";
import EditStageModal from "./EditStageModal";

interface Props {
    department: Department;
    onAddStage: () => void;
    onDeleteStage: (stage: Stage) => void;
    onReorder: (stages: Stage[]) => void;
    onEditStage?: (stage: Stage, values: { name: string; number: number }) => void;
}

const getStageNumber = (stage: Stage, index: number) => {
    const n = (stage as Stage & { number?: number }).number;
    return typeof n === "number" ? n : index + 1;
};

export default function StagesPanel({
    department,
    onAddStage,
    onDeleteStage,
    onReorder,
    onEditStage,
}: Props) {
    const accent = department.accent;
    const [editingStage, setEditingStage] = useState<Stage | null>(null);

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
                    <GitBranch size={16} style={{ color: accent }} />
                    <h3 className="text-sm font-semibold text-gray-900 dark:text-white">
                        مراحل
                    </h3>
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

                <button
                    onClick={onAddStage}
                    className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-xl font-medium active:scale-95 transition-transform"
                    style={{
                        backgroundColor: `${accent}18`,
                        color: accent,
                        border: `1px solid ${accent}30`,
                    }}
                >
                    <Plus size={13} />
                    افزودن مرحله
                </button>
            </div>

            {department.stages.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-8 text-gray-400">
                    <GitBranch size={32} className="mb-2 opacity-30" />
                    <p className="text-sm">هنوز مرحله‌ای تعریف نشده</p>
                </div>
            ) : (
                <Reorder.Group
                    axis="x"
                    values={department.stages}
                    onReorder={onReorder}
                    as="div"
                    className="flex flex-wrap gap-2"
                >
                    {department.stages.map((stage, index) => (
                        <Reorder.Item
                            key={stage.id}
                            value={stage}
                            as="div"
                            className="group relative h-[92px] w-[calc(50%-0.25rem)] md:w-[calc(33.333%-0.334rem)] xl:w-[calc(25%-0.375rem)] overflow-hidden rounded-xl border border-gray-200 dark:border-white/10 bg-gray-50/50 dark:bg-white/[0.02] cursor-grab active:cursor-grabbing select-none"
                        >
                            <svg
                                className="absolute inset-0 w-full h-full pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity duration-500"
                                style={{ borderRadius: "0.75rem" }}
                            >
                                <defs>
                                    <linearGradient
                                        id={`stage-border-${stage.id}`}
                                        x1="100%"
                                        y1="100%"
                                        x2="0%"
                                        y2="0%"
                                    >
                                        <stop offset="0%" stopColor={accent} />
                                        <stop offset="100%" stopColor={accent} stopOpacity="0.4" />
                                    </linearGradient>
                                </defs>
                                <rect
                                    x="1"
                                    y="1"
                                    width="calc(100% - 2px)"
                                    height="calc(100% - 2px)"
                                    rx="11"
                                    ry="11"
                                    fill="none"
                                    stroke={`url(#stage-border-${stage.id})`}
                                    strokeWidth="1.5"
                                />
                            </svg>

                            <div className="relative z-10 flex items-center gap-2 px-3 pt-3 pb-8">
                                <GripVertical
                                    size={15}
                                    className="text-gray-300 dark:text-gray-600 shrink-0"
                                />

                                <div
                                    className="w-6 h-6 rounded-md flex items-center justify-center text-[10px] font-bold text-white shrink-0"
                                    style={{ backgroundColor: stage.color }}
                                >
                                    {getStageNumber(stage, index)}
                                </div>

                                <p className="flex-1 min-w-0 text-sm font-medium text-gray-800 dark:text-white truncate">
                                    {stage.name}
                                </p>

                                <div
                                    className="w-2 h-2 rounded-full shrink-0"
                                    style={{ backgroundColor: stage.color }}
                                />
                            </div>

                            <div
                                className="absolute bottom-2 left-1/2 -translate-x-1/2 z-20 flex items-center gap-1.5 opacity-0 translate-y-1.5 pointer-events-none group-hover:opacity-100 group-hover:translate-y-0 group-hover:pointer-events-auto transition duration-150"
                                onPointerDown={(e) => e.stopPropagation()}
                            >
                                <button
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        setEditingStage(stage);
                                    }}
                                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-[11px] font-bold active:scale-95 transition-transform"
                                    style={{
                                        backgroundColor: `${accent}18`,
                                        color: accent,
                                        border: `1px solid ${accent}30`,
                                    }}
                                >
                                    ویرایش
                                    <Pencil size={11} />
                                </button>

                                <button
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        onDeleteStage(stage);
                                    }}
                                    className="w-7 h-7 rounded-xl flex items-center justify-center text-red-400 bg-red-500/10 active:scale-95 transition-transform"
                                >
                                    <Trash2 size={12} />
                                </button>
                            </div>
                        </Reorder.Item>
                    ))}
                </Reorder.Group>
            )}

            <EditStageModal
                open={!!editingStage}
                stage={editingStage}
                accent={accent}
                onClose={() => setEditingStage(null)}
                onSubmit={(values) => {
                    if (editingStage) onEditStage?.(editingStage, values);
                    setEditingStage(null);
                }}
            />
        </div>
    );
}