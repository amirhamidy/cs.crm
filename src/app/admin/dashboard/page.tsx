"use client";

import {
    CancelledSection,
    SalesSection,
    SourcesSection,
    StatsSection,
    TopUsersSection,
} from "@/components/dashboard/Dashboardsections";

export default function AdminDashboardPage() {
    return (
        <div className="space-y-5">
            <StatsSection />

            <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
                <SalesSection />
                <SourcesSection />
            </div>

            <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
                <CancelledSection />
                <TopUsersSection />
            </div>
        </div>
    );
}
