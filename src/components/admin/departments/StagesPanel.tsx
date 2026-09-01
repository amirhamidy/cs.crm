"use client";

import {
    useCallback,
    useEffect,
    useMemo,
    useRef,
    useState,
} from "react";
import { AnimatePresence, motion } from "framer-motion";
import {
    ChevronLeft,
    Pencil,
    Plus,
    Trash2,
} from "lucide-react";
import { createPortal } from "react-dom";
import { Swiper, SwiperSlide } from "swiper/react";
import { FreeMode } from "swiper/modules";

import "swiper/css";
import "swiper/css/free-mode";

import type {
    Department,
    Stage,
    Task,
} from "@/components/admin/departments/types";

import StageCard from "@/components/admin/departments/StageCard";
import EditStageModal from "./EditStageModal";

interface StagesPanelProps {
    department: Department;
    tasks: Task[];
    tasksLoading?: boolean;
    stageColors?: string[];
    onReorder: (stages: Stage[]) => void;
    onAddStage?: () => void;
    onEditStage?: (
        stage: Stage,
        values: {
            name: string;
            description: string;
            order: number;
        }
    ) => Promise<void> | void;
    onDeleteStage?: (stage: Stage) => void;
}

const getRelationId = (
    value:
        | string
        | number
        | { id: string | number }
        | null
        | undefined
) => {
    if (value === null || value === undefined) {
        return null;
    }

    if (typeof value === "object") {
        return value.id === null || value.id === undefined
            ? null
            : String(value.id);
    }

    return String(value);
};

interface StageHeaderProps {
    stage: Stage;
    index: number;
    tasksCount: number;
    isLast: boolean;
    hasDependencies: boolean;
    dependencyMessage: string;
    onEdit?: () => void;
    onDelete?: () => void;
}

