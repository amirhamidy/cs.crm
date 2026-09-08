"use client";

import { Boxes, RefreshCw, ShieldCheck, Warehouse } from "lucide-react";
import { motion } from "framer-motion";
import { useTheme } from "next-themes";

interface Props {
    employeeName?: string;
    staffCode?: string | number;
    refreshing?: boolean;
    onRefresh?: () => void;
}

export default function WarehouseEmployeeHeader({
    employeeName,
    staffCode,
    refreshing = false,
    onRefresh,
}: Props) {
    const { resolvedTheme } = useTheme();
    const isDark = resolvedTheme === "dark";

    const textColor = isDark ? "#ffffff" : "#1e293b";
    const mutedText = isDark ? "rgba(255,255,255,0.45)" : "#64748b";

    return (
        <motion.div
            initial={{ opacity: 0, y: -12 }}
            animate={{ opacity: 1, y: 0 }}
            className="relative overflow-hidden rounded-[28px] border p-5 shadow-[0_20px_70px_rgba(0,0,0,.25)] sm:p-6"
            style={{
                borderColor: isDark ? "rgba(255,255,255,0.08)" : "rgba(15,23,42,0.08)",
                background: isDark ? "#0f172a" : "#f8fafc",
            }}
        >
            <div className="absolute -right-20 -top-24 h-64 w-64 rounded-full bg-indigo-500/[0.08] blur-3xl" />
            <div className="absolute -bottom-32 left-10 h-56 w-56 rounded-full bg-purple-500/[0.05] blur-3xl" />

            <div className="relative flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex items-center gap-4">
                    <div
                        className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl border"
                        style={{
                            borderColor: isDark ? "rgba(99,102,241,0.2)" : "rgba(99,102,241,0.15)",
                            background: isDark ? "rgba(99,102,241,0.1)" : "rgba(99,102,241,0.08)",
                        }}
                    >
                        <Warehouse className="h-7 w-7 text-indigo-400" />
                    </div>

                    <div>
                        <div className="mb-1 flex flex-wrap items-center gap-2">
                            <h1 className="text-lg font-bold sm:text-xl" style={{ color: textColor }}>
                                انبارداری
                            </h1>

                            <span className="inline-flex items-center gap-1 rounded-full border border-emerald-400/15 bg-emerald-400/10 px-2.5 py-1 text-[11px] font-medium text-emerald-300">
                                <ShieldCheck className="h-3.5 w-3.5" />
                                دسترسی فعال
                            </span>
                        </div>

                        <p className="text-sm" style={{ color: mutedText }}>
                            مدیریت وظایف، موجودی و عملیات انبار
                        </p>

                        {(employeeName || staffCode) && (
                            <div className="mt-2 flex flex-wrap items-center gap-2 text-xs" style={{ color: isDark ? "rgba(255,255,255,0.35)" : "#94a3b8" }}>
                                {employeeName && <span>{employeeName}</span>}
                                {staffCode && (
                                    <>
                                        <span className="h-1 w-1 rounded-full bg-white/20" />
                                        <span>کد پرسنلی: {staffCode}</span>
                                    </>
                                )}
                            </div>
                        )}
                    </div>
                </div>

                <button
                    type="button"
                    onClick={onRefresh}
                    disabled={refreshing}
                    className="inline-flex h-11 items-center justify-center gap-2 rounded-xl border px-4 text-sm font-medium transition disabled:cursor-not-allowed disabled:opacity-50"
                    style={{
                        borderColor: isDark ? "rgba(255,255,255,0.08)" : "rgba(15,23,42,0.08)",
                        background: isDark ? "rgba(255,255,255,0.035)" : "rgba(15,23,42,0.04)",
                        color: isDark ? "rgba(255,255,255,0.7)" : "#475569",
                    }}
                >
                    <RefreshCw className={`h-4 w-4 ${refreshing ? "animate-spin" : ""}`} />
                    بروزرسانی
                </button>
            </div>

            <div className="relative mt-5 grid grid-cols-2 gap-3 sm:grid-cols-3">
                <div
                    className="rounded-2xl border p-3"
                    style={{
                        borderColor: isDark ? "rgba(255,255,255,0.06)" : "rgba(15,23,42,0.06)",
                        background: isDark ? "rgba(255,255,255,0.025)" : "rgba(15,23,42,0.025)",
                    }}
                >
                    <div className="mb-2 flex items-center gap-2 text-xs" style={{ color: mutedText }}>
                        <Boxes className="h-4 w-4" />
                        <span>حوزه کاری</span>
                    </div>
                    <p className="text-sm font-semibold" style={{ color: textColor }}>
                        عملیات انبار
                    </p>
                </div>

                <div
                    className="rounded-2xl border p-3"
                    style={{
                        borderColor: isDark ? "rgba(255,255,255,0.06)" : "rgba(15,23,42,0.06)",
                        background: isDark ? "rgba(255,255,255,0.025)" : "rgba(15,23,42,0.025)",
                    }}
                >
                    <div className="mb-2 text-xs" style={{ color: mutedText }}>
                        وضعیت
                    </div>
                    <p className="text-sm font-semibold text-emerald-300">فعال</p>
                </div>

                <div
                    className="col-span-2 rounded-2xl border p-3 sm:col-span-1"
                    style={{
                        borderColor: isDark ? "rgba(255,255,255,0.06)" : "rgba(15,23,42,0.06)",
                        background: isDark ? "rgba(255,255,255,0.025)" : "rgba(15,23,42,0.025)",
                    }}
                >
                    <div className="mb-2 text-xs" style={{ color: mutedText }}>
                        نقش
                    </div>
                    <p className="text-sm font-semibold" style={{ color: textColor }}>
                        کارمند انبار
                    </p>
                </div>
            </div>
        </motion.div>
    );
}