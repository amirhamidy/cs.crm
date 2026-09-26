"use client";

import { useEffect, useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Kanban, Loader, Layers3, Plus, ChevronLeft, UserRound } from "lucide-react";
import { Swiper, SwiperSlide } from "swiper/react";
import { FreeMode } from "swiper/modules";
import "swiper/css";
import "swiper/css/free-mode";
import PurchasingTaskCardSwiper from "./PurchasingTaskCardSwiper";
import type { ApiPurchasingStep, ApiPurchasingTask } from "@/types/purchasing";

interface StageGroup {
    id: number;
    name: string;
    accent: string;
    order: number;
    members: { id: number; employee_id: number; full_name: string; is_active: boolean }[];
    tasks: ApiPurchasingTask[];
}

const ACCENT_PALETTE = ["#6366f1", "#ec4899", "#10b981", "#f59e0b", "#3b82f6", "#8b5cf6", "#ef4444", "#14b8a6", "#f472b6", "#0ea5e9"];

function accentForId(id: number) {
    const safe = Number.isFinite(id) ? Math.abs(Math.trunc(id)) : 0;
    return ACCENT_PALETTE[safe % ACCENT_PALETTE.length];
}

function useMediaQuery(query: string) {
    const [matches, setMatches] = useState(false);
    useEffect(() => {
        const media = window.matchMedia(query);
        const update = () => setMatches(media.matches);
        update();
        media.addEventListener("change", update);
        return () => media.removeEventListener("change", update);
    }, [query]);
    return matches;
}

function groupTasksByStep(tasks: ApiPurchasingTask[]) {
    return tasks.reduce<Record<number, ApiPurchasingTask[]>>((acc, task) => {
        (acc[task.process_step] ??= []).push(task);
        return acc;
    }, {});
}

interface Props {
    steps: ApiPurchasingStep[];
    tasks: ApiPurchasingTask[];
    onUpdated: () => void;
}

