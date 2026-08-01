"use client";

import StatsCard from "@/components/charts/StatsCard";
import SalesChart from "@/components/charts/SalesChart";
import CategoryChart from "@/components/charts/CategoryChart";
import VisitsChart from "@/components/charts/VisitsChart";
import UsersCard from "@/components/charts/UsersCard";
import { ShoppingCart, Users, Package, DollarSign } from "lucide-react";

const statsData = [
    {
        title: "درآمد کل",
        value: "۲۴۵,۰۰۰,۰۰۰",
        change: "12.5",
        icon: DollarSign,
        gradient: "from-blue-500 to-blue-600",
    },
    {
        title: "سفارشات",
        value: "۱,۲۳۴",
        change: "8.2",
        icon: ShoppingCart,
        gradient: "from-purple-500 to-purple-600",
    },
    {
        title: "کاربران",
        value: "۳,۴۵۶",
        change: "33.2",
        icon: Users,
        gradient: "from-green-500 to-green-600",
    },
    {
        title: "محصولات",
        value: "۸۹۲",
        change: "55.8",
        icon: Package,
        gradient: "from-orange-500 to-orange-600",
    },
];

export default function AdminDashboardPage() {
    return (
        <div className="space-y-5">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
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
