"use client";

import { Bar, BarChart, Cell, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import type { TopCustomerRow } from "@/types/crm";
import { toNumber } from "@/lib/crm/format";

const COLORS = ["#60a5fa", "#818cf8", "#a78bfa", "#2dd4bf", "#34d399", "#fbbf24", "#fb923c", "#fb7185", "#f472b6", "#9ca3af"];

const tipStyle = {
    background: "rgba(17,24,39,0.95)",
    border: "1px solid rgba(255,255,255,0.1)",
    borderRadius: 12,
    fontSize: 12,
    color: "#fff",
};

function Panel({ title, hint, children }: { title: string; hint: string; children: React.ReactNode }) {
    return (
        <div className="rounded-2xl border border-gray-100 bg-white p-4 shadow-sm dark:border-white/5 dark:bg-gray-950">
            <h3 className="text-[14px] font-semibold text-gray-900 dark:text-white">{title}</h3>
            <p className="mb-3 mt-0.5 text-[11.5px] text-gray-500 dark:text-gray-400">{hint}</p>
            <div className="h-[260px]" dir="ltr">{children}</div>
        </div>
    );
}

export default function TopCustomersCharts({ rows, by }: { rows: TopCustomerRow[]; by: "amount" | "quantity" }) {
    const unit = by === "amount" ? "ریال" : "کیلوگرم";
    const data = rows.map((r) => ({
        name: r.full_name || r.company_name,
        value: toNumber(by === "amount" ? r.total_amount : r.total_quantity_kg),
        count: r.sales_count,
    }));
    const total = data.reduce((s, d) => s + d.value, 0) || 1;
    const fmt = (v: number) => v.toLocaleString("fa-IR");

    return (
        <div className="mb-4 grid grid-cols-1 gap-4 lg:grid-cols-3" dir="rtl">
            <div className="lg:col-span-2">
                <Panel title="مقایسه مشتریان برتر" hint="هر میله مجموع خرید یک مشتری است؛ میله بلندتر یعنی خرید بیشتر.">
                    <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={data} layout="vertical" margin={{ left: 10, right: 10 }}>
                            <XAxis type="number" hide />
                            <YAxis type="category" dataKey="name" width={110} tick={{ fontSize: 11, fill: "#9ca3af" }} axisLine={false} tickLine={false} />
                            <Tooltip contentStyle={tipStyle} cursor={{ fill: "rgba(255,255,255,0.04)" }} formatter={(v) => [`${fmt(Number(v))} ${unit}`, "مجموع"]} />
                            <Bar dataKey="value" radius={[0, 8, 8, 0]} animationDuration={700}>
                                {data.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                            </Bar>
                        </BarChart>
                    </ResponsiveContainer>
                </Panel>
            </div>
            <Panel title="سهم از مجموع" hint="هر برش نشان‌دهنده سهم مشتری از کل فهرست است.">
                <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                        <Tooltip contentStyle={tipStyle} formatter={(v) => [`${Math.round((Number(v) / total) * 100).toLocaleString("fa-IR")}٪`, "سهم"]} />
                        <Pie data={data} dataKey="value" nameKey="name" innerRadius="55%" outerRadius="85%" paddingAngle={2} stroke="none" animationDuration={700}>
                            {data.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                        </Pie>
                    </PieChart>
                </ResponsiveContainer>
            </Panel>
        </div>
    );
}
