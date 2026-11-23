"use client";

import { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { CalendarDays, ChevronLeft, ChevronRight, X } from "lucide-react";
import { JALALI_MONTHS, JALALI_WEEKDAYS, jalaliMonthLength, jalaliWeekday, pad2, toGregorian, toJalali, toPersianDigits, todayJalali } from "@/lib/jalali";

type YMD = [number, number, number];

function parse(iso: string): YMD | null {
  const m = /^(\d{4})-(\d{2})-(\d{2})/.exec(iso);
  return m ? toJalali(+m[1], +m[2], +m[3]) : null;
}
function toIso([y, m, d]: YMD) {
  const [gy, gm, gd] = toGregorian(y, m, d);
  return `${gy}-${pad2(gm)}-${pad2(gd)}`;
}

export default function JalaliDatePicker({ value, onChange, disabled, required }: {
  value: string; onChange: (iso: string) => void; disabled?: boolean; required?: boolean;
}) {
  const cur = parse(value);
  const today = todayJalali();
  const [open, setOpen] = useState(false);
  const [view, setView] = useState<[number, number]>([(cur ?? today)[0], (cur ?? today)[1]]);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const h = (e: MouseEvent) => { if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false); };
    document.addEventListener("mousedown", h);
    return () => document.removeEventListener("mousedown", h);
  }, [open]);

  const [vy, vm] = view;
  const shift = (n: number) => {
    let m = vm + n, y = vy;
    if (m > 12) { m = 1; y++; } else if (m < 1) { m = 12; y--; }
    setView([y, m]);
  };
  const offset = jalaliWeekday(vy, vm, 1); // 0 = Saturday
  const len = jalaliMonthLength(vy, vm);
  const cells: (number | null)[] = [...Array(offset).fill(null), ...Array.from({ length: len }, (_, i) => i + 1)];
  const same = (a: YMD | null, d: number) => !!a && a[0] === vy && a[1] === vm && a[2] === d;
  const label = cur ? `${toPersianDigits(cur[2])} ${JALALI_MONTHS[cur[1] - 1]} ${toPersianDigits(cur[0])}` : "";

  return (
    <div ref={ref} className="relative w-full">
      <button type="button" disabled={disabled} onClick={() => { if (cur) setView([cur[0], cur[1]]); setOpen((s) => !s); }}
        className={`flex h-10 w-full items-center gap-2 rounded-xl border px-3 text-right text-[12px] font-semibold transition disabled:opacity-60 ${open
          ? "border-indigo-500 bg-indigo-50/50 dark:border-indigo-500/50 dark:bg-indigo-500/[0.06]"
          : "border-gray-100 bg-gray-50 hover:border-gray-200 dark:border-white/[0.06] dark:bg-white/[0.03] dark:hover:border-white/[0.12]"}`}>
        <CalendarDays size={14} className="shrink-0 text-gray-400" />
        <span className={`flex-1 truncate ${label ? "text-gray-800 dark:text-white" : "text-gray-400"}`}>{label || "انتخاب تاریخ"}</span>
        {value && !required && !disabled && (
          <span role="button" onClick={(e) => { e.stopPropagation(); onChange(""); }} className="text-gray-400 hover:text-rose-500"><X size={13} /></span>
        )}
      </button>
      {required && <input tabIndex={-1} required value={value} onChange={() => {}} className="pointer-events-none absolute inset-0 h-full w-full opacity-0" />}
      <AnimatePresence>
        {open && (
          <motion.div initial={{ opacity: 0, y: -6, scale: 0.98 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: -6, scale: 0.98 }} transition={{ duration: 0.12 }}
            className="absolute right-0 top-full z-50 mt-1.5 w-[17rem] rounded-2xl border border-gray-100 bg-white p-3 shadow-xl dark:border-white/10 dark:bg-[#1a1d27]" dir="rtl">
            <div className="mb-2 flex items-center justify-between">
              <button type="button" onClick={() => shift(-1)} className="rounded-lg p-1.5 text-gray-500 hover:bg-gray-100 dark:hover:bg-white/10"><ChevronRight size={16} /></button>
              <span className="text-[12.5px] font-extrabold text-gray-800 dark:text-white">{JALALI_MONTHS[vm - 1]} {toPersianDigits(vy)}</span>
              <button type="button" onClick={() => shift(1)} className="rounded-lg p-1.5 text-gray-500 hover:bg-gray-100 dark:hover:bg-white/10"><ChevronLeft size={16} /></button>
            </div>
            <div className="grid grid-cols-7 gap-1 text-center">
              {JALALI_WEEKDAYS.map((w) => <span key={w} className="py-1 text-[10px] font-bold text-gray-400">{w.slice(0, 1)}</span>)}
              {cells.map((d, i) => d === null ? <span key={i} /> : (
                <button key={i} type="button" onClick={() => { onChange(toIso([vy, vm, d])); setOpen(false); }}
                  className={`h-8 rounded-lg text-[12px] font-bold transition ${same(cur, d)
                    ? "bg-indigo-600 text-white"
                    : same(today, d) ? "text-indigo-600 ring-1 ring-indigo-400 dark:text-indigo-400"
                    : "text-gray-700 hover:bg-gray-100 dark:text-gray-200 dark:hover:bg-white/10"} ${i % 7 === 6 ? "" : ""}`}>
                  {toPersianDigits(d)}
                </button>
              ))}
            </div>
            <button type="button" onClick={() => { onChange(toIso(today)); setOpen(false); }}
              className="mt-2 w-full rounded-xl bg-gray-50 py-1.5 text-[11px] font-extrabold text-indigo-600 hover:bg-indigo-50 dark:bg-white/[0.04] dark:text-indigo-400">امروز</button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
