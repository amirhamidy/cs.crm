"use client";
import { useState } from "react";
import { Clock, FileText, Trash2 } from "lucide-react";
import HumanResourcesPage from "../HumanResourcesPage";
import WasteTab from "./WasteTab";
import WorkHoursTab from "./WorkHoursTab";

const TABS = [
  { key: "waste", label: "کسر ضایعات", icon: Trash2 },
  { key: "workhours", label: "ساعت کارکرد", icon: Clock },
  { key: "documents", label: "اسناد و قراردادها", icon: FileText },
] as const;

export default function HRHub({ canManage = false }: { canManage?: boolean }) {
  const [tab, setTab] = useState<(typeof TABS)[number]["key"]>("waste");
  return (
    <div className="space-y-5 p-4 sm:p-6" dir="rtl">
      <div>
        <h1 className="text-lg font-extrabold text-gray-900 dark:text-white">منابع انسانی</h1>
        <p className="mt-1 text-[11px] font-semibold text-gray-400">پرونده پرسنلی، حقوق، قرارداد، مرخصی و اضافه‌کاری</p>
      </div>
      <div className="flex gap-1 overflow-x-auto rounded-full bg-gray-100 p-1 dark:bg-white/5">
        {TABS.map(({ key, label, icon: I }) => (
          <button key={key} onClick={() => setTab(key)}
            className={`flex items-center gap-1.5 whitespace-nowrap rounded-full px-4 py-2 text-[12px] font-extrabold transition ${tab === key ? "bg-white text-indigo-600 shadow-sm dark:bg-indigo-500/20 dark:text-indigo-300" : "text-gray-500"}`}>
            <I size={14} />{label}
          </button>
        ))}
      </div>
      {tab === "waste" && <WasteTab canManage={canManage} />}
      {tab === "workhours" && <WorkHoursTab canManage={canManage} />}
      {tab === "documents" && <HumanResourcesPage canManage={canManage} />}
    </div>
  );
}
