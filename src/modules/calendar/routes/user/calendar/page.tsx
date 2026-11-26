"use client";

import { Suspense } from "react";
import dynamic from "next/dynamic";
import { CalendarSkeleton } from "@/components/ui/skeletons";


const PersianCalendar = dynamic(() => import("@/modules/calendar/ui/shared/PersianCalendar"), {
  ssr: false,
  loading: () => null,
});

export default function CalendarPage() {
  return (
    <Suspense
      fallback={<CalendarSkeleton />}
    >
      <PersianCalendar role="user" />
    </Suspense>
  );
}