import StatsCard from "@/components/charts/StatsCard";
import SalesChart from "@/components/charts/SalesChart";
import CategoryChart from "@/components/charts/CategoryChart";
import VisitsChart from "@/components/charts/VisitsChart";
import UsersCard from "@/components/charts/UsersCard";
import {
    getCancelledTasksByDepartment,
    getCustomerSourcesData,
    getCustomersStats,
    getEmployeesStats,
    getProjectsStats,
    getSalesChartData,
    getTopUsers,
} from "@/lib/server/dashboard";

export function StatsSkeleton() {
    return (
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {[0, 1, 2].map((i) => (
                <div
                    key={i}
                    className="animate-pulse rounded-2xl border border-black/5 bg-black/[0.02] p-4 dark:border-white/5 dark:bg-white/[0.02]"
                >
                    <div className="flex items-start justify-between gap-2">
                        <div className="flex-1 space-y-3">
                            <div className="h-3 w-24 rounded-full bg-black/10 dark:bg-white/10" />
                            <div className="h-5 w-32 rounded-full bg-black/10 dark:bg-white/10" />
                            <div className="h-5 w-20 rounded-full bg-black/10 dark:bg-white/10" />
                        </div>
                        <div className="h-10 w-10 rounded-xl bg-black/10 dark:bg-white/10" />
                    </div>
                </div>
            ))}
        </div>
    );
}

export function ChartSkeleton() {
    return (
        <div className="h-[300px] animate-pulse rounded-2xl border border-gray-100 bg-gray-50 dark:border-white/5 dark:bg-slate-900/40" />
    );
}

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

export async function StatsSection() {
    const [employees, customers, projects] = await Promise.allSettled([
        getEmployeesStats(),
        getCustomersStats(),
        getProjectsStats(),
    ]);

    const cards: React.ComponentProps<typeof StatsCard>[] = [];

    if (employees.status === "fulfilled") {
        cards.push({
            title: "تعداد کارمندان",
            value: `${employees.value.total.toLocaleString("fa-IR")} نفر`,
            change: String(employees.value.growth),
            icon: "users",
            gradient: "from-blue-500 to-blue-600",
        });
    }

    if (customers.status === "fulfilled") {
        cards.push({
            title: "مشتریان فعال",
            value: `${customers.value.activePct.toLocaleString("fa-IR")}٪`,
            change: String(
                customers.value.activePct - customers.value.potentialPct,
            ),
            icon: "shoppingCart",
            gradient: "from-green-500 to-green-600",
        });
    }

    if (projects.status === "fulfilled" && projects.value.hasProjects) {
        cards.push({
            title: "پروژه‌های در حال انجام",
            value: `${projects.value.total.toLocaleString("fa-IR")} پروژه`,
            change: String(projects.value.deptCount),
            icon: "package",
            gradient: "from-purple-500 to-purple-600",
        });
    }

    if (cards.length === 0) {
        return <SectionError title="آمار کلی" className="h-28" />;
    }

    return (
        <div
            className={`grid gap-3 ${cards.length >= 3
                    ? "grid-cols-1 sm:grid-cols-2 lg:grid-cols-3"
                    : "grid-cols-1 sm:grid-cols-2"
                }`}
        >
            {cards.map((card, index) => (
                <StatsCard key={card.title} {...card} index={index} />
            ))}
        </div>
    );
}

export async function SalesSection() {
    try {
        return <SalesChart data={await getSalesChartData()} />;
    } catch {
        return <SectionError title="نمودار فروش" />;
    }
}

export async function SourcesSection() {
    try {
        return <CategoryChart data={await getCustomerSourcesData()} />;
    } catch {
        return <SectionError title="منابع مشتری" />;
    }
}

export async function CancelledSection() {
    try {
        return <VisitsChart data={await getCancelledTasksByDepartment()} />;
    } catch {
        return <SectionError title="تسک‌های لغوشده" />;
    }
}

export async function TopUsersSection() {
    try {
        return <UsersCard data={await getTopUsers()} />;
    } catch {
        return <SectionError title="برترین کارشناسان" />;
    }
}