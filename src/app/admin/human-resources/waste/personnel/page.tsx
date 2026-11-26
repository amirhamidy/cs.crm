"use client";

import { Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { ArrowRight, Trash2 } from "lucide-react";
import PersonnelWastePanel from "@/components/admin/human_resources/hr/PersonnelWastePanel";

function PersonnelWasteContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const documentId = searchParams.get("documentId");
  const employeeName = searchParams.get("employeeName");
  const canManage = searchParams.get("canManage") === "true";

  if (!documentId) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-center" dir="rtl">
          <p className="text-[13px] font-bold text-gray-600 dark:text-gray-400">
            پارامتر documentId وجود ندارد.
          </p>
          <button
            onClick={() => router.push("/admin/human-resources/waste")}
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
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl" style={{ backgroundColor: "#f43f5e16", border: "1px solid #f43f5e28" }}>
            <Trash2 size={15} style={{ color: "#f43f5e" }} />
          </div>
          <div className="min-w-0">
            <h3 className="truncate text-[13.5px] font-extrabold text-gray-900 dark:text-white">
              کسر ضایعات {employeeName && `— ${employeeName}`}
            </h3>
            <div className="mt-0.5 text-[11px] text-gray-400 dark:text-gray-600">
              مشاهده و مدیریت کسورات ضایعات
            </div>
          </div>
        </div>

        <PersonnelWastePanel
          documentId={Number(documentId)}
          canManage={canManage}
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
      <PersonnelWasteContent />
    </Suspense>
  );
}
