"use client";

import { formatProductionInteger, formatProductionPercent, formatProductionHours } from "@/lib/productionFormat";

import { useEffect, useMemo, useState } from "react";
import {
    Loader2,
    TrendingUp,
    BarChart3,
    AlertTriangle,
    CalendarDays,
    Gauge,
    Users,
} from "lucide-react";
import axiosInstance from "@/lib/axiosInstance";
import ProductionBarChart from "@/components/charts/ProductionBarChart";
import { toPersianDigits, JALALI_MONTHS } from "@/lib/jalali";
import {
    Option,
    MachineMonthlyReport,
    gradientOf,
    initialOf,
    parseBackendError,
    currentJalaliYearMonth,
    INPUT_CLS,
    Field,
    NiceSelect,
    ErrorBanner,
    StatCard,
    EfficiencyBadge,
} from "@/components/admin/production/shared";

type ProductTotal = {
    name: string;
    produced: number;
    expected_production: number;
    waste: number;
    expected_waste: number;
};

type ProductVarianceResponse = {
    products?: {
        items: Array<{
            product_name?: string | null;
            totals: {
                produced: number;
                expected_production: number;
                waste: number;
                expected_waste: number;
            };
        }>;
    };
};

export default function MachineMonthlySection() {
    const { jy: currentJy, jm: currentJm } = useMemo(() => currentJalaliYearMonth(), []);
    const [reportYear, setReportYear] = useState(currentJy);
    const [reportMonth, setReportMonth] = useState(currentJm);
    const [machineMonthlyReport, setMachineMonthlyReport] = useState<MachineMonthlyReport | null>(null);
    const [machineMonthlyLoading, setMachineMonthlyLoading] = useState(false);
    const [machineMonthlyError, setMachineMonthlyError] = useState("");
    const [productTotals, setProductTotals] = useState<ProductTotal[]>([]);

    const monthOptions = useMemo<Option[]>(
        () => JALALI_MONTHS.map((name, idx) => ({ id: idx + 1, label: name, sub: "" })),
        []
    );

    async function loadMachineMonthlyReport() {
        setMachineMonthlyLoading(true);
        setMachineMonthlyError("");
        try {
            const [machineResult, productResult] = await Promise.allSettled([
                axiosInstance.get("/production/api/v1/report/machine/monthly/", {
                    params: { year: reportYear, month: reportMonth },
                }),
                axiosInstance.get("/production/api/v1/report/variance/", {
                    params: { year: reportYear, month: reportMonth, group_by: "month", entity: "product" },
                }),
            ]);
            if (machineResult.status === "rejected") throw machineResult.reason;
            setMachineMonthlyReport(machineResult.value.data as MachineMonthlyReport);
            if (productResult.status === "fulfilled") {
                const productData = productResult.value.data as ProductVarianceResponse;
                setProductTotals((productData.products?.items ?? []).map((item) => ({
                    name: item.product_name ?? "بدون محصول",
                    produced: item.totals.produced,
                    expected_production: item.totals.expected_production,
                    waste: item.totals.waste,
                    expected_waste: item.totals.expected_waste,
                })));
            } else {
                setProductTotals([]);
            }
        } catch (err) {
            setMachineMonthlyError(parseBackendError(err, "دریافت گزارش ماهانه ماشین با خطا مواجه شد"));
            setMachineMonthlyReport(null);
            setProductTotals([]);
        } finally {
            setMachineMonthlyLoading(false);
        }
    }

    useEffect(() => {
        loadMachineMonthlyReport();
    }, [reportYear, reportMonth]);

    return (
        <>
        <section className="space-y-4">
            <div className="flex flex-col items-start justify-between gap-3 sm:flex-row sm:items-center">
                <div>
                    <h2 className="flex items-center gap-2 text-[13px] font-extrabold text-gray-900 dark:text-white">
                    <Users size={15} className="text-indigo-500" />
                    گزارش ماهانه ماشین‌ها
                </h2>
                    <p className="mt-1 text-[10.5px] text-gray-400">(عملکرد ماهانه ماشین‌ها؛ تولید واقعی در برابر مقدار استاندارد)</p>
                </div>
            </div>

            <div className="rounded-2xl border border-black/[0.06] bg-[#fafafa] p-4 dark:border-white/[0.06] dark:bg-white/[0.02]">
                <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                    <Field label="سال (شمسی)">
                        <input
                            type="number"
                            dir="ltr"
                            min="1300"
                            max="1600"
                            value={reportYear}
                            onChange={(e) => setReportYear(parseInt(e.target.value, 10) || currentJy)}
                            className={`${INPUT_CLS} text-left font-mono`}
                        />
                    </Field>
                    <NiceSelect
                        label="ماه (شمسی)"
                        placeholder="انتخاب ماه"
                        emptyText="ماهی یافت نشد"
                        options={monthOptions}
                        value={reportMonth}
                        onChange={(id) => id !== null && setReportMonth(id)}
                    />
                </div>
            </div>

            {machineMonthlyError && (
                <ErrorBanner message={machineMonthlyError} onClose={() => setMachineMonthlyError("")} />
            )}

            {machineMonthlyLoading ? (
                <div className="flex justify-center py-10">
                    <Loader2 size={22} className="animate-spin text-indigo-500" />
                </div>
            ) : machineMonthlyReport ? (
                <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
                        <StatCard
                            label="کل ساعت کار"
                            value={formatProductionHours(machineMonthlyReport.totals.hours)}
                            tone="indigo"
                            icon={<CalendarDays size={16} />}
                        />
                        <StatCard
                            label="کل تولید"
                            value={toPersianDigits(machineMonthlyReport.totals.produced.toLocaleString())}
                            unit="عدد"
                            tone="emerald"
                            icon={<TrendingUp size={16} />}
                        />
                        <StatCard
                            label="تولید انتظاری"
                            value={formatProductionInteger(machineMonthlyReport.totals.expected_production)}
                            unit="عدد"
                            tone="indigo"
                            icon={<Gauge size={16} />}
                        />
                        <StatCard
                            label="کل ضایعات"
                            value={toPersianDigits(machineMonthlyReport.totals.waste.toLocaleString())}
                            unit="عدد"
                            tone="red"
                            icon={<AlertTriangle size={16} />}
                        />
                        <StatCard
                            label="ضایعات انتظاری"
                            value={formatProductionInteger(machineMonthlyReport.totals.expected_waste)}
                            unit="عدد"
                            tone="amber"
                            icon={<AlertTriangle size={16} />}
                        />
                        <StatCard
                            label="راندمان"
                            value={
                                machineMonthlyReport.totals.efficiency === null
                                    ? "—"
                                    : `${formatProductionPercent(machineMonthlyReport.totals.efficiency)}٪`
                            }
                            tone="emerald"
                            icon={<BarChart3 size={16} />}
                        />
                    </div>

                    <div className="grid grid-cols-1 gap-4">
                        <ProductionBarChart
                            title="تولید ماهانه ماشین‌ها"
                            subtitle="واقعی در برابر انتظاری"
                            data={machineMonthlyReport.machines.map((m) => ({
                                name: m.machine_name,
                                a: Number(m.produced),
                                b: Number(m.expected_production),
                            }))}
                            seriesA={{ label: "تولید واقعی", hint: "تعداد واقعی تولید شده", color: "#3b82f6" }}
                            seriesB={{ label: "تولید انتظاری", hint: "مقدار مورد انتظار طبق استاندارد", color: "#8b5cf6" }}
                        />
                        <ProductionBarChart
                            title="انحراف از مقدار انتظاری"
                            subtitle="تفاوت تولید و ضایعات با مقدار انتظاری (واقعی − انتظاری)"
                            signed
                            data={machineMonthlyReport.machines.map((m) => ({
                                name: m.machine_name,
                                a: Math.round(Number(m.produced) - Number(m.expected_production)),
                                b: Math.round(Number(m.waste) - Number(m.expected_waste)),
                            }))}
                            seriesA={{ label: "انحراف تولید", hint: "واقعی − انتظاری؛ منفی یعنی کمتر از انتظار", color: "#3b82f6" }}
                            seriesB={{ label: "انحراف ضایعات", hint: "ضایعات واقعی − انتظاری؛ مثبت یعنی بدتر", color: "#8b5cf6" }}
                        />
                    </div>

                    <div className="grid grid-cols-1 gap-4">
                        <ProductionBarChart
                            title="تولید به تفکیک محصول"
                            subtitle="واقعی در برابر انتظاری"
                            data={productTotals.map((p) => ({ name: p.name, a: p.produced, b: p.expected_production }))}
                            seriesA={{ label: "تولید واقعی", hint: "تعداد واقعی تولید شده", color: "#3b82f6" }}
                            seriesB={{ label: "تولید انتظاری", hint: "مقدار مورد انتظار طبق استاندارد", color: "#8b5cf6" }}
                        />
                        <ProductionBarChart
                            title="ضایعات به تفکیک محصول"
                            subtitle="واقعی در برابر انتظاری"
                            data={productTotals.map((p) => ({ name: p.name, a: p.waste, b: p.expected_waste }))}
                            seriesA={{ label: "ضایعات واقعی", color: "#ef4444" }}
                            seriesB={{ label: "ضایعات انتظاری", color: "#f59e0b" }}
                        />
                    </div>

                    {machineMonthlyReport.machines.length === 0 ? (
                        <div className="rounded-2xl border border-dashed border-gray-200 py-10 text-center text-[12px] text-gray-400 dark:border-white/[0.1]">
                            ماشینی در این ماه ثبت نشده است.
                        </div>
                    ) : (
                        machineMonthlyReport.machines.map((mch) => (
                            <div
                                key={mch.machine_id}
                                className={`overflow-hidden rounded-2xl border bg-white dark:bg-white/[0.02] ${mch.is_active
                                    ? "border-black/[0.06] dark:border-white/[0.06]"
                                    : "border-slate-300/40 opacity-75 dark:border-white/[0.08]"
                                    }`}
                            >
                                <div className="flex flex-col gap-2 border-b border-black/5 bg-gray-50 px-4 py-3 sm:flex-row sm:items-center sm:justify-between dark:border-white/5 dark:bg-white/[0.03]">
                                    <div className="flex items-center gap-2.5">
                                        <div
                                            className={`flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br text-[13px] font-extrabold text-white ${gradientOf(
                                                mch.machine_id
                                            )}`}
                                        >
                                            {initialOf(mch.machine_name)}
                                        </div>
                                        <div>
                                            <div className="flex items-center gap-2">
                                                <p className="text-[13px] font-extrabold text-gray-900 dark:text-white">
                                                    {mch.machine_name}
                                                </p>
                                                <span
                                                    className={`rounded-md border px-1.5 py-0.5 text-[9.5px] font-bold ${mch.is_active
                                                        ? "border-emerald-500/25 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
                                                        : "border-slate-400/30 bg-slate-400/10 text-slate-500 dark:text-slate-400"
                                                        }`}
                                                >
                                                    {mch.is_active ? "فعال" : "غیرفعال"}
                                                </span>
                                            </div>
                                            <p className="font-mono text-[10.5px] text-gray-400">
                                                {mch.machine_code} · {toPersianDigits(mch.days_worked)} روز کار
                                            </p>
                                        </div>
                                    </div>
                                    <span className="text-[10.5px] font-bold text-gray-500">
                                        {formatProductionHours(mch.hours)} · راندمان{" "}
                                        {mch.efficiency === null
                                            ? "—"
                                            : `${formatProductionPercent(mch.efficiency)}٪`}
                                    </span>
                                </div>

                                {mch.products.length > 0 && (
                                    <div className="overflow-x-auto border-b border-black/5 dark:border-white/5">
                                        <table className="w-full border-collapse text-right text-[11.5px]">
                                            <thead>
                                                <tr className="border-b border-black/5 text-[10.5px] text-gray-400 dark:border-white/5">
                                                    {["محصول", "ساعت", "تولید", "انتظاری", "ضایعات", "انتظاری", "راندمان"].map((h, i) => (
                                                        <th key={i} className="whitespace-nowrap px-3 py-2 font-bold">{h}</th>
                                                    ))}
                                                </tr>
                                            </thead>
                                            <tbody className="divide-y divide-black/5 dark:divide-white/5">
                                                {mch.products.map((pr) => (
                                                    <tr key={pr.product_id ?? "none"} className="hover:bg-black/[0.02] dark:hover:bg-white/[0.02]">
                                                        <td className="whitespace-nowrap px-3 py-2 font-extrabold text-gray-800 dark:text-gray-100">
                                                            {pr.product_name ?? "بدون محصول"}
                                                            {pr.product_code && <span className="mr-1 font-mono text-[10px] font-normal text-gray-400">({pr.product_code})</span>}
                                                        </td>
                                                        <td className="whitespace-nowrap px-3 py-2 text-gray-500">{formatProductionHours(pr.hours)}</td>
                                                        <td className="px-3 py-2 font-bold text-emerald-600 dark:text-emerald-400">{toPersianDigits(pr.produced.toLocaleString())}</td>
                                                        <td className="px-3 py-2 text-gray-400">{formatProductionInteger(pr.expected_production)}</td>
                                                        <td className="px-3 py-2 font-bold text-red-500">{toPersianDigits(pr.waste)}</td>
                                                        <td className="px-3 py-2 text-gray-400">{formatProductionInteger(pr.expected_waste)}</td>
                                                        <td className="px-3 py-2"><EfficiencyBadge value={pr.efficiency} /></td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                )}

                                {mch.operators.length === 0 ? (
                                    <div className="px-4 py-6 text-center text-[11.5px] text-gray-400">
                                        در این ماه اپراتوری روی این ماشین کار نکرده است.
                                    </div>
                                ) : (
                                    <div className="overflow-x-auto">
                                        <table className="w-full border-collapse text-right text-[11.5px]">
                                            <thead>
                                                <tr className="border-b border-black/5 text-[10.5px] text-gray-400 dark:border-white/5">
                                                    {[
                                                        "اپراتور",
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
                                                {mch.operators.map((op) => (
                                                    <tr
                                                        key={op.employee_id}
                                                        className="hover:bg-black/[0.02] dark:hover:bg-white/[0.02]"
                                                    >
                                                        <td className="whitespace-nowrap px-3 py-2 font-extrabold text-gray-800 dark:text-gray-100">
                                                            {op.employee_name}
                                                        </td>
                                                        <td className="whitespace-nowrap px-3 py-2 text-gray-500">
                                                            {formatProductionHours(op.hours)}
                                                        </td>
                                                        <td className="px-3 py-2 font-bold text-emerald-600 dark:text-emerald-400">
                                                            {toPersianDigits(op.produced.toLocaleString())}
                                                        </td>
                                                        <td className="px-3 py-2 text-gray-400">
                                                            {formatProductionInteger(op.expected_production)}
                                                        </td>
                                                        <td className="px-3 py-2 font-bold text-red-500">
                                                            {toPersianDigits(op.waste)}
                                                        </td>
                                                        <td className="px-3 py-2 text-gray-400">
                                                            {formatProductionInteger(op.expected_waste)}
                                                        </td>
                                                        <td className="px-3 py-2">
                                                            <EfficiencyBadge value={op.efficiency} />
                                                        </td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                )}
                            </div>
                        ))
                    )}
                </div>
            ) : null}
        </section>
        </>
    );
}
