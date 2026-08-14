// UserTasksKanban.tsx
"use client";

import { useEffect, useMemo, useState, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Kanban, Loader, GripVertical, LayoutGrid, AlertCircle } from "lucide-react";
import axiosInstance from "@/lib/axiosInstance";
import UserTaskCard from "./UserTaskCard";
import TaskActionModal from "./TaskActionModal";
import type { UserTask, UserStage } from "./types";
import {
    DndContext,
    DragOverlay,
    PointerSensor,
    useSensor,
    useSensors,
    closestCenter,
    type DragStartEvent,
    type DragEndEvent,
    type DragOverEvent,
    useDroppable,
    useDraggable,
} from "@dnd-kit/core";

function groupTasksByStep(tasks: UserTask[]): Record<number, UserTask[]> {
    return tasks.reduce<Record<number, UserTask[]>>((acc, task) => {
        const key = task.current_step;
        if (!acc[key]) acc[key] = [];
        acc[key].push(task);
        return acc;
    }, {});
}

const stageColors = [
    "#6366f1", "#8b5cf6", "#ec4899",
    "#f59e0b", "#10b981", "#3b82f6",
    "#ef4444", "#14b8a6",
];

interface PendingDrop {
    task: UserTask;
    targetStepId: number;
    direction: "forward" | "backward";
}

