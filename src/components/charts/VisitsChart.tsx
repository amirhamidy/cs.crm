"use client";

import { AnimatePresence, motion } from "framer-motion";
import { useTheme } from "next-themes";
import { useEffect, useRef, useState } from "react";
import {
  BarChart,
  Bar,
  CartesianGrid,
  Cell,
  ResponsiveContainer,
  XAxis,
  YAxis,
} from "recharts";
import { ChevronDown } from "lucide-react";

type TimeRange = "weekly" | "monthly" | "yearly";

const ranges: { key: TimeRange; label: string; sub: string }[] = [
  { key: "weekly", label: "هفتگی", sub: "هفته اخیر" },
  { key: "monthly", label: "ماهانه", sub: "ماه اخیر" },
  { key: "yearly", label: "سالانه", sub: "سال اخیر" },
];

const BAR_COLORS = [
  { color: "#f472b6", glow: "rgba(244,114,182,0.55)" },
  { color: "#38bdf8", glow: "rgba(56,189,248,0.55)" },
  { color: "#4ade80", glow: "rgba(74,222,128,0.55)" },
  { color: "#fb923c", glow: "rgba(251,146,60,0.55)" },
  { color: "#c084fc", glow: "rgba(192,132,252,0.55)" },
  { color: "#facc15", glow: "rgba(250,204,21,0.55)" },
  { color: "#f87171", glow: "rgba(248,113,113,0.55)" },
];

const dataByRange: Record<TimeRange, { stage: string; issues: number }[]> = {
  weekly: [
    { stage: "تماس", issues: 12 },
    { stage: "پیگیری", issues: 8 },
    { stage: "پیشنهاد", issues: 5 },
    { stage: "مذاکره", issues: 9 },
    { stage: "بسته", issues: 3 },
  ],
  monthly: [
    { stage: "تماس", issues: 45 },
    { stage: "پیگیری", issues: 31 },
    { stage: "پیشنهاد", issues: 18 },
    { stage: "مذاکره", issues: 27 },
    { stage: "بسته", issues: 11 },
    { stage: "لغو", issues: 7 },
  ],
  yearly: [
    { stage: "تماس", issues: 312 },
    { stage: "پیگیری", issues: 228 },
    { stage: "پیشنهاد", issues: 145 },
    { stage: "مذاکره", issues: 189 },
    { stage: "بسته", issues: 76 },
    { stage: "لغو", issues: 43 },
    { stage: "معلق", issues: 58 },
  ],
};

interface CustomBarProps {
  x?: number;
  y?: number;
  width?: number;
  height?: number;
  fill?: string;
  index?: number;
  activeIndex: number | null;
}

function CustomBarShape({ x = 0, y = 0, width = 0, height = 0, fill = "", index = 0, activeIndex }: CustomBarProps) {
  const isActive = activeIndex === index;
  const meta = BAR_COLORS[index % BAR_COLORS.length];
  const radius = 5;

  if (height <= 0) return null;

  return (
    <g>
      {isActive && (
        <rect
          x={x - 2}
          y={y - 2}
          width={width + 4}
          height={height + 2}
          rx={radius + 1}
          fill={meta.color}
          opacity={0.15}
        />
      )}
      <path
        d={`
          M ${x},${y + height}
          L ${x},${y + radius}
          Q ${x},${y} ${x + radius},${y}
          L ${x + width - radius},${y}
          Q ${x + width},${y} ${x + width},${y + radius}
          L ${x + width},${y + height}
          Z
        `}
        fill={fill}
        style={{
          filter: isActive ? `drop-shadow(0 0 8px ${meta.glow})` : "none",
          transition: "filter 0.2s ease",
        }}
      />
    </g>
  );
}

function SalesIssuesChartSkeleton() {
  return (
    <div className="rounded-2xl border border-gray-100 bg-white p-4 dark:border-white/5 dark:bg-slate-950">
      <div className="mb-3 flex items-start justify-between gap-3" dir="rtl">
        <div className="space-y-2">
          <div className="h-4 w-32 animate-pulse rounded-full bg-gray-100 dark:bg-slate-900" />
          <div className="h-3 w-20 animate-pulse rounded-full bg-gray-100/80 dark:bg-slate-900/60" />
        </div>
        <div className="h-8 w-24 animate-pulse rounded-lg bg-gray-100 dark:bg-slate-900" />
      </div>
      <div className="flex h-[180px] items-end gap-2 px-2">
        {[60, 80, 45, 70, 35, 55].map((h, i) => (
          <div
            key={i}
            className="flex-1 animate-pulse rounded-t-md bg-gray-100 dark:bg-slate-900"
            style={{ height: `${h}%` }}
          />
        ))}
      </div>
    </div>
  );
}

