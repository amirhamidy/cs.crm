"use client";

import { useEffect, useState } from "react";
import { Loader2, Search } from "lucide-react";
import axiosInstance from "@/lib/axiosInstance";
import { parseBackendError } from "@/components/admin/production/shared";

type Group<T> = { count: number; results: T[] };
type SearchResult = {
    q: string;
    machines: Group<{ id: number; name: string; code: string }>;
    products: Group<{ id: number; name: string; code: string }>;
    operators: Group<{ id: number; first_name?: string; last_name?: string; personnel_code?: string }>;
    causes: Group<{ id: number; name: string; kind_display?: string }>;
    logs: Group<{ id: number; date: string; product_name?: string; machine_name?: string }>;
};

const SECTIONS: { key: keyof Omit<SearchResult, "q">; label: string }[] = [
    { key: "machines", label: "ماشین‌ها" },
    { key: "products", label: "محصولات" },
    { key: "operators", label: "اپراتورها" },
    { key: "causes", label: "علت‌ها" },
    { key: "logs", label: "ثبت‌های تولید" },
];

export default function ProductionSearchPage() {
    const [input, setInput] = useState("");
    const [q, setQ] = useState("");
    const [types, setTypes] = useState<string[]>([]);
    const [limit, setLimit] = useState(10);
    const [data, setData] = useState<SearchResult | null>(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");

    useEffect(() => {
        const term = q.trim();
        if (!term) {
            setData(null);
            return;
        }
        setLoading(true);
        setError("");
        axiosInstance
            .get("/production/api/v1/search/", { params: { q: term, limit, ...(types.length ? { types: types.join(",") } : {}) } })
            .then((res) => setData(res.data as SearchResult))
            .catch((err) => {
                setError(parseBackendError(err, "جستجو با خطا مواجه شد"));
                setData(null);
            })
            .finally(() => setLoading(false));
    }, [q, types, limit]);

    const describe = (key: string, r: Record<string, unknown>): string => {
        if (key === "operators")
            return String(r.full_name ?? r.employee_name ?? (`${r.first_name ?? ""} ${r.last_name ?? ""}`.trim() || r.username || r.name || `#${r.id}`));
        if (key === "logs") return `${r.date} · ${r.employee_name ?? "—"} · ${r.machine_name ?? "—"} · ${r.product_name ?? "—"}`;
        if (key === "causes") return `${r.name ?? ""}${r.kind_display ? ` (${r.kind_display})` : r.kind ? ` (${r.kind === "breakdown" ? "خرابی" : "ضایعات"})` : ""}`;
        return `${r.name ?? ""}${r.code ? ` (${r.code})` : ""}`;
    };

    return (
        <section className="space-y-4">
            <h2 className="flex items-center gap-2 text-[13px] font-extrabold text-gray-900 dark:text-white">
                <Search size={15} className="text-indigo-500" />
                جستجوی یکجا
            </h2>
            <p className="text-[12px] text-gray-500">
                نام ماشین، محصول، اپراتور، علت یا تاریخ ثبت (مثلاً «۱۴۰۵/۰۷/۰۹ رضا») را وارد کنید. چند کلمه همه باید پیدا شوند.
            </p>
            <form
                className="flex gap-2"
                onSubmit={(e) => {
                    e.preventDefault();
                    setQ(input);
                }}
            >
                <div className="relative min-w-0 w-full sm:w-64 sm:flex-none"><Search size={14} className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-gray-400" /><input
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    placeholder="جستجو..."
                    className="h-9 w-full rounded-full border border-gray-100 bg-gray-50 pr-9 pl-9 text-[11px] font-semibold text-gray-800 outline-none transition focus:border-indigo-400 dark:border-white/[0.06] dark:bg-white/[0.03] dark:text-white"
                /></div>
                <button type="submit" className="h-10 rounded-xl bg-blue-600 px-4 text-[13px] font-bold text-white">
                    جستجو
                </button>
            </form>

            <div className="flex flex-wrap items-center gap-2 text-[12px]">
                {SECTIONS.map(({ key, label }) => {
                    const on = types.includes(key);
                    return (
                        <button
                            key={key}
                            type="button"
                            onClick={() => setTypes(on ? types.filter((t) => t !== key) : [...types, key])}
                            className={`rounded-full border px-3 py-1 font-bold ${on ? "border-blue-600 bg-blue-600 text-white" : "border-black/10 text-gray-600 dark:border-white/10 dark:text-gray-300"}`}
                        >
                            {label}
                        </button>
                    );
                })}
                <span className="text-gray-400">{types.length === 0 ? "(همه)" : ""}</span>
                <select value={limit} onChange={(e) => setLimit(Number(e.target.value))} className="mr-auto h-8 rounded-lg border border-black/10 bg-white px-2 dark:border-white/10 dark:bg-white/[0.04] dark:text-white">
                    {[10, 25, 50].map((n) => (
                        <option key={n} value={n}>{n} نتیجه در هر گروه</option>
                    ))}
                </select>
            </div>

            {error && <p className="text-[12px] text-red-600">{error}</p>}
            {loading && <Loader2 className="animate-spin text-gray-400" size={18} />}

            {data &&
                SECTIONS.map(({ key, label }) => {
                    const group = data[key] as Group<Record<string, unknown>> | undefined;
                    if (!group) return null;
                    return (
                        <div key={key} className="rounded-2xl border border-black/[0.06] p-4 dark:border-white/[0.06]">
                            <h3 className="mb-2 text-[13px] font-bold text-gray-900 dark:text-white">
                                {label} <span className="text-gray-400">({group.count})</span>
                            </h3>
                            {group.count > group.results.length && (
                                <p className="mb-1 text-[11px] text-gray-400">نمایش {group.results.length} از {group.count} — برای نتایج بیشتر تعداد را زیاد کنید.</p>
                            )}
                            {group.results.length === 0 ? (
                                <p className="text-[12px] text-gray-400">نتیجه‌ای یافت نشد</p>
                            ) : (
                                <ul className="space-y-1 text-[12px] text-gray-700 dark:text-gray-300">
                                    {group.results.map((r, idx) => (
                                        <li key={String(r.id ?? idx)}>{describe(key, r)}</li>
                                    ))}
                                </ul>
                            )}
                        </div>
                    );
                })}
        </section>
    );
}
