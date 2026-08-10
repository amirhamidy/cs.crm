"use client";

import { Users, UserCheck, Briefcase } from "lucide-react";
import StatsCard from "./StatsCard";
import { useEmployeesStats } from "@/hooks/useEmployeesStats";
import { useCustomersStats } from "@/hooks/useCustomersStats";
import { useProjectsStats } from "@/hooks/useProjectsStats";

export default function StatsGrid() {
    const emp = useEmployeesStats();
    const cust = useCustomersStats();
    const proj = useProjectsStats();

    if (emp.loading || cust.loading || proj.loading) {
        return (
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {[1, 2, 3].map((i) => (
                    <div key={i} className="h-32 animate-pulse rounded-2xl bg-gray-100 dark:bg-slate-900" />
                ))}
            </div>
        );
    }

    return (
        <div className={`grid gap-4 ${proj.hasProjects ? "grid-cols-1 sm:grid-cols-2 lg:grid-cols-3" : "grid-cols-1 sm:grid-cols-2"}`}>
            <StatsCard
                title="تعداد کل کارمندان"
                value={`${emp.total.toLocaleString("fa-IR")} نفر`}
                change={String(emp.growth)}
                icon={Users}
                gradient="from-blue-500 to-blue-600"
                index={0}
            />

            <StatsCard
                title="مشتریان فعال"
                value={`${cust.activePct.toLocaleString("fa-IR")}٪`}
                change={String(cust.activePct - cust.potentialPct)}
                icon={UserCheck}
                gradient="from-green-500 to-green-600"
                index={1}
            />

            {proj.hasProjects && (
                <StatsCard
                    title="پروژه‌های در جریان"
                    value={`${proj.total.toLocaleString("fa-IR")} پروژه`}
                    change={String(proj.deptCount)}
                    icon={Briefcase}
                    gradient="from-purple-500 to-purple-600"
                    index={2}
                />
            )}
        </div>
    );
}
