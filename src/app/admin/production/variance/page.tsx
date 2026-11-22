"use client";

import { formatProductionInteger, formatProductionPercent, formatProductionHours } from "@/lib/productionFormat";

import { useEffect, useMemo, useState } from "react";
import { toPersianDigits } from "@/lib/jalali";
import { Loader2, Scale, Factory, Target, TrendingUp, Trash2, RotateCcw, Clock, Gauge } from "lucide-react";
import ProductionBarChart from "@/components/charts/ProductionBarChart";
import axiosInstance from "@/lib/axiosInstance";
import { useProductionData } from "@/components/admin/production/ProductionContext";
import { listAll } from "@/lib/api/_core";
import type { Product, Option } from "@/components/admin/production/shared";
import { parseBackendError, NiceSelect, JalaliDatePicker, currentJalaliYearMonth, alignToPeriod, currentMonthRange } from "@/components/admin/production/shared";
import { JALALI_MONTHS } from "@/lib/jalali";

type Totals = {
    hours: number;
    produced: number;
    expected_production: number;
    production_diff: number;
    production_diff_percent: number;
    waste: number;
    expected_waste: number;
    waste_diff: number;
    waste_diff_percent: number;
};
type Item = { product_id?: number; machine_id?: number; employee_id?: number; product_name?: string; machine_name?: string; employee_name?: string; name?: string; totals: Totals };
type Section = { totals: Totals; items: Item[] };
type VarianceReport = { labels: string[]; machines?: Section; operators?: Section; products?: Section };

type Focus = "operators" | "machines" | "products";
const FOCUS_OPTS: { key: Focus; label: string; filter: string }[] = [
    { key: "operators", label: "نیرو", filter: "employee_id" },
    { key: "machines", label: "ماشین", filter: "machine_id" },
    { key: "products", label: "محصول", filter: "product_id" },
];
const GROUP_OPTS: Option[] = [
    { id: 1, label: "روزانه", sub: "day" },
    { id: 2, label: "هفتگی", sub: "week" },
    { id: 3, label: "ماهانه", sub: "month" },
    { id: 4, label: "سالانه", sub: "year" },
];
const MONTH_OPTS: Option[] = JALALI_MONTHS.map((m, i) => ({ id: i + 1, label: m, sub: "" }));
const fmt = (n: number | undefined) => formatProductionInteger(n);

