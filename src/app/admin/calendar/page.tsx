"use client";

import { Suspense } from "react";
import { ListSkeleton } from "@/components/ui/skeletons";
import dynamic from "next/dynamic";


const PersianCalendar = dynamic(() => import("@/components/calendar/admin/PersianCalendar"), {
  ssr: false,
  loading: () => null,
});

export default function CalendarPage() {
  return (
    <Suspense
      fallback={
        <ListSkeleton />
      }
    >
      <PersianCalendar />
    </Suspense>
  );
}