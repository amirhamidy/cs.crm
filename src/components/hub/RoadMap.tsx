"use client";

import { memo, useId, useMemo } from "react";
import Link from "next/link";
import { m, useReducedMotion } from "framer-motion";
import { useRouter } from "next/navigation";
import { LogOut, X } from "lucide-react";
import { useMenuItems } from "@/hooks/useMenuItems";
import { useIsMobile } from "@/hooks/useIsMobile";
import { useLogout } from "@/hooks/useLogout";
import { useAuthStore } from "@/store/authStore";
import { EASE_OUT } from "@/lib/motion";
import MenuIcon from "@/components/sidebar/MenuIcon";
import type { MenuItem } from "@/config/menu";

const COL_W = 168;
const PAD_Y = 30;
const WAVE = 12;
const MARGIN = 90;

const COLORS = [
  "bg-green-500", "bg-sky-500", "bg-amber-500", "bg-cyan-500",
  "bg-blue-500", "bg-teal-500", "bg-lime-600", "bg-orange-500",
  "bg-indigo-500", "bg-emerald-500", "bg-violet-500", "bg-rose-500",
];

function layout(count: number, cols: number, ROW_H: number) {
  const rows = Math.max(1, Math.ceil(count / cols));
  const width = cols * COL_W;
  const height = rows * ROW_H + PAD_Y;
  const stops = Array.from({ length: count }, (_, i) => {
    const r = Math.floor(i / cols);
    const c = i % cols;
    const visual = r % 2 === 0 ? cols - 1 - c : c;
    return { x: (visual + 0.5) * COL_W, y: r * ROW_H + ROW_H * 0.7 + PAD_Y / 2 };
  });

  let d = "";
  const turns: { x: number; y: number; b: number }[] = [];
  for (let r = 0; r < rows; r++) {
    const y = r * ROW_H + ROW_H * 0.7 + PAD_Y / 2;
    const rtl = r % 2 === 0;
    const xs = Array.from({ length: cols }, (_, k) => (k + 0.5) * COL_W);
    if (rtl) xs.reverse();
    const startX = rtl ? width - 20 : 20;
    const endX = rtl ? 20 : width - 20;
    d += r === 0 ? `M${startX} ${y}` : "";
    const pts = [...xs.map((x, k) => ({ x, y: y + (k % 2 ? WAVE : -WAVE) })), { x: endX, y }];
    for (const p of pts) {
      const prev = d.match(/(-?[\d.]+) (-?[\d.]+)$/);
      const px = prev ? +prev[1] : startX;
      const py = prev ? +prev[2] : y;
      const mx = (px + p.x) / 2;
      d += ` C${mx} ${py} ${mx} ${p.y} ${p.x} ${p.y}`;
    }
    if (r < rows - 1) {
      const ny = y + ROW_H;
      const bulge = rtl ? -1 : 1;
      const x = endX;
      d += ` C${x + bulge * 70} ${y} ${x + bulge * 70} ${ny} ${x} ${ny}`;
      turns.push({ x: x + bulge * 52.5, y: (y + ny) / 2, b: bulge });
    }
  }
  return { d, stops, width, height, turns };
}

const Station = memo(function Station({
  item,
  index,
  x,
  y,
  width,
  height,
  mobile,
  reduced,
}: {
  item: MenuItem;
  index: number;
  x: number;
  y: number;
  width: number;
  height: number;
  mobile: boolean;
  reduced: boolean;
}) {
  return (
    <m.div
      initial={reduced ? false : { opacity: 0, y: 14, scale: 0.92 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ duration: 0.3, ease: EASE_OUT, delay: reduced ? 0 : Math.min(index * 0.04, 0.5) }}
      className="absolute -translate-x-1/2 -translate-y-full"
      style={{ left: `${(x / width) * 100}%`, top: `${((y - 22) / height) * 100}%` }}
    >
      <Link
        href={item.href}
        title={item.description}
        className="group flex flex-col items-center gap-1.5 outline-none"
      >
        <span
          className={`flex items-center gap-1.5 whitespace-nowrap rounded-full py-0.5 pe-2.5 ps-0.5 text-[10px] font-semibold text-white shadow-sm transition-transform group-hover:scale-105 group-focus-visible:ring-2 group-focus-visible:ring-sky-400 md:text-[12px] ${COLORS[index % COLORS.length]}`}
        >
          <span className="flex size-4 items-center justify-center rounded-full bg-white/25 text-[9px] md:size-5">
            {index + 1}
          </span>
          {item.label}
        </span>
        <span className="relative rounded-[24px] before:absolute before:inset-x-1 before:-bottom-3 before:-z-10 before:h-5 before:rounded-[50%] before:bg-slate-900/20">
          <span className="absolute inset-0 overflow-hidden rounded-[24px]"><span
            aria-hidden
            className="absolute -inset-1/2 animate-spin opacity-0 transition-opacity duration-200 [animation-duration:2.5s] group-hover:opacity-100 group-focus-visible:opacity-100"
            style={{ background: "conic-gradient(from 0deg, transparent 0 60%, #38bdf8 80%, #f59e0b 100%)" }}
          /></span>
          <span className="relative m-[2px] flex rounded-[22px] bg-white p-1.5 dark:bg-slate-800">
            <MenuIcon
              image={item.image}
              fallback={item.icon}
              size={mobile ? 60 : 84}
              alt={item.label}
            />
          </span>
        </span>
      </Link>
    </m.div>
  );
});

