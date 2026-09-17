"use client";

import { AnimatePresence, motion } from "framer-motion";
import { useTheme } from "next-themes";
import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  ResponsiveContainer,
  XAxis,
  YAxis,
} from "recharts";
import { useCancelledTasksByDept, TimeRange } from "@/hooks/useCancelledTasksByDept";

type BarRect = { left: number; top: number; width: number; height: number };

type ActiveBar = {
  stage: string;
  issues: number;
  color: string;
  glow: string;
  index: number;
  isEmpty: boolean;
  rect: BarRect | null;
};

const ranges: { key: TimeRange; label: string; sub: string }[] = [
  { key: "weekly", label: "هفتگی", sub: "هفته اخیر" },
  { key: "monthly", label: "ماهانه", sub: "ماه اخیر" },
  { key: "yearly", label: "سالانه", sub: "سال اخیر" },
];

/**
 * پالت جدید: به‌جای رنگ‌های خام و پرکنتراست قبلی (قرمز/نارنجی/زرد خالص...)
 * یک ست هماهنگ و «پریمیوم‌تر» از خانواده‌ی ایندیگو/بنفش/فیروزه‌ای انتخاب شده
 * که هم در لایت و هم در دارک تمیزتر و چشم‌نواز‌تر دیده می‌شود.
 */
const BAR_COLORS = [
  { color: "#6366f1", glow: "rgba(99,102,241,0.55)" }, // indigo
  { color: "#06b6d4", glow: "rgba(6,182,212,0.55)" }, // cyan
  { color: "#8b5cf6", glow: "rgba(139,92,246,0.55)" }, // violet
  { color: "#10b981", glow: "rgba(16,185,129,0.55)" }, // emerald
  { color: "#f59e0b", glow: "rgba(245,158,11,0.55)" }, // amber
  { color: "#ec4899", glow: "rgba(236,72,153,0.55)" }, // pink
  { color: "#14b8a6", glow: "rgba(20,184,166,0.55)" }, // teal
];

// حداقل ارتفاع نمایشی برای دپارتمان‌هایی که هنوز لغوی نداشته‌اند
// (تا هیچ‌وقت "منتظر داده" نمانیم و همیشه یک UI کامل و چیده‌شده داشته باشیم)
const EMPTY_STUB_RATIO = 0.035;

const STATIC_DEFS_LIGHT = (
  <defs>
    {BAR_COLORS.map((meta, i) => (
      <linearGradient key={i} id={`barGrad-${i}`} x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stopColor={meta.color} stopOpacity={0.98} />
        <stop offset="100%" stopColor={meta.color} stopOpacity={0.62} />
      </linearGradient>
    ))}
    <linearGradient id="trackGradLight" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%" stopColor="#94a3b8" stopOpacity={0.14} />
      <stop offset="100%" stopColor="#94a3b8" stopOpacity={0.05} />
    </linearGradient>
  </defs>
);

const STATIC_DEFS_DARK = (
  <defs>
    {BAR_COLORS.map((meta, i) => (
      <linearGradient key={i} id={`barGrad-${i}`} x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stopColor={meta.color} stopOpacity={0.95} />
        <stop offset="100%" stopColor={meta.color} stopOpacity={0.45} />
      </linearGradient>
    ))}
    <linearGradient id="trackGradDark" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%" stopColor="#ffffff" stopOpacity={0.06} />
      <stop offset="100%" stopColor="#ffffff" stopOpacity={0.015} />
    </linearGradient>
  </defs>
);

function CustomBarShape({
  x = 0,
  y = 0,
  width = 0,
  height = 0,
  index = 0,
  activeIndex,
  isEmptyMap,
}: {
  x?: number;
  y?: number;
  width?: number;
  height?: number;
  index?: number;
  activeIndex: number | null;
  isEmptyMap: boolean[];
}) {
  if (height <= 0) return null;
  const isActive = activeIndex === index;
  const isEmpty = isEmptyMap[index];
  const meta = BAR_COLORS[index % BAR_COLORS.length];
  const radius = Math.min(6, width / 2);

  return (
    <g>
      {isActive && (
        <rect
          x={x - 3}
          y={y - 3}
          width={width + 6}
          height={height + 3}
          rx={radius + 2}
          fill={meta.color}
          opacity={0.14}
        />
      )}
      <path
        d={`M ${x},${y + height} L ${x},${y + radius} Q ${x},${y} ${x + radius},${y} L ${x + width - radius},${y} Q ${x + width},${y} ${x + width},${y + radius} L ${x + width},${y + height} Z`}
        fill={`url(#barGrad-${index})`}
        opacity={isEmpty ? 0.55 : 1}
        style={{
          filter: isActive ? `drop-shadow(0 0 9px ${meta.glow})` : "none",
          transition: "filter 0.2s ease, opacity 0.2s ease",
        }}
      />
      {/* هایلایت شیشه‌ای ظریف روی لبه‌ی بالای هر بار برای حس تمیزتر و مینیمال‌تر */}
      <rect
        x={x + 1}
        y={y}
        width={Math.max(width - 2, 0)}
        height={Math.min(height, 10)}
        rx={radius}
        fill="white"
        opacity={isActive ? 0.16 : 0.08}
        style={{ transition: "opacity 0.2s ease" }}
      />
    </g>
  );
}

