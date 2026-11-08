"use client";

import {
    Bar, BarChart, CartesianGrid, Cell, Legend, Pie, PieChart, PolarAngleAxis, RadialBar, RadialBarChart, ResponsiveContainer, Tooltip, XAxis, YAxis,
} from "recharts";
import { Activity, Building2, ListTodo, TrendingUp, CheckCircle2, Ban, Loader } from "lucide-react";
import { C, STATUS, fa, pct, short, AXIS, GRID } from "../shared/theme";
import { Tip, Card, Empty, Kpi } from "../shared/ui";
import type { Props } from "../shared/types";

export default function Overview({ departments, summary }: Props) {
    const t = summary.totalTasks;
    const donut = STATUS.map((s) => ({ name: s.label, value: (summary as any)[s.key] as number, fill: s.color }))
        .filter((d) => d.value > 0);
    const conv = pct(summary.sold, t);

    const bars = departments.map((d) => ({
        name: short(d.department_name), sold: d.sold, completed: d.completed,
        in_progress: d.in_progress, cancelled: d.cancelled,
    }));

    return (
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-4">
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:col-span-4 lg:grid-cols-4">
                <Kpi label="کل تسک‌ها" value={t} total={t} color={C.indigo} icon={ListTodo} />
                <Kpi label="فروش" value={summary.sold} total={t} color={C.sold} icon={TrendingUp} />
                <Kpi label="تکمیل‌شده" value={summary.completed} total={t} color={C.completed} icon={CheckCircle2} />
                <Kpi label="لغو‌شده" value={summary.cancelled} total={t} color={C.cancelled} icon={Ban} />
            </div>

            <Card className="lg:col-span-1" title="نرخ تبدیل به فروش" hint="چند درصد تسک‌ها به فروش رسیده‌اند" icon={Activity}>
                <div className="relative h-full">
                    <ResponsiveContainer>
                        <RadialBarChart innerRadius="70%" outerRadius="100%" startAngle={200} endAngle={-20}
                            data={[{ v: conv, fill: "url(#g1)" }]}>
                            <defs>
                                <linearGradient id="g1" x1="0" x2="1"><stop offset="0%" stopColor={C.indigo} /><stop offset="100%" stopColor={C.sold} /></linearGradient>
                            </defs>
                            <PolarAngleAxis type="number" domain={[0, 100]} tick={false} />
                            <RadialBar dataKey="v" cornerRadius={30} background={{ fill: GRID }} />
                        </RadialBarChart>
                    </ResponsiveContainer>
                    <div className="absolute inset-0 flex flex-col items-center justify-center">
                        <span className="text-3xl font-black text-gray-900 dark:text-white">{fa(conv)}٪</span>
                        <span className="text-[11px] text-gray-400">از {fa(t)} تسک</span>
                    </div>
                </div>
            </Card>

            <Card className="lg:col-span-1" title="سهم هر وضعیت" hint="وضعیت همه‌ی تسک‌ها نسبت به هم" icon={Loader}>
                {donut.length ? (
                    <ResponsiveContainer>
                        <PieChart>
                            <Pie data={donut} dataKey="value" nameKey="name" innerRadius="55%" outerRadius="85%" paddingAngle={3} cornerRadius={6} stroke="none">
                                {donut.map((d, i) => <Cell key={i} fill={d.fill} />)}
                            </Pie>
                            <Tooltip content={<Tip />} />
                            <Legend iconType="circle" wrapperStyle={{ fontSize: 11 }} />
                        </PieChart>
                    </ResponsiveContainer>
                ) : <Empty />}
            </Card>

            <Card className="lg:col-span-2" title="مقایسه‌ی دپارتمان‌ها" hint="هر ستون یک دپارتمان؛ رنگ‌ها وضعیت تسک‌ها هستند" icon={Building2}>
                {bars.length ? (
                    <ResponsiveContainer>
                        <BarChart data={bars}>
                            <CartesianGrid stroke={GRID} vertical={false} />
                            <XAxis dataKey="name" tick={AXIS} axisLine={false} tickLine={false} />
                            <YAxis tick={AXIS} axisLine={false} tickLine={false} tickFormatter={fa} width={36} />
                            <Tooltip content={<Tip />} cursor={{ fill: "rgba(129,140,248,0.08)" }} />
                            <Legend iconType="circle" wrapperStyle={{ fontSize: 11 }} />
                            {STATUS.map((s, i) => (
                                <Bar key={s.key} dataKey={s.key} name={s.label} stackId="a" fill={s.color}
                                    radius={i === STATUS.length - 1 ? [6, 6, 0, 0] : 0} />
                            ))}
                        </BarChart>
                    </ResponsiveContainer>
                ) : <Empty />}
            </Card>
        </div>
    );
}
