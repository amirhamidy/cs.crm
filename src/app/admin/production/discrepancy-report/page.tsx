"use client";

import { formatProductionInteger, formatProductionPercent, formatProductionHours, sumProductionDecimals } from "@/lib/productionFormat";

import { useEffect, useMemo, useState } from "react";
import { Loader2, AlertTriangle, BarChart3, Gauge } from "lucide-react";
import { useTheme } from "next-themes";
import HighlightsDowntime from "@/components/admin/production/HighlightsDowntime";
import ParetoChart from "@/components/charts/ParetoChart";
import ProductionBarChart from "@/components/charts/ProductionBarChart";
import axiosInstance from "@/lib/axiosInstance";
import { listAll } from "@/lib/api/_core";
import { toPersianDigits, pad2 } from "@/lib/jalali";
import {
    Option,
    Product,
    parseBackendError,
    NiceSelect,
    ErrorBanner,
    StatCard,
} from "@/components/admin/production/shared";
import { useProductionData } from "@/components/admin/production/ProductionContext";
import { SortableTable } from "@/components/admin/production/sorting";

interface CauseMetrics {
    logs: number;
    hours?: number | string;
    produced?: number;
    waste?: number;
    expected_waste?: number;
    waste_diff?: number;
    waste_diff_percent?: number | null;
    downtime_minutes?: number;
    downtime_hours?: number;
    downtime_percent?: number | null;
}

interface DiscrepancyItem {
    cause_id: number | null;
    cause_name: string;
    share_percent: number | null;
    totals: CauseMetrics;
}

interface CauseChart {
    labels: string[];
    values: number[];
    percents: (number | null)[];
    cumulative_percents: (number | null)[];
}

interface DiscrepancyReport {
    chart?: CauseChart;
    kind: "waste" | "breakdown";
    date_from: string;
    date_to: string;
    totals: CauseMetrics;
    items: DiscrepancyItem[];
}

const SPANS: Option[] = [
    { id: 7, label: "۷ روز اخیر", sub: "" },
    { id: 30, label: "۳۰ روز اخیر", sub: "" },
    { id: 90, label: "۹۰ روز اخیر", sub: "" },
    { id: 365, label: "۳۶۵ روز اخیر", sub: "" },
];

const fmtDate = (d: Date) => `${d.getFullYear()}-${pad2(d.getMonth() + 1)}-${pad2(d.getDate())}`;

