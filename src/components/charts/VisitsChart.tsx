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
import {
  useCancelledTasksByDept,
  TimeRange,
} from "@/hooks/useCancelledTasksByDept";

type BarRect = {
  left: number;
  top: number;
  width: number;
  height: number;
};

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

const BAR_COLORS = [
  { color: "#ff4f68", glow: "rgba(255,79,104,0.72)" },
  { color: "#29b6f6", glow: "rgba(41,182,246,0.72)" },
  { color: "#2ee6a6", glow: "rgba(46,230,166,0.72)" },
  { color: "#a66cff", glow: "rgba(166,108,255,0.72)" },
  { color: "#aebdce", glow: "rgba(174,189,206,0.68)" },
  { color: "#ffd34d", glow: "rgba(255,211,77,0.72)" },
  { color: "#ff8a3d", glow: "rgba(255,138,61,0.72)" },
];

const STATIC_DEFS_LIGHT = (
  <defs>
    {BAR_COLORS.map((meta, i) => (
      <linearGradient
        key={i}
        id={`barGrad-${i}`}
        x1="0"
        y1="0"
        x2="0"
        y2="1"
      >
        <stop offset="0%" stopColor={meta.color} stopOpacity={1} />
        <stop offset="42%" stopColor={meta.color} stopOpacity={0.72} />
        <stop offset="100%" stopColor={meta.color} stopOpacity={0.12} />
      </linearGradient>
    ))}
  </defs>
);

const STATIC_DEFS_DARK = (
  <defs>
    {BAR_COLORS.map((meta, i) => (
      <linearGradient
        key={i}
        id={`barGrad-${i}`}
        x1="0"
        y1="0"
        x2="0"
        y2="1"
      >
        <stop offset="0%" stopColor={meta.color} stopOpacity={1} />
        <stop offset="42%" stopColor={meta.color} stopOpacity={0.62} />
        <stop offset="100%" stopColor={meta.color} stopOpacity={0.08} />
      </linearGradient>
    ))}
  </defs>
);

function CustomBarShape({
  x = 0,
  y = 0,
  width = 0,
  height = 0,
  index = 0,
  activeIndex,
  hoverKey,
  isEmptyMap,
}: {
  x?: number;
  y?: number;
  width?: number;
  height?: number;
  index?: number;
  activeIndex: number | null;
  hoverKey: number;
  isEmptyMap: boolean[];
}) {
  if (width <= 0 || height <= 0) return null;

  const isActive = activeIndex === index;
  const isEmpty = isEmptyMap[index] ?? false;
  const meta = BAR_COLORS[index % BAR_COLORS.length];
  const radius = Math.min(6, width / 2);

  return (
    <motion.g
      key={`${index}-${hoverKey}`}
      animate={isActive ? { scale: [1, 0.96, 1] } : { scale: 1 }}
      transition={{
        duration: 0.3,
        ease: [0.22, 1, 0.36, 1],
      }}
      style={{
        transformOrigin: `${x + width / 2}px ${y + height}px`,
      }}
    >
      {isActive && (
        <rect
          x={x - 3}
          y={y - 3}
          width={width + 6}
          height={height + 3}
          rx={radius + 2}
          fill={meta.color}
          opacity={0.18}
        />
      )}

      <path
        d={`M ${x},${y + height} L ${x},${y + radius} Q ${x},${y} ${x + radius
          },${y} L ${x + width - radius},${y} Q ${x + width},${y} ${x + width
          },${y + radius} L ${x + width},${y + height} Z`}
        fill={`url(#barGrad-${index % BAR_COLORS.length})`}
        opacity={isEmpty ? 0.35 : 1}
        style={{
          filter: isActive
            ? `drop-shadow(0 0 11px ${meta.glow})`
            : "none",
          transition: "filter 0.2s ease, opacity 0.2s ease",
        }}
      />

      <rect
        x={x + 1}
        y={y}
        width={Math.max(width - 2, 0)}
        height={Math.min(height, 10)}
        rx={radius}
        fill="white"
        opacity={isActive ? 0.2 : 0.1}
        style={{ transition: "opacity 0.2s ease" }}
      />
    </motion.g>
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
    <text
      x={x}
      y={y + 14}
      textAnchor="middle"
      fontSize={11}
      fontWeight={500}
      fill="#64748b"
    >
      {payload.value}
    </text>
  );
}

const MAX_PARTICLES = 22;

