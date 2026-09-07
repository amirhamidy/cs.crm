"use client";

import {
    useCallback,
    useEffect,
    useMemo,
    useRef,
    useState,
} from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Plus } from "lucide-react";
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

    const [localStages, setLocalStages] = useState<Stage[]>(
        () =>
            [...(department.stages || [])].sort(
                (a, b) => a.order - b.order
            )
    );

    const prevServerStagesRef = useRef<Stage[]>(
        department.stages || []
    );

    const keyMapRef = useRef(
        new WeakMap<Stage, string>()
    );

    const keyCounterRef = useRef(0);

    useEffect(() => {
        const nextStages = department.stages || [];

        const prevIds = prevServerStagesRef.current
            .map((stage) => stage.id)
            .sort()
            .join(",");

        const nextIds = nextStages
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
                    (a, b) => a.order - b.order
                )
            );
        }

        prevServerStagesRef.current = nextStages;
    }, [department.stages]);

    const getStageKey = useCallback(
        (stage: Stage) => {
            if (
                stage.id !== undefined &&
                stage.id !== null
            ) {
                return String(stage.id);
            }

            let key = keyMapRef.current.get(stage);

            if (!key) {
                key = `temp-${keyCounterRef.current++}`;
                keyMapRef.current.set(stage, key);
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
            const key = getStageKey(stage);

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
        if (uniqueLocalStages.length === 0) {
            setActiveStageKey(null);
            return;
        }

        const activeStageExists =
            uniqueLocalStages.some(
                ({ key }) => key === activeStageKey
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

            const oldOrder = targetStage.order;
            const newOrder = values.order;

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
                        stage.id !== targetStage.id &&
                        stage.order === newOrder
                );

            const snapshot = [...localStages];

            setLocalStages((previousStages) => {
                const updatedStages =
                    previousStages.map((stage) => {
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
                    });

                return [...updatedStages].sort(
                    (firstStage, secondStage) =>
                        firstStage.order -
                        secondStage.order
                );
            });

            try {
                if (conflictingStage) {
                    await onEditStage(
                        conflictingStage,
                        {
                            name: conflictingStage.name,
                            description:
                                conflictingStage.description ??
                                "",
                            order: oldOrder,
                        }
                    );
                }

                await onEditStage(
                    targetStage,
                    values
                );
            } catch (error) {
                setLocalStages(snapshot);
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

    const handleDeleteStage = useCallback(
        (stage: Stage) => {
            if (!onDeleteStage) {
                return;
            }

            const stageTasks =
                getStageTasks(stage);

            if (stageTasks.length > 0) {
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
        isMobile = false
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
                    isMobile ||
                    index ===
                    uniqueLocalStages.length - 1
                }
                tasks={stageTasks}
                tasksLoading={tasksLoading}
                showHeader
                showConnector={!isMobile}
                hasDependencies={hasDependencies}
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

    const activeStageIndex = activeStage
        ? uniqueLocalStages.findIndex(
            ({ key }) =>
                key === activeStage.key
        )
        : -1;

    return (
        <div
            className="flex flex-col gap-3.5 p-4"
            dir="rtl"
        >
            <div className="flex items-center justify-between gap-3">
                <div className="flex min-w-0 items-center gap-2">
                    <div>
                        <h3 className="text-[13px] font-extrabold text-gray-900 dark:text-white">
                            فرآیندهای دپارتمان
                        </h3>

                        <p className="mt-0.5 text-[9.5px] font-medium text-gray-400 dark:text-gray-500">
                            مراحل و وظایف فعال
                        </p>
                    </div>

                    <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-gray-100 px-1.5 text-[9px] font-extrabold text-gray-500 dark:bg-white/[0.06] dark:text-gray-400">
                        {uniqueLocalStages.length}
                    </span>
                </div>

                {onAddStage && (
                    <button
                        type="button"
                        onClick={onAddStage}
                        className="flex h-7 shrink-0 items-center gap-1.5 rounded-xl px-2.5 text-[10.5px] font-extrabold transition-all active:scale-95"
                        style={{
                            background:
                                "rgba(99,102,241,0.10)",
                            color: "#6366f1",
                            border:
                                "1px solid rgba(99,102,241,0.18)",
                        }}
                    >
                        <Plus
                            size={11}
                            strokeWidth={2.7}
                        />
                        <span className="hidden sm:inline">
                            افزودن فرآیند
                        </span>
                        <span className="sm:hidden">
                            افزودن
                        </span>
                    </button>
                )}
            </div>

            {uniqueLocalStages.length === 0 ? (
                <div className="flex flex-col items-center justify-center gap-2 rounded-[1.4rem] border border-dashed border-gray-200 py-10 dark:border-white/[0.07]">
                    <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gray-100 dark:bg-white/[0.05]">
                        <Plus
                            size={15}
                            className="text-gray-400"
                        />
                    </div>

                    <p className="text-[11px] font-medium text-gray-400">
                        فرآیندی تعریف نشده است
                    </p>
                </div>
            ) : (
                <>
                    <div className="md:hidden">
                        <div className="scrollbar-none flex w-full gap-1.5 overflow-x-auto pb-1">
                            {uniqueLocalStages.map(
                                (
                                    { stage, key },
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
                                            className={`flex min-w-[112px] shrink-0 items-center gap-1.5 rounded-xl border px-2.5 py-1.5 text-right transition-all ${isActive
                                                    ? "shadow-sm"
                                                    : "border-gray-200/70 bg-white/60 dark:border-white/[0.07] dark:bg-white/[0.03]"
                                                }`}
                                            style={
                                                isActive
                                                    ? {
                                                        borderColor: `${stageColor}35`,
                                                        backgroundColor: `${stageColor}10`,
                                                    }
                                                    : undefined
                                            }
                                        >
                                            <span
                                                className="flex h-5 w-5 shrink-0 items-center justify-center rounded-md text-[9px] font-extrabold text-white"
                                                style={{
                                                    backgroundColor:
                                                        stageColor,
                                                }}
                                            >
                                                {index + 1}
                                            </span>

                                            <span
                                                className={`min-w-0 truncate text-[10px] font-extrabold ${isActive
                                                        ? "text-gray-800 dark:text-gray-100"
                                                        : "text-gray-500 dark:text-gray-400"
                                                    }`}
                                            >
                                                {stage.name}
                                            </span>
                                        </button>
                                    );
                                }
                            )}
                        </div>

                        <div className="mt-2">
                            <AnimatePresence
                                mode="wait"
                                initial={false}
                            >
                                {activeStage &&
                                    activeStageIndex >=
                                    0 && (
                                        <motion.div
                                            key={
                                                activeStage.key
                                            }
                                            initial={{
                                                opacity: 0,
                                                y: 5,
                                            }}
                                            animate={{
                                                opacity: 1,
                                                y: 0,
                                            }}
                                            exit={{
                                                opacity: 0,
                                                y: -5,
                                            }}
                                            transition={{
                                                duration: 0.18,
                                            }}
                                        >
                                            {renderStageCard(
                                                activeStage.stage,
                                                activeStage.key,
                                                activeStageIndex,
                                                true
                                            )}
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
                            {uniqueLocalStages.map(
                                (
                                    { stage, key },
                                    index
                                ) => (
                                    <SwiperSlide
                                        key={key}
                                        className="!w-[290px] shrink-0 !overflow-visible"
                                    >
                                        {renderStageCard(
                                            stage,
                                            key,
                                            index
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
                accent={department.accent}
                onClose={() =>
                    setEditingStage(null)
                }
                onSubmit={async (values) => {
                    if (!editingStage) {
                        return;
                    }

                    await handleEditStage(
                        editingStage,
                        values
                    );

                    setEditingStage(null);
                }}
            />
        </div>
    );
}