function CustomBgShape({
  x = 0,
  y = 0,
  width = 0,
  height = 0,
  index = 0,
  activeIndex,
  isDark,
}: {
  x?: number;
  y?: number;
  width?: number;
  height?: number;
  index?: number;
  activeIndex: number | null;
  isDark: boolean;
}) {
  if (height <= 0) return null;
  const isActive = activeIndex === index;
  const radius = Math.min(6, width / 2);
  const strokeColor = isDark ? "rgba(255,255,255,0.08)" : "rgba(148,163,184,0.35)";
  const fillUrl = isDark ? "url(#trackGradDark)" : "url(#trackGradLight)";

  return (
    <g opacity={isActive ? 1 : 0.85} style={{ transition: "opacity 0.2s ease" }}>
      <path
        d={`M ${x},${y + height} L ${x},${y + radius} Q ${x},${y} ${x + radius},${y} L ${x + width - radius},${y} Q ${x + width},${y} ${x + width},${y + radius} L ${x + width},${y + height} Z`}
        fill={fillUrl}
        stroke={strokeColor}
        strokeWidth={1}
      />
    </g>
  );
}

function CustomXAxisTick({
  x,
  y,
  payload,
}: {
  x?: number;
  y?: number;
  payload?: { value: string };
}) {
  if (!payload?.value || x === undefined || y === undefined) return null;
  return (
    <text x={x} y={y + 14} textAnchor="middle" fontSize={11} fontWeight={500} fill="#64748b">
      {payload.value}
    </text>
  );
}

/**
 * انیمیشن ذرات ریز رو‌به‌بالا (شبیه شراره‌های ملایم / حباب لوله‌ی آزمایش)
 * فقط روی هاور فعال می‌شود و کاملاً روی Canvas پیاده شده تا سبک بماند.
 *
 * نکته‌ی مهم پرفورمنسی: تعداد ذرات یک سقف ثابت دارد (MAX_PARTICLES) و
 * فقط سرعت/نرخ اسپاون بر اساس سهم نسبی این دپارتمان از بیشترین مقدار
 * (نه عدد خام) تنظیم می‌شود؛ یعنی چه ۵ لغو باشد چه ۱۱٬۰۰۰ تا، بار گرافیکی
 * ثابت و قابل پیش‌بینی می‌ماند.
 */
const MAX_PARTICLES = 22;