function StageHeader({
    stage,
    index,
    tasksCount,
    isLast,
    hasDependencies,
    dependencyMessage,
    onEdit,
    onDelete,
}: StageHeaderProps) {
    const stageColor = stage.color || "#6366f1";

    const [tooltipVisible, setTooltipVisible] =
        useState(false);

    const [tooltipPosition, setTooltipPosition] =
        useState({
            top: 0,
            left: 0,
        });

    const showDependencyTooltip = (
        event: React.MouseEvent<HTMLButtonElement>
    ) => {
        if (!hasDependencies) {
            return;
        }

        const rect =
            event.currentTarget.getBoundingClientRect();

        setTooltipPosition({
            top: rect.top - 10,
            left: rect.left + rect.width / 2,
        });

        setTooltipVisible(true);
    };

    const hideDependencyTooltip = () => {
        setTooltipVisible(false);
    };

    const tooltip =
        tooltipVisible &&
            hasDependencies &&
            typeof document !== "undefined"
            ? createPortal(
                <AnimatePresence>
                    <motion.div
                        initial={{
                            opacity: 0,
                            y: 5,
                            scale: 0.95,
                        }}
                        animate={{
                            opacity: 1,
                            y: 0,
                            scale: 1,
                        }}
                        exit={{
                            opacity: 0,
                            y: 5,
                            scale: 0.95,
                        }}
                        transition={{
                            duration: 0.15,
                            ease: "easeOut",
                        }}
                        className="pointer-events-none fixed z-[999999] -translate-x-1/2 -translate-y-full whitespace-nowrap"
                        style={{
                            top: tooltipPosition.top,
                            left: tooltipPosition.left,
                        }}
                        dir="rtl"
                    >
                        <div
                            className="flex flex-col items-center gap-1 rounded-2xl px-3 py-2 text-center shadow-2xl"
                            style={{
                                background: "#1e293b",
                                border: "1px solid rgba(255,255,255,0.08)",
                            }}
                        >
                            <span className="text-[11px] font-bold text-white">
                                {dependencyMessage}
                            </span>

                            <span className="text-[10px] text-slate-400">
                                برای حذف آن ابتدا وظایف این فرآیند را حذف کنید
                            </span>
                        </div>
                    </motion.div>
                </AnimatePresence>,
                document.body
            )
            : null;

    return (
        <>
            <div className="relative">
                {!isLast && (
                    <div
                        className="pointer-events-none absolute top-[19px] z-10 flex h-6 w-6 items-center justify-center rounded-full border bg-white shadow-sm dark:bg-[#0f172a]"
                        style={{
                            insetInlineEnd: "-13px",
                            borderColor: `${stageColor}40`,
                            color: stageColor,
                        }}
                    >
                        <ChevronLeft
                            size={12}
                            strokeWidth={2.5}
                        />
                    </div>
                )}

                <div
                    className="flex min-h-[66px] items-center justify-between gap-2 rounded-[1.35rem] border bg-white/75 px-3.5 py-2 dark:bg-white/[0.03]"
                    style={{
                        borderColor: `${stageColor}35`,
                    }}
                >
                    <div className="flex min-w-0 items-center gap-2.5">
                        <span
                            className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl text-[11px] font-extrabold text-white"
                            style={{
                                backgroundColor: stageColor,
                            }}
                        >
                            {index + 1}
                        </span>

                        <div className="min-w-0">
                            <h4 className="truncate text-[12px] font-extrabold text-gray-800 dark:text-gray-100">
                                {stage.name}
                            </h4>

                            {stage.description && (
                                <p className="mt-0.5 truncate text-[10px] font-medium text-gray-400 dark:text-gray-500">
                                    {stage.description}
                                </p>
                            )}

                            <p className="mt-0.5 text-[10px] font-bold text-gray-400 dark:text-gray-500">
                                {tasksCount} وظیفه
                            </p>
                        </div>
                    </div>

                    <div className="flex shrink-0 items-center gap-1">
                        {onEdit && (
                            <button
                                type="button"
                                onClick={onEdit}
                                className="rounded-lg p-1.5 transition"
                                style={{
                                    color: stageColor,
                                    backgroundColor: `${stageColor}14`,
                                }}
                            >
                                <Pencil size={13} />
                            </button>
                        )}

                        {onDelete && (
                            <button
                                type="button"
                                onClick={() => {
                                    if (hasDependencies) {
                                        return;
                                    }

                                    onDelete();
                                }}
                                onMouseEnter={
                                    showDependencyTooltip
                                }
                                onMouseLeave={
                                    hideDependencyTooltip
                                }
                                className="rounded-lg p-1.5 transition"
                                style={{
                                    background: hasDependencies
                                        ? "rgba(0,0,0,0.04)"
                                        : undefined,
                                    color: hasDependencies
                                        ? "#9ca3af"
                                        : undefined,
                                    cursor: hasDependencies
                                        ? "not-allowed"
                                        : "pointer",
                                }}
                            >
                                <Trash2 size={13} />
                            </button>
                        )}
                    </div>
                </div>
            </div>

            {tooltip}
        </>
    );
}

