"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import {
    Factory,
    AlertTriangle,
    SquarePen,
    TrendingUp,
    BarChart3,
} from "lucide-react";
import { toPersianDigits } from "@/lib/jalali";
import axiosInstance from "@/lib/axiosInstance";
import { currentJalaliYearMonth, parseBackendError } from "@/components/admin/production/shared";
import { formatProductionInteger, formatProductionPercent } from "@/lib/productionFormat";
import {
    gradientOf,
    initialOf,
    StatusSwitch,
} from "@/components/admin/production/shared";
import StatTile from "@/components/ui/StatTile";
import { EmptyState } from "@/components/ui/States";
import CardSkeletonGrid from "@/components/ui/CardSkeletonGrid";
import { CARD, CARD_HOVER, GRID } from "@/components/ui/ds";
import { useProductionData } from "@/components/admin/production/ProductionContext";

type DashboardTotals = { produced: number; waste: number; efficiency: number | null };

export default function DashboardPage() {
    const { machines, loading, togglingId, setMachineModal, handleToggleActive } = useProductionData(["machines"]);
    const [totals, setTotals] = useState<DashboardTotals | null>(null);
    const [reportError, setReportError] = useState("");

    useEffect(() => {
        const { jy, jm } = currentJalaliYearMonth();
        let active = true;
        axiosInstance.get("/production/api/v1/report/monthly/", { params: { year: jy, month: jm } })
            .then((response) => {
                if (!active) return;
                setTotals(response.data?.totals ?? null);
            })
            .catch((error) => {
                if (!active) return;
                setReportError(parseBackendError(error, "دریافت آمار ماهانه تولید انجام نشد"));
            });
        return () => { active = false; };
    }, []);

    return (
        <>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                <StatTile
                    label="کل تولید واقعی"
                    value={totals ? formatProductionInteger(totals.produced) : "—"}
                    unit="عدد"
                    tone="emerald"
                    icon={<TrendingUp size={16} />}
                />
                <StatTile
                    label="راندمان کل"
                    value={totals?.efficiency == null ? "—" : `${formatProductionPercent(totals.efficiency)}٪`}
                    tone="indigo"
                    icon={<BarChart3 size={16} />}
                />
                <StatTile
                    label="کل ضایعات ثبت‌شده"
                    value={totals ? formatProductionInteger(totals.waste) : "—"}
                    unit="عدد"
                    tone="red"
                    icon={<AlertTriangle size={16} />}
                />
            </div>

            {reportError && <p className="rounded-xl bg-red-500/10 px-3 py-2 text-[11px] font-bold text-red-600">{reportError}</p>}

            <section className="space-y-4">
                <div>
                    <h2 className="flex items-center gap-2 text-[13px] font-extrabold text-gray-900 dark:text-white">
                    <Factory size={15} className="text-indigo-500" />
                    ماشین‌آلات خط تولید ({toPersianDigits(machines.length)})
                </h2>
                    <p className="mt-1 text-[10.5px] text-gray-400">(نمای کلی تولید (اعداد مجموع ثبت‌های همین ماه‌اند))</p>
                </div>

                {loading ? (
                    <CardSkeletonGrid count={3} className={GRID} />
                ) : machines.length === 0 ? (
                    <EmptyState title="هنوز ماشینی تعریف نشده" hint="با «تعریف ماشین» شروع کنید." />
                ) : (
                    <div className={GRID}>
                        {machines.slice(0, 6).map((m, index) => (
                            <motion.div
                                key={m.id}
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: Math.min(index, 8) * 0.03 }}
                                className={`${CARD} ${CARD_HOVER} flex flex-col gap-3 p-4`}
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
    );
}
