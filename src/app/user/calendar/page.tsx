"use client";

import { Suspense } from "react";
import dynamic from "next/dynamic";
import LazyLoading from "@/components/ui/LazyLoading";


const PersianCalendar = dynamic(() => import("@/components/calendar/user/PersianCalendar"), {
  ssr: false,
  loading: () => <LazyLoading />,
});

export default function CalendarPage() {
  return (
    <Suspense
      fallback={
        <div className="flex flex-col items-center justify-center gap-3 py-24">
          <div className="h-5 w-5 animate-spin rounded-full border-2 border-indigo-500/15 border-t-indigo-500" />

          <p className="text-[11px] font-semibold text-gray-400">
            در حال بارگذاری تقویم...
          </p>
        </div>
      }
    >
      <PersianCalendar />
    </Suspense>
  );
}