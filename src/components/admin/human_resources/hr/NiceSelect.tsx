"use client";

import { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Check, ChevronDown } from "lucide-react";

export interface Opt { value: string; label: string }

export default function NiceSelect({ value, options, onChange, disabled, className = "", placeholder = "انتخاب کنید" }: {
  value: string; options: Opt[]; onChange: (v: string) => void; disabled?: boolean; className?: string; placeholder?: string;
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!open) return;
    const h = (e: MouseEvent) => { if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false); };
    const k = (e: KeyboardEvent) => { if (e.key === "Escape") setOpen(false); };
    document.addEventListener("mousedown", h); document.addEventListener("keydown", k);
    return () => { document.removeEventListener("mousedown", h); document.removeEventListener("keydown", k); };
  }, [open]);
  const sel = options.find((o) => o.value === value);
  return (
    <div ref={ref} className={`relative w-full ${className}`}>
      <button type="button" disabled={disabled} onClick={() => setOpen((s) => !s)}
        className={`flex h-11 w-full items-center gap-2 rounded-full border px-5 text-right text-[12px] font-semibold outline-none transition disabled:opacity-60 ${open
          ? "border-indigo-500 bg-indigo-50/50 dark:border-indigo-500/50 dark:bg-indigo-500/[0.06]"
          : "border-gray-200 bg-white hover:border-gray-300 dark:border-white/10 dark:bg-[#0b1220] dark:hover:border-white/20"}`}>
        <span className={`flex-1 truncate ${sel ? "text-gray-800 dark:text-white" : "text-gray-400"}`}>{sel ? sel.label : placeholder}</span>
        <ChevronDown size={14} className={`shrink-0 text-gray-400 transition-transform ${open ? "rotate-180" : ""}`} />
      </button>
      <AnimatePresence>
        {open && (
          <motion.div initial={{ opacity: 0, scale: 0.98 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, scale: 0.98 }} transition={{ duration: 0.12 }}
            className="absolute right-0 top-full z-50 mt-1.5 max-h-60 w-full min-w-[160px] overflow-y-auto rounded-2xl border border-gray-100 bg-white p-1.5 shadow-xl dark:border-white/10 dark:bg-[#1a1d27]">
            {options.map((o) => {
              const active = o.value === value;
              return (
                <button key={o.value} type="button" onClick={() => { onChange(o.value); setOpen(false); }}
                  className={`flex w-full items-center gap-2 rounded-xl px-3 py-2 text-right text-[12px] font-bold transition ${active
                    ? "bg-indigo-50 text-indigo-600 dark:bg-indigo-500/10 dark:text-indigo-400"
                    : "text-gray-700 hover:bg-gray-50 dark:text-gray-200 dark:hover:bg-white/[0.05]"}`}>
                  <span className="flex-1 truncate">{o.label}</span>
                  {active && <Check size={13} strokeWidth={3} />}
                </button>
              );
            })}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
