"use client";
import { useState } from "react";
import { CalendarOff, FileText, Users } from "lucide-react";
import HumanResourcesPage from "../HumanResourcesPage";
import ProfilesTab from "./ProfilesTab";
import LeavesTab from "./LeavesTab";

const TABS = [
  { key: "profiles", label: "پرونده‌های پرسنلی", icon: Users },
  { key: "leaves", label: "مرخصی‌ها", icon: CalendarOff },
  { key: "documents", label: "اسناد و قراردادها", icon: FileText },
] as const;

export default function HRHub({ canManage = false }: { canManage?: boolean }) {
  const [tab, setTab] = useState<(typeof TABS)[number]["key"]>("profiles");
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
      {tab === "profiles" && <ProfilesTab canManage={canManage} />}
      {tab === "leaves" && <LeavesTab canManage={canManage} />}
      {tab === "documents" && <HumanResourcesPage canManage={canManage} />}
    </div>
  );
}
