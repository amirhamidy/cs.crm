import { Suspense } from "react";
import {
    CancelledSection,
    ChartSkeleton,
    SalesSection,
    SourcesSection,
    StatsSection,
    StatsSkeleton,
    TopUsersSection,
} from "@/components/dashboard/Dashboardsections";

export default function AdminDashboardPage() {
    return (
        <div className="space-y-5">
            <Suspense fallback={<StatsSkeleton />}>
                <StatsSection />
            </Suspense>

            <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
                <Suspense fallback={<ChartSkeleton />}>
                    <SalesSection />
                </Suspense>

                <Suspense fallback={<ChartSkeleton />}>
                    <SourcesSection />
                </Suspense>
            </div>

            <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
                <Suspense fallback={<ChartSkeleton />}>
                    <CancelledSection />
                </Suspense>

                <Suspense fallback={<ChartSkeleton />}>
                    <TopUsersSection />
                </Suspense>
            </div>
        </div>
    );
}