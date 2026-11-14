"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import {
    Loader2,
    TrendingUp,
    BarChart3,
    AlertTriangle,
    CalendarDays,
    Gauge,
    LineChart,
} from "lucide-react";
import axiosInstance from "@/lib/axiosInstance";
import ProductionBarChart from "@/components/charts/ProductionBarChart";
import { toPersianDigits, pad2 } from "@/lib/jalali";
import {
    Option,
    MachineMonthlyReport,
    GroupBy,
    MachineSummaryReport,
    gradientOf,
    initialOf,
    parseBackendError,
    todayGregorian,
    JalaliDatePicker,
    NiceSelect,
    ErrorBanner,
    StatCard,
    EfficiencyBadge,
} from "@/components/admin/production/shared";
import { useProductionData } from "@/components/admin/production/ProductionContext";

export default function MachineSummaryPage() {
    const { machineOptions } = useProductionData(["machines"]);

    const [summaryMachineId, setSummaryMachineId] = useState<number | null>(null);
    const [summaryGroupBy, setSummaryGroupBy] = useState<number | null>(0);
    const [summaryDateFrom, setSummaryDateFrom] = useState(() => {
        const d = new Date();
        d.setDate(d.getDate() - 6);
        return `${d.getFullYear()}-${pad2(d.getMonth() + 1)}-${pad2(d.getDate())}`;
    });
    const [summaryDateTo, setSummaryDateTo] = useState(todayGregorian());
    const [summaryReport, setSummaryReport] = useState<MachineSummaryReport | null>(null);
    const [summaryLoading, setSummaryLoading] = useState(false);
    const [summaryError, setSummaryError] = useState("");

    const groupByOptions = useMemo<Option[]>(
        () => [
            { id: 0, label: "روزانه", sub: "" },
            { id: 1, label: "هفتگی", sub: "" },
            { id: 2, label: "ماهانه", sub: "" },
            { id: 3, label: "سالانه", sub: "" },
        ],
        []
    );

    async function loadSummaryReport() {
        setSummaryLoading(true);
        setSummaryError("");
        try {
            const groupByMap: Record<number, GroupBy> = { 0: "day", 1: "week", 2: "month", 3: "year" };
            const params: Record<string, string> = {
                date_from: summaryDateFrom,
                date_to: summaryDateTo,
                group_by: groupByMap[summaryGroupBy ?? 0],
            };
            if (summaryMachineId !== null) params.machine_id = String(summaryMachineId);
            const res = await axiosInstance.get("/production/api/v1/report/machine/summary/", { params });
            setSummaryReport(res.data as MachineSummaryReport);
        } catch (err) {
            setSummaryError(parseBackendError(err, "دریافت گزارش روند تولید با خطا مواجه شد"));
            setSummaryReport(null);
        } finally {
            setSummaryLoading(false);
        }
    }

    useEffect(() => {
        loadSummaryReport();
    }, [summaryDateFrom, summaryDateTo, summaryGroupBy, summaryMachineId]);

    return (
        <>
        <section className="space-y-4">
            <div className="flex flex-col items-start justify-between gap-3 sm:flex-row sm:items-center">
                <h2 className="flex items-center gap-2 text-[13px] font-extrabold text-gray-900 dark:text-white">
                    <LineChart size={15} className="text-indigo-500" />
                    روند تولید ماشین
                </h2>
            </div>

            <div className="rounded-2xl border border-black/[0.06] bg-[#fafafa] p-4 dark:border-white/[0.06] dark:bg-white/[0.02]">
                <div className="grid grid-cols-1 gap-3 md:grid-cols-2 lg:grid-cols-4">
                    <JalaliDatePicker
                        label="از تاریخ"
                        value={summaryDateFrom}
                        onChange={setSummaryDateFrom}
                        required
                    />
                    <JalaliDatePicker
                        label="تا تاریخ"
                        value={summaryDateTo}
                        onChange={setSummaryDateTo}
                        required
                    />
                    <NiceSelect
                        label="ماشین (اختیاری)"
                        placeholder="همه ماشین‌ها"
                        emptyText="ماشینی یافت نشد"
                        options={machineOptions}
                        value={summaryMachineId}
                        onChange={setSummaryMachineId}
                    />
                    <NiceSelect
                        label="گروه‌بندی"
                        placeholder="انتخاب گروه‌بندی"
                        emptyText="گزینه‌ای یافت نشد"
                        options={groupByOptions}
                        value={summaryGroupBy}
                        onChange={setSummaryGroupBy}
                    />
                </div>
            </div>

            {summaryError && <ErrorBanner message={summaryError} onClose={() => setSummaryError("")} />}

            {summaryLoading ? (
                <div className="flex justify-center py-10">
                    <Loader2 size={22} className="animate-spin text-indigo-500" />
                </div>
            ) : summaryReport ? (
                <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
                        <StatCard
                            label="کل ساعت کار"
                            value={toPersianDigits(summaryReport.totals.hours)}
                            unit="ساعت"
                            tone="indigo"
                            icon={<CalendarDays size={16} />}
                        />
                        <StatCard
                            label="کل تولید"
                            value={toPersianDigits(summaryReport.totals.produced.toLocaleString())}
                            unit="عدد"
                            tone="emerald"
                            icon={<TrendingUp size={16} />}
                        />
                        <StatCard
                            label="تولید انتظاری"
                            value={toPersianDigits(Number(summaryReport.totals.expected_production).toFixed(0))}
                            unit="عدد"
                            tone="indigo"
                            icon={<Gauge size={16} />}
                        />
                        <StatCard
                            label="کل ضایعات"
                            value={toPersianDigits(summaryReport.totals.waste.toLocaleString())}
                            unit="عدد"
                            tone="red"
                            icon={<AlertTriangle size={16} />}
                        />
                        <StatCard
                            label="ضایعات انتظاری"
                            value={toPersianDigits(Number(summaryReport.totals.expected_waste).toFixed(0))}
                            unit="عدد"
                            tone="amber"
                            icon={<AlertTriangle size={16} />}
                        />
                        <StatCard
                            label="راندمان"
                            value={
                                summaryReport.totals.efficiency === null
                                    ? "—"
                                    : `${toPersianDigits(summaryReport.totals.efficiency.toFixed(1))}٪`
                            }
                            tone="emerald"
                            icon={<BarChart3 size={16} />}
                        />
                    </div>

                    <ProductionBarChart
                        tabs={[{ id: 0, label: "روز" }, { id: 1, label: "هفته" }, { id: 2, label: "ماه" }, { id: 3, label: "سال" }]}
                        activeTab={summaryGroupBy}
                        onTab={setSummaryGroupBy}
                        title="روند تولید واقعی و انتظاری"
                        subtitle="مجموع همه ماشین‌ها در هر دوره"
                        data={(() => {
                            const map = new Map<string, { name: string; a: number; b: number }>();
                            summaryReport.machines.forEach((m) =>
                                m.periods.forEach((p) => {
                                    const cur = map.get(p.key) ?? { name: p.label, a: 0, b: 0 };
                                    cur.a += Number(p.produced);
                                    cur.b += Number(p.expected_production);
                                    map.set(p.key, cur);
                                }),
                            );
                            return Array.from(map.values());
                        })()}
                        seriesA={{ label: "تولید واقعی", color: "#3b82f6" }}
                        seriesB={{ label: "تولید انتظاری", color: "#a66cff" }}
                    />

                    {summaryReport.machines.length === 0 ? (
                        <div className="rounded-2xl border border-dashed border-gray-200 py-10 text-center text-[12px] text-gray-400 dark:border-white/[0.1]">
                            در این بازه هیچ رکوردی ثبت نشده است.
                        </div>
                    ) : (
                        summaryReport.machines.map((mch) => (
                            <div
                                key={mch.machine_id}
                                className="overflow-hidden rounded-2xl border border-black/[0.06] bg-white dark:border-white/[0.06] dark:bg-white/[0.02]"
                            >
                                <div className="flex items-center justify-between border-b border-black/5 bg-gray-50 px-4 py-3 dark:border-white/5 dark:bg-white/[0.03]">
                                    <div className="flex items-center gap-2.5">
                                        <div
                                            className={`flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br text-[13px] font-extrabold text-white ${gradientOf(
                                                mch.machine_id
                                            )}`}
                                        >
                                            {initialOf(mch.machine_name)}
                                        </div>
                                        <div>
                                            <p className="text-[13px] font-extrabold text-gray-900 dark:text-white">
                                                {mch.machine_name}
                                            </p>
                                            <p className="font-mono text-[10.5px] text-gray-400">
                                                {mch.machine_code}
                                            </p>
                                        </div>
                                    </div>
                                    <span className="text-[10.5px] font-bold text-gray-500">
                                        {toPersianDigits(mch.hours)} ساعت · راندمان{" "}
                                        {mch.efficiency === null
                                            ? "—"
                                            : `${toPersianDigits(mch.efficiency.toFixed(1))}٪`}
                                    </span>
                                </div>

                                <div className="overflow-x-auto">
                                    <table className="w-full border-collapse text-right text-[11.5px]">
                                        <thead>
                                            <tr className="border-b border-black/5 text-[10.5px] text-gray-400 dark:border-white/5">
                                                {[
                                                    "بازه",
                                                    "ساعت",
                                                    "تولید",
                                                    "انتظاری",
                                                    "ضایعات",
                                                    "انتظاری",
                                                    "راندمان",
                                                ].map((h, i) => (
                                                    <th key={i} className="whitespace-nowrap px-3 py-2 font-bold">
                                                        {h}
                                                    </th>
                                                ))}
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-black/5 dark:divide-white/5">
                                            {mch.periods.map((p) => (
                                                <tr
                                                    key={p.key}
                                                    className="hover:bg-black/[0.02] dark:hover:bg-white/[0.02]"
                                                >
                                                    <td className="whitespace-nowrap px-3 py-2 font-bold text-gray-700 dark:text-gray-200">
                                                        {toPersianDigits(p.label)}
                                                    </td>
                                                    <td className="whitespace-nowrap px-3 py-2 text-gray-500">
                                                        {toPersianDigits(p.hours)}
                                                    </td>
                                                    <td className="px-3 py-2 font-bold text-emerald-600 dark:text-emerald-400">
                                                        {toPersianDigits(p.produced.toLocaleString())}
                                                    </td>
                                                    <td className="px-3 py-2 text-gray-400">
                                                        {toPersianDigits(Number(p.expected_production).toFixed(0))}
                                                    </td>
                                                    <td className="px-3 py-2 font-bold text-red-500">
                                                        {toPersianDigits(p.waste)}
                                                    </td>
                                                    <td className="px-3 py-2 text-gray-400">
                                                        {toPersianDigits(Number(p.expected_waste).toFixed(0))}
                                                    </td>
                                                    <td className="px-3 py-2">
                                                        <EfficiencyBadge value={p.efficiency} />
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        ))
                    )}
                </div>
            ) : null}
        </section>
        </>
    );
}
