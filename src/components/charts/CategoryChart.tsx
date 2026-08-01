"use client";

import { AnimatePresence, motion } from "framer-motion";
import { ChevronDown } from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import { Cell, Pie, PieChart, ResponsiveContainer } from "recharts";

type TimeRange = "weekly" | "monthly" | "yearly";
type SliceKey = "instagram" | "website" | "referral" | "ads";

const ranges: { key: TimeRange; label: string; sub: string }[] = [
  { key: "weekly", label: "هفتگی", sub: "هفته اخیر" },
  { key: "monthly", label: "ماهانه", sub: "ماه اخیر" },
  { key: "yearly", label: "سالانه", sub: "سال اخیر" },
];

const dataByRange: Record<TimeRange, { name: SliceKey; value: number }[]> = {
  weekly: [
    { name: "instagram", value: 4200 },
    { name: "website", value: 3100 },
    { name: "referral", value: 1800 },
    { name: "ads", value: 900 },
  ],
  monthly: [
    { name: "instagram", value: 78 },
    { name: "website", value: 45 },
    { name: "referral", value: 23 },
    { name: "ads", value: 54 },
  ],
  yearly: [
    { name: "instagram", value: 378 },
    { name: "website", value: 145 },
    { name: "referral", value: 523 },
    { name: "ads", value: 554 },
  ],
};

const chartMeta: Record<SliceKey, { label: string; color: string; glow: string }> = {
  instagram: { label: "اینستاگرام", color: "#f472b6", glow: "rgba(244,114,182,0.35)" },
  website: { label: "وب‌سایت", color: "#38bdf8", glow: "rgba(56,189,248,0.35)" },
  referral: { label: "معرفی", color: "#4ade80", glow: "rgba(74,222,128,0.35)" },
  ads: { label: "تبلیغات", color: "#fb923c", glow: "rgba(251,146,60,0.35)" },
};

type ActiveSlice = {
  name: SliceKey;
  label: string;
  value: number;
  color: string;
  glow: string;
  pct: string;
};

function CategoryChartSkeleton() {
  return (
    <div className="rounded-2xl border border-gray-100 bg-white p-4 dark:border-white/5 dark:bg-slate-950">
      <div className="mb-3 flex items-start justify-between gap-3" dir="rtl">
        <div className="space-y-2">
          <div className="h-4 w-28 animate-pulse rounded-full bg-gray-100 dark:bg-slate-900" />
          <div className="h-3 w-20 animate-pulse rounded-full bg-gray-100/80 dark:bg-slate-900/60" />
        </div>
        <div className="h-8 w-24 animate-pulse rounded-lg bg-gray-100 dark:bg-slate-900" />
      </div>
      <div className="flex h-[180px] items-center justify-center">
        <div className="h-[140px] w-[140px] animate-pulse rounded-full bg-gray-100 dark:bg-slate-900" />
      </div>
    </div>
  );
}

