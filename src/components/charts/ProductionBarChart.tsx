"use client";

import { m } from "framer-motion";
import { useTheme } from "next-themes";
import { useMemo } from "react";
import {
  Area,
  AreaChart,
  CartesianGrid,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { ChartTooltip } from "@/components/charts/ChartTooltip";
import { toPersianDigits } from "@/lib/jalali";

export type ProductionBarPoint = { name: string; a: number; b: number };

type Series = { label: string; color: string };

type Props = {
  title: string;
  subtitle?: string;
  data: ProductionBarPoint[];
  seriesA: Series;
  seriesB: Series;
  emptyText?: string;
  
  signed?: boolean;
  
  tabs?: { id: number; label: string }[];
  activeTab?: number | null;
  onTab?: (id: number) => void;
};

const fmt = (v: number) =>
  toPersianDigits(Number.isInteger(v) ? v.toLocaleString("en-US") : v.toFixed(1));

export default function ProductionBarChart({
  title,
  subtitle,
  data,
  seriesA,
  seriesB,
  emptyText = "داده‌ای برای نمایش وجود ندارد.",
  signed = false,
  tabs,
  activeTab,
  onTab,
}: Props) {
  const { resolvedTheme } = useTheme();
  const dark = resolvedTheme === "dark";
  const hasData = useMemo(() => data.some((d) => d.a !== 0 || d.b !== 0), [data]);
  const grid = dark ? "rgba(255,255,255,0.06)" : "rgba(0,0,0,0.06)";
  const tick = { fontSize: 11, fill: dark ? "#9ca3af" : "#6b7280" };

  return (
    <m.div
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="relative overflow-hidden rounded-2xl border border-gray-100 bg-white p-4 shadow-sm dark:border-white/5 dark:bg-slate-950"
    >
      <div className="mb-3 flex items-start justify-between gap-3" dir="rtl">
        <div>
          <h3 className="text-[14px] font-semibold text-gray-900 dark:text-white">{title}</h3>
          {subtitle && (
            <p className="mt-0.5 text-[12px] text-gray-500 dark:text-gray-400">{subtitle}</p>
          )}
        </div>
        <div className="flex flex-col items-end gap-2">
        {tabs && (
          <div className="flex rounded-full bg-gray-100 p-0.5 dark:bg-white/[0.06]">
            {tabs.map((t) => (
              <button
                key={t.id}
                type="button"
                onClick={() => onTab?.(t.id)}
                className={`rounded-full px-3 py-1 text-[11px] font-semibold transition ${
                  activeTab === t.id
                    ? "bg-white text-gray-900 shadow-sm dark:bg-slate-800 dark:text-white"
                    : "text-gray-500 dark:text-gray-400"
                }`}
              >
                {t.label}
              </button>
            ))}
          </div>
        )}
        <div className="flex items-center gap-3">
          {[seriesA, seriesB].map((s) => (
            <div key={s.label} className="flex items-center gap-1.5">
              <span className="h-2 w-2 rounded-full" style={{ backgroundColor: s.color }} />
              <span className="text-[11px] text-gray-500 dark:text-gray-400">{s.label}</span>
            </div>
          ))}
        </div>
        </div>
      </div>

      <div className="relative h-[260px] w-full" dir="ltr">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={data} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
            <defs>
              {[seriesA, seriesB].map((s, i) => (
                <linearGradient key={i} id={`pbc-${title.replace(/\s/g, "")}-${i}`} x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor={s.color} stopOpacity={0.35} />
                  <stop offset="100%" stopColor={s.color} stopOpacity={0.02} />
                </linearGradient>
              ))}
            </defs>
            <CartesianGrid stroke={grid} strokeDasharray="4 4" vertical={false} />
            <XAxis dataKey="name" tick={tick} axisLine={false} tickLine={false} minTickGap={12} />
            <YAxis
              tick={tick}
              axisLine={false}
              tickLine={false}
              width={44}
              tickFormatter={(v: number) => toPersianDigits(String(v))}
            />
            {signed && <ReferenceLine y={0} stroke={dark ? "#475569" : "#cbd5e1"} />}
            <Tooltip
              cursor={{ stroke: dark ? "#475569" : "#cbd5e1", strokeDasharray: "4 4" }}
              content={({ active, payload, label }) => {
                if (!active || !payload?.length) return null;
                return (
                  <div dir="rtl">
                    <ChartTooltip
                      title={String(label)}
                      dark={dark}
                      colorKey="pbc"
                      rows={[
                        { dotStyle: "circle", label: seriesA.label, value: fmt(Number(payload[0]?.value ?? 0)), color: seriesA.color },
                        { dotStyle: "circle", label: seriesB.label, value: fmt(Number(payload[1]?.value ?? 0)), color: seriesB.color },
                      ]}
                    />
                  </div>
                );
              }}
            />
            <Area type="monotone" dataKey="a" stroke={seriesA.color} strokeWidth={2.5} fill={`url(#pbc-${title.replace(/\s/g, "")}-0)`} dot={false} activeDot={{ r: 4 }} />
            <Area type="monotone" dataKey="b" stroke={seriesB.color} strokeWidth={2.5} fill={`url(#pbc-${title.replace(/\s/g, "")}-1)`} dot={false} activeDot={{ r: 4 }} />
          </AreaChart>
        </ResponsiveContainer>
        {!hasData && (
          <div className="pointer-events-none absolute inset-0 flex items-center justify-center text-xs text-gray-400" dir="rtl">
            {emptyText}
          </div>
        )}
      </div>
    </m.div>
  );
}