export default function UserTasksKanban() {
    const [tasks, setTasks] = useState<UserTask[]>([]);
    const [stages, setStages] = useState<UserStage[]>([]);
    const [loading, setLoading] = useState(true);
    const [stagesLoading, setStagesLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [activeTask, setActiveTask] = useState<UserTask | null>(null);
    const [overId, setOverId] = useState<number | null>(null);
    const [pendingDrop, setPendingDrop] = useState<PendingDrop | null>(null);
    const [limitToast, setLimitToast] = useState(false);
    const pendingRef = useRef<Set<number>>(new Set());
    const limitToastTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

    const sensors = useSensors(
        useSensor(PointerSensor, { activationConstraint: { distance: 8 } })
    );

    useEffect(() => {
        axiosInstance
            .get<{ results: UserStage[] } | UserStage[]>(
                "/department/api/v1/department_step/"
            )
            .then((res) => {
                const raw = Array.isArray(res.data)
                    ? res.data
                    : (res.data as { results: UserStage[] }).results ?? [];
                const mapped: UserStage[] = (raw as any[])
                    .map((s) => ({
                        id: s.id,
                        name: s.name ?? s.title ?? `مرحله ${s.id}`,
                        order: s.order ?? s.id,
                    }))
                    .sort((a, b) => a.order - b.order);
                setStages(mapped);
            })
            .catch(() => setError("دریافت مراحل با خطا مواجه شد"))
            .finally(() => setStagesLoading(false));
    }, []);

    useEffect(() => {
        axiosInstance
            .get<UserTask[] | { results: UserTask[] }>("/tasks/api/v1/tasks/")
            .then((res) => {
                const data = Array.isArray(res.data)
                    ? res.data
                    : res.data.results ?? [];
                setTasks(data);
            })
            .catch(() => setError("دریافت تسک‌ها با خطا مواجه شد"))
            .finally(() => setLoading(false));
    }, []);

    const grouped = useMemo(() => groupTasksByStep(tasks), [tasks]);

    function handleUpdated(updated: UserTask) {
        setTasks((prev) => prev.map((t) => (t.id === updated.id ? updated : t)));
    }

    function handleDragStart(event: DragStartEvent) {
        const task = tasks.find((t) => t.id === event.active.id);
        if (task) setActiveTask(task);
    }

    function handleDragOver(event: DragOverEvent) {
        const id = event.over?.id;
        if (id !== undefined) setOverId(Number(id));
    }

    function showLimitToast() {
        setLimitToast(true);
        if (limitToastTimer.current) clearTimeout(limitToastTimer.current);
        limitToastTimer.current = setTimeout(() => setLimitToast(false), 3500);
    }

    function handleDragEnd(event: DragEndEvent) {
        const { active, over } = event;
        setActiveTask(null);
        setOverId(null);

        if (!over) return;

        const task = tasks.find((t) => t.id === active.id);
        if (!task) return;

        const targetStepId = Number(over.id);
        if (task.current_step === targetStepId) return;
        if (pendingRef.current.has(task.id)) return;

        const stageList = stages.map((s) => s.id);
        const currentIdx = stageList.indexOf(task.current_step);
        const targetIdx = stageList.indexOf(targetStepId);
        if (targetIdx === -1) return;

        const steps = Math.abs(targetIdx - currentIdx);

        if (steps > 1) {
            showLimitToast();
            return;
        }

        const direction = targetIdx > currentIdx ? "forward" : "backward";
        setPendingDrop({ task, targetStepId, direction });
    }

    async function handleModalSubmit({ note, files }: { note: string; files: File[] }) {
        if (!pendingDrop) return;

        const { task, targetStepId, direction } = pendingDrop;
        const targetStage = stages.find((s) => s.id === targetStepId);

        setTasks((prev) =>
            prev.map((t) =>
                t.id === task.id
                    ? {
                        ...t,
                        current_step: targetStepId,
                        current_step_name: targetStage?.name ?? t.current_step_name,
                    }
                    : t
            )
        );

        setPendingDrop(null);
        pendingRef.current.add(task.id);

        try {
            const endpoint =
                direction === "forward"
                    ? `/tasks/api/v1/tasks/${task.id}/advance/`
                    : `/tasks/api/v1/tasks/${task.id}/revert/`;

            const formData = new FormData();
            if (note.trim()) formData.append("note", note.trim());
            files.forEach((f) => formData.append("files", f));

            const res = await axiosInstance.post<UserTask>(endpoint, formData, {
                headers: { "Content-Type": "multipart/form-data" },
            });

            handleUpdated(res.data);
        } catch {
            setTasks((prev) => prev.map((t) => (t.id === task.id ? task : t)));
            throw new Error("خطا در ثبت");
        } finally {
            pendingRef.current.delete(task.id);
        }
    }

    function handleModalClose() {
        setPendingDrop(null);
    }

    if (loading || stagesLoading) {
        return (
            <div className="flex h-64 items-center justify-center">
                <Loader size={22} className="animate-spin text-indigo-500" />
            </div>
        );
    }

    if (error) {
        return (
            <div className="flex h-64 flex-col items-center justify-center gap-3 rounded-3xl border border-red-500/20 bg-red-500/5">
                <p className="text-sm font-semibold text-red-500">{error}</p>
            </div>
        );
    }

    if (tasks.length === 0) {
        return (
            <div className="flex h-64 flex-col items-center justify-center gap-3 rounded-3xl border border-dashed border-gray-200 dark:border-white/[0.07]">
                <LayoutGrid size={28} className="text-gray-300 dark:text-gray-700" />
                <p className="text-[12px] text-gray-400">تسکی وجود ندارد</p>
            </div>
        );
    }

    const activeStageIndex = activeTask
        ? stages.findIndex((s) => s.id === activeTask.current_step)
        : -1;
    const activeColor =
        activeStageIndex >= 0
            ? stageColors[activeStageIndex % stageColors.length]
            : "#6366f1";

    const modalDirection = pendingDrop?.direction === "forward" ? "next" : "prev";
    const targetStageName =
        stages.find((s) => s.id === pendingDrop?.targetStepId)?.name ?? "";

    return (
        <>
            <DndContext
                sensors={sensors}
                collisionDetection={closestCenter}
                onDragStart={handleDragStart}
                onDragOver={handleDragOver}
                onDragEnd={handleDragEnd}
            >
                <div className="flex flex-col gap-5" dir="rtl">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2.5">
                            <div className="flex h-9 w-9 items-center justify-center rounded-2xl bg-indigo-500/10">
                                <Kanban size={17} className="text-indigo-500" />
                            </div>
                            <div>
                                <h3 className="text-[14px] font-extrabold text-gray-900 dark:text-white">
                                    تسک‌های من
                                </h3>
                                <p className="text-[11px] text-gray-400 dark:text-gray-600">
                                    {stages.length} مرحله
                                </p>
                            </div>
                        </div>
                        <span className="rounded-2xl bg-gray-100 dark:bg-white/[0.06] px-3 py-1.5 text-[11px] font-bold text-gray-600 dark:text-gray-400">
                            {tasks.length} تسک
                        </span>
                    </div>

                    <div className="flex gap-3 overflow-x-auto pb-3 scrollbar-thin scrollbar-track-transparent scrollbar-thumb-gray-200 dark:scrollbar-thumb-white/10">
                        {stages.map((stage, index) => {
                            const stageTasks = grouped[stage.id] ?? [];
                            const color = stageColors[index % stageColors.length];
                            const isOver =
                                overId === stage.id &&
                                activeTask?.current_step !== stage.id;

                            const activeIdx = activeTask
                                ? stages.findIndex((s) => s.id === activeTask.current_step)
                                : -1;
                            const thisIdx = index;
                            const isAdjacent =
                                activeTask !== null &&
                                Math.abs(thisIdx - activeIdx) === 1;
                            const isDisabled =
                                activeTask !== null &&
                                activeTask.current_step !== stage.id &&
                                !isAdjacent;

                            return (
                                <motion.div
                                    key={stage.id}
                                    initial={{ opacity: 0, y: 12 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ duration: 0.25, delay: index * 0.04 }}
                                    className="w-[300px] shrink-0"
                                >
                                    <StageColumn
                                        stage={stage}
                                        tasks={stageTasks}
                                        accent={color}
                                        index={index}
                                        isOver={isOver && isAdjacent}
                                        isDisabled={isDisabled}
                                        onUpdated={handleUpdated}
                                    />
                                </motion.div>
                            );
                        })}
                    </div>
                </div>

                <DragOverlay dropAnimation={{ duration: 200, easing: "ease" }}>
                    {activeTask && (
                        <div className="rotate-[1.5deg] scale-[1.04]">
                            <UserTaskCard
                                task={activeTask}
                                accent={activeColor}
                                onUpdated={() => { }}
                                isDragging
                            />
                        </div>
                    )}
                </DragOverlay>
            </DndContext>

            <TaskActionModal
                isOpen={pendingDrop !== null}
                onClose={handleModalClose}
                onSubmit={handleModalSubmit}
                direction={modalDirection}
                title={
                    pendingDrop?.direction === "forward"
                        ? "انتقال به مرحله بعد"
                        : "بازگشت به مرحله قبل"
                }
                description={`انتقال به: ${targetStageName}`}
            />

            <AnimatePresence>
                {limitToast && (
                    <motion.div
                        initial={{ opacity: 0, y: 24, scale: 0.95 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 16, scale: 0.95 }}
                        transition={{ duration: 0.22, ease: "easeOut" }}
                        className="fixed bottom-6 left-1/2 z-[100] -translate-x-1/2"
                        dir="rtl"
                    >
                        <div
                            className="flex items-center gap-3 rounded-2xl border px-5 py-3.5 shadow-2xl"
                            style={{
                                background: "rgba(15,23,42,0.96)",
                                borderColor: "rgba(239,68,68,0.25)",
                                backdropFilter: "blur(12px)",
                                boxShadow: "0 8px 32px rgba(239,68,68,0.15)",
                            }}
                        >
                            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-red-500/15">
                                <AlertCircle size={15} className="text-red-400" />
                            </div>
                            <div>
                                <p className="text-[13px] font-bold text-white">
                                    جابجایی مستقیم مجاز نیست
                                </p>
                                <p className="mt-0.5 text-[11px] text-gray-400">
                                    تنها می‌توانید کارت را یک گام به جلو یا عقب منتقل کنید.
                                </p>
                            </div>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </>
    );
}

function StageColumn({
    stage,
    tasks,
    accent,
    index,
    isOver,
    isDisabled,
    onUpdated,
}: {
    stage: UserStage;
    tasks: UserTask[];
    accent: string;
    index: number;
    isOver: boolean;
    isDisabled: boolean;
    onUpdated: (t: UserTask) => void;
}) {
    const { setNodeRef } = useDroppable({ id: stage.id });

    return (
        <div
            ref={setNodeRef}
            className="flex flex-col rounded-[1.6rem] overflow-hidden transition-all duration-200"
            style={{
                background: isOver
                    ? `linear-gradient(145deg, ${accent}10, ${accent}05)`
                    : "rgba(255,255,255,0.02)",
                border: isOver
                    ? `1.5px solid ${accent}50`
                    : "1.5px solid rgba(255,255,255,0.07)",
                boxShadow: isOver
                    ? `0 0 0 4px ${accent}15, 0 8px 32px rgba(0,0,0,0.12)`
                    : "0 2px 12px rgba(0,0,0,0.06)",
                opacity: isDisabled ? 0.35 : 1,
                pointerEvents: isDisabled ? "none" : "auto",
            }}
        >
            <div
                className="px-4 pt-4 pb-3 flex items-center justify-between gap-2"
                style={{ borderBottom: "1px solid rgba(255,255,255,0.06)" }}
            >
                <div className="flex items-center gap-2.5 min-w-0">
                    <div
                        className="flex h-7 w-7 shrink-0 items-center justify-center rounded-xl text-[11px] font-extrabold"
                        style={{ backgroundColor: `${accent}20`, color: accent }}
                    >
                        {index + 1}
                    </div>
                    <h4 className="truncate text-[12.5px] font-bold text-gray-800 dark:text-gray-100">
                        {stage.name}
                    </h4>
                </div>
                <div
                    className="shrink-0 rounded-full px-2.5 py-0.5 text-[10px] font-extrabold tabular-nums"
                    style={{ backgroundColor: `${accent}18`, color: accent }}
                >
                    {tasks.length}
                </div>
            </div>

            <div
                className="h-[2px]"
                style={{
                    background: `linear-gradient(90deg, ${accent}60, transparent)`,
                }}
            />

            <div className="flex flex-col gap-2.5 p-3 max-h-[520px] overflow-y-auto scrollbar-thin scrollbar-track-transparent scrollbar-thumb-white/10">
                {tasks.length === 0 ? (
                    <EmptySlot accent={accent} isOver={isOver} />
                ) : (
                    tasks.map((task) => (
                        <DraggableCard
                            key={task.id}
                            task={task}
                            accent={accent}
                            onUpdated={onUpdated}
                        />
                    ))
                )}
                {tasks.length > 0 && isOver && (
                    <DropIndicator accent={accent} />
                )}
            </div>
        </div>
    );
}

function EmptySlot({ accent, isOver }: { accent: string; isOver: boolean }) {
    return (
        <motion.div
            animate={{
                borderColor: isOver ? `${accent}60` : "rgba(255,255,255,0.08)",
            }}
            className="flex h-36 flex-col items-center justify-center gap-2 rounded-2xl border-2 border-dashed transition-colors"
        >
            <GripVertical size={18} className="text-gray-300 dark:text-gray-700" />
            <p className="text-[11px] text-gray-400 dark:text-gray-600">
                {isOver ? "اینجا رها کن" : "خالی"}
            </p>
        </motion.div>
    );
}

function DropIndicator({ accent }: { accent: string }) {
    return (
        <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 48 }}
            exit={{ opacity: 0, height: 0 }}
            className="rounded-2xl border-2 border-dashed flex items-center justify-center"
            style={{ borderColor: `${accent}50`, background: `${accent}08` }}
        >
            <p className="text-[11px] font-semibold" style={{ color: accent }}>
                اینجا رها کن
            </p>
        </motion.div>
    );
}

function DraggableCard({
    task,
    accent,
    onUpdated,
}: {
    task: UserTask;
    accent: string;
    onUpdated: (t: UserTask) => void;
}) {
    const { attributes, listeners, setNodeRef, isDragging } = useDraggable({
        id: task.id,
    });

    return (
        <div ref={setNodeRef} {...attributes} {...listeners} className="touch-none">
            <UserTaskCard
                task={task}
                accent={accent}
                onUpdated={onUpdated}
                isDragging={isDragging}
            />
        </div>
    );
}
