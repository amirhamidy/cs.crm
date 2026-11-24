"use client";

import { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { CalendarDays, ChevronLeft, ChevronRight, X } from "lucide-react";
import { JALALI_MONTHS, toPersianDigits, todayJalali } from "@/lib/jalali";

// value / onChange use the Jalali format "YYYY-MM" (e.g. "1405-01").
export default function JalaliMonthPicker({ value, onChange, disabled, placeholder = "انتخاب ماه" }: {
  value: string; onChange: (v: string) => void; disabled?: boolean; placeholder?: string;
}) {
  const m = /^(\d{4})-(\d{1,2})$/.exec(value);
  const cur: [number, number] | null = m ? [+m[1], +m[2]] : null;
  const [jy, jm] = todayJalali();
  const [open, setOpen] = useState(false);
  const [vy, setVy] = useState(cur ? cur[0] : jy);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const h = (e: MouseEvent) => { if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false); };
    document.addEventListener("mousedown", h);
    return () => document.removeEventListener("mousedown", h);
  }, [open]);

  const label = cur ? `${JALALI_MONTHS[cur[1] - 1]} ${toPersianDigits(cur[0])}` : "";
  const pick = (mo: number) => { onChange(`${vy}-${String(mo).padStart(2, "0")}`); setOpen(false); };

  return (
    <div ref={ref} className="relative w-full">
      <button type="button" disabled={disabled} onClick={() => { setVy(cur ? cur[0] : jy); setOpen((s) => !s); }}
        className={`flex h-10 w-full items-center gap-2 rounded-xl border px-3 text-right text-[12px] font-semibold transition disabled:opacity-60 ${open
          ? "border-indigo-500 bg-indigo-50/50 dark:border-indigo-500/50 dark:bg-indigo-500/[0.06]"
          : "border-gray-100 bg-gray-50 hover:border-gray-200 dark:border-white/[0.06] dark:bg-white/[0.03] dark:hover:border-white/[0.12]"}`}>
        <CalendarDays size={14} className="shrink-0 text-gray-400" />
        <span className={`flex-1 truncate ${label ? "text-gray-800 dark:text-white" : "text-gray-400"}`}>{label || placeholder}</span>
        {value && !disabled && (
          <span role="button" onClick={(e) => { e.stopPropagation(); onChange(""); }} className="text-gray-400 hover:text-rose-500"><X size={13} /></span>
        )}
      </button>
      <AnimatePresence>
        {open && (
          <motion.div initial={{ opacity: 0, y: -6, scale: 0.98 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: -6, scale: 0.98 }} transition={{ duration: 0.12 }}
            className="absolute right-0 top-full z-50 mt-1.5 w-[16rem] rounded-2xl border border-gray-100 bg-white p-3 shadow-xl dark:border-white/10 dark:bg-[#1a1d27]" dir="rtl">
            <div className="mb-2 flex items-center justify-between">
              <button type="button" onClick={() => setVy(vy - 1)} className="rounded-lg p-1.5 text-gray-500 hover:bg-gray-100 dark:hover:bg-white/10"><ChevronRight size={16} /></button>
              <span className="text-[12.5px] font-extrabold text-gray-800 dark:text-white">{toPersianDigits(vy)}</span>
              <button type="button" onClick={() => setVy(vy + 1)} className="rounded-lg p-1.5 text-gray-500 hover:bg-gray-100 dark:hover:bg-white/10"><ChevronLeft size={16} /></button>
            </div>
            <div className="grid grid-cols-3 gap-1.5">
              {JALALI_MONTHS.map((name, i) => {
                const mo = i + 1;
                const sel = !!cur && cur[0] === vy && cur[1] === mo;
                const isNow = jy === vy && jm === mo;
                return (
                  <button key={mo} type="button" onClick={() => pick(mo)}
                    className={`rounded-lg py-2 text-[11.5px] font-bold transition ${sel
                      ? "bg-indigo-600 text-white"
                      : isNow ? "text-indigo-600 ring-1 ring-indigo-400 dark:text-indigo-400"
                      : "text-gray-700 hover:bg-gray-100 dark:text-gray-200 dark:hover:bg-white/10"}`}>
                    {name}
                  </button>
                );
              })}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
