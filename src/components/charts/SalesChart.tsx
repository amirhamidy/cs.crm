"use client";

import { AnimatePresence, motion } from "framer-motion";
import { useCallback, useEffect, useMemo, useState } from "react";
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

type ChartPoint = {
  name: string;
  sales: number;
  revenue: number;
};

type SalesChartData = Record<TimeRange, ChartPoint[]>;

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

type ActivePoint = {
  name: string;
  sales: number;
  revenue: number;
};

export default function SalesChart({
  data: chartData,
}: {
  data: SalesChartData;
}) {
  const [activeRange, setActiveRange] = useState<TimeRange>("monthly");
  const [activePoint, setActivePoint] = useState<ActivePoint | null>(null);

  const data = useMemo(
    () => chartData[activeRange] ?? [],
    [chartData, activeRange]
  );

  const currentRange = useMemo(
    () => ranges.find((r) => r.key === activeRange),
    [activeRange]
  );

  const hasData = useMemo(() => {
    if (!data || data.length === 0) return false;

    return data.some(
      (item) => item.sales > 0 || item.revenue > 0
    );
  }, [data]);

  const handleMouseMove = useCallback(
    (state: any) => {
      if (
        !state ||
        !state.isTooltipActive ||
        state.activeTooltipIndex === undefined ||
        state.activeTooltipIndex === null
      ) {
        return;
      }

      const index = Number(state.activeTooltipIndex);
      const item = data[index];

      if (!item) return;

      setActivePoint((current) => {
        if (
          current &&
          current.name === item.name &&
          current.sales === item.sales &&
          current.revenue === item.revenue
        ) {
          return current;
        }

        return {
          name: item.name,
          sales: item.sales,
          revenue: item.revenue,
        };
      });
    },
    [data]
  );

  const handleMouseLeave = useCallback(() => {
    setActivePoint(null);
  }, []);

  useEffect(() => {
    setActivePoint(null);
  }, [activeRange]);

  const formattedSales = useMemo(
    () =>
      activePoint
        ? activePoint.sales.toLocaleString("fa-IR")
        : null,
    [activePoint]
  );

  const formattedRevenue = useMemo(
    () =>
      activePoint
        ? activePoint.revenue.toLocaleString("fa-IR")
        : null,
    [activePoint]
  );

  return (
    <motion.div
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{
        duration: 0.3,
        ease: [0.25, 0.46, 0.45, 0.94],
      }}
      className="relative overflow-hidden rounded-2xl border border-gray-100 bg-white p-4 shadow-sm dark:border-white/5 dark:bg-slate-950"
    >
      <div className="mb-3 flex items-center justify-between" dir="rtl">
        <div>
          <h3 className="text-[14px] font-semibold text-gray-900 dark:text-white">
            فروش
          </h3>

          <p className="mt-0.5 text-[12px] text-gray-500 dark:text-gray-400">
            {currentRange?.sub}
          </p>
        </div>

        <div className="flex items-center gap-1 rounded-xl border border-gray-100 bg-gray-50/80 p-1 dark:border-white/5 dark:bg-slate-900/50">
          {ranges.map((range) => (
            <button
              key={range.key}
              type="button"
              onClick={() => setActiveRange(range.key)}
              className={`relative rounded-lg px-2.5 py-1 text-[11px] font-medium transition-colors ${activeRange === range.key
                  ? "text-gray-900 dark:text-white"
                  : "text-gray-500 dark:text-gray-400"
                }`}
            >
              {activeRange === range.key && (
                <motion.span
                  layoutId="salesChartRangeIndicator"
                  className="absolute inset-0 rounded-lg bg-white shadow-sm dark:bg-slate-800"
                  transition={{
                    type: "spring",
                    stiffness: 400,
                    damping: 30,
                  }}
                />
              )}

              <span className="relative z-10">
                {range.label}
              </span>
            </button>
          ))}
        </div>
      </div>

      <AnimatePresence mode="wait">
        {activePoint && (
          <motion.div
            key={`${activeRange}-${activePoint.name}`}
            initial={{ opacity: 0, y: 4, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 4, scale: 0.96 }}
            transition={{ duration: 0.15 }}
            className="absolute left-4 top-14 z-20 min-w-[145px] rounded-xl border border-gray-200/60 bg-white/95 px-3 py-2 shadow-lg backdrop-blur-sm dark:border-white/10 dark:bg-slate-900/95"
          >
            <div className="mb-1 text-[11px] font-semibold text-gray-800 dark:text-gray-100">
              {activePoint.name}
            </div>

            <div className="flex items-center justify-between gap-4 text-[11px]">
              <span className="text-gray-500 dark:text-gray-400">
                فروش
              </span>

              <span className="font-bold tabular-nums text-sky-500">
                {formattedSales}
              </span>
            </div>

            <div className="mt-1 flex items-center justify-between gap-4 text-[11px]">
              <span className="text-gray-500 dark:text-gray-400">
                درآمد
              </span>

              <span className="font-bold tabular-nums text-purple-500">
                {formattedRevenue}
              </span>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="h-[200px] w-full">
        <ChartContainer config={chartConfig} className="h-full w-full">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart
              data={data}
              margin={{
                top: 8,
                right: 4,
                left: -24,
                bottom: 8,
              }}
              onMouseMove={handleMouseMove}
              onMouseLeave={handleMouseLeave}
            >
              {CHART_DEFS}

              <CartesianGrid
                strokeDasharray="3 3"
                vertical={false}
                stroke="rgba(148,163,184,0.16)"
              />

              <XAxis
                dataKey="name"
                axisLine={false}
                tickLine={false}
                tick={{
                  fontSize: 10,
                  fill: "#94a3b8",
                }}
                interval={data.length > 12 ? 4 : 0}
              />

              <YAxis
                axisLine={false}
                tickLine={false}
                tick={{
                  fontSize: 10,
                  fill: "#94a3b8",
                }}
                width={30}
              />

              <Area
                type="monotone"
                dataKey="sales"
                stroke="#38bdf8"
                strokeWidth={2}
                fill="url(#salesGradFill)"
                dot={false}
                activeDot={{
                  r: 4,
                  strokeWidth: 2,
                  stroke: "#38bdf8",
                  fill: "#fff",
                }}
                isAnimationActive={false}
              />

              <Area
                type="monotone"
                dataKey="revenue"
                stroke="#c084fc"
                strokeWidth={2}
                fill="url(#revenueGradFill)"
                dot={false}
                activeDot={{
                  r: 4,
                  strokeWidth: 2,
                  stroke: "#c084fc",
                  fill: "#fff",
                }}
                isAnimationActive={false}
              />
            </AreaChart>
          </ResponsiveContainer>
        </ChartContainer>
      </div>

      {hasData && (
        <div className="mt-2 flex items-center justify-center gap-5">
          <div className="flex items-center gap-1.5">
            <span className="h-2 w-2 rounded-full bg-sky-400" />
            <span className="text-[11px] text-gray-500 dark:text-gray-400">
              فروش
            </span>
          </div>

          <div className="flex items-center gap-1.5">
            <span className="h-2 w-2 rounded-full bg-purple-400" />
            <span className="text-[11px] text-gray-500 dark:text-gray-400">
              درآمد
            </span>
          </div>
        </div>
      )}
    </motion.div>
  );
}