"use client";

import {
    Bar, BarChart, CartesianGrid, Cell, Legend, Pie, PieChart, ResponsiveContainer, Tooltip, Treemap, XAxis, YAxis,
} from "recharts";
import { Activity, Users, UserPlus } from "lucide-react";
import { C, PALETTE, fa, short, AXIS, GRID } from "../shared/theme";
import { Tip, Card, Empty } from "../shared/ui";
import type { Props } from "../shared/types";

const TreeCell = (p: any) => {
    const { x, y, width, height, name, value, fill } = p;
    if (!name || width <= 0) return null;
    return (
        <g>
            <rect x={x} y={y} width={width} height={height} rx={10} fill={fill} stroke="#111827" strokeWidth={3} />
            {width > 70 && height > 36 && (
                <text x={x + width / 2} y={y + height / 2} textAnchor="middle" dominantBaseline="middle" fill="#fff" fontSize={12} fontWeight={700}>
                    {short(name, 12)} ({fa(value)})
                </text>
            )}
        </g>
    );
};

export default function Customers({ topBringers, summary }: Props) {
    const type = [
        { name: "مشتری واقعی", value: summary.actualCustomers, fill: C.sold },
        { name: "مشتری بالقوه", value: summary.potentialCustomers, fill: C.indigo },
    ];
    const bars = topBringers.slice(0, 8).map((b) => ({
        name: short(b.full_name), "واقعی": b.actual, "بالقوه": b.potential,
    }));
    const pie = topBringers.slice(0, 6).map((b, i) => ({ name: b.full_name, value: b.actual, fill: PALETTE[i % PALETTE.length] }));

    return (
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
            <Card title="واقعی در برابر بالقوه" hint={`مجموع ${fa(summary.totalCustomers)} مشتری`} icon={UserPlus}>
                {summary.totalCustomers ? (
                    <div className="relative h-full">
                        <ResponsiveContainer>
                            <PieChart>
                                <Pie data={type} dataKey="value" innerRadius="60%" outerRadius="85%" paddingAngle={4} cornerRadius={8} stroke="none">
                                    {type.map((d, i) => <Cell key={i} fill={d.fill} />)}
                                </Pie>
                                <Tooltip content={<Tip />} />
                                <Legend iconType="circle" wrapperStyle={{ fontSize: 11 }} />
                            </PieChart>
                        </ResponsiveContainer>
                        <div className="pointer-events-none absolute inset-0 -mt-4 flex flex-col items-center justify-center">
                            <span className="text-2xl font-black text-gray-900 dark:text-white">{fa(summary.totalCustomers)}</span>
                            <span className="text-[11px] text-gray-400">مشتری</span>
                        </div>
                    </div>
                ) : <Empty />}
            </Card>

            <Card className="lg:col-span-2" title="جذب مشتری توسط هر نفر" hint="چه کسی بیشترین مشتری را آورده؟ سبز = واقعی، آبی = بالقوه" icon={Users}>
                {bars.length ? (
                    <ResponsiveContainer>
                        <BarChart data={bars}>
                            <CartesianGrid stroke={GRID} vertical={false} />
                            <XAxis dataKey="name" tick={AXIS} axisLine={false} tickLine={false} />
                            <YAxis tick={AXIS} axisLine={false} tickLine={false} tickFormatter={fa} width={36} />
                            <Tooltip content={<Tip />} cursor={{ fill: "rgba(129,140,248,0.08)" }} />
                            <Legend iconType="circle" wrapperStyle={{ fontSize: 11 }} />
                            <Bar dataKey="واقعی" fill={C.sold} radius={[6, 6, 0, 0]} />
                            <Bar dataKey="بالقوه" fill={C.indigo} radius={[6, 6, 0, 0]} />
                        </BarChart>
                    </ResponsiveContainer>
                ) : <Empty />}
            </Card>

            <Card className="lg:col-span-3" title="سهم هر نفر از مشتریان واقعی" hint="با هاور روی هر برش، تعداد دقیق را ببینید" icon={Activity} height={300}>
                {pie.some((x) => x.value > 0) ? (
                    <ResponsiveContainer>
                        <Treemap data={pie} dataKey="value" nameKey="name" isAnimationActive content={<TreeCell />}>
                            <Tooltip content={<Tip />} />
                        </Treemap>
                    </ResponsiveContainer>
                ) : <Empty />}
            </Card>
        </div>
    );
}
