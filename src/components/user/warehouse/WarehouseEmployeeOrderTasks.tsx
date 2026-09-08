"use client";

import { ArrowLeft, PackageSearch } from "lucide-react";
import { motion } from "framer-motion";
import { useTheme } from "next-themes";
import { ApiOrderTask } from "@/types/warehouse";
import { formatDate, getOrderTaskTitle } from "@/utils/warehouseEmployee";

interface Props {
    orderTasks: ApiOrderTask[];
}

export default function WarehouseEmployeeOrderTasks({ orderTasks }: Props) {
    const { resolvedTheme } = useTheme();
    const isDark = resolvedTheme === "dark";

    const textColor = isDark ? "#ffffff" : "#1e293b";
    const mutedText = isDark ? "rgba(255,255,255,0.4)" : "#94a3b8";

    return (
        <section className="space-y-4">
            <div>
                <h2 className="flex items-center gap-2 text-base font-bold" style={{ color: textColor }}>
                    <PackageSearch className="h-5 w-5 text-indigo-400" />
                    سفارش‌های انبار
                </h2>
                <p className="mt-1 text-xs" style={{ color: mutedText }}>
                    اطلاعات سفارش‌هایی که در چرخه انبار قرار دارند
                </p>
            </div>

            {orderTasks.length ? (
                <div className="grid gap-3 sm:grid-cols-2">
                    {orderTasks.map((task, index) => {
                        const data = task as unknown as Record<string, unknown>;

                        return (
                            <motion.div
                                key={String(data.id)}
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ duration: 0.2, delay: index * 0.04 }}
                                className="relative rounded-2xl border p-4 transition hover:border-indigo-200/50"
                                style={{
                                    borderColor: isDark ? "rgba(255,255,255,0.07)" : "rgba(15,23,42,0.07)",
                                    background: isDark ? "#0f172a" : "#f8fafc",
                                }}
                            >
                                {/* Animated border - ایندیگو/بنفش */}
                                <svg className="pointer-events-none absolute inset-0 h-full w-full">
                                    <defs>
                                        <linearGradient
                                            id={`order-border-${String(data.id)}`}
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
                                        stroke="url(#order-border-${String(data.id)})"
                                        strokeWidth="1.4"
                                        initial={{ pathLength: 0, opacity: 0 }}
                                        whileHover={{ pathLength: 1, opacity: 1 }}
                                        transition={{ duration: 0.45, ease: "easeInOut" }}
                                    />
                                </svg>

                                <div className="flex items-start gap-3">
                                    <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-indigo-400/10 text-indigo-400">
                                        <PackageSearch className="h-5 w-5" />
                                    </div>

                                    <div className="min-w-0 flex-1">
                                        <div className="flex items-start justify-between gap-2">
                                            <div className="min-w-0">
                                                <p className="truncate text-sm font-bold" style={{ color: textColor }}>
                                                    {getOrderTaskTitle(task)}
                                                </p>
                                                <p className="mt-1 text-xs" style={{ color: mutedText }}>
                                                    سفارش #{String(data.id ?? "—")}
                                                </p>
                                            </div>

                                            <ArrowLeft className="h-4 w-4 shrink-0" style={{ color: mutedText }} />
                                        </div>

                                        <div className="mt-4 grid grid-cols-2 gap-2">
                                            <div className="rounded-xl p-2.5" style={{ background: isDark ? "rgba(255,255,255,0.025)" : "rgba(15,23,42,0.025)" }}>
                                                <p className="text-[10px]" style={{ color: mutedText }}>
                                                    وضعیت
                                                </p>
                                                <p className="mt-1 text-xs" style={{ color: isDark ? "rgba(255,255,255,0.6)" : "#64748b" }}>
                                                    {String(data.status ?? "—")}
                                                </p>
                                            </div>

                                            <div className="rounded-xl p-2.5" style={{ background: isDark ? "rgba(255,255,255,0.025)" : "rgba(15,23,42,0.025)" }}>
                                                <p className="text-[10px]" style={{ color: mutedText }}>
                                                    تاریخ
                                                </p>
                                                <p className="mt-1 text-[10px]" style={{ color: isDark ? "rgba(255,255,255,0.5)" : "#94a3b8" }}>
                                                    {formatDate(data.updated_at ?? data.created_at)}
                                                </p>
                                            </div>
                                        </div>

                                        {(typeof data.description === "string" || typeof data.description === "number" || typeof data.note === "string" || typeof data.note === "number") && (
                                            <p className="mt-3 line-clamp-2 text-xs leading-5" style={{ color: isDark ? "rgba(255,255,255,0.4)" : "#94a3b8" }}>
                                                {String(data.description ?? data.note ?? "")}
                                            </p>
                                        )}
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
                    <PackageSearch className="mx-auto h-9 w-9" style={{ color: mutedText }} />
                    <p className="mt-3 text-sm" style={{ color: isDark ? "rgba(255,255,255,0.45)" : "#94a3b8" }}>
                        سفارشی برای نمایش وجود ندارد
                    </p>
                </div>
            )}
        </section>
    );
}