function ParticleField({
  rect,
  color,
  intensity,
  isDark,
}: {
  rect: BarRect;
  color: string;
  intensity: number; // 0..1, نسبت به بیشترین مقدار دیتاست فعلی
  isDark: boolean;
}) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || rect.width <= 0 || rect.height <= 0) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const prefersReduced =
      typeof window !== "undefined" &&
      !!window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;

    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    canvas.width = Math.max(1, Math.round(rect.width * dpr));
    canvas.height = Math.max(1, Math.round(rect.height * dpr));
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

    const clampedIntensity = Math.min(Math.max(intensity, 0), 1);

    if (prefersReduced) {
      // برای کاربرانی که انیمیشن کم‌تر می‌خواهند: فقط یک درخشش ملایم ثابت
      ctx.clearRect(0, 0, rect.width, rect.height);
      ctx.fillStyle = color;
      ctx.globalAlpha = 0.08 + clampedIntensity * 0.06;
      ctx.fillRect(0, rect.height - 10, rect.width, 10);
      return;
    }

    type Particle = {
      x: number;
      y: number;
      vx: number;
      vy: number;
      r: number;
      life: number;
      maxLife: number;
    };

    const particles: Particle[] = [];
    const spawnEveryFrame = Math.max(2, Math.round(9 - clampedIntensity * 6));
    const speedBase = 22 + clampedIntensity * 55; // px/s
    let frame = 0;
    let lastTime = performance.now();
    let rafId = 0;
    let stopped = false;

    const spawn = () => {
      if (particles.length >= MAX_PARTICLES) return;
      particles.push({
        x: Math.random() * rect.width,
        y: rect.height + 2,
        vy: -(speedBase * (0.7 + Math.random() * 0.6)),
        vx: (Math.random() - 0.5) * 12,
        r: 1 + Math.random() * 1.5,
        life: 0,
        maxLife: 0.9 + Math.random() * 0.7,
      });
    };

    const tick = (now: number) => {
      if (stopped) return;
      const dt = Math.min((now - lastTime) / 1000, 0.05);
      lastTime = now;
      frame += 1;

      if (frame % spawnEveryFrame === 0) spawn();

      ctx.clearRect(0, 0, rect.width, rect.height);

      for (let i = particles.length - 1; i >= 0; i -= 1) {
        const p = particles[i];
        p.life += dt;
        p.x += p.vx * dt;
        p.y += p.vy * dt;
        const t = p.life / p.maxLife;

        if (t >= 1 || p.y < -4) {
          particles.splice(i, 1);
          continue;
        }

        const alpha = t < 0.15 ? t / 0.15 : 1 - (t - 0.15) / 0.85;
        ctx.beginPath();
        ctx.fillStyle = color;
        ctx.globalAlpha = Math.max(0, alpha) * (isDark ? 0.9 : 0.7);
        ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
        ctx.fill();
      }

      rafId = requestAnimationFrame(tick);
    };

    const handleVisibility = () => {
      if (document.hidden) {
        cancelAnimationFrame(rafId);
      } else {
        lastTime = performance.now();
        rafId = requestAnimationFrame(tick);
      }
    };

    document.addEventListener("visibilitychange", handleVisibility);
    rafId = requestAnimationFrame(tick);

    return () => {
      stopped = true;
      document.removeEventListener("visibilitychange", handleVisibility);
      cancelAnimationFrame(rafId);
      ctx.clearRect(0, 0, rect.width, rect.height);
    };
  }, [rect.width, rect.height, color, intensity, isDark]);

  return (
    <canvas
      ref={canvasRef}
      className="pointer-events-none absolute"
      style={{
        left: rect.left,
        top: rect.top,
        width: rect.width,
        height: rect.height,
      }}
    />
  );
}

