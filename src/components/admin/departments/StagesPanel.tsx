"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { Plus, Trash2, GripVertical, Loader, Pencil } from "lucide-react";
import { Swiper, SwiperSlide } from "swiper/react";
import { FreeMode } from "swiper/modules";
import "swiper/css";
import "swiper/css/free-mode";
import type { Department, Stage, Task } from "@/components/admin/departments/types";
import TaskCard from "@/components/admin/departments/TaskCard";
import EditStageModal from "./EditStageModal";

interface StagesPanelProps {
    department: Department;
    tasks: Task[];
    tasksLoading?: boolean;
    onAddStage?: () => void;
    onEditStage?: (stage: Stage, values: { name: string; description?: string; order: number }) => void;
    onDeleteStage?: (stage: Stage) => void;
}

const getRelationId = (value: string | number | { id: string | number } | null | undefined) => {
    if (value === null || value === undefined) return null;
    if (typeof value === "object") {
        return value.id === null || value.id === undefined ? null : String(value.id);
    }
    return String(value);
};

export default function StagesPanel({
    department,
    tasks,
    tasksLoading = false,
    onAddStage,
    onEditStage,
    onDeleteStage,
}: StagesPanelProps) {
    const [editingStage, setEditingStage] = useState<Stage | null>(null);

    return (
        <div className="flex flex-col gap-4 overflow-hidden">
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                    <h3 className="text-[13.5px] font-extrabold text-gray-900 dark:text-white">
                        فرآیند های دپارتمان
                    </h3>
                    <span className="rounded-full bg-gray-100 px-2 py-0.5 text-[10.5px] font-bold text-gray-500 dark:bg-white/[0.06] dark:text-gray-400">
                        {department.stages.length}
                    </span>
                </div>

                {onAddStage && (
                    <button
                        type="button"
                        onClick={onAddStage}
                        className="flex items-center gap-1.5 rounded-xl bg-indigo-50 px-3 py-1.5 text-[11.5px] font-bold text-indigo-600 transition hover:bg-indigo-100 dark:bg-indigo-500/10 dark:text-indigo-400 dark:hover:bg-indigo-500/20"
                    >
                        <Plus size={13} />
                        افزودن فرآیند
                    </button>
                )}
            </div>

            {department.stages.length === 0 ? (
                <div className="flex flex-col items-center justify-center gap-2 rounded-[1.5rem] border border-dashed border-gray-200 py-10 dark:border-white/[0.07]">
                    <p className="text-[12px] text-gray-400">فرآیند‌ای تعریف نشده است</p>
                </div>
            ) : (
                <Swiper modules={[FreeMode]} freeMode slidesPerView="auto" spaceBetween={12} className="!overflow-visible w-full">
                    {department.stages.map((stage, index) => {
                        const stageTasks = tasks.filter(
                            (task) => getRelationId(task.current_step) === String(stage.id)
                        );

                        return (
                            <SwiperSlide key={stage.id} className="!w-[300px] shrink-0">
                                <motion.div
                                    initial={{ opacity: 0, y: 8 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    className="flex flex-col rounded-[1.7rem] border border-gray-200/60 bg-white/60 dark:border-white/[0.06] dark:bg-white/[0.02]"
                                >
                                    <div className="flex items-center justify-between gap-2 px-4 pt-4 pb-3">
                                        <div className="flex min-w-0 items-center gap-2">
                                            <GripVertical size={15} className="shrink-0 text-gray-300 dark:text-gray-600" />
                                            <span
                                                className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg text-[11px] font-extrabold"
                                                style={{
                                                    backgroundColor: `${stage.color || "#6366f1"}1a`,
                                                    color: stage.color || "#6366f1",
                                                }}
                                            >
                                                {index + 1}
                                            </span>
                                            <h4 className="truncate text-[12.5px] font-bold text-gray-800 dark:text-gray-100">
                                                {stage.name}
                                            </h4>
                                        </div>

                                        <div className="flex shrink-0 items-center gap-1">
                                            {onEditStage && (
                                                <button
                                                    type="button"
                                                    onClick={() => setEditingStage(stage)}
                                                    className="p-1.5 rounded-lg text-gray-400 hover:text-indigo-500 hover:bg-indigo-50 dark:hover:bg-indigo-500/10 transition"
                                                >
                                                    <Pencil size={13} />
                                                </button>
                                            )}
                                            {onDeleteStage && (
                                                <button
                                                    type="button"
                                                    onClick={() => onDeleteStage(stage)}
                                                    className="p-1.5 rounded-lg text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 transition"
                                                >
                                                    <Trash2 size={13} />
                                                </button>
                                            )}
                                        </div>
                                    </div>

                                    <div className="h-px bg-gray-100 dark:bg-white/[0.05]" />
                                    <StageTaskList tasks={stageTasks} loading={tasksLoading} />
                                </motion.div>
                            </SwiperSlide>
                        );
                    })}
                </Swiper>
            )}

            <EditStageModal
                open={!!editingStage}
                stage={editingStage}
                accent={department.accent}
                onClose={() => setEditingStage(null)}
                onSubmit={(values) => {
                    if (editingStage && onEditStage) {
                        onEditStage(editingStage, {
                            name: values.name,
                            description: values.description,
                            order: values.order || 0
                        });
                    }
                    setEditingStage(null);
                }}
            />
        </div>
    );
}

function StageTaskList({ tasks, loading }: { tasks: Task[]; loading: boolean }) {
    if (loading) {
        return <div className="flex h-40 items-center justify-center"><Loader size={18} className="animate-spin text-indigo-500" /></div>;
    }
    if (tasks.length === 0) {
        return <div className="flex h-40 items-center justify-center"><p className="text-[11.5px] text-gray-400">وظیفه‌ای وجود ندارد</p></div>;
    }
    return (
        <div className="flex flex-col gap-2.5 overflow-y-auto p-3 max-h-[420px] scrollbar-thin">
            {tasks.map((task) => <TaskCard key={task.id} task={task} />)}
        </div>
    );
}