export default function StagesPanel({
    department,
    tasks = [],
    tasksLoading = false,
    onAddStage,
    onEditStage,
    onDeleteStage,
}: StagesPanelProps) {
    const [editingStage, setEditingStage] =
        useState<Stage | null>(null);

    const [activeStageKey, setActiveStageKey] =
        useState<string | null>(null);

    const [localStages, setLocalStages] =
        useState<Stage[]>(
            () =>
                [...(department.stages || [])].sort(
                    (a, b) => a.order - b.order
                )
        );

    const prevServerStagesRef =
        useRef<Stage[]>(
            department.stages || []
        );

    const keyMapRef = useRef(
        new WeakMap<Stage, string>()
    );

    const keyCounterRef = useRef(0);

    useEffect(() => {
        const nextStages =
            department.stages || [];

        const prevIds =
            prevServerStagesRef.current
                .map((stage) => stage.id)
                .sort()
                .join(",");

        const nextIds =
            nextStages
                .map((stage) => stage.id)
                .sort()
                .join(",");

        if (
            prevIds !== nextIds ||
            prevServerStagesRef.current.length !==
            nextStages.length
        ) {
            setLocalStages(
                [...nextStages].sort(
                    (a, b) =>
                        a.order - b.order
                )
            );
        }

        prevServerStagesRef.current =
            nextStages;
    }, [department.stages]);

    const getStageKey = useCallback(
        (stage: Stage) => {
            if (
                stage.id !== undefined &&
                stage.id !== null
            ) {
                return String(stage.id);
            }

            let key =
                keyMapRef.current.get(stage);

            if (!key) {
                key = `temp-${keyCounterRef.current++}`;
                keyMapRef.current.set(
                    stage,
                    key
                );
            }

            return key;
        },
        []
    );

    const uniqueLocalStages = useMemo(() => {
        const seen = new Set<string>();

        const result: {
            stage: Stage;
            key: string;
        }[] = [];

        for (const stage of localStages) {
            const key =
                getStageKey(stage);

            if (seen.has(key)) {
                continue;
            }

            seen.add(key);

            result.push({
                stage,
                key,
            });
        }

        return result;
    }, [getStageKey, localStages]);

    useEffect(() => {
        if (
            uniqueLocalStages.length === 0
        ) {
            setActiveStageKey(null);
            return;
        }

        const activeStageExists =
            uniqueLocalStages.some(
                ({ key }) =>
                    key === activeStageKey
            );

        if (!activeStageExists) {
            setActiveStageKey(
                uniqueLocalStages[0].key
            );
        }
    }, [
        activeStageKey,
        uniqueLocalStages,
    ]);

    const handleEditStage = useCallback(
        async (
            targetStage: Stage,
            values: {
                name: string;
                description: string;
                order: number;
            }
        ) => {
            if (!onEditStage) {
                return;
            }

            const oldOrder =
                targetStage.order;

            const newOrder =
                values.order;

            if (oldOrder === newOrder) {
                await onEditStage(
                    targetStage,
                    values
                );
                return;
            }

            const conflictingStage =
                localStages.find(
                    (stage) =>
                        stage.id !==
                        targetStage.id &&
                        stage.order === newOrder
                );

            const snapshot =
                [...localStages];

            setLocalStages(
                (previousStages) => {
                    const updatedStages =
                        previousStages.map(
                            (stage) => {
                                if (
                                    stage.id ===
                                    targetStage.id
                                ) {
                                    return {
                                        ...stage,
                                        order: newOrder,
                                    };
                                }

                                if (
                                    conflictingStage &&
                                    stage.id ===
                                    conflictingStage.id
                                ) {
                                    return {
                                        ...stage,
                                        order: oldOrder,
                                    };
                                }

                                return stage;
                            }
                        );

                    return [
                        ...updatedStages,
                    ].sort(
                        (
                            firstStage,
                            secondStage
                        ) =>
                            firstStage.order -
                            secondStage.order
                    );
                }
            );

            try {
                if (
                    conflictingStage
                ) {
                    await onEditStage(
                        conflictingStage,
                        {
                            name:
                                conflictingStage.name,
                            description:
                                conflictingStage.description ?? "",
                            order: oldOrder,
                        }
                    );
                }

                await onEditStage(
                    targetStage,
                    values
                );
            } catch (error) {
                setLocalStages(
                    snapshot
                );
                throw error;
            }
        },
        [localStages, onEditStage]
    );

    const getStageTasks = useCallback(
        (stage: Stage) =>
            tasks.filter(
                (task) =>
                    getRelationId(
                        task.current_step
                    ) === String(stage.id)
            ),
        [tasks]
    );

    const handleDeleteStage =
        useCallback(
            (stage: Stage) => {
                if (!onDeleteStage) {
                    return;
                }

                const stageTasks =
                    getStageTasks(stage);

                if (
                    stageTasks.length > 0
                ) {
                    return;
                }

                onDeleteStage(stage);
            },
            [
                getStageTasks,
                onDeleteStage,
            ]
        );

    const renderStageCard = (
        stage: Stage,
        key: string,
        index: number,
        options?: {
            isMobile?: boolean;
            showHeader?: boolean;
            showConnector?: boolean;
        }
    ) => {
        const stageTasks =
            getStageTasks(stage);

        const hasDependencies =
            stageTasks.length > 0;

        return (
            <StageCard
                key={key}
                stage={stage}
                index={index}
                isLast={
                    options?.isMobile
                        ? true
                        : index ===
                        uniqueLocalStages.length -
                        1
                }
                tasks={stageTasks}
                tasksLoading={
                    tasksLoading
                }
                showHeader={
                    options?.showHeader
                }
                showConnector={
                    options?.showConnector
                }
                hasDependencies={
                    hasDependencies
                }
                dependencyMessage="این فرآیند وظیفه دارد"
                onEditStage={
                    onEditStage
                        ? () =>
                            setEditingStage(
                                stage
                            )
                        : undefined
                }
                onDeleteStage={
                    onDeleteStage
                        ? () =>
                            handleDeleteStage(
                                stage
                            )
                        : undefined
                }
            />
        );
    };

    const activeStage =
        uniqueLocalStages.find(
            ({ key }) =>
                key === activeStageKey
        ) ??
        uniqueLocalStages[0];

    const activeStageIndex =
        activeStage
            ? uniqueLocalStages.findIndex(
                ({ key }) =>
                    key ===
                    activeStage.key
            )
            : -1;

    return (
        <div className="flex flex-col gap-4 overflow-hidden">
            <div className="flex items-center justify-between gap-3">
                <div className="flex min-w-0 items-center gap-2">
                    <h3 className="truncate text-[13.5px] font-extrabold text-gray-900 dark:text-white">
                        فرآیندهای دپارتمان
                    </h3>

                    <span className="rounded-full bg-gray-100 px-2 py-0.5 text-[10.5px] font-bold text-gray-500 dark:bg-white/[0.06] dark:text-gray-400">
                        {
                            uniqueLocalStages.length
                        }
                    </span>
                </div>

                {onAddStage && (
                    <button
                        type="button"
                        onClick={
                            onAddStage
                        }
                        className="flex shrink-0 items-center gap-1.5 rounded-xl bg-indigo-50 px-3 py-1.5 text-[11.5px] font-bold text-indigo-600 transition hover:bg-indigo-100 dark:bg-indigo-500/10 dark:text-indigo-400 dark:hover:bg-indigo-500/20"
                    >
                        <Plus size={13} />

                        <span className="sm:hidden">
                            افزودن
                        </span>

                        <span className="hidden sm:inline">
                            افزودن فرآیند
                        </span>
                    </button>
                )}
            </div>

            {uniqueLocalStages.length ===
                0 ? (
                <div className="flex flex-col items-center justify-center gap-2 rounded-[1.5rem] border border-dashed border-gray-200 py-10 dark:border-white/[0.07]">
                    <p className="text-[12px] text-gray-400">
                        فرآیندی تعریف نشده است
                    </p>
                </div>
            ) : (
                <>
                    <div className="md:hidden">
                        <div className="scrollbar-none flex w-full gap-2 overflow-x-auto pb-1">
                            {uniqueLocalStages.map(
                                (
                                    {
                                        stage,
                                        key,
                                    },
                                    index
                                ) => {
                                    const isActive =
                                        key ===
                                        activeStageKey;

                                    const stageColor =
                                        stage.color ||
                                        "#6366f1";

                                    return (
                                        <button
                                            key={key}
                                            type="button"
                                            onClick={() =>
                                                setActiveStageKey(
                                                    key
                                                )
                                            }
                                            className={`flex min-w-[118px] shrink-0 items-center gap-2 rounded-2xl border px-3 py-2 text-right transition ${isActive
                                                ? "border-transparent shadow-sm"
                                                : "border-gray-200/70 bg-white/60 dark:border-white/[0.07] dark:bg-white/[0.03]"
                                                }`}
                                            style={
                                                isActive
                                                    ? {
                                                        borderColor: `${stageColor}45`,
                                                        backgroundColor: `${stageColor}12`,
                                                    }
                                                    : undefined
                                            }
                                        >
                                            <span
                                                className="flex h-6 w-6 shrink-0 items-center justify-center rounded-lg text-[10px] font-extrabold text-white"
                                                style={{
                                                    backgroundColor:
                                                        stageColor,
                                                }}
                                            >
                                                {index +
                                                    1}
                                            </span>

                                            <span
                                                className={`min-w-0 truncate text-[11px] font-extrabold ${isActive
                                                    ? "text-gray-800 dark:text-gray-100"
                                                    : "text-gray-500 dark:text-gray-400"
                                                    }`}
                                            >
                                                {
                                                    stage.name
                                                }
                                            </span>
                                        </button>
                                    );
                                }
                            )}
                        </div>

                        <div className="mt-2">
                            <AnimatePresence
                                mode="wait"
                                initial={
                                    false
                                }
                            >
                                {activeStage &&
                                    activeStageIndex >=
                                    0 && (
                                        <div
                                            key={
                                                activeStage.key
                                            }
                                        >
                                            {renderStageCard(
                                                activeStage.stage,
                                                activeStage.key,
                                                activeStageIndex,
                                                {
                                                    isMobile:
                                                        true,
                                                    showHeader:
                                                        true,
                                                    showConnector:
                                                        false,
                                                }
                                            )}
                                        </div>
                                    )}
                            </AnimatePresence>
                        </div>
                    </div>

                    <div className="hidden md:flex md:flex-col md:gap-3">
                        <Swiper
                            modules={[
                                FreeMode,
                            ]}
                            freeMode
                            slidesPerView="auto"
                            spaceBetween={26}
                            className="!w-full !overflow-visible !px-1"
                        >
                            {uniqueLocalStages.map(
                                (
                                    {
                                        stage,
                                        key,
                                    },
                                    index
                                ) => {
                                    const stageTasks =
                                        getStageTasks(
                                            stage
                                        );

                                    const hasDependencies =
                                        stageTasks.length >
                                        0;

                                    return (
                                        <SwiperSlide
                                            key={
                                                key
                                            }
                                            className="!w-[290px] shrink-0 !overflow-visible"
                                        >
                                            <StageHeader
                                                stage={
                                                    stage
                                                }
                                                index={
                                                    index
                                                }
                                                tasksCount={
                                                    stageTasks.length
                                                }
                                                isLast={
                                                    index ===
                                                    uniqueLocalStages.length -
                                                    1
                                                }
                                                hasDependencies={
                                                    hasDependencies
                                                }
                                                dependencyMessage="این فرآیند وظیفه دارد"
                                                onEdit={
                                                    onEditStage
                                                        ? () =>
                                                            setEditingStage(
                                                                stage
                                                            )
                                                        : undefined
                                                }
                                                onDelete={
                                                    onDeleteStage
                                                        ? () =>
                                                            handleDeleteStage(
                                                                stage
                                                            )
                                                        : undefined
                                                }
                                            />
                                        </SwiperSlide>
                                    );
                                }
                            )}
                        </Swiper>

                        <Swiper
                            modules={[
                                FreeMode,
                            ]}
                            freeMode
                            slidesPerView="auto"
                            spaceBetween={26}
                            className="!w-full !overflow-visible !px-1"
                        >
                            {uniqueLocalStages.map(
                                (
                                    {
                                        stage,
                                        key,
                                    },
                                    index
                                ) => (
                                    <SwiperSlide
                                        key={
                                            key
                                        }
                                        className="!w-[290px] shrink-0 !overflow-visible"
                                    >
                                        {renderStageCard(
                                            stage,
                                            key,
                                            index,
                                            {
                                                showHeader:
                                                    false,
                                                showConnector:
                                                    false,
                                            }
                                        )}
                                    </SwiperSlide>
                                )
                            )}
                        </Swiper>
                    </div>
                </>
            )}

            <EditStageModal
                open={!!editingStage}
                stage={editingStage}
                accent={
                    department.accent
                }
                onClose={() =>
                    setEditingStage(
                        null
                    )
                }
                onSubmit={async (
                    values
                ) => {
                    if (
                        !editingStage
                    ) {
                        return;
                    }

                    await handleEditStage(
                        editingStage,
                        values
                    );

                    setEditingStage(
                        null
                    );
                }}
            />
        </div>
    );
}