"use client";

import { useState } from "react";
import {
    Area, AreaChart, CartesianGrid, Funnel, FunnelChart, LabelList, Legend, PolarAngleAxis, PolarGrid, PolarRadiusAxis, Radar, RadarChart, ResponsiveContainer, Tooltip, XAxis, YAxis,
} from "recharts";
import { Building2, Layers, TrendingUp } from "lucide-react";
import { C, PALETTE, fa, pct, short, AXIS, GRID } from "../shared/theme";
import { Tip, Card, Empty } from "../shared/ui";
import type { Props } from "../shared/types";

export default function Departments({ departments }: Props) {
    const [sel, setSel] = useState(0);
    const dep = departments[sel] ?? departments[0];

    const radar = departments.map((d) => ({
        name: short(d.department_name, 10),
        "نرخ فروش": Math.round(d.conversion > 1 ? d.conversion : d.conversion * 100) || pct(d.sold, d.total),
        "ماندگاری": 100 - (Math.round(d.churnRate > 1 ? d.churnRate : d.churnRate * 100) || pct(d.cancelled, d.total)),
        "تکمیل": pct(d.completed + d.sold, d.total),
    }));

    const funnel = (dep?.stages ?? []).slice().sort((a, b) => a.order - b.order)
        .map((s, i) => ({ name: s.name, value: s.total, fill: PALETTE[i % PALETTE.length] }));

    const area = departments.map((d) => ({
        name: short(d.department_name, 10), "تعداد کل": d.total, "فروش": d.sold,
    }));

    return (
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
            <Card title="مقایسه‌ی کیفیت دپارتمان‌ها" hint="هرچه سطح رنگی بزرگ‌تر، دپارتمان بهتر عمل کرده" icon={Building2} height={320}>
                {radar.length ? (
                    <ResponsiveContainer>
                        <RadarChart data={radar}>
                            <PolarGrid stroke={GRID} />
                            <PolarAngleAxis dataKey="name" tick={AXIS} />
                            <PolarRadiusAxis domain={[0, 100]} tick={false} axisLine={false} />
                            <Radar name="نرخ فروش" dataKey="نرخ فروش" stroke={C.sold} fill={C.sold} fillOpacity={0.25} />
                            <Radar name="ماندگاری" dataKey="ماندگاری" stroke={C.indigo} fill={C.indigo} fillOpacity={0.2} />
                            <Radar name="تکمیل" dataKey="تکمیل" stroke={C.pink} fill={C.pink} fillOpacity={0.15} />
                            <Tooltip content={<Tip />} />
                            <Legend iconType="circle" wrapperStyle={{ fontSize: 11 }} />
                        </RadarChart>
                    </ResponsiveContainer>
                ) : <Empty />}
            </Card>

            <Card title="تعداد کل در برابر فروش" hint="فاصله‌ی دو منحنی یعنی تسک‌هایی که به فروش نرسیده‌اند" icon={TrendingUp} height={320}>
                {area.length ? (
                    <ResponsiveContainer>
                        <AreaChart data={area}>
                            <defs>
                                <linearGradient id="a1" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor={C.indigo} stopOpacity={0.5} /><stop offset="100%" stopColor={C.indigo} stopOpacity={0} /></linearGradient>
                                <linearGradient id="a2" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor={C.sold} stopOpacity={0.5} /><stop offset="100%" stopColor={C.sold} stopOpacity={0} /></linearGradient>
                            </defs>
                            <CartesianGrid stroke={GRID} vertical={false} />
                            <XAxis dataKey="name" tick={AXIS} axisLine={false} tickLine={false} />
                            <YAxis tick={AXIS} axisLine={false} tickLine={false} tickFormatter={fa} width={36} />
                            <Tooltip content={<Tip />} />
                            <Legend iconType="circle" wrapperStyle={{ fontSize: 11 }} />
                            <Area type="monotone" dataKey="تعداد کل" stroke={C.indigo} strokeWidth={2.5} fill="url(#a1)" />
                            <Area type="monotone" dataKey="فروش" stroke={C.sold} strokeWidth={2.5} fill="url(#a2)" />
                        </AreaChart>
                    </ResponsiveContainer>
                ) : <Empty />}
            </Card>

            <Card className="lg:col-span-2" title="قیف مراحل دپارتمان" hint="یک دپارتمان را از بالا انتخاب کنید؛ هر لایه یک مرحله است" icon={Layers} height={340}>
                <div className="mb-2 flex flex-wrap gap-1.5">
                    {departments.map((d, i) => (
                        <button key={d.key} onClick={() => setSel(i)}
                            className={`rounded-lg px-2.5 py-1 text-[11px] font-bold transition ${sel === i ? "bg-indigo-500 text-white" : "bg-gray-100 text-gray-500 dark:bg-white/5"}`}>
                            {d.department_name}
                        </button>
                    ))}
                </div>
                <div style={{ height: 290 }}>
                    {funnel.some((f) => f.value > 0) ? (
                        <ResponsiveContainer>
                            <FunnelChart>
                                <Tooltip content={<Tip />} />
                                <Funnel dataKey="value" data={funnel} isAnimationActive>
                                    <LabelList position="right" dataKey="name" fill="#9ca3af" fontSize={11} stroke="none" />
                                    <LabelList position="center" dataKey="value" fill="#fff" fontSize={12} stroke="none" formatter={(v: any) => fa(Number(v))} />
                                </Funnel>
                            </FunnelChart>
                        </ResponsiveContainer>
                    ) : <Empty />}
                </div>
            </Card>
        </div>
    );
}
