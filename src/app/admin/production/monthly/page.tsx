"use client";

import { useEffect, useMemo, useState } from "react";
import {
    Factory,
    Loader2,
    TrendingUp,
    BarChart3,
    AlertTriangle,
    CalendarDays,
    Gauge,
} from "lucide-react";
import axiosInstance from "@/lib/axiosInstance";
import ProductionBarChart from "@/components/charts/ProductionBarChart";
import { toPersianDigits, JALALI_MONTHS } from "@/lib/jalali";
import {
    Option,
    MonthlyReport,
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
import { useProductionData } from "@/components/admin/production/ProductionContext";

export default function MonthlyPage() {
    const { employeeOptions } = useProductionData(["employees"]);

    const { jy: currentJy, jm: currentJm } = useMemo(() => currentJalaliYearMonth(), []);
    const [reportYear, setReportYear] = useState(currentJy);
    const [reportMonth, setReportMonth] = useState(currentJm);
    const [reportEmployeeId, setReportEmployeeId] = useState<number | null>(null);
    const [monthlyReport, setMonthlyReport] = useState<MonthlyReport | null>(null);
    const [monthlyLoading, setMonthlyLoading] = useState(false);
    const [monthlyError, setMonthlyError] = useState("");

    const monthOptions = useMemo<Option[]>(
        () => JALALI_MONTHS.map((name, idx) => ({ id: idx + 1, label: name, sub: "" })),
        []
    );

    async function loadMonthlyReport() {
        setMonthlyLoading(true);
        setMonthlyError("");
        try {
            const params: Record<string, string | number> = { year: reportYear, month: reportMonth };
            if (reportEmployeeId !== null) params.employee_id = reportEmployeeId;
            const res = await axiosInstance.get("/production/api/v1/report/monthly/", { params });
            setMonthlyReport(res.data as MonthlyReport);
        } catch (err) {
            setMonthlyError(parseBackendError(err, "دریافت گزارش ماهانه با خطا مواجه شد"));
            setMonthlyReport(null);
        } finally {
            setMonthlyLoading(false);
        }
    }

    useEffect(() => {
        loadMonthlyReport();
    }, [reportYear, reportMonth, reportEmployeeId]);

    return (
        <>
        <section className="space-y-4">
            <div className="flex flex-col items-start justify-between gap-3 sm:flex-row sm:items-center">
                <h2 className="flex items-center gap-2 text-[13px] font-extrabold text-gray-900 dark:text-white">
                    <CalendarDays size={15} className="text-indigo-500" />
                    گزارش ماهانه تولید
                </h2>
            </div>

            <div className="rounded-2xl border border-black/[0.06] bg-[#fafafa] p-4 dark:border-white/[0.06] dark:bg-white/[0.02]">
                <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
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
                    <NiceSelect
                        label="کارمند (اختیاری)"
                        placeholder="همه کارمندان"
                        emptyText="کارمندی یافت نشد"
                        options={employeeOptions}
                        value={reportEmployeeId}
                        onChange={setReportEmployeeId}
                    />
                </div>
            </div>

            {monthlyError && <ErrorBanner message={monthlyError} onClose={() => setMonthlyError("")} />}

            {monthlyLoading ? (
                <div className="flex justify-center py-10">
                    <Loader2 size={22} className="animate-spin text-indigo-500" />
                </div>
            ) : monthlyReport ? (
                <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
                        <StatCard
                            label="کل ساعت کار"
                            value={toPersianDigits(monthlyReport.totals.hours)}
                            unit="ساعت"
                            tone="indigo"
                            icon={<CalendarDays size={16} />}
                        />
                        <StatCard
                            label="کل تولید"
                            value={toPersianDigits(monthlyReport.totals.produced.toLocaleString())}
                            unit="عدد"
                            tone="emerald"
                            icon={<TrendingUp size={16} />}
                        />
                        <StatCard
                            label="تولید انتظاری"
                            value={toPersianDigits(Number(monthlyReport.totals.expected_production).toFixed(0))}
                            unit="عدد"
                            tone="indigo"
                            icon={<Gauge size={16} />}
                        />
                        <StatCard
                            label="کل ضایعات"
                            value={toPersianDigits(monthlyReport.totals.waste.toLocaleString())}
                            unit="عدد"
                            tone="red"
                            icon={<AlertTriangle size={16} />}
                        />
                        <StatCard
                            label="ضایعات انتظاری"
                            value={toPersianDigits(Number(monthlyReport.totals.expected_waste).toFixed(0))}
                            unit="عدد"
                            tone="amber"
                            icon={<AlertTriangle size={16} />}
                        />
                        <StatCard
                            label="راندمان"
                            value={
                                monthlyReport.totals.efficiency === null
                                    ? "—"
                                    : `${toPersianDigits(monthlyReport.totals.efficiency.toFixed(1))}٪`
                            }
                            tone="emerald"
                            icon={<BarChart3 size={16} />}
                        />
                    </div>

                    <ProductionBarChart
                        title="تولید واقعی در برابر انتظاری (نیرو)"
                        subtitle="گزارش ماهانه به تفکیک کارمند"
                        data={monthlyReport.employees.map((e) => ({
                            name: e.employee_name,
                            a: Number(e.produced),
                            b: Number(e.expected_production),
                        }))}
                        seriesA={{ label: "تولید واقعی", color: "#3b82f6" }}
                        seriesB={{ label: "تولید انتظاری", color: "#8b5cf6" }}
                    />

                    {monthlyReport.employees.length === 0 ? (
                        <div className="rounded-2xl border border-dashed border-gray-200 py-10 text-center text-[12px] text-gray-400 dark:border-white/[0.1]">
                            در این ماه هیچ رکوردی ثبت نشده است.
                        </div>
                    ) : (
                        monthlyReport.employees.map((emp) => (
                            <div
                                key={emp.employee_id}
                                className="overflow-hidden rounded-2xl border border-black/[0.06] bg-white dark:border-white/[0.06] dark:bg-white/[0.02]"
                            >
                                <div className="flex items-center justify-between border-b border-black/5 bg-gray-50 px-4 py-3 dark:border-white/5 dark:bg-white/[0.03]">
                                    <div className="flex items-center gap-2.5">
                                        <div
                                            className={`flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br text-[13px] font-extrabold text-white ${gradientOf(
                                                emp.employee_id
                                            )}`}
                                        >
                                            {initialOf(emp.employee_name)}
                                        </div>
                                        <div>
                                            <p className="text-[13px] font-extrabold text-gray-900 dark:text-white">
                                                {emp.employee_name}
                                            </p>
                                            <p className="text-[10.5px] text-gray-400">
                                                {toPersianDigits(emp.hours)} ساعت · راندمان{" "}
                                                {emp.efficiency === null
                                                    ? "—"
                                                    : `${toPersianDigits(emp.efficiency.toFixed(1))}٪`}
                                            </p>
                                        </div>
                                    </div>
                                </div>

                                {emp.machines.map((mch) => (
                                    <div
                                        key={mch.machine_id}
                                        className="border-b border-black/5 p-4 last:border-b-0 dark:border-white/5"
                                    >
                                        <div className="mb-3 flex items-center justify-between">
                                            <div className="flex items-center gap-2">
                                                <Factory size={13} className="text-indigo-500" />
                                                <span className="text-[12px] font-extrabold text-gray-800 dark:text-gray-100">
                                                    {mch.machine_name}
                                                </span>
                                                <span className="font-mono text-[10px] text-gray-400">
                                                    ({mch.machine_code})
                                                </span>
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
                                                            "تاریخ",
                                                            "ساعت",
                                                            "تولید",
                                                            "انتظاری",
                                                            "ضایعات",
                                                            "انتظاری",
                                                            "راندمان",
                                                            "توضیحات",
                                                        ].map((h, i) => (
                                                            <th key={i} className="whitespace-nowrap px-2 py-2 font-bold">
                                                                {h}
                                                            </th>
                                                        ))}
                                                    </tr>
                                                </thead>
                                                <tbody className="divide-y divide-black/5 dark:divide-white/5">
                                                    {mch.days.map((d) => (
                                                        <tr
                                                            key={d.log_id}
                                                            className="hover:bg-black/[0.02] dark:hover:bg-white/[0.02]"
                                                        >
                                                            <td className="whitespace-nowrap px-2 py-2 text-gray-500 dark:text-gray-400">
                                                                {toPersianDigits(d.jalali_date)}
                                                            </td>
                                                            <td className="whitespace-nowrap px-2 py-2 text-gray-500">
                                                                {toPersianDigits(d.hours)}
                                                            </td>
                                                            <td className="px-2 py-2 font-bold text-emerald-600 dark:text-emerald-400">
                                                                {toPersianDigits(d.produced.toLocaleString())}
                                                            </td>
                                                            <td className="px-2 py-2 text-gray-400">
                                                                {toPersianDigits(Number(d.expected_production).toFixed(0))}
                                                            </td>
                                                            <td className="px-2 py-2 font-bold text-red-500">
                                                                {toPersianDigits(d.waste)}
                                                            </td>
                                                            <td className="px-2 py-2 text-gray-400">
                                                                {toPersianDigits(Number(d.expected_waste).toFixed(0))}
                                                            </td>
                                                            <td className="px-2 py-2">
                                                                <EfficiencyBadge value={d.efficiency} />
                                                            </td>
                                                            <td className="px-2 py-2 text-gray-400">
                                                                {d.note || "—"}
                                                            </td>
                                                        </tr>
                                                    ))}
                                                </tbody>
                                            </table>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ))
                    )}
                </div>
            ) : null}
        </section>
        </>
    );
}