function ParticleField({
  rect,
  color,
  intensity,
  isDark,
}: {
  rect: BarRect;
  color: string;
  intensity: number;
  isDark: boolean;
}) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;

    if (!canvas || rect.width <= 0 || rect.height <= 0) {
      return;
    }

    const ctx = canvas.getContext("2d");

    if (!ctx) {
      return;
    }

    const prefersReduced =
      typeof window !== "undefined" &&
      !!window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;

    const dpr = Math.min(window.devicePixelRatio || 1, 2);

    canvas.width = Math.max(1, Math.round(rect.width * dpr));
    canvas.height = Math.max(1, Math.round(rect.height * dpr));

    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

    const clampedIntensity = Math.min(
      Math.max(intensity, 0),
      1,
    );

    if (prefersReduced) {
      ctx.clearRect(0, 0, rect.width, rect.height);
      ctx.fillStyle = color;
      ctx.globalAlpha = 0.1 + clampedIntensity * 0.08;
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
    const spawnEveryFrame = Math.max(
      2,
      Math.round(9 - clampedIntensity * 6),
    );
    const speedBase = 22 + clampedIntensity * 55;

    let frame = 0;
    let lastTime = performance.now();
    let rafId = 0;
    let stopped = false;

    const spawn = () => {
      if (particles.length >= MAX_PARTICLES) {
        return;
      }

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
      if (stopped) {
        return;
      }

      const dt = Math.min(
        (now - lastTime) / 1000,
        0.05,
      );

      lastTime = now;
      frame += 1;

      if (frame % spawnEveryFrame === 0) {
        spawn();
      }

      ctx.clearRect(
        0,
        0,
        rect.width,
        rect.height,
      );

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

        const alpha =
          t < 0.15
            ? t / 0.15
            : 1 - (t - 0.15) / 0.85;

        ctx.beginPath();
        ctx.fillStyle = color;
        ctx.globalAlpha =
          Math.max(0, alpha) *
          (isDark ? 1 : 0.85);

        ctx.arc(
          p.x,
          p.y,
          p.r,
          0,
          Math.PI * 2,
        );

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

    document.addEventListener(
      "visibilitychange",
      handleVisibility,
    );

    rafId = requestAnimationFrame(tick);

    return () => {
      stopped = true;
      document.removeEventListener(
        "visibilitychange",
        handleVisibility,
      );
      cancelAnimationFrame(rafId);
      ctx.clearRect(
        0,
        0,
        rect.width,
        rect.height,
      );
    };
  }, [
    rect.width,
    rect.height,
    color,
    intensity,
    isDark,
  ]);

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
      <div
        className="mb-3 flex items-start justify-between gap-3"
        dir="rtl"
      >
        <div className="space-y-2">
          <div className="h-4 w-36 animate-pulse rounded-full bg-gray-100 dark:bg-slate-900" />
          <div className="h-3 w-20 animate-pulse rounded-full bg-gray-100/80 dark:bg-slate-900/60" />
        </div>

        <div className="h-8 w-24 animate-pulse rounded-lg bg-gray-100 dark:bg-slate-900" />
      </div>

      <div className="flex h-[180px] items-end gap-2 px-2">
        {[60, 80, 45, 70, 35, 55].map(
          (h, i) => (
            <div
              key={i}
              className="flex-1 animate-pulse rounded-t-md bg-gray-100 dark:bg-slate-900"
              style={{ height: `${h}%` }}
            />
          ),
        )}
      </div>
    </div>
  );
}

