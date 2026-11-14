"use client";

import { motion } from "framer-motion";
import {
    Factory,
    SquarePen,
    Loader2,
    TrendingUp,
    BarChart3,
    AlertTriangle,
    Gauge,
} from "lucide-react";
import { toPersianDigits } from "@/lib/jalali";
import {
    gradientOf,
    initialOf,
    StatusSwitch,
    StatCard,
} from "@/components/admin/production/shared";
import { useProductionData } from "@/components/admin/production/ProductionContext";

export default function DashboardPage() {
    const { machines, loading, togglingId, setMachineModal, stats, handleToggleActive } = useProductionData(["machines", "logs"]);

    return (
        <>
        <>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                <StatCard
                    label="کل تولید واقعی"
                    value={toPersianDigits(stats.produced.toLocaleString())}
                    unit="عدد"
                    tone="emerald"
                    icon={<TrendingUp size={16} />}
                />
                <StatCard
                    label="میانگین راندمان"
                    value={`${toPersianDigits(stats.avgEfficiency.toFixed(1))}٪`}
                    tone="indigo"
                    icon={<BarChart3 size={16} />}
                />
                <StatCard
                    label="کل ضایعات ثبت‌شده"
                    value={toPersianDigits(stats.waste.toLocaleString())}
                    unit="عدد"
                    tone="red"
                    icon={<AlertTriangle size={16} />}
                />
            </div>

            <section className="space-y-4">
                <h2 className="flex items-center gap-2 text-[13px] font-extrabold text-gray-900 dark:text-white">
                    <Factory size={15} className="text-indigo-500" />
                    ماشین‌آلات خط تولید ({toPersianDigits(machines.length)})
                </h2>

                {loading ? (
                    <div className="flex justify-center py-10">
                        <Loader2 size={22} className="animate-spin text-indigo-500" />
                    </div>
                ) : machines.length === 0 ? (
                    <div className="rounded-2xl border border-dashed border-gray-200 py-10 text-center text-[12px] text-gray-400 dark:border-white/[0.1]">
                        هنوز ماشینی تعریف نشده. با «تعریف ماشین» شروع کنید.
                    </div>
                ) : (
                    <div className="grid grid-cols-1 gap-3 md:grid-cols-2 lg:grid-cols-3">
                        {machines.slice(0, 6).map((m, index) => (
                            <motion.div
                                key={m.id}
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: Math.min(index, 8) * 0.03 }}
                                className="flex flex-col gap-3 rounded-2xl border border-black/[0.06] bg-[#fafafa] p-4 transition-shadow duration-200 hover:shadow-[0_0_0_1px_rgba(99,102,241,0.35),0_14px_40px_rgba(99,102,241,0.25)] dark:border-white/[0.06] dark:bg-white/[0.02] dark:hover:shadow-[0_0_0_1px_rgba(129,140,248,0.45),0_14px_44px_rgba(99,102,241,0.35)]"
                            >
                                <div className="flex items-center justify-between gap-3">
                                    <div className="flex min-w-0 items-center gap-3">
                                        <div
                                            className={`flex h-11 w-11 shrink-0 select-none items-center justify-center rounded-2xl bg-gradient-to-br text-[15px] font-extrabold text-white ${gradientOf(
                                                m.id
                                            )}`}
                                        >
                                            {initialOf(m.name)}
                                        </div>
                                        <div className="min-w-0">
                                            <p className="truncate text-[13.5px] font-extrabold leading-tight text-gray-800 dark:text-gray-100">
                                                {m.name}
                                            </p>
                                            <p dir="ltr" className="mt-0.5 text-right font-mono text-[11px] text-gray-400 dark:text-gray-500">
                                                {m.code}
                                            </p>
                                        </div>
                                    </div>

                                    <button
                                        type="button"
                                        onClick={() => setMachineModal({ open: true, machine: m })}
                                        aria-label="ویرایش ماشین"
                                        title="ویرایش"
                                        className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border-[1.5px] border-black/[0.14] bg-[#e2e2e2] text-gray-700 transition-all hover:bg-blue-600 hover:text-white active:scale-95 dark:border-white/[0.13] dark:bg-[#1e1e1e] dark:text-gray-200 dark:hover:bg-blue-600"
                                    >
                                        <SquarePen size={15} />
                                    </button>
                                </div>

                                <div className="grid grid-cols-2 gap-2 border-t border-black/5 pt-3 dark:border-white/5">
                                    <div className="rounded-xl bg-black/[0.03] px-3 py-2 dark:bg-white/[0.03]">
                                        <span className="flex items-center gap-1 text-[10px] text-gray-400">
                                            <Gauge size={11} />
                                            تولید در ساعت
                                        </span>
                                        <span className="mt-0.5 block text-[13px] font-extrabold text-gray-800 dark:text-gray-100">
                                            {toPersianDigits(m.std_production_per_hour)}
                                        </span>
                                    </div>
                                    <div className="rounded-xl bg-black/[0.03] px-3 py-2 dark:bg-white/[0.03]">
                                        <span className="flex items-center gap-1 text-[10px] text-gray-400">
                                            <AlertTriangle size={11} />
                                            ضایعات در ساعت
                                        </span>
                                        <span className="mt-0.5 block text-[13px] font-extrabold text-red-500">
                                            {toPersianDigits(m.std_waste_per_hour)}
                                        </span>
                                    </div>
                                </div>

                                <div className="flex items-center justify-between">
                                    <span
                                        className={`rounded-lg border px-2 py-0.5 text-[10.5px] font-bold ${m.is_active
                                            ? "border-emerald-500/25 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
                                            : "border-slate-400/30 bg-slate-400/10 text-slate-500 dark:text-slate-400"
                                            }`}
                                    >
                                        {m.is_active ? "فعال" : "غیرفعال"}
                                    </span>
                                    <StatusSwitch
                                        isActive={m.is_active}
                                        loading={togglingId === m.id}
                                        disabled={togglingId !== null && togglingId !== m.id}
                                        title={m.is_active ? "غیرفعال‌سازی ماشین" : "فعال‌سازی ماشین"}
                                        onToggle={() => handleToggleActive(m)}
                                    />
                                </div>
                            </motion.div>
                        ))}
                    </div>
                )}
            </section>
        </>
        </>
    );
}