export default function CategoryChart() {
  const [loading, setLoading] = useState(true);
  const [activeRange, setActiveRange] = useState<TimeRange>("weekly");
  const [isOpen, setIsOpen] = useState(false);
  const [activeSlice, setActiveSlice] = useState<ActiveSlice | null>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const data = dataByRange[activeRange];
  const total = useMemo(() => data.reduce((sum, i) => sum + i.value, 0), [data]);
  const currentRange = useMemo(() => ranges.find((r) => r.key === activeRange), [activeRange]);

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

  useEffect(() => setActiveSlice(null), [activeRange]);

  if (loading) return <CategoryChartSkeleton />;

  return (
    <div className="relative rounded-2xl border border-gray-100 bg-white p-4 shadow-sm dark:border-white/5 dark:bg-slate-950">
      <div className="mb-3 flex items-start justify-between gap-3" dir="rtl">
        <div>
          <h3 className="text-[14px] font-semibold text-gray-900 dark:text-white">
            بیشترین منابع فروش
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
            aria-haspopup="menu"
            aria-expanded={isOpen}
          >
            {currentRange?.label}
            <ChevronDown size={12} />
          </button>

          <AnimatePresence>
            {isOpen && (
              <motion.div
                initial={{ opacity: 0, y: 5, scale: 0.98 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 5, scale: 0.98 }}
                transition={{ duration: 0.15 }}
                className="absolute left-0 top-full z-20 mt-1.5 w-28 overflow-hidden rounded-xl border border-gray-100 bg-white shadow-xl dark:border-white/10 dark:bg-slate-900"
                role="menu"
              >
                {ranges.map((range) => (
                  <button
                    key={range.key}
                    type="button"
                    onClick={() => { setActiveRange(range.key); setIsOpen(false); }}
                    className="w-full px-3 py-1.5 text-right text-[11px] text-gray-700 hover:bg-gray-50 dark:text-gray-300 dark:hover:bg-slate-800"
                    role="menuitem"
                  >
                    {range.label}
                  </button>
                ))}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      <div className="relative h-[180px]">
        <div className="absolute left-2 top-2 z-10 min-w-[140px]">
          <AnimatePresence mode="wait">
            {activeSlice && (
              <motion.div
                key={`${activeRange}-${activeSlice.name}`}
                initial={{ opacity: 0, y: 4, filter: "blur(8px)", scale: 0.96 }}
                animate={{ opacity: 1, y: 0, filter: "blur(0px)", scale: 1 }}
                exit={{ opacity: 0, y: 4, filter: "blur(6px)", scale: 0.96 }}
                transition={{ duration: 0.18 }}
                className="pointer-events-none rounded-xl border border-gray-200/60 bg-white/95 backdrop-blur-sm px-3 py-2 shadow-lg dark:border-white/10 dark:bg-slate-900/95"
                style={{
                  boxShadow: `0 4px 20px ${activeSlice.glow}`,
                }}
              >
                <div className="mb-1 flex items-center gap-1.5">
                  <span
                    className="h-2 w-2 rounded-full"
                    style={{
                      backgroundColor: activeSlice.color,
                      boxShadow: `0 0 6px ${activeSlice.glow}`,
                    }}
                  />
                  <span className="text-[12px] font-semibold text-gray-800 dark:text-gray-100">
                    {activeSlice.label}
                  </span>
                </div>
                <p className="text-[11px] text-gray-500 dark:text-gray-400">
                  سهم فروش:{" "}
                  <span className="font-bold tabular-nums" style={{ color: activeSlice.color }}>
                    {activeSlice.pct}%
                  </span>
                </p>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <defs>
              {(Object.entries(chartMeta) as [SliceKey, typeof chartMeta[SliceKey]][]).map(([key, meta]) => (
                <radialGradient key={key} id={`pieGrad-${key}`} cx="50%" cy="50%" r="50%">
                  <stop offset="0%" stopColor={meta.color} stopOpacity={1} />
                  <stop offset="100%" stopColor={meta.color} stopOpacity={0.65} />
                </radialGradient>
              ))}
            </defs>
            <Pie
              data={data}
              dataKey="value"
              nameKey="name"
              cx="50%"
              cy="50%"
              innerRadius={48}
              outerRadius={74}
              paddingAngle={4}
              strokeWidth={0}
              onMouseEnter={(_, index) => {
                const item = data[index];
                if (!item) return;
                const meta = chartMeta[item.name];
                setActiveSlice({
                  name: item.name,
                  label: meta.label,
                  value: item.value,
                  color: meta.color,
                  glow: meta.glow,
                  pct: total ? ((item.value / total) * 100).toFixed(1) : "0.0",
                });
              }}
              onMouseLeave={() => setActiveSlice(null)}
            >
              {data.map((entry) => (
                <Cell
                  key={`${activeRange}-${entry.name}`}
                  fill={`url(#pieGrad-${entry.name})`}
                  stroke="none"
                  style={{
                    filter: activeSlice?.name === entry.name
                      ? `drop-shadow(0 0 8px ${chartMeta[entry.name].glow})`
                      : "none",
                    transition: "filter 0.2s ease",
                  }}
                />
              ))}
            </Pie>
          </PieChart>
        </ResponsiveContainer>

        <div
          className="pointer-events-none absolute inset-0 flex items-center justify-center"
          style={{ paddingBottom: 0 }}
        >
          <AnimatePresence mode="wait">
            {activeSlice ? (
              <motion.div
                key={activeSlice.name}
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.8 }}
                transition={{ duration: 0.15 }}
                className="text-center"
              >
                <p className="text-[20px] font-bold tabular-nums" style={{ color: activeSlice.color }}>
                  {activeSlice.pct}%
                </p>
              </motion.div>
            ) : (
              <motion.div
                key="total"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="text-center"
              >
                <p className="text-[10px] text-gray-400 dark:text-gray-500">کل</p>
                <p className="text-[16px] font-bold text-gray-700 dark:text-gray-200 tabular-nums">
                  {total.toLocaleString("fa-IR")}
                </p>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      <div className="mt-2 grid grid-cols-2 gap-1" dir="rtl">
        {data.map((entry) => {
          const meta = chartMeta[entry.name];
          const pct = total ? ((entry.value / total) * 100).toFixed(1) : "0.0";
          const isActive = activeSlice?.name === entry.name;

          return (
            <motion.div
              key={`${activeRange}-${entry.name}`}
              animate={{
                backgroundColor: isActive ? `${meta.glow}` : "transparent",
              }}
              transition={{ duration: 0.15 }}
              className="flex items-center gap-1.5 rounded-lg px-2 py-1 cursor-default"
            >
              <span
                className="h-2 w-2 rounded-full flex-shrink-0"
                style={{
                  backgroundColor: meta.color,
                  boxShadow: isActive ? `0 0 6px ${meta.glow}` : "none",
                }}
              />
              <span className="flex-1 text-[12px] text-gray-600 dark:text-gray-300">
                {meta.label}
              </span>
              <span
                className="tabular-nums text-[12px] font-bold"
                style={{ color: meta.color }}
              >
                {pct}%
              </span>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}
