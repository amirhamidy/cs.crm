"use client";

import { useEffect, useMemo, useState, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
    Kanban,
    Loader,
    GripVertical,
    LayoutGrid,
    AlertCircle,
    Building2,
    Layers3,
    CheckCircle2,
    ShoppingBag,
    Ban,
} from "lucide-react";
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
import { useCurrentEmployee } from "@/hooks/usecurrentemployee";

interface DepartmentGroup {
    id: number;
    name: string;
    stages: KanbanStage[];
    tasks: UserTask[];
}

interface PendingDrop {
    task: UserTask;
    targetStepId: number;
    direction: "forward" | "backward";
}

type TaskStatusFilter =
    | "all"
    | "in_progress"
    | "completed"
    | "sold"
    | "cancelled";


type KanbanStage = UserStage & {
    title?: string;
    department?: number | string | { id: number; name?: string } | null;
    department_name?: string | null;
};


const stageColors = [
    "#6366f1",
    "#8b5cf6",
    "#ec4899",
    "#f59e0b",
    "#10b981",
    "#3b82f6",
    "#ef4444",
    "#14b8a6",
];

const statusFilters: {
    id: TaskStatusFilter;
    label: string;
    icon: typeof Layers3;
    color: string;
    activeBg: string;
    activeBorder: string;
}[] = [
        {
            id: "all",
            label: "همه",
            icon: Layers3,
            color: "#818cf8",
            activeBg: "rgba(99,102,241,0.16)",
            activeBorder: "rgba(99,102,241,0.4)",
        },
        {
            id: "in_progress",
            label: "در حال انجام",
            icon: Layers3,
            color: "#818cf8",
            activeBg: "rgba(99,102,241,0.16)",
            activeBorder: "rgba(99,102,241,0.4)",
        },
        {
            id: "completed",
            label: "تکمیل شده",
            icon: CheckCircle2,
            color: "#34d399",
            activeBg: "rgba(16,185,129,0.14)",
            activeBorder: "rgba(16,185,129,0.4)",
        },
        {
            id: "sold",
            label: "فروش رفته",
            icon: ShoppingBag,
            color: "#fbbf24",
            activeBg: "rgba(245,158,11,0.14)",
            activeBorder: "rgba(245,158,11,0.4)",
        },
        {
            id: "cancelled",
            label: "لغو شده",
            icon: Ban,
            color: "#fb7185",
            activeBg: "rgba(239,68,68,0.14)",
            activeBorder: "rgba(239,68,68,0.4)",
        },
    ];

function useMediaQuery(query: string) {
    const [matches, setMatches] = useState(false);

    useEffect(() => {
        const media = window.matchMedia(query);

        const updateMatches = () => {
            setMatches(media.matches);
        };

        updateMatches();
        media.addEventListener("change", updateMatches);

        return () => {
            media.removeEventListener("change", updateMatches);
        };
    }, [query]);

    return matches;
}

function extractDeptId(task: UserTask): number {
    const raw = (task as any).department;

    if (raw && typeof raw === "object" && "id" in raw) {
        return Number(raw.id);
    }

    if (raw !== undefined && raw !== null && raw !== "") {
        return Number(raw);
    }

    return -1;
}

function extractDeptName(task: UserTask): string {
    const direct = (task as any).department_name;

    if (typeof direct === "string" && direct.trim()) {
        return direct.trim();
    }

    const raw = (task as any).department;

    if (raw && typeof raw === "object" && "name" in raw) {
        return String(raw.name);
    }

    return "بدون دپارتمان";
}

function extractStageDeptId(stage: KanbanStage): number {
    const raw = stage.department;

    if (raw && typeof raw === "object" && "id" in raw) {
        return Number(raw.id);
    }

    if (raw !== undefined && raw !== null && raw !== "") {
        return Number(raw);
    }

    return -1;
}


function extractAssignedEmployeeIds(task: UserTask): number[] {
    const raw = (task as any).assigned_employee;

    if (Array.isArray(raw)) {
        return raw.map((value) => Number(value));
    }

    return [];
}

function groupTasksByStep(tasks: UserTask[]): Record<number, UserTask[]> {
    return tasks.reduce<Record<number, UserTask[]>>((acc, task) => {
        const key = task.current_step;

        if (!acc[key]) {
            acc[key] = [];
        }

        acc[key].push(task);

        return acc;
    }, {});
}

