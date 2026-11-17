"use client";

import { useState } from "react";
import MachineTrendSection from "@/components/admin/production/MachineTrendSection";
import MachineMonthlySection from "@/components/admin/production/MachineMonthlySection";

const VIEWS = [
    { id: "trend", label: "روند تولید" },
    { id: "monthly", label: "گزارش ماهانه" },
] as const;

export default function MachinePerformancePage() {
    const [view, setView] = useState<(typeof VIEWS)[number]["id"]>("trend");

    return (
        <div className="space-y-4">
            <div className="inline-flex rounded-xl border border-black/[0.06] bg-[#fafafa] p-1 dark:border-white/[0.06] dark:bg-white/[0.03]">
                {VIEWS.map((v) => (
                    <button
                        key={v.id}
                        type="button"
                        onClick={() => setView(v.id)}
                        className={`rounded-lg px-4 py-1.5 text-[11.5px] font-extrabold transition-colors ${
                            view === v.id
                                ? "bg-indigo-500 text-white shadow-sm"
                                : "text-gray-500 hover:text-gray-800 dark:hover:text-gray-200"
                        }`}
                    >
                        {v.label}
                    </button>
                ))}
            </div>
            {view === "trend" ? <MachineTrendSection /> : <MachineMonthlySection />}
        </div>
    );
}
