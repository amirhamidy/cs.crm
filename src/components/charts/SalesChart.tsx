"use client";

import { AnimatePresence, motion } from "framer-motion";
import { useCallback, useMemo, useState } from "react";
import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  XAxis,
  YAxis,
} from "recharts";
import { ChartContainer, type ChartConfig } from "@/components/ui/chart";

type TimeRange = "weekly" | "monthly" | "yearly";

type MouseMoveState = {
  activeLabel?: string;
};

const salesData: Record<TimeRange, { name: string; sales: number; revenue: number }[]> = {
  weekly: [
    { name: "شنبه", sales: 1200, revenue: 800 },
    { name: "یک", sales: 1900, revenue: 1200 },
    { name: "دو", sales: 1500, revenue: 1000 },
    { name: "سه", sales: 2200, revenue: 1500 },
    { name: "چهار", sales: 1800, revenue: 1100 },
    { name: "پنج", sales: 2500, revenue: 1700 },
    { name: "جمعه", sales: 2100, revenue: 1400 },
  ],
  monthly: [
    { name: "فرو", sales: 4200, revenue: 2400 },
    { name: "ارد", sales: 3800, revenue: 1398 },
    { name: "خرد", sales: 5200, revenue: 5800 },
    { name: "تیر", sales: 4800, revenue: 3908 },
    { name: "مرد", sales: 6100, revenue: 4800 },
    { name: "شهر", sales: 5500, revenue: 3800 },
  ],
  yearly: [
    { name: "۱۴۰۱", sales: 45000, revenue: 32000 },
    { name: "۱۴۰۲", sales: 52000, revenue: 38000 },
    { name: "۱۴۰۳", sales: 61000, revenue: 45000 },
  ],
};

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

// grid color رو از CSS variable بگیر نه از useTheme
const GRID_COLOR_LIGHT = "#f3f4f6";
const GRID_COLOR_DARK = "rgba(255,255,255,0.04)";

export default function SalesChart() {
  const [activeRange, setActiveRange] = useState<TimeRange>("monthly");
  const [activeLabel, setActiveLabel] = useState<string | null>(null);

  const data = salesData[activeRange];

  const activeData = useMemo(
    () => (activeLabel ? data.find((d) => d.name === activeLabel) ?? null : null),
    [activeLabel, data]
  );

  const currentRange = useMemo(
    () => ranges.find((r) => r.key === activeRange),
    [activeRange]
  );

  const formattedValues = useMemo(() => {
    if (!activeData) return null;
    return {
      sales: activeData.sales.toLocaleString("fa-IR"),
      revenue: activeData.revenue.toLocaleString("fa-IR"),
    };
  }, [activeData]);

  const handleMouseMove = useCallback((state: MouseMoveState) => {
    if (state?.activeLabel) setActiveLabel(state.activeLabel);
  }, []);

  const handleMouseLeave = useCallback(() => setActiveLabel(null), []);

  return (
    <motion.div
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, ease: [0.25, 0.46, 0.45, 0.94] }}
      className="relative rounded-2xl border border-gray-100 bg-white p-4 shadow-sm dark:border-white/5 dark:bg-slate-950"
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

      <div className="absolute left-2 top-14 z-10 min-w-[140px]">
        <AnimatePresence mode="wait">
          {activeLabel && activeData && formattedValues && (
            <motion.div
              key={activeLabel}
              initial={{ opacity: 0, y: 4, scale: 0.96 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 4, scale: 0.96 }}
              transition={{ duration: 0.15, ease: [0.25, 0.46, 0.45, 0.94] }}
              className="pointer-events-none rounded-xl border border-gray-200/60 bg-white/95 px-3 py-2.5 shadow-lg backdrop-blur-sm dark:border-white/10 dark:bg-slate-900/95"
              style={{ boxShadow: "0 4px 20px rgba(56,189,248,0.15)" }}
            >
              <p className="mb-1.5 text-[12px] font-semibold text-gray-800 dark:text-gray-100">
                {activeData.name}
              </p>
              <p className="mb-0.5 flex items-center gap-1.5 text-[11px] text-gray-500 dark:text-gray-400">
                <span
                  className="h-2 w-2 flex-shrink-0 rounded-full"
                  style={{ backgroundColor: "#38bdf8", boxShadow: "0 0 6px rgba(56,189,248,0.5)" }}
                />
                {chartConfig.sales.label}:{" "}
                <span className="font-bold tabular-nums" style={{ color: "#38bdf8" }}>
                  {formattedValues.sales}
                </span>
              </p>
              <p className="flex items-center gap-1.5 text-[11px] text-gray-500 dark:text-gray-400">
                <span
                  className="h-2 w-2 flex-shrink-0 rounded-full"
                  style={{ backgroundColor: "#c084fc", boxShadow: "0 0 6px rgba(192,132,252,0.5)" }}
                />
                {chartConfig.revenue.label}:{" "}
                <span className="font-bold tabular-nums" style={{ color: "#c084fc" }}>
                  {formattedValues.revenue}
                </span>
              </p>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <ChartContainer config={chartConfig} className="h-[180px] w-full">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart
            data={data}
            margin={{ top: 4, right: 4, left: -24, bottom: 0 }}
            onMouseMove={handleMouseMove}
            onMouseLeave={handleMouseLeave}
          >
            {CHART_DEFS}
            <CartesianGrid
              strokeDasharray="3 3"
              // از CSS variable استفاده می‌کنیم - dark mode رو Tailwind هندل می‌کنه
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
              tickFormatter={(v: number) => `${(v / 1000).toFixed(0)}k`}
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

      <div className="mt-2 flex items-center justify-end gap-4" dir="rtl">
        {Object.entries(chartConfig).map(([key, val]) => (
          <div key={key} className="flex items-center gap-1.5">
            <span
              className="inline-block h-0.5 w-3 rounded-full"
              style={{ backgroundColor: val.color }}
            />
            <span className="text-[11px] text-gray-500 dark:text-gray-400">{val.label}</span>
          </div>
        ))}
      </div>
    </motion.div>
  );
}
