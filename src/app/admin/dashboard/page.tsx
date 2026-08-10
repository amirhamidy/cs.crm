"use client";

import StatsCard from "@/components/charts/StatsCard";
import SalesChart from "@/components/charts/SalesChart";
import CategoryChart from "@/components/charts/CategoryChart";
import VisitsChart from "@/components/charts/VisitsChart";
import UsersCard from "@/components/charts/UsersCard";
import { ShoppingCart, Users, Package, DollarSign } from "lucide-react";
import { useEmployeesStats } from "@/hooks/useEmployeesStats";
import { useCustomersStats } from "@/hooks/useCustomersStats";
import { useProjectsStats } from "@/hooks/useProjectsStats";

export default function AdminDashboardPage() {
    const employees = useEmployeesStats();
    const customers = useCustomersStats();
    const projects = useProjectsStats();

    const statsData = [
        {
            title: "تعداد کارمندان",
            value: `${employees.total.toLocaleString("fa-IR")} نفر`,
            change: String(employees.growth),
            icon: Users,
            gradient: "from-blue-500 to-blue-600",
        },
        {
            title: "مشتریان فعال",
            value: `${customers.activePct.toLocaleString("fa-IR")}٪`,
            change: String(customers.activePct - customers.potentialPct),
            icon: ShoppingCart,
            gradient: "from-green-500 to-green-600",
        },
        ...(projects.hasProjects
            ? [
                {
                    title: "پروژه‌های در حال انجام",
                    value: `${projects.total.toLocaleString("fa-IR")} پروژه`,
                    change: String(projects.deptCount),
                    icon: Package,
                    gradient: "from-purple-500 to-purple-600",
                },
            ]
            : []),
    ];

    return (
        <div className="space-y-5">
            <div className={`grid gap-3 ${projects.hasProjects ? "grid-cols-1 sm:grid-cols-2 lg:grid-cols-3" : "grid-cols-1 sm:grid-cols-2"}`}>
                {statsData.map((stat, index) => (
                    <StatsCard key={index} {...stat} index={index} />
                ))}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                <SalesChart />
                <CategoryChart />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                <VisitsChart />
                <UsersCard />
            </div>
        </div>
    );
}
