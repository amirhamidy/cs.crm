"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Award, Star, TrendingDown } from "lucide-react";
import { useTheme } from "next-themes";
import axiosInstance from "@/lib/axiosInstance";
import { useCurrentEmployee } from "@/hooks/usecurrentemployee";

interface ScoreData {
    employee: number;
    score: number;
    total_deducted: number;
}

interface ScoreHistory {
    id: number;
    employee: number;
    task: number;
    department_step: number;
    amount: number;
    reason: string;
    overdue_period: number;
    created_at: string;
}

interface ScoreCardProps {
    employeeName?: string;
}

const SCORE_TIERS = [
    {
        min: 90,
        label: "عالی",
        color: "#22c55e",
        bg: "rgba(34,197,94,0.1)",
    },
    {
        min: 70,
        label: "خوب",
        color: "#3b82f6",
        bg: "rgba(59,130,246,0.1)",
    },
    {
        min: 50,
        label: "متوسط",
        color: "#f59e0b",
        bg: "rgba(245,158,11,0.1)",
    },
    {
        min: 0,
        label: "نیاز به بهبود",
        color: "#ef4444",
        bg: "rgba(239,68,68,0.1)",
    },
];

function getTier(score: number) {
    return (
        SCORE_TIERS.find((tier) => score >= tier.min) ??
        SCORE_TIERS[SCORE_TIERS.length - 1]
    );
}

function formatDate(date: string) {
    try {
        return new Intl.DateTimeFormat("fa-IR", {
            year: "numeric",
            month: "short",
            day: "numeric",
            hour: "2-digit",
            minute: "2-digit",
        }).format(new Date(date));
    } catch {
        return "";
    }
}

export default function ScoreCard({ employeeName }: ScoreCardProps) {
    const { resolvedTheme } = useTheme();
    const isDark = resolvedTheme === "dark";

    const {
        employee,
        loading: employeeLoading,
        error: employeeError,
    } = useCurrentEmployee();

    const [data, setData] = useState<ScoreData | null>(null);
    const [history, setHistory] = useState<ScoreHistory[]>([]);
    const [loading, setLoading] = useState(true);
    const [historyLoading, setHistoryLoading] = useState(true);
    const [error, setError] = useState(false);

    useEffect(() => {
        let alive = true;

        if (employeeLoading) {
            setLoading(true);
            return () => {
                alive = false;
            };
        }

        if (!employee?.id) {
            setData(null);
            setHistory([]);
            setLoading(false);
            setHistoryLoading(false);
            setError(true);

            return () => {
                alive = false;
            };
        }

        const employeeId = Number(employee.id);

        const scorePath = `/score/api/v1/employees/${employeeId}/`;
        const historyPath = `/score/api/v1/employees/${employeeId}/history/`;

        console.log("SCORE REQUEST:", {
            employeeId,
            scorePath,
            historyPath,
        });

        setLoading(true);
        setHistoryLoading(true);
        setError(false);

        axiosInstance
            .get<ScoreData>(scorePath)
            .then((response) => {
                if (!alive) return;

                console.log("SCORE SUCCESS:", response.data);

                setData(response.data);
                setError(false);
            })
            .catch((err) => {
                if (!alive) return;

                console.error("SCORE ERROR:", {
                    employeeId,
                    path: scorePath,
                    status: err?.response?.status,
                    data: err?.response?.data,
                    url: err?.config?.url,
                    baseURL: err?.config?.baseURL,
                    message: err?.message,
                });

                setData(null);
                setError(true);
            })
            .finally(() => {
                if (!alive) return;

                setLoading(false);
            });

        axiosInstance
            .get<ScoreHistory[]>(historyPath)
            .then((response) => {
                if (!alive) return;

                console.log("SCORE HISTORY SUCCESS:", response.data);

                setHistory(
                    Array.isArray(response.data)
                        ? response.data
                        : []
                );
            })
            .catch((err) => {
                if (!alive) return;

                console.error("SCORE HISTORY ERROR:", {
                    employeeId,
                    path: historyPath,
                    status: err?.response?.status,
                    data: err?.response?.data,
                    url: err?.config?.url,
                    baseURL: err?.config?.baseURL,
                    message: err?.message,
                });

                setHistory([]);
            })
            .finally(() => {
                if (!alive) return;

                setHistoryLoading(false);
            });

        return () => {
            alive = false;
        };
    }, [employee, employeeLoading]);

    const border = isDark
        ? "rgba(255,255,255,0.06)"
        : "rgba(0,0,0,0.06)";

    const surface = isDark
        ? "rgba(255,255,255,0.02)"
        : "#fafafa";

    const displayName =
        employeeName ||
        employee?.full_name ||
        employee?.username ||
        "";

    return (
        <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.25 }}
            className="relative flex flex-col gap-4 overflow-hidden rounded-2xl p-5"
            style={{
                border: `1px solid ${border}`,
                background: surface,
            }}
            dir="rtl"
        >
            <div className="flex items-center justify-between">
                <div className="flex min-w-0 flex-col gap-0.5">
                    <p className="text-[13px] font-extrabold text-gray-800 dark:text-gray-100">
                        امتیاز عملکرد
                    </p>

                    {displayName && (
                        <p className="text-[11.5px] text-gray-400 dark:text-gray-500">
                            {displayName}
                        </p>
                    )}
                </div>

                <div
                    className="flex h-9 w-9 items-center justify-center rounded-2xl"
                    style={{
                        background: isDark
                            ? "rgba(234,179,8,0.12)"
                            : "rgba(234,179,8,0.08)",
                    }}
                >
                    <Star
                        size={16}
                        fill="#facc15"
                        color="#facc15"
                        strokeWidth={0}
                    />
                </div>
            </div>

            {employeeLoading || loading ? (
                <div className="flex h-20 items-center justify-center">
                    <motion.div
                        animate={{ rotate: 360 }}
                        transition={{
                            repeat: Infinity,
                            duration: 1,
                            ease: "linear",
                        }}
                        className="h-5 w-5 rounded-full border-2 border-transparent"
                        style={{
                            borderTopColor: isDark
                                ? "#a5b4fc"
                                : "#6366f1",
                            borderRightColor: isDark
                                ? "rgba(165,180,252,0.3)"
                                : "rgba(99,102,241,0.2)",
                        }}
                    />
                </div>
            ) : employeeError || error || !data ? (
                <div className="flex h-20 items-center justify-center">
                    <p className="text-[12px] text-red-400">
                        خطا در دریافت امتیاز
                    </p>
                </div>
            ) : (
                <ScoreBody
                    data={data}
                    history={history}
                    historyLoading={historyLoading}
                    isDark={isDark}
                />
            )}
        </motion.div>
    );
}

