"use client";

import { useEffect, useState } from "react";
import { Loader2 } from "lucide-react";
import axiosInstance from "@/lib/axiosInstance";
import { parseBackendError } from "@/components/admin/production/shared";
import ProductionBarChart from "@/components/charts/ProductionBarChart";
import { formatProductionInteger, formatProductionPercent } from "@/lib/productionFormat";

interface Emp { employee_name: string; produced: number; waste: number; efficiency: number | null; waste_percent: number | null }
interface Cause { cause_name: string; downtime_minutes: number; share_percent: number | null }
interface Highlights {
    production: { best: Emp | null; worst: Emp | null; ranked_count: number };
    waste: { lowest: Emp | null; highest: Emp | null; ranked_count: number };
    breakdown: { top_cause: Cause | null; total_minutes: number };
}
interface Downtime {
    machines?: { machine_id: number; machine_name: string; downtime_minutes: number }[];
    labels: string[];
    series: { downtime_minutes?: number[]; downtime_hours?: number[] };
    totals: { downtime_minutes: number; downtime_percent?: number | null };
}

function Row({ title, emp, tone }: { title: string; emp: Emp | null | undefined; tone: string }) {
    return (
        <div className="rounded-2xl border border-black/[0.06] p-3 dark:border-white/[0.06]">
            <p className="text-[10.5px] text-gray-400">{title}</p>
            <p className={`mt-1 text-[13px] font-extrabold ${tone}`}>{emp ? emp.employee_name : "—"}</p>
            {emp && (
                <p className="mt-0.5 text-[10.5px] text-gray-500">
                    تولید {formatProductionInteger(emp.produced)} · ضایعات {formatProductionInteger(emp.waste)}{emp.waste_percent != null && ` (${formatProductionPercent(emp.waste_percent)}٪)`}
                    {emp.efficiency != null && ` · بازده ${formatProductionPercent(emp.efficiency)}٪`}
                </p>
            )}
        </div>
    );
}

