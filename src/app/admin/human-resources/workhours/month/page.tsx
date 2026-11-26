"use client";

import { Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { ArrowRight, Clock } from "lucide-react";
import WorkHoursDailyPanel from "@/components/admin/human_resources/hr/WorkHoursDailyPanel";
import { WorkHoursStatus } from "@/components/admin/human_resources/hr/hrApi";
import { monthLabel } from "@/components/admin/human_resources/hr/workHoursShared";

function MonthDetailContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const documentId = searchParams.get("documentId");
  const month = searchParams.get("month");
  const status = (searchParams.get("status") || "pending") as WorkHoursStatus;
  const employeeName = searchParams.get("employeeName");

  if (!documentId || !month) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-center" dir="rtl">
          <p className="text-[13px] font-bold text-gray-600 dark:text-gray-400">
            پارامترهای مورد نیاز (documentId و month) وجود ندارند.
          </p>
          <button
            onClick={() => router.push("/admin/human-resources/workhours")}
            className="mt-4 text-[12px] font-bold text-indigo-600 hover:text-indigo-700"
          >
            بازگشت به لیست
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50 p-4 dark:from-gray-900 dark:via-gray-900 dark:to-gray-800">
      <div className="mx-auto max-w-7xl">
        <div className="mb-4 flex items-center gap-3" dir="rtl">
          <button
            onClick={() => router.back()}
            className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl text-gray-400 transition-colors hover:text-gray-600 dark:hover:text-gray-300"
            title="بازگشت"
          >
            <ArrowRight size={15} />
          </button>
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl" style={{ backgroundColor: "#6366f116", border: "1px solid #6366f128" }}>
            <Clock size={15} style={{ color: "#6366f1" }} />
          </div>
          <div className="min-w-0">
            <h3 className="truncate text-[13.5px] font-extrabold text-gray-900 dark:text-white">
              ساعت کار روزانه — {monthLabel(month)}
            </h3>
            {employeeName && (
              <div className="mt-0.5 text-[11px] text-gray-400 dark:text-gray-600">
                {employeeName}
              </div>
            )}
          </div>
        </div>

        <WorkHoursDailyPanel
          documentId={Number(documentId)}
          month={month}
          status={status}
        />
      </div>
    </div>
  );
}

export default function Page() {
  return (
    <Suspense fallback={
      <div className="flex min-h-screen items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-indigo-600 border-t-transparent"></div>
      </div>
    }>
      <MonthDetailContent />
    </Suspense>
  );
}