export default function PurchasingTasksKanban({ steps, tasks, onUpdated }: Props) {
    const [activeStepId, setActiveStepId] = useState<number | null>(null);
    const [activeMobileStageId, setActiveMobileStageId] = useState<number | null>(null);
    const isMobile = useMediaQuery("(max-width: 767px)");

    const orderedSteps = useMemo(
        () => [...steps].sort((a, b) => a.order - b.order),
        [steps]
    );

    const stageGroups = useMemo<StageGroup[]>(
        () =>
            orderedSteps.map((step) => ({
                id: step.id,
                name: step.title,
                order: step.order,
                accent: accentForId(step.id),
                members: step.employees_detail ?? [],
                tasks: tasks.filter((t) => t.process_step === step.id),
            })),
        [orderedSteps, tasks]
    );

    useEffect(() => {
        if (!stageGroups.length) {
            setActiveStepId(null);
            return;
        }
        if (activeStepId === null || !stageGroups.some((g) => g.id === activeStepId)) {
            setActiveStepId(stageGroups[0].id);
        }
    }, [stageGroups, activeStepId]);

    const activeGroup = stageGroups.find((g) => g.id === activeStepId) ?? null;
    const grouped = useMemo(() => groupTasksByStep(activeGroup?.tasks ?? []), [activeGroup]);

    useEffect(() => {
        const available = activeGroup ? [activeGroup] : [];
        if (!available.length) {
            setActiveMobileStageId(null);
            return;
        }
        if (activeMobileStageId === null || activeMobileStageId !== activeGroup!.id) {
            setActiveMobileStageId(activeGroup!.id);
        }
    }, [activeGroup, activeMobileStageId]);

    if (!stageGroups.length) {
        return (
            <div className="flex h-64 flex-col items-center justify-center gap-3 rounded-3xl border border-dashed border-gray-200 dark:border-white/[0.07]">
                <Layers3 size={28} className="text-gray-300 dark:text-gray-700" />
                <p className="text-[12px] text-gray-400">مرحله‌ای تعریف نشده است</p>
            </div>
        );
    }

    const totalTasks = tasks.length;
    const activeStage = activeGroup;
    const activeStages = activeGroup ? [activeGroup] : [];

    return (
        <div className="flex flex-col gap-4" dir="rtl">
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                    <div className="flex h-9 w-9 items-center justify-center rounded-2xl bg-indigo-500/10">
                        <Kanban size={17} className="text-indigo-500" />
                    </div>
                    <div>
                        <h3 className="text-[14px] font-extrabold text-gray-900 dark:text-white">تسک‌های خرید</h3>
                        <p className="text-[11px] text-gray-400">{stageGroups.length} مرحله</p>
                    </div>
                </div>
                <span className="rounded-2xl bg-gray-100 px-3 py-1.5 text-[11px] font-bold text-gray-600 dark:bg-white/[0.06] dark:text-gray-400">
                    {totalTasks} تسک
                </span>
            </div>

            <div className="flex gap-2 overflow-x-auto pb-1">
                {stageGroups.map((group) => {
                    const active = group.id === activeStepId;
                    return (
                        <button
                            key={group.id}
                            type="button"
                            onClick={() => setActiveStepId(group.id)}
                            className="flex shrink-0 items-center gap-2 rounded-2xl border px-3.5 py-2 text-[11.5px] font-bold"
                            style={{
                                background: active ? group.accent : `${group.accent}0f`,
                                borderColor: active ? group.accent : `${group.accent}30`,
                                color: active ? "#fff" : group.accent,
                            }}
                        >
                            <Layers3 size={12} />
                            {group.name}
                            <span
                                className="rounded-full px-1.5 py-0.5 text-[10px]"
                                style={{ background: active ? "rgba(255,255,255,.25)" : `${group.accent}18` }}
                            >
                                {group.tasks.length}
                            </span>
                        </button>
                    );
                })}
            </div>

            {activeStage && activeStage.members.length > 0 && (
                <div className="flex flex-wrap items-center gap-2 rounded-2xl border border-black/[0.04] bg-gray-50/70 px-3 py-2 dark:border-white/[0.05] dark:bg-white/[0.025]">
                    <span className="text-[10px] font-extrabold text-gray-400">مسئولان این مرحله:</span>
                    {activeStage.members.map((member) => (
                        <div
                            key={member.id}
                            className="flex items-center gap-1.5 rounded-full bg-white px-2 py-1 shadow-sm dark:bg-white/[0.05]"
                        >
                            <span
                                className="flex h-5 w-5 items-center justify-center rounded-full text-white"
                                style={{ background: accentForId(member.employee_id) }}
                            >
                                <UserRound size={10} />
                            </span>
                            <span className="text-[10px] font-bold text-gray-600 dark:text-gray-300">
                                {member.full_name}
                                {!member.is_active ? " (غیرفعال)" : ""}
                            </span>
                        </div>
                    ))}
                </div>
            )}

            {activeGroup && activeStages.length > 0 && (
                isMobile ? (
                    <div className="flex flex-col gap-3">
                        <div className="flex gap-2 overflow-x-auto pb-1">
                            {activeStages.map((stage, index) => {
                                const active = stage.id === activeMobileStageId;
                                const color = accentForId(stage.id);
                                return (
                                    <button
                                        key={stage.id}
                                        type="button"
                                        onClick={() => setActiveMobileStageId(stage.id)}
                                        className="flex shrink-0 items-center gap-2 rounded-2xl border px-3 py-2 text-[11px] font-bold"
                                        style={{
                                            color: active ? color : "#94a3b8",
                                            background: active ? `${color}14` : undefined,
                                            borderColor: active ? `${color}45` : "rgba(148,163,184,.25)",
                                        }}
                                    >
                                        <span
                                            className="flex h-5 w-5 items-center justify-center rounded-lg text-[9px] text-white"
                                            style={{ background: color }}
                                        >
                                            {index + 1}
                                        </span>
                                        {stage.name}
                                        <span>{grouped[stage.id]?.length ?? 0}</span>
                                    </button>
                                );
                            })}
                        </div>
                        {activeStages[0] && (
                            <AnimatePresence mode="wait">
                                <motion.div
                                    key={activeStages[0].id}
                                    initial={{ opacity: 0, y: 8 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    exit={{ opacity: 0 }}
                                >
                                    <StageColumn
                                        stage={activeStages[0]}
                                        tasks={grouped[activeStages[0].id] ?? []}
                                        accent={accentForId(activeStages[0].id)}
                                        index={orderedSteps.findIndex((s) => s.id === activeStages[0].id)}
                                        isLast={orderedSteps.findIndex((s) => s.id === activeStages[0].id) === orderedSteps.length - 1}
                                        onUpdated={onUpdated}
                                    />
                                </motion.div>
                            </AnimatePresence>
                        )}
                    </div>
                ) : (
                    <Swiper
                        modules={[FreeMode]}
                        freeMode
                        slidesPerView="auto"
                        spaceBetween={14}
                        className="!w-full !overflow-hidden"
                    >
                        {activeStages.map((stage, index) => (
                            <SwiperSlide key={stage.id} className="!w-[320px] !overflow-visible">
                                <StageColumn
                                    stage={stage}
                                    tasks={grouped[stage.id] ?? []}
                                    accent={accentForId(stage.id)}
                                    index={orderedSteps.findIndex((s) => s.id === stage.id)}
                                    isLast={orderedSteps.findIndex((s) => s.id === stage.id) === orderedSteps.length - 1}
                                    onUpdated={onUpdated}
                                />
                            </SwiperSlide>
                        ))}
                    </Swiper>
                )
            )}
        </div>
    );
}

function StageColumn({
    stage,
    tasks,
    accent,
    index,
    isLast,
    onUpdated,
}: {
    stage: StageGroup;
    tasks: ApiPurchasingTask[];
    accent: string;
    index: number;
    isLast: boolean;
    onUpdated: () => void;
}) {
    return (
        <motion.div
            layout
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            className="relative flex min-w-0 flex-col rounded-[1.45rem] border bg-white shadow-[0_5px_20px_rgba(15,23,42,.03)] dark:bg-white/[.025]"
            style={{ borderColor: `${accent}28` }}
        >
            {!isLast && (
                <div
                    className="pointer-events-none absolute top-7 z-20 flex h-5 w-5 items-center justify-center rounded-full border bg-white shadow-sm dark:bg-[#0f172a]"
                    style={{ insetInlineEnd: -10, borderColor: `${accent}35`, color: accent }}
                >
                    <ChevronLeft size={10} />
                </div>
            )}
            <div className="px-3 py-2.5">
                <div className="flex items-center justify-between gap-2.5">
                    <div className="flex items-center gap-2">
                        <span
                            className="flex h-7 w-7 items-center justify-center rounded-lg text-[11px] font-extrabold text-white"
                            style={{ background: accent }}
                        >
                            {index + 1}
                        </span>
                        <h4 className="text-[12.5px] font-extrabold text-gray-800 dark:text-gray-100">{stage.name}</h4>
                    </div>
                    <span
                        className="rounded-full px-2.5 py-0.5 text-[10.5px] font-extrabold"
                        style={{ background: `${accent}18`, color: accent }}
                    >
                        {tasks.length}
                    </span>
                </div>
            </div>
            <div className="h-px" style={{ background: `${accent}18` }} />
            {tasks.length ? (
                <PurchasingTaskCardSwiper
                    tasks={tasks}
                    accent={accent}
                    isLastStage={isLast}
                    onUpdated={onUpdated}
                />
            ) : (
                <div className="flex h-28 flex-col items-center justify-center gap-1.5 text-center">
                    <Plus size={16} className="text-gray-300" />
                    <p className="text-[11px] text-gray-400">تسکی در این مرحله نیست</p>
                </div>
            )}
        </motion.div>
    );
} 