export default function RoadMap() {
  const items = useMenuItems();
  const mobile = useIsMobile();
  const reduced = useReducedMotion() ?? false;
  const { logout } = useLogout();
  const userType = useAuthStore((s) => s.userType);
  const router = useRouter();
  const uid = useId();
  const glowId = `${uid}-glow`;
  const patId = `${uid}-pat`;

  const cols = mobile ? 2 : 5;
  const rowH = mobile ? 140 : 160;
  const { d, stops, width, height, turns } = useMemo(() => layout(items.length, cols, rowH), [items.length, cols, rowH]);
  const totalW = width + MARGIN * 2;
  const dashboard = userType === 1 ? "/admin/dashboard" : "/user/dashboard";

  return (
    <div
      dir="rtl"
      className="relative min-h-screen bg-gradient-to-b from-sky-50 via-white to-amber-50/60 px-3 pb-16 pt-28 md:pt-32 dark:from-[#0b1220] dark:via-[#0b1220] dark:to-[#10172a]"
    >
      <header className="pointer-events-none absolute inset-x-0 top-0 z-10 flex items-start justify-between gap-3 p-4 md:p-6">
        <div className="pointer-events-auto">
          <h1 className="text-lg font-extrabold text-gray-900 dark:text-white md:text-2xl">
            کجا می‌خواهید بروید؟
          </h1>
          <p className="mt-1 text-xs text-gray-500 dark:text-gray-400 md:text-sm">
            روی هر ایستگاه کلیک کنید تا وارد بخش مورد نظر شوید
          </p>
        </div>
        <div className="pointer-events-auto flex items-center gap-2">
          <button
            type="button"
            onClick={() => (window.history.length > 1 ? router.back() : router.push(dashboard))}
            aria-label="بازگشت"
            className="rounded-full border border-gray-200 bg-white/80 p-2 text-gray-600 backdrop-blur transition-colors hover:bg-gray-100 dark:border-white/10 dark:bg-slate-900/80 dark:text-gray-300 dark:hover:bg-white/10"
          >
            <X size={16} />
          </button>
          <button
            type="button"
            onClick={logout}
            aria-label="خروج"
            className="rounded-full border border-rose-200 bg-white/80 p-2 text-rose-500 backdrop-blur transition-colors hover:bg-rose-50 dark:border-rose-500/30 dark:bg-slate-900/80 dark:hover:bg-rose-500/10"
          >
            <LogOut size={16} />
          </button>
        </div>
      </header>

      <div className="relative mx-auto max-w-4xl" style={{ aspectRatio: `${totalW} / ${height}` }}>
        <svg viewBox={`0 0 ${totalW} ${height}`} className="absolute inset-0 size-full overflow-visible" aria-hidden>
          <defs>
            <filter id={glowId} x="-50%" y="-50%" width="200%" height="200%">
              <feGaussianBlur stdDeviation="4" result="blur" />
              <feMerge>
                <feMergeNode in="blur" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>
            <pattern id={patId} width="22" height="22" patternUnits="userSpaceOnUse">
              <circle cx="2" cy="2" r="1.2" fill="#94a3b8" opacity="0.35" />
            </pattern>
          </defs>

          <rect width={totalW} height={height} fill={`url(#${patId})`} />

          <g transform={`translate(${MARGIN} 0)`}>
            <path
              d={d}
              fill="none"
              stroke="#0f172a"
              strokeWidth={30}
              strokeLinecap="round"
              strokeLinejoin="round"
              opacity={0.1}
              transform="translate(0 7)"
            />
            <path
              d={d}
              fill="none"
              stroke="#334155"
              strokeWidth={24}
              strokeLinecap="round"
              strokeLinejoin="round"
              className="dark:stroke-slate-700"
            />
            <path
              d={d}
              fill="none"
              stroke="#fbbf24"
              strokeWidth={2}
              strokeDasharray="8 10"
              strokeLinecap="round"
              opacity={0.95}
            />

            {turns.map((t, i) => (
              <g key={i} transform={`translate(${t.x} ${t.y})`}>
                <circle r={13} fill="#f59e0b" stroke="#ffffff" strokeWidth={2} />
                <path
                  d={`M${-3 * t.b} -5 L${3 * t.b} 0 L${-3 * t.b} 5`}
                  fill="none"
                  stroke="#ffffff"
                  strokeWidth={2.5}
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </g>
            ))}

            {!reduced && (
              <g>
                <circle r={6} fill="#ffffff" filter={`url(#${glowId})`} />
                <circle r={2.5} fill="#f59e0b" />
                <animateMotion
                  dur={`${Math.max(20, items.length * 3)}s`}
                  repeatCount="indefinite"
                  rotate="auto"
                  path={d}
                />
              </g>
            )}
          </g>
        </svg>

        {items.map((item, i) => (
          <Station
            key={item.href}
            item={item}
            index={i}
            x={stops[i].x + MARGIN}
            y={stops[i].y}
            width={totalW}
            height={height}
            mobile={mobile}
            reduced={reduced}
          />
        ))}
      </div>
    </div>
  );
}
