"use client";

import { motion } from "framer-motion";
import { Pencil, Plus, Trash2, Workflow } from "lucide-react";
import { Swiper, SwiperSlide } from "swiper/react";
import { Mousewheel } from "swiper/modules";
import "swiper/css";

import { Stage, Task } from "./types";
import TaskCard from "./TaskCard";

interface Props {
    stage: Stage;
    index: number;
    tasks: Task[];
    accent: string;
    onDeleteStage: (stage: Stage) => void;
    onEditStage: (stage: Stage) => void;
    onAddTask?: (stage: Stage) => void;
}

const getStageNumber = (stage: Stage, index: number) => {
    if (typeof stage.order === "number") {
        return stage.order;
    }

    return index + 1;
};

export default function StageCard({
    stage,
    index,
    tasks,
    accent,
    onDeleteStage,
    onEditStage,
    onAddTask,
}: Props) {
    const stageColor = stage.color || accent;

    return (
        <motion.div
            layout
            initial={{ opacity: 0, scale: 0.96 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.2, ease: [0.23, 1, 0.32, 1] }}
            className="group relative min-h-[250px] w-full overflow-hidden rounded-2xl border border-gray-200 bg-gray-50/50 p-4 dark:border-white/10 dark:bg-white/[0.02]"
        >
            <div
                className="pointer-events-none absolute -right-10 -top-10 h-28 w-28 rounded-full opacity-10 blur-2xl"
                style={{ backgroundColor: stageColor }}
            />

            <div className="relative z-10 mb-4 flex items-start justify-between gap-3">
                <div className="flex min-w-0 items-center gap-2">
                    <div
                        className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-xs font-bold text-white"
                        style={{ backgroundColor: stageColor }}
                    >
                        {getStageNumber(stage, index)}
                    </div>

                    <div className="min-w-0">
                        <p className="truncate text-sm font-semibold text-gray-900 dark:text-white">
                            {stage.name}
                        </p>

                        <div className="mt-1 flex items-center gap-1.5 text-[10px] text-gray-400">
                            <Workflow size={12} />
                            <span>{tasks.length} وظیفه</span>
                        </div>
                    </div>
                </div>

                <div className="flex shrink-0 items-center gap-1 opacity-0 transition-all duration-150 group-hover:opacity-100">
                    {onAddTask && (
                        <button
                            type="button"
                            onClick={() => onAddTask(stage)}
                            className="flex h-7 w-7 items-center justify-center rounded-lg text-gray-400 transition hover:bg-black/5 hover:text-gray-700 dark:hover:bg-white/10 dark:hover:text-white"
                        >
                            <Plus size={14} />
                        </button>
                    )}

                    <button
                        type="button"
                        onClick={() => onEditStage(stage)}
                        className="flex h-7 w-7 items-center justify-center rounded-lg transition"
                        style={{
                            color: accent,
                            backgroundColor: `${accent}12`,
                        }}
                    >
                        <Pencil size={13} />
                    </button>

                    <button
                        type="button"
                        onClick={() => onDeleteStage(stage)}
                        className="flex h-7 w-7 items-center justify-center rounded-lg bg-red-500/10 text-red-400 transition hover:bg-red-500/20"
                    >
                        <Trash2 size={13} />
                    </button>
                </div>
            </div>

            {tasks.length === 0 ? (
                <div className="relative z-10 flex h-[148px] flex-col items-center justify-center rounded-xl border border-dashed border-gray-200 text-gray-400 dark:border-white/10">
                    <Workflow size={24} className="mb-2 opacity-30" />
                    <p className="text-[11px]">وظیفه‌ای در این فرآیند نیست</p>
                </div>
            ) : (
                <Swiper
                    modules={[Mousewheel]}
                    slidesPerView="auto"
                    spaceBetween={10}
                    mousewheel={{
                        forceToAxis: true,
                    }}
                    className="!overflow-visible"
                >
                    {tasks.map((task) => (
                        <SwiperSlide key={task.id} className="!w-[260px]">
                            <TaskCard task={task} accent={stageColor} />
                        </SwiperSlide>
                    ))}
                </Swiper>
            )}
        </motion.div>
    );
}