export default function VariancePage() {
    const { machineOptions, employeeOptions } = useProductionData(["machines", "employees"]);
    const [products, setProducts] = useState<Product[]>([]);
    useEffect(() => {
        listAll<Product>("/production/api/v1/product/", { is_active: true }).then(setProducts).catch(() => setProducts([]));
    }, []);
    const [from, setFrom] = useState(() => currentMonthRange().from);
    const [to, setTo] = useState(() => currentMonthRange().to);
    const [groupBy, setGroupBy] = useState<number | null>(3);
    const [focus, setFocus] = useState<Focus>("operators");
    const [selectedId, setSelectedId] = useState<number | null>(null);
    const [year, setYear] = useState<number | null>(null);
    const [month, setMonth] = useState<number | null>(null);
    const [data, setData] = useState<VarianceReport | null>(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");

    const yearOptions: Option[] = useMemo(() => {
        const cy = currentJalaliYearMonth().jy;
        return Array.from({ length: 7 }, (_, i) => cy + 1 - i).map((y) => ({ id: y, label: toPersianDigits(y), sub: "" }));
    }, []);
    const productOptions: Option[] = useMemo(() => products.map((p) => ({ id: p.id, label: p.name, sub: "" })), [products]);

    const usingYear = year !== null;
    const unit = (GROUP_OPTS.find((o) => o.id === groupBy)?.sub || "month") as "day" | "week" | "month" | "year";
    const changeFrom = (v: string) => setFrom(v ? alignToPeriod(v, unit, "start") : "");
    const changeTo = (v: string) => setTo(v ? alignToPeriod(v, unit, "end") : "");
    const changeGroup = (v: number | null) => {
        const g = v ?? 3;
        const u = (GROUP_OPTS.find((o) => o.id === g)?.sub || "month") as "day" | "week" | "month" | "year";
        setGroupBy(g);
        if (from) setFrom(alignToPeriod(from, u, "start"));
        if (to) setTo(alignToPeriod(to, u, "end"));
    };

    useEffect(() => {
        const params: Record<string, string | number> = {
            entity: "all",
            group_by: GROUP_OPTS.find((o) => o.id === groupBy)?.sub || "month",
        };
        if (year) {
            params.year = year;
            if (month) params.month = month;
        } else {
            if (from) params.date_from = from;
            if (to) params.date_to = to;
        }
        if (selectedId) params[FOCUS_OPTS.find((f) => f.key === focus)!.filter] = selectedId;
        setLoading(true);
        setError("");
        axiosInstance
            .get("/production/api/v1/report/variance/", { params })
            .then((res) => setData(res.data as VarianceReport))
            .catch((err) => {
                setError(parseBackendError(err, "دریافت گزارش با خطا مواجه شد"));
                setData(null);
            })
            .finally(() => setLoading(false));
    }, [from, to, groupBy, focus, selectedId, year, month]);

    function reset() {
        { const r = currentMonthRange(); setFrom(r.from); setTo(r.to); } setGroupBy(3); setFocus("operators"); setSelectedId(null); setYear(null); setMonth(null);
    }

    const focusOptions: Option[] = focus === "operators" ? employeeOptions : focus === "machines" ? machineOptions : productOptions;
    const focusLabel = FOCUS_OPTS.find((f) => f.key === focus)!.label;
    const selectedName = selectedId ? focusOptions.find((o) => o.id === selectedId)?.label : undefined;
    // با انتخاب یک مورد، تفکیک بر اساس دو بخش دیگر؛ بدون انتخاب، مقایسه‌ی همه‌ی موارد همان بخش
    const shownKeys: Focus[] = selectedId ? FOCUS_OPTS.filter((f) => f.key !== focus).map((f) => f.key) : [focus];
    const itemName = (it: Item) => it.product_name || it.machine_name || it.employee_name || it.name || "—";

    const sel = { emptyText: "موردی نیست" };

    return (
        <section className="space-y-5">
            <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                    <h2 className="flex items-center gap-2 text-[14px] font-extrabold text-gray-900 dark:text-white">
                        <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-indigo-500/10"><Scale size={16} className="text-indigo-500" /></span>
                        اختلاف تولید و ضایعات
                    </h2>
                    <p className="mt-1.5 text-[11.5px] text-gray-400">مقدار واقعی در برابر استاندارد؛ اختلاف مثبت یعنی بیشتر از حد انتظار.</p>
                </div>
                <button type="button" onClick={reset} className="flex h-9 items-center gap-1.5 rounded-full border border-black/[0.08] px-4 text-[11px] font-bold text-gray-500 transition-colors hover:bg-black/[0.03] dark:border-white/[0.1] dark:hover:bg-white/[0.05]">
                    <RotateCcw size={12} /> بازنشانی
                </button>
            </div>

            <div className="rounded-3xl border border-black/[0.06] bg-white/60 p-4 dark:border-white/[0.06] dark:bg-white/[0.02]">
                <div className="flex flex-wrap gap-3">
                    <div className="min-w-[170px] flex-1 basis-[170px]">
                        <span className="mb-1.5 block text-[11px] font-bold text-gray-500">مشاهده بر اساس</span>
                        <div className="flex rounded-xl border border-black/[0.06] bg-[#fafafa] p-1 dark:border-white/[0.06] dark:bg-white/[0.03]">
                            {FOCUS_OPTS.map((f) => (
                                <button key={f.key} type="button" onClick={() => { setFocus(f.key); setSelectedId(null); }}
                                    className={`flex-1 rounded-lg px-3 py-1.5 text-[11.5px] font-extrabold transition-colors ${focus === f.key ? "bg-indigo-500 text-white shadow-sm" : "text-gray-500 hover:text-gray-800 dark:hover:text-gray-200"}`}>
                                    {f.label}
                                </button>
                            ))}
                        </div>
                    </div>
                    <div className="min-w-[170px] flex-1 basis-[170px]"><NiceSelect label={focusLabel} options={focusOptions} value={selectedId} onChange={setSelectedId} placeholder={`همه (مقایسه ${focusLabel}‌ها)`} {...sel} /></div>
                    <div className="min-w-[170px] flex-1 basis-[170px]"><NiceSelect label="بازه‌بندی" options={GROUP_OPTS} value={groupBy} onChange={changeGroup} placeholder="انتخاب" {...sel} /></div>
                    <div className="min-w-[170px] flex-1 basis-[170px]"><NiceSelect label="سال شمسی" options={yearOptions} value={year} onChange={(v) => { setYear(v); if (!v) setMonth(null); }} placeholder="همه (بازه دلخواه)" {...sel} /></div>
                    <div className="min-w-[170px] flex-1 basis-[170px]"><NiceSelect label="ماه شمسی" options={MONTH_OPTS} value={month} onChange={setMonth} placeholder="همه ماه‌ها" disabled={!usingYear} {...sel} /></div>
                    
                    
                    
                </div>
                <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-2">
                    <div className={`${usingYear ? "pointer-events-none opacity-40" : ""}`}>
                        <JalaliDatePicker label="از تاریخ" value={from} onChange={changeFrom} max={to || undefined} placeholder="شروع بازه" />
                    </div>
                    <div className={`${usingYear ? "pointer-events-none opacity-40" : ""}`}>
                        <JalaliDatePicker label="تا تاریخ" value={to} onChange={changeTo} min={from || undefined} placeholder="پایان بازه" />
                    </div>
                </div>
                {usingYear && <p className="mt-3 text-[11px] text-amber-600">با انتخاب سال، بازه‌ی تاریخ نادیده گرفته می‌شود.</p>}
            </div>

            {error && <p className="rounded-2xl bg-red-500/10 px-4 py-3 text-[12px] font-bold text-red-600">{error}</p>}
            {loading && <div className="flex justify-center py-6"><Loader2 className="animate-spin text-gray-400" size={20} /></div>}

            {data && data[focus] && (() => {
                const t = data[focus]!.totals;
                const eff = Number(t?.expected_production) ? (Number(t.produced) / Number(t.expected_production)) * 100 : null;
                const cards = [
                    { l: "ساعت کار", v: formatProductionHours(t?.hours), i: <Clock size={14} />, c: "text-gray-500 bg-gray-500/10" },
                    { l: "تولید", v: fmt(t?.produced), i: <Factory size={14} />, c: "text-blue-500 bg-blue-500/10" },
                    { l: "تولید مورد انتظار", v: fmt(t?.expected_production), i: <Target size={14} />, c: "text-indigo-500 bg-indigo-500/10" },
                    { l: "اختلاف تولید", v: `${fmt(t?.production_diff)} (${formatProductionPercent(t?.production_diff_percent)}٪)`, i: <TrendingUp size={14} />, c: (t?.production_diff ?? 0) < 0 ? "text-red-500 bg-red-500/10" : "text-emerald-500 bg-emerald-500/10" },
                    { l: "ضایعات", v: fmt(t?.waste), i: <Trash2 size={14} />, c: "text-amber-600 bg-amber-500/10" },
                    { l: "ضایعات انتظاری", v: fmt(t?.expected_waste), i: <Target size={14} />, c: "text-lime-600 bg-lime-500/10" },
                    { l: "اختلاف ضایعات", v: `${fmt(t?.waste_diff)} (${formatProductionPercent(t?.waste_diff_percent)}٪)`, i: <Trash2 size={14} />, c: (t?.waste_diff ?? 0) > 0 ? "text-red-500 bg-red-500/10" : "text-emerald-500 bg-emerald-500/10" },
                    { l: "راندمان", v: eff === null ? "—" : `${formatProductionPercent(eff)}٪`, i: <Gauge size={14} />, c: eff === null ? "text-gray-400 bg-gray-500/10" : eff >= 100 ? "text-emerald-500 bg-emerald-500/10" : eff >= 80 ? "text-amber-500 bg-amber-500/10" : "text-red-500 bg-red-500/10" },
                ];
                return (
                    <div className="space-y-4">
                        <h3 className="text-[13px] font-extrabold text-gray-900 dark:text-white">
                            {selectedName ? `آمار ${focusLabel}: ${selectedName}` : `آمار کل ${focusLabel}‌ها`}
                        </h3>
                        <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
                            {cards.map((c) => (
                                <div key={c.l} className="flex items-center gap-3 rounded-2xl border border-black/[0.06] p-3 dark:border-white/[0.06]">
                                    <span className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl ${c.c}`}>{c.i}</span>
                                    <div className="min-w-0">
                                        <div className="truncate text-[10.5px] text-gray-400">{c.l}</div>
                                        <div className="text-[14px] font-extrabold text-gray-900 dark:text-white">{c.v}</div>
                                    </div>
                                </div>
                            ))}
                        </div>

                        {shownKeys.map((key) => {
                            const section = data[key];
                            if (!section) return null;
                            const label = FOCUS_OPTS.find((f) => f.key === key)!.label;
                            const sub = selectedName ? `به تفکیک ${label} برای ${selectedName}` : `مقایسه‌ی ${label}‌ها`;
                            return (
                                <div key={key} className="space-y-3">
                                    <div className="grid grid-cols-1 gap-3 xl:grid-cols-2">
                                        <ProductionBarChart
                                            allLabels
                                            title={`تولید واقعی در برابر انتظاری (${label})`}
                                            subtitle={sub}
                                            data={section.items.map((it) => ({ name: itemName(it), a: Number(it.totals.produced), b: Number(it.totals.expected_production) }))}
                                            seriesA={{ label: "تولید واقعی", hint: "تعداد واقعی تولید شده", color: "#3b82f6" }}
                                            seriesB={{ label: "تولید انتظاری", hint: "مقدار مورد انتظار طبق استاندارد", color: "#8b5cf6" }}
                                        />
                                        <ProductionBarChart
                                            allLabels
                                            title={`ضایعات واقعی در برابر انتظاری (${label})`}
                                            subtitle={sub}
                                            data={section.items.map((it) => ({ name: itemName(it), a: Number(it.totals.waste), b: Number(it.totals.expected_waste) }))}
                                            seriesA={{ label: "ضایعات واقعی", hint: "تعداد واقعی ضایعات", color: "#c47d09" }}
                                            seriesB={{ label: "ضایعات انتظاری", hint: "مقدار ضایعات مجاز طبق استاندارد", color: "#74a909" }}
                                        />
                                    </div>
                                    <div className="overflow-x-auto rounded-2xl border border-black/[0.06] dark:border-white/[0.06]">
                                        <table className="w-full min-w-[720px] text-right text-[12px]">
                                            <thead className="bg-black/[0.02] text-gray-500 dark:bg-white/[0.03]">
                                                <tr>
                                                    {[label, "ساعت کار", "تولید", "انتظاری", "اختلاف تولید", "ضایعات", "ضایعات انتظاری", "اختلاف ضایعات"].map((h) => (
                                                        <th key={h} className="px-3 py-2.5 font-bold">{h}</th>
                                                    ))}
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {section.items.length === 0 ? (
                                                    <tr><td colSpan={8} className="px-3 py-6 text-center text-gray-400">در این بازه هیچ رکوردی ثبت نشده است.</td></tr>
                                                ) : section.items.map((it, idx) => (
                                                    <tr key={idx} className="border-t border-black/[0.04] dark:border-white/[0.04]">
                                                        <td className="px-3 py-2.5 font-bold">{itemName(it)}</td>
                                                        <td className="px-3 py-2.5">{formatProductionHours(it.totals.hours)}</td>
                                                        <td className="px-3 py-2.5">{fmt(it.totals.produced)}</td>
                                                        <td className="px-3 py-2.5">{fmt(it.totals.expected_production)}</td>
                                                        <td className={`px-3 py-2.5 font-bold ${it.totals.production_diff < 0 ? "text-red-600" : "text-emerald-600"}`}>{fmt(it.totals.production_diff)} ({formatProductionPercent(it.totals.production_diff_percent)}٪)</td>
                                                        <td className="px-3 py-2.5">{fmt(it.totals.waste)}</td>
                                                        <td className="px-3 py-2.5">{fmt(it.totals.expected_waste)}</td>
                                                        <td className={`px-3 py-2.5 font-bold ${it.totals.waste_diff > 0 ? "text-red-600" : "text-emerald-600"}`}>{fmt(it.totals.waste_diff)} ({formatProductionPercent(it.totals.waste_diff_percent)}٪)</td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                );
            })()}
        </section>
    );
}