function ScoreBody({
    data,
    history,
    historyLoading,
    isDark,
}: {
    data: ScoreData;
    history: ScoreHistory[];
    historyLoading: boolean;
    isDark: boolean;
}) {
    const tier = getTier(data.score);
    const pct = Math.min(100, Math.max(0, data.score));

    return (
        <div className="flex flex-col gap-4">
            <div className="flex items-end gap-3">
                <motion.span
                    initial={{
                        opacity: 0,
                        scale: 0.8,
                    }}
                    animate={{
                        opacity: 1,
                        scale: 1,
                    }}
                    transition={{
                        duration: 0.35,
                        ease: "easeOut",
                    }}
                    className="text-[22px] font-black leading-none tracking-tight"
                    style={{
                        color: tier.color,
                    }}
                >
                    {data.score}
                </motion.span>

                <div className="flex flex-col gap-1 pb-1">
                    <span
                        className="rounded-lg px-2 py-0.5 text-[11px] font-bold"
                        style={{
                            background: tier.bg,
                            color: tier.color,
                        }}
                    >
                        {tier.label}
                    </span>

                    <span className="text-[10.5px] text-gray-400 dark:text-gray-500">
                        از ۱۰۰
                    </span>
                </div>
            </div>

            <div className="flex flex-col gap-1.5">
                <div
                    className="h-2 w-full overflow-hidden rounded-full"
                    style={{
                        background: isDark
                            ? "rgba(255,255,255,0.06)"
                            : "rgba(0,0,0,0.06)",
                    }}
                >
                    <motion.div
                        initial={{ width: 0 }}
                        animate={{
                            width: `${pct}%`,
                        }}
                        transition={{
                            duration: 0.7,
                            ease: "easeOut",
                            delay: 0.1,
                        }}
                        className="h-full rounded-full"
                        style={{
                            background: `linear-gradient(90deg, ${tier.color}cc, ${tier.color})`,
                        }}
                    />
                </div>
            </div>

            <div
                className="grid grid-cols-2 gap-2 border-t pt-1"
                style={{
                    borderColor: isDark
                        ? "rgba(255,255,255,0.05)"
                        : "rgba(0,0,0,0.05)",
                }}
            >
                <StatChip
                    icon={<Award size={12} />}
                    label="امتیاز کسب‌شده"
                    value={data.score}
                    color="#22c55e"
                    bg={
                        isDark
                            ? "rgba(34,197,94,0.1)"
                            : "rgba(34,197,94,0.07)"
                    }
                />

                <StatChip
                    icon={<TrendingDown size={12} />}
                    label="کسر شده"
                    value={data.total_deducted}
                    color="#ef4444"
                    bg={
                        isDark
                            ? "rgba(239,68,68,0.1)"
                            : "rgba(239,68,68,0.07)"
                    }
                />
            </div>

            <ScoreHistory
                history={history}
                loading={historyLoading}
                isDark={isDark}
            />
        </div>
    );
}

