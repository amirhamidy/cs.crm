"use client";

import { AlertCircle, BellRing, CalendarClock } from "lucide-react";
import { motion } from "framer-motion";
import { useTheme } from "next-themes";
import { ApiOrderTaskDeadline } from "@/types/warehouse";
import { formatDate, getDeadlineDate } from "@/utils/warehouseEmployee";

interface Props {
    deadlines: ApiOrderTaskDeadline[];
}

export default function WarehouseEmployeeDeadlines({ deadlines }: Props) {
    const { resolvedTheme } = useTheme();
    const isDark = resolvedTheme === "dark";

    const textColor = isDark ? "#ffffff" : "#1e293b";
    const mutedText = isDark ? "rgba(255,255,255,0.4)" : "#94a3b8";

    return (
        <section className="space-y-4">
            <div>
                <h2 className="flex items-center gap-2 text-base font-bold" style={{ color: textColor }}>
                    <BellRing className="h-5 w-5 text-amber-400" />
                    مهلت‌های سفارش
                </h2>
                <p className="mt-1 text-xs" style={{ color: mutedText }}>
                    زمان‌بندی و مهلت‌های ثبت‌شده برای عملیات انبار
                </p>
            </div>

            {deadlines.length ? (
                <div className="grid gap-3 sm:grid-cols-2">
                    {deadlines.map((deadline, index) => {
                        const data = deadline as unknown as Record<string, unknown>;
                        const deadlineDate = getDeadlineDate(deadline);
                        const status = String(data.status ?? "").toLowerCase();
                        const danger = ["overdue", "expired", "late"].includes(status);

                        return (
                            <motion.div
                                key={String(data.id)}
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ duration: 0.2, delay: index * 0.04 }}
                                className={`relative rounded-2xl border p-4 transition ${danger
                                        ? "border-red-400/15 bg-red-400/[0.035]"
                                        : "hover:border-indigo-200/50"
                                    }`}
                                style={{
                                    borderColor: danger
                                        ? undefined
                                        : isDark ? "rgba(255,255,255,0.07)" : "rgba(15,23,42,0.07)",
                                    background: danger
                                        ? undefined
                                        : isDark ? "#0f172a" : "#f8fafc",
                                }}
                            >
                                {/* Animated border - ایندیگو/بنفش */}
                                {!danger && (
                                    <svg className="pointer-events-none absolute inset-0 h-full w-full">
                                        <defs>
                                            <linearGradient
                                                id={`deadline-border-${String(data.id)}`}
                                                x1="100%"
                                                y1="100%"
                                                x2="0%"
                                                y2="0%"
                                            >
                                                <stop offset="0%" stopColor="#6366f1" />
                                                <stop offset="100%" stopColor="#8b5cf6" />
                                            </linearGradient>
                                        </defs>
                                        <motion.rect
                                            x="1"
                                            y="1"
                                            width="calc(100% - 2px)"
                                            height="calc(100% - 2px)"
                                            rx="23"
                                            ry="23"
                                            fill="none"
                                            stroke="url(#deadline-border-${String(data.id)})"
                                            strokeWidth="1.4"
                                            initial={{ pathLength: 0, opacity: 0 }}
                                            whileHover={{ pathLength: 1, opacity: 1 }}
                                            transition={{ duration: 0.45, ease: "easeInOut" }}
                                        />
                                    </svg>
                                )}

                                <div className="flex items-start gap-3">
                                    <div
                                        className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl ${danger ? "bg-red-400/10 text-red-300" : "bg-amber-400/10 text-amber-300"
                                            }`}
                                    >
                                        {danger ? <AlertCircle className="h-5 w-5" /> : <CalendarClock className="h-5 w-5" />}
                                    </div>

                                    <div className="min-w-0 flex-1">
                                        <div className="flex items-start justify-between gap-2">
                                            <div>
                                                <p className="text-sm font-bold" style={{ color: textColor }}>
                                                    مهلت سفارش #{String(data.order_task_id ?? data.order_id ?? data.id ?? "—")}
                                                </p>
                                                <p className="mt-1 text-xs" style={{ color: mutedText }}>
                                                    {String(data.title ?? data.name ?? "مهلت عملیاتی")}
                                                </p>
                                            </div>

                                            <span
                                                className={`rounded-full px-2 py-1 text-[10px] ${danger
                                                        ? "bg-red-400/10 text-red-300"
                                                        : "bg-amber-400/10 text-amber-300"
                                                    }`}
                                            >
                                                {danger ? "تاخیر" : String(data.status ?? "فعال")}
                                            </span>
                                        </div>

                                        <div className="mt-4 rounded-xl p-3" style={{ background: isDark ? "rgba(255,255,255,0.025)" : "rgba(15,23,42,0.025)" }}>
                                            <p className="text-[10px]" style={{ color: mutedText }}>
                                                موعد
                                            </p>
                                            <p className="mt-1 text-sm font-semibold" style={{ color: isDark ? "rgba(255,255,255,0.7)" : "#64748b" }}>
                                                {formatDate(deadlineDate)}
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            </motion.div>
                        );
                    })}
                </div>
            ) : (
                <div
                    className="rounded-2xl border border-dashed px-6 py-14 text-center"
                    style={{
                        borderColor: isDark ? "rgba(255,255,255,0.08)" : "rgba(15,23,42,0.08)",
                        background: isDark ? "#0f172a" : "#f8fafc",
                    }}
                >
                    <BellRing className="mx-auto h-9 w-9" style={{ color: mutedText }} />
                    <p className="mt-3 text-sm" style={{ color: isDark ? "rgba(255,255,255,0.45)" : "#94a3b8" }}>
                        مهلتی برای نمایش وجود ندارد
                    </p>
                </div>
            )}
        </section>
    );
}