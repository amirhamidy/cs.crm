"use client";

import { useEffect, useState } from "react";
import { Loader2 } from "lucide-react";
import axiosInstance from "@/lib/axiosInstance";
import { formatProductionInteger, formatProductionPercent } from "@/lib/productionFormat";
import { toPersianDigits } from "@/lib/jalali";
import { ErrorBanner, parseBackendError } from "./shared";
import EmployeeWasteReport from "./EmployeeWasteReport";
import { SortableTable } from "./sorting";
import type { Col } from "./sorting";
import type { EmployeeRow, HighlightsReport } from "./reportTypes";

type ProductionMetric = "produced" | "efficiency";
type WasteMetric = "waste" | "waste_percent";

function Card({ title, emp, tone }: { title: string; emp: EmployeeRow | null; tone: string }) {
    return (
        <div className="rounded-2xl border border-black/[0.06] p-3 dark:border-white/[0.06]">
            <p className="text-[10.5px] text-gray-400">{title}</p>
            <p className={`mt-1 text-[13px] font-extrabold ${tone}`}>{emp ? emp.employee_name : "—"}</p>
            {emp && (
                <p className="mt-0.5 text-[10.5px] text-gray-500">
                    تولید {formatProductionInteger(emp.produced)} · ضایعات {formatProductionInteger(emp.waste)}
                    {emp.waste_percent != null && ` (${formatProductionPercent(emp.waste_percent)}٪)`}
                    {emp.efficiency != null && ` · بازده ${formatProductionPercent(emp.efficiency)}٪`}
                </p>
            )}
        </div>
    );
}

function Toggle<T extends string>({ title, value, onChange, options }: { title: string; value: T; onChange: (v: T) => void; options: [T, string][] }) {
    return (
        <div className="flex items-center gap-1.5">
            <span className="text-gray-400">{title}</span>
            {options.map(([v, l]) => (
                <button key={v} type="button" onClick={() => onChange(v)} className={`rounded-full px-3 py-1 font-bold ${value === v ? "bg-indigo-600 text-white" : "bg-gray-100 text-gray-500 dark:bg-white/[0.06]"}`}>
                    {l}
                </button>
            ))}
        </div>
    );
}

const productionCols: Col<EmployeeRow>[] = [
    { key: "rank", label: "رتبه", get: (r) => r.rank, render: (r) => toPersianDigits(r.rank ?? "—") },
    { key: "name", label: "کارمند", get: (r) => r.employee_name, tdClass: "font-bold text-gray-800 dark:text-gray-100" },
    { key: "produced", label: "تولید", get: (r) => r.produced, firstDir: "desc", tdClass: "font-bold text-emerald-600", render: (r) => formatProductionInteger(r.produced) },
    { key: "expected", label: "تولید انتظاری", get: (r) => r.expected_production, firstDir: "desc", tdClass: "text-gray-400", render: (r) => formatProductionInteger(r.expected_production) },
    { key: "eff", label: "بازده", get: (r) => r.efficiency, firstDir: "desc", render: (r) => (r.efficiency == null ? "—" : `${formatProductionPercent(r.efficiency)}٪`) },
    { key: "logs", label: "تعداد ثبت", get: (r) => r.logs, firstDir: "desc", render: (r) => formatProductionInteger(r.logs) },
];

export default function HighlightsPanel({
    dateFrom,
    dateTo,
    machineId,
    productId,
}: {
    dateFrom: string;
    dateTo: string;
    machineId: number | null;
    productId: number | null;
}) {
    const [data, setData] = useState<HighlightsReport | null>(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");
    const [pm, setPm] = useState<ProductionMetric>("produced");
    const [wm, setWm] = useState<WasteMetric>("waste");

    useEffect(() => {
        if (!dateFrom || !dateTo) return;
        let alive = true;
        setLoading(true);
        setError("");
        const params: Record<string, string> = { date_from: dateFrom, date_to: dateTo, production_metric: pm, waste_metric: wm };
        if (machineId !== null) params.machine_id = String(machineId);
        if (productId !== null) params.product_id = String(productId);
        axiosInstance
            .get("/production/api/v1/report/highlights/", { params })
            .then((res) => alive && setData(res.data as HighlightsReport))
            .catch((e) => {
                if (!alive) return;
                setData(null);
                setError(parseBackendError(e, "دریافت گزارش برترین‌ها با خطا مواجه شد"));
            })
            .finally(() => alive && setLoading(false));
        return () => {
            alive = false;
        };
    }, [dateFrom, dateTo, machineId, productId, pm, wm]);

    if (error) return <ErrorBanner message={error} onClose={() => setError("")} />;

    return (
        <div className="space-y-5">
            <div className="flex flex-wrap gap-4 text-[11px]">
                <Toggle<ProductionMetric> title="معیار تولید:" value={pm} onChange={setPm} options={[["produced", "تعداد"], ["efficiency", "بازده ٪"]]} />
                <Toggle<WasteMetric> title="معیار ضایعات:" value={wm} onChange={setWm} options={[["waste", "تعداد"], ["waste_percent", "درصد"]]} />
            </div>

            {loading && (
                <div className="flex justify-center py-8">
                    <Loader2 size={20} className="animate-spin text-indigo-500" />
                </div>
            )}

            {!loading && data && (
                <>
                    <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
                        <Card title="بهترین کارمند (تولید)" emp={data.production.best} tone="text-emerald-600" />
                        {/* با یک نفر، بهترین و بدترین یکی است */}
                        <Card title="ضعیف‌ترین کارمند (تولید)" emp={data.production.ranked_count > 1 ? data.production.worst : null} tone="text-red-500" />
                        <Card title="کمترین ضایعات" emp={data.waste.lowest} tone="text-emerald-600" />
                        <Card title="بیشترین ضایعات" emp={data.waste.ranked_count > 1 ? data.waste.highest : null} tone="text-red-500" />
                        <div className="col-span-2 rounded-2xl border border-black/[0.06] p-3 lg:col-span-4 dark:border-white/[0.06]">
                            <p className="text-[10.5px] text-gray-400">بیشترین علت خرابی دستگاه</p>
                            <p className="mt-1 text-[13px] font-extrabold text-amber-600">
                                {data.breakdown.top_cause
                                    ? `${data.breakdown.top_cause.cause_name} — ${formatProductionInteger(data.breakdown.top_cause.downtime_minutes)} دقیقه`
                                    : "—"}
                            </p>
                        </div>
                    </div>

                    <div className="space-y-2">
                        <h3 className="text-[13px] font-extrabold text-gray-900 dark:text-white">رتبه‌بندی تولید کارکنان</h3>
                        <SortableTable
                            rows={data.production.ranking}
                            columns={productionCols}
                            rowKey={(r) => r.employee_id}
                            initialSort={{ key: "rank", dir: "asc" }}
                            minWidth={560}
                            empty="در این بازه ثبتی وجود ندارد."
                        />
                    </div>

                    <EmployeeWasteReport ranking={data.waste.ranking} />
                </>
            )}
        </div>
    );
}
