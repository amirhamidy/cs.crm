"use client";

import { useEffect, useState } from "react";
import { Loader2, Scale } from "lucide-react";
import axiosInstance from "@/lib/axiosInstance";
import { useProductionData } from "@/components/admin/production/ProductionContext";
import { listAll } from "@/lib/api/_core";
import type { Product } from "@/components/admin/production/shared";
import { parseBackendError } from "@/components/admin/production/shared";

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

const cls = "h-10 rounded-xl border border-black/[0.08] bg-white px-3 text-[13px] dark:border-white/[0.1] dark:bg-white/[0.04] dark:text-white";
const fmt = (n: number | undefined) => (n === undefined || n === null ? "—" : Number(n).toLocaleString("fa-IR", { maximumFractionDigits: 1 }));

export default function VariancePage() {
    const [from, setFrom] = useState("");
    const [to, setTo] = useState("");
    const { machineOptions, employeeOptions } = useProductionData(["machines", "employees"]);
    const [products, setProducts] = useState<Product[]>([]);
    useEffect(() => {
        listAll<Product>("/production/api/v1/product/", { is_active: true }).then(setProducts).catch(() => setProducts([]));
    }, []);
    const [groupBy, setGroupBy] = useState("month");
    const [entity, setEntity] = useState("all");
    const [year, setYear] = useState("");
    const [month, setMonth] = useState("");
    const [productId, setProductId] = useState("");
    const [machineId, setMachineId] = useState("");
    const [employeeId, setEmployeeId] = useState("");
    const [data, setData] = useState<VarianceReport | null>(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");

    useEffect(() => {
        const params: Record<string, string> = { entity, group_by: groupBy };
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

    return (
        <section className="space-y-4">
            <h2 className="flex items-center gap-2 text-[13px] font-extrabold text-gray-900 dark:text-white">
                <Scale size={15} className="text-indigo-500" />
                گزارش اختلاف تولید و ضایعات
            </h2>
            <p className="text-[12px] text-gray-500">
                اختلاف واقعی با استاندارد: مثبت یعنی بیشتر از حد انتظار. اگر سال شمسی را بنویسید، بازه‌ی تاریخ میلادی نادیده گرفته می‌شود.
            </p>
            <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
                <select value={entity} onChange={(e) => setEntity(e.target.value)} className={cls}>
                    <option value="all">همه (ماشین، نیرو، محصول)</option>
                    <option value="machine">فقط ماشین</option>
                    <option value="operator">فقط نیرو</option>
                    <option value="product">فقط محصول</option>
                </select>
                <select value={groupBy} onChange={(e) => setGroupBy(e.target.value)} className={cls}>
                    <option value="day">روزانه</option>
                    <option value="week">هفتگی</option>
                    <option value="month">ماهانه</option>
                    <option value="year">سالانه</option>
                </select>
                <input type="number" placeholder="سال شمسی (مثلاً ۱۴۰۵)" value={year} onChange={(e) => setYear(e.target.value)} className={cls} />
                <input type="number" min={1} max={12} placeholder="ماه شمسی (اختیاری)" value={month} onChange={(e) => setMonth(e.target.value)} disabled={!year} className={cls} />
                <select value={productId} onChange={(e) => setProductId(e.target.value)} className={cls}>
                    <option value="">همه محصولات</option>
                    {products.map((p) => ({ id: p.id, label: p.name })).map((o) => (
                        <option key={o.id} value={o.id}>{o.label}</option>
                    ))}
                </select>
                <select value={machineId} onChange={(e) => setMachineId(e.target.value)} className={cls}>
                    <option value="">همه ماشین‌ها</option>
                    {machineOptions.map((o) => (
                        <option key={o.id} value={o.id}>{o.label}</option>
                    ))}
                </select>
                <select value={employeeId} onChange={(e) => setEmployeeId(e.target.value)} className={cls}>
                    <option value="">همه نیروها</option>
                    {employeeOptions.map((o) => (
                        <option key={o.id} value={o.id}>{o.label}</option>
                    ))}
                </select>
                <input type="date" value={from} onChange={(e) => setFrom(e.target.value)} className={cls} />
                <input type="date" value={to} onChange={(e) => setTo(e.target.value)} className={cls} />
            </div>

            {error && <p className="text-[12px] text-red-600">{error}</p>}
            {loading && <Loader2 className="animate-spin text-gray-400" size={18} />}

            {data &&
                ENTITIES.map(({ key, label }) => {
                    const section = data[key];
                    if (!section) return null;
                    return (
                        <div key={key} className="overflow-x-auto rounded-2xl border border-black/[0.06] dark:border-white/[0.06]">
                            <div className="px-4 py-3 text-[13px] font-bold text-gray-900 dark:text-white">{label}</div>
                            <table className="w-full text-right text-[12px]">
                                <thead className="bg-black/[0.02] text-gray-500 dark:bg-white/[0.03]">
                                    <tr>
                                        {["نام", "ساعت کار", "تولید", "تولید مورد انتظار", "اختلاف تولید", "ضایعات", "ضایعات مورد انتظار", "اختلاف ضایعات"].map((h) => (
                                            <th key={h} className="px-3 py-2 font-bold">{h}</th>
                                        ))}
                                    </tr>
                                </thead>
                                <tbody>
                                    {section.items.map((it, idx) => (
                                        <tr key={idx} className="border-t border-black/[0.04] dark:border-white/[0.04]">
                                            <td className="px-3 py-2 font-bold">{it.product_name ?? it.machine_name ?? it.operator_name ?? it.name ?? "—"}</td>
                                            <td className="px-3 py-2">{fmt(it.totals.hours)}</td>
                                            <td className="px-3 py-2">{fmt(it.totals.produced)}</td>
                                            <td className="px-3 py-2">{fmt(it.totals.expected_production)}</td>
                                            <td className={`px-3 py-2 font-bold ${it.totals.production_diff < 0 ? "text-red-600" : "text-emerald-600"}`}>{fmt(it.totals.production_diff)} ({fmt(it.totals.production_diff_percent)}٪)</td>
                                            <td className="px-3 py-2">{fmt(it.totals.waste)}</td>
                                            <td className="px-3 py-2">{fmt(it.totals.expected_waste)}</td>
                                            <td className={`px-3 py-2 font-bold ${it.totals.waste_diff > 0 ? "text-red-600" : "text-emerald-600"}`}>{fmt(it.totals.waste_diff)} ({fmt(it.totals.waste_diff_percent)}٪)</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    );
                })}
        </section>
    );
}
