"use client";

import { useEffect, useRef, useState } from "react";
import { useTheme } from "next-themes";
import { motion, AnimatePresence } from "framer-motion";
import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  XAxis,
  YAxis,
} from "recharts";
import { ChartContainer, type ChartConfig } from "@/components/ui/chart";
import { ChevronDown } from "lucide-react";

const salesData = {
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

type TimeRange = "weekly" | "monthly" | "yearly";

export default function SalesChart() {
  const [activeRange, setActiveRange] = useState<TimeRange>("monthly");
  const [isOpen, setIsOpen] = useState(false);
  const [activeLabel, setActiveLabel] = useState<string | null>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const { resolvedTheme } = useTheme();

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node))
        setIsOpen(false);
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const isDark = resolvedTheme === "dark";
  const data = salesData[activeRange];
  const activeData = activeLabel ? data.find((d) => d.name === activeLabel) : null;

  const rangeLabel =
    activeRange === "weekly" ? "هفتگی" : activeRange === "monthly" ? "ماهانه" : "سالانه";
  const rangeSub =
    activeRange === "weekly" ? "هفته" : activeRange === "monthly" ? "ماه" : "سال";

  return (
    <div className="bg-white border border-gray-100 relative rounded-2xl p-4 dark:bg-slate-950 dark:border-white/5 shadow-sm">
      <div className="flex items-center justify-between mb-3" dir="rtl">
        <div>
          <h3 className="text-[14px] font-semibold text-gray-900 dark:text-white">
            نمودار فروش
          </h3>
          <p className="text-[13px] text-gray-500 mt-0.5 dark:text-gray-400">
            گزارش عملکرد {rangeSub}
          </p>
        </div>

        <div className="relative" ref={dropdownRef}>
          <button
            onClick={() => setIsOpen(!isOpen)}
            className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-gray-50 dark:bg-slate-900 text-[11px] font-medium text-gray-700 dark:text-gray-300 border border-gray-100 dark:border-white/5 hover:bg-gray-100 dark:hover:bg-slate-800 transition-colors"
          >
            {rangeLabel}
            <ChevronDown
              size={12}
              className={`transition-transform ${isOpen ? "rotate-180" : ""}`}
            />
          </button>

          <AnimatePresence>
            {isOpen && (
              <motion.div
                initial={{ opacity: 0, y: 5, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 5, scale: 0.95 }}
                className="absolute left-0 top-full mt-2 w-28 bg-white dark:bg-slate-900 border border-gray-100 dark:border-white/10 rounded-xl shadow-xl z-50 overflow-hidden"
              >
                {(["weekly", "monthly", "yearly"] as TimeRange[]).map((range) => (
                  <button
                    key={range}
                    onClick={() => { setActiveRange(range); setIsOpen(false); }}
                    className="w-full text-right px-4 py-2 text-[11px] text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-slate-800 transition-colors"
                  >
                    {range === "weekly" ? "هفتگی" : range === "monthly" ? "ماهانه" : "سالانه"}
                  </button>
                ))}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      <div className="absolute top-14 left-2 z-10 min-w-[140px]">
        <AnimatePresence mode="wait">
          {activeLabel && activeData && (
            <motion.div
              key={activeLabel}
              initial={{ filter: "blur(8px)", opacity: 0, y: 4, scale: 0.96 }}
              animate={{ filter: "blur(0px)", opacity: 1, y: 0, scale: 1 }}
              exit={{ filter: "blur(6px)", opacity: 0, y: 4, scale: 0.96 }}
              transition={{ duration: 0.15, ease: [0.25, 0.46, 0.45, 0.94] }}
              className="bg-white/95 backdrop-blur-sm border border-gray-200/60 shadow-lg rounded-xl px-3 py-2.5 pointer-events-none dark:bg-slate-900/95 dark:border-white/10"
              style={{ boxShadow: "0 4px 20px rgba(56,189,248,0.15)" }}
            >
              <div className="flex items-center gap-1.5 mb-1.5">
                <span className="text-[12px] font-semibold text-gray-800 dark:text-gray-100">
                  {activeData.name}
                </span>
              </div>
              <p className="text-[11px] text-gray-500 dark:text-gray-400 flex items-center gap-1.5 mb-0.5">
                <span
                  className="w-2 h-2 rounded-full flex-shrink-0"
                  style={{
                    backgroundColor: chartConfig.sales.color,
                    boxShadow: `0 0 6px rgba(56,189,248,0.5)`,
                  }}
                />
                {chartConfig.sales.label}:{" "}
                <span className="font-bold tabular-nums" style={{ color: chartConfig.sales.color }}>
                  {activeData.sales.toLocaleString("fa-IR")}
                </span>
              </p>
              <p className="text-[11px] text-gray-500 dark:text-gray-400 flex items-center gap-1.5">
                <span
                  className="w-2 h-2 rounded-full flex-shrink-0"
                  style={{
                    backgroundColor: chartConfig.revenue.color,
                    boxShadow: `0 0 6px rgba(192,132,252,0.5)`,
                  }}
                />
                {chartConfig.revenue.label}:{" "}
                <span className="font-bold tabular-nums" style={{ color: chartConfig.revenue.color }}>
                  {activeData.revenue.toLocaleString("fa-IR")}
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
            onMouseMove={(state: any) => {
              if (state?.activeLabel) setActiveLabel(state.activeLabel);
            }}
            onMouseLeave={() => setActiveLabel(null)}
          >
            <defs>
              <linearGradient id="salesGradFill" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#38bdf8" stopOpacity={isDark ? 0.4 : 0.25} />
                <stop offset="100%" stopColor="#38bdf8" stopOpacity={0} />
              </linearGradient>
              <linearGradient id="revenueGradFill" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#c084fc" stopOpacity={isDark ? 0.35 : 0.2} />
                <stop offset="100%" stopColor="#c084fc" stopOpacity={0} />
              </linearGradient>
              <filter id="salesGlow">
                <feGaussianBlur stdDeviation="3" result="blur" />
                <feMerge>
                  <feMergeNode in="blur" />
                  <feMergeNode in="SourceGraphic" />
                </feMerge>
              </filter>
            </defs>
            <CartesianGrid
              strokeDasharray="3 3"
              stroke={isDark ? "rgba(255,255,255,0.04)" : "#f3f4f6"}
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
              tickFormatter={(v) => `${(v / 1000).toFixed(0)}k`}
            />
            <Area
              type="monotone"
              dataKey="sales"
              stroke="#38bdf8"
              strokeWidth={2.5}
              fill="url(#salesGradFill)"
              dot={false}
              activeDot={{
                r: 5,
                strokeWidth: 0,
                fill: "#38bdf8",
                style: { filter: "drop-shadow(0 0 6px rgba(56,189,248,0.8))" },
              }}
            />
            <Area
              type="monotone"
              dataKey="revenue"
              stroke="#c084fc"
              strokeWidth={2.5}
              fill="url(#revenueGradFill)"
              dot={false}
              activeDot={{
                r: 5,
                strokeWidth: 0,
                fill: "#c084fc",
                style: { filter: "drop-shadow(0 0 6px rgba(192,132,252,0.8))" },
              }}
            />
          </AreaChart>
        </ResponsiveContainer>
      </ChartContainer>

      <div className="flex items-center gap-4 mt-2 justify-end" dir="rtl">
        {Object.entries(chartConfig).map(([key, val]) => (
          <div key={key} className="flex items-center gap-1.5">
            <span
              className="w-3 h-0.5 rounded-full inline-block"
              style={{
                backgroundColor: val.color,
                boxShadow: `0 0 6px ${val.color}`,
              }}
            />
            <span className="text-[11px] text-gray-500 dark:text-gray-400">{val.label}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
