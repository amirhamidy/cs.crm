"use client";

import { useEffect, useMemo, useState } from "react";
import { Loader2, AlertTriangle, BarChart3, Gauge } from "lucide-react";
import { useTheme } from "next-themes";
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

interface DiscrepancyTotals {
    logs: number;
    produced: number;
    waste: number;
    expected_waste: number;
    waste_diff: number;
    waste_diff_percent: number | null;
}

interface DiscrepancyItem {
    cause_id: number | null;
    cause_name: string;
    waste_share_percent: number | null;
    totals: DiscrepancyTotals;
}

interface DiscrepancyReport {
    date_from: string;
    date_to: string;
    totals: DiscrepancyTotals;
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

    // پارتو: مرتب بر اساس ضایعات (بک‌اند مرتب می‌کند)، درصد تجمعی نسبت به کل ضایعات
    const data = useMemo(() => {
        const items = report?.items ?? [];
        const total = report?.totals.waste ?? 0;
        let acc = 0;
        return items.map((i) => {
            acc += i.totals.waste;
            return {
                name: i.cause_name,
                waste: i.totals.waste,
                cumulative: total ? Math.round((acc / total) * 1000) / 10 : 0,
            };
        });
    }, [report]);

    return (
        <section className="space-y-4">
            <h2 className="flex items-center gap-2 text-[13px] font-extrabold text-gray-900 dark:text-white">
                <AlertTriangle size={15} className="text-indigo-500" />
                گزارش علت‌ها (پارتو)
            </h2>
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
                    <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
                        <StatCard label="کل ضایعات" value={toPersianDigits(report.totals.waste.toLocaleString())} unit="عدد" tone="red" icon={<AlertTriangle size={16} />} />
                        <StatCard label="ضایعات استاندارد" value={toPersianDigits(Number(report.totals.expected_waste).toFixed(0))} unit="عدد" tone="indigo" icon={<Gauge size={16} />} />
                        <StatCard label="اختلاف از استاندارد" value={toPersianDigits(Number(report.totals.waste_diff).toFixed(0))} unit="عدد" tone="red" icon={<BarChart3 size={16} />} />
                        <StatCard label="تعداد ثبت" value={toPersianDigits(report.totals.logs)} unit="" tone="emerald" icon={<BarChart3 size={16} />} />
                    </div>

                    <ParetoChart data={data} />

                    <ProductionBarChart
                        title="ضایعات واقعی در برابر استاندارد"
                        subtitle="به تفکیک علت"
                        data={report.items.map((i) => ({
                            name: i.cause_name,
                            a: Number(i.totals.waste),
                            b: Number(i.totals.expected_waste),
                        }))}
                        seriesA={{ label: "ضایعات واقعی", color: "#ef4444" }}
                        seriesB={{ label: "ضایعات استاندارد", color: "#8b5cf6" }}
                    />

                    <div className="overflow-x-auto rounded-2xl border border-black/[0.06] bg-white dark:border-white/[0.06] dark:bg-white/[0.02]">
                        <table className="w-full border-collapse text-right text-[11.5px]">
                            <thead>
                                <tr className="border-b border-black/5 text-[10.5px] text-gray-400 dark:border-white/5">
                                    {["علت", "تعداد ثبت", "ضایعات", "استاندارد", "اختلاف", "سهم از کل"].map((h) => (
                                        <th key={h} className="whitespace-nowrap px-3 py-2 font-bold">{h}</th>
                                    ))}
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-black/5 dark:divide-white/5">
                                {report.items.map((i) => (
                                    <tr key={i.cause_id ?? "none"}>
                                        <td className="px-3 py-2 font-bold text-gray-700 dark:text-gray-200">{i.cause_name}</td>
                                        <td className="px-3 py-2 text-gray-500">{toPersianDigits(i.totals.logs)}</td>
                                        <td className="px-3 py-2 font-bold text-red-500">{toPersianDigits(i.totals.waste)}</td>
                                        <td className="px-3 py-2 text-gray-400">{toPersianDigits(Number(i.totals.expected_waste).toFixed(0))}</td>
                                        <td className="px-3 py-2 text-gray-500">{toPersianDigits(Number(i.totals.waste_diff).toFixed(0))}</td>
                                        <td className="px-3 py-2 text-gray-500">
                                            {i.waste_share_percent === null ? "—" : `${toPersianDigits(i.waste_share_percent.toFixed(1))}٪`}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            ) : null}
        </section>
    );
}
