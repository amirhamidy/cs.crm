"use client";

import { ReactNode } from "react";
import { m } from "framer-motion";
import { useTheme } from "next-themes";
import { Info } from "lucide-react";
import { ChartTooltip } from "@/components/charts/ChartTooltip";

export const fa = (n: number) => Math.round(n).toLocaleString("fa-IR");
export const pct = (n: number) => `${(Math.round(n * 10) / 10).toLocaleString("fa-IR")}٪`;

export const COLORS = {
    sold: "#2dd4bf",
    completed: "#60a5fa",
    in_progress: "#a78bfa",
    cancelled: "#fb7185",
    purple: "#a855f7",
    green: "#4ade80",
    blue: "#38bdf8",
    pink: "#f472b6",
    yellow: "#facc15",
};
export const PALETTE = ["#a855f7", "#2dd4bf", "#60a5fa", "#fb7185", "#facc15", "#4ade80", "#f472b6", "#38bdf8"];

export const STATUS = [
    { key: "sold", label: "فروش", color: COLORS.sold },
    { key: "completed", label: "تکمیل", color: COLORS.completed },
    { key: "in_progress", label: "در جریان", color: COLORS.in_progress },
    { key: "cancelled", label: "لغو", color: COLORS.cancelled },
] as const;

export function useChartTheme() {
    const { resolvedTheme } = useTheme();
    const dark = resolvedTheme === "dark";
    return {
        dark,
        axis: { fill: dark ? "#9ca3af" : "#6b7280", fontSize: 10.5 },
        grid: dark ? "rgba(255,255,255,0.06)" : "rgba(0,0,0,0.07)",
        text: dark ? "#e5e7eb" : "#374151",
    };
}

/** Tooltip شبیه داشبورد ادمین */
export function Tip({
    active,
    payload,
    label,
    title,
    footer,
}: {
    active?: boolean;
    payload?: any[];
    label?: any;
    title?: (p: any, label: any) => string;
    footer?: (p: any) => { label: string; value: string; valueColor?: string } | undefined;
}) {
    const { dark } = useChartTheme();
    if (!active || !payload?.length) return null;
    const p = payload[0];
    const src = p.payload ?? {};
    const rows = payload
        .filter((x) => x.value !== undefined && x.value !== null)
        .map((x) => ({
            dotStyle: "circle" as const,
            label: String(x.name ?? x.dataKey),
            value: typeof x.value === "number" ? fa(x.value) : String(x.value),
            color: x.color || x.payload?.fill || x.payload?.color || COLORS.purple,
        }));
    return (
        <ChartTooltip
            title={title ? title(src, label) : String(src.name ?? label ?? "")}
            rows={rows}
            footer={footer?.(src)}
            dark={dark}
            colorKey={String(src.name ?? label ?? "x")}
        />
    );
}

export function Card({
    title,
    hint,
    icon,
    children,
    className = "",
    height = 260,
    action,
}: {
    title: string;
    hint: string;
    icon?: ReactNode;
    children: ReactNode;
    className?: string;
    height?: number;
    action?: ReactNode;
}) {
    return (
        <m.section
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.35 }}
            className={`rounded-[1.5rem] border border-black/5 bg-white p-4 dark:border-white/[0.06] dark:bg-white/[0.03] sm:p-5 ${className}`}
            dir="rtl"
        >
            <div className="mb-3 flex items-start justify-between gap-3">
                <div className="flex items-center gap-2.5">
                    {icon && (
                        <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-purple-500/10 text-purple-400">
                            {icon}
                        </div>
                    )}
                    <div>
                        <h3 className="text-[13px] font-extrabold text-gray-900 dark:text-white">{title}</h3>
                        <p className="mt-0.5 flex items-center gap-1 text-[10.5px] text-gray-400 dark:text-gray-500">
                            <Info size={10} /> {hint}
                        </p>
                    </div>
                </div>
                {action}
            </div>
            <div style={{ height }} dir="ltr">
                {children}
            </div>
        </m.section>
    );
}

export function Empty({ loading }: { loading?: boolean }) {
    return (
        <div className="flex h-full items-center justify-center text-[12px] text-gray-400" dir="rtl">
            {loading ? "در حال بارگذاری…" : "داده‌ای در این بازه وجود ندارد"}
        </div>
    );
}

export function Legend({ items }: { items: { label: string; color: string }[] }) {
    return (
        <div className="mt-2 flex flex-wrap justify-center gap-3" dir="rtl">
            {items.map((i) => (
                <span key={i.label} className="flex items-center gap-1.5 text-[10.5px] text-gray-500 dark:text-gray-400">
                    <span className="h-2 w-2 rounded-full" style={{ background: i.color }} />
                    {i.label}
                </span>
            ))}
        </div>
    );
}

export function Kpi({ label, value, color, sub }: { label: string; value: string; color: string; sub?: string }) {
    return (
        <div
            className="rounded-2xl border border-black/5 bg-white p-3.5 dark:border-white/[0.06] dark:bg-white/[0.03]"
            dir="rtl"
        >
            <p className="text-[10.5px] text-gray-400">{label}</p>
            <p className="mt-1 text-xl font-extrabold" style={{ color }}>
                {value}
            </p>
            {sub && <p className="mt-0.5 text-[10px] text-gray-400">{sub}</p>}
        </div>
    );
}

export function TreeCell(props: any) {
    const { x, y, width, height, name, value, fill } = props;
    if (!width || !height || width < 4 || height < 4) return null;
    return (
        <g>
            <rect x={x} y={y} width={width} height={height} rx={8} fill={fill} fillOpacity={0.85} stroke="#0000" />
            {width > 54 && height > 34 && (
                <>
                    <text x={x + width / 2} y={y + height / 2 - 4} textAnchor="middle" fill="#fff" fontSize={11} fontWeight={700}>
                        {String(name).slice(0, 14)}
                    </text>
                    <text x={x + width / 2} y={y + height / 2 + 12} textAnchor="middle" fill="#fff" fontSize={10} opacity={0.85}>
                        {fa(value)}
                    </text>
                </>
            )}
        </g>
    );
}
