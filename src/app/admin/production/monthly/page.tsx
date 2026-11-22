"use client";

import { formatProductionInteger, formatProductionPercent, formatProductionHours, formatProductionLogHours } from "@/lib/productionFormat";

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
    MonthlyReportDay,
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
import { SortableTable } from "@/components/admin/production/sorting";

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
                <div>
                    <h2 className="flex items-center gap-2 text-[13px] font-extrabold text-gray-900 dark:text-white">
                    <CalendarDays size={15} className="text-indigo-500" />
                    گزارش ماهانه تولید
                </h2>
                    <p className="mt-1 text-[10.5px] text-gray-400">(تولید، ضایعات و راندمان هر نیرو در یک ماه (راندمان = واقعی ÷ انتظاری))</p>
                </div>
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
                            value={formatProductionHours(monthlyReport.totals.hours)}
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
                            value={formatProductionInteger(monthlyReport.totals.expected_production)}
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
                            value={formatProductionInteger(monthlyReport.totals.expected_waste)}
                            unit="عدد"
                            tone="amber"
                            icon={<AlertTriangle size={16} />}
                        />
                        <StatCard
                            label="راندمان"
                            value={
                                monthlyReport.totals.efficiency === null
                                    ? "—"
                                    : `${formatProductionPercent(monthlyReport.totals.efficiency)}٪`
                            }
                            tone="emerald"
                            icon={<BarChart3 size={16} />}
                        />
                    </div>

                    <ProductionBarChart
                        allLabels
                        title="تولید واقعی در برابر انتظاری (نیرو)"
                        subtitle="گزارش ماهانه به تفکیک کارمند"
                        data={monthlyReport.employees.map((e) => ({
                            name: e.employee_name,
                            a: Number(e.produced),
                            b: Number(e.expected_production),
                        }))}
                        seriesA={{ label: "تولید واقعی", hint: "تعداد واقعی تولید شده", color: "#3b82f6" }}
                        seriesB={{ label: "تولید انتظاری", hint: "مقدار مورد انتظار طبق استاندارد", color: "#8b5cf6" }}
                    />

                    <ProductionBarChart
                        allLabels
                        title="ضایعات واقعی در برابر انتظاری (نیرو)"
                        subtitle="گزارش ماهانه به تفکیک کارمند"
                        data={monthlyReport.employees.map((e) => ({
                            name: e.employee_name,
                            a: Number(e.waste),
                            b: Number(e.expected_waste),
                        }))}
                        seriesA={{ label: "ضایعات واقعی", hint: "تعداد واقعی ضایعات", color: "#c47d09" }}
                        seriesB={{ label: "ضایعات انتظاری", hint: "مقدار ضایعات مجاز طبق استاندارد", color: "#74a909" }}
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
                                                {formatProductionHours(emp.hours)} · راندمان{" "}
                                                {emp.efficiency === null
                                                    ? "—"
                                                    : `${formatProductionPercent(emp.efficiency)}٪`}
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
                                                {formatProductionHours(mch.hours)} · راندمان{" "}
                                                {mch.efficiency === null
                                                    ? "—"
                                                    : `${formatProductionPercent(mch.efficiency)}٪`}
                                            </span>
                                        </div>

                                        <SortableTable
                                            rows={mch.days}
                                            rowKey={(d) => d.log_id}
                                            initialSort={{ key: "date", dir: "asc" }}
                                            minWidth={980}
                                            columns={[
                                                { key: "date", label: "تاریخ", get: (d: MonthlyReportDay) => d.date, render: (d: MonthlyReportDay) => toPersianDigits(d.jalali_date), tdClass: "whitespace-nowrap text-gray-500 dark:text-gray-400" },
                                                { key: "product", label: "محصول", get: (d: MonthlyReportDay) => d.product_name, render: (d: MonthlyReportDay) => d.product_name || "—" },
                                                { key: "hours", label: "ساعت", get: (d: MonthlyReportDay) => Number(d.hours), firstDir: "desc", render: (d: MonthlyReportDay) => formatProductionLogHours(d.hours, d.start_time, d.end_time) },
                                                { key: "produced", label: "تولید", get: (d: MonthlyReportDay) => d.produced, firstDir: "desc", tdClass: "font-bold text-emerald-600 dark:text-emerald-400", render: (d: MonthlyReportDay) => toPersianDigits(d.produced.toLocaleString()) },
                                                { key: "ep", label: "انتظاری", get: (d: MonthlyReportDay) => Number(d.expected_production), firstDir: "desc", tdClass: "text-gray-400", render: (d: MonthlyReportDay) => formatProductionInteger(d.expected_production) },
                                                { key: "waste", label: "ضایعات", get: (d: MonthlyReportDay) => d.waste, firstDir: "desc", tdClass: "font-bold text-red-500", render: (d: MonthlyReportDay) => toPersianDigits(d.waste) },
                                                { key: "ew", label: "انتظاری", get: (d: MonthlyReportDay) => Number(d.expected_waste), firstDir: "desc", tdClass: "text-gray-400", render: (d: MonthlyReportDay) => formatProductionInteger(d.expected_waste) },
                                                { key: "eff", label: "راندمان", get: (d: MonthlyReportDay) => d.efficiency, firstDir: "desc", render: (d: MonthlyReportDay) => <EfficiencyBadge value={d.efficiency} /> },
                                                { key: "wc", label: "علت ضایعات", get: (d: MonthlyReportDay) => d.waste_cause_name, render: (d: MonthlyReportDay) => d.waste_cause_name || "—" },
                                                { key: "bc", label: "علت خرابی", get: (d: MonthlyReportDay) => d.breakdown_cause_name, render: (d: MonthlyReportDay) => d.breakdown_cause_name || "—" },
                                                { key: "dt", label: "توقف (دقیقه)", get: (d: MonthlyReportDay) => d.downtime_minutes ?? 0, firstDir: "desc", render: (d: MonthlyReportDay) => toPersianDigits(d.downtime_minutes ?? 0) },
                                                { key: "note", label: "توضیحات", sortable: false, render: (d: MonthlyReportDay) => d.note || "—", tdClass: "text-gray-400" },
                                            ]}
                                        />
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
