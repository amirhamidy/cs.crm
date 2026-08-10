"use client";

import { motion } from "framer-motion";
import { useMemo, useState } from "react";
import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  XAxis,
  YAxis,
} from "recharts";
import { ChartContainer, type ChartConfig } from "@/components/ui/chart";
import { useSoldTasksByTimeRange, type TimeRange } from "@/hooks/useSoldTasksByTimeRange";

const chartConfig: ChartConfig = {
  sales: { label: "فروش", color: "#38bdf8" },
  revenue: { label: "درآمد", color: "#c084fc" },
};

const ranges: { key: TimeRange; label: string; sub: string }[] = [
  { key: "weekly", label: "هفتگی", sub: "هفته" },
  { key: "monthly", label: "ماهانه", sub: "ماه" },
  { key: "yearly", label: "سالانه", sub: "سال" },
];

const CHART_DEFS = (
  <defs>
    <linearGradient id="salesGradFill" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%" stopColor="#38bdf8" stopOpacity={0.3} />
      <stop offset="100%" stopColor="#38bdf8" stopOpacity={0} />
    </linearGradient>
    <linearGradient id="revenueGradFill" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%" stopColor="#c084fc" stopOpacity={0.25} />
      <stop offset="100%" stopColor="#c084fc" stopOpacity={0} />
    </linearGradient>
  </defs>
);

function SalesChartSkeleton() {
  return (
    <div className="rounded-2xl border border-gray-100 bg-white p-4 shadow-sm dark:border-white/5 dark:bg-slate-950">
      <div className="mb-3 flex items-center justify-between" dir="rtl">
        <div className="space-y-2">
          <div className="h-4 w-24 animate-pulse rounded-full bg-gray-100 dark:bg-slate-900" />
          <div className="h-3 w-40 animate-pulse rounded-full bg-gray-100/80 dark:bg-slate-900/70" />
        </div>
        <div className="h-8 w-28 animate-pulse rounded-xl bg-gray-100 dark:bg-slate-900" />
      </div>
      <div className="h-[180px] rounded-xl bg-gray-50 dark:bg-slate-900/40" />
    </div>
  );
}

export default function SalesChart() {
  const [activeRange, setActiveRange] = useState<TimeRange>("monthly");
  const { chartData, loading, error } = useSoldTasksByTimeRange();

  const data = chartData[activeRange];

  const currentRange = useMemo(
    () => ranges.find((r) => r.key === activeRange),
    [activeRange]
  );

  const hasData = useMemo(() => {
    if (!data || data.length === 0) return false;
    return data.some((item) => item.sales > 0 || item.revenue > 0);
  }, [data]);

  if (loading) return <SalesChartSkeleton />;

  if (error) {
    return (
      <div className="flex h-[256px] items-center justify-center rounded-2xl border border-red-100 bg-red-50/50 p-4 text-center text-xs text-red-600 dark:border-red-950/20 dark:bg-red-950/5 dark:text-red-400">
        {error}
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, ease: [0.25, 0.46, 0.45, 0.94] }}
      className="relative overflow-hidden rounded-2xl border border-gray-100 bg-white p-4 shadow-sm dark:border-white/5 dark:bg-slate-950"
    >
      <div className="mb-3 flex items-center justify-between" dir="rtl">
        <div>
          <h3 className="text-[14px] font-semibold text-gray-900 dark:text-white">
            نمودار فروش
          </h3>
          <p className="mt-0.5 text-[13px] text-gray-500 dark:text-gray-400">
            گزارش عملکرد {currentRange?.sub}
          </p>
        </div>

        <div className="flex items-center gap-1 rounded-xl border border-gray-100 bg-gray-50/80 p-1 dark:border-white/5 dark:bg-slate-900/50">
          {ranges.map((range) => (
            <button
              key={range.key}
              type="button"
              onClick={() => setActiveRange(range.key)}
              className="relative rounded-lg px-2.5 py-1 text-[11px] font-medium"
            >
              {activeRange === range.key && (
                <motion.span
                  layoutId="salesChartRangeIndicator"
                  className="absolute inset-0 rounded-lg bg-white shadow-sm dark:bg-slate-800"
                  transition={{ type: "spring", stiffness: 400, damping: 30 }}
                />
              )}
              <span
                className={`relative z-10 transition-colors ${activeRange === range.key
                    ? "text-gray-900 dark:text-white"
                    : "text-gray-500 dark:text-gray-400"
                  }`}
              >
                {range.label}
              </span>
            </button>
          ))}
        </div>
      </div>

      <div className="h-[180px] w-full flex items-center justify-center">
        {!hasData ? (
          <div className="text-xs text-gray-400 dark:text-gray-500" dir="rtl">
            تسک فروخته شده‌ای در این بازه ثبت نشده است.
          </div>
        ) : (
          <ChartContainer config={chartConfig} className="h-full w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={data} margin={{ top: 4, right: 4, left: -24, bottom: 0 }}>
                {CHART_DEFS}
                <CartesianGrid
                  strokeDasharray="3 3"
                  className="[&_line]:stroke-gray-100 dark:[&_line]:stroke-white/[0.04]"
                  vertical={false}
                />
                <XAxis
                  dataKey="name"
                  tick={{ fontSize: 11, fontWeight: 500 }}
                  className="[&_text]:fill-gray-500 dark:[&_text]:fill-gray-400"
                  axisLine={false}
                  tickLine={false}
                  dy={5}
                />
                <YAxis
                  tick={{ fontSize: 11, fontWeight: 500 }}
                  className="[&_text]:fill-gray-500 dark:[&_text]:fill-gray-400"
                  axisLine={false}
                  tickLine={false}
                  tickFormatter={(v: number) => `${v}`}
                />
                <Area
                  type="monotone"
                  dataKey="sales"
                  stroke="#38bdf8"
                  strokeWidth={2.5}
                  fill="url(#salesGradFill)"
                  dot={false}
                  activeDot={{ r: 5, strokeWidth: 0, fill: "#38bdf8" }}
                  isAnimationActive={false}
                />
                <Area
                  type="monotone"
                  dataKey="revenue"
                  stroke="#c084fc"
                  strokeWidth={2.5}
                  fill="url(#revenueGradFill)"
                  dot={false}
                  activeDot={{ r: 5, strokeWidth: 0, fill: "#c084fc" }}
                  isAnimationActive={false}
                />
              </AreaChart>
            </ResponsiveContainer>
          </ChartContainer>
        )}
      </div>

      {hasData && (
        <div className="mt-2 flex items-center justify-end gap-4" dir="rtl">
          {Object.entries(chartConfig).map(([key, val]) => (
            <div key={key} className="flex items-center gap-1.5">
              <span
                className="inline-block h-0.5 w-3 rounded-full"
                style={{ backgroundColor: val.color }}
              />
              <span className="text-[11px] text-gray-500 dark:text-gray-400">
                {val.label}
              </span>
            </div>
          ))}
        </div>
      )}
    </motion.div>
  );
}
