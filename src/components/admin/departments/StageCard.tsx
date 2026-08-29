"use client";

import {
    AnimatePresence,
    motion,
} from "framer-motion";
import {
    ChevronLeft,
    Loader,
    Pencil,
    Plus,
    Trash2,
} from "lucide-react";
import {
    useState,
} from "react";
import {
    createPortal,
} from "react-dom";
import type {
    TaskStatus,
} from "@/types/task";
import type {
    Stage,
    Task,
} from "./types";
import TaskCard from "./TaskCard";

interface StageCardProps {
    stage: Stage;
    index: number;
    isLast: boolean;
    tasks: Task[];
    tasksLoading?: boolean;
    showHeader?: boolean;
    showConnector?: boolean;
    onEditStage?: (
        stage: Stage
    ) => void;
    onDeleteStage?: (
        stage: Stage
    ) => void;
    onAddTask?: (
        stage: Stage
    ) => void;
    hasDependencies?: boolean;
    dependencyMessage?: string;
}

const STATUS_SUMMARY_CONFIG: Record<
    TaskStatus,
    {
        label: string;
        dot: string;
        text: string;
    }
> = {
    sold: {
        label: "فروش",
        dot: "bg-emerald-500",
        text: "text-emerald-600 dark:text-emerald-400",
    },
    completed: {
        label: "تکمیل",
        dot: "bg-blue-500",
        text: "text-blue-600 dark:text-blue-400",
    },
    in_progress: {
        label: "درحال انجام",
        dot: "bg-amber-500",
        text: "text-amber-600 dark:text-amber-400",
    },
    cancelled: {
        label: "لغو",
        dot: "bg-red-500",
        text: "text-red-600 dark:text-red-400",
    },
};

