"use client";

import { ArrowLeft, BellRing, Boxes, ClipboardList, PackageSearch, ReceiptText } from "lucide-react";
import { useTheme } from "next-themes";
import { motion } from "framer-motion";
import { ApiStockInfo, ApiWarehouseTask } from "@/types/warehouse";
import { formatDate, formatNumber, getStockProductName, getTaskProductName } from "@/utils/warehouseEmployee";

interface Props {
    tasks: ApiWarehouseTask[];
    stockInfos: ApiStockInfo[];
    onSelectTask: (task: ApiWarehouseTask) => void;
    onNavigate: (tab: "tasks" | "stock" | "transactions" | "orders" | "deadlines") => void;
}

export default function WarehouseEmployeeOverview({ tasks, stockInfos, onSelectTask, onNavigate }: Props) {
    const { resolvedTheme } = useTheme();
    const isDark = resolvedTheme === "dark";

    const recentTasks = tasks.slice(0, 5);
    const recentStock = stockInfos.slice(0, 4);

    const textColor = isDark ? "#ffffff" : "#1e293b";
    const mutedText = isDark ? "rgba(255,255,255,0.4)" : "#94a3b8";

    return (
        <div className="grid gap-4 lg:grid-cols-3">
            {/* Tasks */}
            <div
                className="lg:col-span-2 rounded-2xl border p-4"
                style={{
                    borderColor: isDark ? "rgba(255,255,255,0.07)" : "rgba(15,23,42,0.07)",
                    background: isDark ? "#0f172a" : "#f8fafc",
                }}
            >
                <div className="mb-4 flex items-center justify-between">
                    <div>
                        <h2 className="flex items-center gap-2 text-sm font-bold" style={{ color: textColor }}>
                            <ClipboardList className="h-4 w-4 text-indigo-400" />
                            آخرین وظایف
                        </h2>
                        <p className="mt-1 text-[11px]" style={{ color: mutedText }}>
                            آخرین فعالیت‌های مرتبط با شما
                        </p>
                    </div>

                    <button
                        type="button"
                        onClick={() => onNavigate("tasks")}
                        className="flex items-center gap-1 text-xs transition"
                        style={{ color: mutedText }}
                    >
                        همه
                        <ArrowLeft className="h-3.5 w-3.5" />
                    </button>
                </div>

                <div className="space-y-2">
                    {recentTasks.length ? (
                        recentTasks.map((task, index) => {
                            const data = task as unknown as Record<string, unknown>;

                            return (
                                <motion.button
                                    key={String(data.id)}
                                    initial={{ opacity: 0, y: 8 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: index * 0.04 }}
                                    type="button"
                                    onClick={() => onSelectTask(task)}
                                    className="flex w-full items-center gap-3 rounded-xl p-3 text-right transition"
                                    style={{
                                        background: isDark ? "rgba(255,255,255,0.025)" : "rgba(15,23,42,0.025)",
                                    }}
                                >
                                    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-indigo-400/10 text-indigo-400">
                                        <ClipboardList className="h-4 w-4" />
                                    </div>

                                    <div className="min-w-0 flex-1">
                                        <p className="truncate text-xs font-semibold" style={{ color: isDark ? "rgba(255,255,255,0.75)" : "#475569" }}>
                                            {getTaskProductName(task)}
                                        </p>
                                        <p className="mt-1 text-[10px]" style={{ color: mutedText }}>
                                            وظیفه #{String(data.id ?? "—")}
                                        </p>
                                    </div>

                                    <span className="text-[10px]" style={{ color: mutedText }}>
                                        {formatDate(data.updated_at ?? data.created_at)}
                                    </span>
                                </motion.button>
                            );
                        })
                    ) : (
                        <div className="py-10 text-center text-xs" style={{ color: mutedText }}>
                            وظیفه‌ای وجود ندارد
                        </div>
                    )}
                </div>
            </div>

            {/* Stock */}
            <div
                className="rounded-2xl border p-4"
                style={{
                    borderColor: isDark ? "rgba(255,255,255,0.07)" : "rgba(15,23,42,0.07)",
                    background: isDark ? "#0f172a" : "#f8fafc",
                }}
            >
                <div className="mb-4 flex items-center justify-between">
                    <div>
                        <h2 className="flex items-center gap-2 text-sm font-bold" style={{ color: textColor }}>
                            <Boxes className="h-4 w-4 text-indigo-400" />
                            وضعیت موجودی
                        </h2>
                        <p className="mt-1 text-[11px]" style={{ color: mutedText }}>
                            خلاصه موجودی فعلی
                        </p>
                    </div>

                    <button
                        type="button"
                        onClick={() => onNavigate("stock")}
                        className="flex items-center gap-1 text-xs transition"
                        style={{ color: mutedText }}
                    >
                        همه
                        <ArrowLeft className="h-3.5 w-3.5" />
                    </button>
                </div>

                <div className="space-y-2">
                    {recentStock.length ? (
                        recentStock.map((stock, index) => {
                            const data = stock as unknown as Record<string, unknown>;

                            return (
                                <motion.div
                                    key={String(data.id)}
                                    initial={{ opacity: 0, y: 8 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: index * 0.05 }}
                                    className="rounded-xl p-3"
                                    style={{
                                        background: isDark ? "rgba(255,255,255,0.025)" : "rgba(15,23,42,0.025)",
                                    }}
                                >
                                    <div className="flex items-center gap-3">
                                        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-indigo-400/10 text-indigo-400">
                                            <PackageSearch className="h-4 w-4" />
                                        </div>

                                        <div className="min-w-0 flex-1">
                                            <p className="truncate text-xs font-semibold" style={{ color: isDark ? "rgba(255,255,255,0.7)" : "#475569" }}>
                                                {getStockProductName(stock)}
                                            </p>
                                            <p className="mt-1 text-[10px]" style={{ color: mutedText }}>
                                                موجودی
                                            </p>
                                        </div>

                                        <p className="text-sm font-bold" style={{ color: textColor }}>
                                            {formatNumber(data.current_quantity ?? data.quantity ?? data.stock ?? 0)}
                                        </p>
                                    </div>
                                </motion.div>
                            );
                        })
                    ) : (
                        <div className="py-10 text-center text-xs" style={{ color: mutedText }}>
                            موجودی‌ای وجود ندارد
                        </div>
                    )}
                </div>
            </div>

            {/* Quick Actions - با تم آبی-بنفش */}
            <button
                type="button"
                onClick={() => onNavigate("transactions")}
                className="group flex items-center gap-4 rounded-2xl border p-4 text-right transition hover:border-indigo-200/50"
                style={{
                    borderColor: isDark ? "rgba(255,255,255,0.07)" : "rgba(15,23,42,0.07)",
                    background: isDark ? "#0f172a" : "#f8fafc",
                }}
            >
                <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-emerald-400/10 text-emerald-400">
                    <ReceiptText className="h-5 w-5" />
                </div>
                <div className="flex-1">
                    <p className="text-sm font-bold" style={{ color: textColor }}>
                        تراکنش‌های انبار
                    </p>
                    <p className="mt-1 text-xs" style={{ color: mutedText }}>
                        ورود و خروج کالا را مشاهده کنید
                    </p>
                </div>
                <ArrowLeft className="h-4 w-4 transition group-hover:-translate-x-1" style={{ color: mutedText }} />
            </button>

            <button
                type="button"
                onClick={() => onNavigate("orders")}
                className="group flex items-center gap-4 rounded-2xl border p-4 text-right transition hover:border-indigo-200/50"
                style={{
                    borderColor: isDark ? "rgba(255,255,255,0.07)" : "rgba(15,23,42,0.07)",
                    background: isDark ? "#0f172a" : "#f8fafc",
                }}
            >
                <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-indigo-400/10 text-indigo-400">
                    <PackageSearch className="h-5 w-5" />
                </div>
                <div className="flex-1">
                    <p className="text-sm font-bold" style={{ color: textColor }}>
                        سفارش‌های انبار
                    </p>
                    <p className="mt-1 text-xs" style={{ color: mutedText }}>
                        سفارش‌های در گردش انبار
                    </p>
                </div>
                <ArrowLeft className="h-4 w-4 transition group-hover:-translate-x-1" style={{ color: mutedText }} />
            </button>

            <button
                type="button"
                onClick={() => onNavigate("deadlines")}
                className="group flex items-center gap-4 rounded-2xl border p-4 text-right transition hover:border-indigo-200/50"
                style={{
                    borderColor: isDark ? "rgba(255,255,255,0.07)" : "rgba(15,23,42,0.07)",
                    background: isDark ? "#0f172a" : "#f8fafc",
                }}
            >
                <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-amber-400/10 text-amber-400">
                    <BellRing className="h-5 w-5" />
                </div>
                <div className="flex-1">
                    <p className="text-sm font-bold" style={{ color: textColor }}>
                        مهلت‌های عملیاتی
                    </p>
                    <p className="mt-1 text-xs" style={{ color: mutedText }}>
                        زمان‌بندی سفارش‌ها
                    </p>
                </div>
                <ArrowLeft className="h-4 w-4 transition group-hover:-translate-x-1" style={{ color: mutedText }} />
            </button>
        </div>
    );
}