function ScoreHistory({
    history,
    loading,
    isDark,
}: {
    history: ScoreHistory[];
    loading: boolean;
    isDark: boolean;
}) {
    const border = isDark
        ? "rgba(255,255,255,0.05)"
        : "rgba(0,0,0,0.05)";

    return (
        <div
            className="flex flex-col gap-2.5 border-t pt-3"
            style={{
                borderColor: border,
            }}
        >
            <div className="flex items-center justify-between">
                <p className="text-[11px] font-bold text-gray-700 dark:text-gray-300">
                    دلایل کسر امتیاز
                </p>

                {history.length > 0 && (
                    <span className="text-[10px] text-gray-400 dark:text-gray-500">
                        {history.length} مورد
                    </span>
                )}
            </div>

            {loading ? (
                <div className="flex items-center justify-center py-2">
                    <motion.div
                        animate={{ rotate: 360 }}
                        transition={{
                            repeat: Infinity,
                            duration: 1,
                            ease: "linear",
                        }}
                        className="h-4 w-4 rounded-full border-2 border-transparent"
                        style={{
                            borderTopColor: isDark
                                ? "#f87171"
                                : "#ef4444",
                            borderRightColor: isDark
                                ? "rgba(248,113,113,0.25)"
                                : "rgba(239,68,68,0.2)",
                        }}
                    />
                </div>
            ) : history.length === 0 ? (
                <div
                    className="rounded-xl px-3 py-2.5 text-center"
                    style={{
                        background: isDark
                            ? "rgba(34,197,94,0.05)"
                            : "rgba(34,197,94,0.04)",
                    }}
                >
                    <p className="text-[10.5px] text-gray-400 dark:text-gray-500">
                        کسر امتیازی ثبت نشده است
                    </p>
                </div>
            ) : (
                <div className="flex max-h-64 flex-col gap-2 overflow-y-auto">
                    {history.map((item) => (
                        <motion.div
                            key={item.id}
                            initial={{
                                opacity: 0,
                                y: 5,
                            }}
                            animate={{
                                opacity: 1,
                                y: 0,
                            }}
                            transition={{
                                duration: 0.2,
                            }}
                            className="rounded-xl px-3 py-2.5"
                            style={{
                                background: isDark
                                    ? "rgba(255,255,255,0.025)"
                                    : "rgba(0,0,0,0.025)",
                                border: `1px solid ${border}`,
                            }}
                        >
                            <div className="flex items-start justify-between gap-3">
                                <p className="min-w-0 flex-1 text-[10.5px] leading-5 text-gray-600 dark:text-gray-400">
                                    {item.reason}
                                </p>

                                <span
                                    className="shrink-0 rounded-lg px-2 py-1 text-[10px] font-extrabold"
                                    style={{
                                        color: "#ef4444",
                                        background: isDark
                                            ? "rgba(239,68,68,0.1)"
                                            : "rgba(239,68,68,0.07)",
                                    }}
                                >
                                    -{item.amount}
                                </span>
                            </div>

                            <div className="mt-1.5 flex items-center justify-between gap-2">
                                <span className="text-[9.5px] text-gray-400 dark:text-gray-600">
                                    {formatDate(item.created_at)}
                                </span>

                                {item.overdue_period > 0 && (
                                    <span className="text-[9.5px] text-gray-400 dark:text-gray-600">
                                        دوره تأخیر {item.overdue_period}
                                    </span>
                                )}
                            </div>
                        </motion.div>
                    ))}
                </div>
            )}
        </div>
    );
}

function StatChip({
    icon,
    label,
    value,
    color,
    bg,
}: {
    icon: React.ReactNode;
    label: string;
    value: number;
    color: string;
    bg: string;
}) {
    return (
        <div
            className="flex flex-col gap-1 rounded-xl px-3 py-2.5"
            style={{
                background: bg,
            }}
        >
            <div
                className="flex items-center gap-1.5"
                style={{
                    color,
                }}
            >
                {icon}

                <span className="text-[10.5px] font-semibold">
                    {label}
                </span>
            </div>

            <span
                className="text-[16px] font-extrabold"
                style={{
                    color,
                }}
            >
                {value}
            </span>
        </div>
    );
}
