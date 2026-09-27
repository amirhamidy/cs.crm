"use client";

import { useCallback, useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Plus } from "lucide-react";
import { Swiper, SwiperSlide } from "swiper/react";
import { FreeMode } from "swiper/modules";
import "swiper/css";
import "swiper/css/free-mode";
import { toPersianDigits } from "@/lib/jalali";
import type {
    ApiPurchasingStep,
    ApiPurchasingTask,
    ApiTaskAttachment,
} from "@/types/purchasing";
import PurchasingStageCard from "./PurchasingStageCard";

const STAGE_COLORS = [
    "#6366f1",
    "#8b5cf6",
    "#ec4899",
    "#f59e0b",
    "#10b981",
    "#3b82f6",
    "#ef4444",
    "#14b8a6",
];

interface Props {
    steps: ApiPurchasingStep[];
    tasks: ApiPurchasingTask[];
    attachments: ApiTaskAttachment[];
    tasksLoading?: boolean;
    onAddStep?: () => void;
    onEditStep?: (step: ApiPurchasingStep) => void;
    onDeleteStep?: (step: ApiPurchasingStep) => void;
    onUpdated: () => void;
}

export default function PurchasingStagesPanel({
    steps,
    tasks,
    attachments,
    tasksLoading = false,
    onAddStep,
    onEditStep,
    onDeleteStep,
    onUpdated,
}: Props) {
    const [activeId, setActiveId] = useState<number | null>(steps[0]?.id ?? null);

    useEffect(() => {
        if (!steps.length) {
            setActiveId(null);
            return;
        }
        if (!steps.some((step) => step.id === activeId)) {
            setActiveId(steps[0].id);
        }
    }, [steps, activeId]);

    const getStepTasks = useCallback(
        (stepId: number) =>
            tasks.filter(
                (task) =>
                    task.process_step === stepId &&
                    task.status !== "completed" &&
                    task.status !== "cancelled"
            ),
        [tasks]
    );

    const activeIndex = steps.findIndex((step) => step.id === activeId);
    const activeStep = activeIndex >= 0 ? steps[activeIndex] : steps[0];

    return (
        <div className="flex flex-col gap-3.5 p-4" dir="rtl">
            <div className="flex items-center justify-between gap-3">
                <div className="flex min-w-0 items-center gap-2">
                    <div>
                        <h3 className="text-[13px] font-extrabold text-gray-900 dark:text-white">
                            مراحل فرآیند خرید
                        </h3>
                        <p className="mt-0.5 text-[9.5px] font-medium text-gray-400 dark:text-gray-500">
                            مراحل و وظایف فعال
                        </p>
                    </div>
                    <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-gray-100 px-1.5 text-[9px] font-extrabold text-gray-500 dark:bg-white/[0.06] dark:text-gray-400">
                        {toPersianDigits(steps.length)}
                    </span>
                </div>

                {onAddStep && (
                    <button
                        type="button"
                        onClick={onAddStep}
                        className="flex h-7 shrink-0 items-center gap-1.5 rounded-xl px-2.5 text-[10.5px] font-extrabold transition-all active:scale-95"
                        style={{
                            background: "rgba(99,102,241,0.10)",
                            color: "#6366f1",
                            border: "1px solid rgba(99,102,241,0.18)",
                        }}
                    >
                        <Plus size={11} strokeWidth={2.7} />
                        <span className="hidden sm:inline">افزودن مرحله</span>
                        <span className="sm:hidden">افزودن</span>
                    </button>
                )}
            </div>

            {steps.length === 0 ? (
                <div className="flex flex-col items-center justify-center gap-2 rounded-[1.4rem] border border-dashed border-gray-200 py-10 dark:border-white/[0.07]">
                    <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gray-100 dark:bg-white/[0.05]">
                        <Plus size={15} className="text-gray-400" />
                    </div>
                    <p className="text-[11px] font-medium text-gray-400">
                        مرحله‌ای تعریف نشده است
                    </p>
                </div>
            ) : (
                <>
                    <div className="md:hidden">
                        <div className="scrollbar-none flex w-full gap-1.5 overflow-x-auto pb-1">
                            {steps.map((step, index) => {
                                const isActive = step.id === activeId;
                                const accent = STAGE_COLORS[index % STAGE_COLORS.length];

                                return (
                                    <button
                                        key={step.id}
                                        type="button"
                                        onClick={() => setActiveId(step.id)}
                                        className={`flex min-w-[112px] shrink-0 items-center gap-1.5 rounded-xl border px-2.5 py-1.5 text-right transition-all ${isActive
                                                ? "shadow-sm"
                                                : "border-gray-200/70 bg-white/60 dark:border-white/[0.07] dark:bg-white/[0.03]"
                                            }`}
                                        style={
                                            isActive
                                                ? { borderColor: `${accent}35`, backgroundColor: `${accent}10` }
                                                : undefined
                                        }
                                    >
                                        <span
                                            className="flex h-5 w-5 shrink-0 items-center justify-center rounded-md text-[9px] font-extrabold text-white"
                                            style={{ backgroundColor: accent }}
                                        >
                                            {toPersianDigits(index + 1)}
                                        </span>
                                        <span
                                            className={`min-w-0 truncate text-[10px] font-extrabold ${isActive
                                                    ? "text-gray-800 dark:text-gray-100"
                                                    : "text-gray-500 dark:text-gray-400"
                                                }`}
                                        >
                                            {step.title}
                                        </span>
                                    </button>
                                );
                            })}
                        </div>

                        <div className="mt-2">
                            <AnimatePresence mode="wait" initial={false}>
                                {activeStep && (
                                    <motion.div
                                        key={activeStep.id}
                                        initial={{ opacity: 0, y: 5 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        exit={{ opacity: 0, y: -5 }}
                                        transition={{ duration: 0.18 }}
                                    >
                                        <PurchasingStageCard
                                            step={activeStep}
                                            index={Math.max(activeIndex, 0)}
                                            steps={steps}
                                            tasks={getStepTasks(activeStep.id)}
                                            attachments={attachments}
                                            tasksLoading={tasksLoading}
                                            accent={STAGE_COLORS[Math.max(activeIndex, 0) % STAGE_COLORS.length]}
                                            isLast
                                            showConnector={false}
                                            onEditStep={onEditStep}
                                            onDeleteStep={onDeleteStep}
                                            onUpdated={onUpdated}
                                        />
                                    </motion.div>
                                )}
                            </AnimatePresence>
                        </div>
                    </div>

                    <div className="hidden md:block">
                        <Swiper
                            modules={[FreeMode]}
                            freeMode
                            slidesPerView="auto"
                            spaceBetween={14}
                            className="!w-full !overflow-hidden !px-0.5"
                        >
                            {steps.map((step, index) => (
                                <SwiperSlide key={step.id} className="!w-[290px] shrink-0 !overflow-visible">
                                    <PurchasingStageCard
                                        step={step}
                                        index={index}
                                        steps={steps}
                                        tasks={getStepTasks(step.id)}
                                        attachments={attachments}
                                        tasksLoading={tasksLoading}
                                        accent={STAGE_COLORS[index % STAGE_COLORS.length]}
                                        isLast={index === steps.length - 1}
                                        onEditStep={onEditStep}
                                        onDeleteStep={onDeleteStep}
                                        onUpdated={onUpdated}
                                    />
                                </SwiperSlide>
                            ))}
                        </Swiper>
                    </div>
                </>
            )}
        </div>
    );
}