export default function SalesIssuesChart() {
  const {
    chartData,
    loading,
    error,
  } = useCancelledTasksByDept();

  const [activeRange, setActiveRange] =
    useState<TimeRange>("monthly");

  const [activeBar, setActiveBar] =
    useState<ActiveBar | null>(null);

  const [hoverKey, setHoverKey] =
    useState(0);

  const { resolvedTheme } = useTheme();
  const isDark = resolvedTheme === "dark";

  const chartWrapperRef =
    useRef<HTMLDivElement | null>(null);

  const allDepartments = useMemo(() => {
    const seen = new Set<string>();

    Object.values(chartData).forEach(
      (rangeData) => {
        rangeData.forEach((item) =>
          seen.add(item.stage),
        );
      },
    );

    return Array.from(seen);
  }, [chartData]);

  const data = useMemo(() => {
    const current =
      chartData[activeRange];

    const map = new Map(
      current.map((item) => [
        item.stage,
        item.issues,
      ]),
    );

    return allDepartments.map(
      (stage) => ({
        stage,
        issues: map.get(stage) ?? 0,
      }),
    );
  }, [
    chartData,
    activeRange,
    allDepartments,
  ]);

  useEffect(() => {
    setActiveBar(null);
  }, [activeRange]);

  const currentRange = useMemo(
    () =>
      ranges.find(
        (r) => r.key === activeRange,
      ),
    [activeRange],
  );

  const formattedIssues = useMemo(
    () =>
      activeBar
        ? activeBar.issues.toLocaleString(
          "fa-IR",
        )
        : null,
    [activeBar],
  );

  const maxValue = useMemo(
    () =>
      Math.max(
        ...data.map(
          (d) => d.issues,
        ),
        1,
      ),
    [data],
  );

  const displayData = useMemo(
    () =>
      data.map((item) => ({
        ...item,
        plotValue: maxValue,
      })),
    [data, maxValue],
  );

  const isEmptyMap = useMemo(
    () =>
      data.map(
        (d) => d.issues === 0,
      ),
    [data],
  );

  const handleMouseEnter =
    useCallback(
      (
        _entry: unknown,
        index: number,
        event?: {
          currentTarget?:
          | EventTarget
          | null;
          target?:
          | EventTarget
          | null;
        },
      ) => {
        const item = data[index];

        if (!item) {
          return;
        }

        const meta =
          BAR_COLORS[
          index % BAR_COLORS.length
          ];

        const isEmpty =
          item.issues === 0;

        let rect: BarRect | null =
          null;

        const rawTarget =
          (event?.currentTarget ??
            event?.target) as
          | Element
          | null
          | undefined;

        if (
          rawTarget &&
          chartWrapperRef.current &&
          "getBoundingClientRect" in
          rawTarget
        ) {
          const targetRect =
            rawTarget.getBoundingClientRect();

          const wrapperRect =
            chartWrapperRef.current.getBoundingClientRect();

          const left =
            targetRect.left -
            wrapperRect.left;

          rect = {
            left,
            top:
              targetRect.top -
              wrapperRect.top,
            width:
              targetRect.width,
            height:
              targetRect.height,
          };
        }

        setHoverKey(
          (value) => value + 1,
        );

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
      [data],
    );

  const handleMouseLeave =
    useCallback(
      () => setActiveBar(null),
      [],
    );

  const renderBarShape =
    useCallback(
      (props: unknown) => {
        const p = props as {
          x?: number;
          y?: number;
          width?: number;
          height?: number;
          index?: number;
        };

        return (
          <CustomBarShape
            {...p}
            activeIndex={
              activeBar?.index ?? null
            }
            hoverKey={hoverKey}
            isEmptyMap={
              isEmptyMap
            }
          />
        );
      },
      [
        activeBar?.index,
        hoverKey,
        isEmptyMap,
      ],
    );

  const renderXTick =
    useCallback(
      (props: unknown) => (
        <CustomXAxisTick
          {...(props as any)}
        />
      ),
      [],
    );

  const gridColor = isDark
    ? "rgba(255,255,255,0.04)"
    : "#e2e8f0";

  const chartDefs = isDark
    ? STATIC_DEFS_DARK
    : STATIC_DEFS_LIGHT;

  const activeIntensity = activeBar
    ? Math.min(
      activeBar.issues /
      maxValue,
      1,
    )
    : 0;

  if (loading) {
    return (
      <SalesIssuesChartSkeleton />
    );
  }

  if (error) {
    return (
      <div className="flex h-[256px] items-center justify-center rounded-2xl border border-red-100 bg-red-50/50 p-4 text-center text-xs text-red-600 dark:border-red-950/20 dark:bg-red-950/5 dark:text-red-400">
        خطایی در لود کردن اطلاعات رخ داد:{" "}
        {error}
      </div>
    );
  }

  return (
    <motion.div
      initial={{
        opacity: 0,
        y: 6,
      }}
      animate={{
        opacity: 1,
        y: 0,
      }}
      transition={{
        duration: 0.3,
        ease: [
          0.25,
          0.46,
          0.45,
          0.94,
        ],
      }}
      className="relative rounded-2xl border border-gray-200 bg-white p-4 shadow-sm dark:border-white/8 dark:bg-slate-950"
    >
      <div
        className="mb-3 flex items-start justify-between gap-3"
        dir="rtl"
      >
        <div>
          <h3 className="text-[14px] font-semibold text-gray-900 dark:text-white">
            دپارتمان‌های با بیشترین لغو تسک
          </h3>

          <p className="mt-0.5 text-[13px] text-gray-500 dark:text-gray-400">
            {currentRange?.sub}
          </p>
        </div>

        <div className="flex items-center gap-1 rounded-xl border border-gray-200 bg-gray-50 p-1 dark:border-white/5 dark:bg-slate-900/50">
          {ranges.map((range) => (
            <button
              key={range.key}
              type="button"
              onClick={() =>
                setActiveRange(
                  range.key,
                )
              }
              className="relative rounded-lg px-2.5 py-1 text-[11px] font-medium"
            >
              {activeRange ===
                range.key && (
                  <motion.span
                    layoutId="salesIssuesRangeIndicator"
                    className="absolute inset-0 rounded-lg bg-white shadow-sm dark:bg-slate-800"
                    transition={{
                      type: "spring",
                      stiffness: 400,
                      damping: 30,
                    }}
                  />
                )}

              <span
                className={`relative z-10 transition-colors ${activeRange ===
                    range.key
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

      <div className="absolute left-2 top-14 z-20 min-w-[150px]">
        <AnimatePresence mode="wait">
          {activeBar && (
            <motion.div
              key={`${activeRange}-${activeBar.stage}`}
              initial={{
                opacity: 0,
                y: 4,
                scale: 0.96,
              }}
              animate={{
                opacity: 1,
                y: 0,
                scale: 1,
              }}
              exit={{
                opacity: 0,
                y: 4,
                scale: 0.96,
              }}
              transition={{
                duration: 0.15,
                ease: [
                  0.25,
                  0.46,
                  0.45,
                  0.94,
                ],
              }}
              className="pointer-events-none rounded-xl border border-gray-200/60 bg-white/95 px-3 py-2 shadow-lg backdrop-blur-sm dark:border-white/10 dark:bg-slate-900/95"
              style={{
                boxShadow:
                  activeBar.isEmpty
                    ? "0 4px 20px rgba(0,0,0,0.08)"
                    : `0 4px 20px ${activeBar.glow}`,
              }}
            >
              <div className="mb-1 flex items-center gap-1.5">
                <span
                  className="h-2 w-2 rounded-full"
                  style={{
                    backgroundColor:
                      activeBar.isEmpty
                        ? "#cbd5e1"
                        : activeBar.color,
                    boxShadow:
                      activeBar.isEmpty
                        ? "none"
                        : `0 0 7px ${activeBar.glow}`,
                  }}
                />

                <span className="text-[12px] font-semibold text-gray-800 dark:text-gray-100">
                  {activeBar.stage}
                </span>
              </div>

              {activeBar.isEmpty ? (
                <p className="text-[11px] text-gray-400 dark:text-gray-500">
                  هنوز آماری ثبت نشده
                </p>
              ) : (
                <>
                  <p className="text-[11px] text-gray-500 dark:text-gray-400">
                    تعداد لغو شده:{" "}
                    <span
                      className="font-bold tabular-nums"
                      style={{
                        color:
                          activeBar.color,
                      }}
                    >
                      {formattedIssues}
                    </span>
                  </p>

                  <div className="mt-1.5 h-1 w-full overflow-hidden rounded-full bg-gray-100 dark:bg-slate-800">
                    <div
                      className="h-full rounded-full"
                      style={{
                        width: `${Math.round(
                          activeIntensity * 100,
                        )}%`,
                        backgroundColor:
                          activeBar.color,
                      }}
                    />
                  </div>
                </>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <div
        ref={chartWrapperRef}
        className="relative h-[200px] w-full overflow-hidden"
      >
        {data.length === 0 ? (
          <div className="flex h-full items-center justify-center text-xs text-gray-400">
            هیچ دپارتمانی ثبت نشده است.
          </div>
        ) : (
          <>
            <ResponsiveContainer
              width="100%"
              height="100%"
            >
              <BarChart
                data={displayData}
                margin={{
                  top: 8,
                  right: 4,
                  left: -24,
                  bottom: 8,
                }}
                barCategoryGap="20%"
                barGap={0}
                onMouseLeave={
                  handleMouseLeave
                }
              >
                {chartDefs}

                <CartesianGrid
                  strokeDasharray="3 3"
                  stroke={gridColor}
                  vertical={false}
                />

                <XAxis
                  dataKey="stage"
                  axisLine={false}
                  tickLine={false}
                  tick={renderXTick}
                  interval={0}
                  height={28}
                />

                <YAxis
                  axisLine={false}
                  tickLine={false}
                  tick={{
                    fontSize: 11,
                    fontWeight: 500,
                  }}
                  className="[&_text]:fill-gray-400 dark:[&_text]:fill-gray-500"
                />

                <Bar
                  dataKey="plotValue"
                  shape={renderBarShape}
                  onMouseEnter={
                    handleMouseEnter
                  }
                  isAnimationActive={false}
                  minPointSize={8}
                >
                  {displayData.map(
                    (_, i) => (
                      <Cell
                        key={i}
                        fill={`url(#barGrad-${i %
                          BAR_COLORS.length
                          })`}
                      />
                    ),
                  )}
                </Bar>
              </BarChart>
            </ResponsiveContainer>

            {activeBar?.rect && (
              <ParticleField
                key={`${activeRange}-${activeBar.index}`}
                rect={activeBar.rect}
                color={
                  activeBar.color
                }
                intensity={
                  activeIntensity
                }
                isDark={isDark}
              />
            )}
          </>
        )}
      </div>
    </motion.div>
  );
}