// src/app/admin/Performance/page.tsx
"use client";
import { useState } from "react";
import { motion } from "framer-motion";
import {
    useEmployeeRanking,
    useDepartmentStats,
    useTaskStatusOverview,
    useSoldTrend,
    useDepartmentConversion,
    type TimeRange,
} from "@/hooks/useAnalytics";
import TimeRangeSelector from "@/components/admin/performance/TimeRangeSelector";
import KpiCards from "@/components/admin/performance/KpiCards";
import SoldTrendChart from "@/components/admin/performance/SoldTrendChart";
import TaskDonutChart from "@/components/admin/performance/TaskDonutChart";
import EmployeeRankingTable from "@/components/admin/performance/EmployeeRankingTable";
import DepartmentStatsTable from "@/components/admin/performance/DepartmentStatsTable";

export default function PerformancePage() {
    const [range, setRange] = useState<TimeRange>("monthly");

    const { data: employees, loading: empLoading } = useEmployeeRanking(range);
    const { data: deptStats, loading: deptLoading } = useDepartmentStats(range);
    const { data: overview, loading: overviewLoading } = useTaskStatusOverview(range);
    const { data: trend, loading: trendLoading } = useSoldTrend(range);
    const { data: conversion, loading: convLoading } = useDepartmentConversion(range);

    return (
        <div className="min-h-screen bg-zinc-950 text-zinc-100 p-6" dir="rtl">
            <motion.div
                initial={{ opacity: 0, y: -12 }}
                animate={{ opacity: 1, y: 0 }}
                className="max-w-7xl mx-auto space-y-6"
            >
                <div className="flex items-center justify-between flex-wrap gap-3">
                    <div>
                        <h1 className="text-xl font-bold text-zinc-100">عملکرد و آنالیتیکس</h1>
                        <p className="text-xs text-zinc-500 mt-0.5">آمار کارمندان، دپارتمان‌ها و فروش</p>
                    </div>
                    <TimeRangeSelector value={range} onChange={setRange} />
                </div>

                <KpiCards
                    overview={overview}
                    employees={employees}
                    loading={overviewLoading || empLoading}
                />

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                    <div className="lg:col-span-2">
                        <SoldTrendChart data={trend} loading={trendLoading} />
                    </div>
                    <TaskDonutChart data={overview} loading={overviewLoading} />
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                    <EmployeeRankingTable data={employees} loading={empLoading} />
                    <DepartmentStatsTable
                        stats={deptStats}
                        conversion={conversion}
                        loading={deptLoading || convLoading}
                    />
                </div>
            </motion.div>
        </div>
    );
}
