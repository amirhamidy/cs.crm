"use client";

import { useState } from "react";
import {
    Bar, BarChart, CartesianGrid, LabelList, Legend, PolarAngleAxis, RadialBar, RadialBarChart, ResponsiveContainer, Tooltip, XAxis, YAxis,
} from "recharts";
import { Activity, Layers } from "lucide-react";
import { STATUS, PALETTE, fa, short, AXIS, GRID } from "../shared/theme";
import { Tip, Card, Empty } from "../shared/ui";
import type { Props } from "../shared/types";

export default function Stages(p: Props) {
    const [k, setK] = useState<(typeof STATUS)[number]["key"]>("sold");
    const src = { sold: p.topSoldStages, completed: p.topCompletedStages, in_progress: p.topInProgressStages, cancelled: p.topCancelledStages }[k];
    const meta = STATUS.find((s) => s.key === k)!;

    const rows = (src ?? []).slice(0, 8).map((s) => ({
        name: short(s.stage_name, 14), full: `${s.department_name} - ${s.stage_name}`, value: s[k],
    }));
    const radial = rows.slice(0, 6).map((r, i) => ({ ...r, fill: PALETTE[i % PALETTE.length] }));

    return (
        <div className="flex flex-col gap-4">
            <div className="flex flex-wrap items-center gap-2">
                <span className="text-[11.5px] text-gray-400">نمایش برترین مراحل بر اساس:</span>
                {STATUS.map((s) => (
                    <button key={s.key} onClick={() => setK(s.key)}
                        className="rounded-lg px-3 py-1.5 text-[11.5px] font-bold transition"
                        style={k === s.key ? { background: s.color, color: "#0b1020" } : { background: "rgba(156,163,175,0.12)", color: "#9ca3af" }}>
                        {s.label}
                    </button>
                ))}
            </div>
            <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
                <Card title={`مراحل برتر ـ ${meta.label}`} hint="هر نوار یک مرحله از فرایند است" icon={Layers} height={320}>
                    {rows.length ? (
                        <ResponsiveContainer>
                            <BarChart data={rows}>
                                <CartesianGrid stroke={GRID} vertical={false} />
                                <XAxis dataKey="name" tick={AXIS} axisLine={false} tickLine={false} interval={0} angle={-20} textAnchor="end" height={50} />
                                <YAxis tick={AXIS} axisLine={false} tickLine={false} tickFormatter={fa} width={36} />
                                <Tooltip content={<Tip />} cursor={{ fill: "rgba(129,140,248,0.08)" }} />
                                <Bar dataKey="value" name={meta.label} fill={meta.color} radius={[8, 8, 0, 0]}>
                                    <LabelList dataKey="value" position="top" fill="#9ca3af" fontSize={11} formatter={(v: any) => fa(Number(v))} />
                                </Bar>
                            </BarChart>
                        </ResponsiveContainer>
                    ) : <Empty />}
                </Card>
                <Card title="سهم ۶ مرحله‌ی اول" hint="حلقه‌ی بلندتر = سهم بیشتر از میان این مراحل" icon={Activity} height={320}>
                    {radial.length ? (
                        <ResponsiveContainer>
                            <RadialBarChart innerRadius="20%" outerRadius="100%" data={radial} startAngle={90} endAngle={-270}>
                                <PolarAngleAxis type="number" domain={[0, Math.max(1, ...radial.map((r) => r.value))]} tick={false} />
                                <RadialBar dataKey="value" name={meta.label} background={{ fill: GRID }} cornerRadius={10} />
                                <Tooltip content={<Tip />} />
                                <Legend iconType="circle" wrapperStyle={{ fontSize: 11 }} formatter={(_: any, e: any) => e.payload.name} />
                            </RadialBarChart>
                        </ResponsiveContainer>
                    ) : <Empty />}
                </Card>
            </div>
        </div>
    );
}
