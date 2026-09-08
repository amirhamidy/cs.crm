"use client";

import { ArrowLeft, CalendarDays, ClipboardList, Package } from "lucide-react";
import { motion } from "framer-motion";
import { useTheme } from "next-themes";
import { ApiWarehouseTask } from "@/types/warehouse";
import { formatDate, formatNumber, getStatusLabel, getStatusTone, getTaskProductName } from "@/utils/warehouseEmployee";

interface Props {
    task: ApiWarehouseTask;
    onSelect: (task: ApiWarehouseTask) => void;
}

export default function WarehouseEmployeeTaskCard({ task, onSelect }: Props) {
    const { resolvedTheme } = useTheme();
    const isDark = resolvedTheme === "dark";

    const data = task as unknown as Record<string, unknown>;

    const status = String(data.status ?? "");
    const tone = getStatusTone(status);

    const expected = Number(data.expected_quantity ?? data.quantity ?? data.requested_quantity ?? 0);
    const received = Number(data.received_quantity ?? data.completed_quantity ?? 0);
    const updatedAt = data.updated_at ?? data.modified_at ?? data.created_at;

    const toneClasses = {
        success: "border-emerald-400/15 bg-emerald-400/10 text-emerald-300",
        danger: "border-red-400/15 bg-red-400/10 text-red-300",
        warning: "border-amber-400/15 bg-amber-400/10 text-amber-300",
        neutral: isDark
            ? "border-white/[0.08] bg-white/[0.035] text-white/50"
            : "border-gray-200 bg-gray-100 text-gray-500",
    };

    const textColor = isDark ? "#ffffff" : "#1e293b";
    const mutedText = isDark ? "rgba(255,255,255,0.4)" : "#94a3b8";

    return (
        <motion.button
            type="button"
            onClick={() => onSelect(task)}
            whileHover={{ y: -2 }}
            className="relative group w-full rounded-2xl border p-4 text-right transition hover:border-indigo-200/50"
            style={{
                borderColor: isDark ? "rgba(255,255,255,0.07)" : "rgba(15,23,42,0.07)",
                background: isDark ? "#0f172a" : "#f8fafc",
            }}
        >
            {/* Animated border - ایندیگو/بنفش */}
            <svg className="pointer-events-none absolute inset-0 h-full w-full">
                <defs>
                    <linearGradient
                        id={`task-border-${String(data.id)}`}
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
                    stroke="url(#task-border-${String(data.id)})"
                    strokeWidth="1.4"
                    initial={{ pathLength: 0, opacity: 0 }}
                    whileHover={{ pathLength: 1, opacity: 1 }}
                    transition={{ duration: 0.45, ease: "easeInOut" }}
                />
            </svg>

            <div className="flex items-start gap-3">
                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-indigo-400/10 text-indigo-400">
                    <ClipboardList className="h-5 w-5" />
                </div>

                <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                        <div className="flex items-center gap-2">
                            <span className="text-sm font-bold" style={{ color: textColor }}>
                                وظیفه #{String(data.id ?? "—")}
                            </span>

                            <span className={`rounded-full border px-2 py-1 text-[10px] font-medium ${toneClasses[tone]}`}>
                                {getStatusLabel(status)}
                            </span>
                        </div>

                        <ArrowLeft className="h-4 w-4 transition group-hover:-translate-x-1" style={{ color: mutedText }} />
                    </div>

                    <div className="mt-3 flex items-center gap-2 text-sm" style={{ color: isDark ? "rgba(255,255,255,0.65)" : "#64748b" }}>
                        <Package className="h-4 w-4" style={{ color: mutedText }} />
                        <span className="truncate">{getTaskProductName(task)}</span>
                    </div>

                    <div className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-3">
                        <div
                            className="rounded-xl px-3 py-2"
                            style={{ background: isDark ? "rgba(255,255,255,0.025)" : "rgba(15,23,42,0.025)" }}
                        >
                            <p className="text-[10px]" style={{ color: mutedText }}>
                                مقدار مورد انتظار
                            </p>
                            <p className="mt-1 text-xs font-semibold" style={{ color: isDark ? "rgba(255,255,255,0.7)" : "#64748b" }}>
                                {formatNumber(expected)}
                            </p>
                        </div>

                        <div
                            className="rounded-xl px-3 py-2"
                            style={{ background: isDark ? "rgba(255,255,255,0.025)" : "rgba(15,23,42,0.025)" }}
                        >
                            <p className="text-[10px]" style={{ color: mutedText }}>
                                مقدار دریافت
                            </p>
                            <p className="mt-1 text-xs font-semibold text-emerald-400">{formatNumber(received)}</p>
                        </div>

                        <div
                            className="col-span-2 flex items-center gap-2 rounded-xl px-3 py-2 sm:col-span-1"
                            style={{ background: isDark ? "rgba(255,255,255,0.025)" : "rgba(15,23,42,0.025)" }}
                        >
                            <CalendarDays className="h-3.5 w-3.5" style={{ color: mutedText }} />
                            <span className="text-[10px]" style={{ color: mutedText }}>
                                {formatDate(updatedAt)}
                            </span>
                        </div>
                    </div>
                </div>
            </div>
        </motion.button>
    );
}