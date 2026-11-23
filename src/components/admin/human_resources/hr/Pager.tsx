"use client";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { fmtNum } from "./hrApi";

export default function Pager({ page, pages, onChange }: { page: number; pages: number; onChange: (p: number) => void }) {
  if (pages <= 1) return null;
  const b = "flex h-8 w-8 items-center justify-center rounded-full border border-gray-200 text-gray-500 disabled:opacity-40 dark:border-white/10";
  return (
    <div className="flex items-center justify-center gap-3 pt-3" dir="rtl">
      <button className={b} disabled={page <= 1} onClick={() => onChange(page - 1)}><ChevronRight size={14} /></button>
      <span className="text-[11px] font-extrabold text-gray-500">{fmtNum(page)} / {fmtNum(pages)}</span>
      <button className={b} disabled={page >= pages} onClick={() => onChange(page + 1)}><ChevronLeft size={14} /></button>
    </div>
  );
}
