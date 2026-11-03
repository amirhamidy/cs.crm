"use client";

import { Suspense } from "react";
import dynamic from "next/dynamic";
import { CalendarSkeleton } from "@/components/ui/skeletons";


const PersianCalendar = dynamic(() => import("@/components/calendar/user/PersianCalendar"), {
  ssr: false,
  loading: () => null,
});

export default function CalendarPage() {
  return (
    <Suspense
      fallback={<CalendarSkeleton />}
    >
      <PersianCalendar />
    </Suspense>
  );
}