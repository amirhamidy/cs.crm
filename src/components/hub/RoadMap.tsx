"use client";

import { memo, useMemo } from "react";
import Link from "next/link";
import { m, useReducedMotion } from "framer-motion";
import { LogOut } from "lucide-react";
import { useMenuItems } from "@/hooks/useMenuItems";
import { useIsMobile } from "@/hooks/useIsMobile";
import { useLogout } from "@/hooks/useLogout";
import { useAuthStore } from "@/store/authStore";
import { EASE_OUT } from "@/lib/motion";
import MenuIcon from "@/components/sidebar/MenuIcon";
import type { MenuItem } from "@/config/menu";

const COL_W = 210;
const PAD_Y = 30;
const WAVE = 16;

const COLORS = [
  "bg-green-500", "bg-sky-500", "bg-amber-500", "bg-cyan-500",
  "bg-blue-500", "bg-teal-500", "bg-lime-600", "bg-orange-500",
  "bg-indigo-500", "bg-emerald-500", "bg-violet-500", "bg-rose-500",
];

/** مرکز هر ایستگاه؛ ردیف‌های زوج از راست به چپ و ردیف‌های فرد برعکس (مار‌پیچ). */
function layout(count: number, cols: number, ROW_H: number) {
  const rows = Math.max(1, Math.ceil(count / cols));
  const width = cols * COL_W;
  const height = rows * ROW_H + PAD_Y;
  const stops = Array.from({ length: count }, (_, i) => {
    const r = Math.floor(i / cols);
    const c = i % cols;
    const visual = r % 2 === 0 ? cols - 1 - c : c; // RTL
    return { x: (visual + 0.5) * COL_W, y: r * ROW_H + ROW_H * 0.7 + PAD_Y / 2, r };
  });

  // مسیر جاده: موج‌دار در هر ردیف، با دور‌برگردان در لبه‌ها
  let d = "";
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
      // شروع ردیف بعد از همین نقطه؛ ردیف بعد از لبه‌ی مقابل شروع می‌شود
    }
  }
  return { d, stops, width, height };
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
          className={`flex items-center gap-1.5 rounded-full py-1 pe-3 ps-1 text-[11px] font-bold text-white shadow-md transition-transform group-hover:scale-105 group-focus-visible:ring-2 group-focus-visible:ring-sky-400 md:text-[13px] ${COLORS[index % COLORS.length]}`}
        >
          <span className="flex size-5 items-center justify-center rounded-full bg-white/25 text-[10px] md:size-6">
            {index + 1}
          </span>
          {item.label}
        </span>
        <span className="relative rounded-[28px] before:absolute before:inset-x-1 before:-bottom-3 before:-z-10 before:h-5 before:rounded-[50%] before:bg-slate-900/20">
          <span className="absolute inset-0 overflow-hidden rounded-[28px]"><span
            aria-hidden
            className="absolute -inset-1/2 animate-spin opacity-0 transition-opacity duration-200 [animation-duration:2.5s] group-hover:opacity-100 group-focus-visible:opacity-100"
            style={{ background: "conic-gradient(from 0deg, transparent 0 60%, #38bdf8 80%, #f59e0b 100%)" }}
          /></span>
          <span className="relative m-[3px] flex rounded-[25px] bg-white p-2 dark:bg-slate-800">
          <MenuIcon
            image={item.image}
            fallback={item.icon}
            size={mobile ? 84 : 120}
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

  const cols = mobile ? 2 : 5;
  const rowH = mobile ? 165 : 195;
  const { d, stops, width, height } = useMemo(() => layout(items.length, cols, rowH), [items.length, cols, rowH]);
  const dashboard = userType === 1 ? "/admin/dashboard" : "/user/dashboard";

  return (
    <div
      dir="rtl"
      className="min-h-screen bg-gradient-to-b from-sky-50 via-white to-amber-50/60 px-3 pb-16 pt-6 dark:from-[#0b1220] dark:via-[#0b1220] dark:to-[#10172a]"
    >
      <header className="mx-auto mb-4 flex max-w-6xl items-center justify-between gap-3">
        <div>
          <h1 className="text-lg font-extrabold text-gray-900 dark:text-white md:text-2xl">
            کجا می‌خواهید بروید؟
          </h1>
          <p className="mt-1 text-xs text-gray-500 dark:text-gray-400 md:text-sm">
            روی هر ایستگاه کلیک کنید تا وارد بخش مورد نظر شوید
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Link
            href={dashboard}
            className="rounded-full bg-blue-600 px-4 py-2 text-xs font-bold text-white transition-colors hover:bg-blue-500 md:text-sm"
          >
            رفتن به داشبورد
          </Link>
          <button
            type="button"
            onClick={logout}
            aria-label="خروج"
            className="rounded-full border border-rose-200 p-2 text-rose-500 transition-colors hover:bg-rose-50 dark:border-rose-500/30 dark:hover:bg-rose-500/10"
          >
            <LogOut size={16} />
          </button>
        </div>
      </header>

      <div className="relative mx-auto max-w-6xl" style={{ aspectRatio: `${width} / ${height}` }}>
        <svg
          viewBox={`0 0 ${width} ${height}`}
          className="absolute inset-0 size-full"
          aria-hidden
          preserveAspectRatio="none"
        >
          <g transform="translate(0 26)">
            <path d={d} fill="none" stroke="#0f172a" strokeWidth={74} strokeLinecap="round" strokeLinejoin="round" opacity={0.18} transform="translate(0 14)" />
            <path d={d} fill="none" stroke="#334155" strokeWidth={66} strokeLinecap="round" strokeLinejoin="round" />
          </g>
          <path d={d} fill="none" stroke="#e2e8f0" strokeWidth={70} strokeLinecap="round" strokeLinejoin="round" />
          <path d={d} fill="none" stroke="#64748b" strokeWidth={54} strokeLinecap="round" strokeLinejoin="round" />
          <path d={d} fill="none" stroke="#fff" strokeWidth={3} strokeDasharray="14 12" strokeLinecap="round" opacity={0.85} />
          {!reduced && (
            <g>
              <rect x={-9} y={-5} width={18} height={10} rx={4} fill="#f59e0b" />
              <animateMotion dur={`${Math.max(20, items.length * 3)}s`} repeatCount="indefinite" rotate="auto" path={d} />
            </g>
          )}
        </svg>

        {items.map((item, i) => (
          <Station
            key={item.href}
            item={item}
            index={i}
            x={stops[i].x}
            y={stops[i].y}
            width={width}
            height={height}
            mobile={mobile}
            reduced={reduced}
          />
        ))}
      </div>
    </div>
  );
}
