"use client";

import { Suspense } from "react";
import { CalendarSkeleton } from "@/components/ui/skeletons";
import dynamic from "next/dynamic";


const PersianCalendar = dynamic(() => import("@/modules/calendar/ui/admin/PersianCalendar"), {
  ssr: false,
  loading: () => <CalendarSkeleton />,
});

export default function CalendarPage() {
  return (
    <Suspense
      fallback={
        <CalendarSkeleton />
      }
    >
      <PersianCalendar />
    </Suspense>
  );
}