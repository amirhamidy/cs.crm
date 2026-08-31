"use client";

import { useEffect, useMemo, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { useTheme } from "next-themes";
import {
    Award,
    Ban,
    CheckCircle2,
    Crown,
    Loader2,
    ShoppingBag,
    Star,
} from "lucide-react";
import { createPortal } from "react-dom";
import axiosInstance from "@/lib/axiosInstance";

interface Props {
    items: EmployeeOverallStat[];
    loading: boolean;
}

export interface EmployeeOverallStat {
    key: string;
    full_name: string;
    sold: number;
    completed: number;
    in_progress: number;
    cancelled: number;
    total: number;
    department_key: string;
    department_name: string;
}

interface ScoreInfo {
    score: number;
    total_deducted: number;
}

interface RankedEmployee extends EmployeeOverallStat {
    score: number | null;
    total_deducted: number | null;
}

const SCORE_TIERS = [
    {
        min: 90,
        label: "عالی",
        color: "#22c55e",
        bg: "rgba(34,197,94,0.12)",
    },
    {
        min: 70,
        label: "خوب",
        color: "#3b82f6",
        bg: "rgba(59,130,246,0.12)",
    },
    {
        min: 50,
        label: "متوسط",
        color: "#f59e0b",
        bg: "rgba(245,158,11,0.12)",
    },
    {
        min: 0,
        label: "نیاز به بهبود",
        color: "#ef4444",
        bg: "rgba(239,68,68,0.12)",
    },
];

const RANK_STYLES = [
    {
        bg: "linear-gradient(135deg, #fbbf24, #f59e0b)",
        color: "#ffffff",
        shadow: "0 4px 14px rgba(245,158,11,0.35)",
    },
    {
        bg: "linear-gradient(135deg, #cbd5e1, #94a3b8)",
        color: "#ffffff",
        shadow: "0 4px 14px rgba(148,163,184,0.3)",
    },
    {
        bg: "linear-gradient(135deg, #d97706, #92400e)",
        color: "#ffffff",
        shadow: "0 4px 14px rgba(146,64,14,0.3)",
    },
];

function getTier(score: number | null) {
    if (score === null) {
        return {
            min: 0,
            label: "نامشخص",
            color: "#94a3b8",
            bg: "rgba(148,163,184,0.12)",
        };
    }

    return (
        SCORE_TIERS.find(
            (tier) => score >= tier.min,
        ) ??
        SCORE_TIERS[
        SCORE_TIERS.length - 1
        ]
    );
}

function rankEmployees(
    items: RankedEmployee[],
) {
    return [...items].sort((a, b) => {
        const aHasWork = a.total > 0;
        const bHasWork = b.total > 0;

        if (aHasWork !== bHasWork) {
            return (
                Number(bHasWork) -
                Number(aHasWork)
            );
        }

        if (!aHasWork && !bHasWork) {
            return a.full_name.localeCompare(
                b.full_name,
            );
        }

        if (a.total !== b.total) {
            return b.total - a.total;
        }

        if (a.sold !== b.sold) {
            return b.sold - a.sold;
        }

        if (a.completed !== b.completed) {
            return (
                b.completed -
                a.completed
            );
        }

        if (
            a.in_progress !==
            b.in_progress
        ) {
            return (
                b.in_progress -
                a.in_progress
            );
        }

        if (
            a.cancelled !==
            b.cancelled
        ) {
            return (
                a.cancelled -
                b.cancelled
            );
        }

        const aScore = a.score ?? -1;
        const bScore = b.score ?? -1;

        if (aScore !== bScore) {
            return bScore - aScore;
        }

        return a.full_name.localeCompare(
            b.full_name,
        );
    });
}

function EmployeeTooltip({
    employee,
    isDark,
    anchorRect,
}: {
    employee: RankedEmployee;
    isDark: boolean;
    anchorRect: DOMRect;
}) {
    const tier = getTier(employee.score);

    const rows = [
        {
            label: "فروش رفته",
            value: employee.sold,
            color: "#2dd4bf",
        },
        {
            label: "تکمیل‌شده",
            value: employee.completed,
            color: "#60a5fa",
        },
        {
            label: "در جریان",
            value: employee.in_progress,
            color: "#a5b4fc",
        },
        {
            label: "لغوشده",
            value: employee.cancelled,
            color: "#fb7185",
        },
    ];

    const tooltipWidth = 224;
    const viewportPadding = 8;

    let left =
        anchorRect.left +
        anchorRect.width / 2 -
        tooltipWidth / 2;

    left = Math.max(
        viewportPadding,
        Math.min(
            left,
            window.innerWidth -
            tooltipWidth -
            viewportPadding,
        ),
    );

    const shouldShowAbove =
        anchorRect.bottom + 170 >
        window.innerHeight;

    const top = shouldShowAbove
        ? Math.max(
            viewportPadding,
            anchorRect.top - 8,
        )
        : anchorRect.bottom + 8;

    return createPortal(
        <motion.div
            initial={{
                opacity: 0,
                y: shouldShowAbove ? -6 : 6,
                scale: 0.96,
            }}
            animate={{
                opacity: 1,
                y: 0,
                scale: 1,
            }}
            exit={{
                opacity: 0,
                y: shouldShowAbove ? -6 : 6,
                scale: 0.96,
            }}
            transition={{
                duration: 0.15,
            }}
            className="fixed z-[9999] w-56 rounded-2xl border p-3 shadow-xl"
            style={{
                left,
                top,
                transform: shouldShowAbove
                    ? "translateY(-100%)"
                    : undefined,
                background: isDark
                    ? "#0f172a"
                    : "#ffffff",
                borderColor: isDark
                    ? "rgba(255,255,255,0.08)"
                    : "rgba(0,0,0,0.07)",
            }}
        >
            <div className="mb-2 flex items-center justify-between gap-2">
                <p className="text-[11.5px] font-extrabold text-gray-800 dark:text-gray-100">
                    {employee.full_name}
                </p>

                <span
                    className="rounded-lg px-2 py-0.5 text-[10px] font-extrabold"
                    style={{
                        background: tier.bg,
                        color: tier.color,
                    }}
                >
                    {employee.score !== null
                        ? employee.score
                        : "-"}
                </span>
            </div>

            <p className="mb-2 text-[10px] text-gray-400 dark:text-gray-500">
                {employee.department_name}
            </p>

            <div className="flex flex-col gap-1.5">
                {rows.map((r) => (
                    <div
                        key={r.label}
                        className="flex items-center justify-between"
                    >
                        <div className="flex items-center gap-1.5">
                            <span
                                className="h-1.5 w-1.5 rounded-full"
                                style={{
                                    background:
                                        r.color,
                                }}
                            />

                            <span className="text-[10.5px] text-gray-500 dark:text-gray-400">
                                {r.label}
                            </span>
                        </div>

                        <span className="text-[11px] font-bold text-gray-700 dark:text-gray-200">
                            {r.value}
                        </span>
                    </div>
                ))}

                <div
                    className="mt-1 flex items-center justify-between border-t border-dashed pt-1.5"
                    style={{
                        borderColor: isDark
                            ? "rgba(255,255,255,0.08)"
                            : "rgba(0,0,0,0.07)",
                    }}
                >
                    <span className="text-[10.5px] text-gray-400 dark:text-gray-500">
                        مجموع تسک
                    </span>

                    <span className="text-[11px] font-extrabold text-indigo-400">
                        {employee.total}
                    </span>
                </div>

                {employee.total_deducted !==
                    null && (
                        <div className="flex items-center justify-between">
                            <span className="text-[10.5px] text-gray-400 dark:text-gray-500">
                                امتیاز کسرشده
                            </span>

                            <span className="text-[11px] font-extrabold text-rose-400">
                                -
                                {
                                    employee.total_deducted
                                }
                            </span>
                        </div>
                    )}
            </div>

            <div
                className="absolute left-1/2 h-2 w-2 -translate-x-1/2 rotate-45 border-l border-t"
                style={{
                    top: shouldShowAbove
                        ? "100%"
                        : "-4px",
                    background: isDark
                        ? "#0f172a"
                        : "#ffffff",
                    borderColor: isDark
                        ? "rgba(255,255,255,0.08)"
                        : "rgba(0,0,0,0.07)",
                }}
            />
        </motion.div>,
        document.body,
    );
}

function EmployeeRow({
    employee,
    rank,
    isDark,
    scoresLoading,
}: {
    employee: RankedEmployee;
    rank: number;
    isDark: boolean;
    scoresLoading: boolean;
}) {
    const [hovered, setHovered] =
        useState(false);

    const [
        anchorRect,
        setAnchorRect,
    ] = useState<DOMRect | null>(null);

    const tier = getTier(employee.score);

    const rankStyle =
        RANK_STYLES[rank] ?? null;

    const border = isDark
        ? "rgba(255,255,255,0.06)"
        : "rgba(0,0,0,0.06)";

    useEffect(() => {
        if (!hovered) {
            return;
        }

        const updatePosition = () => {
            const element =
                document.querySelector(
                    `[data-employee-key="${CSS.escape(
                        employee.key,
                    )}"]`,
                );

            if (element) {
                setAnchorRect(
                    element.getBoundingClientRect(),
                );
            }
        };

        updatePosition();

        window.addEventListener(
            "scroll",
            updatePosition,
            true,
        );

        window.addEventListener(
            "resize",
            updatePosition,
        );

        return () => {
            window.removeEventListener(
                "scroll",
                updatePosition,
                true,
            );

            window.removeEventListener(
                "resize",
                updatePosition,
            );
        };
    }, [hovered, employee.key]);

    return (
        <>
            <motion.div
                layout
                initial={{
                    opacity: 0,
                    y: 8,
                }}
                animate={{
                    opacity: 1,
                    y: 0,
                }}
                transition={{
                    duration: 0.25,
                    delay: rank * 0.02,
                }}
                data-employee-key={
                    employee.key
                }
                className="relative flex min-w-0 items-center gap-3 rounded-2xl px-3.5 py-3 transition-colors"
                style={{
                    background: hovered
                        ? isDark
                            ? "rgba(255,255,255,0.035)"
                            : "rgba(0,0,0,0.02)"
                        : "transparent",
                    border: `1px solid ${hovered
                            ? border
                            : "transparent"
                        }`,
                }}
                onMouseEnter={() => {
                    setHovered(true);

                    const rect =
                        document
                            .querySelector(
                                `[data-employee-key="${CSS.escape(
                                    employee.key,
                                )}"]`,
                            )
                            ?.getBoundingClientRect();

                    if (rect) {
                        setAnchorRect(rect);
                    }
                }}
                onMouseLeave={() => {
                    setHovered(false);
                    setAnchorRect(null);
                }}
            >
                <div
                    className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-[11px] font-extrabold"
                    style={
                        rankStyle
                            ? {
                                background:
                                    rankStyle.bg,
                                color:
                                    rankStyle.color,
                                boxShadow:
                                    rankStyle.shadow,
                            }
                            : {
                                background:
                                    isDark
                                        ? "rgba(255,255,255,0.06)"
                                        : "rgba(0,0,0,0.045)",
                                color:
                                    isDark
                                        ? "#94a3b8"
                                        : "#64748b",
                            }
                    }
                >
                    {rank < 3 ? (
                        <Crown size={13} />
                    ) : (
                        rank + 1
                    )}
                </div>

                <div
                    className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-[12.5px] font-extrabold"
                    style={{
                        background: `${tier.color}18`,
                        color: tier.color,
                    }}
                >
                    {employee.full_name.charAt(
                        0,
                    ) || "؟"}
                </div>

                <div className="min-w-0 flex-1">
                    <p className="truncate text-[12.5px] font-bold text-gray-800 dark:text-gray-100">
                        {employee.full_name}
                    </p>

                    <p className="truncate text-[10.5px] text-gray-400 dark:text-gray-500">
                        {employee.department_name}
                    </p>
                </div>

                <div
                    className="flex h-8 min-w-[46px] shrink-0 items-center justify-center rounded-xl px-2.5 text-[11.5px] font-extrabold"
                    style={{
                        background: tier.bg,
                        color: tier.color,
                    }}
                >
                    {scoresLoading ? (
                        <Loader2
                            size={12}
                            className="animate-spin"
                        />
                    ) : employee.score !==
                        null ? (
                        employee.score
                    ) : (
                        "-"
                    )}
                </div>
            </motion.div>

            <AnimatePresence>
                {hovered &&
                    anchorRect && (
                        <EmployeeTooltip
                            employee={
                                employee
                            }
                            isDark={
                                isDark
                            }
                            anchorRect={
                                anchorRect
                            }
                        />
                    )}
            </AnimatePresence>
        </>
    );
}

function BestEmployeesChartSkeleton() {
    return (
        <div className="rounded-2xl border border-gray-200 bg-white p-4 dark:border-white/8 dark:bg-slate-950">
            <div
                className="mb-3 flex items-start justify-between gap-3"
                dir="rtl"
            >
                <div className="space-y-2">
                    <div className="h-4 w-40 animate-pulse rounded-full bg-gray-100 dark:bg-slate-900" />
                    <div className="h-3 w-28 animate-pulse rounded-full bg-gray-100/80 dark:bg-slate-900/60" />
                </div>
            </div>

            <div className="flex flex-col gap-2.5">
                {[1, 2, 3, 4, 5].map(
                    (i) => (
                        <div
                            key={i}
                            className="h-12 animate-pulse rounded-2xl bg-gray-100 dark:bg-slate-900"
                        />
                    ),
                )}
            </div>
        </div>
    );
}

export default function BestEmployeesChart({
    items,
    loading,
}: Props) {
    const { resolvedTheme } =
        useTheme();

    const isDark =
        resolvedTheme === "dark";

    const [scores, setScores] =
        useState<
            Record<string, ScoreInfo>
        >({});

    const [
        scoresLoading,
        setScoresLoading,
    ] = useState(true);

    const safeItems = Array.isArray(
        items,
    )
        ? items
        : [];

    useEffect(() => {
        if (safeItems.length === 0) {
            setScores({});
            setScoresLoading(false);
            return;
        }

        let cancelled = false;

        setScoresLoading(true);

        const targets = safeItems
            .map((item) => ({
                key: item.key,
                id: Number(item.key),
            }))
            .filter((entry) =>
                Number.isFinite(
                    entry.id,
                ),
            );

        Promise.allSettled(
            targets.map((entry) =>
                axiosInstance
                    .get<ScoreInfo>(
                        `/score/api/v1/employees/${entry.id}/`,
                    )
                    .then((res) => ({
                        key: entry.key,
                        data: res.data,
                    })),
            ),
        ).then((results) => {
            if (cancelled) {
                return;
            }

            const map: Record<
                string,
                ScoreInfo
            > = {};

            results.forEach(
                (result) => {
                    if (
                        result.status ===
                        "fulfilled"
                    ) {
                        map[
                            result.value
                                .key
                        ] =
                            result.value.data;
                    }
                },
            );

            setScores(map);
            setScoresLoading(false);
        });

        return () => {
            cancelled = true;
        };
    }, [safeItems]);

    const ranked = useMemo<
        RankedEmployee[]
    >(() => {
        const merged =
            safeItems.map(
                (item) => ({
                    ...item,
                    score:
                        scores[
                            item.key
                        ]?.score ??
                        null,
                    total_deducted:
                        scores[
                            item.key
                        ]
                            ?.total_deducted ??
                        null,
                }),
            );

        return rankEmployees(
            merged,
        );
    }, [
        safeItems,
        scores,
    ]);

    if (loading) {
        return (
            <BestEmployeesChartSkeleton />
        );
    }

    return (
        <motion.div
            initial={{
                opacity: 0,
                y: 6,
            }}
            animate={{
                opacity: 1,
                y: 0,
            }}
            transition={{
                duration: 0.3,
                ease: [
                    0.25,
                    0.46,
                    0.45,
                    0.94,
                ],
            }}
            className="rounded-2xl border border-gray-200 bg-white p-4 shadow-sm dark:border-white/8 dark:bg-slate-950"
        >
            <div
                className="mb-3 flex items-start justify-between gap-3"
                dir="rtl"
            >
                <div className="flex items-center gap-2.5">
                    <div
                        className="flex h-8 w-8 items-center justify-center rounded-xl"
                        style={{
                            background:
                                isDark
                                    ? "rgba(16,185,129,0.12)"
                                    : "rgba(16,185,129,0.08)",
                        }}
                    >
                        <Award
                            size={15}
                            className="text-emerald-500"
                        />
                    </div>

                    <div>
                        <h3 className="text-[14px] font-semibold text-gray-900 dark:text-white">
                            رتبه‌بندی عملکرد کارمندان
                        </h3>

                        <p className="mt-0.5 text-[12px] text-gray-500 dark:text-gray-400">
                            کمترین لغو، بیشترین فروش و بالاترین امتیاز
                        </p>
                    </div>
                </div>

                {!scoresLoading && (
                    <div className="flex items-center gap-1 rounded-xl bg-yellow-50 px-2.5 py-1.5 text-[10.5px] font-bold text-yellow-600 dark:bg-yellow-500/10 dark:text-yellow-400">
                        <Star
                            size={11}
                            fill="#eab308"
                            color="#eab308"
                            strokeWidth={0}
                        />

                        {
                            ranked.length
                        }{" "}
                        کارمند
                    </div>
                )}
            </div>

            {ranked.length ===
                0 ? (
                <div className="flex h-32 items-center justify-center text-[12px] text-gray-400">
                    داده‌ای در این بازه وجود ندارد
                </div>
            ) : (
                <div
                    dir="rtl"
                    className="scrollbar-thin scrollbar-track-transparent scrollbar-thumb-white/10 grid max-h-[400px] grid-cols-2 gap-1.5 overflow-y-auto pr-1"
                >
                    {ranked.map(
                        (
                            employee,
                            index,
                        ) => (
                            <EmployeeRow
                                key={
                                    employee.key
                                }
                                employee={
                                    employee
                                }
                                rank={
                                    index
                                }
                                isDark={
                                    isDark
                                }
                                scoresLoading={
                                    scoresLoading
                                }
                            />
                        ),
                    )}
                </div>
            )}
        </motion.div>
    );
}