export default function DiscrepancyReportPage() {
    const { machineOptions } = useProductionData(["machines"]);
    const { resolvedTheme } = useTheme();
    const dark = resolvedTheme === "dark";

    const [span, setSpan] = useState<number | null>(30);
    const [causeKind, setCauseKind] = useState<"waste" | "breakdown">("waste");
    const [machineId, setMachineId] = useState<number | null>(null);
    const [productId, setProductId] = useState<number | null>(null);
    const [productOptions, setProductOptions] = useState<Option[]>([]);
    const [report, setReport] = useState<DiscrepancyReport | null>(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");

    useEffect(() => {
        listAll<Product>("/production/api/v1/product/")
            .then((rows) =>
                setProductOptions(rows.map((p) => ({ id: p.id, label: p.name, sub: p.code }))),
            )
            .catch(() => setProductOptions([]));
    }, []);

    useEffect(() => {
        (async () => {
            setLoading(true);
            setError("");
            try {
                const to = new Date();
                const from = new Date();
                from.setDate(from.getDate() - ((span ?? 30) - 1));
                const params: Record<string, string> = {
                    date_from: fmtDate(from),
                    date_to: fmtDate(to),
                };
                if (machineId !== null) params.machine_id = String(machineId);
                if (productId !== null) params.product_id = String(productId);
                params.kind = causeKind;
                const res = await axiosInstance.get("/production/api/v1/report/cause/", { params });
                setReport(res.data as DiscrepancyReport);
            } catch (err) {
                setError(parseBackendError(err, "دریافت گزارش علت‌ها با خطا مواجه شد"));
                setReport(null);
            } finally {
                setLoading(false);
            }
        })();
    }, [span, machineId, productId, causeKind]);

    const data = useMemo(() => {
        const c = report?.chart;
        if (!c) return [];
        return c.labels.map((name, i) => ({
            name,
            waste: Number(c.values[i] ?? 0),
            cumulative: Math.round(Number(c.cumulative_percents[i] ?? 0)),
        }));
    }, [report]);

    return (
        <section className="space-y-4">
            <div>
                <h2 className="flex items-center gap-2 text-[13px] font-extrabold text-gray-900 dark:text-white">
                <AlertTriangle size={15} className="text-indigo-500" />
                گزارش علت‌ها (پارتو)
            </h2>
                <p className="mt-1 text-[10.5px] text-gray-400">(علت‌های ضایعات و توقف؛ نمودار پارتو نشان می‌دهد کدام علت‌ها بیشترین سهم را دارند (قانون ۸۰/۲۰))</p>
            </div>
            <p className="text-[12px] text-gray-500">
                {causeKind === "waste"
                    ? "علت‌های ضایعات: کدام علت بیشترین ضایعات اضافه بر استاندارد را ایجاد کرده است."
                    : "علت‌های خرابی ماشین: کدام علت بیشترین زمان توقف را داشته است."}
            </p>
            <div className="flex gap-2">
                {(
                    [
                        ["waste", "علت ضایعات"],
                        ["breakdown", "علت خرابی ماشین"],
                    ] as const
                ).map(([v, label]) => (
                    <button
                        key={v}
                        type="button"
                        onClick={() => setCauseKind(v)}
                        className={`h-8 rounded-full px-3.5 text-[12px] font-bold transition-colors ${
                            causeKind === v
                                ? "bg-blue-600 text-white"
                                : "bg-black/[0.04] text-gray-600 hover:bg-black/[0.07] dark:bg-white/[0.06] dark:text-gray-300"
                        }`}
                    >
                        {label}
                    </button>
                ))}
            </div>

            <div className="rounded-2xl border border-black/[0.06] bg-[#fafafa] p-4 dark:border-white/[0.06] dark:bg-white/[0.02]">
                <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
                    <NiceSelect
                        label="بازه"
                        placeholder="انتخاب بازه"
                        emptyText="گزینه‌ای یافت نشد"
                        options={SPANS}
                        value={span}
                        onChange={setSpan}
                    />
                    <NiceSelect
                        label="ماشین (اختیاری)"
                        placeholder="همه ماشین‌ها"
                        emptyText="ماشینی یافت نشد"
                        options={machineOptions}
                        value={machineId}
                        onChange={setMachineId}
                    />
                    <NiceSelect
                        label="محصول (اختیاری)"
                        placeholder="همه محصولات"
                        emptyText="محصولی یافت نشد"
                        options={productOptions}
                        value={productId}
                        onChange={setProductId}
                    />
                </div>
            </div>

            {error && <ErrorBanner message={error} onClose={() => setError("")} />}

            {loading ? (
                <div className="flex justify-center py-10">
                    <Loader2 size={22} className="animate-spin text-indigo-500" />
                </div>
            ) : report ? (
                <div className="space-y-4">
                    <HighlightsDowntime dateFrom={report.date_from} dateTo={report.date_to} machineId={machineId} productId={productId} />
                    {causeKind === "waste" ? (
                        <>
                            <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
                                <StatCard label="کل ضایعات" value={formatProductionInteger(report.totals.waste)} unit="عدد" tone="red" icon={<AlertTriangle size={16} />} />
                                <StatCard label="ضایعات استاندارد" value={formatProductionInteger(report.totals.expected_waste)} unit="عدد" tone="indigo" icon={<Gauge size={16} />} />
                                <StatCard label="اختلاف از استاندارد" value={formatProductionInteger(report.totals.waste_diff)} unit="عدد" tone="red" icon={<BarChart3 size={16} />} />
                                <StatCard label="تعداد ثبت" value={formatProductionInteger(report.totals.logs)} unit="" tone="emerald" icon={<BarChart3 size={16} />} />
                            </div>
                            <ParetoChart data={data} valueLabel="ضایعات" />
                            <ProductionBarChart
                        allLabels
                                title="ضایعات واقعی در برابر استاندارد"
                                subtitle="به تفکیک علت"
                                data={report.items.map((item) => ({
                                    name: item.cause_name,
                                    a: Number(item.totals.waste ?? 0),
                                    b: Number(item.totals.expected_waste ?? 0),
                                }))}
                                seriesA={{ label: "ضایعات واقعی", color: "#ef4444" }}
                                seriesB={{ label: "ضایعات استاندارد", color: "#8b5cf6" }}
                            />
                            <SortableTable
                                rows={report.items}
                                rowKey={(item) => item.cause_id ?? "none"}
                                initialSort={{ key: "waste", dir: "desc" }}
                                minWidth={620}
                                columns={[
                                    { key: "cause", label: "علت", get: (item) => item.cause_name, tdClass: "font-bold text-gray-700 dark:text-gray-200" },
                                    { key: "logs", label: "تعداد ثبت", get: (item) => item.totals.logs, firstDir: "desc", render: (item) => formatProductionInteger(item.totals.logs) },
                                    { key: "waste", label: "ضایعات", get: (item) => item.totals.waste ?? 0, firstDir: "desc", tdClass: "font-bold text-red-500", render: (item) => formatProductionInteger(item.totals.waste) },
                                    { key: "expected", label: "استاندارد", get: (item) => item.totals.expected_waste ?? 0, firstDir: "desc", tdClass: "text-gray-400", render: (item) => formatProductionInteger(item.totals.expected_waste) },
                                    { key: "diff", label: "اختلاف", get: (item) => item.totals.waste_diff ?? 0, firstDir: "desc", render: (item) => formatProductionInteger(item.totals.waste_diff) },
                                    { key: "share", label: "سهم از کل", get: (item) => item.share_percent, firstDir: "desc", render: (item) => (item.share_percent == null ? "—" : `${formatProductionPercent(item.share_percent)}٪`) },
                                ]}
                            />
                        </>
                    ) : (
                        <>
                            <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
                                <StatCard label="کل زمان توقف" value={formatProductionHours((report.totals.downtime_minutes ?? 0) / 60)} tone="red" icon={<AlertTriangle size={16} />} />
                                <StatCard label="ساعت کار مرتبط" value={formatProductionHours(report.totals.hours)} tone="indigo" icon={<Gauge size={16} />} />
                                <StatCard label="درصد توقف" value={report.totals.downtime_percent == null ? "—" : formatProductionPercent(report.totals.downtime_percent)} unit="٪" tone="amber" icon={<BarChart3 size={16} />} />
                                <StatCard label="تعداد ثبت" value={formatProductionInteger(report.totals.logs)} tone="emerald" icon={<BarChart3 size={16} />} />
                            </div>
                            <ParetoChart data={data} title="نمودار پارتو زمان توقف" subtitle="زمان توقف دستگاه به تفکیک علت و درصد تجمعی" valueLabel="توقف (دقیقه)" />
                            <SortableTable
                                rows={report.items}
                                rowKey={(item) => item.cause_id ?? "none"}
                                initialSort={{ key: "minutes", dir: "desc" }}
                                minWidth={520}
                                columns={[
                                    { key: "cause", label: "علت خرابی", get: (item) => item.cause_name, tdClass: "font-bold text-gray-700 dark:text-gray-200" },
                                    { key: "logs", label: "تعداد ثبت", get: (item) => item.totals.logs, firstDir: "desc", render: (item) => formatProductionInteger(item.totals.logs) },
                                    { key: "minutes", label: "مدت توقف", get: (item) => item.totals.downtime_minutes ?? 0, firstDir: "desc", tdClass: "font-bold text-red-500", render: (item) => `${formatProductionInteger(item.totals.downtime_minutes)} دقیقه` },
                                    { key: "share", label: "سهم از کل توقف", get: (item) => item.share_percent, firstDir: "desc", render: (item) => (item.share_percent == null ? "—" : `${formatProductionPercent(item.share_percent)}٪`) },
                                ]}
                            />
                        </>
                    )}
                </div>
            ) : null}
        </section>
    );
}