export default function StageCard({
    stage,
    index,
    isLast,
    tasks,
    tasksLoading = false,
    showHeader = true,
    showConnector = true,
    onEditStage,
    onDeleteStage,
    onAddTask,
    hasDependencies = false,
    dependencyMessage = "این فرآیند وابستگی دارد",
}: StageCardProps) {
    const stageColor =
        stage.color ?? "#6366f1";

    const [
        tooltipVisible,
        setTooltipVisible,
    ] = useState(false);

    const [
        tooltipPosition,
        setTooltipPosition,
    ] = useState({
        top: 0,
        left: 0,
    });

    const statusCounts =
        (tasks ?? []).reduce<
            Record<string, number>
        >(
            (acc, task) => {
                if (
                    task.status &&
                    typeof task.status ===
                        "string"
                ) {
                    acc[task.status] =
                        (acc[
                            task.status
                        ] ?? 0) + 1;
                }

                return acc;
            },
            {}
        );

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
            left:
                rect.left +
                rect.width / 2,
        });

        setTooltipVisible(true);
    };

    const hideDependencyTooltip =
        () => {
            setTooltipVisible(false);
        };

    const tooltip =
        tooltipVisible &&
        hasDependencies &&
        typeof document !==
            "undefined"
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
                                  background:
                                      "#1e293b",
                                  border:
                                      "1px solid rgba(255,255,255,0.08)",
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
            <motion.div
                layout
                initial={{
                    opacity: 0,
                    y: 10,
                }}
                animate={{
                    opacity: 1,
                    y: 0,
                }}
                exit={{
                    opacity: 0,
                    scale: 0.96,
                }}
                transition={{
                    layout: {
                        type: "spring",
                        stiffness: 300,
                        damping: 30,
                    },
                    opacity: {
                        duration: 0.2,
                    },
                }}
                className="relative flex min-w-0 flex-col rounded-[1.7rem] border border-gray-200/60 bg-white/70 dark:border-white/[0.06] dark:bg-white/[0.02]"
            >
                {showConnector &&
                    !isLast && (
                        <div
                            className="pointer-events-none absolute top-9 z-10 flex h-6 w-6 items-center justify-center rounded-full border bg-white shadow-sm dark:bg-[#0f172a]"
                            style={{
                                insetInlineEnd:
                                    "-13px",
                                borderColor: `${stageColor}40`,
                                color: stageColor,
                            }}
                        >
                            <ChevronLeft
                                size={12}
                                strokeWidth={
                                    2.5
                                }
                            />
                        </div>
                    )}

                {showHeader && (
                    <>
                        <div className="flex items-start justify-between gap-2 px-3.5 pb-3 pt-3.5 sm:px-4 sm:pb-3 sm:pt-4">
                            <div className="flex min-w-0 items-center gap-2">
                                <span
                                    className="flex h-7 w-7 shrink-0 items-center justify-center rounded-xl text-[11px] font-extrabold text-white sm:h-8 sm:w-8 sm:text-[12px]"
                                    style={{
                                        backgroundColor:
                                            stageColor,
                                    }}
                                >
                                    {index +
                                        1}
                                </span>

                                <div className="min-w-0">
                                    <h4 className="truncate text-[12px] font-extrabold text-gray-800 dark:text-gray-100 sm:text-[13px]">
                                        {
                                            stage.name
                                        }
                                    </h4>

                                    <div className="mt-0.5 flex flex-wrap items-center gap-1.5">
                                        <p className="text-[10px] font-bold text-gray-400 dark:text-gray-500 sm:text-[10.5px]">
                                            {tasks?.length ??
                                                0}{" "}
                                            وظیفه
                                        </p>

                                        {Object.entries(
                                            statusCounts
                                        ).map(
                                            ([
                                                status,
                                                count,
                                            ]) => {
                                                const config =
                                                    STATUS_SUMMARY_CONFIG[
                                                        status as TaskStatus
                                                    ];

                                                if (
                                                    !config ||
                                                    count ===
                                                        0
                                                ) {
                                                    return null;
                                                }

                                                return (
                                                    <span
                                                        key={
                                                            status
                                                        }
                                                        className={`flex items-center gap-1 text-[10px] font-bold ${config.text}`}
                                                    >
                                                        <span className="relative flex h-1.5 w-1.5">
                                                            {status ===
                                                                "in_progress" && (
                                                                <span
                                                                    className={`absolute inline-flex h-full w-full animate-ping rounded-full ${config.dot} opacity-60`}
                                                                />
                                                            )}

                                                            <span
                                                                className={`relative inline-flex h-1.5 w-1.5 rounded-full ${config.dot}`}
                                                            />
                                                        </span>

                                                        {
                                                            count
                                                        }
                                                    </span>
                                                );
                                            }
                                        )}
                                    </div>
                                </div>
                            </div>

                            <div className="flex shrink-0 items-center gap-0.5 sm:gap-1">
                                {onAddTask && (
                                    <button
                                        type="button"
                                        onClick={() =>
                                            onAddTask(
                                                stage
                                            )
                                        }
                                        className="rounded-lg p-1.5 text-gray-400 transition hover:bg-black/5 hover:text-gray-700 dark:hover:bg-white/10 dark:hover:text-white"
                                    >
                                        <Plus
                                            size={
                                                13
                                            }
                                        />
                                    </button>
                                )}

                                {onEditStage && (
                                    <button
                                        type="button"
                                        onClick={() =>
                                            onEditStage(
                                                stage
                                            )
                                        }
                                        className="rounded-lg p-1.5 transition"
                                        style={{
                                            color: stageColor,
                                            backgroundColor: `${stageColor}14`,
                                        }}
                                    >
                                        <Pencil
                                            size={
                                                13
                                            }
                                        />
                                    </button>
                                )}

                                {onDeleteStage && (
                                    <button
                                        type="button"
                                        onClick={() => {
                                            if (
                                                hasDependencies
                                            ) {
                                                return;
                                            }

                                            onDeleteStage(
                                                stage
                                            );
                                        }}
                                        onMouseEnter={
                                            showDependencyTooltip
                                        }
                                        onMouseLeave={
                                            hideDependencyTooltip
                                        }
                                        className="rounded-lg p-1.5 transition"
                                        style={{
                                            background:
                                                hasDependencies
                                                    ? "rgba(0,0,0,0.04)"
                                                    : undefined,
                                            color:
                                                hasDependencies
                                                    ? "#9ca3af"
                                                    : undefined,
                                            cursor:
                                                hasDependencies
                                                    ? "not-allowed"
                                                    : "pointer",
                                        }}
                                    >
                                        <Trash2
                                            size={
                                                13
                                            }
                                        />
                                    </button>
                                )}
                            </div>
                        </div>

                        <div className="h-px bg-gray-100 dark:bg-white/[0.05]" />
                    </>
                )}

                {tasksLoading ? (
                    <div className="flex h-32 items-center justify-center sm:h-40">
                        <Loader
                            size={18}
                            className="animate-spin text-indigo-500"
                        />
                    </div>
                ) : !tasks ||
                  tasks.length ===
                      0 ? (
                    <div className="flex h-32 flex-col items-center justify-center gap-1.5 px-4 text-center sm:h-40">
                        <p className="text-[11px] text-gray-400">
                            وظیفه‌ای در این مرحله نیست
                        </p>
                    </div>
                ) : (
                    <div className="scrollbar-thin flex max-h-[420px] flex-col gap-2 overflow-y-auto p-2.5 sm:gap-2.5 sm:p-3">
                        {tasks.map(
                            (
                                task,
                                taskIndex
                            ) => (
                                <motion.div
                                    key={
                                        task.id
                                    }
                                    initial={{
                                        opacity: 0,
                                        y: 6,
                                    }}
                                    animate={{
                                        opacity: 1,
                                        y: 0,
                                    }}
                                    transition={{
                                        delay:
                                            Math.min(
                                                taskIndex,
                                                6
                                            ) *
                                            0.03,
                                        duration: 0.2,
                                    }}
                                >
                                    <TaskCard
                                        task={
                                            task
                                        }
                                        accent={
                                            stageColor
                                        }
                                    />
                                </motion.div>
                            )
                        )}
                    </div>
                )}
            </motion.div>

            {tooltip}
        </>
    );
}