"use client";

import { useEffect, useMemo, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { useTheme } from "next-themes";
import {
    AlertTriangle,
    Ban,
    CheckCircle2,
    Loader2,
    TrendingDown,
} from "lucide-react";
import axiosInstance from "@/lib/axiosInstance";

export interface WeakestEmployeeItem {
    key: string;
    full_name: string;
    total: number;
    cancelled: number;
    completed?: number;
    sold?: number;
    score?: number | null;
}

interface Props {
    items: WeakestEmployeeItem[];
    loading: boolean;
}

interface ScoreInfo {
    score: number;
    total_deducted: number;
}

interface RankedEmployee extends WeakestEmployeeItem {
    score: number | null;
    total_deducted: number | null;
}

const MAUVE_SCALE = [
    {
        color: "#f43f5e",
        glow: "rgba(244,63,94,0.5)",
        soft: "rgba(244,63,94,0.16)",
    },
    {
        color: "#ec4899",
        glow: "rgba(236,72,153,0.48)",
        soft: "rgba(236,72,153,0.16)",
    },
    {
        color: "#d946ef",
        glow: "rgba(217,70,239,0.46)",
        soft: "rgba(217,70,239,0.16)",
    },
    {
        color: "#a855f7",
        glow: "rgba(168,85,247,0.46)",
        soft: "rgba(168,85,247,0.16)",
    },
    {
        color: "#e11d48",
        glow: "rgba(225,29,72,0.46)",
        soft: "rgba(225,29,72,0.16)",
    },
    {
        color: "#c026d3",
        glow: "rgba(192,38,211,0.46)",
        soft: "rgba(192,38,211,0.16)",
    },
];

function WeakestEmployeesChartSkeleton() {
    return (
        <div className="rounded-2xl border border-gray-200 bg-white p-4 dark:border-white/8 dark:bg-slate-950">
            <div className="mb-3 space-y-2" dir="rtl">
                <div className="h-4 w-40 animate-pulse rounded-full bg-gray-100 dark:bg-slate-900" />
                <div className="h-3 w-24 animate-pulse rounded-full bg-gray-100/80 dark:bg-slate-900/60" />
            </div>

            <div className="grid grid-cols-2 gap-2">
                {[1, 2, 3, 4, 5, 6].map((i) => (
                    <div
                        key={i}
                        className="h-[118px] animate-pulse rounded-2xl bg-gray-100 dark:bg-slate-900"
                    />
                ))}
            </div>
        </div>
    );
}

function getScoreColor(score: number | null) {
    if (score === null) return "#94a3b8";
    if (score >= 90) return "#16a34a";
    if (score >= 70) return "#2563eb";
    if (score >= 50) return "#d97706";
    return "#dc2626";
}

function getScoreLabel(score: number | null) {
    if (score === null) return "بدون امتیاز";
    if (score >= 90) return "عالی";
    if (score >= 70) return "خوب";
    if (score >= 50) return "متوسط";
    return "ضعیف";
}

export default function WeakestEmployeesChart({
    items,
    loading,
}: Props) {
    const { resolvedTheme } = useTheme();
    const isDark = resolvedTheme === "dark";

    const [scores, setScores] = useState<
        Record<string, ScoreInfo>
    >({});

    const [scoresLoading, setScoresLoading] =
        useState(true);

    const safeItems = Array.isArray(items)
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
            .filter((item) =>
                Number.isFinite(item.id),
            );

        Promise.allSettled(
            targets.map((item) =>
                axiosInstance
                    .get<ScoreInfo>(
                        `/score/api/v1/employees/${item.id}/`,
                    )
                    .then((res) => ({
                        key: item.key,
                        data: res.data,
                    })),
            ),
        ).then((results) => {
            if (cancelled) return;

            const map: Record<
                string,
                ScoreInfo
            > = {};

            results.forEach((result) => {
                if (
                    result.status ===
                    "fulfilled"
                ) {
                    map[
                        result.value.key
                    ] = result.value.data;
                }
            });

            setScores(map);
            setScoresLoading(false);
        });

        return () => {
            cancelled = true;
        };
    }, [safeItems]);

    const ranked = useMemo<RankedEmployee[]>(() => {
        const merged = safeItems.map((item) => ({
            ...item,
            score:
                item.score ??
                scores[item.key]?.score ??
                null,
            total_deducted:
                scores[item.key]
                    ?.total_deducted ??
                null,
        }));

        return [...merged]
            .sort((a, b) => {
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

                if (
                    a.cancelled !==
                    b.cancelled
                ) {
                    return (
                        b.cancelled -
                        a.cancelled
                    );
                }

                const aScore =
                    a.score ?? Infinity;
                const bScore =
                    b.score ?? Infinity;

                if (aScore !== bScore) {
                    return (
                        aScore -
                        bScore
                    );
                }

                const aDone =
                    (a.completed ?? 0) +
                    (a.sold ?? 0);

                const bDone =
                    (b.completed ?? 0) +
                    (b.sold ?? 0);

                if (aDone !== bDone) {
                    return (
                        aDone -
                        bDone
                    );
                }

                if (a.total !== b.total) {
                    return (
                        a.total -
                        b.total
                    );
                }

                return a.full_name.localeCompare(
                    b.full_name,
                );
            })
            .slice(0, 6);
    }, [safeItems, scores]);

    if (loading) {
        return (
            <WeakestEmployeesChartSkeleton />
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
            className="relative overflow-hidden rounded-2xl border p-4 shadow-sm"
            style={{
                borderColor: isDark
                    ? "rgba(244,63,94,0.18)"
                    : "rgba(244,63,94,0.16)",
                background: isDark
                    ? "linear-gradient(160deg, rgba(244,63,94,0.075), rgba(217,70,239,0.035) 45%, rgba(15,23,42,0))"
                    : "linear-gradient(160deg, rgba(244,63,94,0.065), rgba(217,70,239,0.025) 45%, #ffffff)",
            }}
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
                                "linear-gradient(135deg, rgba(244,63,94,0.24), rgba(217,70,239,0.22))",
                            boxShadow:
                                "0 4px 14px rgba(244,63,94,0.12)",
                        }}
                    >
                        <TrendingDown
                            size={15}
                            className="text-rose-500"
                        />
                    </div>

                    <div>
                        <h3 className="text-[14px] font-semibold text-gray-900 dark:text-white">
                            ضعیف‌ترین عملکرد
                        </h3>

                        <p className="mt-0.5 text-[12px] text-gray-500 dark:text-gray-400">
                            بیشترین لغو و کمترین امتیاز
                        </p>
                    </div>
                </div>

                {!scoresLoading &&
                    ranked.length > 0 && (
                        <div className="rounded-xl border border-rose-200 bg-rose-100 px-2.5 py-1.5 text-[10.5px] font-bold text-rose-600 dark:border-rose-400/20 dark:bg-rose-500/15 dark:text-rose-300">
                            {ranked.length.toLocaleString(
                                "fa-IR",
                            )}{" "}
                            نفر
                        </div>
                    )}
            </div>

            {ranked.length === 0 ? (
                <div className="flex h-[220px] items-center justify-center text-xs text-gray-400">
                    داده‌ای در این بازه وجود ندارد
                </div>
            ) : (
                <div
                    dir="rtl"
                    className="grid max-h-[300px] grid-cols-2 gap-2 overflow-y-auto pr-1"
                >
                    <AnimatePresence mode="popLayout">
                        {ranked.map(
                            (
                                employee,
                                index,
                            ) => {
                                const meta =
                                    MAUVE_SCALE[
                                    index %
                                    MAUVE_SCALE.length
                                    ];

                                const scoreColor =
                                    getScoreColor(
                                        employee.score,
                                    );

                                const scoreLabel =
                                    getScoreLabel(
                                        employee.score,
                                    );

                                const done =
                                    (employee.completed ??
                                        0) +
                                    (employee.sold ??
                                        0);

                                const cancelRate =
                                    employee.total >
                                        0
                                        ? Math.round(
                                            (employee.cancelled /
                                                employee.total) *
                                            100,
                                        )
                                        : 0;

                                return (
                                    <motion.div
                                        key={
                                            employee.key
                                        }
                                        layout
                                        initial={{
                                            opacity: 0,
                                            y: 8,
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
                                            duration:
                                                0.22,
                                            delay:
                                                index *
                                                0.025,
                                        }}
                                        className="group relative overflow-hidden rounded-2xl border p-3 transition-all duration-200"
                                        style={{
                                            borderColor:
                                                isDark
                                                    ? `${meta.color}35`
                                                    : `${meta.color}30`,
                                            background:
                                                isDark
                                                    ? `linear-gradient(145deg, ${meta.color}12, rgba(15,23,42,0.9))`
                                                    : `linear-gradient(145deg, ${meta.color}0c, #ffffff)`,
                                            boxShadow:
                                                isDark
                                                    ? `inset 0 1px 0 ${meta.color}12`
                                                    : `inset 0 1px 0 rgba(255,255,255,0.8)`,
                                        }}
                                    >
                                        <div
                                            className="absolute inset-x-0 top-0 h-[2px]"
                                            style={{
                                                background:
                                                    `linear-gradient(90deg, transparent, ${meta.color}, transparent)`,
                                                boxShadow:
                                                    `0 0 12px ${meta.glow}`,
                                            }}
                                        />

                                        <div className="flex items-center gap-2">
                                            <div
                                                className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl text-[10px] font-black"
                                                style={{
                                                    background:
                                                        meta.color,
                                                    color:
                                                        "#ffffff",
                                                    boxShadow:
                                                        `0 3px 10px ${meta.glow}`,
                                                }}
                                            >
                                                {index +
                                                    1}
                                            </div>

                                            <div className="min-w-0 flex-1">
                                                <p className="truncate text-[11.5px] font-extrabold text-gray-800 dark:text-gray-100">
                                                    {
                                                        employee.full_name
                                                    }
                                                </p>

                                                <p
                                                    className="mt-0.5 text-[9.5px] font-bold"
                                                    style={{
                                                        color:
                                                            scoreColor,
                                                    }}
                                                >
                                                    {
                                                        scoreLabel
                                                    }
                                                </p>
                                            </div>

                                            <div
                                                className="flex h-8 min-w-[42px] shrink-0 items-center justify-center rounded-xl border text-[11px] font-black"
                                                style={{
                                                    color:
                                                        scoreColor,
                                                    background:
                                                        isDark
                                                            ? `${scoreColor}18`
                                                            : `${scoreColor}12`,
                                                    borderColor:
                                                        `${scoreColor}35`,
                                                }}
                                            >
                                                {scoresLoading ? (
                                                    <Loader2
                                                        size={
                                                            12
                                                        }
                                                        className="animate-spin"
                                                    />
                                                ) : employee.score !==
                                                    null ? (
                                                    employee.score.toLocaleString(
                                                        "fa-IR",
                                                    )
                                                ) : (
                                                    "-"
                                                )}
                                            </div>
                                        </div>

                                        <div className="mt-3 grid grid-cols-3 gap-1.5">
                                            <div
                                                className="rounded-xl border px-1.5 py-2 text-center"
                                                style={{
                                                    background:
                                                        isDark
                                                            ? "rgba(244,63,94,0.13)"
                                                            : "rgba(244,63,94,0.08)",
                                                    borderColor:
                                                        isDark
                                                            ? "rgba(244,63,94,0.2)"
                                                            : "rgba(244,63,94,0.16)",
                                                }}
                                            >
                                                <div className="mb-1 flex items-center justify-center gap-1">
                                                    <Ban
                                                        size={
                                                            10
                                                        }
                                                        className="text-rose-500"
                                                    />

                                                    <span className="text-[9px] font-semibold text-gray-500 dark:text-gray-400">
                                                        لغو
                                                    </span>
                                                </div>

                                                <span className="text-[11px] font-black text-rose-500">
                                                    {employee.cancelled.toLocaleString(
                                                        "fa-IR",
                                                    )}
                                                </span>
                                            </div>

                                            <div
                                                className="rounded-xl border px-1.5 py-2 text-center"
                                                style={{
                                                    background:
                                                        isDark
                                                            ? "rgba(59,130,246,0.13)"
                                                            : "rgba(59,130,246,0.08)",
                                                    borderColor:
                                                        isDark
                                                            ? "rgba(59,130,246,0.2)"
                                                            : "rgba(59,130,246,0.16)",
                                                }}
                                            >
                                                <div className="mb-1 flex items-center justify-center gap-1">
                                                    <CheckCircle2
                                                        size={
                                                            10
                                                        }
                                                        className="text-blue-500"
                                                    />

                                                    <span className="text-[9px] font-semibold text-gray-500 dark:text-gray-400">
                                                        انجام
                                                    </span>
                                                </div>

                                                <span className="text-[11px] font-black text-blue-500">
                                                    {done.toLocaleString(
                                                        "fa-IR",
                                                    )}
                                                </span>
                                            </div>

                                            <div
                                                className="rounded-xl border px-1.5 py-2 text-center"
                                                style={{
                                                    background:
                                                        isDark
                                                            ? "rgba(217,70,239,0.13)"
                                                            : "rgba(217,70,239,0.08)",
                                                    borderColor:
                                                        isDark
                                                            ? "rgba(217,70,239,0.2)"
                                                            : "rgba(217,70,239,0.16)",
                                                }}
                                            >
                                                <div className="mb-1 flex items-center justify-center gap-1">
                                                    <AlertTriangle
                                                        size={
                                                            10
                                                        }
                                                        className="text-fuchsia-500"
                                                    />

                                                    <span className="text-[9px] font-semibold text-gray-500 dark:text-gray-400">
                                                        نرخ لغو
                                                    </span>
                                                </div>

                                                <span className="text-[11px] font-black text-fuchsia-500">
                                                    {cancelRate.toLocaleString(
                                                        "fa-IR",
                                                    )}
                                                    ٪
                                                </span>
                                            </div>
                                        </div>

                                        <div className="mt-2 flex items-center justify-between">
                                            <span className="text-[9.5px] font-medium text-gray-400 dark:text-gray-500">
                                                مجموع تسک
                                            </span>

                                            <span
                                                className="text-[10px] font-black"
                                                style={{
                                                    color:
                                                        meta.color,
                                                }}
                                            >
                                                {employee.total.toLocaleString(
                                                    "fa-IR",
                                                )}
                                            </span>
                                        </div>
                                    </motion.div>
                                );
                            },
                        )}
                    </AnimatePresence>
                </div>
            )}
        </motion.div>
    );
}
