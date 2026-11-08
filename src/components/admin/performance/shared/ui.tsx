"use client";

import type { ReactNode } from "react";
import { m } from "framer-motion";
import { PolarAngleAxis, RadialBar, RadialBarChart, ResponsiveContainer } from "recharts";
import { Info } from "lucide-react";
import { C, GRID, fa, pct } from "./theme";

export function Tip({ active, payload, label }: any) {
    if (!active || !payload?.length) return null;
    return (
        <div dir="rtl" className="rounded-xl border border-white/10 bg-gray-900/95 px-3 py-2 text-[11.5px] shadow-xl backdrop-blur">
            {(label ?? payload[0]?.payload?.name) && (
                <div className="mb-1 font-bold text-white">{label ?? payload[0].payload.name}</div>
            )}
            {payload.map((p: any, i: number) => (
                <div key={i} className="flex items-center gap-2 text-gray-300">
                    <span className="h-2 w-2 rounded-full" style={{ background: p.color || p.payload?.fill }} />
                    <span>{p.name}:</span>
                    <b className="text-white">{fa(Number(p.value))}</b>
                </div>
            ))}
        </div>
    );
}

export function Card({
    title, hint, icon: Icon, children, className = "", height = 280,
}: {
    title: string; hint: string; icon: any; children: ReactNode; className?: string; height?: number;
}) {
    return (
        <m.section
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.35 }}
            className={`rounded-2xl border border-gray-200 bg-white p-4 dark:border-white/10 dark:bg-gray-950 ${className}`}
        >
            <header className="mb-3 flex items-start gap-2.5">
                <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-indigo-500/10">
                    <Icon size={15} className="text-indigo-400" />
                </span>
                <div className="min-w-0">
                    <h3 className="text-[13px] font-extrabold text-gray-900 dark:text-white">{title}</h3>
                    <p className="mt-0.5 flex items-center gap-1 text-[11px] text-gray-400 dark:text-gray-500">
                        <Info size={10} className="shrink-0" />
                        {hint}
                    </p>
                </div>
            </header>
            <div style={{ height }}>{children}</div>
        </m.section>
    );
}

export function Empty() {
    return (
        <div className="flex h-full items-center justify-center text-[12px] text-gray-400">
            داده‌ای برای این بازه وجود ندارد
        </div>
    );
}

export function Kpi({ label, value, total, color, icon: Icon }: {
    label: string; value: number; total: number; color: string; icon: any;
}) {
    const p = pct(value, total);
    return (
        <div className="flex items-center gap-3 rounded-2xl border border-gray-200 bg-white p-3 dark:border-white/10 dark:bg-gray-950">
            <div className="relative h-16 w-16 shrink-0">
                <ResponsiveContainer>
                    <RadialBarChart innerRadius="72%" outerRadius="100%" startAngle={90} endAngle={-270}
                        data={[{ v: p, fill: color }]}>
                        <PolarAngleAxis type="number" domain={[0, 100]} tick={false} />
                        <RadialBar dataKey="v" cornerRadius={20} background={{ fill: GRID }} />
                    </RadialBarChart>
                </ResponsiveContainer>
                <span className="absolute inset-0 flex items-center justify-center text-[11px] font-extrabold text-gray-800 dark:text-white">
                    {fa(p)}٪
                </span>
            </div>
            <div className="min-w-0">
                <div className="flex items-center gap-1 text-[11.5px] text-gray-400"><Icon size={12} style={{ color }} />{label}</div>
                <div className="text-xl font-black text-gray-900 dark:text-white">{fa(value)}</div>
            </div>
        </div>
    );
}

