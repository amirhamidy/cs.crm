"use client";

import { Suspense } from "react";
import PersianCalendar from "./PersianCalendar"; 

export default function CalendarPage() {
  return (
    <Suspense fallback={
      <div className="flex flex-col items-center justify-center gap-3 py-24">
        <div className="h-5 w-5 rounded-full border-2 border-indigo-500/15 border-t-indigo-500 animate-spin" />
        <p className="text-[11px] font-semibold text-slate-400">در حال بارگذاری تقویم...</p>
      </div>
    }>
      <PersianCalendar />
    </Suspense>
  );
}