export default function HighlightsDowntime({ dateFrom, dateTo, machineId, productId, show = "both" }: {
    show?: "both" | "highlights" | "downtime"; dateFrom: string; dateTo: string; machineId: number | null; productId: number | null }) {
    const [hl, setHl] = useState<Highlights | null>(null);
    const [dt, setDt] = useState<Downtime | null>(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");
    const [pm, setPm] = useState<"produced" | "efficiency">("produced");
    const [wm, setWm] = useState<"waste" | "waste_percent">("waste");

    useEffect(() => {
        let alive = true;
        setError("");
        const span = (new Date(dateTo).getTime() - new Date(dateFrom).getTime()) / 86400000;
        if (!(span >= 0)) { setError("بازه‌ی تاریخ نامعتبر است."); setHl(null); setDt(null); return; }
        if (span > 3650) { setError("بازه‌ی تاریخ نباید بیشتر از ۱۰ سال باشد."); setHl(null); setDt(null); return; }
        setLoading(true);
        const base: Record<string, string> = { date_from: dateFrom, date_to: dateTo };
        if (machineId !== null) base.machine_id = String(machineId);
        const days = (new Date(dateTo).getTime() - new Date(dateFrom).getTime()) / 86400000;
        const hp = { ...base, production_metric: pm, waste_metric: wm, ...(productId !== null ? { product_id: String(productId) } : {}) };
        Promise.all([
            axiosInstance.get("/production/api/v1/report/highlights/", { params: hp }),
            axiosInstance.get("/production/api/v1/report/downtime/", { params: { ...base, group_by: days > 62 ? "month" : "day" } }),
        ])
            .then(([a, b]) => { if (alive) { setHl(a.data); setDt(b.data); } })
            .catch((e) => { if (alive) { setHl(null); setDt(null); setError(parseBackendError(e, "خطا در دریافت گزارش.")); } })
            .finally(() => { if (alive) setLoading(false); });
        return () => { alive = false; };
    }, [dateFrom, dateTo, machineId, productId, pm, wm]);

    if (loading) return <div className="flex justify-center py-6"><Loader2 size={18} className="animate-spin text-indigo-500" /></div>;
    if (error) return <p className="rounded-xl bg-red-50 px-3 py-2 text-[12px] font-bold text-red-600 dark:bg-red-500/10">{error}</p>;
    if (!hl && !dt) return null;
    const showHl = show !== "downtime";
    const showDt = show !== "highlights";

    const mins = dt?.series.downtime_minutes ?? [];
    return (
        <div className="space-y-4">
            {showHl && hl && (
                <div className="flex flex-wrap gap-4 text-[11px]">
                    {([["تولید", pm, setPm, [["produced", "تعداد"], ["efficiency", "بازده ٪"]]], ["ضایعات", wm, setWm, [["waste", "تعداد"], ["waste_percent", "درصد"]]]] as any[]).map(([t, cur, set, opts]) => (
                        <div key={t} className="flex items-center gap-1.5">
                            <span className="text-gray-400">معیار {t}:</span>
                            {opts.map(([v, l]: string[]) => (
                                <button key={v} type="button" onClick={() => set(v)} className={`rounded-full px-3 py-1 font-bold ${cur === v ? "bg-indigo-600 text-white" : "bg-gray-100 text-gray-500 dark:bg-white/[0.06]"}`}>{l}</button>
                            ))}
                        </div>
                    ))}
                </div>
            )}
            {showHl && hl && (
                <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
                    <Row title="بهترین اپراتور (تولید)" emp={hl.production.best} tone="text-emerald-600" />
                    {/* با یک اپراتور، بهترین و بدترین یکی است */}
                    <Row title="ضعیف‌ترین اپراتور (تولید)" emp={hl.production.ranked_count > 1 ? hl.production.worst : null} tone="text-red-500" />
                    <Row title="کمترین ضایعات" emp={hl.waste.lowest} tone="text-emerald-600" />
                    <Row title="بیشترین ضایعات" emp={hl.waste.ranked_count > 1 ? hl.waste.highest : null} tone="text-red-500" />
                    <div className="col-span-2 rounded-2xl border border-black/[0.06] p-3 lg:col-span-4 dark:border-white/[0.06]">
                        <p className="text-[10.5px] text-gray-400">بیشترین علت خرابی</p>
                        <p className="mt-1 text-[13px] font-extrabold text-amber-600">
                            {hl.breakdown.top_cause
                                ? `${hl.breakdown.top_cause.cause_name} — ${formatProductionInteger(hl.breakdown.top_cause.downtime_minutes)} دقیقه`
                                : "—"}
                        </p>
                    </div>
                </div>
            )}
            {showDt && dt && (
                <div className="rounded-2xl border border-black/[0.06] p-3 text-[12px] dark:border-white/[0.06]">
                    مجموع توقف: <b>{formatProductionInteger(dt.totals.downtime_minutes)}</b> دقیقه
                    {dt.totals.downtime_percent != null && <> · درصد توقف: <b>{formatProductionPercent(dt.totals.downtime_percent)}٪</b></>}
                </div>
            )}
            {showDt && dt && dt.labels.length > 0 && (
                <ProductionBarChart
                    allLabels
                    title="روند زمان توقف"
                    subtitle="دقیقه توقف در هر دوره"
                    data={dt.labels.map((name, i) => ({ name, a: Number(mins[i] ?? 0), b: 0 }))}
                    seriesA={{ label: "توقف (دقیقه)", color: "#f59e0b" }}
                    seriesB={{ label: "—", color: "#9ca3af" }}
                />
            )}
            {showDt && dt && dt.machines && dt.machines.length > 0 && (
                <ProductionBarChart
                    allLabels
                    title="توقف به تفکیک دستگاه"
                    subtitle="مجموع دقیقه توقف در بازه"
                    data={dt.machines.map((m) => ({ name: m.machine_name, a: Number(m.downtime_minutes ?? 0), b: 0 }))}
                    seriesA={{ label: "توقف (دقیقه)", color: "#ef4444" }}
                    seriesB={{ label: "—", color: "#9ca3af" }}
                />
            )}
        </div>
    );
}
