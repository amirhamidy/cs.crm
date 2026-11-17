"use client";

import { useEffect, useMemo, useState } from "react";
import { toPersianDigits } from "@/lib/jalali";
import { Loader2, Scale, Factory, Target, TrendingUp, Trash2, RotateCcw } from "lucide-react";
import axiosInstance from "@/lib/axiosInstance";
import { useProductionData } from "@/components/admin/production/ProductionContext";
import { listAll } from "@/lib/api/_core";
import type { Product, Option } from "@/components/admin/production/shared";
import { parseBackendError, NiceSelect, JalaliDatePicker, currentJalaliYearMonth } from "@/components/admin/production/shared";
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
type Item = { product_id?: number; machine_id?: number; employee_id?: number; product_name?: string; machine_name?: string; operator_name?: string; name?: string; totals: Totals };
type Section = { totals: Totals; items: Item[] };
type VarianceReport = { labels: string[]; machines?: Section; operators?: Section; products?: Section };

const ENTITIES: { key: "machines" | "operators" | "products"; label: string }[] = [
    { key: "machines", label: "ماشین‌ها" },
    { key: "operators", label: "نیروها" },
    { key: "products", label: "محصولات" },
];

const ENTITY_OPTS: Option[] = [
    { id: 1, label: "همه (ماشین، نیرو، محصول)", sub: "all" },
    { id: 2, label: "فقط ماشین", sub: "machine" },
    { id: 3, label: "فقط نیرو", sub: "operator" },
    { id: 4, label: "فقط محصول", sub: "product" },
];
const GROUP_OPTS: Option[] = [
    { id: 1, label: "روزانه", sub: "day" },
    { id: 2, label: "هفتگی", sub: "week" },
    { id: 3, label: "ماهانه", sub: "month" },
    { id: 4, label: "سالانه", sub: "year" },
];
const MONTH_OPTS: Option[] = JALALI_MONTHS.map((m, i) => ({ id: i + 1, label: m, sub: "" }));
const fmt = (n: number | undefined) => (n === undefined || n === null ? "—" : Number(n).toLocaleString("fa-IR", { maximumFractionDigits: 1 }));

