"use client";

import { AlertTriangle, Gauge, TrendingDown, Users } from "lucide-react";
import ProductionBarChart from "@/components/charts/ProductionBarChart";
import { toPersianDigits } from "@/lib/jalali";
import { formatProductionHours, formatProductionInteger, formatProductionPercent } from "@/lib/productionFormat";
import { StatCard } from "./shared";
import { SortableTable } from "./sorting";
import type { Col } from "./sorting";
import type { EmployeeRow } from "./reportTypes";

const pct = (v: number | null) => (v == null ? "—" : `${formatProductionPercent(v)}٪`);

/**
 * گزارش عددی ضایعات تک‌تک کارکنان: تعداد ضایعات، مقدار مجاز طبق استاندارد،
 * اختلاف، و درصد ضایعات به تولید. رتبه ۱ = کمترین ضایعات (طبق معیار انتخابی).
 */
export default function EmployeeWasteReport({ ranking }: { ranking: EmployeeRow[] }) {
    const totalWaste = ranking.reduce((s, r) => s + r.waste, 0);
    const totalProduced = ranking.reduce((s, r) => s + r.produced, 0);
    const totalExpected = ranking.reduce((s, r) => s + r.expected_waste, 0);
    const overall = totalProduced ? (totalWaste / totalProduced) * 100 : null;
    const last = ranking.length - 1;

    const columns: Col<EmployeeRow>[] = [
        { key: "rank", label: "رتبه", get: (r) => r.rank, render: (r) => toPersianDigits(r.rank ?? "—") },
        { key: "name", label: "کارمند", get: (r) => r.employee_name, tdClass: "font-bold text-gray-800 dark:text-gray-100" },
        { key: "logs", label: "تعداد ثبت", get: (r) => r.logs, firstDir: "desc", render: (r) => formatProductionInteger(r.logs) },
        { key: "hours", label: "ساعت کار", get: (r) => r.hours, firstDir: "desc", render: (r) => formatProductionHours(r.hours) },
        { key: "produced", label: "تولید", get: (r) => r.produced, firstDir: "desc", render: (r) => formatProductionInteger(r.produced) },
        { key: "waste", label: "ضایعات", get: (r) => r.waste, firstDir: "desc", tdClass: "font-bold text-red-500", render: (r) => formatProductionInteger(r.waste) },
        { key: "expected", label: "ضایعات مجاز", get: (r) => r.expected_waste, firstDir: "desc", tdClass: "text-gray-400", render: (r) => formatProductionInteger(r.expected_waste) },
        {
            key: "diff",
            label: "اختلاف از استاندارد",
            get: (r) => r.waste_diff,
            firstDir: "desc",
            tdClass: "font-bold",
            render: (r) => (
                <span className={r.waste_diff > 0 ? "text-red-600" : "text-emerald-600"}>
                    {r.waste_diff > 0 ? "+" : ""}{formatProductionInteger(r.waste_diff)}
                </span>
            ),
        },
        { key: "percent", label: "درصد ضایعات", get: (r) => r.waste_percent, firstDir: "desc", render: (r) => pct(r.waste_percent) },
    ];

    return (
        <section className="space-y-4">
            <div>
                <h3 className="flex items-center gap-2 text-[13px] font-extrabold text-gray-900 dark:text-white">
                    <Users size={15} className="text-red-500" />
                    گزارش عددی ضایعات کارکنان
                </h3>
                <p className="mt-1 text-[10.5px] text-gray-400">
                    ضایعات هر کارمند در بازه‌ی انتخابی؛ رتبه ۱ یعنی کمترین ضایعات. با کلیک روی عنوان هر ستون، جدول از بالا به پایین یا پایین به بالا مرتب می‌شود.
                </p>
            </div>

            {ranking.length === 0 ? (
                <div className="rounded-2xl border border-dashed border-gray-200 py-10 text-center text-[12px] text-gray-400 dark:border-white/[0.1]">
                    در این بازه ثبتی برای کارکنان وجود ندارد.
                </div>
            ) : (
                <>
                    <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
                        <StatCard label="کل ضایعات کارکنان" value={formatProductionInteger(totalWaste)} unit="عدد" tone="red" icon={<AlertTriangle size={16} />} />
                        <StatCard label="ضایعات مجاز" value={formatProductionInteger(totalExpected)} unit="عدد" tone="indigo" icon={<Gauge size={16} />} />
                        <StatCard label="درصد ضایعات به تولید" value={pct(overall)} tone="amber" icon={<TrendingDown size={16} />} />
                        <StatCard label="تعداد کارکنان" value={formatProductionInteger(ranking.length)} tone="emerald" icon={<Users size={16} />} />
                    </div>

                    <ProductionBarChart
                        allLabels
                        title="ضایعات واقعی در برابر مجاز (هر کارمند)"
                        subtitle="به تفکیک کارمند در بازه‌ی انتخابی"
                        data={ranking.map((r) => ({ name: r.employee_name, a: r.waste, b: Number(r.expected_waste) }))}
                        seriesA={{ label: "ضایعات واقعی", color: "#ef4444" }}
                        seriesB={{ label: "ضایعات مجاز", color: "#8b5cf6" }}
                    />

                    <SortableTable
                        rows={ranking}
                        columns={columns}
                        rowKey={(r) => r.employee_id}
                        initialSort={{ key: "rank", dir: "asc" }}
                        minWidth={820}
                        rowClass={(r) =>
                            ranking.length > 1 && r.rank === 1
                                ? "bg-emerald-500/[0.04]"
                                : ranking.length > 1 && r.rank === ranking[last].rank
                                    ? "bg-red-500/[0.04]"
                                    : ""
                        }
                    />
                </>
            )}
        </section>
    );
}
