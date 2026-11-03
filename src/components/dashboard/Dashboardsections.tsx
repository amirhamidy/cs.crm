"use client";

import { useEffect, useState } from "react";
import dynamic from "next/dynamic";
import StatsCard from "@/components/charts/StatsCard";
import UsersCard from "@/components/charts/UsersCard";
import { ChartSkeleton, DashboardStatsSkeleton } from "@/components/ui/skeletons";


const SalesChart = dynamic(() => import("@/components/charts/SalesChart"), {
    ssr: false,
    loading: () => <ChartSkeleton />,
});
const CategoryChart = dynamic(() => import("@/components/charts/CategoryChart"), {
    ssr: false,
    loading: () => <ChartSkeleton />,
});
const VisitsChart = dynamic(() => import("@/components/charts/VisitsChart"), {
    ssr: false,
    loading: () => <ChartSkeleton />,
});
import { DashboardForbiddenError, getCancelledTasksByDepartment, getCustomerSourcesData, getSalesChartData, getSummary, getTopUsers } from "@/lib/dashboard";

function SectionError({
    title,
    className = "h-[300px]",
}: {
    title: string;
    className?: string;
}) {
    return (
        <div
            dir="rtl"
            className={`flex items-center justify-center rounded-2xl border border-red-100 bg-red-50/50 p-4 text-center text-xs text-red-600 dark:border-red-950/20 dark:bg-red-950/5 dark:text-red-400 ${className}`}
        >
            خطا در دریافت اطلاعات «{title}». صفحه را دوباره بارگذاری کنید.
        </div>
    );
}

type LoadState<T> =
    | { status: "loading" }
    | { status: "forbidden" }
    | { status: "error" }
    | { status: "ready"; data: T };

function useSection<T>(loader: () => Promise<T>, label: string): LoadState<T> {
    const [state, setState] = useState<LoadState<T>>({ status: "loading" });

    useEffect(() => {
        let active = true;

        loader()
            .then((data) => {
                if (active) setState({ status: "ready", data });
            })
            .catch((error) => {
                if (error instanceof DashboardForbiddenError) {
                    if (active) setState({ status: "forbidden" });
                    return;
                }

                console.error(`[dashboard] ${label} failed`, error);
                if (active) setState({ status: "error" });
            });

        return () => {
            active = false;
        };
    }, []);

    return state;
}

export function StatsSection() {
    const state = useSection(getSummary, "stats section");

    if (state.status === "loading") return <DashboardStatsSkeleton />;
    if (state.status === "forbidden") return null;
    if (state.status === "error") {
        return <SectionError title="آمار کلی" className="h-28" />;
    }

    const { employees, customers, projects } = state.data;

    const cards: React.ComponentProps<typeof StatsCard>[] = [
        {
            title: "تعداد کارمندان",
            value: `${employees.total.toLocaleString("fa-IR")} نفر`,
            change: String(employees.change),
            icon: "users",
            gradient: "from-blue-500 to-blue-600",
        },
        {
            title: "مشتریان فعال",
            value: `${customers.active.toLocaleString("fa-IR")} مشتری (${customers.activePct.toLocaleString("fa-IR")}٪)`,
            change: String(customers.change),
            icon: "shoppingCart",
            gradient: "from-green-500 to-green-600",
        },
        {
            title: "پروژه‌های در حال انجام",
            value: `${projects.total.toLocaleString("fa-IR")} پروژه`,
            change: String(projects.change),
            icon: "package",
            gradient: "from-purple-500 to-purple-600",
        },
    ];

    return (
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {cards.map((card, index) => (
                <StatsCard key={card.title} {...card} index={index} />
            ))}
        </div>
    );
}

export function SalesSection() {
    const state = useSection(getSalesChartData, "sales section");

    if (state.status === "loading") return <ChartSkeleton />;
    if (state.status === "forbidden") return null;
    if (state.status === "error") return <SectionError title="نمودار فروش" />;

    return <SalesChart data={state.data} />;
}

export function SourcesSection() {
    const state = useSection(getCustomerSourcesData, "sources section");

    if (state.status === "loading") return <ChartSkeleton />;
    if (state.status === "forbidden") return null;
    if (state.status === "error") return <SectionError title="منابع مشتری" />;

    return <CategoryChart data={state.data} />;
}

export function CancelledSection() {
    const state = useSection(getCancelledTasksByDepartment, "cancelled section");

    if (state.status === "loading") return <ChartSkeleton />;
    if (state.status === "forbidden") return null;
    if (state.status === "error") {
        return <SectionError title="تسک‌های لغوشده" />;
    }

    return <VisitsChart data={state.data} />;
}

export function TopUsersSection() {
    const state = useSection(getTopUsers, "top users section");

    if (state.status === "loading") return <ChartSkeleton />;
    if (state.status === "forbidden") return null;
    if (state.status === "error") {
        return <SectionError title="برترین کارشناسان" />;
    }

    return <UsersCard data={state.data} />;
}