export default function VariancePage() {
    const { machineOptions, employeeOptions } = useProductionData(["machines", "employees"]);
    const [products, setProducts] = useState<Product[]>([]);
    useEffect(() => {
        listAll<Product>("/production/api/v1/product/", { is_active: true }).then(setProducts).catch(() => setProducts([]));
    }, []);
    const [from, setFrom] = useState("");
    const [to, setTo] = useState("");
    const [groupBy, setGroupBy] = useState<number | null>(3);
    const [entity, setEntity] = useState<number | null>(1);
    const [year, setYear] = useState<number | null>(null);
    const [month, setMonth] = useState<number | null>(null);
    const [productId, setProductId] = useState<number | null>(null);
    const [machineId, setMachineId] = useState<number | null>(null);
    const [employeeId, setEmployeeId] = useState<number | null>(null);
    const [data, setData] = useState<VarianceReport | null>(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");

    const yearOptions: Option[] = useMemo(() => {
        const cy = currentJalaliYearMonth().jy;
        return Array.from({ length: 7 }, (_, i) => cy + 1 - i).map((y) => ({ id: y, label: toPersianDigits(y), sub: "" }));
    }, []);
    const productOptions: Option[] = useMemo(() => products.map((p) => ({ id: p.id, label: p.name, sub: "" })), [products]);

    const usingYear = year !== null;

    useEffect(() => {
        const params: Record<string, string | number> = {
            entity: ENTITY_OPTS.find((o) => o.id === entity)?.sub || "all",
            group_by: GROUP_OPTS.find((o) => o.id === groupBy)?.sub || "month",
        };
        if (year) {
            params.year = year;
            if (month) params.month = month;
        } else {
            if (from) params.date_from = from;
            if (to) params.date_to = to;
        }
        if (productId) params.product_id = productId;
        if (machineId) params.machine_id = machineId;
        if (employeeId) params.employee_id = employeeId;
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
    }, [from, to, groupBy, entity, year, month, productId, machineId, employeeId]);

    function reset() {
        setFrom(""); setTo(""); setGroupBy(3); setEntity(1); setYear(null); setMonth(null);
        setProductId(null); setMachineId(null); setEmployeeId(null);
    }

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
                <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
                    <NiceSelect label="نوع گزارش" options={ENTITY_OPTS} value={entity} onChange={(v) => setEntity(v ?? 1)} placeholder="انتخاب" {...sel} />
                    <NiceSelect label="بازه‌بندی" options={GROUP_OPTS} value={groupBy} onChange={(v) => setGroupBy(v ?? 3)} placeholder="انتخاب" {...sel} />
                    <NiceSelect label="سال شمسی" options={yearOptions} value={year} onChange={(v) => { setYear(v); if (!v) setMonth(null); }} placeholder="همه (بازه دلخواه)" {...sel} />
                    <NiceSelect label="ماه شمسی" options={MONTH_OPTS} value={month} onChange={setMonth} placeholder="همه ماه‌ها" disabled={!usingYear} {...sel} />
                    <NiceSelect label="محصول" options={productOptions} value={productId} onChange={setProductId} placeholder="همه محصولات" {...sel} />
                    <NiceSelect label="ماشین" options={machineOptions} value={machineId} onChange={setMachineId} placeholder="همه ماشین‌ها" {...sel} />
                    <NiceSelect label="نیرو" options={employeeOptions} value={employeeId} onChange={setEmployeeId} placeholder="همه نیروها" {...sel} />
                    <div className="hidden lg:block" />
                    <div className={`col-span-1 lg:col-span-2 ${usingYear ? "pointer-events-none opacity-40" : ""}`}>
                        <JalaliDatePicker label="از تاریخ" value={from} onChange={setFrom} max={to || undefined} placeholder="شروع بازه" />
                    </div>
                    <div className={`col-span-1 lg:col-span-2 ${usingYear ? "pointer-events-none opacity-40" : ""}`}>
                        <JalaliDatePicker label="تا تاریخ" value={to} onChange={setTo} min={from || undefined} placeholder="پایان بازه" />
                    </div>
                </div>
                {usingYear && <p className="mt-3 text-[11px] text-amber-600">با انتخاب سال، بازه‌ی تاریخ نادیده گرفته می‌شود.</p>}
            </div>

            {error && <p className="rounded-2xl bg-red-500/10 px-4 py-3 text-[12px] font-bold text-red-600">{error}</p>}
            {loading && <div className="flex justify-center py-6"><Loader2 className="animate-spin text-gray-400" size={20} /></div>}

            {data &&
                ENTITIES.map(({ key, label }) => {
                    const section = data[key];
                    if (!section) return null;
                    const t = section.totals;
                    const cards = [
                        { l: "تولید", v: fmt(t?.produced), i: <Factory size={14} />, c: "text-blue-500 bg-blue-500/10" },
                        { l: "تولید مورد انتظار", v: fmt(t?.expected_production), i: <Target size={14} />, c: "text-indigo-500 bg-indigo-500/10" },
                        { l: "اختلاف تولید", v: fmt(t?.production_diff), i: <TrendingUp size={14} />, c: (t?.production_diff ?? 0) < 0 ? "text-red-500 bg-red-500/10" : "text-emerald-500 bg-emerald-500/10" },
                        { l: "اختلاف ضایعات", v: fmt(t?.waste_diff), i: <Trash2 size={14} />, c: (t?.waste_diff ?? 0) > 0 ? "text-red-500 bg-red-500/10" : "text-emerald-500 bg-emerald-500/10" },
                    ];
                    return (
                        <div key={key} className="space-y-3">
                            <h3 className="text-[13px] font-extrabold text-gray-900 dark:text-white">{label}</h3>
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
                            <div className="overflow-x-auto rounded-2xl border border-black/[0.06] dark:border-white/[0.06]">
                                <table className="w-full min-w-[720px] text-right text-[12px]">
                                    <thead className="bg-black/[0.02] text-gray-500 dark:bg-white/[0.03]">
                                        <tr>
                                            {["نام", "ساعت کار", "تولید", "انتظاری", "اختلاف تولید", "ضایعات", "ضایعات انتظاری", "اختلاف ضایعات"].map((h) => (
                                                <th key={h} className="px-3 py-2.5 font-bold">{h}</th>
                                            ))}
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {section.items.map((it, idx) => (
                                            <tr key={idx} className="border-t border-black/[0.04] dark:border-white/[0.04]">
                                                <td className="px-3 py-2.5 font-bold">{it.product_name ?? it.machine_name ?? it.operator_name ?? it.name ?? "—"}</td>
                                                <td className="px-3 py-2.5">{fmt(it.totals.hours)}</td>
                                                <td className="px-3 py-2.5">{fmt(it.totals.produced)}</td>
                                                <td className="px-3 py-2.5">{fmt(it.totals.expected_production)}</td>
                                                <td className={`px-3 py-2.5 font-bold ${it.totals.production_diff < 0 ? "text-red-600" : "text-emerald-600"}`}>{fmt(it.totals.production_diff)} ({fmt(it.totals.production_diff_percent)}٪)</td>
                                                <td className="px-3 py-2.5">{fmt(it.totals.waste)}</td>
                                                <td className="px-3 py-2.5">{fmt(it.totals.expected_waste)}</td>
                                                <td className={`px-3 py-2.5 font-bold ${it.totals.waste_diff > 0 ? "text-red-600" : "text-emerald-600"}`}>{fmt(it.totals.waste_diff)} ({fmt(it.totals.waste_diff_percent)}٪)</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    );
                })}
        </section>
    );
}