export default function UserTasksKanban() {
    const { employee, loading: employeeLoading } = useCurrentEmployee();

    const [tasks, setTasks] = useState<UserTask[]>([]);
    const [stages, setStages] = useState<KanbanStage[]>([]);
    const [loading, setLoading] = useState(true);
    const [stagesLoading, setStagesLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [activeTask, setActiveTask] = useState<UserTask | null>(null);
    const [overId, setOverId] = useState<number | null>(null);
    const [pendingDrop, setPendingDrop] = useState<PendingDrop | null>(null);
    const [limitToast, setLimitToast] = useState(false);
    const [activeDeptId, setActiveDeptId] = useState<number | null>(null);
    const [activeMobileStageId, setActiveMobileStageId] = useState<number | null>(null);
    const [statusFilter, setStatusFilter] = useState<TaskStatusFilter>("all");

    const pendingRef = useRef<Set<number>>(new Set());
    const limitToastTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

    const isMobile = useMediaQuery("(max-width: 767px)");

    const sensors = useSensors(
        useSensor(PointerSensor, {
            activationConstraint: { distance: 8 },
        })
    );

    useEffect(() => {
        axiosInstance
            .get<{ results: KanbanStage[] } | KanbanStage[]>(
                "/department/api/v1/department_step/"
            )
            .then((res) => {
                const raw = Array.isArray(res.data)
                    ? res.data
                    : (res.data as { results: KanbanStage[] }).results ?? [];

                const mapped: KanbanStage[] = raw
                    .map((stage) => ({
                        ...stage,
                        id: stage.id,
                        name: stage.name ?? stage.title ?? `مرحله ${stage.id}`,
                        order: stage.order ?? stage.id,
                        department: stage.department ?? null,
                        department_name:
                            stage.department_name ??
                            (typeof stage.department === "object" && stage.department
                                ? (stage.department as { name?: string }).name ?? null
                                : null),
                    }))
                    .sort((a, b) => a.order - b.order);

                setStages(mapped);
            })

            .catch(() => setError("دریافت فرآیند ها با خطا مواجه شد"))
            .finally(() => setStagesLoading(false));
    }, []);

    useEffect(() => {
        if (employeeLoading) {
            return;
        }

        if (!employee) {
            setTasks([]);
            setLoading(false);
            return;
        }

        let cancelled = false;

        setLoading(true);

        axiosInstance
            .get<UserTask[] | { results: UserTask[] }>("/tasks/api/v1/tasks/")
            .then((res) => {
                if (cancelled) {
                    return;
                }

                const data = Array.isArray(res.data)
                    ? res.data
                    : res.data.results ?? [];

                const myTasks = data.filter((task) =>
                    extractAssignedEmployeeIds(task).includes(employee.id)
                );

                setTasks(myTasks);
            })
            .catch(() => {
                if (!cancelled) {
                    setError("دریافت تسک‌ها با خطا مواجه شد");
                }
            })
            .finally(() => {
                if (!cancelled) {
                    setLoading(false);
                }
            });

        return () => {
            cancelled = true;
        };
    }, [employeeLoading, employee]);

    const departmentGroups = useMemo<DepartmentGroup[]>(() => {
        const map = new Map<number, DepartmentGroup>();

        const deptNameFromTasks = new Map<number, string>();
        tasks.forEach((task) => {
            const id = extractDeptId(task);
            const name = extractDeptName(task);
            if (id !== -1 && !deptNameFromTasks.has(id)) {
                deptNameFromTasks.set(id, name);
            }
        });

        stages.forEach((stage) => {
            const deptId = extractStageDeptId(stage);
            const deptName =
                stage.department_name ||
                (typeof stage.department === "object" && stage.department
                    ? String((stage.department as { name?: string }).name ?? "")
                    : "") ||
                deptNameFromTasks.get(deptId) ||
                "بدون دپارتمان";

            if (!map.has(deptId)) {
                map.set(deptId, {
                    id: deptId,
                    name: deptName,
                    stages: [],
                    tasks: [],
                });
            }

            map.get(deptId)!.stages.push(stage);
        });

        tasks.forEach((task) => {
            const deptId = extractDeptId(task);
            const deptName = extractDeptName(task);

            if (!map.has(deptId)) {
                map.set(deptId, {
                    id: deptId,
                    name: deptName,
                    stages: [],
                    tasks: [],
                });
            }

            map.get(deptId)!.tasks.push(task);
        });

        map.forEach((group) => {
            group.stages.sort((a, b) => a.order - b.order);
        });

        return Array.from(map.values());
    }, [stages, tasks]);

    useEffect(() => {
        if (departmentGroups.length === 0) {
            setActiveDeptId(null);
            return;
        }

        if (
            activeDeptId === null ||
            !departmentGroups.some((group) => group.id === activeDeptId)
        ) {
            setActiveDeptId(departmentGroups[0].id);
        }
    }, [departmentGroups, activeDeptId]);

    const activeGroup =
        departmentGroups.find((group) => group.id === activeDeptId) ?? null;

    const filteredActiveTasks = useMemo(() => {
        const activeTasks = activeGroup?.tasks ?? [];

        if (statusFilter === "all") {
            return activeTasks;
        }

        return activeTasks.filter((task) => task.status === statusFilter);
    }, [activeGroup, statusFilter]);

    const grouped = useMemo(
        () => groupTasksByStep(filteredActiveTasks),
        [filteredActiveTasks]
    );

    const getStatusCount = (status: TaskStatusFilter) => {
        const activeTasks = activeGroup?.tasks ?? [];

        if (status === "all") {
            return activeTasks.length;
        }

        return activeTasks.filter((task) => task.status === status).length;
    };

    useEffect(() => {
        const availableStages = activeGroup?.stages ?? [];

        if (availableStages.length === 0) {
            setActiveMobileStageId(null);
            return;
        }

        if (
            activeMobileStageId === null ||
            !availableStages.some((stage) => stage.id === activeMobileStageId)
        ) {
            setActiveMobileStageId(availableStages[0].id);
        }
    }, [activeGroup, activeMobileStageId]);

    function handleUpdated(updated: UserTask) {
        setTasks((prev) =>
            prev.map((task) => (task.id === updated.id ? updated : task))
        );
    }

    function handleDragStart(event: DragStartEvent) {
        const task = tasks.find((item) => item.id === event.active.id);

        if (task) {
            setActiveTask(task);
        }
    }

    function handleDragOver(event: DragOverEvent) {
        const id = event.over?.id;

        if (id !== undefined) {
            setOverId(Number(id));
        }
    }

    function showLimitToast() {
        setLimitToast(true);

        if (limitToastTimer.current) {
            clearTimeout(limitToastTimer.current);
        }

        limitToastTimer.current = setTimeout(() => {
            setLimitToast(false);
        }, 3500);
    }

    function handleDragEnd(event: DragEndEvent) {
        const { active, over } = event;

        setActiveTask(null);
        setOverId(null);

        if (!over || !activeGroup) {
            return;
        }

        const task = tasks.find((item) => item.id === active.id);

        if (!task) {
            return;
        }

        const targetStepId = Number(over.id);

        if (task.current_step === targetStepId) {
            return;
        }

        if (pendingRef.current.has(task.id)) {
            return;
        }

        const stageList = activeGroup.stages.map((stage) => stage.id);
        const currentIdx = stageList.indexOf(task.current_step);
        const targetIdx = stageList.indexOf(targetStepId);

        if (targetIdx === -1) {
            return;
        }

        const steps = Math.abs(targetIdx - currentIdx);

        if (steps > 1) {
            showLimitToast();
            return;
        }

        const direction = targetIdx > currentIdx ? "forward" : "backward";

        setPendingDrop({
            task,
            targetStepId,
            direction,
        });
    }

    async function handleModalSubmit({
        note,
        files,
    }: {
        note: string;
        files: File[];
    }) {
        if (!pendingDrop || !activeGroup) {
            return;
        }

        const { task, targetStepId, direction } = pendingDrop;
        const targetStage = activeGroup.stages.find(
            (stage) => stage.id === targetStepId
        );

        setTasks((prev) =>
            prev.map((item) =>
                item.id === task.id
                    ? {
                        ...item,
                        current_step: targetStepId,
                        current_step_name:
                            targetStage?.name ?? item.current_step_name,
                    }
                    : item
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

            if (note.trim()) {
                formData.append("note", note.trim());
            }

            files.forEach((file) => {
                formData.append("files", file);
            });

            const res = await axiosInstance.post<UserTask>(endpoint, formData, {
                headers: {
                    "Content-Type": "multipart/form-data",
                },
            });

            handleUpdated(res.data);
        } catch {
            setTasks((prev) =>
                prev.map((item) => (item.id === task.id ? task : item))
            );

            throw new Error("خطا در ثبت");
        } finally {
            pendingRef.current.delete(task.id);
        }
    }

    function handleModalClose() {
        setPendingDrop(null);
    }

    if (loading || stagesLoading || employeeLoading) {
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
                <LayoutGrid
                    size={28}
                    className="text-gray-300 dark:text-gray-700"
                />
                <p className="text-[12px] text-gray-400">تسکی وجود ندارد</p>
            </div>
        );
    }

    const activeStages = activeGroup?.stages ?? [];

    const activeStageIndex = activeTask
        ? activeStages.findIndex((stage) => stage.id === activeTask.current_step)
        : -1;

    const activeColor =
        activeStageIndex >= 0
            ? stageColors[activeStageIndex % stageColors.length]
            : "#6366f1";

    const modalDirection = pendingDrop?.direction === "forward" ? "next" : "prev";

    const targetStageName =
        activeGroup?.stages.find(
            (stage) => stage.id === pendingDrop?.targetStepId
        )?.name ?? "";

    const mobileStage =
        activeGroup?.stages.find(
            (stage) => stage.id === activeMobileStageId
        ) ?? activeGroup?.stages[0];

    const mobileStageIndex = mobileStage
        ? activeGroup?.stages.findIndex((stage) => stage.id === mobileStage.id) ?? 0
        : 0;

    const mobileStageTasks = mobileStage ? grouped[mobileStage.id] ?? [] : [];

    const mobileStageColor =
        stageColors[mobileStageIndex % stageColors.length] ?? "#6366f1";

    return (
        <>
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
                                {departmentGroups.length} دپارتمان
                            </p>
                        </div>
                    </div>

                    <span className="rounded-2xl bg-gray-100 px-3 py-1.5 text-[11px] font-bold text-gray-600 dark:bg-white/[0.06] dark:text-gray-400">
                        {filteredActiveTasks.length} تسک
                    </span>
                </div>

                <div className="flex gap-2 overflow-x-auto pb-1">
                    {departmentGroups.map((group) => {
                        const isActive = group.id === activeDeptId;

                        return (
                            <button
                                key={group.id}
                                type="button"
                                onClick={() => setActiveDeptId(group.id)}
                                className={`flex shrink-0 items-center gap-2 rounded-2xl px-3.5 py-2 text-[11.5px] font-bold transition-colors ${isActive
                                    ? "bg-indigo-600 text-white"
                                    : "bg-gray-100 text-gray-500 hover:bg-gray-200 dark:bg-white/[0.05] dark:text-gray-400 dark:hover:bg-white/[0.08]"
                                    }`}
                            >
                                <Building2 size={12} />

                                {group.name}

                                <span
                                    className={`rounded-full px-1.5 py-0.5 text-[10px] font-extrabold ${isActive
                                        ? "bg-white/20"
                                        : "bg-black/5 dark:bg-white/10"
                                        }`}
                                >
                                    {group.tasks.length}
                                </span>
                            </button>
                        );
                    })}
                </div>

                <div className="flex gap-2 overflow-x-auto pb-1">
                    {statusFilters.map((filter) => {
                        const isActive = statusFilter === filter.id;
                        const Icon = filter.icon;
                        const count = getStatusCount(filter.id);

                        return (
                            <button
                                key={filter.id}
                                type="button"
                                onClick={() => setStatusFilter(filter.id)}
                                className="flex shrink-0 items-center gap-2 rounded-2xl border px-3.5 py-2 text-[11px] font-bold transition-all duration-200"
                                style={{
                                    color: isActive ? filter.color : undefined,
                                    backgroundColor: isActive
                                        ? filter.activeBg
                                        : "rgba(255,255,255,0.025)",
                                    borderColor: isActive
                                        ? filter.activeBorder
                                        : "rgba(255,255,255,0.07)",
                                    boxShadow: isActive
                                        ? `0 5px 18px ${filter.color}14`
                                        : "none",
                                }}
                            >
                                <Icon
                                    size={13}
                                    style={{
                                        color: isActive
                                            ? filter.color
                                            : "rgb(148 163 184)",
                                    }}
                                />

                                <span
                                    className={
                                        isActive
                                            ? ""
                                            : "text-gray-500 dark:text-gray-400"
                                    }
                                >
                                    {filter.label}
                                </span>

                                <span
                                    className="rounded-full px-1.5 py-0.5 text-[9.5px] font-extrabold tabular-nums"
                                    style={{
                                        color: filter.color,
                                        backgroundColor: `${filter.color}18`,
                                    }}
                                >
                                    {count}
                                </span>
                            </button>
                        );
                    })}
                </div>

                {activeGroup &&
                    (isMobile ? (
                        <div className="flex flex-col gap-3">
                            <div className="flex gap-2 overflow-x-auto pb-1">
                                {activeGroup.stages.map((stage, index) => {
                                    const isActive = stage.id === mobileStage?.id;
                                    const color =
                                        stageColors[index % stageColors.length];
                                    const count = grouped[stage.id]?.length ?? 0;

                                    return (
                                        <button
                                            key={stage.id}
                                            type="button"
                                            onClick={() =>
                                                setActiveMobileStageId(stage.id)
                                            }
                                            className="flex shrink-0 items-center gap-2 rounded-2xl border px-3 py-2 text-[11px] font-bold transition-all"
                                            style={{
                                                color: isActive ? color : undefined,
                                                backgroundColor: isActive
                                                    ? `${color}14`
                                                    : undefined,
                                                borderColor: isActive
                                                    ? `${color}45`
                                                    : "rgba(255,255,255,0.07)",
                                            }}
                                        >
                                            <span
                                                className="flex h-5 w-5 items-center justify-center rounded-lg text-[9px] font-extrabold"
                                                style={{
                                                    backgroundColor: `${color}20`,
                                                    color,
                                                }}
                                            >
                                                {index + 1}
                                            </span>

                                            <span
                                                className={
                                                    isActive
                                                        ? ""
                                                        : "text-gray-500 dark:text-gray-400"
                                                }
                                            >
                                                {stage.name}
                                            </span>

                                            <span
                                                className="rounded-full px-1.5 py-0.5 text-[9px] font-extrabold"
                                                style={{
                                                    backgroundColor: `${color}18`,
                                                    color,
                                                }}
                                            >
                                                {count}
                                            </span>
                                        </button>
                                    );
                                })}
                            </div>

                            {mobileStage && (
                                <AnimatePresence mode="wait">
                                    <motion.div
                                        key={`${mobileStage.id}-${statusFilter}`}
                                        initial={{ opacity: 0, y: 10 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        exit={{ opacity: 0, y: -8 }}
                                        transition={{ duration: 0.2 }}
                                    >
                                        <MobileStageColumn
                                            stage={mobileStage}
                                            tasks={mobileStageTasks}
                                            accent={mobileStageColor}
                                            index={mobileStageIndex}
                                            onUpdated={handleUpdated}
                                        />
                                    </motion.div>
                                </AnimatePresence>
                            )}
                        </div>
                    ) : (
                        <DndContext
                            sensors={sensors}
                            collisionDetection={closestCenter}
                            onDragStart={handleDragStart}
                            onDragOver={handleDragOver}
                            onDragEnd={handleDragEnd}
                        >
                            <div className="flex gap-3 overflow-x-auto pb-3">
                                {activeGroup.stages.map((stage, index) => {
                                    const stageTasks = grouped[stage.id] ?? [];
                                    const color =
                                        stageColors[index % stageColors.length];

                                    const isOver =
                                        overId === stage.id &&
                                        activeTask?.current_step !== stage.id;

                                    const activeIdx = activeTask
                                        ? activeGroup.stages.findIndex(
                                            (item) =>
                                                item.id ===
                                                activeTask.current_step
                                        )
                                        : -1;

                                    const isAdjacent =
                                        activeTask !== null &&
                                        Math.abs(index - activeIdx) === 1;

                                    const isDisabled =
                                        activeTask !== null &&
                                        activeTask.current_step !== stage.id &&
                                        !isAdjacent;

                                    return (
                                        <motion.div
                                            key={stage.id}
                                            initial={{ opacity: 0, y: 12 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            transition={{
                                                duration: 0.25,
                                                delay: index * 0.04,
                                            }}
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

                            <DragOverlay
                                dropAnimation={{
                                    duration: 200,
                                    easing: "ease",
                                }}
                            >
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
                    ))}
            </div>

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
    onUpdated: (task: UserTask) => void;
}) {
    const { setNodeRef } = useDroppable({ id: stage.id });

    return (
        <div
            ref={setNodeRef}
            className="flex flex-col overflow-hidden rounded-[1.6rem] transition-all duration-200"
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
                className="flex items-center justify-between gap-2 px-4 pb-3 pt-4"
                style={{ borderBottom: "1px solid rgba(255,255,255,0.06)" }}
            >
                <div className="flex min-w-0 items-center gap-2.5">
                    <div
                        className="flex h-7 w-7 shrink-0 items-center justify-center rounded-xl text-[11px] font-extrabold"
                        style={{
                            backgroundColor: `${accent}20`,
                            color: accent,
                        }}
                    >
                        {index + 1}
                    </div>

                    <h4 className="truncate text-[12.5px] font-bold text-gray-800 dark:text-gray-100">
                        {stage.name}
                    </h4>
                </div>

                <div
                    className="shrink-0 rounded-full px-2.5 py-0.5 text-[10px] font-extrabold tabular-nums"
                    style={{
                        backgroundColor: `${accent}18`,
                        color: accent,
                    }}
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

            <div className="scrollbar-thin scrollbar-track-transparent scrollbar-thumb-white/10 flex max-h-[520px] flex-col gap-2.5 overflow-y-auto p-3">
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

                {tasks.length > 0 && isOver && <DropIndicator accent={accent} />}
            </div>
        </div>
    );
}

function MobileStageColumn({
    stage,
    tasks,
    accent,
    index,
    onUpdated,
}: {
    stage: UserStage;
    tasks: UserTask[];
    accent: string;
    index: number;
    onUpdated: (task: UserTask) => void;
}) {
    return (
        <div
            className="flex flex-col overflow-hidden rounded-[1.6rem]"
            style={{
                background: "rgba(255,255,255,0.02)",
                border: "1.5px solid rgba(255,255,255,0.07)",
                boxShadow: "0 2px 12px rgba(0,0,0,0.06)",
            }}
        >
            <div
                className="flex items-center justify-between gap-2 px-4 pb-3 pt-4"
                style={{ borderBottom: "1px solid rgba(255,255,255,0.06)" }}
            >
                <div className="flex min-w-0 items-center gap-2.5">
                    <div
                        className="flex h-7 w-7 shrink-0 items-center justify-center rounded-xl text-[11px] font-extrabold"
                        style={{
                            backgroundColor: `${accent}20`,
                            color: accent,
                        }}
                    >
                        {index + 1}
                    </div>

                    <h4 className="truncate text-[12.5px] font-bold text-gray-800 dark:text-gray-100">
                        {stage.name}
                    </h4>
                </div>

                <div
                    className="shrink-0 rounded-full px-2.5 py-0.5 text-[10px] font-extrabold tabular-nums"
                    style={{
                        backgroundColor: `${accent}18`,
                        color: accent,
                    }}
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

            <div className="flex flex-col gap-2.5 p-3">
                {tasks.length === 0 ? (
                    <EmptySlot accent={accent} isOver={false} />
                ) : (
                    tasks.map((task) => (
                        <UserTaskCard
                            key={task.id}
                            task={task}
                            accent={accent}
                            onUpdated={onUpdated}
                        />
                    ))
                )}
            </div>
        </div>
    );
}

function EmptySlot({
    accent,
    isOver,
}: {
    accent: string;
    isOver: boolean;
}) {
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
            className="flex items-center justify-center rounded-2xl border-2 border-dashed"
            style={{
                borderColor: `${accent}50`,
                background: `${accent}08`,
            }}
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
    onUpdated: (task: UserTask) => void;
}) {
    const { attributes, listeners, setNodeRef, isDragging } = useDraggable({
        id: task.id,
    });

    return (
        <div
            ref={setNodeRef}
            {...attributes}
            {...listeners}
            className="touch-none"
        >
            <UserTaskCard
                task={task}
                accent={accent}
                onUpdated={onUpdated}
                isDragging={isDragging}
            />
        </div>
    );
}