function SalesIssuesChartSkeleton() {
  return (
    <div className="rounded-2xl border border-gray-200 bg-white p-4 dark:border-white/5 dark:bg-slate-950">
      <div className="mb-3 flex items-start justify-between gap-3" dir="rtl">
        <div className="space-y-2">
          <div className="h-4 w-36 animate-pulse rounded-full bg-gray-100 dark:bg-slate-900" />
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
  const { chartData, loading, error } = useCancelledTasksByDept();
  const [activeRange, setActiveRange] = useState<TimeRange>("monthly");
  const [activeBar, setActiveBar] = useState<ActiveBar | null>(null);
  const { resolvedTheme } = useTheme();
  const isDark = resolvedTheme === "dark";
  const chartWrapperRef = useRef<HTMLDivElement | null>(null);

  const allDepartments = useMemo(() => {
    const seen = new Set<string>();
    Object.values(chartData).forEach((rangeData) => {
      rangeData.forEach((item) => seen.add(item.stage));
    });
    return Array.from(seen);
  }, [chartData]);

  const data = useMemo(() => {
    const current = chartData[activeRange];
    const map = new Map(current.map((item) => [item.stage, item.issues]));
    return allDepartments.map((stage) => ({
      stage,
      issues: map.get(stage) ?? 0,
    }));
  }, [chartData, activeRange, allDepartments]);

  useEffect(() => {
    setActiveBar(null);
  }, [activeRange]);

  const currentRange = useMemo(() => ranges.find((r) => r.key === activeRange), [activeRange]);

  const formattedIssues = useMemo(
    () => (activeBar ? activeBar.issues.toLocaleString("fa-IR") : null),
    [activeBar]
  );

  const maxValue = useMemo(() => Math.max(...data.map((d) => d.issues), 1), [data]);

  // همیشه یک "ترک" کامل پشت هر بار رسم می‌شود (صرف‌نظر از این‌که دیتا صفر باشد یا نه)
  // تا چارت از همان اول برای همه‌ی دپارتمان‌ها چیده و کامل به‌نظر برسد.
  // برای دپارتمان‌های بدون لغو هم یک استاب رنگی خیلی نازک نمایش داده می‌شود
  // که با هاور روی تولتیپ دقیقاً مقدار واقعی (صفر) را نشان می‌دهد.
  const displayData = useMemo(
    () =>
      data.map((item) => ({
        ...item,
        bgBar: maxValue,
        plotIssues: item.issues === 0 ? maxValue * EMPTY_STUB_RATIO : item.issues,
      })),
    [data, maxValue]
  );

  const isEmptyMap = useMemo(() => data.map((d) => d.issues === 0), [data]);

  const handleMouseEnter = useCallback(
    (_: unknown, index: number, event?: { currentTarget?: EventTarget | null; target?: EventTarget | null }) => {
      const item = data[index];
      if (!item) return;
      const meta = BAR_COLORS[index % BAR_COLORS.length];
      const isEmpty = item.issues === 0;

      let rect: BarRect | null = null;
      const rawTarget = (event?.currentTarget ?? event?.target) as Element | null | undefined;
      if (rawTarget && chartWrapperRef.current && "getBoundingClientRect" in rawTarget) {
        const targetRect = rawTarget.getBoundingClientRect();
        const wrapperRect = chartWrapperRef.current.getBoundingClientRect();
        const left = targetRect.left - wrapperRect.left;
        const barBottom = targetRect.top - wrapperRect.top + targetRect.height;
        rect = {
          left,
          top: 0,
          width: targetRect.width,
          height: Math.max(barBottom, targetRect.height),
        };
      }

      setActiveBar({
        stage: item.stage,
        issues: item.issues,
        color: meta.color,
        glow: meta.glow,
        index,
        isEmpty,
        rect,
      });
    },
    [data]
  );

  const handleMouseLeave = useCallback(() => setActiveBar(null), []);

  const renderBarShape = useCallback(
    (props: unknown) => {
      const p = props as { x?: number; y?: number; width?: number; height?: number; index?: number };
      return <CustomBarShape {...p} activeIndex={activeBar?.index ?? null} isEmptyMap={isEmptyMap} />;
    },
    [activeBar?.index, isEmptyMap]
  );

  const renderBgShape = useCallback(
    (props: unknown) => {
      const p = props as { x?: number; y?: number; width?: number; height?: number; index?: number };
      return <CustomBgShape {...p} activeIndex={activeBar?.index ?? null} isDark={isDark} />;
    },
    [activeBar?.index, isDark]
  );

  const renderXTick = useCallback((props: unknown) => <CustomXAxisTick {...(props as any)} />, []);

  const gridColor = isDark ? "rgba(255,255,255,0.04)" : "#e2e8f0";
  const chartDefs = isDark ? STATIC_DEFS_DARK : STATIC_DEFS_LIGHT;

  const activeIntensity = activeBar ? Math.min(activeBar.issues / maxValue, 1) : 0;

  if (loading) return <SalesIssuesChartSkeleton />;
  if (error) {
    return (
      <div className="flex h-[256px] items-center justify-center rounded-2xl border border-red-100 bg-red-50/50 p-4 text-center text-xs text-red-600 dark:border-red-950/20 dark:bg-red-950/5 dark:text-red-400">
        خطایی در لود کردن اطلاعات رخ داد: {error}
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, ease: [0.25, 0.46, 0.45, 0.94] }}
      className="relative rounded-2xl border border-gray-200 bg-white p-4 shadow-sm dark:border-white/8 dark:bg-slate-950"
    >
      <div className="mb-3 flex items-start justify-between gap-3" dir="rtl">
        <div>
          <h3 className="text-[14px] font-semibold text-gray-900 dark:text-white">
            دپارتمان‌های با بیشترین لغو تسک
          </h3>
          <p className="mt-0.5 text-[13px] text-gray-500 dark:text-gray-400">{currentRange?.sub}</p>
        </div>

        <div className="flex items-center gap-1 rounded-xl border border-gray-200 bg-gray-50 p-1 dark:border-white/5 dark:bg-slate-900/50">
          {ranges.map((range) => (
            <button
              key={range.key}
              type="button"
              onClick={() => setActiveRange(range.key)}
              className="relative rounded-lg px-2.5 py-1 text-[11px] font-medium"
            >
              {activeRange === range.key && (
                <motion.span
                  layoutId="salesIssuesRangeIndicator"
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

      {/* Tooltip */}
      <div className="absolute left-2 top-14 z-20 min-w-[150px]">
        <AnimatePresence mode="wait">
          {activeBar && (
            <motion.div
              key={`${activeRange}-${activeBar.stage}`}
              initial={{ opacity: 0, y: 4, scale: 0.96 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 4, scale: 0.96 }}
              transition={{ duration: 0.15, ease: [0.25, 0.46, 0.45, 0.94] }}
              className="pointer-events-none rounded-xl border border-gray-200/60 bg-white/95 px-3 py-2 shadow-lg backdrop-blur-sm dark:border-white/10 dark:bg-slate-900/95"
              style={{
                boxShadow: activeBar.isEmpty
                  ? "0 4px 20px rgba(0,0,0,0.08)"
                  : `0 4px 20px ${activeBar.glow}`,
              }}
            >
              <div className="mb-1 flex items-center gap-1.5">
                <span
                  className="h-2 w-2 rounded-full"
                  style={{
                    backgroundColor: activeBar.isEmpty ? "#cbd5e1" : activeBar.color,
                    boxShadow: activeBar.isEmpty ? "none" : `0 0 6px ${activeBar.glow}`,
                  }}
                />
                <span className="text-[12px] font-semibold text-gray-800 dark:text-gray-100">
                  {activeBar.stage}
                </span>
              </div>
              {activeBar.isEmpty ? (
                <p className="text-[11px] text-gray-400 dark:text-gray-500">هنوز آماری ثبت نشده</p>
              ) : (
                <>
                  <p className="text-[11px] text-gray-500 dark:text-gray-400">
                    تعداد لغو شده:{" "}
                    <span className="font-bold tabular-nums" style={{ color: activeBar.color }}>
                      {formattedIssues}
                    </span>
                  </p>
                  <div className="mt-1.5 h-1 w-full overflow-hidden rounded-full bg-gray-100 dark:bg-slate-800">
                    <div
                      className="h-full rounded-full"
                      style={{
                        width: `${Math.round(activeIntensity * 100)}%`,
                        backgroundColor: activeBar.color,
                      }}
                    />
                  </div>
                </>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <div ref={chartWrapperRef} className="relative h-[200px] w-full overflow-hidden">
        {data.length === 0 ? (
          <div className="flex h-full items-center justify-center text-xs text-gray-400">
            هیچ دپارتمانی ثبت نشده است.
          </div>
        ) : (
          <>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={displayData}
                margin={{ top: 8, right: 4, left: -24, bottom: 8 }}
                barCategoryGap="28%"
                barGap={0}
                onMouseLeave={handleMouseLeave}
              >
                {chartDefs}
                <CartesianGrid strokeDasharray="3 3" stroke={gridColor} vertical={false} />
                <XAxis dataKey="stage" axisLine={false} tickLine={false} tick={renderXTick} interval={0} height={28} />
                <YAxis
                  axisLine={false}
                  tickLine={false}
                  tick={{ fontSize: 11, fontWeight: 500 }}
                  className="[&_text]:fill-gray-400 dark:[&_text]:fill-gray-500"
                />
                {/* ترک پس‌زمینه: همیشه برای همه‌ی دپارتمان‌ها رسم می‌شود */}
                <Bar dataKey="bgBar" shape={renderBgShape} onMouseEnter={handleMouseEnter} isAnimationActive={false} stackId="a">
                  {displayData.map((_, i) => (
                    <Cell key={i} fill="transparent" />
                  ))}
                </Bar>
                {/* بار اصلی (یا استاب نازک برای دپارتمان‌های بدون لغو) */}
                <Bar dataKey="plotIssues" shape={renderBarShape} onMouseEnter={handleMouseEnter} stackId="a">
                  {displayData.map((item, i) => (
                    <Cell key={i} fill={`url(#barGrad-${i})`} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>

            {activeBar?.rect && (
              <ParticleField
                key={`${activeRange}-${activeBar.index}`}
                rect={activeBar.rect}
                color={activeBar.color}
                intensity={activeIntensity}
                isDark={isDark}
              />
            )}
          </>
        )}
      </div>
    </motion.div>
  );
}