export default function SalesIssuesChart() {
  const [loading, setLoading] = useState(true);
  const [activeRange, setActiveRange] = useState<TimeRange>("monthly");
  const [isOpen, setIsOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState<number | null>(null);
  const [activeBar, setActiveBar] = useState<{ stage: string; issues: number; color: string; glow: string } | null>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const { resolvedTheme } = useTheme();
  const isDark = resolvedTheme === "dark";

  const data = dataByRange[activeRange];
  const currentRange = ranges.find((r) => r.key === activeRange);

  useEffect(() => {
    const timer = setTimeout(() => setLoading(false), 700);
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node))
        setIsOpen(false);
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      clearTimeout(timer);
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  useEffect(() => {
    setActiveIndex(null);
    setActiveBar(null);
  }, [activeRange]);

  if (loading) return <SalesIssuesChartSkeleton />;

  return (
    <div className="relative rounded-2xl border border-gray-100 bg-white p-4 shadow-sm dark:border-white/5 dark:bg-slate-950">
      <div className="mb-3 flex items-start justify-between gap-3" dir="rtl">
        <div>
          <h3 className="text-[14px] font-semibold text-gray-900 dark:text-white">
            مشکلات مراحل فروش
          </h3>
          <p className="mt-0.5 text-[13px] text-gray-500 dark:text-gray-400">
            {currentRange?.sub}
          </p>
        </div>

        <div ref={dropdownRef} className="relative">
          <button
            type="button"
            onClick={() => setIsOpen((p) => !p)}
            className="flex items-center gap-1.5 rounded-lg border border-gray-100 bg-gray-50 px-2.5 py-1 text-[11px] font-medium text-gray-600 transition-colors hover:bg-gray-100 dark:border-white/5 dark:bg-slate-900 dark:text-gray-300 dark:hover:bg-slate-800"
          >
            {currentRange?.label}
            <ChevronDown
              size={12}
              className={`transition-transform duration-200 ${isOpen ? "rotate-180" : ""}`}
            />
          </button>

          <AnimatePresence>
            {isOpen && (
              <motion.div
                initial={{ opacity: 0, y: 5, scale: 0.97 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 5, scale: 0.97 }}
                transition={{ duration: 0.15 }}
                className="absolute left-0 top-full z-20 mt-1.5 w-28 overflow-hidden rounded-xl border border-gray-100 bg-white shadow-xl dark:border-white/10 dark:bg-slate-900"
              >
                {ranges.map((range) => (
                  <button
                    key={range.key}
                    type="button"
                    onClick={() => { setActiveRange(range.key); setIsOpen(false); }}
                    className="w-full px-3 py-1.5 text-right text-[11px] text-gray-700 hover:bg-gray-50 dark:text-gray-300 dark:hover:bg-slate-800"
                  >
                    {range.label}
                  </button>
                ))}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      <div className="absolute top-14 left-2 z-10 min-w-[130px]">
        <AnimatePresence mode="wait">
          {activeBar && (
            <motion.div
              key={`${activeRange}-${activeBar.stage}`}
              initial={{ opacity: 0, y: 4, filter: "blur(8px)", scale: 0.96 }}
              animate={{ opacity: 1, y: 0, filter: "blur(0px)", scale: 1 }}
              exit={{ opacity: 0, y: 4, filter: "blur(6px)", scale: 0.96 }}
              transition={{ duration: 0.18 }}
              className="pointer-events-none rounded-xl border border-gray-200/60 bg-white/95 px-3 py-2 shadow-lg backdrop-blur-sm dark:border-white/10 dark:bg-slate-900/95"
              style={{ boxShadow: `0 4px 20px ${activeBar.glow}` }}
            >
              <div className="mb-1 flex items-center gap-1.5">
                <span
                  className="h-2 w-2 rounded-full"
                  style={{
                    backgroundColor: activeBar.color,
                    boxShadow: `0 0 6px ${activeBar.glow}`,
                  }}
                />
                <span className="text-[12px] font-semibold text-gray-800 dark:text-gray-100">
                  {activeBar.stage}
                </span>
              </div>
              <p className="text-[11px] text-gray-500 dark:text-gray-400">
                تعداد مشکل:{" "}
                <span className="font-bold tabular-nums" style={{ color: activeBar.color }}>
                  {activeBar.issues.toLocaleString("fa-IR")}
                </span>
              </p>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <div className="h-[180px] w-full">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart
            data={data}
            margin={{ top: 8, right: 4, left: -24, bottom: 0 }}
            barCategoryGap="28%"
            onMouseLeave={() => { setActiveIndex(null); setActiveBar(null); }}
          >
            <defs>
              {data.map((_, i) => {
                const meta = BAR_COLORS[i % BAR_COLORS.length];
                return (
                  <linearGradient key={i} id={`barGrad-${i}`} x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor={meta.color} stopOpacity={isDark ? 0.95 : 0.85} />
                    <stop offset="100%" stopColor={meta.color} stopOpacity={isDark ? 0.5 : 0.4} />
                  </linearGradient>
                );
              })}
            </defs>
            <CartesianGrid
              strokeDasharray="3 3"
              stroke={isDark ? "rgba(255,255,255,0.04)" : "#f3f4f6"}
              vertical={false}
            />
            <XAxis
              dataKey="stage"
              axisLine={false}
              tickLine={false}
              tick={{ fontSize: 11, fontWeight: 500 }}
              className="[&_text]:fill-gray-500 dark:[&_text]:fill-gray-400"
              dy={5}
            />
            <YAxis
              axisLine={false}
              tickLine={false}
              tick={{ fontSize: 11, fontWeight: 500 }}
              className="[&_text]:fill-gray-500 dark:[&_text]:fill-gray-400"
            />
            <Bar
              dataKey="issues"
              radius={[5, 5, 0, 0]}
              onMouseEnter={(_: unknown, index: number) => {
                const item = data[index];
                const meta = BAR_COLORS[index % BAR_COLORS.length];
                setActiveIndex(index);
                setActiveBar({ stage: item.stage, issues: item.issues, color: meta.color, glow: meta.glow });
              }}
              shape={(props: unknown) => {
                const p = props as CustomBarProps;
                return <CustomBarShape {...p} activeIndex={activeIndex} />;
              }}
            >
              {data.map((_, i) => (
                <Cell key={i} fill={`url(#barGrad-${i})`} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
